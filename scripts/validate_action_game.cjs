const {chromium}=require('/opt/homebrew/lib/node_modules/playwright');
const fs=require('fs'),path=require('path');
(async()=>{
 const out='output/action-v2';fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal','--disable-web-security']});
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
 page.on('pageerror',e=>{errors.push(String(e));console.log('PAGEERROR',String(e));});
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('http://127.0.0.1:8765/SIGHTLINE_ACTION_V2_CANDIDATE.html',{waitUntil:'domcontentloaded',timeout:60000});
 try{
  await page.waitForFunction(()=>window.render_game_to_text&&gameReady&&window.roadNetworkState?.().ready,{timeout:120000});
  console.log('READY');
  const result=await page.evaluate(fs.readFileSync('output/action-v2/combat-tests.js','utf8'));
  fs.writeFileSync(path.join(out,'combat-results.json'),JSON.stringify(result,null,2));console.log('COMBAT',result.passed,result.total,result.checks.filter(x=>!x.pass));
  await page.evaluate(()=>{gameActive=true;menu.style.display='none';hud.style.display='block';backspoolCombat.reset();backspoolCombat.applyStyle('flow');s.pos.set(0,.42,0);s.onGround=true;s.mode=P.GROUND;updateCharacter(0,0,0);updateCamera(.3);renderNight(.016);});
  await page.screenshot({path:path.join(out,'desktop.png')});
  const extra=process.argv[2];if(extra){const result=await page.evaluate(fs.readFileSync(extra,'utf8'));fs.writeFileSync(path.join(out,path.basename(extra).replace('.js','-results.json')),JSON.stringify(result,null,2));console.log('INTEGRATION',JSON.stringify(result).slice(0,1000));}
 }catch(error){errors.push(String(error));console.log('TESTERROR',String(error));await page.screenshot({path:path.join(out,'error.png')});}
 fs.writeFileSync(path.join(out,'console-errors.json'),JSON.stringify(errors,null,2));
 await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1;});
