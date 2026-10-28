/* Test-only preload; preserve the existing controls and retained test sources.
 * Wait for actual new assets before normal-input sequences begin. */
const fs=require('fs'),crypto=require('crypto'),assert=require('assert/strict');
const id=crypto.createHash('sha256').update(fs.readFileSync(__filename)).digest('hex');
const required=()=>[process.env.V02_ROUTE_BUILD,process.env.V02_GAMEPLAY_BUILD].some(x=>x==='V02_Facade_Cassettes_Build.json');
async function ready(p){if(!required())return;await p.waitForFunction(()=>window.v02FacadeCassettesState&&(v02FacadeCassettesState().ready||v02FacadeCassettesState().error),null,{timeout:120000});const state=await p.evaluate(()=>v02FacadeCassettesState());assert(state.ready&&!state.error,'Cassette asset failure '+JSON.stringify(state));return state;}
const route=require('./station_route_environment.cjs'),oldLoad=route.load,oldReady=route.ready;
route.load=function(){const env=oldLoad();if(required())env.evidence={...env.evidence,testReadinessAdapterSHA256:id,requiredAssetAPI:'v02FacadeCassettesState.ready'};return env;};
route.ready=async function(p,env){await oldReady(p,env);await ready(p);};
const market=require('./market_test_helpers.cjs'),oldWait=market.waitForCurrentBuild,oldOpen=market.openMarket;
market.waitForCurrentBuild=async function(p){await oldWait(p);await ready(p);};
market.openMarket=async function(report,...rest){const h=await oldOpen(report,...rest);const state=await ready(h.p);if(required())report.cassetteReadiness={adapterSHA256:id,state,scope:'Fully loaded before the actual input sequence; original helper initial fixture precedes this guard'};return h;};
