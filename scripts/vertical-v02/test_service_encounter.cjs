/* One labelled yard setup per scenario. Movement and combat thereafter use
   actual DOM keys/mouse and a standard controller's movement axes only. */
const {chromium}=require('/opt/homebrew/lib/node_modules/playwright');
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const {saveEvidence}=require('./evidence_io.cjs');
const R=path.resolve(__dirname,'../..'),D=path.join(R,'development/vertical-city-v02');
const report={scope:'Service-yard local encounter; single initial fixture, no route-node teleporting or injected damage. Other district encounters and full V02 acceptance remain pending.',entry:'SIGHTLINE_SAINT_MERIDIAN_V02_GRAYBOX.html',results:[],trace:[],errors:[]};
for(const [key,file]of Object.entries({entrySHA256:report.entry,manifestSHA256:'assets/city/vertical-v02/graybox/manifest.json',encounterSHA256:'scripts/game_vertical_encounters_v02.js',marketSHA256:'scripts/game_vertical_market_v02.js'}))report[key]=crypto.createHash('sha256').update(fs.readFileSync(path.join(R,file))).digest('hex');
(async()=>{const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal']});let p;
try{
 p=await browser.newPage({viewport:{width:1280,height:800}});p.on('pageerror',e=>report.errors.push(String(e)));p.on('console',m=>{if(m.type()==='error')report.errors.push(m.text())});
 await p.goto('http://127.0.0.1:8766/'+report.entry+'?capture=backspool');
 await p.waitForFunction(()=>gameReady&&roadNetworkState().ready&&verticalDistrictState().ready&&characterState().active==='backspool'&&!characterState().busy,null,{timeout:120000});
 await p.evaluate(()=>window.requestAnimationFrame=()=>0);await p.waitForTimeout(100);
 const sample=()=>({pos:s.pos.toArray(),vel:s.vel.toArray(),grounded:s.onGround,trauma:courier.trauma,encounter:verticalEncounterState(),combat:backspoolCombatState(),camera:camera.position.toArray()});
 const step=async(n=1)=>{const rows=await p.evaluate(n=>{const rows=[];for(let i=0;i<n;i++){tickFrame(1/60,false);if(i%4===0||i===n-1)rows.push({pos:s.pos.toArray(),grounded:s.onGround,active:gameActive,trauma:courier.trauma,phase:verticalEncounterState().phase,action:backspoolCombatState().action,opponents:verticalEncounterState().opponents,ledger:backspoolCombatState().ledger.slice(-1)})}return rows},n);report.trace.push(...rows);return rows.at(-1)};
 const setup=async()=>{await p.mouse.up({button:'right'});await p.mouse.up();for(const key of ['w','s','a','d','Shift','Space'])await p.keyboard.up(key);await p.evaluate(()=>{resetPlayer();clearInput();clearPad();startGame(false);s.pos.set(62,52.42,337);s.vel.set(0,0,0);s.onGround=true;setMode(P.GROUND);cam.focus.copy(s.pos).add(new THREE.Vector3(0,1.2,0));camera.position.copy(s.pos).add(new THREE.Vector3(1.35,2.4,4.24));camera.lookAt(s.pos.clone().add(new THREE.Vector3(0,1.5,-15)));camera.updateMatrixWorld(true);s.yaw=cam.yaw=cam.targetYaw=0;cam.pitch=cam.targetPitch=-.12;window.yardPad={index:0,id:'V02 normal-input service controller',mapping:'standard',connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};navigator.getGamepads=()=>[yardPad];});await step(4)};
 const stop=async()=>{await p.evaluate(()=>{yardPad.axes[0]=yardPad.axes[1]=0});await step(8)};
 const move=async(target,tolerance=.16)=>{let st;for(let i=0;i<2200;i++){const distance=await p.evaluate(t=>{const dx=t[0]-s.pos.x,dz=t[2]-s.pos.z,d=Math.hypot(dx,dz),m=Math.min(1,Math.max(.16,d/1.4));yardPad.axes[0]=d>.16?(dx*Math.cos(cam.yaw)-dz*Math.sin(cam.yaw))/d*(.1+.9*m):0;yardPad.axes[1]=d>.16?-(-dx*Math.sin(cam.yaw)-dz*Math.cos(cam.yaw))/d*(.1+.9*m):0;return d},target);st=await step(distance>1?3:1);if(distance<tolerance){await stop();assert(Math.abs(st.pos[1]-target[1]-.42)<.25,'Wrong support height '+JSON.stringify({target,st}));return st;}if(st.trauma>=100)throw Error('Defeat while moving');}throw Error('Movement timeout '+JSON.stringify({target,st}));};
 const capture=async(name,inspect=false)=>{await p.evaluate(inspect=>{if(inspect){camera.position.set(86,67,342);camera.lookAt(78,54,323);camera.updateMatrixWorld(true)}renderNight(0)},inspect);await p.screenshot({path:path.join(D,'evidence/service-'+name+'.png')});};
 await setup();await p.keyboard.press('i');await step(2);assert.equal(await p.evaluate(()=>verticalEncounterState().phase),'active');
 const initial=await p.evaluate(()=>verticalEncounterState());assert.equal(initial.opponents.length,3);assert.deepEqual(initial.opponents.map(t=>t.position[1]),[52,52,55.2]);report.results.push({name:'real keyboard starts three supported, damage-taking opponents on two elevations',pass:true});
 // Labelled direct negative API call: verifies atomic validation, not combat play.
 const invalid=await p.evaluate(()=>{const before=backspoolEncounterState(),hp=backspoolCombat.practice.map(t=>t.hp);const accepted=backspoolEncounters.start(false,{heightAware:true,preserveHealth:true,positions:[new THREE.Vector3(65,52,330),new THREE.Vector3(73,52,327),new THREE.Vector3(200,55.2,200)]});return{accepted,before:before.attempt,after:backspoolEncounterState().attempt,hp,afterHp:backspoolCombat.practice.map(t=>t.hp)}});assert.equal(invalid.accepted,false);assert.equal(invalid.before,invalid.after);assert.deepEqual(invalid.hp,invalid.afterHp);report.results.push({name:'partial invalid placement preserves all existing actors and attempt',pass:true,evidence:invalid});
 await step(2);await capture('active');await capture('space-inspection',true);
 if(process.env.PROBE_ONLY){report.status='PROBE';console.log(JSON.stringify(await p.evaluate(()=>verticalEncounterState()),null,2));return;}
 // Real inputs reach both upper levels before combat, including all stair risers.
 await p.locator('#v02EncounterEnd').click();await step(2);
 for(const t of [[62,52,316.5],[71,52,316.5]])await move(t);
 const paths=await p.evaluate(()=>verticalDistrictState().paths['service-stair'].segments);
 let airFrames=0;
 for(const seg of paths){for(const t of seg.points){const before=report.trace.length;await move(t);airFrames+=report.trace.slice(before).filter(r=>!r.grounded).length;}await capture('stairs-'+seg.to);}
 assert.equal(airFrames,0);await move([80.2,58.4,316.5]);await move([80.2,58.4,321]);await move([85.5,58.4,329]);await capture('overhead');
 report.results.push({name:'normal controller movement climbs to mezzanine and overhead maintenance route',pass:true,airFrames});
 // A new local scenario uses a single controlled initial fixture. No writes to
 // either player/enemy transforms, HP, attack clocks or hit results after setup.
 await setup();await p.keyboard.press('i');await step(2);assert.equal(await p.evaluate(()=>verticalEncounterState().phase),'active',JSON.stringify(await p.evaluate(()=>({gameActive,st:verticalEncounterState()}))));await p.keyboard.press('2');await step(2);
 async function fight(floor){
  for(let count=0;count<50;count++){
   let st=await p.evaluate(()=>({pos:s.pos.toArray(),trauma:courier.trauma,action:backspoolCombatState().action,phase:verticalEncounterState().phase,opponents:verticalEncounterState().opponents}));
   const target=st.opponents.filter(t=>t.hp>0&&Math.abs(t.position[1]-floor)<.2).sort((a,b)=>Math.hypot(a.position[0]-st.pos[0],a.position[2]-st.pos[2])-Math.hypot(b.position[0]-st.pos[0],b.position[2]-st.pos[2]))[0];if(!target)return;
   assert(st.trauma<100,'Natural defeat during victory test '+JSON.stringify(st));
   // Approach a live actor through ordinary movement intent, never reposition it.
   for(let frame=0;frame<300;frame++){
    const d=await p.evaluate(id=>{const t=backspoolCombat.practice.find(t=>t.id===id);if(!t||t.hp<=0)return 0;const dx=t.group.position.x-s.pos.x,dz=t.group.position.z-s.pos.z,d=Math.hypot(dx,dz);yardPad.axes[0]=d>1.25?(dx*Math.cos(cam.yaw)-dz*Math.sin(cam.yaw))/d*.7:0;yardPad.axes[1]=d>1.25?-(-dx*Math.sin(cam.yaw)-dz*Math.cos(cam.yaw))/d*.7:0;return d},target.id);await step(2);if(d<1.3)break;
   }
   await stop();await p.mouse.up({button:'right'});await p.keyboard.press('q');await step(55);
   await p.mouse.down({button:'right'});await step(16);await p.mouse.up({button:'right'});
   if(count%4===0)console.log('fight',floor,count,JSON.stringify(await p.evaluate(()=>({hp:verticalEncounterState().opponents.map(t=>t.hp),p:s.pos.toArray(),trauma:courier.trauma}))));
  }
  throw Error('Legal strikes did not defeat floor '+floor+' '+JSON.stringify(await p.evaluate(()=>verticalEncounterState())));
 }
 await fight(52);await capture('lower-cleared');
 // Walk around cover to the public stair entrance, then flank the upper guard.
 for(const t of [[62,52,330],[62,52,316.5],[71,52,316.5]])await move(t);
 for(const t of paths[0].points)await move(t);
 await move([80.2,55.2,316.5]);await move([80.2,55.2,321]);await fight(55.2);await step(3);
 const victory=await p.evaluate(()=>({district:verticalEncounterState(),encounter:backspoolEncounterState(),score:s.score}));
 assert.equal(victory.district.phase,'victory');assert.equal(victory.encounter.outcome,'victory');assert(victory.district.opponents.every(t=>t.hp===0));await step(180);assert.equal(await p.evaluate(()=>s.score),victory.score,'Completion award repeats');await capture('victory');report.results.push({name:'legal heavy contacts defeat lower and upper opponents, award once',pass:true,victory});
 report.status='PASS local service encounter';assert.deepEqual(report.errors,[]);
}catch(e){report.failure=String(e);console.error(e);process.exitCode=1;}
finally{if(p){await p.evaluate(()=>renderNight(0)).catch(()=>{});await p.screenshot({path:path.join(D,'evidence/service-final.png')}).catch(()=>{});}saveEvidence(D,'V02_Service_Encounter.json',report);await browser.close();}})();
