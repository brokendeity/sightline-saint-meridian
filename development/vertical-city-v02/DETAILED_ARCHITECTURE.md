# Detailed architecture candidate

This is a separate phase5 work build, derived from the phase4 accepted graybox
at commit `c33d9f5e30e88b4c7bbac58c9a27a7c4e8f7d0a8`. It is **not the completed
V02 city** and does not replace the original game or the accepted graybox.

Open `SIGHTLINE_SAINT_MERIDIAN_V02_DETAILED.html?capture=backspool` through the
local project server. The street directory at X55/Z210 supplies ordinary public
routes to the market, service area, transit information and observation deck.

## Actual authored additions

- A separate saved `blender/SaintMeridian_V02_Detailed_Master.blend` retains the
  310 existing reference buildings and all required semantic collections.
- All 9,236 accepted contact records retain their exact owner, collider, support
  and stair attributes. Their visible meshes gain refined edges, steel/glass
  parapets and metre-scaled packed PBR textures.
- The suspended market has a real second public level at27.6m. Twenty18cm
  risers along its north edge connect it to the lower gallery. The storefront
  below is a closed architectural volume, with framed glass and supply display;
  it is not advertised as an interactive interior. Stalls have framed counters,
  recessed warm fixtures and physical Blender-authored identification lettering.
- The transit landmark has a layered cantilever canopy on its supported fins.
  Observation has an asymmetric crown and a separate human-scale sheltered
  pavilion with wind protection and an open west entrance.
- The current export contains9,869 components in27 modular GLBs,
  285,656 triangles and40,317,272 bytes. These are asset totals, **not a sustained
  rendering-cost or final-performance result**. Shared palette materials and
  duplicate imported texture disposal are implemented; further optimization
  belongs to the remaining performance work.

## Evidence boundaries

`V02_Detailed_Authoring_Validation.json` checks the **saved Blender objects**,
their actual bounds, UVs, material assignments and packed images. It also checks
18 market/pavilion support contacts. This is geometric authoring evidence,
not structural engineering certification.

`V02_Detailed_Compatibility.json` confirms exact preservation of accepted contact
records, no new overlap with the authoritative original building volumes, and no
new body-envelope intersection at recorded graybox input positions. The latter
is a preflight against recorded points, not current input replay or continuous
swept clearance.

`V02_Detailed_First_Input.json` records actual walking up and down the new
market stair:28.9 input seconds, continuous support, no injury or power release.
289 actual animated head/hips camera samples found no whole-hero obstruction or
cropping. Between-sample visibility and HUD occlusion remain separate. Actual
gameplay and labelled camera-only inspection PNGs are in `evidence/`.

`V02_Detailed_Regression_Run.json` and `evidence/detailed-regressions/` are
**separate current-build evidence**. They must be inspected for current status;
an unfinished or failed run is not acceptance. The bounded suite repeats market
rescue/lifecycle, service Echo and public discovery scenarios. It does not replace
the full31-case suite or the full release checks. Earlier graybox reports remain
unchanged and are bound by `V02_Phase4_Gate.json`.

`V02_Detailed_Movement_Graph.json` and `V02_Detailed_AbilityRoute_Matrix.csv`
include131 nodes and283 directed edges. All edges have explicit ability,
distance, height change, resource, time-estimate, risk and recovery fields.
Nine advanced-edge time values remain explicitly unmeasured; their individual
time evidence is a remaining design-data requirement, not a fabricated estimate.
The old graph remains immutable. Two2cm rail attachment offsets remain visible;
the old recovery drop's2m endpoint mismatch now has an explicit landing node and
grounded exit. Schema/topology checks do not certify current native traversal.

## Reproduction

Run these from the repository root, with the existing local server on8766:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --python-exit-code 1 --python scripts/vertical-v02/blender_architecture.py
python3 scripts/vertical-v02/build_architecture_candidate.py
python3 scripts/vertical-v02/validate_architecture.py
python3 scripts/vertical-v02/validate_detailed_graph.py
node scripts/vertical-v02/validate_glbs.cjs assets/city/vertical-v02/detailed/manifest.json
/Applications/Blender.app/Contents/MacOS/Blender --background development/vertical-city-v02/blender/SaintMeridian_V02_Detailed_Master.blend --python-exit-code 1 --python scripts/vertical-v02/validate_architecture_authoring.py
node scripts/vertical-v02/test_architecture.cjs
python3 scripts/vertical-v02/run_detailed_local_regressions.py
V02_STAGE=detailed node scripts/vertical-v02/test_detailed_public_extensions.cjs
```

Browser scenarios must run sequentially. Use the installed web-game skill client
after meaningful changes and inspect its actual image/state/error outputs.

## Remaining full-goal work

This pass still needs broader architectural refinement, useful commercial and
service detail, building/interface continuity, actual matched Blender/browser
reference views, and full current-build gameplay/camera acceptance. Prototype
encounter actors and the large inherited debug-like HUD are visible limitations.

The inherited train still has three sampled carriage-pair envelope conflicts;
the balanced block-loop route is only an offline proposal. Actual train
infrastructure, carriage consistency, boarding, swept clearance, aerial traffic
and ambient world activity remain phase6 work. Lighting/reference acceptance and
matched60-second performance plus full retained-game release checks remain
phases7–8. No paid generation was used or requested for this pass.
