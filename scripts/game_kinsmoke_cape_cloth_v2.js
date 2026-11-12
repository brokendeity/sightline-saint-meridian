/* Kinsmoke cape cloth v2 (v1, game_kinsmoke_cape_cloth.js, is unchanged: the KINSMOKE build uses it). For the procedural
 * v2 cape (blender_build_kinsmoke_cape_v2.py: 15 chains x 8 joints laid ON the sheet's grid). Changes, all aimed at the
 * cape moving as ONE connected sheet instead of rolling into tubes:
 * - swingOfChain may come from the rig (rig.cloth.swingOfChain, one entry per row); defaults are resampled to the rows;
 * - stiffer, less compressible horizontal links (min 0.85 of rest) and shear, plus a cross-column bend link (c to c+2,
 *   min 0.9 of rest, stiff): neighbouring chains cannot fold onto each other (a crease stays under ~60 deg), so the sheet
 *   cannot curl into a roll or tube;
 * - a stronger along-chain bend limit (minBend 0.8): a chain cannot fold back on itself;
 * - airflow spread and lift while moving: wings pushed out toward their own side and slightly up (zero standing), so
 *   the wide cape fans out behind him as one sheet instead of collapsing into a cone and rolling;
 * - flutter: a travelling ripple (vertical acceleration wave along rows and columns) that grows with motion and down the
 *   cape, so the streaming sheet ripples like a cape in the wind; zero when standing (base form unchanged).
 * Everything else (rest pull by motion, gravity by motion, drag, colliders, backstop, follow-the-leader, NaN reset,
 * bones only) is v1's. */
/* Kinsmoke cape cloth: a copy of game_loadout_cape_cloth_v2.js (unchanged) for Kinsmoke's wide, Spawn-like cape
 * (bones CapeC<col>_<row>, 15 x 6, built by scripts/characters/kinsmoke/blender_build_kinsmoke_cape.py and described by
 * assets/characters/kinsmoke/kinsmoke_cape_rig.json). Additions, all opt-in through update(dt,{speed}):
 * - REST PULL: every particle is pulled toward the rigid (modelled) cape with a strength that depends on a smoothed
 *   motion factor m (0 standing, 1 at runSpeed). Standing: gravity fades out and the pull is strong, so the cape settles
 *   into its exact modelled base form. Moving: gravity on, a weak pull keeps the silhouette, the rest is lag and billow.
 * - heavier, looser defaults for a big cape; leg-only penetration in state() for tests.
 * Like the original it only rotates cape bones; it never moves the character, its capsule or any mixamorig bone. */
/* v2 of game_loadout_cape_cloth.js (v1 is unchanged; earlier evidence pins its hash). Only change: the final pass
 * alternates backstop and body push and ends on the body push, so curled poses such as rolls leave no point inside him. */
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
 const DEFAULTS={substep:1/120,maxSubsteps:6,iterations:8,gravity:9.81,drag:1.6,margin:0.012,
  horizontalStiffness:0.8,shearStiffness:0.4,minHorizontal:0.85,maxHorizontal:1.25,minBend:0.8,crossBendMin:0.9,crossBendStiffness:0.9,spanMin:0.8,spanStiffness:0.85,flutter:10,flutterFreq:8,spread:16,lift:3,
  swingOfChain:[0,0.18,0.36,0.52,0.66,0.78],wind:new V(0,0,0),windGust:0.25,
  restPullIdle:14,restPullMove:0.15,dragMove:2.4,runSpeed:6,motionRise:6,motionFall:2.5,
  backstopAxis:['mixamorigHips','mixamorigNeck'],backstopOfHeight:0.06,resetDistance:2};

 function create(model,rig,opts={}){
  const o=Object.assign({},DEFAULTS,rig.cloth||{},opts),H=o.height;
  if(o.swingOfChain.length!==rig.rows){const s=o.swingOfChain,n=rig.rows;o.swingOfChain=Array.from({length:n},(_,r)=>{const x=r/(n-1)*(s.length-1),i=Math.min(s.length-2,Math.floor(x));return s[i]+(s[i+1]-s[i])*(x-i);});}
  if(!(H>0))throw Error('KinsmokeCapeCloth needs the character height in world units');
  const byName=n=>{const b=model.getObjectByName(n);if(!b)throw Error('Missing bone '+n);return b;};
  const cols=rig.chains.map(chain=>chain.map(byName)),C=cols.length,R=rig.rows;
  const restPos=cols.map(ch=>ch.map(b=>b.position.clone())),restQuat=cols.map(ch=>ch.map(b=>b.quaternion.clone()));
  const restDir=cols.map(ch=>ch.map((b,r)=>r+1<R?ch[r+1].position.clone().normalize():null));
  const capsules=rig.colliders.map(c=>({a:byName(c.from),b:byName(c.to),r:c.radiusOfHeight*H}));
  const P=cols.map(ch=>ch.map(()=>new V())),prev=cols.map(ch=>ch.map(()=>new V())),T=cols.map(ch=>ch.map(()=>new V()));
  let restV=null,restH=null,restH2=null,restH4=null,restS=null,restB=null,chainLen=null,maxDist=null;
  const lat=new V(),tmp=new V(),tmp2=new V(),cur=new V(),qa=new Q(),qb=new Q(),qp=new Q();
  const capA=capsules.map(()=>new V()),capB=capsules.map(()=>new V());
  // Backstop: every particle keeps to its own side of the torso axis (like a cloth backstop), so a fast swing
  // cannot carry the cape through the hips or legs and leave it wrapped around the front.
  const bsA=byName(o.backstopAxis[0]),bsB=byName(o.backstopAxis[1]),bsFrame=byName(rig.rootParent);
  const bsPa=new V(),bsPb=new V(),bsQ=new Q(),bsQi=new Q(),bsN=new V(),bsC=new V();let bsLocal=null,bsMin=null;
  function axisPoint(p,out){tmp.subVectors(bsPb,bsPa);const l2=tmp.lengthSq();let t=l2>0?tmp2.subVectors(p,bsPa).dot(tmp)/l2:0;t=Math.max(0,Math.min(1,t));return out.copy(bsPa).addScaledVector(tmp,t);}
  function readBackstop(){bsA.getWorldPosition(bsPa);bsB.getWorldPosition(bsPb);bsFrame.getWorldQuaternion(bsQ);bsQi.copy(bsQ).invert();}
  let lastH=0,time=0,ready=false,lastCost=0,frames=0,costSum=0,resets=0,motion=0;const lastPin=new V();
  const legCaps=capsules.map((c,i)=>/Leg|Foot/.test(rig.colliders[i].from)?i:-1).filter(i=>i>=0);
  const stats={penetration:0,maxStretch:1,maxAimError:0,nan:false,clampedRows:0};

  function resetBones(){for(let c=0;c<C;c++)for(let r=0;r<R;r++){cols[c][r].position.copy(restPos[c][r]);cols[c][r].quaternion.copy(restQuat[c][r]);}}
  function readTargets(){
   // Cape bones at their rest local transforms: their world positions are the rigid (no-cloth) cape this frame.
   resetBones();
   for(let c=0;c<C;c++){cols[c][0].updateMatrixWorld(true);for(let r=0;r<R;r++)cols[c][r].getWorldPosition(T[c][r]);}
  }
  function measureRest(){
   restV=[];restH=[];restH2=[];restH4=[];restS=[];restB=[];chainLen=[];maxDist=[];
   for(let c=0;c<C;c++){
    restV.push([]);restB.push([]);let len=0;
    for(let r=0;r+1<R;r++){const d=T[c][r].distanceTo(T[c][r+1]);restV[c].push(d);len+=d;}
    for(let r=0;r+2<R;r++)restB[c].push(T[c][r].distanceTo(T[c][r+2]));
    chainLen.push(len);maxDist.push(o.swingOfChain.map(f=>f*len));
    if(c+2<C)restH2.push(T[c].map((p,r)=>p.distanceTo(T[c+2][r])));
    if(c+4<C)restH4.push(T[c].map((p,r)=>p.distanceTo(T[c+4][r])));
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
  function depthOf(p,idx){
   let worst=0;
   for(const i of idx){const a=capA[i],b=capB[i];tmp.subVectors(b,a);const len2=tmp.lengthSq();let t=len2>0?tmp2.subVectors(p,a).dot(tmp)/len2:0;t=Math.max(0,Math.min(1,t));
    tmp2.copy(a).addScaledVector(tmp,t);worst=Math.max(worst,capsules[i].r-tmp2.distanceTo(p));}
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
   const drag=Math.exp(-(o.drag+((o.dragMove??o.drag)-o.drag)*motion)*dt)*(lastH>0?dt/lastH:1),g=o.gravity*dt*dt*motion;lastH=dt;
   const pull=1-Math.exp(-(o.restPullIdle+(o.restPullMove-o.restPullIdle)*motion)*dt);
   const gust=1+o.windGust*Math.sin(time*1.7)*Math.sin(time*0.63+1.3);
   // Airflow spread: the collar's left-right axis (outer chain to outer chain), horizontal. Each chain is pushed toward its
   // own side in proportion to how far out it is, so the wings fan out behind him instead of wrapping into a cone or tube.
   const spreadOn=motion>0.01&&o.spread>0;if(spreadOn){lat.subVectors(T[C-1][0],T[0][0]);lat.y=0;if(lat.lengthSq()>1e-9)lat.normalize();}
   for(let c=0;c<C;c++){
    P[c][0].copy(T[c][0]);prev[c][0].copy(T[c][0]);
    for(let r=1;r<R;r++){
     const p=P[c][r],q=prev[c][r];
     tmp.subVectors(p,q).multiplyScalar(drag);q.copy(p);
     p.add(tmp);p.y-=g;p.addScaledVector(o.wind,gust*dt*dt*r/(R-1)*motion);
     if(motion>0.01)p.y+=o.flutter*motion*(r/(R-1))*Math.sin(time*o.flutterFreq+c*0.75-r*1.1)*dt*dt;
     if(spreadOn){const k=motion*(r/(R-1))*dt*dt;p.addScaledVector(lat,o.spread*k*(c-(C-1)/2)/((C-1)/2));p.y+=o.lift*k;}
     p.lerp(T[c][r],pull);
    }
   }
   let pen=0,clamped=0;
   // Soft links and the body first, the chains' own lengths last, so each pass ends with every chain at its true length.
   for(let it=0;it<o.iterations;it++){
    for(let c=0;c+2<C;c++)for(let r=1;r<R;r++)solveDistance(P[c][r],P[c+2][r],1,1,restH2[c][r],o.crossBendStiffness,o.crossBendMin,1e9);
    // Span link over four columns: the sheet cannot close back on itself (a roll or tube) across that width.
    for(let c=0;c+4<C;c++)for(let r=1;r<R;r++)solveDistance(P[c][r],P[c+4][r],1,1,restH4[c][r],o.spanStiffness,o.spanMin,1e9);
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
   // Last word to the body: a final push out costs at most a few mm of aim, never a point left inside. In curled poses
   // (rolls) the backstop plane can cut through a limb, so alternate a few times and always end on the body push.
   for(let c=0;c<C;c++)for(let r=1;r<R;r++){const p=P[c][r];for(let k=0;k<3;k++){backstop(c,r,p);if(!collide(p))break;}collide(p);}
   // Penetration that remains after the solve (what the next frame starts from).
   for(let c=0;c<C;c++)for(let r=1;r<R;r++)pen=Math.max(pen,depth(P[c][r]));
   let legPen=0;for(let c=0;c<C;c++)for(let r=1;r<R;r++)legPen=Math.max(legPen,depthOf(P[c][r],legCaps));
   stats.penetration=pen;stats.legPenetration=legPen;stats.clampedRows=clamped;
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
  function update(dt,ctx={}){
   const t0=performance.now();
   // Motion factor: 0 standing still, 1 at runSpeed; rises fast when he starts moving, settles more slowly.
   const want=Math.max(0,Math.min(1,(ctx.speed||0)/o.runSpeed));if(dt>0)motion+=(want-motion)*(1-Math.exp(-(want>motion?o.motionRise:o.motionFall)*dt));
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
   // Sheet integrity (v2): the tightest neighbour-column gap and chain fold, as fractions of rest. A roll or tube shows up as
   // neighbouring columns collapsing onto each other (low colRatio) or a chain folding back on itself (low foldRatio).
   if(!nan&&restH){let cr=Infinity,fr=Infinity;for(let c=0;c+1<C;c++)for(let r=1;r<R;r++)cr=Math.min(cr,P[c][r].distanceTo(P[c+1][r])/Math.max(1e-6,restH[c][r]));
    for(let c=0;c<C;c++)for(let r=0;r+2<R;r++)fr=Math.min(fr,P[c][r].distanceTo(P[c][r+2])/Math.max(1e-6,restB[c][r]));
    // Curl: the sharpest turn between successive segments across the columns (a roll or tube) and along a chain.
    const a1=new V(),a2=new V();let ct=0,ht=0;
    for(let r=1;r<R;r++)for(let c=1;c+1<C;c++){a1.subVectors(P[c][r],P[c-1][r]);a2.subVectors(P[c+1][r],P[c][r]);const l=a1.length()*a2.length();if(l>1e-9){const g=Math.acos(Math.max(-1,Math.min(1,a1.dot(a2)/l)));if(g>ct){ct=g;stats.crossTurnAt=[c,r];}}}
    for(let c=0;c<C;c++)for(let r=1;r+1<R;r++){a1.subVectors(P[c][r],P[c][r-1]);a2.subVectors(P[c][r+1],P[c][r]);const l=a1.length()*a2.length();if(l>1e-9){const g=Math.acos(Math.max(-1,Math.min(1,a1.dot(a2)/l)));if(g>ht){ht=g;stats.chainTurnAt=[c,r];}}}
    // Roll / tube: segment (c-2 -> c-1) against segment (c+1 -> c+2). A pleat zig-zags (the two stay roughly parallel); a
    // roll curls one way until the sheet faces back on itself (the two point opposite ways, ~180 deg).
    let rl=0;for(let r=1;r<R;r++)for(let c=2;c+2<C;c++){a1.subVectors(P[c-1][r],P[c-2][r]);a2.subVectors(P[c+2][r],P[c+1][r]);const l=a1.length()*a2.length();if(l>1e-9){const g=Math.acos(Math.max(-1,Math.min(1,a1.dot(a2)/l)));if(g>rl){rl=g;stats.rollAt=[c,r];}}}
    stats.rollDeg=rl*180/Math.PI;if(!stats.restRoll&&motion<0.01)stats.restRoll=stats.rollDeg;
    stats.crossTurnDeg=ct*180/Math.PI;stats.chainTurnDeg=ht*180/Math.PI;
    if(!stats.restTurn&&motion<0.01){stats.restTurn={cross:stats.crossTurnDeg,chain:stats.chainTurnDeg};}
    stats.colRatio=cr;stats.foldRatio=fr;stats.minColRatio=Math.min(stats.minColRatio??Infinity,cr);stats.minFoldRatio=Math.min(stats.minFoldRatio??Infinity,fr);}
   if(nan){reset();resetBones();}else orient();
   lastCost=performance.now()-t0;frames++;costSum+=lastCost;
  }
  function state(){
   const disp=[];for(let c=0;c<C;c++){const row=[];for(let r=0;r<R;r++)row.push(+P[c][r].distanceTo(T[c][r]).toFixed(4));disp.push(row);}
   let maxDisp=0,sumDisp=0,n=0;for(const row of disp)for(let r=1;r<row.length;r++){maxDisp=Math.max(maxDisp,row[r]);sumDisp+=row[r];n++;}
   return{columns:C,rows:R,motion:+motion.toFixed(3),maxDisplacementM:+maxDisp.toFixed(4),meanDisplacementM:+(sumDisp/Math.max(1,n)).toFixed(4),legPenetration:+(stats.legPenetration||0).toFixed(4),penetration:+stats.penetration.toFixed(4),maxStretch:+stats.maxStretch.toFixed(3),maxAimErrorM:+stats.maxAimError.toFixed(4),nan:stats.nan,
    clampedRows:stats.clampedRows,colRatio:+(stats.colRatio??1).toFixed(3),foldRatio:+(stats.foldRatio??1).toFixed(3),minColRatio:+(stats.minColRatio??1).toFixed(3),crossTurnDeg:+(stats.crossTurnDeg??0).toFixed(1),crossTurnAt:stats.crossTurnAt,rollDeg:+(stats.rollDeg??0).toFixed(1),rollAt:stats.rollAt,restRollDeg:stats.restRoll!=null?+stats.restRoll.toFixed(1):null,chainTurnAt:stats.chainTurnAt,chainTurnDeg:+(stats.chainTurnDeg??0).toFixed(1),restTurnDeg:stats.restTurn?{cross:+stats.restTurn.cross.toFixed(1),chain:+stats.restTurn.chain.toFixed(1)}:null,minFoldRatio:+(stats.minFoldRatio??1).toFixed(3),resets,lastCostMs:+lastCost.toFixed(3),meanCostMs:+(costSum/Math.max(1,frames)).toFixed(3),frames,displacement:disp};
  }
  // World-space hem offset from the rigid cape, for tests: positions of the last row and their rigid targets.
  function hem(){return cols.map((ch,c)=>({p:P[c][R-1].toArray(),t:T[c][R-1].toArray()}));}
  function row(r){return cols.map((ch,c)=>({p:P[c][r].toArray(),t:T[c][r].toArray()}));}
  return{update,reset,state,hem,row,options:o,capsules:()=>capsules.map((c,i)=>({a:capA[i].toArray(),b:capB[i].toArray(),r:c.r}))};
 }
 window.KinsmokeCapeCloth={create};
})();
