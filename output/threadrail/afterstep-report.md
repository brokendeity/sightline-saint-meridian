# Afterstep Drive pure core

Implemented `scripts/game_afterstep_drive.js` and `scripts/test_afterstep_drive.cjs`.

## Validation

Test-first: the initial test invocation failed because the implementation module did not exist. Added the implementation, then used failing regression cases to implement stricter causal compatibility, auto lateral fallback, expired-contact rejection and unsupported-airborne capture rejection.

`node scripts/test_afterstep_drive.cjs` passes **40 tests**. Coverage includes contact validation and deduplication, real supplied impulse vectors, five slots, 250ms running interval, eight-second active-time expiry, replacement rules, active-clock freezing, atomic sweep rejection and callback exceptions/reentry, strain limits/recovery, 60ms perfect timing, 70% imperfect strength, DoubleStep320ms, compatible source actions and maximum60deg reorientation, airborne release of previously captured jump energy, finite braking, reservations/expiry, lifecycle strain policy, defensive copies, safe28 delta bound, and browser/CommonJS exports.

## Runtime interface

`window.createAfterstepDrive(api={}, config={})` / `require('./game_afterstep_drive').create(api, config)` returns `contact`, `update`, `release`, `state`, `reset`, `reserve`, `unreserve`.

Time is active simulation seconds. `update(dt, frame)` advances only for `frame.active===true && frame.hero==='backspool'`. Configure another hero through `config.hero` if needed. Full frame includes position and velocity as finite `{x,y,z}` vectors, plus direction, grounded, jumpHeld and optional `rail:{attached,tangent}`.

`contact({id,action,direction,magnitude,groundSupported:true})` accepts actions footplant/jump/landing/wallKick/vault/sideStep/rebound. `vector` or `impulse` may supply the actual magnitude-bearing vector instead. Supported evidence is `groundSupported`, `grounded` or `supported`; wallKick/vault/rebound/sideStep also accept `wallSupported` or `surfaceSupported`. Mere contactConfirmed without physical support is insufficient. `run` and `running` alias footplant. Drive/synthetic provenance is rejected. Optional `time` is interpreted in this core's simulation clock and preserves original expiry; omit it for current contact. Successful contact returns its confirmed `.event` for Temporal Exhaust banking.

`release(mode,frame,options)` consumes exactly one compatible impulse. Modes are auto/standard/directional/launch/ghoststep/brake/double-step/rail. Standard preserves the supplied vector. Redirected modes preserve recorded magnitude before perfect/imperfect scaling and safe delta clamping, with a maximum60deg turn. Launch requires stored jump/wallKick/rebound/vault energy with positive vertical component, and may release in midair. Directional requires a captured sideStep/rebound/wallKick or strong lateral vector. Ghoststep and DoubleStep support captured running footplants. Brake requires positive vertical or opposing captured energy, opposes current velocity, and cannot reverse it. Rail requires a real rail tangent. Auto selects attached rail, held-jump launch or compatible lateral release, otherwise standard. Options accept `direction`, `beatTime`, and reservation fields.

`api.canRelease(frame,deltaVelocity,mode)` receives defensive copies and must return true or `{ok:true}`. Any false/absent success result, thrown exception or reentry failure leaves resources untouched. When the callback is omitted the core permits the release: the runtime must supply its real actor sweep callback. Success returns `{ok,reason,deltaVelocity,spent,event}`; event includes monotonic sequence/id, time, source contact/action, mode, perfect/cost and actual delta. `state().lastRelease` preserves the confirmed release.

`reserve(ids,token)` reserves existing unexpired slots atomically. `release(...,{reservationToken:token,ids:[oneId]})` consumes a specified reserved slot. Ordinary releases cannot use reservations. `unreserve(token)` only removes the reservation and never refreshes age or duplicates/refunds the resource.

`reset('hero-switch')` clears bank and DoubleStep state while preserving strain and its recovery timing. Explicit death/respawn/new-game/restart resets strain. IDs and emitted event sequences remain monotonic/deduplicated across resets.

## Integration boundaries

The core never writes world state, actor velocity, skeletons, camera or rendering. Runtime owns final combined ground/rail speed28 enforcement, hero lifecycle/reset calls, physical support claims, contact IDs, collision sweeps and visual event delivery. The core separately clamps every returned delta magnitude to28. Browser movement and performance acceptance must be validated by the coordinator's runtime integration.
