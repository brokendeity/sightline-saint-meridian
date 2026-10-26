# V02 first matched visual iteration

Playable candidate: `SIGHTLINE_SAINT_MERIDIAN_V02_VISUAL_CANDIDATE.html?capture=backspool`.
Review page: `V02_VISUAL_REVIEW.html` provides an A/B selector and a matched-camera
baseline/candidate wipe, alongside reference art and the separate Blender render.

It derives from world-life checkpoint `b92d788`; that entry and older stable builds
remain unchanged. The complete game is included. This is an intermediate visual
candidate, **not the completed reference-quality city**.

The two shared inspection bookmarks now use explicit 1664 × 936 output, a 50°
vertical field of view and identical clipping/projection transforms. Actual game
captures and separate Blender renders are provided before and after the changes.
Five landmark probes agree within 0.001 pixel. The approved reference art has no
calibrated camera metadata; these are corresponding compositions, not recovered
exact source cameras. The Blender study uses Principled/AgX shading and a lighting
interpretation; it does not reproduce every native toon/ACES, sky, fog, pavement,
drone or hero effect. The baseline browser report's renderer counters describe
its final post-process pass and must not be used as scene-performance evidence.

The first paired views exposed broad blank original facades and almost black
bridge undersides. Three existing building owners now have 4,215 shallow light
and glazing bays, admitted only where five source rays hit a supported dark plane
and the fittings clear V02 structures. Frames are hollow, panes use a shallow
material depth bias, and occupancy varies deterministically without changing
the city's random seed. Three warm tones, cool glass and dark bays retain the
midnight-blue/cyan/amber direction. These are decorative facade fittings, not new
rooms or functional doors. The original building geometry, transforms, colliders,
roof locations and layout remain intact.

The fittings attach to their original building mesh and follow its visibility,
LOD and destruction owner. A native breach removes bays whose source support is
lost. Collapse hides the owner and its children using the existing game behavior.
Those checks use labelled existing damage APIs; they do not establish legal
high-speed impact inputs or full destruction regression coverage.

An authored reflected-fill field is baked from 232 existing soffit luminaires
at twelve elevations. A shared 23 KB scalar atlas applies modest warm fill only
near those fixtures and to downward-facing architecture. The matching Blender
material uses the same field. It adds no dynamic lights and does not change
global bloom or exposure. This is a controlled lighting approximation, not
physical light-transport recovery.

Raw source GLBs remain available. Lossless gzip packages reduce approximately
24 MB of models to 2.54 MB, with a 141 KB runtime manifest. Native loading uses
the game's existing fflate decoder. Exact byte-for-byte decompression is checked;
this is network optimization, not a GPU or sustained frame-time result. The bays
still add 404,640 triangles and require the final performance pass.

## Reproduction

Run browser jobs sequentially. Use Blender background mode with
`--python-exit-code 1` for the Python authoring/render scripts.

```sh
node scripts/vertical-v02/capture_reference_views.cjs
# Blender: scripts/vertical-v02/blender_reference_views.py
node scripts/vertical-v02/plan_facade_light_bays.cjs
python3 scripts/vertical-v02/bake_soffit_fill.py
# Blender: scripts/vertical-v02/blender_facade_light_bays.py
python3 scripts/vertical-v02/package_visual_assets.py
python3 scripts/vertical-v02/build_visual_candidate.py
node scripts/vertical-v02/validate_facade_exports.cjs
# Blender: scripts/vertical-v02/validate_visual_master.py
node scripts/vertical-v02/test_visual_candidate.cjs
python3 scripts/vertical-v02/compact_visual_reports.py
# Blender: blender_reference_views.py -- --render
# Blender: blender_reference_views.py -- --render --candidate
python3 scripts/vertical-v02/write_visual_evidence.py
```

The Khronos check uses the existing local validator installation under
`output/local-scratch/train-validation`. The installed Develop Web Game client
also ran against the current candidate and its actual screenshot/state were
reviewed. Its short burst establishes import/input readiness only.

`V02_Visual_Iteration_Evidence.json` binds the current masters, raw/packed assets,
source-preservation checks and paired captures. Actual failed readiness/root-name
tests, the mistaken collapse assertion and earlier visual problems remain in
`evidence/fixed-defects/visual-study/` with their scopes visible. Large native fingerprints are indexed by concise JSON
reports with byte-identical full JSON preserved in gzip archives; failed evidence
is retained as well.

## Remaining acceptance work

The city still needs architectural variety and material depth closer to both
approved references, more readable transit composition, lighting/skyline review,
and a compact contextual HUD. Civilian and aerial-vehicle art remains simple.
Static captures do not certify continuous camera motion, mobile rendering or
natural full gameplay. Nine advanced graph timings, all final retained gameplay
regressions and matched active performance runs of at least 60 seconds remain
open. Physical controller/touchscreen playtesting is not claimed.
