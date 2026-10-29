/* Bounded scenic traffic and visitors, independent of encounter ownership. */
window.verticalWorldLife=(()=>{
 const root=new THREE.Group();root.name='V02 public world life';scene.add(root);
 const state={ready:false,loading:false,error:null,aircraft:0,visitors:0,source:'Shared Blender hover vehicles and existing street pedestrian geometry',blockedMoves:0,events:[],eventId:0};
 let flow,airAssets,ambientDefinition,clock=0;const bindings=[],people=[],templates=[],materialPool=new Map();
 const load=url=>new Promise((resolve,reject)=>new THREE.GLTFLoader().load(url,g=>resolve(g.scene),undefined,reject));
 const fetchJSON=async file=>{
  if(file!=='ambient_routes.json'){
   const response=await fetch('assets/city/vertical-v02/world-life/'+file);
   if(!response.ok)throw Error(response.status+' '+file);return response.json();
  }
  const response=await fetch('assets/city/vertical-v02/furnished-public-rooms/runtime/ambient_routes.json');if(!response.ok)throw Error('Public-room routes '+response.status);
  const bytes=new Uint8Array(await response.arrayBuffer());
  const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(x=>x.toString(16).padStart(2,'0')).join('');
  if(digest!=='48a4954e744b1b7d26f067011c14b4c60584076d72c121345fcce24fc65ffa00')throw Error('Public-room route version mismatch');
  return JSON.parse(new TextDecoder().decode(bytes));
 };
 const previousCityState=window.verticalCityState;
 function event(kind,detail={}){state.events.push({id:++state.eventId,kind,clock,...detail});if(state.events.length>80)state.events.shift();}
 function routePosition(route,distance){const points=route.points;let remaining=((distance%route.length)+route.length)%route.length;for(let i=0;i<points.length;i++){const a=new THREE.Vector3(...points[i]),b=new THREE.Vector3(...points[(i+1)%points.length]),length=a.distanceTo(b);if(remaining<=length)return{position:a.lerp(b,length?remaining/length:0),next:(i+1)%points.length};remaining-=length;}return{position:new THREE.Vector3(...points[0]),next:1};}
 function makeVisitor(route,index){
  const source=streetAtmosphere.walkers[(index+people.length)%streetAtmosphere.walkers.length];if(!source)throw Error('Existing street pedestrian appearance unavailable');
  const group=source.group.clone(true),visual=new THREE.Group();group.name=route.id+' / visitor '+index;group.visible=true;visual.name='Existing pedestrian visual';
  const left=group.children[source.group.children.indexOf(source.left)],right=group.children[source.group.children.indexOf(source.right)];group.remove(left,right);group.add(left,right);group.rotation.set(0,0,0);group.scale.setScalar(1.12);group.position.set(0,0,0);left.rotation.x=right.rotation.x=0;group.updateMatrixWorld(true);
  const sole=new THREE.Box3().setFromObject(group).min.y/1.12;for(const child of group.children)child.position.y-=sole;visual.add(group);root.add(visual);
  const initial=routePosition(route,index*route.length/route.count),person={id:route.id+'-'+index,route,visual,group,left,right,leftHome:left.position.y,rightHome:right.position.y,target:initial.next,dwell:0,phase:index*2,walkBlend:0,walked:0,arrivals:0,blocked:0,lastReason:null,yielding:false,yieldedMetres:0};visual.position.copy(initial.position);people.push(person);return person;
 }
 async function build(){if(state.ready||state.loading||state.error||!window.verticalDistrictState?.().ready||!window.verticalTransitState?.().ready)return;state.loading=true;
  try{const[definition,assets,ambient]=await Promise.all([fetchJSON('air_routes.json'),fetchJSON('air_assets.json'),fetchJSON('ambient_routes.json')]);airAssets=assets;ambientDefinition=ambient;flow=createV02AirTraffic(THREE,definition);
   const agents=flow.lanes.flatMap(lane=>lane.agents.map(agent=>({lane,agent})));const models=await Promise.all(assets.models.map(m=>load(m.url)));
   models.forEach((model,variant)=>{templates.push(model);model.updateMatrixWorld(true);const members=agents.filter(a=>a.agent.variant===variant);model.traverse(o=>{if(!o.isMesh)return;let material=o.material;if(materialPool.has(material.name)){o.material=materialPool.get(material.name);material.dispose();material=o.material;}else materialPool.set(material.name,material);
     const mesh=new THREE.InstancedMesh(o.geometry,material,members.length);mesh.name='V02 shared air '+assets.models[variant].id+' / '+o.name;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.frustumCulled=false;root.add(mesh);bindings.push({mesh,members,local:o.matrixWorld.clone()});});});
   for(const route of ambient.routes)for(let i=0;i<route.count;i++)makeVisitor(route,i);
   state.aircraft=agents.length;state.visitors=people.length;state.ready=true;state.loading=false;event('ready');present();
  }catch(error){state.error=String(error);state.loading=false;console.error('V02 world life failed',error);}
 }
 function animate(person,moved,dt=1/60){person.phase+=moved*5.8;person.walkBlend+=((moved>1e-6?1:0)-person.walkBlend)*(1-Math.exp(-10*dt));const angle=Math.sin(person.phase)*.32*person.walkBlend;person.left.rotation.x=angle;person.right.rotation.x=-angle;person.left.position.y=person.leftHome+.045*person.walkBlend*Math.max(0,Math.cos(person.phase));person.right.position.y=person.rightHome+.045*person.walkBlend*Math.max(0,-Math.cos(person.phase));
  const left=person.left.position.y-.28*Math.abs(Math.cos(angle))-.06*Math.abs(Math.sin(angle)),right=person.right.position.y-.28*Math.abs(Math.cos(angle))-.06*Math.abs(Math.sin(angle));person.group.position.y=-Math.min(left,right)*1.12;
 }
 function physicalClear(from,to){
  // These admitted routes are level V02 public floors. Check their current
  // registered support directly instead of casting through unrelated roofs.
  if(Math.abs(from.y-to.y)>.001)return false;
  for(const x of[-.29,.29])for(const z of[-.29,.29])if(Math.abs(verticalDistrict.surfaceFeetAt(to.x+x,to.z+z,to.y+.42)-to.y-.42)>.02)return false;
  for(const c of allColliders(from,to)){if(c.destroyed||c.owner?.destroyed)continue;const box=c.box;if(box.max.y<=from.y+.02||box.min.y>=from.y+1.8)continue;let enter=0,leave=1;
   for(const axis of['x','z']){const delta=to[axis]-from[axis],min=box.min[axis]-.32,max=box.max[axis]+.32;if(Math.abs(delta)<1e-9){if(from[axis]<min||from[axis]>max){enter=2;break;}}else{const a=(min-from[axis])/delta,b=(max-from[axis])/delta;enter=Math.max(enter,Math.min(a,b));leave=Math.min(leave,Math.max(a,b));}}
   if(enter<=leave&&enter<=1&&leave>=0)return false;
  }return true;
 }
 // Clearance is a locomotion request on the same supported floor, never a
 // camera teleport, NPC warp, visibility fade or impulse applied to the hero.
 function nearHero(point){return Math.abs(s.pos.y-.42-point.y)<1.8;}
 const heroMotion={x:0,z:0,speed:0};
 function readHeroMotion(){
  // Read permitted intent before acceleration finishes. A velocity-only
  // forecast reacts too late to a stationary player's first running step.
  heroMotion.x=s.vel.x;heroMotion.z=s.vel.z;
  const intent=getMoveInput();
  if(s.onGround&&intent.mag>.1&&!inputAiming()){
   const direction=getCameraRelativeMoveVector(intent),planned=window.backspoolFlow?.walking()?1.65:inputSprinting()?28:6.6;
   if(direction.lengthSq()>.001){direction.normalize().multiplyScalar(Math.max(Math.hypot(s.vel.x,s.vel.z),planned*intent.mag));heroMotion.x=direction.x;heroMotion.z=direction.z;}
  }
  heroMotion.speed=Math.hypot(heroMotion.x,heroMotion.z);
 }
 function heroForecast(point){
  const vx=heroMotion.x,vz=heroMotion.z,speed2=vx*vx+vz*vz;
  const time=speed2>.09?Math.max(0,Math.min(.75,((point.x-s.pos.x)*vx+(point.z-s.pos.z)*vz)/speed2)):0;
  const x=s.pos.x+vx*time,z=s.pos.z+vz*time;
  return{x,z,time,speed:Math.sqrt(speed2),distance:Math.hypot(point.x-x,point.z-z)};
 }
 function viewLane(point){
  const dx=camera.position.x-s.pos.x,dz=camera.position.z-s.pos.z,length2=dx*dx+dz*dz;
  const t=length2>1e-8?((point.x-s.pos.x)*dx+(point.z-s.pos.z)*dz)/length2:0;
  const gap=Math.hypot(point.x-s.pos.x-dx*t,point.z-s.pos.z-dz*t);
  const active=t>.015&&t<.98&&Math.hypot(point.x-s.pos.x,point.z-s.pos.z)<2.4&&camera.position.y-point.y<4;
  return{active,gap,dx,dz};
 }
 function heroStepClear(from,to){
  if(!nearHero(from))return true;
  const before=Math.hypot(from.x-s.pos.x,from.z-s.pos.z),after=Math.hypot(to.x-s.pos.x,to.z-s.pos.z);
  const dx=to.x-from.x,dz=to.z-from.z,length2=dx*dx+dz*dz;
  const t=length2>1e-12?Math.max(0,Math.min(1,((s.pos.x-from.x)*dx+(s.pos.z-from.z)*dz)/length2)):0;
  const swept=Math.hypot(from.x+dx*t-s.pos.x,from.z+dz*t-s.pos.z),radius=Math.max(.9,(s.radius||.55)+.32+.03);
  if(before>=radius&&swept<radius)return false;
  if(before<radius&&after<=before+1e-6)return false;
  const a=heroForecast(from),b=heroForecast(to);
  return !(b.distance<radius+.15&&b.distance<=a.distance+1e-6);
 }
 function visitorStepClear(person,from,to,residents){
  if(!heroStepClear(from,to))return false;
  if(people.some(other=>other!==person&&Math.abs(other.visual.position.y-to.y)<.3&&other.visual.position.distanceTo(to)<Math.max(.68,person.route.minimumSpacing)))return false;
  if(residents.some(r=>r.position&&Math.abs(r.position[1]-to.y)<.3&&Math.hypot(r.position[0]-to.x,r.position[2]-to.z)<.75))return false;
  return physicalClear(from,to);
 }
 function commitVisitor(person,to,dt,yielding=false){
  const from=person.visual.position,dx=to.x-from.x,dz=to.z-from.z,moved=Math.hypot(dx,dz);
  from.copy(to);person.walked+=moved;if(yielding)person.yieldedMetres+=moved;
  if(moved>1e-8)person.visual.rotation.y=Math.atan2(dx,dz);
  animate(person,moved,dt);
 }
 function yieldVisitor(person,dt,residents){
  const from=person.visual.position;
  if(!nearHero(from)){person.yielding=false;return false;}
  const forecast=heroForecast(from),view=viewLane(from),gap=Math.hypot(from.x-s.pos.x,from.z-s.pos.z);
  const bodyThreat=gap<1.15||(forecast.time>0&&forecast.distance<1.4),viewThreat=view.active&&view.gap<.72;
  if(!bodyThreat&&!viewThreat){
   // Stay safely aside while a nearby stationary player occupies the route.
   // This prevents one-frame re-entry/yield oscillation at a waiting point.
   if(person.yielding&&gap<2.2&&forecast.speed<.3){person.lastReason='waiting for hero clearance';animate(person,0,dt);return true;}
   person.yielding=false;return false;
  }
  person.yielding=true;person.lastReason=viewThreat?'yielding camera lane':'yielding hero path';
  const away=new THREE.Vector3(from.x-forecast.x,0,from.z-forecast.z);
  if(away.lengthSq()<1e-8)away.set(-(heroMotion.z||0),0,heroMotion.x||1);away.normalize();
  const directions=[away];
  if(forecast.speed>.3){const side=new THREE.Vector3(-heroMotion.z,0,heroMotion.x).normalize();directions.push(side,side.clone().negate());}
  if(viewThreat){const side=new THREE.Vector3(-view.dz,0,view.dx).normalize();directions.push(side,side.clone().negate());}
  for(const angle of [Math.PI/4,-Math.PI/4,Math.PI/2,-Math.PI/2,Math.PI])directions.push(new THREE.Vector3(away.x*Math.cos(angle)-away.z*Math.sin(angle),0,away.x*Math.sin(angle)+away.z*Math.cos(angle)));
  let best=null,bestScore=-Infinity;
  for(const direction of directions){
   const to=from.clone().addScaledVector(direction,Math.min(.05,1.6*dt));
   if(!visitorStepClear(person,from,to,residents))continue;
   const after=heroForecast(to),nextView=viewLane(to);
   const score=after.distance-forecast.distance+(viewThreat&&!bodyThreat?3*(nextView.gap-view.gap):0);
   if(score>bestScore){bestScore=score;best=to;}
  }
  if(best&&bestScore>1e-6)commitVisitor(person,best,dt,true);
  else{person.blocked++;state.blockedMoves++;animate(person,0,dt);}
  return true;
 }
 function moveVisitors(dt){
  readHeroMotion();
  const residents=window.verticalMarketState?.().civilians||[];
  for(const person of people){
   if(yieldVisitor(person,dt,residents))continue;
   if(person.dwell>0){person.dwell=Math.max(0,person.dwell-dt);animate(person,0,dt);continue;}
   const from=person.visual.position,target=new THREE.Vector3(...person.route.points[person.target]),delta=target.clone().sub(from),distance=delta.length();
   if(distance<.035){person.arrivals++;if(person.route.dwellAt.includes(person.target)){person.dwell=person.route.dwellSeconds;event('destination',{visitor:person.id,waypoint:person.target,purpose:person.route.purpose});}person.target=(person.target+1)%person.route.points.length;continue;}
   const next=from.clone().addScaledVector(delta.normalize(),Math.min(distance,person.route.baseSpeed*dt));
   let clear=visitorStepClear(person,from,next,residents);
   if(clear&&nearHero(from)){
    const view=viewLane(next),forecast=heroForecast(next);
    if(forecast.distance<1.15||view.active&&view.gap<.72)clear=false;
   }
   if(!clear){person.blocked++;person.lastReason='supported route waiting for clearance';state.blockedMoves++;animate(person,0,dt);continue;}
   person.lastReason=null;commitVisitor(person,next,dt);
  }
 }
 function tick(dt){if(!state.ready){build();return;}if(!gameActive||!Number.isFinite(dt)||dt<=0)return;flow.advance(dt);let remaining=dt;while(remaining>1e-9){const h=Math.min(1/60,remaining);clock+=h;moveVisitors(h);remaining-=h;}}
 function present(){if(!state.ready)return;camera.updateMatrixWorld(true);const frustum=new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse)),matrix=new THREE.Matrix4(),scale=new THREE.Vector3(),sphere=new THREE.Sphere(),limit=typeof performanceBudget!=='undefined'&&performanceBudget.quality==='mobile'?320:700;
  for(const binding of bindings){let visible=0;binding.members.forEach(({lane,agent},i)=>{const p=flow.pose(lane,agent),show=p.position.distanceToSquared(camera.position)<limit*limit&&frustum.intersectsSphere(sphere.set(p.position,6));scale.setScalar(show?1:0);matrix.compose(p.position,p.quaternion,scale).multiply(binding.local);binding.mesh.setMatrixAt(i,matrix);if(show)visible++;});binding.mesh.visible=visible>0;binding.mesh.instanceMatrix.needsUpdate=true;}
  for(const p of people)p.visual.visible=p.visual.position.distanceToSquared(camera.position)<240*240;
 }
 function diagnostics(){return{...state,clock,ambientManifestSHA256:ambientDefinition?.worldManifestSHA256,roomGraphSHA256:ambientDefinition?.admittedPlayerGraphSHA256,scenicOnly:true,dynamicLights:0,air:flow?.state(),airBatches:bindings.length,people:people.map(p=>({id:p.id,route:p.route.id,position:p.visual.position.toArray(),target:p.target,dwell:p.dwell,walked:p.walked,arrivals:p.arrivals,lastReason:p.lastReason,blocked:p.blocked,yielding:p.yielding,yieldedMetres:p.yieldedMetres,soleOffset:p.group.position.y}))};}
 window.verticalWorldLifeState=()=>JSON.parse(JSON.stringify(diagnostics()));
 window.verticalCityState=()=>{const old=previousCityState();return{...old,legacyAirVehicles:old.vehicles,vehicles:state.ready?state.aircraft:0,trafficGraph:flow?flow.state().lanes.flatMap(l=>l.agents.map(a=>({id:a.id,type:airAssets.models[a.variant].id,speed:a.speed,elevation:a.position[1],bank:a.bank,scenic:true}))):[]};};
 const startup=setInterval(()=>{if(state.ready||state.error)clearInterval(startup);else build();},100);
 return{build,tick,present,state:window.verticalWorldLifeState};
})();
