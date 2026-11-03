const core=require('../friendly_contact_core_v02.js'),assert=require('assert/strict');
const actor={x:0,y:0,z:0,radius:.32,height:1.72},point=(x,y=.42,z=0)=>({x,y,z}),tests=[];
function test(name,fn){fn();tests.push(name);}
function near(a,b,eps=1e-8){assert(Math.abs(a-b)<eps,`${a} != ${b}`)}
const radius=.55+.32+.025;
test('ten metre one-step approach stops at the analytic capsule boundary',()=>{const h=core.sweep(point(-5),point(5),actor);near(h.t,(5-radius)/10);near(h.normal.x,-1);});
test('reverse direction has symmetric contact and opposite normal',()=>{const h=core.sweep(point(5),point(-5),actor);near(h.t,(5-radius)/10);near(h.normal.x,1);});
test('near miss and exact tangent remain free',()=>{assert.equal(core.sweep(point(-5,.42,radius+.01),point(5,.42,radius+.01),actor),null);assert.equal(core.sweep(point(-5,.42,radius),point(5,.42,radius),actor),null);});
test('diagonal high-speed sweep cannot tunnel through the centre',()=>{const h=core.sweep(point(-50,.42,-50),point(50,.42,50),actor);near(h.t,.5-radius/Math.hypot(100,100));near(Math.hypot(h.normal.x,h.normal.y,h.normal.z),1);});
test('vertical fall reaches the upper body cap before penetration',()=>{const h=core.sweep(point(0,5),point(0,.42),actor);near(5+( .42-5)*h.t,1.72+.42+.025);near(h.normal.y,1);});
test('vertical motion above the body and horizontal roof-level travel stay free',()=>{assert.equal(core.sweep(point(0,3),point(0,5),actor),null);assert.equal(core.sweep(point(-5,4),point(5,4),actor),null);});
test('existing overlap can escape but cannot cross to the other side',()=>{assert.equal(core.sweep(point(.5),point(1.5),actor),null);const h=core.sweep(point(.5),point(-2),actor);near(h.t,0);assert(h.initialOverlap);near(h.normal.x,1);});
test('zero-length occupancy rejects a body and admits empty space',()=>{assert(core.occupied(point(0),actor));assert(!core.occupied(point(2),actor));assert.equal(core.sweep(point(0),point(0),actor),null);});
test('crouch and standing use distinct actual vertical envelopes',()=>{const upper={...actor,y:1.7};assert.equal(core.sweep(point(-5),point(5),upper,{height:.9}),null);assert(core.sweep(point(-5),point(5),upper,{height:1.72}));});
test('separate elevations do not create an invisible planar wall',()=>{assert.equal(core.sweep(point(-5),point(5),{...actor,y:24}),null);});
console.log('PASS',tests.length,'capsule contact groups',JSON.stringify(tests));
