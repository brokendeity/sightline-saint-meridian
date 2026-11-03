require('./civilian_test_readiness.cjs');
const {chromium}=require('/opt/homebrew/lib/node_modules/playwright'),market=require('./market_test_helpers.cjs'),fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../..'),build=JSON.parse(fs.readFileSync(path.join(root,'development/vertical-city-v02',process.env.V02_GAMEPLAY_BUILD||'V02_Friendly_Contacts_Build.json'))),sha=f=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex');
if(process.env.V02_CONTACT_TOUCH==='1'){
 const launch=chromium.launch.bind(chromium);chromium.launch=async(...args)=>{const browser=await launch(...args),newPage=browser.newPage.bind(browser);browser.newPage=options=>newPage({...options,hasTouch:true,isMobile:true});return browser;};
}
const open=market.openMarket;market.openMarket=async function(report,...args){const h=await open(report,...args);
 await h.p.waitForFunction(()=>window.v02FriendlyContactState?.().ready,null,{timeout:120000});
 const tags=await h.p.evaluate(()=>Array.from(document.scripts,s=>s.getAttribute('src')).filter(Boolean));
 for(const key of ['friendlyCore','friendlyScript']){assert.equal(sha(build[key]),build[key+'SHA256']);assert(tags.some(s=>s.split('?')[0]===build[key]));}
 report.executingTestSHA256=sha(path.relative(root,path.resolve(process.argv[1])));
 report.friendlyReadiness={entrySHA256:build.entrySHA256,coreSHA256:build.friendlyCoreSHA256,runtimeSHA256:build.friendlyScriptSHA256,initial:await h.p.evaluate(()=>v02FriendlyContactState()),adapterSHA256:sha(path.relative(root,__filename)),touchEmulated:process.env.V02_CONTACT_TOUCH==='1'};return h;
};
