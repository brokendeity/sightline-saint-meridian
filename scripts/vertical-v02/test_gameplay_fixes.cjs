/* Real-input checks for the V02 gameplay fixes, run against the fixed build and, as a control, the build it was made from.
   Inputs: keyboard (W, Shift, R, Q, C, Escape), a virtual standard pad (right stick turn), and menu clicks.
   Labelled test setup: the player is placed on the open plaza before each block (the same reset the other V02 tests
   use), and frames are stepped with tickFrame while the game's own frame loop is held. No other state is written.
   1. Threadrail floor stall: a standing quick rail no longer leaves Backspool stuck on the floor cable; a running rail
      still grinds; no speed is added by the dismount.
   2. Objective marker: while the camera turns through a full circle, the marker never overlaps a visible HUD panel.
   3. Controls guide: each hero's guide lists that hero's keys, and three listed Backspool keys do what it says. */
const{chromium}=require('/opt/homebrew/lib/node_modules/playwright'),assert=require('assert/strict'),fs=require('fs');
const D='development/vertical-city-v02/',fixed=JSON.parse(fs.readFileSync(D+(process.env.V02_ACTION_BUILD||'V02_Gameplay_Fixes_Build.json')));
const OUT=process.env.V02_FIXES_OUT||D+'evidence/gameplay-fixes';fs.mkdirSync(OUT,{recursive:true});
async function open(browser,entry,errors){
 const p=await browser.newPage({viewport:{width:1280,height:800}});p.on('pageerror',e=>errors.push(entry+': '+e.message));
 await p.addInitScript(()=>{const up={pressed:false,value:0};window.testPad={id:'test pad',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>up)};navigator.getGamepads=()=>[window.testPad];});
 await p.goto('http://127.0.0.1:8766/'+entry+'?capture=backspool');
 await p.waitForFunction(()=>typeof gameReady!=='undefined'&&gameReady&&window.characterState&&!characterState().busy&&roadNetworkState().ready,null,{timeout:300000});
 await p.waitForFunction(()=>verticalWorldLifeState().ready&&v02EastPublicLightingState().ready&&v02RimShadowState().ready,null,{timeout:120000});
 await p.locator('#v02Start').click();await p.evaluate(()=>{window.requestAnimationFrame=()=>0});
 const g={p,
  step:(n,draw=false)=>p.evaluate(([n,draw])=>{for(let i=0;i<n;i++)tickFrame(1/60,draw)},[n,draw]),
  row:()=>p.evaluate(()=>({mode:s.mode,onGround:s.onGround,onRail:threadrailGame.onRail(),speed:+Math.hypot(s.vel.x,s.vel.y,s.vel.z).toFixed(3),hspeed:+Math.hypot(s.vel.x,s.vel.z).toFixed(3),vy:+s.vel.y.toFixed(3),pos:[s.pos.x,s.pos.y,s.pos.z].map(v=>+v.toFixed(3)),anim:currentAnim,hero:characterState().hero})),
  plaza:(yaw=0,x=33.4,z=218.4)=>p.evaluate(([yaw,x,z])=>{resetPlayer();clearInput();clearPad();startGame(false);s.pos.set(x,.42,z);s.vel.set(0,0,0);s.onGround=true;setMode(P.GROUND);s.yaw=cam.yaw=cam.targetYaw=yaw;cam.pitch=cam.targetPitch=-.08;for(let i=0;i<90;i++)tickFrame(1/60,false)},[yaw,x,z]),
  menu:async()=>{await p.evaluate(()=>{window.requestAnimationFrame=cb=>setTimeout(()=>cb(performance.now()),16)});if(await p.evaluate(()=>gameActive))await p.keyboard.press('Escape');await p.waitForTimeout(250);},
  resume:async()=>{await p.locator('#start').click();await p.evaluate(()=>{window.requestAnimationFrame=()=>0});},
  hero:async h=>{await g.menu();await p.click('#v02Tab-hero');await p.selectOption('#characterChoice',h);await p.waitForFunction(h=>characterState().hero===h&&!characterState().busy,h,{timeout:300000});await p.click('#v02Tab-overview');await g.resume();},
 };return g;}
async function standingRail(g,frames=300){await g.plaza(0);await g.p.keyboard.press('KeyR');const rows=[];for(let i=0;i<frames;i++){await g.step(1);rows.push(await g.row());}return rows;}
(async()=>{const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal','--mute-audio']}),errors=[],result={build:fixed.entry,control:fixed.source,checks:{},evidence:{}};try{
 const F=await open(browser,fixed.entry,errors),C=await open(browser,fixed.source,errors);
 // 1. Threadrail floor stall.
 const fr=await standingRail(F),cr=await standingRail(C);
 const attachF=fr.findIndex(r=>r.onRail),releaseF=fr.findIndex((r,i)=>i>attachF&&!r.onRail),stuckC=cr.slice(-60).every(r=>r.onRail&&r.speed<.3&&/grind/.test(r.anim));
 const fixState=await F.p.evaluate(()=>v02GameplayFixes.state().stall);
 await F.p.keyboard.down('w');await F.step(45);const walked=await F.row();await F.p.keyboard.up('w');
 const releaseRow=fr[releaseF]||null,afterRelease=fr.slice(releaseF,releaseF+30);
 result.evidence.stall={attachFrame:attachF,releaseFrame:releaseF,secondsOnRail:releaseF>0?+((releaseF-attachF)/60).toFixed(2):null,releaseRow,settled:fr.at(-1),fixState,walked,controlLast:cr.at(-1),controlStuckLastSecond:stuckC,
  controlAnims:[...new Set(cr.map(r=>r.anim))],fixedAnims:[...new Set(fr.map(r=>r.anim))]};
 result.checks.controlBuildReproducesStall=attachF>=0&&stuckC;
 result.checks.standingRailAttachesThenStepsOff=attachF>=0&&releaseF>attachF&&(releaseF-attachF)/60<1.2&&fixState.dismounts>=1&&fixState.last?.reason==='floor';
 result.evidence.stall.afterRelease=afterRelease.map(r=>[r.mode,r.hspeed,r.vy,r.pos[1]]);
 result.checks.dismountAddsNoSpeed=afterRelease.every(r=>r.hspeed<.05&&r.vy<=0)&&Math.hypot(fr.at(-1).pos[0]-fr[attachF].pos[0],fr.at(-1).pos[2]-fr[attachF].pos[2])<.3&&fr.at(-1).mode==='GROUND';
 result.checks.walkWorksAfterDismount=Math.hypot(walked.pos[0]-fr.at(-1).pos[0],walked.pos[2]-fr.at(-1).pos[2])>2&&walked.mode==='GROUND';
 // Running attach still grinds with speed (behaviour of moving rails unchanged).
 const dismountsBefore=fixState.dismounts;await F.plaza(0);await F.p.keyboard.down('w');await F.step(40);await F.p.keyboard.press('KeyR');const run=[];for(let i=0;i<150;i++){await F.step(1);run.push(await F.row());}await F.p.keyboard.up('w');
 const moving=run.filter(r=>r.onRail&&r.speed>3);result.evidence.runningRail={grindFramesWithSpeed:moving.length,peak:Math.max(...run.map(r=>r.speed)),dismountsAfter:(await F.p.evaluate(()=>v02GameplayFixes.state().stall)).dismounts};
 result.checks.runningRailStillGrinds=moving.length>=10&&moving.filter(r=>/grind/.test(r.anim)).length>=moving.length*.8&&result.evidence.runningRail.dismountsAfter===dismountsBefore;
 await F.p.evaluate(()=>{renderNight(0)});await F.p.screenshot({path:OUT+'/stall-fixed-after.png'});
 await C.p.evaluate(()=>{renderNight(0)});await C.p.screenshot({path:OUT+'/stall-control-stuck.png'});
 // 2. Objective marker vs HUD panels, Sightline, camera turned with the right stick through a full circle.
 const markerSweep=async g=>{await g.hero('sightline');await g.plaza(0,0,12);await g.p.evaluate(()=>testPad.axes=[0,0,0,-1]);await g.step(90);await g.p.evaluate(()=>testPad.axes=[0,0,.55,0]);const hits=[];let samples=0,worst=null;
  for(let i=0;i<150;i++){await g.step(4,true);samples++;const o=await g.p.evaluate(()=>{const m=document.getElementById('navigationMarker');if(!m||m.style.display==='none')return null;const r=m.getBoundingClientRect(),out=[];for(const id of ['flightVitals','mission','railReadPanel','courierReadout','actionHint']){const e=document.getElementById(id);if(!e||e.hidden)continue;const st=getComputedStyle(e);if(st.display==='none'||st.visibility==='hidden')continue;const p=e.getBoundingClientRect();if(!p.width)continue;const w=Math.min(r.right,p.right)-Math.max(r.left,p.left),h=Math.min(r.bottom,p.bottom)-Math.max(r.top,p.top);if(w>0&&h>0)out.push({id,area:Math.round(w*h)});}return{out,yaw:+cam.yaw.toFixed(2),marker:[r.left,r.top,r.width,r.height].map(Math.round)}});
   if(o&&o.out.length){hits.push(o);if(!worst||o.out[0].area>worst.out[0].area)worst=o;}}
  await g.p.evaluate(()=>testPad.axes=[0,0,0,0]);if(worst){await g.p.evaluate(()=>renderNight(0));}return{samples,overlapSamples:hits.length,worst,yawEnd:await g.p.evaluate(()=>+cam.yaw.toFixed(2))};};
 const mF=await markerSweep(F),mC=await markerSweep(C);
 await F.p.evaluate(()=>renderNight(0));await F.p.screenshot({path:OUT+'/marker-fixed.png'});
 result.evidence.marker={fixed:mF,control:mC,moves:(await F.p.evaluate(()=>v02GameplayFixes.state().marker))};
 result.checks.controlBuildShowsMarkerOverlap=mC.overlapSamples>0;
 result.checks.markerClearOfHudPanels=mF.overlapSamples===0&&mF.samples>=150;
 // 3. Controls guide per hero, read from the real menu.
 const guideText=async(g,h,tag)=>{await g.hero(h);await g.menu();await g.p.click('#v02Tab-controls');if(await g.p.locator('#controlsGuide').isHidden())await g.p.click('#helpToggle');await g.p.waitForTimeout(300);const t=await g.p.evaluate(()=>document.getElementById('controlsGuide').innerText.replace(/\s+/g,' '));const html=await g.p.evaluate(()=>document.getElementById('controlsGuide').innerHTML);await g.p.screenshot({path:OUT+'/guide-'+tag+'-'+h+'.png'});await g.p.click('#helpToggle');await g.p.click('#v02Tab-overview');await g.resume();return{text:t,html};};
 const gs=await guideText(F,'sightline','fixed'),gb=await guideText(F,'backspool','fixed'),gl=await guideText(F,'loadout','fixed'),cs=await guideText(C,'sightline','control'),cb=await guideText(C,'backspool','control');
 result.evidence.guide={sightline:gs.text.slice(0,400),backspool:gb.text.slice(0,600),loadout:gl.text.slice(0,600),controlBackspool:cb.text.slice(0,300)};
 result.checks.controlGuideWrongForBackspool=/Reset to plaza/.test(cb.text)&&/Aim Sightline/.test(cb.text);
 result.checks.sightlineGuideUnchanged=gs.html===cs.html&&/Reset to plaza/.test(gs.text);
 result.checks.backspoolGuideListsBackspoolKeys=/Threadrail/.test(gb.text)&&/Afterstep Drive/.test(gb.text)&&/Strike/.test(gb.text)&&!/Reset to plaza|Aim Sightline|Micro-rail/.test(gb.text);
 const loadoutRows=gl.text.replace(/Loadout uses .*?Echo or Retrace\./,'');
 result.checks.loadoutGuideHasNoPowers=/without his powers/.test(gl.text)&&/Strike/.test(loadoutRows)&&!/Threadrail|Afterstep Drive|Snapback|Echo/.test(loadoutRows);
 // Three listed Backspool keys do what the guide says (R Threadrail, Q heavy, C evade).
 await F.hero('backspool');await F.plaza(0);await F.p.keyboard.press('KeyR');const rRows=[];for(let i=0;i<120;i++){await F.step(1);rRows.push(await F.row());}
 await F.plaza(0);await F.p.keyboard.press('KeyQ');const qRows=[];for(let i=0;i<30;i++){await F.step(1);qRows.push(await F.row());}
 await F.plaza(0);await F.p.keyboard.press('KeyC');const cRows=[];for(let i=0;i<30;i++){await F.step(1);cRows.push(await F.row());}
 result.evidence.keys={R:[...new Set(rRows.map(r=>r.anim))],Q:[...new Set(qRows.map(r=>r.anim))],C:[...new Set(cRows.map(r=>r.anim))],deployment:await F.p.evaluate(()=>threadrailGame.state().deployment.status)};
 result.checks.guideKeysWork=rRows.some(r=>r.onRail)&&qRows.some(r=>/heavy/.test(r.anim))&&cRows.some(r=>/backstep|evade|dodge|BoostDash/i.test(r.anim));
 result.checks.noPageErrors=errors.length===0;
}catch(e){result.failure=e.stack;}
 result.errors=errors;result.pass=!result.failure&&Object.values(result.checks).every(Boolean);
 fs.writeFileSync(OUT+'/results.json',JSON.stringify(result,null,2)+'\n');for(const[k,v]of Object.entries(result.checks))console.log((v?'PASS ':'FAIL ')+k);if(result.failure)console.log(result.failure);
 await browser.close();assert.ok(result.pass,'gameplay fixes checks failed');})().catch(e=>{console.error(e);process.exit(1);});
