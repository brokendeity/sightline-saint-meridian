/* Loadout without Afterstep VFX in SIGHTLINE_SAINT_MERIDIAN_V02_LOADOUT_RUNNER_NO_AFTERSTEP.html.
   Real input: the Hero-tab menu to choose each hero, keyboard W / A / Shift (sprint toggle) / Space / C.
   Labelled setup (as in test_loadout_runner_real_input.cjs): frames are stepped and drawn with tickFrame; the player
   is reset to the open plaza before each block; the game's own frame loop is held while frames are stepped.
   Checks that while Loadout sprints, rolls and side-flips the Afterstep exhaust (glass shards) is disabled with no
   live particles and the movement afterimages are never drawn (their group is hidden; a capture made after the frame's update is cleared by the next update), and that Backspool (control) still emits both. */
const{chromium}=require('/opt/homebrew/lib/node_modules/playwright'),assert=require('assert/strict'),fs=require('fs');
const OUT='development/characters/loadout/evidence/no-afterstep',BUILD='SIGHTLINE_SAINT_MERIDIAN_V02_LOADOUT_RUNNER_NO_AFTERSTEP.html';
(async()=>{const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal','--mute-audio']});try{
 fs.mkdirSync(OUT,{recursive:true});
 const p=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:8766/'+BUILD+'?capture=backspool');
 await p.waitForFunction(()=>typeof gameReady!=='undefined'&&gameReady&&window.characterState&&!characterState().busy&&roadNetworkState().ready,null,{timeout:300000});
 await p.waitForFunction(()=>verticalWorldLifeState().ready&&v02EastPublicLightingState().ready&&v02RimShadowState().ready,null,{timeout:120000});
 const choose=async hero=>{if(await p.evaluate(()=>gameActive)){await p.evaluate(()=>{window.requestAnimationFrame=cb=>setTimeout(()=>cb(performance.now()),16)});await p.keyboard.press('Escape');await p.waitForTimeout(300);}await p.click('#v02Tab-hero');await p.selectOption('#characterChoice',hero);
  await p.waitForFunction(h=>characterState().hero===h&&!characterState().busy,hero,{timeout:300000});await p.click('#v02Tab-overview');await p.locator('#v02Start').click();await p.evaluate(()=>{window.requestAnimationFrame=()=>0});};
 const frame=()=>p.evaluate(()=>{tickFrame(1/60,true);const v=window.afterstepVfx.state(),a=v.afterimages;
  return{hero:characterState().hero,anim:currentAnim,speed:Math.hypot(s.vel.x,s.vel.z),exhaustEnabled:v.exhaust.enabled,exhaustLive:v.exhaust.activeTotal,exhaustDraws:v.exhaust.visibleDrawCalls,emitted:v.exhaust.emitted,
   afterDraws:a.drawCalls,afterLive:a.active};});
 const run=async n=>{const rows=[];for(let i=0;i<n;i++)rows.push(await frame());return rows;};
 const reset=()=>p.evaluate(()=>{resetPlayer();clearInput();clearPad();startGame(false);s.pos.set(0,.42,12);s.vel.set(0,0,0);s.onGround=true;setMode(P.GROUND);s.yaw=cam.yaw=cam.targetYaw=0;cam.pitch=cam.targetPitch=-.08;for(let i=0;i<120;i++)tickFrame(1/60,false)});
 const shot=async n=>{await p.evaluate(()=>renderNight(0));await p.screenshot({path:`${OUT}/${n}.png`});};
 const session=async hero=>{const r={};
  await reset();await p.keyboard.down('w');await run(40);await p.keyboard.press('Shift');r.sprint=[];for(let i=0;i<120;i++){r.sprint.push(await frame());if(i===80)await shot(hero+'-sprint');}
  await p.keyboard.press('KeyC');r.roll=[];for(let i=0;i<60;i++){r.roll.push(await frame());if(i===12)await shot(hero+'-roll');}await p.keyboard.up('w');await p.keyboard.press('Shift');await run(30);
  await reset();await p.keyboard.press('Shift');await p.keyboard.down('a');await run(45);await p.keyboard.press('Space');r.flip=[];for(let i=0;i<90;i++){r.flip.push(await frame());if(i===20)await shot(hero+'-sideflip');}
  await p.keyboard.up('a');await p.keyboard.press('Shift');await run(30);
  const all=[...r.sprint,...r.roll,...r.flip],emit0=r.sprint[0].emitted;
  return{frames:all.length,heroes:[...new Set(all.map(x=>x.hero))],peakSpeed:+Math.max(...all.map(x=>x.speed)).toFixed(2),anims:[...new Set(all.map(x=>x.anim))],
   exhaustEnabledFrames:all.filter(x=>x.exhaustEnabled).length,exhaustLiveMax:Math.max(...all.map(x=>x.exhaustLive)),exhaustDrawsMax:Math.max(...all.map(x=>x.exhaustDraws)),emittedDuring:all.at(-1).emitted-emit0,
   afterDrawFrames:all.filter(x=>x.afterDraws>0).length,afterLiveMax:Math.max(...all.map(x=>x.afterLive))};};
 await choose('loadout');const loadout=await session('loadout');
 await choose('backspool');const backspool=await session('backspool');
 const checks={
  loadoutSprintedRolledFlipped:loadout.heroes.join()==='loadout'&&loadout.peakSpeed>12&&loadout.anims.some(a=>/^runner-.*Roll/.test(a))&&loadout.anims.some(a=>/^runner-Jmp_SideAir/.test(a)),
  loadoutExhaustOff:loadout.exhaustEnabledFrames===0&&loadout.exhaustLiveMax===0&&loadout.exhaustDrawsMax===0&&loadout.emittedDuring===0,
  loadoutAfterimagesNotDrawn:loadout.afterDrawFrames===0,
  backspoolControlExhaust:backspool.heroes.join()==='backspool'&&backspool.exhaustEnabledFrames===backspool.frames&&backspool.emittedDuring>0&&backspool.exhaustLiveMax>0,
  backspoolControlAfterimages:backspool.afterDrawFrames>0&&backspool.afterLiveMax>0,
  noPageErrors:errors.length===0};
 const result={build:BUILD,checks,pass:Object.values(checks).every(Boolean),loadout,backspool,errors};
 fs.writeFileSync(`${OUT}/results.json`,JSON.stringify(result,null,2)+'\n');
 for(const [k,v] of Object.entries(checks))console.log((v?'PASS ':'FAIL ')+k);
 assert.ok(result.pass,'Loadout no-Afterstep checks failed');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
