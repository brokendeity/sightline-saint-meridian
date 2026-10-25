/* One labelled service-yard fixture. Real bank/strike/release controls and
 * supported gallery movement thereafter; no HP, action, actor or power writes. */
const {openMarket,D}=require('./market_test_helpers.cjs');
const {saveEvidence}=require('./evidence_io.cjs');
const assert=require('assert/strict');
const report={status:'FAIL',scope:'Local service-yard Echo contact, two public gallery escapes and encounter cleanup. One initial player/camera fixture followed by DOM keys/mouse and simulated movement axes. Not full hero/mission or final character-art acceptance.',results:[],stages:[]};
(async()=>{let h;try{
 h=await openMarket(report);const{p,step,move,stop}=h;
 await p.evaluate(()=>{resetPlayer();clearInput();clearPad();startGame(false);s.pos.set(64,52.42,333.2);s.vel.set(0,0,0);s.onGround=true;setMode(P.GROUND);s.yaw=cam.yaw=cam.targetYaw=0;cam.pitch=cam.targetPitch=-.12;cam.focus.copy(s.pos).add(new THREE.Vector3(0,1.32,0));camera.position.copy(s.pos).add(new THREE.Vector3(1.35,2.4,4.24));camera.lookAt(cam.focus);camera.updateMatrixWorld(true);marketPad.axes=[0,0,0,0]});await step(4);
 const read=()=>p.evaluate(()=>({p:s.pos.toArray(),grounded:s.onGround,trauma:courier.trauma,encounter:verticalEncounterState(),powers:backspoolPowerState(),combat:backspoolCombatState(),targets:backspoolCombat.practice.map(t=>({id:t.id,hp:t.hp,position:t.group.position.toArray(),phase:t.phase}))}));
 const capture=async name=>{await p.evaluate(()=>renderNight(0));await p.screenshot({path:D+'/evidence/service-replay-'+name+'.png'})};
 const mark=async name=>{const st=await read();report.stages.push({name,p:st.p,trauma:st.trauma,phase:st.encounter.phase,targets:st.targets,powers:st.powers});console.log(name,JSON.stringify({p:st.p,trauma:st.trauma,hp:st.targets.map(t=>t.hp),events:st.powers.events.slice(-3)}));saveEvidence(D,'V02_Service_Replay_Escape.json',report);return st};
 await p.keyboard.press('i');await step(2);assert.equal((await read()).encounter.phase,'active');
 await p.keyboard.press('2');await step(2);await p.keyboard.press('f');await step(2);
 const initial=await mark('started through actual interaction');report.initialTrauma=initial.trauma;report.initialScore=await p.evaluate(()=>s.score);
 const firstTarget=initial.targets.sort((a,b)=>Math.hypot(a.position[0]-64,a.position[2]-333.2)-Math.hypot(b.position[0]-64,b.position[2]-333.2))[0];
 async function bankStrike(){
  await p.mouse.up({button:'right'});await p.keyboard.down('g');await p.keyboard.press('q');
  let st;for(let i=0;i<100;i++){await step();st=await read();if(st.powers.slots.some(s=>s.kind==='strike'&&!s.playing))break;assert(st.trauma<100,'Defeated before recording completed')}
  await p.keyboard.up('g');await p.mouse.down({button:'right'});await step(2);
  st=await read();const slot=st.powers.slots.find(s=>s.kind==='strike'&&!s.playing);assert(slot,'Legal banked strike did not finish');assert(slot.moveId&&slot.executedContacts.length,'Stored strike must retain authored move/contact markers');return{slot,state:st};
 }
 // Reach strike distance with normal movement, as in the yard victory case.
 for(let i=0;i<240;i++){
  const distance=await p.evaluate(id=>{const t=backspoolCombat.practice.find(t=>t.id===id);if(!t)throw Error('Live target missing');const dx=t.group.position.x-s.pos.x,dz=t.group.position.z-s.pos.z,d=Math.hypot(dx,dz);marketPad.axes[0]=d>1.25?(dx*Math.cos(cam.yaw)-dz*Math.sin(cam.yaw))/d*.7:0;marketPad.axes[1]=d>1.25?-(-dx*Math.sin(cam.yaw)-dz*Math.cos(cam.yaw))/d*.7:0;return d},firstTarget.id);await step();if(distance<=1.3)break;
 }
 await stop();
 const recorded=await bankStrike();report.recorded=recorded;await mark('completed legal action bank');await capture('banked');
 // Bait the native opponent toward the immutable action, rather than
 // expecting it to walk closer than its ordinary2.3m melee stand-off.
 await p.mouse.up({button:'right'});
 const origin=recorded.slot.origin,away=[origin[0]-firstTarget.position[0],origin[2]-firstTarget.position[2]],length=Math.hypot(...away);
 await move([origin[0]+away[0]/length*1.1,52,origin[2]+away[1]/length*1.1]);await p.mouse.down({button:'right'});await step(2);
 report.baitPosition=(await read()).p;
 // An Echo stays world-anchored. Keep the player at its actual origin and
 // guard while the original melee target approaches the recorded attack.
 let ready=false;report.targetApproach=[];
 for(let i=0;i<300;i++){
  const st=await read(),target=st.targets.find(t=>t.id===firstTarget.id);assert(target&&target.hp>0,'Recording must leave its intended Echo target alive');
  if(i%15===0)report.targetApproach.push({position:target.position,phase:target.phase,player:st.p,recordingDistance:Math.hypot(target.position[0]-recorded.slot.origin[0],target.position[2]-recorded.slot.origin[2])});
  if(Math.hypot(target.position[0]-recorded.slot.origin[0],target.position[2]-recorded.slot.origin[2])<1.8&&!st.combat.staggered){ready=true;break;}
  await step();assert(st.trauma<100,'Defeat waiting at the actual recording origin');
 }
 assert(ready,'Target did not re-enter the recorded action through its native approach');
 const before=await read(),cursor=before.powers.eventCursor;await p.keyboard.press('h');await step(90);const echoed=await mark('Echo played against live yard opponent');
 const hits=echoed.powers.events.filter(e=>e.eventId>cursor&&e.kind==='echo-hit'&&e.recordingId===recorded.slot.id&&e.target===firstTarget.id);
 assert(hits.length,'Released recorded contacts did not hit the intended actual opponent');assert(hits.every(e=>e.damage>0&&e.moveId===recorded.slot.moveId&&e.moveVersion===recorded.slot.moveVersion),'Echo must use the immutable recorded move and legal damage');
 const targetBefore=before.targets.find(t=>t.id===firstTarget.id),targetAfter=echoed.targets.find(t=>t.id===firstTarget.id);assert(targetAfter.hp<targetBefore.hp,'An Echo hit must reduce actual opponent health');report.echoEvidence={recordingId:recorded.slot.id,targetId:firstTarget.id,hits,hpBefore:targetBefore.hp,hpAfter:targetAfter.hp};
 report.results.push({name:'actual G/Q/H inputs bank and release a versioned strike; confirmed Echo damages the matching live service opponent',pass:true});await capture('echo');
 await p.mouse.up({button:'right'});await stop();
 // Both routes remain actual public circulation while the attempt is live.
 const traceStart=report.trace.length;
 for(const target of [[55,52,333.2],[55,52,346]])await move(target);
 const west=await mark('west public gallery escape');assert.equal(west.encounter.phase,'active');assert.equal(west.encounter.inside,false);assert(west.trauma<100);await capture('west-escape');
 for(const target of [[55,52,350],[96,52,350],[96,52,346]])await move(target);
 const east=await mark('east public gallery escape via return crossing');assert.equal(east.encounter.phase,'active');assert.equal(east.encounter.inside,false);assert(east.trauma<100);await capture('east-escape');
 assert(report.trace.slice(traceStart).every(r=>r.grounded),'Public escape must use supported circulation');report.condition={initial:report.initialTrauma,afterEcho:echoed.trauma,west:west.trauma,east:east.trauma,policy:'Native condition recovery remains enabled during elapsed world time. This scenario does not isolate health-regeneration timing.'};
 report.results.push({name:'both public gallery exits remain reachable through ordinary supported movement during the live encounter',pass:true});
 await p.locator('#v02EncounterEnd').click();await step(2);const ended=await mark('ended through encounter control');assert.equal(ended.encounter.phase,'idle');assert.equal(ended.targets.length,0);assert(ended.powers.slots.every(s=>!s.kind));assert(!ended.powers.recording&&!ended.powers.retracing);report.condition.afterEnd=ended.trauma;await capture('ended');
 report.results.push({name:'End removes owned opponents and replay state; native condition values are recorded',pass:true});report.final=ended;assert.deepEqual(report.errors,[]);report.status='PASS local service Echo contact and two supported public escapes';console.log(report.status);
 }catch(e){report.failure=String(e);console.error(e);process.exitCode=1;}finally{if(h){await h.p.evaluate(()=>renderNight(0)).catch(()=>{});await h.p.screenshot({path:D+'/evidence/service-replay-final.png'}).catch(()=>{});await h.browser.close()}saveEvidence(D,'V02_Service_Replay_Escape.json',report)}})();
