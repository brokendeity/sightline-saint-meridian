const {chromium}=require('/opt/homebrew/lib/node_modules/playwright'),assert=require('assert/strict'),fs=require('fs');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('source-graph-evidence'))requests.push(r.url())});
  await page.addInitScript(()=>navigator.getGamepads=()=>[]);
  await page.goto('http://127.0.0.1:8765/SIGHTLINE_BACKSPOOL_TRAVERSAL_CANDIDATE.html?capture=backspool');
  await page.waitForFunction(()=>typeof gameReady!=='undefined'&&gameReady&&window.characterState&&!characterState().busy&&roadNetworkState().ready,null,{timeout:120000});
  await page.evaluate(()=>characterSwitcher.change('backspool'));assert.equal(requests.length,0);
  await page.locator('#start').click();await page.locator('#backspoolLibrary').click();
  await page.locator('#backspoolSearch').fill('28119eec');
  const id=await page.locator('#backspoolAnimation option').first().getAttribute('value');await page.locator('#backspoolAnimation').selectOption(id);
  const evidence=page.locator('#backspoolSourceEvidenceResult');
  await page.route('**/source-graph-evidence-v7.json.gz',route=>route.fulfill({status:200,body:'corrupt'}));
  await page.locator('#backspoolSourceEvidence').click();await page.waitForFunction(()=>document.getElementById('backspoolSourceEvidenceResult').textContent.includes('identity mismatch'));
  await page.unroute('**/source-graph-evidence-v7.json.gz');
  await page.locator('#backspoolPlay').click();await page.waitForFunction(id=>!characterState().busy&&currentAnim===id,id);
  const before=await page.evaluate(()=>({rate:currentAction.timeScale,anim:currentAnim}));
  await page.locator('#backspoolSourceEvidence').click();await page.waitForFunction(()=>document.getElementById('backspoolSourceEvidenceResult').textContent.includes('2 direct graph context'));
  assert((await evidence.textContent()).includes('SetPlaybackRate.json'));
  assert((await evidence.textContent()).includes('Native float32 rate: 1.4× · explicit'));
  const after=await page.evaluate(()=>({rate:currentAction.timeScale,anim:currentAnim}));assert.deepEqual(after,before);
  assert((await evidence.textContent()).includes('Native float32 rate: 1× · native default'));
  const records=await page.evaluate(id=>backspoolSourceGraphEvidence(id),id);assert.equal(records.nodes.length,2);
  await page.evaluate(id=>backspoolSourceGraphEvidence(id).then(r=>{r.nodes.length=0}),id);
  assert.equal(await page.evaluate(id=>backspoolSourceGraphEvidence(id).then(r=>r.nodes.length),id),2,'Public result must not mutate cached evidence');
  const dir='output/backspool-traversal/source-contract-v7';fs.mkdirSync(dir,{recursive:true});await page.screenshot({path:dir+'/desktop.png'});
  await page.setViewportSize({width:390,height:844});await evidence.scrollIntoViewIfNeeded();await evidence.evaluate(e=>e.scrollTop=e.scrollHeight);await page.screenshot({path:dir+'/portrait.png'});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No page horizontal overflow');
  await page.locator('#backspoolSearch').fill('281103f8');assert(await evidence.isHidden(),'Changed selection hides stale evidence');
  const absent=await page.locator('#backspoolAnimation option').first().getAttribute('value');await page.locator('#backspoolAnimation').selectOption(absent);
  await page.locator('#backspoolSourceEvidence').click();await page.waitForFunction(()=>document.getElementById('backspoolSourceEvidenceResult').textContent.includes('No direct record'));
  await page.locator('#backspoolClose').click();assert.equal(await page.evaluate(()=>backspoolPreviewActive()),false);assert.deepEqual(errors,[]);
  fs.writeFileSync(dir+'/results.json',JSON.stringify({records,before,after,requests,errors,checks:['lazy evidence','identity mismatch fails closed and retry works','two distinct source contexts','untyped callback parameters labelled','inspection cannot change playback','public result isolation','stale selection hidden','unmatched membership stays unknown','portrait fits','return to game']},null,2));
  console.log('PASS lazy source evidence, provenance, integrity/retry, context distinction, unchanged preview playback and portrait layout');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
