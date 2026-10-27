# Gallery-connected public terraces

The complete-game candidate is `SIGHTLINE_SAINT_MERIDIAN_V02_PUBLIC_TERRACES.html`. It derives from the current camera-acceleration game by changing only the architecture-manifest selector. The camera optimization, heroes, animations, powers, controls, missions, roads and original 310 building shells retain their previous implementation. Earlier entries and assets remain immutable.

## Actual architectural change

Three sheltered public seating/outlook terraces sit at 24, 52 and 128 m on the south-facing rear of original building141. They are physical public spaces, not painted room images or invented private entrances. Each has a 12×8 m terrace, an 8×3.8 m supported connection to the existing west gallery, a flat walking surface, closed coffered roof, tinted-glass rear/side pavilion walls, seating, planted beds, mullions and thin cyan edge lighting. Two warm luminaires attach below visible roof beams. Five independent ground-rooted columns and the terrace/neck girders supply the declared load path; the destructible original tower is not a false structural parent.

The connection requires a3.5m opening in the gallery boundary. Six named steel/glass rail spans and their six cyan caps are shortened in both source geometry and physical records. No intact visible barrier is made non-colliding. New side rails guard the supported neck and terrace perimeter. Every unrelated source object remains unchanged after saving and reopening the Blender master. All310 original building meshes, transforms and compound contacts remain unchanged in the actual browser comparison.

The saved master is `blender/SaintMeridian_V02_Public_Terraces.blend`. It preserves40,565 unrelated prior objects and changes the12 named rail/cap objects. There are124 new records, including68 solids. Six existing modular chunks are selectively re-exported for the openings; four new chunks carry the three terrace levels and common frame. Other60 chunks retain their previous asset URLs and hashes. One shared foliage material is added; there are no added dynamic lights, global exposure or bloom changes. Original roads, plaza and source building layout remain fixed.

The first foliage iteration had reversed duplicate faces, which Blender flagged. The next independent export check caught a leaf exceeding its narrow Z envelope. Both failures are retained under `evidence/public-terraces`; the leaf mesh was corrected rather than widening accepted clearance bounds. An independent reopen checks136 actual source meshes, manifold solids, flat supported tops and available collision markers. The final saved mesh validation and ten shipping GLB checks pass with zero Khronos errors or warnings. glTF Transform performs lossless resource deduplication/pruning; decoded positions, indices, normals, UVs and material bindings remain equivalent to the final raw exports.

## Connections and clearance

The current guard summary is recomputed from3,722 actual solid guard records, correcting the stale inherited count. Fifty-four recorded source-contact connections describe the frame/floor/roof relationships; contact adjacency does not certify structural strength.

Three new outlook nodes and six directed approach/return edges extend the movement graph. All existing nodes/edges are retained. The graph keeps source-authored and input-verified evidence separate. These branches require no power releases; they do not redefine the nine still-outstanding advanced edge timings.

Preflight checks include actual compound building/prop/V02 contacts,39,865 ground-road/sidewalk footprint comparisons and the three new body corridors. A separate check protects970 existing route segments against all new solids. Train/aircraft separation uses complete direction-independent vehicle envelopes and the continuous native Catmull-Rom cubic control hull, with a numerical check of the cubic reconstruction. The minimum new-geometry separation is21.17m horizontally from the aerial envelope and17.92m from a conservative10m train-vehicle radius. Loaded four-car geometry measures below7.87m in the tested pose, leaving room inside that reserve. This bounded proof concerns the additions; it does not certify the entire pre-existing district or vehicle physics.

## Native evidence

Eleven current native groups pass. They preserve all310 original buildings/compound contacts, roads, light count and unrelated V02 contacts; verify the changed rail contacts; and exercise each terrace through ordinary A/W/S/D from one labelled gallery setup. Each enter→outlook→return takes 6.70 simulated seconds, including the four intentional stops, stays grounded, suffers no damage and releases no powers. The native camera stays outside the added structure bounds. Six additional held-Space fixtures sample all 112,380 rendered character vertices every three frames beneath the roofs and beams. Sampled body geometry stays at least 3.3 cm below the conservative underside, and at least the animated head or hips remains framed and unoccluded in every sampled airborne frame. The fixture waits 90 idle ticks for the native camera to settle after its labelled start; the initial three-tick setup produced misleading camera captures and is retained as rejected fixture evidence. No runtime camera change was needed.

Separate local fixtures verify front-perimeter protection and real roof-top support. Those drops do not establish a normal-input route onto the maintenance roofs.

The three full public city loops are also revalidated on this combined build: lower55.37s/361.41m, mid35.37s/229.41m and high37.2s/241.51m, with no damage, no power releases and zero recorded camera-inside frames. Only initial setups are used; no in-route actor, camera or resource writes certify these loops. Advanced approaches, full cross-layer journeys and final combined regressions remain separate gates.

## Visual review and limits

Before/after A/B images are actual browser renders at the saved comparison bookmarks. E is an explicitly labelled, camera-only inspection of the middle terrace. Actual hero captures show the accessible outlook on all three levels. Saved-master Cycles A/B renders and a render-only matching E camera are retained separately; projection agreement proves optics, not shading or reference fidelity.

The new public rooms add real sheltered depth and plausible destinations. The high-angle view still contains a large blank original face and repeated tower windows; the lower view remains dominated by existing structural masses. Native materials and Blender shading differ, and the broad city composition still falls short of the approved references. No final skyline, structural-engineering, lighting, population or AAA visual acceptance is claimed. These rooms add no new civilian AI or encounters; existing city visitors remain on their prior routes. Physical-device checks, new normal-input cartridge/roof access, final combined stress/performance and the full release checklist remain open.

## Reproduction

With the local game server on8766:

```sh
python3 scripts/vertical-v02/plan_public_terraces.py
/Applications/Blender.app/Contents/MacOS/Blender --background --python-exit-code 1 --python scripts/vertical-v02/blender_public_terraces.py
/Applications/Blender.app/Contents/MacOS/Blender --background --python-exit-code 1 --python scripts/vertical-v02/validate_public_terrace_master.py
python3 scripts/vertical-v02/extend_public_terrace_graph.py
python3 scripts/vertical-v02/finalize_public_terrace_metadata.py
node scripts/vertical-v02/package_public_terraces.mjs
node scripts/vertical-v02/validate_public_terrace_exports.cjs
node scripts/vertical-v02/validate_public_terrace_routes.cjs
python3 scripts/vertical-v02/build_public_terrace_candidate.py
node scripts/vertical-v02/test_public_terraces.cjs
node scripts/vertical-v02/test_terrace_ceiling_jumps.cjs
V02_LOOP_BUILD=V02_Public_Terrace_Build.json V02_LOOP_RUN=public-terrace-loops V02_LOOP_REPORT=V02_Public_Terrace_Loops.json node scripts/vertical-v02/test_current_city_loops.cjs
/Applications/Blender.app/Contents/MacOS/Blender --background --python-exit-code 1 --python scripts/vertical-v02/render_public_terraces.py
V02_HUD_ENTRY=SIGHTLINE_SAINT_MERIDIAN_V02_PUBLIC_TERRACES.html V02_HUD_RUN=public-terrace-hud V02_HUD_REPORT=V02_Public_Terrace_HUD.json node scripts/vertical-v02/test_hud_candidate.cjs
```

This remains a bounded, incomplete V02 checkpoint. Do not promote its local green checks to whole-city acceptance or reuse the parent’s performance measurements as results for this new geometry.

The first timing summary excluded the four 8-tick stops from the retained trace. The final harness retains those steps and reports the full 6.70-second visit; the accounting correction is preserved in evidence.
