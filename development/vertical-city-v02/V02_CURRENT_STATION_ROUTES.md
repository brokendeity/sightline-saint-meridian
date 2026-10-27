# Current station approaches and movement graph

The full `SIGHTLINE_SAINT_MERIDIAN_V02_PUBLIC_TERRACES.html` game now has current input evidence for all three station approaches, including the new architecture, scheduled transit, scenic world life and exact camera-query adapter. The original graybox reports are preserved. This work changes test tooling and a separate graph export; the current HTML, assets, source Blender master, missions, powers and controller implementation are unchanged.

## Actual complete journeys

Each run uses one labelled ground fixture. Afterwards it uses ordinary keyboard buttons and, for the advanced routes, standard simulated controller movement/look axes. No in-route actor/camera assignments, direct rail creation, health writes or resource injection establish a route. Full initial banks come from supported running before the timed journey. Zero means **zero initial bank**; normal movement can earn impulses during the journey.

| Approach | Initial bank | Input time | Travel | Drive releases |
|---|---:|---:|---:|---:|
| Public stairs and galleries | 0 | 135.33 s | 774.38 m | 0 |
| Public stairs and galleries | 5 earned | 135.08 s | 773.98 m | 0 |
| Momentum: two physical rails and Pops | 0 | 73.23 s | 702.01 m | 0 |
| Momentum: two physical rails and Pops | 5 earned | 72.65 s | 701.84 m | 0 |
| Mastery: four wall ascents, upper rail, Pop and recovery descent | 0 | 103.77 s | 933.72 m | 0 |
| Mastery with actual lower fall brake | 5 earned | 103.30 s | 933.51 m | 1 |

All six finish supported at the same station goal without injury or console errors. Public runs have no airborne frames. Advanced runs retain sampled animated-head/hips visibility during fast/airborne non-aim motion, with no problem samples in the measured 10 Hz checks. This does not certify every pose, between-sample visibility, physical controllers or complete camera quality.

These are deterministic 60 Hz input-step times, including aiming/precision and deliberate input stops, rather than wall-clock performance or human speed records. Bank preparation is excluded. Small differences between zero/full variants include waypoint/preparation endpoint tolerances and do not establish a bank-dependent speed advantage. The actual sequence-clock intervals are retained separately for discrete phases.

## Corrected graph and missing timings

`V02_Current_Movement_Graph.json` and `V02_Current_AbilityRoute_Matrix.csv` are separate current exports containing 138 nodes and 297 directed edges. They retain the original transit design plus the three terrace branches. Thirteen ability edges have measured native event intervals: the nine formerly null rail/Pop/descent/Afterstep timing fields and four wall ascents.

The traces exposed six mismatches larger than 35 cm between source-plan points and actual catch/Pop/recovery positions. The current export explicitly corrects those nodes. It retains the planned source positions and physical attachment evidence separately from the player's blended rail-catch pose. Native event paths are sampled from the actual actor trace; no movement or power limit is changed to make a proposed route pass.

The two final descent timings begin when the player actually crosses the supported 108 m source-node region and end on the first supported station arrival. They exclude the preceding catch exit and final pause. Other corrected-node adjoining edges receive recalculated geometric estimates and remain **not input-admitted**. The original design graphs and their old null fields remain immutable historical evidence. The new graph is a design/evidence export; the game continues using its existing public-routing manifest.

Independent saved-data validation reads the full compressed traces again, checks all 24 phase/variant intervals, real rail entry/exit and Pop/touchdown events, wall participation, actual brake spending, six controlled node corrections and public directed connectivity. Connectivity is kept distinct from physical input admission.

## Captures, failure and limits

Every route has retained native stage/arrival captures and a compressed full trace. The three review sheets cover the retained stage images. The public capture branch initially skipped the final render, leaving a stale plaza image despite a passing input trace. Those images/reports and an explicit rejection record remain in each `initial-capture` directory. Both public cases were repeated after adding an explicit render-only capture of the final native camera; the camera is never reassigned for the new arrival screenshots.

The current captures still show heavy overhangs and a large dark upper region at the station. Facade variety, architectural proportions, warm/cool surface response and the broad approved-reference composition remain unfinished. These functional passes do not approve final art. The entire combined encounter/replay/destruction/mission regression suite, current geometry's sustained performance run, fixed-resolution/GPU-aware release measurements and physical-device review remain open. Parent camera-optimization performance numbers are not results for the terrace geometry.

## Reproduce

With the local server on port 8766:

```sh
python3 scripts/vertical-v02/run_current_station_routes.py
python3 scripts/vertical-v02/measure_current_route_events.py
python3 scripts/vertical-v02/build_current_movement_graph.py
python3 scripts/vertical-v02/validate_current_movement_graph.py
python3 scripts/vertical-v02/write_current_station_evidence.py
```

`--resume` on the first command accepts only a terminal PASS with matching current game, manifest, test/configuration sources and retained full trace. Browser cases run sequentially. The existing three test scripts still default to their original graybox behavior when no current-build environment is supplied. Old results are never replaced by the current runs.

`V02_Current_Station_Evidence.json` binds current sources, summaries, traces, graph files, rejected captures and reviewed images. Full V02 completion remains false.
