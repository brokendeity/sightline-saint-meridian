const {chromium}=require('/opt/homebrew/lib/node_modules/playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const out='output/backspool-traversal/pose-binding-v14';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[],requests=[];
  let rejectLoad;const failed=new Promise((_,reject)=>{rejectLoad=reject});
  page.on('pageerror',e=>{errors.push(e.message);rejectLoad(e)});page.on('request',r=>{if(r.url().includes('original-biped-bindings-v14'))requests.push(r.url())});
  await page.addInitScript(()=>navigator.getGamepads=()=>[]);
  await page.goto('http://127.0.0.1:8765/SIGHTLINE_BACKSPOOL_TRAVERSAL_CANDIDATE.html?capture=backspool&v=pose-binding-v14');
  await Promise.race([failed,page.waitForFunction(()=>typeof gameReady!=='undefined'&&gameReady&&!characterState().busy&&roadNetworkState().ready,null,{timeout:120000})]);
  assert.equal(requests.length,0);
  await page.locator('#start').click();await page.evaluate(()=>{window.loop=()=>{};clearInput();courier.trauma=0});
  await page.route('**/original-biped-bindings-v14.json.gz',route=>route.fulfill({status:200,body:'corrupt'}));
  assert.match(await page.evaluate(()=>forspokenBipedBindingEvidence().then(()=>'',e=>e.message)),/identity mismatch/);
  await page.unroute('**/original-biped-bindings-v14.json.gz');
  const bindings=await page.evaluate(()=>forspokenBipedBindingEvidence());
  assert.equal(bindings.inputOrder.length,9);assert.equal(bindings.bodyPoints.length,7);assert.equal(bindings.probeVectors.length,6);
  await page.evaluate(()=>forspokenBipedBindingEvidence().then(d=>d.inputOrder.length=0));
  assert.equal((await page.evaluate(()=>forspokenBipedBindingEvidence())).inputOrder.length,9);
  const before=await page.evaluate(()=>({position:s.pos.toArray(),anim:currentAnim,bones:model.getObjectByName('mixamorigHips').position.toArray()}));
  const snapshot=await page.evaluate(()=>forspokenPoseSnapshot());
  assert.equal(snapshot.rotations.length,36);assert.equal(snapshot.positions.length,36);assert(!snapshot.appliedToRig);assert(!snapshot.originalIKComplete);
  assert.deepEqual(await page.evaluate(()=>({position:s.pos.toArray(),anim:currentAnim,bones:model.getObjectByName('mixamorigHips').position.toArray()})),before);
  const sampled=await page.evaluate(async()=>{
   const rows=[],names=['mixamorigHips','mixamorigLeftUpLeg','mixamorigLeftLeg','mixamorigLeftFoot','mixamorigLeftToeBase','mixamorigRightUpLeg','mixamorigRightLeg','mixamorigRightFoot','mixamorigRightToeBase'];
   const local=()=>names.map(n=>{const b=model.getObjectByName(n);return [...b.position.toArray(),...b.quaternion.toArray()]});
   // Explicit test frame/probe inputs validate numeric plumbing, not original probe values.
   const frame={inverseRotation:[0,0,0,1],scale:1,actorScale:1,hipOffset:[0,0,0,0],footOffsets:Array.from({length:4},()=>[0,0,0,0]),bendAxes:[[1,0,0,0],[1,0,0,0]]};
   const pointSlots=[0,1,5,2,6,3,7];
   for(const role of backspoolFlowRoles.roles)for(let i=0;i<8;i++){
    backspoolFlow.playSource(role.role,((role.end??role.duration)-(role.start||0))*i/8,false,0);characterRoot.updateMatrixWorld(true);
    const before=local(),snapshot=await forspokenPoseSnapshot(),packet=ForspokenPoseKernels.bodyPacket(snapshot.rotations,snapshot.positions,snapshot.binding,frame);
    const copy=ForspokenPoseKernels.writeback(snapshot.rotations,snapshot.positions,Array(9).fill(null));
    let error=0;for(let k=0;k<7;k++)for(let axis=0;axis<3;axis++)error=Math.max(error,Math.abs(packet[k*4+axis]-snapshot.positions[pointSlots[k]*4+axis]));
    if(error>.00005||JSON.stringify(before)!==JSON.stringify(local())||!Array.from(packet).every(Number.isFinite))throw Error('Read-only native pose packet mismatch '+role.role);
    if(Array.from(copy.positions).some((v,k)=>Math.abs(v-snapshot.positions[k])>.00005))throw Error('Native no-op writeback mismatch');
    rows.push({role:role.role,sample:i,maxCenterError:error,packetVectors:packet.length/4});
   }
   return rows;
  });
  assert.equal(sampled.length,31*8);
  await page.evaluate(()=>{resetMechanicInput();for(let i=0;i<10;i++)tickFrame(1/60,false)});
  await page.locator('#backspoolLibrary').click();await page.locator('#backspoolBipedEvidence').click();
  await page.waitForFunction(()=>document.getElementById('backspoolBipedEvidenceResult').textContent.includes('9 original input joints'));
  const text=await page.locator('#backspoolBipedEvidenceResult').textContent();assert(text.includes('R_Foot'));assert(text.includes('no bones are moved'));assert(text.includes('Full contact solver is incomplete'));
  await page.locator('#backspoolBipedEvidenceResult').scrollIntoViewIfNeeded();await page.evaluate(()=>renderer.render(scene,camera));await page.screenshot({path:out+'/desktop.png'});
  for(const [name,width,height]of [['portrait',390,844],['landscape',844,390]]){
   await page.setViewportSize({width,height});await page.locator('#backspoolBipedEvidenceResult').scrollIntoViewIfNeeded();await page.evaluate(()=>renderer.render(scene,camera));
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:out+'/'+name+'.png'});
  }
  assert.deepEqual(errors,[]);
  fs.writeFileSync(out+'/browser-results.json',JSON.stringify({bindings:{inputJoints:9,bodyPoints:7,probeVectors:6},snapshot,sampled,errors,originalProbeValuesUsed:false,poseAppliedToActor:false},null,2));
  console.log('PASS lazy/integrity-checked biped evidence, explicit target-name binding,248source-role pose samples, native pose packet/no-op writeback, no actor mutation and responsive inspector; no page errors');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
