# Threadrail pure physical core

Implemented `scripts/game_threadrail.js` and `scripts/test_threadrail.cjs`. No Three.js dependency, actor mutation, scene changes, renderer changes, bank consumption, or input handling is present in this core. The runtime coordinator consumes the returned movement plans.

## Verified

`node scripts/test_threadrail.cjs` passes 23 focused test groups. Both files pass `node --check`. The suite began red with the missing module; additional regressions were reproduced red for slightly moved shared anchors and stale junction input before their fixes.

- Atomic placement: 6–100 m span, 55 degree slope, four rails/eight anchors, unique rails, consistent shared anchor ownership/position/revision, malformed values and callback exceptions.
- Callback validation: anchor owner, revision or position change, support loss, blocked full path, attachment sweep, transfer sweep and per-substep movement sweep. Callback inputs and public snapshots are defensive copies.
- Inertia: attachment projects actual input velocity; stationary uphill actors receive no forward acceleration; downhill gravity, friction, reversal and a 28 m/s cap. A frictionless uphill energy assertion checks kinetic plus gravitational potential energy numerically.
- Junctions: linked endpoint IDs, current directional selection, maximum 75 degree compatible turn, cosine velocity loss, latest input overriding stale attachment preference, and directional Drive requesting a compatible branch. Sharp ends return one final endpoint movement plan, preserve tangent momentum and detach.
- Transfers and jumps: 3 m swept transfer reach, incompatible angle rejection, projected momentum, bounded jump/slingshot velocity; 2 m swept attachment reach.
- Lifecycle: simulation-time expiry at 30 seconds, pause without clock advancement, owner destruction, blocked movement/path, hero change, interruption, explicit reset, no NaNs for malformed or extreme dt, bounded 128-event diagnostics and monotonically increasing event IDs across resets.
- Export compatibility: CommonJS callable plus `.create` / `.createThreadrail`; browser `window.createThreadrail` is evaluated in a clean VM without Three.js.

## API

`createThreadrail(api = {}, config = {})` returns `create`, `attach`, `update`, `detach`, `jump`, `transfer`, `applyDrive`, `state`, and `reset`.

`create(a,b)` accepts physical endpoint records `{id, position:{x,y,z}, normal:{x,y,z}, ownerId, revision, valid:true}` and returns `{ok,reason,rail}`. A rail contains `{id,a,b,length,tangent,slope,createdAt,expiresAt}`; `a` and `b` resolve against `state().anchors`.

`attach(frame,railId,direction?)`, `transfer(frame,toId)`, and `jump(frame,{slingshot})` return `{ok,reason,...movementPlan}`. Attach and transfer validate before mutation. Direction is a route preference; it does not manufacture attachment speed. Jump adds at most 4.8 m/s upward, or 6.5 m/s for slingshot, and caps the complete launch vector at 28 m/s.

`update(dt,frame)` returns `{ownsMovement,position,velocity,landed:false,kind:'rail',railId,time,speed,reason}`. The frame uses `{hero,active,position,velocity,direction,grounded,jumpHeld}` and supports `paused`, `defeated`, `blocked`, `retracing`, and `preview` interruption flags. `paused:true` preserves attachment and simulation time. A changed hero or inactive frame detaches. An external actor displacement exceeding attachment reach detaches instead of pulling the actor back.

`detach(reason)` returns the preserved position/velocity with `ownsMovement:false`. An ordinary rail endpoint instead returns its final checked endpoint with `ownsMovement:true` once, then clears attachment. Validation failures return `ownsMovement:false` and preserved velocity; the coordinator retains ordinary motion ownership.

`applyDrive(deltaVelocity)` returns `{ok,reason,deltaVelocity,event,...movementPlan}`. The accepted `deltaVelocity` is the actual projected and capped change, so a resource controller can consume only after `ok`. A component perpendicular to the current rail grants no speed. Directional Drive stores a branch preference consumed at the next compatible junction. This call does not independently own actor movement; the next update emits the resulting rail plan.

`state()` defensively copies `{time,anchors,rails,current,events,lastReason,limits}`. `reset(reason)` clears topology, active movement and diagnostics, resets simulation time, and preserves monotonically increasing rail/event identifiers.

Optional callback signatures: `validateAnchor(anchor)`, `supportAt(position,anchor)`, and `sweepClear(from,to,{kind,rail})`. A callback rejects with `false`, `null`, a nonfinite numeric result, or `{ok:false}`, `{valid:false}`, `{clear:false}`, `{supported:false}`, or `{destroyed:true}`. Exceptions reject safely. `validateAnchor` may return authoritative `{ownerId,revision,position}` to detect changes. A finite numeric `supportAt` result, including zero height, is accepted. Callbacks receive copies.

## Runtime responsibilities and limits

The scene runtime must supply real scene-owned endpoints and collision/support callbacks that test the actor volume. Without those optional callbacks, this pure module can validate the supplied records and geometry but cannot independently prove a scene owner or physical obstruction. Precision selection and all input/resource decisions belong to the runtime.

Motion integrates in substeps of at most 1/60 second. Junction entry conservatively discards the remainder of that substep, so it can lose a small amount of travel time without adding distance or energy. Attach/transfer plans move only to a validated point within their reach bounds. The runtime must commit successful plans and preserve returned detachment velocity while handing ownership back to ordinary movement.

No browser gameplay, visual alignment, full actor-volume geometry, rendered performance, or required multi-system chain is claimed by this standalone test report. Those checks require the coordinator and scene integration.
