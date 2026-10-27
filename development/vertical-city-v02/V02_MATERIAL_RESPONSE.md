# V02 material-response candidate — 2026-10-27

Current full game: `SIGHTLINE_SAINT_MERIDIAN_V02_MATERIAL_RESPONSE.html`. This forks the complete maintenance-access build; the only HTML change adds a hash-versioned material script. Older builds remain available. This is a source-verified visual-development checkpoint, **not completed visual or release acceptance**.

Blender source: `development/vertical-city-v02/blender/SaintMeridian_V02_Material_Response.blend` (`c9f21cdb00097e3de137e178f656d967890e213ab8448438eb7b824945046a67`). Runtime material contract: `assets/city/vertical-v02/material-response/materials.json`. The architecture manifest remains the exact maintenance-access manifest. `V02_Current_Candidate_Status.json` now points to this candidate; its formerly stale Phase5 status is archived separately.

## Actual changes

- Three original corridor owners, building-141/160/162, gain per-source-palette cladding, alloy, glass and emitter reflectance. All full/LOD positions, normals, source colors/emission, topology and world transforms remain unchanged.
- 90,876 source vertices receive a two-component reflectance attribute. Existing clipping already preserves this attribute; direct native carve/collapse checks confirm cleanup. The shared source geometry gains an attribute; no extra shell, building or collision surface is created.
- A scene-linear 1024×512 HDR reflection panorama is baked from the actual current Blender city at `[80,65,340]`. The compressed half-float payload is 2,914,895 bytes. A six-axis rendered calibration verifies equirectangular orientation and bottom-first upload. Runtime performs one PMREM preparation and reuses the result.
- 33 existing district/facade material bindings gain the shared environment. Imported GLTF metalness/roughness factors **and linked texture maps are preserved**. No exposure, fog, bloom, existing light, camera, controller or gameplay changes.
- Saved/reopened source validation preserves 42,088 unrelated objects and every existing local transform/parent. The three controlled reference material bindings retain exact mesh/UV/normal/face assignments. Original reference shells are not exported into runtime.

## Current evidence

`V02_Material_Response_Evidence.json` binds source, build, assets, native, input and measurement artifacts. Tests run sequentially, with current source/asset identities locked.

- All310 original full/LOD meshes and compound contacts,642 active road lanes,7743 V02 contacts and nine scene lights preserved.
- Six normal-input ground-to-station journeys pass, with the public route taking135.33s at zero bank and135.08s with legally earned full bank. Momentum73.23/72.65s; mastery103.77/103.30s. No new route or resource injection is used.
- Three entire public loops,15 retained HUD/input groups and the installed web-game client pass. Stock input visibly moves Backspool X55→65.835. Desktop/portrait/landscape and actual native/source A/B images were opened for review. Browser touch and controller simulation do not certify physical devices.
- Five matched **world render passes**, excluding the final compositor quad, keep the same calls510/316/532/515/258 and the same triangle counts. This is draw-count parity, not zero shader cost.

## Measured shader cost

Two native-RAF runs each execute60 simulation seconds and approximately60.15 wall seconds, covering640.65m using ordinary simulated-controller axes. Rendering remains1280×800 internally throughout. Recorded player/camera samples match exactly. Actual video timelines are retained and reviewed.

| Metric | Maintenance baseline | PBR candidate |
| --- | ---: | ---: |
| Frame interval p50 | 8.40ms | 8.40ms |
| Frame interval p95 | 17.10ms | 17.00ms |
| Simulation CPU p50/p95 | 8.70/16.40ms | 6.90/15.40ms |
| Render submission CPU p50/p95 | 3.40/4.10ms | 3.70/4.40ms |
| Actual GPU elapsed p50/p95 | 4.45/7.37ms | 6.51/8.49ms |

GPU timer queries are supported here:1344/1324 valid samples, zero disjoint samples. **GPU median cost increases about46%**. CPU differences between the two runs are observations, not an optimization claim. This lower-loop workload excludes combat/replay/destruction stress and does not close the combined release/performance gate. The scheduler drop counter is incomplete for outer-frame clamps; heap snapshots do not prove peak usage or absence of leaks. Benchmark end screenshots follow its synthetic inactive-game flag and do not certify paused HUD or hero-objective presentation.

## Failures retained and corrected

1. Clearing copied Blender material slots reset face assignments. The independent validator caught it. The exact failed master, contract and initial native report are retained; restored face assignments are independently verified before the final bake.
2. A naive runtime-factor equality check mistook a linked Blender roughness input for a constant. Preserve the GLTF factor and roughnessMap together; do not multiply the authored roughness twice. The initial mismatch report/image remain retained.
3. The first measurement read the final compositor's one draw/two triangles. The replacement records the actual city render pass and requires more than50 world calls. The misleading historical counter report is retained and is not accepted cost evidence.
4. An early route run detected changed script/test fingerprints and rejected the mixed attempt. All six final runs were repeated against the frozen current build.

## Open work

**Full approved-reference visual quality remains FAIL.** Repetitive window grids, limited facade depth/variety, a large direct specular patch and source/native lighting differences still need substantial architectural and lighting work. A static local environment cannot reproduce correct reflections everywhere and does not update after destruction or moving trains.

The whole current encounter/replay/destruction/mission/failure regression suite, final combined sustained workload, GPU-budget optimization, broader camera coverage and physical-device playtesting remain open. Current source-backed route tests do not certify all old graph edges. No paid assets or agents were used.

The current scope and completion standard remain the full user city brief. No older game build or GitHub snapshot is promoted over or replaced by this candidate.
