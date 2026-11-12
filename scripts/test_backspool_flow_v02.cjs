// V02 copy of scripts/test_backspool_flow.cjs, pointed at the live module scripts/game_backspool_flow_v02.js (see development/vertical-city-v02/V02_MODULE_DRIFT.md).
// The original test is left unchanged: it tests the frozen pre-V02 ancestor of the module.
// Pass 1: window = {} (Threadrail absent), the retained factory assertions.
// Pass 2 (spawned at the end, V02_THREADRAIL=1): window.threadrailGame is set, as in every V02 build.
const V02_THREADRAIL=process.env.V02_THREADRAIL==='1';globalThis.window=V02_THREADRAIL?{threadrailGame:{}}:{};
const assert=require('assert/strict'),{create}=require('./game_backspool_flow_v02.js');
const base=()=>({hero:'backspool',active:true,blocked:false,retracing:false,preview:false,defeated:false,posture:false,grounded:true,position:{x:0,y:.42,z:0},velocity:{x:0,y:0,z:0},direction:{x:0,z:-1},jumpHeld:false});
function setup(blocked=false){const c=create({sweepClear:()=>!blocked,supportAt:()=>.42}),f=base();return {c,f,step(n=1){let r;for(let i=0;i<n;i++){r=c.update(1/60,f);if(r.ownsMovement){f.position=r.position;f.velocity=r.velocity;f.grounded=r.landed;}}return r;}}}
let t=setup();assert(t.c.dash(t.f));t.step(20);assert(t.f.position.z<-3);assert.equal(t.c.state().action,null);console.log('PASS ground dash timeline');
t=setup();t.f.grounded=false;t.f.position.y=15;assert(t.c.dash(t.f));t.step(25);assert.equal(t.c.state().airDash,0);assert(!t.c.dash(t.f));t.c.refresh();assert.equal(t.c.state().airDash,1);assert(t.c.scale(t.f));t.step(30);assert.equal(t.c.state().airLift,0);assert(!t.c.scale(t.f));console.log('PASS bounded air dash and Scale, wall refresh');
t=setup(true);assert(t.c.dash(t.f));assert(t.step().blocked);assert.equal(t.f.position.z,0);console.log('PASS swept blockage, no tunnelling');
t=setup();assert(t.c.skip(t.f));assert(t.c.invulnerable());t.f.jumpHeld=true;t.step(30);assert(t.f.position.y>2);t.f.releaseSkip=true;t.step();assert.equal(t.c.active(),false);console.log('PASS Skip navigation and explicit exit');
if(V02_THREADRAIL){t=setup();assert(t.c.setCharge(true,t.f));t.step(30);assert(t.c.state().charge>.4);assert(t.c.evade(t.f));t.step(26);assert(!t.c.evade(t.f));assert.notEqual(t.c.state().action,'teleport');console.log('PASS V02 gate: no roll teleport while Threadrail is present');}
else{t=setup();assert(t.c.setCharge(true,t.f));t.step(30);assert(t.c.state().charge>.4);assert(t.c.evade(t.f));t.step(26);assert(t.c.evade(t.f));assert.equal(t.c.state().action,'teleport');console.log('PASS charge -> aerial roll -> teleport chain');}
t=setup();t.f.water=true;t.step();t.f.water=false;t.f.grounded=false;t.f.position.y=2;t.f.velocity.y=8;t.step();assert.equal(t.c.state().waterHop,1);assert(t.c.secondWaterJump(t.f));assert.equal(t.c.state().waterHop,0);console.log('PASS water double jump once per exit');
t=setup();assert(t.c.rebound(t.f,{x:1,z:0},true));assert.equal(t.c.state().action,'treeFlip');t.step(40);assert(t.c.switchMove(t.f,'counter'));assert.equal(t.c.state().action,'switchSlide');t.f.defeated=true;t.step();assert(!t.c.active());console.log('PASS tree flip, switch slide and defeat cleanup');
t=setup();t.step();t.f.grounded=false;t.f.velocity.y=9;t.f.jumpHeld=true;t.step();assert.equal(t.c.jumpGravity(t.f),.5);t.f.jumpHeld=false;assert.equal(t.c.jumpGravity(t.f),1);console.log('PASS held jump ascent physics');

t=setup();t.f.grounded=false;t.f.position.y=15;assert(t.c.dash(t.f));t.step(25);const spent=t.c.state().airDash;t.c.reset('HERO CHANGE');assert.equal(t.c.state().airDash,spent);console.log('PASS hero switching does not refill spent air dash');
let releases=0;const charge=create({sweepClear:()=>true,supportAt:()=>.42,release:()=>releases++}),f=base();assert(charge.setCharge(true,f));charge.update(.1,f);assert(charge.dash(f));assert(charge.setCharge(false,f));assert(!charge.active());assert.equal(releases,1);assert(!charge.setCharge(false,f));assert.equal(releases,1);console.log('PASS charge-release cancels dash exactly once');

if(!V02_THREADRAIL){const r=require('child_process').spawnSync(process.execPath,[__filename],{env:{...process.env,V02_THREADRAIL:'1'},encoding:'utf8'});process.stdout.write(r.stdout.replace(/^(?=.)/gm,'[threadrail present] '));process.stderr.write(r.stderr);if(r.status!==0)process.exit(r.status||1);}
