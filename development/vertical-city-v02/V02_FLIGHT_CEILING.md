# V02 flight ceiling (2026-11-05)

**Build:** `SIGHTLINE_SAINT_MERIDIAN_V02_FLIGHT_CEILING.html`.
- Made by `scripts/vertical-v02/build_flight_ceiling_candidate.py` from `SIGHTLINE_SAINT_MERIDIAN_V02_GAMEPLAY_FIXES.html`.
- It adds one new module, `scripts/game_v02_flight_ceiling.js`, and three inverse-verified hooks.
- No existing module, build or evidence folder was edited.
- Build record: `V02_Flight_Ceiling_Build.json`.

This resolves the open item "Sightline can fly to any altitude" in `V02_GAMEPLAY_FIXES.md`. You chose the soft ceiling option.

## The problem

An open-sky rail fired while airborne ends at a fixed point 180 m along the crosshair. On arrival Sightline keeps all of his speed ("MOMENTUM PRESERVED").

When the control build fires rails straight up, each one arrives at about 189 m/s and climbs about 210 m. Five chained rails reached 997 m, and a coast after two rails peaked at 1,021 m. Free roam reached 7 km. The tallest roof in the live map is 346.8 m, so above it there is nothing to land on.

## The rule

All heights are measured from the tallest static roof in the live map. The game computes it once from its own building colliders, so no height is typed in by hand. It is **346.8 m**, which puts the **ceiling at 406.8 m** (roof + 60 m).

1. **Open-sky rails stop climbing at the roof line.**
   - A sky rail whose crosshair point is higher than the roof ends where the crosshair ray crosses the roof height. It is still straight, along the crosshair, to a fixed endpoint.
   - If that crossing is closer than 20 m, the endpoint is the usual 180 m crosshair point lowered to the cap. The cap is the roof height, or his current height if he is already above it. This happens, for example, when he is already above the roof. The rail then runs level instead of climbing.
   - The laser preview shows the endpoint that will be flown.
2. **Above the roof line, upward speed is bled off evenly.**
   - The rate is the one that stops the climb exactly at the ceiling, on top of normal gravity (23 m/s²).
   - A climb that gravity already stops below the ceiling is not touched.
   - Only vertical speed changes. Horizontal speed, and everything below the roof line, are unchanged.
3. **A notice shows once per climb:** "FLIGHT CEILING · CLIMB LEVELS OFF AT 407 m". It replaces "MOMENTUM PRESERVED", which no longer holds for vertical speed.

Surface, anchor and enemy rails are unchanged, because nothing they can hit is above the ceiling.

The rule applies to every hero. In practice only Sightline gets that high.

## Evidence: real input

`scripts/vertical-v02/test_flight_ceiling.cjs` runs every check on the ceiling build and on the source build as a control.
- **Inputs:** a virtual standard pad read by the game's own poll (A jump, LT aim, RT fire, right stick look up), plus menu clicks to pick Sightline.
- **Labelled setup:** a plaza placement before each block; drones held in patrol, guards stunned, projectiles cleared.
- **Hostile fire:** the test asserts that no hostile shot lands.
- **Evidence files:** `evidence/flight-ceiling/results.json`, `coast-top-fixed.png` and `chain-control-climbing.png`.

**13 of 13 checks PASS.**

| Check | Result |
|---|---|
| Control climbs past the ceiling (5 chained sky rails) | PASS: peak 997 m |
| Ceiling build stays under the ceiling (same inputs) | PASS: peak 373.8 m |
| The first rail that would pass the roof ends on the roof line, along the crosshair | PASS: endpoint 346.84 m, 0.000° from the crosshair, arrival at 346.84 m |
| Rails fired above the roof run level | PASS: 0 m climb, arrival vertical speed 0, about 12.7 m of travel each (aimed almost straight up, so the level part is short) |
| Laser preview shows the endpoint that is flown | PASS: all 5 rails |
| A sky rail below the roof line is unchanged | PASS: positions identical (difference 0) for all 213 frames up to the second rail, same endpoint |
| Coast after a clipped rail levels off under the ceiling | PASS: arrival at 346.8 m going up at 189.4 m/s, top at 406.83 m after 0.77 s, then a normal fall |
| Level-off is smooth | PASS: vertical speed changes by at most 4.71 m/s per frame (about 29 g), and position never jumps beyond its velocity |
| Horizontal speed is kept | PASS: 2.26 m/s lost over the 46-frame level-off, against 2.25 m/s in the control (normal air drag) |
| Ceiling notice is shown | PASS |
| Ground rail to a façade is unchanged | PASS: identical path for 182 frames, 320 m of travel. It ends in the same wall crash in both builds (no brace) |
| No hostile shot landed | PASS |
| No page errors | PASS |

## V02 regression set on the ceiling build

`scripts/vertical-v02/run_flight_ceiling_checks.py` runs the same 16 jobs as the gameplay-fixes checks. The summary and logs are in `evidence/flight-ceiling-checks/`.

**Result: 16 of 16 PASS in one suite run (24 minutes, one browser at a time, with nothing else running).** The jobs were:
- wall contacts, landing contacts, city loops, station routes;
- the 12 retained encounter, replay and discovery cases;
- strides, vaults, air, crouch, combat, Sightline melee, rhythm, themed slots, impact FX, no halo trucks, and the menu.

Vaults, which failed once in the gameplay-fixes suite run, passed here as well.

## What it feels like (judgement, not measured)

- At full sky-rail speed, the level-off happens in under a second over 60 m. That is the softest stop possible inside the 60 m band, but it still reads as a firm stop when he arrives at 189 m/s. A larger band (for example roof + 100 m) would make it gentler.
- The ceiling is one height for the whole map (406.8 m), set by the towers near x ≈ 1,000. Over the lower plaza districts he can still climb to that height.
- Aiming straight up above the roof line gives short level rails. Aiming lower gives longer ones.
- You have not played it yet. These points come from the numbers and from headless screenshots.

## NOT TESTED

- Anchor boosts and vector-strike exits near the tallest roofs, which can also throw him upward. The rule covers them, but no real-input setup was built for them.
- The courier route that reached 827 m in the earlier evidence was not replayed.
- Physical controllers, touch, and sustained performance.
