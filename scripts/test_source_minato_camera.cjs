const assert=require('node:assert/strict'),camera=require('./source_minato_camera.js');
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
near(camera.horizontalToVertical(90,16/9),58.71550708558255);
near(camera.horizontalToVertical(30,1),30);
for(const aspect of [16/9,9/16,1,21/9])for(const h of [5,30,45,90,150]){
 const v=camera.horizontalToVertical(h,aspect);
 near(Math.tan(v*Math.PI/360),Math.tan(h*Math.PI/360)/aspect);
}
for(const [h,a] of [[NaN,1],[0,1],[180,1],[30,0],[30,Infinity]])assert.throws(()=>camera.horizontalToVertical(h,a),RangeError);
const p=camera.projection(30,1920,1080);near(p.aspect,16/9);assert.equal(p.originalCompositionVerified,false);
assert.throws(()=>camera.projection(30,0,1080),RangeError);
console.log('source camera horizontal-FOV conversion: passed');
