# East public rooms — source lighting and city-life candidate

The new rooms at Y24, Y52 and Y84 now have physical entrances, sheltered seating, planters, glazing and source-baked ceiling light in a full-game candidate. They connect to the existing east gallery through six controlled guard/cap changes. All original 310 buildings remain in place.

This is an experimental checkpoint. The approved-reference architecture/lighting gate still **FAILS**. In particular, broad continuous deck undersides dominate the upward reference view, the right-hand facade has excessive pale glare in the runtime, and the public rooms still need destination information and more convincing furnishing/detail. Existing civilian meshes remain visibly simple placeholders. These shortcomings are not certified by the source or route checks below.

| Artifact | Identity |
| --- | --- |
| Source parent | `SaintMeridian_V02_East_Public_Loggias.blend`, SHA256 `73dea6311c343e00a8621e39535d1e773b8507651f1677302ece94d28e2bcf59` |
| Lighting master | `SaintMeridian_V02_East_Public_Emissive.blend`, SHA256 `8dead00f5b5a9b268d2ea74765e33347e04488040179a72c5db918c3ec06649f` |
| Intermediate lighting stage (attachment-normal defect; use final visitor child) | `SIGHTLINE_SAINT_MERIDIAN_V02_EAST_PUBLIC_ROOMS_V2.html`, SHA256 `5973f59b236ab92c02a6b09f417fcdb48407fe7535e3c4a1344d82d397201674` |
| Geometry manifest | `assets/city/vertical-v02/east-public-emissive/runtime/manifest.json`, SHA256 `0bf5890913968eec9d1450be46d97dcb548693030cc9b0fbef4fb221cd4a6833` |
| Visitor complete-game candidate | `SIGHTLINE_SAINT_MERIDIAN_V02_PUBLIC_ROOM_LIFE.html`, SHA256 `d40e10c5d47b82ecd0eac30adc64e383566ce68cb0504635e256781a43c80300` |

The existing default candidate, older complete-game HTML files and GitHub snapshots are preserved. Neither entry above replaces the default. The separate full-diffuse prototype `SIGHTLINE_SAINT_MERIDIAN_V02_EAST_PUBLIC_ROOMS.html` was rejected during visual review and is not the intended current candidate.

## Source and lighting

The original room source has 91 additions and six controlled rail/cap changes, already independently checked against original facade triangles, detailed attachments, source cassettes and continuous full train/aircraft envelopes. The lighting child preserves geometry, base UV, material-slot semantics and collision metadata. It adds UV2 to the actual source meshes and a dedicated material on the six new ceiling fixtures.

The previous full-diffuse prototype replaced the live diffuse response, making the rooms too dark. The current hybrid preserves the live lighting. Cycles bakes **only the six new fixture emitters**, including direct transfer and indirect bounce, into three separate 512×512 scene-linear RGBA16F atlases at 512 samples. It temporarily excludes the original lights, world and other emitters during that bake, then restores them before saving. Independent reopening compares original light energy/color/shape, world shader inputs/links, materials, packed images, saved transforms and object geometry.

The six source fixtures use a dedicated material at emission strength 96, compared with 34 in the previous source-only room study. The original material resource is explicitly retained through save/reopen. Room reflection panoramas use the restored complete source scene, rather than the isolated black bake world.

The browser uses the standard PBR light-map term once for this isolated contribution. It retains live direct/environment lighting, original base maps and specular response. Room-private material clones prevent changes leaking to other district geometry. No dynamic light is added. Atlas and reflection archives total approximately 2.72 MB compressed; decoded source payloads total 9 MiB before PMREM conversion/disposal. This is not a measurement of total resident GPU memory.

`V02_East_Public_Emissive_Master_Validation.json` proves preservation of 50,008 unrelated source objects, 198 original material node graphs and six packed images. Continuous UV2 intersection tests report zero overlapping triangles. Raw and batched GLBs are checked against reopened source witnesses, including base UV, UV2, winding, normals and tangents. All three UV2 chunks have zero Khronos validator errors or warnings. The immutable-triple transform helper preserves the workaround for the previously demonstrated glTF Transform 4.3.0 tangent mutation bug.

Two failed authoring attempts are retained with their exact scripts and logs: a global variable shadowed the material checker, and an unused rollback material was omitted during save. Both are fixed in the current successful source run. A stale process was not restarted on timeout.

## What the evidence proves

| Check | Result and scope |
| --- | --- |
| Reopened source and shipping attributes | PASS; `V02_East_Public_Emissive_Master_Validation.json` and `V02_East_Public_Emissive_Package.json` |
| Native deferred lighting admission | PASS on lighting-only candidate; all 310 original building attributes/transforms/materials/compound parts, 247 outside meshes, 21 room geometries, 9,692 contacts and 11 lights unchanged across admission |
| Actual GPU atlas sampling | PASS; 72 interior samples, largest absolute half-float/bilinear discrepancy 0.001316 |
| Player room routes | PASS on lighting-only and repaired visitor candidates; nine keyboard/simulated-standard-controller desktop/portrait/landscape cases each, forward and reverse gallery travel, entry, return, support, camera clearance and six-bone framing. Repaired visitor candidate also passes a 0.87m capsule-gap requirement; smallest measured gap is 0.8900m |
| Graph branches | PASS; six new nodes and 18 directed edges, 54 measured intervals, exact parent graph retained; only these new passages are admitted |
| Source/native inspection optics | PASS for saved-source A/B and all three room views; maximum tested projection error below 0.007 pixels; this does not establish lighting or visual fidelity |
| Installed develop-web-game client | PASS on repaired visitor candidate; actual movement, ready/active state and no console-error artifact; screenshot reviewed |
| Added visitors | PASS on visitor candidate; 180 seconds of complete-game 60 Hz simulation, all 11 visitors and 36 scenic aircraft remain active; all three new visitors reach both destinations with supported visible feet and pause/yield/resume behavior |
| Current visitor-candidate player/loop/route/recovery/encounter/performance suite | PASS on corrected candidate; all seven sequential jobs terminated successfully, including all six fresh station approaches, three loops, short-catch recovery and 12 retained encounter/replay/discovery cases; authoritative status is `V02_East_Public_Room_Life_Checks.json` |
| Full reference art, mission/legal-destruction/failure regressions and combined release stress | Incomplete; not covered by the bounded checks above |
| Physical controller/touchscreen playtesting | Not tested; mobile captures use viewport layouts and simulated standard-controller input |

The source renders and native captures were actually opened. The hybrid floor is more readable than the rejected full-diffuse version, but the empty rear wall and wider district silhouette remain unfinished. Numerical source/texel checks do not override that visual finding.

## Routes and visitors

Each room has a 3 m gallery opening. The measured branch connects the existing `E{floor}_300` and `E{floor}_326` gallery nodes via `[96, floor, 310]` and the room destination `[102.1, floor, 310]`. No advanced resource is required. The separate graph adds six nodes/18 directed passages to the 157-node/335-edge parent. Parent evidence remains historical; it is not silently recertified.

The visitor variant copies the existing world-life adapter and changes its ambient-route loading and provenance diagnostics. A separate cartridge surface-normal adapter is also appended; its contact-conservation test is described below. Its builder verifies the inverse transformation back to the original source. The three old routes/eight existing visitors and the aircraft definitions remain unchanged. One new visitor per floor follows a dedicated offset lane (gallery X97, room-entry Z308.95, waiting point X103.15), pauses and returns. The player centreline is a reference, while the actual NPC offset requires its own runtime clearance and support evidence. The loader verifies the new route archive identity. Runtime support, swept clearance and yielding remain authoritative; a player graph is a placement prerequisite, not NPC acceptance by itself.

The first 180-second native test passed its support/destination checks but a later player screenshot exposed hero/visitor overlap. That initial candidate and evidence are archived. The revised offset lanes passed a fresh 180-second full-native support/destination/pause/yield run; all nine current player-route cases also pass the new 0.87m capsule-gap assertion. Actual corrected portrait, desktop and landscape room images were opened; the earlier foreground overlap is gone in those captures. The controlled hero obstruction then caused a wait and successful resumption. This test uses the full native simulation rather than advancing just the world-life adapter. It does not measure sustained real-time rendering performance, full NPC intelligence or final character art.


The first broad route run also exposed a genuine cartridge attachment failure. A repacked two-sided landing contains coplanar opposite-facing surface triangles; a raycast tie sometimes selected the inward face, placing the endpoint at X70.72 inside the landing instead of X69.28 outside. The source geometry and ordinary clearance were identical. The new adapter orients a returned normal against the incoming ray without changing contact, owner, cast reach or collision rules, and does not mutate the lower-level query cache. `V02_East_Public_Surface_Normals.json` compares 76 identical source rays before/after deferred adapter admission: 51 inward normals are corrected, with all contacts, owners and misses conserved. A focused repaired uninterrupted momentum route subsequently passed with both real rails/catches/Pops/landings in 74.15 simulation seconds and zero camera-problem samples. The subsequent full six-approach suite also passed without reusing older route results; the focused fixture alone does not establish that broader result.

## Reproduction

Run from the worktree with the existing server on port 8766. Source jobs use `/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --python-exit-code 1 --python <script>`.

1. `scripts/vertical-v02/blender_east_public_emissive.py`
2. `scripts/vertical-v02/validate_east_public_emissive_master.py`
3. `node scripts/vertical-v02/package_east_public_emissive.mjs`
4. `python3 scripts/vertical-v02/build_east_public_emissive.py`
5. `node scripts/vertical-v02/test_east_public_emissive.cjs`
6. `node scripts/vertical-v02/test_east_public_emissive_movement.cjs`
7. `python3 scripts/vertical-v02/admit_east_public_room_routes.py`
8. `python3 scripts/vertical-v02/validate_east_public_room_admission.py`
9. Blender `scripts/vertical-v02/render_east_public_emissive.py`
10. `python3 scripts/vertical-v02/build_east_public_room_life.py`
11. `node scripts/vertical-v02/test_east_public_room_life.cjs`
12. `python3 scripts/vertical-v02/run_east_public_room_life_checks.py`

The final runner performs browser jobs sequentially and binds candidate/source/test bytes. Its benchmark compares the frozen facade candidate against the visitor candidate at identical fixed 1280×800 lower-loop inputs for at least 60 simulation seconds each, recording CPU and GPU timing separately. Do not run other automated browser/render workloads during that benchmark. This bounded comparison still does not replace the required combined combat/replay/drone/destruction workload.

## Terminal comparison and visual review

The seven-job runner completed successfully on the exact d40e10c5 candidate. Fresh normal-input station times were 74.15 s (momentum, zero initial bank), 106.9167 s (mastery, zero), 73.5667 s (momentum, earned bank), 106.65 s (mastery, brake), 135.3333 s (public, zero) and 135.0833 s (public, earned bank). These preserve the original power limits.

The matched 60-second comparison used identical actor/camera positions and 640.6536 m of travel, with 29.5 seconds at high speed. Baseline → candidate frame p50/p95 were 15.9/25.0 → 9.0/18.0 ms; simulation CPU 8.9/17.2 → 8.5/16.6 ms; GPU 8.2024/12.0101 → 6.9224/10.6765 ms. Median draw calls were 411 → 407, p95 508 → 521. Dropped simulation time increased from 0.1729 to 0.3588 seconds. This single pair is a bounded measurement, not a causal optimization claim or combined release stress acceptance.

Actual current service victory, Echo contact, market extraction, pursuit victory, discovery return and benchmark end images were opened. The Echo frame keeps the hero visible; service and pursuit outcomes are readable. The market image still shows an inherited ambient civilian occluding the hero at extraction. New room visitors pass their separate capsule-gap checks, but that does not fix or certify every inherited civilian interaction. Simplified actor meshes, floor glare, broad overhead slabs and incomplete street architecture remain visible.
