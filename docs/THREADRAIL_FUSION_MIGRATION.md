# Backspool Threadrail fusion — migration inventory and pilot

This is an incremental development pilot, not completion of the supplied two briefs. Current playable Tripo/Afterstep build, V2 and historical V3 remain untouched. The new file is `SIGHTLINE_BACKSPOOL_THREADRAIL_FUSION_V3.html`.

## Source audit

Inspected the archive's runner traversal modules: ThreadrailSystem, AfterstepSystem, SnapbackSystem, RouteMemorySystem, RecoverySystem and AnchorData. Selected source copies are in output/legacy-threadrail/source. Legacy Threadrail construction uses quality-derived costs, corridor-specific selection and immediate logical route state; its scoring and effects must not replace the current checked physics. Snapback owns a separate positional bank and reach/redline rules; it is not Replay Route. These legacy modules are reference data, never executed or installed as dependencies.

Compared the current equipment adapter, rail solver, source-role bindings and V2/V3 notes. The current adapter creates anchors directly, validates owner/revision and cable clearance, constrains movement to a segment, and uses physical Drive impulses. Preserve those guarantees. Existing V3 denotes a previous delivery; this candidate uses the distinct Fusion filename to avoid overwriting it.

## Migration matrix

| Feature | Current foundation | This pilot / remaining work |
|---|---|---|
| Quick/precision anchors | Direct endpoints, quick catch | New timed two-shot quick deployment and sequential precision A/B; scene-surface ray impacts before activation. Precision rooftop flow tested. Quick airborne/moving chain remains unverified. |
| Throw motion | Grab/aim source roles available | Arms-only grab-source sampling leaves hips/legs to locomotion. 160 ms release and 280 ms separation authored, not recovered events. Needs full candidate pose review and hand-contact calibration. |
| Cable formation | Checked straight segment | Activates after second impact. Animated tension/stitch propagation pending. |
| Rail families | Inclines, slopes and shared junctions | Six-family classifier and behavioral tuning pending; no synthetic corner bends or floating anchors. |
| Construction/catch grades | Physical valid/invalid | Deterministic separate grade functions and HUD pending. Invalid segments must always fail. |
| Pop timing | Jump/slingshot | Endpoint/contact-based graded pop windows pending. No free acceleration multipliers. |
| Auto chaining | Validated proximity and tangent reach | Intent/quality/height scoring pending. Existing solver retained. |
| Surf stance | Slide-derived source loop | Retained, honestly labelled. Source search yielded 59 grab/bungy/slide candidates. No exact Glide surfing clip established. Banking/crouch/transition layers pending. |
| Afterstep | Five-slot real contacts, bounded impulses | Preserved, including approved cyan/violet shards and historical body snapshots. |
| Float/Flow | Existing checked traversal | Preserved; no generic animation replacements. |
| Snapback | Absent; separate Replay Route exists | Deferred until primary deployment/rail work passes; needs its own resource and swept-motion design. |
| Style / deliberate rail combat | Existing ordinary combat | Traversal score, purposeful kicks and grind strikes pending. No passive damage for spawning anchors. |
| Halo route memory | Existing Halo enemies | Pursuit-only adaptation pending. No free-roam route penalty introduced. |
| Mastery course | Existing three-obstacle vault lane | Retained; input-driven rail mastery curriculum pending. |

Do not port old coordinate/body offsets, unlimited tension pulls, gold flame/boot jets, world-Z-biased route selection, or scripted-showcase completion claims. Drone hooks/emergency rails remain deferred.

## Animation provenance

- Grab candidate `0x2811b550`, `pkr_mgc_grab_base_f000a`, retarget file `assets/backspool/source-movement/2811b550.json.gz`. Arms-only authored adaptation; source quaternion tracks sampled without modifying hips or limb lengths. Browser pose inspected; exact whip equivalence and original timing not established.
- Other grab candidates include `0x2811e61e`, `0x2811b551`, `0x2811e61b`, rally and short variants. Not yet gameplay-selected or visually certified. Full list in output/legacy-threadrail/motion-candidates.json, with source hashes and paths where supplied by the prior inventory.
- Rail base `0x2811926e`, `pkr000_mgc_move_slide_f000a_lp`, `assets/backspool/threadrail-grind.json.gz`. Existing authored sole-contact adaptation; not original Glide verification.
- Exit `0x28119e99`, `pkr000_mgc_gimmick_bungy_end_u000a`. Existing Zip-derived exit retained.
- No claim of recovering original controller, IK or animation graph.

## Pilot mechanics and limitations

Hold/release R or controller X to select precision A then B; tap uses quick two-shot mode. Source hand positions initialize cartridges. At 42 m/s they sweep scene collider boxes with a segment ray and require a real surface hit near the selected contact. This is currently a point-sweep projectile pilot; finite-radius contact refinement remains open. Invalidated owners, obstruction, expiry, pause, respawn and hero changes cancel deployment. Only two confirmed impacts allow the existing rail solver to create a cable. Existing movement still owns all player displacement.

Upper-body layer uses selected source arm quaternions only; mirrored second-arm authoring, exact release contact calibration, terrain-appropriate variants and bounded blending under all other animation owners remain acceptance work. This pilot must not replace the active release until the full brief passes.

## Validation and next gate

Unit checks cover release ordering, no early activation, two impacts, event deduplication, blocking, changed surfaces and cancellation. Browser pilot uses actual keyboard precision inputs on a real imported city rooftop; it checks no immediate rail, impact-driven A/B activation, pause cleanup and movement ownership. Screenshots inspected. Stock web-game client smoke also executed. These checks do not certify the full moving airborne double-throw chain, source fidelity, finite-radius sweep, surfing, all controls or sustained performance.

Next: contact-calibrate source candidates, capture moving/airborne quick throws and failures, finish finite-radius impact mapping, retain attached pending A presentation, animate tension, then implement rail families/grades and surfing before Snapback/AI/course expansion.

## V4 milestone — 2026-10-23
`SIGHTLINE_BACKSPOOL_THREADRAIL_FUSION_V4.html` is built separately using `scripts/build_threadrail_fusion_v4.py`, over the newer ground-textured Halo patrol build. V3 and historical releases are preserved.

Added `game_rail_mastery.js`: construction labels/scores, independently scored catches, five endpoint-time Pop grades (including reverse traversal), momentum retention penalties without grade-driven speed boosts, intent/velocity/height-aware reachable-rail scoring, monotonic mastery events and public diagnostics under `threadrailGame.state().mastery`. Classification is an initial geometry classifier, not six completed behavioral families: Corner-Wrap authoring and family-specific handling remain open. Vertical classification respects the existing 55-degree solver cap; it does not enable unconstrained vertical travel.

Cartridge deployment now includes a 180 ms tension stage after physical impacts. A forming filament is drawn in two-shot deployment; solver activation waits until this stage completes. Precision two-input pending-A presentation still needs refinement. Timings are authored adaptations, not recovered Forspoken events.

Validation passed: cartridge unit checks; 25 existing physical rail solver groups; mastery classification/catch/pop/reverse/selection/event tests; real-keyboard rooftop precision A/B browser test, delayed activation, pause cleanup, no movement ownership conflicts or page errors. Installed skill client smoke screenshot inspected. That smoke alone does not certify animation appearance or the complete airborne chain. The full requested brief remains open: source-motion calibration, surfing posture/transitions, six behavioral families, Snapback, style curriculum, rail combat, pursuit adaptation, and comprehensive ordinary-camera/controller/touch acceptance.

## V5 rail posture and transition milestone — 2026-10-23
Separate candidate `SIGHTLINE_BACKSPOOL_THREADRAIL_FUSION_V5.html`, reproducible with `scripts/build_threadrail_fusion_v5.py` (rebuilds the unchanged V4 dependency first). Original releases are retained.

Added `game_rail_surf_pose.js`: bounded, smoothed authored posture over recovered slide `0x2811926e`, including catch compression, directional/turn balance, speed-driven forward lean, high-speed crouch intent and upright braking. Spine/knee local rotations are small quaternion offsets; bone translations/scales are untouched. Previous offsets restore before animation evaluation and lifecycle cleanup, avoiding accumulated deformation. Existing sole-contact anchoring runs after pose application. This is a restrained adaptation, not a recovered original Glide clip, controller or IK implementation. A transfer restarts catch compression. Pop uses existing source-derived exit and ordinary airborne controller.

Braking uses a dedicated rail solver operation, removes up to 5 m/s per second without reversing velocity and preserves junction intent. It does not spend or manufacture a Drive impulse. Rearward stick / S requests braking; directional input still selects existing validated junctions. HUD exposes current posture phase; diagnostics under `threadrailGame.state().surf` expose provenance, smoothing and offsets.

Precision A now has a persistent visible device while awaiting B. Two-shot and precision B both show formation during the 180 ms tension stage. Invalid owners hide the pending presentation; pause/lifecycle cleanup removes all deployment meshes.

Validation: posture unit checks include catch, speed posture, lean bounds, brake, transfer, reset and 10,000-frame bounded offsets. Browser keyboard rooftop fixture verifies physical A/B, catch, S braking lowers speed, Space Pop, pose exit and pause cleanup, with no page errors or ownership conflicts. Fixture supplies starting velocity immediately before catch; it is not evidence of the entire sprint/airborne throwing chain. Desktop catch image reviewed; portrait/landscape captures saved. Installed skill client smoke run. Full high-speed ordinary-camera transitions, physical controller/touch play and sustained performance are still open acceptance checks. Snapback, rail combat, six specialized family behaviors, adaptive pursuits and mastery curriculum remain unfinished.

## V6 bounded Snapback milestone — 2026-10-23
New candidate `SIGHTLINE_BACKSPOOL_THREADRAIL_FUSION_V6.html`, builder `scripts/build_threadrail_fusion_v6.py`, pure controller `scripts/game_snapback.js`. Previous HTML builds remain intact.

Controls: U banks/releases a spatial reference; controller LB+Y and the Snapback button under Route & options invoke the same action. Controller and touch bindings are present but physical hardware playtesting is not certified. Bank lives 8 simulation seconds with 28 m maximum reach. Movement must build at least 2 m of separation. 86–96% reach is CLEAN; over 96% is REDLINE, other usable tension is DIRTY. A cyan line marks the spatial reference and turns red near the limit. Expiry, blocked line, excess reach, pause, hero changes, defeat/reset and replay interruption remove it safely; forced break does not apply an unswept impulse.

Release is distinct from Replay Route/Action Replay and cannot execute while rail/replay movement owns the actor. It consumes exactly one genuine unreserved Afterstep contact and base 12 strain through the existing transactional resource gate (existing perfect-beat discount retained). CLEAN uses the full proposed stored impulse, DIRTY 80%, REDLINE 60%; the shared normal release scale still applies. Tension reorients existing motion toward the reference, capped at 16 m/s. Final squared speed cannot exceed current squared speed plus the consumed contact's proposed squared impulse. This special kinetic check replaces the ordinary delta-magnitude check only for Snapback: no free energy is introduced by vector reversal. The candidate sweeps the proposed 120 ms travel before spending resources, then ordinary collision physics owns motion. No teleport or guaranteed arrival at the bank. Blocked/empty/ineligible release keeps the bank unless geometry/expiry invalidates it. Existing cyan exhaust/afterimages handle confirmed releases.

A browser failure exposed a landing-animation issue: locomotion continued physically while a complete 2.5 s landing clip remained selected, suppressing footplant banking. V6 permits input-driven locomotion after the 180 ms contact settle, without cancelling committed impact/landing states.

Checks: pure Snapback failure/lifecycle tests, unchanged rail physics, mastery, cartridge and surf suites; keyboard rooftop sequence with real footsteps banked, U bank/release, exact one-contact spending, strain, actual velocity reversal, rail catch/brake/Pop, pause cleanup and zero page errors. Desktop tension screenshot reviewed. Captured viewports do not certify touch/controller behavior, original animation fidelity, all six rail families, combat or full migration completion. Remaining major systems: specialized rail-family behavior, rail combat, pursuit route memory, mastery curriculum and full continuous airborne two-throw acceptance.
