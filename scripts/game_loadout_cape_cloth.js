/* Loadout cape cloth: position-based dynamics on the cape bone grid (CapeC<col>_<row>, built by
 * scripts/characters/loadout/blender_build_loadout_cape.py and described by assets/loadout/loadout_cape_rig.json).
 * Each chain is a column of particles; row 0 is pinned to where the rigidly-attached cape would be this frame
 * (parented to mixamorigSpine2), the rest swing under gravity, drag and the character's motion, are tied to their
 * neighbours so the panel behaves like one short cape, are pushed out of body capsules, and may never drift further
 * than a per-row limit from the rigid pose. The result only rotates cape bones; it never moves the character, its
 * capsule or any mixamorig bone (movement ownership stays with the existing movement owner). */
(()=>{
 'use strict';
 const V=THREE.Vector3,Q=THREE.Quaternion;
 const DEFAULTS={substep:1/120,maxSubsteps:6,iterations:4,gravity:9.81,drag:2.4,margin:0.012,
  horizontalStiffness:0.5,shearStiffness:0.2,minHorizontal:0.5,maxHorizontal:1.4,minBend:0.55,
  swingOfChain:[0,0.32,0.55,0.75,0.9],wind:new V(0,0,0),windGust:0.35,
  backstopAxis:['mixamorigHips','mixamorigNeck'],backstopOfHeight:0.06,resetDistance:2};

 function create(model,rig,opts={}){
  const o=Object.assign({},DEFAULTS,opts),H=o.height;
  if(!(H>0))throw Error('LoadoutCapeCloth needs the character height in world units');
  const byName=n=>{const b=model.getObjectByName(n);if(!b)throw Error('Missing bone '+n);return b;};
  const cols=rig.chains.map(chain=>chain.map(byName)),C=cols.length,R=rig.rows;
  const restPos=cols.map(ch=>ch.map(b=>b.position.clone())),restQuat=cols.map(ch=>ch.map(b=>b.quaternion.clone()));
  const restDir=cols.map(ch=>ch.map((b,r)=>r+1<R?ch[r+1].position.clone().normalize():null));
  const capsules=rig.colliders.map(c=>({a:byName(c.from),b:byName(c.to),r:c.radiusOfHeight*H}));
  const P=cols.map(ch=>ch.map(()=>new V())),prev=cols.map(ch=>ch.map(()=>new V())),T=cols.map(ch=>ch.map(()=>new V()));
  let restV=null,restH=null,restS=null,restB=null,chainLen=null,maxDist=null;
  const tmp=new V(),tmp2=new V(),cur=new V(),qa=new Q(),qb=new Q(),qp=new Q();
  const capA=capsules.map(()=>new V()),capB=capsules.map(()=>new V());
  // Backstop: every particle keeps to its own side of the torso axis (like a cloth backstop), so a fast swing
  // cannot carry the cape through the hips or legs and leave it wrapped around the front.
  const bsA=byName(o.backstopAxis[0]),bsB=byName(o.backstopAxis[1]),bsFrame=byName(rig.rootParent);
  const bsPa=new V(),bsPb=new V(),bsQ=new Q(),bsQi=new Q(),bsN=new V(),bsC=new V();let bsLocal=null,bsMin=null;
  function axisPoint(p,out){tmp.subVectors(bsPb,bsPa);const l2=tmp.lengthSq();let t=l2>0?tmp2.subVectors(p,bsPa).dot(tmp)/l2:0;t=Math.max(0,Math.min(1,t));return out.copy(bsPa).addScaledVector(tmp,t);}
  function readBackstop(){bsA.getWorldPosition(bsPa);bsB.getWorldPosition(bsPb);bsFrame.getWorldQuaternion(bsQ);bsQi.copy(bsQ).invert();}
  let lastH=0,time=0,ready=false,lastCost=0,frames=0,costSum=0,resets=0;const lastPin=new V();
  const stats={penetration:0,maxStretch:1,maxAimError:0,nan:false,clampedRows:0};

  function resetBones(){for(let c=0;c<C;c++)for(let r=0;r<R;r++){cols[c][r].position.copy(restPos[c][r]);cols[c][r].quaternion.copy(restQuat[c][r]);}}
  function readTargets(){
   // Cape bones at their rest local transforms: their world positions are the rigid (no-cloth) cape this frame.
   resetBones();
   for(let c=0;c<C;c++){cols[c][0].updateMatrixWorld(true);for(let r=0;r<R;r++)cols[c][r].getWorldPosition(T[c][r]);}
  }
  function measureRest(){
   restV=[];restH=[];restS=[];restB=[];chainLen=[];maxDist=[];
   for(let c=0;c<C;c++){
    restV.push([]);restB.push([]);let len=0;
    for(let r=0;r+1<R;r++){const d=T[c][r].distanceTo(T[c][r+1]);restV[c].push(d);len+=d;}
    for(let r=0;r+2<R;r++)restB[c].push(T[c][r].distanceTo(T[c][r+2]));
    chainLen.push(len);maxDist.push(o.swingOfChain.map(f=>f*len));
    if(c+1<C){restH.push(T[c].map((p,r)=>p.distanceTo(T[c+1][r])));restS.push(T[c].map((p,r)=>r+1<R?[p.distanceTo(T[c+1][r+1]),T[c+1][r].distanceTo(T[c][r+1])]:null));}
   }
   readBackstop();bsLocal=[];bsMin=[];
   for(let c=0;c<C;c++){bsLocal.push([]);bsMin.push([]);for(let r=0;r<R;r++){
    const off=new V().subVectors(T[c][r],axisPoint(T[c][r],bsC)),d=off.length();
    bsLocal[c].push(off.normalize().applyQuaternion(bsQi));bsMin[c].push(Math.min(o.backstopOfHeight*H,0.9*d));
   }}
  }
  function backstop(c,r,p){
   bsN.copy(bsLocal[c][r]).applyQuaternion(bsQ);axisPoint(p,bsC);
   const d=tmp.subVectors(p,bsC).dot(bsN),m=bsMin[c][r];if(d<m)p.addScaledVector(bsN,m-d);
  }
  function reset(){
   model.updateWorldMatrix(true,true);readTargets();if(!restV)measureRest();
   for(let c=0;c<C;c++)for(let r=0;r<R;r++){P[c][r].copy(T[c][r]);prev[c][r].copy(T[c][r]);}
   lastH=0;ready=true;lastPin.copy(T[0][0]);
  }
  function solveDistance(a,b,ia,ib,rest,stiff,minR,maxR){
   tmp.subVectors(b,a);const d=tmp.length();if(d<1e-9)return;
   const target=Math.min(Math.max(d,rest*minR),rest*maxR);if(target===d)return;
   const w=ia+ib;if(!w)return;const k=(d-target)/d*stiff/w;
   a.addScaledVector(tmp,k*ia);b.addScaledVector(tmp,-k*ib);
  }
  function depth(p){
   let worst=0;
   for(let i=0;i<capsules.length;i++){
    const a=capA[i],b=capB[i];tmp.subVectors(b,a);const len2=tmp.lengthSq();let t=len2>0?tmp2.subVectors(p,a).dot(tmp)/len2:0;t=Math.max(0,Math.min(1,t));
    tmp2.copy(a).addScaledVector(tmp,t);worst=Math.max(worst,capsules[i].r-tmp2.distanceTo(p));
   }
   return worst;
  }
  function collide(p){
   let worst=0;
   for(let i=0;i<capsules.length;i++){
    const a=capA[i],b=capB[i],r=capsules[i].r+o.margin;
    tmp.subVectors(b,a);const len2=tmp.lengthSq();let t=len2>0?tmp2.subVectors(p,a).dot(tmp)/len2:0;t=Math.max(0,Math.min(1,t));
    tmp2.copy(a).addScaledVector(tmp,t);tmp.subVectors(p,tmp2);const d=tmp.length();
    if(d<r){if(d>1e-6)p.addScaledVector(tmp,(r-d)/d);worst=Math.max(worst,r-d);}
   }
   return worst;
  }
  function step(dt){
   time+=dt;
   // Verlet with a varying step: scale the carried velocity by the ratio of this step to the last.
   const drag=Math.exp(-o.drag*dt)*(lastH>0?dt/lastH:1),g=o.gravity*dt*dt;lastH=dt;
   const gust=1+o.windGust*Math.sin(time*1.7)*Math.sin(time*0.63+1.3);
   for(let c=0;c<C;c++){
    P[c][0].copy(T[c][0]);prev[c][0].copy(T[c][0]);
    for(let r=1;r<R;r++){
     const p=P[c][r],q=prev[c][r];
     tmp.subVectors(p,q).multiplyScalar(drag);q.copy(p);
     p.add(tmp);p.y-=g;p.addScaledVector(o.wind,gust*dt*dt*r/(R-1));
    }
   }
   let pen=0,clamped=0;
   // Soft links and the body first, the chains' own lengths last, so each pass ends with every chain at its true length.
   for(let it=0;it<o.iterations;it++){
    for(let c=0;c+1<C;c++)for(let r=1;r<R;r++){
     solveDistance(P[c][r],P[c+1][r],1,1,restH[c][r],o.horizontalStiffness,o.minHorizontal,o.maxHorizontal);
     if(r+1<R){const s=restS[c][r];solveDistance(P[c][r],P[c+1][r+1],1,1,s[0],o.shearStiffness,o.minHorizontal,o.maxHorizontal);solveDistance(P[c+1][r],P[c][r+1],1,1,s[1],o.shearStiffness,o.minHorizontal,o.maxHorizontal);}
    }
    for(let c=0;c<C;c++)for(let r=1;r<R;r++){
     const p=P[c][r];collide(p);backstop(c,r,p);
     const m=maxDist[c][r];tmp.subVectors(p,T[c][r]);const d=tmp.length();
     if(d>m){p.copy(T[c][r]).addScaledVector(tmp,m/d);if(it+1===o.iterations)clamped++;}
    }
    for(let c=0;c<C;c++)for(let r=0;r+2<R;r++)solveDistance(P[c][r],P[c][r+2],r?1:0,1,restB[c][r],1,o.minBend,1e9);
    for(let c=0;c<C;c++)for(let r=0;r+1<R;r++)solveDistance(P[c][r],P[c][r+1],r?1:0,1,restV[c][r],1,1,1);
   }
   // Follow-the-leader: walk each chain from the collar and put every joint exactly one bone length below the last,
   // moving its previous position by the same amount so the correction adds no velocity. The bones then hit every particle.
   // Twice, ending on exact lengths: any push out of the body is then re-spread along the chain.
   for(let round=0;round<2;round++){
    if(round)for(let c=0;c<C;c++)for(let r=1;r<R;r++){collide(P[c][r]);backstop(c,r,P[c][r]);}
    for(let c=0;c<C;c++)for(let r=1;r<R;r++){
     const a=P[c][r-1],p=P[c][r];tmp.subVectors(p,a);const d=tmp.length();if(d<1e-9)continue;
     tmp2.copy(a).addScaledVector(tmp,restV[c][r-1]/d).sub(p);p.add(tmp2);prev[c][r].add(tmp2);
    }
   }
   // Last word to the body: a final push out costs at most a few mm of aim, never a point left inside.
   for(let c=0;c<C;c++)for(let r=1;r<R;r++){collide(P[c][r]);backstop(c,r,P[c][r]);}
   // Penetration that remains after the solve (what the next frame starts from).
   for(let c=0;c<C;c++)for(let r=1;r<R;r++)pen=Math.max(pen,depth(P[c][r]));
   stats.penetration=pen;stats.clampedRows=clamped;
  }
  function orient(){
   let maxStretch=1,maxAim=0;
   for(let c=0;c<C;c++){
    const ch=cols[c];
    ch[0].updateMatrixWorld(true);
    for(let r=0;r+1<R;r++){
     // Each bone's world matrix is current here: the parent chain was refreshed right after its rotation.
     const b=ch[r];b.getWorldPosition(tmp2);
     const want=tmp.subVectors(P[c][r+1],tmp2);const wl=want.length();
     if(wl<1e-6)continue;
     maxStretch=Math.max(maxStretch,wl/restV[c][r]);maxAim=Math.max(maxAim,Math.abs(wl-restV[c][r]));
     want.multiplyScalar(1/wl);
     b.getWorldQuaternion(qa);
     cur.copy(restDir[c][r]).applyQuaternion(qa);
     qb.setFromUnitVectors(cur,want).multiply(qa);
     b.parent.getWorldQuaternion(qp);
     b.quaternion.copy(qp.invert().multiply(qb));
     b.updateMatrixWorld(true);
    }
   }
   stats.maxStretch=maxStretch;stats.maxAimError=maxAim;
  }
  function update(dt){
   const t0=performance.now();
   if(!ready)reset();
   // Parents too: a moving root may not have been refreshed since it moved this frame.
   model.updateWorldMatrix(true,true);readTargets();readBackstop();
   // A respawn or teleport moves the collar metres in one frame: start the cloth again from the rigid cape.
   if(T[0][0].distanceTo(lastPin)>o.resetDistance){for(let c=0;c<C;c++)for(let r=0;r<R;r++){P[c][r].copy(T[c][r]);prev[c][r].copy(T[c][r]);}lastH=0;resets++;}
   lastPin.copy(T[0][0]);
   for(let i=0;i<capsules.length;i++){capsules[i].a.getWorldPosition(capA[i]);capsules[i].b.getWorldPosition(capB[i]);}
   // Step every frame (equal substeps no longer than o.substep), so the cape never lags its pinned collar by a frame.
   const span=Math.min(dt,o.substep*o.maxSubsteps);
   if(span>0){const n=Math.max(1,Math.ceil(span/o.substep-1e-6));for(let i=0;i<n;i++)step(span/n);}
   let nan=false;for(let c=0;c<C&&!nan;c++)for(let r=0;r<R;r++)if(!Number.isFinite(P[c][r].x+P[c][r].y+P[c][r].z)){nan=true;break;}
   stats.nan=nan;
   if(nan){reset();resetBones();}else orient();
   lastCost=performance.now()-t0;frames++;costSum+=lastCost;
  }
  function state(){
   const disp=[];for(let c=0;c<C;c++){const row=[];for(let r=0;r<R;r++)row.push(+P[c][r].distanceTo(T[c][r]).toFixed(4));disp.push(row);}
   return{columns:C,rows:R,penetration:+stats.penetration.toFixed(4),maxStretch:+stats.maxStretch.toFixed(3),maxAimErrorM:+stats.maxAimError.toFixed(4),nan:stats.nan,
    clampedRows:stats.clampedRows,resets,lastCostMs:+lastCost.toFixed(3),meanCostMs:+(costSum/Math.max(1,frames)).toFixed(3),frames,displacement:disp};
  }
  // World-space hem offset from the rigid cape, for tests: positions of the last row and their rigid targets.
  function hem(){return cols.map((ch,c)=>({p:P[c][R-1].toArray(),t:T[c][R-1].toArray()}));}
  function row(r){return cols.map((ch,c)=>({p:P[c][r].toArray(),t:T[c][r].toArray()}));}
  return{update,reset,state,hem,row,options:o,capsules:()=>capsules.map((c,i)=>({a:capA[i].toArray(),b:capB[i].toArray(),r:c.r}))};
 }
 window.LoadoutCapeCloth={create};
})();
