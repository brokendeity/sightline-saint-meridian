# Existing warm-light architectural shadows — experimental candidate

`SIGHTLINE_SAINT_MERIDIAN_V02_RIM_SHADOWS.html` derives from the frozen complete public-room/life game. Its builder proves that removing its single extra script tag reproduces the parent bytes. No default entry or earlier HTML file is replaced.

The purpose is to fix the pale facade response caused by the existing warm directional light illuminating surfaces through overhead architecture. Controlled optical ablations showed that disabling that light had much more effect than disabling environment reflections. The repair retains the light's color, energy and direction and supplies architectural occlusion instead of darkening the palette or exposure.

## Source authority and implementation

`SaintMeridian_V02_Rim_Shadow_Domain.blend` derives from the public-room lighting master. Authoring and independent reopening preserve all 50,173 prior object signatures and all prior light parameters. The source SUN already casts shadows in Cycles. A hidden metadata object defines its bounded browser shadow domain; it adds no gameplay mesh. The runtime contract binds the saved source identity, SUN direction/color/energy, domain, projection and filter policy.

A separate offscreen scene shares the actual full building and static district geometry. It never enters the gameplay scene, contact registries, camera obstacles or navigation. Its 569 casters include the original full buildings and their fixed fittings and cassettes, plus V02 architectural meshes. Original imported glazing is excluded through its per-vertex material semantics; transparent material groups are also excluded. This is an approximate opaque-shadow policy, not source glass-transmission equivalence.

The existing main sun keeps its dynamic shadows. Heroes, visitors, trains, aircraft and debris are excluded from this additional static rim map, avoiding frozen actor shadows. The 2048-square map is cached until geometry versions, original building damage/destruction or relevant transforms change. The auxiliary offscreen light references the existing rim shadow resource; the actual gameplay scene retains exactly eleven lights. No extra dynamic-light fixture enters that scene.

The first implementation incorrectly called the pinned renderer's shadow-map helper outside its render-state lifecycle. It failed visibly and is retained under `first-direct-shadow-call-rejection`. The repair uses the supported renderer render lifecycle and restores the prior render target. A subsequent benchmark of the ordinary filtered shadow version regressed significantly and is retained under `first-performance-rejection`; it was not promoted. The revised candidate checks static transforms without repeatedly multiplying every ancestor chain, warms the changed shader programs and uses four depth comparisons with bilinear weights only for this cached rim map. Existing dynamic-light shadow filtering retains its original vendor branch.

This is a PCF depth-map approximation; it does not establish Cycles angular softness, full shading fidelity or final reference-art acceptance.

## Evidence and current limits

`V02_Rim_Shadow_Source.json` records the reopened source preservation. `V02_Rim_Shadow_Build.json` binds the current entry, script, source master and contract. `V02_Rim_Shadow_Native.json` records same-scene deferred admission, original/district geometry and material preservation, all 310 original buildings, 9,692 contacts and eleven lights, identical main-pass calls/triangles, and explicit static-cache invalidation/restoration fixtures. Those fixtures deliberately alter and restore test setup; they do not replace legal-input destruction acceptance.

The native report includes the unchanged original reference bookmarks and additional diagnostic A/B and room views. These are labelled separately. Actual captures are reviewed rather than treating source checks as visual acceptance. Shadowed facade panels become midnight blue and warm windows remain, but direct-lit warm patches, broad continuous deck undersides, repeated flat-window towers, unfinished room furnishing and placeholder civilian art remain. The full approved-reference gate still FAILS.

The installed develop-web-game client is run unchanged through the existing Metal/readiness adapter. Its current state and screenshot are under `evidence/rim-shadow/stock`. Movement/mobile captures, the revised matched 60-second benchmark and saved-source render comparison are separate reports; only terminal results with matching candidate hashes are evidence. Physical devices and combined combat/replay/drone/destruction stress remain outside these bounded fixtures.

## Reproduction

From this worktree with the existing local server on port 8766:

1. Blender `--background --factory-startup --python-exit-code 1 --python scripts/vertical-v02/blender_rim_shadow_domain.py`
2. `python3 scripts/vertical-v02/build_rim_shadow_candidate.py`
3. `node scripts/vertical-v02/test_rim_shadows.cjs`
4. Installed develop-web-game client via `development/vertical-city-v02/tools/run-east-public-skill-client.cjs` against the new entry.
5. `node scripts/vertical-v02/benchmark_rim_shadows.cjs`, with no other automated browser/render workload.
6. `node scripts/vertical-v02/test_rim_shadow_movement.cjs`
7. Blender `--background --factory-startup --python-exit-code 1 --python scripts/vertical-v02/render_rim_shadows.py`

The public-room/life parent checkpoint remains the published tested room build. This lighting candidate is not a completed V02 district.

## Revised matched timing result

The terminal revised comparison completed 60 simulation seconds and 640.6536 m in each build with identical sampled actor/camera positions. Median frame interval was 9.1 → 9.9 ms (+8.8%); p95 was 23.5 → 18.5 ms. Simulation CPU p50/p95 was 8.9/17.0 → 8.8/16.6 ms; GPU p50/p95 was 6.8333/9.3199 → 7.4923/10.1658 ms. Median/p95 world draw calls stayed 409/523. The rim map updated once throughout the candidate workload. Dropped simulation time was 0.4754 → 0.2916 s.

The candidate still recorded a 348.9 ms maximum frame interval and a 324.5 ms maximum render submission. This hitch remains a release concern; median results do not erase it. One bounded pair is not sustained combined combat/replay/destruction acceptance or a causal claim about p95 improvement. The earlier rejected pair is retained rather than replaced in the evidence history.

The current nine room-route cases and three saved-source camera renders terminated successfully on entry08312dcd. Desktop24, portrait52 and landscape84 room images, all three source images, native canonical bookmarks, stock gameplay and the two benchmark video contact sheets were opened. Rooms remain sparse and the canonical lower view remains dominated by deck undersides. These are open design findings, not passing art criteria.
