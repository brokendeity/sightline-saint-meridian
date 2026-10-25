/* Candidate-only pursuit. Authored supported route; shared actor clearance and
   normal interaction input. No spline teleport, health refill or fake combat. */
const verticalPursuit=(()=>{
 const config={},root=new THREE.Group();root.name='V02 transit pursuit / owned runner';scene.add(root);
 const state={phase:'idle',attempt:0,clock:0,elapsed:0,waypoint:1,distance:0,rewarded:false,blockedFor:0,message:'',events:[],eventId:0,error:null};
 let runner,left,right,beacon,access,exit,legPhase=0,lastHero=null,cornerUntil=0;
 const V=p=>new THREE.Vector3(...p),active=()=>['active','paused'].includes(state.phase),hero=()=>characterState().active==='backspool';
 function event(kind,detail={}){state.events.push({eventId:++state.eventId,attempt:state.attempt,time:+state.clock.toFixed(3),kind,...detail});if(state.events.length>64)state.events.shift();}
 function ring(name,p,color,radius){const m=new THREE.Mesh(new THREE.RingGeometry(radius-.09,radius,32),new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide,transparent:true,opacity:.7,depthWrite:false}));m.name=name;m.rotation.x=-Math.PI/2;m.position.copy(V(p)).add(new THREE.Vector3(0,.025,0));root.add(m);return m;}
 function ensure(){
  if(config.id)return true;const data=window.verticalDistrict?.encounter('transit-pursuit');if(!data||!verticalDistrictState().ready||!streetAtmosphere.walkers.length)return false;Object.assign(config,JSON.parse(JSON.stringify(data)));
  const original=streetAtmosphere.walkers[0];runner=original.group.clone(true);left=runner.children[original.group.children.indexOf(original.left)];right=runner.children[original.group.children.indexOf(original.right)];runner.name='Transit pursuit / runner';runner.visible=true;runner.scale.setScalar(1.12);runner.rotation.set(0,0,0);runner.position.copy(V(config.positions[0]));root.add(runner);
  for(const leg of [left,right])if(leg)leg.rotation.x=0;runner.updateMatrixWorld(true);const sole=(new THREE.Box3().setFromObject(runner).min.y-runner.position.y)/runner.scale.y;for(const child of runner.children)child.position.y-=sole;
  access=ring('Transit pursuit / access',config.trigger,0xffcf82,1.3);exit=ring('Transit pursuit / escape zone',config.escape,0xf2ac72,2.2);
  beacon=new THREE.Mesh(new THREE.ConeGeometry(.28,.6,4),new THREE.MeshBasicMaterial({color:0xffcf82,depthWrite:false}));beacon.name='Transit pursuit / runner indicator';beacon.rotation.z=Math.PI;root.add(beacon);return true;
 }
 function atAccess(){return ensure()&&s.onGround&&s.pos.distanceTo(V(config.trigger).add(new THREE.Vector3(0,.42,0)))<7;}
 function busy(){const e=backspoolEncounterState();return window.verticalMarket?.isActive()||['active','paused'].includes(actionWorldState().contracts.active?.status)||e.active&&!(e.outcome==='victory'&&window.verticalEncounters?.ownsAttempt(e.attempt));}
 function notice(message){state.message=message;present();return false;}
 function preflight(){
  for(let i=1;i<config.path.length;i++){const from=V(config.path[i-1]),to=V(config.path[i]);if(!backspoolCombat.safeGroundMove(from,to,.38)||Math.abs(to.y-config.path[i][1])>.02){state.error='PREFLIGHT SEGMENT '+i;return false;}}
  return true;
 }
 function start(){
  if(!ensure()||!gameActive||!hero())return false;
  if(courier.trauma>=100)return notice('Recalibrate before starting another pursuit.');
  if(busy())return notice('Finish or end your current encounter or street contract first.');
  if(state.phase==='paused'){state.phase='active';event('resumed');state.message='Pursuit resumed. The runner keeps the same route and position.';present();return true;}
  if(!atAccess())return notice('Reach the transit concourse access marker.');
  if(!preflight())return notice('The pursuit route is obstructed. Current attempt preserved.');
  const yard=backspoolEncounterState();if(yard.outcome==='victory'&&window.verticalEncounters?.ownsAttempt(yard.attempt))verticalEncounters.end('NEXT ENCOUNTER');
  state.attempt++;Object.assign(state,{phase:'active',elapsed:0,waypoint:1,distance:0,rewarded:false,blockedFor:0,error:null,message:'Follow the runner up the public stairs, or cut across the observation deck. Interact nearby to intercept.'});
  runner.position.copy(V(config.positions[0]));cornerUntil=state.clock+1.2;event('started',{position:runner.position.toArray()});present();return true;
 }
 function end(reason='ENDED'){if(active())event('ended',{reason});state.phase='idle';state.message='Pursuit ended. The runner stays at the last supported position.';present();}
 function reset(reason='RESPAWN'){if(active()){state.phase='failed';state.message='Pursuit interrupted · '+reason+'. Return to the concourse to retry.';event('failed',{reason});}}
 function blockedRay(start,end,margin){const delta=end.clone().sub(start),length=delta.length();return length>.01&&!!new THREE.Raycaster(start,delta.normalize(),0,Math.max(0,length-margin)).intersectObjects(obstacleCandidates(start,end),false)[0];}
 function canCapture(){return state.phase==='active'&&state.elapsed>=1.2&&s.onGround&&Math.abs(s.pos.y-.42-runner.position.y)<1.1&&s.pos.clone().add(new THREE.Vector3(0,-.42,0)).distanceTo(runner.position)<2.25&&!blockedRay(s.pos.clone().add(new THREE.Vector3(0,.7,0)),runner.position.clone().add(new THREE.Vector3(0,1.1,0)),.05);}
 function interact(){
  if(!ensure()||!hero()||!gameActive)return false;
  if(state.phase==='active'){
   if(canCapture()){state.phase='victory';state.message='Runner intercepted · +'+config.reward+'.';if(!state.rewarded){state.rewarded=true;s.score+=config.reward;event('intercepted',{position:runner.position.toArray(),player:s.pos.toArray(),reward:config.reward});gameAudio.play('backspoolBank');}present();return true;}
   return false;
  }
  if(state.phase==='paused'||atAccess()){start();return true;}return false;
 }
 function tick(dt){
  if(!ensure())return;const h=characterState().active;if(lastHero&&h!==lastHero&&state.phase==='active'){state.phase='paused';state.message='Pursuit paused. Return as Backspool to resume.';event('hero-paused');}lastHero=h;
  if(!gameActive||dt<=0||state.phase==='paused')return;state.clock+=dt;
  if(state.phase!=='active'){for(const leg of [left,right])if(leg){leg.rotation.x*=Math.exp(-14*dt);if(Math.abs(leg.rotation.x)<.001)leg.rotation.x=0;}return;}
  state.elapsed+=dt;if(courier.trauma>=100){reset('DEFEAT');return;}if(!hero()||state.clock<cornerUntil)return;
  const target=V(config.path[state.waypoint]),delta=target.clone().sub(runner.position);delta.y=0;
  if(delta.length()<.015){
   if(Math.abs(runner.position.y-target.y)>.03){state.phase='failed';state.error='WAYPOINT SUPPORT';state.message='Runner route support failed. Return to the concourse.';event('route-failed',{reason:state.error});return;}
   event('waypoint',{index:state.waypoint,position:runner.position.toArray()});state.waypoint++;cornerUntil=state.clock+config.cornerPause;
   if(state.waypoint===config.path.length){state.phase='escaped';state.message='Runner escaped through the upper exit. Return to the transit concourse to retry.';event('escaped',{position:runner.position.toArray()});}return;
  }
  const to=runner.position.clone().addScaledVector(delta.normalize(),Math.min(config.speed*dt,Math.hypot(target.x-runner.position.x,target.z-runner.position.z)));
  if(!backspoolCombat.safeGroundMove(runner.position,to,.38)){state.blockedFor+=dt;state.message='Runner is blocked by the city geometry; intercept nearby or end the pursuit.';if(state.blockedFor>3){state.phase='failed';state.error='ROUTE OBSTRUCTED';event('route-failed',{position:runner.position.toArray(),reason:state.error});}return;}
  state.blockedFor=0;const distance=runner.position.distanceTo(to);state.distance+=distance;runner.position.copy(to);runner.rotation.y=Math.atan2(delta.x,delta.z);legPhase+=distance*6;if(left)left.rotation.x=Math.sin(legPhase)*.4;if(right)right.rotation.x=-Math.sin(legPhase)*.4;
 }
 function ownsPresentation(){return ensure()&&hero()&&gameActive&&(active()||atAccess()&&!busy()||['victory','escaped','failed'].includes(state.phase)&&s.pos.distanceTo(runner.position)<40);}
 function present(){
  if(!ensure()){panel.hidden=true;return;}root.visible=gameActive&&s.pos.distanceTo(runner.position)<260;access.visible=!active();exit.visible=active();beacon.visible=active();beacon.position.copy(runner.position).add(new THREE.Vector3(0,3.3,0));
  panel.hidden=!ownsPresentation();if(panel.hidden)return;description.textContent=state.message||'A runner is heading for the upper observation exit. Follow or intercept across the connected public decks.';
  const delta=runner.position.clone().sub(s.pos),height=delta.y+.42,distance=delta.length(),look=camera.getWorldDirection(new THREE.Vector3()),targetDirection=runner.position.clone().add(new THREE.Vector3(0,1.1,0)).sub(camera.position),turn=angleDelta(Math.atan2(-look.x,-look.z),Math.atan2(-targetDirection.x,-targetDirection.z)),bearing=Math.abs(turn)<.35?'AHEAD':Math.abs(turn)>2.5?'BEHIND':turn>0?'LEFT':'RIGHT';status.textContent=state.phase.toUpperCase()+' · '+Math.round(distance)+'m · '+bearing+' · '+(height>1?'ABOVE':height<-1?'BELOW':'SAME LEVEL');
  button.textContent=state.phase==='active'?'Intercept runner':state.phase==='paused'?'Resume pursuit':'Start pursuit';button.disabled=courier.trauma>=100||(state.phase==='active'?!canCapture():!atAccess()&&state.phase!=='paused');endButton.hidden=!active()&&!['victory','escaped','failed'].includes(state.phase);
  $('heroContractHUD').hidden=true;$('missionText').textContent='TRANSIT PURSUIT · '+status.textContent;
 }
 const panel=document.createElement('section');panel.id='v02PursuitHUD';panel.hidden=true;panel.innerHTML='<strong>TRANSIT INTERCHANGE · PURSUIT</strong><p></p><small></small><div><button id="v02PursuitInteract">Start pursuit</button><button id="v02PursuitEnd">End</button></div>';document.body.append(panel);
 const description=panel.querySelector('p'),status=panel.querySelector('small'),button=$('v02PursuitInteract'),endButton=$('v02PursuitEnd');button.onclick=interact;endButton.onclick=()=>end();for(const type of ['pointerdown','mousedown','click'])panel.addEventListener(type,e=>e.stopPropagation());
 const css=document.createElement('style');css.textContent='#v02PursuitHUD{position:fixed;left:14px;bottom:195px;width:285px;box-sizing:border-box;padding:12px;border:1px solid #ddb977;border-radius:7px;background:#081e24ed;color:#def5ef;font:11px/1.45 monospace;z-index:27}#v02PursuitHUD[hidden]{display:none}#v02PursuitHUD strong{color:#ffda9b}#v02PursuitHUD p{margin:8px 0}#v02PursuitHUD small{display:block}#v02PursuitHUD div{display:flex;gap:8px;margin-top:9px}#v02PursuitHUD button{position:static;min-height:44px;padding:7px;margin:0;background:#153c40;color:#e8fff2;border:1px solid #8e8260;border-radius:4px;font:11px monospace}#v02PursuitHUD button:disabled{opacity:.45}@media(max-width:600px){#v02PursuitHUD{left:8px;bottom:185px;width:205px;padding:8px;font-size:10px}#v02PursuitHUD p{display:none}}@media(max-height:600px){#v02PursuitHUD{left:180px;bottom:10px;width:260px;padding:7px}#v02PursuitHUD p{display:none}#v02PursuitHUD div{margin-top:4px}}';document.head.append(css);
 addEventListener('keydown',e=>{if(e.code==='KeyI'&&!e.repeat&&!/INPUT|SELECT|TEXTAREA/.test(e.target?.tagName)&&hero()&&gameActive&&(active()||atAccess())){if(interact())e.preventDefault();}});
 const api={start,end,reset,tick,present,interact,isActive:active,ownsPresentation,state:()=>JSON.parse(JSON.stringify({...state,config,runner:runner?{position:runner.position.toArray(),speedLimit:config.speed}:null,canCapture:!!runner&&canCapture(),atAccess:!!config.id&&atAccess(),scope:'Supported pursuit prototype, not final character art or train-envelope certification'}))};
 window.verticalPursuit=api;window.verticalPursuitState=api.state;
 const originalText=window.render_game_to_text;if(originalText)window.render_game_to_text=()=>{const text=JSON.parse(originalText()),p=api.state();text.district??={};text.district.pursuit={phase:p.phase,runner:p.runner,canCapture:p.canCapture,waypoint:p.waypoint};return JSON.stringify(text)};
 return api;
})();
