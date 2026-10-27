# Paused city views — V02 visual-work candidate

`SIGHTLINE_SAINT_MERIDIAN_V02_TRANSIT_VIEWS.html` derives from the current coffered architecture/contact build. It contains the complete game. The source entry and all nine earlier protected entries remain byte-identical. Runtime architecture, lighting, geometry, resources, physics, missions and gameplay camera policy are unchanged.

Open **Pause / Tools → District → View the city**. Choose **High-city overlook** or **Lower-city canyon**. Arrow keys and controller D-pad left/right change views. **Back to tools**, Escape, or controller B/Start returns to the native paused menu. Resume remains a separate native action. Touch controls use 44px minimum hit targets.

The views pause the existing simulation and move only the presentation camera. Native pause still cancels unfinished movement/power actions according to its established rules; tests compare against that post-pause state. Inspection cannot resume play, activate hero-switch chords, bank resources, jump or throw cartridges. Player position, velocity, health, replay slots, Drive bank, mission counters and world clocks remain at the paused snapshot. Closing restores the camera position, quaternion, up vector, lens and clipping values. Resize uses the current viewport aspect. Native camera-controller state is never edited.

## Blender and actual browser evidence

The single contract is `assets/city/vertical-v02/reference_views.json`. It declares authored corresponding compositions, because the reference art has no calibrated camera metadata. The old `V02_Reference_Views.json` and its old cameras are retained.

`blender/SaintMeridian_V02_Transit_Views.blend` forks the validated coffered master and adds `V02-transit-camera-A` and `V02-transit-camera-B`. The saved-source validation checks all 40,494 pre-existing objects: mesh vertices, UVs, polygon/material bindings, world transforms and custom properties remain unchanged. No runtime geometry re-export occurs.

`evidence/transit-views/browser-A.png` and `browser-B.png` are actual in-game full-page images. `world-A.png` and `world-B.png` retain the corresponding renderer canvases. `blender-A.png` and `blender-B.png` are actual saved-source Cycles renders at 16 samples. Projection agreement is under 0.004 pixels at the five test landmarks; this establishes optical agreement only. Native toon/ACES presentation and Blender Principled/AgX presentation differ visibly. These images do **not** pass the final reference-quality gate.

The overlook now exposes the four-car train along the canyon. The lower view exposes the layered bridge undersides and traffic; the train itself remains occluded. Plain tower faces, the heavy central support mass, sparse warm balcony detail and insufficient skyline variety still prevent matching the approved art. Camera reframing is not a replacement for the remaining architecture work.

## Tests and reproduction

Run from the repository root with the local HTTP server on 8766:

```sh
python3 scripts/vertical-v02/build_views_candidate.py
node scripts/vertical-v02/test_views_candidate.cjs
V02_HUD_ENTRY=SIGHTLINE_SAINT_MERIDIAN_V02_TRANSIT_VIEWS.html V02_HUD_RUN=transit-views-hud V02_HUD_REPORT=V02_Views_HUD.json node scripts/vertical-v02/test_hud_candidate.cjs
/Applications/Blender.app/Contents/MacOS/Blender --background --python-exit-code 1 --python scripts/vertical-v02/blender_transit_views.py
/Applications/Blender.app/Contents/MacOS/Blender --background --python-exit-code 1 --python scripts/vertical-v02/render_transit_views.py
python3 scripts/vertical-v02/write_views_evidence.py
```

The Blender authoring script creates a fresh fork from the immutable coffered source, never from a previously edited camera fork. Eight focused inspection groups and fifteen retained HUD/input groups pass with no console errors. Keyboard, simulated standard controller and browser touch emulation are covered. Physical controller/touchscreen playtesting remains open. The test's first API-name failure is retained in `evidence/transit-views/harness-api-failure.json`; it was a harness typo, not an observed gameplay failure.

The installed Develop Web Game client also ran unchanged through the committed Metal launcher. Its actual PNG/state are in `evidence/stock-transit-views`. This short canvas smoke does not certify movement routes, DOM layout or sustained performance. The state retains substantial simulation CPU cost and dropped time; it must not be presented as a performance pass.

`V02_Views_Evidence.json` binds the candidate, source inverse, runtime manifest, protected entries, source master, native tests, Blender renders and stock evidence. Full city work remains active: reference-quality architecture/materials, the remaining advanced-edge timings, complete final retained-gameplay regressions and matched active 60-second performance recordings are still required.

The generated HTML retains the source entry’s existing trailing space on line 73 so the inverse comparison remains byte-exact. `git diff --check` reports that inherited line; the new camera modules have no whitespace errors. `evidence/transit-views/failure.png` belongs to the retained initial harness API failure, not the passing final run.
