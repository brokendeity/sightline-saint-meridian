/* Original courier investigation. Native reset then ordinary standard-pad
 * look, jump, aim and fire only. No camera/hero/target/resource writes. */
const{openMarket,selectHero,D}=require('./market_test_helpers.cjs'),{saveEvidence}=require('./evidence_io.cjs');
const report={status:'PROBE',scope:'Original Sightline courier airborne approach to first recovery marker through native jump/open-sky flight and actual anchor acquisition. Not whole mission certification.'};
(async()=>{let h;try{h=await openMarket(report);const{p,step,capture}=h;await selectHero(p,'sightline',step,report);await p.evaluate(()=>{resetPlayer();clearInput();startGame(false);marketPad.axes=[0,0,0,0];marketPad.buttons[6]={pressed:true,value:1};});await step(10);
 async function row(){return p.evaluate(()=>({position:s.pos.toArray(),velocity:s.vel.toArray(),mode:s.mode,grounded:s.onGround,trauma:courier.trauma,pressure:s.pressure,target:s.target?.toArray(),targetObject:s.targetObj?.name,firstVisited:courier.routeAnchors[0].visited}));}
 async function aim(kind){let last;for(let i=0;i<720;i++){
  last=await p.evaluate(kind=>{camera.updateMatrixWorld(true);const group=courier.routeAnchors[0].group,point=kind==='sky'?s.pos.clone().add(new THREE.Vector3(0,300,-70)):group.getWorldPosition(new THREE.Vector3());const d=point.clone().sub(camera.position).normalize(),view=camera.getWorldDirection(new THREE.Vector3()),yaw=angleDelta(Math.atan2(-view.x,-view.z),Math.atan2(-d.x,-d.z)),pitch=Math.asin(d.y)-Math.asin(view.y),len=Math.hypot(yaw,pitch),m=Math.min(1,len*6),raw=m?.1+.9*m:0;marketPad.axes[2]=len?-yaw/len*raw:0;marketPad.axes[3]=len?-pitch/len*raw:0;return{acquired:kind==='sky'?len<.0012:s.targetObj?.userData.anchorGroup===group,error:len,point:point.toArray(),hit:s.target?.toArray(),mode:s.mode,position:s.pos.toArray(),camera:camera.position.toArray()};},kind);
  await step();if(i%30===0)(report.aim??=[]).push({kind,...last});if(last.acquired)break;
 }
 await p.evaluate(()=>marketPad.axes=[0,0,0,0]);await step(3);return last;
 }
 async function fire(){await p.evaluate(()=>marketPad.buttons[7]={pressed:true,value:1});await step();await p.evaluate(()=>marketPad.buttons[7]={pressed:false,value:0});}
 report.initial=await row();report.skyAim=await aim('sky');
 if(!report.skyAim.acquired)throw Error('Normal controller did not reach sky aiming angle');
 await p.evaluate(()=>{marketPad.buttons[6]={pressed:false,value:0};marketPad.buttons[0]={pressed:true,value:1};});await step(2);await p.evaluate(()=>{marketPad.buttons[0]={pressed:false,value:0};marketPad.buttons[6]={pressed:true,value:1};});await step(2);report.beforeFirstFire=await row();await fire();let seenTransit=false;
 for(let i=0;i<360;i++){await step();const r=await row();if(i%10===0)(report.skyFlight??=[]).push(r);if(r.mode==='TRANSIT')seenTransit=true;if(seenTransit&&r.mode!=='TRANSIT')break;}
 report.afterSky=await row();report.anchorAim=await aim('anchor');
 if(report.anchorAim.acquired){await fire();for(let i=0;i<480;i++){await step();const r=await row();if(i%10===0)(report.anchorFlight??=[]).push(r);if(r.firstVisited)break;}}
 report.final=await row();await capture('original-airborne-recovery');report.status='PROBE completed: '+(report.final.firstVisited?'first original recovery marker reached by native airborne flight':'airborne recovery approach remains unresolved');console.log(report.status,JSON.stringify(report.final));
}catch(e){report.status='FAIL probe execution';report.failure=e.stack||String(e);console.error(e);process.exitCode=1;}finally{await h?.browser.close();saveEvidence(D,'V02_Original_Courier_Air_Probe.json',report);}})();
