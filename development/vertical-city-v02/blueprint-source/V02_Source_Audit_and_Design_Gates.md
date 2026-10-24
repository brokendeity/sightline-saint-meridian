# SAINT MERIDIAN — V02 ARCHITECTURAL SITE STUDY + AAA LEVEL DESIGN QUALITY GATE

**Baseline:** `brokendeity/sightline-saint-meridian` / `feature/saint-meridian-vertical-megacity-v1`, reviewed 2026-10-24.

**Status:** Current source code and audit inspected. Proposed V02 site improvements have **not** been built, collision-tested or playtested. The original 310-building footprint overlay is a **2026-10-19 reconstructed envelope**, **not** an authenticated runtime export of this branch. Dimensions and positions must be calibrated in the game's actual world.

## What changed since the previous blueprint

The old corridor at X=240–850, Z=-225..240 belongs to the earlier proposed V01 site study and must not be treated as implemented. The current branch's `assets/city/vertical/layout.json` defines a different vertical corridor at **X≈80, Z=180–460**, with cross-bridges at **(Z=210, Y=24), (Z=280, Y=52), (Z=350, Y=84), (Z=430, Y=128)**. The Y52/Z280 crossing is **rejected** by building clearance. The GitHub audit records **26 rejected structural pieces**, **1,474 accepted primitives**, **952 vertical collision boxes**, **24 scenic aerial vehicles** at **Y=38/65/114**, and a **4-car train at Y=100**. The Hi3D front carriage is integrated; middle/rear cars are procedural placeholders.

The repository itself states this is **not** a completed reference-quality playable release: full route continuity, camera, collisions/clearances, encounter activities, vehicle physics and performance acceptance remain pending.

## Architectural diagnosis

The new prototype stacks vertical bridges but has no authoritatively verified full 3D navigation graph. A rejected mid bridge and rejected east galleries prevent assuming continuous routes. The current static centerline train clearance samples are not a swept envelope for all four cars. Scene composition cannot substitute for actual movement, mission and collision coverage.

## V02 proposal (not yet built)

Keep the current corridor and add three physically connected player loops with more than one entry/exit; replace rejected Y52 crossing with clearance-adapted geometry; segment and fit the east/west galleries to actual facades instead of accepting whole-span reject; add two vertical transfer hubs and carefully fitted secondary connectors. Proposals are shown in A-03 and V02 manifest. Do not lock their exact X/Z until an actual live world export is acquired.

**Lower loop:** two compatible Y24 bridges and segmented side walkways; ground approach plus civilian gallery/rescue hub.

**Mid loop:** two compatible Y52 crossings, side galleries and a multi-tier service-yard combat hub. V1 mid crossing remains rejected until reconstructed and verified.

**Upper loop:** two Y84 crossings, short side connections, transfers to transit Y100 and upper roof Y128. Fast/high-risk Threadrail routes use separate physical surface checks.

**Player choice:** one meaningful objective at the train interchange with three actual approaches: (1) public stairs/lifts/walkways with no impulse requirements; (2) faster momentum-based Threadrail shortcuts; (3) high-skill ascent / Rail Pop / Afterstep transfer. All must be tested at zero and full bank resources.

**World activity:** commuter/transit flow, public sky-market, Civic Halo threat/response, service yard maintenance, civilian incident; no claim that these systems currently exist.

## Mandatory quality gate

1. **Live export before Blender detail:** export 310 lot transforms, compound collision volumes, roofs, roads, mission/spawn blockers, new structures and support ownership; reconcile IDs and coordinate axes.
2. **Sustainable graph:** test three rings, 3 routes to station, inter-level links, recovery drop locations, and one return loop, using normal movement without teleporting.
3. **Physical envelope:** Threadrail spans 6–100m and max slope 55° by actual game solver; full physical throws and surface/material validity are additional conditions. Also sweep moving train/taxi envelopes and camera motion through bridges.
4. **Encounter usability:** chase at train, layered combat at service yard, public rescue at market, at least 3 distinct landmarks and 4 discoverable points of interest.
5. **Baseline protection:** no original city duplicate, missions and road graph unchanged; no new destruction ghosts or invisible blockers.
6. **Performance:** matched 60s gameplay recordings and load/CPU/drawcall/triangle/memory metrics; screenshot A/B only count as visual evidence.
7. **Production release:** graybox gameplay gates pass BEFORE full Blender materials and new paid 3D assets.

## Honesty and limitations

This study is a **source-reviewed and coordinate-schematic proposal**, not an as-surveyed CAD drawing. The only current branch evidence inspected is source and recorded GitHub tests, not an independent execution of the live game in this session. The V02 routes are not certified as geometrically feasible because live imported building collider meshes/active walkable components are not available as a spatial dump. All proposed changes need a real full-height physics pass before becoming placement instructions.

## Files

- `V02_A01...A06` architectural PNG sheets
- `Saint_Meridian_V02_CurrentBranch_Architectural_Site_Study.pdf` six-sheet PDF
- `V02_CurrentBranch_SiteStudy_Manifest.json` source facts and proposed geometry/graph
- `V02_AbilityRoute_Matrix.csv` movement network, distances and resource prerequisites
- `V02_Existing_Buildings_ReferenceOnly.csv` previous reconstructed lots (reference only)
- `Blender_V02_Blockout_From_Manifest.py` read-only Blender visualization of proposed geometry (not runtime acceptance)
