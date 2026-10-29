/* Current assets + actual bound module identities, without changing old tests. */
require('./slender_test_readiness.cjs');
const market=require('./market_test_helpers.cjs'),fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../..'),build=JSON.parse(fs.readFileSync(path.join(root,'development/vertical-city-v02',process.env.V02_GAMEPLAY_BUILD||'V02_Civilian_Clearance_Build.json')));
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex');
const open=market.openMarket;
market.openMarket=async function(report,...args){const h=await open(report,...args);assert.equal(sha(build.entry),build.entrySHA256);
 report.retainedSourceMarketSHA256=report.marketSHA256;report.marketSHA256=sha(build.marketScript);report.worldLifeSHA256=sha(build.worldLifeScript);
 assert.equal(report.marketSHA256,build.marketScriptSHA256);assert.equal(report.worldLifeSHA256,build.worldLifeScriptSHA256);
 const tags=await h.p.evaluate(()=>Array.from(document.scripts,s=>s.getAttribute('src')).filter(Boolean));
 for(const field of ['marketScript','worldLifeScript'])assert(tags.some(tag=>tag.split('?')[0]===build[field]),'Missing actual bound module '+field);
 report.civilianReadiness={adapterSHA256:sha(path.relative(root,__filename)),entrySHA256:build.entrySHA256,marketModule:build.marketScript,worldLifeModule:build.worldLifeScript};
 return h;
};
