# Momentum station approach — implemented graybox

This milestone adds a playable second approach. Full V02 acceptance remains open; the original WHIP build and GitHub snapshot tags remain unchanged.

The current acceptance authority is `V02_Traversal_Validation.json`, which checks both game-entry and Blender-manifest hashes against the actual files. Earlier iteration reports with different hashes are historical evidence, even when their narrow tests passed.

## Geometry and controls

From the ground access, take public stair A toY84. Toggle Flow with Shift/L3 and follow the west gallery to the covered launch courtyard nearX55/Z293. Existing R/controller-X precision throws and ordinary physical rail rules are retained.

1. Hold/release R to placeA on the floor near[55,84,295]. PlaceB on the intermediate platform's visible west face near[70,91.75,315]. The rail itself stands0.72m out from this face.
2. Back up along the clear courtyard to approximately[46.3,84,282.8]. Flow towardA, tapR near the rail to catch, then pressJump shortly before the upper endpoint. Pop clears the edge onto theY92 landing. Its16×44m footprint provides room to land, reposition and accelerate again.
3. PlaceA on the landing near[76,92,335], andB on the station's visible south face near[65,99.75,359]. Back up to approximately[82.4,92,321.4], catch with Flow momentum and Pop onto the station.
4. Continue to the shared objective[66.5,100,376]. Arrival at the first platform edge is not the timing endpoint.

The construction pauses are physical setup, not scripted rail creation. The source casts, projectile impacts, finite rail lifetime, incoming-velocity projection, gravity/friction, collision checks and6–100m/55° envelope remain active. No actor or camera assignments occur after each test's one labelled start fixture. Camera aiming and movement use standard simulated controller axes; throw, sprint and Pop use real key events.

## Current evidence

- `V02_Momentum_Full_Zero_Flow.json`: initial bank0, entire ground-to-station route73.23 input seconds, no damage or Drive releases.
- `V02_Momentum_Full_Banked_Flow.json`: initial bank5 collected through actual running before timing,72.65 input seconds, no damage or Drive releases.
- `V02_Public_Route_Run_Validation.json`: same ground/station endpoints, ordinary running135.33 seconds, zero airborne frames and no unexplained horizontal correction.
- Walking public circulation completes in454.55 seconds and resource independent. Walking time is not the fast-route comparison.
- Fixed60Hz input time includes precision slow-motion; simulation time is separately present in raw traces. These are deterministic controller trials, not human skill/performance benchmarks.
- A slower ordinary-run-prefix banked route also passes with the canopy; this repeats the timeline that previously lost its cast to Halo fire. Cover reduces exposure but does not guarantee immunity to every attack.
- Raw per-frame records are losslessly preserved as `.trace.json.gz`. Stage screenshots show actual construction, Pops, supported landings and station arrival. Original Halo actors remain active.

Before the canopy, an exposed banked attempt took16 damage and lost its cast. That failure is retained under `evidence/fixed-defects/banked-launch-exposed-before.trace.json.gz`. The initial pilot also caught a harness error: it incorrectly used a nullable direction vector as a travel sign, producing an early Pop. The test now reads the solver's signed speed.

Ordinary running revealed305 clipped stair frames in the first run. The tagged-riser proximity check now includes one60Hz input-frame travel, while the actual supported rise remains<=.201m. The preserved failure trace is `evidence/fixed-defects/running-stair-snags-before.trace.json.gz`. No old building collision or hero speed/jump/Drive limit was enlarged.

## Reproduce

```sh
FULL_ROUTE=1 RUN_PREFIX=flow node scripts/vertical-v02/test_momentum_route.cjs
FULL_ROUTE=1 RUN_PREFIX=flow BANKED_START=1 node scripts/vertical-v02/test_momentum_route.cjs
RUN_PUBLIC=1 node scripts/vertical-v02/test_public_station.cjs
node scripts/vertical-v02/test_public_station.cjs
node scripts/vertical-v02/test_loops.cjs
node scripts/vertical-v02/test_preserved_whip_inputs.cjs
python3 scripts/vertical-v02/report_milestone.py
```

Serve the repository at8766. The local pilot (without FULL_ROUTE) is not full approach certification. Banked preparation time is excluded from the route stopwatch but retained in the trace.

## Still required

The graph still describes the ascent as compound Threadrail edges; its next revision must explicitly split Pop, landing and reposition phases using these measured contacts. Its proposed edge statuses must not be mistaken for runtime acceptance. The third route needs physically authored stepped wall rooms/shelves and upper Pop landing validation. Return/descent, guardrails, recovery, camera/body-contact sweeps, three real encounters and four POIs remain graybox acceptance work. Detailed architecture, transit envelopes, visual matching, sustained performance and full retained gameplay regressions remain required afterward. Physical controller/touchscreen testing is not established by these simulated-input tests.
