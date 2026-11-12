# V02 Stylized Atmosphere (candidate)

- **New build:** `SIGHTLINE_SAINT_MERIDIAN_V02_STYLIZED_ATMOSPHERE.html`
  - **Base:** `…V02_LOADOUT_RUNNER_NO_AFTERSTEP.html`. It is unchanged, as are all older builds.
- **Patcher:** `scripts/vertical-v02/build_stylized_atmosphere_candidate.py`. It adds one hook, verified by inversion: the module script tag goes before the game core.
- **Module:** `scripts/game_v02_stylized_atmosphere.js`. This is a new file; no shared module was edited.
- **Build record:** `V02_Stylized_Atmosphere_Build.json`.
- **Source of the look:** Christian Ortiz's "Stylized Premium Scenes" pack. The techniques are reimplemented for three r128; no models, textures or HDRs from the pack are used. Its Naruto/Dragon Ball fan models are deliberately excluded. The licence is MIT, and the attribution is in the module header.

## What it does
| Part | Implementation | Switch |
|---|---|---|
| **A. Height fog** | The shared r128 fog chunks are rewritten before any shader compiles, using Ortiz's closed-form altitude fog. Mist sits in the street and thins by deck height. The aerial haze converges on the painted night sky's own gradient, so silhouettes dissolve into the sky. The legacy exp2 density, including rail-read changes, still drives the distance term. | `fog` |
| **B. Wet surfaces** | Lean overlay meshes sit on the 180 largest sky-facing static surfaces, district first (167 of 180 are in play space). Each overlay shares its surface's geometry, never catches a raycast and casts no shadow. With premultiplied blending, its alpha darkens the surface and its colour adds a Fresnel sheen of sky, mist and stylised amber/cyan window streaks. | `wet` |
| **C. Rain rings and glints** | Analytic ripple-normal rings (two cells per pixel) and short emissive glints inside the overlays, fading out by 14 m. Toned down after play review (2026-11-05): 62 cm cells (was 1.25 m), 30% drop chance (was 42%), half the normal strength, highlight 0.025 (was 0.065), glints 0.35 (was 0.55). | `rings` |
| **D. Cinematic grade** | Added to the game's existing `phasePost` pass, so it costs no new pass. It applies display-space contrast 1.06, split toning (cool shadows, amber highlights), saturation 0.9 that protects bright pixels, and a soft vignette. No bloom is added. | `grade` |

Rain only reaches open sky. About 1.5 s after the world is ready, a one-time depth-peeled height map of the static city is built: up to four layers per texel at 52 cm in the district, and two layers at 2.9 m elsewhere in the city. It takes 112–288 ms once, at load.
- **Wet:** a surface is wet if it is a static layer and is either topmost or has cover more than 14 m overhead.
- **Dry:** room, arcade and pavilion floors, characters and trains stay dry.
- **Motion check:** anything that moved more than 1 mm between two snapshots is excluded.

Switches: `?stylized=0` turns everything off. `?stylizedOff=fog,wet,rings,grade` turns parts off, and so does `stylizedAtmosphere.set({…})` at runtime. `stylizedAtmosphere.state()` and `stylizedAtmosphere.coverAt(x,y,z)` support evidence gathering.

## Why wetness is not inside the lit materials (measured)
The first version injected B and C into the shared physical and toon lighting chunks. On this machine (headless Chromium, ANGLE/Metal) it ran at p50 141 ms against 8.3 ms before, in matched 60 s runs (`evidence/stylized-atmosphere/perf-superseded-v1/`).

Bisection showed the cost comes from the code being present, not from running it:
- The same cost appeared with every part switched off.
- No shaders were recompiled and the GL calls were identical.
- About 40 extra arithmetic operations alone added about 16 ms.

The fog chunk and grade measured free. The likely cause is a cliff in the large lit shader (instruction cache or registers); this is not proven. The overlay design avoids touching that shader.

## Evidence
**Look:** PASS. The look changed, and the module is visually neutral when off.
- Captures are in `evidence/stylized-atmosphere/`. The script `capture_stylized_atmosphere_views.cjs` uses six inspection cameras, identical for both builds, labelled as fixtures, with RAF frozen and the sky clock pinned.
- Pairs are `pair-*.png`; statistics are in `compare.json`.
- **Changed pixels (>4%):** street 39%, deck24 27%, street-wide 29%, skyline 26%, mid52 13%, high 9%.
- **High-angle views:** only lightly changed.
- **Off check:** with `?stylized=0`, the difference from the base build sits at the run-to-run noise floor (`before-repeat`): street 0.0063 against 0.0049 mean absolute difference. The skyline outlier is a moving drone searchlight, because the clocks differ by 0.08 s.

**p95 frame time:** small regression, not hidden. `profile_frame_spikes.cjs`, lower public loop, 60 s, alternating before/after/before/after (`perf-*.json`):

| Run | p50 | p95 | p99 | Frames over 17.5 / 25 / 33.4 ms | Render CPU p50/p95 |
|---|---|---|---|---|---|
| before-1 | 8.4 | 16.8 | 17.9 | 124 / 7 / 1 | 4.6 / 5.4 |
| after-1 | 8.6 | 17.4 | 18.3 | 239 / 13 / 2 | 5.1 / 6.1 |
| before-2 | 8.3 | 16.6 | 17.8 | 86 / 8 / 0 | 4.8 / 5.7 |
| after-2 | 8.6 | 17.4 | 18.2 | 212 / 4 / 1 | 4.8 / 6.0 |

- p95 is about 0.6–0.8 ms higher, and roughly twice as many frames miss one 120 Hz refresh. There are no new hitches over 50 ms.
- The cost is mostly the extra overlay draw calls. `?stylizedOverlays=N` can trade wet coverage for draw calls.
- Combat, destruction and high-route workloads were NOT TESTED.

**V02 regression set:** PASS on all 16 steps, against entry `de0627b2…`.
- The runner is `run_stylized_atmosphere_checks.py`. It ran the same scripts as the Loadout Runner checks, one browser at a time, with normal input and only the tests' own labelled setups.
- Summary and logs are in `evidence/stylized-atmosphere-checks/`. The loops are in `V02_Stylized_Atmosphere_Loops.json`, the station routes in `V02_Stylized_Atmosphere_Station_Routes.json`, and the gameplay cases in `evidence/stylized-atmosphere-gameplay/`.
- The two tests that write to fixed tracked folders had their output copied into this folder, and those folders were restored to HEAD.

| Area | Steps |
|---|---|
| Traversal | wall contacts, landing and roll, three city loops, six station approaches: PASS |
| Gameplay | 12 retained encounter, replay and discovery cases: PASS |
| Backspool movement | strides, vaults and climbs, air take-offs, crouch: PASS |
| Combat | 8-hit chains, Sightline melee, burst rhythm, themed slots: PASS |
| Build features | impact FX, no halo trucks, menu: PASS |

None of these plays as Loadout, and none judges the visuals.

## Ring tone-down (after play review)
From the normal gameplay camera the first rings read as large cyan discs, so they were toned down. Only the ring and glint constants in the module changed. The entry is now `aaedbe4d…`.
- **Look:** the six views were recaptured into `evidence/stylized-atmosphere/after-rings-toned/`, with no page errors and 180 overlays. Rings are now small, faint ripples. The original `after/` captures are kept.
- **NOT RE-RUN:** the 16-step regression set and the perf runs were measured on `de0627b2…`. The change is shader constants only, with the same draws and the same instruction count, so no change is expected, but it has not been measured.

## Not done / NOT TESTED / limits
- Not played on hardware input. The real-input coverage comes from the regression suite only.
- **Rain-cover limits:**
  - The map is built once and is not refreshed after destruction (a destroyed roof leaves the floor dry).
  - Stacks with more than four layers can leave the lowest surface dry.
  - Surfaces near walls carry a 0.5 m (district) or 2.9 m (city) edge tolerance.
- Overlays cover the 180 largest sky-facing surfaces; smaller ledges and roofs stay dry.
- The reflections are stylised: sky, mist and procedural window streaks, not true reflections of nearby lights.
- Committed locally on `feature/saint-meridian-aaa-vertical-city-v02`; not pushed (the branch's local commits stay off GitHub).
