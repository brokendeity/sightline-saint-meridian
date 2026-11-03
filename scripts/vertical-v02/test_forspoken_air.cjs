/* v19 running take-off: keyboard jumps on the open plaza pick the take-off by ground speed and keep it while steering in the air. */
const {chromium}=require('/opt/homebrew/lib/node_modules/playwright'),assert=require('assert/strict'),fs=require('fs');
(async()=>{const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal']});try{
 const build=JSON.parse(fs.readFileSync('development/vertical-city-v02/'+(process.env.V02_ACTION_BUILD||'V02_Forspoken_Air_Build.json')));
 const out=process.env.V02_AIR_OUT||'development/vertical-city-v02/evidence/forspoken-air';fs.mkdirSync(out,{recursive:true});
 const page=await browser.newPage({viewport:{width:960,height:600}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>navigator.getGamepads=()=>[]);
 await page.goto('http://127.0.0.1:8766/'+build.entry+'?capture=backspool');
 await page.waitForFunction(()=>typeof gameReady!=='undefined'&&gameReady&&window.characterState&&!characterState().busy&&roadNetworkState().ready&&characterState().active==='backspool'&&window.backspoolForspokenV19Roles,null,{timeout:150000});
 await page.evaluate(()=>{window.requestAnimationFrame=()=>0;resetPlayer();clearInput();clearPad();startGame(false);});
 // Test setup: place the actor on the open plaza and let the placement landing finish.
 const home=()=>page.evaluate(()=>{clearInput();backspoolFlow.reset('AIR TEST');const y=supportHeight(30,50,5);s.pos.set(30,y,50);s.vel.set(0,0,0);s.yaw=cam.yaw=cam.targetYaw=0;s.onGround=true;setMode(P.GROUND);for(let i=0;i<90;i++)tickFrame(1/60,true);});
 const frames=n=>page.evaluate(n=>{const rows=[];for(let i=0;i<n;i++){tickFrame(1/60,true);rows.push({role:backspoolFlowState().sourcePlayback?.role||null,ground:s.onGround,vy:s.vel.y,speed:Math.hypot(s.vel.x,s.vel.z)});}return rows},n);
 const rising=rows=>[...new Set(rows.filter(r=>!r.ground&&r.vy>1).map(r=>r.role))];
 const results={};
 await home();await page.keyboard.press('Space');results.stand=await frames(70);
 assert.deepEqual(rising(results.stand),['jump'],'Standing jump keeps the in-place take-off');
 await home();await page.keyboard.down('w');await frames(40);await page.keyboard.press('Space');results.run=await frames(12);await page.screenshot({path:out+'/running-takeoff.png'});
 // Steer hard while rising: the take-off must not swap back.
 await page.keyboard.up('w');await page.keyboard.down('s');results.run.push(...await frames(60));await page.keyboard.up('s');
 assert.deepEqual(rising(results.run),['jumpMove'],'Running jump uses the moving take-off throughout the rise');
 assert(results.run.some(r=>!r.ground&&r.vy<=1&&r.role==='fall'),'Running jump still falls with the fall clip');
 await frames(60);await home();await page.keyboard.press('Space');results.standAgain=await frames(70);
 assert.deepEqual(rising(results.standAgain),['jump'],'A new standing jump relatches the in-place take-off');
 assert.deepEqual(errors,[]);
 fs.writeFileSync(out+'/browser-results.json',JSON.stringify({entry:build.entry,entrySHA256:build.entrySHA256,testSHA256:require('crypto').createHash('sha256').update(fs.readFileSync(__filename)).digest('hex'),scope:'Open plaza, keyboard input, Backspool. Take-off role selection only; no visual certification.',results,errors},null,1));
 console.log('PASS standing and running take-offs; no page errors');
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
