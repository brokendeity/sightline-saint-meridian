/* v17 ground strides: keyboard starts, stops and 180-degree turns on the open plaza select the authored roles. */
const {chromium}=require('/opt/homebrew/lib/node_modules/playwright'),assert=require('assert/strict'),fs=require('fs');
(async()=>{const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal']});try{
 const build=JSON.parse(fs.readFileSync('development/vertical-city-v02/'+(process.env.V02_ACTION_BUILD||'V02_Forspoken_Strides_Build.json')));
 const out=process.env.V02_STRIDES_OUT||'development/vertical-city-v02/evidence/forspoken-strides';fs.mkdirSync(out,{recursive:true});
 const page=await browser.newPage({viewport:{width:960,height:600}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>navigator.getGamepads=()=>[]);
 await page.goto('http://127.0.0.1:8766/'+build.entry+'?capture=backspool');
 await page.waitForFunction(()=>typeof gameReady!=='undefined'&&gameReady&&window.characterState&&!characterState().busy&&roadNetworkState().ready&&characterState().active==='backspool'&&window.backspoolForspokenV17Roles,null,{timeout:150000});
 await page.evaluate(()=>{window.requestAnimationFrame=()=>0;resetPlayer();clearInput();clearPad();startGame(false);});
 // Settle long enough for the soft landing after placement to finish.
 const home=(yaw=0)=>page.evaluate(yaw=>{clearInput();backspoolFlow.reset('STRIDE TEST');const y=supportHeight(0,0,5);s.pos.set(0,y+.42,0);s.vel.set(0,0,0);s.yaw=cam.yaw=cam.targetYaw=0;s.onGround=true;setMode(P.GROUND);for(let i=0;i<80;i++)tickFrame(1/60,true);s.yaw=yaw;for(let i=0;i<5;i++)tickFrame(1/60,true);},yaw);
 const frames=n=>page.evaluate(n=>{const rows=[];for(let i=0;i<n;i++){tickFrame(1/60,true);rows.push({stride:backspoolFlow.stride()?.role||null,anim:currentAnim,yaw:s.yaw,speed:Math.hypot(s.vel.x,s.vel.z)});}return rows},n);
 const first=rows=>rows.find(r=>r.stride)?.stride||null,results={};
 const shot=async name=>page.screenshot({path:out+'/'+name+'.png'});
 await home();await page.keyboard.down('w');results.start=await frames(12);await shot('start');results.start.push(...await frames(28));assert.equal(first(results.start),'moveStart','Run start');assert(results.start.slice(-5).every(r=>!r.stride),'Start hands back to the run loop');
 await page.keyboard.up('w');results.stop=await frames(20);await shot('stop');results.stop.push(...await frames(50));assert.equal(first(results.stop),'moveStop','Run stop');assert(results.stop.slice(-5).every(r=>!r.stride),'Stop hands back to idle');
 await home();await page.keyboard.down('w');await frames(40);await page.keyboard.up('w');await page.keyboard.down('s');results.turn=await frames(15);await shot('turn');results.turn.push(...await frames(35));await page.keyboard.up('s');assert.equal(first(results.turn),'moveTurn','Running reversal');assert(Math.abs(Math.cos(results.turn[0].yaw))>.99&&Math.cos(results.turn[0].yaw)<0,'Turn snaps facing to the new heading');
 await frames(70);await home(Math.PI);await page.keyboard.down('w');results.startTurn=await frames(15);await shot('start-turn');results.startTurn.push(...await frames(25));await page.keyboard.up('w');assert.equal(first(results.startTurn),'moveStartTurn','Start away from facing');
 await frames(70);await home();await page.keyboard.down('Shift');await page.keyboard.down('w');results.sprintStart=await frames(40);await page.keyboard.up('w');await page.keyboard.up('Shift');results.sprintStop=await frames(70);assert.equal(first(results.sprintStart),'moveStartFast','Sprint start');assert.equal(first(results.sprintStop),'moveStopFast','Sprint stop');
 // A stop gives way at once when input returns.
 await home();await page.keyboard.down('w');await frames(40);await page.keyboard.up('w');await frames(10);await page.keyboard.down('w');results.resume=await frames(20);await page.keyboard.up('w');assert(results.resume.slice(-10).every(r=>r.stride!=='moveStop'),'Stop cancels when moving again');
 assert.deepEqual(errors,[]);
 fs.writeFileSync(out+'/browser-results.json',JSON.stringify({entry:build.entry,entrySHA256:build.entrySHA256,testSHA256:require('crypto').createHash('sha256').update(fs.readFileSync(__filename)).digest('hex'),scope:'Open plaza, keyboard input, Backspool. Role selection and hand-back only; no visual certification.',results,errors},null,1));
 console.log('PASS ground starts, stops, turns and stop cancel; no page errors');
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
