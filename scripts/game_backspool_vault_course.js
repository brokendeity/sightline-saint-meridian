/* Optional in-world vault lane. It observes normal traversal; it never triggers an action. */
const backspoolVaultCourse=(()=>{
 const specs=[
  {id:'barrier',name:'LOW BARRIER',z:-14,width:5,depth:.65,top:.92,color:0x142631},
  {id:'planter',name:'PLANTER',z:-40,width:5,depth:1.0,top:1.10,color:0x1a3037},
  {id:'cargo',name:'CARGO CASES',z:-66,width:5,depth:.65,top:1.23,color:0x202c39}
 ];
 const root=new THREE.Group();root.name='Backspool / automatic vault test';
 const geometry=new THREE.BoxGeometry(1,1,1),materials={},objects=[],owners=[],labels=[];
 let ready=false,error=null,attempt=0,run=null,lastAction=null,lastFlowId=0,autoStarted=false;
 const autoOpen=new URLSearchParams(location.search).get('vaultcourse')==='1';
 const button=document.createElement('button');button.id='vaultCourseStart';button.textContent='Start vault test';button.style.minHeight='44px';
 const status=document.createElement('small');status.id='vaultCourseStatus';status.style.display='block';status.style.whiteSpace='normal';status.textContent='Flow ON + forward · no Jump';
 $('afterstepHUD').append(button,status);button.addEventListener('click',e=>{e.stopPropagation();start();});
 function mat(key,color,emissive=false){return materials[key]||(materials[key]=emissive?new THREE.MeshBasicMaterial({color,toneMapped:false}):new THREE.MeshStandardMaterial({color,roughness:.7,metalness:.22}));}
 function box(name,x,y,z,w,h,d,material){const m=new THREE.Mesh(geometry,material);m.name=name;m.position.set(x,y,z);m.scale.set(w,h,d);m.receiveShadow=true;root.add(m);objects.push(m);return m;}
 function sign(text,x,y,z,width){const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=192;const ctx=canvas.getContext('2d');ctx.fillStyle='#14242d';ctx.fillRect(0,0,1024,192);ctx.fillStyle='#387580';ctx.fillRect(20,20,8,152);ctx.fillStyle='#8caaa9';ctx.textAlign='left';ctx.textBaseline='middle';ctx.font='500 28px sans-serif';ctx.fillText('SAINT MERIDIAN  /  PUBLIC WORKS',52,49);ctx.fillStyle='#c4c8b5';ctx.font='600 39px sans-serif';ctx.fillText(text,52,121);const texture=new THREE.CanvasTexture(canvas);texture.minFilter=THREE.LinearFilter;const m=new THREE.Mesh(new THREE.PlaneGeometry(width,width*192/1024),new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide}));m.position.set(x,y,z);root.add(m);labels.push(m);return m;}
 function build(){if(ready||error||!gameReady||!window.roadNetworkState?.().ready)return false;
  const bounds=new THREE.Box3(new THREE.Vector3(-4,.401,-80),new THREE.Vector3(4,2,10));
  if(allColliders(bounds.min,bounds.max).some(c=>!c.owner?.destroyed&&c.box.intersectsBox(bounds))){error='VAULT LANE AREA BLOCKED';status.textContent=error;return false;}
  scene.add(root);
  // All three obstacles use the same physical bounds as their visible bodies.
  for(const [i,o]of specs.entries()){
   const mesh=box('Vault lane / '+o.name,0,(.4+o.top)/2,o.z,o.width,o.top-.4,o.depth,mat(o.id,o.color));
   const owner={id:'vault-test-'+o.id,mesh,box:new THREE.Box3(new THREE.Vector3(-o.width/2,.4,o.z-o.depth/2),new THREE.Vector3(o.width/2,o.top,o.z+o.depth/2)),type:'vault-test',damageCount:0};owners.push(owner);propColliders.push(owner);cameraObstacles.push(mesh);walkables.push(mesh);rayTargets.push(mesh);
   const front=o.z+o.depth/2;
   const trim=mat('frame',0x34424b),dark=mat('recess',0x0b191f),cyan=mat('cyan',0x367d87,true),amber=mat('hardware',0x9a8152);
   box('Municipal furniture / inset panel',0,(.4+o.top)/2,front+.003,o.width-.24,o.top-.53,.006,dark);
   box('Municipal furniture / metal cap',0,o.top-.025,o.z,o.width,.05,o.depth,trim);
   for(const x of[-2.38,2.38]){box('Municipal furniture / corner plate',x,(.4+o.top)/2,front+.009,.12,o.top-.4,.018,trim);box('Municipal furniture / inset beacon',x,o.top-.13,front+.019,.055,.09,.008,cyan);}
   if(o.id==='barrier')for(const x of[-1.55,0,1.55]){box('Security barrier / panel rib',x,(.4+o.top)/2,front+.009,.035,o.top-.51,.012,trim);box('Security barrier / amber reflector',x,.53,front+.018,.27,.035,.007,amber);}
   if(o.id==='planter'){
    box('Architectural planter / soil',0,o.top-.035,o.z,o.width-.26,.025,o.depth-.2,mat('soil',0x111e19));
    // Low clipped planting remains below the vault contact plane.
    for(let j=0;j<19;j++)box('Architectural planter / clipped foliage',-2.16+j*.24,o.top-.017,o.z+Math.sin(j*2.1)*.2,.2,.032,.25,mat('foliage',0x294336));
    for(const x of[-1.65,-.55,.55,1.65])box('Architectural planter / panel seam',x,(.4+o.top)/2,front+.008,.018,o.top-.52,.008,trim);
   }
   if(o.id==='cargo')for(const x of[-1.65,0,1.65]){box('Logistics case / dividing frame',x,(o.top+.4)/2,front+.009,.065,o.top-.4,.014,trim);box('Logistics case / recessed handle',x+.53,o.top-.2,front+.014,.28,.07,.008,amber);}
   sign(['01  SERVICE BARRIER','02  RAIN GARDEN','03  MERIDIAN LOGISTICS'][i],4.65,1.12,o.z+.2,2.4);
   box('Public works / sign pedestal',4.65,.75,o.z+.17,.075,.7,.075,trim);
   // Sparse, non-emissive pavement inlays follow the plaza's existing palette.
   for(const z of[o.z+8,o.z+5])for(const side of[-1,1]){const arrow=box('Service walk / pavement inlay',side*.22,.409,z,.045,.006,.4,mat('paint',0x60777a));arrow.rotation.y=side*.7;}
  }
  for(const x of[-3.35,3.35])for(let z=7;z>-79;z-=6)box('Service walk / inset marker',x,.407,z,.045,.005,.7,mat('paint',0x60777a));
  sign('SERVICE WALK  /  ACCESS 04',-4.8,1.35,3,3.1);sign('SERVICE WALK  /  EXIT',-5.5,1.35,-79,2.8);
  for(const [x,z]of[[-4.8,3],[-5.5,-79]])box('Public works / sign pedestal',x,.92,z-.025,.09,1.04,.09,mat('frame',0x34424b));
  const batches=new Map();for(const mesh of objects){if(owners.some(o=>o.mesh===mesh))continue;if(!batches.has(mesh.material))batches.set(mesh.material,[]);batches.get(mesh.material).push(mesh);}for(const [material,meshes]of batches){const batch=new THREE.InstancedMesh(geometry,material,meshes.length);meshes.forEach((m,i)=>{m.updateMatrix();batch.setMatrixAt(i,m.matrix);root.remove(m);});batch.instanceMatrix.needsUpdate=true;root.add(batch);}root.updateMatrixWorld(true);ready=true;actionWorld.markNavigationDirty();return true;
 }
 function start(){if(!ready||characterState().active!=='backspool'||characterState().busy)return false;
  startGame(false);clearInput();backspoolPowers.interrupt('VAULT TEST');backspoolEncounters.clear();backspoolCombat.reset('VAULT TEST');
  s.pos.set(0,.42,8);s.vel.set(0,0,0);s.onGround=true;setMode(P.GROUND);s.yaw=cam.yaw=cam.targetYaw=0;cam.pitch=cam.targetPitch=-.08;cam.focus.copy(s.pos).add(new THREE.Vector3(0,1.32,0));camera.position.copy(cam.focus).addScaledVector(cameraForward(0,-.08),-4.25);camera.lookAt(cam.focus);camera.updateMatrixWorld(true);
  mixer.stopAllAction();currentAnim='';currentAction=null;backspoolFlow.playSource('relaxedIdle',0,true,0);characterRoot.position.copy(s.pos);characterRoot.updateMatrixWorld(true);
  lastFlowId=backspoolFlowState().events.at(-1)?.id||0;lastAction=null;run={id:++attempt,jumpUsed:false,cleared:[],starts:[],began:threadrailGame.state().clock,complete:false};status.textContent='Tap Shift / L3 · hold forward · no Jump';return true;
 }
 function manualJump(){if(run&&gameActive&&characterState().active==='backspool'&&!run.complete)run.jumpUsed=true;}
 $('tJump')?.addEventListener('pointerdown',manualJump,true);
 function tick(){build();button.disabled=!ready;button.hidden=characterState().active!=='backspool';status.hidden=button.hidden;
  if(autoOpen&&!autoStarted&&ready&&characterState().active==='backspool'&&!characterState().busy){autoStarted=true;start();}
  if(!run||!gameActive||characterState().active!=='backspool')return;
  if(findGamepad()?.buttons?.[0]?.pressed)manualJump();
  const flow=backspoolFlowState(),traversal=backspoolTraversalState();
  const active=flow.action==='obstacleFlip'?'obstacleFlip':traversal.action;
  const event=flow.events.filter(e=>e.id>lastFlowId&&e.kind==='start'&&e.action==='obstacleFlip').at(-1);lastFlowId=flow.events.at(-1)?.id||lastFlowId;
  if(event||active==='vault'&&lastAction!=='vault'){
   const nearest=specs.filter(o=>!run.cleared.includes(o.id)&&Math.abs(s.pos.x)<o.width/2+.5&&Math.abs(s.pos.z-o.z)<6).sort((a,b)=>Math.abs(a.z-s.pos.z)-Math.abs(b.z-s.pos.z))[0];
   if(nearest&&!run.starts.some(x=>x.obstacle===nearest.id))run.starts.push({obstacle:nearest.id,action:event?'obstacleFlip':'vault',jumpHeld:run.jumpUsed,position:s.pos.toArray(),eventId:event?.id||null,completedBefore:traversal.completed,completed:false,failed:false});
  }
  for(const entry of run.starts){if(entry.completed||entry.failed)continue;if(entry.action==='obstacleFlip'){const end=flow.events.find(e=>e.id>entry.eventId&&['complete','blocked','interrupt'].includes(e.kind)&&(!e.action||e.action==='obstacleFlip'));if(end){entry.completed=end.kind==='complete';entry.failed=!entry.completed;}}else{entry.completed=traversal.completed>entry.completedBefore;if(!entry.completed&&lastAction==='vault'&&active!=='vault')entry.failed=true;}}
  lastAction=active;
  for(const o of specs)if(!run.cleared.includes(o.id)&&run.starts.some(x=>x.obstacle===o.id&&x.completed&&!x.failed)&&s.onGround&&Math.abs(s.pos.x)<o.width/2+.5&&s.pos.z<o.z-o.depth/2-.6)run.cleared.push(o.id);
  run.complete=run.cleared.length===specs.length;
  status.textContent=(run.jumpUsed?'Jump used · ':'Automatic · ')+run.cleared.length+'/3'+(run.complete?' · lane complete':active?' · '+active:' · Flow + forward');
 }
 function state(){return{ready,error,location:'Central plaza, straight ahead from spawn',start:[0,.42,8],obstacles:specs.map(o=>({...o})),run:run?JSON.parse(JSON.stringify(run)):null,drawCalls:ready?root.children.length:0};}
 const priorText=window.render_game_to_text;window.render_game_to_text=()=>{const r=JSON.parse(priorText());r.vaultCourse=state();return JSON.stringify(r);};
 return{start,tick,state,noteJump:manualJump};
})();
window.backspoolVaultCourse=backspoolVaultCourse;
