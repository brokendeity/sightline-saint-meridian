(function (root, factory) {
  'use strict';
  var create = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = create; module.exports.create = create; module.exports.createReplayRoute = create;
  }
  if (root) root.createReplayRoute = create;
})(typeof window !== 'undefined' ? window : typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var EPS = 1e-8;
  function vec(v) { return !!v && [v.x, v.y, v.z].every(function (n) { return Number.isFinite(n) && Math.abs(n) <= 1e9; }); }
  function copy(v) { return { x: v.x, y: v.y, z: v.z }; }
  function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z); }
  function lerp(a, b, t) { return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t }; }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function freeze(value) {
    if (value && typeof value === 'object') { Object.keys(value).forEach(function (k) { freeze(value[k]); }); Object.freeze(value); }
    return value;
  }
  function identifier(value) { return (typeof value === 'string' && value.length > 0 && value.length <= 256) || (typeof value === 'number' && Number.isFinite(value)); }
  function option(config, key, fallback, low, high) { return Number.isFinite(config[key]) ? Math.max(low, Math.min(high, config[key])) : fallback; }
  // Action payloads are bounded JSON data. Reject cycles, exotic objects and nonfinite values instead of silently changing them.
  function jsonData(value, depth, seen) {
    if (value === null || typeof value === 'boolean') return true;
    if (typeof value === 'number') return Number.isFinite(value);
    if (typeof value === 'string') return value.length <= 2048;
    if (!value || typeof value !== 'object' || depth > 6 || seen.indexOf(value) >= 0) return false;
    if (Array.isArray(value) && value.length > 64) return false;
    if (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) return false;
    var keys = Object.keys(value); if (keys.length > 64) return false;
    seen.push(value);
    var valid = keys.every(function (key) { return key !== '__proto__' && key !== 'constructor' && key !== 'prototype' && jsonData(value[key], depth + 1, seen); });
    seen.pop(); return valid;
  }
  var nextInstance = 1;
  return function createReplayRoute(api, config) {
    api = api || {}; config = config || {};
    var limits = { maxSeconds: option(config, 'maxSeconds', 4, .01, 4),
      maxActions: Math.floor(option(config, 'maxActions', 8, 0, 8)), maxSamples: Math.floor(option(config, 'maxSamples', 120, 2, 120)),
      reconnectDistance: option(config, 'reconnectDistance', 1.35, 0, 1.35), maxDeviation: option(config, 'maxDeviation', 1.5, 0, 1.5) };
    var route = null, draft = null, replay = null, status = 'empty', reason = 'ready', inCallback = false;
    var instanceId = nextInstance++, nextRoute = 1, nextAction = 1, nextTrace = 1, nextReplay = 1;
    var counters = { recordings: 0, replays: 0, completed: 0, interrupted: 0, executed: 0, rejectedActions: 0 };
    function response(ok, why, extra) { return Object.assign({ ok: ok, status: status, reason: why || reason, time: replay ? replay.time : draft ? draft.time : 0 }, extra || {}); }
    function fail(why) { return response(false, why); }
    function callback(name, args) {
      if (typeof api[name] !== 'function') return false;
      try {
        inCallback = true;
        var answer = api[name].apply(api, args);
        return answer === true || (!!answer && typeof answer === 'object' && typeof answer.then !== 'function' &&
          (answer.ok === true || (name === 'sweepClear' && answer.clear === true)) && answer.ok !== false && answer.clear !== false);
      } catch (_) { return false; } finally { inCallback = false; }
    }
    function frameReason(frame, baseline, manual) {
      if (!frame || !vec(frame.position) || (frame.hero !== undefined && !identifier(frame.hero)) ||
          (frame.worldRevision !== undefined && !identifier(frame.worldRevision))) return 'invalid-frame';
      if (frame.dead || frame.defeated || frame.alive === false) return 'defeated';
      if (baseline && frame.hero !== baseline.hero) return 'hero-change';
      if (baseline && frame.worldRevision !== baseline.worldRevision) return 'world-changed';
      if (frame.worldChanged || frame.changedWorld) return 'world-changed';
      if (frame.active === false || frame.heroActive === false || frame.blocked || frame.retracing || frame.preview) return 'inactive-frame';
      if (manual && (frame.manualInput || frame.interrupted)) return 'manual-input';
      return null;
    }
    function baseline(frame) { return { hero: frame.hero, worldRevision: frame.worldRevision }; }
    function release() {
      if (!replay || replay.released) return;
      replay.released = true;
      // Only the owner of the bank can release the token; consumed resources stay consumed, expiry stays unchanged.
      if (replay.resourceIds.length) callback('unreserve', [replay.token]);
      replay.reservedIds = [];
    }
    function stop(why, finished) {
      release(); status = finished ? 'completed' : 'interrupted'; reason = why;
      if (finished) counters.completed++; else counters.interrupted++;
      return response(!!finished, why);
    }
    function start(frame) {
      if (inCallback) return fail('callback-busy');
      if (replay && status === 'replaying') return fail('replay-active');
      var why = frameReason(frame); if (why) return fail(why); if (frame.paused) return fail('paused');
      draft = { id: nextRoute++, time: 0, duration: 0, hero: frame.hero, worldRevision: frame.worldRevision,
        trace: [{ id: nextTrace++, time: 0, position: copy(frame.position) }], actions: [], previous: copy(frame.position), nextSample: 1 };
      replay = null; status = 'recording'; reason = 'recording'; counters.recordings++;
      return response(true);
    }
    function actionData(action, time) {
      if (!action || Array.isArray(action) || !jsonData(action, 0, [])) return null;
      if (typeof action.type !== 'string' || !action.type.length || action.type.length > 64) return null;
      var cost = action.resourceCost === undefined ? 0 : action.resourceCost;
      if (!Number.isInteger(cost) || cost < 0 || cost > 5) return null;
      var result = clone(action);
      if (JSON.stringify(result).length > 8192) return null;
      // Recorded resource identities are historical evidence only; each replay receives fresh escrow identities.
      delete result.resourceIds; delete result.impulseIds; delete result.token; delete result.id;
      delete result.time; delete result.offset;
      result.time = time; result.resourceCost = cost;
      return result;
    }
    function finish() {
      if (inCallback) return fail('callback-busy');
      if (!draft || status !== 'recording') return fail('not-recording');
      if (draft.time <= EPS) return fail('empty-recording');
      var last = draft.trace[draft.trace.length - 1];
      if (Math.abs(last.time - draft.time) <= EPS) { last.time = draft.time; last.position = copy(draft.previous); }
      else {
        var end = { id: nextTrace++, time: draft.time, position: copy(draft.previous) };
        if (draft.trace.length >= limits.maxSamples) draft.trace[draft.trace.length - 1] = end;
        else draft.trace.push(end);
      }
      route = { id: draft.id, duration: draft.time, hero: draft.hero, worldRevision: draft.worldRevision,
        source: copy(draft.trace[0].position), trace: draft.trace, actions: draft.actions,
        requiredResources: draft.actions.reduce(function (sum, action) { return sum + action.resourceCost; }, 0) };
      draft = null; status = 'ready'; reason = 'recorded'; return response(true);
    }
    function capture(dt, frame, actionEvents) {
      if (inCallback) return fail('callback-busy');
      if (!draft || status !== 'recording') return fail('not-recording');
      if (!Number.isFinite(dt) || dt < 0) return fail('invalid-dt');
      var why = frameReason(frame, draft);
      if (why) { draft = null; status = route ? 'ready' : 'empty'; reason = why; return fail(why); }
      if (frame.paused) return response(true, 'paused');
      actionEvents = actionEvents === undefined ? [] : actionEvents;
      if (!Array.isArray(actionEvents) || actionEvents.length > 64) return fail('invalid-actions');
      var before = draft.time, after = Math.min(limits.maxSeconds, before + dt), duration = after - before, additions = [];
      for (var i = 0; i < actionEvents.length; i++) {
        var source = actionEvents[i], offset = source && source.offset === undefined ? dt : source && source.offset;
        if (!Number.isFinite(offset) || offset < 0 || offset > dt + EPS) return fail('invalid-action');
        var action = actionData(source, Math.min(limits.maxSeconds, before + offset));
        if (!action) return fail('invalid-action');
        if (before + offset > limits.maxSeconds + EPS || draft.actions.length + additions.length >= limits.maxActions) { counters.rejectedActions++; continue; }
        additions.push(action);
      }
      additions.forEach(function (action) { action.id = nextAction++; draft.actions.push(action); });
      draft.actions.sort(function (a, b) { return a.time - b.time || a.id - b.id; });
      var endpoint = dt > EPS ? lerp(draft.previous, frame.position, duration / dt) : copy(draft.previous);
      var interval = limits.maxSeconds / (limits.maxSamples - 1);
      while (draft.nextSample < limits.maxSamples && draft.nextSample * interval <= after + EPS) {
        var sampleTime = Math.min(limits.maxSeconds, draft.nextSample * interval);
        var fraction = duration > EPS ? Math.max(0, Math.min(1, (sampleTime - before) / duration)) : 0;
        draft.trace.push({ id: nextTrace++, time: sampleTime, position: lerp(draft.previous, endpoint, fraction) }); draft.nextSample++;
      }
      draft.time = after; draft.duration = after; draft.previous = endpoint;
      if (after >= limits.maxSeconds - EPS) { draft.time = limits.maxSeconds; return finish(); }
      return response(true, 'recording');
    }
    function pointAt(time) {
      var trace = route.trace;
      for (var i = 1; i < trace.length; i++) {
        if (time <= trace[i].time + EPS) {
          var a = trace[i - 1], b = trace[i], span = b.time - a.time;
          return lerp(a.position, b.position, span > EPS ? Math.max(0, Math.min(1, (time - a.time) / span)) : 1);
        }
      }
      return copy(trace[trace.length - 1].position);
    }
    function sweep(a, b) { return callback('sweepClear', [copy(a), copy(b)]); }
    function startReplay(frame, impulseIds) {
      if (inCallback) return fail('callback-busy');
      if (status === 'recording' || status === 'replaying') return fail('busy');
      if (!route) return fail('no-route');
      var why = frameReason(frame, route, true); if (why) return fail(why); if (frame.paused) return fail('paused');
      if (distance(frame.position, route.source) > limits.reconnectDistance + EPS) return fail('reconnect-distance');
      if (!Array.isArray(impulseIds) || impulseIds.length > 64 || !impulseIds.every(identifier)) return fail('invalid-resources');
      if (new Set(impulseIds).size !== impulseIds.length) return fail('duplicate-resource');
      if (impulseIds.length < route.requiredResources) return fail('insufficient-resources');
      if (typeof api.sweepClear !== 'function') return fail('missing-sweep');
      if (route.actions.length && typeof api.execute !== 'function') return fail('missing-execute');
      if (route.requiredResources && (typeof api.reserve !== 'function' || typeof api.unreserve !== 'function')) return fail('missing-reservation');
      if (!sweep(frame.position, route.source)) return fail('blocked-reconnect');
      var token = 'replay-' + instanceId + '-' + nextReplay++, ids = impulseIds.slice(0, route.requiredResources);
      if (ids.length && !callback('reserve', [ids.slice(), token])) {
        // A bank may have partially reserved before refusing; releasing this unique token makes rejection atomic.
        callback('unreserve', [token]); return fail('reservation-failed');
      }
      replay = { token: token, time: 0, actionIndex: 0, resourceIndex: 0, resourceIds: ids, reservedIds: ids.slice(), consumedIds: [], released: false };
      status = 'replaying'; reason = 'replaying'; counters.replays++;
      return response(true, reason, { token: token });
    }
    function tick(dt, frame) {
      if (inCallback) return fail('callback-busy');
      if (!replay || status !== 'replaying') return fail('not-replaying');
      if (!Number.isFinite(dt) || dt < 0) return fail('invalid-dt');
      var why = frameReason(frame, route, true); if (why) return stop(why);
      if (frame.paused) return response(true, 'paused', { actions: [], intent: null });
      var after = Math.min(route.duration, replay.time + dt), expected = pointAt(after);
      if (distance(frame.position, expected) > limits.maxDeviation + EPS) return stop('route-diverged');
      var from = pointAt(replay.time);
      // Sweep every recorded intermediate segment, even when a long frame crosses multiple samples or action times.
      for (var i = 1; i < route.trace.length; i++) {
        var sample = route.trace[i];
        if (sample.time <= replay.time + EPS || sample.time > after + EPS) continue;
        if (!sweep(from, sample.position)) return stop('blocked-route'); from = sample.position;
      }
      if (!sweep(from, expected)) return stop('blocked-route');
      var aheadTime = Math.min(route.duration, after + .1), target = pointAt(aheadTime);
      if (!sweep(frame.position, target)) return stop('blocked-route');
      replay.time = after;
      var emitted = [];
      while (replay.actionIndex < route.actions.length && route.actions[replay.actionIndex].time <= after + EPS) {
        var action = route.actions[replay.actionIndex], ids = replay.resourceIds.slice(replay.resourceIndex, replay.resourceIndex + action.resourceCost);
        var request = Object.assign(clone(action), { resourceIds: ids.slice(), impulseIds: ids.slice() });
        if (!callback('execute', [clone(request), replay.token])) return Object.assign(stop('failed-action'), { actions: emitted });
        replay.actionIndex++; replay.resourceIndex += ids.length;
        replay.consumedIds = replay.consumedIds.concat(ids); replay.reservedIds = replay.resourceIds.slice(replay.resourceIndex);
        counters.executed++; emitted.push(request);
      }
      var length = distance(frame.position, target), direction = length > EPS ? {
        x: (target.x - frame.position.x) / length, y: (target.y - frame.position.y) / length, z: (target.z - frame.position.z) / length
      } : { x: 0, y: 0, z: 0 };
      var intent = { from: copy(frame.position), to: target, direction: direction, routeTime: after, targetTime: aheadTime };
      if (after >= route.duration - EPS) return Object.assign(stop('completed', true), { actions: emitted, intent: null });
      return response(true, 'replaying', { actions: emitted, intent: intent });
    }
    function cancel(why) {
      if (inCallback) return fail('callback-busy');
      why = typeof why === 'string' && why ? why : 'cancelled';
      if (status === 'replaying') return stop(why);
      draft = null; status = route ? 'ready' : 'empty'; reason = why; return response(true);
    }
    function reset(why) {
      if (inCallback) return fail('callback-busy');
      release(); route = null; draft = null; replay = null; status = 'empty'; reason = typeof why === 'string' && why ? why : 'reset'; return state();
    }
    function state() {
      return freeze(clone({ status: status, reason: reason, time: replay ? replay.time : draft ? draft.time : 0,
        route: route, recording: draft ? { id: draft.id, time: draft.time, traceCount: draft.trace.length, actionCount: draft.actions.length } : null,
        token: replay ? replay.token : null, reservedIds: replay ? replay.reservedIds : [], consumedIds: replay ? replay.consumedIds : [],
        actionIndex: replay ? replay.actionIndex : 0, counters: counters, limits: limits,
        nextIds: { route: nextRoute, action: nextAction, trace: nextTrace, replay: nextReplay } }));
    }
    return { start: start, capture: capture, finish: finish, startReplay: startReplay, tick: tick, cancel: cancel, reset: reset, state: state };
  };
});
