# Loadout: the full Runner Action Animation Pack (872 clips)

**Build:** `SIGHTLINE_SAINT_MERIDIAN_V02_LOADOUT_RUNNER_FULL.html`, made from the canonical source (`src/v02/`) with `scripts/build_v02.py` (record `development/vertical-city-v02/V02_Loadout_Runner_Full_Build.json`). No older build, module or record was edited. The project rule in `CLAUDE.md` is "do not write new patchers", so this build comes from the build tool, not from a patcher.

It builds on `…V02_LOADOUT_RUNNER.html` (see `LOADOUT_RUNNER_MOVES.md`). That 56-clip role mapping stays in place underneath.

## What the pack really contains

Counted from `Runner Action Animation Pack v1.7.2.unitypackage` (1,721 assets):
- **874 FBX files:** 872 animation clips plus 2 models (`ClazyRunner`, `ClazyWeapon`).
- **Clips:**
  - **484 in-place clips.**
  - **388 `_Root` clips.**
    - 366 are root twins of an in-place clip.
    - 22 exist only as root clips: the dodge/move/roll/slide `_Fwd` variants, the wall `*_Start` clips, the power charge dashes, and `Mvm_Wp_ChargeDash2`.
- **Other:** 118 in-place clips have no root twin. The pack also has 679 `.controller` files and 6 demo scenes, which are not used.
- **Sandbox copy:** the extracted FBX files are byte-identical to the Unity sandbox copy that the earlier converter read.

## Speed: what "video speed" is, and how it was measured

**The video:** `https://www.youtube.com/watch?v=59_yV7DdakM`, indexed with `eyes`. It is 4:20 long, 1080p, 60 fps.
- From 1:45 it shows "Animation at a glance" grids, each cell looping one labelled clip.
- `scripts/characters/loadout/measure_runner_video_speed.py` measures each cell's loop period and divides it by the clip's length (`development/characters/loadout/runner/video_speed.json`).

**Result:**
- 18 labelled cells (Walk, Jog, Dash, Boost, ChargeDash, ChargeBoost, BoostEnd, 4 dodges/moves, 2 slides, 5 rolls) give ratios of **0.9987–1.0000** (mean 0.9995).
- So the video plays every clip at its own 30 fps rate.
- The three Idle cells were left out: they barely move, so the period finder locks onto noise.

**In the game:**
- Every Runner clip that the new layer plays runs at **timeScale 1**.
- A travelling clip moves him by its own root travel, at its own speed.
- **Runner pace** (Hero tab, on by default) sets Loadout's ground speeds to the loops' own root speeds:
  - Walk 2.13 m/s;
  - Jog 3.46 m/s;
  - Dash 8.15 m/s (the run);
  - Boost 10.85 m/s (Flow sprint).
- With pace on, his locomotion loops therefore also play at rate 1.
- **This is a gameplay change for Loadout only.** His sprint was 16.4 m/s and his run 6.6 m/s. Backspool is unchanged.

**Not checked against video:**
- The 22 slides of the Asset Store page's media carousel. The page loads them only after accepting third-party cookies, so they were not watched.
- The pack's store page lists no frame rate or clip counts in its static HTML.

## Conversion

`scripts/characters/loadout/convert_runner_full_pack.cjs` converts all 872 clips. It uses the game's r128 FBX loader and `game_humanoid_retarget.js` in headless Chromium, and writes them into `assets/loadout/runner/full/`:
- `runner_full_index.json`;
- six per-part `runner_full_P1..P6.bin.gz` files.

Together these are 3.4 MB, and the raw pack is not copied.
- **Pose:**
  - int16 quaternions per bone and frame, plus the hips track, at the clip's own 30 fps;
  - the hips rise is capped at 4 cm, and the rest of the rise is kept as `lift`;
  - the root node's tracks are held at their first frame. Its rest pose is −90° about X, so removing those tracks would pitch the whole body. An early run did exactly that and was caught by the parity test below.
- **Root motion:** travel per frame in metres, in his start frame (right, up, forward), plus yaw. 444 clips have it: all `_Root` clips, plus in-place clips whose root turns.
- **Shared poses:** 233 `_Root` clips share their in-place twin's pose, because they are equal after quantisation.
- **Attacks:** strike frames are measured per limb.

**Pose parity (`test_runner_full_pose_parity.cjs`, plain node):** checked against the earlier, separately reviewed 56-clip conversion.
- 46 clips are shared, with a worst bone difference of **0.074°** (quantisation only).
- Their strike frames are identical.
- PASS.

## Runtime: `scripts/game_v02_loadout_runner_full.js`

### Movement ownership

A travelling Runner action is the movement owner `'runner'`, run through `threadrailGame.coordinator.run` in `updatePlayerLegacy`. Nothing else moves him in that step. Each step:
- **Sweep:** the root delta is swept with `threadrailGame.clear`. If it is blocked, it slides along one axis or stays put.
- **Ground following:** on the ground he follows support only within **12 cm**. A higher step blocks him. A drop hands him to physics.
- **Lift:** jumps' pelvis lift raises the capsule, and a ceiling stops the rise.
- **No clones:** there is no teleporting and no autonomous clone.

### Engine hooks

The changes in `src/v02/engine/` are no-ops unless the hero is Loadout:
- **`180` director:** `loadoutRunnerFull.animate()` is first in the director.
- **`310` movement:** the `'runner'` owner, the pace speed in the legacy ground line, and an `afterPhysics` hook.
- **`280` input:** `handleKey` and `poll` give the layer first look. While he is the hero, RB, X and LB are taken out of the button array. Those were Backspool's power buttons, and Loadout has no powers.

### Inputs (Loadout only)

| Input | Moves |
|---|---|
| RB / E tap | `Esc_BoostDash_*` 8-way, chosen relative to his facing when pressed (double tap: `_Ad`). In Flow: `Mvm_PowerDash_*` 5-way. In the air: `Esc_BoostDash_Air_*`; with Jump held: `Up` / `Up_Fwd`; with LB held: `Down` / `Down_Fwd`. In weapon mode: `Mvm_Wp_ChargeDash`, `_2` |
| RB / E hold, release | `Mvm_PWChargeDash_*` (travelling clips `Mvm_PowerChargeDash_*_Root`) |
| X / R | Handsprings: front, back and turn (start, loop while held, end), plus `3Turn` and `4Turn` in Flow. In the air: front or back air roll (start, loop, end). After a death: `Tum_RackSpring`. With LB held and stick back: `Tum_RackSpring_BackDown`. In weapon mode: `WpAttack_Rolling(_All)` |
| LB / Tab hold | Strafe facing the camera. 8-way loops for Walk and Jog (by stick), Dash (Flow), Boost (Flow after 1.2 s), and ChargeDash / ChargeBoost (RB held). Weapon mode adds Wp ChargeBoost. 8-way starts and stops |
| Strafe + C / D-pad down | Stand dodge, stand move, turn dodge, stand rolls, rolls, dodges and moves (`_Fwd_Root` at speed). In Flow at speed: slide start, keep (Short / Middle / Long) and end, or a side slide |
| Strafe + Space / A | The physics jump, with a Runner overlay: front (A / B), side (`Jmp_Move_*`; `Jmp_SideAir_C` in Flow), back, turn, roll and base jumps |
| View+LB / G | Weapon mode. A staff appears in his right hand. RT strikes on hand moves use windows of the weapon clips, timed so the hand's strike lands on the move's contact time; kicks keep their clips |
| Move List (Hero tab), M / View+RB, `.` `,` / View+X | Any of the 872 clips |

### Automatic (Runner transitions, Hero tab, on by default; off while a combat target is locked)

- **Starts:** forward, 90° and 180° turning starts (Walk / Jog).
- **Idle turns:** 90° and 180° on a light stick.
- **Turns while running:** 180° turns at Walk, Jog, Dash and Boost pace (Walk arc 180 on a light stick), plus 90° arcs and quick arcs.
- **Stops:** by pace and foot (`*End_L/R[H]`, `Mvm_BoostEnd`). A stop gives way to a new stick push.
- **Deaths by context:** slide, air, fast run, run, or standing (Over / Over2 start, keep, end).
- **Recovery:** `Dam_StandUp` after a death, and `Esc_Spawn` on respawn.

**Flow roles replaced for Loadout (rate 1, with Runner transitions on; each clip is chosen once when the role starts; the wall side comes from the wall normal):**
- `wallRun`: Hi/Lo × L/R × Dash/Boost loops;
- `wallClimb`: Dash or Boost loop;
- `wallKick` and `wallFlip`: by wall side.

### Coverage

- **642 of 872** clips have a gameplay or input binding (`evidence/runner-full/coverage.json`).
- **230** are reachable only through the Move List. Most are wall-run variants (WallRun_BoostDash side-ups, WallJump_Cross/Turn All/Up/Down/Enter/Exit/Hold, wall hold/fall/land, wall-climb enter/exit) and segmented pieces (`_Start` / `_Keep` / `_End` of clips that are mapped as `_All`).

## Evidence

**`test_loadout_runner_full_real_input.cjs`: 42/42 PASS** (`development/characters/loadout/evidence/runner-full/report.json`, `all-clips.json`). It uses real input: Hero-tab menu, keyboard, and a virtual standard pad read by the game's polling. The labelled setup is listed in the file header.
- **Catalog:** all 872 clips decode, finite, at their indexed lengths.
- **Pace:** the run is `Mvm_Dash` at 8.154 m/s, a light stick is `Mvm_Walk` at 2.129 m/s, and the Flow sprint is `Mvm_Boost` at 10.853 m/s, all at rate 1.
- **Transitions:** start, stop, idle turn, 180° start, 180° turn (Dash pace), and 90° arc.
- **Dashes:**
  - back dash covers 4.86 m, against 4.83 m in the clip;
  - 8-way from the stick;
  - charge release;
  - power dash in Flow;
  - air dash;
  - up dash, which lifted the capsule 6 m.
- **Tumbles:** handspring tap and hold, back handspring, air roll.
- **Strafe:** 4 directions with facing kept, starts and stops, walk and charge tiers, Flow dash to boost loops.
- **Strafe moves:** strafe evades, slide start / keep / end, side jump.
- **Collision:**
  - a dash into a QA wall stops at the wall face;
  - a dash off a 1.6 m QA ledge hands him to physics, and he lands.
- **Wall runs (QA wall, both directions):** the Runner wall loop is on the side the wall is on, measured from the wall normal, and his head leans away from the wall on every frame.
- **Weapon mode:**
  - the staff shows, and the dash is the weapon dash;
  - the RT chain connects 8/8 against a practice target;
  - switching it off hides the staff.
- **Death and respawn:** dying while running plays `Dam_StandDie`, and the respawn plays `Dam_StandUp`.
- **Move List:** Perform works.
- **All 872 clips through M / `.`:**
  - every one performs at rate 1;
  - the capsule stays clear, finite and conflict-free;
  - every root clip travels its own distance within 15% or 0.35 m.
- **Backspool control:** no Runner-full action, and E is still his Drive.
- **Errors:** no page errors.

**Regressions:** `scripts/vertical-v02/run_loadout_runner_full_checks.py` runs the 16-step V02 set, plus:
- the Loadout hero test (hero switch chord L3+LT+RT+R3, power keys, cape);
- the earlier Loadout Runner test with pace and transitions off;
- this suite.

Results are in `development/vertical-city-v02/evidence/loadout-runner-full-checks/summary.json`.

## Not done / NOT TESTED / observations

- **Contact correction:** it is capped at 0.12 m by construction. Every test ran on flat ground, so the measured maximum is 0. NOT TESTED on stairs, slopes or kerbs.
- **Wall-run side in the earlier role mapping (finding):** on the QA wall, running right puts the wall on his left (wall normal measured), and the earlier mapping plays `LoWall_RDash_Loop`, whose head leans toward the wall. The new layer plays `LoWall_LDash_Loop`, which leans away. So the earlier test's three wall checks fail on this build while Runner transitions are on. With transitions off (the setting the regression job uses), the earlier mapping is untouched.
- **Wall moves:** the low/high walls, boost loops, wall climb and kick/flip sides are implemented. Only the low-wall Dash loop on both sides is tested with real input; NOT TESTED: high walls, boost loops, kick, flip. The 230 Move-List-only clips have no gameplay trigger yet.
- **Combat:**
  - no i-frames: strafe evades are movement, not combat evades;
  - the new dashes and tumbles have no hit logic;
  - weapon mode changes only the clips on hand strikes.
- **Older role mapping:** its flow roles (rolls, flips, jumps, landings) still fit Runner clips into Backspool's gameplay durations, so they do not play at video speed. The new layer's rolls and dodges (strafe + evade) do play at video speed.
- **Look:**
  - judged only from headless screenshots (upright poses; the staff sits in the hand);
  - you have not reviewed the new moves in motion;
  - mapping choices made from clip names (for example `Tum_RackSpring_BackDown`, `Jmp_SideAir_C`) may not match what each clip looks like.
- **Staff:** it is a simple procedural staff. The pack's `ClazyWeapon` model was not imported.
- **Licence:** this is a licensed Asset Store pack. The converted clip data (`assets/loadout/runner/full/`) must stay in the private repo, inside the game only. Keep it local and unpushed, like the earlier Runner work. This is not legal advice.
