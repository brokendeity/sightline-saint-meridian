/* Reproducible presentation captures; fixture placement is explicit, actions use keys. */
const {chromium}=require('/opt/homebrew/lib/node_modules/playwright');
const fs=require('fs'),assert=require('assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal']});
 const page=await browser.newPage({viewport:{width:1280,height:800},hasTouch:false}),errors=[],shots=[];
 page.on('pageerror',e=>errors.push(e.stack));
 const run=n=>page.evaluate(n=>{for(let i=0;i<n;i++)tickFrame(1/60,false)},n);
 const shot=async name=>{await page.evaluate(()=>renderNight(0));await page.screenshot({path:'output/threadrail/'+name+'.png'});shots.push({name,state:await page.evaluate(()=>({position:s.pos.toArray(),velocity:s.vel.toArray(),camera:camera.position.toArray(),equipment:threadrailGame.state(),flow:backspoolFlowState().sourcePlayback}))});};
 try{
  await page.addInitScript(()=>navigator.getGamepads=()=>[]);
  await page.goto('http://127.0.0.1:8766/SIGHTLINE_BACKSPOOL_THREADRAIL_CANDIDATE.html?capture=backspool');
  await page.waitForFunction(()=>typeof gameReady!=='undefined'&&gameReady&&!characterState().busy&&roadNetworkState().ready,null,{timeout:90000});
  await page.click('#start');await page.evaluate(()=>window.loop=()=>{});await page.waitForTimeout(40);await run(2);
  await page.evaluate(()=>{clearInput();resetMechanicInput();backspoolCombat.reset('CAPTURE');backspoolPowers.clear();s.pos.set(0,.42,25);s.vel.set(0,0,0);s.onGround=true;setMode(P.GROUND);cam.yaw=cam.targetYaw=s.yaw=0;courier.trauma=0;threadrailGame.lifecycle('RESPAWN');for(const e of enemies)e.blindTimer=999;});
  await run(90);await shot('final-idle');
  await page.keyboard.press('Shift');await page.keyboard.down('w');await run(110);await page.keyboard.press('e');await run(2);
  assert(await page.evaluate(()=>threadrailGame.state().exhaust.activeTotal>0));await shot('final-drive-rear');
  await page.evaluate(()=>{camera.position.copy(s.pos).add(new THREE.Vector3(3.1,1.7,3.2));camera.lookAt(s.pos.clone().add(new THREE.Vector3(0,1,0)));camera.updateMatrixWorld(true)});await shot('final-drive-side');
  await page.keyboard.up('w');await page.evaluate(()=>{clearInput();resetMechanicInput();backspoolFlow.reset('RESPAWN');backspoolAdvanced.reset('RESPAWN');s.pos.set(0,.42,25);s.vel.set(0,0,0);s.onGround=true;setMode(P.GROUND);threadrailGame.lifecycle('RESPAWN');});await run(2);await page.keyboard.press('Space');let descending=false;for(let i=0;i<120;i++){await run(1);if(await page.evaluate(()=>!s.onGround&&s.vel.y<-4&&threadrailGame.state().movementReady)){descending=true;break;}}
  assert(descending,'Jump must reach an eligible descending phase');await page.keyboard.down('Tab');await run(1);await page.getByRole('button',{name:'brake',exact:true}).click();await page.keyboard.up('Tab');await page.keyboard.press('e');await run(2);
  assert(await page.evaluate(()=>threadrailGame.state().exhaust.lastRelease?.braking));await page.evaluate(()=>{camera.position.copy(s.pos).add(new THREE.Vector3(1.8,1.6,3.0));camera.lookAt(s.pos.clone().add(new THREE.Vector3(0,1,0)));camera.updateMatrixWorld(true)});await shot('final-brake');await page.keyboard.up('w');
  await page.evaluate(()=>{clearInput();resetMechanicInput();backspoolCombat.reset('CAPTURE');backspoolFlow.reset('RESPAWN');backspoolAdvanced.reset('RESPAWN');backspoolTraversal.reset('RESPAWN');threadrailGame.lifecycle('RESPAWN');threadrailGame.drawCourse();s.pos.set(-29,5.2,65);s.vel.set(12,0,0);s.onGround=false;setMode(P.AIR);cam.yaw=cam.targetYaw=s.yaw=-Math.PI/2;});
  await page.keyboard.press('r');await run(24);assert(await page.evaluate(()=>!!threadrailGame.state().rail.current));await shot('final-rail');
  await page.evaluate(()=>{clearInput();resetMechanicInput();backspoolCombat.reset('CAPTURE');backspoolFlow.reset('RESPAWN');backspoolAdvanced.reset('RESPAWN');s.pos.set(0,.42,25);s.vel.set(0,0,0);s.onGround=true;setMode(P.GROUND);cam.yaw=cam.targetYaw=s.yaw=0;threadrailGame.lifecycle('RESPAWN');setInputMode('TOUCH');document.body.classList.add('touchPlay');});
  for(const [width,height,name]of[[430,932,'final-portrait'],[932,430,'final-landscape']]){
   await page.setViewportSize({width,height});await page.waitForTimeout(150);await run(100);await shot(name);
  }
  assert.equal(errors.length,0);fs.writeFileSync('output/threadrail/captures.json',JSON.stringify({shots,errors},null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e.stack);process.exitCode=1});
