const {chromium}=require('/opt/homebrew/lib/node_modules/playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const out='output/backspool-traversal/contact-controller-v13';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[],requests=[];
  let rejectLoad;const loadingFailed=new Promise((_,reject)=>{rejectLoad=reject});
  page.on('pageerror',e=>{errors.push(e.message);rejectLoad(e)});page.on('request',r=>{if(r.url().includes('original-controller-contracts-v13'))requests.push(r.url())});
  await page.addInitScript(()=>navigator.getGamepads=()=>[]);
  await page.goto('http://127.0.0.1:8765/SIGHTLINE_BACKSPOOL_TRAVERSAL_CANDIDATE.html?capture=backspool&v=contact-controller-v13');
  await Promise.race([loadingFailed,page.waitForFunction(()=>typeof gameReady!=='undefined'&&gameReady&&window.characterState&&!characterState().busy&&roadNetworkState().ready,null,{timeout:120000})]);
  assert.equal(requests.length,0,'Source controller evidence stays lazy');
  await page.locator('#start').click();
  await page.evaluate(()=>{window.loop=()=>{};courier.trauma=0;clearInput();});
  // Recovered evidence must fail on corruption and recover on explicit retry.
  await page.route('**/original-controller-contracts-v13.json.gz',route=>route.fulfill({status:200,body:'corrupt'}));
  assert.match(await page.evaluate(()=>forspokenControllerEvidence().then(()=>'',e=>e.message)),/identity mismatch/);
  await page.unroute('**/original-controller-contracts-v13.json.gz');
  const inventory=await page.evaluate(()=>forspokenControllerEvidence());
  assert.equal(inventory.actions.length,94);assert.equal(inventory.abilities.length,39);assert.equal(inventory.conditions.length,24);
  await page.evaluate(()=>forspokenControllerEvidence().then(d=>{d.actions.length=0;d.abilities[0].actions.length=0}));
  assert.equal((await page.evaluate(()=>forspokenControllerEvidence())).actions.length,94);
  const climb=await page.evaluate(()=>forspokenControllerEvidence('PARKOUR_ACTION_CLIMB'));
  assert.equal(climb.actorAction,0x46ae2e7);assert.equal(climb.buttonConditions.length,3);
  const inputId=climb.buttonConditions[0].inputId;
  const matching=await page.evaluate(inputId=>forspokenEvaluateActionInput('PARKOUR_ACTION_CLIMB',{[inputId]:{present:true,blocked:false,flags:2,heldTime:0,pressedTime:0,releasedTime:0}}),inputId);
  assert(matching.inputPass);assert(!matching.engineEligibilityChecked);assert(!matching.originalStateSelectionChecked);
  assert(!(await page.evaluate(()=>forspokenEvaluateActionInput('PARKOUR_ACTION_CLIMB',{}))).inputPass);
  const before=await page.evaluate(()=>({p:s.pos.toArray(),v:s.vel.toArray(),a:currentAnim,hip:model.getObjectByName('mixamorigHips').position.toArray()}));
  const contacts=await page.evaluate(()=>forspokenContactProbe());
  assert(contacts.available);assert.equal(contacts.feet.length,2);assert(!contacts.appliedToRig);assert(!contacts.originalProbeSelection);
  assert(contacts.feet.every(f=>f.query.valid&&f.hit.found));
  assert.deepEqual(await page.evaluate(()=>({p:s.pos.toArray(),v:s.vel.toArray(),a:currentAnim,hip:model.getObjectByName('mixamorigHips').position.toArray()})),before);
  // Use actual rendered scene/physics targets at different actor yaws and altitude.
  const rotations=await page.evaluate(()=>{
   const rows=[],old={p:s.pos.clone(),yaw:s.yaw};
   const fixture=new THREE.Mesh(new THREE.BoxGeometry(12,2,12),new THREE.MeshStandardMaterial({color:0x264754}));
   fixture.name='Contact query validation roof';fixture.position.set(15,1,15);scene.add(fixture);walkables.push(fixture);fixture.updateMatrixWorld(true);
   for(const yaw of [0,Math.PI/2,-Math.PI/3,Math.PI]){
    s.pos.set(15,2.42,15);s.yaw=yaw;characterRoot.position.copy(s.pos);characterRoot.rotation.y=yaw;characterRoot.updateMatrixWorld(true);
    const probe=forspokenContactProbe();rows.push(probe);
   }
   walkables.splice(walkables.indexOf(fixture),1);scene.remove(fixture);fixture.geometry.dispose();fixture.material.dispose();
   s.pos.copy(old.p);s.yaw=old.yaw;characterRoot.position.copy(s.pos);characterRoot.rotation.y=s.yaw;characterRoot.updateMatrixWorld(true);return rows;
  });
  for(const row of rotations)for(const foot of row.feet){assert(foot.hit.found);assert(Math.abs(foot.hit.worldPoint[1]-2)<.0001);assert(foot.hit.normal[2]>.99);}
  // Actual keyboard flow remains active while diagnostics stay read-only.
  await page.keyboard.down('w');await page.keyboard.down('Shift');await page.evaluate(()=>{for(let i=0;i<20;i++)tickFrame(1/60,false)});
  await page.keyboard.press('Space');await page.evaluate(()=>{for(let i=0;i<8;i++)tickFrame(1/60,false)});
  const jump=await page.evaluate(()=>({flow:backspoolFlowState(),pos:s.pos.toArray(),animation:currentAnim}));
  assert(jump.flow.flipCount>0);assert(jump.pos[1]>.42);
  await page.keyboard.up('w');await page.keyboard.up('Shift');
  await page.evaluate(()=>{for(let i=0;i<110;i++)tickFrame(1/60,false);updateHUD(true,0);renderer.render(scene,camera)});
  await page.screenshot({path:out+'/desktop-gameplay.png'});
  await page.locator('#backspoolLibrary').click();await page.locator('#backspoolControllerEvidence').click();
  await page.waitForFunction(()=>document.getElementById('backspoolControllerEvidenceResult').textContent.includes('94 action records'));
  assert((await page.locator('#backspoolControllerEvidenceResult').textContent()).includes('full controller and biped IK are incomplete'));
  await page.screenshot({path:out+'/desktop-evidence.png'});
  for(const [name,width,height] of [['portrait',390,844],['landscape',844,390]]){
   await page.setViewportSize({width,height});await page.locator('#backspoolControllerEvidenceResult').scrollIntoViewIfNeeded();
   await page.evaluate(()=>renderer.render(scene,camera));
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.screenshot({path:out+'/'+name+'-evidence.png'});
  }
  const native=await page.evaluate(()=>forspokenNativeState());assert(!native.completeOriginalIK);assert(!native.completeOriginalController);assert(!native.kernelsAppliedToRig);assert(native.contactQueriesAvailable);
  assert.deepEqual(errors,[]);
  fs.writeFileSync(out+'/browser-results.json',JSON.stringify({inventory:{actions:94,abilities:39,conditions:24},contacts,rotations,jump,native,errors,sourceRequests:requests.length},null,2));
  console.log('PASS lazy/hash-checked original controller evidence, native timed input evaluation, scene contact probes at four headings, non-mutating diagnostics, actual keyboard flip and responsive evidence UI; no page errors');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
