# Saint Meridian V02 — Contextual HUD candidate

Entry: `SIGHTLINE_SAINT_MERIDIAN_V02_HUD_CANDIDATE.html?capture=backspool` on the existing8766 server.

This is a full-game candidate derived from the accepted visual milestone. It does not replace the preserved visual/world-life/station/detailed/graybox/V1/WHIP entries. The complete city remains unfinished.

## Player-facing changes

- Health, strain, Halo status, Afterstep bank and three native replay slots share one status cluster.
- The objective remains at the upper edge. Target health/action progress appears when relevant. Nearby information boards and current incidents retain live guidance and controls.
- Pause / Tools opens the existing native pause owner. District, Hero, Equipment, Practice and Controls tabs retain the original elements and callbacks.
- Hero selection, the full animation library, audio, equipment options, practice and training remain accessible. Commands that need live play resume before their existing callback.
- Touch has nine primary44px actions; More reveals secondary actions. The native movement pad remains available. Holding Rail still uses the native cartridge precision handler.

No action definitions, animation curves, physics, geometry, routing, resource rules or power limits were edited. The candidate builder makes three reversible presentation changes: a new presentation callback, a preferred touch host and the adapter script. An exact inverse reproduces the visual source byte for byte.

## Validation

Run:

```sh
python3 scripts/vertical-v02/build_hud_candidate.py
node scripts/vertical-v02/test_hud_candidate.cjs
V02_STAGE=hud V02_EVIDENCE_RUN=hud-regressions LOCAL_ONLY=1 node scripts/vertical-v02/test_market_rescue.cjs
python3 scripts/vertical-v02/write_hud_evidence.py
```

The focused test uses actual keyboard, pointer, simulated gamepad and browser touch inputs. Setup is labelled; the isolated plaza practice position is a fixture, not a certified traversal route. It checks native pause and held-input clearing, stopped train/world-life clocks, paused hero switching, Sightline grounded aim, audio/help, animation preview restoration, public information, practice attacks, legal strike recording and replay slot selection, four-button hero switching, touch Flow/state/jump/landing, primary hit targets, focus containment and responsive layouts.

Desktop persistent/contextual HUD coverage in the tested directory view is approximately10percent. This is a measured UI rectangle union at1440x900, not a performance metric. Touch keeps native condition/resources visible and the central traversal area clear in430x932 and932x430 layouts. Physical touchscreen/controller testing is still outstanding.

The installed Develop Web Game client also ran the actual candidate on ANGLE Metal. Its PNG is canvas-only; it does not establish DOM HUD appearance. Separate full-page captures in `evidence/hud-candidate` show the actual HUD, pause menu and touch layouts. PNGs were opened and visually reviewed.

The retained complete local market rescue also passes:28.4333 simulated seconds to extraction and37.1833 total input seconds. It finds the resident, isolates supply, escorts around stalls, checks grounded civilian movement and exactly one reward, preserves the original courier mission, then departs and returns to native contract tools. The local setup is labelled; this does not re-certify the full ground-to-market approach.

## Defects found during this pass

- The preview test initially searched for a Close label; the native control is `backspoolClose` / Return to game. Corrected the selector without altering the behavior assertion.
- An inherited mobile combat rule hid the native vitals. The first layout check did not detect the omission; screenshot review did. Restored status visibility and added a required visible-health/resources assertion.
- An intermediate Rail-label edit queried a temporarily detached element globally. Corrected the local element lookup before mounting the deck. The failure is retained.
- Native `#hud` passes pointer events through to the canvas. Moving replay slots under that root made their clicks inaccessible. Restored pointer handling for the original slot buttons; actual selection now passes.
- An orientation capture showed a black world although DOM layout passed. The harness now waits for the actual camera/canvas dimensions after resize and freshly renders before capture; it also checks context state and world readback. The corrected landscape PNG shows the city. This is capture-readiness validation, not proof of long-session GPU stability.

Actual earlier captures/reports are retained in `evidence/hud-candidate/fixed-defects` and `fixed-tests`. Earlier passing structural reports have explicitly insufficient visual coverage; they do not supersede current evidence.

## Remaining city gates

This pass is a bounded phase-seven presentation milestone. Reference-quality architecture, train composition and material/lighting refinement still need work. Nine advanced-edge timing fields remain unmeasured. The combined entry still needs the entire retained gameplay suite and>=60-second matched active performance recordings. The short stock-client runtime timings are not sustained performance acceptance. No claim of final AAA quality, full city completion, physical-device acceptance or final release is made.

Source-preservation note: staged whitespace checking flags the original trailing space on generated HTML line73. That line is byte-identical to the preserved source and was intentionally retained; new adapter/style/script files pass their whitespace/syntax checks.
