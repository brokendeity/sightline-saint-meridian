"""Prepare a separate market reliability module; never edit the retained one.

The output is not automatically bound into a game. It must pass normal-input
rescue/lifecycle/separation checks before replacing a tag in a new candidate.
"""
from pathlib import Path
import gzip,hashlib,json
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
parent=R/'scripts/game_vertical_market_v02.js'
baseline=D/'evidence/slender-crossings-gameplay/market-public/V02_Market_Rescue_Public.trace.json.gz'
record=json.loads(gzip.decompress(baseline.read_bytes()))
assert sha(parent)==record['marketSHA256'],'The reproduced source must match the proposed fix'
source=parent.read_text()
helpers=r'''
 // Friendly market residents yield using their existing ground/support sweep.
 // No actor teleport, player impulse, collision bypass or new nav ability.
 function heroClearance(){return Math.max(.93,(s.radius||.55)+.38+.04);}
 function heroAtHeight(p){return Math.abs(s.pos.y-.42-p.y)<1.8;}
 function heroForecast(p){
  const vx=s.vel.x,vz=s.vel.z,speed2=vx*vx+vz*vz,dx=p.x-s.pos.x,dz=p.z-s.pos.z;
  const time=speed2>.09?Math.max(0,Math.min(.75,(dx*vx+dz*vz)/speed2)):0;
  const x=s.pos.x+vx*time,z=s.pos.z+vz*time;
  return{x,z,time,speed:Math.sqrt(speed2),distance:Math.hypot(p.x-x,p.z-z)};
 }
 function heroStepClear(from,to){
  if(!heroAtHeight(from))return true;
  const radius=heroClearance(),before=horizontal(from,s.pos),after=horizontal(to,s.pos);
  const dx=to.x-from.x,dz=to.z-from.z,dd=dx*dx+dz*dz;
  const t=dd>1e-12?Math.max(0,Math.min(1,((s.pos.x-from.x)*dx+(s.pos.z-from.z)*dz)/dd)):0;
  const closest=Math.hypot(from.x+dx*t-s.pos.x,from.z+dz*t-s.pos.z);
  if(before>=radius&&closest<radius)return false;
  if(before<radius&&after<=before+1e-6)return false;
  const a=heroForecast(from),b=heroForecast(to);
  return !(b.distance<radius+.12&&b.distance<=a.distance+1e-5);
 }
 function yieldToHero(person,dt){
  person.yielding=false;
  // The stranded resident cannot leave the incident before power isolation
  // and the player's explicit escort interaction. Preserve that anchor.
  if(person.index===0&&!['escort','victory'].includes(state.phase))return false;
  const from=person.group.position;
  if(!heroAtHeight(from))return false;
  const forecast=heroForecast(from),radius=heroClearance();
  if(horizontal(from,s.pos)>radius+.15&&(forecast.time<=0||forecast.distance>radius+.2))return false;
  person.yielding=true;
  const away=new THREE.Vector3(from.x-forecast.x,0,from.z-forecast.z);
  if(away.lengthSq()<1e-8)away.set(-(s.vel.z||0),0,s.vel.x||1);
  away.normalize();
  const directions=[away];
  if(forecast.speed>.3){
   const side=new THREE.Vector3(-s.vel.z,0,s.vel.x).normalize();
   directions.push(side,side.clone().negate());
  }
  for(const angle of [Math.PI/4,-Math.PI/4,Math.PI/2,-Math.PI/2,Math.PI]){
   directions.push(new THREE.Vector3(away.x*Math.cos(angle)-away.z*Math.sin(angle),0,away.x*Math.sin(angle)+away.z*Math.cos(angle)));
  }
  let best=null,score=-Infinity;
  for(const direction of directions){
   const to=from.clone().addScaledVector(direction,Math.min(.1,dt*2.2));
   if(!heroStepClear(from,to)||!segmentClear(from,to)||people.some(other=>other!==person&&horizontal(other.group.position,to)<.8))continue;
   const candidate=heroForecast(to).distance;
   if(candidate>score){score=candidate;best=direction;}
  }
  if(best){
   const before=person.walked;
   movePerson(person,from.clone().add(best),dt,2.2);
   person.yieldedMetres=(person.yieldedMetres||0)+person.walked-before;
  }else person.blocked++;
  return true;
 }
'''
needle=' function movePerson(person,target,dt,speed){'
assert source.count(needle)==1
text=source.replace(needle,helpers+'\n'+needle)
old='  if(people.some(other=>other!==person&&horizontal(other.group.position,to)<.65))return false;'
new='  if(!heroStepClear(from,to)||people.some(other=>other!==person&&horizontal(other.group.position,to)<.8))return false;'
assert text.count(old)==1;text=text.replace(old,new)
needle='  for(let i=1;i<people.length;i++){const person=people[i],route=config.patrols[i-1];'
replacement='  const yielding=new Set(people.filter(person=>yieldToHero(person,dt)));\n  for(let i=1;i<people.length;i++){const person=people[i],route=config.patrols[i-1];if(yielding.has(person))continue;'
assert text.count(needle)==1;text=text.replace(needle,replacement)
old="  if(state.phase==='escort')escort(dt);idlePoses(dt);"
new="  if(state.phase==='escort'&&!yielding.has(people[0]))escort(dt);idlePoses(dt);"
assert text.count(old)==1;text=text.replace(old,new)
old='position:p.group.position.toArray(),walked:p.walked,blocked:p.blocked}))'
new='position:p.group.position.toArray(),walked:p.walked,blocked:p.blocked,yielding:!!p.yielding,yieldedMetres:p.yieldedMetres||0}))'
assert text.count(old)==1;text=text.replace(old,new)
out=R/'scripts/game_v02_market_clearance.js';out.write_text(text)
report={'status':'PREPARED unbound reliability module; normal-input and lifecycle acceptance pending',
 'source':str(parent.relative_to(R)),'sourceSHA256':sha(parent),'output':str(out.relative_to(R)),'outputSHA256':sha(out),
 'reproductionTraceSHA256':sha(baseline),'generatorSHA256':sha(Path(__file__)),
 'policy':'Existing support-checked movement at at most2.2m/s; forecast hero path up to.75s; preserve capsule spacing and allow only separation-increasing moves when already overlapping. Pause freezes movement. No player/power/encounter transforms changed.'}
(D/'V02_Market_Clearance_Runtime.json').write_text(json.dumps(report,indent=2)+'\n');print(report['status'])
