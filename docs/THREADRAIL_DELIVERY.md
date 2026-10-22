# Backspool Threadrail and Afterstep delivery

Presentation completion: [V2 report](THREADRAIL_V2.md). The accepted V2 entrypoint is `SIGHTLINE_BACKSPOOL_THREADRAIL_V2.html?capture=backspool`; V1 and the original main game remain preserved.

Candidate: `SIGHTLINE_BACKSPOOL_THREADRAIL_CANDIDATE.html?capture=backspool` on branch `feature/backspool-threadrail-afterstep-drive`. The branch starts from `snapshot-2026-10-21-pose-binding-v14-complete`; commit `949ed83` carries v15 landing/roll repairs and `1e8201b` introduces the equipment candidate. The subsequent integration-repair commit contains this report. Older snapshot/main refs are preserved. V2 is delivered separately on the feature branch and update tag documented in its report.

## Implemented and playable

- Tap-toggle Flow sprint, relaxed Forspoken source idle, automatic vaults, continuous wall approach/run/climb/boost and supported mantle, directional flips, correct roll contact and momentum-preserving landing. Source tails survive eligible equipment handoffs.
- Five expiring physical impulses, perfect/imperfect timing, strain and all seven Drive modes: standard, directional, launch, DoubleStep, Ghoststep, brake and rail. Validation occurs before resource spending. Idle input and held sprint cannot generate free movement resources.
- Surface-owned straight/incline/linked physical rails, quick and precision placement, swept approaches, transfers, projected Rail Drive, slingshots and safe detach on expired/changed/blocked geometry. Rail and ordinary physics have an explicit movement handoff.
- Pooled Temporal Exhaust on the existing lower-back device: inward bank shimmer; opposite-acceleration slivers, broken rings, threads and slices; downward braking; bounded local refraction. Effects consume actual applied impulses and add no forces.
- Bounded Replay Route prototype, separate from existing three-slot Action Replay: four seconds/eight actions, real steering/sweeps, exact impulse reservation, reconnect marker, safe interruption and cleanup.
- Default traversal and optional Classic controls, keyboard, simulated standard controller, touch buttons, route options and read-only `backspoolTraversalDiagnostics()` / `threadrailGame.state()`.

All eight required chains pass real-input browser tests on the optional course. Combat, guard/stagger, ladder, vault and mantle commitments reject incompatible equipment actions without spending. Compatible wall, flip and roll recoveries hand off safely. The main game and v15 rollback HTML are unchanged.

## Source and authored work

`assets/backspool/traversal-threadrail-roles.json` retains admitted Forspoken source identities. Neutral idle uses `0x281116bb`; sliding/grind body motion uses `0x2811926e` (`pkr000_mgc_move_slide_f000a_lp`). The rail role preserves source limb rotations; its resampled pelvis support curve is authored for this equipment, with 480 sampled contact poses checked. Existing v15 directional flips, jump/fall, tumble/roll, wall, mantle and rebound roles retain their provenance and contact policies.

Movement controllers, contact admission, Threadrail rules and VFX are authored Backspool mechanics. Full original Forspoken controller/IK behavior, matched original-game fidelity and unsafe direct model-space pose writeback are not implemented or certified. Experimental unrestricted Skip/Scale/charge/tether entrypoints stay in the rollback build; this equipment candidate replaces their player paths with resource-checked Drive and physical rails. Original preview assets remain available.

## Run and reproduce

```sh
python3 scripts/build_backspool_threadrail_candidate.py
python3 -m http.server 8766
```

Open [the playable candidate](http://127.0.0.1:8766/SIGHTLINE_BACKSPOOL_THREADRAIL_CANDIDATE.html?capture=backspool). The builder restores the previous traversal HTML even if baseline generation raises an error. Runtime assets are local; source archives and RE executables are not needed to play.

```sh
python3 scripts/validate_threadrail.py --browser \
  --source-evidence '/Users/richardmpayi/Downloads/sight game rail/output/rea-forspoken'
node scripts/test_threadrail_hero_switch.cjs
node scripts/capture_threadrail.cjs
node scripts/benchmark_threadrail.cjs
```

Omit `--source-evidence` when the external read-only recovery evidence is unavailable; the runner explicitly records those source checks as skipped. Close other automated game browsers before performance measurement. `performance.json` identifies exact HTML hashes, renderer, settings, CPU/GPU measurements, errors and stress peaks. Browser fixtures and simulated inputs do not establish physical-device latency.

## Personal demonstration

1. Start as Backspool. Tap **Shift/L3** once and move; release the button and confirm Flow remains armed. Tap again to stop Flow. Neutral idle lowers his arms.
2. Run several strides until bank marks appear, then **E/RB**. Confirm a mark is spent and the lower-back pulse follows the actual acceleration. A rejected release explains its reason and keeps the bank.
3. Hold **Tab/LB** to choose a mode. Use a previously captured jump for Launch or descent braking; build two footfalls for timed DoubleStep. These modes cannot fabricate missing compatible motion.
4. Expand **Route & options → Traversal course**. With existing forward momentum, tap **R/X** near a cable, grind, press it again near a compatible segment to transfer, and press **Space/A** to slingshot. Hold R/X and release on each solid surface for precision endpoints.
5. Flow into the low obstacle and then jump onto the roof pads. Approach the wall, climb/run, boost with Jump, or hold backward+Jump to kick off. Check supported landing and continued movement.
6. Attack out of a rail, finish combat recovery and resume moving. Try Drive during attack startup, a ladder or mantle: it must reject rather than consume resources.
7. Record a short ordinary route, return within the marked entrance, then Replay. Manual movement or an obstructed/changed route should interrupt safely. Existing Action Replay uses **View+LB/RB/X** or **G/H/J**.
8. Use **L3+LT+RT+R3** to switch heroes during movement. Equipment clears; Sightline retains his own powers and Backspool retains his hero state. Pause/focus loss clears sprint and held-action latches.

See [the control table](BACKSPOOL_THREADRAIL.md), [integration findings and repairs](../output/threadrail/integration-fix-report.md), [validation results](../output/threadrail/validation-run.json) and [performance evidence](../output/threadrail/performance.md). The route feature is intentionally a limited prototype. Final hardware playtesting, wider city traversal coverage and original-game fidelity remain explicit limitations.

## Changed implementation files

Equipment: `game_afterstep_drive.js`, `game_threadrail.js`, `game_replay_route.js`, `game_temporal_exhaust.js`, `game_movement_coordinator.js`, `game_backspool_threadrail_runtime.js` under `scripts/`. Integration: `build_backspool_threadrail_candidate.py`, `game_backspool_advanced.js`, its runtime, and `game_backspool_flow_runtime.js`. Pose admission: `build_threadrail_pose.cjs` plus the threadrail role/pose assets. Tests and captures are the `test_*threadrail*`, `test_afterstep_drive.cjs`, `test_replay_route.cjs`, `test_temporal_exhaust.cjs`, `validate_threadrail.py`, `capture_threadrail.cjs` and `benchmark_threadrail.cjs` scripts, with the retained fixtures under `output/action-v2/`. The generated equipment HTML, README, plan, progress and evidence reports are included. The v15 carry-forward changes are separately identifiable in `949ed83`.
