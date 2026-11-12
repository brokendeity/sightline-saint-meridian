/* Real-input checks for the V02 close camera, run against the close-camera build and, as a control, the build it was made from.
   Inputs: a virtual standard pad read by the game's own poll (LT aim, RT fire, left stick move, right stick look, RB / L3
   sprint), the R key (Sightline reset) and menu clicks to pick each hero. Labelled test setup, as in the other V02 tests:
   before each block the player is placed (open plaza, a real façade found by the wall-contact test's own finder, or the six
   body-framing room fixtures), drones are held in patrol, courier guards are stunned and projectiles are cleared; frames
   are stepped with tickFrame while the game's own frame loop is held. No camera state is written after setup.
   1. Reference: Sightline's grounded aim-lock view in the control build.
   2. Every hero's default view in the new build matches it (distance, height, shoulder, FOV); the control default is
      the old, farther view. Backspool and Loadout keep only the tilt body framing needs for their body (no floor patch).
   3. Unchanged: Sightline's aim view and his rail-flight camera.
   4. Sprint keeps its pull-back relative to the default; reset starts at the new default with no zoom.
   5. Safety: the camera never ends inside a building box backed against a real façade while orbiting, and Backspool and
      Loadout stay fully framed in the six room fixtures and in a portrait window. */
const{chromium}=require('/opt/homebrew/lib/node_modules/playwright'),assert=require('assert/strict'),fs=require('fs');
const D='development/vertical-city-v02/',build=JSON.parse(fs.readFileSync(D+(process.env.V02_ACTION_BUILD||'V02_Close_Camera_Build.json')));
const OUT=process.env.V02_CAMERA_OUT||D+'evidence/close-camera';fs.mkdirSync(OUT,{recursive:true});
// The control defaults to the build's own source; V02_CAMERA_CONTROL lets a later build be checked against the original
// far-camera build (for example the Sightline-framing build against the flight-ceiling build).
const CONTROL=process.env.V02_CAMERA_CONTROL||build.source;
const LT=6,RT=7,RB=5,L3=10,HEROES=['sightline','backspool','loadout'];
async function open(browser,entry,errors){
 const p=await browser.newPage({viewport:{width:1280,height:800}});p.on('pageerror',e=>errors.push(entry+': '+e.message));
 await p.addInitScript(()=>{const up={pressed:false,value:0};window.testPad={id:'test pad',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>up)};navigator.getGamepads=()=>[window.testPad];});
 await p.goto('http://127.0.0.1:8766/'+entry+'?capture=backspool');
 await p.waitForFunction(()=>typeof gameReady!=='undefined'&&gameReady&&window.characterState&&!characterState().busy&&roadNetworkState().ready,null,{timeout:300000});
 await p.waitForFunction(()=>verticalWorldLifeState().ready&&v02EastPublicLightingState().ready&&v02RimShadowState().ready,null,{timeout:120000});
 await p.locator('#v02Start').click();await p.evaluate(()=>{window.requestAnimationFrame=()=>0});
 // Measurement helpers, installed once per page. They only read state.
 await p.evaluate(()=>{
  const KEY=['Head','Hips','LeftFoot','RightFoot','LeftToeBase','RightToeBase','LeftHand','RightHand'];
  window.__camSample=()=>{
   const view=cameraForward(cam.yaw,cam.pitch),right=new THREE.Vector3(Math.cos(cam.yaw),0,-Math.sin(cam.yaw)),rel=camera.position.clone().sub(cam.focus),lat=rel.dot(right);
   const hz=Math.hypot(rel.x-right.x*lat,rel.z-right.z*lat),back=hz/Math.cos(cam.pitch),h=rel.y+back*Math.sin(cam.pitch);
   camera.updateMatrixWorld(true);characterRoot.updateMatrixWorld(true);let minY=9,maxY=-9,minX=9,maxX=-9,framed=true;const bones={};
   characterRoot.traverse(o=>{if(!o.isBone)return;const n=o.name.replace(/^mixamorig/,'');const v=o.getWorldPosition(new THREE.Vector3()).project(camera);minY=Math.min(minY,v.y);maxY=Math.max(maxY,v.y);minX=Math.min(minX,v.x);maxX=Math.max(maxX,v.x);if(KEY.includes(n))bones[n]=v;});
   for(const n of KEY){const v=bones[n];if(!v||Math.abs(v.x)>=.95||Math.abs(v.y)>=.95||v.z<=-1||v.z>=1)framed=false;}
   // Extra look tilt applied after the native camera (body framing): native look is focus + view * lookDistance.
   const look=cam.focus.clone().addScaledVector(view,inputAiming()?28:22),native=camera.position.clone().sub(look).negate().normalize(),actual=camera.getWorldDirection(new THREE.Vector3());
   let inside=0;for(const c of buildingColliders)for(const q of(c.parts||[c]))if(q.box&&q.box.containsPoint(camera.position))inside++;
   const bf=window.v02BodyFramingState?.();
   return{hero:characterState().hero,mode:s.mode,onGround:s.onGround,aiming:inputAiming(),sprinting:inputSprinting(),acro:!!window.backspoolFlow?.acrobatting?.(),fov:camera.fov,back,lat,h,dist:rel.length(),
    cam:camera.position.toArray(),pos:s.pos.toArray(),ndc:{minY,maxY,minX,maxX},framed,tiltDeg:(Math.asin(actual.y)-Math.asin(native.y))*180/Math.PI,inside,
    floorPatch:bf?bf.groundEnvelope:null,bodyFit:bf?bf.fit:null};
  };
 });
 const g={p,
  pad:(buttons,axes)=>p.evaluate(([b,a])=>{testPad.buttons=testPad.buttons.map((x,i)=>b.includes(i)?{pressed:true,value:1}:{pressed:false,value:0});testPad.axes=a;},[buttons,axes]),
  frames:n=>p.evaluate(n=>{const rows=[];for(let i=0;i<n;i++){tickFrame(1/60,false);rows.push(__camSample());}return rows;},n),
  place:(x,y,z,yaw=0,settle=90)=>p.evaluate(([x,y,z,yaw,settle])=>{for(const e of enemies){cancelEnemyAttack(e);e.alertState='PATROL';e.alertCooldown=1e6;}for(const q of courier.guards){cancelEnemyAttack(q);q.stun=1e6;}for(const q of projectiles)disposeObject(q.m);projectiles.length=0;
   testPad.buttons=testPad.buttons.map(()=>({pressed:false,value:0}));testPad.axes=[0,0,0,0];
   resetPlayer();clearInput();clearPad();startGame(false);s.pos.set(x,y,z);s.vel.set(0,0,0);s.onGround=true;setMode(P.GROUND);s.yaw=cam.yaw=cam.targetYaw=yaw;cam.pitch=cam.targetPitch=-.08;for(let i=0;i<settle;i++)tickFrame(1/60,false)},[x,y,z,yaw,settle]),
  shots:()=>p.evaluate(()=>mechanicPolish.shots),
  shot:async name=>{await p.evaluate(()=>renderNight(0));await p.screenshot({path:OUT+'/'+name+'.png'});},
  menu:async()=>{await p.evaluate(()=>{window.requestAnimationFrame=cb=>setTimeout(()=>cb(performance.now()),16)});if(await p.evaluate(()=>gameActive))await p.keyboard.press('Escape');await p.waitForTimeout(250);},
  hero:async h=>{await g.menu();await p.click('#v02Tab-hero');await p.selectOption('#characterChoice',h);await p.waitForFunction(h=>characterState().hero===h&&!characterState().busy,h,{timeout:300000});await p.click('#v02Tab-overview');await p.locator('#start').click();await p.evaluate(()=>{window.requestAnimationFrame=()=>0});},
 };return g;}
const none=[0,0,0,0],fwd=[0,-1,0,0];
const r3=v=>+(+v).toFixed(3),mean=(rows,k)=>rows.reduce((a,r)=>a+r[k],0)/rows.length;
const view=r=>({fov:r3(r.fov),back:r3(r.back),lat:r3(r.lat),h:r3(r.h),tiltDeg:r3(r.tiltDeg),ndc:Object.fromEntries(Object.entries(r.ndc).map(([k,v])=>[k,r3(v)])),framed:r.framed,floorPatch:r.floorPatch});
const same=(a,b,pos=.05,fov=.5)=>Math.abs(a.back-b.back)<pos&&Math.abs(a.lat-b.lat)<pos&&Math.abs(a.h-b.h)<pos&&Math.abs(a.fov-b.fov)<fov;
async function idle(g,aim=false){await g.place(0,.42,12);if(aim)await g.pad([LT],none);const rows=await g.frames(120);await g.pad([],none);return rows.at(-1);}
// Walk forward, start the hero's sprint by real input, keep running; average the last 20 frames.
async function sprint(g,hero){await g.place(0,.42,12);await g.pad([],fwd);await g.frames(20);
 if(hero==='sightline'){await g.pad([RB],fwd);}else{await g.pad([L3],fwd);await g.frames(2);await g.pad([],fwd);}
 // Only grounded sprint frames: a Flow run that meets an obstacle can turn into a flip, whose camera is not in scope.
 const rows=await g.frames(110);await g.pad([],none);const tail=rows.filter(r=>r.onGround&&r.mode==='GROUND'&&!r.acro&&r.sprinting).slice(-20);
 // Flow sprint is a toggle; make sure it is off again (by real input) so later idle blocks are not in the sprint branch.
 await g.place(0,.42,12,0,5);if(await g.p.evaluate(()=>inputSprinting())){await g.pad([L3],none);await g.frames(2);await g.pad([],none);await g.frames(5);}
 return{sprinting:tail.length>=15,groundedSprintFrames:tail.length,flipFrames:rows.filter(r=>r.acro).length,back:mean(tail,'back'),fov:mean(tail,'fov'),inside:rows.reduce((a,r)=>a+r.inside,0),sprintOffAfter:!(await g.p.evaluate(()=>inputSprinting()))};}
(async()=>{const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal','--mute-audio']}),errors=[],result={build:build.entry,control:CONTROL,checks:{},evidence:{}};try{
 const N=await open(browser,build.entry,errors),C=await open(browser,CONTROL,errors),shots0=[await N.shots(),await C.shots()];
 const E=result.evidence;E.idle={};E.sprint={};E.wall={};E.rooms={};E.portrait={};
 // Real façade for the back-to-wall check, from the wall-contact test's own finder (same rules), then 1 m out from it.
 const spot=await N.p.evaluate(()=>{for(const owner of buildingColliders.filter(o=>o.box.max.x>-10&&o.box.min.x<170&&o.box.max.z>150&&o.box.min.z<500))for(const c of owner.parts||[owner]){const b=c.box;if(b.max.y-b.min.y<10||b.min.y>1||b.max.x-b.min.x<8||b.max.z-b.min.z<8)continue;for(const n of[new THREE.Vector3(1,0,0),new THREE.Vector3(-1,0,0),new THREE.Vector3(0,0,1),new THREE.Vector3(0,0,-1)]){const axis=n.x?'x':'z',q=b.getCenter(new THREE.Vector3());q[axis]=n[axis]>0?b.max[axis]:b.min[axis];q.addScaledVector(n,3);q.y=supportHeight(q.x,q.z,1);if(q.y>1)continue;const end=q.clone().addScaledVector(n,-2.38),high=end.clone();high.y=5;if(sweptCharacterHit(q,end)||!sweptCharacterHit(end,high))continue;const at=q.clone().addScaledVector(n,-2);return{position:at.toArray(),yaw:Math.atan2(-n.x,-n.z),normal:n.toArray()};}}return null;});
 E.wallSpot=spot;
 for(const hero of HEROES){
  await N.hero(hero);await C.hero(hero);
  const n=await idle(N),c=await idle(C);E.idle[hero]={new:view(n),control:view(c)};await N.shot('default-new-'+hero);await C.shot('default-control-'+hero);
  if(hero==='sightline'){const na=await idle(N,true),ca=await idle(C,true);E.aimLock={new:view(na),control:view(ca)};await C.shot('aim-lock-control-sightline');}
  E.sprint[hero]={new:await sprint(N,hero),control:await sprint(C,hero)};
  // Backed against a real façade (facing away from it), then a full right-stick orbit.
  if(spot){for(const [g,k] of [[N,'new'],[C,'control']]){await g.place(...spot.position,spot.yaw);await g.pad([],[0,0,1,0]);const rows=await g.frames(160);await g.pad([],none);
   E.wall[hero]=E.wall[hero]||{};E.wall[hero][k]={framesInsideBox:rows.filter(r=>r.inside>0).length,minCameraDistance:r3(Math.min(...rows.map(r=>r.dist))),framedFrames:rows.filter(r=>r.framed).length,frames:rows.length,stayedPut:Math.hypot(rows.at(-1).pos[0]-spot.position[0],rows.at(-1).pos[2]-spot.position[2])<.5};}
   if(hero!=='sightline')await N.shot('wall-orbit-end-new-'+hero);}
  // The six body-framing room fixtures (probe_body_framing.cjs positions), settled 180 frames, default camera.
  E.rooms[hero]={};for(const [g,k] of [[N,'new'],[C,'control']]){const list=[];for(const floor of[40,68,100])for(const z of[294.2,300.5]){await g.place(36.4,floor+.42,z,0,0);const r=(await g.frames(180)).at(-1);list.push({floor,z,framed:r.framed,onGround:r.onGround,back:r3(r.back),fov:r3(r.fov)});}E.rooms[hero][k]=list;}
  // Portrait window (430 x 932).
  for(const [g,k] of [[N,'new'],[C,'control']]){await g.p.setViewportSize({width:430,height:932});const r=await idle(g);E.portrait[hero]=E.portrait[hero]||{};E.portrait[hero][k]=view(r);if(k==='new')await g.shot('portrait-new-'+hero);await g.p.setViewportSize({width:1280,height:800});}
 }
 // Sightline reset (R key) after walking and turning: the first frame is already the new default, with no zoom.
 await N.hero('sightline');await N.place(0,.42,12);await N.pad([],[0,-1,.6,0]);await N.frames(60);await N.pad([],none);await N.p.keyboard.press('KeyR');const after=await N.frames(30);
 E.reset={first:view(after[0]),fovRange:r3(Math.max(...after.map(r=>r.fov))-Math.min(...after.map(r=>r.fov))),backRange:r3(Math.max(...after.map(r=>r.back))-Math.min(...after.map(r=>r.back)))};
 // Sightline ground rail (aim 45 frames, fire): camera identical in both builds while flight-aligned.
 const rail=async g=>{await g.hero('sightline');await g.place(0,.42,12);await g.pad([LT],[0,0,0,-.35]);const aim=await g.frames(45);await g.pad([LT,RT],none);const a=await g.frames(2);await g.pad([],none);const b=await g.frames(150);return{atFire:aim.at(-1),rows:a.concat(b)};};
 const nr=await rail(N),cr=await rail(C);let railPos=0,railFov=0,aligned=0;for(let i=0;i<nr.rows.length;i++){const x=nr.rows[i],y=cr.rows[i];if(!['TAKEOFF','TRANSIT'].includes(x.mode)||x.mode!==y.mode)continue;aligned++;railPos=Math.max(railPos,Math.hypot(...x.cam.map((v,j)=>v-y.cam[j])));railFov=Math.max(railFov,Math.abs(x.fov-y.fov));}
 E.railFlight={alignedFrames:aligned,maxCameraDiff:railPos,maxFovDiff:r3(railFov),atFireDiff:Math.hypot(...nr.atFire.cam.map((v,j)=>v-cr.atFire.cam[j])),modes:[...new Set(nr.rows.map(r=>r.mode))]};
 // ---- checks
 const ref=E.aimLock.control;
 result.checks.aimLockReferenceMeasured=Math.abs(ref.back-3.25)<.05&&Math.abs(ref.fov-48)<.5;
 for(const hero of HEROES){const a=E.idle[hero];result.checks['defaultMatchesAimLock_'+hero]=same(a.new,ref)&&(hero!=='sightline'||Math.abs(a.new.ndc.minY-ref.ndc.minY)<.05&&Math.abs(a.new.ndc.maxY-ref.ndc.maxY)<.05);}
 result.checks.controlDefaultWasFarther=HEROES.every(h=>Math.abs(E.idle[h].control.back-4.25)<.05&&Math.abs(E.idle[h].control.fov-56)<.5);
 result.checks.noFloorPatchTilt=['backspool','loadout'].every(h=>E.idle[h].new.floorPatch===false&&E.idle[h].new.tiltDeg>-8&&E.idle[h].new.framed);
 result.checks.sightlineAimUnchanged=same(E.aimLock.new,E.aimLock.control,.01,.1);
 result.checks.sprintKeepsRelativePullBack=HEROES.every(h=>{const s=E.sprint[h],i=E.idle[h];return s.new.sprinting&&s.control.sprinting&&s.new.sprintOffAfter&&s.control.sprintOffAfter&&Math.abs((s.new.back-i.new.back)-(s.control.back-i.control.back))<.15&&Math.abs((s.new.fov-i.new.fov)-(s.control.fov-i.control.fov))<1.5;});
 result.checks.resetStartsAtNewDefault=Math.abs(E.reset.first.fov-48)<.5&&Math.abs(E.reset.first.back-3.25)<.1&&E.reset.fovRange<.5;
 result.checks.railFlightCameraUnchanged=E.railFlight.alignedFrames>30&&E.railFlight.maxCameraDiff<.02&&E.railFlight.maxFovDiff<.3;
 result.checks.cameraOutOfWallsBackedToFacade=!!spot&&HEROES.every(h=>E.wall[h].new.framesInsideBox===0&&E.wall[h].new.stayedPut);
 result.checks.roomFixturesFramed=['backspool','loadout'].every(h=>E.rooms[h].new.every(r=>r.framed&&r.onGround));
 result.checks.portraitFramed=['backspool','loadout'].every(h=>E.portrait[h].new.framed);
 E.hostileShots=[(await N.shots())-shots0[0],(await C.shots())-shots0[1]];result.checks.noHostileShotLanded=E.hostileShots.every(x=>x===0);
 result.checks.noPageErrors=errors.length===0;
}catch(e){result.failure=e.stack;}
 result.errors=errors;result.pass=!result.failure&&Object.values(result.checks).every(Boolean);
 fs.writeFileSync(OUT+'/results.json',JSON.stringify(result,null,2)+'\n');for(const[k,v]of Object.entries(result.checks))console.log((v?'PASS ':'FAIL ')+k);if(result.failure)console.log(result.failure);
 await browser.close();assert.ok(result.pass,'close camera checks failed');})().catch(e=>{console.error(e);process.exit(1);});
