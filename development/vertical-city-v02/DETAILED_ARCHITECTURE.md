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
- The service revision refines five established cover/column envelopes and adds
  a closed ventilation/power cabinet, three surface-mounted grille meshes and
  maintenance identification. This changes neither the encounter rules nor its
  accepted stair/flank layout. New cabinet placement has independent original
  building and recorded-input body-envelope preflights.
- The current export contains9,880 components in27 modular GLBs,
  287,914 triangles and40,540,440 bytes. These are asset totals, **not a sustained
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

The first detailed slice at commit `4091369` is preserved with
`V02_Detailed_Stage1_Evidence.json`. Its six retained scenarios and new public
extensions passed against manifest `6a43c68f…`. Those results remain versioned
evidence, not a claim that every check has rerun on the later service revision.

`V02_Detailed_First_Input.json` records first-slice walking up and down the new
market stair:28.9 input seconds, continuous support, no injury or power release.
289 actual animated head/hips camera samples found no whole-hero obstruction or
cropping. Between-sample visibility and HUD occlusion remain separate. Actual
gameplay and labelled camera-only inspection PNGs are in `evidence/`.

`V02_Detailed_Regression_Run.json` and `evidence/detailed-regressions/` are
**separate first-slice evidence**. They must be inspected for matching hashes;
an unfinished or failed run is not acceptance. The bounded suite repeats market
rescue/lifecycle, service Echo and public discovery scenarios. It does not replace
the full31-case suite or the full release checks. Earlier graybox reports remain
unchanged and are bound by `V02_Phase4_Gate.json`.

The later service revision writes focused native tests into
`evidence/detailed-service-revision/`. Inspect their status and manifest hash;
an initial camera-only inspection was obstructed by an existing upper landing
and its exact failed capture is retained under `evidence/fixed-defects/`.
The inspection camera was moved below that landing. No gameplay geometry,
contact assertion or power limit was changed to correct the fixture.
The corrected full encounter, supported upper flank, Echo contact, two gallery
escapes and stock-client import checks passed on manifest `b1077f43…`.
`V02_Detailed_Service_Revision_Evidence.json` binds those results to the current
master, source dependencies, GLBs and preserved entries. This detailed-base
milestone admits transit integration; final architectural/reference refinement,
world activity and release acceptance remain unfinished.

`V02_Reference_Appearance.json` executes the original shipped GLB loader and
building-preparation function offline. All eight families have exact position
correspondence to the authoritative loaded reference geometry. The saved Blender
master now assigns their actual per-face color/emission palettes across310
reference objects; `V02_Reference_Appearance_Validation.json` checks this
independently. These reference meshes never enter runtime exports. Blender's
Principled shading remains an interpretation; original-game lighting/shader
equality and the required matched views are not certified.

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
node scripts/vertical-v02/export_reference_appearance.cjs
/Applications/Blender.app/Contents/MacOS/Blender --background --python-exit-code 1 --python scripts/vertical-v02/blender_architecture.py
python3 scripts/vertical-v02/build_architecture_candidate.py
python3 scripts/vertical-v02/validate_architecture.py
python3 scripts/vertical-v02/validate_detailed_graph.py
node scripts/vertical-v02/validate_glbs.cjs assets/city/vertical-v02/detailed/manifest.json
/Applications/Blender.app/Contents/MacOS/Blender --background development/vertical-city-v02/blender/SaintMeridian_V02_Detailed_Master.blend --python-exit-code 1 --python scripts/vertical-v02/validate_architecture_authoring.py
/Applications/Blender.app/Contents/MacOS/Blender --background development/vertical-city-v02/blender/SaintMeridian_V02_Detailed_Master.blend --python-exit-code 1 --python scripts/vertical-v02/validate_reference_appearance.py
python3 scripts/vertical-v02/draw_detailed_architecture.py
node scripts/vertical-v02/test_architecture.cjs
python3 scripts/vertical-v02/run_detailed_local_regressions.py
V02_STAGE=detailed node scripts/vertical-v02/test_detailed_public_extensions.cjs
V02_STAGE=detailed V02_EVIDENCE_RUN=detailed-service-revision node scripts/vertical-v02/test_service_encounter.cjs
V02_STAGE=detailed V02_EVIDENCE_RUN=detailed-service-revision node scripts/vertical-v02/test_service_replay.cjs
```

Browser scenarios must run sequentially. Use the installed web-game skill client
after meaningful changes and inspect its actual image/state/error outputs.
Use a new evidence-run directory when reexecuting versioned scenarios against a
later manifest, so the earlier results stay intact.

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
