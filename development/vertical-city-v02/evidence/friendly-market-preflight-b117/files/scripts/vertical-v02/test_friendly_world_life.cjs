/* Three new scenic public-room visitors in the complete current game.
 * One initial player fixture; all180simulation seconds use native tickFrame. */
const {chromium}=require('/opt/homebrew/lib/node_modules/playwright');
const fs=require('fs'),path=require('path'),crypto=require('crypto'),zlib=require('zlib'),assert=require('assert/strict');
const R=path.resolve(__dirname,'../..'),D=path.join(R,'development/vertical-city-v02');
const E=path.join(D,'evidence/friendly-contacts-world-life');fs.mkdirSync(E,{recursive:true});
const read=f=>JSON.parse(fs.readFileSync(path.join(R,f)));
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(path.join(R,f))).digest('hex');
const b=read('development/vertical-city-v02/V02_Friendly_Contacts_Build.json');
const routes=read(b.ambientRoutes),report={status:'FAIL',entry:b.entry,entrySHA256:sha(b.entry),manifestSHA256:sha(b.manifest),
 testSHA256:crypto.createHash('sha256').update(fs.readFileSync(__filename)).digest('hex'),errors:[],trace:[],captures:[],
 scope:'180seconds complete-game fixed60Hz simulation of actual existing pedestrian meshes on three new admitted room routes; source-grounded feet, destinations, pause and hero yielding. No physical device or sustained frame-cost acceptance.'};
assert.equal(report.entrySHA256,b.entrySHA256);assert.equal(report.manifestSHA256,b.manifestSHA256);
let browser,page;
async function sample(){return page.evaluate(()=>{
 scene.updateMatrixWorld(true);
 const world=verticalWorldLifeState(),root=scene.getObjectByName('V02 public world life');
 const visuals=root.children.filter(o=>o.name==='Existing pedestrian visual');
 return{clock:world.clock,active:gameActive,hero:s.pos.toArray(),trauma:courier.trauma,
  residents:verticalMarketState().civilians,people:world.people,events:world.events,aircraft:world.aircraft,visitors:world.visitors,streetPeople:streetAtmosphere.walkers.filter(w=>w.routeEdge).map(w=>({position:w.group.position.toArray(),support:w.v02SupportY,expected:Math.hypot(w.group.position.x,w.group.position.z)<115?.4:roadNetwork.surfaceAt(w.group.position.x,w.group.position.z),sole:new THREE.Box3().setFromObject(w.group).min.y})),
  visuals:visuals.map(o=>({position:o.position.toArray(),sole:new THREE.Box3().setFromObject(o).min.y,
   support:verticalDistrict.surfaceFeetAt(o.position.x,o.position.z,o.position.y+.42)}))};
});}
async function step(n){await page.evaluate(n=>{for(let i=0;i<n;i++){
 tickFrame(1/60,false);
 const people=verticalWorldLifeState().people,residents=verticalMarketState().civilians;
 window.__friendlyLifeMinimum??={peer:Infinity,resident:Infinity,maximumStep:0};
 for(const p of people){
  const before=window.__friendlyLifePrevious?.[p.id];if(before)__friendlyLifeMinimum.maximumStep=Math.max(__friendlyLifeMinimum.maximumStep,Math.hypot(p.position[0]-before[0],p.position[2]-before[2]));
  for(const other of people)if(p.id<other.id&&Math.abs(p.position[1]-other.position[1])<.3)__friendlyLifeMinimum.peer=Math.min(__friendlyLifeMinimum.peer,Math.hypot(p.position[0]-other.position[0],p.position[2]-other.position[2]));
  for(const r of residents)if(Math.abs(p.position[1]-r.position[1])<.3)__friendlyLifeMinimum.resident=Math.min(__friendlyLifeMinimum.resident,Math.hypot(p.position[0]-r.position[0],p.position[2]-r.position[2]));
 }
window.__friendlyLifePrevious=Object.fromEntries(people.map(p=>[p.id,p.position]));
}},n);return sample();}
async function capture(id,floor){
 await page.evaluate(floor=>{camera.position.set(97,floor+2.3,306);camera.lookAt(103,floor+1,311);camera.fov=65;
  camera.updateProjectionMatrix();camera.updateMatrixWorld(true);renderNight(0);},floor);
 const file=path.join(E,id+'.png');await page.screenshot({path:file});report.captures.push({id,file:path.relative(R,file),sha256:sha(path.relative(R,file)),scope:'Explicit camera-only inspection; actor/NPC state unchanged'});
}
(async()=>{try{
 browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal']});
 page=await browser.newPage({viewport:{width:1664,height:936}});
 page.on('pageerror',e=>report.errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
 await page.goto('http://127.0.0.1:8766/'+b.entry+'?capture=backspool');
 await page.waitForFunction(()=>gameReady&&roadNetworkState().ready&&verticalDistrictState().ready&&
  verticalWorldLifeState().ready&&v02EastPublicLightingState().ready&&v02RimShadowState().ready&&!v02RimShadowState().error&&characterState().active==='backspool'&&!characterState().busy,
  null,{timeout:120000});
 await page.click('#v02Start');await page.evaluate(()=>window.requestAnimationFrame=()=>0);await page.waitForTimeout(100);
 await page.evaluate(()=>{resetPlayer();clearInput();clearPad();startGame(false);s.pos.set(0,.42,8);s.vel.set(0,0,0);s.onGround=true;setMode(P.GROUND);});
 report.initial=await sample();assert.equal(report.initial.visitors,11);assert.equal(report.initial.aircraft,36);
 report.source=await page.evaluate(()=>({world:verticalWorldLifeState(),lighting:v02EastPublicLightingState(),
  lights:scene.children.filter(o=>o.isLight).map(o=>o.uuid)}));
 assert.equal(report.source.world.ambientManifestSHA256,b.manifestSHA256);
 assert.equal(report.source.world.roomGraphSHA256,b.admittedPlayerGraphSHA256);
 const captured=new Set();
 for(let second=1;second<=180;second++){
  const row=await step(60);report.trace.push(row);assert(row.active,'Full simulation stopped during visitor test');
  assert.equal(row.streetPeople.length,28);for(const person of row.streetPeople){assert(Math.abs(person.sole-person.support)<.003,'Street feet float/penetrate');assert(Math.abs(person.support-person.expected)<.003,'Street walker left native road/plaza support');}
  for(const visual of row.visuals){
   assert(Math.abs(visual.sole-visual.position[1])<.003,'Visible visitor feet float/penetrate');
   assert(Math.abs(visual.support-visual.position[1]-.42)<.02,'Visitor left current supported geometry');
  }
  for(const floor of [24,52,84]){
   const person=row.people.find(p=>p.route===`east-public-room-${floor}-visitor`);
   assert(person,'Missing actual room visitor');
   if(person.dwell>0&&Math.abs(person.position[0]-103.15)<.05&&!captured.has(floor)){
    await capture('room-'+floor,floor);captured.add(floor);
   }
  }
  if(second%30===0)console.log('PASS world simulation',second,'seconds');
 }
 report.final=await sample();
 report.actorClearance=await page.evaluate(()=>window.__friendlyLifeMinimum);
 assert(report.actorClearance.maximumStep<=1.6/60+1e-5,'Visitor yielding exceeded bounded speed');
 assert(report.actorClearance.peer>=.64-1e-5,'Ambient bodies overlap');
 assert(report.actorClearance.resident>=.7-1e-5,'Ambient visitor crosses a resident');
 for(const resident of report.final.residents.filter(r=>r.id!==0))assert(resident.walked>30,'Circulating resident stopped '+resident.id);

 for(const route of routes.routes){
  const people=report.final.people.filter(p=>p.route===route.id);assert.equal(people.length,route.count);
  assert(people.every(p=>p.walked>15&&p.arrivals>=2),'Visitor route stopped '+route.id);
  if(route.id.startsWith('east-public-room-')){
   const person=people[0];
   for(const waypoint of [2,4])assert(report.trace.some(row=>row.events.some(e=>e.kind==='destination'&&e.visitor===person.id&&e.waypoint===waypoint)),
    'New room visitor did not reach destination '+route.id+' / '+waypoint);
  }
 }
 assert.equal(captured.size,3);
 // Native pause must freeze both the pre-existing and the new populations.
 await page.evaluate(()=>gameActive=false);const paused=await page.evaluate(()=>verticalWorldLifeState());
 await step(120);assert.deepEqual(await page.evaluate(()=>verticalWorldLifeState()),paused);
 // A controlled second player fixture tests yielding; no visitor pose/time is edited.
 await page.evaluate(()=>{const p=verticalWorldLifeState().people.find(p=>p.route==='east-public-room-24-visitor');
  s.pos.fromArray(p.position).add(new THREE.Vector3(0,.42,0));s.vel.set(0,0,0);s.onGround=true;setMode(P.GROUND);gameActive=true;});
 const yieldStart=await sample();let yielded=false;
 for(let i=0;i<600;i++){
  await step(1);const p=await page.evaluate(()=>verticalWorldLifeState().people.find(p=>p.route==='east-public-room-24-visitor'));
  if(p.yielding&&p.yieldedMetres>0){yielded=true;report.yielded=p;break;}
 }
 assert(yielded,'Room visitor did not yield to the hero');
 const escaped=await step(120),escapedPerson=escaped.people.find(p=>p.id===report.yielded.id);
 const gap=Math.hypot(escaped.hero[0]-escapedPerson.position[0],escaped.hero[2]-escapedPerson.position[2]);
 assert(gap>=.87,'Visitor remained overlapping the initial player fixture');
 assert(Math.abs(escaped.visuals.find(v=>Math.hypot(v.position[0]-escapedPerson.position[0],v.position[2]-escapedPerson.position[2])<.001).sole-24)<.003,'Yielded visitor feet lost support');
 report.yieldRecovery={gap,person:escapedPerson,scope:'Initial deliberate overlap then bounded native visitor recovery; no actor/NPC corrections during recovery'};
 await page.evaluate(()=>{s.pos.set(0,.42,8);s.vel.set(0,0,0);s.onGround=true;});
 const resume=await step(120);assert(resume.people.find(p=>p.id===report.yielded.id).walked>report.yielded.walked,'Yielded visitor did not resume');
 report.yieldTest={initial:yieldStart.people.find(p=>p.id===report.yielded.id),final:resume.people.find(p=>p.id===report.yielded.id)};
 assert.deepEqual(await page.evaluate(()=>scene.children.filter(o=>o.isLight).map(o=>o.uuid)),report.source.lights);
 assert.deepEqual(report.errors,[]);report.status='PASS180native simulation seconds:11visitors/36aircraft, all room destinations, supported visible feet, pause and hero yield/resume';
}catch(error){report.failure=error.stack||String(error);console.error(error);process.exitCode=1;if(page)await page.screenshot({path:path.join(E,'failure.png')}).catch(()=>{});}
finally{
 const f=path.join(E,'traces.json.gz');fs.writeFileSync(f,zlib.gzipSync(JSON.stringify(report.trace)));report.traces=path.relative(R,f);report.tracesSHA256=sha(report.traces);delete report.trace;
 fs.writeFileSync(path.join(D,'V02_Friendly_Contacts_Life.json'),JSON.stringify(report,null,2)+'\n');await browser?.close();console.log(report.status);
}})();
