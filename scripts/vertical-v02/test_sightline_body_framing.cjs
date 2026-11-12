/* Real-input checks for Sightline body framing (body framing v4), run against the Sightline-framing build and, as a
   control, the close-camera build it was made from.
   Inputs: a virtual standard pad read by the game's own poll (A jump, LT aim, RT fire, right stick look) and menu clicks to
   pick each hero. Labelled test setup, as in the other V02 tests: before each block the player is placed (open plaza, a
   real façade found by the wall-contact test's own finder, or the six body-framing room fixtures), drones are held in
   patrol, courier guards are stunned and projectiles are cleared; frames are stepped with tickFrame while the game's own
   frame loop is held. No camera state is written after setup.
   1. On foot, Sightline's whole body stays in frame: plaza, the six room fixtures and an orbit backed against a façade.
   2. Aiming: the framing eases out (no snap) and his aim view and aim target settle on the control's.
   3. Jump and landing: the framing eases out and back in; movement is identical to the control.
   4. Rails: an open-sky rail and a ground rail fly identical paths, with the flight camera unchanged.
   5. Backspool and Loadout are unchanged. */
const{chromium}=require('/opt/homebrew/lib/node_modules/playwright'),assert=require('assert/strict'),fs=require('fs');
const D='development/vertical-city-v02/',build=JSON.parse(fs.readFileSync(D+(process.env.V02_ACTION_BUILD||'V02_Sightline_Framing_Build.json')));
const OUT=process.env.V02_FRAMING_OUT||D+'evidence/sightline-framing';fs.mkdirSync(OUT,{recursive:true});
const LT=6,RT=7,A=0,ROOMS=[[40,294.2],[40,300.5],[68,294.2],[68,300.5],[100,294.2],[100,300.5]];
async function open(browser,entry,errors){
 const p=await browser.newPage({viewport:{width:1280,height:800}});p.on('pageerror',e=>errors.push(entry+': '+e.message));
 await p.addInitScript(()=>{const up={pressed:false,value:0};window.testPad={id:'test pad',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>up)};navigator.getGamepads=()=>[window.testPad];});
 await p.goto('http://127.0.0.1:8766/'+entry+'?capture=backspool');
 await p.waitForFunction(()=>typeof gameReady!=='undefined'&&gameReady&&window.characterState&&!characterState().busy&&roadNetworkState().ready,null,{timeout:300000});
 await p.waitForFunction(()=>verticalWorldLifeState().ready&&v02EastPublicLightingState().ready&&v02RimShadowState().ready,null,{timeout:120000});
 await p.locator('#v02Start').click();await p.evaluate(()=>{window.requestAnimationFrame=()=>0});
 await p.evaluate(()=>{
  const KEY=['Head','Hips','LeftFoot','RightFoot','LeftToeBase','RightToeBase','LeftHand','RightHand'];
  window.__frame=()=>{
   camera.updateMatrixWorld(true);characterRoot.updateMatrixWorld(true);const bones={};let framed=true;
   characterRoot.traverse(o=>{if(!o.isBone)return;const n=o.name.replace(/^mixamorig/,'');if(KEY.includes(n))bones[n]=o.getWorldPosition(new THREE.Vector3()).project(camera);});
   for(const n of KEY){const v=bones[n];if(!v||Math.abs(v.x)>=.95||Math.abs(v.y)>=.95||v.z<=-1||v.z>=1)framed=false;}
   let inside=0;for(const c of buildingColliders)for(const q of(c.parts||[c]))if(q.box&&q.box.containsPoint(camera.position))inside++;
   const st=window.v02BodyFramingState?.()||{};
   return{mode:s.mode,onGround:s.onGround,aiming:inputAiming(),pos:s.pos.toArray(),cam:camera.position.toArray(),dir:camera.getWorldDirection(new THREE.Vector3()).toArray(),fov:camera.fov,
    target:s.target?s.target.toArray():null,targetObj:!!s.targetObj,framed,inside,owner:st.compositionOwner,pitchBiasDeg:(st.heldPitch||0)*180/Math.PI,yawBiasDeg:(st.heldYaw||0)*180/Math.PI,fit:st.fit};
  };
 });
 const g={p,
  pad:(buttons,axes)=>p.evaluate(([b,a])=>{testPad.buttons=testPad.buttons.map((x,i)=>b.includes(i)?{pressed:true,value:1}:{pressed:false,value:0});testPad.axes=a;},[buttons,axes]),
  frames:n=>p.evaluate(n=>{const rows=[];for(let i=0;i<n;i++){tickFrame(1/60,false);rows.push(__frame());}return rows;},n),
  place:(x,y,z,yaw=0,settle=150)=>p.evaluate(([x,y,z,yaw,settle])=>{for(const e of enemies){cancelEnemyAttack(e);e.alertState='PATROL';e.alertCooldown=1e6;}for(const q of courier.guards){cancelEnemyAttack(q);q.stun=1e6;}for(const q of projectiles)disposeObject(q.m);projectiles.length=0;
   testPad.buttons=testPad.buttons.map(()=>({pressed:false,value:0}));testPad.axes=[0,0,0,0];
   resetPlayer();clearInput();clearPad();startGame(false);s.pos.set(x,y,z);s.vel.set(0,0,0);s.onGround=true;setMode(P.GROUND);s.yaw=cam.yaw=cam.targetYaw=yaw;cam.pitch=cam.targetPitch=-.08;for(let i=0;i<settle;i++)tickFrame(1/60,false)},[x,y,z,yaw,settle]),
  shots:()=>p.evaluate(()=>mechanicPolish.shots),
  shot:async name=>{await p.evaluate(()=>renderNight(0));await p.screenshot({path:OUT+'/'+name+'.png'});},
  menu:async()=>{await p.evaluate(()=>{window.requestAnimationFrame=cb=>setTimeout(()=>cb(performance.now()),16)});if(await p.evaluate(()=>gameActive))await p.keyboard.press('Escape');await p.waitForTimeout(250);},
  hero:async h=>{await g.menu();await p.click('#v02Tab-hero');await p.selectOption('#characterChoice',h);await p.waitForFunction(h=>characterState().hero===h&&!characterState().busy,h,{timeout:300000});await p.click('#v02Tab-overview');await p.locator('#start').click();await p.evaluate(()=>{window.requestAnimationFrame=()=>0});},
 };return g;}
const none=[0,0,0,0],r3=v=>+(+v).toFixed(3);
const ang=(a,b)=>Math.acos(Math.min(1,Math.max(-1,a[0]*b[0]+a[1]*b[1]+a[2]*b[2])))*180/Math.PI,dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
const pair=(n,c,k)=>n.map((r,i)=>k(r,c[i]));
// The same real-input sequence on both pages, frame for frame.
async function both(N,C,fn){const n=await fn(N),c=await fn(C);return{n,c};}
(async()=>{const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal','--mute-audio']}),errors=[],result={build:build.entry,control:build.source,checks:{},evidence:{}};try{
 const N=await open(browser,build.entry,errors),C=await open(browser,build.source,errors),shots0=[await N.shots(),await C.shots()],E=result.evidence;
 // 5 (run first, on fresh pages, so no earlier Sightline block can shift animation phase between the two pages).
 // Backspool (the hero at load) and Loadout are unchanged: plaza and one room.
 E.others={};for(const hero of ['backspool','loadout']){if(hero!=='backspool'){await N.hero(hero);await C.hero(hero);}const o={hero:await N.p.evaluate(()=>characterState().hero)};
  for(const [name,x,y,z] of [['plaza',0,.42,12],['room',36.4,40.42,294.2]]){const r=await both(N,C,async g=>{await g.place(x,y,z,0,180);return(await g.frames(1))[0];});o[name]={viewAngleDiffDeg:+ang(r.n.dir,r.c.dir).toFixed(5),cameraPositionDiff:dist(r.n.cam,r.c.cam),framed:[r.n.framed,r.c.framed]};}
  E.others[hero]=o;}
 await N.hero('sightline');await C.hero('sightline');
 // 4 (run first among the Sightline blocks). 4a. One open-sky rail: jump, LT + look straight up, fire (flight-aligned: no framing).
 const sky=await both(N,C,async g=>{await g.place(0,.42,12,0,90);await g.pad([A],none);const r=await g.frames(3);await g.pad([],none);r.push(...await g.frames(10));await g.pad([LT],[0,0,0,-1]);r.push(...await g.frames(45));await g.pad([LT,RT],[0,0,0,-1]);r.push(...await g.frames(2));await g.pad([LT],[0,0,0,-1]);for(let i=0;i<240;i++){r.push(...await g.frames(1));if(r.at(-1).mode!=='TRANSIT'&&i>5)break;}await g.pad([],none);r.push(...await g.frames(20));return r;});
 const skyN=Math.min(sky.n.length,sky.c.length);let skyPos=0,skyCam=0,skyAim=0;for(let i=0;i<skyN;i++){skyPos=Math.max(skyPos,dist(sky.n[i].pos,sky.c[i].pos));if(['TAKEOFF','TRANSIT'].includes(sky.n[i].mode)||sky.n[i].aiming&&!sky.n[i].onGround){skyCam=Math.max(skyCam,dist(sky.n[i].cam,sky.c[i].cam));skyAim=Math.max(skyAim,ang(sky.n[i].dir,sky.c[i].dir));}}
 E.skyRail={frames:skyN,modes:[...new Set(sky.n.map(r=>r.mode))],maxPositionDiff:skyPos,maxFlightCameraDiff:skyCam,maxAimViewDiffDeg:+skyAim.toFixed(5)};
 // 4b. Ground rail: aim 45 frames, fire.
 const ground=await both(N,C,async g=>{await g.place(0,.42,12,0,150);await g.pad([LT],[0,0,0,-.35]);const r=await g.frames(45);await g.pad([LT,RT],none);r.push(...await g.frames(2));await g.pad([],none);r.push(...await g.frames(150));return r;});
 let gPos=0,gCam=0,aligned=0;for(let i=0;i<ground.n.length;i++){gPos=Math.max(gPos,dist(ground.n[i].pos,ground.c[i].pos));if(['TAKEOFF','TRANSIT'].includes(ground.n[i].mode)){aligned++;gCam=Math.max(gCam,dist(ground.n[i].cam,ground.c[i].cam));}}
 E.groundRail={modes:[...new Set(ground.n.map(r=>r.mode))],alignedFrames:aligned,maxPositionDiff:gPos,maxFlightCameraDiff:gCam,targetDiffAtFire:ground.n[44].target&&ground.c[44].target?dist(ground.n[44].target,ground.c[44].target):null,travelled:r3(dist(ground.n.at(-1).pos,ground.n[0].pos))};
 // 1a. Plaza, on foot.
 const plaza=await both(N,C,async g=>{await g.place(0,.42,12);return(await g.frames(30)).at(-1);});
 E.plaza={new:{framed:plaza.n.framed,fit:plaza.n.fit,owner:plaza.n.owner,pitchBiasDeg:r3(plaza.n.pitchBiasDeg),fov:r3(plaza.n.fov)},control:{framed:plaza.c.framed,owner:plaza.c.owner,fov:r3(plaza.c.fov)},cameraPositionDiff:dist(plaza.n.cam,plaza.c.cam),viewAngleDiffDeg:r3(ang(plaza.n.dir,plaza.c.dir))};
 await N.shot('plaza-new-sightline');await C.shot('plaza-control-sightline');
 // 1b. The six room fixtures.
 E.rooms={new:[],control:[]};for(const [floor,z] of ROOMS)for(const [g,k] of [[N,'new'],[C,'control']]){await g.place(36.4,floor+.42,z,0,0);const r=(await g.frames(180)).at(-1);E.rooms[k].push({floor,z,framed:r.framed,onGround:r.onGround,pitchBiasDeg:r3(r.pitchBiasDeg),fov:r3(r.fov)});if(floor===40&&z===294.2)await g.shot('room-'+k+'-sightline');}
 // 1c. Backed against a real façade, full right-stick orbit.
 const spot=await N.p.evaluate(()=>{for(const owner of buildingColliders.filter(o=>o.box.max.x>-10&&o.box.min.x<170&&o.box.max.z>150&&o.box.min.z<500))for(const c of owner.parts||[owner]){const b=c.box;if(b.max.y-b.min.y<10||b.min.y>1||b.max.x-b.min.x<8||b.max.z-b.min.z<8)continue;for(const n of[new THREE.Vector3(1,0,0),new THREE.Vector3(-1,0,0),new THREE.Vector3(0,0,1),new THREE.Vector3(0,0,-1)]){const axis=n.x?'x':'z',q=b.getCenter(new THREE.Vector3());q[axis]=n[axis]>0?b.max[axis]:b.min[axis];q.addScaledVector(n,3);q.y=supportHeight(q.x,q.z,1);if(q.y>1)continue;const end=q.clone().addScaledVector(n,-2.38),high=end.clone();high.y=5;if(sweptCharacterHit(q,end)||!sweptCharacterHit(end,high))continue;const at=q.clone().addScaledVector(n,-2);return{position:at.toArray(),yaw:Math.atan2(-n.x,-n.z)};}}return null;});
 const wall=await both(N,C,async g=>{await g.place(...spot.position,spot.yaw,90);await g.pad([],[0,0,1,0]);const rows=await g.frames(160);await g.pad([],none);return rows;});
 E.wall={spot,new:{framedFrames:wall.n.filter(r=>r.framed).length,insideFrames:wall.n.filter(r=>r.inside>0).length},control:{framedFrames:wall.c.filter(r=>r.framed).length,insideFrames:wall.c.filter(r=>r.inside>0).length},frames:wall.n.length,positionDiff:Math.max(...pair(wall.n,wall.c,(a,b)=>dist(a.pos,b.pos)))};
 // 2. Grounded aim in the room fixture with the largest bias, then on the plaza.
 const aimAt=async(x,y,z)=>both(N,C,async g=>{await g.place(x,y,z,0,180);const before=(await g.frames(1))[0];await g.pad([LT],none);const rows=await g.frames(60);await g.pad([],none);return{before,rows};});
 E.aim={};for(const [name,x,y,z] of [['room',36.4,40.42,294.2],['plaza',0,.42,12]]){
  const a=await aimAt(x,y,z),gap=pair(a.n.rows,a.c.rows,(p,q)=>ang(p.dir,q.dir)),start=ang(a.n.before.dir,a.c.before.dir);let maxDrop=0;for(let i=1;i<gap.length;i++)maxDrop=Math.max(maxDrop,gap[i-1]-gap[i]);
  E.aim[name]={startBiasDeg:r3(start),firstFrameDropDeg:r3(start-gap[0]),maxFrameDropDeg:r3(Math.max(maxDrop,start-gap[0])),gapAt15:r3(gap[14]),gapAt30:r3(gap[29]),gapAt60:+gap[59].toFixed(5),
   targetDiffAt60:a.n.rows[59].target&&a.c.rows[59].target?dist(a.n.rows[59].target,a.c.rows[59].target):null,targetObjSame:a.n.rows[59].targetObj===a.c.rows[59].targetObj,owners:[...new Set(a.n.rows.map(r=>r.owner))],positionDiff:Math.max(...pair(a.n.rows,a.c.rows,(p,q)=>dist(p.pos,q.pos)))};
 }
 // 3. Jump in the room fixture and land; the bias eases out in the air and back in on foot.
 const jump=await both(N,C,async g=>{await g.place(36.4,40.42,294.2,0,180);await g.pad([A],none);const a=await g.frames(3);await g.pad([],none);return a.concat(await g.frames(150));});
 const jb=jump.n.map(r=>Math.abs(r.pitchBiasDeg)),jStart=jb[0];let jStep=0;for(let i=1;i<jb.length;i++)jStep=Math.max(jStep,Math.abs(jb[i]-jb[i-1]));
 const land=jump.n.findIndex(r=>r.onGround&&jump.n.indexOf(r)>3);
 E.jump={startBiasDeg:r3(jStart),minBiasInAirDeg:r3(Math.min(...jump.n.filter(r=>!r.onGround).map(r=>Math.abs(r.pitchBiasDeg)))),maxFrameChangeDeg:r3(jStep),landFrame:land,biasAfterLandingDeg:r3(jb.at(-1)),airFrames:jump.n.filter(r=>!r.onGround).length,positionDiff:Math.max(...pair(jump.n,jump.c,(p,q)=>dist(p.pos,q.pos))),owners:[...new Set(jump.n.map(r=>r.owner))]};
 // ---- checks
 result.checks.plazaFramed=E.plaza.new.framed&&E.plaza.new.fit===true&&E.plaza.new.owner==='automatic'&&E.plaza.cameraPositionDiff<.01&&Math.abs(E.plaza.new.fov-E.plaza.control.fov)<.1&&Math.abs(E.plaza.new.pitchBiasDeg)<3;
 result.checks.roomFixturesFramed=E.rooms.new.every(r=>r.framed&&r.onGround);
 result.checks.wallOrbitFramed=E.wall.new.framedFrames===E.wall.frames&&E.wall.new.insideFrames===0&&E.wall.positionDiff<1e-6;
 result.checks.aimEasesOutWithoutSnap=['room','plaza'].every(k=>E.aim[k].maxFrameDropDeg<=Math.max(.05,.2*E.aim[k].startBiasDeg));
 result.checks.aimViewSettlesOnControl=['room','plaza'].every(k=>E.aim[k].gapAt30<.05&&E.aim[k].gapAt60<.001&&E.aim[k].targetObjSame&&(E.aim[k].targetDiffAt60===null||E.aim[k].targetDiffAt60<.05)&&E.aim[k].positionDiff<1e-6);
 result.checks.jumpEasesOutAndBackIn=E.jump.startBiasDeg>1&&E.jump.minBiasInAirDeg<.25*E.jump.startBiasDeg&&E.jump.maxFrameChangeDeg<=.2*E.jump.startBiasDeg&&E.jump.biasAfterLandingDeg>.8*E.jump.startBiasDeg&&E.jump.positionDiff<1e-6;
 result.checks.skyRailIdentical=E.skyRail.modes.includes('TRANSIT')&&E.skyRail.maxPositionDiff<1e-4&&E.skyRail.maxFlightCameraDiff<.02&&E.skyRail.maxAimViewDiffDeg<.01;
 result.checks.groundRailIdentical=E.groundRail.alignedFrames>30&&E.groundRail.maxPositionDiff<.05&&E.groundRail.maxFlightCameraDiff<.02&&E.groundRail.travelled>50;
 result.checks.backspoolLoadoutUnchanged=['backspool','loadout'].every(h=>E.others[h].hero===h&&['plaza','room'].map(k=>E.others[h][k]).every(o=>o.viewAngleDiffDeg<.01&&o.cameraPositionDiff<1e-4&&o.framed[0]));
 E.hostileShots=[(await N.shots())-shots0[0],(await C.shots())-shots0[1]];result.checks.noHostileShotLanded=E.hostileShots.every(x=>x===0);
 result.checks.noPageErrors=errors.length===0;
}catch(e){result.failure=e.stack;}
 result.errors=errors;result.pass=!result.failure&&Object.values(result.checks).every(Boolean);
 fs.writeFileSync(OUT+'/results.json',JSON.stringify(result,null,2)+'\n');for(const[k,v]of Object.entries(result.checks))console.log((v?'PASS ':'FAIL ')+k);if(result.failure)console.log(result.failure);
 await browser.close();assert.ok(result.pass,'Sightline body framing checks failed');})().catch(e=>{console.error(e);process.exit(1);});
