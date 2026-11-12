/* Smoke check for a build made from the canonical source (scripts/build_v02.py): it loads, the district starts by a real
   menu click, each hero is chosen through the real Hero tab, and 240 frames run per hero with a little pad input
   (walk, jump), with no page errors. It does NOT replace the gameplay suites; it proves the assembled page boots.
   Usage: node scripts/vertical-v02/test_canonical_smoke.cjs [V02_Canonical_Build.json] */
const{chromium}=require('/opt/homebrew/lib/node_modules/playwright'),assert=require('assert/strict'),fs=require('fs'),crypto=require('crypto');
const D='development/vertical-city-v02/',build=JSON.parse(fs.readFileSync(D+(process.argv[2]||process.env.V02_ACTION_BUILD||'V02_Canonical_Build.json')));
const OUT=D+'evidence/canonical-source';fs.mkdirSync(OUT,{recursive:true});
(async()=>{const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal','--mute-audio']}),errors=[],result={build:build.entry,entrySHA256:build.entrySHA256,checks:{},heroes:{}};
 try{
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(build.entry)).digest('hex'),build.entrySHA256,'build file does not match its record');
  const p=await browser.newPage({viewport:{width:1280,height:800}});p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(()=>{const up={pressed:false,value:0};window.testPad={id:'test pad',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>up)};navigator.getGamepads=()=>[window.testPad];});
  const t0=Date.now();await p.goto('http://127.0.0.1:8766/'+build.entry+'?capture=backspool');
  await p.waitForFunction(()=>typeof gameReady!=='undefined'&&gameReady&&window.characterState&&!characterState().busy&&roadNetworkState().ready,null,{timeout:300000});
  await p.waitForFunction(()=>verticalWorldLifeState().ready&&v02EastPublicLightingState().ready&&v02RimShadowState().ready,null,{timeout:120000});
  result.loadSeconds=+((Date.now()-t0)/1000).toFixed(1);
  await p.locator('#v02Start').click();await p.evaluate(()=>{window.requestAnimationFrame=()=>0});
  const modules=await p.evaluate(()=>({closeCamera:!!window.v02CloseCamera,flightCeiling:!!window.v02FlightCeiling,gameplayFixes:!!window.v02GameplayFixes,bodyFraming:!!window.v02BodyFramingState,menuStyle:!!document.querySelector('#v02Tab-hero')}));result.modules=modules;
  for(const hero of ['backspool','sightline','loadout']){
   if(await p.evaluate(()=>characterState().hero)!==hero){
    await p.evaluate(()=>{window.requestAnimationFrame=cb=>setTimeout(()=>cb(performance.now()),16)});if(await p.evaluate(()=>gameActive))await p.keyboard.press('Escape');await p.waitForTimeout(250);
    await p.click('#v02Tab-hero');await p.selectOption('#characterChoice',hero);await p.waitForFunction(h=>characterState().hero===h&&!characterState().busy,hero,{timeout:300000});
    await p.click('#v02Tab-overview');await p.locator('#start').click();await p.evaluate(()=>{window.requestAnimationFrame=()=>0});}
   result.heroes[hero]=await p.evaluate(()=>{const set=(b,a)=>{testPad.buttons=testPad.buttons.map((x,i)=>b.includes(i)?{pressed:true,value:1}:{pressed:false,value:0});testPad.axes=a;};
    const start=s.pos.clone();let nan=false;set([],[0,-1,0,0]);for(let i=0;i<120;i++){tickFrame(1/60,false);if(![s.pos.x,s.pos.y,s.pos.z].every(Number.isFinite))nan=true;}
    set([0],[0,-1,0,0]);for(let i=0;i<3;i++)tickFrame(1/60,false);set([],[0,0,0,0]);for(let i=0;i<117;i++){tickFrame(1/60,false);if(![s.pos.x,s.pos.y,s.pos.z].every(Number.isFinite))nan=true;}
    renderNight(0);return{hero:characterState().hero,active:gameActive,moved:+s.pos.distanceTo(start).toFixed(2),nan,mode:s.mode,fov:+camera.fov.toFixed(1)};});
   await p.screenshot({path:OUT+'/smoke-'+hero+'.png'});
  }
  result.checks.recordMatchesFile=true;
  result.checks.v02ModulesLoaded=Object.values(modules).every(Boolean);
  result.checks.everyHeroRunsAndMoves=['backspool','sightline','loadout'].every(h=>result.heroes[h].hero===h&&result.heroes[h].active&&result.heroes[h].moved>1&&!result.heroes[h].nan);
  result.checks.noPageErrors=errors.length===0;
 }catch(e){result.failure=e.stack;}
 result.errors=errors;result.pass=!result.failure&&Object.values(result.checks).every(Boolean);
 fs.writeFileSync(OUT+'/smoke.json',JSON.stringify(result,null,2)+'\n');for(const[k,v]of Object.entries(result.checks))console.log((v?'PASS ':'FAIL ')+k);if(result.failure)console.log(result.failure);
 await browser.close();assert.ok(result.pass,'canonical smoke failed');})().catch(e=>{console.error(e);process.exit(1);});
