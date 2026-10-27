# Original-owner façade refinement

The complete-game candidate is `SIGHTLINE_SAINT_MERIDIAN_V02_FACADE_ARCHITECTURE.html`, derived from the current city-view build. The previous eleven protected HTML entries, original 310 building meshes/colliders, accepted public routes and coffered architecture remain unchanged. Only the copied appearance module’s payload URL differs; its source ownership, destruction cleanup and ceiling-fill shader behavior are retained exactly.

## Authored geometry

The new saved master is `blender/SaintMeridian_V02_Facade_Architecture.blend`. It forks the city-view master and replaces only three existing decorative façade meshes, on building-141, building-160 and building-162. All 40,496 existing object transforms and custom properties remain unchanged; the other 40,493 source objects retain their mesh data and material bindings. The two matched cameras remain in this master.

The 4,215 source-supported window locations retain their occupancy/color selections. Their flat frames become closed chamfered frames with recessed glazing and a central mullion. Added trim comprises 311 vertical seams and 256 floor fascias. Dense source rays at intervals no greater than 1.8m check the original surface, material and compound collision support. Candidates crossing source edges, openings, original bright details, current window envelopes or V02 structures are excluded.

All attachments remain within an 8.5cm source-backed shallow envelope. These are decorative architectural groupings, **not** new rooms, balconies or walking routes. They do not justify widening any movement, camera or cartridge constraint. Wider inhabited balconies, structural-mass refinement and reference-quality skyline silhouettes remain unfinished work.

The three façade exports total 441,912 triangles, an increase of 37,272 over the prior fittings. They reuse the original materials and add two shared materials for dark metal and thin cyan seams. No dynamic lights, global exposure or bloom changes are introduced. glTF Transform performs accessor/texture deduplication and pruning with exact decoded vertex/normal/material/index equivalence. Independent shipping-vertex envelope ownership and Khronos validation pass for all three chunks, with no errors or warnings. Geometry counts and packaging size do not establish acceptable performance.

## Actual browser and Blender evidence

`evidence/facade-architecture/before-A.png`, `after-A.png`, `before-B.png` and `after-B.png` are actual renderer captures of the prior/current complete game at the same camera contract and paused world clock. The C pair is a labelled camera-only close inspection of one source-backed window, without moving the player.

`blender-A.png` and `blender-B.png` are actual saved-master Cycles renders, using the same bookmarks at 16 samples. Landmark projection agreement remains below 0.004 pixels. This establishes camera agreement, not reference-art fidelity. Native before/after, Blender, portrait and landscape images were opened and reviewed. The seams/groupings are visible, but repeated tower masses, the central support/roof mass, missing inhabited balcony depth and the difference between native and Blender material response keep full visual acceptance open.

Native loading preserves all original building geometry/transforms/compound colliders, V02 records, ground roads, light count and paused train/world-life clocks. A labelled direct native breach fixture removes the actual new trim vertices when their source support disappears. Native building collapse hides all of that owner’s attached fittings. These API fixtures do not certify legal player impact input. Fifteen retained HUD/input groups pass on the combined candidate, covering keyboard, simulated controller and browser touch emulation. Physical-device checks remain open.

The initial native harness froze RAF before the later view adapter could bootstrap, then waited for bootstrap without rendering. That timeout and its actual screenshot are retained as `initial-view-bootstrap-failure.json.gz` and `initial-view-bootstrap-failure.png`. The harness now explicitly renders once after the deferred scripts load; no runtime workaround was introduced.

The installed Develop Web Game client ran unchanged through the committed Metal launcher. Its supported KeyA performs a short movement smoke; the tool does not support an arbitrary W action name. The resulting actual PNG/state are in `evidence/stock-facade-architecture`. This is not sustained performance or route evidence.

## Reproduction

From the repository root, with the game server on 8766:

```sh
node scripts/vertical-v02/plan_facade_architecture.cjs
/Applications/Blender.app/Contents/MacOS/Blender --background --python-exit-code 1 --python scripts/vertical-v02/blender_facade_architecture.py
node scripts/vertical-v02/package_facade_architecture.mjs
node scripts/vertical-v02/validate_facade_architecture.cjs
python3 scripts/vertical-v02/build_facade_architecture.py
node scripts/vertical-v02/test_facade_architecture.cjs
/Applications/Blender.app/Contents/MacOS/Blender --background --python-exit-code 1 --python scripts/vertical-v02/render_facade_architecture.py
V02_HUD_ENTRY=SIGHTLINE_SAINT_MERIDIAN_V02_FACADE_ARCHITECTURE.html V02_HUD_RUN=facade-architecture-hud V02_HUD_REPORT=V02_Facade_Architecture_HUD.json node scripts/vertical-v02/test_hud_candidate.cjs
python3 scripts/vertical-v02/write_facade_architecture_evidence.py
```

`V02_Facade_Architecture_Evidence.json` binds current source, exports, saved master, before/after captures and tests. Full V02 remains active and incomplete. The remaining architectural/visual work, nine advanced route timings, full retained gameplay/failure suite, physical-device playtests and matched 60-second active performance recordings are still required. The generated HTML preserves the source’s existing trailing space on line 73 for its byte-exact inverse check.
