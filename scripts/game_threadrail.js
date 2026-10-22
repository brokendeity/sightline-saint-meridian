(function (root, factory) {
  'use strict';
  var create = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = create;
    module.exports.create = create;
    module.exports.createThreadrail = create;
  }
  if (root) root.createThreadrail = create;
})(typeof window !== 'undefined' ? window : typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var EPS = 1e-8;
  function vec(v) { return !!v && Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z); }
  function copy(v) { return { x: v.x, y: v.y, z: v.z }; }
  function add(a, b) { return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }; }
  function sub(a, b) { return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }; }
  function mul(v, k) { return { x: v.x * k, y: v.y * k, z: v.z * k }; }
  function dot(a, b) { return a.x * b.x + a.y * b.y + a.z * b.z; }
  function length(v) { return Math.hypot(v.x, v.y, v.z); }
  function unit(v) { var n = length(v); return n > EPS ? mul(v, 1 / n) : { x: 0, y: 0, z: 0 }; }
  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function anchorCopy(a) { return { id: a.id, position: copy(a.position), normal: copy(a.normal), ownerId: a.ownerId, revision: a.revision, valid: a.valid !== false }; }
  function cap(v, maximum) { var n = length(v); return n > maximum ? mul(v, maximum / n) : copy(v); }
  function option(c, key, fallback, lo, hi) { return Number.isFinite(c[key]) ? clamp(c[key], lo, hi) : fallback; }

  return function createThreadrail(api, config) {
    api = api || {}; config = config || {};
    // Configuration can tighten physical limits, never widen the approved bounds.
    var limits = {
      minSpan: option(config, 'minSpan', 6, 6, 100), maxSpan: option(config, 'maxSpan', 100, 6, 100),
      maxSlope: option(config, 'maxSlope', 55, 0, 55), maxRails: Math.floor(option(config, 'maxRails', 4, 1, 4)),
      maxAnchors: Math.floor(option(config, 'maxAnchors', 8, 2, 8)), lifetime: option(config, 'lifetime', 30, .01, 30),
      attachReach: option(config, 'attachReach', 2, 0, 2), transferReach: option(config, 'transferReach', 3, 0, 3),
      maxSpeed: option(config, 'maxSpeed', 28, .1, 28), gravity: option(config, 'gravity', 9.81, 0, 50),
      friction: option(config, 'friction', .45, 0, 20), junctionAngle: option(config, 'junctionAngle', 75, 0, 75),
      jumpImpulse: option(config, 'jumpImpulse', 4.8, 0, 6.5), slingshotImpulse: option(config, 'slingshotImpulse', 6.5, 0, 6.5)
    };
    var anchors = new Map(), rails = new Map(), current = null, time = 0, nextRail = 1, nextEvent = 1;
    var events = [], lastReason = 'ready', lastPosition = { x: 0, y: 0, z: 0 }, lastVelocity = { x: 0, y: 0, z: 0 };
    var cosineLimit = Math.cos(limits.junctionAngle * Math.PI / 180);
    function event(type, fields) {
      var e = Object.assign({ id: nextEvent++, type: type, time: time }, fields || {});
      events.push(e); if (events.length > 128) events.shift(); return clone(e);
    }
    function fail(reason) { lastReason = reason; return { ok: false, reason: reason }; }
    function result(owns, reason, extra) {
      return Object.assign({ ownsMovement: !!owns, position: copy(current ? current.position : lastPosition),
        velocity: copy(current ? current.velocity : lastVelocity), landed: false, kind: 'rail',
        railId: current ? current.railId : null, time: time, speed: length(current ? current.velocity : lastVelocity),
        reason: reason || lastReason }, extra || {});
    }
    function callback(name, args) {
      if (typeof api[name] !== 'function') return { ok: true };
      try {
        var answer = api[name].apply(api, args);
        if (answer === false || answer === null || (typeof answer === 'number' && !Number.isFinite(answer))) return { ok: false };
        if (answer && typeof answer === 'object' && (answer.ok === false || answer.valid === false || answer.clear === false || answer.supported === false || answer.destroyed === true)) return { ok: false };
        return { ok: true, answer: answer };
      } catch (_) { return { ok: false }; }
    }
    function anchorReason(a) {
      if (!a || (typeof a.id !== 'string' && typeof a.id !== 'number') || (typeof a.id === 'number' && !Number.isFinite(a.id)) || String(a.id).length === 0 ||
          !vec(a.position) || !vec(a.normal) || length(a.normal) < EPS || a.valid === false ||
          (typeof a.ownerId !== 'string' && typeof a.ownerId !== 'number') || (typeof a.ownerId === 'number' && !Number.isFinite(a.ownerId)) || String(a.ownerId).length === 0 ||
          (a.revision !== undefined && typeof a.revision !== 'string' && !Number.isFinite(a.revision))) return 'invalid-anchor';
      var check = callback('validateAnchor', [anchorCopy(a)]);
      if (!check.ok) return 'invalid-owner';
      var response = check.answer;
      if (response && typeof response === 'object' &&
          ((response.ownerId !== undefined && response.ownerId !== a.ownerId) ||
           (response.revision !== undefined && response.revision !== a.revision) ||
           (response.position !== undefined && (!vec(response.position) || length(sub(response.position, a.position)) > .001)))) return 'anchor-changed';
      if (!callback('supportAt', [copy(a.position), anchorCopy(a)]).ok) return 'unsupported-anchor';
      return null;
    }
    function sweep(from, to, kind, rail) {
      return callback('sweepClear', [copy(from), copy(to), { kind: kind, rail: rail ? clone(rail) : null }]).ok;
    }
    function railReason(rail) {
      if (!rail) return 'missing-rail';
      if (time >= rail.expiresAt - EPS) return 'expired';
      var a = anchors.get(rail.a), b = anchors.get(rail.b);
      var reason = anchorReason(a) || anchorReason(b);
      if (reason) return reason;
      return sweep(a.position, b.position, 'rail-path', rail) ? null : 'blocked-path';
    }
    function orphanCleanup() {
      var used = new Set(); rails.forEach(function (r) { used.add(r.a); used.add(r.b); });
      anchors.forEach(function (_, id) { if (!used.has(id)) anchors.delete(id); });
    }
    function dropRail(id, reason) {
      if (!rails.has(id)) return;
      rails.delete(id); orphanCleanup(); event('rail-removed', { railId: id, reason: reason });
    }
    function detach(reason) {
      reason = reason || 'detached';
      if (!current) return Object.assign(result(false, reason), { ok: false });
      var railId = current.railId;
      lastPosition = copy(current.position); lastVelocity = copy(current.velocity); current = null;
      lastReason = reason; event('detach', { railId: railId, reason: reason, velocity: copy(lastVelocity) });
      return Object.assign(result(false, reason), { ok: true, railId: railId });
    }
    function create(a, b) {
      var reason = anchorReason(a) || anchorReason(b); if (reason) return fail(reason);
      if (a.id === b.id) return fail('same-anchor');
      for (var existingRail of rails.values()) {
        if ((existingRail.a === a.id && existingRail.b === b.id) || (existingRail.a === b.id && existingRail.b === a.id)) return fail('duplicate-rail');
      }
      var distance = length(sub(b.position, a.position));
      if (!Number.isFinite(distance) || distance < limits.minSpan - EPS || distance > limits.maxSpan + EPS) return fail('span-limit');
      var slope = Math.asin(clamp(Math.abs(b.position.y - a.position.y) / distance, 0, 1)) * 180 / Math.PI;
      if (slope > limits.maxSlope + EPS) return fail('slope-limit');
      if (rails.size >= limits.maxRails) return fail('rail-capacity');
      var additions = 0;
      for (var endpoint of [a, b]) {
        var existing = anchors.get(endpoint.id);
        if (existing && (existing.ownerId !== endpoint.ownerId || existing.revision !== endpoint.revision ||
            length(sub(existing.position, endpoint.position)) > EPS || length(sub(existing.normal, endpoint.normal)) > EPS)) return fail('anchor-conflict');
        if (!existing) additions++;
      }
      if (anchors.size + additions > limits.maxAnchors) return fail('anchor-capacity');
      // No identifiers, topology or placement events are consumed on validation failure.
      var rail = { id: 'rail-' + nextRail, a: a.id, b: b.id, length: distance, tangent: unit(sub(b.position, a.position)),
        slope: slope, createdAt: time, expiresAt: time + limits.lifetime };
      if (!sweep(a.position, b.position, 'placement', rail)) return fail('blocked-path');
      if (!anchors.has(a.id)) anchors.set(a.id, anchorCopy(a));
      if (!anchors.has(b.id)) anchors.set(b.id, anchorCopy(b));
      rails.set(rail.id, rail); nextRail++;
      lastReason = 'created'; event('create', { railId: rail.id, a: a.id, b: b.id });
      return { ok: true, reason: 'created', rail: clone(rail) };
    }
    function closest(rail, position) {
      var start = anchors.get(rail.a).position, distance = clamp(dot(sub(position, start), rail.tangent), 0, rail.length);
      return { distance: distance, position: add(start, mul(rail.tangent, distance)) };
    }
    function usableFrame(frame) {
      return frame && frame.active !== false && !frame.paused && !frame.defeated && !frame.blocked && !frame.retracing && !frame.preview && vec(frame.position) && vec(frame.velocity);
    }
    function attach(frame, railId, direction) {
      if (!usableFrame(frame)) return fail('inactive-frame');
      if (current) return fail('already-attached');
      var rail = rails.get(railId), reason = railReason(rail); if (reason) return fail(reason);
      var point = closest(rail, frame.position);
      if (length(sub(frame.position, point.position)) > limits.attachReach + EPS) return fail('attach-reach');
      if (!sweep(frame.position, point.position, 'attach', rail)) return fail('blocked-attach');
      var speed = clamp(dot(frame.velocity, rail.tangent), -limits.maxSpeed, limits.maxSpeed);
      // Direction is a route preference only. Momentum remains the signed projection.
      current = { railId: railId, distance: point.distance, signedSpeed: speed, speed: Math.abs(speed), position: point.position,
        velocity: mul(rail.tangent, speed), hero: frame.hero, direction: vec(direction) ? copy(direction) : direction === -1 ? mul(rail.tangent, -1) : direction === 1 ? copy(rail.tangent) : null };
      lastPosition = copy(current.position); lastVelocity = copy(current.velocity); lastReason = 'attached';
      event('attach', { railId: railId, speed: Math.abs(speed) }); return Object.assign(result(true, 'attached'), { ok: true });
    }
    function candidates(rail, endpointId, incoming, desired) {
      var found = [];
      rails.forEach(function (out) {
        if (out.id === rail.id || (out.a !== endpointId && out.b !== endpointId) || railReason(out)) return;
        var sign = out.a === endpointId ? 1 : -1, tangent = mul(out.tangent, sign), cosine = dot(incoming, tangent);
        var preference = desired && length(desired) > EPS ? dot(unit(desired), tangent) : cosine;
        if (cosine + EPS >= cosineLimit && preference + EPS >= cosineLimit) found.push({ rail: out, sign: sign, tangent: tangent, cosine: cosine, preference: preference });
      });
      found.sort(function (a, b) { return b.preference - a.preference || b.cosine - a.cosine || String(a.rail.id).localeCompare(String(b.rail.id)); });
      return found;
    }
    function enterJunction(candidate, speed) {
      var old = current.railId, out = candidate.rail;
      current.railId = out.id; current.distance = candidate.sign > 0 ? 0 : out.length;
      current.signedSpeed = speed * candidate.cosine * candidate.sign; current.speed = Math.abs(current.signedSpeed);
      current.position = copy(anchors.get(candidate.sign > 0 ? out.a : out.b).position);
      current.velocity = mul(out.tangent, current.signedSpeed); current.driveDirection = null;
      event('junction', { fromId: old, railId: out.id, speed: current.speed });
    }
    function transfer(frame, toId) {
      if (!current) return fail('not-attached');
      if (!usableFrame(frame) || (current.hero !== undefined && frame.hero !== current.hero)) return fail('inactive-frame');
      if (toId === current.railId) return fail('same-rail');
      var rail = rails.get(toId), reason = railReason(rails.get(current.railId)) || railReason(rail); if (reason) return fail(reason);
      var point = closest(rail, current.position);
      if (length(sub(point.position, current.position)) > limits.transferReach + EPS) return fail('transfer-reach');
      if (!sweep(current.position, point.position, 'transfer', rail)) return fail('blocked-transfer');
      var projection = dot(current.velocity, rail.tangent), speed = length(current.velocity);
      if (speed > EPS && Math.abs(projection) / speed + EPS < cosineLimit) return fail('transfer-angle');
      var old = current.railId;
      current.railId = toId; current.distance = point.distance; current.position = point.position;
      current.signedSpeed = projection; current.speed = Math.abs(projection); current.velocity = mul(rail.tangent, projection);
      lastReason = 'transferred'; event('transfer', { fromId: old, railId: toId, speed: current.speed });
      return Object.assign(result(true, 'transferred'), { ok: true });
    }
    function jump(frame, options) {
      if (!current) return fail('not-attached');
      if (!usableFrame(frame) || (current.hero !== undefined && current.hero !== frame.hero)) return fail('inactive-frame');
      var reason = railReason(rails.get(current.railId)); if (reason) return detach(reason);
      var velocity = cap(add(current.velocity, { x: 0, y: options && options.slingshot ? limits.slingshotImpulse : limits.jumpImpulse, z: 0 }), limits.maxSpeed);
      current.velocity = velocity;
      var outcome = detach(options && options.slingshot ? 'slingshot' : 'jump');
      // The coordinator commits this one release plan, then ordinary air movement owns subsequent frames.
      outcome.ownsMovement = true; event('jump', { railId: outcome.railId, slingshot: !!(options && options.slingshot), velocity: copy(velocity) }); return outcome;
    }
    function applyDrive(deltaVelocity) {
      if (!current) return fail('not-attached');
      if (!vec(deltaVelocity) || length(deltaVelocity) < EPS) return fail('invalid-impulse');
      var rail = rails.get(current.railId), reason = railReason(rail); if (reason) return fail(reason);
      var before = copy(current.velocity), projection = dot(deltaVelocity, rail.tangent);
      var proposed = clamp(current.signedSpeed + projection, -limits.maxSpeed, limits.maxSpeed);
      if (Math.abs(proposed - current.signedSpeed) < EPS) return fail('no-projected-impulse');
      current.signedSpeed = proposed; current.speed = Math.abs(proposed); current.velocity = mul(rail.tangent, proposed);
      // Drive direction can request a physically compatible outgoing path at the next linked endpoint.
      current.driveDirection = copy(deltaVelocity); lastReason = 'drive';
      var applied = sub(current.velocity, before), e = event('drive', { railId: current.railId, deltaVelocity: applied, speed: current.speed });
      return Object.assign(result(false, 'drive'), { ok: true, deltaVelocity: applied, event: e });
    }
    function advance(h, frame) {
      var rail = rails.get(current.railId), u = current.signedSpeed, gravity = -limits.gravity * rail.tangent.y;
      var acceleration = gravity - (Math.abs(u) > EPS ? Math.sign(u) * limits.friction : Math.abs(gravity) > limits.friction ? Math.sign(gravity) * limits.friction : gravity);
      var endSpeed = clamp(u + acceleration * h, -limits.maxSpeed, limits.maxSpeed);
      var distance;
      if (u * endSpeed < 0) {
        var stop = -u / acceleration, rest = h - stop;
        var restart = Math.abs(gravity) > limits.friction ? gravity - Math.sign(gravity) * limits.friction : 0;
        distance = u * stop + .5 * acceleration * stop * stop + .5 * restart * rest * rest;
        endSpeed = restart * rest;
      } else {
        distance = .5 * (u + endSpeed) * h;
      }
      var targetDistance = current.distance + distance, bound = clamp(targetDistance, 0, rail.length);
      var position = add(anchors.get(rail.a).position, mul(rail.tangent, bound));
      if (!sweep(current.position, position, 'movement', rail)) return { detached: detach('blocked-movement'), owns: false };
      current.position = position; current.distance = bound; current.signedSpeed = endSpeed; current.speed = Math.abs(endSpeed); current.velocity = mul(rail.tangent, endSpeed);
      if (targetDistance < -EPS || targetDistance > rail.length + EPS) {
        var sign = targetDistance > rail.length ? 1 : -1, incoming = mul(rail.tangent, sign);
        var desired = current.driveDirection || (vec(frame.direction) && length(frame.direction) > EPS ? frame.direction : current.direction);
        var outgoing = candidates(rail, sign > 0 ? rail.b : rail.a, incoming, desired);
        if (!outgoing.length) return { detached: detach('rail-end'), owns: true };
        enterJunction(outgoing[0], Math.abs(endSpeed));
        // A substep loses at most 1/60 second of motion at a junction, never gains distance or energy.
      }
      return null;
    }
    function update(dt, frame) {
      frame = frame || {};
      if (frame.paused) return result(false, 'paused');
      if (!Number.isFinite(dt) || dt < 0) return result(false, 'invalid-dt');
      // All rail lifetimes are simulation time; a large dt expires finite topology without unbounded loops.
      time += Math.min(dt, 3600);
      var invalid = [];
      rails.forEach(function (rail) { var reason = railReason(rail); if (reason) invalid.push({ id: rail.id, reason: reason }); });
      var detachment = null;
      invalid.forEach(function (item) {
        if (current && current.railId === item.id) detachment = detach(item.reason);
        dropRail(item.id, item.reason);
      });
      if (detachment) return detachment;
      if (!current) return result(false, lastReason);
      if (!usableFrame(frame) || (current.hero !== undefined && frame.hero !== current.hero)) return detach(frame.hero !== current.hero ? 'hero-change' : 'interrupted');
      if (length(sub(frame.position, current.position)) > limits.attachReach + EPS) return detach('actor-displaced');
      var remaining = dt;
      while (remaining > EPS && current) {
        var h = Math.min(1 / 60, remaining), done = advance(h, frame); remaining -= h;
        if (done) { done.detached.ownsMovement = done.owns; return done.detached; }
      }
      if (current) { lastPosition = copy(current.position); lastVelocity = copy(current.velocity); }
      return result(!!current, 'grinding');
    }
    function reset(reason) {
      if (current) detach(reason || 'reset');
      rails.clear(); anchors.clear(); events = []; time = 0; lastReason = reason || 'reset';
      lastPosition = { x: 0, y: 0, z: 0 }; lastVelocity = { x: 0, y: 0, z: 0 };
      event('reset', { reason: lastReason }); return state();
    }
    function state() {
      return clone({ time: time, anchors: Array.from(anchors.values()), rails: Array.from(rails.values()), current: current, events: events, lastReason: lastReason, limits: limits });
    }
    return { create: create, attach: attach, update: update, detach: detach, jump: jump, transfer: transfer, applyDrive: applyDrive, reset: reset, state: state };
  };
});
