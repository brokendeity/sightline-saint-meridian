// V02 copy of scripts/test_backspool_roll_physics.cjs, pointed at the live module scripts/game_backspool_flow_v02.js (see development/vertical-city-v02/V02_MODULE_DRIFT.md).
// The original test is left unchanged: it tests the frozen pre-V02 ancestor of the module.
// Pass 1: window = {} (Threadrail absent), the retained factory assertions.
// Pass 2 (spawned at the end, V02_THREADRAIL=1): window.threadrailGame is set, as in every V02 build.
const V02_THREADRAIL=process.env.V02_THREADRAIL==='1';globalThis.window=V02_THREADRAIL?{threadrailGame:{}}:{};
const assert=require('assert/strict'),{create}=require('./game_backspool_flow_v02.js');
function setup(support=()=>.42,clear=()=>true){const f={hero:'backspool',active:true,grounded:true,position:{x:0,y:.42,z:0},velocity:{x:0,y:0,z:0},direction:{x:0,z:-1},facingYaw:0};const c=create({supportAt:support,sweepClear:clear});return{f,c,step(n){const rows=[];for(let i=0;i<n;i++){const r=c.update(1/60,f);if(r.ownsMovement){f.position=r.position;f.velocity=r.velocity;f.grounded=r.landed;}rows.push({...r});}return rows}}}
let t=setup();assert(t.c.evade(t.f,{role:'groundRoll',duration:1.45/1.2}));let rows=t.step(74);assert(rows.slice(0,72).every(r=>r.ownsMovement&&r.landed&&Math.abs(r.position.y-.42)<1e-8));assert.equal(t.c.active(),false);assert(t.f.position.z<-3&&t.f.position.z>-7);assert(rows.some(r=>r.time>.04&&r.time<.22&&r.invulnerable));assert(rows.every(r=>!r.invulnerable||r.time>=.04&&r.time<.22));console.log('PASS grounded roll completes source recovery without launching; timed defense remains bounded');
t=setup();assert(t.c.evade(t.f));t.step(3);t.f.retracing=true;t.step(1);assert.equal(t.c.active(),false);assert.equal(t.c.state().reason,'INELIGIBLE');console.log('PASS replay ownership interrupts tumble');
t=setup(p=>p.z<-1?-.8:.42);assert(t.c.evade(t.f));t.step(20);assert.equal(t.c.active(),false);assert.equal(t.c.state().reason,'ROLL LOST SUPPORT');assert(t.f.position.z>=-1);console.log('PASS roll refuses unsupported drop');
t=setup(()=>.42,(a,b)=>b.z>-.8);assert(t.c.evade(t.f));rows=t.step(10);assert(rows.some(r=>r.blocked));assert(t.f.position.z>-.8);console.log('PASS roll cannot tunnel through obstruction');
t=setup();t.f.grounded=false;t.f.position.y=8;assert(t.c.evade(t.f,{role:'rollLeft'}));rows=t.step(2);assert.equal(rows[0].rollRole,'rollLeft');assert(!rows[0].landed);console.log('PASS airborne roll keeps directional role and air physics');

if(!V02_THREADRAIL){const r=require('child_process').spawnSync(process.execPath,[__filename],{env:{...process.env,V02_THREADRAIL:'1'},encoding:'utf8'});process.stdout.write(r.stdout.replace(/^(?=.)/gm,'[threadrail present] '));process.stderr.write(r.stderr);if(r.status!==0)process.exit(r.status||1);}
