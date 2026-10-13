# SIGHTLINE — ten courier priorities

Implemented in `SIGHTLINE_SAINT_MERIDIAN_TOON.html`. The pre-upgrade version is saved as `SIGHTLINE_SAINT_MERIDIAN_TOON.pre-courier.html`.

| Priority | Implemented behavior |
|---|---|
| 1. Arrival risk | GREEN/AMBER/RED forecast in the visor and reticle readout. Estimates incoming velocity using current speed and rail response; evaluates incidence, swept obstruction, body clearance, distance, pressure/debt/trauma and nearby threats. |
| 2. Environmental anchors | 25 distinct roof-edge, fire-escape, billboard-rail, crane-hook and lamp-post objects, plus six rescue-route vectors. Fire escapes/roof edges vent strain, billboard/crane anchors trade added strain for more boost. Seven wet-glass echo panels identify deceptive locks. The original 42 floating anchors remain. |
| 3. Crosscut | Reuses queued rails and arrival redirects. Commit the next shot within0.42 real seconds after contact to earn score/combo/audio feedback and increasing debt/pressure. Ground landing can be interrupted during that window. Open-sky coasting alone does not open Crosscut. Reset clears the window. |
| 4. Arrival Bloom | Speed-dependent red-gold arrival shockwave blinds nearby drones for1.5–3.5s and stuns nearby rooftop guards. Blind drones stop acquiring/firing and their searchlights go dark. Strong physical impacts can also Bloom. |
| 5. Shutter scans | Existing Y/V toggle: turn on, then off within0.45s for a low-exposure shutter lock. Longer scans show PANIC after1.2s and accumulate exposure. Shutter sound and temporary verification resolve wet-glass echoes. |
| 6. Strain/debt | Severe landings and uncontrolled impacts add trauma and pressure; clean landings do not add injury. Chaining debt and trauma increase subsequent rail pressure cost. Ground recovery, air braking and brace provide recovery/venting. One existing pressure meter remains; condition/debt are compact status readouts. |
| 7. Rain interference | Identifiable wet-glass reflected halos shimmer/drift with rain strength, rather than spawning random fake anchors. Unverified echoes can be committed at extra cost and lead to a hazardous wall arrival; verified decoys are rejected with feedback. Rain strength modulates optical drift and rainfall. |
| 8. Surveillance | Every fourth initial drone is a Civic Halo surveillance category. Scanner observation raises identity, adds a reinforcement at60% (population capped40), and compromises/reset the rescue mission at100%. Hiding and Bloom reduce observation. Visor highlights scanner identity without recoloring the white drone bodies. |
| 9. Multi-rescue | Three rooftop civilians: PRECISION requires a slow, stable, low-pressure pickup; DISRUPTION requires a nearby recent Bloom; CROSSCUT requires a recent rapid chain. All three must reach extraction. Crashes drop carried civilians onto recoverable surfaces; destroyed roofs relocate them. Two rooftop guards defend the riskier rescues. Direction/distance guidance and route alternatives remain. |
| 10. Mastery/rank | Clean actual landings build saved landing mastery, with a modest maximum12% rail-cost discount and20% trauma-cost reduction. Clean rail contacts also score100 points. Completion assigns S/A/B/C/D from earned score, condition, mistakes, exposure, clean arrivals, chains and elapsed time, with rank bonuses. Identity failure yields D and a retry. |

## Controls and rules

LT aims, RT commits, Y scans, LB braces. Keyboard equivalents remain RMB/LMB/V/Q. Use a quick Y/V on/off scan; leaving it active incurs exposure. Holding aim before firing preserves the controlled-fall animation; only TRANSIT uses fly, matching the most recent user instruction rather than the older review's conflicting pose suggestion.

Rails keep a fixed committed endpoint and straight velocity heading. Swept building collision remains authoritative. Moving targets can be struck when physically intercepted along the line; targets that move away cannot take phantom damage at the old endpoint. No Bezier or curved homing trajectory was added.

## Validation

24/24 feature checks passed in `output/playwright/courier-tests.js`;20/20 adapted base regressions passed in `courier-base-regression.js`. The legacy single-VIP extraction assertion was intentionally replaced with a test that a partial three-person payload cannot extract. Additional checks covered optical commit/rejection, moving-target misses, open-sky Crosscut exclusion, named LT/Y/RT mapping and actual keyboard/touch UI input.

Controlled three-role pickup → extraction → rank → next mission was exercised, along with drop/recovery and identity-failure/reset. These are scripted state-controlled scenarios, not a full natural human/controller mission playthrough. Physical controller/rumble and broad cross-browser testing remain unverified.

Screenshots inspected: `output/playwright/courier-visor.png`, `courier-bloom-rescue.png`, `courier-mobile.png`. No new runtime/shader errors in final browser checks; existing FBX import warnings remain. Short120-frame desktop sample: median16.5ms,p9518.6ms; not a hardware-wide performance certification.

Models, toon shading, close camera, red afterimages, drone searchlights, destruction and existing audio remain in place. A portrait-only shoulder adjustment keeps the character inside the mobile viewport. Mission/player simulation is still local browser state; only mastery is saved across reloads.
