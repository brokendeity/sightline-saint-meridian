# Pure-core review

Scope: `game_afterstep_drive.js`, `game_threadrail.js`, `game_replay_route.js`, `game_temporal_exhaust.js`, their test files and implementation reports, against `docs/plans/backspool-threadrail-afterstep-drive.md`.

## Verdict

**Spec compliance: approved for runtime integration. Task quality: approved with the nonblocking hardening notes below.** No blocking defect found for the documented synchronous callback contract. Existing test evidence was inspected; unchanged tests were not rerun. This is not approval of playable controls, wall/contact animation, full movement chains, renderer cost or the unreviewed runtime adapter.

The resource core validates eligibility, compatibility, capacity and its world callback before spending (Afterstep lines 114–159), retains expiry during reservations, and rejects synthetic capture. Threadrail validates placement and attachment before changing topology/attachment (lines 104–152), projects physical inertia, bounds speed, preserves detach momentum, and handles expiry/owner failure. Replay reserves fresh IDs, sweeps intermediate segments and uses ordinary movement intent rather than assigning world positions (lines 159–214). Temporal Exhaust has fixed pools and geometry, a five-call bound, actual-impulse direction, and no actor/rig writes.

## Nonblocking hardening notes

1. **Callback return contracts differ across modules.** `game_threadrail.js:53–60` treats undefined, a Promise, or an arbitrary object from a present validation callback as success, unlike Afterstep and Replay's explicit-success rules. The supplied runtime callbacks are synchronous booleans, so that path is safe. A future asynchronous or accidentally missing return in a world validator could bypass a physical check. Prefer explicit documented synchronous success (including finite numeric height and recognized authoritative anchor response), and reject thenables.

2. **Diagnostic objects should stay detached.** `game_temporal_exhaust.js:97` returns `lastRelease`, `lastBank`, `captureRect` and a custom configured outlet object by reference. Mutating those diagnostic records does not currently change pool forces/geometry, so this does not block gameplay, but it can corrupt later evidence. Return copies when hardening diagnostics.

## Integration gates to verify

- Afterstep's proposed delta and Threadrail's *applied*, capped delta differ near the rail speed cap (`game_threadrail.js:199–210`). The runtime must prevalidate the rail transaction before spending, handle zero projected change without consuming, and give VFX the actual applied delta.
- Threadrail callbacks must validate real owner/contact revision and the complete actor sweep; optional pure-core callbacks do not prove scene safety.
- Replay execution must consume its specific per-action reserved IDs. Do not merely pass the token and choose an arbitrary compatible reserved item. Preserve expiry and signal world revisions/manual input.
- Feed VFX after a bound/posed model, clear it on all lifecycle transitions, and call framebuffer capture immediately after the existing world pass. Report physical controller and original-controller/IK limits separately.
