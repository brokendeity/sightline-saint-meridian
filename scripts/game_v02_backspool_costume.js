/* Backspool costumes. "Default" is his own model; "Half mask (UE rig)" is a Tripo model whose UE5 skeleton was renamed to
 * mixamorig bones and rested in Backspool's T-pose offline (scripts/characters/backspool/convert_ue_costume_to_mixamo.py).
 * A costume only swaps his visual model: the switcher keeps hero/controller 'backspool', so every move, power, Threadrail
 * line, Afterstep exhaust (it rebinds to the new model's mixamorigHips) and the camera framing keep working. Every Backspool
 * clip is retargeted onto the costume once with game_mixamo_retarget.js, the same way Loadout is built.
 * The choice is remembered (localStorage 'backspoolCostume') and shown in the Hero tab while Backspool is the hero. */
(()=>{
 'use strict';
 const KEY='backspoolCostume',HEIGHT=1.82;
 const COSTUMES={
  default:{label:'Default',url:null},
  halfmask:{label:'Half mask (UE rig)',url:'assets/backspool/costumes/half-mask/backspool_halfmask_mixamo.fbx'}
 };
 let costume=read(),ui=null,applying=false,stats={built:{},lastError:null,applied:'backspool'};
 function read(){try{const v=localStorage.getItem(KEY);return COSTUMES[v]?v:'default';}catch(e){return 'default';}}
 function write(){try{localStorage.setItem(KEY,costume);}catch(e){}}
 function hero(){const st=window.characterState?.();return st?(st.hero||st.active):'sightline';}

 function normalise(skin){
  skin.updateMatrixWorld(true);let box=new THREE.Box3().setFromObject(skin);const size=box.getSize(new THREE.Vector3());
  skin.scale.setScalar(HEIGHT/size.y);skin.updateMatrixWorld(true);box.setFromObject(skin);const c=box.getCenter(new THREE.Vector3());
  skin.position.set(-c.x,-box.min.y,-c.z);skin.updateMatrixWorld(true);
 }
 function facing(skin){skin.updateMatrixWorld(true);const l=skin.getObjectByName('mixamorigLeftArm').getWorldPosition(new THREE.Vector3()),r=skin.getObjectByName('mixamorigRightArm').getWorldPosition(new THREE.Vector3());const f=l.sub(r).cross(new THREE.Vector3(0,1,0));return Math.atan2(f.x,f.z);}
 async function fetchOk(url){const r=await fetch(url);if(!r.ok)throw Error('Costume asset unavailable: '+url);return r;}

 async function buildBank(ctx){
  const id=ctx?.costume,spec=COSTUMES[id];
  if(!spec||!spec.url)throw Error('Unknown costume '+id);
  if(!ctx?.source?.clips)throw Error('Costume needs the Backspool bank to retarget from');
  const t0=performance.now();
  const base=spec.url.slice(0,spec.url.lastIndexOf('/')+1);
  const [buffer,restBuffer]=await Promise.all([fetchOk(spec.url).then(r=>r.arrayBuffer()),fetchOk('assets/backspool/backspool.fbx').then(r=>r.arrayBuffer())]);
  const skin=new THREE.FBXLoader().parse(buffer,base),rest=new THREE.FBXLoader().parse(restBuffer,'assets/backspool/');
  for(const n of ['Hips','Head','LeftArm','RightArm','LeftToeBase','RightToeBase'])if(!skin.getObjectByName('mixamorig'+n))throw Error('Costume rig lacks mixamorig'+n);
  normalise(skin);normalise(rest);
  const delta=facing(rest)-facing(skin);rest.rotation.y=modelYaw;skin.rotation.y=modelYaw+delta;rest.updateMatrixWorld(true);skin.updateMatrixWorld(true);
  const t1=performance.now(),clips={},done=new Map();
  for(const [name,clip] of Object.entries(ctx.source.clips)){
   let out=done.get(clip);
   if(!out){out=MixamoRetarget.retargetClip(clip,rest,skin,{name:clip.name});out.blendMode=clip.blendMode;done.set(clip,out);}
   clips[name]=out;
  }
  rest.traverse(o=>{if(o.isMesh){o.geometry.dispose();for(const m of [].concat(o.material))m.dispose();}});
  skin.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;}});
  const foot=ctx.feet(skin);
  // The outline is pushed out in the skinned mesh's own space, so divide the 6 mm by that mesh's world scale (this FBX
  // nests its mesh under a scaled node, unlike Loadout's, so skin.scale alone would make a metre-thick black shell).
  applyToonVisuals(skin);outlineCharacter(skin);skin.updateMatrixWorld(true);
  const ws=new THREE.Vector3();skin.traverse(o=>{if(o.userData.toonOutline){(o.parent||o).getWorldScale(ws);o.material.uniforms.width.value=.006/Math.max(1e-6,ws.x);}});
  stats.built[id]={ms:Math.round(performance.now()-t0),retargetMs:Math.round(performance.now()-t1),clips:done.size,
   facingDeltaDeg:+(delta*180/Math.PI).toFixed(1),bones:(()=>{let n=0;skin.traverse(o=>{if(o.isBone)n++;});return n;})()};
  return {model:skin,mixer:new THREE.AnimationMixer(skin),clips,actions:{},foot,offset:0};
 }

 async function set(id){
  if(!COSTUMES[id])throw Error('Unknown costume '+id);
  costume=id;write();syncUi();
  if(hero()!=='backspool')return costume;
  applying=true;syncUi();
  try{await characterSwitcher.refreshCostume();stats.lastError=null;}
  catch(e){stats.lastError=String(e&&e.message||e);}
  finally{applying=false;syncUi();}
  return costume;
 }
 function applied(key){stats.applied=key;syncUi();}

 // Hero tab: a Backspool section with the costume choice, shown only while Backspool is the hero.
 function buildUi(){
  const pane=document.getElementById('v02Pane-hero');if(!pane||ui)return;
  const section=document.createElement('section');section.id='backspoolCostumeOptions';section.hidden=true;section.setAttribute('aria-label','Backspool costume');
  section.innerHTML='<h3>Backspool · Costume</h3><div role="radiogroup" aria-label="Costume">'+
   Object.entries(COSTUMES).map(([id,c])=>'<button type="button" role="radio" data-costume="'+id+'" id="backspoolCostume-'+id+'">'+c.label+'</button>').join('')+
   '</div><p id="backspoolCostumeStatus" aria-live="polite"></p>';
  for(const e of ['mousedown','mouseup','pointerdown','keydown','keyup'])section.addEventListener(e,ev=>ev.stopPropagation());
  pane.append(section);ui={section,buttons:[...section.querySelectorAll('button[data-costume]')],status:section.querySelector('#backspoolCostumeStatus')};
  for(const b of ui.buttons)b.addEventListener('click',()=>{if(!applying)set(b.dataset.costume);});
  syncUi();
 }
 function syncUi(){
  if(!ui)buildUi();if(!ui)return;
  ui.section.hidden=hero()!=='backspool';
  for(const b of ui.buttons){const on=b.dataset.costume===costume;b.setAttribute('aria-checked',String(on));b.classList.toggle('active',on);b.disabled=applying;}
  ui.status.textContent=applying?'Loading costume…':stats.lastError?'Could not switch: '+stats.lastError:'Wearing: '+COSTUMES[costume].label;
 }
 setInterval(syncUi,250);

 window.backspoolCostume={current:()=>costume,set,buildBank,applied,list:()=>Object.entries(COSTUMES).map(([id,c])=>({id,label:c.label})),
  state:()=>({costume,applying,appliedBank:stats.applied,hero:hero(),built:{...stats.built},lastError:stats.lastError,uiVisible:!!ui&&!ui.section.hidden})};
})();
