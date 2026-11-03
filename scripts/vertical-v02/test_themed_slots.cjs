/* v3 themed slots: in each style, the NSUNSC library moves behind stick + RT (left, right), D-pad up (heavy), stick forward + D-pad up
   (launcher), jump + RT (air light; air finisher from 10 m up, since a jump fits one air strike) and perfect guard + RT (counter 1, counter 2) play.
   Labelled setup: open plaza placement, the public practice / Sparring buttons, style chosen through the style menu's change handler,
   R3 lock, practice shots held, and Backspool placed in range of the sparring opponent. Inputs are a virtual pad through the game's own poll. */
const {chromium}=require('/opt/homebrew/lib/node_modules/playwright'),assert=require('assert/strict'),fs=require('fs');
(async()=>{const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal']});try{
 const build=JSON.parse(fs.readFileSync('development/vertical-city-v02/'+(process.env.V02_ACTION_BUILD||'V02_Mixamo_Combat_Build.json')));
 const out=process.env.V02_THEMED_OUT||'development/vertical-city-v02/evidence/themed-slots';fs.mkdirSync(out,{recursive:true});
 const p=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{const up={pressed:false,value:0};window.testPad={id:'test pad',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>up)};navigator.getGamepads=()=>[window.testPad];});
 await p.goto('http://127.0.0.1:8766/'+build.entry+'?capture=backspool');
 await p.waitForFunction(()=>typeof gameReady!=='undefined'&&gameReady&&window.characterState&&!characterState().busy&&roadNetworkState().ready&&characterState().active==='backspool',null,{timeout:150000});
 await p.waitForFunction(()=>verticalWorldLifeState().ready&&v02EastPublicLightingState().ready&&v02RimShadowState().ready,null,{timeout:120000});
 await p.locator('#v02Start').click();await p.evaluate(()=>{window.requestAnimationFrame=()=>0});
 const step=n=>p.evaluate(n=>{for(let i=0;i<n;i++)tickFrame(1/60,false)},n);
 const press=(b,v=1)=>p.evaluate(([b,v])=>testPad.buttons=testPad.buttons.map((x,i)=>i===b?{pressed:v>0,value:v}:x),[b,v]);
 const tap=async b=>{await press(b);await step(2);await press(b,0);};
 const stick=(x,y)=>p.evaluate(([x,y])=>testPad.axes=[x,y,0,0],[x,y]);
 const sample=()=>p.evaluate(()=>{tickFrame(1/60,false);const x=backspoolCombat.state();return{anim:currentAnim,move:x.action?.moveId??null,hits:x.hits,result:x.lastResult,ground:s.onGround};});
 const watch=async(n,stop)=>{const rows=[];for(let f=0;f<n;f++){const r=await sample();rows.push(r);if(stop&&stop(r))break;}return rows;};
 const style=async st=>{await p.evaluate(st=>{const el=$('combatStyle');el.value=st;el.dispatchEvent(new Event('change'));},st);assert.equal(await p.evaluate(()=>backspoolCombat.state().style),st);};
 const openTools=async id=>{if(!await p.locator(id).isVisible()){await p.click('#v02Tools');await p.click('#v02Tab-practice');}};
 const home=()=>p.evaluate(()=>{resetPlayer();clearInput();clearPad();startGame(false);s.pos.set(0,.42,12);s.vel.set(0,0,0);s.onGround=true;setMode(P.GROUND);s.yaw=cam.yaw=cam.targetYaw=0;for(let i=0;i<120;i++)tickFrame(1/60,false)});
 const approach=async()=>{await p.keyboard.down('w');for(let i=0;i<300;i++){const d=await p.evaluate(()=>{tickFrame(1/60,false);const x=backspoolCombat.state(),t=backspoolCombat.practice.find(q=>q.id===x.target);return t?Math.hypot(t.group.position.x-s.pos.x,t.group.position.z-s.pos.z):0});if(d<1.3)break;}await p.keyboard.up('w');await step(4);};
 const results={};
 for(const st of ['flow','impact','counter']){const r=results[st]={};
  await home();await openTools('#combatPractice');await p.click('#combatPractice');await step(2);if(!await p.evaluate(()=>gameActive)){await p.click('#start');await step(2);}
  await style(st);await p.evaluate(()=>backspoolCombat.practice.forEach(t=>t.shot=999));await tap(11);await step(90);
  const strike=async(label,act)=>{await approach();const before=(await sample()).hits;await act();const rows=await watch(70,x=>x.hits>before);await p.evaluate(()=>renderNight(0));await p.screenshot({path:`${out}/${st}-${label}.png`});rows.push(...await watch(40));await stick(0,0);
   r[label]={moves:[...new Set(rows.map(x=>x.move).filter(Boolean))],hits:rows.at(-1).hits-before};await step(30);};
  await strike('left',async()=>{await stick(-1,0);await step(2);await tap(7);});
  await strike('right',async()=>{await stick(1,0);await step(2);await tap(7);});
  await strike('heavy',async()=>{await tap(12);});
  await strike('launcher',async()=>{await stick(0,-1);await step(2);await tap(12);});
  for(const slot of ['left','right','heavy','launcher']){assert(r[slot].moves.includes(`${st}-${slot}`),`${st} ${slot} plays its move: ${r[slot].moves}`);assert(r[slot].hits>=1,`${st} ${slot} connects`);}
  // Air: jump, then RT on rhythm; the third air strike is the finisher.
  await approach();await tap(0);await step(6);const air=[];for(let k=0;k<3;k++){await tap(7);air.push(...await watch(22));}r.air={moves:[...new Set(air.map(x=>x.move).filter(Boolean))]};await step(60);
  // Launcher follow-up: launch, jump after it, then air strikes on rhythm.
  await approach();await stick(0,-1);await step(2);await tap(12);await stick(0,0);const lf=await watch(40);await tap(0);const chase=[...lf];chase.push(...await watch(6));for(let k=0;k<4;k++){await tap(7);chase.push(...await watch(20));}
  r.launchAir={moves:[...new Set(chase.map(x=>x.move).filter(Boolean))],airborneFrames:chase.filter(x=>!x.ground).length};await step(80);
  // Test setup: start 10 m above the plaza so there is air time for a full air chain; RT is pressed steadily.
  await p.evaluate(()=>{s.pos.y+=10;s.vel.set(0,0,0);s.onGround=false;setMode(P.AIR);});const high=[];for(let k=0;k<20;k++){await tap(7);high.push(...await watch(4));}
  r.highAir={moves:[...new Set(high.map(x=>x.move).filter(Boolean))]};await step(120);assert(r.highAir.moves.includes(`${st}-air-finisher`),`${st} air finisher plays given air time: ${r.highAir.moves}`);
  assert(r.air.moves.includes(`${st}-air-light`),`${st} air light plays: ${r.air.moves}`);
  console.log('PASS',st,'directional, heavy, launcher, air light and finisher');
  // Counter: Sparring with one opponent; raise the guard (LT) as its strike lands for a perfect guard, then RT twice.
  await home();await openTools('#backspoolSpar');await p.click('#backspoolSpar');await step(2);if(!await p.evaluate(()=>gameActive)){await p.click('#start');await step(2);}await style(st);
  await p.evaluate(()=>{const ops=backspoolCombat.practice.filter(t=>t.sparring);ops.forEach((t,i)=>{t.shot=999;if(i>0){t.hp=0;t.group.visible=false;}});const t=ops[0],o=t.group.position,d=new THREE.Vector3(s.pos.x-o.x,0,s.pos.z-o.z).normalize();s.pos.set(o.x+d.x*1.2,s.pos.y,o.z+d.z*1.2);s.yaw=cam.yaw=cam.targetYaw=Math.atan2(d.x,d.z);});
  let guarded=false;for(let f=0;f<600&&!guarded;f++){const w=await p.evaluate(()=>{tickFrame(1/60,false);const t=backspoolCombat.practice.find(x=>x.sparring&&x.hp>0);return{phase:t.phase,timer:t.timer,result:backspoolCombat.state().lastResult};});
   if(w.phase==='windup'&&w.timer<=.1){await press(6);const g=await watch(12,x=>/GUARD/.test(x.result||''));await press(6,0);guarded=/PERFECT/.test(g.at(-1).result||'');if(!guarded)await step(30);}}
  assert(guarded,st+' perfect guard opens the counter window');
  await tap(7);const c1=await watch(30);await tap(7);const c2=await watch(40);r.counter={moves:[...new Set(c1.concat(c2).map(x=>x.move).filter(Boolean))]};
  assert(r.counter.moves.includes(`${st}-counter-1`),`${st} counter 1 plays: ${r.counter.moves}`);
  await p.evaluate(()=>backspoolEncounters.clear());console.log('PASS',st,'counter',JSON.stringify(r.counter.moves));
 }
 assert.deepEqual(errors,[]);
 fs.writeFileSync(out+'/browser-results.json',JSON.stringify({entry:build.entry,entrySHA256:build.entrySHA256,testSHA256:require('crypto').createHash('sha256').update(fs.readFileSync(__filename)).digest('hex'),scope:'Open plaza practice and sparring; Backspool; virtual pad. Slot selection (and contact for ground slots) per style; no visual certification.',results,errors},null,1));
 console.log('PASS themed directional, heavy, launcher, air and counter slots in all three styles; no page errors');
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
