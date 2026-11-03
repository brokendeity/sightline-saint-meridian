/* Original courier investigation. Native reset then ordinary standard-pad
 * look, jump, aim and fire only. No camera/hero/target/resource writes. */
const{openMarket,selectHero,D}=require('./market_test_helpers.cjs'),{saveEvidence}=require('./evidence_io.cjs');
const report={status:'PROBE',scope:'Original Sightline courier queued airborne approach to first recovery marker through native jump/open-sky flight and actual anchor acquisition. First precision landing/rescue only; not whole mission certification.'};
(async()=>{let h;try{h=await openMarket(report);const{p,step,capture}=h;await selectHero(p,'sightline',step,report);await p.evaluate(()=>{resetPlayer();clearInput();startGame(false);marketPad.axes=[0,0,0,0];marketPad.buttons[6]={pressed:true,value:1};});await step(10);
 async function row(){return p.evaluate(()=>({position:s.pos.toArray(),velocity:s.vel.toArray(),mode:s.mode,grounded:s.onGround,trauma:courier.trauma,pressure:s.pressure,target:s.target?.toArray(),targetObject:s.targetObj?.name,firstVisited:courier.routeAnchors[0].visited}));}
 async function aim(kind){let last;for(let i=0;i<720;i++){
  last=await p.evaluate(kind=>{camera.updateMatrixWorld(true);const group=courier.routeAnchors[0].group,point=kind==='sky'?s.pos.clone().add(new THREE.Vector3(0,300,-70)):group.getWorldPosition(new THREE.Vector3());const d=point.clone().sub(camera.position).normalize(),view=camera.getWorldDirection(new THREE.Vector3()),yaw=angleDelta(Math.atan2(-view.x,-view.z),Math.atan2(-d.x,-d.z)),pitch=Math.asin(d.y)-Math.asin(view.y),len=Math.hypot(yaw,pitch),m=Math.min(1,len*6),raw=m?.1+.9*m:0;marketPad.axes[2]=len?-yaw/len*raw:0;marketPad.axes[3]=len?-pitch/len*raw:0;return{acquired:kind==='sky'?len<.0012:s.targetObj?.userData.anchorGroup===group,error:len,point:point.toArray(),hit:s.target?.toArray(),mode:s.mode,position:s.pos.toArray(),camera:camera.position.toArray()};},kind);
  if(kind==='anchor'&&last.acquired){await p.evaluate(()=>marketPad.axes=[0,0,0,0]);return last;}await step();if(i%30===0)(report.aim??=[]).push({kind,...last});if(last.acquired)break;
 }
 await p.evaluate(()=>marketPad.axes=[0,0,0,0]);await step(3);return last;
 }
 async function fire(){await p.evaluate(()=>marketPad.buttons[7]={pressed:true,value:1});await step();await p.evaluate(()=>marketPad.buttons[7]={pressed:false,value:0});}
 report.initial=await row();report.skyAim=await aim('sky');
 if(!report.skyAim.acquired)throw Error('Normal controller did not reach sky aiming angle');
 await p.evaluate(()=>{marketPad.buttons[6]={pressed:false,value:0};marketPad.buttons[0]={pressed:true,value:1};});await step(2);await p.evaluate(()=>{marketPad.buttons[0]={pressed:false,value:0};marketPad.buttons[6]={pressed:true,value:1};});await step(2);report.beforeFirstFire=await row();await fire();
 report.afterSky=await row();report.anchorAim=await aim('anchor');
 if(report.anchorAim.acquired){await fire();for(let i=0;i<1800;i++){await step();const r=await row();if(i%10===0)(report.anchorFlight??=[]).push(r);if(r.firstVisited||r.trauma>=100)break;}}
 if(await p.evaluate(()=>courier.routeAnchors[0].visited)){
  await p.evaluate(()=>{marketPad.buttons[1]={pressed:true,value:1};marketPad.buttons[6]={pressed:false,value:0};marketPad.axes=[0,0,0,0];});
  let groundFrames=0;
  for(let i=0;i<2400;i++){
   const t=await p.evaluate(()=>{const c=courier.civilians[0],dx=c.group.position.x-s.pos.x,dz=c.group.position.z-s.pos.z,d=Math.hypot(dx,dz),m=Math.min(1,Math.max(.12,d/4)),raw=.1+.9*m;marketPad.axes[0]=d>.3?(dx*Math.cos(cam.yaw)-dz*Math.sin(cam.yaw))/d*raw:0;marketPad.axes[1]=d>.3?-(-dx*Math.sin(cam.yaw)-dz*Math.cos(cam.yaw))/d*raw:0;return{rescued:c.rescued,distance:d,dy:s.pos.y-c.group.position.y,hero:s.pos.toArray(),velocity:s.vel.toArray(),mode:s.mode,grounded:s.onGround,trauma:courier.trauma};});
   await step();if(i%10===0)(report.precisionApproach??=[]).push(t);
   if(t.rescued||t.trauma>=100)break;
   groundFrames=t.grounded?groundFrames+1:0;if(groundFrames>20&&(Math.abs(t.dy)>.8||t.distance>20)){report.wrongLanding=t;break;}
  }
 }
 report.precisionResult=await p.evaluate(()=>({passengers:courier.passengers.length,first:courier.civilians[0].rescued,hero:s.pos.toArray(),civilian:courier.civilians[0].group.position.toArray(),trauma:courier.trauma}));
 report.final=await row();await capture('original-precision-recovery');report.status='PROBE completed: '+(report.precisionResult.first?'first PRECISION civilian rescued through native flight/brake/landing':report.final.firstVisited?'recovery marker reached; precision descent unresolved':'airborne recovery approach remains unresolved');console.log(report.status,JSON.stringify(report.final));
}catch(e){report.status='FAIL probe execution';report.failure=e.stack||String(e);console.error(e);process.exitCode=1;}finally{await h?.browser.close();saveEvidence(D,'V02_Original_Courier_Precision_Probe.json',report);}})();
