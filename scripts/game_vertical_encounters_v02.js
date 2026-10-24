/* V02 graybox encounters. Uses existing legal combat; prototype opponents are
   deliberately retained until the district passes gameplay acceptance. */
const verticalEncounters=(()=>{
 const config={};
 const state={phase:'idle',attempt:null,elapsed:0,rewarded:false,message:'',reason:null,history:[],events:[],eventId:0};
 let lastHero=null,clock=0;
 function ensureConfig(){if(config.id)return true;const data=window.verticalDistrict?.encounter('service-combat');if(!data)return false;Object.assign(config,JSON.parse(JSON.stringify(data)));marker.position.set(...config.trigger).add(new THREE.Vector3(0,.015,0));return true;}
 const isHero=()=>characterState().active==='backspool';
 const own=()=>state.attempt!==null&&backspoolEncounterState().attempt===state.attempt;
 const inside=()=>ensureConfig()&&['x','y','z'].every((axis,i)=>s.pos[axis]>=config.bounds.min[i]&&s.pos[axis]<=config.bounds.max[i]);
 const near=()=>ensureConfig()&&Math.abs(s.pos.y-config.trigger[1]-.42)<2&&Math.hypot(s.pos.x-config.trigger[0],s.pos.z-config.trigger[2])<9;
 const actors=()=>own()?backspoolCombat.practice.filter(t=>t.sparring):[];
 const streetBusy=()=>['active','paused'].includes(actionWorldState().contracts.active?.status);
 function event(kind,detail={}){state.events.push({eventId:++state.eventId,time:+clock.toFixed(3),attempt:state.attempt,kind,...detail});if(state.events.length>64)state.events.shift();}
 function notice(text){state.message=text;return false;}
 function start(){
  if(!gameActive||!verticalDistrictState().ready||!isHero())return false;
  if(courier.trauma>=100)return notice('Recalibrate at the plaza, then return to the yard.');
  if(window.verticalMarket?.isActive())return notice('Finish or end the market rescue first.');
  if(!s.onGround||!(near()||own()&&inside()))return notice('Reach the service-yard access marker on the west side.');
  const street=actionWorldState().contracts.active;
  if(street&&['active','paused'].includes(street.status))return notice('Finish or end your street contract first.');
  if(backspoolEncounterState().active&&!own())return notice('End the current training or sparring encounter first.');
  const points=config.positions.map(p=>new THREE.Vector3(...p));
  if(!backspoolCombat.spawnPractice(points,{heightAware:true,validateOnly:true}))return notice('Yard placement is obstructed. Current encounter preserved.');
  // The existing encounter preflights all three before any old targets are removed.
  if(!backspoolEncounters.start(false,{positions:points,heightAware:true,preserveHealth:true}))return notice('Yard unavailable. Current encounter preserved.');
  const encounter=backspoolEncounterState();
  Object.assign(state,{phase:'active',attempt:encounter.attempt,elapsed:0,rewarded:false,reason:null,message:'Clear both levels. Stairs and the overhead route give you a flank; both galleries remain open.'});
  actors().forEach((t,i)=>{t.name=['Yard patrol · west','Yard patrol · lower','Yard patrol · mezzanine'][i];});
  event('started',{positions:points.map(p=>p.toArray())});present();return true;
 }
 function end(reason='ENDED'){
  if(state.phase==='active'){state.history.push({attempt:state.attempt,outcome:reason,elapsed:state.elapsed});event('ended',{reason});}
  if(own())backspoolEncounters.clear();
  state.phase='idle';state.attempt=null;state.reason=reason;state.message='Encounter ended. Your condition and global Halo consequences remain.';present();
 }
 function reset(reason='RESPAWN'){if(state.phase==='active'||own())end(reason);}
 function tick(dt){
  const hero=characterState().active;
  if(lastHero&&hero!==lastHero&&(state.phase==='active'||own()))end('HERO CHANGE');lastHero=hero;
  if(!gameActive||dt<=0)return;clock+=dt;
  if(state.phase!=='active')return;
  if(!own()||!backspoolEncounterState().active){state.phase='abandoned';state.reason='ENCOUNTER REPLACED';state.message='Yard encounter ended. Return to the access marker to retry.';event('ownership-lost');state.attempt=null;return;}
  state.elapsed+=dt;const encounter=backspoolEncounterState();
  if(encounter.outcome==='defeat'||courier.trauma>=100){state.phase='defeat';state.reason='DEFEAT';state.message='Defeated. Recalibrate and return; the yard never restores your condition.';event('defeat');}
  else if(encounter.outcome==='victory'&&!state.rewarded){state.phase='victory';state.rewarded=true;s.score+=config.reward;state.history.push({attempt:state.attempt,outcome:'victory',elapsed:state.elapsed,reward:config.reward});state.message='Yard secured · +'+config.reward+'. Continue to the market or transit interchange.';event('victory',{reward:config.reward});gameAudio.play('backspoolBank');}
  else if(!inside()){state.message='Outside the yard · opponents return to their positions without healing. Return or end the encounter.';}
 }
 function interact(){if(!near()||!isHero()||state.phase==='active')return false;start();return true;}
 function ownsPresentation(){return !window.verticalMarket?.ownsPresentation()&&isHero()&&gameActive&&(state.phase==='active'||own()||near()&&!streetBusy()&&!backspoolEncounterState().active);}
 function present(){
  const visible=ownsPresentation();panel.hidden=!visible;marker.visible=gameActive&&isHero()&&verticalDistrictState().ready;
  if(!visible)return;
  const active=state.phase==='active';title.textContent=config.title;
  description.textContent=state.message||'Three prototype patrol opponents across two levels. Use stairs, cover and the overhead maintenance route.';
  status.textContent=active?actors().filter(t=>t.hp>0).length+'/3 REMAIN · '+state.elapsed.toFixed(1)+'s':state.phase==='victory'?'SECURED · +'+config.reward:state.phase==='defeat'?'DEFEAT': 'I / Y · START AT ACCESS MARKER';
  startButton.textContent=active?'Restart encounter':state.phase==='victory'?'Play again':'Start encounter';startButton.disabled=(!near()&&!(own()&&inside()))||courier.trauma>=100;
  endButton.hidden=state.attempt===null;
  if(own())$('backspoolTrainingHUD').hidden=true;
  $('heroContractHUD').hidden=true;
  if(own()){const mission=$('missionText');if(mission)mission.textContent='SERVICE YARD · '+status.textContent;}
 }
 const panel=document.createElement('section');panel.id='v02EncounterHUD';panel.hidden=true;
 panel.innerHTML='<strong></strong><p></p><small></small><div><button id="v02EncounterStart">Start encounter</button><button id="v02EncounterEnd">End</button></div>';document.body.append(panel);
 const title=panel.querySelector('strong'),description=panel.querySelector('p'),status=panel.querySelector('small'),startButton=$('v02EncounterStart'),endButton=$('v02EncounterEnd');
 startButton.onclick=start;endButton.onclick=()=>end();for(const name of ['pointerdown','mousedown','click'])panel.addEventListener(name,e=>e.stopPropagation());
 const style=document.createElement('style');style.textContent='#v02EncounterHUD{position:fixed;left:14px;bottom:195px;width:275px;box-sizing:border-box;padding:12px;border:1px solid #70ccda;border-radius:7px;background:#081b28ed;color:#dbf5fa;font:11px/1.45 monospace;z-index:25}#v02EncounterHUD[hidden]{display:none}#v02EncounterHUD strong{color:#85e2ec}#v02EncounterHUD p{margin:8px 0}#v02EncounterHUD small{display:block;color:#ffd38c}#v02EncounterHUD div{display:flex;gap:8px;margin-top:9px}#v02EncounterHUD button{position:static;min-height:44px;margin:0;padding:7px;border:1px solid #538a9b;background:#143341;color:#e8faff;border-radius:4px;font:11px monospace}#v02EncounterHUD button:disabled{opacity:.45}@media(max-width:600px){#v02EncounterHUD{left:8px;bottom:185px;width:205px;padding:8px;font-size:10px}#v02EncounterHUD p{display:none}}@media(max-height:600px){#v02EncounterHUD{left:180px;bottom:10px;width:260px;padding:7px}#v02EncounterHUD p{display:none}#v02EncounterHUD div{margin-top:4px}}';document.head.append(style);
 const marker=new THREE.Mesh(new THREE.RingGeometry(1.15,1.32,32),new THREE.MeshBasicMaterial({color:0x78e5ef,side:THREE.DoubleSide,transparent:true,opacity:.65,depthWrite:false}));marker.name='Service yard / interaction access';marker.rotation.x=-Math.PI/2;marker.visible=false;scene.add(marker);
 addEventListener('keydown',e=>{if(e.code==='KeyI'&&!e.repeat&&!/INPUT|SELECT|TEXTAREA/.test(e.target?.tagName)&&near()&&gameActive&&isHero()){e.preventDefault();interact();}});
 const api={start,restart:start,end,reset,tick,present,interact,ownsPresentation,ownsAttempt:a=>a===state.attempt&&state.attempt!==null,state:()=>{ensureConfig();return JSON.parse(JSON.stringify({...state,config,near:near(),inside:inside(),opponents:actors().map(t=>({id:t.id,hp:t.hp,phase:t.phase,position:t.group.position.toArray()})),scope:'Service-yard prototype combat only; rescue and pursuit pending'}))}};
 window.verticalEncounters=api;window.verticalEncounterState=api.state;return api;
})();
