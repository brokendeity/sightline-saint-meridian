// ---------- RAIL READ 2.0: honest trajectory preview and potential route markers ----------
// Uses the same swept collision tests as live flight; purely visual and never changes physics.
class RailReadSystem{
 constructor(){
  this.elapsed=0;this.status='SCAN IDLE';this.previewPressure=0;
  this.panel=$('railReadPanel');this.detail=$('railReadDetail');
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(6),3));
  this.route=new THREE.Line(g,new THREE.LineBasicMaterial({color:0x32f5e7,transparent:true,opacity:.86,depthTest:false}));
  this.route.renderOrder=10;this.route.visible=false;scene.add(this.route);
  this.endpoint=new THREE.Mesh(new THREE.RingGeometry(1.12,1.38,32),new THREE.MeshBasicMaterial({color:0x32f5e7,transparent:true,opacity:.87,depthTest:false,side:THREE.DoubleSide}));
  this.endpoint.renderOrder=11;this.endpoint.visible=false;scene.add(this.endpoint);
  this.markers=[];
  for(let i=0;i<9;i++){
   const mesh=new THREE.Mesh(new THREE.TorusGeometry(2.15,.14,6,24),new THREE.MeshBasicMaterial({color:i<5?0x32f5e7:0x8a58ff,transparent:true,opacity:.8,depthTest:false}));
   mesh.rotation.x=Math.PI/2;mesh.renderOrder=9;mesh.visible=false;scene.add(mesh);this.markers.push(mesh);
  }
 }
 setActive(on){
  this.panel.style.display=on?'block':'none';this.route.visible=false;this.endpoint.visible=false;
  for(const m of this.markers)m.visible=false;
  if(on){this.elapsed=.25;this.tick(.25)}
 }
 classify(obj,point,normal){
  if(!obj)return {name:point?'OPEN SKY RAIL':'NO LOCK',color:0x8496a9};
  if(obj.userData.enemy)return{name:obj.userData.enemy.guard?'GUARD STRIKE':obj.userData.enemy.surveillance?'CIVIC HALO SCANNER':'VECTOR STRIKE',color:0xff5375};
  if(obj.userData.reflective)return{name:'RAIN REFLECTION / DECOY',color:0xff5362};if(obj.userData.anchorGroup)return{name:obj.userData.anchorType||'SLINGSHOT ANCHOR',color:0x9b74ff};
  if(normal&&normal.y>.58)return{name:point.y<1.4?'GROUND ARRIVAL':'ROOFTOP ARRIVAL',color:0x32f5e7};
  return{name:'WALL IMPACT',color:0xffa45f};
 }
 tick(dt){
  if(!railRead||!gameActive)return;
  this.elapsed+=dt;if(this.elapsed<.12)return;this.elapsed=0;
  // Current central reticle, even without LT: reading must not secretly activate aim.
  camera.updateMatrixWorld();raycaster.setFromCamera(center,camera);
  const hits=raycaster.intersectObjects(rayTargets,false);const h=hits[0];
  const normal=h?(h.face?h.face.normal:new THREE.Vector3(0,1,0)).clone().transformDirection(h.object.matrixWorld).normalize():null;
  const point=h?h.point:!s.onGround&&inputAiming()?s.target:null,obj=h?h.object:null;
  const category=this.classify(obj,point,normal),distance=point?s.pos.distanceTo(point):0;
  const collision=point?sweptCharacterHit(s.pos,point):null;
  const blocked=!!(collision&&!isIntendedRailContact(collision,obj,point,normal));
  const hazard=blocked||category.name==='WALL IMPACT';
  const valid=!!point&&distance>2.5&&!blocked&&s.overloadRecovery<=0;
  const danger=blocked?'INTERCEPTED':category.name==='WALL IMPACT'?'BRACE REQUIRED':distance<2.5?'TOO CLOSE':s.overloadRecovery>0?'COOLING':'CLEAR';
  const predicted=s.pressure+distance*.055*payloadLoad()*(1+courier.debt*.003+courier.trauma*.002)*(1-courier.mastery*.12);
  const forecast=forecastArrival(point,obj,normal);const color=point?forecast.color:0x8192a5;
  const colorCSS='#'+color.toString(16).padStart(6,'0');
  this.previewPressure=Math.min(100,predicted);
  this.detail.innerHTML='<b>'+forecast.tier+' ARRIVAL</b> • '+Math.round(forecast.incoming)+' m/s<br>'+forecast.reason+'<br>SCAN '+(courier.scanAge>1.2?'PANIC / EXPOSURE RISING':'SHUTTER / LOW EXPOSURE')+'<br><b style="color:'+colorCSS+'">'+category.name+'</b>  ·  '+(point?Math.round(distance)+' m':'NO TARGET')+
   '<br>FLIGHT PATH: <b style="color:'+ (hazard?'#ff775e':'#32f5e7')+'">'+danger+'</b>'+
   (blocked?'<br>OBSTRUCTION: BUILDING '+Math.round(s.pos.distanceTo(collision.point))+' m':'')+
   '<br>EST. LOAD: <b>'+Math.min(100,Math.round(predicted))+'%</b>  '+(predicted>=100?'— OVERLOAD RISK':predicted>=85?'— BRACE ADVISED':'')+
   '<br>AFTER ARRIVAL: '+(obj?.userData.anchorGroup?'MOMENTUM BOOST / '+(obj.userData.anchorProfile?.vent?'VENT '+obj.userData.anchorProfile.vent:'STRAIN '+(obj.userData.anchorProfile?.strain||0)): category.name==='VECTOR STRIKE'?'KINETIC EXIT':category.name==='ROOFTOP ARRIVAL'?'LANDING':category.name==='WALL IMPACT'?'BRACE / CRASH':'FOLLOW TERRAIN');
  if(point){
   const pos=this.route.geometry.attributes.position;pos.setXYZ(0,s.pos.x,s.pos.y+1.2,s.pos.z);pos.setXYZ(1,point.x,point.y,point.z);pos.needsUpdate=true;
   this.route.geometry.computeBoundingSphere();this.route.material.color.setHex(color);this.route.visible=true;
   this.endpoint.position.copy(point).addScaledVector(normal||new THREE.Vector3(0,1,0),.12);
   this.endpoint.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),normal||new THREE.Vector3(0,1,0));
   this.endpoint.material.color.setHex(color);this.endpoint.visible=true;
  }else{this.route.visible=false;this.endpoint.visible=false}
  // Render only best unobstructed nearby route options; no 300-building wireframe clutter.
  const forward=cameraForward(cam.yaw,cam.pitch);
  const candidates=[];
  for(const a of anchors){const p=a.group.position,delta=new THREE.Vector3().subVectors(p,s.pos),d=delta.length();
   if(d<15||d>420||delta.normalize().dot(forward)<.15)continue;
   const test=sweptCharacterHit(s.pos,p);
   if(test)continue; // physics would intercept this rail
   candidates.push({p,type:'anchor',weight:d*(1.15-delta.dot(forward)*.28)});
  }
  for(const c of buildingColliders){if(c.destroyed)continue;const p=roofSpawnPoint(c).add(new THREE.Vector3(0,.37,0)),delta=p.clone().sub(s.pos),d=delta.length();
   if(d<18||d>360||delta.normalize().dot(forward)<.28)continue;
   const test=sweptCharacterHit(s.pos,p);
   if(test&&(test.collider.owner||test.collider)!==c)continue;
   if(test&&test.normal.y<.58)continue;
   candidates.push({p,type:'roof',weight:d*(1.12-delta.dot(forward)*.30)});
  }
  candidates.sort((a,b)=>a.weight-b.weight);
  const selected=[];let anchorCount=0,roofCount=0;
  for(const c of candidates){if(selected.length===9)break;
   if(c.type==='anchor'){if(anchorCount>=4)continue;anchorCount++}
   else{if(roofCount>=5)continue;roofCount++}
   selected.push(c);
  }
  for(let i=0;i<this.markers.length;i++){
   const mesh=this.markers[i],c=selected[i];mesh.visible=!!c;
   if(!c)continue;mesh.position.copy(c.p);mesh.position.y+=c.type==='roof'?.42:0;
   mesh.material.color.setHex(c.type==='anchor'?0x9b74ff:0x32f5e7);
   const r=c.type==='anchor'?1.3:1;mesh.scale.setScalar(r);
  }
 }
}
const railReadSystem=new RailReadSystem();

function toggleRailRead(){if(!sightlinePowersEnabled())return;if(!gameActive)return;railRead=!railRead;scanCourierVisor(railRead);
 $('visor').style.opacity=railRead?1:0;
 scene.fog.density=railRead?.0017:importedCity.status==='ready'?.00108:.00135;
 railReadSystem.setActive(railRead);
 showBanner(railRead?'RAIL READ ON':'RAIL READ OFF',railRead?'REAL-TIME PATH / HAZARD / ANCHOR ANALYSIS':'STANDARD VISION RESTORED');
}
function doBrace(){if(!sightlinePowersEnabled())return;
 if(!gameActive||[P.IMPACT,P.UNCONTROLLED].includes(s.mode))return;
 const guarding=armTimedBrace();
 if(s.mode===P.TRANSIT&&!s.braceUsed){
  s.brace=true;s.braceUsed=true;
  s.pressure=Math.max(0,s.pressure-32);courier.debt=Math.max(0,courier.debt-12);courier.trauma=Math.max(0,courier.trauma-2);s.overloadTimer=0;
  rumble(60,.18,.1);showBanner('ARRIVAL BRACE','ONE VENT PER RAIL · -32 PRESSURE · TIMED SHOT GUARD');
 }else if(guarding){rumble(35,.1,.06);showBanner('KINETIC GUARD','TIME Q / LB JUST BEFORE A SHOT CONNECTS');}
}

function setInputMode(mode){if(lastInputMode===mode)return;lastInputMode=mode;if($('inputMode'))$('inputMode').textContent=mode}
function controllerName(id){if(!id)return'GENERIC';const n=id.replace(/\s*\([^)]*\)\s*/g,' ').replace(/\s+/g,' ').trim();return n.length>34?n.slice(0,31)+'…':n}
function updateControllerUI(){const st=$('controllerStatus'),ph=$('padHud');if(!st||!ph)return;if(pad.connected){const n=controllerName(pad.id),map=pad.mapping==='standard'?'STANDARD MAP':'UNSUPPORTED MAP — USE KEYBOARD';st.classList.add('connected');st.textContent='CONTROLLER DETECTED: '+n+' // '+map+' // A / Cross starts.';ph.textContent=n}else{st.classList.remove('connected');st.textContent='CONTROLLER: scanning automatically… Press a button on the controller if your browser has not exposed it yet.';ph.textContent='NONE'}}
function findGamepad(){const list=navigator.getGamepads?navigator.getGamepads():[];if(pad.index!==null&&list[pad.index])return list[pad.index];for(const gp of list)if(gp)return gp;return null}
function rumble(duration=100,strong=.35,weak=.18){try{const gp=findGamepad(),act=gp&&(gp.vibrationActuator||(gp.hapticActuators&&gp.hapticActuators[0]));if(!act)return;if(act.playEffect)act.playEffect('dual-rumble',{duration,strongMagnitude:strong,weakMagnitude:weak}).catch(()=>{});else if(act.pulse)act.pulse(Math.max(strong,weak),duration)}catch(_){}}
function clearInput(){resetMechanicInput();lastMouseX=lastMouseY=null;Object.keys(keys).forEach(k=>keys[k]=false);mouse.r=mouse.l=false;Object.keys(input.actions).forEach(k=>input.actions[k]=typeof input.actions[k]==='boolean'?false:0);pad.jumpQueued=pad.fireQueued=false;document.body.classList.remove('aim');if(s.mode===P.AIM)setMode(s.onGround?P.GROUND:P.AIR)}
let freeMouse=false,lastMouseX=null,lastMouseY=null;
