# Saint Meridian V02 — current-branch architectural site study

**Updated baseline:** `brokendeity/sightline-saint-meridian`, branch `feature/saint-meridian-vertical-megacity-v1` (inspected 2026-10-24). Earlier east-central proposed blueprint is superseded for the current V1 vertical-canyon location.

## What is inside

- `Saint_Meridian_V02_CurrentBranch_Architectural_Site_Study.pdf`: six architectural site-study drawings (A-01 to A-06).
- `V02_A01_Existing_Citywide.png`: original reconstructed 310-building context with the NEW corridor marked.
- `V02_A02_CurrentBranch_AsBuilt.png`: current branch's intended four elevation decks, train/traffic bands, and known rejection markers.
- `V02_A03_Proposed_AAA_Overlay.png`: alternate V02 network layout over the current footprint reference.
- `V02_A04_Vertical_Section.png`: relative elevation study.
- `V02_A05_Traversal_Loops.png`: proposed lower, mid and high playable circulation loops.
- `V02_A06_Acceptance_Gates.png`: current limitations and mandatory gameplay tests.
- `V02_CurrentBranch_SiteStudy_Manifest.json`: current-branch facts clearly separated from unverified design additions.
- `V02_AbilityRoute_Matrix.csv`: intended movement graph, bridge/vertical-transfer edge distances, route types and flags.
- `V02_Existing_Lots_Source_Reconstructed.json`, `V02_Existing_Buildings_ReferenceOnly.csv`: older candidate's reconstructed original lot footprints — **NOT an exact runtime export of the new branch**.
- `V02_Source_Audit_and_Design_Gates.md`: detailed findings and next production gates.
- `Blender_V02_Blockout_From_Manifest.py`: generate a **schematic** Blender file from the proposed layout. Requires Blender (`bpy`) and has been syntax checked, but **not executed/visually verified in Blender in this session**.
- `Export_Live_CurrentBranch_World.cjs`: read-only template for exporting currently loaded building and vertical structure transforms/collisions through local Playwright; **not run or integration tested**. Requires the full GitHub checkout, locally served, with Playwright installed.
- `make_study.py`: regenerate PNG/PDF/manifest sheets with Matplotlib using the included reconstructed lot data.

## Architectural decisions

1. Treat this branch's actual vertical corridor **X≈80, Z180–460** as the current prototype. Do **not** copy the older proposal X240–850 over it.
2. Preserve 310 original building lots and ground roads. Do not double-import existing buildings from Blender.
3. Current bridges intended at Y24/Z210, Y52/Z280, Y84/Z350, Y128/Z430. The **Y52/Z280 bridge was rejected** by the existing building clearance check.
4. Use the proposed V02 networks as **design alternatives**, not as verified build coordinates. Actual host facades, connections, mission blockers, colliders and vehicle swept volumes must be checked.
5. Prove **three connected circulation loops**, three meaningful paths to a transit destination, three different encounter typologies, recovery from failed drops, collision-safe traffic/train lanes and an ordinary-controller uninterrupted return traversal.
6. Only after those graybox gates pass, replace simple geometry with final Blender art and further 3D assets.

## First Codex instructions

From the latest commit on `feature/saint-meridian-vertical-megacity-v1`, (1) export live spatial information using the provided read-only exporter as a starting point and fix any local implementation assumptions, (2) reconcile actual collider matrices and road/missions against these preliminary blueprint coordinates, (3) generate **V02 Revised Validated Site Plan** with rejected geometry moved around real structural envelopes, (4) create a new protected candidate branch, (5) implement and playtest the graybox loops and encounter footprints, and (6) only then make the Blender detailed master city. Do not call the sketches gameplay-validated until the scripted and human-controlled browser tests pass.

**Source audit vs implementation:** these drawings were made from GitHub code, audit JSON, and previous blueprint lot data. No new game environment was implemented or independently played in this response.
