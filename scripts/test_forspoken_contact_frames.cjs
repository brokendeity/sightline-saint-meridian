const assert=require('node:assert/strict'),C=require('./game_forspoken_contact_frames.js');
let checks=0;function test(name,fn){fn();checks++;console.log('PASS',name)}
const identity=[0,0,0,1],solver=(q=identity,scale=1,actorScale=1)=>({rotation:q,inverseRotation:[-q[0],-q[1],-q[2],q[3]],scale,actorScale});
const actor=(q=identity,translation=[0,0,0,1])=>({rotation:q,translation});
const close=(a,b,epsilon=2e-5)=>a.forEach((n,i)=>assert(Math.abs(n-b[i])<epsilon,`${a} != ${b}`));
test('actor origin is applied after scaled solver rotation',()=>{
 const q=[Math.SQRT1_2,0,0,Math.SQRT1_2],frame=C.capture(solver(q,2,3),actor(identity,[10,20,30,1]));
 const query=frame.query([0,1,0],[0,0,0],1,{1:0x1000});assert(query.valid);close(query.start,[10,20,36,1]);close(query.end,[10,20,30,1]);close(query.direction,[0,0,-1]);assert(Math.abs(query.length-6)<2e-5);assert.equal(query.collisionFilter,0x1000);
});
test('hit returns through actor inverse and solver inverse; normal is not scaled',()=>{
 const frame=C.capture(solver(identity,2,2),actor(identity,[10,20,30,1]));
 const hit=frame.resolve({found:true,point:[14,28,42],normal:[0,0,1]},1);
 close(hit.point,[1,2,3,0]);close(hit.normal,[0,0,1,1]);close(hit.actorPoint,[4,8,12,0]);
 assert.deepEqual(hit.worldPoint,[14,28,42,1]);
});
test('saved actor frame does not follow later actor/solver mutation',()=>{
 const s=solver(),a=actor(identity.slice(),[2,4,6,1]),frame=C.capture(s,a),original=frame.pointToWorld([1,2,3]);
 a.translation[0]=500;a.rotation[3]=0;s.rotation=[1,0,0,0];
 assert.deepEqual(frame.pointToWorld([1,2,3]),original);const state=frame.state();state.actorTranslation[0]=9;
 assert.equal(frame.state().actorTranslation[0],2);
});
test('sync special categories require both ownership records and unmasked flag',()=>{
 const frame=C.capture(solver(),actor()),hit={found:true,point:[1,2,3],normal:[0,0,1]};
 assert.equal(frame.resolve(hit,0).reason,'MISSING_NATIVE_HIT_METADATA');
 for(const category of [0,3]){
  assert(frame.resolve({...hit,ownerAResolved:true,ownerBResolved:true,ownerBByte4b:2},category).found);
  assert(!frame.resolve({...hit,ownerAResolved:true,ownerBResolved:true,ownerBByte4b:1},category).found);
  assert(!frame.resolve({...hit,ownerAResolved:false,ownerBResolved:true,ownerBByte4b:0},category).found);
 }
 assert(frame.resolve(hit,1).found);
});
test('solver normal rejection uses source Z, not browser Y',()=>{
 assert(C.rejectBelowSolverPlane({found:true,normal:[0,-1,0,1]}).found);
 assert(!C.rejectBelowSolverPlane({found:true,normal:[0,1,-.01,1]}).found);
 assert(C.rejectBelowSolverPlane({found:true,normal:[0,1,-0,1]}).found);
});
test('zero/overflow segments and unknown filters never reach physics',()=>{
 const frame=C.capture(solver(),actor());assert.equal(frame.query([0,0,0],[0,0,0],1,{1:0}).valid,false);
 assert.equal(frame.query([3e38,0,0],[-3e38,0,0],1,{1:0}).valid,false);
 assert.throws(()=>frame.query([0,0,0],[0,1,0],7,{1:0}),/Unresolved/);
 assert.throws(()=>C.capture(solver(identity,0),actor()),/Degenerate/);
 assert.throws(()=>C.capture(solver(),actor(identity,[NaN,0,0,1])),/Invalid/);
});
test('native quaternion values are not normalized behind the caller',()=>{
 const frame=C.capture(solver(),actor([0,0,0,2]));assert.deepEqual(frame.pointToWorld([1,0,0]),[4,0,0,1]);
});
test('source w components preserve original sync point/normal contract',()=>{
 const frame=C.capture(solver(identity,2),actor(identity,[0,0,0,.5]));
 assert.equal(frame.query([1,1,1],[2,2,2],1,{1:0}).start[3],.5);
 const hit=frame.resolve({found:true,point:[1,1,1],normal:[1,0,0]},1);
 assert.equal(hit.point[3],.25);assert.equal(hit.normal[3],1);
});
// Independent double-precision quaternion oracle. No recovered algebra reused.
function multiply(a,b){return [a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1],a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0],a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3],a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]]}
function rotation(q,v){return multiply(multiply(q,[...v,0]),[-q[0],-q[1],-q[2],q[3]]).slice(0,3)}
test('400 deterministic rotated/scaled queries agree with independent oracle',()=>{
 for(let i=1;i<=400;i++){
  const q=[Math.sin(i)*.3,Math.cos(i*2)*.4,Math.sin(i*3)*.2,1];let n=Math.hypot(...q);q.forEach((v,j)=>q[j]=v/n);
  const a=[0,Math.sin(i*.03),0,Math.cos(i*.03)],origin=[i%17,-i%13,i%7,1],scale=.5+(i%8)*.25,v=[i%5,-i%3,i%11];
  const frame=C.capture(solver(q,scale,1.25),actor(a,origin));
  const expected=rotation(a,rotation(q,v).map(x=>x*Math.fround(scale*1.25))).map((x,j)=>x+origin[j]);
  const world=frame.pointToWorld(v);close(world,[...expected,1],6e-5);
  close(frame.resolve({found:true,point:world.slice(0,3),normal:[0,1,0]},1).point,[...v,0],6e-5);
 }
});
assert.equal(C.originalIKComplete,false);
console.log(checks,'contact-frame checks passed; full biped solver remains unimplemented');
