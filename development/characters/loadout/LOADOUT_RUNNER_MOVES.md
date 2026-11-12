# Loadout's moves from the Runner Action Animation Pack

**Build:** `SIGHTLINE_SAINT_MERIDIAN_V02_LOADOUT_RUNNER.html`. It is a new file built from the Loadout hero candidate by `scripts/vertical-v02/build_loadout_runner_candidate.py`. The builder applies two inverse-verified hooks:
- the Runner-moves module's script tag;
- cape cloth v2 in place of v1 (see below).

The record is `development/vertical-city-v02/V02_Loadout_Runner_Build.json`. No earlier build or shared module was edited. `SIGHTLINE_SAINT_MERIDIAN_V02_LOADOUT.html` still has Loadout on Backspool's clips, for comparison.

## What changed

Loadout plays 49 of the 484 in-place clips in the Runner Action Animation Pack v1.7.2, the licensed pack used in the Unity Backspool prototype (`/Users/richardmpayi/Documents/sandbox`). Seven of them are also used mirrored, giving 56 converted clips. They cover:
- 39 movement roles;
- 6 locomotion loops;
- all 40 combat strikes;
- the hit reaction in each of the three styles.

Gameplay timing, hit windows, speeds and physics are unchanged; only the motion that presents them is new. Backspool and Sightline are untouched.

| Loadout role | Runner clip |
|---|---|
| Idle (both idle roles) | `Idle_Wait_A`, `_B` and `_C` back to back, blended 0.3 s at each seam (they stand at different angles) |
| Walk, jog, run, sprint | `Mvm_Walk`, `Mvm_Jog`, `Mvm_Dash`, `Mvm_Boost` |
| Start, 180° start, stops | `Mvm_Jog_Start_Fwd`, `Mvm_Jog_Start_L180`; `Mvm_JogStop`, `Mvm_BoostEnd`, `Mvm_WalkStop` |
| 180° turns while running | `Mvm_Jog_TurnL_180_Left`, `Mvm_Boost_TurnL_180_Left` (rebased to end facing the new heading) |
| Jump, running jump, fall, Flow lift | `Jmp_Base_A`, `Jmp_FrontAir_A`, `Jump_Down_A_Loop`, `Jmp_Base_B` |
| Landings | `Land_Base_Wait`, `Land_Base_Move`; fast moving `Land_Stumble_Move`; heavy and hard `Land_Spawn_Wait` |
| Flow ground roll, by stick direction | forward `Land_Roll_Move`, left `Esc_Roll_Left`, right `Esc_Roll_Right`, back `Esc_Roll_Back` |
| Aerial and evade rolls | `Esc_Roll_Front`, `_Left`, `_Right`, `_Back` |
| Standing evade (backstep) | `Esc_BoostDash_Back` |
| Flips | front `Jmp_FrontAir_Roll_All`, back `Jmp_BackAir_Roll_All`, side left `Jmp_SideAir_A`, side right its mirror, twist `Jmp_SideAir_B`, tree rebound `Wall_Jump_Turn_Air_R` |
| Slide | `Esc_Slide_All` |
| Wall run, by wall side | wall on his left `LoWall_LDash_Loop`, on his right `LoWall_RDash_Loop` |
| Wall climb, boost, kick, flip | `Wall_Vertical_Dash_Loop`, `Wall_Vertical_Boost`, `Wall_Jump_Turn_Air_L`, `Wall_Jump_Cross_Air_L` |
| Hit reaction (all styles) | `Dam_Stand_Stumble`, 0.1–0.9 s |
| All RT, heavy, launcher, counter and air strikes in the three styles | `Attack_Hand_1R`, `_2L`, `_PwR`, `Attack_Kick_A/B/C`, `JAttack_AirFront`, `JAttack_AirDrop_All`, plus mirrored versions |

The mapping is data, in `assets/loadout/runner/loadout_runner_roles.json`, so clips can be swapped without code changes.

**Kept on Backspool's retargeted clips:** vaults, mantles, ledges, ladders, crouch, swimming, `landBack`, guard and fight stance. They carry hand and foot contact data calibrated to those clips, or the pack has no equivalent. The pack's "ready" pose is a running pose, not a stance. The Afterstep and Threadrail power roles also stay; Loadout can't use them anyway.

## Pack clips not used yet: these need new game mechanics

These families have no hook in Loadout's current controller. Adding any of them is a design change, so none were added without your say:
- **8-way strafing:** 8-way walk, jog, dash and boost loops and their 8-way starts and stops. The game turns him to face his movement and has no lock-on strafing.
- **Turns:** idle turns on the spot, walking 180° turns, and 90°/180° arc turns.
- **Dashes:** power dash, charge dash, charge boost and 8-way boost dashes on the ground and in the air. Loadout has no dash ability (that's Backspool's Afterstep).
- **Tumbling:** handsprings, round-offs, and the rack-spring kip-up.
- **Wall moves:** high-wall runs, wall hold, fall and land, side-up boot dashes, the full wall-jump cross and turn sets, and wall-climb enter, exit and hold.
- **Jumps:** side jumps, back air jumps, roll jumps, and air-roll loops.
- **Damage and death:** flying, jumping, standing and sliding deaths, the stand-up, and turn stumbles.
- **Weapon attacks:** the 17 weapon clips (`Wp*`), which need a weapon.

## How it works

**Conversion (offline).** `scripts/characters/loadout/convert_runner_clips.cjs` loads each needed clip straight from the Unity project with the game's own r128 FBX loader in headless Chromium. It retargets each clip onto Loadout's skeleton with `scripts/game_humanoid_retarget.js`, then writes `assets/loadout/runner/loadout_runner_clips.json.gz` (3.1 MB). The raw pack is not copied into the repo. The retarget:
- **Bone names:** maps the pack's UE-style bone names to Mixamo names.
- **Rest pose:** aligns the rest poses by bone direction.
- **Clip data:** keeps clips in place.
- **Hips:** caps hip rise at 4 cm. The in-place clips keep jump height in the pelvis, which would otherwise add to the game's physics jump.
- **Mirroring:** can mirror left to right. This gives right-foot kicks, opposite-hand punches and the right side flip.
- **Turns (`faceEnd`):** can rebase a turn so it ends facing forward, because the game snaps his yaw to the new heading when a turn starts.

The converter also measures:
- **Speed:** each clip's natural speed, taken from its `_Root` twin. For example, `Mvm_Dash` runs at 8.15 m/s against the game's 8.2 m/s run reference.
- **Strike frame:** each attack's strike frame and limb.

The report is `development/characters/loadout/runner/conversion.json`. Setting `RUNNER_ROLES`, `RUNNER_OUT` and `RUNNER_REPORT` redirects a trial conversion, for example to review candidate clips.

**Runtime (`scripts/game_v02_loadout_runner_moves.js`).** It wraps `loadoutHero.buildBank`, so only Loadout's own bank changes:
- **Flow roles:** Loadout gets copies of the flow roles. Each copy's playback rate fits the Runner clip into the original role's gameplay duration; loops keep their natural rate.
- **Role lookup:** while Loadout is the hero, `window.backspoolFlowRoles` and `window.backspoolLocomotionRoles` answer with his copies. For Backspool they answer exactly as before.
- **Direction-aware roles:** the Flow ground roll and the wall run pick their clip each time they start, after 0.2 s of game time unused. The roll follows the stick relative to his facing; the wall run follows the side the wall is on.
- **Locomotion:** loops are time-scaled to the game's reference speeds.
- **Combat:** each combat clip in Loadout's bank becomes a window of a Runner attack. The attack strikes with the move's own socket and is trimmed so the strike frame lands on the move's contact time. It lands exactly for 36 of the 40 moves. Four land later, as close as their clips allow:
  - `flow-heavy`: 43% of the move instead of 38%.
  - `flow-launcher`: 40% instead of 35%.
  - `impact-launcher`: 35% instead of 29%.
  - `impact-air-finisher`: 58% instead of 46%.
- **Hit reaction:** the reaction clips are trimmed windows of the Runner stumble.

**Cape cloth v2 (`scripts/game_loadout_cape_cloth_v2.js`).** It is a copy of v1, which earlier evidence pins and which stays unchanged, with one change. The final pass alternates the backstop and the body push and always ends on the body push. With v1, curled Runner rolls left points up to 3 cm inside his body, because the backstop plane can cut through a limb. With v2 the worst case is 0.29 cm.

## Evidence

**`scripts/characters/loadout/test_loadout_runner_real_input.cjs`.**
- **Inputs:** the Hero-tab menu, the keyboard (W, A, S, D, Shift sprint/Flow toggle, Space, C), and a virtual standard pad (RT, R3, D-pad up) read by the game's own polling.
- **Labelled setup:**
  - frames are stepped and drawn, so the cape runs;
  - a plaza reset before each block;
  - the QA wall slab and respawn placement of `test_friendly_wall_contacts.cjs`;
  - the practice-target button and the style menu;
  - practice targets hold their shots during chains, then are allowed one shot to provoke a hit reaction.
- **Result:** all 40 checks PASS (`evidence/runner/`).

The checks cover:
- **Movement:** blended idle variants, jog start, run loop, sprint, stop, and a 180° turn (Runner turn clip). He covers 13.8 m.
- **Air:** running jump and air, landing, and side flips left (`Jmp_SideAir_A`) and right (mirror).
- **Evades:** the moving evade roll, the neutral standing evade (back dash), and the stick-left evade from standing (`Esc_Roll_Left`).
- **Walls:** a wall run with the wall on his left (left-wall clip only), a wall run with the wall on his right (right-wall clip only), the wall climb and the wall boost.
- **Hit reaction:** the Runner stumble.
- **Combat:** in flow, impact and counter, R3 locks a target and the 8-hit RT chain plays in order. Every strike is a Runner clip, all 8 hits connect, and the D-pad-up heavy connects.
- **Cape:** finite and outside the body across 2,143 frames; worst penetration 0.29 cm, against a 2 cm limit.
- **Control:** Backspool, switched back through the Hero tab, still plays his own flow, locomotion and strike clips, with no Runner clip in his bank.
- **Errors:** no page errors.

**Regressions:** the full V02 set was run against the final build, muted and with one browser at a time (`development/vertical-city-v02/evidence/loadout-runner-checks/` and the `loadout-runner-*` folders). All 16 steps PASS:
- **Traversal:** friendly wall contacts, landing and roll flows, three city loops, and three station approaches.
- **Gameplay:** the 12 retained encounter, replay and discovery cases.
- **Backspool movement:** strides, graded vaults and climbs, air take-offs, and crouch.
- **Combat:** 8-hit combat, Sightline melee, burst rhythm, and themed slots.
- **Build features:** impact FX, no halo trucks, and the menu.

These cover Backspool and Sightline in the new build. None of them plays as Loadout.

## Not done / NOT TESTED / observations

- **NOT TESTED as Loadout:**
  - vaults, mantles, slides, ladders, swimming and crouch;
  - heavy and hard landings from a real height;
  - back, twist and tree flips;
  - the wall kick and wall flip;
  - missions.
- **Wall-run evidence:** the QA wall is the wall suite's test slab, not a city façade.
- **Running attacks:** the pack's punches and kicks are running attacks, so the legs show a run stride while the game holds him still for ground strikes. Trimming hides most of it.
- **Idle stance:** the Runner idles stand turned 35–60° from his facing. That is the pack's own stance.
- **Cape stretch:** the cape's worst bone-to-cloth gap reaches about 13–16 cm in flips, kicks and rolls, against 1.8 cm in the standalone run, sprint and turn tests. It stays outside the body, but it can look stretched at peak frames. No limit checks it yet.
- **Afterstep shards:** in this build, cyan and violet glass shards (Backspool's Afterstep look) still appear when Loadout sprints, flips and rolls. This comes from the earlier Loadout build. Fixed in `SIGHTLINE_SAINT_MERIDIAN_V02_LOADOUT_RUNNER_NO_AFTERSTEP.html` (see below).
- **Look:** judged from headless screenshots and contact sheets. You have not reviewed it in motion yet.
- **Licence:** this is a Unity Asset Store pack. Its converted clip data ships inside the game, which the Asset Store licence is generally meant to allow. Do not publish the converted clip file on its own, and keep the repo private. This is not legal advice.

## Follow-up build: no Afterstep VFX on Loadout

**Build:** `SIGHTLINE_SAINT_MERIDIAN_V02_LOADOUT_RUNNER_NO_AFTERSTEP.html`, made from the Runner build by `scripts/vertical-v02/build_loadout_runner_no_afterstep_candidate.py` (record `development/vertical-city-v02/V02_Loadout_Runner_No_Afterstep_Build.json`). The Runner build is unchanged.

**Cause:** the Afterstep exhaust (the glass shards) and the movement afterimages already switch off for any hero but Backspool. The game's per-frame update always told them the hero was `'backspool'`, so Loadout, who runs on Backspool's controller, showed both. Two inverse-verified hooks pass the real hero instead.

**Evidence:** `scripts/characters/loadout/test_loadout_no_afterstep_real_input.cjs`, 6/6 PASS (`evidence/no-afterstep/`).
- **Loadout:** across 270 frames of sprint (16.4 m/s), roll and side flip, the exhaust is disabled every frame, emits nothing, has no live particles and no draw calls, and the afterimages are never drawn.
- **Backspool (control):** the same inputs emit 314 shards and draw afterimages on 249 frames.
- **Not re-run:** the full V02 regression set on this build.
