// Run the installed skill client unchanged, selecting the tested Metal backend.
const skill='/Users/richardmpayi/.codex/skills/develop-web-game/scripts/web_game_playwright_client.js';
const {createRequire}=require('node:module');
const {chromium}=createRequire(skill)('playwright');
const launch=chromium.launch.bind(chromium);
chromium.launch=options=>{console.log('Skill client backend: ANGLE Metal');return launch({...options,args:[...(options.args||[]).filter(x=>!x.startsWith('--use-angle=')),'--use-angle=metal']}).then(browser=>{const newPage=browser.newPage.bind(browser);browser.newPage=async(...args)=>{const p=await newPage(...args),click=p.click.bind(p);p.click=async(selector,options)=>{if(selector==='#v02Start'&&(p.url().includes('VISUAL_CANDIDATE')||p.url().includes('HUD_CANDIDATE')||p.url().includes('ARCHITECTURE_FINISH')))await p.waitForFunction(()=>window.verticalAppearanceState?.().ready,null,{timeout:120000});if(selector==='#v02Start')await p.waitForFunction(()=>typeof gameReady!=='undefined'&&gameReady&&window.characterState&&!characterState().busy&&characterState().active==='backspool',null,{timeout:120000});return click(selector,selector==='#v02Start'?{...options,timeout:120000}:options)};return p};return browser});};
import('file://'+skill);
