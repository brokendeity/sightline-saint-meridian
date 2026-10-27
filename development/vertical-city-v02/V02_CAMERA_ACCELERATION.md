# Exact camera-ray acceleration candidate

`SIGHTLINE_SAINT_MERIDIAN_V02_CAMERA_ACCELERATION.html` derives from the complete gallery-arcade game. The previous game remains immutable. The candidate changes two camera-ray call sites and loads `scripts/v02_exact_camera_rays.js`; reversing those three builder edits reproduces its parent byte for byte.

## Observed problem and implementation

The retained four-second native-RAF CPU scout found most sampled execution under `constrainCameraPosition` in Three.js triangle tests. Its simulation median was 60.5ms. That short scout diagnoses a bottleneck; it is not a sustained performance result.

The new camera adapter partitions eligible, immutable V02 buffer geometry into a hierarchy of conservative triangle bounds. Leaves contain at most 96 original triangles and share the original position/normal/UV attributes. A leaf delegates hit testing to this exact build's native `THREE.Mesh.prototype.raycast`. It remaps the reported face index back to the original face and restores the original mesh identity. All hits retain native distance ordering, including face-order tie handling.

The original render geometry, triangle order, vertex data, source GLBs, transforms, collision records and scene graph are not replaced. The query retains all camera probe offsets, near/far limits, material-side behavior, transparency handling, camera smoothing and clamping policy. It does not simplify collision or substitute boxes for triangle contact. Other gameplay rays, including cartridge attachment, are unchanged.

Only static V02 meshes with ordinary, single-material, complete buffer geometry enter this partition. Original mutable buildings, skinned/morphed/instanced meshes, custom raycasters, partial draw ranges and material arrays use the native path. The cache observes geometry identity plus position/index attribute identities, arrays, counts and versions. Properly versioned position/index changes rebuild it; disposal releases its leaf geometry. Unversioned arbitrary writes are outside this static-geometry contract. Source V02 structures remain non-destructible under their established policy; original destruction remains on the native path.

`v02CameraRays.state()` reports queries, leaf tests, builds, invalidations, cumulative build CPU time and retained index allocations. Those allocation counters are not a measurement of total browser or GPU memory. Lazy first-use construction can cause a hitch and is included in measurements; no preload or zero-cost claim is made.

## Verification and limits

The native parity test compares complete hit data (object, point, distance, face indices/normal/material and UVs): 150 synthetic rays, 1,056 source rays over 176 loaded meshes and 12 original-building native-fallback probes. It also compares 56 actual camera constraints with acceleration enabled and disabled. Tested cases include indexed/nonindexed geometry, transforms, material sides, layers, near/far limits, unsupported material/draw-range fallback, position-version invalidation, geometry replacement and disposal of the old geometry. All pass within 1e-8. Source mesh positions/indices/transforms remain unchanged.

Three labelled initial gallery setups are followed by normal W input through the lower/middle/upper arcades. Ground support and native camera clearance pass. Fifteen retained keyboard, simulated controller, pause, hero-switch and responsive touch cases pass. These are bounded checks; they do not certify the full game or physical devices.

The separate benchmark runs the same lower-loop controller workload for 3,600 native simulation steps (60 simulated seconds) in each build. Native RAF, the existing accumulator/drop policy, rendering and city activity remain live. One initial gallery fixture is allowed; all later movement uses standard simulated gamepad axes. Videos, frame intervals, simulation CPU, render-submission CPU, draw calls, triangles, heap observations, loading wall time, dropped simulation time, distance and trajectory samples are retained. CPU render submission is not GPU timing. The benchmark includes video-capture and automation overhead and is specific to this Mac/browser configuration.

This is not the final combined combat/replay/destruction performance workload. Results must be read from `V02_Camera_Acceleration_Benchmark.json` after the process is terminal. No final sustained-performance gate is asserted here. The first full run is retained separately as `V02_Camera_Acceleration_Benchmark_Initial.json`: its draw/triangle fields sampled the final post-processing quad and are explicitly invalid. The corrected run reads the existing world-scene counters; initial measurements are not silently replaced.

## Reproduction

```sh
python3 scripts/vertical-v02/build_camera_acceleration_candidate.py
node scripts/vertical-v02/test_camera_acceleration.cjs
V02_HUD_ENTRY=SIGHTLINE_SAINT_MERIDIAN_V02_CAMERA_ACCELERATION.html V02_HUD_RUN=camera-acceleration-hud V02_HUD_REPORT=V02_Camera_Acceleration_HUD.json node scripts/vertical-v02/test_hud_candidate.cjs
node scripts/vertical-v02/benchmark_camera_acceleration.cjs
```

Use the local game server on port 8766 and ANGLE Metal as in the retained tests. The overall V02 remains incomplete: architecture/material reference fidelity, nine advanced-edge timings, final combined regressions, the full release workload and physical-device testing remain open.

## Measured checkpoint

The corrected run covers 60 simulated seconds and 640.65m in each build, including 29.5s above12m/s. Baseline and candidate sampled player/camera trajectories match exactly. Median simulation CPU is21.9→8.6ms; p9582.1→16.4ms. Actual wall durations are129.66s and60.11s. Render submission remains3.4ms median in both. No console errors or damage occur. Actual recorded videos are144.2s and69.96s, including loading/setup/end overhead. Chronological gameplay keyframe sheets were opened and reviewed; this is not exhaustive frame-by-frame animation certification.

Native adaptive resolution remains enabled; the attempted quality-state method does not exist, so those fields are null. This run establishes the observed CPU improvement under the native workload, not fixed internal-resolution rendering performance. World-scene draw/triangle distributions are sampled per wall frame and therefore weight stalled and fast segments differently. GPU time is unmeasured. The inherited dropped-time counter omits elapsed time already clamped by the outer loop, and coarse JS heap snapshots do not establish peak memory or leak freedom. These limits stay open for the final release workload.

The current combined build also completes all three public loops with ordinary Playwright WASD after one labelled setup per loop: lower55.37s/361.41m, mid35.37s/229.41m, upper37.2s/241.51m. All remain grounded, suffer zero damage, release no powers and record zero camera-inside frames against the tested structural bounds. Actual endpoint screenshots are retained. Advanced station routes, entrances/exits between layers and the entire retained game require their separate final combined checks.
