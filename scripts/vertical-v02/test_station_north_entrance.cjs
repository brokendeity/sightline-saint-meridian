/* One labelled Y100 fixture, then native movement through the two authored
 * station walk-outs. This isolates corridor geometry; full ability routes
 * remain covered separately by momentum/mastery normal-input tests. */
const{openMarket,D}=require('./market_test_helpers.cjs'),{saveEvidence}=require('./evidence_io.cjs'),assert=require('assert/strict');
const report={status:'FAIL',scope:'One local Y100 player/camera setup at the authored momentum touchdown; native simulated-controller movement through momentum and mastery station walk-outs and back. Not a full rail/wall route.',results:[],stages:[]};
(async()=>{let h;try{
 h=await openMarket(report);const{p,step,move,walking}=h;
 await p.evaluate(()=>{s.pos.set(63.19367,100.42,362.17536);s.vel.set(0,0,0);s.onGround=true;setMode(P.GROUND);s.yaw=cam.yaw=cam.targetYaw=0;cam.pitch=cam.targetPitch=-.12;cam.focus.copy(s.pos).add(new THREE.Vector3(0,1.32,0));camera.position.copy(cam.focus).add(new THREE.Vector3(1.35,1,4.25));camera.lookAt(cam.focus);camera.updateMatrixWorld(true)});
 report.trace=[];await step(4);await walking(false);
 for(const[name,points]of [['momentum',[[66.5,100,376],[63.19367,100,362.17536]]],['mastery',[[64,100,363],[66.5,100,376],[64,100,363]]]]){
  for(const t of points){const st=await move(t,{maxFrames:400});report.stages.push({name,target:t,position:st.p,frame:h.frames()});saveEvidence(D,'V02_Station_North_Entrance.json',report);console.log('Reached',name,t,st.p);}
  report.results.push({name,pass:true,points});console.log('PASS station north walk-out',name);
 }
 assert(report.trace.every(r=>r.grounded));assert(report.trace.every(r=>r.trauma===0));assert.equal(await p.evaluate(()=>threadrailGame.state().releaseEvents.length),0);assert.deepEqual(report.errors,[]);
 await p.evaluate(()=>renderNight(0));await p.screenshot({path:D+'/evidence/station-north-entrance-normal-input.png'});
 report.status='PASS both station approach walk-outs through physical north portal';
 }catch(e){report.failure=String(e);console.error(e);process.exitCode=1;}finally{if(h)await h.browser.close();saveEvidence(D,'V02_Station_North_Entrance.json',report)}})();
