// The installed develop-web-game client stays unchanged. This local adapter
// selects the native Metal backend and waits for the full variant's assets.
const skill='/Users/richardmpayi/.codex/skills/develop-web-game/scripts/web_game_playwright_client.js';
const {createRequire}=require('node:module');
const {chromium}=createRequire(skill)('playwright');
const launch=chromium.launch.bind(chromium);
chromium.launch=async options=>{
 const browser=await launch({...options,args:[...(options.args||[]).filter(x=>!x.startsWith('--use-angle=')),'--use-angle=metal']});
 const newPage=browser.newPage.bind(browser);
 browser.newPage=async(...args)=>{
  const page=await newPage(...args),click=page.click.bind(page);
  page.click=async(selector,options)=>{
   if(selector==='#v02Start')await page.waitForFunction(()=>
    gameReady&&roadNetworkState().ready&&verticalDistrictState().ready&&
    verticalWorldLifeState().ready&&verticalDiffuseLightingState().ready&&
    v02FacadeCassettesState().ready&&v02EastPublicLightingState().ready&&window.v02RimShadowState?.().ready&&!v02RimShadowState().error&&
    characterState().active==='backspool'&&!characterState().busy,
    null,{timeout:120000});
   return click(selector,selector==='#v02Start'?{...options,timeout:120000}:options);
  };
  return page;
 };
 return browser;
};
import('file://'+skill);
