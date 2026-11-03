/* Live friendly bodies use a separate query channel. Static city contacts,
 * camera rays, navigation, damage and Threadrail attachment surfaces stay owned
 * by their existing systems. No new visible geometry or NPC is created. */
window.v02FriendlyContacts=(()=>{
 const core=window.v02FriendlyContactCore,entries=[],grid=new Map(),cell=8;
 const state={ready:false,clock:0,frames:0,queries:0,contacts:0,streetWaits:0,eventId:0,events:[],last:null};
 let marketRoot,worldRoot;
 const at=(x,z)=>Math.floor(x/cell)+':'+Math.floor(z/cell);
 function add(id,object,radius,height,foot=null){
  if(!object?.parent||entries.some(a=>a.object===object))return;
  const position=object.position,entry={id,object,x:position.x,y:foot??position.y,z:position.z,radius,height};entries.push(entry);
  for(let x=Math.floor((entry.x-radius)/cell);x<=Math.floor((entry.x+radius)/cell);x++)for(let z=Math.floor((entry.z-radius)/cell);z<=Math.floor((entry.z+radius)/cell);z++){
   const key=x+':'+z;let bucket=grid.get(key);if(!bucket)grid.set(key,bucket=[]);bucket.push(entry);
  }
 }
 function collect(){
  entries.length=0;grid.clear();
  for(const[w,index]of streetAtmosphere.walkers.map((w,index)=>[w,index]))if(w.routeEdge)add('street-'+index,w.group,.32,1.72,w.v02SupportY??w.group.position.y);
  marketRoot=marketRoot?.parent?marketRoot:scene.getObjectByName('V02 suspended market / local civilian ownership');
  if(marketRoot)for(const object of marketRoot.children)if(object.name.startsWith('Market resident /'))add(object.name,object,.38,1.82);
  worldRoot=worldRoot?.parent?worldRoot:scene.getObjectByName('V02 public world life');
  if(worldRoot)for(const object of worldRoot.children)if(object.name==='Existing pedestrian visual')add(object.children[0]?.name||object.uuid,object,.32,1.82);
  for(const[ i,c]of courier.civilians.entries())if(!c.rescued)add('courier-'+i,c.group,.42,1.7);
  state.ready=!!window.roadNetworkState?.().ready&&entries.length>=28;
 }
 function beginFrame(dt){if(!gameActive)return;state.clock+=dt;state.frames++;collect();}
 function candidates(start,end,radius){
  if(!state.ready)collect();const minX=Math.min(start.x,end.x)-radius,maxX=Math.max(start.x,end.x)+radius,minZ=Math.min(start.z,end.z)-radius,maxZ=Math.max(start.z,end.z)+radius;
  const x0=Math.floor(minX/cell),x1=Math.floor(maxX/cell),z0=Math.floor(minZ/cell),z1=Math.floor(maxZ/cell);
  if((x1-x0+1)*(z1-z0+1)>64)return entries.filter(a=>a.x+a.radius>=minX&&a.x-a.radius<=maxX&&a.z+a.radius>=minZ&&a.z-a.radius<=maxZ);
  const found=new Set();for(let x=x0;x<=x1;x++)for(let z=z0;z<=z1;z++)for(const entry of grid.get(x+':'+z)||[])found.add(entry);return found;
 }
 function sweep(start,end,shape={}){
  if(gameActive)state.queries++;let best=null;
  for(const actor of candidates(start,end,(shape.radius??.55)+.05)){
   if(shape.selfAtStart&&shape.radius<=actor.radius+.01&&Math.hypot(start.x-actor.x,start.z-actor.z)<.05&&Math.abs(start.y-.42-actor.y)<.05)continue;
   const hit=core.sweep(start,end,actor,shape);if(!hit||best&&hit.t>=best.t)continue;
   const normal=new THREE.Vector3(hit.normal.x,hit.normal.y,hit.normal.z).normalize();
   best={...hit,normal,point:start.clone().lerp(end,hit.t),collider:{id:actor.id,type:'friendly-capsule',friendly:true,nonDestructible:true,mesh:actor.object,
    box:new THREE.Box3(new THREE.Vector3(actor.x-actor.radius,actor.y,actor.z-actor.radius),new THREE.Vector3(actor.x+actor.radius,actor.y+actor.height,actor.z+actor.radius))}};
  }return best;
 }
 function actorSweep(from,to,radius){
  const start=from.clone().add(new THREE.Vector3(0,.42,0)),end=to.clone().add(new THREE.Vector3(0,.42,0)),shape={radius,height:BODY_HEIGHT,offset:.42,selfAtStart:true};
  if(start.distanceToSquared(end)<1e-12){
   for(const a of candidates(start,end,radius+.05)){
    if(radius<=a.radius+.01&&Math.hypot(start.x-a.x,start.z-a.z)<.05&&Math.abs(from.y-a.y)<.05)continue;
    if(core.occupied(start,a,shape))return true;
   }return false;
  }
  return !!sweep(start,end,shape);
 }
 function record(hit){
  state.contacts++;state.last={id:hit.collider.id,normal:hit.normal.toArray(),point:hit.point.toArray(),clock:state.clock};
  if(state.events.at(-1)?.actor!==hit.collider.id||state.clock-state.events.at(-1).clock>.25){state.events.push({id:++state.eventId,kind:'friendly-contact',actor:hit.collider.id,clock:state.clock});if(state.events.length>40)state.events.shift();}
 }
 function move(start,end,first){
  // Same swept integration interval, with tangential sliding and normal speed
  // removal. This never applies a body impact, health loss or camera impulse.
  let from=start.clone(),target=end.clone(),hit=first;
  for(let pass=0;pass<3;pass++){
   if(!hit){s.pos.copy(target);return;}
   if(!hit.collider.friendly){resolveFreeContact(from,target,hit);return;}
   record(hit);const point=hit.point.clone().addScaledVector(hit.normal,.006),remaining=target.clone().sub(point);
   remaining.addScaledVector(hit.normal,-Math.min(0,remaining.dot(hit.normal)));
   const toward=s.vel.dot(hit.normal);if(toward<0)s.vel.addScaledVector(hit.normal,-toward);
   from.copy(point);target.copy(point).add(remaining);s.pos.copy(point);
   if(remaining.lengthSq()<1e-10)return;
   hit=sweptCharacterHit(from,target);
  }
 }
 function waitStreet(w){
  const feet=s.pos.y-.42,height=playerBodyHeight(),npcY=w.v02SupportY??w.group.position.y;
  if(feet>=npcY+1.72||feet+height<=npcY)return false;
  if(Math.hypot(w.group.position.x-s.pos.x,w.group.position.z-s.pos.z)>playerBodyRadius()+.32+.08)return false;
  state.streetWaits++;return true;
 }
 function settleStreet(w,support=w.v02SupportY??w.group.position.y){
  // The original .56m legs have a .06m neutral pivot offset. Preserve the road
  // support coordinate separately and put the actual animated soles on it.
  w.v02SupportY=support;
  const lowest=leg=>leg.position.y-.28*Math.abs(Math.cos(leg.rotation.x))-.06*Math.abs(Math.sin(leg.rotation.x));
  w.group.position.y=support-Math.min(lowest(w.left),lowest(w.right));
 }
 function reset(reason){state.last=null;state.events.push({id:++state.eventId,kind:'reset',reason,clock:state.clock});if(state.events.length>40)state.events.shift();state.ready=false;}
 function diagnostics(){return{...state,actors:entries.map(a=>({id:a.id,position:[a.x,a.y,a.z],radius:a.radius,height:a.height})),scope:'Live friendly capsule channel with native swept movement, separate from static geometry/navigation/damage. Not complete NPC physics or release certification.'};}
 window.v02FriendlyContactState=()=>JSON.parse(JSON.stringify(diagnostics()));
 return{beginFrame,sweep,actorSweep,move,record,waitStreet,settleStreet,reset,state:window.v02FriendlyContactState};
})();
