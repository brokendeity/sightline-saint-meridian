'use strict';
const assert = require('node:assert/strict');
const { create } = require('./game_afterstep_drive.js');
let passed = 0;
function test(name, fn) { fn(); passed++; console.log(`PASS ${name}`); }
const frame = (extra = {}) => ({hero:'backspool',active:true,grounded:true,position:{x:0,y:0,z:0},velocity:{x:0,y:0,z:0},direction:{x:0,y:0,z:-1},...extra});
const contact = (id, extra = {}) => ({id,action:'landing',direction:{x:1,y:0,z:0},magnitude:10,groundSupported:true,...extra});
const lateral = {action:'sideStep',direction:{x:0,y:0,z:-1}};
const upward = {action:'jump',direction:{x:0,y:1,z:0}};
const opposing = {direction:{x:-1,y:0,z:0}};
const fill = (c, count = 5, extra = {}) => { for(let i=0;i<count;i++) assert(c.contact(contact(`c${i}`,extra)).ok); };
test('confirmed contact stores real vector and returns defensive state', () => {
 const c=create(), input=contact('one'); assert(c.contact(input).ok); input.direction.x=99;
 const s=c.state(); assert.equal(s.bank[0].vector.x,10); s.bank[0].vector.x=77; s.bank.length=0;
 assert.equal(c.state().bank[0].vector.x,10);
});
test('reject invalid contacts and synthetic Drive children', () => {
 const c=create();
 for(const e of [contact('a',{groundSupported:false}),contact('',{}),contact('b',{magnitude:NaN}),contact('c',{direction:{x:0,y:0,z:0}}),contact('d',{action:'teleport'}),contact('e',{source:'afterstep-drive'}),contact('f',{cause:'Drive'}),contact('g',{synthetic:true}),contact('h',{magnitude:Infinity})]) assert.equal(c.contact(e).ok,false);
 assert.equal(c.state().bank.length,0);
});
test('duplicate IDs cannot refresh age or bank again after consumption', () => {
 const c=create(); c.contact(contact('a')); c.update(.1,frame()); assert.equal(c.contact(contact('a')).reason,'DUPLICATE');
 assert.equal(c.state().bank[0].time,0); c.release('standard',frame()); assert.equal(c.contact(contact('a')).reason,'DUPLICATE');
});
test('footplant min interval and five slots', () => {
 const c=create(); assert(c.contact(contact('a',{action:'footplant'})).ok);
 c.update(.249,frame()); assert.equal(c.contact(contact('b',{action:'footplant'})).reason,'CONTACT_INTERVAL');
 c.update(.001,frame()); assert(c.contact(contact('b',{action:'footplant'})).ok);
 for(let i=0;i<3;i++) { c.update(.25,frame()); assert(c.contact(contact(`p${i}`,{action:'footplant'})).ok); }
 c.update(.25,frame()); assert.equal(c.contact(contact('full',{action:'footplant'})).reason,'BANK_FULL'); assert.equal(c.state().bank.length,5);
});
test('full bank nonrun replaces only oldest running contact', () => {
 const c=create(); c.contact(contact('run',{action:'footplant'})); fill(c,4);
 const r=c.contact(contact('new',{action:'vault'})); assert(r.ok); assert.equal(r.replaced,'run');
 assert.equal(c.contact(contact('overflow')).reason,'BANK_FULL'); assert.equal(c.state().bank.length,5);
});
test('clock freezes during inactive simulation and expiry has exact boundary', () => {
 const c=create(); c.contact(contact('a')); c.update(20,frame({active:false})); assert.equal(c.state().now,0);
 c.update(7.999,frame()); assert.equal(c.state().bank.length,1); c.update(.001,frame()); assert.equal(c.state().bank.length,0);
});
test('release validates frame and mode before consumption', () => {
 const c=create(); c.contact(contact('a'));
 for(const [mode,f] of [['standard',frame({active:false})],['standard',frame({hero:'other'})],['unknown',frame()],['rail',frame()],['standard',frame({velocity:{x:NaN,y:0,z:0}})]]) assert.equal(c.release(mode,f).ok,false);
 assert.equal(c.state().bank.length,1); assert.equal(c.state().strain,0);
});
test('obstruction and callback failures are atomic', () => {
 for(const canRelease of [()=>false,()=>({ok:false,reason:'WALL'}),()=>{throw Error('sweep');}]) {
  const c=create({canRelease}); c.contact(contact('a')); const r=c.release('standard',frame());
  assert(!r.ok); assert.equal(c.state().bank.length,1); assert.equal(c.state().strain,0); assert.equal(c.state().lastRelease,null);
 }
});
test('successful release spends one ID and confirms actual delta to sweep', () => {
 let seen; const c=create({canRelease:(f,d,m)=>{seen={f,d,m};return true;}}); c.contact(contact('a'));
 const r=c.release('standard',frame()); assert(r.ok); assert.deepEqual(r.spent,['a']); assert.equal(r.deltaVelocity.x,10);
 assert.equal(seen.d.x,10); assert.equal(seen.m,'standard'); assert.equal(c.state().bank.length,0); assert.equal(c.state().strain,6);
});
test('perfect timing is inclusive sixty ms and imperfect keeps seventy percent', () => {
 for(const [age,perfect,strength,cost] of [[.06,true,10,6],[.06001,false,7,8],[.12,false,7,8]]) {
  const c=create();c.contact(contact('a'));c.update(age,frame());const r=c.release('standard',frame());
  assert.equal(r.event.perfect,perfect);assert.equal(r.deltaVelocity.x,strength);assert.equal(c.state().strain,cost);
 }
 const c=create();c.contact(contact('a'));c.update(.5,frame());assert(c.release('standard',frame(),{beatTime:.55}).event.perfect);
});
test('directional and launch redirect recorded energy without inventing magnitude', () => {
 const c=create(); c.contact(contact('a',lateral)); const r=c.release('directional',frame()); assert.equal(r.deltaVelocity.z,-10);assert.equal(c.state().strain,7.5);
 c.contact(contact('b',upward)); const l=c.release('launch',frame()); assert.equal(l.deltaVelocity.y,10);assert.equal(c.state().strain,18);
});
test('midair launch spends a previously grounded captured jump', () => {
 const c=create();c.contact(contact('a',upward));const r=c.release('launch',frame({grounded:false}));assert(r.ok);assert.equal(r.deltaVelocity.y,10);assert.equal(c.state().bank.length,0);
});
test('rail release needs attachment and actual tangent', () => {
 const c=create();c.contact(contact('a'));assert(!c.release('rail',frame({rail:{attached:true}})).ok);
 const r=c.release('rail',frame({rail:{attached:true,tangent:{x:1,y:0,z:0}}}));assert(r.ok);assert.equal(r.deltaVelocity.x,10);
});
test('brake never reverses velocity or creates speed from rest', () => {
 const c=create();c.contact(contact('a',opposing));assert(!c.release('brake',frame()).ok);assert.equal(c.state().bank.length,1);
 const r=c.release('brake',frame({velocity:{x:3,y:0,z:0}}));assert(r.ok);assert.equal(r.deltaVelocity.x,-3);assert.equal(c.state().strain,6);
});
test('auto selects grounded launch and attached rail', () => {
 const c=create();c.contact(contact('up',upward));c.contact(contact('right'));assert.equal(c.release('auto',frame({jumpHeld:true})).event.mode,'launch');
 assert.equal(c.release('auto',frame({rail:{attached:true,tangent:{x:1,y:0,z:0}}})).event.mode,'rail');
});
test('ghoststep needs input and costs ten before timing discount', () => {
 const c=create();c.contact(contact('a',lateral));assert(!c.release('ghoststep',frame({direction:{x:0,y:0,z:0}})).ok);
 c.update(.2,frame());const r=c.release('ghoststep',frame());assert(r.ok);assert.equal(c.state().strain,10);assert.equal(r.deltaVelocity.z,-7);
});
test('DoubleStep second perfect beat is320ms after first', () => {
 const c=create();c.contact(contact('run1',{action:'footplant',direction:{x:0,y:0,z:-1}}));c.update(.25,frame());
 c.contact(contact('run2',{action:'footplant',direction:{x:0,y:0,z:-1}}));assert(c.release('double-step',frame()).ok);c.update(.32,frame());
 const r=c.release('double-step',frame());assert(r.ok);assert(r.event.perfect);assert.equal(r.event.doubleStep,2);assert.equal(r.deltaVelocity.z,-10);
});
test('DoubleStep valid imperfect second release remains seventy percent', () => {
 const c=create();fill(c,2,lateral);c.release('double-step',frame());c.update(.45,frame());const r=c.release('double-step',frame());assert(r.ok);assert(!r.event.perfect);assert.equal(r.deltaVelocity.z,-7);
});
test('demanding releases block at85 strain without spending', () => {
 const c=create({}, {initialStrain:85});c.contact(contact('a',upward));assert.equal(c.release('launch',frame()).reason,'STRAIN');assert.equal(c.state().bank.length,1);
 c.contact(contact('brake',opposing));assert(c.release('brake',frame({velocity:{x:1,y:0,z:0}})).ok);
});
test('release cannot exceed capacity100', () => {
 const c=create({}, {initialStrain:97});c.contact(contact('a'));assert.equal(c.release('standard',frame()).reason,'STRAIN_CAPACITY');assert.equal(c.state().bank.length,1);
});
test('recovery waits1.5s after release then recovers8 per active second', () => {
 const c=create();c.contact(contact('a'));c.release('standard',frame());c.update(1.5,frame());assert.equal(c.state().strain,6);
 c.update(.25,frame());assert.equal(c.state().strain,4);c.update(50,frame({active:false}));assert.equal(c.state().strain,4);
 c.update(.5,frame());assert.equal(c.state().strain,0);
});
test('large dt only recovers elapsed time beyond grace', () => {
 const c=create();c.contact(contact('a',upward));c.release('launch',frame());c.update(2,frame());assert.equal(c.state().strain,6.5);
});
test('hero switch clears transient bank while preserving strain', () => {
 const c=create();fill(c,2);c.release('standard',frame());c.reset('hero-switch');assert.equal(c.state().bank.length,0);assert.equal(c.state().strain,6);
 c.contact(contact('new'));c.reset('death');assert.equal(c.state().bank.length,0);assert.equal(c.state().strain,0);
});
test('core clamps release delta to safe28 even for large real impulses', () => {
 const c=create();c.contact(contact('a',{magnitude:120}));const r=c.release('standard',frame());assert.equal(r.deltaVelocity.x,28);
});
test('reservations are atomic, block ordinary release, and never refresh expiry', () => {
 const c=create();fill(c,2);assert(!c.reserve(['c0','missing'],'route').ok);assert.equal(c.state().bank[0].reservedBy,null);
 assert(c.reserve(['c0','c1'],'route').ok);assert(!c.release('standard',frame()).ok);
 assert(!c.release('standard',frame(),{reservationToken:'wrong'}).ok);
 c.update(1,frame());const r=c.release('standard',frame(),{reservationToken:'route',ids:['c0']});assert(r.ok);assert.deepEqual(r.spent,['c0']);
 assert(c.unreserve('route').ok);assert.equal(c.state().bank[0].time,0);c.update(7,frame());assert.equal(c.state().bank.length,0);
});
test('reserved footplants cannot be replaced and expired reservations cannot release', () => {
 const c=create();c.contact(contact('run',{action:'footplant'}));fill(c,4);c.reserve(['run'],'r');assert.equal(c.contact(contact('x')).reason,'BANK_FULL');
 c.update(8,frame());assert(!c.release('standard',frame(),{reservationToken:'r',ids:['run']}).ok);
});
test('events stay monotonic across reset and output cannot mutate core', () => {
 const c=create();const a=c.contact(contact('a'));const r=c.release('standard',frame());assert(r.event.sequence>a.event.sequence);
 r.event.deltaVelocity.x=500;c.reset('respawn');const b=c.contact(contact('b'));assert(b.event.sequence>r.event.sequence);
 assert.equal(c.state().bank[0].vector.x,10);
});
test('callback cannot mutate proposed delta or reenter and double spend', () => {
 let c, nested; c=create({canRelease:(f,d)=>{d.x=999;nested=c.release('standard',f);return true;}});c.contact(contact('a'));const r=c.release('standard',frame());
 assert(r.ok);assert(!nested.ok);assert.equal(r.deltaVelocity.x,10);assert.equal(c.state().strain,6);
});
test('invalid and negative dt cannot corrupt clock', () => {
 const c=create();for(const dt of [NaN,Infinity,-1]) c.update(dt,frame());assert.equal(c.state().now,0);
});
test('launch rejects generic upward contacts and accepts only captured launch actions', () => {
 const c=create();c.contact(contact('up',{direction:{x:0,y:1,z:0}}));assert.equal(c.release('launch',frame()).reason,'INCOMPATIBLE');
 assert.equal(c.state().bank.length,1);assert.equal(c.state().strain,0);
});
test('reorientation is limited to sixty degrees inclusive', () => {
 const c=create();c.contact(contact('angle',{action:'jump',direction:{x:Math.sqrt(3)/2,y:.5,z:0}}));assert(c.release('launch',frame()).ok);
 const d=create();d.contact(contact('angle',{action:'jump',direction:{x:Math.sqrt(1-.49**2),y:.49,z:0}}));assert.equal(d.release('launch',frame()).reason,'INCOMPATIBLE');
 const e=create();e.contact(contact('side',{action:'sideStep'}));assert.equal(e.release('directional',frame()).reason,'INCOMPATIBLE');assert.equal(e.state().bank.length,1);
});
test('captured strong lateral vector is usable without a sideStep label', () => {
 const c=create();c.contact(contact('lateral'));assert(c.release('directional',frame({velocity:{x:0,y:0,z:-3},direction:{x:1,y:0,z:0}})).ok);
 const d=create();d.contact(contact('forward',{action:'footplant',direction:{x:0,y:0,z:-1}}));assert(!d.release('directional',frame({velocity:{x:0,y:0,z:-3}})).ok);
});
test('auto lateral selection only chooses directional when compatible', () => {
 const c=create();c.contact(contact('lateral'));assert.equal(c.release('auto',frame({velocity:{x:0,y:0,z:-3},direction:{x:1,y:0,z:0}})).event.mode,'directional');
 const d=create();d.contact(contact('forward',{action:'footplant',direction:{x:0,y:0,z:-1}}));
 const r=d.release('auto',frame({velocity:{x:0,y:0,z:-3},direction:{x:1,y:0,z:0}}));assert(r.ok);assert.equal(r.event.mode,'standard');
});
test('brake rejects a forward captured impulse and preserves resources', () => {
 const c=create();c.contact(contact('forward'));assert.equal(c.release('brake',frame({velocity:{x:3,y:0,z:0}})).reason,'INCOMPATIBLE');assert.equal(c.state().bank.length,1);assert.equal(c.state().strain,0);
});
test('Ghoststep accepts captured forward footplant within sixty degrees', () => {
 const c=create();c.contact(contact('run',{action:'footplant',direction:{x:0,y:0,z:-1}}));assert(c.release('ghoststep',frame()).ok);
});
test('explicit actual impulse overrides no inferred speed and expires from original contact time', () => {
 const c=create();c.update(2,frame());assert(c.contact(contact('vector',{vector:{x:3,y:4,z:0},magnitude:5,time:1})).ok);
 assert.equal(c.state().bank[0].magnitude,5);assert(!c.contact(contact('bad',{vector:{x:3,y:4,z:0},magnitude:10})).ok);
 c.update(7,frame());assert.equal(c.state().bank.length,0);
});
test('already expired contact cannot replace an existing running impulse', () => {
 const c=create();c.update(8,frame());c.contact(contact('run',{action:'footplant'}));fill(c,4);
 assert(!c.contact(contact('old',{time:0})).ok);assert(c.state().bank.some(e=>e.id==='run'));assert.equal(c.state().bank.length,5);
});
test('contact confirmation alone cannot bank unsupported airborne input', () => {
 const c=create();assert(!c.contact(contact('air',{action:'jump',groundSupported:false,contactConfirmed:true})).ok);
});
test('auto launch also uses previously captured jump while airborne', () => {
 const c=create();c.contact(contact('jump',upward));const r=c.release('auto',frame({jumpHeld:true,grounded:false}));assert(r.ok);assert.equal(r.event.mode,'launch');
});
test('browser factory exports without CommonJS globals', () => {
 const fs=require('node:fs'),vm=require('node:vm'),context={window:{}};vm.runInNewContext(fs.readFileSync(require.resolve('./game_afterstep_drive.js'),'utf8'),context);
 assert.equal(typeof context.window.createAfterstepDrive,'function');assert.equal(context.window.createAfterstepDrive().state().capacity,5);
});
test('validated applied delta is the only committed release vector and invalid replacement is atomic', () => {
 const c=create({canRelease:()=>({ok:true,deltaVelocity:{x:2,y:0,z:0}})});c.contact(contact('limited'));const r=c.release('standard',frame());assert(r.ok);assert.deepEqual(r.deltaVelocity,{x:2,y:0,z:0});assert.deepEqual(c.state().lastRelease.deltaVelocity,r.deltaVelocity);
 const bad=create({canRelease:()=>({ok:true,deltaVelocity:{x:0,y:0,z:0}})});bad.contact(contact('still-here'));const before=bad.state();assert(!bad.release('standard',frame()).ok);assert.deepEqual(bad.state(),before);
});
test('derived expiry and mode eligibility metadata is readonly and never invokes world validation', () => {
 let calls=0;const c=create({canRelease:()=>{calls++;return true}});c.contact(contact('metadata'));const before=c.state(),meta=c.describe(frame());assert.equal(meta[0].remaining,8);assert.equal(meta[0].modes.standard.cost,6);assert(meta[0].modes.standard.eligible);assert(!meta[0].modes.launch.eligible);assert.equal(calls,0);meta[0].remaining=99;assert.deepEqual(c.state(),before);c.update(1,frame());assert.equal(c.describe(frame())[0].remaining,7);
});
console.log(`${passed} Afterstep Drive tests passed`);
