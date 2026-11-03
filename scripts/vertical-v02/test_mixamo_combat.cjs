/* v3 RT combat: in each style, the 8-hit RT chain (Mixamo hits 1-4, NSUNSC library hits 5-8) and the D-pad up heavy play their v3 segments and connect with a practice target.
   Labelled setup: open plaza placement, the public practice button, style chosen through the style menu's change handler, R3 lock.
   Inputs after setup are a virtual pad (RT, R3, D-pad up) through the game's own poll and keyboard W to walk into range. */
const {chromium}=require('/opt/homebrew/lib/node_modules/playwright'),assert=require('assert/strict'),fs=require('fs');
(async()=>{const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal']});try{
 const build=JSON.parse(fs.readFileSync('development/vertical-city-v02/'+(process.env.V02_ACTION_BUILD||'V02_Mixamo_Combat_Build.json')));
 const out=process.env.V02_COMBAT_OUT||'development/vertical-city-v02/evidence/mixamo-combat';fs.mkdirSync(out,{recursive:true});
 const p=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{const up={pressed:false,value:0};window.testPad={id:'test pad',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>up)};navigator.getGamepads=()=>[window.testPad];});
 await p.goto('http://127.0.0.1:8766/'+build.entry+'?capture=backspool');
 await p.waitForFunction(()=>typeof gameReady!=='undefined'&&gameReady&&window.characterState&&!characterState().busy&&roadNetworkState().ready,null,{timeout:150000});
 await p.waitForFunction(()=>verticalWorldLifeState().ready&&v02EastPublicLightingState().ready&&v02RimShadowState().ready,null,{timeout:120000});
 await p.locator('#v02Start').click();await p.evaluate(()=>{window.requestAnimationFrame=()=>0});
 const step=n=>p.evaluate(n=>{for(let i=0;i<n;i++)tickFrame(1/60,false)},n);
 const tap=async button=>{await p.evaluate(b=>testPad.buttons=testPad.buttons.map((x,i)=>i===b?{pressed:true,value:1}:x),button);await step(2);await p.evaluate(()=>testPad.buttons=testPad.buttons.map(()=>({pressed:false,value:0})));};
 const sample=()=>p.evaluate(()=>{tickFrame(1/60,false);const x=backspoolCombat.state();return{anim:currentAnim,move:x.action?.id??null,hits:x.hits,phase:x.phase};});
 const results={},shots=[];
 for(const style of ['flow','impact','counter']){
  await p.evaluate(()=>{resetPlayer();clearInput();clearPad();startGame(false);s.pos.set(0,.42,12);s.vel.set(0,0,0);s.onGround=true;setMode(P.GROUND);s.yaw=cam.yaw=cam.targetYaw=0;cam.pitch=cam.targetPitch=-.08;for(let i=0;i<120;i++)tickFrame(1/60,false)});
  if(!await p.locator('#combatPractice').isVisible()){await p.click('#v02Tools');await p.click('#v02Tab-practice');}
  await p.click('#combatPractice');await step(2);if(!await p.evaluate(()=>gameActive)){await p.click('#start');await step(2);}
  await p.evaluate(style=>{const el=$('combatStyle');el.value=style;el.dispatchEvent(new Event('change'));},style);assert.equal(await p.evaluate(()=>backspoolCombat.state().style),style);
  // Test setup: hold the practice targets' shots so an 8-hit chain is not staggered; shots and stagger are covered by the encounter suites.
  await p.evaluate(()=>backspoolCombat.practice.forEach(t=>t.shot=999));
  await tap(11);await step(90);assert(await p.evaluate(()=>!!backspoolCombat.state().target),style+' locks a practice target');
  const approach=async()=>{await p.keyboard.down('w');for(let i=0;i<300;i++){const d=await p.evaluate(()=>{tickFrame(1/60,false);const x=backspoolCombat.state(),t=backspoolCombat.practice.find(q=>q.id===x.target);return Math.hypot(t.group.position.x-s.pos.x,t.group.position.z-s.pos.z)});if(d<1.3)break;}await p.keyboard.up('w');await step(4);};
  await approach();
  const rows=[];const before=await p.evaluate(()=>backspoolCombat.state().hits);
  // Press on rhythm: the next RT goes in once the current strike has landed, as a player would.
  for(let k=0;k<8;k++){await tap(7);const target=before+k+1;for(let f=0;f<45;f++){const r=await sample();rows.push(r);if(r.hits>=target){await p.evaluate(()=>renderNight(0));await p.screenshot({path:`${out}/${style}-light-${k+1}.png`});shots.push(`${style}-light-${k+1}`);break;}}}
  rows.push(...await Promise.all([]));for(let f=0;f<30;f++)rows.push(await sample());
  const lightClips=[...new Set(rows.map(r=>r.anim).filter(a=>/light/.test(a)))];
  assert.deepEqual(lightClips,[1,2,3,4,5,6,7,8].map(n=>`action-v2-mx-${style}-light-${n}`),style+' RT chain plays all eight v3 light segments in order');
  assert.equal(rows.at(-1).hits-before,8,style+' every light strike connects');
  // The hit-8 finisher pushes the target back, so walk into range again before the heavy.
  await approach();const heavyBefore=await p.evaluate(()=>backspoolCombat.state().hits);await tap(12);const heavy=[];for(let f=0;f<60;f++){const r=await sample();heavy.push(r);if(r.hits>(heavy.at(-2)?.hits??heavyBefore)){await p.evaluate(()=>renderNight(0));await p.screenshot({path:`${out}/${style}-heavy.png`});shots.push(style+'-heavy');}}
  assert(heavy.some(r=>r.anim===`action-v2-mx-${style}-heavy`),style+' heavy plays its Mixamo segment');assert(heavy.at(-1).hits>heavyBefore,style+' heavy connects');
  assert(rows.concat(heavy).every(r=>!/^action-v2-(flow|impact|counter)-(light|heavy)/.test(r.anim)),style+' no STORM-derived strike segment plays');
  results[style]={light:rows,heavy};console.log('PASS',style,'RT chain and heavy');
 }
 assert.deepEqual(errors,[]);
 fs.writeFileSync(out+'/browser-results.json',JSON.stringify({entry:build.entry,entrySHA256:build.entrySHA256,testSHA256:require('crypto').createHash('sha256').update(fs.readFileSync(__filename)).digest('hex'),scope:'Open plaza practice targets; virtual pad RT/R3/D-pad up and keyboard W. Eight-hit RT chains. Move selection and contact only; impact screenshots for visual review, no visual certification.',shots,results,errors},null,1));
 console.log('PASS 8-hit RT chains and heavies in all three styles; no page errors');
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
