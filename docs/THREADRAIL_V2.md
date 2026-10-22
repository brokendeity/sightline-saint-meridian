# Threadrail V2 — completed presentation integration

Play `SIGHTLINE_BACKSPOOL_THREADRAIL_V2.html?capture=backspool`. This is an exact copy of the accepted candidate; `output/threadrail/release-v2.json` records its hash. `SIGHTLINE_BACKSPOOL_THREADRAIL_V1.html`, the previous traversal HTML and the original Saint Meridian main game remain unchanged.

## Previously unfinished items now implemented

| Item | Delivered behavior |
|---|---|
| Rail and slingshot camera | Dedicated rail/Drive/slingshot compositions feed the existing camera director. Bounded recentering, velocity lead, restrained FOV, manual-look grace, portrait framing and reduced motion use one final collision pass. Logical movement yaw stays independent from shoulder framing, preventing unintended curved movement. |
| Ghoststep / DoubleStep afterimages | Up to three actual world-space snapshots of Backspool's currently skinned body. They remain behind during movement, preserve the source pose and dissolve. Confirmed supported footfalls leave small short-lived marks. Both use at most two draw calls combined. |
| Landing Recall | A confirmed supported landing with sufficient downward speed captures a displaced body silhouette. Its offset converges toward the live actor while fading, including when the actor continues moving. It changes no velocity, collision or bone transform. |
| Developer overlay | F9 shows hero, owner, velocity, bank IDs/lifetimes/eligible costs, source role/time, contact correction, rail/anchor IDs and validity, camera mode, VFX counts and last failed transition. It is hidden by default, scrolls at small sizes and reads detached snapshots. |

The lower-back Temporal Exhaust remains unchanged in identity and geometry. Body silhouettes complement its compact outlet pulses. Normal movement, combat, source clips, resource costs and the five-slot bank retain their existing rules. Invalid/blocked releases produce no new silhouettes. Pause, death, respawn and hero changes clear effects and camera transitions. Existing read-only diagnostics now also detach nested exhaust metadata. Present rail world validators reject unspecified or asynchronous success.

## Evidence

- All 26 validation groups passed, including 119 retained Classic regressions, the v15 roll/flip/landing suite, the 48 source/numeric checks and all eight input-driven movement chains.
- Nineteen new browser presentation checks passed: actual Ghoststep resource use, source-body snapshots, landing recall, manual camera input, collision, reduced motion, lifecycle cleanup, detached diagnostics, portrait/landscape overlay and clean shader/page console.
- Real FBX tests compare sampled deformed vertices against source skinning across the meshes, preserve bone transforms, prove snapshots stay world anchored and check pool bounds/deduplication/disposal. Matrix caching avoids recalculating every bone transform per vertex.
- The required development-game Playwright client ran against active gameplay. Rear/side/brake/rail, Ghoststep, landing and responsive diagnostic captures were inspected.
- Matched 60 s baseline/candidate median frame interval remained 8.3 ms. Simulation CPU median changed from 1.0 to 1.3 ms. The separate 60 s active stress reached three body silhouettes, two footfalls, five banked impulses, three rails and destruction/combat activity, with no console errors or dropped simulation time. Peak body-capture CPU was 3.6 ms. Full p95/GPU/settings/hash evidence is in `output/threadrail/performance.json` and `performance.md`.

See `output/threadrail/presentation-v2-report.json`, `validation-run.json`, `acceptance.json`, and `chain-report.json.gz`. Source-data checks and deterministic browser fixtures do not certify arbitrary city routes, original Forspoken equivalence or physical input latency.

## Reproduce / playtest

```sh
python3 scripts/build_backspool_threadrail_candidate.py
python3 -m http.server 8766
python3 scripts/validate_threadrail.py --browser \
  --source-evidence '/Users/richardmpayi/Downloads/sight game rail/output/rea-forspoken'
node scripts/benchmark_threadrail.cjs
python3 scripts/promote_threadrail.py
```

Promotion checks the exact validated/measured hash and preservation hashes before creating V2. It refuses to overwrite an existing different V2. Future changes require another version name. External recovery evidence is optional for ordinary browser tests; omitting it explicitly skips the corresponding source checks.

Run until several impulses are banked. Hold Tab/LB, choose Ghoststep, then press E/RB: three cyan body echoes should trail the actual stride. Jump and land: the pale landing silhouette should converge into Backspool. Add the optional course, grind and slingshot: test right-stick/mouse camera override and smooth return to the normal camera. Press F9 or Fn+F9 to inspect the overlay; the console equivalent is `threadrailGame.toggleDiagnostics(true)`. Resume movement and verify that the overlay does not affect control or resources.

## Files and preservation

New modules: `scripts/game_threadrail_camera.js`, `game_movement_afterimages.js`, `game_traversal_diagnostics.js`. Integration: `game_backspool_threadrail_runtime.js`, the candidate builder, exhaust diagnostic copies and rail callback validation. New focused tests and performance telemetry accompany them. `scripts/promote_threadrail.py` creates the versioned release only after acceptance.

The GitHub update uses branch `feature/backspool-threadrail-afterstep-drive` and tag `update-2026-10-22-threadrail-v2`; older main/snapshot refs are retained. The separate Blender project, Unity preview, Naruto library and original game entrypoint are unchanged.

Physical controller/touchscreen playtesting, exact original Forspoken controller/IK verification, broader city-route coverage and long thermal-load testing remain unverified. Replay Route remains the deliberately limited four-second/eight-action prototype specified by the plan. No further progression upgrades, traffic actors or original-game powers were added in this pass.
