const {chromium}=require('/opt/homebrew/lib/node_modules/playwright'),fs=require('fs'),assert=require('assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal']});
 const p=await browser.newPage({viewport:{width:1280,height:800}}),tests=[],errors=[];
 const check=(name,value)=>{assert(value,name);tests.push(name);console.log('PASS',name)};
 const step=n=>p.evaluate(n=>{for(let i=0;i<n;i++)tickFrame(1/60,false)},n);
 const switchHero=async hero=>{await p.evaluate(()=>{for(const i of[10,6,7,11])testPad.buttons[i]={pressed:true,value:1}});await step(1);await p.waitForFunction(hero=>characterState().active===hero&&!characterState().busy,hero,{timeout:60000});await p.evaluate(()=>{for(const i of[10,6,7,11])testPad.buttons[i]={pressed:false,value:0}});await step(2);};
 try{
  p.on('pageerror',e=>errors.push(e.stack));
  await p.addInitScript(()=>{window.testPad={index:0,id:'Switch controller',mapping:'standard',connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};navigator.getGamepads=()=>[testPad]});
  await p.goto('http://127.0.0.1:8766/SIGHTLINE_BACKSPOOL_THREADRAIL_CANDIDATE.html?capture=backspool');
  await p.waitForFunction(()=>typeof gameReady!=='undefined'&&gameReady&&!characterState().busy&&roadNetworkState().ready,null,{timeout:90000});
  await p.click('#start');await p.evaluate(()=>window.loop=()=>{});await p.waitForTimeout(40);await step(2);
  await p.evaluate(()=>{clearInput();resetMechanicInput();backspoolCombat.reset('SWITCH FIXTURE');backspoolFlow.reset('RESPAWN');backspoolAdvanced.reset('RESPAWN');threadrailGame.lifecycle('RESPAWN');s.pos.set(0,.42,25);s.vel.set(0,0,0);s.onGround=true;setMode(P.GROUND);cam.yaw=cam.targetYaw=s.yaw=0;for(const e of enemies)e.blindTimer=999});
  await p.keyboard.press('Shift');await p.keyboard.down('w');await step(100);await p.keyboard.press('e');await step(1);await p.keyboard.up('w');
  check('real Flow movement supplies a spent impulse before switching',await p.evaluate(()=>threadrailGame.state().drive.strain>0));
  await p.evaluate(()=>{backspoolFlow.reset('FIXTURE');backspoolAdvanced.reset('FIXTURE');threadrailGame.drawCourse();s.pos.set(-29,5.2,65);s.vel.set(12,0,0);s.onGround=false;setMode(P.AIR);cam.yaw=cam.targetYaw=s.yaw=-Math.PI/2});
  await p.keyboard.press('r');await step(10);check('hero switch begins during an actual attached grind',await p.evaluate(()=>!!threadrailGame.state().rail.current));
  const before=await p.evaluate(()=>{combatants.receiveHeroDamage(35);return threadrailGame.state().drive.strain});await switchHero('sightline');
  const switched=await p.evaluate(()=>({e:threadrailGame.state(),hp:courier.trauma,heroes:combatants.state().heroes,pos:s.pos.toArray(),v:s.vel.toArray()}));
  check('four-button chord switches out of rail and clears bank, topology and effects',!switched.e.rail.current&&!switched.e.rail.rails.length&&!switched.e.drive.bank.length&&!switched.e.exhaust.activeTotal);
  check('switch preserves Backspool health in its hero ledger and keeps sequence strain',Math.abs(switched.heroes.backspool.trauma-35)<.01&&switched.e.drive.strain>0&&switched.e.drive.strain<=before+.01);
  check('switch preserves finite physical state',switched.pos.concat(switched.v).every(Number.isFinite));
  await step(180);await p.keyboard.press('Shift');await p.keyboard.press('e');await step(2);
  check('Sightline inputs cannot enable Backspool equipment',await p.evaluate(()=>!threadrailGame.state().sprint&&!threadrailGame.state().rail.current&&!threadrailGame.state().drive.bank.length));
  await switchHero('backspool');check('same chord returns to Backspool with no free bank or latch',await p.evaluate(()=>!threadrailGame.state().sprint&&!threadrailGame.state().drive.bank.length));check('return restores existing Backspool health rather than refilling it',await p.evaluate(()=>courier.trauma>34&&courier.trauma<=35));
  check('clean hero-switch console',errors.length===0);fs.writeFileSync('output/threadrail/hero-switch-report.json',JSON.stringify({tests,errors,physicalControllerTested:false},null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e.stack);process.exitCode=1});
