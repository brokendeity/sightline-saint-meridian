# Saint Meridian V02 development

Phase 1 began from V1 snapshot c3eacd02 on branch feature/saint-meridian-aaa-vertical-city-v02. Current integrated entry remains SIGHTLINE_BACKSPOOL_WHIP_THROW.html; no gameplay/environment geometry has been changed yet.

Run scripts/vertical-v02/export_live_world.cjs with the repository served at 8766, then scripts/vertical-v02/reconcile_site.py and scripts/vertical-v02/draw_live_site.py. The exporter waits for actual imported city, roads, vertical environment and Backspool readiness; captures mesh/compound geometry, route data, live mission anchors, recovery source, support registry and V1 instancing matrices. Export is an initialized-world snapshot, not coverage of every future mission or destruction state.

V02_LiveWorld_Authoritative.json references V02_BuildingGeometry.json by hash. Eight loaded building families plus one shared V1 box geometry are stored. The supplied template was extended and field mappings inspected against the actual runtime. Original blueprint pack is preserved separately in blueprint-source/ and remains a design proposal.

Live reconciliation: all310 outer envelopes match reconstructed reference; imported structure still conflicts with Y52/Z280 and13/44 east-spine segments at each level. Z276 is a nearby box/headroom-clear crossing hypothesis. No route is certified by these box checks. V1's26 failures remain recorded.

Next strict phase: measure real movement through controls, plan a directed ability-aware graph with supported endpoints, fit east galleries around building160, then author/export the Blender graybox. Do not advance to detailed architecture before normal-input loop/route tests pass. Source declarations alone are not measured ability metrics. Detailed modeling, encounters, transit sweeps, gameplay route acceptance, sustained performance and visual acceptance are still NOT TESTED.
