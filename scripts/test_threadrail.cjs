const assert = require('node:assert/strict');
const { createThreadrail } = require('./game_threadrail.js');
const v = (x=0,y=0,z=0) => ({x,y,z});
const anchor = (id,x,y=0,z=0) => ({id,position:v(x,y,z),normal:v(0,1,0),ownerId:'scene',revision:1,valid:true});
const frame = (position=v(),velocity=v(10)) => ({hero:'backspool',active:true,position,velocity,direction:v(1),grounded:false,jumpHeld:false});
let count=0;
function test(name,fn) { fn(); count++; console.log('PASS '+name); }
function fixture(api={},config={}) {
  const c=createThreadrail(api,config), f=frame();
  const made=c.create(anchor('a',0),anchor('b',20));
  assert(made.ok,made.reason);
  return {c,f,id:made.rail.id,step(dt=1/60){const r=c.update(dt,f);if(r.ownsMovement){f.position=r.position;f.velocity=r.velocity;}return r;}};
}
const close = (a,b,e=1e-6) => assert(Math.abs(a-b)<e,`${a} != ${b}`);
test('factory exports and browser global need no THREE',()=>{
  assert.equal(require('./game_threadrail.js').create,createThreadrail);
  const vm=require('node:vm'),fs=require('node:fs'),context={window:{}};
  vm.runInNewContext(fs.readFileSync(require.resolve('./game_threadrail.js'),'utf8'),context);
  assert.equal(typeof context.window.createThreadrail,'function');
});
test('placement bounds and malformed endpoints are atomic',()=>{
  const c=createThreadrail();
  for(const [a,b] of [[anchor('a',0),anchor('b',5.99)],[anchor('a',0),anchor('b',100.01)],[anchor('a',0),anchor('b',6,10)],[anchor('a',NaN),anchor('b',20)],[{...anchor('a',0),ownerId:null},anchor('b',20)],[{...anchor('a',0),valid:false},anchor('b',20)]]) {
    assert.equal(c.create(a,b).ok,false);assert.equal(c.state().rails.length,0);assert.equal(c.state().anchors.length,0);
  }
  assert(c.create(anchor('a',0),anchor('b',6)).ok);
  assert(c.create(anchor('c',0,3),anchor('d',100,3)).ok);
});
test('four rails, eight anchors and duplicate endpoint ownership',()=>{
  const c=createThreadrail();
  for(let i=0;i<4;i++) assert(c.create(anchor('a'+i,0,i),anchor('b'+i,20,i)).ok);
  assert.equal(c.create(anchor('extra',0,7),anchor('extra2',20,7)).ok,false);
  assert.equal(c.state().rails.length,4);assert.equal(c.state().anchors.length,8);
  const shared=createThreadrail();assert(shared.create(anchor('a',0),anchor('b',20)).ok);
  assert.equal(shared.create({...anchor('a',1),ownerId:'other'},anchor('c',30)).ok,false);
  assert.equal(shared.create(anchor('a',.0001),anchor('c',30)).ok,false);
  assert.equal(shared.state().anchors.length,2);
});
test('callbacks reject owner, support and path before placement',()=>{
  for(const api of [{validateAnchor:()=>false},{supportAt:()=>false},{sweepClear:()=>false},{validateAnchor:()=>{throw Error('gone');}}]) {
    const c=createThreadrail(api);assert.equal(c.create(anchor('a',0),anchor('b',20)).ok,false);assert.equal(c.state().anchors.length,0);
  }
});
test('duplicate rails, unsupported anchors and callback-owned mutation are safe',()=>{
  const c=createThreadrail({validateAnchor:a=>{a.position.x=999;return true;},supportAt:()=>.42}),a=anchor('a',0),b=anchor('b',20);
  a.circular=a;assert(c.create(a,b).ok);assert.equal(c.create(b,a).reason,'duplicate-rail');assert.equal(c.state().rails.length,1);
  assert.equal(c.create({...anchor(Infinity,0)},anchor('d',20)).ok,false);
  let supported=true;const s=fixture({supportAt:()=>supported});assert(s.c.attach(s.f,s.id).ok);supported=false;
  assert.equal(s.step().reason,'unsupported-anchor');assert.equal(s.c.state().current,null);
});
test('attach uses swept two metre reach and actual projected inertia',()=>{
  const {c,id}=fixture();assert.equal(c.attach(frame(v(0,3)),id).ok,false);
  const f=frame(v(0,1),v(12,7,3));const r=c.attach(f,id);assert(r.ok);close(r.velocity.x,12);close(r.velocity.y,0);
  assert.equal(c.state().current.railId,id);
  const blocked=fixture({sweepClear:(a,b)=>a.y===b.y});assert.equal(blocked.c.attach(frame(v(0,1)),blocked.id).ok,false);
});
test('zero inertia uphill has no free acceleration and real uphill loses energy',()=>{
  const c=createThreadrail({}, {friction:0}), a=anchor('a',0), b=anchor('b',20,10);const id=c.create(a,b).rail.id;
  const f=frame(v(2,1),v());assert(c.attach(f,id).ok);const r=c.update(.2,f);assert(r.velocity.x<=0);assert(r.position.x<=2);
  const d=createThreadrail({}, {friction:0}),id2=d.create(a,b).rail.id;
  const speed=12,ux=2/Math.sqrt(5),uy=1/Math.sqrt(5),ff=frame(v(2,1),v(speed*ux,speed*uy));assert(d.attach(ff,id2).ok);
  const rr=d.update(.4,ff),e0=.5*speed*speed+9.81*ff.position.y,e1=.5*(rr.speed**2)+9.81*rr.position.y;
  assert(rr.speed<speed);close(e0,e1,1e-5);
});
test('friction removes energy without reversing a stationary flat rail',()=>{
  const {c,f,id,step}=fixture();assert(c.attach(f,id).ok);assert(step(.4).speed<10);
  const s=fixture();s.f.velocity=v();assert(s.c.attach(s.f,s.id).ok);close(s.step(.2).speed,0);
});
test('rail drive projects impulse, caps speed and rejects malformed impulse',()=>{
  const {c,f,id}=fixture();assert(c.attach(f,id).ok);const drive=c.applyDrive(v(100,100,50));assert(drive.ok);close(c.state().current.speed,28);close(drive.deltaVelocity.y,0);
  assert.equal(c.applyDrive(v(NaN)).ok,false);assert.equal(c.applyDrive(v(0,10)).ok,false);
  const r=c.jump(f,{slingshot:true});assert(r.ok);assert(Math.hypot(r.velocity.x,r.velocity.y,r.velocity.z)<=28+1e-6);assert.equal(c.state().current,null);
});
test('linked junction follows input with cosine speed loss',()=>{
  const c=createThreadrail({}, {friction:0,gravity:0});const a=anchor('a',0),b=anchor('b',10),d=anchor('d',20,0,10);
  const id=c.create(a,b).rail.id,to=c.create(b,d).rail.id,f=frame(v(9),v(10));f.direction=v(1,0,1);assert(c.attach(f,id).ok);
  const r=c.update(.3,f);assert(r.ownsMovement);assert.equal(r.railId,to);close(r.speed,10/Math.sqrt(2),1e-5);assert(r.position.x>10);
});
test('junction uses current directional input instead of stale attach direction',()=>{
  const c=createThreadrail({}, {friction:0,gravity:0}),b=anchor('b',10),id=c.create(anchor('a',0),b).rail.id;
  c.create(b,anchor('c',20));const diagonal=c.create(b,anchor('d',20,0,10)).rail.id;
  const f=frame(v(9),v(10));assert(c.attach(f,id,v(1)).ok);f.direction=v(1,0,1);
  assert.equal(c.update(.3,f).railId,diagonal);
});
test('directional rail drive requests a compatible junction without extra free momentum',()=>{
  const c=createThreadrail({}, {friction:0,gravity:0}),b=anchor('b',10),id=c.create(anchor('a',0),b).rail.id;
  c.create(b,anchor('c',20));const diagonal=c.create(b,anchor('d',20,0,10)).rail.id;
  const f=frame(v(9),v(10));assert(c.attach(f,id).ok);const drive=c.applyDrive(v(4,0,4));assert(drive.ok);close(drive.deltaVelocity.x,4);close(drive.deltaVelocity.z,0);
  const r=c.update(.2,f);assert.equal(r.railId,diagonal);close(r.speed,14/Math.sqrt(2),1e-5);
});
test('sharp junction detaches preserving endpoint position and velocity',()=>{
  const c=createThreadrail({}, {friction:0,gravity:0}),b=anchor('b',10);const id=c.create(anchor('a',0),b).rail.id;c.create(b,anchor('c',10,0,10));
  const f=frame(v(9),v(10));f.direction=v(0,0,1);assert(c.attach(f,id).ok);const r=c.update(.3,f);assert.equal(c.state().current,null);assert.equal(r.reason,'rail-end');assert(r.ownsMovement);close(r.position.x,10);close(r.velocity.x,10);
});
test('manual transfer enforces reach, sweep and projected momentum',()=>{
  const {c,f,id}=fixture({}, {friction:0});const target=c.create(anchor('c',0,0,2),anchor('d',20,0,2)).rail.id;
  assert(c.attach(f,id).ok);const r=c.transfer(f,target);assert(r.ok);assert.equal(r.railId,target);close(r.velocity.x,10);close(r.position.z,2);
  const distant=c.create(anchor('e',0,0,8),anchor('f',20,0,8)).rail.id;assert.equal(c.transfer(f,distant).ok,false);assert.equal(c.state().current.railId,target);
});
test('blocked transfer and sharp transfer fail without changing the current rail',()=>{
  let blocked=false;const {c,f,id}=fixture({sweepClear:(a,b,context)=>!(blocked&&context.kind==='transfer')});
  const next=c.create(anchor('c',0,0,2),anchor('d',20,0,2)).rail.id;
  const sharp=c.create(anchor('e',0,0,-10),anchor('f',0,0,10)).rail.id;assert(c.attach(f,id).ok);
  blocked=true;assert.equal(c.transfer(f,next).reason,'blocked-transfer');assert.equal(c.state().current.railId,id);
  blocked=false;assert.equal(c.transfer(f,sharp).reason,'transfer-angle');assert.equal(c.state().current.railId,id);
});
test('expiry uses simulation time; pause preserves topology and attachment',()=>{
  const {c,f,id}=fixture();assert(c.attach(f,id).ok);f.paused=true;const paused=c.update(100,f);assert.equal(paused.ownsMovement,false);close(c.state().time,0);assert(c.state().current);
  f.paused=false;const r=c.update(30,f);assert.equal(c.state().rails.length,0);assert.equal(c.state().anchors.length,0);assert.equal(c.state().current,null);assert.equal(r.reason,'expired');assert.equal(r.ownsMovement,false);close(r.velocity.x,10);
});
test('owner destruction, revision change and path blockage detach without teleport',()=>{
  for(const kind of ['owner','revision','path']) {
    let broken=false;const api={validateAnchor:a=>!broken?true:kind==='owner'?false:kind==='revision'?{revision:2}:true,sweepClear:()=>!(broken&&kind==='path')};
    const {c,f,id}=fixture(api);assert(c.attach(f,id).ok);broken=true;const r=c.update(.1,f);assert.equal(r.ownsMovement,false);assert.equal(c.state().current,null);close(r.position.x,f.position.x);close(r.velocity.x,10);
  }
});
test('hero switch and interruption detach; reset clears lifecycle without id reuse',()=>{
  const {c,f,id}=fixture();assert(c.attach(f,id).ok);f.hero='other';assert.equal(c.update(.1,f).ownsMovement,false);assert.equal(c.state().current,null);
  f.hero='backspool';assert(c.attach(f,id).ok);f.active=false;c.update(.1,f);assert.equal(c.state().current,null);
  const before=Math.max(...c.state().events.map(e=>e.id));c.reset('hero-reset');assert.equal(c.state().rails.length,0);assert.equal(c.state().anchors.length,0);assert.equal(c.state().current,null);
  assert(c.create(anchor('x',0),anchor('y',20)).ok);assert(Math.min(...c.state().events.map(e=>e.id))>before);
});
test('defensive state snapshots and anchor inputs cannot mutate physics',()=>{
  const c=createThreadrail(),a=anchor('a',0),b=anchor('b',20),id=c.create(a,b).rail.id;a.position.x=100;
  const state=c.state();state.anchors[0].position.x=100;state.rails[0].length=0;assert(c.attach(frame(),id).ok);const current=c.state();current.current.velocity.x=999;assert(c.state().current.velocity.x<=28);
});
test('invalid dt and random inputs never produce NaNs',()=>{
  const {c,f,id}=fixture();assert(c.attach(f,id).ok);
  for(const dt of [NaN,Infinity,-1,undefined,0,.016,1e9]) {
    const r=c.update(dt,f);for(const vector of [r.position,r.velocity]) if(vector) for(const value of Object.values(vector)) assert(Number.isFinite(value));
    if(r.ownsMovement){f.position=r.position;f.velocity=r.velocity;}
  }
  assert.equal(c.attach({...f,position:v(Infinity)},id).ok,false);
});
test('swept movement blockage preserves last safe velocity without an unchecked request',()=>{
  let movementBlocked=false;const {c,f,id}=fixture({sweepClear:(a,b,context)=>!(movementBlocked&&context.kind==='movement')});
  assert(c.attach(f,id).ok);movementBlocked=true;const r=c.update(.1,f);assert.equal(r.reason,'blocked-movement');assert.equal(r.ownsMovement,false);close(r.position.x,0);close(r.velocity.x,10);assert.equal(c.state().current,null);
});
test('downhill gravity accelerates only to the physical rail speed cap',()=>{
  const c=createThreadrail({}, {friction:0}),id=c.create(anchor('a',0,60),anchor('b',60,0)).rail.id;
  const f=frame(v(0,60),v());assert(c.attach(f,id).ok);
  let r;for(let i=0;i<300&&c.state().current;i++){r=c.update(1/60,f);if(r.ownsMovement){f.position=r.position;f.velocity=r.velocity;}assert(r.speed<=28+1e-6);}
  assert(r.speed>0);assert(f.position.y<60);
});
test('idle expiry and repeated lifecycle events stay bounded and monotonic',()=>{
  const {c}=fixture();c.update(30,frame());assert.equal(c.state().rails.length,0);
  let previous=0;
  for(let i=0;i<180;i++) {c.reset('test');const id=c.state().events[0].id;assert(id>previous);previous=id;}
  const a=anchor('a',0),b=anchor('b',20),id=c.create(a,b).rail.id;
  for(let i=0;i<80;i++) {assert(c.attach(frame(),id).ok);c.detach();}
  assert(c.state().events.length<=128);const ids=c.state().events.map(e=>e.id);assert.equal(new Set(ids).size,ids.length);
});
console.log(`${count} Threadrail tests passed`);
