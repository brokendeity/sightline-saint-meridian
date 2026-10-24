# Forspoken source cast → Threadrail cartridge

Playable candidate: `SIGHTLINE_BACKSPOOL_WHIP_THROW.html`. Build with `python3 scripts/build_threadrail_whip.py` from the unchanged `SIGHTLINE_BACKSPOOL_CARTRIDGE.html` rollback. Main game, older candidates, generated cartridge assets and GitHub snapshots are unchanged.

The previous adapter sampled only 340 ms of `pkr_mgc_grab_base_f000a`, affected eight arm bones, and released before its forward extension. This candidate uses the recovered **short grab/tether cast**, `pkr_mgc_grab_short_f000a` (`0x2811be99`), after comparing base, short, rally and bungy-begin poses. Raw source SHA-256: `faf0e98e4881a831276dfabb50a48f8799cbf800b4690d2a0f986964327d910b`; pack `asset/character/hu/hu000/anim/pack/mode/freerun/parkour/pkr000.pka`. Source identity comes from the recovered motion-name dictionary. Identifying this as the appropriate Zip-like Backspool cast is an adaptation; it is not certification of original Forspoken controller behavior or release events.

## Adaptation

- Source interval 0–0.54 s, 1.05× playback. Cartridge release at source 0.30 s (approximately 286 ms after cast begins). Smooth 75 ms entry and 140 ms exit. Quick pairs start their second cast 620 ms after the first.
- Spine, neck, head, shoulders, arms, wrists and fingers use source quaternion curves. A uses the right hand. B uses a documented, authored sagittal mirror: reflect model-space animated deltas, then reconstruct local rotations around the destination bind frames. Arbitrary local quaternion component flipping is not used.
- No source position, scale, leg or pelvis tracks are applied. Existing locomotion, gravity, jumping, cloth rig, floor support and movement ownership remain authoritative.
- Restore the layer before the next animation update, then evaluate the new cast after the base pose. The release-crossing frame samples the source release pose before projectile physics reads the actual palm. Previously projectile release ran before the animation pose.
- Cartridge flight, world sweeps, impacts, deployed fins/jaws, socket filament, rail tension and surf/Snapback behavior retain their existing systems. Releases are not instantaneous anchors.
- Pause, hero switch, reset, combat reaction, active attacks, preview and Retrace interrupt casts without delayed releases. Recovery continues after impact without leaving arm offsets behind.
- Existing bindings remain: R/ K and controller X tap for quick deployment, hold/release for precision; Threadrail on touch. The touch throw button now stays in Backspool’s visible combat control grid. Cancel/lost capture exits precision aim without throwing.
- Diagnostics: `threadrailGame.state().whipCast` includes readiness/error, source ID, active hand, source time, phase, weight and mirror status. Deployment events include throw and hand IDs. Missing source clips prevent starting a cast; no native/Mixamo substitute is selected.

## Files

`assets/backspool/threadrail-whip/manifest.json` retains source names, hashes, pack/dictionary evidence, authored timing and mirror provenance. `scripts/prepare_threadrail_whip.py` reproduces the retargets from the existing read-only recovery output in the parent project. Normal HTML rebuilds require only the included runtime assets.

## Evidence

- `scripts/test_whip_deployment.cjs`: marker boundaries, two-hand ordering, swept impacts, tension deduplication, cancellation, invalidated/blocked surfaces.
- `scripts/test_threadrail_whip_pose.cjs`: 90 sampled poses over both hands; finite unit rotations, unchanged limb offsets/scales, unchanged lower-body contact transforms and exact restoration between frames. This numeric check is not a claim of matched original-game visual fidelity.
- `scripts/test_threadrail_whip_browser.cjs`: actual keyboard precision A/B on physical walls, no instant rail, held model, source 0.30 s release, release position matching this frame’s evaluated palm, mirrored B, tension, recovery, pause and hero switching. No page or console errors.
- `scripts/test_threadrail_whip_inputs.cjs`: actual-keyboard quick pairs, moving cast, jump during cast, simulated controller X, Chromium touch pointer flow and cancellation. Desktop, portrait and landscape screenshots in `output/whip-throw/`.
- Retained Threadrail 25 solver groups, rail mastery, surf posture and Snapback unit suites pass. Installed develop-web-game client ran against the new candidate; screenshots inspected.

Physical controller/iPhone hardware playtesting and exact original-game motion/controller comparison remain unverified. This change adds a source-derived throwing animation, not the entire Forspoken whip power or original IK system. Existing broader Fusion follow-ups remain in their own migration notes.

## Held and surface visibility repair

Holding R/controller X now creates the actual cartridge on the active palm immediately, before deployment exists. A is held on the right; after A attaches, B is held on the left. The corresponding belt slot shows its empty clip. Releasing transfers the visible item to the cast/projectile without duplicate hand models. Busy casts cannot start an overlapping aim session; asset loading is explicit.

The earlier provisional cuff-scan animation is replaced during precision aiming by the source cast’s upper-body pose at source0.15s, blended over100ms. The base leg/ground animation remains authoritative. This is an authored hold of the recovered clip, not an invented full-body substitute.

Mounted bodies sit16mm out along the real hit normal (previously10mm), keeping the housing out of the wall/floor. Held cores use1.6 emissive intensity and attached cores2.4. A thin blue housing-edge light and a small depth-tested radial blue spill make the physical device readable at gameplay distances. The original8cm folded size, model, textures, collision contact and ThreadExit alignment remain intact; neither body nor glow renders through walls.

Reproduced the missing aim model before fixing it: held aim contained only two belt instances. `scripts/test_threadrail_cartridge_visibility.cjs` now verifies long-held A/B palms, empty carry clips, cast handoff, persistent wall and floor models, normals/surface clearance, blue cores/spill and pause cleanup; screenshots are in `output/whip-visibility/`. Simulated controller checks explicitly assert a held model before X release. Pose checks additionally cover10 long/short held-pose samples with unchanged lower-body transforms and clean restoration. Original v1 HTML and builder are retained in `output/whip-visibility/`; the separate cartridge baseline stays unchanged.

The floor check also reproduced an older targeting/collision omission: the advanced tether finder searched collider boxes, while the plaza and ground are separate meshes. Equipment aiming and projectile sweeps now additionally raycast the real ground, plaza and road/sidewalk support meshes, choosing the nearest surface. Quick placement takes its local floor contact from that same geometry rather than an inferred ground plane. This prevents a cartridge from aiming beneath the plaza or treating a visible floor as an empty target. These changes are confined to Threadrail equipment; character traversal physics are unchanged.
