/* Burst rhythm: Sightline lands a four-hit RT burst on a sparring opponent and stops; the opponent covers, throws a fast counter
   and steps back to reset. A second burst with LB held through the counter is guarded for chip damage only.
   Labelled setup: open plaza placement, the public Sparring button, the other two opponents taken out so one exchange is observed,
   and Sightline placed 1.2 m in front of the opponent. Inputs after setup are a virtual pad (RT, LB) through the game's own poll. */
const {chromium}=require('/opt/homebrew/lib/node_modules/playwright'),assert=require('assert/strict'),fs=require('fs');
(async()=>{const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal']});try{
 const build=JSON.parse(fs.readFileSync('development/vertical-city-v02/'+(process.env.V02_ACTION_BUILD||'V02_Sightline_Melee_Build.json')));
 const out=process.env.V02_RHYTHM_OUT||'development/vertical-city-v02/evidence/burst-rhythm';fs.mkdirSync(out,{recursive:true});
 const p=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{const up={pressed:false,value:0};window.testPad={id:'test pad',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>up)};navigator.getGamepads=()=>[window.testPad];});
 await p.goto('http://127.0.0.1:8766/'+build.entry);
 await p.waitForFunction(()=>typeof gameReady!=='undefined'&&gameReady&&window.characterState&&!characterState().busy&&roadNetworkState().ready,null,{timeout:150000});
 await p.waitForFunction(()=>verticalWorldLifeState().ready&&v02EastPublicLightingState().ready&&v02RimShadowState().ready,null,{timeout:120000});
 await p.locator('#v02Start').click();await p.evaluate(()=>{window.requestAnimationFrame=()=>0});
 const step=n=>p.evaluate(n=>{for(let i=0;i<n;i++)tickFrame(1/60,false)},n);
 const press=(b,v=1)=>p.evaluate(([b,v])=>testPad.buttons=testPad.buttons.map((x,i)=>i===b?{pressed:v>0,value:v}:x),[b,v]);
 const tap=async b=>{await press(b);await step(2);await press(b,0);};
 const foe=()=>p.evaluate(()=>{tickFrame(1/60,false);const t=backspoolCombat.practice.find(x=>x.sparring&&x.hp>0),x=backspoolCombat.state();return{phase:t?.phase,hp:t?.hp,burst:t?.burstHits||0,dist:t?+Math.hypot(t.group.position.x-s.pos.x,t.group.position.z-s.pos.z).toFixed(2):null,hits:x.hits,result:x.lastResult,trauma:courier.trauma,move:x.action?.moveId??null};});
 await p.evaluate(()=>{resetPlayer();clearInput();clearPad();startGame(false);s.pos.set(0,.42,12);s.vel.set(0,0,0);s.onGround=true;setMode(P.GROUND);s.yaw=cam.yaw=cam.targetYaw=0;for(let i=0;i<120;i++)tickFrame(1/60,false)});
 if(!await p.locator('#backspoolSpar').isVisible()){await p.click('#v02Tools');await p.click('#v02Tab-practice');}
 await p.click('#backspoolSpar');await step(2);if(!await p.evaluate(()=>gameActive)){await p.click('#start');await step(2);}
 assert(await p.evaluate(()=>backspoolEncounterState().active),'Sparring starts for Sightline');
 // Test setup: one opponent so a single exchange is observed; practice shots held.
 await p.evaluate(()=>{const ops=backspoolCombat.practice.filter(t=>t.sparring);ops.forEach((t,i)=>{t.shot=999;if(i>0){t.hp=0;t.group.visible=false;}});});
 // Test setup: stand 1.2 m in front of the opponent, facing it (the sparring spot is placed off to one side).
 const approach=async()=>{await p.evaluate(()=>{const t=backspoolCombat.practice.find(x=>x.sparring&&x.hp>0),o=t.group.position,d=new THREE.Vector3(s.pos.x-o.x,0,s.pos.z-o.z);if(d.lengthSq()<.01)d.set(0,0,1);d.normalize();s.pos.set(o.x+d.x*1.2,s.pos.y,o.z+d.z*1.2);s.vel.set(0,0,0);s.yaw=cam.yaw=cam.targetYaw=Math.atan2(d.x,d.z);});await step(2);};
 const burst=async(guard=false)=>{const rows=[],start=(await foe()).hits;
  for(let k=0;k<4;k++){await tap(7);for(let f=0;f<45;f++){const r=await foe();rows.push(r);if(r.hits>=start+k+1)break;}}
  if(guard)await press(4);
  for(let f=0;f<150;f++){const r=await foe();rows.push(r);if(f===40)await p.evaluate(()=>renderNight(0)),await p.screenshot({path:`${out}/${guard?'guarded':'open'}-counter.png`});}
  if(guard)await press(4,0);return rows;};
 const results={};
 await approach();const traumaBefore=await p.evaluate(()=>courier.trauma);results.open=await burst(false);
 const phases=[...new Set(results.open.map(r=>r.phase))];
 assert(results.open.some(r=>r.burst>=3),'The opponent counts the burst');
 const coverAt=results.open.findIndex(r=>r.phase==='cover'),windAt=results.open.findIndex((r,i)=>i>coverAt&&r.phase==='windup'),resetAt=results.open.findIndex((r,i)=>i>windAt&&r.phase==='reset');
 assert(coverAt>0&&windAt>coverAt&&resetAt>windAt,'After the burst the opponent covers, counters, then resets: '+phases.join(' > '));
 assert(results.open[resetAt+20].dist>results.open[resetAt].dist+.3,'Reset steps back to open the distance');
 const openDamage=await p.evaluate(()=>courier.trauma)-traumaBefore;results.openDamage=openDamage;assert(openDamage>=8,'An unguarded counter lands for full damage');
 await step(60);await approach();const traumaGuard=await p.evaluate(()=>courier.trauma);results.guarded=await burst(true);
 assert(results.guarded.some(r=>r.phase==='windup')&&results.guarded.some(r=>r.phase==='reset'),'The second exchange also counters and resets');
 assert(results.guarded.some(r=>/GUARD/.test(r.result||'')),'LB guards the counter');
 const guardDamage=await p.evaluate(()=>courier.trauma)-traumaGuard;results.guardDamage=guardDamage;assert(guardDamage<=1,'A guarded counter takes only chip damage ('+guardDamage+' vs '+openDamage+')');
 assert.deepEqual(errors,[]);
 fs.writeFileSync(out+'/browser-results.json',JSON.stringify({entry:build.entry,entrySHA256:build.entrySHA256,testSHA256:require('crypto').createHash('sha256').update(fs.readFileSync(__filename)).digest('hex'),scope:'Open plaza sparring, one opponent, Sightline placed in range; virtual pad RT/LB. Phase order, distance and damage only; no feel certification.',phases,results,errors},null,1));
 console.log('PASS burst > cover > counter > reset; guarded counter takes chip damage only; no page errors');
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
