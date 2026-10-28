# V02 public loggias and independent stair

The complete playable candidate is `SIGHTLINE_SAINT_MERIDIAN_V02_LOGGIA_TERRACES.html`. It derives from the material-response checkpoint by changing the architecture-manifest selector, the otherwise identical material loader's contract URL, and a copied HUD adapter. The HUD copy prioritizes a street contract over its internally owned sparring panel and registers the service-yard panel in the responsive shared context stack. Original HUD assets remain unchanged. All older entries remain intact. This is an incremental V02 candidate, not final visual or release acceptance.

## Architecture and source

`blender/SaintMeridian_V02_Loggia_Terraces.blend` forks the saved material-response master. Three sheltered public loggias at 40, 68 and 100 m have coffered roofs, tinted rear/side glazing, benches, planted beds, amber lighting strips and cyan edges. Their ordinary public walking floors are 8.8 × 8 m. They are public shelters; no private building interior is implied.

An independently ground-supported switchback frame provides 26 flights from 24 to 128 m. Each flight has 21 treads with approximately 190.5 mm rise and 360 mm going, and a 2.6 m lane. Three 3.2 m front-rail openings connect retained terraces at 24, 52 and 128 m. Only their six explicitly identified existing guard/cap meshes and matching contacts change. The original 310 building meshes, their compound colliders, 642 road lanes and nine scene lights remain unchanged. No dynamic light was added.

The authoring pass adds 3,109 components. The independent saved-source validator checks 3,115 components including the six controlled old changes, 1,879 solid meshes, 582 walkable tops and all 546 stair treads. It preserves 42,083 unrelated source objects and the original local transforms, parents and geometry. The candidate has 9,619 V02 contact boxes; that count is not a performance endorsement.

Five exported shipping chunks replace three retained terrace chunks and add the rooms/stair. Seventy existing chunks are reused. Exact decoded world geometry, UVs, normals, indices and material bindings survive packing: 13,993,368 raw bytes become 13,161,524 shipping bytes. The independent shipping validator reports zero Khronos errors/warnings. Existing original-city references are excluded from new runtime exports.

The HDR reflection panorama is rebaked from this saved source, at game position [80,65,340], 1024 × 512, 32 Cycles samples, scene-linear half-float RGBA; compressed payload 2,917,473 bytes. The contract's inherited `scriptSHA256` identifies the original material-recipe script; the actual new bake script/master identities are in `V02_Loggia_Terraces_Authoring.json`. This is a static local reflection probe and does not follow destruction, trains or camera parallax. The metadata report's `manifestSHA256` identifies the raw pre-pack source manifest; use the Build/Package reports for the final shipping manifest hash.

## Reproduced failure and correction

The first complete input tour reached the top flight but could not cross its landing. An unnecessary central cross-core walkway/guard at 128 m blocked the final turn: target [36.4,128,294.2], actual approximately [38.215,128.42,294.125]. The 128 m landing faces south, while the needed 52/68/100 m cross-core walks face north. Removing that unneeded six-component group fixes the physical route. Input, camera, physics and powers were not changed.

The exact failed master, plan, planner, authoring report, native report and screenshot are retained in `evidence/loggia-terraces/initial-top-landing-failure/`. Initial source-column/glazing and old rail-corner overlaps are retained separately. Failed evidence is not counted as acceptance.

## Actual movement evidence

One labelled initial setup on the retained 24 m terrace is followed by ordinary WASD through every flight, every new room, both retained upper terrace visits and the full return to 24 m. There are no intermediate player relocations, resource injections or power releases.

- 235.367 simulation seconds, 1,045.050 m and 14,122 recorded frames.
- Every recorded frame is grounded, supported and injury-free; initial Afterstep bank is zero.
- No camera point enters an opaque V02 collider.
- All 52 moving head/hips framing samples pass: every flight, ascending and descending. This is not full-body or every-orbit camera certification. Some descending screenshots crop lower legs.
- Twenty-two new directed graph passages are admitted from continuous ordered trace intervals. Independent validation preserves all 146 parent nodes and 313 parent edges and checks the new 155-node/335-edge graph. Parent edges are not recertified by graph admission alone.
- Six uninterrupted station approaches on the current manifest pass (three approaches, zero/full legal bank starts). Three entire public loops pass. Eighteen HUD/input cases and the installed skill client's actual movement pass.

These are bounded spatial/input checks. Current broader combat, replay, encounter, mission and failure coverage is tracked separately, with each scenario's real entry/manifest/test hashes and labelled initial fixtures.

## Native/source visual review

Saved Blender A/B/L camera matrices match actual native optics to sub-pixel precision. This proves composition correspondence, not equal shading or reference fidelity. Native room/terrace/stair/return views, desktop/portrait/landscape controls and active benchmark timelines have been opened and reviewed.

The actual shelters, traversable stair and warm ceiling depth are visible. The L overview has a large foreground tower/support hiding part of the rooms. The approved broader reference gate remains **FAIL**: repetitive window grids, plain tower masses, uneven warm/cool response, limited facade depth/variety, and bright specular patches remain. Original unchanged architecture and exact camera framing must not be sacrificed to manufacture a pass.

## Matched performance observation before the HUD correction

Material-response baseline versus pre-HUD-correction loggia candidate (entry `18b8486781e2b0190b1258f38f085bc478df15825c4c754f2ef0a3371c6c86d1`), each 60 native simulation seconds with fixed internal 1280 × 800 rendering and real RAF. Standard simulated controller movement covers the same 640.654 m. Sampled player and camera paths are exactly equal. No other automated browser/render/GPU workload ran concurrently.

| Measurement | Baseline | Loggias |
|---|---:|---:|
| Frame interval p50 | 8.4 ms | 8.4 ms |
| Frame interval p95 | 17.2 ms | 24.9 ms |
| Simulation CPU p50 / p95 | 8.7 / 16.5 ms | 8.7 / 17.6 ms |
| GPU p50 / p95 | 6.279 / 8.257 ms | 6.823 / 9.526 ms |
| Visible world draw calls p50 / p95 | 407 / 492 | 413 / 505 |
| Visible world triangles p50 / p95 | 1,547,294 / 1,710,367 | 1,686,004 / 1,825,950 |
| Load wall time | 8.294 s | 8.668 s |

GPU timer queries provide 1,268/1,177 valid samples with zero disjoint samples. The GPU median increases approximately 8.7%; frame-time tail worsens. These are measurements, not optimization or full performance acceptance. Memory snapshots do not prove peak use or absence of leaks. The scheduler's dropped-time counter does not include all outer-dt clamping. The endpoint pictures follow the harness's synthetic inactive flag; use the active videos/input cases for their actual scopes. Videos include loading and total approximately 76 seconds, with the measured active interval explicitly recorded in the JSON.

## Reproduction and remaining work

Use Blender 5.1.2 factory startup, the committed asset-tool lockfile and the existing local server at 8766. The authored source pass is followed by finalize, lossless packaging and build. Independent source, shipping export and clearance scripts precede native input tests. `run_loggia_terraces_checks.py` runs native, six approaches, three loops, HUD/input and the installed client sequentially. `admit_loggia_routes.py` and `validate_loggia_admission.py` consume the complete trace. `render_loggia_terraces.py` renders source/native-matched views. `benchmark_loggia_terraces.cjs` must run alone after browser/render jobs finish.

Remaining full-goal gates include substantial approved-reference architectural/material/lighting refinement, complete current combined gameplay/mission/failure regressions, a final sustained combined combat/replay/destruction/city benchmark and GPU-budget optimization, broader camera coverage, and physical controller/touchscreen playtesting. No paid generation or subagents were used. GitHub snapshots, V1 and the separate Blender/Unity projects stay preserved.

The current candidate includes the HUD ownership/layout correction. Prior entry-bound spatial/render/performance reports are historical until rerun against the current entry. Two hidden-control/stale-render harness failures and the genuine contract-visibility failure are retained separately. The updated harness opens visible Pause/Tools controls and runs native presentation between input batches; it never forces hidden controls. Initial responsive yard screenshots used a stale setup camera and are retained as failed visual evidence, even though their element-layout checks passed. Current captures must show the actual hero.

## Additional current checks

The complete loaded train has a conservative 7.35557 m radial bound, including arbitrary bogie yaw/wheel rotation and the full configured sliding-door displacement. Every original lead-car vertex and all three passenger carriages are covered. Coupling cylinders remain in the convex route hull expanded by their endpoint/radius bound. The air-model vertex maximum is 2.78426 m. Both fit inside the existing 10 m train / 3.73713 m air clearance radii. `V02_Loggia_Terraces_Vehicle_Bounds.json` binds the actual current entry and adapters. This proves only separation between these new loggias and existing transit, not every prior transit/world collision or a complete station boarding system. Current scenic traffic is 36 aircraft, reconciled with the current route definition; the earlier assumption of 24 was a rejected V1 count.

`drawings/loggia-terraces/` contains source-bound PNG/SVG floor plans and two stair sections. Their data comes from the independently reopened master validator, rather than proposed coordinates. They are component-envelope coordination drawings. Off-plane support columns are omitted by each named cut. They do not replace triangle-exact construction documents, structural engineering, or actual movement tests. Their separate review record binds the actual images.

## Final current-entry validation

The complete serial run is terminal0 on entry `85762c3518a57f5c9860640900c94b8fff11f707137b9baf780856410a256f3e`: all12current gameplay scenarios, native full stair/loggia tour, six station approaches, three whole public loops,18HUD/input cases, installed-client movement, loaded vehicle bounds,22edge admission and independent validation, matched source renders, and the fixed-resolution benchmark pass their stated checks. This does not promote the full visual or combined-release gate.

The current normal-input discovery tour reaches all four information locations, station/observation and the street again in416.983 simulation seconds. It naturally uses the new loggia/stair edges for mid-layer access and upper-to-ground return. Current public, momentum and mastery station approaches take135.333s,73.233s and103.767s from zero bank; full legal bank variants take135.083s,72.650s and103.300s. Lower/mid/high public loops take55.367s,35.367s and37.200s. These elapsed times describe the recorded paths, not every possible user route.

### Refreshed matched performance

| Measurement | Material baseline | Current loggias |
|---|---:|---:|
| Frame interval p50 | 8.500 | 8.600 |
| Frame interval p95 | 25.000 | 17.500 |
| Simulation CPU p50 | 9.400 | 8.800 |
| Simulation CPU p95 | 17.700 | 16.100 |
| GPU p50 | 6.805 | 6.681 |
| GPU p95 | 9.779 | 9.045 |
| World draw calls p50 | 420.000 | 416.000 |
| World draw calls p95 | 496.000 | 505.000 |
| World triangles p50 | 1,583,414.000 | 1,676,077.000 |
| World triangles p95 | 1,716,565.000 | 1,830,115.000 |

Both runs cover60simulation seconds and640.654m at1280×800, with exactly equal sampled player/camera positions. GPU samples: 1123/1214, zero disjoint queries. Load wall time: 8.199/8.834s. End/start heap values are coarse snapshots, not peak/leak evidence. The pair differs from the earlier pre-HUD measurements, particularly in frame tails and GPU medians. It is a bounded observation and does not establish an optimization; full combined stress and repeated release-quality characterization remain open.

A historical pre-HUD trace was recovered byte-for-byte, matching its previously retained SHA256, by replacing only the entry identity in the otherwise identical fresh trace. Its recovery record describes that operation. Three historical source PNGs and the prior benchmark video/artifacts are retained.24historical native PNGs had already been overwritten by the rolling capture outputs; their expected hashes and missing status are recorded, and they are not reused to certify the current candidate. All current native captures are retained and independently hash-bound.

Broader camera review remains open: some descending stair views crop the lower legs, and a live Echo contact view pushes the hero near the left/bottom screen edge. Head/hips samples and successful damage/reward outcomes do not certify full combat-camera framing.
