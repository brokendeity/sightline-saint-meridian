# Backspool costumes: Default and Half mask (UE rig)

**Build:** `SIGHTLINE_SAINT_MERIDIAN_V02_BACKSPOOL_COSTUME.html`
- Made from `src/v02` with `scripts/build_v02.py`, not by a patcher.
- Build record: `development/vertical-city-v02/V02_Backspool_Costume_Build.json`.
- Its control is `…V02_THREADRAIL_GRIND.html`. No older build was edited.

**Request (the user, relayed on 2026-11-06):** "add the unreal version as an alternate costume in the backspool menu".

## Using it
1. Pick Backspool, then open the menu's **Hero** tab.
2. The **Backspool · Costume** section offers **Default** and **Half mask (UE rig)**. The section only appears while Backspool is the hero.

The choice is remembered (localStorage `backspoolCostume`) and comes back after a reload.

A costume swaps **only his visual model**:
- The hero and controller stay `backspool`.
- Moves, combat, powers, Threadrail lines and grinding, the Afterstep exhaust and the camera framing all keep working.

## How it works
| Piece | What it does |
|---|---|
| `assets/backspool/costumes/half-mask/` | The user's Tripo zip (copied unchanged), the unpacked source, the converted `backspool_halfmask_mixamo.fbx` and `conversion_report.json`. |
| `scripts/characters/backspool/convert_ue_costume_to_mixamo.py` | The Blender conversion, steps listed below. |
| `scripts/game_v02_backspool_costume.js` | `backspoolCostume`. It builds the costume bank the same way Loadout's is built: normalise to 1.82 m, match facing, retarget all 183 Backspool clips with `game_mixamo_retarget.js`, apply the toon look and outline. It also provides the Hero-tab switch. |
| `scripts/game_backspool_switch_v02.js` (live switcher) | Banks are keyed `backspool` or `backspool@<costume>`. A costume change is a bank swap while the hero stays Backspool. Loadout still retargets from the default `backspool` bank. Adds `characterSwitcher.refreshCostume()` and `bankKey()`. |
| `src/v02/page.html` | One new `<script>` tag. |

The conversion script does five things:
1. **Faces him like Backspool:** turns the model 90° about Z.
2. **Renames bones:** 52 UE bones become `mixamorig` bones.
3. **Merges in-between bones:** `spine_02`, `spine_04`, `neck_02` and the 8 metacarpals are merged, with their skin weights, into their parent bones. The game's retargeter holds a bone that isn't in Backspool's skeleton at its rest pose when it sits between two mapped bones, so every bone above it got the wrong rotation. That put the arms 50–130° off and kept the first combat hit from connecting.
4. **Sets the rest pose:** A-pose to Backspool's T-pose limb directions, then copies Backspool's rest orientation onto every mapped bone. The Afterstep exhaust offsets its outlet along the Hips bone's own axes, so the costume needs the same Hips axes.
5. **Adds Mixamo end bones and exports:** `HeadTop_End`, `Toe_End` and finger tips are added, then the FBX is exported with its 3 textures embedded.

The **twist bones** (upper arm, forearm, thigh, calf) stay as `ue_*` bones and follow their parents.

## Evidence (real input; no teleports in the costume test)
- **`scripts/characters/backspool/test_backspool_costume_real_input.cjs`:** 11/11 PASS. Evidence in `development/characters/backspool/evidence/costume/`.
  - **Hero tab:** the costume section shows only for Backspool, with both options.
  - **Swap:** the menu swaps only the model and all 183 clips are retargeted. Switching takes about 1.4 s, of which the retarget is 0.64 s.
  - **Movement:** W runs 15.5 m in 2.5 s (Default 15.5 m). Space jumps about 2.0 m and he lands.
  - **Framing:** all 17 framing bones stay on screen while idle and running (the worst one reaches 0.79 of the way to the screen edge).
  - **Persistence:** the choice survives a reload, and Default restores his own model.
  - **Errors:** none on the page.
  - **Screenshots:** both costumes in the menu, idle, running and jumping.
- **Combat in the costume:** `test_mixamo_combat.cjs` with `V02_BACKSPOOL_COSTUME=halfmask`. PASS: the 8-hit RT chains and heavies in all three styles connect. Evidence in `evidence/costume-combat/`.
- **Threadrail grind in the costume:** `test_threadrail_grind.cjs` with `V02_BACKSPOOL_COSTUME=halfmask`.
  - **PASS:** throw a line, land on it and grind with no free speed, jump off without being re-caught, a still jump doesn't stick, R-tap attaches, no page errors.
  - **Two checks need the pre-grind control:** "thick glowing line drawn" and "control never catches" compare against a build without grind lines. They fail against this build's own control (the grind build already has them), and they fail the same way with the Default model. The regression runner therefore uses `V02_GRIND_CONTROL=…V02_HERO_SELECT_CARTRIDGE.html`, the grind build's own control.
- **Retarget check against the original Backspool** (three.js r128; clips 002 Mma Kick, 016 Breathing Idle, 019 Change Direction):
  - all 8 arm and leg segments match within 0°;
  - hands and feet land within 8.4 cm of the original;
  - Neck→Head stays a constant 26° because the UE head joint sits at the base of the skull, a different place from Backspool's head joint. It's a difference in pivot position, not in pose.
- **Full regression:** `scripts/vertical-v02/run_backspool_costume_checks.py`. It runs 25 jobs: the 22 standard ones plus the 3 costume jobs. The result is in `development/vertical-city-v02/evidence/backspool-costume-checks/summary.json`.
  - **First pass:** 23 of 25 PASS.
  - **loadout-runner-full:** Node failed to find the test file even though it exists and is unchanged. Re-run alone: 42/42 PASS.
  - **retained-gameplay:** market-lifecycle (a power-arc count check) failed in the first two full runs and passed in the third, which had all 12 scenarios passing. It passes when run alone on this build and on the grind build, and the grind build passed the full set once. Recorded as flaky.
  - **Final:** 25 of 25 PASS after re-runs. The re-runs are noted in `summary.json`.

## Not done / NOT TESTED
- **Hero-select screen:** the costume switch is in the Hero tab only, not on the hero-select turntable cards.
- **Gear on the model:** the costume model has its own belt and Drive modelled in. The Afterstep exhaust effects come from the Hips bone at the same offset as on the default model, so they might not line up with the modelled turbines. NOT TESTED.
- **Other suites in the costume:** traversal (vaults, wall runs, ladders, crouch), Sightline and the Loadout suites ran with the Default model only.
- **Twist:** forearm and upper-arm twist from the clips rotates the whole limb, as on any Mixamo rig. UE's twist bones don't spread it out.
