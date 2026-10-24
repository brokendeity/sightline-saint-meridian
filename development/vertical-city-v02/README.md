# Saint Meridian V02 development

Phase 1 began from V1 snapshot c3eacd02 on branch feature/saint-meridian-aaa-vertical-city-v02. The preserved integrated entry is SIGHTLINE_BACKSPOOL_WHIP_THROW.html. Current V02 work runs in the separate SIGHTLINE_SAINT_MERIDIAN_V02_GRAYBOX.html candidate; the historical phase notes below are retained.

Run scripts/vertical-v02/export_live_world.cjs with the repository served at 8766, then scripts/vertical-v02/reconcile_site.py and scripts/vertical-v02/draw_live_site.py. The exporter waits for actual imported city, roads, vertical environment and Backspool readiness; captures mesh/compound geometry, route data, live mission anchors, recovery source, support registry and V1 instancing matrices. Export is an initialized-world snapshot, not coverage of every future mission or destruction state.

V02_LiveWorld_Authoritative.json references V02_BuildingGeometry.json by hash. Eight loaded building families plus one shared V1 box geometry are stored. The supplied template was extended and field mappings inspected against the actual runtime. Original blueprint pack is preserved separately in blueprint-source/ and remains a design proposal.

Live reconciliation: all310 outer envelopes match reconstructed reference; imported structure still conflicts with Y52/Z280 and13/44 east-spine segments at each level. Z276 is a nearby box/headroom-clear crossing hypothesis. No route is certified by these box checks. V1's26 failures remain recorded.

Next strict phase: measure real movement through controls, plan a directed ability-aware graph with supported endpoints, fit east galleries around building160, then author/export the Blender graybox. Do not advance to detailed architecture before normal-input loop/route tests pass. Source declarations alone are not measured ability metrics. Detailed modeling, encounters, transit sweeps, gameplay route acceptance, sustained performance and visual acceptance are still NOT TESTED.

## Preliminary movement evidence

`V02_Movement_Measurements.json` and `scripts/vertical-v02/measure_movement.cjs` preserve an exploratory keyboard-input run. These are not certified movement budgets: Flow triggered a plaza obstacle flip, the forward jump met an obstacle, and resetting between trials may retain pending contact impulses. Rerun in isolated, validated clear fixtures before using these distances to design routes. No V02 geometry or movement-power changes are included in this snapshot.

## Current graybox milestone

A separate latest-game candidate now exists: `SIGHTLINE_SAINT_MERIDIAN_V02_GRAYBOX.html?capture=backspool`. Use **Enter V02 district** on its start menu. This derives from the exact current WHIP gameplay, replacing only V1's static vertical prototype in this candidate. The original playable HTML and snapshots remain unchanged.

The editable `blender/SaintMeridian_V02_AAA_Master.blend` contains the 310 actual loaded building meshes as reference-only instances, individual stable architectural components in semantic collections, hidden collision inspection helpers, and separately selected export batches. Reference meshes never enter the runtime GLBs. Do not render both source objects and hidden export batches simultaneously. The runtime export is29 spatial/material chunks, with colliders, structure ownership and candidate Threadrail surfaces under `assets/city/vertical-v02/graybox/`.

Three complete loops pass normal-keyboard traversal with continuous support and no power releases. The complete public ground-to-Y100 station path passes at zero initial Drive bank, using walking and stairs only; no airborne frames or uncommanded sideways corrections; active Halo exposure is recorded separately. Its801m /454.55s walking result establishes accessibility, not final pacing. Momentum and mastery station approaches now pass at zero/full initial bank; the full public roundtrip reachesY128 and returns to ground. Wider recovery/camera/navigation cases, encounters, final architecture, transport sweeps and sustained performance remain open. See `V02_Acceptance_Report.md` and hash-bound `V02_Traversal_Validation.json`.

The first stair pilot found front-riser and top-landing collision stops. Ground contact now treats only new flagged low steps as walkable, retaining the existing0.2m surface rise bound. Stacked-flight spacing was increased to3–3.2m and real station stair/approach openings were cut in Blender. No hero speed, jump, rail or Drive limit was enlarged.

Reproduce the current graybox (Blender5.1.2, Python3, Node and local Playwright used):

```sh
python3 scripts/vertical-v02/design_routes.py
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --python scripts/vertical-v02/blender_graybox.py
python3 scripts/vertical-v02/export_sidecars.py
python3 scripts/vertical-v02/build_candidate.py
python3 scripts/vertical-v02/validate_graybox.py
node scripts/vertical-v02/validate_glbs.cjs
# Serve repository at8766 before the browser tests:
node scripts/vertical-v02/test_loops.cjs
node scripts/vertical-v02/test_public_station.cjs
node scripts/vertical-v02/test_preserved_whip_inputs.cjs
python3 scripts/vertical-v02/report_milestone.py
```

The glTF validation script uses the already installed Khronos validator under `output/local-scratch/train-validation/node_modules/`; browser scripts use local Playwright at `/opt/homebrew/lib/node_modules/playwright`. Extraction archives and executables are not runtime dependencies. The pilot is a separate `?v02pilot=1` fixture; its two flights do not certify the full district. The two failed legacy chain cases are retained separately and require updated asynchronous-cast fixture/timing checks.

Next: functional encounters, navigation/guardrails and broader recovery/physical transfer/camera acceptance. Keep guardrails, camera/contact review and real encounters in the graybox acceptance phase. Do not start detailed architecture or claim the full objective complete while these gates remain open.

## Momentum route milestone

The Blender courtyard at Y84 and16×44m intermediate landing at Y92 expose real vertical faces for four precision cartridge casts. A visible canopy protects the first staging area; the physical rail exits its edge before reaching roof height. No enemy suppression or power-limit changes are used. Two running catches and near-end Pops land atY92 andY100. Both timed routes continue to the same station objective [66.5,100,376]. `V02_Momentum_Full_Zero_Flow.json` and `V02_Momentum_Full_Banked_Flow.json` bind the current entry/manifest; full bank is collected through actual running before timing starts. See `V02_Momentum_Route_Notes.md`.

Ordinary running found repeated low-riser snags that walking did not expose. The new-surface precheck now anticipates one60Hz frame of horizontal travel; exact support rise remains<=.201m. The complete running public route passes with no airborne frames or unexplained horizontal movement. Three exact orthographic source-aware section SVGs are generated by `scripts/vertical-v02/draw_elevations.py`; these complement the five floor sheets and are not gameplay certification.

## Mastery and public roundtrip milestone

Four real climbable service-room roofs reach96/108/120/128m within existing wall limits. An upper rail, supportedZ440 run-up and118/108m maintenance roofs provide a safe stepped descent to the station. Full zero-start/no-release and full-start/one-brake input tests pass; the latter consumes an actual compatible landing impulse. A short-catch pilot recovers on the upper deck and continues without a reset. See `V02_Mastery_Route_Notes.md`.

The complete public ground→A/C/D→Y128→B→ground circuit passes with no jumps, power use, damage or unsupported frames. It found and fixed a0.65m station exit gap with a visible side connection beside the final stair flight. An actual high drop also found a grouped-owner carving crash: immutable new graybox owners are now respected without disabling collision, injury or impact effects; original imported-building carving remains functional. Final circulation evidence is hash-bound; the full V02 objective remains incomplete.

## Service-yard combat prototype

A real multi-level encounter now uses the shared damage-taking sparring system. Enter via the west access ring at[62,52,337], then pressI, controllerY, or the local Start button. The lower deck,55.2m mezzanine and58.4m overhead route are Blender-authored, with physical stairs and cover. Existing Halo global behavior remains active. Opponent models remain explicit prototypes.

`test_service_encounter.cjs` proves three supported spawns, atomic placement failure, grounded access to both upper decks and victory through legal combat inputs. `test_service_lifecycle.cjs` covers simulated-controller and CDP-touch start, pause, restart without healing, actual hero-selector cleanup, respawn, coexistence with street contracts and natural defeat from incoming strikes. Broader Echo/knockback/camera/escape cases remain open, along with the two other encounters. SeeV02_Encounter_Design.md.

After changes, run `python3 scripts/vertical-v02/run_graybox_regressions.py` for all listed circulation, local-combat and retained-input scenarios, then `python3 scripts/vertical-v02/report_milestone.py`. The runner records exact hashes and per-job logs. It does not certify the full city. Original builds and saved GitHub snapshot refs are unchanged.

## Market-rescue prototype

At the lower market access[62,24,375], pressI/controllerY or the contextual Start button. Find the resident, isolate the cabinet, return and escort them to assembly. Current scenic pedestrian appearance is reused with a new, separately owned escort adapter. NPCs follow validated ground steps; jumps, leaving the area and blocked shortcuts do not teleport them. Two surrounding residents circulate independently. The original courier rescue remains unchanged.

Normal-input evidence includes a complete ground-to-market approach and northern extraction, a southern escort from a labelled local setup, and interruption/input/failure cases. Civilian bases/footprint support are validated; final pedestrian animation/contact presentation and camera acceptance remain open. SeeV02_Encounter_Design.md.

The full regression runner now contains16sequential scenarios, fingerprints both external encounter modules as well as entry/manifest, and rejects any runtime change during acceptance. The aggregate report requires current passing reports and exact saved-Blender encounter-marker alignment. This remains a prototype milestone; pursuit, POIs, guardrails/recovery/graph admission and all later architecture/transit/visual/performance gates remain unfinished.
