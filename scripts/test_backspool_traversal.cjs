const assert=require('node:assert/strict');const {create}=require('./game_backspool_traversal.js');
const frame=(v={})=>({hero:'backspool',active:true,grounded:true,position:{x:0,y:.42,z:0},direction:{x:0,z:1},...v});
let t=create();t.pressJump();assert(t.update(.016,frame()).jump);assert(!t.update(.016,frame({grounded:false})).jump);
t.reset();t.update(.016,frame());t.update(.05,frame({grounded:false}));t.pressJump();assert(t.update(.016,frame({grounded:false})).jump,'coyote jump');
t.reset();t.pressJump();t.update(.1,frame({grounded:false}));t.update(.1,frame({grounded:false}));assert(!t.update(.016,frame()).jump,'expired buffer');
t.pressJump();assert(!t.update(.016,frame({locked:true})).jump);assert(!t.update(.016,frame()).jump,'lock clears pending');
assert(!t.update(.016,frame({hero:'sightline'})).ownsMovement);assert(!t.requestObstacle(frame()),'missing collision adapters rejected');
let clear=true,support=.42;const api={probeObstacle:()=>({end:{x:0,y:1.42,z:1.5}}),sweepClear:()=>clear,supportAt:()=>support};t=create(api);assert(!t.requestObstacle(frame()),'unsupported exit');support=1.42;assert(t.requestObstacle(frame()));let f=frame(),r;for(let i=0;i<120;i++){r=t.update(.016,f);if(r.position)f.position=r.position;if(r.landed)break;}assert(r.landed);assert.equal(f.position.y,1.42);
t.reset();assert(t.requestObstacle(frame()));clear=false;assert(t.update(.016,frame()).interrupted);assert.equal(t.state().reason,'PATH CHANGED');
t=create();for(let i=0;i<120;i++)t.update(1/60,frame({sprint:true}));assert.equal(t.state().speed,16);assert.throws(()=>t.update(1,frame()));
console.log('PASS authored traversal: jump gates, coyote, expiration, isolation, clearance, support, interruption, sprint cap');

const path=[{x:0,y:.42,z:0},{x:0,y:1.42,z:.3},{x:0,y:1.42,z:1.1},{x:0,y:.42,z:1.5}];t=create({probeObstacle:()=>({vault:true,crestY:1.42,end:path[3],points:path}),supportAt:()=>.42,sweepClear:()=>true});assert(t.requestObstacle(frame()));f=frame();for(let i=0;i<120;i++){r=t.update(.016,f);if(r.position)f.position=r.position;if(r.landed)break;}assert(r.landed);assert.equal(r.kind,'vault');assert(Math.abs(f.position.y-.42)<1e-9);

for(const blocked of [{hero:'sightline'},{locked:true},{active:false},{canJump:false}]){t=create({probeObstacle:()=>({end:{x:0,y:1.42,z:1.5}}),supportAt:()=>1.42,sweepClear:()=>true});assert(!t.requestObstacle(frame(blocked)));}
t=create({probeObstacle:()=>({end:{x:0,y:1.42,z:1.5}}),supportAt:()=>1.42,sweepClear:()=>false});assert(!t.requestObstacle(frame()),'blocked overhead/path rejected');
support=1.42;t=create({probeObstacle:()=>({end:{x:0,y:1.42,z:1.5}}),supportAt:()=>support,sweepClear:()=>true});assert(t.requestObstacle(frame()));support=NaN;f=frame();for(let i=0;i<120;i++){r=t.update(.016,f);if(r.position)f.position=r.position;if(r.interrupted)break;}assert(r.interrupted);assert.equal(t.state().reason,'EXIT SUPPORT LOST');
t.reset();assert.equal(t.state().action,null);assert.equal(t.state().speed,0);
console.log('PASS hero/lock gates, blocked body path, disappearing support, reset');

// Source timing admission is explicit and cannot create an unbounded action lock.
const adapter={probeObstacle:()=>({vault:true,crestY:1.42,end:path[3],points:path}),supportAt:()=>.42,sweepClear:()=>true};
t=create(adapter);assert(t.requestObstacle(frame({actionDurations:{vault:1.8}})));assert.equal(t.state().duration,1.8);
for(const duration of [NaN,Infinity,0,-1,6]){t=create(adapter);assert(!t.requestObstacle(frame({actionDurations:{vault:duration}})));assert.equal(t.state().reason,'INVALID ACTION TIMING');}
console.log('PASS role-owned source timing and invalid-duration rejection');
