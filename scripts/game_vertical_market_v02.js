/* Suspended-market incident. New escort logic, existing scenic civilian meshes,
   shared physical clearance/hero health, and separately owned objective state. */
const verticalMarket=(()=>{
 const config={},root=new THREE.Group(),people=[];
 root.name='V02 suspended market / local civilian ownership';root.visible=false;scene.add(root);
 const state={phase:'idle',savedPhase:null,attempt:0,elapsed:0,powerIsolated:false,rewarded:false,waitingReason:null,message:'',clock:0,eventId:0,events:[],queue:[],lastPathPoint:null,pathMetres:0,escortMetres:0,error:null};
 let lastHero=null,nextShock=0,access,objective,beacon,extraction,fault,sparks,sourceAppearance;
 const activePhases=['locate','isolate','rendezvous','escort'];
 const isActive=()=>activePhases.includes(state.phase)||state.phase==='paused';
 const isHero=()=>characterState().active==='backspool';
 const V=p=>new THREE.Vector3(...p);
 const onMarket=()=>config.id&&Math.abs(s.pos.y-config.trigger[1]-.42)<.25&&s.onGround&&s.pos.x>=config.bounds.min[0]&&s.pos.x<=config.bounds.max[0]&&s.pos.z>=config.bounds.min[2]&&s.pos.z<=config.bounds.max[2];
 const horizontal=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
 function event(kind,detail={}){state.events.push({eventId:++state.eventId,attempt:state.attempt,time:+state.clock.toFixed(3),kind,...detail});if(state.events.length>64)state.events.shift();}
 function footprintClear(p){return [[-.27,-.27],[-.27,.27],[.27,-.27],[.27,.27]].every(([x,z])=>Math.abs(verticalDistrict.surfaceFeetAt(p.x+x,p.z+z,p.y+.42)-p.y-.42)<.02);}
 function bodyClear(p){const q=p.clone();return backspoolCombat.safeGroundMove(p,q,.38)&&Math.abs(q.y-p.y)<.02&&footprintClear(q);}
 function segmentClear(a,b){const q=b.clone();return backspoolCombat.safeGroundMove(a,q,.38)&&Math.abs(q.y-b.y)<.02&&footprintClear(q);}
 function makePerson(index){
  const original=streetAtmosphere.walkers[index%Math.max(1,streetAtmosphere.walkers.length)];let group,left,right;
  if(original){group=original.group.clone(true);left=group.children[original.group.children.indexOf(original.left)];right=group.children[original.group.children.indexOf(original.right)];sourceAppearance='existing scenic pedestrian clone; shared source geometry/materials are never disposed';}
  else{group=new THREE.Group();const mat=new THREE.MeshStandardMaterial({color:0x253d48,roughness:.95});const body=new THREE.Mesh(new THREE.CylinderGeometry(.18,.23,.72,6),mat);body.position.y=.95;group.add(body);const head=new THREE.Mesh(new THREE.SphereGeometry(.13,8,6),new THREE.MeshStandardMaterial({color:0x71605c,roughness:.95}));head.position.y=1.48;group.add(head);left=new THREE.Mesh(new THREE.BoxGeometry(.10,.56,.12),mat);right=left.clone();left.position.set(-.11,.34,0);right.position.set(.11,.34,0);group.add(left,right);sourceAppearance='existing scenic pedestrian dimensions; local fallback geometry';}
  group.name=index?'Market resident / circulation '+index:'Market resident / rescue';group.visible=true;group.scale.setScalar(1.12);group.rotation.set(0,0,0);group.position.copy(V(config.positions[index]));root.add(group);
  // The existing scenic prototype's neutral soles sit above its object pivot.
  // Normalize the cloned visual once; its physical navigation base stays fixed.
  if(left)left.rotation.x=0;if(right)right.rotation.x=0;group.updateMatrixWorld(true);
  const soleOffset=(new THREE.Box3().setFromObject(group).min.y-group.position.y)/group.scale.y;
  for(const child of group.children)child.position.y-=soleOffset;
  return{group,left,right,phase:0,walked:0,index,patrolTarget:1,blocked:0,lastMove:state.clock,soleOffset};
 }
 function ring(name,p,r,color){const mesh=new THREE.Mesh(new THREE.RingGeometry(r-.10,r,32),new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide,transparent:true,opacity:.7,depthWrite:false}));mesh.name=name;mesh.rotation.x=-Math.PI/2;mesh.position.copy(V(p)).add(new THREE.Vector3(0,.022,0));root.add(mesh);return mesh;}
 function ensure(){
  if(config.id)return true;const data=window.verticalDistrict?.encounter('market-rescue');if(!data||!verticalDistrictState().ready)return false;
  Object.assign(config,JSON.parse(JSON.stringify(data)));for(let i=0;i<config.positions.length;i++)people.push(makePerson(i));
  access=ring('Market incident / access',config.trigger,1.3,0x79dce5);objective=ring('Market incident / current interaction',config.positions[0],1,0xffd080);extraction=ring('Market incident / safe assembly',config.extraction,2.5,0x8cf1c9);
  beacon=new THREE.Mesh(new THREE.ConeGeometry(.28,.6,4),new THREE.MeshBasicMaterial({color:0xffd080,depthWrite:false}));beacon.name='Market incident / visible waypoint';beacon.rotation.z=Math.PI;root.add(beacon);
  fault=ring('Market incident / electrical danger',config.hazard,1.7,0xff9a4a);
  sparks=new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(new Float32Array(72),3)),new THREE.LineBasicMaterial({color:0xffc479,transparent:true,opacity:.8,depthWrite:false,toneMapped:false}));sparks.name='Market power fault / deterministic sparks';sparks.position.copy(V(config.hazard));root.add(sparks);
  return true;
 }
 function near(p,range=2.4){return ensure()&&onMarket()&&horizontal(s.pos,V(p))<=range;}
 function relevant(){return ensure()&&onMarket()&&horizontal(s.pos,V(config.trigger))<9;}
 function busy(){const c=actionWorldState().contracts.active,e=backspoolEncounterState(),completedYard=e.outcome==='victory'&&window.verticalEncounters?.ownsAttempt(e.attempt);return ['active','paused'].includes(c?.status)||e.active&&!completedYard;}
 function notice(text){state.message=text;present();return false;}
 function preflight(){
  const points=[...config.positions,config.trigger,config.isolation,config.extraction];if(!points.every(p=>bodyClear(V(p))))return false;
  return config.patrols.every(route=>route.every((p,i)=>segmentClear(V(p),V(route[(i+1)%route.length]))));
 }
 function start(){
  if(!ensure()||!gameActive||!isHero())return false;
  if(courier.trauma>=100)return notice('Recalibrate, then return to the market.');
  if(busy())return notice('Finish or end the current contract or sparring encounter first.');
  const yard=backspoolEncounterState();if(yard.outcome==='victory'&&window.verticalEncounters?.ownsAttempt(yard.attempt))verticalEncounters.end('NEXT ENCOUNTER');
  if(state.phase==='paused'){
   if(!near(people[0].group.position.toArray(),8)&&!relevant())return notice('Return to the resident or market access to resume.');
   state.phase=state.savedPhase;state.savedPhase=null;state.message='Rescue resumed. The resident and walked route are preserved.';event('resumed');present();return true;
  }
  if(!relevant())return notice('Reach the market incident access marker.');
  if(!preflight())return notice('Market route is obstructed. Current incident preserved.');
  state.attempt++;Object.assign(state,{phase:'locate',savedPhase:null,elapsed:0,powerIsolated:false,rewarded:false,waitingReason:null,queue:[],lastPathPoint:null,pathMetres:0,escortMetres:0,error:null,message:'Find the resident by the damaged power conduit. Stay outside the amber fault ring.'});
  // Fixed reset is limited to the player's explicit Start/Retry action. During
  // escort there are no position resets, catch-up warps or offscreen teleports.
  people[0].group.position.copy(V(config.positions[0]));people[0].walked=0;nextShock=state.clock;
  event('started',{resident:people[0].group.position.toArray()});present();return true;
 }
 function end(reason='ENDED'){
  if(isActive())event('ended',{reason});state.phase='idle';state.savedPhase=null;state.queue=[];state.lastPathPoint=null;state.waitingReason=null;state.message='Rescue ended. The resident remains at the last safe position.';present();
 }
 function reset(reason='RESPAWN'){
  if(!isActive())return;event('failed',{reason});state.phase='failed';state.savedPhase=null;state.queue=[];state.lastPathPoint=null;state.waitingReason=null;state.message=reason==='DEFEAT'?'Defeated. Recalibrate, then return to market access to retry.':'Rescue interrupted. Return to market access to retry.';
 }
 function interact(){
  if(!ensure()||!isHero()||!gameActive)return false;
  if(state.phase==='paused'){if(relevant()||near(people[0].group.position.toArray(),8)){start();return true;}return false;}
  if(!isActive()){if(relevant()){start();return true;}return false;}
  if(state.phase==='locate'&&near(people[0].group.position.toArray())){state.phase='isolate';state.message='The conduit is live. Isolate its supply at the marked cabinet before escorting the resident.';event('resident-found');}
  else if(state.phase==='isolate'&&near(config.isolation)){state.powerIsolated=true;state.phase='rendezvous';state.message='Power isolated. Return to the resident and offer an escort.';event('power-isolated');gameAudio.play('backspoolBank');}
  else if(state.phase==='rendezvous'&&near(people[0].group.position.toArray())){state.phase='escort';state.queue=[];state.lastPathPoint=people[0].group.position.toArray();state.message='Walk a clear route to the green assembly area. Keep the resident close and go around obstacles.';event('escort-started');}
  else return false;present();return true;
 }
 function movePerson(person,target,dt,speed){
  const from=person.group.position,d=target.clone().sub(from);d.y=0;const distance=d.length();if(distance<.04)return true;
  const to=from.clone().addScaledVector(d.normalize(),Math.min(distance,dt*speed));
  if(people.some(other=>other!==person&&horizontal(other.group.position,to)<.65))return false;
  if(!segmentClear(from,to)){person.blocked++;return false;}
  const moved=from.distanceTo(to);from.copy(to);person.walked+=moved;person.phase+=moved*6;person.lastMove=state.clock;person.group.rotation.y=Math.atan2(d.x,d.z);person.group.rotation.z=0;
  if(person.left)person.left.rotation.x=Math.sin(person.phase)*.36;if(person.right)person.right.rotation.x=-Math.sin(person.phase)*.36;return true;
 }
 function idlePoses(dt){for(const person of people){if(state.clock-person.lastMove<.08)continue;for(const leg of [person.left,person.right])if(leg){leg.rotation.x*=Math.exp(-14*dt);if(Math.abs(leg.rotation.x)<.001)leg.rotation.x=0;}}}
 function escort(dt){
  const resident=people[0],feet=s.pos.clone();feet.y-=.42;state.waitingReason=null;
  if(!onMarket()){state.waitingReason='Return to the market floor. The resident waits on the last safe walkway.';}
  else if(horizontal(s.pos,resident.group.position)>18){state.waitingReason='Slow down and return to the resident. They cannot follow at traversal speed.';}
  else if(state.queue.length>=256){state.waitingReason='Wait for the resident to catch up.';}
  else if(!bodyClear(feet)){state.waitingReason='Stand on a clear, supported path.';}
  else{
   const last=V(state.lastPathPoint),distance=last.distanceTo(feet);
   if(distance>.45){
    if(segmentClear(last,feet)){state.queue.push(feet.toArray());state.lastPathPoint=feet.toArray();state.pathMetres+=distance;}
    else state.waitingReason='The resident cannot cross that shortcut. Return to the route you walked.';
   }
  }
  if(state.queue.length){const target=V(state.queue[0]),before=resident.group.position.clone();if(horizontal(resident.group.position,s.pos)>1.5||state.queue.length>1){if(!movePerson(resident,target,dt,2.2))state.waitingReason='The resident is waiting for a clear path.';state.escortMetres+=before.distanceTo(resident.group.position);}if(resident.group.position.distanceTo(target)<.08)state.queue.shift();}
  if(state.waitingReason)state.message=state.waitingReason;
  else state.message='Escort the resident to the green assembly area. Walk around counters; keep them close.';
  if(state.powerIsolated&&onMarket()&&near(config.extraction,4)&&horizontal(resident.group.position,V(config.extraction))<2.2&&!state.rewarded){state.phase='victory';state.rewarded=true;state.queue=[];state.message='Resident safely evacuated · +'+config.reward+'. The market remains open.';s.score+=config.reward;event('extracted',{resident:resident.group.position.toArray(),reward:config.reward});gameAudio.play('backspoolBank');}
 }
 function tick(dt){
  if(!ensure())return;const hero=characterState().active;
  if(lastHero&&hero!==lastHero&&activePhases.includes(state.phase)){state.savedPhase=state.phase;state.phase='paused';state.message='Market rescue paused. Return as Backspool to resume without losing the resident’s route.';event('hero-paused');}lastHero=hero;
  if(!gameActive||dt<=0)return;state.clock+=dt;
  for(let i=1;i<people.length;i++){const person=people[i],route=config.patrols[i-1];if(movePerson(person,V(route[person.patrolTarget]),dt,1.15)&&person.group.position.distanceTo(V(route[person.patrolTarget]))<.08)person.patrolTarget=(person.patrolTarget+1)%route.length;}
  if(!activePhases.includes(state.phase)||!isHero()){idlePoses(dt);return;}
  state.elapsed+=dt;if(courier.trauma>=100){reset('DEFEAT');idlePoses(dt);return;}
  if(!state.powerIsolated&&Math.abs(s.pos.y-config.hazard[1]-.42)<1.65&&horizontal(s.pos,V(config.hazard))<1.55&&state.clock>=nextShock&&!backspoolCombat.invulnerable()){
   const damage=combatants.receiveHeroDamage(8);nextShock=state.clock+1.2;backspoolPowers.interrupt('MARKET POWER ARC');cameraShake=Math.max(cameraShake,.12);gameAudio.play('impact',.5);event('power-arc',{damage,condition:100-courier.trauma});
  }
  if(state.phase==='escort')escort(dt);idlePoses(dt);
 }
 function ownsPresentation(){return ensure()&&isHero()&&gameActive&&(isActive()||state.phase==='failed'||state.phase==='victory'&&onMarket()||relevant()&&!busy());}
 function currentTarget(){if(state.phase==='isolate')return config.isolation;if(state.phase==='escort'&&state.waitingReason)return state.lastPathPoint||people[0].group.position.toArray();if(state.phase==='escort'||state.phase==='victory')return config.extraction;return people[0]?.group.position.toArray()||config.trigger;}
 function canInteract(){if(!ensure())return false;if(state.phase==='paused')return relevant()||near(people[0].group.position.toArray(),8);if(!isActive())return relevant();if(state.phase==='isolate')return near(config.isolation);if(['locate','rendezvous'].includes(state.phase))return near(people[0].group.position.toArray());return false;}
 function present(){
  if(!ensure()){panel.hidden=true;return;}
  root.visible=gameActive&&horizontal(s.pos,V(config.trigger))<220;
  const dangerous=!state.powerIsolated;fault.visible=dangerous;sparks.visible=dangerous;
  if(dangerous){const a=sparks.geometry.attributes.position;for(let i=0;i<a.count;i++){const k=Math.floor(i/2),odd=i%2,angle=k*2.399+state.clock*.7,rad=odd?1.3:.7;a.setXYZ(i,Math.cos(angle)*rad,.2+odd*.7+Math.sin(k+state.clock*18)*.13,Math.sin(angle)*rad);}a.needsUpdate=true;fault.material.opacity=.35+.2*Math.sin(state.clock*8);}
  objective.visible=isActive()||state.phase==='victory';beacon.visible=objective.visible;if(objective.visible){objective.position.copy(V(currentTarget())).add(new THREE.Vector3(0,.026,0));beacon.position.copy(V(currentTarget())).add(new THREE.Vector3(0,3.9,0));beacon.material.color.setHex(state.phase==='victory'||state.phase==='escort'&&!state.waitingReason?0x8cf1c9:0xffd080);}extraction.visible=state.powerIsolated;access.visible=!isActive();
  panel.hidden=!ownsPresentation();if(panel.hidden)return;
  title.textContent=config.title;description.textContent=state.message||'A resident is trapped beside a live power fault. Find them, isolate the supply and escort them to safety.';
  status.textContent=(isActive()?state.phase.toUpperCase()+' · '+state.elapsed.toFixed(1)+'s':state.phase==='victory'?'RESIDENT SAFE · +'+config.reward:state.phase==='failed'?'RESCUE INTERRUPTED':'I / Y · BEGIN INCIDENT');
  button.textContent=state.phase==='paused'?'Resume rescue':state.phase==='isolate'?'Isolate power':state.phase==='rendezvous'?'Escort resident':state.phase==='locate'?'Speak to resident':state.phase==='escort'?'Follow green marker':state.phase==='victory'?'Restart incident':'Start rescue';button.disabled=!canInteract()||courier.trauma>=100;endButton.hidden=!isActive()&&!['victory','failed'].includes(state.phase);
  $('heroContractHUD').hidden=true;if(isActive()||state.phase==='victory'){const delta=V(currentTarget()).sub(s.pos),turn=angleDelta(cam.yaw,Math.atan2(-delta.x,-delta.z)),direction=Math.abs(turn)<.25?'AHEAD':turn>0?'LEFT':'RIGHT';$('missionText').textContent='MARKET RESCUE · '+state.phase.toUpperCase()+' · '+Math.round(delta.length())+'m · '+direction;}
 }
 const panel=document.createElement('section');panel.id='v02MarketHUD';panel.hidden=true;panel.innerHTML='<strong></strong><p></p><small></small><div><button id="v02MarketInteract">Start rescue</button><button id="v02MarketEnd">End</button></div>';document.body.append(panel);
 const title=panel.querySelector('strong'),description=panel.querySelector('p'),status=panel.querySelector('small'),button=$('v02MarketInteract'),endButton=$('v02MarketEnd');
 button.onclick=()=>isActive()?state.phase==='paused'?start():interact():start();endButton.onclick=()=>end();for(const type of ['pointerdown','mousedown','click'])panel.addEventListener(type,e=>e.stopPropagation());
 const css=document.createElement('style');css.textContent='#v02MarketHUD{position:fixed;left:14px;bottom:195px;width:285px;box-sizing:border-box;padding:12px;border:1px solid #8bd7bc;border-radius:7px;background:#081e24ed;color:#def5ef;font:11px/1.45 monospace;z-index:26}#v02MarketHUD[hidden]{display:none}#v02MarketHUD strong{color:#b4efd2}#v02MarketHUD p{margin:8px 0}#v02MarketHUD small{display:block;color:#ffd694}#v02MarketHUD div{display:flex;gap:8px;margin-top:9px}#v02MarketHUD button{position:static;min-height:44px;padding:7px;margin:0;background:#153c40;color:#e8fff2;border:1px solid #608e8d;border-radius:4px;font:11px monospace}#v02MarketHUD button:disabled{opacity:.45}@media(max-width:600px){#v02MarketHUD{left:8px;bottom:185px;width:205px;padding:8px;font-size:10px}#v02MarketHUD p{display:none}}@media(max-height:600px){#v02MarketHUD{left:180px;bottom:10px;width:260px;padding:7px}#v02MarketHUD p{display:none}#v02MarketHUD div{margin-top:4px}}';document.head.append(css);
 addEventListener('keydown',e=>{if(e.code==='KeyI'&&!e.repeat&&!/INPUT|SELECT|TEXTAREA/.test(e.target?.tagName)&&gameActive&&isHero()&&canInteract()){e.preventDefault();interact();}});
 const api={start,end,reset,tick,present,interact,ownsPresentation,isActive,state:()=>({ ...JSON.parse(JSON.stringify(state)),config:JSON.parse(JSON.stringify(config)),appearance:sourceAppearance,nearAccess:!!config.id&&onMarket()&&horizontal(s.pos,V(config.trigger))<9,onMarket:onMarket(),target:config.id?currentTarget():null,civilians:people.map(p=>({id:p.index,position:p.group.position.toArray(),walked:p.walked,blocked:p.blocked})),scope:'New market incident/escort adapter with existing scenic civilian appearance; not original courier pickup or full V02 acceptance'})};
 window.verticalMarket=api;window.verticalMarketState=api.state;
 const originalText=window.render_game_to_text;if(originalText)window.render_game_to_text=()=>{const text=JSON.parse(originalText());const market=api.state(),yard=window.verticalEncounterState?.();text.district={axes:'X/Y-up/Z metres; actor origin .42m above architectural floor',market:{phase:market.phase,target:market.target,civilians:market.civilians,powerIsolated:market.powerIsolated,waitingReason:market.waitingReason},service:yard?{phase:yard.phase,opponents:yard.opponents}:null};return JSON.stringify(text)};
 return api;
})();
