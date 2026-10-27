# V02 stepped service tower — bounded architecture checkpoint

The current complete candidate is `SIGHTLINE_SAINT_MERIDIAN_V02_SERVICE_TOWER.html`. It forks the station-pavilion game by changing only the architecture manifest selector. Previous complete game entries, source masters, V1, GitHub snapshots and the original310 buildings are retained.

The four solid wall-climb grayboxes now contain actual framed, glazed plant chambers rather than an opaque twelve-metre-deep mass. The first chamber has a real2.6m-wide inspection entrance from the84m public gallery. Equipment housings, grounded skids, ventilation risers, fan relief, coffered slabs and warm ceiling strips are Blender-authored geometry. No dynamic light, global exposure or bloom increase was added.

## Geometry and ownership

- Four controlled source-mesh revisions preserve the exact8m-wide front climbing planes, their full vertical extents and roof levels96/108/120/128m.
- Each complete old8x12m supported roof remains: the original front-wall top and new roof slab meet without overlapping. Independent reopened-source face-area checks measure95.999999m² versus96m² per roof.
-147 new records; source/GLB/collider bounds retain exact ownership.151 independently reopened components include135 solid meshes and12 walkable tops.
- Eight changed saved local transforms are explicitly limited to the four room meshes and four hidden collision markers. 40789 unrelated saved local transforms/parents/collection membership/visibility are preserved. The separate source geometry signature check preserves40789 unrelated source objects.
-69 previous chunks reused, two selective replacement chunks retain every unaffected component they originally contained, and one new plant-room chunk is added. Three shipping GLBs total2,168,848bytes. Exact decoded geometry/material-binding/UV/normal/index equivalence passes after lossless packaging; Khronos reports0 errors and0 warnings.
- Sixteen post-to-roof source contacts establish adjacency, not engineering strength certification. The two inherited station-cover bracket contacts remain documented in the plan.
- Full-vehicle continuous cubic-hull envelopes clear the new geometry horizontally by at least5.173m for aerial traffic and1.923m for the conservative10m train radius. The radius is the existing, previously loaded-asset-validated reserve; this is not a new complete train-asset certification.

## Actual browser validation

The native comparison preserves the exact original310 building meshes/transforms/compound parts, road-lane count, light count and every unrelated V02 collider. All four actual mesh front/roof raycasts pass and the new interior points are hollow. A single labelled start followed by ordinary keyboard movement enters and exits the inspection bay on continuous84m support without jump, power or injury.

All six complete normal-input station journeys pass on this exact candidate:

| Approach | Initial zero bank | Legally earned full bank |
|---|---:|---:|
| Public |135.333s /774.381m |135.083s /773.978m |
| Momentum |73.233s /702.009m |72.650s /701.842m |
| Mastery |103.767s /933.724m |103.300s /933.509m, one actual brake release |

There is one labelled starting fixture per run, with no in-route actor/camera/resource assignments. Both mastery runs complete all four original wall ascents and the physical rail/Pop/recovery sequence. Zero means initial bank; ordinary running may earn impulses. These are deterministic simulation/input timings, not sustained wall-clock performance results.

The complete public loops also pass: lower55.367s, mid35.367s, high37.200s; grounded, no injury, no power releases and0 sampled camera-inside frames. All15 retained HUD/input groups and the installed web-game client pass. The client actually moves the actor fromX55 to64.845; exit status alone was not accepted as proof of input. Simulated controller and browser touch checks are separate from physical-device playtesting.

## Visual review and incomplete work

Actual native before/after A/B/S/P captures use identical view matrices. Saved-source Cycles A/B/S/P renders use matching projection, with maximum tested optics error below0.004px. Native inspection/return, advanced-route contact sheets, full-loop, portrait/landscape and installed-client screenshots have been opened.

The former solid rear face is now transparent articulated architecture and city depth is visible through it. The overall approved-reference visual-quality gate remains **FAIL / incomplete**: repeated broad tower massing, material/light response, skyline depth and architectural variety still need work. Blender illumination is visibly darker than the browser; projection agreement is not shading or final visual fidelity.

The three upper plant interiors remain sealed service volumes. Believable maintenance access must still be added; this checkpoint does not certify them as public destinations. The ground-level inspection bay is the only new validated interior visit.

The full current encounter/replay/destruction/mission/failure-path regression suite, final combined>=60second fixed-resolution/GPU-aware performance workload and physical controller/touchscreen checks remain open. Parent CPU optimization results are not inherited as performance acceptance for this new geometry. The full user goal remains ACTIVE and INCOMPLETE.

## Reproduction

Run from the repository root, preserving the input source masters:

```sh
python3 scripts/vertical-v02/plan_service_tower.py
/Applications/Blender.app/Contents/MacOS/Blender --background --python-exit-code 1 --python scripts/vertical-v02/blender_service_tower.py
python3 scripts/vertical-v02/finalize_service_tower.py
node scripts/vertical-v02/package_service_tower.mjs
python3 scripts/vertical-v02/build_service_tower_candidate.py
/Applications/Blender.app/Contents/MacOS/Blender --background --python-exit-code 1 --python scripts/vertical-v02/validate_service_tower_master.py
node scripts/vertical-v02/validate_service_tower_exports.cjs
node scripts/vertical-v02/validate_service_tower_clearance.cjs
node scripts/vertical-v02/test_service_tower.cjs
/Applications/Blender.app/Contents/MacOS/Blender --background --python-exit-code 1 --python scripts/vertical-v02/render_service_tower.py
V02_ROUTE_BUILD_REPORT=V02_Service_Tower_Build.json V02_ROUTE_SUITE=service-tower-routes V02_ROUTE_REPORT=V02_Service_Tower_Routes.json python3 scripts/vertical-v02/run_current_station_routes.py
python3 scripts/vertical-v02/run_service_tower_ui.py
python3 scripts/vertical-v02/review_service_tower_images.py
python3 scripts/vertical-v02/write_service_tower_evidence.py
```

Browser checks require the repository server at127.0.0.1:8766 and run sequentially. The evidence aggregator also checks the retained contact-sheet input hashes. Source render time and screenshot timing are not runtime-performance metrics.

## Exact checkpoint identities

- Entry SHA256: `dd9db92b5c108f885ef43a4cf58d70892fb79ae44407b5b509652aac5b05509f`
- Runtime manifest SHA256: `a39dc410368fcfce70a5b1f45d463c074532ddc053badb9aeb37bdeef2f556bb`
- Saved Blender master SHA256: `e862d3717c8117ab7e151aff992633c6e3bd61b077d167107639c0d8a8d4f668`
- Full binding: `V02_Service_Tower_Evidence.json` with91 retained artifacts and16 protected earlier game entries.
