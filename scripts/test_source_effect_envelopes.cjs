const assert=require('node:assert/strict');
const S=require('./cinematic_source_effects.js');
// Color's zero-pivot branch is not the scale branch (14130b200).
assert.deepEqual(S.envelope([1],[.6],[.2],0,.5),[1]);
assert.deepEqual(S.colorEnvelope([1],[.6],[.2],0,0),[Math.fround(.6)]);
assert.deepEqual(S.colorEnvelope([1],[.6],[.2],0,.5),[Math.fround(.4)]);
assert.deepEqual(S.colorEnvelope([1],[.6],[.2],0,1),[Math.fround(.2)]);
assert.deepEqual(S.colorEnvelope([1],[.5],[0],.25,.125),[.75]);
assert.deepEqual(S.colorEnvelope([1],[.5],[0],.25,.625),[.25]);
// Lifetime=10, fade-out=50%: threshold=5, update 6 only changes state.
assert.deepEqual(Array.from({length:11},(_,i)=>S.fadeAtUpdate(10,0,.5,i)),[
  1,1,1,1,1,1,1,Math.fround(.8),Math.fround(Math.fround(.8)-Math.fround(.2)),
  Math.fround(Math.fround(Math.fround(.8)-Math.fround(.2))-Math.fround(.2)),
  Math.fround(Math.fround(Math.fround(Math.fround(.8)-Math.fround(.2))-Math.fround(.2))-Math.fround(.2))
]);
assert.deepEqual([0,1,2,3].map(i=>S.fadeAtUpdate(10,.2,0,i)),[0,.5,1,1]);
assert.equal(S.fadeAtUpdate(10,0,0,10),1);
// One mesh references the same material twice; another shares it. The
// native animation has alpha=.8 and particle envelope=.5: result must=.4.
const mat={userData:{},opacity:.8},root={traverse(fn){fn({isMesh:true,material:[mat,mat]});fn({isMesh:true,material:mat});}};
assert.equal(S.tintMaterials(root,{color:[1,1,1,1],opacity:.5},()=>null),1);
assert.equal(mat.opacity,.4);
// Native viewer resets animation alpha before every seek/sample.
mat.opacity=.8;S.tintMaterials(root,{color:[1,1,1,1],opacity:.5},()=>null);assert.equal(mat.opacity,.4);
const birth={time:2,life:10/30,scales:[[1],[1],[1]],config:{baseLifetimeUpdates:10,fadeInFraction:0,fadeOutFraction:.5,colorStart:[1,1,1,1],colorMiddle:[1,1,1,1],colorEnd:[0,0,0,0],colorPivot:0,scalePivot:0}};
const at=S.state(birth,2+7/30);S.state(birth,2+9/30);assert.deepEqual(S.state(birth,2+7/30),at);assert.equal(at.updates,7);
console.log('Original color branch, nominal source fade state transitions, shared-material tint and backward-seek regression passed');
