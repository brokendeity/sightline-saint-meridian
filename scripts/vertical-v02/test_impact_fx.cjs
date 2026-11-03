/* Impact FX: surface bursts spawn the right layers, debris arcs, bounces and comes to rest on the ground, decals hold 30 s then fade over
   2 s and are destroyed, flashes last a fraction of a second, and massive impacts hit-stop the world briefly. Then real sources:
   a Backspool heavy strike (virtual pad), a Sightline hard landing, and an enemy projectile striking a wall through the game's own
   projectile update. Labelled setup: effect-harness calls, player placement, a concrete probe block and one injected projectile. */
const {chromium}=require('/opt/homebrew/lib/node_modules/playwright'),assert=require('assert/strict'),fs=require('fs');
(async()=>{const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal']});try{
 const build=JSON.parse(fs.readFileSync('development/vertical-city-v02/'+(process.env.V02_ACTION_BUILD||'V02_Impact_FX_Build.json')));
 const out=process.env.V02_IMPACT_OUT||'development/vertical-city-v02/evidence/impact-fx';fs.mkdirSync(out,{recursive:true});
 const results={},errors=[];
 const open=async(hero)=>{const p=await browser.newPage({viewport:{width:1100,height:700}});p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(()=>{const up={pressed:false,value:0};window.testPad={id:'test pad',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>up)};navigator.getGamepads=()=>[window.testPad];});
  await p.goto('http://127.0.0.1:8766/'+build.entry+(hero==='backspool'?'?capture=backspool':''));
  await p.waitForFunction(h=>typeof gameReady!=='undefined'&&gameReady&&window.characterState&&!characterState().busy&&roadNetworkState().ready&&window.impactFX&&characterState().active===h,hero,{timeout:150000});
  await p.waitForFunction(()=>verticalWorldLifeState().ready&&v02EastPublicLightingState().ready,null,{timeout:120000});
  await p.locator('#v02Start').click();await p.evaluate(()=>{window.requestAnimationFrame=()=>0;resetPlayer();clearInput();clearPad();startGame(false);s.pos.set(0,.42,12);s.vel.set(0,0,0);s.onGround=true;setMode(P.GROUND);s.yaw=cam.yaw=cam.targetYaw=0;for(let i=0;i<90;i++)tickFrame(1/60,true);});return p;};
 const step=(p,n)=>p.evaluate(n=>{for(let i=0;i<n;i++)tickFrame(1/60,false)},n);
 // ---- Harness: layers per surface, debris rest, decal lifetime, flash, hit-stop.
 {const p=await open('sightline');
  results.surfaces=await p.evaluate(()=>{const out={};for(const [surface,n] of [['concrete',[0,0,1]],['asphalt',[0,1,0]],['metal',[1,0,0]],['glass',[0,0,1]]]){const before=impactFX.state();impactFX.burst(new THREE.Vector3(0,surface==='asphalt'?.4:1.5,8),new THREE.Vector3(...n),{surface,strength:1});tickFrame(1/60,false);const after=impactFX.state();
   out[surface]={chunks:after.chunksSpawned-before.chunksSpawned,dust:after.dustSpawned-before.dustSpawned,sparks:after.sparksSpawned-before.sparksSpawned,decals:after.decalsSpawned-before.decalsSpawned,flash:after.flashIntensity};}
   const b=impactFX.state();impactFX.hit(new THREE.Vector3(0,1.3,9),new THREE.Vector3(0,0,-1),{heavy:true});tickFrame(1/60,false);const a=impactFX.state();out.body={sparks:a.sparksSpawned-b.sparksSpawned,dust:a.dustSpawned-b.dustSpawned,chunks:a.chunksSpawned-b.chunksSpawned,hitStops:a.hitStops-b.hitStops};return out;});
  for(const k of ['concrete','asphalt','metal','glass'])assert(results.surfaces[k].chunks>0&&results.surfaces[k].dust>0&&results.surfaces[k].decals===1,k+' spawns chunks, dust and a decal');
  assert(results.surfaces.metal.sparks>results.surfaces.concrete.sparks,'Metal throws sparks, concrete does not');assert(results.surfaces.body.chunks===0&&results.surfaces.body.sparks>0&&results.surfaces.body.hitStops===1,'A heavy body hit sparks and hit-stops without rubble');
  results.flight=await p.evaluate(()=>{const traces=[];for(let i=0;i<240;i++){tickFrame(1/60,false);if(i%20===0)traces.push(impactFX.chunks().slice(0,3));}const end=impactFX.chunks();
   return{traces,resting:end.filter(c=>c.rest).length,total:end.length,maxAboveGround:Math.max(...end.filter(c=>c.rest).map(c=>c.y-c.ground-c.size*.55)),minAboveGround:Math.min(...end.map(c=>c.y-c.ground))};});
  assert(results.flight.resting>=results.flight.total*.85,'Debris comes to rest within 4 s: '+results.flight.resting+'/'+results.flight.total);
  assert(results.flight.minAboveGround>-.01&&results.flight.maxAboveGround<.02,'Resting debris sits on the ground, not in it or floating');
  results.lifetime=await p.evaluate(()=>{for(let i=0;i<60*40;i++)impactFX.update(1/60);const start=impactFX.state().decals.length;impactFX.burst(new THREE.Vector3(0,.4,8),new THREE.Vector3(0,1,0),{surface:'asphalt',strength:1});
   const at=t=>{const d=impactFX.state().decals;return d.length?d[d.length-1]:null;};const r={};let clock=0;const adv=t=>{while(clock<t-1e-6){impactFX.update(1/60);clock+=1/60;}};
   adv(.02);r.flashEarly=impactFX.state().flashIntensity;r.stopEarly=impactFX.timeScale();adv(.25);r.flashLate=impactFX.state().flashIntensity;
   adv(29.5);r.at29=at()?.opacity;adv(31);r.at31=at()?.opacity;adv(32.2);r.after=impactFX.state().decals.length-start;return r;});
  assert.equal(results.lifetime.at29,1,'Decal fully visible before 30 s');assert(results.lifetime.at31>.3&&results.lifetime.at31<.7,'Decal halfway through its 2 s fade at 31 s');assert.equal(results.lifetime.after,0,'Decal destroyed after the fade');
  assert(results.lifetime.flashEarly>1&&results.lifetime.flashLate===0,'Flash lasts a fraction of a second');
  results.hitStop=await p.evaluate(()=>{impactFX.burst(new THREE.Vector3(0,.4,8),new THREE.Vector3(0,1,0),{surface:'concrete',strength:2.6,source:'collapse'});const during=impactFX.timeScale();for(let i=0;i<7;i++)impactFX.update(1/60);return{during,after:impactFX.timeScale()};});
  assert(results.hitStop.during<.1&&results.hitStop.after===1,'Massive impacts hit-stop the world for under .12 s');
  // ---- Real source: Sightline falls from height into a hard landing.
  results.landing=await p.evaluate(()=>{for(let i=0;i<60*40;i++)impactFX.update(1/60);const b=impactFX.state();s.pos.set(0,22,12);s.vel.set(0,-4,0);s.onGround=false;setMode(P.AIR);let landed=null;for(let i=0;i<300;i++){tickFrame(1/60,false);if(!landed&&[P.LANDING,P.IMPACT].includes(s.mode))landed=s.mode;}const a=impactFX.state();return{landed,bursts:a.bursts-b.bursts,last:a.lastBurst,decals:a.decalsSpawned-b.decalsSpawned};});
  assert(results.landing.landed&&results.landing.bursts>=1&&results.landing.last.source==='landing'&&results.landing.decals>=1,'A hard landing punches a crater: '+JSON.stringify(results.landing));
  await p.evaluate(()=>renderNight(0));await p.screenshot({path:out+'/hard-landing.png'});
  // ---- Real path: an enemy projectile flies through the game's own update and strikes a wall.
  results.shot=await p.evaluate(()=>{const g=new THREE.BoxGeometry(4,3,1),mesh=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:0x8d9096}));mesh.position.set(0,1.9,6);mesh.updateMatrixWorld(true);scene.add(mesh);propColliders.push({id:'fx-test-wall',type:'fx-test',surface:'concrete',mesh,box:new THREE.Box3(new THREE.Vector3(-2,.4,5.5),new THREE.Vector3(2,3.4,6.5)),damageCount:0});cameraObstacles.push(mesh);
   s.pos.set(0,.42,12);s.onGround=true;setMode(P.GROUND);const b=impactFX.state();const shot=new THREE.Mesh(new THREE.SphereGeometry(.1),new THREE.MeshBasicMaterial({color:0xff6030}));shot.position.set(0,1.6,2);scene.add(shot);
   projectiles.push({m:shot,d:new THREE.Vector3(0,0,1),life:2,speed:30,source:null});for(let i=0;i<40;i++)tickFrame(1/60,false);const a=impactFX.state();return{bursts:a.bursts-b.bursts,last:a.lastBurst};});
  assert(results.shot.bursts>=1&&results.shot.last.source==='shot','An enemy shot leaves a wall burst: '+JSON.stringify(results.shot));
  await p.close();}
 // ---- Real input: Backspool heavy strike on a locked practice target (virtual pad R3, D-pad up).
 {const p=await open('backspool');const press=(b,v=1)=>p.evaluate(([b,v])=>testPad.buttons=testPad.buttons.map((x,i)=>i===b?{pressed:v>0,value:v}:x),[b,v]);const tap=async b=>{await press(b);await step(p,2);await press(b,0);};
  if(!await p.locator('#combatPractice').isVisible()){await p.click('#v02Tools');await p.click('#v02Tab-practice');}await p.click('#combatPractice');await step(p,2);if(!await p.evaluate(()=>gameActive)){await p.click('#start');await step(p,2);}
  await p.evaluate(()=>backspoolCombat.practice.forEach(t=>t.shot=999));await tap(11);await step(p,90);
  await p.keyboard.down('w');for(let i=0;i<300;i++){const d=await p.evaluate(()=>{tickFrame(1/60,false);const x=backspoolCombat.state(),t=backspoolCombat.practice.find(q=>q.id===x.target);return Math.hypot(t.group.position.x-s.pos.x,t.group.position.z-s.pos.z)});if(d<1.3)break;}await p.keyboard.up('w');await step(p,4);
  const b=await p.evaluate(()=>impactFX.state());await tap(12);const rows=[];for(let f=0;f<60;f++){rows.push(await p.evaluate(()=>{tickFrame(1/60,false);const x=impactFX.state();return{hits:x.hits,stops:x.hitStops,scale:impactFX.timeScale(),sparks:x.sparksSpawned};}));if(f===rows.findIndex(r=>r.hits>b.hits)+1){await p.evaluate(()=>renderNight(0));await p.screenshot({path:out+'/heavy-hit.png'});}}
  results.heavy={hits:rows.at(-1).hits-b.hits,stops:rows.at(-1).stops-b.hitStops,sparks:rows.at(-1).sparks-b.sparksSpawned,frozeWorld:rows.some(r=>r.scale<1)};
  assert(results.heavy.hits>=1&&results.heavy.sparks>0&&results.heavy.stops>=1&&results.heavy.frozeWorld,'A heavy strike sparks and hit-stops the world: '+JSON.stringify(results.heavy));
  await p.close();}
 assert.deepEqual(errors,[]);
 fs.writeFileSync(out+'/browser-results.json',JSON.stringify({entry:build.entry,entrySHA256:build.entrySHA256,testSHA256:require('crypto').createHash('sha256').update(fs.readFileSync(__filename)).digest('hex'),scope:'Effect harness plus three real sources (Backspool heavy via virtual pad, Sightline hard landing, projectile through the game update). Counts, timing, rest and lifetime only; no visual certification.',results,errors},null,1));
 console.log('PASS surfaces, debris rest, decal 30 s + 2 s fade, flash, hit-stop, landing crater, shot burst, heavy-strike feel; no page errors');
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
