/* v10: v9's over-the-arm push with more air (3 cm, v9: 1.5 cm) and a FEATHER: cape beside an arm (up to 8 cm outside
 * its width, or wider for a deep lift: 1.3 x the lift) is lifted part of the way, easing down, so no steep wall of cape triangles is left slicing past the side of
 * the elbow; the lift fades out just before the torso axis (inside the body), so the push has no hard edge that
 * would stretch cape triangles across an arm; and game_kinsmoke_cape_cloth_v8.js lifts the cloth particles over the arms
 * too (the user, on v9: "almost good, it's still showing a little bit"). v1-v9 modules unchanged.
 * --- v9 notes ---
 * v9: the arm push goes OVER the arm. The user (2026-11-10, on v8): "still the elbows going through the cape when he's
 * running". v8 pushed cape vertices radially out of the arm capsules, so where the cape lay between an arm and his
 * back (Mvm_Dash swings the arms far behind him) it was pushed toward the body, UNDER the arm, and the elbow showed
 * outside the cape. v9 pushes every cape vertex in an arm's path to the arm's OUTER side (away from the torso axis):
 * any vertex inside the capsule, or between the arm and the torso within the arm's width (up to SHADOW_DEPTH deep), is
 * lifted over the arm. Radii are measured from his real arm mesh while running (upper arm 8.3 cm, forearm 7.7 cm, hand
 * 12 cm, +1.5 cm air) instead of the rig's 75th-percentile collider radii. v1-v8 modules unchanged. */
/* v8: v7's worn cape plus ARM CLEARANCE (the user, 2026-11-10: "when he's running his arms are clipping through the
 * cape"). The cape is skinned to 9 x 7 broad chains, so the mesh over the shoulder blades follows the centre-back chain
 * even when an arm swings back into it (Mvm_Dash swings the arms far behind him); pushing particles alone left ~60-180
 * of 35k sampled cape points inside the arms per frame. v8 pushes every cape vertex (and its ink outline) out of six arm
 * capsules - upper arm, forearm, hand on each side - in the vertex shader, after skinning, every frame. Pairs with
 * game_kinsmoke_cape_cloth_v8.js (the cloth particles are lifted over the arms too). The body, its outline and every other
 * hero are untouched; v1-v7 modules unchanged. */
/* v7: the same original cape, chains and cloth as v6, now WORN - kinsmoke_caped_v7.fbx from blender_build_kinsmoke_cape_v7.py
 * wraps the cape's own collar around the back of the neck and lays its top edge on the shoulders (v5/v6 left it ~30 cm
 * behind the neck with a separate rope ring in front). Cloth: game_kinsmoke_cape_cloth_v6.js unchanged. v1-v6 unchanged. */
/* v6: the same original cape and seat as v5 (kinsmoke_caped_v6.fbx: re-rigged with 9 x 7 broad chains) driven by
 * game_kinsmoke_cape_cloth_v6.js (shape-preserving links). v1-v5 modules unchanged. */
/* v5: the ORIGINAL Tripo cape (v1's sculpt) on v3's seat - kinsmoke_caped_v5.fbx from blender_build_kinsmoke_cape_v5.py -
 * driven by game_kinsmoke_cape_cloth_v5.js. v1-v4 modules unchanged. */
/* v4: the v4 cape grid (17 x 14, kinsmoke_caped_v4.fbx) simulated by game_kinsmoke_cape_cloth_v4.js (smoothed anchor
 * frame, relative damping, speed lift, travelling waves). v1-v3 modules unchanged. */
/* v3 (v1 and v2 unchanged: the KINSMOKE and KINSMOKE_CAPE_V2 builds use them): the v3 cape - v2's fit with the
 * reference's wide wings, deep folds and curled hem, and the original Tripo cape's moss and knotwork art
 * (assets/characters/kinsmoke/kinsmoke_caped_v3.fbx + kinsmoke_cape_rig_v3.json, blender_build_kinsmoke_cape_v3.py),
 * simulated by game_kinsmoke_cape_cloth_v3.js (21 x 10 sheet with a travelling wave and billow).
 * Kinsmoke (Malu Kinsala), the fourth hero, in TEST MODE: he can be selected and run around so his cape can be judged.
 * He runs on Backspool's controller (characterState().hero==='kinsmoke', active stays 'backspool', like Loadout) with
 * no powers (game_v02_loadout_hero.js blocksPowers() covers him) and no combat (game_backspool_combat_v02.js skips him).
 * Animation: exactly two clips, both from the Runner Action pack set Loadout plays (assets/loadout/runner/
 * loadout_runner_clips.json.gz, on Loadout's skeleton) retargeted onto him with game_mixamo_retarget.js:
 *   idle = Idle_Wait_A (Loadout's flow idle), run = Mvm_Dash (Loadout's "run", reference speed 8.2 m/s; played at his
 *   real ground speed / 8.2 so the feet do not slide). Every other clip name in his bank points at the idle clip.
 * Cape: Tripo's wide moss-green cape with gold trim, rigged to 15 x 6 cape bones (scripts/characters/kinsmoke/
 * blender_build_kinsmoke_cape.py), simulated by game_kinsmoke_cape_cloth.js: exactly its modelled base form while he
 * stands, lag and billow while he moves. The cloth only rotates cape bones; it never moves him (movement ownership).
 * Model: assets/characters/kinsmoke/kinsmoke_caped.fbx (body converted from Tripo's UE5 rig to mixamorig names). */
(()=>{
 'use strict';
 const HEIGHT=1.82,RUN_REF=8.2,RUN_MIN=.6;
 const ASSETS={model:'assets/characters/kinsmoke/kinsmoke_caped_v7.fbx',rig:'assets/characters/kinsmoke/kinsmoke_cape_rig_v7.json',version:10};
 let bank=null,cloth=null,capeMeshes=[],armPush=null,stats={built:false,buildMs:0,retargetMs:0,clips:0,anim:null,speed:0,timeScale:1};
 function hero(){const st=window.characterState?.();return st?(st.hero||st.active):'sightline';}
 const isActive=()=>hero()==='kinsmoke';
 async function fetchOk(url){const r=await fetch(url);if(!r.ok)throw Error('Kinsmoke asset unavailable: '+url);return r;}
 function normalise(skin){
  skin.updateMatrixWorld(true);let box=new THREE.Box3().setFromObject(skin);const size=box.getSize(new THREE.Vector3());
  skin.scale.setScalar(HEIGHT/size.y);skin.updateMatrixWorld(true);box.setFromObject(skin);const c=box.getCenter(new THREE.Vector3());
  skin.position.set(-c.x,-box.min.y,-c.z);skin.updateMatrixWorld(true);
 }
 // Facing from the arms: a character facing +Z has his left arm at +X.
 function facing(skin){skin.updateMatrixWorld(true);const l=skin.getObjectByName('mixamorigLeftArm').getWorldPosition(new THREE.Vector3()),r=skin.getObjectByName('mixamorigRightArm').getWorldPosition(new THREE.Vector3());const f=l.sub(r).cross(new THREE.Vector3(0,1,0));return Math.atan2(f.x,f.z);}
 // The FBX is one skinned mesh with KinsmokeBody and KinsmokeCape materials: split the cape into its own mesh on the same
 // skeleton (as Loadout's cape) so the foot sampler never reads the cape hem as feet and tests can measure it.
 function splitCape(skin){
  let body=null;skin.traverse(o=>{if(o.isSkinnedMesh&&Array.isArray(o.material)&&o.material.some(m=>m.name==='KinsmokeCape'))body=o;});
  if(!body)throw Error('Kinsmoke cape material missing');
  const g=body.geometry,capeIndex=body.material.findIndex(m=>m.name==='KinsmokeCape');
  const pick=keep=>{
   const ranges=g.groups.filter(gr=>keep(gr.materialIndex)).map(gr=>[gr.start,gr.count]),out=new THREE.BufferGeometry();
   if(g.index){const idx=[];for(const [st,c] of ranges)for(let i=st;i<st+c;i++)idx.push(g.index.getX(i));for(const [n,a] of Object.entries(g.attributes))out.setAttribute(n,a);out.setIndex(idx);}
   else{const total=ranges.reduce((t,[,c])=>t+c,0);for(const [n,a] of Object.entries(g.attributes)){const k=a.itemSize,arr=new a.array.constructor(total*k);let at=0;for(const [st,c] of ranges){arr.set(a.array.subarray(st*k,(st+c)*k),at*k);at+=c;}out.setAttribute(n,new THREE.BufferAttribute(arr,k,a.normalized));}}
   out.computeBoundingBox();out.computeBoundingSphere();return out;
  };
  const capeMat=body.material[capeIndex],bodyMats=body.material.filter((_,i)=>i!==capeIndex);
  const cape=new THREE.SkinnedMesh(pick(i=>i===capeIndex),capeMat);cape.name='KinsmokeCape';
  body.geometry=pick(i=>i!==capeIndex);body.material=bodyMats.length===1?bodyMats[0]:bodyMats;g.dispose();
  cape.position.copy(body.position);cape.quaternion.copy(body.quaternion);cape.scale.copy(body.scale);
  body.parent.add(cape);cape.bind(body.skeleton,body.bindMatrix);
  return cape;
 }
 const unzipJson=async url=>JSON.parse(new TextDecoder().decode(fflate.gunzipSync(new Uint8Array(await (await fetchOk(url)).arrayBuffer()))));



 // ARM CLEARANCE (v8): capsules in the cape's object space, refreshed every frame; the shader pushes skinned cape vertices out.
 const ARM_SEGS=[['LeftArm','LeftForeArm',.085],['LeftForeArm','LeftHand',.077],['LeftHand','LeftHandMiddle3',.12],
  ['RightArm','RightForeArm',.085],['RightForeArm','RightHand',.077],['RightHand','RightHandMiddle3',.12]];   // radius in metres, measured
 const SHADOW_DEPTH=0.35,FEATHER=0.08,BODY_FADE=0.15;   // the lift fades out over the last BODY_FADE before the torso axis (inside his body: unseen), so it has no hard edge
   // metres: cape between an arm and the torso, this far in, is lifted over the arm
 const ARM_CLEAR=0.03;   // metres of air between the arm surface and the cape
 function makeArmPush(skin,cape,meshes){
  const n=ARM_SEGS.length,uni={kArmA:{value:[]},kArmB:{value:[]},kArmR:{value:new Array(n).fill(0)},kTorA:{value:new THREE.Vector3()},kTorB:{value:new THREE.Vector3()},kShadow:{value:0},kFeather:{value:0},kFade:{value:0}};
  for(let i=0;i<n;i++){uni.kArmA.value.push(new THREE.Vector3());uni.kArmB.value.push(new THREE.Vector3());}
    const segs=ARM_SEGS.map(([a,b,r])=>({a:skin.getObjectByName('mixamorig'+a),b:skin.getObjectByName('mixamorig'+b),r:r+ARM_CLEAR}));
  const torA=skin.getObjectByName('mixamorigHips'),torB=skin.getObjectByName('mixamorigNeck');
  if(segs.some(q=>!q.a||!q.b))throw Error('Kinsmoke arm bones missing for the cape clearance');
  const GLSL_PARS='uniform vec3 kArmA['+n+'];uniform vec3 kArmB['+n+'];uniform float kArmR['+n+'];uniform vec3 kTorA;uniform vec3 kTorB;uniform float kShadow;uniform float kFeather;uniform float kFade;\n';
  // For each arm segment: q = closest point on the arm axis; n = the arm's outward direction (from the torso axis, square
  // to the arm). A vertex inside the capsule, or on the torso side within the arm's width and SHADOW deep, goes to the
  // outer surface along n (keeping its sideways offset), so the cape always drapes over the arm, never under it.
  const GLSL_PUSH='\n{vec3 ta=kTorB-kTorA;for(int pass=0;pass<2;pass++)for(int i=0;i<'+n+';i++){vec3 ab=kArmB[i]-kArmA[i];float t=clamp(dot(transformed-kArmA[i],ab)/max(dot(ab,ab),1e-6),0.,1.);vec3 q=kArmA[i]+ab*t;'+
   'float tt=clamp(dot(q-kTorA,ta)/max(dot(ta,ta),1e-6),0.,1.);vec3 o=q-(kTorA+ta*tt);vec3 ad=normalize(ab+vec3(1e-6));o-=ad*dot(o,ad);float ol=length(o);if(ol<1e-4)continue;vec3 nn=o/ol;'+
   'vec3 d=transformed-q;float sN=dot(d,nn);vec3 lat=d-nn*sN;float l=length(lat);float R=kArmR[i];float outS=l<R?sqrt(R*R-l*l):0.;float fw=max(kFeather,1.3*max(0.,-sN));if(l>=R+fw)continue;'+
   'float lim=min(kShadow,ol);float w=(l<R?1.:1.-smoothstep(R,R+fw,l))*(1.-smoothstep(max(lim-kFade,.5*lim),lim,-sN));float tgt=mix(sN,outS,w);if(sN<tgt&&sN>-lim){transformed=q+lat+nn*tgt;}}}\n';
  for(const m of meshes){
   const mat=m.material.clone();
   mat.onBeforeCompile=sh=>{Object.assign(sh.uniforms,uni);sh.vertexShader=GLSL_PARS+sh.vertexShader.replace('#include <skinning_vertex>','#include <skinning_vertex>'+GLSL_PUSH);};
   mat.customProgramCacheKey=()=>'kinsmokeArmPushV10'+(m.userData.toonOutline?'O':'C');
   m.material=mat;
  }
  const inv=new THREE.Matrix4(),wp=new THREE.Vector3(),sc=new THREE.Vector3();
  function update(){
   cape.updateMatrixWorld(true);inv.copy(cape.matrixWorld).invert();sc.setFromMatrixScale(cape.matrixWorld);const k=1/Math.max(1e-9,sc.x);
   segs.forEach((q,i)=>{uni.kArmA.value[i].copy(q.a.getWorldPosition(wp)).applyMatrix4(inv);uni.kArmB.value[i].copy(q.b.getWorldPosition(wp)).applyMatrix4(inv);uni.kArmR.value[i]=q.r*k;});
   uni.kTorA.value.copy(torA.getWorldPosition(wp)).applyMatrix4(inv);uni.kTorB.value.copy(torB.getWorldPosition(wp)).applyMatrix4(inv);uni.kShadow.value=SHADOW_DEPTH*k;uni.kFeather.value=FEATHER*k;uni.kFade.value=BODY_FADE*k;
  }
  // The same push on the CPU, for tests: a cape-local point after skinning -> pushed point.
  function pushLocal(v){const TA=uni.kTorA.value,ta=uni.kTorB.value.clone().sub(TA);for(let pass=0;pass<2;pass++)for(let i=0;i<n;i++){const A=uni.kArmA.value[i],ab=uni.kArmB.value[i].clone().sub(A),R=uni.kArmR.value[i];
   const t=Math.max(0,Math.min(1,v.clone().sub(A).dot(ab)/Math.max(ab.lengthSq(),1e-6))),q=A.clone().addScaledVector(ab,t);
   const tt=Math.max(0,Math.min(1,q.clone().sub(TA).dot(ta)/Math.max(ta.lengthSq(),1e-6))),o=q.clone().sub(TA.clone().addScaledVector(ta,tt)),ad=ab.clone().normalize();o.addScaledVector(ad,-o.dot(ad));const ol=o.length();if(ol<1e-4)continue;const nn=o.multiplyScalar(1/ol);
   const d=v.clone().sub(q),sN=d.dot(nn),lat=d.clone().addScaledVector(nn,-sN),l=lat.length(),F=Math.max(uni.kFeather.value,1.3*Math.max(0,-sN));if(l>=R+F)continue;const outS=l<R?Math.sqrt(R*R-l*l):0;
   const sm=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);},lim=Math.min(uni.kShadow.value,ol),f0=Math.max(lim-uni.kFade.value,0.5*lim),w=(l<R?1:1-sm((l-R)/F))*(1-sm((-sN-f0)/Math.max(1e-6,lim-f0))),tgt=sN+(outS-sN)*w;if(sN<tgt&&sN>-lim)v.copy(q).add(lat).addScaledVector(nn,tgt);}return v;}
  // Test helpers: is a point (cape-local) in an arm's capsule or in its shadow toward the torso?
  function blocked(v,depth){const TA=uni.kTorA.value,ta=uni.kTorB.value.clone().sub(TA);for(let i=0;i<n;i++){const A=uni.kArmA.value[i],ab=uni.kArmB.value[i].clone().sub(A),R=uni.kArmR.value[i]-ARM_CLEAR*0.9/Math.max(1e-9,sc.x);
   const t=Math.max(0,Math.min(1,v.clone().sub(A).dot(ab)/Math.max(ab.lengthSq(),1e-6))),q=A.clone().addScaledVector(ab,t);
   const tt=Math.max(0,Math.min(1,q.clone().sub(TA).dot(ta)/Math.max(ta.lengthSq(),1e-6))),o=q.clone().sub(TA.clone().addScaledVector(ta,tt)),ad=ab.clone().normalize();o.addScaledVector(ad,-o.dot(ad));const ol=o.length();if(ol<1e-4)continue;const nn=o.multiplyScalar(1/ol);
   const d=v.clone().sub(q),sN=d.dot(nn),lat=d.clone().addScaledVector(nn,-sN),l=lat.length();if(l>=R)continue;if(sN<Math.sqrt(R*R-l*l)&&sN>-(depth!=null?Math.min(depth/Math.max(1e-9,sc.x),ol-BODY_FADE/Math.max(1e-9,sc.x)):Math.min(uni.kShadow.value,ol)))return i;}return -1;}
  return {update,pushLocal,blocked,segments:()=>segs.map(q=>({from:q.a.name,to:q.b.name,r:+q.r.toFixed(3)}))};
 }

 async function buildBank(ctx){
  const t0=performance.now();
  if(!ctx?.source?.clips)throw Error('Kinsmoke needs the Backspool bank (for its clip names)');
  const [buf,rig,loBuf,bsBuf,pack,roles]=await Promise.all([
   fetchOk(ASSETS.model).then(r=>r.arrayBuffer()),fetchOk(ASSETS.rig).then(r=>r.json()),
   fetchOk('assets/loadout/loadout_caped.fbx').then(r=>r.arrayBuffer()),fetchOk('assets/backspool/backspool.fbx').then(r=>r.arrayBuffer()),
   unzipJson('assets/loadout/runner/loadout_runner_clips.json.gz'),fetchOk('assets/loadout/runner/loadout_runner_roles.json').then(r=>r.json())]);
  const skin=new THREE.FBXLoader().parse(buf,'assets/characters/kinsmoke/'),loRest=new THREE.FBXLoader().parse(loBuf,'assets/loadout/'),bsRest=new THREE.FBXLoader().parse(bsBuf,'assets/backspool/');
  for(const n of ['Hips','Head','LeftArm','RightArm','LeftToeBase','RightToeBase'])if(!skin.getObjectByName('mixamorig'+n))throw Error('Kinsmoke rig lacks mixamorig'+n);
  normalise(skin);normalise(loRest);normalise(bsRest);
  // Face like Backspool (his model gets modelYaw); Loadout's rest pose faces the same way for the retarget.
  const fb=facing(bsRest);loRest.rotation.y=modelYaw+fb-facing(loRest);skin.rotation.y=modelYaw+fb-facing(skin);loRest.updateMatrixWorld(true);skin.updateMatrixWorld(true);
  // Centre him on his hips, not on his bounding box: the v2 cape's mass is behind him and would shift his body ~8 cm
  // forward of the capsule.
  {const hp=skin.getObjectByName('mixamorigHips').getWorldPosition(new THREE.Vector3());skin.position.x-=hp.x;skin.position.z-=hp.z;skin.updateMatrixWorld(true);stats.hipsRecentredM=+Math.hypot(hp.x,hp.z).toFixed(3);}
  const cape=splitCape(skin);
  const idleName=roles.flow?.idle||'Idle_Wait_A',runName=roles.locomotion?.run?.clip||'Mvm_Dash';
  const t1=performance.now(),src=n=>{const e=pack.clips?.[n];if(!e)throw Error('Runner clip missing: '+n);return THREE.AnimationClip.parse(e.clip);};
  const idle=MixamoRetarget.retargetClip(src(idleName),loRest,skin,{name:'kinsmoke_idle',inPlace:true});
  const run=MixamoRetarget.retargetClip(src(runName),loRest,skin,{name:'kinsmoke_run',inPlace:true});
  stats.retargetMs=Math.round(performance.now()-t1);stats.clips=2;stats.sources={idle:idleName,run:runName};
  // Only two clips: every Backspool clip name points at the idle so nothing that asks for one can fail.
  const clips={};for(const name of Object.keys(ctx.source.clips))clips[name]=idle;clips.kinsmoke_idle=idle;clips.kinsmoke_run=run;clips.idle=idle;clips.run=run;
  for(const o of [loRest,bsRest])o.traverse(x=>{if(x.isMesh){x.geometry.dispose();for(const m of [].concat(x.material))m.dispose();}});
  skin.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;}});
  const parent=cape.parent;parent.remove(cape);const foot=ctx.feet(skin);parent.add(cape);
  applyToonVisuals(skin);outlineCharacter(skin);skin.updateMatrixWorld(true);
  const ws=new THREE.Vector3();skin.traverse(o=>{if(o.userData.toonOutline){(o.parent||o).getWorldScale(ws);o.material.uniforms.width.value=.006/Math.max(1e-6,ws.x);}});
  capeMeshes=[];skin.traverse(o=>{if(o===cape||(o.userData.toonOutline&&o.geometry===cape.geometry))capeMeshes.push(o);});armPush=makeArmPush(skin,cape,capeMeshes);
  cloth=KinsmokeCapeCloth.create(skin,rig,{height:HEIGHT});
  bank={model:skin,mixer:new THREE.AnimationMixer(skin),clips,actions:{},foot,offset:0};
  stats.built=true;stats.buildMs=Math.round(performance.now()-t0);stats.capeBones=rig.chains.length*rig.rows;
  return bank;
 }

 // Animation director hook (first in resolveAnimation): Kinsmoke plays idle or run, nothing else.
 function animate(dt){
  if(!isActive()||!bank||model!==bank.model)return false;
  const sp=Math.hypot(s.vel.x,s.vel.z);stats.speed=+sp.toFixed(2);
  if(s.onGround&&sp>RUN_MIN){const ts=Math.max(.55,Math.min(1.6,sp/RUN_REF));stats.timeScale=+ts.toFixed(3);playAnim('kinsmoke_run',.18,false,ts);stats.anim='run';}
  else{playAnim('kinsmoke_idle',.25,false,1);stats.anim='idle';stats.timeScale=1;}
  return true;
 }

 // HUD written for Backspool: while Kinsmoke is active, hide his power panels and relabel; restore on leaving.
 const saved=new Map();
 function override(id,prop,value){const el=document.getElementById(id);if(!el)return;if(!saved.has(id+'.'+prop))saved.set(id+'.'+prop,{el,prop,value:el[prop]});if(el[prop]!==value)el[prop]=value;}
 function restoreHud(){for(const {el,prop,value} of saved.values())el[prop]=value;saved.clear();}
 function hud(){
  for(const id of ['tAfterstep','tThreadrail','tDriveModes','afterstepHUD','v02Resources'])override(id,'hidden',true);
  override('v02HeroName','textContent','KINSMOKE');
  override('actionHint','textContent','Kinsmoke · test mode · W to run');
  const mission=document.getElementById('missionText');if(mission&&/^BACKSPOOL\b/.test(mission.textContent))mission.textContent=mission.textContent.replace(/^BACKSPOOL\b/,'KINSMOKE');
 }
 // Called once a frame just before rendering, after every animation and pose pass.
 function beforeRender(dt){
  if(!isActive()){if(saved.size)restoreHud();return;}
  hud();
  if(!bank||model!==bank.model||!cloth||!(dt>0))return;
  cloth.update(dt,{speed:Math.hypot(s.vel.x,s.vel.z)});
  armPush?.update();
 }
 function heroChanged(id){if(id==='kinsmoke'&&cloth)cloth.reset();}
 window.kinsmokeHero={id:'kinsmoke',assets:ASSETS,buildBank,animate,beforeRender,heroChanged,isActive,
  cloth:()=>cloth,armPush:()=>armPush,capeBones:()=>bank?bank.model:null,
  state:()=>({...stats,active:isActive(),capeMeshes:capeMeshes.length,capeVisible:capeMeshes.length>0&&capeMeshes.every(m=>m.visible),cloth:cloth?.state()||null})};
})();
