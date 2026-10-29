# V02 current development checkpoint — 28 October 2026

Current branch: `feature/saint-meridian-aaa-vertical-city-v02`.

Current complete game: [SIGHTLINE_SAINT_MERIDIAN_V02_LOGGIA_TERRACES.html](SIGHTLINE_SAINT_MERIDIAN_V02_LOGGIA_TERRACES.html). Serve this repository, then open `http://127.0.0.1:8766/SIGHTLINE_SAINT_MERIDIAN_V02_LOGGIA_TERRACES.html?capture=backspool` and select **Enter V02 district**.

```sh
python3 -m http.server 8766 --bind 127.0.0.1
```

Includes three public loggias, a connected 26-flight stair from24to128m, the existing market rescue/service combat/transit pursuit and three station approaches. The original310buildings, roads, plaza, heroes and older complete builds are preserved. Contract-owned sparring no longer hides its street objective; yard controls use the shared responsive HUD.

All12current gameplay scenarios, six station approaches, three public loops,18HUD/input cases and the complete stair tour pass their stated checks. Saved Blender geometry, modular exports, physical contacts, vehicle separation and current60-second matched performance evidence are included. **V02 remains unfinished:** approved-reference visual refinement, broader combat-camera framing, remaining release regressions and combined stress/performance work are open. [Implementation and exact limits](development/vertical-city-v02/V02_LOGGIA_TERRACES.md) · [Current candidate identity](development/vertical-city-v02/V02_Current_Candidate_Status.json) · [Bounded evidence package](development/vertical-city-v02/V02_Loggia_Terraces_Evidence.json).

Experimental lighting build: [SIGHTLINE_SAINT_MERIDIAN_V02_DIFFUSE_LIGHTING.html](SIGHTLINE_SAINT_MERIDIAN_V02_DIFFUSE_LIGHTING.html) adds source-baked diffuse light and room-local reflections to the three loggias. It preserves the complete game and is not promoted over the checkpoint above. [Lighting evidence and remaining visual limits](development/vertical-city-v02/V02_DIFFUSE_LIGHTING.md).

Experimental camera/upper-rail build: [SIGHTLINE_SAINT_MERIDIAN_V02_UPPER_ANCHORS.html](SIGHTLINE_SAINT_MERIDIAN_V02_UPPER_ANCHORS.html). Adds two Blender-authored physical receiving bollards, body-aware camera composition and responsive HUD placement. Six current station approaches, short-catch recovery, all three public loops and12retained encounter/replay/discovery cases pass their stated checks. A fixed-resolution60-second matched lower-loop benchmark is recorded. This remains unpromoted; final reference architecture and combined release acceptance are unfinished. [Exact evidence and limits](development/vertical-city-v02/V02_UPPER_ANCHORS.md) · [Reference-surface diagnosis](development/vertical-city-v02/V02_REFERENCE_SURFACE_STUDY.md).

Experimental facade build: [SIGHTLINE_SAINT_MERIDIAN_V02_FACADE_CASSETTES.html](SIGHTLINE_SAINT_MERIDIAN_V02_FACADE_CASSETTES.html) retains the complete upper-receiver/body-framing game and adds 2,428 Blender-authored window surrounds on three original building owners. Current loops, six station approaches, recovery and 12 encounter/replay/discovery cases pass their bounded checks. A matched 60-second fixed-resolution CPU/GPU comparison is included. The default checkpoint remains unchanged; V02 reference architecture, lighting and final release acceptance are unfinished. [Source, gameplay and measurement limits](development/vertical-city-v02/V02_FACADE_CASSETTES.md).

Experimental public-room/life build: [SIGHTLINE_SAINT_MERIDIAN_V02_PUBLIC_ROOM_LIFE.html](SIGHTLINE_SAINT_MERIDIAN_V02_PUBLIC_ROOM_LIFE.html) adds three enterable, source-lit public rooms and three ambient visitors. It also repairs two-sided cartridge attachment normals exposed by the updated geometry. Seven sequential check groups pass, including six fresh station approaches, three loops and twelve retained gameplay cases. The default above remains unchanged; final architecture, lighting, inherited crowd overlap and release acceptance are unfinished. [Exact evidence and limits](development/vertical-city-v02/V02_EAST_PUBLIC_ROOMS.md).

Experimental architectural-shadow build: [SIGHTLINE_SAINT_MERIDIAN_V02_RIM_SHADOWS.html](SIGHTLINE_SAINT_MERIDIAN_V02_RIM_SHADOWS.html) adds cached shadows for the existing warm directional light, reducing pale facade glare while retaining its color and strength. Source/native preservation, nine current room routes and matched 60-second measurements are included. Median frame interval rose from 9.1 to 9.9 ms; a worst-frame hitch and the broader reference-art/release gates remain open. This does not replace the default above. [Evidence, rejected attempts and exact limits](development/vertical-city-v02/V02_RIM_SHADOWS.md).

## Earlier checkpoints

The entries below are historical. Their files, snapshots and branches remain available for rollback.

---

# Latest saved update — 25 October 2026

Snapshot branch: `snapshots/2026-10-25-current-game`. Tag: `snapshot-2026-10-25-current-game`. Includes the current playable game, Hi3D train inspector and newer experimental V02 work. [Launch instructions and checkpoint limits](docs/snapshots/2026-10-25-current-game.md). Older snapshots and main are preserved.

---

# V02 development candidate — detailed Blender architecture

Current work build: [SIGHTLINE_SAINT_MERIDIAN_V02_DETAILED.html](SIGHTLINE_SAINT_MERIDIAN_V02_DETAILED.html), served at8766 with `?capture=backspool`. It adds a two-level market, framed storefronts/stalls, supported transit/observation shelters, glass parapets and packed PBR surfaces. Its new public stair passes walking and sampled camera tests; current retained scenario results are recorded separately. This is an unfinished phase5 candidate. [Reproduction, evidence and remaining work](development/vertical-city-v02/DETAILED_ARCHITECTURE.md).

## Accepted phase4 rollback — connected Blender graybox

Experimental entry: [SIGHTLINE_SAINT_MERIDIAN_V02_GRAYBOX.html](SIGHTLINE_SAINT_MERIDIAN_V02_GRAYBOX.html). Serve this repository at8766, open it with `?capture=backspool`, and select **Enter V02 district**. The original latest WHIP game and all saved snapshots below remain unchanged.

**Phase4 essential gameplay gate passed.** The current graybox has31 passing sequential regression cases plus a complete ground-to-pursuit flow, actual Echo contact, two supported gallery escapes and reviewed camera/recovery evidence. [Hash-bound phase4 gate](development/vertical-city-v02/V02_Phase4_Gate.json). Detailed architecture is now developed separately above. Final architecture, transit/world life, reference visuals, sustained performance and complete release checks remain unfinished.

Three elevated loops, all three station approaches and the public ground→Y128→ground roundtrip pass normal-input tests. The momentum approach takes73.23s versus135.33s for ordinary public running; the wall/rail mastery approach takes103.78s. Zero/full initial bank variants are recorded. This remains a graybox milestone, **not the completed V02 city**. Service-yard combat and a market rescue now have playable prototypes. The rescue includes power isolation, a physically checked civilian escort, two routes and tested lifecycle controls. A transit pursuit prototype now uses the real upper stairs, with chase/interception/escape and lifecycle input cases. Four useful discovery/information locations and a street directory are implemented with supported public-route guidance; their current hash-bound tour and lifecycle reports are recorded separately. A fresh physical two-rail transfer and no-Pop endpoint recovery also pass local normal-input tests. Navigation/recovery breadth, guardrails, full camera review, final architecture, world life, transit sweeps and sustained visual/performance acceptance remain open. [Current evidence and remaining gates](development/vertical-city-v02/V02_Acceptance_Report.md) · [Blender master and reproduction workflow](development/vertical-city-v02/README.md).

---

# Current GitHub snapshot — 24 October 2026

Saved independently on `snapshots/2026-10-24-current-game-v02-baseline`, tagged `snapshot-2026-10-24-current-game-v02-baseline`. The latest playable entry remains **SIGHTLINE_BACKSPOOL_WHIP_THROW.html**; **VERTICAL_TRAIN_INSPECTOR.html** previews the train asset. Run `python3 -m http.server 8766 --bind 127.0.0.1` from this repository.

This preserves the current playable megacity/Hi3D train build plus the V02 live-world baseline and preliminary movement research. V02 gameplay geometry is not implemented yet. Earlier branches, tags and `main` remain unchanged. See [snapshot details](docs/snapshots/2026-10-24-current-game.md).

---

# Current snapshot — vertical megacity + Hi3D train

Latest playable build: [SIGHTLINE_BACKSPOOL_WHIP_THROW.html](SIGHTLINE_BACKSPOOL_WHIP_THROW.html), including current Threadrail cartridge/whip, Afterstep, imported city props and first Hi3D train front carriage.

```sh
python3 -m http.server 8766 --bind 127.0.0.1
```

Open http://127.0.0.1:8766/SIGHTLINE_BACKSPOOL_WHIP_THROW.html?capture=backspool&vaultcourse=1 . Model inspection: http://127.0.0.1:8766/VERTICAL_TRAIN_INSPECTOR.html . Keep the asset folders beside the HTML.

Saved on `feature/saint-meridian-vertical-megacity-v1` with the separate tag `snapshot-2026-10-24-megacity-hi3d-train`. Older branches, tags and main are preserved. This is an unfinished development snapshot: the front carriage is integrated; other carriages, safe route refinement, the other six hero asset families and full megacity acceptance remain pending. See [train integration evidence and limitations](docs/vertical-city/HI3D_TRAIN_INTEGRATION.md).

The 145 MB raw Hi3D model and 74 MB authoring Blender source remain local; optimized runtime GLBs and source hashes are included. Recreating those authoring outputs requires the preserved local raw export. They are not needed to run this snapshot.

---

# Sightline / Backspool — Threadrail and Afterstep candidate

Current feature branch: `feature/backspool-threadrail-afterstep-drive`, based on the preserved v14 complete snapshot with v15 landing/roll fixes. Run `python3 scripts/build_backspool_threadrail_candidate.py`, then `python3 -m http.server 8766` and open [the equipment candidate](http://localhost:8766/SIGHTLINE_BACKSPOOL_THREADRAIL_CANDIDATE.html?capture=backspool). Controls are in [docs/BACKSPOOL_THREADRAIL.md](docs/BACKSPOOL_THREADRAIL.md); final evidence, source boundaries and demonstration steps are in [docs/THREADRAIL_DELIVERY.md](docs/THREADRAIL_DELIVERY.md). The main game and earlier candidate below are retained.

The completed presentation update is [Threadrail V2](http://localhost:8766/SIGHTLINE_BACKSPOOL_THREADRAIL_V2.html?capture=backspool). [V1](http://localhost:8766/SIGHTLINE_BACKSPOOL_THREADRAIL_V1.html?capture=backspool) remains available. See [V2 completion evidence](docs/THREADRAIL_V2.md).

The city/replay reliability update is [Threadrail V3](http://localhost:8766/SIGHTLINE_BACKSPOOL_THREADRAIL_V3.html?capture=backspool), with [acceptance and limits](docs/THREADRAIL_V3.md). V2 remains available at its previous URL and GitHub snapshot. V3 is currently a local update.

Try the [automatic vault lane](http://localhost:8766/SIGHTLINE_BACKSPOOL_VAULT_PLAYGROUND.html?capture=backspool&vaultcourse=1): three central-plaza obstacles, a start/retry button and an observed automatic-completion counter. [Controls and evidence](docs/VAULT_COURSE.md).

The latest visual candidate is [reference Afterstep VFX](http://localhost:8766/SIGHTLINE_BACKSPOOL_AFTERSTEP_VFX.html?capture=backspool&vaultcourse=1): dual lower-back outlet pulses, translucent angular shards and three historical body poses. [Implementation, tuning and verification](docs/AFTERSTEP_REFERENCE_VFX.md). The wall-fix vault playground remains available at its old URL.

## Original snapshot

Separate update: `snapshots/2026-10-21-pose-binding-v14`, tagged `snapshot-2026-10-21-pose-binding-v14`. Earlier branches and tags are preserved.

## Run

```sh
python3 -m http.server 8765
```

Open http://localhost:8765/SIGHTLINE_BACKSPOOL_TRAVERSAL_CANDIDATE.html?v=pose-binding-v14 for the current traversal candidate. The separate main game remains available as SIGHTLINE_SAINT_MERIDIAN_TOON.html. Keep all asset directories in place, including `characters ` (trailing space).

Includes current gameplay source, native motion preview assets, traversal modules and numerical controller/pose evidence. Full original Forspoken controller and IK are unfinished; the new pose kernels are not applied directly to the hero. See docs/traversal-v14/POSE_BINDING_V14.md for scope and validation (48 unit checks, 119 retained regressions and 248 sampled poses).

Rebuild the candidate with `python3 scripts/build_backspool_traversal_candidate.py`. Extraction scripts may require the external source archives and RE tools, which are not included. The runtime does not require those archives or executables. Original proprietary game executables, installation archives, Ghidra projects and the separate Naruto cinematic library are excluded.

## Roll back

Use a separate checkout: `git worktree add ../sightline-pre-rea snapshot-2026-10-15-pre-rea`. The original build is also retained as `archive/pre-roads-backspool-2026-10-14`. No existing branch or archive tag was replaced.

This private development snapshot contains supplied and recovered assets; their original ownership remains unchanged. Third-party notices remain in third-party/. File identities are recorded in SNAPSHOT_MANIFEST.json.

Experimental flared-crossing build: [SIGHTLINE_SAINT_MERIDIAN_V02_FLARED_CROSSINGS.html](SIGHTLINE_SAINT_MERIDIAN_V02_FLARED_CROSSINGS.html). Six Blender-authored bridges retain wide junctions and taper through their central spans; the market connection stays continuous. Seven sequential current validation jobs and33guard walking approaches pass their bounded checks. [Implementation, timing and remaining limitations](development/vertical-city-v02/V02_SLENDER_CROSSINGS.md). This remains unfinished and does not replace the default checkpoint.

Experimental furnished-room build: [SIGHTLINE_SAINT_MERIDIAN_V02_FURNISHED_PUBLIC_ROOMS.html](SIGHTLINE_SAINT_MERIDIAN_V02_FURNISHED_PUBLIC_ROOMS.html). Adds source-authored seating, level diagrams and fresh room fixture lighting/reflections. All ten current source/input/world/encounter checks terminate successfully within their stated scope. Median frame time increased8.5→9.5ms in one matched pair; performance and the known market civilian overlap remain open. [Implementation and limits](development/vertical-city-v02/V02_FURNISHED_PUBLIC_ROOMS.md). This does not replace the default checkpoint.

Experimental civilian-clearance build: [SIGHTLINE_SAINT_MERIDIAN_V02_CIVILIAN_CLEARANCE.html](SIGHTLINE_SAINT_MERIDIAN_V02_CIVILIAN_CLEARANCE.html). Market residents and elevated ambient visitors use supported yielding, including waiting-state and close-view clearance. All eight functional validation jobs pass within their stated scope, including nine room/control cases and12retained encounter/replay/discovery cases. [Implementation, rejected first revision and remaining gates](development/vertical-city-v02/V02_CIVILIAN_CLEARANCE.md). Original street pedestrians and the wider V02 release remain unfinished; the default checkpoint is unchanged.
