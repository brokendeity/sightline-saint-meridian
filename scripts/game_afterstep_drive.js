(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = { create: factory, createAfterstepDrive: factory };
  if (root) root.createAfterstepDrive = factory;
})(typeof window !== 'undefined' ? window : null, function createAfterstepDrive(api = {}, config = {}) {
  const number = v => typeof v === 'number' && Number.isFinite(v);
  const vector = v => !!v && number(v.x) && number(v.y) && number(v.z);
  const copy = v => ({ x: v.x, y: v.y, z: v.z });
  const scale = (v, n) => ({ x: v.x * n, y: v.y * n, z: v.z * n });
  const length = v => Math.hypot(v.x, v.y, v.z);
  const unit = v => vector(v) && length(v) > 1e-8 ? scale(v, 1 / length(v)) : null;
  const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
  const clone = v => v == null ? v : JSON.parse(JSON.stringify(v));
  const bounded = (v, fallback, min, max) => number(v) ? Math.max(min, Math.min(max, v)) : fallback;
  const cfg = {
    capacity: Math.floor(bounded(config.capacity, 5, 1, 5)), lifetime: bounded(config.lifetime, 8, .1, 8),
    runInterval: bounded(config.runInterval, .25, .25, 8), perfectWindow: bounded(config.perfectWindow, .06, 0, .06),
    recoveryDelay: bounded(config.recoveryDelay, 1.5, 1.5, 100), recoveryRate: bounded(config.recoveryRate, 8, 0, 8),
    maxDelta: bounded(config.maxDelta, 28, 0, 28), hero: config.hero || 'backspool'
  };
  const costs = { standard: 8, directional: 10, launch: 14, ghoststep: 10, brake: 8, 'double-step': 8, rail: 8 };
  const actions = new Set(['footplant', 'jump', 'landing', 'wallKick', 'vault', 'sideStep', 'rebound']);
  const launchActions = new Set(['jump', 'wallKick', 'rebound', 'vault']);
  const directionalActions = new Set(['sideStep', 'rebound', 'wallKick']);
  let bank = [], now = 0, strain = bounded(config.initialStrain, 0, 0, 100), lastRun = -Infinity;
  let lastBeat = null, lastRelease = null, doubleStep = null, sequence = 0, reason = 'INITIAL', releasing = false;
  const seen = new Set();
  const failure = why => ({ ok: false, reason: why, deltaVelocity: { x: 0, y: 0, z: 0 }, spent: [], event: null });
  const event = (type, data) => ({ type, id: `afterstep-${++sequence}`, sequence, time: now, ...data });
  function state() {
    return clone({ now, strain, capacity: cfg.capacity, bank, lastBeat, lastRelease, doubleStep, eventSequence: sequence, reason });
  }
  function expire() { bank = bank.filter(item => item.expiresAt > now + 1e-10); }
  function contact(input) {
    if (releasing) return failure('BUSY');
    if (!input || !((typeof input.id === 'string' && input.id.trim()) || (number(input.id) && input.id >= 0))) return failure('INVALID_ID');
    const id = String(input.id);
    if (seen.has(id)) return failure('DUPLICATE');
    const action = input.action === 'run' || input.action === 'running' ? 'footplant' : input.action;
    if (!actions.has(action)) return failure('INVALID_ACTION');
    const provenance = [input.source, input.cause, input.parentType, input.origin].filter(v => v != null).join(' ').toLowerCase();
    if (input.synthetic || input.fromDrive || input.driveGenerated || /drive|afterstep|replay/.test(provenance)) return failure('SYNTHETIC_CONTACT');
    const physical = input.groundSupported === true || input.grounded === true || input.supported === true ||
      (['wallKick', 'vault', 'rebound', 'sideStep'].includes(action) && (input.wallSupported === true || input.surfaceSupported === true));
    if (!physical) return failure('NO_SUPPORT');
    const supplied = input.vector || input.impulse;
    let direction, magnitude;
    if (supplied != null) {
      if (!vector(supplied) || !(length(supplied) > 0)) return failure('INVALID_IMPULSE');
      magnitude = length(supplied); direction = unit(supplied);
      if (input.magnitude != null && (!number(input.magnitude) || Math.abs(input.magnitude - magnitude) > 1e-5)) return failure('IMPULSE_MISMATCH');
    } else { direction = unit(input.direction); magnitude = input.magnitude; }
    if (!direction || !number(magnitude) || magnitude <= 0 || !vector(scale(direction, magnitude))) return failure('INVALID_IMPULSE');
    if (input.time != null && (!number(input.time) || input.time > now + 1e-6 || input.time <= now - cfg.lifetime)) return failure('INVALID_TIME');
    if (action === 'footplant' && now - lastRun < cfg.runInterval - 1e-10) return failure('CONTACT_INTERVAL');
    expire();
    let replaced = null;
    if (bank.length >= cfg.capacity) {
      const index = action === 'footplant' ? -1 : bank.findIndex(item => item.action === 'footplant' && item.reservedBy === null);
      if (index < 0) return failure('BANK_FULL');
      replaced = bank[index].id; bank.splice(index, 1);
    }
    const time = input.time == null ? now : input.time;
    const item = { id, action, direction, magnitude, vector: scale(direction, magnitude), time, expiresAt: time + cfg.lifetime, reservedBy: null };
    bank.push(item); seen.add(id); lastBeat = time;
    if (action === 'footplant') lastRun = now;
    const confirmed = event('contact', { contactId: id, action, vector: copy(item.vector), direction: copy(direction), magnitude, replaced });
    reason = 'CONTACT';
    return { ok: true, reason, id, replaced, event: confirmed };
  }
  function update(dt, frame) {
    if (releasing || !number(dt) || dt <= 0 || !frame || frame.active !== true || frame.hero !== cfg.hero) return state();
    const previous = now; now += dt;
    if (!number(now)) { now = previous; return state(); }
    expire();
    const recoverFrom = lastRelease ? lastRelease.time + cfg.recoveryDelay : cfg.recoveryDelay;
    const recovering = Math.max(0, now - Math.max(previous, recoverFrom));
    strain = Math.max(0, strain - recovering * cfg.recoveryRate);
    return state();
  }
  function railDirection(frame) {
    if (!frame.rail || frame.rail.attached === false) return null;
    return unit(frame.rail.tangent || frame.rail.direction);
  }
  function modeFor(requested, frame, options) {
    if (requested !== 'auto') return requested;
    if (railDirection(frame)) return 'rail';
    if (frame.jumpHeld) return 'launch';
    const direction = unit(options.direction || frame.direction), velocity = unit({ ...frame.velocity, y: 0 });
    if (direction && velocity && Math.abs(dot(direction, velocity)) < .45) return 'directional';
    return 'standard';
  }
  function compatible(item, mode, frame, options) {
    if (mode === 'standard') return { direction: copy(item.direction), magnitude: item.magnitude };
    let direction;
    if (mode === 'launch') {
      if (!launchActions.has(item.action) || item.vector.y <= 0) return null;
      direction = { x: 0, y: 1, z: 0 };
    } else if (mode === 'rail') {
      direction = railDirection(frame); if (!direction) return null;
    } else if (mode === 'brake') {
      const velocity = unit(frame.velocity); if (!velocity) return null;
      direction = scale(velocity, -1);
      if (!(item.vector.y > 0 || dot(item.direction, velocity) < -.01)) return null;
    } else {
      direction = unit(options.direction || frame.direction); if (!direction) return null;
      const travel = unit({ ...frame.velocity, y: 0 });
      const lateral = travel && Math.abs(dot(item.direction, travel)) < .45;
      if (mode === 'directional' && !directionalActions.has(item.action) && !lateral) return null;
    }
    if (dot(item.direction, direction) < .5 - 1e-10) return null;
    return { direction, magnitude: item.magnitude };
  }
  function release(requested = 'auto', frame, options = {}) {
    if (releasing) return failure('BUSY');
    if (!frame || frame.active !== true || frame.hero !== cfg.hero) return failure('INACTIVE');
    if (!vector(frame.position) || !vector(frame.velocity)) return failure('INVALID_FRAME');
    options = options || {};
    let mode = modeFor(requested, frame, options);
    if (!Object.prototype.hasOwnProperty.call(costs, mode)) return failure('INVALID_MODE');
    expire();
    if (!bank.length) return failure('EMPTY');
    if (mode === 'rail' && !railDirection(frame)) return failure('NO_RAIL');
    const token = options.reservationToken == null ? null : String(options.reservationToken);
    const requestedIds = options.ids == null ? null : options.ids;
    if (requestedIds && (!Array.isArray(requestedIds) || requestedIds.length !== 1)) return failure('INVALID_IDS');
    const eligible = bank.filter(item => item.reservedBy === token && (!requestedIds || requestedIds.map(String).includes(item.id)));
    if (!eligible.length) return failure(token ? 'RESERVATION' : 'RESERVED');
    let selected = null, proposal = null;
    for (const item of eligible) { const result = compatible(item, mode, frame, options); if (result) { selected = item; proposal = result; break; } }
    if (!selected && requested === 'auto' && mode === 'directional') {
      mode = 'standard'; selected = eligible[0]; proposal = compatible(selected, mode, frame, options);
    }
    if (!selected) return failure('INCOMPATIBLE');
    const demanding = ['launch', 'directional', 'ghoststep', 'double-step', 'rail'].includes(mode);
    if (demanding && strain >= 85) return failure('STRAIN');
    const second = mode === 'double-step' && doubleStep && now - doubleStep.time <= .7;
    const beat = number(options.beatTime) ? options.beatTime : second ? doubleStep.time + .32 : lastBeat;
    const perfect = number(beat) && Math.abs(now - beat) <= cfg.perfectWindow + 1e-10;
    const cost = costs[mode] * (perfect ? .75 : 1);
    if (strain + cost > 100 + 1e-10) return failure('STRAIN_CAPACITY');
    let magnitude = Math.min(cfg.maxDelta, proposal.magnitude * (perfect ? 1 : .7));
    if (mode === 'brake') magnitude = Math.min(magnitude, length(frame.velocity));
    let deltaVelocity = scale(proposal.direction, magnitude);
    releasing = true;
    try {
      if (typeof api.canRelease === 'function') {
        const validation = api.canRelease(clone(frame), copy(deltaVelocity), mode);
        if (validation !== true && !(validation && validation.ok === true)) return failure(validation && validation.reason || 'OBSTRUCTED');
        if (validation && validation.deltaVelocity != null) {
          if (!vector(validation.deltaVelocity) || length(validation.deltaVelocity) < 1e-8 || length(validation.deltaVelocity) > length(deltaVelocity) + 1e-7) return failure('INVALID_APPLIED_IMPULSE');
          deltaVelocity = copy(validation.deltaVelocity);
        }
      }
      // Commit only after collision, compatibility and capacity checks have all succeeded.
      bank.splice(bank.indexOf(selected), 1); strain = Math.min(100, strain + cost);
      const confirmed = event('release', { mode, contactId: selected.id, action: selected.action, perfect, cost, deltaVelocity: copy(deltaVelocity), spent: [selected.id], doubleStep: mode === 'double-step' ? (second ? 2 : 1) : 0 });
      lastRelease = clone(confirmed);
      doubleStep = mode === 'double-step' && !second ? { time: now, contactId: selected.id } : null;
      reason = 'RELEASED';
      return { ok: true, reason, deltaVelocity, spent: [selected.id], event: confirmed };
    } catch (_) { return failure('VALIDATION_ERROR'); }
    finally { releasing = false; }
  }
  function describe(frame) {
    return bank.map(item => ({ id: item.id, remaining: Math.max(0, item.expiresAt - now), modes: Object.fromEntries(Object.keys(costs).map(mode => {
      const demanding = ['launch', 'directional', 'ghoststep', 'double-step', 'rail'].includes(mode), second = mode === 'double-step' && doubleStep && now - doubleStep.time <= .7;
      const beat = second ? doubleStep.time + .32 : lastBeat, perfect = number(beat) && Math.abs(now - beat) <= cfg.perfectWindow + 1e-10, cost = costs[mode] * (perfect ? .75 : 1);
      const compatibleNow = !!frame && !!compatible(item, mode, frame, {}), eligible = item.expiresAt > now && item.reservedBy === null && compatibleNow && !(demanding && strain >= 85) && strain + cost <= 100;
      return [mode, { cost, eligible, compatible: compatibleNow, requiresWorldValidation: true }];
    })) }));
  }
  function reserve(ids, token) {
    if (releasing) return failure('BUSY');
    expire();
    if (!Array.isArray(ids) || !ids.length || token == null || !String(token).trim()) return failure('INVALID_RESERVATION');
    const unique = [...new Set(ids.map(String))];
    if (unique.length !== ids.length) return failure('INVALID_RESERVATION');
    const key = String(token), items = unique.map(id => bank.find(item => item.id === id));
    if (items.some(item => !item || (item.reservedBy !== null && item.reservedBy !== key))) return failure('RESERVATION');
    for (const item of items) item.reservedBy = key;
    return { ok: true, reason: 'RESERVED', ids: unique.slice(), token: key };
  }
  function unreserve(token) {
    if (releasing) return failure('BUSY');
    if (token == null) return failure('INVALID_RESERVATION');
    let count = 0; for (const item of bank) if (item.reservedBy === String(token)) { item.reservedBy = null; count++; }
    return { ok: true, reason: 'UNRESERVED', count };
  }
  function reset(why = 'reset') {
    if (releasing) return failure('BUSY');
    bank = []; lastRun = -Infinity; lastBeat = null; doubleStep = null;
    reason = String(why);
    // Death and respawn begin a new strain lifecycle. Hero switches and interruptions preserve fatigue.
    if (/death|respawn|new-game|restart/.test(reason.toLowerCase())) { strain = 0; lastRelease = null; }
    return state();
  }
  return { contact, update, release, state, describe, reset, reserve, unreserve };
});
