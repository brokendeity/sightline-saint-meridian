# V02 gameplay bug sweep and fixes (2026-11-05)

Build: `SIGHTLINE_SAINT_MERIDIAN_V02_GAMEPLAY_FIXES.html`, made by `scripts/vertical-v02/build_gameplay_fixes_candidate.py` from `SIGHTLINE_SAINT_MERIDIAN_V02_STYLIZED_ATMOSPHERE.html` (which already contains the Loadout no-Afterstep change). The build adds one new module, `scripts/game_v02_gameplay_fixes.js`, and three inverse-verified hooks. No existing module, build or evidence folder was edited. Build record: `V02_Gameplay_Fixes_Build.json`.

## How the game was played

Everything below used real keyboard input, a virtual standard pad read through the game's own poll, and real menu clicks. Plaza placement before a block is labelled test setup.

| Sweep | What was done | Result |
|---|---|---|
| Flat-ground locomotion | 8 headings × 3 heroes: run, sprint toggle, jumps every half second, roll | PASS: no NaN, no fall below the world, no stuck modes, no page errors |
| Ability spam | Every bound key and pad button, on the ground and in the air, for each hero | PASS: no errors or stuck states |
| Hero switch chord (L3+LT+RT+R3) | Sprint, mid-air, mid-attack, roll, aim held, rail flight × 3 heroes | PASS: hero changes; movement and jump work afterwards; no stuck keys, aim or transit |
| Pause / resume | Same 6 states × 3 heroes | PASS: no stuck input; Sightline rail flight continues after resume |
| Backspool street contracts | Interception, Echo Setup, Retrace Escape, played through with right-stick steering and RT | PASS: all complete (B, B, A) |
| Loadout street contracts | Same three | PASS: all complete (B, B, A) |
| Real-time free roam | Two sessions with the game's own frame loop and rendering (seeds 7 and 31), 2.5 min per hero each | Found bugs 1–2 and the open items below; no page errors |
| Free roam replay on the fixed build | Seed 7, Backspool, 2.5 min | No stuck mode and no stuck spot; the source build stuck at (33.4, 0.4, 218.4) in that run. Supporting evidence only: real-time runs are not frame-identical |

## Fixed (PASS by real input)

`scripts/vertical-v02/test_gameplay_fixes.cjs` runs each check on the fixed build and on the source build as a control. Evidence: `evidence/gameplay-fixes/results.json` and screenshots. 13 of 13 checks PASS.

**1. Backspool stuck on a cable lying on the floor.**
- **Cause.** A quick Threadrail (R / X) from a standstill on open ground lays the cable on the floor, from his feet to the aim point. The rail core correctly gives no free speed, so he sat in the grind pose at 0 m/s, in mode AIR, while the HUD said ON FOOT. Move input did nothing, and only Jump or the 30 s rail expiry released him.
- **Fix.** A rider stopped (under 0.3 m/s for 0.45 s) on a cable within 0.35 m of walkable ground steps off with the velocity he has, so no speed is added. Rails whose slope lets gravity restart travel are left alone. A rider stopped on a raised cable stays attached, as before, and sees "RAIL STALLED · JUMP TO RELEASE".
- **Control build:** still stuck after 5 s.
- **Fixed build:**
  - he steps off 0.47 s after attaching;
  - he gains no horizontal speed (under 0.05 m/s);
  - he walks normally afterwards;
  - a running rail still grinds, with no dismount while moving.
- Loadout has no Threadrail, so he was never affected.

**2. Objective marker drawn over the speed readout.**
- **Cause.** The off-screen marker was clamped to fixed screen margins (135 px from the bottom) that are smaller than the V02 vitals panel. When the objective was below and to the left of the view, the marker sat on the speed number.
- **Fix.** The marker is now nudged clear of any visible HUD panel after the game places it.
- **Test.** Sightline, looking up, with a full right-stick turn:
  - the control build overlapped the vitals panel in 12 of 150 samples;
  - the fixed build overlapped in 0 of 150 (46 nudges).

**3. Controls guide always showed Sightline's keys.**
- **Cause.** "Controls & Rescues" listed Sightline's bindings for every hero, for example R "Reset to plaza", RMB "Aim Sightline" and E "Micro-rail dodge". For Backspool those keys are Threadrail, Guard and Drive.
- **Fix.** The guide now shows the active hero's bindings, taken from the game's own in-game labels (action hint, Practice and Equipment tabs, Read and Practice buttons).
  - Loadout's guide leaves out the powers he does not have.
  - Sightline's guide is the original markup, byte-identical.
- **Test.** R, Q and C, as listed for Backspool, were checked by real input: they produce a rail attach, the heavy, and the backstep evade.

## V02 regression set on the fixed build

`scripts/vertical-v02/run_gameplay_fixes_checks.py` runs the same 16 jobs as the atmosphere checks. The summary and logs are in `evidence/gameplay-fixes-checks/`.

**Result: 15 of 16 PASS in the suite run.**
- **PASS:** wall contacts, landing contacts, city loops, station routes, the 12 retained encounter, replay and discovery cases, strides, air, crouch, combat, Sightline melee, rhythm, themed slots, impact FX, no halo trucks, and the menu.
- **FAIL in the suite run: vaults.** `climb1.8` played `climbHigh` but ended on the ground (endY −0.42 instead of 1.38).
- **Re-runs, alone, on the same build:** PASS 2 of 2, with all five cases ending on the expected surface (`rerun-vaults-fixed-1`, `-2`). The source build also passed (`rerun-vaults-control`).
- **Likely cause.** The failing run overlapped with a real-time free-roam session rendering in another browser on the same machine. It is classed as intermittent under load, not a regression from these fixes, which only act while on a Threadrail, on the marker, or on the guide. **The cause is not proven.**

## Found, not fixed (OPEN)

- **Sightline can fly to any altitude.**
  - An open-sky rail ends with "MOMENTUM PRESERVED" at up to about 185 m/s. One sky rail carried him to 827 m (courier evidence); chained sky rails reached 2,129 m and 7,196 m in free roam.
  - Above roughly 300 m there is nothing to land on, and the run usually ends in a mission-failure reset.
  - Capping it changes Sightline's flight, so it is left for the user to decide. Options: a soft ceiling (for example 60 m above the tallest roof), or a cap on the exit speed of open-sky arrivals.
- **30 m position pop after an uncontrolled crash (Sightline).**
  - After a fast uncontrolled impact, the player ended inside a building's collision box. `recoverPenetration` then pushed him out along the shortest exit, which was the roof: 29.7 m in one frame.
  - It is a legacy safety net. The real cause is the crash motion entering the box. Seen once; NOT reproduced on demand.
- **Camera inside Sightline at take-off near a wall.**
  - The camera came within 0.19–0.29 m of the player for about 5 frames at a take-off beside geometry.
  - Minor, seen once.
- **First switch to Loadout stalls the frame for about 1.1 s** while his animation bank is retargeted. Later switches take about 20 ms.
- **Original courier Disruption step (known since Codex).**
  - A guard's shot during the Disruption approach drops the carried civilian under the crash rule.
  - The civilian is put back on the nearest roof, so the mission stays completable by design. An end-to-end real-input completion is still NOT proven.

## NOT TESTED

- The raised-rail "RAIL STALLED" notice, and the rule that skips sloped rails, where gravity restarts travel. Both are in the logic, but no real-input setup was built for a stalled raised rail or a stalled sloped rail. The older Threadrail browser suites (`scripts/test_threadrail_*.cjs`) are hard-wired to pre-V02 builds and geometry, so they were not re-run.
- Physical controllers, touch and Windows.
- Sustained combined performance. The free-roam sessions were headless.
