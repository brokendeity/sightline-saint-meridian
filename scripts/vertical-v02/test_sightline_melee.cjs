/* Sightline melee: RT throws a four-hit street burst that stops at four and restarts after a reset, stick + RT kicks, LB holds a guard that blocks strikes,
   and LT+RT stays on the rail path (no strike while aiming). Labelled setup: open plaza placement, the public practice button, practice shots held.
   Inputs after setup are a virtual pad through the game's own poll and keyboard W to walk into range. */
const {chromium}=require('/opt/homebrew/lib/node_modules/playwright'),assert=require('assert/strict'),fs=require('fs');
(async()=>{const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal']});try{
 const build=JSON.parse(fs.readFileSync('development/vertical-city-v02/'+(process.env.V02_ACTION_BUILD||'V02_Sightline_Melee_Build.json')));
 const out=process.env.V02_SIGHTLINE_OUT||'development/vertical-city-v02/evidence/sightline-melee';fs.mkdirSync(out,{recursive:true});
 const p=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{const up={pressed:false,value:0};window.testPad={id:'test pad',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>up)};navigator.getGamepads=()=>[window.testPad];});
 await p.goto('http://127.0.0.1:8766/'+build.entry);
 await p.waitForFunction(()=>typeof gameReady!=='undefined'&&gameReady&&window.characterState&&!characterState().busy&&roadNetworkState().ready,null,{timeout:150000});
 await p.waitForFunction(()=>verticalWorldLifeState().ready&&v02EastPublicLightingState().ready&&v02RimShadowState().ready,null,{timeout:120000});
 await p.locator('#v02Start').click();await p.evaluate(()=>{window.requestAnimationFrame=()=>0});
 assert.equal(await p.evaluate(()=>characterState().active),'sightline');assert(await p.evaluate(()=>!!window.sightlineActionManifest),'Street moves loaded');
 const step=n=>p.evaluate(n=>{for(let i=0;i<n;i++)tickFrame(1/60,false)},n);
 const press=(b,v=1)=>p.evaluate(([b,v])=>testPad.buttons=testPad.buttons.map((x,i)=>i===b?{pressed:v>0,value:v}:x),[b,v]);
 const tap=async b=>{await press(b);await step(2);await press(b,0);};
 const sample=()=>p.evaluate(()=>{tickFrame(1/60,false);const x=backspoolCombat.state();return{anim:currentAnim,move:x.action?.moveId??null,hits:x.hits,phase:x.phase,mode:s.mode,guardSince:x.guardSince};});
 const home=async()=>{await p.evaluate(()=>{resetPlayer();clearInput();clearPad();startGame(false);s.pos.set(0,.42,12);s.vel.set(0,0,0);s.onGround=true;setMode(P.GROUND);s.yaw=cam.yaw=cam.targetYaw=0;for(let i=0;i<120;i++)tickFrame(1/60,false)});
  if(!await p.locator('#combatPractice').isVisible()){await p.click('#v02Tools');await p.click('#v02Tab-practice');}
  await p.click('#combatPractice');await step(2);if(!await p.evaluate(()=>gameActive)){await p.click('#start');await step(2);}
  // Test setup: hold the practice targets' shots; shots and stagger are covered by the encounter suites.
  await p.evaluate(()=>backspoolCombat.practice.forEach(t=>t.shot=999));
  await p.keyboard.down('w');for(let i=0;i<400;i++){const d=await p.evaluate(()=>{tickFrame(1/60,false);const t=backspoolCombat.practice[1];return Math.hypot(t.group.position.x-s.pos.x,t.group.position.z-s.pos.z)});if(d<1.3)break;}await p.keyboard.up('w');await step(4);};
 const results={};
 await home();const before=await p.evaluate(()=>backspoolCombat.state().hits);results.burst=[];
 for(let k=0;k<5;k++){await tap(7);for(let f=0;f<45;f++){const r=await sample();results.burst.push(r);if(r.hits>=before+Math.min(k,3)+1&&k<4){if(k<4){await p.evaluate(()=>renderNight(0));await p.screenshot({path:`${out}/street-light-${k+1}.png`});}break;}}}
 for(let f=0;f<40;f++)results.burst.push(await sample());
 const moves=[...new Set(results.burst.map(r=>r.move).filter(Boolean))];
 assert.deepEqual(moves,['street-light-1','street-light-2','street-light-3','street-light-4'],'RT burst is jab, hook, body hook, uppercut, and a press during the uppercut does not extend it');
 // After the reset a fresh press starts a new burst.
 await tap(7);results.restart=[];for(let f=0;f<20;f++)results.restart.push(await sample());
 assert(results.restart.some(r=>r.move==='street-light-1'),'A press after the reset starts a new burst');await step(40);
 assert(results.burst.every(r=>!r.anim.startsWith('action-v2-mx-')),'No Backspool clip plays on Sightline');
 assert(results.burst.at(-1).hits-before>=4,'All four burst strikes connect');
 // Stick + RT kicks.
 await step(40);await p.evaluate(()=>testPad.axes=[-1,0,0,0]);await tap(7);results.kick=[];for(let f=0;f<40;f++)results.kick.push(await sample());await p.evaluate(()=>testPad.axes=[0,0,0,0]);
 assert(results.kick.some(r=>r.move==='street-left'),'Stick left + RT throws the kick');await step(40);
 // LB holds the guard; RT does nothing while guarding.
 await press(4);await step(10);const guarded=await sample();await tap(7);results.guard=[];for(let f=0;f<20;f++)results.guard.push(await sample());await press(4,0);
 assert(results.guard.every(r=>!r.move),'No strike while LB guards');assert(guarded.guardSince>0,'LB raised the guard');await step(30);
 // LT aims; RT stays on the rail path.
 await press(6);await step(20);const aiming=await sample();await tap(7);results.aim=[];for(let f=0;f<30;f++)results.aim.push(await sample());await press(6,0);
 assert.equal(aiming.mode,'AIM','LT puts Sightline in rail aim');assert(results.aim.every(r=>!r.move),'No strike while aiming: RT belongs to the rail');
 assert.deepEqual(errors,[]);
 fs.writeFileSync(out+'/browser-results.json',JSON.stringify({entry:build.entry,entrySHA256:build.entrySHA256,testSHA256:require('crypto').createHash('sha256').update(fs.readFileSync(__filename)).digest('hex'),scope:'Open plaza practice targets; Sightline; virtual pad RT/LB/LT/stick and keyboard W. Move selection, contact, guard and aim separation; no visual certification.',results,errors},null,1));
 console.log('PASS Sightline burst, kick, guard and rail separation; no page errors');
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
