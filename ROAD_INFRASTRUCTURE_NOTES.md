# Saint Meridian — roads and pedestrian infrastructure

The current browser build now contains connected streets between the existing building blocks. All 310 buildings, rooftop geometry, rescue locations and the central plaza are preserved. No vehicles or police actors were added.

## Streets

- Four-lane east–west boulevards: 3.4 m lanes, a 1.2 m painted median and 3.2 m sidewalks.
- Two-lane north–south neighborhood streets: 3.5 m lanes and 2.5 m sidewalks.
- Streets use the 80 m offset between the existing 160 m building rows. Building footprints and low props constrain complete street widths; obstructed sections are clipped and closed.
- The 115 m plaza remains pedestrian-only, with 16 connected pedestrian entrances. No vehicle route crosses it.
- Rounded junctions, lane arrows, center/dashed markings, stop lines, zebra crossings, low curbs, real curb ramps, gutter drains and selected loading/parking pads are included.
- Existing pooled streetlights are relocated alongside the new streets. Lighting uses the existing real-light budget and shared asphalt illumination.
- The superseded road strips, center lines and ground grid are hidden. Infrastructure renders in ten batches, primarily instanced planes/boxes plus merged junction and sidewalk geometry.

The generated network has 132 valid intersections, 668 candidate directed lanes and **642 patrol-ready lanes in one connected component**. There are 2,090 active turn connections, 528 controlled crossings, 76 clear storefront approaches and 35 staging/loading pads. Candidate lanes outside a connected patrol loop are not available to future patrol routing. There are 38 explicitly closed street sections, principally around the plaza and outer skyline obstructions.

## Navigation interfaces

`window.roadNetwork` exposes the deterministic version-1 network:

- `nodes`: stable IDs, world-space intersection positions, validity and signal offsets.
- `segments`: surface endpoints, street type/width, sidewalk width and whether the corridor is complete.
- `lanes`: directed centerlines, 3.4/3.5 m widths, 40/25 km/h limits, stop positions, `EW`/`NS` signal groups, outgoing turn IDs and patrol component membership.
- `turns`: sampled turn centerlines, source/destination lane IDs, movement type and crossing IDs to yield to. Active turns are validated using a 4.8 × 2.0 m vehicle envelope.
- `pedestrian.nodes/edges/crossings`: separate sidewalk, crossing, plaza-access and storefront routes. Crossing edges reference their signal permission.
- `stagingPoints`: clear loading/police staging positions, headings and nearby active lane references. These are preparation data, not an implemented parking maneuver or dispatch system.
- `surfaceAt(x,z)`: visible sidewalk/ramp height outside the existing special plaza convention. `surfaceFeetAt` integrates these heights with the game's existing 0.42 m feet/collision offset.
- `signalState(nodeId)`: current phase by traffic direction. Each direction has 16 seconds green, 3 seconds amber and 1 second all-red; the full alternating cycle is 40 seconds.

`window.roadNetworkState()` returns compact counts, closures, rendering batches, signal examples, pedestrian coverage and readiness/error status. The normal `render_game_to_text()` output includes this under `roads`.

Use only `active` lanes and their outgoing turns for future traffic. Turning vehicles must honor `yieldToCrossings`; the future actor implementation remains responsible for car following, intersection occupancy, braking, parking access, vehicle physics and police response. The independent seed does not consume the existing city/mission random generator.

## Player and pedestrian integration

The existing 28 ambient pedestrians now traverse the separate pedestrian graph. They wait at closed crossings and continue when the compatible traffic phase is green. Their movement and the signal clock freeze when gameplay pauses. They remain scenic, nonblocking actors rather than rescue civilians or police.

Sidewalks support grounded movement and fast landings. Grounded steps up/down of at most 0.2 m remain controlled. Curbs are not added as character crash-wall volumes. Skinned sole placement now respects sidewalk and ramp height while retaining rooftop and plaza handling.

Road surfaces remain aim targets and searchlight landing surfaces. Spatial analytic ray queries replace full-city triangle scans for those meshes. Twenty-four sampled ramp hits matched native mesh raycasts within approximately 0.000002 m. Building impacts cannot accidentally erase the new street instances through the old broad visual-cleanup sweep.

Road generation runs after imported city resolution and also works when a building GLB fails: an intentionally aborted building request produced a ready original-city fallback and 642 patrol-ready lanes. A road-generation failure disables its partial ray/support registration and retains the legacy streets.

## Verification

**225 checks passed on the final build:** 182 existing regressions plus 43 road-specific checks. These cover lane direction, route connectivity, reference-vehicle clearance, pedestrian crossings, signal timing, pause, sole contact, curb stepping, fast landings, ground aim locking, airborne controlled fall, firing into flight, camera clearance and existing destruction.

A live keyboard/mouse sequence walked from the road onto a sidewalk at Y 0.58, remained grounded, locked position during aim, retained `fallControlled` during airborne aim and entered `TRANSIT / fly` when firing. Street, overhead/rooftop, flight, portrait-touch and landscape-touch screenshots were inspected. The pre-existing landscape HUD overlap remains outside this road change; physical multi-touch/controller testing was not performed.

Normal browser runs reported no new JavaScript or shader errors. The original FBX warnings remain. The standard web-game client's headed boot returned ready state but an opaque black canvas export; its first headless attempt stalled and was stopped. Dedicated Playwright viewport screenshots and gameplay probes supplied the actual visual/input verification, so the client boot is not counted as successful gameplay coverage.

### Performance evidence

The before/after five-second samples used the same 1280×720 camera pose, with attack timers suppressed and normal patrol beams still running:

| Metric | Before | After |
| --- | ---: | ---: |
| Median frame interval | 16.7 ms | 16.7 ms |
| 95th-percentile frame interval | 16.7 ms | 16.7 ms |
| Additional dropped simulation time | 0 | 0 |
| Scene draw calls at the sampled view | 254 | 192 |
| Scene triangles at the sampled view | 697,664 | 831,787 |
| Short CPU submit/update median | 1.8 ms | 2.2 ms |

The observed median frame interval met the 10% frame-time target, and the street layer stays below the 20-batch target. CPU work and triangle count increased even though the frame interval did not; these measurements do not guarantee equivalent performance on mobile GPUs or during prolonged high-speed/destruction play. The detailed outputs are `roads-performance-before.txt` and `roads-performance-after-final.txt` under `output/playwright`.

## Files and reproduction

- Runtime source: `scripts/game_road_infrastructure.js`.
- Deterministic integration: `python3 scripts/apply_road_infrastructure.py`, using the retained `.pre-road-infrastructure.html` baseline. It reconstructs the current HTML from that baseline plus the road source and explicit integration edits.
- Validation: run the local server on port 8765, then `python3 scripts/validate_road_infrastructure.py`. This uses a separate Playwright CLI browser and writes `output/playwright/road-validation-summary.json`.
- Screenshots: `output/playwright/roads-final-street.png`, `roads-final-rooftop.png`, `roads-final-flight.png`, and `roads-final-touch-390.png` / `roads-final-touch-844.png`.

The separate Blender city and Unity preview were not modified. Future vehicles, civilian behaviors and police patrol/alert-response systems can consume this infrastructure in the next actor implementation pass.
