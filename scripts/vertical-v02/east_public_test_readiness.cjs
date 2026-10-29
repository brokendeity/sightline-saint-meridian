/* Test-only readiness for this full-game variant; retained input tests stay unchanged. */
const fs=require('fs'),crypto=require('crypto'),assert=require('assert/strict');
const id=crypto.createHash('sha256').update(fs.readFileSync(__filename)).digest('hex');
async function ready(page){
 await page.waitForFunction(()=>window.v02EastPublicLightingState&&window.v02FacadeCassettesState&&
  (v02EastPublicLightingState().error||v02EastPublicLightingState().ready&&v02FacadeCassettesState().ready&&
   verticalWorldLifeState().ready),null,{timeout:120000});
 const state=await page.evaluate(()=>({lighting:v02EastPublicLightingState(),cassettes:v02FacadeCassettesState(),world:verticalWorldLifeState()}));
 assert(state.lighting.ready&&!state.lighting.error);assert(state.cassettes.ready&&!state.cassettes.error);
 assert.equal(state.world.error,null);assert.equal(state.world.visitors,11);return state;
}
const route=require('./station_route_environment.cjs'),oldLoad=route.load,oldReady=route.ready;
route.load=function(){const env=oldLoad();env.evidence={...env.evidence,testReadinessAdapterSHA256:id,
 requiredAssetAPI:'v02EastPublicLightingState.ready + v02FacadeCassettesState.ready + eleven visitors'};return env;};
route.ready=async function(page,env){await oldReady(page,env);await ready(page);};
const market=require('./market_test_helpers.cjs'),oldWait=market.waitForCurrentBuild,oldOpen=market.openMarket;
market.waitForCurrentBuild=async function(page){await oldWait(page);await ready(page);};
market.openMarket=async function(report,...rest){const h=await oldOpen(report,...rest);
 report.eastPublicReadiness={adapterSHA256:id,state:await ready(h.p),scope:'Current assets ready before normal input; retained helper initial fixture only'};return h;};
