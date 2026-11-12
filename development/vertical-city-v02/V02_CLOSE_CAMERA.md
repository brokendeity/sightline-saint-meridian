# V02 close camera (2026-11-05)

**Build:** `SIGHTLINE_SAINT_MERIDIAN_V02_CLOSE_CAMERA.html`.
- Made by `scripts/vertical-v02/build_close_camera_candidate.py` from `SIGHTLINE_SAINT_MERIDIAN_V02_FLIGHT_CEILING.html`.
- One new camera module, `scripts/game_v02_close_camera.js`, and six inverse-verified camera hooks. Each hook falls back to the old number if the module is missing.
- Backspool and Loadout use `scripts/game_v02_body_framing_v3.js` in place of v2 (see below). v2 is not edited, and the build loads only one of the two.
- No existing module, build or evidence folder was edited.
- Build record: `V02_Close_Camera_Build.json`.

Your request: "when I aim lock with Sightline the camera comes closer to the character; that view should be the default position of the camera for each character."

## What changed

Sightline's grounded aim-lock view is now the default on-foot view for all three heroes.

| | Before | Now |
|---|---|---|
| Default: distance behind the focus | 4.25 m | **3.25 m** |
| Default: height above the focus | 0.32 m | **0.25 m** |
| Default: shoulder offset | 1.35 | **1.05** |
| Default: field of view | 56° | **48°** |
| Sprint (Sightline RB, Backspool and Loadout Flow) | 4.65 m, 60° | **3.65 m, 52°** (same +0.4 m, +4° pull-back as before) |
| Reduced-motion ground FOV | 56° | **48°** |
| Reset / respawn | snapped to 4.25 m and 56° | snaps to the new default, so there is no zoom-in after a reset |

**Backspool and Loadout body framing (v3).**
- This layer keeps their whole body inside 86% of the frame. It was added for the feet that were cropped in rooms and on stairs.
- It also kept a small patch of floor around the feet in view. At 3.25 m that patch tilted their camera 14.8° down, which put the horizon at the top of the screen.
- v3 is v2 with only that floor patch removed. Head to toes, with their radii, are still kept in frame.
- What remains is a small tilt: 3.4° for Backspool (it was 3.9° before) and 6.7° for Loadout, whose idle stance puts his feet lower.

**Unchanged:**
- Aiming. It now keeps the same framing, and it still slows the look speed and locks Sightline in place.
- Rail flight and take-off, jumps and air, the flip camera, uncontrolled falls, and the Threadrail and combat lock-on cameras.
- Friendly-NPC clearance and the wall collision pass.

## Evidence: real input

`scripts/vertical-v02/test_close_camera.cjs` runs every check on the new build and on the flight-ceiling build as a control.
- **Inputs:** a virtual standard pad read by the game's own poll (LT aim, RT fire, sticks, RB and L3 sprint), the R key and menu clicks to pick each hero.
- **Labelled setup:** a placement before each block. Places used: the plaza, a real façade found with the wall-contact test's own finder, and the six body-framing room fixtures. Drones are held in patrol, guards stunned and projectiles cleared. The test asserts that no hostile shot lands.
- **Evidence files:** `evidence/close-camera/results.json`, plus screenshots of each hero's default view in both builds, the control aim-lock view, portrait views and the wall orbit.

**15 of 15 checks PASS.**

| Check | Result |
|---|---|
| Reference: Sightline aim-lock in the control | PASS: 3.25 m, 0.25 m, 1.05, 48° |
| Sightline default matches it | PASS: same numbers; body on screen within 0.03 of the aim view (NDC −0.82…0.29 against −0.84…0.31) |
| Backspool default matches it | PASS: 3.25 m, 0.25 m, 1.05, 48°, with a 3.4° framing tilt |
| Loadout default matches it | PASS: same, with a 6.7° framing tilt |
| Control default was the old view | PASS: 4.25 m and 56° for all three |
| No floor-patch tilt; whole body framed | PASS (Backspool, Loadout) |
| Sightline aim view unchanged | PASS: identical within 0.01 m and 0.1° |
| Sprint keeps its pull-back | PASS: Sightline 3.88 m / 52° (control 4.88 m / 60°); Backspool and Loadout 4.09 m / 52° (control 5.09 m / 60°). Same difference from the default in both builds |
| Reset starts at the new default | PASS: 48° and 3.25 m on the first frame, with no change over the next 30 frames |
| Rail-flight camera unchanged | PASS: 118 take-off and transit frames, at most 1.1 mm and 0.04° apart |
| Camera stays out of walls, backed against a real façade | PASS: 160-frame orbit 1 m from the façade at (203, 140), all heroes; the camera is never inside a building box, in either build |
| Room fixtures framed (Backspool, Loadout) | PASS: 6 of 6 in both builds |
| Portrait window (430 × 932) framed | PASS: all three heroes |
| No hostile shot landed | PASS |
| No page errors | PASS |

## V02 regression set on the new build

`scripts/vertical-v02/run_close_camera_checks.py` runs the same 16 jobs as the flight-ceiling checks. The summary is in `evidence/close-camera-checks/`.

**Result: 16 of 16 PASS in one suite run (32 minutes, one browser at a time, with nothing else running).** The jobs were:
- wall contacts, landing contacts, city loops, station routes;
- the 12 retained encounter, replay and discovery cases;
- strides, vaults, air, crouch, combat, Sightline melee, rhythm, themed slots, impact FX, no halo trucks, and the menu.

## Trade-offs (measured, then judged)

- **In this build, Sightline's feet leave the frame more often in tight spaces.**
  - In the six room fixtures his whole body is in frame in 0 of 6 (3 of 6 before).
  - During the wall orbit it is in frame in 0 of 160 frames (84 of 160 before).
  - It is his toes that drop just below the bottom edge. His aim view always did this; it is now his default too.
  - Backspool and Loadout are not affected, because body framing covers them. Sightline was deliberately left out of body framing.
  - **Fixed in the follow-up build below** (`…V02_SIGHTLINE_FRAMING.html`): you chose "Add it for Sightline".
- **The other cameras now start from a closer default, so they swing out further.** The flip camera (5.4 m) and the jump and air camera (8 m) are unchanged. For example, a jump now pulls out 4.75 m, where it used to pull out 3.75 m.
- **A 48° field of view shows less of the sides** while running than 56° did.
- Loadout's 6.7° tilt puts the horizon slightly higher than for the other two.
- You have not played it yet. These points come from the numbers and from headless screenshots.

## NOT TESTED

- The combat lock-on camera and the Threadrail rail camera. They are unchanged by construction (they own the camera when active), but they were not exercised.
- The 26-flight stair tour from the body-framing work. Its scripts write to fixed evidence paths, so they were not re-run. The six room fixtures were re-checked instead.
- Physical controllers, touch, and sustained performance.

---

# Follow-up build: body framing for Sightline (2026-11-05)

**Build:** `SIGHTLINE_SAINT_MERIDIAN_V02_SIGHTLINE_FRAMING.html`.
- Made by `scripts/vertical-v02/build_sightline_framing_candidate.py` from the close-camera build.
- One inverse-verified edit: it loads `scripts/game_v02_body_framing_v4.js` in place of v3. v2 and v3 are not edited, and neither is the close-camera build.
- Build record: `V02_Sightline_Framing_Build.json`.

Your decision: "Add it for Sightline".

## What v4 does

- **On foot, not aiming** (modes GROUND, LANDING and IMPACT): Sightline's whole body, head to toes, is kept inside 86% of the frame. It works exactly as it does for Backspool and Loadout: the camera turns slightly, and widens its field of view if ever needed. It never moves.
- **Aiming on the ground, or airborne:** Sightline's aim ray is cast from the rendered camera, so the framing tilt eases out. It reaches 90% gone in about 0.23 s. His aim view and aim target then settle exactly on the ones he had before.
- **Take-off, rail flight and airborne aim:** this is the game's flight-aligned camera. The tilt is dropped at once, so rails and flight are never aimed through it.
- **Back on foot:** the framing eases back in at the same rate. The easing is a 0–1 weight on the solved tilt. Once he is settled, the framing follows his body every frame.
- **Backspool and Loadout:** unchanged from v3.

## Evidence: real input

`scripts/vertical-v02/test_sightline_body_framing.cjs` runs on this build, with the close-camera build as the control.
- **Inputs and setup:** the same kinds as above (pad, menu clicks, labelled placements, hostile fire stood down).
- **Order:** Backspool and Loadout are compared first, on freshly loaded pages. Then the Sightline rails run, then the other Sightline blocks.
- **Why the order matters:** an earlier ordering showed small differences that were not v4's. The hero switch runs real-time menu frames, so after a long Sightline sequence the two pages' animation clocks drift apart. In a probe with two copies of the control, the page-to-page noise was 0.0005–0.001° of view and 4.5 mm of flight camera.
- **Evidence files:** `evidence/sightline-framing/results.json`, plus plaza and room screenshots in both builds.

**11 of 11 checks PASS.**

| Check | Result |
|---|---|
| Plaza: whole body framed | PASS: 0.6° tilt; camera position and FOV identical to the control |
| Six room fixtures framed | PASS: 6 of 6 (control 0 of 6); tilt 6.3° and 10.5° in the two room spots |
| Wall orbit framed | PASS: 160 of 160 frames (control 0 of 160); camera never inside a building box |
| Aim eases out without a snap | PASS: room 6.5° tilt, at most 1.0° removed per frame; plaza 0.6°, at most 0.1° per frame |
| Aim view settles on the control's | PASS: within 0.04° after 0.5 s and identical after 1 s, in the room and on the plaza; same aim target; identical movement |
| Jump eases out and back in | PASS: 5.8° tilt down to 0.002° in the air, back to 6.3° after landing, at most 1.1° per frame; identical movement |
| Open-sky rail identical | PASS: positions and flight camera identical (differences around 1e-13), aim view identical |
| Ground rail identical | PASS: 118 flight frames. Position and flight camera within 2.8 mm over a 328 m flight: firing 0.75 s after pressing LT leaves about 0.0003° of tilt still easing out |
| Backspool and Loadout unchanged | PASS: within 0.0006° of view, camera position identical |
| No hostile shot landed | PASS |
| No page errors | PASS |

The 15 close-camera checks also ran again on this build, against the original far-camera flight-ceiling build: **14 of 15 PASS, 1 FAIL** (`evidence/sightline-framing-close-camera/results.json`).
- **FAIL: `defaultMatchesAimLock_sightline`.**
  - Sightline's default distance, height, shoulder offset and FOV still match the aim-lock view exactly (3.25 m, 0.25 m, 1.05, 48°).
  - The check also requires his body to sit in the same place on screen as in the aim view, within 0.05. The new 0.67° framing tilt moves it 0.053.
  - That tilt is the change you asked for. The check was written for the previous build and was not loosened afterwards.
- **Everything else PASS**, including:
  - sprint and reset;
  - rail flight;
  - walls: Sightline fully framed in 160 of 160 orbit frames, against 84 of 160 with the original far camera;
  - rooms: 6 of 6 for all three heroes;
  - portrait.

## V02 regression set on this build

`scripts/vertical-v02/run_sightline_framing_checks.py`, same 16 jobs. Summary in `evidence/sightline-framing-checks/`.

**Result: 16 of 16 PASS in one suite run (25 minutes, one browser at a time, with nothing else running).**

## Judgement (not measured)

- In rooms and near walls the camera now tilts down to keep his boots in view. In the room fixtures that is 6–10°, the same kind of composition Backspool and Loadout get.
- If you fire within about a quarter of a second of pressing LT, the shot goes where the crosshair is on screen. That is still slightly tilted at that moment, so it can differ from where the old build would have aimed by up to the size of the tilt. After about 0.5 s there is no difference.
- You have not played it yet.

## NOT TESTED

- Sightline melee and combat while framed on foot. The regression set's Sightline-melee job ran on this build, but it does not check framing.
- Physical controllers, touch, and sustained performance.
