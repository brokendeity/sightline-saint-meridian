// V02 copy of scripts/test_threadrail_foundation.cjs, pointed at the live module scripts/game_backspool_advanced_v02.js (see development/vertical-city-v02/V02_MODULE_DRIFT.md).
// The original test is left unchanged: it tests the frozen pre-V02 ancestor of the module.
// Pass 1: window = {} (Threadrail absent), the retained factory assertions.
// Pass 2 (spawned at the end, V02_THREADRAIL=1): window.threadrailGame is set, as in every V02 build.
const V02_THREADRAIL=process.env.V02_THREADRAIL==='1';globalThis.window=V02_THREADRAIL?{threadrailGame:{}}:{};
const assert=require('assert/strict');
let create;try{create=require('./game_movement_coordinator').create}catch{}assert.equal(typeof create,'function','Movement coordinator missing');
let p={x:0,y:0,z:0};const c=create({read:()=>({...p}),write:q=>{p={...q}},clear:()=>true});c.begin();assert(c.commit('rail',{x:1,y:0,z:0}));assert(!c.commit('flow',{x:2,y:0,z:0}));assert.equal(p.x,1);assert.equal(c.state().owner,'rail');c.begin();assert(!c.commit('ordinary',{x:NaN,y:0,z:0}));assert.equal(p.x,1);console.log('PASS exclusive movement owner and finite coordinates');
const {create:advanced}=require('./game_backspool_advanced_v02.js');const a=advanced({sweepClear:()=>true,supportAt:()=>.42,wallValid:()=>true,wallContact:()=>true}),f={hero:'backspool',active:true,sprint:true,grounded:false,position:{x:0,y:1,z:.9},velocity:{x:5,y:1,z:-3},direction:{x:1,y:0,z:-.6}};assert(a.startWall(f,{position:{x:0,y:1,z:.62},normal:{x:0,y:0,z:1},top:10}));const r=a.update(.05,f);assert(Math.hypot(r.velocity.x,r.velocity.y,r.velocity.z)>1,'Wall approach still stops momentum');console.log('PASS wall approach preserves entry motion');

if(!V02_THREADRAIL){const r=require('child_process').spawnSync(process.execPath,[__filename],{env:{...process.env,V02_THREADRAIL:'1'},encoding:'utf8'});process.stdout.write(r.stdout.replace(/^(?=.)/gm,'[threadrail present] '));process.stderr.write(r.stderr);if(r.status!==0)process.exit(r.status||1);}
