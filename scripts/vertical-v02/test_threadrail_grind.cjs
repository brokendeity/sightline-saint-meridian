/* Real-input checks for Threadrail grind lines (game_v02_threadrail_grind.js), run against the grind build and, as a
   control, the build it was made from.
   Inputs: a virtual standard pad read by the game's own poll (right stick aims, closed loop on the rendered crosshair;
   left stick runs; L3 toggles Flow; A jumps) and the R key (hold-release = precision cartridge throw, tap = attach).
   Labelled test setup: Backspool is placed on the plaza (and, for each run, at its start point, without a reset so the
   thrown line stays); drones are held in patrol, courier guards stunned, projectiles cleared. Frames are stepped with
   tickFrame while the game's own loop is held. Rails, cables and the camera are never written.
   1. Two precision throws at two plaza pillars make one cartridge-to-cartridge line (both builds).
   2. The line is drawn thick and glowing (new) instead of the thin line (control).
   3. A Flow run and jump that comes down onto the line catches it and grinds with the Forspoken surf loop, with no speed
      added; the control never catches with the same inputs.
   4. Jumping off is not undone by an instant re-catch; a still jump under the line does not stick him on it;
      R beside a line still attaches in both builds. */
const{chromium}=require('/opt/homebrew/lib/node_modules/playwright'),assert=require('assert/strict'),fs=require('fs');
const D='development/vertical-city-v02/',build=JSON.parse(fs.readFileSync(D+(process.env.V02_ACTION_BUILD||'V02_Threadrail_Grind_Build.json')));
// Control build: the record's source by default; V02_GRIND_CONTROL names another (the pre-grind build) for later builds.
const CONTROL=process.env.V02_GRIND_CONTROL||build.source;
const OUT=process.env.V02_GRIND_OUT||D+'evidence/threadrail-grind';fs.mkdirSync(OUT,{recursive:true});
const A_BTN=0,L3=10,PILLAR_A=[21.4,1.1,70.4],PILLAR_B=[-21.4,1.1,70.4],JUMP_AT=[10,10.5,9.5,11,9,11.5];
async function open(browser,entry,errors){
 const p=await browser.newPage({viewport:{width:1280,height:800}});p.on('pageerror',e=>errors.push(entry+': '+e.message));
 await p.addInitScript(()=>{const up={pressed:false,value:0};window.testPad={id:'test pad',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>up)};navigator.getGamepads=()=>[window.testPad];});
 if(process.env.V02_BACKSPOOL_COSTUME)await p.addInitScript(c=>{try{localStorage.setItem('backspoolCostume',c);}catch(e){}},process.env.V02_BACKSPOOL_COSTUME);
 await p.goto('http://127.0.0.1:8766/'+entry+'?capture=backspool');
 await p.waitForFunction(()=>typeof gameReady!=='undefined'&&gameReady&&window.characterState&&!characterState().busy&&roadNetworkState().ready,null,{timeout:300000});
 await p.waitForFunction(()=>verticalWorldLifeState().ready&&v02EastPublicLightingState().ready&&v02RimShadowState().ready,null,{timeout:120000});
 if(process.env.V02_BACKSPOOL_COSTUME){await p.waitForFunction(c=>!window.backspoolCostume||characterSwitcher.bankKey()==='backspool@'+c,process.env.V02_BACKSPOOL_COSTUME,{timeout:300000});console.log('costume bank active where supported: backspool@'+process.env.V02_BACKSPOOL_COSTUME);}
 await p.locator('#v02Start').click();await p.evaluate(()=>{window.requestAnimationFrame=()=>0});
 await p.evaluate(()=>{
  window.__pad=(b,a)=>{testPad.buttons=testPad.buttons.map((x,i)=>b.includes(i)?{pressed:true,value:1}:{pressed:false,value:0});testPad.axes=a;};
  // Closed-loop right stick: turn until the rendered crosshair points at the target.
  window.__aim=target=>{const T=new THREE.Vector3(...target);for(let i=0;i<150;i++){camera.updateMatrixWorld();const d=camera.getWorldDirection(new THREE.Vector3()),w=T.clone().sub(camera.position).normalize();const cy=Math.atan2(-d.x,-d.z),wy=Math.atan2(-w.x,-w.z),ey=Math.atan2(Math.sin(wy-cy),Math.cos(wy-cy)),ep=Math.asin(w.y)-Math.asin(d.y);if(Math.hypot(ey,ep)*180/Math.PI<.25){testPad.axes=[0,0,0,0];tickFrame(1/60,false);continue;}const sx=Math.max(-1,Math.min(1,-ey*6)),sy=Math.max(-1,Math.min(1,-ep*6));testPad.axes=[0,0,Math.sign(sx)*Math.max(.22,Math.abs(sx)),Math.sign(sy)*Math.max(.22,Math.abs(sy))];tickFrame(1/60,false);}testPad.axes=[0,0,0,0];for(let i=0;i<10;i++)tickFrame(1/60,false);camera.updateMatrixWorld();return camera.getWorldDirection(new THREE.Vector3()).angleTo(T.clone().sub(camera.position).normalize())*180/Math.PI;};
  window.__rail=()=>{const r=threadrailGame.state().rail;return{anchors:r.anchors.map(a=>[a.position.x,a.position.y,a.position.z]),rails:r.rails.map(x=>({id:x.id,a:x.a,b:x.b,length:x.length,slope:x.slope})),current:r.current?{id:r.current.railId,speed:r.current.speed}:null};};
  window.__visual=()=>{const thin=scene.getObjectByName('Backspool equipment cables'),core=scene.getObjectByName('Threadrail / grind line core 0'),glow=scene.getObjectByName('Threadrail / grind line glow 0');
   let thinCount=0,thinVisible=false;scene.traverse(o=>{if(o.name==='Backspool equipment cables'){thinCount++;if(o.visible&&o.parent)thinVisible=true;}});
   return{thinVisible,thinCount,core:core?{visible:core.visible,radius:core.scale.x,length:core.scale.y,mid:core.position.toArray()}:null,glow:glow?{visible:glow.visible,radius:glow.scale.x,additive:glow.material.blending===THREE.AdditiveBlending}:null};};
  window.__standDown=()=>{for(const e of enemies){cancelEnemyAttack(e);e.alertState='PATROL';e.alertCooldown=1e6;}for(const q of courier.guards){cancelEnemyAttack(q);q.stun=1e6;}for(const q of projectiles)disposeObject(q.m);projectiles.length=0;};
 });
 const g={p,
  tick:n=>p.evaluate(n=>{for(let i=0;i<n;i++)tickFrame(1/60,false)},n),
  shots:()=>p.evaluate(()=>mechanicPolish.shots),
  shot:async name=>{await p.evaluate(()=>renderNight(0));await p.screenshot({path:OUT+'/'+name+'.png'});},
  // Labelled setup: reset to the plaza facing the north pillars (this clears earlier lines).
  plaza:()=>p.evaluate(()=>{__standDown();resetPlayer();clearInput();clearPad();__pad([],[0,0,0,0]);startGame(false);s.pos.set(0,.42,58);s.vel.set(0,0,0);s.onGround=true;setMode(P.GROUND);s.yaw=cam.yaw=cam.targetYaw=Math.PI;cam.pitch=cam.targetPitch=-.08;for(let i=0;i<60;i++)tickFrame(1/60,false);}),
 };
 g.throwAt=async target=>{const err=await p.evaluate(t=>__aim(t),target);await p.keyboard.down('KeyR');await g.tick(24);await p.keyboard.up('KeyR');await g.tick(100);return{aimErrorDeg:+err.toFixed(2),status:await p.evaluate(()=>document.getElementById('driveStatus')?.textContent||'')};};
 g.makeLine=async()=>{await g.plaza();const a=await g.throwAt(PILLAR_A),b=await g.throwAt(PILLAR_B);return{a,b,rail:await p.evaluate(()=>__rail())};};
 // One run: placement beside the line (labelled setup, no reset), Flow on by L3 if off, run diagonally at the line,
 // press A when the body is `jumpAt` m from the line sideways, keep running for 240 frames.
 g.run=(jumpAt,angle=.6,flow=true,frames=240)=>p.evaluate(RUN,[jumpAt,angle,flow,frames,L3]);
 return g;}
// One run, evaluated in the page: placement beside the line (labelled setup, no reset, so the thrown line stays), Flow on
// by L3 if it is off, run diagonally at the line, press A when the body is `jumpAt` m from the line sideways.
function RUN([jumpAt,angle,flow,frames,L3btn]){
 __standDown();const r=threadrailGame.state().rail,a=r.anchors[0].position,b=r.anchors[1].position,A=new THREE.Vector3(a.x,a.y,a.z),B=new THREE.Vector3(b.x,b.y,b.z),AB=B.clone().sub(A);
 const u=AB.clone().setY(0).normalize(),n=new THREE.Vector3(0,0,-1);if(n.dot(new THREE.Vector3(0,0,58).sub(A))<0)n.negate();
 const start=A.clone().lerp(B,.15).addScaledVector(n,16).addScaledVector(u,-6);start.y=.42;const dir=u.clone().multiplyScalar(Math.cos(angle)).addScaledVector(n,-Math.sin(angle)).normalize();
 clearInput();__pad([],[0,0,0,0]);s.pos.copy(start);s.vel.set(0,0,0);s.onGround=true;setMode(P.GROUND);s.yaw=cam.yaw=cam.targetYaw=Math.atan2(-dir.x,-dir.z);cam.pitch=cam.targetPitch=-.08;for(let i=0;i<30;i++)tickFrame(1/60,false);
 const lat=()=>{const t=s.pos.clone().sub(A).dot(AB)/AB.lengthSq(),q=A.clone().lerp(B,t);return Math.hypot(s.pos.x-q.x,s.pos.z-q.z);},along=()=>s.pos.clone().sub(A).dot(AB)/AB.length(),tan=AB.clone().normalize();
 __pad([],[0,-1,0,0]);for(let i=0;i<6;i++)tickFrame(1/60,false);
 if(flow&&!inputSprinting()){__pad([L3btn],[0,-1,0,0]);tickFrame(1/60,false);tickFrame(1/60,false);__pad([],[0,-1,0,0]);}
 const rows=[];let jumped=false;
 for(let i=0;i<frames;i++){if(!jumped&&lat()<jumpAt){__pad([0],[0,-1,0,0]);jumped=true;}else __pad([],[0,-1,0,0]);
  const vBefore=s.vel.clone();tickFrame(1/60,false);const st=threadrailGame.state();
  rows.push({lat:lat(),y:s.pos.y,along:along(),ground:s.onGround,on:!!st.rail.current,speed:st.rail.current?st.rail.current.speed:Math.hypot(s.vel.x,s.vel.z),alongBefore:Math.abs(vBefore.dot(tan)),anim:st.activeAnimation,surf:st.surf.phase,flow:inputSprinting()});}
 __pad([],[0,0,0,0]);
 return{jumpAt,angle,flow,jumped,rows};
}
const r3=v=>+(+v).toFixed(3);
function summarise(run){const on=run.rows.map((r,i)=>r.on?i:-1).filter(i=>i>=0),first=on[0];
 if(first===undefined)return{jumpAt:run.jumpAt,caught:false,maxY:r3(Math.max(...run.rows.map(r=>r.y))),minLat:r3(Math.min(...run.rows.map(r=>r.lat)))};
 const seg=[];for(let i=first;i<run.rows.length&&run.rows[i].on;i++)seg.push(run.rows[i]);
 return{jumpAt:run.jumpAt,caught:true,catchFrame:first,framesOnRail:seg.length,catchSpeed:r3(seg[0].speed),incomingAlong:r3(run.rows[first].alongBefore),travelled:r3(Math.abs(seg.at(-1).along-seg[0].along)),
  anims:[...new Set(seg.map(r=>r.anim))],surfPhases:[...new Set(seg.map(r=>r.surf))],flowAtJump:run.rows[Math.max(0,first-1)].flow};}
(async()=>{const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal','--mute-audio']}),errors=[],result={build:build.entry,control:CONTROL,checks:{},evidence:{}};try{
 const N=await open(browser,build.entry,errors),C=await open(browser,CONTROL,errors),shots0=[await N.shots(),await C.shots()],E=result.evidence;
 E.before={new:await N.p.evaluate(()=>__visual()),control:await C.p.evaluate(()=>__visual())};
 // 1. Two precision throws make one line.
 E.line={new:await N.makeLine(),control:await C.makeLine()};
 const lineOk=x=>x.rail.rails.length===1&&x.rail.rails[0].length>35&&x.rail.rails[0].length<46&&x.rail.anchors.length===2;
 result.checks.throwsMakeLine=lineOk(E.line.new)&&lineOk(E.line.control);
 // 2. Visuals.
 E.visual={new:await N.p.evaluate(()=>__visual()),control:await C.p.evaluate(()=>__visual())};
 const an=E.line.new.rail.anchors,mid=[0,1,2].map(i=>(an[0][i]+an[1][i])/2-(i===1?.42:0));
 E.visual.coreMidOffset=E.visual.new.core?r3(Math.hypot(...E.visual.new.core.mid.map((v,i)=>v-mid[i]))):null;
 await N.shot('line-new');await C.shot('line-control');
 result.checks.thickGlowingLineDrawn=E.before.new.core&&!E.before.new.core.visible&&E.visual.new.core?.visible&&E.visual.new.glow?.visible&&E.visual.new.glow.additive&&Math.abs(E.visual.new.core.radius-.035)<1e-6&&Math.abs(E.visual.new.glow.radius-.12)<1e-6&&E.visual.coreMidOffset<.01&&Math.abs(E.visual.new.core.length-E.line.new.rail.rails[0].length)<.05&&!E.visual.control.core;
 // Note: the old one-pixel line is drawn by an unnamed line object in both builds; in the new build it lies inside the 7 cm core.
 // 3. Flow run and jump onto the line: the same jump distances in both builds, until the new build catches.
 E.runs={new:[],control:[]};let caught=null;
 for(const d of JUMP_AT){const run=await N.run(d);const sm=summarise(run);E.runs.new.push(sm);if(sm.caught){caught={run,sm};break;}}
 for(const d of JUMP_AT.slice(0,E.runs.new.length)){const sm=summarise(await C.run(d));E.runs.control.push(sm);}
 result.checks.landingOnLineGrinds=!!caught&&caught.sm.framesOnRail>=45&&caught.sm.travelled>=10&&caught.sm.anims.every(a=>a==='forspoken-threadrail-grind')&&caught.sm.surfPhases.some(p=>p!=='off');
 result.checks.noFreeSpeed=!!caught&&caught.sm.catchSpeed>=8&&caught.sm.catchSpeed<=caught.sm.incomingAlong+.3;
 result.checks.controlNeverCatches=E.runs.control.length===E.runs.new.length&&E.runs.control.every(r=>!r.caught);
 // Grinding screenshot: same successful jump again, stopped while on the line.
 if(caught){await N.makeLine();const again=await N.run(caught.sm.jumpAt,.6,true,caught.sm.catchFrame+20);E.grindShot=summarise(again);await N.shot('grinding-new');}
 // 4a. Jump off while grinding: A, then no re-catch for 0.4 s.
 await N.makeLine();let jumpOff=null;
 {const run=await N.run(caught?caught.sm.jumpAt:10,.6,true,(caught?caught.sm.catchFrame:120)+15);const onNow=await N.p.evaluate(()=>!!threadrailGame.state().rail.current);
  if(onNow){const rows=await N.p.evaluate(()=>{const out=[];__pad([0],[0,-1,0,0]);tickFrame(1/60,false);tickFrame(1/60,false);__pad([],[0,-1,0,0]);for(let i=0;i<40;i++){tickFrame(1/60,false);out.push(!!threadrailGame.state().rail.current);}__pad([],[0,0,0,0]);return out;});
   jumpOff={wasOn:true,offAfterJump:!rows[0],recaughtWithin04s:rows.slice(0,24).some(Boolean)};}else jumpOff={wasOn:false};}
 E.jumpOff=jumpOff;result.checks.jumpOffNotRecaught=!!jumpOff?.wasOn&&jumpOff.offAfterJump&&!jumpOff.recaughtWithin04s;
 // 4b. Still jump straight up under the middle of the line: no stuck catch.
 await N.makeLine();E.stillJump=await N.p.evaluate(()=>{__standDown();const r=threadrailGame.state().rail,a=r.anchors[0].position,b=r.anchors[1].position;clearInput();s.pos.set((a.x+b.x)/2,.42,(a.z+b.z)/2);s.vel.set(0,0,0);s.onGround=true;setMode(P.GROUND);for(let i=0;i<20;i++)tickFrame(1/60,false);
  const before=v02ThreadrailGrind.state();__pad([0],[0,0,0,0]);tickFrame(1/60,false);tickFrame(1/60,false);__pad([],[0,0,0,0]);let on=0,maxY=0;for(let i=0;i<120;i++){tickFrame(1/60,false);if(threadrailGame.state().rail.current)on++;maxY=Math.max(maxY,s.pos.y);}const after=v02ThreadrailGrind.state();
  return{framesOnRail:on,maxY,tooSlowRefusals:after.tooSlow-before.tooSlow,catches:after.catches-before.catches,endOnGround:s.onGround};});
 result.checks.stillJumpUnderLineDoesNotStick=E.stillJump.maxY>1.2&&E.stillJump.framesOnRail===0&&E.stillJump.catches===0&&E.stillJump.endOnGround;
 // 4c. R tap beside the line still attaches, in both builds.
 const rTap=async g=>{await g.makeLine();await g.p.evaluate(()=>{__standDown();const r=threadrailGame.state().rail,a=r.anchors[0].position,b=r.anchors[1].position;clearInput();s.pos.set((a.x+b.x)/2,.42,(a.z+b.z)/2-1);s.vel.set(0,0,0);s.onGround=true;setMode(P.GROUND);for(let i=0;i<20;i++)tickFrame(1/60,false);});
  await g.p.keyboard.down('KeyR');await g.tick(2);await g.p.keyboard.up('KeyR');let on=false;for(let i=0;i<20&&!on;i++){await g.tick(1);on=await g.p.evaluate(()=>!!threadrailGame.state().rail.current);}return on;};
 E.rTap={new:await rTap(N),control:await rTap(C)};result.checks.rTapStillAttaches=E.rTap.new&&E.rTap.control;
 E.grindState=await N.p.evaluate(()=>v02ThreadrailGrind.state());
 E.hostileShots=[(await N.shots())-shots0[0],(await C.shots())-shots0[1]];result.checks.noHostileShotLanded=E.hostileShots.every(x=>x===0);
 result.checks.noPageErrors=errors.length===0;
}catch(e){result.failure=e.stack;}
 result.errors=errors;result.pass=!result.failure&&Object.values(result.checks).every(Boolean);
 fs.writeFileSync(OUT+'/results.json',JSON.stringify(result,null,2)+'\n');for(const[k,v]of Object.entries(result.checks))console.log((v?'PASS ':'FAIL ')+k);if(result.failure)console.log(result.failure);
 await browser.close();assert.ok(result.pass,'threadrail grind checks failed');})().catch(e=>{console.error(e);process.exit(1);});
