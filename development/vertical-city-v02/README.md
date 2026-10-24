# Saint Meridian V02 development

Phase 1 began from V1 snapshot c3eacd02 on branch feature/saint-meridian-aaa-vertical-city-v02. Current integrated entry remains SIGHTLINE_BACKSPOOL_WHIP_THROW.html; no gameplay/environment geometry has been changed yet.

Run scripts/vertical-v02/export_live_world.cjs with the repository served at 8766, then scripts/vertical-v02/reconcile_site.py and scripts/vertical-v02/draw_live_site.py. The exporter waits for actual imported city, roads, vertical environment and Backspool readiness; captures mesh/compound geometry, route data, live mission anchors, recovery source, support registry and V1 instancing matrices. Export is an initialized-world snapshot, not coverage of every future mission or destruction state.

V02_LiveWorld_Authoritative.json references V02_BuildingGeometry.json by hash. Eight loaded building families plus one shared V1 box geometry are stored. The supplied template was extended and field mappings inspected against the actual runtime. Original blueprint pack is preserved separately in blueprint-source/ and remains a design proposal.

Live reconciliation: all310 outer envelopes match reconstructed reference; imported structure still conflicts with Y52/Z280 and13/44 east-spine segments at each level. Z276 is a nearby box/headroom-clear crossing hypothesis. No route is certified by these box checks. V1's26 failures remain recorded.

Next strict phase: measure real movement through controls, plan a directed ability-aware graph with supported endpoints, fit east galleries around building160, then author/export the Blender graybox. Do not advance to detailed architecture before normal-input loop/route tests pass. Source declarations alone are not measured ability metrics. Detailed modeling, encounters, transit sweeps, gameplay route acceptance, sustained performance and visual acceptance are still NOT TESTED.

## Preliminary movement evidence

`V02_Movement_Measurements.json` and `scripts/vertical-v02/measure_movement.cjs` preserve an exploratory keyboard-input run. These are not certified movement budgets: Flow triggered a plaza obstacle flip, the forward jump met an obstacle, and resetting between trials may retain pending contact impulses. Rerun in isolated, validated clear fixtures before using these distances to design routes. No V02 geometry or movement-power changes are included in this snapshot.

## Current graybox milestone

A separate latest-game candidate now exists: `SIGHTLINE_SAINT_MERIDIAN_V02_GRAYBOX.html?capture=backspool`. Use **Enter V02 district** on its start menu. This derives from the exact current WHIP gameplay, replacing only V1's static vertical prototype in this candidate. The original playable HTML and snapshots remain unchanged.

The editable `blender/SaintMeridian_V02_AAA_Master.blend` contains the 310 actual loaded building meshes as reference-only instances, individual stable architectural components in semantic collections, hidden collision inspection helpers, and separately selected export batches. Reference meshes never enter the runtime GLBs. Do not render both source objects and hidden export batches simultaneously. The runtime export is27 spatial/material chunks, with colliders, structure ownership and candidate Threadrail surfaces under `assets/city/vertical-v02/graybox/`.

Three complete loops pass normal-keyboard traversal with continuous support and no power releases. The complete public ground-to-Y100 station path passes at zero initial Drive bank, using walking and stairs only; no damage, airborne frames or uncommanded sideways corrections. Its801m /454.55s walking result establishes accessibility, not final pacing. Faster approaches, return/recovery routes, encounters, final architecture, transport sweeps and sustained performance remain open. See `V02_Acceptance_Report.md` and hash-bound `V02_Traversal_Validation.json`.

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

Next: implement and physically prove the momentum and mastery approaches, then return/recovery and secondary transfers. Keep guardrails, camera/contact review and real encounters in the graybox acceptance phase. Do not start detailed architecture or claim the full objective complete while these gates remain open.
