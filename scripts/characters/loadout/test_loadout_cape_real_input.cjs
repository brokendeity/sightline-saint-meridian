/* Loadout cape cloth on LOADOUT_CAPE_TEST.html, driven by real keyboard input only (no teleports, no setup):
   idle → hold W (run) → tap Shift (sprint) → hold D while sprinting (turn) → release everything (stop) → P twice (cloth off/on).
   Sampled every 100 ms: the back of the cape's angle from hanging straight down (collar to hem, middle columns),
   body-collider penetration, chain stretch, NaN, and the cloth's CPU cost.
   PASS needs: the cape hangs near vertical at idle, swings back clearly when running and at least as far when sprinting,
   stays finite, outside the body and with every cape bone within 2 cm of its cloth point throughout, settles after stopping, and costs < 1 ms a frame.
   Scope: the standalone test page with Backspool's clips retargeted onto Loadout, not a game build. */
const{chromium}=require('/opt/homebrew/lib/node_modules/playwright'),assert=require('assert/strict'),fs=require('fs'),crypto=require('crypto');
const OUT='development/characters/loadout/evidence/cape-cloth';
(async()=>{const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal','--mute-audio']});try{
 fs.mkdirSync(OUT,{recursive:true});
 const p=await browser.newPage({viewport:{width:900,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:8766/LOADOUT_CAPE_TEST.html');
 await p.waitForFunction(()=>window.loadoutCapeTest&&(window.loadoutCapeTest.ready||window.loadoutCapeTest.error),null,{timeout:180000});
 assert(await p.evaluate(()=>window.loadoutCapeTest.ready),'Test page loads: '+await p.evaluate(()=>window.loadoutCapeTest.error));
 const sample=()=>p.evaluate(()=>{const s=window.loadoutCapeTest.state();return{clip:s.clip,speed:+s.speed.toFixed(2),angle:+s.capeAngle.toFixed(1),pen:s.cape.penetration,stretch:s.cape.maxStretch,aim:s.cape.maxAimErrorM,nan:s.cape.nan,cost:s.cape.lastCostMs,clothOn:s.clothOn};});
 const phase=async(name,ms)=>{const rows=[];for(let t=0;t<ms;t+=100){await p.waitForTimeout(100);rows.push(await sample());}return{name,rows};};
 const med=a=>{const s=[...a].sort((x,y)=>x-y);return s[Math.floor(s.length/2)];};
 const tail=(ph,f=0.5)=>ph.rows.slice(Math.floor(ph.rows.length*(1-f)));
 const phases=[];
 await p.waitForTimeout(1500);
 phases.push(await phase('idle',2500));await p.keyboard.press('1');await p.waitForTimeout(150);await p.screenshot({path:OUT+'/idle-back.png'});
 await p.keyboard.press('2');await p.waitForTimeout(150);await p.screenshot({path:OUT+'/idle-side.png'});
 await p.keyboard.down('w');phases.push(await phase('run',3000));await p.screenshot({path:OUT+'/run-side.png'});
 await p.keyboard.press('Shift');phases.push(await phase('sprint',3000));await p.screenshot({path:OUT+'/sprint-side.png'});
 await p.keyboard.press('4');await p.keyboard.down('d');phases.push(await phase('sprint-turn',2000));await p.screenshot({path:OUT+'/sprint-turn-three-quarter.png'});
 await p.keyboard.up('d');await p.keyboard.up('w');await p.keyboard.press('Shift');await p.keyboard.press('2');
 phases.push(await phase('stop',4000));await p.screenshot({path:OUT+'/stopped-side.png'});
 await p.keyboard.press('p');const off=await sample();await p.keyboard.press('p');phases.push(await phase('cloth-back-on',1500));
 const by=Object.fromEntries(phases.map(ph=>[ph.name,ph]));
 const all=phases.flatMap(ph=>ph.rows).filter(r=>r.clothOn);
 const idle=med(tail(by.idle).map(r=>r.angle)),run=med(tail(by.run).map(r=>r.angle)),sprint=med(tail(by.sprint).map(r=>r.angle));
 const stopRows=by.stop.rows,settleAt=stopRows.findIndex((r,i)=>stopRows.slice(i).every(x=>Math.abs(x.angle-idle)<10));
 const r={idleAngle:idle,runAngle:run,sprintAngle:sprint,runSpeed:med(tail(by.run).map(r=>r.speed)),sprintSpeed:med(tail(by.sprint).map(r=>r.speed)),
  settleSeconds:settleAt<0?null:+(settleAt*0.1).toFixed(1),maxPenetration:Math.max(...all.map(r=>r.pen)),maxStretch:Math.max(...all.map(r=>r.stretch)),maxAimErrorM:Math.max(...all.map(r=>r.aim)),
  anyNaN:all.some(r=>r.nan),meanCostMs:+(all.reduce((s,r)=>s+r.cost,0)/all.length).toFixed(3),maxCostMs:Math.max(...all.map(r=>r.cost)),clothOffWorks:off.clothOn===false,
  turnMaxStretch:Math.max(...by['sprint-turn'].rows.map(r=>r.stretch)),turnMaxPenetration:Math.max(...by['sprint-turn'].rows.map(r=>r.pen))};
 const checks={
  'idle: the cape hangs close to vertical (|angle| <= 15°)':Math.abs(idle)<=15,
  'run: the cape swings back at least 20° more than at idle':run>=idle+20,
  'sprint: the cape swings back at least as far as when running (within 3°)':sprint>=run-3,
  'run and sprint really ran at 4.2 and 7 m/s':Math.abs(r.runSpeed-4.2)<0.2&&Math.abs(r.sprintSpeed-7)<0.2,
  'stop: the cape settles back near its idle angle within 3 s':r.settleSeconds!==null&&r.settleSeconds<=3,
  'throughout: no particle left more than 2 cm inside the body':r.maxPenetration<=0.02,
  'throughout: each cape bone lands within 2 cm of its cloth point (bones only rotate, so the mesh never stretches)':r.maxAimErrorM<=0.02,
  'throughout: finite numbers':!r.anyNaN,
  'cost: under 1 ms a frame on average':r.meanCostMs<1,
  'P switches the cloth off':r.clothOffWorks,
  'no page errors':errors.length===0};
 fs.writeFileSync(OUT+'/results.json',JSON.stringify({page:'LOADOUT_CAPE_TEST.html',
  hashes:Object.fromEntries(['LOADOUT_CAPE_TEST.html','scripts/game_loadout_cape_cloth.js','scripts/game_mixamo_retarget.js','assets/loadout/loadout_caped.fbx','assets/loadout/loadout_cape_rig.json',__filename].map(f=>[require('path').relative(process.cwd(),f),crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')])),
  scope:'Standalone test page, real keyboard input, headless Chromium (ANGLE/Metal). Backspool clips retargeted onto Loadout. Not a game build.',
  results:r,checks,phases,errors},null,1));
 console.log(JSON.stringify(r));
 for(const [k,v] of Object.entries(checks))console.log((v?'PASS ':'FAIL ')+k);
 assert(Object.values(checks).every(Boolean),'Some cape checks failed');
 console.log('PASS Loadout cape cloth, real input');
}finally{await browser.close()}})().catch(e=>{console.error(e.message);process.exitCode=1});
