/* Loadout, the third hero. He runs on Backspool's controller and moveset (every Backspool clip retargeted onto his
 * own skeleton with game_mixamo_retarget.js) but has none of Backspool's powers: the switcher reports him as
 * characterState().hero==='loadout' while active stays 'backspool', and the power entry points ask blocksPowers().
 * His fur cape is cloth (game_loadout_cape_cloth.js) and can be switched on or off in the menu's Hero tab.
 * The cloth only rotates cape bones after all posing and before rendering; it never moves the actor. */
(()=>{
 'use strict';
 const ORDER=['sightline','backspool','loadout'],CAPE_KEY='loadoutCape',HEIGHT=1.82;
 let bank=null,cloth=null,capeMeshes=[],capeOn=readCape(),ui=null,stats={built:false,buildMs:0,retargetMs:0,clips:0};
 function readCape(){try{return localStorage.getItem(CAPE_KEY)!=='off';}catch(e){return true;}}
 function writeCape(){try{localStorage.setItem(CAPE_KEY,capeOn?'on':'off');}catch(e){}}
 function hero(){const st=window.characterState?.();return st?(st.hero||st.active):'sightline';}
 const isActive=()=>hero()==='loadout';
 async function fetchOk(url){const r=await fetch(url);if(!r.ok)throw Error('Loadout asset unavailable: '+url);return r;}

 // Same normalisation as the game's Backspool loader: 1.82 m tall, feet on the floor, centred.
 function normalise(skin){
  skin.updateMatrixWorld(true);let box=new THREE.Box3().setFromObject(skin);const size=box.getSize(new THREE.Vector3());
  skin.scale.setScalar(HEIGHT/size.y);skin.updateMatrixWorld(true);box.setFromObject(skin);const c=box.getCenter(new THREE.Vector3());
  skin.position.set(-c.x,-box.min.y,-c.z);skin.updateMatrixWorld(true);
 }
 // Facing from the arms: a character facing +Z has his left arm at +X.
 function facing(skin){skin.updateMatrixWorld(true);const l=skin.getObjectByName('mixamorigLeftArm').getWorldPosition(new THREE.Vector3()),r=skin.getObjectByName('mixamorigRightArm').getWorldPosition(new THREE.Vector3());const f=l.sub(r).cross(new THREE.Vector3(0,1,0));return Math.atan2(f.x,f.z);}

 // The FBX is one skinned mesh with a LoadoutBody and a LoadoutCape group. Split the cape into its own mesh on the same
 // skeleton so it (and its outline) can be hidden, and so the foot sampler never mistakes the cape hem for feet.
 function splitCape(skin){
  let body=null;skin.traverse(o=>{if(o.isSkinnedMesh&&Array.isArray(o.material)&&o.material.some(m=>m.name==='LoadoutCape'))body=o;});
  if(!body)throw Error('Loadout cape material missing');
  const g=body.geometry,capeIndex=body.material.findIndex(m=>m.name==='LoadoutCape');
  const pick=keep=>{
   const ranges=g.groups.filter(gr=>keep(gr.materialIndex)).map(gr=>[gr.start,gr.count]),out=new THREE.BufferGeometry();
   if(g.index){const idx=[];for(const [st,c] of ranges)for(let i=st;i<st+c;i++)idx.push(g.index.getX(i));for(const [n,a] of Object.entries(g.attributes))out.setAttribute(n,a);out.setIndex(idx);}
   else{const total=ranges.reduce((t,[,c])=>t+c,0);for(const [n,a] of Object.entries(g.attributes)){const k=a.itemSize,arr=new a.array.constructor(total*k);let at=0;for(const [st,c] of ranges){arr.set(a.array.subarray(st*k,(st+c)*k),at*k);at+=c;}out.setAttribute(n,new THREE.BufferAttribute(arr,k,a.normalized));}}
   out.computeBoundingBox();out.computeBoundingSphere();return out;
  };
  const capeMat=body.material[capeIndex],bodyMats=body.material.filter((_,i)=>i!==capeIndex);
  const cape=new THREE.SkinnedMesh(pick(i=>i===capeIndex),capeMat);cape.name='LoadoutCape';
  body.geometry=pick(i=>i!==capeIndex);body.material=bodyMats.length===1?bodyMats[0]:bodyMats;g.dispose();
  cape.position.copy(body.position);cape.quaternion.copy(body.quaternion);cape.scale.copy(body.scale);
  body.parent.add(cape);cape.bind(body.skeleton,body.bindMatrix);
  return cape;
 }

 async function buildBank(ctx){
  const t0=performance.now();
  if(!ctx?.source?.clips)throw Error('Loadout needs the Backspool bank to retarget from');
  const [buffer,rig,restBuffer]=await Promise.all([fetchOk('assets/loadout/loadout_caped.fbx').then(r=>r.arrayBuffer()),fetchOk('assets/loadout/loadout_cape_rig.json').then(r=>r.json()),fetchOk('assets/backspool/backspool.fbx').then(r=>r.arrayBuffer())]);
  const skin=new THREE.FBXLoader().parse(buffer,'assets/loadout/'),rest=new THREE.FBXLoader().parse(restBuffer,'assets/backspool/');
  normalise(skin);normalise(rest);
  // Face the same way as Backspool: his model gets modelYaw, Loadout gets it plus their difference in rest facing.
  const delta=facing(rest)-facing(skin);rest.rotation.y=modelYaw;skin.rotation.y=modelYaw+delta;rest.updateMatrixWorld(true);skin.updateMatrixWorld(true);
  const cape=splitCape(skin);
  // Every Backspool clip, retargeted once (bank names can share a clip object).
  const t1=performance.now(),clips={},done=new Map();
  for(const [name,clip] of Object.entries(ctx.source.clips)){
   let out=done.get(clip);
   if(!out){out=MixamoRetarget.retargetClip(clip,rest,skin,{name:clip.name});out.blendMode=clip.blendMode;done.set(clip,out);}
   clips[name]=out;
  }
  stats.retargetMs=Math.round(performance.now()-t1);stats.clips=done.size;
  rest.traverse(o=>{if(o.isMesh){o.geometry.dispose();for(const m of [].concat(o.material))m.dispose();}});
  skin.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
  const parent=cape.parent;parent.remove(cape);const foot=ctx.feet(skin);parent.add(cape);
  applyToonVisuals(skin);outlineCharacter(skin);skin.traverse(o=>{if(o.userData.toonOutline)o.material.uniforms.width.value=.006/skin.scale.x;});
  capeMeshes=[];skin.traverse(o=>{if(o===cape||(o.userData.toonOutline&&o.geometry===cape.geometry))capeMeshes.push(o);});
  cloth=LoadoutCapeCloth.create(skin,rig,{height:HEIGHT});
  bank={model:skin,mixer:new THREE.AnimationMixer(skin),clips,actions:{},foot,offset:0};
  applyCape();stats.built=true;stats.buildMs=Math.round(performance.now()-t0);
  return bank;
 }

 function applyCape(){
  for(const m of capeMeshes)m.visible=capeOn;
  if(cloth&&capeOn)cloth.reset();
  if(ui){ui.toggle.setAttribute('aria-checked',String(capeOn));ui.toggle.textContent='Cape · '+(capeOn?'On':'Off');}
 }
 function setCape(on){capeOn=!!on;writeCape();applyCape();return capeOn;}

 // Hero tab: a Loadout section with the cape switch, shown only while Loadout is the active hero.
 function buildUi(){
  const pane=document.getElementById('v02Pane-hero');if(!pane||ui)return;
  const section=document.createElement('section');section.id='loadoutOptions';section.hidden=true;section.setAttribute('aria-label','Loadout options');
  section.innerHTML='<h3>Loadout</h3><p>Backspool\'s moves, none of his powers.</p><button id="loadoutCapeToggle" type="button" role="switch"></button>';
  for(const e of ['mousedown','mouseup','pointerdown','keydown','keyup'])section.addEventListener(e,ev=>ev.stopPropagation());
  pane.append(section);ui={section,toggle:section.querySelector('#loadoutCapeToggle')};
  ui.toggle.addEventListener('click',()=>setCape(!capeOn));applyCape();
 }
 function syncUi(){if(!ui)buildUi();if(ui)ui.section.hidden=!isActive();}
 setInterval(syncUi,250);

 function heroChanged(id){syncUi();if(id==='loadout')applyCape();}
 function nextHero(){const i=ORDER.indexOf(hero());return ORDER[(i+1)%ORDER.length];}

 // HUD written for Backspool: while Loadout is active, hide his power panels and relabel; restore on leaving.
 const saved=new Map();
 function override(id,prop,value){const el=document.getElementById(id);if(!el)return;if(!saved.has(id+'.'+prop))saved.set(id+'.'+prop,{el,prop,value:el[prop]});if(el[prop]!==value)el[prop]=value;}
 function restoreHud(){for(const {el,prop,value} of saved.values())el[prop]=value;saved.clear();}
 function hud(){
  for(const id of ['tAfterstep','tThreadrail','tDriveModes','afterstepHUD','v02Resources'])override(id,'hidden',true);
  override('v02HeroName','textContent','LOADOUT');
  override('actionHint','textContent','Shift/L3 Flow · C evade');
  const mission=document.getElementById('missionText');if(mission&&/^BACKSPOOL\b/.test(mission.textContent))mission.textContent=mission.textContent.replace(/^BACKSPOOL\b/,'LOADOUT');
 }
 // Called once a frame just before rendering, after every animation and pose pass.
 function beforeRender(dt){
  if(!isActive()){if(saved.size)restoreHud();return;}
  hud();
  if(!bank||model!==bank.model||!cloth||!capeOn||!(dt>0))return;
  cloth.update(dt);
 }
 window.loadoutHero={id:'loadout',buildBank,beforeRender,heroChanged,nextHero,blocksPowers:isActive,setCape,
  capeEnabled:()=>capeOn,state:()=>({...stats,active:isActive(),capeOn,capeVisible:capeMeshes.length>0&&capeMeshes.every(m=>m.visible),capeMeshes:capeMeshes.length,cloth:cloth?.state()||null})};
})();
