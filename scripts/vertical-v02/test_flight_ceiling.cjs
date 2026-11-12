/* Real-input checks for the V02 flight ceiling, run against the ceiling build and, as a control, the build it was made from.
   Inputs: a virtual standard pad read by the game's own poll (A jump, LT aim, RT fire, right stick look) and menu clicks
   to pick Sightline. Labelled test setup, as in the other V02 tests: before each block the player is placed on the open
   plaza, drones are held in patrol, courier guards are stunned and projectiles are cleared; frames are stepped with
   tickFrame while the game's own frame loop is held. No other state is written. The test asserts no hostile shot lands.
   1. Chained open-sky rails, fired straight up: the control climbs without limit; the ceiling build stays under the
      ceiling, the first rail that would pass the tallest roof ends on it along the crosshair, later rails run level,
      and the laser preview shows the endpoint that is flown.
   2. Two sky rails then a free coast: the climb levels off smoothly under the ceiling and horizontal speed is kept.
   3. Unchanged behaviour: a sky rail below the roof line and a ground rail to a façade fly identical paths in both builds. */
const{chromium}=require('/opt/homebrew/lib/node_modules/playwright'),assert=require('assert/strict'),fs=require('fs');
const D='development/vertical-city-v02/',build=JSON.parse(fs.readFileSync(D+(process.env.V02_ACTION_BUILD||'V02_Flight_Ceiling_Build.json')));
const OUT=process.env.V02_CEILING_OUT||D+'evidence/flight-ceiling';fs.mkdirSync(OUT,{recursive:true});
const LT=6,RT=7,A=0;
async function open(browser,entry,errors){
 const p=await browser.newPage({viewport:{width:1280,height:800}});p.on('pageerror',e=>errors.push(entry+': '+e.message));
 await p.addInitScript(()=>{const up={pressed:false,value:0};window.testPad={id:'test pad',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>up)};navigator.getGamepads=()=>[window.testPad];});
 await p.goto('http://127.0.0.1:8766/'+entry+'?capture=backspool');
 await p.waitForFunction(()=>typeof gameReady!=='undefined'&&gameReady&&window.characterState&&!characterState().busy&&roadNetworkState().ready,null,{timeout:300000});
 await p.waitForFunction(()=>verticalWorldLifeState().ready&&v02EastPublicLightingState().ready&&v02RimShadowState().ready,null,{timeout:120000});
 await p.locator('#v02Start').click();await p.evaluate(()=>{window.requestAnimationFrame=()=>0});
 const g={p,
  pad:(buttons,axes)=>p.evaluate(([b,a])=>{testPad.buttons=testPad.buttons.map((x,i)=>b.includes(i)?{pressed:true,value:1}:{pressed:false,value:0});testPad.axes=a;},[buttons,axes]),
  // One frame per call so every frame is recorded.
  frame:()=>p.evaluate(()=>{tickFrame(1/60,false);const L=laserGeom.attributes.position.array;return{pos:[s.pos.x,s.pos.y,s.pos.z],vy:s.vel.y,h:Math.hypot(s.vel.x,s.vel.z),mode:s.mode,onGround:s.onGround,
   target:s.target?[s.target.x,s.target.y,s.target.z]:null,targetObj:!!s.targetObj,laserEnd:[L[3],L[4],L[5]],ray:{o:raycaster.ray.origin.toArray(),d:raycaster.ray.direction.toArray()},banner:document.getElementById('bannerBig').textContent}}),
  plaza:(yaw=0,x=0,z=12)=>p.evaluate(([yaw,x,z])=>{for(const e of enemies){cancelEnemyAttack(e);e.alertState='PATROL';e.alertCooldown=1e6;}for(const q of courier.guards){cancelEnemyAttack(q);q.stun=1e6;}for(const q of projectiles)disposeObject(q.m);projectiles.length=0;
   resetPlayer();clearInput();clearPad();startGame(false);s.pos.set(x,.42,z);s.vel.set(0,0,0);s.onGround=true;setMode(P.GROUND);s.yaw=cam.yaw=cam.targetYaw=yaw;cam.pitch=cam.targetPitch=-.08;for(let i=0;i<90;i++)tickFrame(1/60,false)},[yaw,x,z]),
  shots:()=>p.evaluate(()=>mechanicPolish.shots),
  menu:async()=>{await p.evaluate(()=>{window.requestAnimationFrame=cb=>setTimeout(()=>cb(performance.now()),16)});if(await p.evaluate(()=>gameActive))await p.keyboard.press('Escape');await p.waitForTimeout(250);},
  hero:async h=>{await g.menu();await p.click('#v02Tab-hero');await p.selectOption('#characterChoice',h);await p.waitForFunction(h=>characterState().hero===h&&!characterState().busy,h,{timeout:300000});await p.click('#v02Tab-overview');await p.locator('#start').click();await p.evaluate(()=>{window.requestAnimationFrame=()=>0});},
 };return g;}
const up=[0,0,0,-1],none=[0,0,0,0];
// Jump, hold LT and look straight up, then fire `rails` open-sky rails, each 20 frames after the previous arrival.
async function skyChain(g,rails,coast=0){
 await g.plaza(0);const shots0=await g.shots(),rows=[],fired=[];const run=async n=>{for(let i=0;i<n;i++)rows.push(await g.frame());return rows.at(-1);};
 await g.pad([A],none);await run(3);await g.pad([],none);await run(10);await g.pad([LT],up);await run(45);
 for(let k=0;k<rails;k++){
  const at=rows.at(-1),fireFrame=rows.length;await g.pad([LT,RT],up);await run(2);await g.pad([LT],up);
  let f=0,last;do{last=await run(1);f++;}while(last.mode==='TRANSIT'&&f<400);
  const start=rows[fireFrame];fired.push({k,fireFrame,arriveFrame:rows.length-1,startPos:at.pos,target:at.target,targetObj:at.targetObj,laserEnd:at.laserEnd,ray:at.ray,launchedFrom:start.pos,arrive:last.pos,arriveVy:last.vy,arriveH:last.h,arriveMode:last.mode});
  if(k<rails-1)await run(20);
 }
 await g.pad([],none);await run(coast);
 return{rows,fired,hostileShots:(await g.shots())-shots0};
}
const sub=(a,b)=>a.map((v,i)=>v-b[i]),len=v=>Math.hypot(...v),angleDeg=(a,b)=>Math.acos(Math.min(1,Math.max(-1,a.reduce((s,v,i)=>s+v*b[i],0)/(len(a)*len(b)))))*180/Math.PI;
const peak=rows=>Math.max(...rows.map(r=>r.pos[1])),r2=v=>+v.toFixed(2);
(async()=>{const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal','--mute-audio']}),errors=[],result={build:build.entry,control:build.source,checks:{},evidence:{}};try{
 const F=await open(browser,build.entry,errors),C=await open(browser,build.source,errors);
 await F.hero('sightline');await C.hero('sightline');
 const lim=await F.p.evaluate(()=>v02FlightCeiling.limits());result.evidence.limits={roof:r2(lim.roof),ceiling:r2(lim.ceiling)};
 // 1. Five chained sky rails straight up.
 const fc=await skyChain(F,5,0),cc=await skyChain(C,5,0);
 const summary=c=>c.fired.map(r=>({k:r.k,start:r.startPos.map(r2),target:r.target&&r.target.map(r2),arrive:r.arrive.map(r2),arriveVy:r2(r.arriveVy),arriveH:r2(r.arriveH),mode:r.arriveMode}));
 result.evidence.chain={fixedPeak:r2(peak(fc.rows)),controlPeak:r2(peak(cc.rows)),fixed:summary(fc),control:summary(cc),hostileShots:[fc.hostileShots,cc.hostileShots]};
 result.checks.controlClimbsPastCeiling=peak(cc.rows)>lim.ceiling+300;
 result.checks.chainStaysUnderCeiling=peak(fc.rows)<=lim.ceiling+.05&&fc.fired.every(r=>!r.targetObj);
 const firstClipped=fc.fired.find((r,i)=>cc.fired[i]&&cc.fired[i].target[1]>lim.roof+1);
 result.evidence.chain.firstClipped=firstClipped&&{k:firstClipped.k,targetY:r2(firstClipped.target[1]),crosshairAngleDeg:+angleDeg(sub(firstClipped.target,firstClipped.ray.o),firstClipped.ray.d).toFixed(4),arriveY:r2(firstClipped.arrive[1])};
 result.checks.skyRailEndsOnRoofLineAlongCrosshair=!!firstClipped&&Math.abs(firstClipped.target[1]-lim.roof)<.05&&angleDeg(sub(firstClipped.target,firstClipped.ray.o),firstClipped.ray.d)<.5&&Math.abs(firstClipped.arrive[1]-lim.roof)<1;
 const later=fc.fired.filter(r=>firstClipped&&r.k>firstClipped.k);
 result.evidence.chain.levelRails=later.map(r=>({k:r.k,climb:r2(r.target[1]-r.startPos[1]),travel:r2(Math.hypot(r.arrive[0]-r.launchedFrom[0],r.arrive[2]-r.launchedFrom[2])),arriveVy:r2(r.arriveVy)}));
 result.checks.railsAboveRoofRunLevel=later.length>=2&&later.every(r=>r.target[1]<=r.startPos[1]+.01&&Math.abs(r.arriveVy)<1&&Math.hypot(r.arrive[0]-r.launchedFrom[0],r.arrive[2]-r.launchedFrom[2])>10);
 result.checks.laserShowsFlownEndpoint=fc.fired.every(r=>len(sub(r.laserEnd,r.target))<.05);
 // Sky rail below the roof line: identical in both builds up to the frame the second rail is fired.
 const n0=fc.fired[1].fireFrame;let maxDiff=0;for(let i=0;i<n0;i++)maxDiff=Math.max(maxDiff,len(sub(fc.rows[i].pos,cc.rows[i].pos)));
 result.evidence.belowRoof={framesCompared:n0,maxPositionDiff:maxDiff,peakBeforeSecondRail:r2(Math.max(...fc.rows.slice(0,n0).map(r=>r.pos[1]))),firstRailTarget:[fc.fired[0].target.map(r2),cc.fired[0].target.map(r2)]};
 result.checks.belowRoofSkyRailUnchanged=n0>100&&maxDiff<1e-4&&len(sub(fc.fired[0].target,cc.fired[0].target))<1e-4;
 // 2. Two sky rails, then release everything and coast.
 const fk=await skyChain(F,2,300),ck=await skyChain(C,2,300);
 const arr=fk.fired[1].arriveFrame,free=fk.rows.slice(arr+1),top=free.findIndex(r=>r.vy<=0),win=Math.max(top,1);
 let maxDvy=0;for(let i=1;i<free.length;i++)if(!free[i].onGround&&free[i].mode!=='TRANSIT'&&!free[i-1].onGround)maxDvy=Math.max(maxDvy,Math.abs(free[i].vy-free[i-1].vy));
 let maxStep=0;for(let i=1;i<free.length;i++)maxStep=Math.max(maxStep,len(sub(free[i].pos,free[i-1].pos))-Math.hypot(free[i].h,Math.abs(free[i].vy))/60);
 const cArr=ck.fired[1].arriveFrame,cFree=ck.rows.slice(cArr+1),hLossF=fk.rows[arr].h-free[win].h,hLossC=ck.rows[cArr].h-cFree[win].h;
 const st=await F.p.evaluate(()=>v02FlightCeiling.state());
 result.evidence.coast={arriveY:r2(fk.rows[arr].pos[1]),arriveVy:r2(fk.rows[arr].vy),peak:r2(peak(free)),framesToTop:top,secondsToTop:+(top/60).toFixed(2),maxFreeDvyPerFrame:r2(maxDvy),maxExtraStep:+maxStep.toFixed(3),
  hLossOverBrake:{fixed:r2(hLossF),control:r2(hLossC),frames:win},vyAfterTop:free.slice(top,top+60).map(r=>r2(r.vy)).filter((_,i)=>i%10===0),banners:[...new Set(free.map(r=>r.banner))],state:{brakeFrames:st.brakeFrames,clampFrames:st.clampFrames,banners:st.banners,maxExtra:r2(st.maxExtra)},
  controlPeak:r2(peak(cFree)),hostileShots:[fk.hostileShots,ck.hostileShots]};
 result.checks.coastLevelsOffUnderCeiling=peak(free)<=lim.ceiling+.05&&peak(free)>=lim.ceiling-20&&top>0&&free.slice(top+30,top+60).every(r=>r.vy<0);
 result.checks.levelOffIsSmooth=maxDvy<=6.5&&maxStep<.05;
 result.checks.horizontalSpeedKept=Math.abs(hLossF-hLossC)<.3;
 result.checks.ceilingNoticeShown=free.some(r=>r.banner==='FLIGHT CEILING')&&st.banners>=1;
 // 3. Ground rail to a façade (yaw 0, look up a little): identical path in both builds.
 const groundRail=async g=>{await g.plaza(0);const shots0=await g.shots(),rows=[];await g.pad([LT],[0,0,0,-.35]);for(let i=0;i<30;i++)rows.push(await g.frame());const aim=rows.at(-1);await g.pad([LT,RT],[0,0,0,0]);for(let i=0;i<2;i++)rows.push(await g.frame());await g.pad([],none);for(let i=0;i<150;i++)rows.push(await g.frame());return{rows,aim,hostileShots:(await g.shots())-shots0};};
 const fg=await groundRail(F),cg=await groundRail(C);let gDiff=0;for(let i=0;i<fg.rows.length;i++)gDiff=Math.max(gDiff,len(sub(fg.rows[i].pos,cg.rows[i].pos)));
 result.evidence.groundRail={target:fg.aim.target&&fg.aim.target.map(r2),targetObj:fg.aim.targetObj,modes:[...new Set(fg.rows.map(r=>r.mode))],maxPositionDiff:gDiff,travelled:r2(len(sub(fg.rows.at(-1).pos,fg.rows[0].pos))),hostileShots:[fg.hostileShots,cg.hostileShots]};
 result.checks.groundRailToFacadeUnchanged=fg.aim.targetObj&&fg.rows.some(r=>r.mode==='TRANSIT')&&gDiff<1e-4&&result.evidence.groundRail.travelled>50;
 // Evidence pictures: the coast near its top, and the control at its peak.
 await skyChain(F,2,top);await F.p.evaluate(()=>renderNight(0));await F.p.screenshot({path:OUT+'/coast-top-fixed.png'});
 await skyChain(C,5,0);await C.p.evaluate(()=>renderNight(0));await C.p.screenshot({path:OUT+'/chain-control-climbing.png'});
 result.checks.noHostileShotLanded=[fc,cc,fk,ck,fg,cg].every(x=>x.hostileShots===0);
 result.checks.noPageErrors=errors.length===0;
}catch(e){result.failure=e.stack;}
 result.errors=errors;result.pass=!result.failure&&Object.values(result.checks).every(Boolean);
 fs.writeFileSync(OUT+'/results.json',JSON.stringify(result,null,2)+'\n');for(const[k,v]of Object.entries(result.checks))console.log((v?'PASS ':'FAIL ')+k);if(result.failure)console.log(result.failure);
 await browser.close();assert.ok(result.pass,'flight ceiling checks failed');})().catch(e=>{console.error(e);process.exit(1);});
