# Afterstep Drive — reference VFX candidate

Entrypoint: `SIGHTLINE_BACKSPOOL_AFTERSTEP_VFX.html?capture=backspool&vaultcourse=1` on port 8766. Built from the exact accepted wall-fix playground, local commit `4f72727`. The prior playground, main game, versioned releases and GitHub snapshots are preserved.

## Implementation

The supplied image is the visual target. This pass changes presentation only: the same successful `drive.release` result still applies the same velocity and resource cost before publishing its confirmed `deltaVelocity` event. That event drives the existing Temporal Exhaust and movement-afterimage modules. No controller, collision, animation asset, suit, equipment model or HUD rules are replaced.

`game_temporal_exhaust.js` now emits six polygon families (triangles, irregular quads, diamonds, fractured panels and thin blades). Glass interiors use normal alpha blending; cyan-white/violet perimeter strips use a separate additive batch with a faint wider edge layer. Their geometry occupies different 3D planes instead of all facing the camera. The original bounded local refraction pass remains; global bloom is unchanged.

The existing Hips-relative lower-back socket now has two outlets separated by 0.264 m in bone space. Close-up gameplay capture verifies their alignment with the existing circular equipment. Each outlet flashes independently and supplies delayed fragments at its actual animated world position. Once spawned, fragments move in world space opposite the actual applied acceleration, including downward emission for fall braking. Their finite lifetime, maximum range and fixed pools bound the trail. Ordinary sprint produces only the existing subtle contact shimmer.

`game_movement_afterimages.js` retains the optimized skinning snapshot infrastructure. Eight bounded historical pose buffers retain actual world-space deformed vertices and normals. A Drive release selects recent poses from that history, then refreshes a short burst while the character continues moving. Up to four visible slots are available (default three). Normals provide volume and a cyan rim; recent copies are stronger and distant/old copies fade. Captured poses retain the full suit/equipment geometry. No cloned skeletons, T-pose substitutions, collision objects or actor-bone writes are used.

## Controls and tuning

Tap **Shift / L3** for Flow, move to bank foot plants, then press **E / RB** to release Drive. **Tab / LB** opens the existing Drive modes. Existing touch Drive controls remain available. A failed release spends nothing and does not trigger the release trail.

Defaults and validation ranges are centralized in `scripts/game_afterstep_vfx_config.js`. Live visual-only tuning is exposed as:

```js
afterstepVfx.configure({
  shardCount: 48, shardSize: 1, shardOpacity: .25,
  shardSpeed: 5.5, shardLifetime: .68, shardRotation: .7,
  violetBalance: .28, outlineBrightness: 1.3,
  afterimageCount: 3, afterimageOpacity: .22,
  afterimageSpacing: .85, afterimageFade: .55,
  outletBrightness: 1.3, intensity: 1, trailLength: 7,
  quality: 'high', maxShards: 96
});
// Lower cost preset:
afterstepVfx.configure({quality:'low',shardCount:24,afterimageCount:2});
// Restore defaults:
afterstepVfx.configure(AfterstepVfx.defaults);
```

Diagnostics: `afterstepVfx.state()` and the existing `threadrailGame.state()` expose settings, active counts, both outlet positions, release direction, pending ghosts and pool usage. Quality lowers shard density; low quality limits visible ghosts to two and reduces history capture frequency. Reduced motion lowers the release count and visible ghost count further. Committed hit reactions cancel future emissions while already released fragments finish fading. Pool geometry/materials are allocated at bind/creation, not per fragment. Maximum visible presentation budget is three exhaust/refraction calls plus two body/footfall calls. Historical snapshots do add bounded CPU and memory cost; measurements are recorded separately.

## Verification and visual limits

Before/after captures use the same world start, real keyboard sprint and real keyboard Drive input. The rear three-quarter captures, later trail and close-up are in `output/afterstep-vfx/`. They demonstrate transparent glass interiors, sharp edges, multiple prior running poses, the existing yellow/black suit and two lower-back outlet pulses during actual gameplay. The expired capture checks cleanup.

This is a real-time approximation rather than a pixel-identical reproduction of the illustration. Thin polygon strips approximate luminous edges; the glass does not have physically traced reflections/refraction. Ghosts obey actual world-space camera perspective and can appear larger when closer to the camera. Existing animation poses, city lighting, pavement and HUD are deliberately preserved.

The candidate builder replaces only the two visual modules and adds shared configuration plus a visual tuning adapter. All later delivery test results and measurements are recorded in `output/afterstep-vfx/` and the final validation appendix below.

## Final validation

Reproduce focused checks and retained movement acceptance with:

```sh
python3 scripts/validate_afterstep_vfx.py --regressions
# Also rerun the paired 60-second comparison and 60-second active stress:
python3 scripts/validate_afterstep_vfx.py --regressions --performance
```

- Existing Temporal Exhaust and dense real-FBX snapshot tests pass. New unit checks cover paired sockets, high-speed density, material/depth state, tuning bounds, braking, history, four-slot reuse, reduced quality, interruption, reset and disposal.
- Seventeen real-game browser checks pass: normal sprint versus Drive, multiple historical ghosts, both outlets, pool/draw limits, expiry, portrait/landscape control availability, real-jump fall braking, non-mutating tuning, pause and hero switching.
- All 16 vault checks, 13 wall scenarios and eight input-driven traversal chains pass against this new candidate. These include controller simulation, rail/slingshot/combat handoffs and supported landings. Physical devices remain untested.
- The installed develop-web-game client ran against active gameplay; screenshot/state evidence is in `stock/`. No new page/shader errors were recorded. The existing FBX loader warns about source vertices with more than four weights during raw unit-test import; this warning predates this pass.

Final paired measurements use the exact candidate hash in `build.json` and `performance/performance.json`: 12-second warmups and identical 60-second movement/camera scenarios, one Chromium/ANGLE Metal browser at a time, 1280×800 at full resolution. Frame p50 stays **8.3 ms**, p95 stays **16.6 ms**. Median visible calls increase **185 → 188**. Simulation CPU p50 increases **1.8 → 2.1 ms**, p95 **8.6 → 11.8 ms**; the history/normal work has a measurable CPU cost despite the unchanged median frame interval. Hardware load affects these numbers; the initial separate run is retained under `performance-initial/`. GPU timing samples are available in the raw report but should not be read as evidence of a GPU speedup.

The final 60-second active stress records zero console errors, invalid states, owner conflicts or dropped simulation time. Peak presentation records: 58 exhaust particles and the configured bounded body pool; peak sampled capture cost 4.3 ms. Frame p50/p95/max: 8.3/16.7/42.6 ms. This is a bounded Mac/browser test, not prolonged thermal or physical-device certification.

A browser comparison is available at `output/afterstep-vfx/comparison.html`, including the supplied art target and actual before/after captures. The match is strongest in the paired outlets, shard silhouettes, cyan/violet palette and posed ghosts. The illustration's physically richer glow/reflections, hand-composed perspective and simplified HUD are not reproduced exactly.
