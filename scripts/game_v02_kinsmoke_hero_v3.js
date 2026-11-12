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
 const ASSETS={model:'assets/characters/kinsmoke/kinsmoke_caped_v3.fbx',rig:'assets/characters/kinsmoke/kinsmoke_cape_rig_v3.json',version:3};
 let bank=null,cloth=null,capeMeshes=[],stats={built:false,buildMs:0,retargetMs:0,clips:0,anim:null,speed:0,timeScale:1};
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
  capeMeshes=[];skin.traverse(o=>{if(o===cape||(o.userData.toonOutline&&o.geometry===cape.geometry))capeMeshes.push(o);});
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
 }
 function heroChanged(id){if(id==='kinsmoke'&&cloth)cloth.reset();}
 window.kinsmokeHero={id:'kinsmoke',assets:ASSETS,buildBank,animate,beforeRender,heroChanged,isActive,
  cloth:()=>cloth,capeBones:()=>bank?bank.model:null,
  state:()=>({...stats,active:isActive(),capeMeshes:capeMeshes.length,capeVisible:capeMeshes.length>0&&capeMeshes.every(m=>m.visible),cloth:cloth?.state()||null})};
})();
