# V02 upper plant maintenance access

Current candidate: `SIGHTLINE_SAINT_MERIDIAN_V02_MAINTENANCE_ACCESS.html`. The source is the complete service-tower game from checkpoint2d83469. The only HTML change selects the maintenance architecture manifest. Camera policy, character controls, movement, animations, combat, powers, objectives and the old game entries remain unchanged.

**Bounded maintenance checkpoint: PASS.** `V02_Maintenance_Access_Evidence.json` binds the current source, runtime assets, normal-input tour, graph admission, retained routes, input checks and visual review. Full V02 visual/release acceptance is separate and remains incomplete.

## Actual architecture and access

A glazed stair with 12 flights now connects the84m launch-court gallery to the three previously sealed upper plant chambers. It has 204 closed physical treads:17 per 3 m flight, rise 3/17 m (about17.65cm), tread 36 cm, clear flight width 2.6 m. The twelve flights and supported turn landings lead to side galleries and real2.6×2.8m doorways at:

| Floor | Plant room roof | West entrance |
|---|---|---|
|96m |108m |X60, Z289.6 |
|108m |120m |X60, Z281.6 |
|120m |128m |X60, Z273.6 |

From the existing public84m gallery nearZ300, walk west into the transparent stair tower. Each upper landing has a supported gallery to its plant-room door. These are actual openings in source glazing with framed returns; no disabled wall or teleport is used. A small84m side infill and underside outriggers join the existing court slab. The old court canopy has a real stair opening; its useful launch/staging roof remains. One canopy post is explicitly relocated onto the retained canopy edge.

Five old source components change: the canopy, one canopy post and three west glass panes. All original climbing planes and complete96/108/120/128m room roofs remain untouched. The original 310 buildings, roads and plaza are preserved. New architecture uses shared dark metal, glass and warm strip materials, with no new dynamic lights or exposure/bloom increase.

## Source and export evidence

- 511 new records;516 independently reopened components, including504 closed solid meshes and229 walkable tops.
- 204 actual tread meshes, seven full doorway-clearance volumes, exact source extrema and available hidden-marker local transforms checked.
- 41068 unrelated source geometry objects and saved local transforms/parents/collection memberships/visibility preserved. Changes are limited to five meshes and five corresponding hidden local collision markers.
- 70 prior chunks reused; two selective replacements preserve the other components they contain, plus one new maintenance chunk. Three shipping GLBs total2,704,660bytes, with exact decoded geometry/material/UV/normal/index parity after lossless packaging and0 Khronos errors/warnings.
- Five measured source contacts document adjacency, not structural engineering strength.
- Continuous full-vehicle cubic-hull envelopes clear new geometry by 13.023m horizontally for aerial traffic and9.773m for the existing conservative10m train reserve. This extends current geometry clearance; it does not replace the earlier loaded-car asset validation.

## Native movement and camera evidence

One labelled start at the supported84m `W84_300` node is followed by ordinary WASD through every upper plant room and the complete stair return. The current tour covers623.257m in124.933 simulation/input seconds (7496 frames). It starts with zero bank, stays grounded, releases no powers and suffers no injury or opaque camera penetration. It is a local84m maintenance tour, not a newly certified uninterrupted ground-to-all-rooms round trip.

The original 310 building meshes/transforms/compound parts,642 road lanes,9 scene lights and every unrelated V02 collider match the parent native fingerprint. Actual source/rendered structure contacts register; the new total is7743 V02 colliders.

Actual moving-pose review reproduced a descent framing failure: the hips projected below the viewport atNDC Y−1.128 while the tall inner glass divider shortened the camera boom. The divider was replaced with204 exact stepped1.1m low glass guards. The same input and unchanged camera code now keep the sampled head and hips framed on ascent and descent. Descending hips are at−.745 and head at−.529. This is a bounded first-flight head/hips check; it does not certify full-body framing, every orbit, every flight or physical devices. The failed images and metric report remain in the evidence folder.

## Retained current journeys and controls

All six complete ground-to-station approaches pass again on the final low-guard geometry, with no injury or console errors:

| Approach | Initial zero bank | Legally earned full bank |
|---|---:|---:|
| Public |135.333s /774.381m |135.083s /773.978m |
| Momentum |73.233s /702.009m |72.650s /701.842m |
| Mastery |103.767s /933.724m |103.300s /933.509m |

Both mastery cases retain all four wall ascents and the physical rail/Pop/recovery sequence; the full-bank brake case releases one actual impulse. Public approaches remain grounded and use no advanced powers. The three complete public loops and 15 retained HUD/input groups also pass. The installed web-game client demonstrates actual movement, rather than relying on its exit code. Simulated controller/touch cases remain distinct from physical-device playtesting.

Actual native and saved-source A/B/S/M comparison images, all four advanced-route contact sheets, new moving-pose ascent/descent images, station-arrival, public-loop, desktop/portrait/landscape and installed-client captures have been opened. Source/native camera projection agreement remains below0.004px; material and lighting agreement is not claimed.

## Navigation

The runtime source graph adds 8 semantic nodes and 16 directed zero-power maintenance edges. A separate evidence graph, `V02_Maintenance_Movement_Graph.json`, contains 146 nodes / 313 edges and admits only the 16 new passages from ordered, continuously supported native trace intervals. Parent 138 nodes / 297 edges remain byte-equivalent arrays, with archived identities and timing evidence preserved. No global edge admission is inferred from topology.

`V02_Maintenance_AbilityRoute_Matrix.csv` contains measured maintenance traversal intervals; these are simulation/input times, not wall-clock frame-performance measurements.

## Known limitations and full goal

The overall approved-reference visual-quality gate remains **FAIL / incomplete**. Broad tower massing, skyline depth, architectural variety and material/lighting response still need work. Saved-source Cycles lighting is darker than the browser. Matching projection proves camera optics, not shading or final visual fidelity.

The entire current encounter/replay/destruction/mission/failure-path suite, final combined>=60second fixed-internal-resolution/GPU-aware workload and physical controller/touchscreen playtesting remain required. Parent CPU optimization results are not performance acceptance for these new assets. The full user objective remains ACTIVE and INCOMPLETE.

## Reproduction

Run sequential browser jobs against the repository server at127.0.0.1:8766. Preserve all input masters and older builds.

```sh
python3 scripts/vertical-v02/plan_maintenance_access.py
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --python-exit-code 1 --python scripts/vertical-v02/blender_maintenance_access.py
python3 scripts/vertical-v02/finalize_maintenance_access.py
node scripts/vertical-v02/package_maintenance_access.mjs
python3 scripts/vertical-v02/build_maintenance_access_candidate.py
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --python-exit-code 1 --python scripts/vertical-v02/validate_maintenance_access_master.py
node scripts/vertical-v02/validate_maintenance_access_exports.cjs
node scripts/vertical-v02/validate_maintenance_access_clearance.cjs
node scripts/vertical-v02/test_maintenance_stair_pose.cjs
node scripts/vertical-v02/test_maintenance_access.cjs
python3 scripts/vertical-v02/admit_maintenance_routes.py
python3 scripts/vertical-v02/validate_maintenance_admission.py
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --python-exit-code 1 --python scripts/vertical-v02/render_maintenance_access.py
V02_ROUTE_BUILD_REPORT=V02_Maintenance_Access_Build.json V02_ROUTE_SUITE=maintenance-access-routes V02_ROUTE_REPORT=V02_Maintenance_Access_Routes.json python3 scripts/vertical-v02/run_current_station_routes.py
python3 scripts/vertical-v02/run_maintenance_access_ui.py
python3 scripts/vertical-v02/review_maintenance_access_images.py
python3 scripts/vertical-v02/write_maintenance_access_evidence.py
```

The final command validates current geometry identities, original-build preservation, source/export/native evidence and the retained screenshots. Human visual review remains required; a green structural test is not final visual acceptance.

## Current identities

- Entry SHA256: `08249105dfcbb14efd16d027b407dcb6122e186951ef6b18122e5953ac644cd7`
- Runtime manifest SHA256: `5372f2b0dd49b9418e24595c4ab0e488ccc0ad5b961644c5d2436329c1f79727`
- Blender master SHA256: `95755eaa2f36827840a825fb7732ff30e31a7cf96a18abd0cc2793a490eb9a6f`

Final checkpoint bindings include 110 retained artifacts and 17 protected prior game entries. Initial fit, export-name, door-clearance, test-fixture and descending-camera failures remain attached in the evidence folders.
