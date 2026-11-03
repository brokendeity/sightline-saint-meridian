/* Original courier investigation. Native reset then ordinary standard-pad
 * look, jump, aim and fire only. No camera/hero/target/resource writes. */
const{openMarket,selectHero,D}=require('./market_test_helpers.cjs'),{saveEvidence}=require('./evidence_io.cjs');
const report={status:'PROBE',scope:'Original Sightline courier queued airborne approach to first recovery marker through native jump/open-sky flight and actual anchor acquisition. Read-only delegating contact/arrival/drop instrumentation around the original three-role courier attempt with native mission conditions, hero switch, actual flight/landing and extraction; no actor/health/target/resource writes after native reset.'};
(async()=>{let h;try{h=await openMarket(report);const{p,step,capture}=h;await selectHero(p,'sightline',step,report);await p.evaluate(()=>{resetPlayer();clearInput();startGame(false);marketPad.axes=[0,0,0,0];marketPad.buttons[6]={pressed:true,value:1};});await step(10);
 await p.evaluate(()=>{
  const events=window.__courierContactJournal=[];
  const snapshot=()=>({clock:courier.clock,hero:s.pos.toArray(),velocity:s.vel.toArray(),mode:s.mode,pressure:s.pressure,trauma:courier.trauma,passengers:courier.passengers.length,target:s.transitTarget?.toArray(),targetUUID:s.transitObj?.uuid,targetName:s.transitObj?.name});
  function log(event){events.push(event);if(events.length>300)events.shift();}
  const hit=handleTransitCollision;handleTransitCollision=function(c){const e={kind:'transit-contact',before:snapshot(),normal:c.normal.toArray(),point:c.point.toArray(),collider:{id:c.collider.id,type:c.collider.type,friendly:!!c.collider.friendly,meshUUID:c.collider.mesh?.uuid,ownerUUID:c.collider.owner?.mesh?.uuid,box:[c.collider.box.min.toArray(),c.collider.box.max.toArray()]}};try{return hit(c);}finally{e.after=snapshot();log(e);}};
  const lose=loseControl;loseControl=function(...args){const e={kind:'lose-control',before:snapshot(),stack:new Error().stack.split('\n').slice(1,5)};try{return lose(...args);}finally{e.after=snapshot();log(e);}};
  const arrive=arriveTransit;arriveTransit=function(...args){const e={kind:'arrival',before:snapshot()};try{return arrive(...args);}finally{e.after=snapshot();log(e);}};
  const drop=dropVIP;dropVIP=function(...args){const e={kind:'drop-passengers',before:snapshot(),stack:new Error().stack.split('\n').slice(1,5)};try{return drop(...args);}finally{e.after=snapshot();log(e);}};
 });
 async function row(){return p.evaluate(()=>({position:s.pos.toArray(),velocity:s.vel.toArray(),mode:s.mode,grounded:s.onGround,trauma:courier.trauma,pressure:s.pressure,target:s.target?.toArray(),targetObject:s.targetObj?.name,firstVisited:courier.routeAnchors[0].visited}));}
 async function aim(kind,index=0){let last;for(let i=0;i<720;i++){
  last=await p.evaluate(({kind,index})=>{camera.updateMatrixWorld(true);const group=courier.routeAnchors[index].group;let point;
   if(kind==='sky')point=s.pos.clone().add(new THREE.Vector3(0,300,-70));
   else if(kind==='roof'){
    const c=courier.civilians[index],candidates=[[2.4,0],[-2.4,0],[0,2.4],[0,-2.4]].map(([x,z])=>c.group.position.clone().add(new THREE.Vector3(x,0,z)));
    point=candidates.find(q=>Math.abs(supportHeight(q.x,q.z,c.group.position.y+.65)-.42-c.group.position.y)<.15);if(!point)throw Error('No supported landing point beside original civilian '+index);point.y=supportHeight(point.x,point.z,c.group.position.y+.65)-.42+.01;
   }else if(kind==='extraction')point=dropZone.group.position.clone();
   else point=group.getWorldPosition(new THREE.Vector3());const d=point.clone().sub(camera.position).normalize(),view=camera.getWorldDirection(new THREE.Vector3()),yaw=angleDelta(Math.atan2(-view.x,-view.z),Math.atan2(-d.x,-d.z)),pitch=Math.asin(d.y)-Math.asin(view.y),len=Math.hypot(yaw,pitch),m=Math.min(1,len*6),raw=m?.1+.9*m:0;marketPad.axes[2]=len?-yaw/len*raw:0;marketPad.axes[3]=len?-pitch/len*raw:0;return{acquired:kind==='sky'?len<.0012:kind==='roof'?s.targetObj===courier.civilians[index].roof.mesh&&s.targetNormal.y>.5&&!!s.target&&s.target.distanceTo(point)<1.2:kind==='extraction'?!!s.target&&s.target.y<1&&s.target.distanceTo(point)<2:s.targetObj?.userData.anchorGroup===group,error:len,point:point.toArray(),hit:s.target?.toArray(),mode:s.mode,position:s.pos.toArray(),camera:camera.position.toArray()};},{kind,index});
  if(kind!=='sky'&&last.acquired){await p.evaluate(()=>marketPad.axes=[0,0,0,0]);return last;}await step();if(i%30===0)(report.aim??=[]).push({kind,...last});if(last.acquired)break;
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
 if(report.precisionResult.first){
  const before=await p.evaluate(()=>({passengers:courier.passengers.length,score:s.score,roles:courier.civilians.map(c=>c.rescued),health:100-courier.trauma}));
  await selectHero(p,'backspool',step,report);await step(30);const during=await p.evaluate(()=>({passengers:courier.passengers.length,score:s.score,roles:courier.civilians.map(c=>c.rescued),health:100-courier.trauma}));
  await selectHero(p,'sightline',step,report);await step(2);const after=await p.evaluate(()=>({passengers:courier.passengers.length,score:s.score,roles:courier.civilians.map(c=>c.rescued),health:100-courier.trauma}));
  report.heroSwitch={before,during,after};if(before.passengers!==after.passengers||JSON.stringify(before.roles)!==JSON.stringify(after.roles))throw Error('Hero switching lost actual courier progress');
  async function skyJump(){
   await p.evaluate(()=>{marketPad.buttons[1]={pressed:false,value:0};marketPad.buttons[6]={pressed:true,value:1};marketPad.axes=[0,0,0,0];});const a=await aim('sky');if(!a.acquired)throw Error('Could not acquire native sky flight direction');
   if(await p.evaluate(()=>s.onGround)){await p.evaluate(()=>{marketPad.buttons[6]={pressed:false,value:0};marketPad.buttons[0]={pressed:true,value:1};});await step(2);await p.evaluate(()=>{marketPad.buttons[0]={pressed:false,value:0};marketPad.buttons[6]={pressed:true,value:1};});await step(2);}
   await fire();
  }
  for(const victim of[1,2]){
   const phase={victim,role:victim===1?'DISRUPTION':'CROSSCUT',before:await p.evaluate(()=>({courier:courierState(),clock:courier.clock,crosscutAt:courier.crosscutAt}))};(report.rescues??=[]).push(phase);
   await skyJump();const anchorIndex=victim*2+1;phase.anchorAim=await aim('anchor',anchorIndex);if(!phase.anchorAim.acquired)throw Error('Could not acquire original approach anchor '+anchorIndex);await fire();
   let active=false;for(let i=0;i<2000;i++){active=await p.evaluate(index=>s.mode===P.TRANSIT&&s.transitObj?.userData.anchorGroup===courier.routeAnchors[index].group,anchorIndex);if(active)break;await step();}if(!active)throw Error('Approach rail did not begin');
   await p.evaluate(()=>marketPad.buttons[1]={pressed:true,value:1});phase.roofAim=await aim('roof',victim);if(!phase.roofAim.acquired)throw Error('Could not acquire a supported roof landing beside civilian '+victim);await fire();
   for(let i=0;i<2400;i++){
    await step();const r=await p.evaluate(index=>({position:s.pos.toArray(),velocity:s.vel.toArray(),mode:s.mode,grounded:s.onGround,trauma:courier.trauma,pressure:s.pressure,rescued:courier.civilians[index].rescued,passengers:courier.passengers.length,crosscuts:courier.crosscuts,crosscutAge:courier.clock-courier.crosscutAt,bloomAge:courier.clock-courier.lastBloom,visited:courier.routeAnchors[index*2+1].visited,queued:!!s.queued,clock:courier.clock}),victim);
    if(i%10===0)(phase.trace??=[]).push(r);if(r.rescued||r.trauma>=100){phase.final=r;break;}
   }
   if(!phase.final?.rescued)throw Error('Original rescue condition was not completed for '+phase.role);await capture('courier-'+phase.role.toLowerCase());
  }
  await skyJump();report.extractionAim=await aim('extraction');if(!report.extractionAim.acquired)throw Error('Original extraction pad remains occluded');await fire();
  for(let i=0;i<6000;i++){
   await step();const r=await p.evaluate(()=>({position:s.pos.toArray(),mode:s.mode,results:courier.resultsOpen,rank:courier.rankSummary,trauma:courier.trauma}));if(i%30===0)(report.extractionTrace??=[]).push(r);if(r.results){report.completion=r;break;}
  }
  if(!report.completion?.results||report.completion.rank.failed||report.completion.rank.rescues!==3)throw Error('Original courier did not reach successful three-person extraction');await capture('original-courier-complete');
 }
 report.final=await row();await capture('original-precision-recovery');report.status=report.completion?.results?'PASS original three-role courier through real inputs and extraction':'PROBE completed: '+(report.precisionResult.first?'first PRECISION civilian rescued through native flight/brake/landing':report.final.firstVisited?'recovery marker reached; precision descent unresolved':'airborne recovery approach remains unresolved');console.log(report.status,JSON.stringify(report.final));
}catch(e){report.status='FAIL probe execution';report.failure=e.stack||String(e);console.error(e);process.exitCode=1;}finally{if(h)report.contactJournal=await h.p.evaluate(()=>window.__courierContactJournal||[]).catch(()=>[]);await h?.browser.close();saveEvidence(D,'V02_Original_Courier_Contact_Diagnostics.json',report);}})();
