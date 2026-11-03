# V02 Frame pacing: removing the frame-time spikes

Candidate: `SIGHTLINE_SAINT_MERIDIAN_V02_FRAME_PACING.html`. It is built from the impact FX candidate by `scripts/vertical-v02/build_frame_pacing_candidate.py`, which applies 4 inverse-verified hooks and loads one new module, `scripts/game_v02_frame_pacing.js`.

This is a performance change only. Every replacement returns exactly what the code it replaces returns; the equivalence test below checks that. Gameplay, geometry, power limits and art are unchanged. Shared modules that older builds load were not edited, because older evidence pins their hashes.

## How the spikes were found

`scripts/vertical-v02/profile_frame_spikes.cjs` runs the game for 60 s on its native frame loop at a fixed 1280×800 render size:
- **Setup (labelled):** Backspool is placed on the lower public loop.
- **Input:** a standard simulated controller then follows the loop, using the same steering as the earlier V02 benchmarks.
- **Profiling:** a CPU sampling profile (250 µs) runs throughout. Every frame interval above the spike threshold is attributed to the functions sampled inside it. Clocks are aligned with a 40 ms marker function.

A second, per-subsystem timing probe confirmed each cause.

## Causes and fixes

| # | Cause (measured) | Fix |
|---|---|---|
| 1 | **Halo trucks waiting at a junction**, around 8–12 s into the loop. Each waiting truck checked every walker against every pedestrian edge with a linear `find`, every frame. This caused 156 of the 160 long frames, at 40–117 ms each. | Look the edge up by index. Edge ids are `'w'+index`, which the walker code already relies on. An id check keeps the result identical. |
| 2 | **Drone searchlights.** Each drone within 70 m casts a 170 m ray every frame through Three's native per-triangle path. This took 7–10 ms in the worst frames. | Route the beam through the existing exact partitioned ray path (`v02_exact_camera_rays.js`), with the native path kept as a fallback. |
| 3 | **Ray broadphase bounds.** For each of the 472 camera obstacles and 279 walkables without collision bounds, `obstacleCandidates` re-ran `updateMatrixWorld`, then cloned and transformed the bounding box on every query, more than 10 queries per frame. | Reuse a mesh's world box while its local transform, matrix, world matrix, parent world matrix and geometry bounds are bit-identical to when the box was built. Anything else, such as the moving train, carved geometry or re-parenting, takes the original path. |
| 4 | **Lazy camera-ray partitions.** The 105 large V02 meshes built their ray partition on the first ray toward them during play, 10–45 ms each and about 400 ms in total. This caused the 42–83 ms camera hitches. | Build the partitions while the menu is up, about 12 ms per menu frame. During play, build only inside idle time that fits the estimate. A mesh not yet built still uses the original lazy path. |

## Results: matched 60 s runs (`evidence/frame-pacing/`)

Both builds ran the same route, controller and settings, one after the other on the same machine.

| | Impact FX (baseline) | Frame pacing (candidate) |
|---|---|---|
| Frames rendered in 60 s | 4,182 | 6,180 |
| Frame interval, median | 9.3 ms | 8.4 ms |
| Frame interval, p95 | **25.5 ms** | **16.8 ms** |
| Frame interval, p99 | 92 ms | 17.5 ms |
| Worst frame | 166 ms | 32.7 ms |
| Frames over 20 ms | 419 | 25 |
| Frames over 33 ms | 117 | **0** |
| Frames over 50 ms | 74 | **0** |
| Simulation CPU, median / p95 / worst | 9.2 / 17.4 / 68 ms | 4.3 / 10.2 / 30 ms |
| Render submission CPU, median / p95 | 4.4 / 5.5 ms | 4.6 / 6.1 ms |
| Page errors | 0 | 0 |

**What the numbers mean:**
- **Frame rate:** the headless browser presents at about 120 Hz. A p95 of 16.8 ms therefore means at most one missed 120 Hz refresh, never a drop below 60 fps for long.
- **Remaining long frames:** the remaining 13 frames over 25 ms show garbage collection and GPU clears, not game code.

## Equivalence: `test_frame_pacing_equivalence.cjs`

Over 900 live frames, with the train, trucks and walkers moving and Backspool walking under a simulated controller:
- **Bounds:** 7,200 random segments around the player and the train; the cached bounds selected exactly the same candidates as the original computation. The test calls the cached path before the original, so a stale cache could not hide behind freshly updated matrices.
- **Rays:** 7,200 rays with 11,961 hits; the partitioned path returned the same object, face and distance as Three's native raycast for every hit.
- **Crossings:** 25,200 walker checks; the indexed lookup matched the original linear find every time.
- **Cache use:** the cache was used about 6.1 million times and recomputed about 105,000 times.
- No page errors.

## Regressions

Run muted, one browser at a time; the results are in `evidence/frame-pacing-checks/`. The following all PASS:
- 13 friendly wall-contact scenarios and the graded landing test
- three city loops and six station approaches
- the 12 retained encounter, replay and discovery cases
- the stride, vault and crouch tests
- the 8-hit combat, Sightline melee, burst rhythm and themed-slot tests
- the impact FX test

**Air test (load flake):** it failed once in the full run, getting the standing take-off instead of the running one. It passed 2 of 2 times when rerun alone (`air-rerun-1.log`, `air-rerun-2.log`).
- **Same failure as before:** it is the same failure the air test showed on the impact FX build.
- **Likely cause:** the test presses `w` and then steps frames, so the take-off depends on the key event landing before the jump. This makes it timing-sensitive when the machine is busy; the game was also open in the in-app browser during the run.

## Not done / limits

- **Steady per-frame costs remain:**
  - Three's scene-wide matrix update, about 0.8 ms per frame;
  - the furnished-room shadow sync, about 0.35 ms;
  - `game_v02_friendly_contacts.js` calling `roadNetworkState()` every frame, about 0.27 ms;
  - `game_vertical_encounters_v02.js` deep-cloning `verticalDistrictState()` twice per frame, about 0.15 ms.

  The last two live in shared modules whose hashes older evidence pins. They need new module versions rather than edits.
- **120 Hz displays:** a step of the fixed 60 Hz simulation plus a render costs about 8.5 ms, just over a 120 Hz frame. So frames with a step can miss one 120 Hz refresh. That's frame pacing, not a stall.
- **Hardware:** measured headless on ANGLE/Metal on this Mac only. Not tested on a physical controller or a lower-end GPU.
- **Coverage:** the profile covers the lower public loop. Combat-heavy scenes, destruction and the high routes were not profiled separately.

## Follow-on build: no halo trucks

`SIGHTLINE_SAINT_MERIDIAN_V02_NO_HALO_TRUCKS.html` is built on this candidate by `scripts/vertical-v02/build_no_halo_trucks_candidate.py`, which applies 1 inverse-verified hook. It removes the halo surveillance trucks, which used a placeholder model, at the user's request until replacement models exist.

- **What changed:** the model is no longer loaded, so no trucks spawn, and none add colliders, camera obstacles or ray targets.
- **What stayed:** the truck code is still in the build. Restoring `haloTrucks.load()` brings them back.

**Tests:**
- **No-trucks check:** `test_no_halo_trucks.cjs` checks that:
  - the model is never requested;
  - there are no truck objects, colliders or camera obstacles;
  - the halo state reports 0 vehicles;
  - Backspool walks 41 m of the lower loop under a simulated controller with no page errors.
- **Full regression set:** run muted with one browser at a time. All 15 steps PASS, including the air test this time (`evidence/no-trucks-checks/`).
