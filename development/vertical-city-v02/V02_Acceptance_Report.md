# V02 acceptance — graybox milestone

Full V02 completion is **not established**. The latest integrated WHIP game and all snapshots remain unchanged. This candidate is a Blender-authored circulation test on the latest gameplay code.

Candidate: `SIGHTLINE_SAINT_MERIDIAN_V02_GRAYBOX.html` (`b887965e8f16821c810ab5db72253f3bdd987511d17155e0a6231f0c1aa38033`).

## Named gameplay gates

| Gate | Status | Evidence and remaining scope |
|---|---|---|
| A lower loop | PASS | Entire loop by keyboard, grounded, no powers; one controlled start. |
| B mid loop | PASS | Entire loop by keyboard, grounded, no powers; one controlled start. |
| C high loop | PASS | Entire loop by keyboard, grounded, no powers; one controlled start. |
| D three station routes | PARTIAL | Public and momentum approaches complete; mastery geometry/route unfinished. |
| E depletion | PARTIAL | Public starts at zero; momentum tested at zero and five initial impulses without spending Drive. Mastery variants pending. |
| F Threadrail | PARTIAL | V02 momentum route uses four physical casts, two uphill catches and two safe Pops; legacy transfer evidence remains separate and two legacy cases stay open. |
| G recovery | NOT TESTED | Missing jumps, anchors, low bank, recovery return and edge guards still need scenario tests. |
| H camera | PARTIAL | Real camera positions recorded during public route and captures reviewed; full high-speed, corner and touch-size acceptance pending. |
| I train | NOT TESTED | Existing moving real front asset retained provisionally; full carriage envelopes and turns unverified. |
| J preservation | PARTIAL | Original game byte hash, source-only building copies, box/road prechecks and whip input regressions; full missions/combat/destruction regressions pending. |

## Other required gates

World export and building/collider reconciliation are present. The graph has103 nodes /221 directed edges but remaining ability edges remain proposed, not route-certified. Three encounter spaces, three landmarks and four POIs are designed; runtime encounter/discovery behavior is unfinished. The editable Blender master, 28 modular GLBs and matching collision/ownership metadata are present. No detailed architecture or final visual/performance acceptance is claimed.

## Proven behavior

- lower: 361.8m / 55.43s; grounded throughout, no Drive releases.
- mid: 229.8m / 35.43s; grounded throughout, no Drive releases.
- high: 241.9m / 37.27s; grounded throughout, no Drive releases.
- Public ground-to-station approach: 801.1m / 454.55s walking, zero airborne frames and no power releases. Active Halo hits: 0; final trauma 0. Walking time is a baseline, not a final pacing target. Combat exposure remains separate from physical circulation.
- Public ordinary run: 135.33s, with zero airborne frames and uncommanded correction 0.000000m. Anticipating one input-frame travel in the low-riser broadphase removed repeated running snags; surface rise remains<=.201m.
- Momentum route: 73.23s at zero initial bank / 72.65s at five initial bank; no Drive spent. Zero-bank saves 62.10s against the ordinary-run public route. Both end at the station objective, not merely at a platform edge.
- Full-bank preparation is actual running before the timed approach; it does not inject resources. Original Halo actors remain active. A failed exposed staging run is retained; the new visible canopy is physical cover, not enemy suppression.
- The walking trace passes a check against uncommanded sideways corrections; larger stacked-flight separation removed the earlier ceiling pushes.
- Blender/game bounds agree within3mm at load; glTF validator reports zero errors/warnings for all28 chunks.
- No positive-volume original-building intersections or coplanar new-floor overlaps were found. Ground road truck-envelope checks are sampled prechecks, not continuous traffic simulation.

## Immediate next work

- Ground-to-upper-to-ground public return and both secondary transfer stacks
- Mastery approach with wall shelves and upper Pop landing at zero/full resources
- Safe failure recovery, guardrails, full camera and contact review
- Three encounter adapters and real completion/retry flows
- Runtime landmarks and four discoverable POIs
- Train/traffic full swept clearance and station behavior
- Detailed Blender architecture only after circulation/encounter gates
- Reference-matched Blender/browser renders
- 60s matched sustained gameplay performance and full retained regressions
- Physical controller/touchscreen release checks

See V02_Traversal_Validation.json for hashes and exact evidence. Keep the full original user brief as the completion authority; this report is not a reduced replacement objective.
