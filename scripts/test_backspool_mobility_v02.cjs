// V02 copy of scripts/test_backspool_mobility.cjs, pointed at the live module scripts/game_backspool_flow_v02.js (see development/vertical-city-v02/V02_MODULE_DRIFT.md).
// The original test is left unchanged: it tests the frozen pre-V02 ancestor of the module.
// Pass 1: window = {} (Threadrail absent), the retained factory assertions.
// Pass 2 (spawned at the end, V02_THREADRAIL=1): window.threadrailGame is set, as in every V02 build.
const V02_THREADRAIL=process.env.V02_THREADRAIL==='1';globalThis.window=V02_THREADRAIL?{threadrailGame:{}}:{};
const assert=require('assert/strict'),{create}=require('./game_backspool_flow_v02.js');
const base=()=>({hero:'backspool',active:true,grounded:true,position:{x:0,y:.42,z:0},velocity:{x:0,y:0,z:-12},direction:{x:0,z:-1},facingYaw:0});
for(const kind of ['frontFlip','backFlip','sideFlipLeft','sideFlipRight','twistFlip','gapFlip','obstacleFlip']){const f=base(),c=create({sweepClear:()=>true,supportAt:()=>.42});assert(c.flip(f,kind,{duration:1.25}));f.grounded=false;let maxY=0,result;for(let i=0;i<75;i++){result=c.update(1/60,f);if(result.ownsMovement){Object.assign(f,{position:result.position,velocity:result.velocity,grounded:result.landed});maxY=Math.max(maxY,f.position.y);}}assert(result.landed);assert(Math.abs(f.position.y-.42)<1e-7);assert(maxY>4);assert.equal(result.facingYaw,0);assert.equal(c.invulnerable(),false);assert.equal(c.active(),false);}
console.log('PASS seven acrobatic arcs land safely without invulnerability');
{const f=base(),c=create({sweepClear:()=>true,supportAt:()=>.42});assert(c.flip(f,'frontFlip',{duration:1.25}));f.grounded=false;for(let i=0;i<75;i++){const r=c.update(1/60,f);Object.assign(f,{position:r.position,velocity:r.velocity,grounded:r.landed});}assert.equal(c.state().cooldown,0);assert(c.flip(f,'twistFlip',{duration:1.2}));const before={...f.position},r=c.update(0,f);assert.deepEqual(r.position,before);assert(r.velocity.y>0);}
console.log('PASS supported landing admits continuation; zero-step handoff preserves position');
for(const reason of ['ceiling','landing','stagger','hero','airborne']){const f=base(),c=create({sweepClear:(a,b)=>reason!=='ceiling'||b.y<2,supportAt:()=>reason==='landing'?-10:.42});if(reason==='stagger')f.blocked=true;if(reason==='hero')f.hero='sightline';if(reason==='airborne')f.grounded=false;assert.equal(c.flip(f),false);assert.equal(c.active(),false);}
console.log('PASS blocked headspace, absent landing and ownership gates reject flips');
{let clear=true;const f=base(),c=create({sweepClear:()=>clear,supportAt:()=>.42});assert(c.flip(f));f.grounded=false;let r=c.update(.1,f);f.position=r.position;f.velocity=r.velocity;clear=false;r=c.update(.1,f);assert(r.blocked);assert.equal(c.active(),false);assert.deepEqual(r.position,f.position);}
console.log('PASS changed obstacle interrupts arc without tunnelling');
const{create:traversal}=require('./game_backspool_traversal.js');
{const f={...base(),sprint:true,canJump:true,direction:{x:0,z:-1},velocity:{x:0,y:0,z:-12}},c=traversal({probeObstacle:()=>({vault:true,end:{x:0,y:.42,z:-2},crestY:1.5,points:[f.position,{x:0,y:1.5,z:0},{x:0,y:1.5,z:-2},{x:0,y:.42,z:-2}]}),sweepClear:()=>true,supportAt:()=>.42});assert(c.requestObstacle(f));let r;for(let i=0;i<100;i++){r=c.update(1/60,f);if(r.ownsMovement)f.position=r.position;}assert(r.landed);assert.equal(r.velocity.z,-12);assert.equal(c.state().speed,12);}
console.log('PASS obstacle exits preserve incoming momentum');
{const f={...base(),walk:true,direction:{x:0,z:-1}},c=traversal();let r;for(let i=0;i<60;i++)r=c.update(1/60,f);assert(Math.abs(r.velocity.z+1.65)<.001);}
console.log('PASS explicit walking speed');

if(!V02_THREADRAIL){const r=require('child_process').spawnSync(process.execPath,[__filename],{env:{...process.env,V02_THREADRAIL:'1'},encoding:'utf8'});process.stdout.write(r.stdout.replace(/^(?=.)/gm,'[threadrail present] '));process.stderr.write(r.stderr);if(r.status!==0)process.exit(r.status||1);}
