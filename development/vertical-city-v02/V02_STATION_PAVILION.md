# Raised glazed station pavilion

The complete game candidate is `SIGHTLINE_SAINT_MERIDIAN_V02_STATION_PAVILION.html`. It derives from the current public-terrace game by changing only its architecture-manifest selector. The original 310 buildings, roads, plaza, missions, powers, animations, camera/controller code and all older playable entries remain intact.

## Actual architecture

The Y100 stair pavilion previously had an opaque steel roof with a 103.1 m underside. At the native station-arrival camera it occupied a large, nearly black upper region of the image. The new roof underside is 104.0 m: **0.9 m more headroom**. Its steel perimeter and grid hold recessed tinted-glass panels. Four warm strips physically mount to the central steel rib. Glazing uses a separate shared PBR material at 0.28 alpha; there are no new dynamic lights, exposure or bloom changes.

The original stair landings, floors, entrances and lower wall openings remain. Glass wall tops and four existing posts extend to support the raised roof. The roof remains a closed, solid, walkable maintenance surface at 104.2 m. Transparency does not remove landing collision.

The first actual-volume preflight found an existing column penetrating the roof and west glass wall. The revised roof is three source meshes/contact records with an **80 mm clearance notch** around `column-59.4-386`. The west glass panel is split around the same column. No hidden full roof box spans the notch. The failed preflight and the final corrected source are retained.

The separate Blender master, `blender/SaintMeridian_V02_Station_Pavilion.blend`, preserves 40,747 unrelated prior source objects. Nineteen existing source records change and seven records are added: two roof wings, one glass return and four lights. One existing 1,950-record modular chunk is selectively re-exported; one small new chunk carries the additions. The other 69 chunk URLs/hashes are reused. Six explicit source-bounds contacts describe post/roof and roof-wing adjacency; they do not certify structural strength.

Independent saved-master validation checks all 26 revised/added component meshes, closed solids, exact bounds, three flat roof tops and available collision markers. Both shipping GLBs pass Khronos validation with zero errors/warnings. glTF Transform deduplicates/prunes resources without simplifying or quantizing geometry; decoded positions, indices, UVs, normals and material bindings match the raw exports.

## Gameplay and visual evidence

The volume preflight protects 38,228 actual body samples from the six retained station journeys. Full bank-inclusive scenic-air envelopes are vertically separated from all added volumes. The native train route stays at Y100; independently measured car geometry stays below Y103, with a 5 cm reserve. Matching loaded four-car bounds are checked in the browser. These continuous vertical-separation arguments concern the revisions, not a new whole-world clearance certification.

Native comparison preserves original building mesh/transforms/compound contacts, road lane count, light count and every unrelated V02 collider. Actual packed glazing loads transparent. A held-Space jump samples posed character vertices every three frames and clears the new 104 m underside. A separate labelled 2 m drop lands on the real 104.2 m roof top. Two ordinary R casts attach to the actual new roof geometry and create a physical rail. These local fixtures do not establish a public maintenance-roof route or a roof-rail ride/Pop sequence.

An initial repeated drop fixture paused itself: it called the native controller-disconnect routine after starting the game. The frozen pose/clock and rejected report are retained. The setup now clears input/controller state **before** starting. No runtime pause/physics behavior was changed.

All six ground-to-station approaches are repeated against this combined build in `V02_Station_Pavilion_Routes.json`: public, momentum and mastery, each with zero/full legally earned initial banks. Their full input paths and timings match the prior build; all finish supported without injury. The public and momentum routes consume no Drive releases; the full-bank mastery variant performs one real fall brake. These are input-step times, not performance measurements or human benchmarks.

Actual before/after station captures use the **same native camera matrix and projection**. They show the opaque upper ceiling replaced by visible roof framing and upper city layers. A/B are labelled fixed comparison bookmarks. Saved-master Blender A/B/S renders use matching optics and are retained separately. Engine shading differs, and geometric projection agreement is not visual fidelity. The local station view improves; generic original massing, broad structural proportions and the full approved-reference city composition remain unfinished.

The current three public loops, retained HUD/input scenarios and installed stock client are run separately, with their final summaries bound in `V02_Station_Pavilion_Evidence.json`. Full combined encounter/replay/destruction/mission regressions, final sustained performance with fixed internal resolution/GPU-aware measurements, and physical-device checks remain open. Do not inherit the parent's performance numbers for this new geometry.

## Reproduction

```sh
python3 scripts/vertical-v02/plan_station_pavilion.py
/Applications/Blender.app/Contents/MacOS/Blender --background --python-exit-code 1 --python scripts/vertical-v02/blender_station_pavilion.py
/Applications/Blender.app/Contents/MacOS/Blender --background --python-exit-code 1 --python scripts/vertical-v02/validate_station_pavilion_master.py
python3 scripts/vertical-v02/finalize_station_pavilion.py
node scripts/vertical-v02/package_station_pavilion.mjs
node scripts/vertical-v02/validate_station_pavilion_exports.cjs
python3 scripts/vertical-v02/build_station_pavilion_candidate.py
node scripts/vertical-v02/test_station_pavilion.cjs
/Applications/Blender.app/Contents/MacOS/Blender --background --python-exit-code 1 --python scripts/vertical-v02/render_station_pavilion.py
V02_ROUTE_BUILD_REPORT=V02_Station_Pavilion_Build.json V02_ROUTE_SUITE=station-pavilion-routes V02_ROUTE_REPORT=V02_Station_Pavilion_Routes.json python3 scripts/vertical-v02/run_current_station_routes.py
python3 scripts/vertical-v02/run_station_pavilion_ui.py
python3 scripts/vertical-v02/write_station_pavilion_evidence.py
```

Use a local server on port 8766. Browser scenarios run sequentially. Original source assets, masters, accepted historical graph/timing records, older game builds and GitHub snapshot refs remain preserved. This is an incomplete V02 checkpoint.
