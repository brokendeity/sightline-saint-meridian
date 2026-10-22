# Backspool — Forspoken landing and roll update (v15)

21 October 2026. Isolated candidate: `SIGHTLINE_BACKSPOOL_TRAVERSAL_CANDIDATE.html?v=landing-roll-v15`.

## Result

Fifteen source-only motion roles are admitted through `traversal-landing-roll-roles-v15.json`. This replaces the provisional side-flip landing clips with the recovered directional acrobatic motions, adds left/right/back aerial rolls, and supplies standing, running, backward and heavy landing poses. Native Backspool traversal fallbacks were not introduced. Source labels and hashes remain attached to every admitted motion.

Directional movement plus C / X in free exploration now performs a supported ground tumble. It does not launch the actor into an aerial roll. Contact follows the deformed body while tumbling, then returns to sole contact. Motion completes its recovery instead of being cut at 400 ms. Attacking can cancel recovery after 400 ms; a short contact handoff prevents the first punch blend from putting the body through the floor. Stationary evasions and target-based combat retain the existing defensive dodge behavior. The dedicated touch Roll / Warp control also accepts the ground tumble.

Flips finish with an explicit landing recovery selected from movement intent and impact speed. Running landings preserve physical momentum. Standing landings finish their source segment instead of ending after a fixed 350 ms. The final 220 ms of a supported descent prepares visual contact; physical movement and collision remain authoritative. Airborne rolling closes at actual touchdown and transitions to a supported recovery.

## Reproduced faults and repairs

- The former grounded Flow roll became `aerialRoll`, reaching approximately 1.15 m actor height from a 0.42 m starting point. The new grounded action keeps supported actor height throughout.
- Left/right flip roles previously used `pkr000_ntl_land_hgt4_*` clips. They now use the recovered `pkr_mgc_act_cancel_base_l000a` / `r000a` motions. Backflip uses its corresponding backward acrobatic motion. The mirrored-climb twist segment now includes its upright exit.
- At touchdown, visual foot anchoring produced an abrupt root correction. Preparing contact before impact reduced tested hip displacement at the exact airborne/ground boundary to 2–8 cm for flips and 11–16 cm for directional aerial rolls. These are per-frame pose changes, including natural movement, not measured original-game fidelity.
- Backward roll landing blending exposed a torso penetration when only feet were constrained. A temporary body-contact envelope now spans touchdown and the blend.
- Automatic obstacle starts can produce an action before its first movement sample. A null-safe role lookup fixes that first-frame error.

## Validation

- 119 retained combat, defense, replay, lesson and controller assertions pass without changing their assertions.
- New keyboard input flows cover four directional flips, full standing recovery, supported ground tumble, three aerial roll directions, actual touchdown, and roll-to-strike cancellation. Touchdown pose changes must remain within 22 cm per frame in these scenarios. No page errors.
- Five new roll-physics checks cover supported height, defensive windows, replay interruption, unsupported drops, obstruction sweeps and directional air state.
- Three source-admission tests check all fifteen identities/hashes, bounded segments/rates, normalized rotations, fixed limb offsets and unit scale. Ten existing Flow-controller checks also pass.
- Existing mobility scenarios pass: walk/run/sprint, automatic vault, automatic obstacle flip, rooftop gap landing, higher obstacle climb and low-ceiling rejection.
- Full advanced traversal loop and existing integrated Flow input scenarios pass, including wall boosts, tether slow aiming, water double jump, hero switching and pause cleanup.
- Supplied web-game client completed two capture iterations; its gameplay screenshot was visually inspected. Dedicated desktop, portrait and landscape captures were inspected too. Resize captures wait for the resize event before rendering.
- Roll-to-strike blend's sampled skin minimum is approximately 0.399 m against the plaza's 0.4 m visual surface. Ground tumble samples remain within roughly 2.3 cm of that surface. These are sampled geometry checks, not exhaustive mesh/terrain proofs.

Evidence and captures: `output/backspool-traversal/landing-roll-v15/`.

## Scope and limits

Transitions, source segment selection, collision travel and the visual contact adaptation are authored for Backspool. The ground tumble uses the recovered forward landing-tumble motion; this is an explicit gameplay assignment. This update does not establish the exact original Forspoken controller or complete original IK. Those evidence flags remain false. No new matched-original-footage certification, sustained performance benchmark, physical controller test or touchscreen hardware test is claimed.

The main game remains byte-identical. GitHub snapshots, the Naruto cinematic library, Blender and Unity were not changed. A rollback of the candidate and affected preexisting source files is stored in `rollback/landing-roll-v15/`. Rebuild through `python3 scripts/build_backspool_traversal_candidate.py`.
