/* v11 cloth (v10 unchanged; the v14 build keeps using it): v10's flow, tuned for the RE-RIGGED cape (13 x 12 chains,
 * kinsmoke_cape_rig_v8.json). On the finer grid v10's loosened limits let the sheet roll up and crumple at a sprint, so
 * while moving: shape matching x0.35 (v10: x0.1), chain bend min 0.88 (0.82), cross-column bend min 0.92 (0.85), span
 * min 0.88 (0.8). Airflow, gusts and the x3 swing are v10's. */
/* v10 cloth (v9 unchanged; its build keeps using it): FLOW. The user (2026-11-11, on v13): "its not flowy enough yet",
 * pointing at Ghost of Tsushima. Its GDC talk ("Blowing from the West") describes GPU spring-mass cloth pushed by ONE
 * shared wind field, with loose anchor distances instead of stiff links so it can "flap and move". v10 adds, all
 * scaled by the motion factor (standing: unchanged, the sculpt's exact base form):
 * - AIRFLOW: apparent wind = world wind - body velocity; every particle is pushed along its surface normal by the
 *   wind's normal component (sail pressure), times a GUST field that travels through world space with the airflow,
 *   so ripples roll from the collar to the hem instead of the whole sheet moving as one;
 * - WIDER SWING WHILE MOVING: each particle's maximum distance from the sculpted cape (Tsushima's painted max distance)
 *   x swingMove at a run, so the sheet can stream back behind him instead of staying bunched at its sculpted place;
 * - LOOSER WHILE MOVING: chain bend min 0.93 -> bendMinMove, shape matching x shapeMatchMove, cross-column bend min ->
 *   crossBendMinMove, so the bone grid can carry a real wave. The folds are mesh detail skinned to the chains, so they
 *   ride along and the cape never goes flat. */
/* v9 cloth (v8 unchanged otherwise; its builds keep using v8): MOTION WHILE RUNNING. The user (2026-11-11): "there should
 * be motion into the cape once he starts running, but the waves form in the cape should still be there, do not make the
 * cape flat". Measured on v8 at a sprint (real input, 3 s): the cape lifted, then held one frozen shape (hem/mid particles
 * moved 0.15 m RMS in his own frame). v9 only retunes the running forces, all of which are zero when he stands:
 * relative damping 14 -> 1.2 (stride momentum now swings the sheet), travelling wave 4 -> 90, flutter 5 -> 40,
 * billow 5 -> 14, hem turbulence 0 -> 30, smoothed frame follows faster while moving (2.5 -> 8). Shape matching, the
 * bend/span limits and the sculpt (the folds live in the mesh, skinned to the 9 x 7 chains) are unchanged, so the waves
 * of the sculpt ride along. Same in-game test: 0.27 m RMS (+70%), fold ratio >= 0.78, no body penetration. */
/* v8 cloth (v7 otherwise unchanged): arm collisions lift the cape OVER the arm. v7 pushed particles straight out from an
 * arm's axis, so a particle between an arm and his back was pushed toward the body, under the arm (Mvm_Dash swings the
 * arms far behind him) and the mesh had to be yanked back over the arm in the shader, stretching triangles up to 50 cm.
 * Now a particle inside an arm/hand capsule, or between it and the torso axis (Hips-Neck) within the arm's width and up
 * to armShadow deep, goes to the arm's OUTER side; the sheet then moves smoothly and the shader push in
 * game_v02_kinsmoke_hero_v10.js only cleans up the last centimetres. */
/* v7 cloth (v6 unchanged otherwise): ARM CLEARANCE. The user (2026-11-10): "when he's running his arms are clipping
 * through the cape". The cape mesh is skinned to only 9 x 7 particles, so a mesh point between two particles could sit
 * inside an arm even when no particle did (measured on cape v7 while running: ~180 of 35k sampled cape points inside
 * the arms per frame, up to 7 cm deep, mostly the centre-back panel as the arms swing back past the hips).
 * - hand capsules (wrist to the middle knuckle) join the arm colliders;
 * - arm, forearm and hand capsules push the particles away with an extra clearance (armMargin) that covers the mesh
 *   between particles; the torso and leg capsules keep v6's margin. */
/* Kinsmoke cape cloth v6 (v5 unchanged: its build uses it). v5's running sim crumpled the original sculpt into a clump:
 * its 15 x 10 chains bent and bunched freely, and the sculpt's deep folds (skinned as offsets from those bones) were
 * carried through each other. v6 drives the v6 rig (9 x 7 broad chains, smooth weights) with SHAPE-PRESERVING links:
 * every chain may bend only a little from its sculpted shape (bend links with a min AND a max), and the spacing between
 * neighbouring chains is held near rest in both directions (neighbour, cross and span links with maxima), so chains
 * cannot pass through each other. The motion is mostly each chain swinging back about the collar (stream and lift with
 * speed, v4's smoothed frame and relative damping), with small secondary waves, so the waves of the sculpt ride along. */
/* Kinsmoke cape cloth v5 (tuned for the sculpt: wing lift 0.35, wing swing 0.6, spread 2, relative damping 14, wave 10,
 * hem turbulence 6, no corner curl - the sculpt has its own curls - and a curl-GAIN metric over each window's rest value): v4's cloth (smoothed anchor frame, relative damping, speed lift, travelling waves) driving the
 * ORIGINAL Tripo cape (kinsmoke_caped_v5.fbx): the sculpt is the rest shape; the cloth only adds lag, lift and flow on top
 * of it through the skinned bone chains, so its waves and folds stay. v4's file is unchanged (its build uses it). */
/* Kinsmoke cape cloth v4 (v1-v3 unchanged: their builds use them). Fixes v3's side-view pendulum: measured on the v3
 * build, the hem swung +-55..62 deg sideways and its stream angle +-12..15 deg per stride, because the rest targets, the
 * swing limits and the backstop were rigid on the animated Spine2, so every stride's torso twist yanked the whole sheet.
 * - SMOOTHED ANCHOR FRAME: the collar pins (row 0) stay exactly on the body, but the targets the rest of the sheet is
 *   pulled toward and limited around, the backstop frame and the spread axis follow a low-pass-filtered copy of the
 *   Spine2 orientation (follows lean and turns, drops the per-stride twist). Standing it follows almost instantly, so the
 *   idle base form is the rigid cape as before.
 * - RELATIVE DAMPING: velocity relative to the (smoothed) body is damped hard while moving - the swing dies instead of
 *   pendulum-ing - while air drag on the world velocity (what makes it stream behind) is unchanged.
 * - LIFT grows with speed squared (streams near horizontal at a sprint); a much smaller sideways spread.
 * - WAVES: a coherent travelling wave along the surface normal from the shoulders to the hem (14-row sheet), hem
 *   turbulence, and a curl on the lower corners.
 * Unchanged: chains on the smooth sheet, stiff border band, span links, post-length sheet links, colliders, backstop,
 * NaN reset, bones only. */
/* Kinsmoke cape cloth v3 (v1 and v2 unchanged: the KINSMOKE and KINSMOKE_CAPE_V2 builds use them). For the v3 cape
 * (blender_build_kinsmoke_cape_v3.py: 21 chains x 10 joints). On top of v2:
 * - a travelling WAVE along the sheet's own surface normal (crest running from the collar to the hem), and BILLOW (the
 *   sheet fills outward like a sail), both growing with speed and down the cape, so it never streams as a rigid plane;
 * - more lift at the hem;
 * - the no-roll span link and the roll metric scale with the column count (same angular width as v2's).
 * Zero at rest: the idle base form, the leg / NaN / reset guarantees and 'bones only' are v2's. */
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
 const DEFAULTS={armMargin:0.06,armShadow:0.4,substep:1/120,maxSubsteps:6,iterations:4,gravity:9.81,drag:1.6,margin:0.012,
  horizontalStiffness:0.95,shearStiffness:0.6,minHorizontal:0.92,maxHorizontal:1.08,minBend:0.93,bendMinMove:0.88,swingMove:3,aero:6,gustAmp:1.2,gustK:3.2,gustSpeed:1.1,gustRidge:0.6,shapeMatchMove:0.35,maxBend:1.05,crossBendMin:0.95,crossBendMax:1.05,crossBendStiffness:1,spanMin:0.9,spanMax:1.1,spanStiffness:0.9,flutter:40,flutterFreq:8.5,spread:2,lift:10,wingSwing:0.6,wingLift:0.35,minHorizontalMove:0.92,crossBendMinMove:0.92,spanMinMove:0.88,liftMax:2.2,wave:90,waveFreq:10,waveK:1.15,waveCol:0.12,billow:14,hemTurb:30,cornerCurl:0,shapeMatch:0.35,shapeMatchIdle:0,frameFollowIdle:25,frameFollowMove:8,anchorFollow:10,relDamp:1.2,strapFrom:0.7,strapPull:14,edgeCols:3,edgeBendMin:0.97,edgeSpanMin:0.92,edgeTaper:1.2,spreadShape:0.5,postSheetIterations:1,
  swingOfChain:[0,0.18,0.36,0.52,0.66,0.78],wind:new V(0,0,0),windGust:0.25,
  restPullIdle:14,restPullMove:0.15,dragMove:2.4,runSpeed:6,motionRise:6,motionFall:2.5,
  backstopAxis:['mixamorigHips','mixamorigNeck'],backstopOfHeight:0.06,resetDistance:2};

 function create(model,rig,opts={}){
  const o=Object.assign({},DEFAULTS,rig.cloth||{},opts),H=o.height;
  if(o.swingOfChain.length!==rig.rows){const s=o.swingOfChain,n=rig.rows;o.swingOfChain=Array.from({length:n},(_,r)=>{const x=r/(n-1)*(s.length-1),i=Math.min(s.length-2,Math.floor(x));return s[i]+(s[i+1]-s[i])*(x-i);});}
  if(!(H>0))throw Error('KinsmokeCapeCloth needs the character height in world units');
  const byName=n=>{const b=model.getObjectByName(n);if(!b)throw Error('Missing bone '+n);return b;};
  const cols=rig.chains.map(chain=>chain.map(byName)),C=cols.length,R=rig.rows;
  // Span of the no-roll link and of the roll metric, in columns: the same angular width as v2's 4 columns of 15.
  const SPAN=Math.max(4,Math.round(4*(C-1)/14)),RS=Math.max(2,Math.round(SPAN/2));
  const restPos=cols.map(ch=>ch.map(b=>b.position.clone())),restQuat=cols.map(ch=>ch.map(b=>b.quaternion.clone()));
  const restDir=cols.map(ch=>ch.map((b,r)=>r+1<R?ch[r+1].position.clone().normalize():null));
  const isArm=n=>/Arm|Hand/.test(n);
  const colliderList=rig.colliders.slice();
  for(const side of ['Left','Right'])if(model.getObjectByName('mixamorig'+side+'HandMiddle1')&&!colliderList.some(c=>c.from==='mixamorig'+side+'Hand'))colliderList.push({from:'mixamorig'+side+'Hand',to:'mixamorig'+side+'HandMiddle1',radiusOfHeight:0.03});
  const capsules=colliderList.map(c=>({a:byName(c.from),b:byName(c.to),r:c.radiusOfHeight*H,arm:isArm(c.from)}));
  const P=cols.map(ch=>ch.map(()=>new V())),prev=cols.map(ch=>ch.map(()=>new V())),T=cols.map(ch=>ch.map(()=>new V()));
  const nrmInit=cols.map(ch=>ch.map(()=>new V()));
  let restV=null,restH=null,restH2=null,restH4=null,restS=null,restB=null,chainLen=null,maxDist=null;
  const restCurlWin=new Map();
  const TS=cols.map(ch=>ch.map(()=>new V())),qNi=new Q(),qF=new Q(),qD=new Q(),qN=new Q(),anc=new V(),AF=new V(),AFprev=new V(),vA=new V(),vdt=new V();let qFready=false,speedRatio=0;
  const nrm=nrmInit,tu=new V(),tv=new V(),lat=new V(),tmp=new V(),tmp2=new V(),cur=new V(),qa=new Q(),qb=new Q(),qp=new Q();
  const capA=capsules.map(()=>new V()),capB=capsules.map(()=>new V());
  // Backstop: every particle keeps to its own side of the torso axis (like a cloth backstop), so a fast swing
  // cannot carry the cape through the hips or legs and leave it wrapped around the front.
  const bsA=byName(o.backstopAxis[0]),bsB=byName(o.backstopAxis[1]),bsFrame=byName(rig.rootParent);
  const bsPa=new V(),bsPb=new V(),bsQ=new Q(),bsQi=new Q(),bsN=new V(),bsC=new V();let bsLocal=null,bsMin=null;
  function axisPoint(p,out){tmp.subVectors(bsPb,bsPa);const l2=tmp.lengthSq();let t=l2>0?tmp2.subVectors(p,bsPa).dot(tmp)/l2:0;t=Math.max(0,Math.min(1,t));return out.copy(bsPa).addScaledVector(tmp,t);}
  function readBackstop(){bsA.getWorldPosition(bsPa);bsB.getWorldPosition(bsPb);bsFrame.getWorldQuaternion(bsQ);bsQi.copy(bsQ).invert();}
  const aW=new V(),aDir=new V();let aSpd=0;
  let lastH=0,time=0,ready=false,lastCost=0,frames=0,costSum=0,resets=0,motion=0;const lastPin=new V();
  const legCaps=capsules.map((c,i)=>/Leg|Foot/.test(colliderList[i].from)?i:-1).filter(i=>i>=0);
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
    chainLen.push(len);{const x=Math.abs((c-(C-1)/2)/((C-1)/2));maxDist.push(o.swingOfChain.map((f,r)=>f*len*(1+o.wingSwing*Math.pow(x,1.5)*Math.max(0,(r/(R-1)-0.08)/0.92))));}   // v4: the wings' lower rows may swing far enough to stream back behind him
    if(c+2<C)restH2.push(T[c].map((p,r)=>p.distanceTo(T[c+2][r])));
    if(c+SPAN<C)restH4.push(T[c].map((p,r)=>p.distanceTo(T[c+SPAN][r])));
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
   lastH=0;ready=true;lastPin.copy(T[0][0]);qFready=false;
  }
  // v4: while moving, the sheet may gather (compress) down its length - real cloth folds finer than this grid - so the
  // wide wings can stream back behind him instead of being held out by their own resting width. Standing: unchanged.
  function gMin(r,still,moving){const k=motion*(r/(R-1));return still+(moving-still)*k;}
  const smQ=[],smA=new THREE.Matrix3(),smR=new THREE.Matrix3(),smC=new V(),smC0=new V(),smW=new V(),smT=new V(),smQ2=new Q(),smE=[],smRc=[new V(),new V(),new V()],smAc=[new V(),new V(),new V()];
  function rotationOf(A,q){   // Mueller et al. 2016: extract the rotation of A, warm-started from q
   const e=A.elements;smAc[0].set(e[0],e[1],e[2]);smAc[1].set(e[3],e[4],e[5]);smAc[2].set(e[6],e[7],e[8]);
   for(let it=0;it<8;it++){const m=new THREE.Matrix4().makeRotationFromQuaternion(q).elements;
    smRc[0].set(m[0],m[1],m[2]);smRc[1].set(m[4],m[5],m[6]);smRc[2].set(m[8],m[9],m[10]);
    smW.set(0,0,0);let den=0;for(let k=0;k<3;k++){smW.add(smT.crossVectors(smRc[k],smAc[k]));den+=smRc[k].dot(smAc[k]);}
    smW.multiplyScalar(1/(Math.abs(den)+1e-9));const w=smW.length();if(w<1e-9)break;
    smQ2.setFromAxisAngle(smW.multiplyScalar(1/w),w);q.premultiply(smQ2).normalize();}
   return q;
  }
  function shapeMatch(alpha){
   for(let c=0;c<C;c++){
    const c0=Math.max(0,c-1),c1=Math.min(C-1,c+1);if(!smQ[c])smQ[c]=new Q();
    smC.set(0,0,0);smC0.set(0,0,0);let n=0;
    for(let k=c0;k<=c1;k++)for(let r=0;r<R;r++){smC.add(P[k][r]);smC0.add(TS[k][r]);n++;}
    smC.multiplyScalar(1/n);smC0.multiplyScalar(1/n);
    const A=[0,0,0,0,0,0,0,0,0];
    for(let k=c0;k<=c1;k++)for(let r=0;r<R;r++){const px=P[k][r].x-smC.x,py=P[k][r].y-smC.y,pz=P[k][r].z-smC.z,qx=TS[k][r].x-smC0.x,qy=TS[k][r].y-smC0.y,qz=TS[k][r].z-smC0.z;
     A[0]+=px*qx;A[1]+=py*qx;A[2]+=pz*qx;A[3]+=px*qy;A[4]+=py*qy;A[5]+=pz*qy;A[6]+=px*qz;A[7]+=py*qz;A[8]+=pz*qz;}
    smA.elements=A;const q=rotationOf(smA,smQ[c]);
    const a3=alpha/(c1-c0+1);
    for(let k=c0;k<=c1;k++)for(let r=1;r<R;r++){smT.subVectors(TS[k][r],smC0).applyQuaternion(q).add(smC);P[k][r].lerp(smT,a3);}
   }
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
  const aq=new V(),ao=new V(),ad=new V(),alat=new V();
  // v8: an arm capsule lifts a particle over the arm (to its side away from the torso axis), never under it.
  function armLift(p,i,r){
   const a=capA[i],b=capB[i];ad.subVectors(b,a);const len2=ad.lengthSq();if(len2<1e-9)return 0;
   let t=tmp2.subVectors(p,a).dot(ad)/len2;t=Math.max(0,Math.min(1,t));aq.copy(a).addScaledVector(ad,t);
   tmp.subVectors(bsPb,bsPa);const l2=tmp.lengthSq();let tt=l2>0?tmp2.subVectors(aq,bsPa).dot(tmp)/l2:0;tt=Math.max(0,Math.min(1,tt));
   ao.copy(aq).sub(tmp2.copy(bsPa).addScaledVector(tmp,tt));ad.normalize();ao.addScaledVector(ad,-ao.dot(ad));const ol=ao.length();
   if(ol<1e-4)return 0;ao.multiplyScalar(1/ol);
   tmp.subVectors(p,aq);const sN=tmp.dot(ao);alat.copy(tmp).addScaledVector(ao,-sN);const l=alat.length();if(l>=r)return 0;
   const outS=Math.sqrt(r*r-l*l);if(!(sN<outS&&sN>-Math.min(o.armShadow,ol)))return 0;
   p.copy(aq).add(alat).addScaledVector(ao,outS);return outS-sN;
  }
  function collide(p){
   let worst=0;
   for(let i=0;i<capsules.length;i++){
    if(capsules[i].arm){const r=capsules[i].r+o.margin+o.armMargin;worst=Math.max(worst,armLift(p,i,r));continue;}
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
   const relK=Math.exp(-o.relDamp*motion*dt),liftK=motion*Math.min(o.liftMax,speedRatio*speedRatio);
   const drag=Math.exp(-(o.drag+((o.dragMove??o.drag)-o.drag)*motion)*dt)*(lastH>0?dt/lastH:1),g=o.gravity*dt*dt*motion;lastH=dt;
   const pull=1-Math.exp(-(o.restPullIdle+(o.restPullMove-o.restPullIdle)*motion)*dt);
   const gust=1+o.windGust*Math.sin(time*1.7)*Math.sin(time*0.63+1.3);
   // Airflow spread: the collar's left-right axis (outer chain to outer chain), horizontal. Each chain is pushed toward its
   // own side in proportion to how far out it is, so the wings fan out behind him instead of wrapping into a cone or tube.
   // Surface normals (outward from the torso axis) for the wave and the billow.
   const aeroOn=motion>0.01&&o.aero>0;if(aeroOn){aW.copy(o.wind).sub(vA);aSpd=aW.length();if(aSpd>1e-6)aDir.copy(aW).multiplyScalar(1/aSpd);else aDir.set(0,0,1);}
   const waveOn=motion>0.01&&(o.wave>0||o.billow>0||o.aero>0);
   if(waveOn)for(let c=0;c<C;c++)for(let r=1;r<R;r++){tu.subVectors(P[Math.min(C-1,c+1)][r],P[Math.max(0,c-1)][r]);tv.subVectors(P[c][Math.min(R-1,r+1)],P[c][r-1]);const n=nrm[c][r].crossVectors(tu,tv);const l=n.length();if(l<1e-9){n.set(0,0,0);continue;}n.multiplyScalar(1/l);axisPoint(P[c][r],bsC);if(n.dot(tmp.subVectors(P[c][r],bsC))<0)n.negate();}
   const spreadOn=motion>0.01&&o.spread>0;if(spreadOn){lat.subVectors(TS[C-1][1],TS[0][1]);lat.y=0;if(lat.lengthSq()>1e-9)lat.normalize();}
   for(let c=0;c<C;c++){
    P[c][0].copy(T[c][0]);prev[c][0].copy(T[c][0]);
    for(let r=1;r<R;r++){
     const p=P[c][r],q=prev[c][r];
     tmp.subVectors(p,q).multiplyScalar(drag);q.copy(p);
     // relative damping: velocity relative to the smoothed body decays (no pendulum); world drag above is unchanged
     if(relK<1){vdt.copy(vA).multiplyScalar(dt);tmp.sub(vdt).multiplyScalar(relK).add(vdt);}
     p.add(tmp);p.y-=g;p.addScaledVector(o.wind,gust*dt*dt*r/(R-1)*motion);
     // flag-like travelling flap (vertical): in-plane for the side wings, so it ripples without curling them
     const taper=Math.pow(Math.sin(Math.PI*c/(C-1)),o.edgeTaper);   // forcing fades toward the free front edges
     if(motion>0.01)p.y+=o.flutter*taper*motion*(r/(R-1))*Math.sin(time*o.flutterFreq+c*0.45-r*1.0)*dt*dt;
     if(waveOn){const f=r/(R-1),a=taper*motion*f*(o.wave*Math.sin(time*o.waveFreq-r*o.waveK+c*o.waveCol)+o.billow*Math.sin(Math.PI*f))
       +motion*f*f*f*o.hemTurb*Math.pow(taper,0.3)*Math.sin(time*13.1+c*1.7+r*0.9)*Math.sin(time*7.3+c*0.6)
       +((c<2||c>C-3)&&r>=R-3?motion*o.cornerCurl:0);
      p.addScaledVector(nrm[c][r],a*dt*dt);}
     // v10 AIRFLOW: sail pressure on the normal from the apparent wind, modulated by gusts travelling with the air
     if(aeroOn){const f=r/(R-1),wn=nrm[c][r].dot(aW),d=p.dot(aDir),ph=o.gustK*(d-aSpd*o.gustSpeed*time),
       g=1+o.gustAmp*(Math.sin(ph+c*o.gustRidge)*0.65+Math.sin(1.9*ph-c*0.37+1.1)*0.35);
      p.addScaledVector(nrm[c][r],o.aero*motion*wn*g*(0.35+0.65*f)*dt*dt);}
     // saturating spread: a whole wing fans out together (a linear push bent the edge strip over)
     if(spreadOn){const k=motion*(r/(R-1))*dt*dt,x=(c-(C-1)/2)/((C-1)/2);p.addScaledVector(lat,o.spread*k*Math.sign(x)*Math.pow(Math.abs(x),o.spreadShape));}
     // lift grows with speed squared; the wide wings get more, so they stream back level with the centre instead of hanging
     {const x=Math.abs((c-(C-1)/2)/((C-1)/2)),f=r/(R-1),hemTaper=1-0.5*Math.max(0,(f-0.75)/0.25);p.y+=o.lift*(1+o.wingLift*Math.pow(x,1.2))*liftK*f*hemTaper*dt*dt;}   // v6: lift tapers off at the hem tip
     // v5: the outermost columns are the cape's front straps (they hang at the front of the shoulders, in the arms' path):
     // held toward their sculpted place more firmly while moving, so the pumping arms don't bat them around.
     {const x=Math.abs((c-(C-1)/2)/((C-1)/2)),k=x>o.strapFrom?1+o.strapPull*(x-o.strapFrom)/(1-o.strapFrom):1;p.lerp(TS[c][r],k>1?1-Math.pow(1-pull,k):pull);}
    }
   }
   // v6 SHAPE MATCHING: clusters of 3 adjacent chains (all rows below the collar) are pulled toward their sculpted rest
   // shape (carried by the smoothed body frame), rotated to best fit where they are now. The cape can swing back, stream
   // and lift as a whole, but no region can flip its curl or fold through the sculpt.
   if(o.shapeMatch>0)shapeMatch(o.shapeMatch*(o.shapeMatchIdle+(1-o.shapeMatchIdle)*motion)*(1+(o.shapeMatchMove-1)*motion));
   let pen=0,clamped=0;
   // Soft links and the body first, the chains' own lengths last, so each pass ends with every chain at its true length.
   for(let it=0;it<o.iterations;it++){
    // The knotwork border is a heavy, stiff band: near the front edges the cross-column links are almost rigid.
    for(let c=0;c+2<C;c++){const edge=c<o.edgeCols||c+2>C-1-o.edgeCols;for(let r=1;r<R;r++)solveDistance(P[c][r],P[c+2][r],1,1,restH2[c][r],edge?1:o.crossBendStiffness,edge?o.edgeBendMin:gMin(r,o.crossBendMin,o.crossBendMinMove),o.crossBendMax);}
    // Span link over four columns: the sheet cannot close back on itself (a roll or tube) across that width.
    for(let c=0;c+SPAN<C;c++){const edge=c<o.edgeCols||c+SPAN>C-1-o.edgeCols;for(let r=1;r<R;r++)solveDistance(P[c][r],P[c+SPAN][r],1,1,restH4[c][r],edge?1:o.spanStiffness,edge?o.edgeSpanMin:gMin(r,o.spanMin,o.spanMinMove),o.spanMax);}
    for(let c=0;c+1<C;c++)for(let r=1;r<R;r++){
     solveDistance(P[c][r],P[c+1][r],1,1,restH[c][r],o.horizontalStiffness,gMin(r,o.minHorizontal,o.minHorizontalMove),o.maxHorizontal);
     if(r+1<R){const s=restS[c][r];solveDistance(P[c][r],P[c+1][r+1],1,1,s[0],o.shearStiffness,gMin(r,o.minHorizontal,o.minHorizontalMove),o.maxHorizontal);solveDistance(P[c+1][r],P[c][r+1],1,1,s[1],o.shearStiffness,gMin(r,o.minHorizontal,o.minHorizontalMove),o.maxHorizontal);}
    }
    for(let c=0;c<C;c++)for(let r=1;r<R;r++){
     // v4: body collision on alternate iterations and the last (the final push after the solve is unchanged): ~half the cost
     const p=P[c][r];if(it%2===1||it+1===o.iterations)collide(p);backstop(c,r,p);
     const m=maxDist[c][r]*(1+(o.swingMove-1)*motion);tmp.subVectors(p,TS[c][r]);const d=tmp.length();
     if(d>m){p.copy(TS[c][r]).addScaledVector(tmp,m/d);if(it+1===o.iterations)clamped++;}
    }
    for(let c=0;c<C;c++)for(let r=0;r+2<R;r++)solveDistance(P[c][r],P[c][r+2],r?1:0,1,restB[c][r],1,gMin(r,o.minBend,o.bendMinMove),o.maxBend);
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
   // v3: the sheet links once more after the chain lengths are set, so the body push below cannot be left to squeeze
   // neighbouring columns into a wrap round the torso (it only moves points outward a little from here).
   for(let k=0;k<o.postSheetIterations;k++){
    // v6: chains keep their sculpted bend after the length pass too (the hem tip cannot fold back on itself)
    for(let c=0;c<C;c++)for(let r=0;r+2<R;r++)solveDistance(P[c][r],P[c][r+2],r?1:0,1,restB[c][r],1,gMin(r,o.minBend,o.bendMinMove),o.maxBend);
    for(let c=0;c+2<C;c++){const edge=c<o.edgeCols||c+2>C-1-o.edgeCols;for(let r=1;r<R;r++)solveDistance(P[c][r],P[c+2][r],1,1,restH2[c][r],edge?1:o.crossBendStiffness,edge?o.edgeBendMin:gMin(r,o.crossBendMin,o.crossBendMinMove),o.crossBendMax);}
    for(let c=0;c+SPAN<C;c++){const edge=c<o.edgeCols||c+SPAN>C-1-o.edgeCols;for(let r=1;r<R;r++)solveDistance(P[c][r],P[c+SPAN][r],1,1,restH4[c][r],edge?1:o.spanStiffness,edge?o.edgeSpanMin:gMin(r,o.spanMin,o.spanMinMove),o.spanMax);}
    for(let c=0;c+1<C;c++)for(let r=1;r<R;r++)solveDistance(P[c][r],P[c+1][r],1,1,restH[c][r],o.horizontalStiffness,gMin(r,o.minHorizontal,o.minHorizontalMove),o.maxHorizontal);
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
   model.updateWorldMatrix(true,true);readTargets();readBackstop();speedRatio=(ctx.speed||0)/o.runSpeed;
   // Smoothed anchor frame: low-pass the Spine2 orientation (fast when standing, slow while moving) and carry every
   // non-pin target with it; the pins stay exact. The backstop uses the same smoothed frame.
   bsFrame.getWorldPosition(anc);qN.copy(bsQ);
   if(!qFready){qF.copy(qN);AF.copy(anc);AFprev.copy(anc);qFready=true;}
   if(dt>0){const fol=o.frameFollowIdle+(o.frameFollowMove-o.frameFollowIdle)*motion;qF.slerp(qN,1-Math.exp(-fol*dt));
    AFprev.copy(AF);AF.lerp(anc,1-Math.exp(-o.anchorFollow*dt));vA.subVectors(AF,AFprev).multiplyScalar(1/dt);}
   qD.copy(qF).multiply(qNi.copy(qN).invert());
   for(let c=0;c<C;c++)for(let r=0;r<R;r++){if(!r){TS[c][r].copy(T[c][r]);continue;}TS[c][r].subVectors(T[c][r],anc).applyQuaternion(qD).add(anc);}
   bsQ.copy(qF);bsQi.copy(qF).invert();
   // A respawn or teleport moves the collar metres in one frame: start the cloth again from the rigid cape.
   if(T[0][0].distanceTo(lastPin)>o.resetDistance){for(let c=0;c<C;c++)for(let r=0;r<R;r++){P[c][r].copy(T[c][r]);prev[c][r].copy(T[c][r]);}lastH=0;resets++;qFready=false;}
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
  // Sheet integrity and curl metrics (diagnostics): computed only when state() is sampled, not every frame (v4: saves ~0.4 ms).
  function measureSheet(){const nan=stats.nan;
   // Sheet integrity (v2): the tightest neighbour-column gap and chain fold, as fractions of rest. A roll or tube shows up as
   // neighbouring columns collapsing onto each other (low colRatio) or a chain folding back on itself (low foldRatio).
   if(!nan&&restH){let cr=Infinity,fr=Infinity;for(let c=0;c+1<C;c++)for(let r=1;r<R;r++)cr=Math.min(cr,P[c][r].distanceTo(P[c+1][r])/Math.max(1e-6,restH[c][r]));
    for(let c=0;c<C;c++)for(let r=0;r+2<R;r++){const q=P[c][r].distanceTo(P[c][r+2])/Math.max(1e-6,restB[c][r]);if(q<fr){fr=q;stats.foldAt=[c,r];}}
    // Curl: the sharpest turn between successive segments across the columns (a roll or tube) and along a chain.
    const a1=new V(),a2=new V();let ct=0,ht=0;
    for(let r=1;r<R;r++)for(let c=1;c+1<C;c++){a1.subVectors(P[c][r],P[c-1][r]);a2.subVectors(P[c+1][r],P[c][r]);const l=a1.length()*a2.length();if(l>1e-9){const g=Math.acos(Math.max(-1,Math.min(1,a1.dot(a2)/l)));if(g>ct){ct=g;stats.crossTurnAt=[c,r];}}}
    for(let c=0;c<C;c++)for(let r=1;r+1<R;r++){a1.subVectors(P[c][r],P[c][r-1]);a2.subVectors(P[c][r+1],P[c][r]);const l=a1.length()*a2.length();if(l>1e-9){const g=Math.acos(Math.max(-1,Math.min(1,a1.dot(a2)/l)));if(g>ht){ht=g;stats.chainTurnAt=[c,r];}}}
    // Roll / tube: segment (c-2 -> c-1) against segment (c+1 -> c+2). A pleat zig-zags (the two stay roughly parallel); a
    // roll curls one way until the sheet faces back on itself (the two point opposite ways, ~180 deg).
    let rl=0;for(let r=1;r<R;r++)for(let c=RS;c+RS<C;c++){a1.subVectors(P[c-RS+1][r],P[c-RS][r]);a2.subVectors(P[c+RS][r],P[c+RS-1][r]);const l=a1.length()*a2.length();if(l>1e-9){const g=Math.acos(Math.max(-1,Math.min(1,a1.dot(a2)/l)));if(g>rl){rl=g;stats.rollAt=[c,r];}}}
    // Signed curl (v3): turning between successive column segments, signed about the chain direction, accumulated over a
    // window of 2*RS columns (~66 deg of the sheet's rest arc). A pleat zig-zags (turns alternate, the sum stays small);
    // a roll or tube keeps turning one way until the sheet faces back on itself (|sum| >= 180).
    // window = ~66 deg of the sheet's rest arc, from the rig's column spacing (v3: 6 columns of 21; v4: 5 of 17)
    let gain=0;
    {const W=rig.thetaMaxDeg?Math.max(2,Math.round(66*(C-1)/(2*rig.thetaMaxDeg))):2*RS,turn=new Array(C).fill(0),ax=new V(),cr=new V();let best=0;
     for(let r=1;r<R;r++){
      for(let c=1;c+1<C;c++){a1.subVectors(P[c][r],P[c-1][r]);a2.subVectors(P[c+1][r],P[c][r]);ax.subVectors(P[c][Math.min(R-1,r+1)],P[c][r-1]);const al=ax.length();if(al<1e-9){turn[c]=0;continue;}ax.multiplyScalar(1/al);cr.crossVectors(a1,a2);turn[c]=Math.atan2(cr.dot(ax),a1.dot(a2));}
      for(let c=1;c+W<=C-1;c++){let s=0;for(let k=c;k<c+W;k++)s+=turn[k];if(Math.abs(s)>best){best=Math.abs(s);stats.curlAt=[c,r];}
       // v5: the original sculpt curls on its own (its rolled hem), so also measure curl GAINED over each window's rest value
       const key=r*C+c;if(!restCurlWin.has(key)&&motion<0.01)restCurlWin.set(key,Math.abs(s));const g=Math.abs(s)-(restCurlWin.get(key)??Math.abs(s));if(g>gain){gain=g;stats.curlGainAt=[c,r];}}
     }
     stats.curlDeg=best*180/Math.PI;stats.curlGainDeg=gain*180/Math.PI;if(stats.restCurl==null&&motion<0.01)stats.restCurl=stats.curlDeg;}
    stats.rollDeg=rl*180/Math.PI;if(!stats.restRoll&&motion<0.01)stats.restRoll=stats.rollDeg;
    stats.crossTurnDeg=ct*180/Math.PI;stats.chainTurnDeg=ht*180/Math.PI;
    if(!stats.restTurn&&motion<0.01){stats.restTurn={cross:stats.crossTurnDeg,chain:stats.chainTurnDeg};}
    stats.colRatio=cr;stats.foldRatio=fr;stats.minColRatio=Math.min(stats.minColRatio??Infinity,cr);stats.minFoldRatio=Math.min(stats.minFoldRatio??Infinity,fr);}
  }
  function state(){
   measureSheet();
   const disp=[];for(let c=0;c<C;c++){const row=[];for(let r=0;r<R;r++)row.push(+P[c][r].distanceTo(T[c][r]).toFixed(4));disp.push(row);}
   let maxDisp=0,sumDisp=0,n=0;for(const row of disp)for(let r=1;r<row.length;r++){maxDisp=Math.max(maxDisp,row[r]);sumDisp+=row[r];n++;}
   return{columns:C,rows:R,motion:+motion.toFixed(3),maxDisplacementM:+maxDisp.toFixed(4),meanDisplacementM:+(sumDisp/Math.max(1,n)).toFixed(4),legPenetration:+(stats.legPenetration||0).toFixed(4),penetration:+stats.penetration.toFixed(4),maxStretch:+stats.maxStretch.toFixed(3),maxAimErrorM:+stats.maxAimError.toFixed(4),nan:stats.nan,
    clampedRows:stats.clampedRows,colRatio:+(stats.colRatio??1).toFixed(3),foldRatio:+(stats.foldRatio??1).toFixed(3),minColRatio:+(stats.minColRatio??1).toFixed(3),crossTurnDeg:+(stats.crossTurnDeg??0).toFixed(1),crossTurnAt:stats.crossTurnAt,rollDeg:+(stats.rollDeg??0).toFixed(1),curlDeg:+(stats.curlDeg??0).toFixed(1),curlGainDeg:+(stats.curlGainDeg??0).toFixed(1),curlGainAt:stats.curlGainAt,foldAt:stats.foldAt,curlAt:stats.curlAt,restCurlDeg:stats.restCurl!=null?+stats.restCurl.toFixed(1):null,rollAt:stats.rollAt,restRollDeg:stats.restRoll!=null?+stats.restRoll.toFixed(1):null,chainTurnAt:stats.chainTurnAt,chainTurnDeg:+(stats.chainTurnDeg??0).toFixed(1),restTurnDeg:stats.restTurn?{cross:+stats.restTurn.cross.toFixed(1),chain:+stats.restTurn.chain.toFixed(1)}:null,minFoldRatio:+(stats.minFoldRatio??1).toFixed(3),resets,lastCostMs:+lastCost.toFixed(3),meanCostMs:+(costSum/Math.max(1,frames)).toFixed(3),frames,displacement:disp};
  }
  // World-space hem offset from the rigid cape, for tests: positions of the last row and their rigid targets.
  function hem(){return cols.map((ch,c)=>({p:P[c][R-1].toArray(),t:T[c][R-1].toArray()}));}
  function row(r){return cols.map((ch,c)=>({p:P[c][r].toArray(),t:T[c][r].toArray()}));}
  return{update,reset,state,hem,row,options:o,capsules:()=>capsules.map((c,i)=>({a:capA[i].toArray(),b:capB[i].toArray(),r:c.r}))};
 }
 window.KinsmokeCapeCloth={create};
})();
