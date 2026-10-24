# CODEX 6.1 EXTRA HIGH — SAINT MERIDIAN V02
## AAA LEVEL DESIGN + BLENDER-FIRST VERTICAL MEGACITY IMPLEMENTATION

# PRIMARY MISSION

Transform the CURRENT PLAYABLE Saint Meridian game into a genuinely interconnected, deeply layered futuristic megacity, using the attached **Saint Meridian V02 Architectural Site Study** as the starting design.

This is not simply an environment modeling assignment.

It is an **AAA-quality level-design, architecture, gameplay integration and world-building assignment.**

The finished city must combine:

- The traversal-driven environmental design philosophy of Marvel's Spider-Man.
- The believable living-world design philosophy of GTA V.
- The multi-layered combat, pursuit and traversal philosophy of Batman: Arkham Knight.
- The extreme architectural verticality of The Fifth Element.
- The established visual identity and gameplay systems of Saint Meridian.

Do not copy another game's layout or assets.

Use their design principles to build an original open-world environment designed specifically for the Moniker universe and Backspool's movement abilities.

**BLENDER IS THE MAIN ARCHITECTURAL AUTHORING ENVIRONMENT.**

**THREE.JS IS THE RUNTIME GAME ENGINE.**

**HI3D IS AN OPTIONAL SOURCE FOR DISTINCTIVE MISSING ASSETS.**

**THE EXISTING PLAYABLE CITY IS THE FOUNDATION.**

**THE V02 BLUEPRINT IS A PROPOSED DESIGN, NOT YET A VALIDATED LEVEL.**

Implement the actual environment. Do not stop at providing a plan or making concept renders.

---

# 1. USE THE CORRECT GITHUB VERSION

Repository:

`brokendeity/sightline-saint-meridian`

Current megacity branch:

`feature/saint-meridian-vertical-megacity-v1`

Use the latest verified playable state on this branch, incorporating any newer relevant commits if they exist.

The current integrated game entrypoint is documented as:

`SIGHTLINE_BACKSPOOL_WHIP_THROW.html`

Inspect and verify this before building.

The separate environment entrypoint is:

`SIGHTLINE_VERTICAL_MEGACITY_V1.html`

Do not confuse this with the latest integrated gameplay build.

Check:

- Current branch head.
- Current playable entrypoint.
- Current build scripts.
- Current snapshot manifest.
- Existing traversal implementation.
- Existing vertical-city implementation.
- Existing building and road data.
- Existing tests.
- Current assets.

Create a new branch for V02, for example:

`feature/saint-meridian-aaa-vertical-city-v02`

Do not overwrite main, V1, previous playable builds or protected snapshots.

Preserve all existing Backspool animations, cartridge mechanics, visual effects, movement, combat, missions and character switching.

---

# 2. READ THE ATTACHED BLUEPRINT PACK

The attachment contains:

- Six architectural blueprint sheets.
- The V02 site-study manifest.
- Existing reconstructed building references.
- The ability and route matrix.
- A Blender blockout script.
- A current-game world-export template.
- The source audit.
- The Codex implementation handoff.
- Supporting documentation.

Begin by reading:

`START_HERE.md`

`CODEX_V02_HANDOFF.md`

`V02_Source_Audit_and_Design_Gates.md`

`V02_CurrentBranch_SiteStudy_Manifest.json`

`V02_AbilityRoute_Matrix.csv`

Then review:

`V02_A01_Existing_Citywide.png`

`V02_A02_CurrentBranch_AsBuilt.png`

`V02_A03_Proposed_AAA_Overlay.png`

`V02_A04_Vertical_Section.png`

`V02_A05_Traversal_Loops.png`

`V02_A06_Acceptance_Gates.png`

### SOURCE AUTHORITY

The current game's actual loaded geometry takes precedence over the old reconstructed building footprints.

The blueprint's original lot references were reconstructed from an earlier game candidate.

They are not guaranteed to match every imported collider and facade in the latest branch.

The proposed V02 geometry is a design proposal.

Therefore, use the blueprint to establish design intent, but verify its coordinates against the real current game before detailed modeling.

Never silently treat proposed coordinates as production-validated.

---

# 3. AUDIT THE EXISTING V1 VERTICAL CITY

Inspect the current implementation:

`assets/city/vertical/layout.json`

`scripts/game_vertical_city.js`

`docs/vertical-city/IMPLEMENTATION.md`

`docs/vertical-city/HI3D_TRAIN_INTEGRATION.md`

`output/vertical-city/audit.json`

`scripts/build_vertical_city.py`

`scripts/test_vertical_city.cjs`

Also inspect the current building import, road generation, destruction, navigation, collision and Threadrail systems.

### VERIFIED EXISTING DESIGN PARAMETERS

The V1 corridor is located approximately at:

X = 80 meters.

Z = 180–460 meters.

Current elevated levels:

- Y = 24 m
- Y = 52 m
- Y = 84 m
- Y = 128 m

Current crossing positions:

- Bridge 0: Z210, Y24 — admitted geometry.
- Bridge 1: Z280, Y52 — rejected by building clearance.
- Bridge 2: Z350, Y84 — admitted geometry.
- Bridge 3: Z430, Y128 — admitted geometry.

The repository's recorded audit includes:

- 310 original building lots preserved.
- 1,474 accepted vertical primitives.
- 26 rejected structural placements.
- 952 vertical collision boxes.
- 24 scenic flying vehicles.
- A four-car moving train at approximately Y100.
- Three aerial traffic elevations at Y38, Y65 and Y114.
- A real Hi3D-generated front carriage.
- Procedural placeholder middle/rear train carriages.

These values are based on the recorded V1 audit. Recheck against the current live build.

### IMPORTANT EXISTING LIMITATIONS

The V1 implementation is an early playable environment prototype, NOT a fully accepted AAA vertical level.

Known shortcomings include:

1. Rejected bridge and gallery components.
2. Missing or incomplete cross-level connections.
3. Incomplete pedestrian destination design.
4. No verified uninterrupted ground-to-upper-to-ground route.
5. Simplified train and traffic behavior.
6. Unverified full train swept-clearance behavior.
7. A large number of collision proxies requiring performance review.
8. No comprehensive multi-route gameplay acceptance.
9. No completed combat/rescue/pursuit spaces.
10. Visual results not yet matching the approved architectural reference images.

Do not erase these failures from the report.

Use them as problems to solve.

---

# 4. EXPORT THE REAL GAME GEOMETRY

Before creating detailed architecture, export the real current world.

Use the attached:

`Export_Live_CurrentBranch_World.cjs`

as a starting point.

Inspect and fix any assumptions in the script.

Run the current game through a local server and Playwright.

Export:

- Actual building IDs.
- Building transforms.
- Building world-space footprints.
- Building heights.
- Compound structural collision volumes.
- Available roof surfaces.
- Original ground-road nodes and segments.
- Active driving lanes.
- Active pedestrian routes.
- Mission anchors.
- Spawn and recovery locations.
- Existing vertical structures.
- Existing collision proxies.
- Structural ownership information.
- Important player-accessible surfaces.

Produce an authoritative export:

`V02_LiveWorld_Authoritative.json`

Reconcile it against the blueprint reference geometry.

Produce:

`V02_Reconciled_Site_Manifest.json`

Also create a discrepancy report describing any adjustments.

### DO NOT DUPLICATE THE ORIGINAL CITY

The existing 310 buildings are already present in the game.

The Blender project may contain them as reference geometry.

But the runtime export must not load a duplicate version of the original city.

New geometry must be either:

- A clearly identified addition.
- An explicitly approved replacement.
- A decorative attachment with correct structural ownership.

Never create overlapping street networks, duplicated building shells or conflicting invisible collision surfaces.

---

# 5. AAA LEVEL DESIGN COMES BEFORE DETAILED MODELING

This is the most important section.

Do not immediately create a beautiful city in Blender.

First make the urban geometry fun to move through.

Study the relationship between:

- Traversal.
- Building spacing.
- Player visibility.
- Route choice.
- Environmental landmarks.
- Encounter design.
- Navigation.
- Exploration.
- Civilian activity.
- Recovery from mistakes.

The city must support enjoyable gameplay for many hours, not only an impressive first impression.

## MARVEL'S SPIDER-MAN DESIGN PRINCIPLE

Build the city around the player's movement capabilities.

Measure actual:

- Running speed.
- Flow Run speed.
- Jump distance and height.
- Wall-running behavior.
- Wall-climbing capability.
- Threadrail throw reach.
- Threadrail riding speed.
- Threadrail transfer distance.
- Rail Pop launch distance.
- Afterstep Drive acceleration.
- Air control.
- Fall-braking capability.
- Safe landing requirements.

Use those measurements to determine:

- Building spacing.
- Platform dimensions.
- Traversal corridor widths.
- Anchor placement.
- Landing opportunities.
- Vertical transfer spacing.
- Camera clearance.
- Recovery platforms.

Do not design traversal distances based only on how attractive they appear in Blender.

## BATMAN: ARKHAM KNIGHT DESIGN PRINCIPLE

Support multiple ways of interacting with the same location.

A rooftop or suspended service platform should potentially support:

- Approach from above.
- Approach from below.
- Lateral traversal.
- Combat.
- Stealth where supported.
- Escape.
- Pursuit.
- Environmental interaction.

Do not make every platform serve only as a place to land.

## GTA V DESIGN PRINCIPLE

Give the city believable functional purpose.

Ask:

- Why does this bridge exist?
- Who uses this elevated road?
- Where are commuters going?
- Where does the train stop?
- What businesses occupy these platforms?
- Where do workers access service equipment?
- How do civilians reach their homes?
- Where do deliveries arrive?
- How does Civic Halo patrol different elevations?

Architecture should reflect the practical needs of the city.

Avoid decorative skybridges that connect to blank walls.

---

# 6. REBUILD THE LEVEL AS A 3D NAVIGATION GRAPH

Create a directed, ability-aware spatial navigation graph.

Nodes should represent meaningful gameplay positions:

- Ground access points.
- Public walkways.
- Rooftops.
- Commercial platforms.
- Service yards.
- Transit stations.
- Staircases.
- Lifts.
- Wall-running transitions.
- Safe Threadrail launch positions.
- Valid Threadrail landing positions.
- Safe descent points.
- Mission destinations.
- Recovery platforms.

Edges should represent actual movement possibilities.

For every edge, record:

- Source and destination.
- Elevation change.
- Horizontal and true 3D distance.
- Movement ability.
- Resource requirements.
- Directionality.
- Expected traversal time.
- Difficulty.
- Risk.
- Failure recovery.
- Validation status.

### DISTINGUISH MOVEMENT TYPES

Do not treat everything as a generic traversable edge.

Differentiate:

- Walking.
- Running.
- Flow Run.
- Stairs.
- Elevator.
- Wall run.
- Wall climb.
- Jump.
- Threadrail.
- Rail Pop.
- Afterstep-assisted transfer.
- Controlled drop.

Do not treat vertically aligned platforms as walk-connected simply because their top-down positions match.

### THREADRAIL CONSTRAINTS

The existing inspected solver uses:

Minimum span: 6 meters.

Maximum span: 100 meters.

Maximum slope: 55 degrees.

Verify these limits on the active branch.

The straight-line distance and slope only establish initial geometric eligibility.

Real Threadrail connections must also pass:

- Projectile reach.
- Physical attachment.
- Surface validity.
- Collision clearance.
- Suitable player access.
- Landing feasibility.
- Actual game-state requirements.

Do not widen Backspool's power limits to compensate for poor architectural layout.

Redesign geometry and anchor opportunities instead.

---

# 7. IMPLEMENT THREE CONNECTED CITY LOOPS

The V02 blueprint proposes three gameplay loops.

Use these as the starting topology.

Their coordinates and connections must be verified against the live scene.

## LOOP A — LOWER CITY

Primary elevation:
Y24.

Proposed route:

West lower walkway → first crossing → east lower walkway → second crossing → return to west.

Include an accessible connection to ground level.

This loop should emphasize:

- Pedestrian activity.
- Commercial spaces.
- Civilian rescue opportunities.
- Easier navigation.
- Recoverable drops.
- Ground-level accessibility.

Create meaningful destinations along the route.

## LOOP B — MID-CITY

Primary elevation:
Y52.

Proposed route:

West mid-level gallery → redesigned crossing → eastern service area → secondary crossing → west return.

The current V1 crossing at Z280 is rejected.

It must be rebuilt or repositioned using real building clearances.

Include:

- Service structures.
- Vertical shortcuts.
- Combat opportunities.
- Multiple entries.
- Transit approaches.
- Alternate traversal lines.

## LOOP C — HIGH CITY

Primary elevation:
Y84, connecting upward to Y100 and Y128.

This loop should emphasize:

- Fast Threadrail traversal.
- Elevated train infrastructure.
- Higher-risk shortcuts.
- Rooftop movement.
- Rail transfers.
- Afterstep timing.
- High-altitude pursuits.

Design several routes between the transit interchange and upper rooftops.

### LOOP QUALITY REQUIREMENTS

Every loop must:

- Be physically traversable.
- Connect back to itself.
- Have more than one useful connection to another layer.
- Contain at least one meaningful destination or encounter.
- Offer recovery after common failed movement attempts.
- Have recognizable navigation cues.

The three loops must form one connected district network.

Do not produce three isolated elevated racetracks.

---

# 8. USE THE PROPOSED V02 ARCHITECTURAL ADDITIONS

Use the V02 manifest as an initial layout hypothesis.

### Proposed additional crossings

`V2-BR-L2`

Lower return crossing near Z350, Y24.

`V2-BR-M1`

Redesigned rejected crossing near Z280, Y52.

`V2-BR-M2`

Additional mid-city crossing near Z350, Y52.

`V2-BR-H2`

Upper return crossing near Z430, Y84.

### Side pedestrian spines

The proposed design includes west/east circulation near:

X55 and X105.

Initial elevation groups:

Y24, Y52 and Y84.

Build these as segmented, building-aware circulation structures.

Do not place one long platform through multiple solid buildings.

Use separate:

- Building attachment portals.
- Terrace segments.
- Walkways.
- Short bridges.
- Service landings.
- Safe transitions.

### Vertical transfer hubs

The V02 proposal includes:

`V2-VT-A`

Ground-to-mid public stair/lift access.

`V2-VT-B`

Secondary elevator/service ascent.

`V2-VT-C`

Upper wall/traversal and descent connection.

`V2-VT-D`

High-altitude transfer connection.

These are planned locations, not validated structures.

Adjust them to real building geometry.

### ACCESSIBILITY REQUIREMENT

At least one safe route through the district must work without requiring Afterstep banked impulses or advanced Threadrail mastery.

Skilled players should gain faster alternative routes.

The environment must reward traversal mastery without making its basic circulation dependent on advanced resources.

---

# 9. DESIGN THREE DIFFERENT ROUTES TO ONE MAJOR DESTINATION

Choose the upper transit interchange as the first navigation objective.

Design three genuinely different approaches.

## ROUTE A — PUBLIC / ACCESSIBLE

A route using stairs, lifts, bridges and walkways.

It must work with zero Afterstep impulses and without a specialized Threadrail sequence.

This should establish understandable public circulation through the district.

## ROUTE B — FAST / MOMENTUM

A faster route using Flow Run, valid Threadrails and rooftop shortcuts.

Reward movement continuity.

Avoid unnecessary stops.

## ROUTE C — HIGH SKILL

A challenging upper route combining:

- Vertical wall movement.
- Physical Threadrail construction.
- Rail Pop.
- Aerial redirects.
- Afterstep Drive where available.
- Precise landings.

Make the faster route more demanding, not randomly dangerous.

### VALIDATION

Test all three routes using normal player controls.

Measure actual completion time.

Record resource consumption.

Test at zero and full banked impulses.

Document failures.

Do not claim all routes are functional based solely on navigation graph connectivity.

---

# 10. DESIGN THREE FUNCTIONAL GAMEPLAY ENCOUNTERS

The district needs more than traversal.

It must support different kinds of gameplay.

## ENCOUNTER A — TRANSIT INTERCHANGE PURSUIT

Location:

Upper train/interchange area.

Design:

- Multiple approach directions.
- Elevated pedestrian paths.
- Rooftop shortcuts.
- Train-adjacent routes.
- Safe player landing zones.
- Visibility across multiple heights.

The player should be able to chase or intercept a target using different routes.

Use existing gameplay systems where possible.

## ENCOUNTER B — MULTI-LEVEL SERVICE-YARD COMBAT

Location:

Mid-city industrial/service platform.

Design a combat area containing:

- Multiple elevations.
- Traversable overhead structures.
- Clear ground surfaces.
- Cover opportunities.
- Flanking paths.
- Escape routes.
- Threadrail-compatible structural supports.
- Suitable enemy spawn positions.

Avoid a tiny decorative platform that cannot support proper third-person combat.

Use real combat-system metrics to establish spacing.

## ENCOUNTER C — SUSPENDED MARKET CIVILIAN RESCUE

Location:

Lower elevated commercial gallery.

Design:

- Civilian circulation.
- Multiple entrances.
- Safe rescue approach paths.
- Elevated danger.
- Traversable surrounding architecture.
- A meaningful escape or extraction route.
- Appropriate landing space.

Use existing civilian and rescue systems where they support the intended behavior.

If additional gameplay systems are needed, identify them separately rather than pretending they already exist.

---

# 11. MAKE THE CITY RECOGNIZABLE

AAA open-world environments need architectural landmarks.

The player should be able to navigate by looking at the city.

Design at least three distinctive landmarks in this corridor.

### LANDMARK 1 — ELEVATED TRANSIT INTERCHANGE

A major transport structure that visually dominates part of the skyline.

### LANDMARK 2 — SUSPENDED COMMERCIAL COMPLEX

An inhabited commercial destination featuring multiple pedestrian elevations.

### LANDMARK 3 — UPPER OBSERVATION / ROOFTOP STRUCTURE

A recognizable high-altitude architectural destination.

Give each landmark its own silhouette and functional role.

Preserve Saint Meridian's midnight-blue, charcoal, cyan and amber identity.

### POINTS OF INTEREST

Include at least four discoverable locations.

Examples:

- Hidden rooftop service access.
- Public observation deck.
- Maintenance route.
- Small civilian incident location.
- Unusual alternate traversal route.
- Environmental storytelling discovery.

Use established Saint Meridian lore where available.

Do not invent contradictory canon district names or history.

---

# 12. DESIGN SAFE FAILURES AND RECOVERY

High-altitude traversal should feel exciting rather than frustrating.

For each major traversal gap, examine:

- Intended launch position.
- Intended landing position.
- Common undershoot.
- Common overshoot.
- Missed Threadrail attachment.
- Lost momentum.
- Failed Rail Pop.
- Low Afterstep resources.
- Camera obstruction.
- Unsafe collision.

Create appropriate lower platforms, safe drops or other recovery possibilities.

Do not eliminate every danger.

But avoid forcing players through a lengthy restart after every minor mistake.

Every advanced route should communicate its risks.

Ensure falling players can identify recovery opportunities wherever the movement system allows.

---

# 13. BUILD THE REVISED LEVEL IN BLENDER

Only after the authoritative world export and preliminary level-design graph are complete, create the Blender master environment.

Example project:

`SaintMeridian_V02_AAA_Master.blend`

Blender becomes the main architectural authoring tool.

### IMPORT EXISTING CITY AS REFERENCE

Use existing GLBs and authoritative game transforms.

Keep them in:

`SM_EXISTING_REFERENCE`

This collection must not be exported as duplicate game geometry.

### NEW ARCHITECTURAL COLLECTIONS

Create:

`SM_V02_BLOCKOUT`

`SM_V02_SKYBRIDGES`

`SM_V02_GALLERIES`

`SM_V02_TRANSIT_STRUCTURES`

`SM_V02_ELEVATED_ROADS`

`SM_V02_VERTICAL_TRANSFERS`

`SM_V02_BUILDING_EXTENSIONS`

`SM_V02_SERVICE_YARDS`

`SM_V02_MARKET`

`SM_V02_ROOFTOP_ROUTES`

`SM_V02_LANDMARKS`

`SM_V02_COLLISION`

`SM_V02_THREADRAIL_SURFACES`

`SM_V02_TRAIN_ROUTES`

`SM_V02_AERIAL_TRAFFIC_ROUTES`

`SM_V02_ENCOUNTER_POINTS`

`SM_V02_CAMERA_BOOKMARKS`

`SM_V02_EXPORT`

Use clear object names and stable IDs.

### BLOCKOUT REQUIREMENTS

Begin with simple, correctly scaled geometry.

Create:

- All necessary crossing decks.
- Segmented side walkways.
- Vertical transfer routes.
- Encounter platforms.
- Landmarks represented by massing volumes.
- Major train structures.
- Clearance envelopes.
- Safe landing zones.
- Recovery platforms.

Do not start with expensive detailed architecture.

Export the graybox into the game and playtest it first.

---

# 14. PRESERVE THE EXISTING BUILDINGS

The city already contains 310 building lots and eight authored building families.

Do not replace them wholesale.

Use them as the architectural foundation.

New structures should be attached around existing geometry.

Preserve:

- Existing roads.
- Existing plaza.
- Existing rooftops.
- Existing rescue and mission areas.
- Existing building collisions.
- Existing destruction ownership.

Where necessary, create explicit, controlled facade modifications.

Don't duplicate the original building geometry.

Don't create invisible collision walls.

Don't position platforms inside solid facade structures.

Don't destroy the original game layout to make the visual reference easier to reproduce.

---

# 15. TRAIN AND AERIAL TRAFFIC

Keep the existing V1 systems as the starting point.

## TRAIN

The current V1 train has:

- Four carriages.
- A real Hi3D-generated front carriage.
- Placeholder middle/rear carriages.
- A moving path near Y100.

Preserve the existing real asset.

Improve:

- Track alignment.
- Carriage consistency.
- Turning radius.
- Mechanical support continuity.
- Station accessibility.
- Multi-car swept clearance.
- Camera collision.
- Scene performance.

Use Blender to author accurate static train infrastructure.

Use Three.js for train motion.

Do not embed the train as static architecture.

## AERIAL TRAFFIC

Current scenic traffic bands are near:

- Y38.
- Y65.
- Y114.

Use them as a starting point.

Rework traffic routing as necessary to avoid structural conflicts with new bridges.

Check full vehicle envelopes, not only path centerlines.

Maintain believable:

- Travel direction.
- Route spacing.
- Banking.
- Turns.
- Vehicle density.
- Speed variation.
- Building clearance.

Keep distant vehicles lightweight.

Do not describe scenic traffic as full intelligent traffic AI.

---

# 16. VISUAL DESIGN — STRICT APPROVED REFERENCES

The final architecture must match the approved two-image Saint Meridian direction.

### FACADES

Dark midnight-blue.

Charcoal-black panels.

Clean modern geometry.

### ARCHITECTURAL LIGHTING

Thin cyan-blue light strips.

Warm amber recessed ceilings.

Warm interior windows.

### MATERIALS

Metallic structural elements.

Tinted glass.

Subtle variation in roughness and surface response.

### CITY ATMOSPHERE

Blue-hour/night conditions.

Deep visible vertical streets.

Controlled haze.

Warm illuminated windows.

Moderate environmental reflections.

### ABSOLUTE RESTRICTIONS

No gothic redesign.

No beige stone skyline.

No generic box towers as final architecture.

No excessive bloom hiding weak geometry.

No overly dense structures that prevent movement.

No disconnected decorative bridge networks.

The city must remain readable at high traversal speed.

---

# 17. HI3D ASSET POLICY

Use existing assets first.

Use Hi3D only for distinctive missing models where it materially improves quality.

Examples:

- Specialized transit modules.
- Vehicle models.
- Mechanical skyport equipment.
- Unique landmark components.

Use Quality generation by default if available.

Only use Master when justified by actual close-range asset requirements.

Do not spend paid generation credits without explicit approval.

All generated assets must be inspected and optimized in Blender.

Do not make AI-generated meshes authoritative for gameplay dimensions without correction and validation.

The new static city architecture should primarily be Blender-authored modular geometry.

---

# 18. EXPORT BLENDER GEOMETRY TO THREE.JS

Do not export the complete city as one giant GLB.

Export modular chunks:

- New bridge geometry.
- New public galleries.
- New transit structures.
- New service-yard structures.
- New facade additions.
- New rooftop/upper-city structures.
- New landmark components.

Export separately:

- Collision data.
- Route graph.
- Train spline data.
- Aerial traffic routes.
- Threadrail-compatible surfaces.
- Structure ownership.
- Encounter placement metadata.

Use consistent coordinate transforms and IDs.

Validate world positions after import.

### IMPORTANT

The Blender scene must preserve the actual world-space relationships of the current game.

Use the V02 manifest for design intent.

Use the live game export for final positions and dimensions.

Do not assume source blueprint geometry overrides the existing level's actual imported GLBs.

---

# 19. ACTUAL GAMEPLAY TESTS — MANDATORY

Run the current game in a real browser.

Build a test harness that uses normal game input.

Do not certify routes by teleporting the player between nodes.

Teleportation may be used only for controlled test setup and clearly labeled camera inspection.

### TEST A — LOWER LOOP

Complete the entire lower-city loop using ordinary movement.

### TEST B — MID LOOP

Complete the entire mid-city loop.

### TEST C — HIGH LOOP

Complete the upper-city loop with actual movement mechanics.

### TEST D — THREE ROUTES TO STATION

Complete all three approaches to the transit interchange.

### TEST E — RESOURCE DEPLETION

Test traversal with zero banked impulses.

Ensure public circulation remains accessible.

### TEST F — THREADRAIL

Throw two real cartridges.

Attach to valid structural surfaces.

Create and ride the rail.

Complete a transfer and safe landing.

### TEST G — FAILURE RECOVERY

Test missed jumps and failed attachment attempts.

Verify usable recovery routes where designed.

### TEST H — CAMERA

Test ordinary third-person camera movement at different elevations and during high-speed traversal.

### TEST I — MOVING TRAIN

Verify that all carriages clear nearby buildings, tracks and pedestrian structures through full turns.

### TEST J — CITY PRESERVATION

Confirm original buildings, roads, missions, character controls and destruction behavior remain functional.

Use the existing automated regressions wherever possible.

---

# 20. MEASURE REAL LEVEL DESIGN QUALITY

Do not simply report that a route exists.

Measure and document:

- Traversal completion time.
- Travel distance.
- Number of meaningful route choices.
- Number of ability transitions.
- Stops caused by bad level geometry.
- Camera obstructions.
- Invalid landings.
- Resource requirements.
- Recovery opportunities.
- Route visibility.
- Encounter accessibility.

### GAMEPLAY FLOW

The player should not repeatedly collide with small environmental props while traveling at speed.

The player should be able to identify useful surfaces and connections.

Each vertical layer should contain a reason to visit it.

### EXPLORATION

Players should discover secondary routes, landmarks and interesting spaces while moving through the city.

### COMBAT

Encounter locations should offer adequate camera clearance, player movement room and multiple tactical approaches.

### WORLD BELIEVABILITY

Public infrastructure should lead to plausible destinations.

Don't build stairs that end at blank walls.

Don't build transit stations without pedestrian access.

Don't build skyports without plausible vehicle approach paths.

---

# 21. PERFORMANCE REQUIREMENTS

Preserve the current Three.js rendering architecture.

Use:

- Shared geometry.
- Optimized GLBs.
- Appropriate LODs.
- Instancing.
- Frustum culling.
- Chunk-based loading where appropriate.
- Efficient materials.
- Simplified collision.
- Spatially filtered queries.
- Bounded traffic.
- Efficient lighting.

The current V1 has approximately 952 vertical collision boxes in its recorded audit.

Investigate the performance impact.

Optimize broadphase queries and registration where necessary.

Do not sacrifice gameplay collision accuracy.

### PERFORMANCE EVIDENCE

Run matched baseline and candidate gameplay recordings of at least 60 seconds.

Measure:

- Frame-time median.
- Frame-time p95.
- Simulation CPU time.
- Draw calls.
- Rendered triangles.
- Memory.
- Loading time.
- Runtime errors.

Distinguish CPU timing from GPU timing.

Do not claim sustained performance based on one render sample.

Test actual high-speed traversal through the new district.

---

# 22. REFERENCE CAMERA MATCHING

Create two in-game camera bookmarks corresponding to the attached visual references.

### CAMERA A — HIGH-ANGLE OVERLOOK

Must show:

- Modern dark towers.
- Elevated train.
- Multiple skybridges.
- Flying traffic.
- Deep lower city.
- Dense vertical architectural layering.

### CAMERA B — LOWER UPWARD ANGLE

Must show:

- Tall building facades.
- Cyan vertical architectural lighting.
- Warm balconies.
- Overlapping pedestrian bridges.
- Train infrastructure.
- Traffic flying overhead.
- Distant skyline depth.

Create matching Blender cameras.

Capture Blender renders.

Then capture actual browser gameplay screenshots.

Compare them separately.

### IMPORTANT

Blender renders are evidence of architectural authoring.

Browser screenshots are evidence of the actual playable environment.

Do not substitute one for the other.

Visual acceptance must be assessed inside the game.

---

# 23. DELIVERABLES AND VERSIONING

Produce a dedicated V02 development directory.

Include:

1. Current-game authoritative world export.
2. Building and collider ID reconciliation.
3. Updated source-verified architectural site plan.
4. Revised V02 floor/elevation drawings.
5. Clearance-conflict report.
6. Directed three-dimensional movement graph.
7. Ability and traversal route matrix.
8. Three validated traversal loops.
9. Three routes to the transit interchange.
10. Three designed encounter spaces.
11. Three architectural landmarks.
12. Four meaningful points of interest.
13. Blender master environment file.
14. Blender blockout generation scripts.
15. Modular GLB exports.
16. Collision and ownership metadata.
17. Train and traffic route metadata.
18. Actual browser screenshots.
19. Gameplay validation results.
20. Performance results.
21. GitHub branch and commits.
22. Known limitations.

Suggested project outputs:

`V02_LiveWorld_Authoritative.json`

`V02_Reconciled_Site_Manifest.json`

`V02_Clearance_Report.json`

`V02_Movement_Graph.json`

`V02_Traversal_Validation.json`

`V02_Encounter_Design.md`

`V02_Landmark_POI_Plan.md`

`SaintMeridian_V02_AAA_Master.blend`

`V02_Performance_Report.json`

`V02_Acceptance_Report.md`

Use reproducible scripts.

Do not overwrite the older V1 architectural pack.

---

# 24. IMPLEMENTATION ORDER — FOLLOW STRICTLY

## PHASE 1 — EXISTING WORLD VERIFICATION

Audit the newest playable game.

Export the real building geometry and collision data.

Reconcile the blueprint.

Identify every significant mismatch.

Deliver the verified spatial baseline.

## PHASE 2 — AAA LEVEL-DESIGN REVISION

Create the true 3D movement graph.

Verify player movement metrics.

Redesign broken routes.

Establish three interconnected loops.

Design three routes to the transit interchange.

Plan encounter areas and landmarks.

## PHASE 3 — BLENDER BLOCKOUT

Build the revised V02 district as simple modular architecture.

Maintain exact world coordinates.

Export a playable graybox candidate.

## PHASE 4 — GAMEPLAY ACCEPTANCE

Test every traversal loop.

Test all three destination approaches.

Test collision, recovery, camera and encounter spaces.

Fix architectural failures.

Do not progress to high-detail modeling while essential circulation remains broken.

## PHASE 5 — DETAILED BLENDER ARCHITECTURE

Replace approved blockout geometry with refined environment models.

Preserve the approved dark-blue, cyan and amber aesthetic.

## PHASE 6 — TRANSIT AND WORLD LIFE

Refine train infrastructure.

Improve flying traffic.

Add appropriate pedestrian and ambient activity.

Integrate encounter spaces.

## PHASE 7 — VISUAL ACCEPTANCE

Match Blender and actual game camera views against the references.

Refine architecture, material appearance and lighting.

## PHASE 8 — PERFORMANCE AND RELEASE

Optimize the scene.

Run regressions.

Document results.

Deliver the new playable V02 candidate.

Commit progress incrementally.

Do not replace older stable builds.

---

# 25. FINAL AAA LEVEL-DESIGN QUALITY GATE

Do not call the new city complete unless the following have been demonstrated:

- The original city remains intact.
- The new district has meaningful vertical depth.
- All three traversal loops are physically connected and playable.
- Players have at least three meaningful approaches to a major destination.
- Public circulation works without advanced movement resources.
- Skilled traversal provides faster or more expressive alternatives.
- Camera behavior remains readable.
- Missed landings have appropriate recovery opportunities.
- Threadrail anchors operate using real physical geometry.
- Combat and pursuit areas are practical gameplay spaces.
- The civilian gallery supports meaningful activity.
- Buildings and infrastructure have plausible connections.
- Landmarks make the district navigable.
- Trains and aerial traffic avoid confirmed geometric conflicts.
- The finished environment resembles the approved Saint Meridian images.
- Performance has been tested under real gameplay conditions.
- Existing missions and gameplay systems have not been broken.

Record individual PASS, FAIL or NOT TESTED results.

Do not substitute code compilation or pretty screenshots for gameplay evidence.

## FINAL CREATIVE AND TECHNICAL DIRECTIVE

**Build a city that is designed around playing as Backspool, not merely a city that looks good behind Backspool.**

The Fifth Element defines the scale and layering.

Marvel's Spider-Man informs movement-driven spatial design.

Batman: Arkham Knight informs multi-elevation encounters and traversal approaches.

GTA V informs believable urban function, variety and world activity.

Saint Meridian's own architecture, districts, history and Moniker systems define the identity.

Blender is the master environment construction tool.

Three.js is the playable runtime.

The V02 architectural study is the design starting point.

The actual current game geometry is authoritative.

Begin by fixing the structural and navigation failures in the existing V1 corridor.

Prove the V02 traversal loops in a playable graybox.

Only then build the detailed futuristic architecture.

**THE FINAL RESULT MUST BE A FUN, CONNECTED, REPLAYABLE, HIGHLY VERTICAL OPEN-WORLD ENVIRONMENT — NOT SIMPLY AN IMPRESSIVE SKYLINE.**