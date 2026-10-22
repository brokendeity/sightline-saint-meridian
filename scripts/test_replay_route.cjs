'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { createReplayRoute } = require('./game_replay_route.js');
const v = (x = 0, y = 0, z = 0) => ({ x, y, z });
const frame = (x = 0, extra = {}) => ({ position: v(x), hero: 'backspool', active: true, worldRevision: 1, ...extra });
let count = 0;
function test(name, fn) { fn(); count++; console.log('PASS ' + name); }
function fixture(overrides = {}, config = {}) {
  const calls = { reserve: [], unreserve: [], execute: [], sweep: [] };
  const api = {
    reserve(ids, token) { calls.reserve.push({ ids, token }); return true; },
    unreserve(token) { calls.unreserve.push(token); return true; },
    execute(action, token) { calls.execute.push({ action, token }); return { ok: true }; },
    sweepClear(a, b) { calls.sweep.push([a, b]); return true; }, ...overrides
  };
  const c = createReplayRoute(api, config);
  return { c, calls, record(actions = [{ type: 'drive', resourceCost: 1 }]) {
    assert(c.start(frame()).ok); assert(c.capture(.5, frame(.5), actions).ok);
    assert(c.capture(.5, frame(1)).ok); assert(c.finish().ok);
  } };
}
test('CommonJS and browser exports have no runtime dependency', () => {
  assert.equal(require('./game_replay_route.js').create, createReplayRoute);
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(require.resolve('./game_replay_route.js'), 'utf8'), context);
  assert.equal(typeof context.window.createReplayRoute, 'function');
});
test('recording is bounded to four seconds, eight actions and 120 traces', () => {
  const { c } = fixture(); assert(c.start(frame()).ok);
  for (let i = 1; i <= 1000; i++) c.capture(.01, frame(Math.min(i * .01, 4)), i <= 10 ? [{ type: 'jump' }] : []);
  const s = c.state(); assert.equal(s.route.duration, 4); assert.equal(s.route.actions.length, 8);
  assert(s.route.trace.length <= 120); assert.equal(s.route.trace[0].time, 0);
  assert.equal(s.route.trace.at(-1).time, 4); assert.equal(s.status, 'ready');
});
test('reconnect and resources validate before atomic reservation', () => {
  const { c, calls, record } = fixture(); record();
  assert.equal(c.startReplay(frame(1.351), ['a']).reason, 'reconnect-distance');
  assert.equal(c.startReplay(frame(), []).reason, 'insufficient-resources');
  assert.equal(c.startReplay(frame(), ['a', 'a']).reason, 'duplicate-resource');
  assert.equal(calls.reserve.length, 0);
  assert(c.startReplay(frame(1.35), ['a', 'spare']).ok);
  assert.deepEqual(calls.reserve[0].ids, ['a']);
});
test('replay emits scheduled actions, sweeps every crossed trace and reports movement intent only', () => {
  const { c, calls, record } = fixture(); record(); assert(c.startReplay(frame(), ['a']).ok);
  const first = c.tick(.49, frame(.49)); assert.equal(calls.execute.length, 0);
  assert(first.intent && first.intent.direction.x > 0); assert(!('position' in first)); assert(!('velocity' in first));
  const second = c.tick(.01, frame(.5)); assert.equal(calls.execute.length, 1);
  assert.deepEqual(calls.execute[0].action.resourceIds, ['a']); assert.equal(second.actions.length, 1);
  c.tick(.5, frame(1)); assert.equal(c.state().status, 'completed'); assert.equal(calls.unreserve.length, 1);
  assert(calls.sweep.length >= c.state().route.trace.length - 1);
});
test('observed divergence interrupts before actions, consumes nothing and releases escrow', () => {
  const { c, calls, record } = fixture(); record(); assert(c.startReplay(frame(), ['a']).ok);
  assert.equal(c.tick(.5, frame(3)).reason, 'route-diverged');
  assert.equal(calls.execute.length, 0); assert.equal(calls.unreserve.length, 1); assert.equal(c.state().reservedIds.length, 0);
});
test('blocked intermediate trace cannot be skipped by a large tick', () => {
  let blocked = false;
  const { c, calls, record } = fixture({ sweepClear(a, b) { return !(blocked && a.x < .4 && b.x >= .4); } });
  record(); assert(c.startReplay(frame(), ['a']).ok); blocked = true;
  assert.equal(c.tick(1, frame(1)).reason, 'blocked-route'); assert.equal(calls.execute.length, 0);
});
test('failed action stops later requests and releases unused resources once', () => {
  const { c, calls, record } = fixture({ execute(action, token) { calls.execute.push({ action, token }); return false; } });
  record([{ type: 'drive', resourceCost: 1 }, { type: 'drive', resourceCost: 1 }]);
  assert(c.startReplay(frame(), ['a', 'b']).ok); assert.equal(c.tick(.5, frame(.5)).reason, 'failed-action');
  assert.equal(calls.execute.length, 1); assert.equal(calls.unreserve.length, 1);
  c.cancel(); c.cancel(); assert.equal(calls.unreserve.length, 1);
});
test('manual input, hero change, death, inactive and world changes interrupt without advancing', () => {
  for (const [extra, reason] of [[{ manualInput: true }, 'manual-input'], [{ hero: 'other' }, 'hero-change'], [{ defeated: true }, 'defeated'], [{ active: false }, 'inactive-frame'], [{ heroActive: false }, 'inactive-frame'], [{ worldRevision: 2 }, 'world-changed']]) {
    const { c, calls, record } = fixture(); record(); assert(c.startReplay(frame(), ['a']).ok);
    assert.equal(c.tick(.5, frame(.5, extra)).reason, reason); assert.equal(calls.execute.length, 0);
    assert.equal(c.state().time, 0); assert.equal(calls.unreserve.length, 1);
  }
});
test('pause suspends simulation but does not retain expired resources magically', () => {
  let expired = false;
  const { c, calls, record } = fixture({ execute() { return !expired; } }); record(); assert(c.startReplay(frame(), ['a']).ok);
  assert.equal(c.tick(100, frame(0, { paused: true })).reason, 'paused'); assert.equal(c.state().time, 0);
  assert.equal(calls.reserve.length, 1); expired = true;
  assert.equal(c.tick(.5, frame(.5)).reason, 'failed-action'); assert.equal(calls.unreserve.length, 1);
});
test('snapshot, frames, callbacks and source actions cannot mutate stored route', () => {
  const { c, record } = fixture({ reserve(ids) { ids[0] = 'mutated'; return true; }, execute(a) { a.type = 'mutated'; return true; }, sweepClear(a, b) { a.x = 999; b.x = 999; return true; } });
  const action = { type: 'drive', resourceCost: 1, direction: v(1) }; record([action]); action.direction.x = 999;
  const s = c.state(); assert(Object.isFrozen(s)); assert(Object.isFrozen(s.route.trace[0].position));
  assert.equal(c.state().route.actions[0].direction.x, 1); assert(c.startReplay(frame(), ['a']).ok);
  c.tick(.5, frame(.5)); assert.equal(c.state().route.actions[0].type, 'drive');
  assert.equal(c.state().route.trace[0].position.x, 0);
});
test('unique IDs survive cancel, reset and recording replacement', () => {
  const { c, calls, record } = fixture(); record(); const first = c.state().route;
  assert(c.startReplay(frame(), ['a']).ok); c.cancel(); c.reset(); record(); const next = c.state().route;
  assert(next.id > first.id); assert(next.actions[0].id > first.actions[0].id);
  assert(c.startReplay(frame(), ['a']).ok); c.cancel(); assert.notEqual(calls.reserve[0].token, calls.reserve[1].token);
});
test('invalid input and failing callbacks fail closed and cannot yield NaNs', () => {
  const { c, record } = fixture(); assert.equal(c.start(frame(NaN)).ok, false); record();
  assert.equal(c.startReplay(frame(), [NaN]).ok, false); assert(c.startReplay(frame(), ['a']).ok);
  for (const dt of [NaN, Infinity, -1]) assert.equal(c.tick(dt, frame()).reason, 'invalid-dt');
  assert.equal(c.state().time, 0); c.cancel();
  for (const api of [{ reserve: () => false }, { reserve: () => { throw Error('reserve'); } }]) {
    const f = fixture(api); f.record(); assert.equal(f.c.startReplay(frame(), ['a']).reason, 'reservation-failed');
  }
  const bare = createReplayRoute(); bare.start(frame()); bare.capture(.1, frame(.1)); bare.finish();
  assert.equal(bare.startReplay(frame(), []).reason, 'missing-sweep');
});
test('recording lifecycle and invalid action validation preserve the last good route', () => {
  const { c, record } = fixture(); record(); const id = c.state().route.id;
  assert(c.start(frame()).ok); assert.equal(c.capture(.1, frame(.1), [{ type: 'drive', resourceCost: -1 }]).reason, 'invalid-action');
  assert.equal(c.capture(NaN, frame()).reason, 'invalid-dt'); c.cancel(); assert.equal(c.state().route.id, id);
  assert(c.start(frame()).ok); assert.equal(c.capture(.1, frame(.1, { hero: 'other' })).reason, 'hero-change');
  assert.equal(c.state().route.id, id);
});
test('simulation offsets retain ordering and a large tick executes each action once', () => {
  const { c, calls } = fixture(); c.start(frame());
  c.capture(1, frame(1), [{ type: 'jump', offset: .75 }, { type: 'drive', resourceCost: 1, offset: .25 }]); c.finish();
  assert.deepEqual(c.state().route.actions.map(a => a.time), [.25, .75]);
  assert(c.startReplay(frame(), ['a']).ok); c.tick(.3, frame(.3));
  assert.deepEqual(calls.execute.map(e => e.action.type), ['drive']); c.tick(.7, frame(1));
  assert.deepEqual(calls.execute.map(e => e.action.type), ['drive', 'jump']);
  c.tick(1, frame(1)); assert.equal(calls.execute.length, 2);
});
test('configuration only tightens approved bounds and preserves early trace endpoints', () => {
  const { c } = fixture({}, { maxSeconds: 900, maxActions: 90, maxSamples: 900, reconnectDistance: 5, maxDeviation: 8 });
  assert.deepEqual(c.state().limits, { maxSeconds: 4, maxActions: 8, maxSamples: 120, reconnectDistance: 1.35, maxDeviation: 1.5 });
  c.start(frame()); c.capture(.001, frame(.001)); c.finish();
  assert.equal(c.state().route.trace.length, 2); assert.equal(c.state().route.trace.at(-1).position.x, .001);
  const small = fixture({}, { maxSeconds: .2, maxSamples: 2 }); small.c.start(frame()); small.c.capture(1, frame(10));
  assert.equal(small.c.state().route.trace.length, 2); assert.equal(small.c.state().route.trace.at(-1).position.x, 2);
});
test('unsafe JSON payloads, invalid positions and callback exceptions fail closed', () => {
  const { c } = fixture(); c.start(frame()); const cycle = { type: 'jump' }; cycle.self = cycle;
  for (const action of [cycle, { type: 'jump', payload: Infinity }, { type: 'jump', payload: new Array(100000) }, { type: 'jump', payload: 'x'.repeat(9000) }, { type: 'jump', offset: -.1 }]) {
    assert.equal(c.capture(.1, frame(.1), [action]).ok, false); assert.equal(c.state().recording.actionCount, 0);
  }
  assert.equal(c.capture(.1, frame(1e308)).reason, 'invalid-frame');
  for (const kind of ['execute', 'sweepClear']) {
    let fail = false; const f = fixture({ [kind]: () => { if (fail) throw Error('callback'); return true; } });
    f.record(); assert(f.c.startReplay(frame(), ['a']).ok); fail = true;
    assert.equal(f.c.tick(.5, frame(.5)).reason, kind === 'execute' ? 'failed-action' : 'blocked-route');
    assert.equal(f.c.state().reservedIds.length, 0);
  }
});
test('different controller instances cannot collide on escrow tokens', () => {
  const a = fixture(), b = fixture(); a.record(); b.record();
  assert(a.c.startReplay(frame(), ['a']).ok); assert(b.c.startReplay(frame(), ['b']).ok);
  assert.notEqual(a.calls.reserve[0].token, b.calls.reserve[0].token);
});
test('source reconnect is swept and world changes cannot replay an obsolete recording', () => {
  const { c, calls, record } = fixture({ sweepClear: () => false }); record();
  assert.equal(c.startReplay(frame(.1), ['a']).reason, 'blocked-reconnect'); assert.equal(calls.reserve.length, 0);
  const f = fixture(); f.record(); assert.equal(f.c.startReplay(frame(0, { worldRevision: 2 }), ['a']).reason, 'world-changed');
  assert.equal(f.calls.reserve.length, 0);
});
test('resource-free actions use no bank and replay never writes its frame', () => {
  const { c, calls, record } = fixture(); record([{ type: 'jump' }]);
  const f = Object.freeze({ ...frame(), position: Object.freeze(v()) }); assert(c.startReplay(f, []).ok);
  c.tick(.01, f); assert.equal(f.position.x, 0); assert.equal(calls.reserve.length, 0); c.cancel(); assert.equal(calls.unreserve.length, 0);
});
console.log(`${count} Replay Route tests passed`);
