# V02 Threadrail grind lines (2026-11-06)

**Build:** `SIGHTLINE_SAINT_MERIDIAN_V02_THREADRAIL_GRIND.html`.
- Made from the canonical source with `scripts/build_v02.py`; the previous build, `…V02_HERO_SELECT_CARTRIDGE.html`, is the control.
- One new module, `scripts/game_v02_threadrail_grind.js`.
- Three hooks in `src/v02/engine/280-threadrail-game.js`:
  - `drawRails` draws the new lines;
  - `afterPhysics` checks for a catch;
  - `threadrailGame.attachRail(id)` is the same validated attach that R / X uses, but silent when movement is not ready.
- Build record: `V02_Threadrail_Grind_Build.json`.

Your request: "When Backspool throws the cartridges and creates the line that connects the two cartridges with a thick glowing line, he should be able to grind on it. Use the Forspoken surfing animation as the grind animation when he's on those lines."

## What changed

1. **Thick glowing line.** Every Threadrail cable, including a cartridge-to-cartridge line, is now drawn as:
   - a bright cyan core, 7 cm across;
   - inside a soft additive glow, 24 cm across;
   - brighter while he rides it.

   Cable height and positions are unchanged. It costs at most 8 draw calls (4 cables).
2. **Landing on a line grinds.**
   - **When it catches:** he comes down onto a cable from above, his body is within 1 m of it sideways (inside the fixed 2 m attach reach), and he is away from the cable's ends.
   - **What happens:** he catches it and grinds, through the same validated attach as pressing R / X.
   - **Speed:** his speed on the line is only the part of his velocity that runs along it. No speed is added, so the locked "no free acceleration" rule holds. Run in Flow and jump onto a line at a shallow angle to grind fast, or ride a sloped line.
   - **No catch when:**
     - he rises through a line from below;
     - he jumped off that same line less than 0.4 s ago;
     - on a near-level line (under 10°), he has less than 1.5 m/s along it, which would only leave him stalled on it.
   - **Still works:** R / X beside a line attaches as before.
3. **Grind animation.** The grind already plays Forspoken's magic-parkour surf loop: `pkr000_mgc_move_slide_f000a_lp`, `0x2811926e`, the `railGrind` role, with the authored surf posture on top. It was confirmed playing on every grinding frame. Nothing new was extracted.

## How to do it in the game (Backspool)

1. Hold **R** or **X** and release to throw cartridge A at a surface. Do the same for cartridge B. A glowing line connects them, if they are 6–100 m apart and the line is no steeper than 55°.
2. Tap **L3** or **Shift** for Flow, run toward the line at a shallow angle, and jump with **A** or **Space** so you come down onto it.
3. While grinding, press **A** to jump off, or **R** / **X** to transfer to another line.

A Flow jump is big. It peaks about 4.3 m up and covers about 11 m sideways. On the test line, taking off about 10 m from it, at a 35° approach, landed him on it.

## Evidence: real input

`scripts/vertical-v02/test_threadrail_grind.cjs` runs everything on the new build and on the control.
- **Inputs:**
  - the right stick aims, in a closed loop on the rendered crosshair;
  - R hold-and-release throws;
  - L3 toggles Flow, the left stick runs and A jumps;
  - an R tap attaches.
- **Labelled setup:**
  - Backspool starts on the plaza, facing two pillars 46 m apart.
  - Before each run he is placed at its start point, without a reset, so the thrown line stays.
  - Hostile fire is stood down.
- **Not written:** rails, cables and the camera are never written by the test.
- **Evidence files:** `evidence/threadrail-grind/results.json`, plus screenshots: `line-new.png`, `line-control.png`, `grinding-new.png`.

**10 of 10 checks PASS.**

| Check | Result |
|---|---|
| Two precision throws make one line, in both builds | PASS: a 41.3 m line between the two pillars ("PERFECT CROSS-STREET"); aim error 0.27° and 0.15° |
| The line is drawn thick and glowing | PASS: core 0.035 m radius, additive glow 0.12 m, centred exactly on the cable, full length; the control has neither |
| Landing on the line grinds | PASS: a Flow jump taken 10 m out caught it 0.03 m from centre; 91 frames on the line, 17.6 m travelled, the Forspoken surf grind on every frame |
| No free speed | PASS: 13.19 m/s on the line, equal to his incoming speed along it (13.19) |
| The control never catches with the same inputs | PASS: it passed 0.03 m from the line and flew over it |
| Jumping off is not undone | PASS: off the line at once, no re-catch within 0.4 s |
| A still jump under the line does not stick | PASS: rose to 2.6 m, 0 frames on the line, landed |
| R beside the line still attaches, in both builds | PASS |
| No hostile shot landed | PASS |
| No page errors | PASS |

The first two runs had a wrong visual check (it looked at the wrong line object); the build did not change between runs.

## V02 regression set

`scripts/vertical-v02/run_threadrail_grind_checks.py` runs 22 jobs:
- the grind test;
- the hero-select test;
- the 16 V02 suites;
- the canonical smoke check;
- the three Loadout jobs.

Summary in `evidence/threadrail-grind-checks/`.

**Result: 22 of 22 PASS in one run (30 minutes, one browser at a time).**

## Judgement and limits

- **Timing.** Landing on a line takes a well-timed jump: the catch window is 1 m sideways. On a 35° approach in Flow, that is about a tenth of a second. A shallower approach makes it easier. If this feels too strict in play, the window can grow up to the fixed 2 m attach reach.
- **The old line.** The old one-pixel line is drawn by a second, unnamed line object. It is still drawn in the new build, but it lies inside the 7 cm glowing core.
- **Lifetime.** Lines still expire after 30 simulation seconds (an existing limit).
- **Not tested:**
  - landing on a sloped line;
  - catching while Flow-flipping;
  - transfers between grind lines after a catch;
  - physical controllers, touch, and sustained performance.
- **You have not played it yet.**
