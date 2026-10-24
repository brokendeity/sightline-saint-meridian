# Threadrail cartridge — Tripo production

## Preflight record (historical; completed delivery below)

User master sheet saved unchanged under assets/backspool/threadrail-cartridge/references/master-sheet.png. Cleaned folded hero prepared using built-in image generation, not a 3D asset, and saved as folded-hero-v1.png. Do not submit the annotated sheet as the model-generation input.

Tripo CLI 0.7.2 installed under the explicit brief; doctor found no API login. Existing Studio session is authenticated, balance 865, H3.1 textured generation displayed at 55 credits. CLI dry-run validated alias tripo-v3.1 → v3.1-20260211, texture/PBR true, face_limit15000, one image-to-model call and no chained paid steps. Studio settings/cost are authoritative for the browser workflow; CLI defaults must not be represented as Studio settings. Requested approval for up to65 credits: estimated10 multiview + displayed55 model, with no paid retries/refinements. No Tripo model generated yet.

## Asset contract

Preserve raw source export and task metadata. Working/runtime target 0.08m folded diameter and 0.02m thickness, local +Y face/spin axis, +Z throw direction. Normalize only after examining actual mesh bounds and orientation. Shared A/B geometry; red A and blue B markers. ThreadExit and DockingMount are named attachment transforms. Split or locally reconstruct mechanical jaws/fins with actual pivots; never deform a fused mesh and claim it unfolded. Preserve source fidelity and document authored replacement parts.

States: folded/carry retracts moving parts; flight spins folded body with brighter core; impact stops translation, aligns face opposite the supporting normal and deploys jaws/fins. Filament starts at transformed ThreadExit sockets. Belt mounts must avoid the lower-back twin Drive. New candidate replaces visual devices only after loading/validation; retain physical projectile, owner/revision checks, tension delay, movement coordinator and rail solver.

Deliverables still pending: actual Tripo master GLB, optimized 5–15k-triangle GLB, editable Blender source, texture files, state/animation configuration, inspection viewer, actual gameplay integration and required screenshot/test evidence. Neither cleaned image nor current procedural cartridges count as model completion.

## Completed asset candidate
Tripo task `b71871c5-e9e6-4e89-b6f7-723182ab3c8e` completed, raw GLB preserved byte-for-byte at source/model.glb (7,574 triangles). Multiview task `e5892154-34e9-4cef-b6fb-e8231ec0aae0` produced four saved reference JPEGs. Studio generation price was 55; balance went from865 to810. Multiview/export showed no balance change. Total observed spend55 (below approved65), no retries or paid refinements. Studio did not expose the seed or billing API record; do not invent either.

Prepared outputs: backspool_threadrail_cartridge_master.glb (original texture resolution plus authored mechanics); backspool_threadrail_cartridge_game.glb (1K embedded maps); backspool_threadrail_cartridge_source.blend (packed textures, local deployment keyframes, inspection scene); textures/; states.json; manifest.json. Original Tripo geometry was aligned using its least-variance disc normal and normalized in meters. Disc diameter~8cm, casing thickness~2.2cm; the detachable belt-clip envelope adds a few millimeters. Exported label/material variants share the same geometry for A/B. The optimized model is around9.5k triangles; exact current hashes/counts are in manifest.json.

Source body/core/UVs are generated. Four sliding fins, four hinged jaws, A/B labels, lower housing repair, belt clip and named sockets are local authored geometry. The lower plate repairs an irregular inferred underside. The emissive mask derives from the source albedo's cyan regions. These additions are not falsely labelled as separate original Tripo parts. Fine plate detail and fins/jaws approximate the master sheet; this is not an exact CAD reconstruction.

## Integration
`SIGHTLINE_BACKSPOOL_CARTRIDGE.html` is a new candidate derived from Fusion V6. Build with `python3 scripts/build_threadrail_cartridge.py`; older builds and GitHub snapshots are untouched. Runtime implementation is scripts/game_threadrail_cartridge_visuals.js. The inspector is THREADRAIL_CARTRIDGE_VIEWER.html (same GLB/runtime loader; not gameplay evidence).

Temporary octahedra/cylinders are hidden and real shared-geometry GLBs render on the belt, at the palm, in flight and on attached surfaces. Detachable clips stay on the belt during throws. Palm placement uses the hand/finger plane and is shared by the visual and physical release origin. The existing grab-derived upper-body gesture and authored160ms release/280ms separation are preserved; this does not certify exact original whip/finger-grip fidelity. Physical point-sweep projectiles, owner/revision checks, collision-clearance rail solver, timing, movement coordination and resources are retained.

Attachment uses the surface normal; independent jaws/fins deploy; actual ThreadExit transforms feed the filament. Short visible connector leads join sockets to the established clearance-offset ride segment, preserving the safe existing player path. Filament is not claimed to be a new unconstrained cable physics solver. Folded components are culled and deployment detail is culled beyond12m. Cloned per-instance identifier/core materials dispose on removal; geometry and textures remain shared. Fade/LOD and shader fidelity can be refined further without rewriting mechanics.

`window.threadrailCartridgeState()` exposes load errors, bounds, instance states, deployment, orientation and socket positions. Loading failure reports an error; it does not silently substitute a procedural model.

## Validation and evidence
- scripts/test_threadrail_cartridge_asset.cjs: GLB loads, meter bounds, top/bottom/side/hero, fold/flight/deploy, A/B identifiers.
- scripts/test_threadrail_cartridge_browser.cjs: actual-keyboard A/B surface throws, real GLB held before release and in flight, two anchored variants, socket filament start, rail catch/brake/Pop, real-footstep Snapback, pause cleanup, no page errors. Initial failed close-up was occluded; palm offset/camera were corrected and recaptured.
- scripts/test_threadrail_cartridge_wall.cjs: actual-keyboard throws to a real course wall collider, surface-normal orientation, fully deployed parts, paired rail, 30s expiry, hero-switch cleanup. Fixtures place the player/camera; they do not fabricate successful impacts. Expiry testing caught a stale last-shot model and it was fixed.
- scripts/test_threadrail_cartridge_cost.cjs: identical static city view; initial result +13 calls with the pair carried, render CPU median2.7ms for both builds. Final cost-report.json supersedes that initial figure after detachable clip addition. These short render-CPU/RAF measurements are not full traversal/GPU performance certification.
- Installed web-game skill client smoke run; screenshots/logs in output/threadrail-cartridge. Physical controller/touch play and the broader complete Threadrail fusion acceptance remain open.

## Editing
Open the packed .blend to adjust authored parts, pivots, materials and source geometry. It contains the folded frame1 and deployed frame24 configurations. The prepare script reconstructs the asset from immutable Tripo source; rerunning it replaces local authored edits, so preserve edits as a versioned Blender file first. Export meter-scale +Y-up GLB with the named sockets/parts and extras retained. `deployOffset` extras define radial fin travel; runtime code controls hinge angle, spin, emissive intensity and distance culling. states.json documents those transforms; it is not a live hot-reload configuration. Change runtime parameters in game_threadrail_cartridge_visuals.js, rebuild candidate, and rerun tests. Do not scale the runtime root alone without recalibrating palm/belt offsets, sockets and inspection bounds.

To view standalone, serve the repository/package root with `python3 -m http.server 8877`, then open http://127.0.0.1:8877/THREADRAIL_CARTRIDGE_VIEWER.html. Direct file URLs can block GLB fetches.

Final static-view result after hiding underside-only belt trim and avoiding redundant matrix/diagnostic work: +11 draw calls; median render CPU2.6→2.7ms (+3.8%), RAF median unchanged8.3ms. See cost-report.json. This remains a short CPU/static-view comparison, not a full GPU/traversal certification.
