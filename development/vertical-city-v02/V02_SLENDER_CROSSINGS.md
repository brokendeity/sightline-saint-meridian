# Flared public crossings — source-authored candidate

Current experimental full-game entry: `SIGHTLINE_SAINT_MERIDIAN_V02_FLARED_CROSSINGS.html`, SHA256 `f98c559846b1c4c16c79a4ecdafaaf1d222a218758b6ac43f1099e5b05975980`. It derives from the frozen complete architectural-shadow game. The default and all earlier published builds remain unchanged.

This changes actual Blender architecture and physics. The six main crossings retain seven-metre junctions, then taper over seven metres at each end to a 4.4 m middle. The lower market return keeps its entire north edge in place to preserve its adjoining rescue plaza; its middle is 5.7 m wide. Nominal circulation centre lines, elevations, original galleries, rooms, encounter positions and all hero abilities remain fixed. Total crossing floor area changes from 1,470 to 1,069.6 m².

The thinner spans and flared guardrails are visible in current native canonical and close inspection captures. The full reference-art gate remains **FAIL**: large encounter/landing platforms, repeated window-grid facades, sparse interiors and placeholder civilian art still need refinement. The canonical reference cameras were not moved to hide those problems.

## Source and physical authority

`SaintMeridian_V02_Slender_Crossings.blend` is a separate saved/reopened child of the architectural-shadow master. Only 28 original floor/guard/cap meshes and their explicitly listed metadata/old collision markers change. All unrelated source objects, source lights, materials and packed images are retained. Native fingerprints independently preserve the actual 310 original buildings, their full/LOD attributes, transforms, materials and compound parts, the plaza and gameplay light parameters. No second original city is exported.

The source floors are genuinely narrower polygons. Old broad floor and straight parapet contacts are disabled; 969 named floor/guard contact segments replace the 17 superseded contacts. There are 10,644 district contacts in this candidate. Floor contact rectangles stay entirely inside the actual sloped footprint, with at most 0.04643 m inward approximation. Curved guard AABBs have less than 0.047 m conservative horizontal excess. This bounded approximation still requires actual movement tests; it is not exact oriented collision.

Independent source reopening checks manifolds, positive volumes, actual polygon area, 8,400 dense source rays, contact-marker transforms and every exported rendered corner. Eight replacement GLB chunks pass independent source/raw/shipping position, normal, UV, tangent and material checks, with zero Khronos errors or warnings. Seventy-three chunks remain reused. Continuous complete four-car train and three-band aircraft hull preflights pass; source bounds also clear original visible building geometry.

Current native inspection compares all 2,520 kept support points exactly against the parent, tests the actual shipping triangle profiles and rejects both rendered and invisible floors at 1,452 removed-area points. A first optical fixture compared two different transient hero-fill settling values; it is archived and corrected to the coded settled Backspool value in both scenes. A separate flat-floor assumption exposed the inherited 0.18/0.36 m market stairs. Both diagnostic drafts are retained; current comparison preserves those actual step semantics rather than changing the gameplay solver.

## Runtime and lighting scope

The complete-game builder proves the inverse transformation to its parent. Only the manifest selector, the world-life route/archive references and the rim-shadow contract reference change. The derived loader files are inverse-checked copies. Hero animation, movement, powers, combat, mission and input code remains byte-identical.

The existing eleven walkers and 36 scenic aircraft retain their routes. The ambient archive now points to the current physical manifest. Real simulation and current route acceptance remain required independently of that metadata.

Room UV2 receiver geometry and its previous baked fixture contribution are retained as immutable component data. The bridge change alters the surrounding scene, so indirect coupling and local reflection probes require reassessment/rebaking before final lighting acceptance. No current-master bake equivalence is claimed. The source-authored cached warm-rim map is rebuilt from current geometry.

## Current verification

- Source authoring, independent reopening, rendered-corner packaging and traffic/original-geometry preflights: PASS within their stated scope.
- Installed develop-web-game client: PASS with actual movement and no error artifact; screenshot opened.
- Three complete public loops: PASS with ordinary movement, supported surfaces, no injury and no camera-inside frames.
- Native current profile/support and original-city preservation inspection: PASS.
- Seven-job broader current suite: all seven jobs terminated successfully. Full-native world life ran180simulation seconds with11walkers/36aircraft. All nine room/control cases, six fresh station approaches, short-catch recovery, twelve retained encounter/replay/discovery cases and four matched Blender source views pass their bounded assertions. The final60-second matched timing comparison is measured, not a combined stress certificate.
- Additional guard-approach test ran after the benchmark: all33normal-input walking approaches stopped at the curved rails without loss of support or injury. It does not certify high-speed vault/impact behavior.

Physical devices, broad original mission/legal-destruction/failure behavior, combined combat/replay/drone/destruction stress, lighting rebakes and complete approved-reference art acceptance remain open. This is not a completed V02 district.

## Reproduction

Run from this worktree with the existing port 8766 server. Source commands use Blender's background CLI.

1. `python3 scripts/vertical-v02/plan_slender_crossings.py`
2. `python3 scripts/vertical-v02/validate_slender_crossing_clearance.py`
3. `node scripts/vertical-v02/validate_slender_crossing_traffic.cjs`
4. Blender `--background --factory-startup --python-exit-code 1 --python scripts/vertical-v02/blender_slender_crossings.py`
5. Blender `--background --factory-startup --python-exit-code 1 --python scripts/vertical-v02/validate_slender_crossing_master.py`
6. `node scripts/vertical-v02/package_slender_crossings.mjs`
7. `python3 scripts/vertical-v02/build_slender_crossings.py`
8. Installed develop-web-game client via `development/vertical-city-v02/tools/run-slender-skill-client.cjs`.
9. `node scripts/vertical-v02/inspect_slender_crossings.cjs`
10. Three-loop runner with `V02_LOOP_BUILD=V02_Slender_Crossings_Build.json`, a separate `V02_LOOP_RUN` and `V02_LOOP_REPORT`.
11. `python3 scripts/vertical-v02/run_slender_crossing_checks.py`
12. `node scripts/vertical-v02/test_slender_guard_approaches.cjs`, after the preceding suite has terminated.

Do not change source/runtime/test bytes while the frozen suite runs. Do not restart a live runner because a polling call times out.

## Matched performance and capture review

At1280×800, both60-second runs cover640.6536m with identical sampled actor/camera positions. Frame p50/p95 changed9.8/24.0→10.3/24.8ms. Simulation CPU p50/p95 changed8.6/16.6→9.2/17.2ms. Render submission p50/p95 changed4.1/4.8→4.1/4.9ms; GPU p50/p95 changed7.6471/10.6266→7.5037/10.5085ms. Median draw calls remained411. Dropped simulation time changed0.1799→0.3125s; load time9203→9761ms. Candidate maximum frame125.5ms/render submission74.7ms still warrants release investigation. This pair does not establish causality or sustained combined performance.

Actual loop, room desktop/portrait/landscape, world-life, advanced-route, short-catch, service-Echo, rescue, pursuit, discovery and guard sample PNGs were opened, as were both benchmark timeline contact sheets. The first video tile shows loading before the measured workload. The market rescue still puts a civilian close enough to overlap the hero; placeholder art and wider movement/camera cases remain open. No final visual-quality PASS is inferred. The evidence index binds this candidate, scripts, source, source/export witnesses, reports, traces and captures.
