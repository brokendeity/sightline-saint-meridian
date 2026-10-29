"""Separate bounded public-visitor clearance child. Published source is immutable."""
from pathlib import Path
import hashlib,json,subprocess
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
source=R/'scripts/game_vertical_furnished_room_life_v02.js'
retained=subprocess.check_output(['git','show','4a01f4b1c2234498abdda6eefb2b267b9d4e196c:'+str(source.relative_to(R))],cwd=R)
assert source.read_bytes()==retained,'Published world-life source changed'
text=source.read_text()
start=text.index(' function moveVisitors(dt){');end=text.index(' function tick(dt)',start)
replacement=r''' // Clearance is a locomotion request on the same supported floor, never a
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
'''
text=text[:start]+replacement+text[end:]
old='arrivals:0,blocked:0,lastReason:null}'
new='arrivals:0,blocked:0,lastReason:null,yielding:false,yieldedMetres:0}'
assert text.count(old)==1;text=text.replace(old,new)
old='blocked:p.blocked,soleOffset:p.group.position.y'
new='blocked:p.blocked,yielding:p.yielding,yieldedMetres:p.yieldedMetres,soleOffset:p.group.position.y'
assert text.count(old)==1;text=text.replace(old,new)
out=R/'scripts/game_v02_visitor_clearance.js';out.write_text(text)
report={'status':'PREPARED separate visitor reliability module; actual-input acceptance pending','source':str(source.relative_to(R)),'sourceSHA256':sha(source),'output':str(out.relative_to(R)),'outputSHA256':sha(out),'generatorSHA256':sha(Path(__file__)),
 'policy':'Up to1.6m/s supported sidesteps before dwell, predicted hero path and close camera-lane clearance, preserved route/dwell identity, no NPC warp/hero impulse/camera rewrite/material fade. Existing aircraft, assets, source geometry and controls unchanged.'}
(D/'V02_Visitor_Clearance_Runtime.json').write_text(json.dumps(report,indent=2)+'\n');print(report['output'],report['outputSHA256'])
