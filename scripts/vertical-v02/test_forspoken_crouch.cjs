/* v20 crouch transitions: in the Classic controls preset the controller View button toggles crouch (in Traversal controls View is the
   powers modifier and keyboard Ctrl is sprint, so crouch is not bound there) and keyboard W moves.
   Down, start, stop and up play on the open plaza, then hand back to the crouch loops. The pad is virtual; its buttons go through the game's own poll. */
const {chromium}=require('/opt/homebrew/lib/node_modules/playwright'),assert=require('assert/strict'),fs=require('fs');
(async()=>{const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal']});try{
 const build=JSON.parse(fs.readFileSync('development/vertical-city-v02/'+(process.env.V02_ACTION_BUILD||'V02_Forspoken_Crouch_Build.json')));
 const out=process.env.V02_CROUCH_OUT||'development/vertical-city-v02/evidence/forspoken-crouch';fs.mkdirSync(out,{recursive:true});
 const page=await browser.newPage({viewport:{width:960,height:600}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>{const up={pressed:false,value:0};window.__testPad={id:'test pad',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>up)};navigator.getGamepads=()=>[window.__testPad];});
 await page.goto('http://127.0.0.1:8766/'+build.entry+'?capture=backspool');
 await page.waitForFunction(()=>typeof gameReady!=='undefined'&&gameReady&&window.characterState&&!characterState().busy&&roadNetworkState().ready&&characterState().active==='backspool'&&window.backspoolForspokenV20Roles,null,{timeout:150000});
 // Test setup: choose Classic controls through the preset menu's own change handler (the menu sits in a collapsed panel).
 await page.evaluate(()=>{const el=$('traversalPreset');el.value='classic';el.dispatchEvent(new Event('change'));});assert.equal(await page.evaluate(()=>threadrailGame.preset()),'classic');
 // Test setup: place the actor on the open plaza and let the placement landing finish.
 await page.evaluate(()=>{window.requestAnimationFrame=()=>0;resetPlayer();clearInput();clearPad();startGame(false);const y=supportHeight(30,50,5);s.pos.set(30,y,50);s.vel.set(0,0,0);s.yaw=cam.yaw=cam.targetYaw=0;s.onGround=true;setMode(P.GROUND);for(let i=0;i<90;i++)tickFrame(1/60,true);});
 const view=async()=>{await page.evaluate(()=>{__testPad.buttons=__testPad.buttons.map((b,i)=>i===8?{pressed:true,value:1}:b);tickFrame(1/60,true);__testPad.buttons=__testPad.buttons.map(()=>({pressed:false,value:0}));});};
 const frames=n=>page.evaluate(n=>{const rows=[];for(let i=0;i<n;i++){tickFrame(1/60,true);rows.push({shift:backspoolPosture.shift()?.role||null,crouched:backspoolPosture.active(),anim:currentAnim,speed:Math.hypot(s.vel.x,s.vel.z)});}return rows},n);
 const first=rows=>rows.find(r=>r.shift)?.shift||null,ends=(rows,re)=>re.test(rows.at(-1).anim)&&!rows.at(-1).shift,results={};
 await view();results.down=await frames(20);await page.screenshot({path:out+'/crouch-down.png'});results.down.push(...await frames(50));
 assert.equal(first(results.down),'crouchDown','Crouching plays the stand-to-crouch shift');assert(results.down.at(-1).crouched&&ends(results.down,/crouch|cuh/i),'Crouch down hands back to the crouch idle');
 await page.keyboard.down('w');results.start=await frames(60);assert.equal(first(results.start),'crouchStart','Crouch walk starts with the start clip');assert(ends(results.start,/crouch|cuh/i),'Crouch start hands back to the crouch walk');
 await page.keyboard.up('w');results.stop=await frames(20);await page.screenshot({path:out+'/crouch-stop.png'});results.stop.push(...await frames(60));assert.equal(first(results.stop),'crouchStop','Crouch walk stops with the stop clip');assert(ends(results.stop,/crouch|cuh/i),'Crouch stop hands back to the crouch idle');
 await view();results.up=await frames(30);await page.screenshot({path:out+'/stand-up.png'});results.up.push(...await frames(40));assert.equal(first(results.up),'crouchUp','Standing plays the reversed shift');assert(!results.up.at(-1).crouched&&!results.up.at(-1).shift,'Stand up hands back to standing');
 // Moving off while standing up cancels the shift after .15s.
 await view();await frames(70);await view();await frames(12);await page.keyboard.down('w');results.cancel=await frames(20);await page.keyboard.up('w');
 assert(results.cancel.slice(-8).every(r=>r.shift!=='crouchUp'),'Standing up gives way to running');
 assert.deepEqual(errors,[]);
 fs.writeFileSync(out+'/browser-results.json',JSON.stringify({entry:build.entry,entrySHA256:build.entrySHA256,testSHA256:require('crypto').createHash('sha256').update(fs.readFileSync(__filename)).digest('hex'),scope:'Open plaza, Classic controls preset, virtual-pad View toggle and keyboard W, Backspool. Transition selection and hand-back only; no visual certification.',results,errors},null,1));
 console.log('PASS crouch down, start, stop, up and cancel; no page errors');
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
