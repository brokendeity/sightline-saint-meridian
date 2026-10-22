# Replay Route core report

Implemented `scripts/game_replay_route.js` with CommonJS exports (callable factory, `.create`, `.createReplayRoute`) and browser `createReplayRoute`. It has no scene, THREE, clock, DOM, network or actor dependencies.

## Evidence

- Test-first: `node scripts/test_replay_route.cjs` initially failed because the implementation was absent.
- Final pure run: **19 Replay Route tests passed**.
- Bounds: one saved route, at most 4 simulation seconds, 8 recorded action events and 120 position samples, including source/final endpoints. Configuration may tighten these bounds. New recordings replace the saved route only on successful finish.
- Reconnect distance is at most 1.35 m. Observed actor deviation is at most 1.5 m from the intended route at the advanced simulation time. Every crossed recorded segment and the observed actor-to-next-target segment is swept before any due action is requested, including on a large tick.
- Replay has no actor position/velocity writes, forces, teleportation, direct bank mutation or expiry mutation. Returned movement intent must pass through the existing ordinary movement coordinator.
- Regression cases cover exports, caps, fresh resource IDs and duplicate rejection, reservation failures, action ordering, expiry rejection through execution, pause, cancellation, lifecycle interruption, collision and owner/world changes, malformed payloads, callback failures, immutable snapshots and monotonically allocated IDs. Tokens are unique across factory instances in the loaded module as well as across replay attempts.

## Integration contract

```js
const route = createReplayRoute({ reserve, unreserve, execute, sweepClear });
route.start(frame);
route.capture(dt, frame, actionEvents);
route.finish();
route.startReplay(frame, availableImpulseIds);
const request = route.tick(dt, frame);
route.cancel(reason); // keep saved route
route.reset(reason);  // lifecycle: release escrow and remove saved route
const snapshot = route.state();
```

Frame: `{position:{x,y,z}, hero, worldRevision, active, heroActive, paused, manualInput, dead, defeated}`. Position is finite and bounded to ±1e9 per component to prevent arithmetic overflow. `hero`/`worldRevision` are optional string/finite-number identifiers and must stay equal to their recorded values. `worldChanged`/`changedWorld`, `alive:false`, `blocked`, `retracing`, `preview`, or `interrupted` are supported interruption signals. The runtime should provide a revision for collision geometry/rail ownership changes or signal `worldChanged`.

Capture events are bounded plain JSON objects, for example `{type:'drive', mode:'standard', resourceCost:1, direction:{x:1,y:0,z:0}}`. `resourceCost` defaults to zero and is an integer 0..5. The runtime must explicitly assign costs to resource actions. Optional `offset` is simulation seconds from the beginning of that capture, in `[0,dt]`; otherwise the event occurs at the end. The core assigns action ID/time, strips historical `resourceIds`/`impulseIds`/token and assigns fresh resources during replay. Excess events above 8 are omitted and counted in `counters.rejectedActions`; recording still ends at 4 seconds. Payloads must be bounded JSON (up to 8 KiB, depth 6, 64 entries per object/array). Record only actual confirmed actions; capture itself creates no gameplay event.

`reserve(ids, token)` atomically escrows only the required prefix of available fresh IDs. `execute(action, token)` receives those per-step IDs as both `resourceIds` and `impulseIds`; successful execution is the bank owner's confirmation of actual step consumption. These callbacks must return `true` or `{ok:true}` synchronously; false, exceptions, missing callbacks or Promises fail closed. `sweepClear(a,b)` must synchronously return `true`, `{ok:true}` or `{clear:true}` only for a clear full actor collision sweep. It receives defensive vector copies. A missing sweep blocks replay even for a free route.

`unreserve(token)` is invoked once at replay completion, interruption, cancellation or reset to release whatever the authoritative bank still has escrowed. It is also invoked when reservation rejects, to clean up a partially applied reservation. It must be idempotent and reliably release unused IDs; the core cannot repair an external bank callback that throws or refuses cleanup. It never asks the bank to renew an expiry or restore a consumed resource.

Tick returns `{ok,status,reason,time,actions,intent}` while active. `intent` contains `{from,to,direction,routeTime,targetTime}` with a 0.1 s route lookahead. `to` is a steering target, never permission to assign actor position. The runtime must feed the direction to ordinary collision-resolved movement and execute actions through their normal validation path. Completion and interruption return no movement intent. Previously successful actions remain spent if a later action fails.

Statuses: `empty`, `recording`, `ready`, `replaying`, `completed`, `interrupted`. `state()` returns a deeply frozen detached snapshot of route/actions/traces, resource IDs, counters and limits; no gameplay state can be changed through it. Invalid dt is rejected without advancing. Pause freezes recording/replay simulation and emits no intent or actions; it does not re-reserve or refresh resources. Death, inactive/changed hero, manual input or changed world cancel active replay and release escrow. Recording interruption retains the previous saved route. `reset` clears saved data while keeping identifiers/counters monotonic.

## Scope and remaining runtime verification

The pure tests exercise physical validation callbacks but do not run the game, assert actual rail geometry, prove renderer performance, or verify controller/browser input. Runtime integration owns confirmed action capture, supplying authoritative fresh bank IDs, reliable escrow cleanup, a true actor-sized sweep, ordinary movement steering, action execution and lifecycle/world revision signals. Those browser/input/physics checks remain part of the parent implementation task.
