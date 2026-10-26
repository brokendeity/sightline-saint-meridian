# V02 scenic traffic and public activity

Candidate: `SIGHTLINE_SAINT_MERIDIAN_V02_WORLD_LIFE.html?capture=backspool`.
Derived from the accepted station/support checkpoint `376345f4`; older entries
and the accepted station Blender master remain unchanged. This is a phase-six
milestone, not the completed city or a final visual/performance acceptance.

The candidate replaces its inherited 24 narrow-loop scenic craft with 36 shared
hover vehicles at 38, 65 and 114 metres. Three lightweight original Blender
models provide commuter, delivery and municipal silhouettes. At most six material
batches per model share geometry across instances; camera-distance/frustum
culling collapses hidden instances. No dynamic light is added per vehicle.

The inherited route envelopes intersected 3, 3 and 11 obstacle owners against
the current supported station world. New wider-loop routes keep all buildings,
support piers and architecture fixed. Lower bands offset three metres outward;
the upper band offsets three metres inward. The middle band runs in the opposite
direction. Clearance checks use a full bank-enclosing 2.8 × 1.8 × 5.6 m envelope
plus 20 cm margin at at most 25 cm sample spacing. This is conservative sampled
evidence, not continuous collision certification.

Preferred speeds vary by agent and band. Curvature limits speed, following
maintains headway, and banking is smoothed and capped at 12 degrees. Simulation
uses the existing game clock and pauses with the game. This remains scenic
kinematic traffic, without pursuit, combat or vehicle physics.

Eight visitors reuse the existing prototype street pedestrian appearance:
three walk between transit information and the protected station platform,
three visit the commercial gallery, and two pause at the observation outlook.
Routes check full body clearance and support footprints. Visitors yield to the
hero, other visitors and existing market residents. They own no mission,
combat or reward state and do not block the hero physically. The existing market
rescue and station pursuit actors retain their original owners. The first
market route hit the existing information kiosk; its failed report is preserved
under `evidence/fixed-defects/world-life/`, and the route now avoids it.

## Reproduction and evidence

Run from the Git checkout with the current local server on port 8766:

```sh
node scripts/vertical-v02/build_air_routes.cjs
node scripts/vertical-v02/build_ambient_routes.cjs
node scripts/vertical-v02/validate_air_assets.cjs
node scripts/vertical-v02/test_air_flow.cjs
python3 scripts/vertical-v02/build_world_life_candidate.py
node scripts/vertical-v02/test_world_life.cjs
node scripts/vertical-v02/test_world_life_binding.cjs
V02_STAGE=world-life node scripts/vertical-v02/test_transit_station.cjs
V02_STAGE=world-life V02_EVIDENCE_RUN=world-life-regressions LOCAL_ONLY=1 node scripts/vertical-v02/test_market_rescue.cjs
python3 scripts/vertical-v02/write_world_life_evidence.py
```

Browser tests must run sequentially. `validate_air_assets.cjs` uses the existing
local Khronos validator installation in `output/local-scratch/train-validation`.
`blender_air_vehicles.py` authors the three assets. The separate saved
`SaintMeridian_V02_World_Life_Master.blend` contains the accepted full city,
runtime-derived route curves, shared clock-zero fleet instances and public
visitor destination markers. It does not reexport or duplicate the original
310 buildings. Rebuild it with `build_world_life_snapshot.cjs`, then run
`blender_world_life.py` in Blender background mode; its `--validate` pass opens
the saved master independently. Current saved architecture bounds differ from
the accepted runtime manifest by at most 61 micrometres.

`V02_World_Life_Evidence.json` binds the source, exports, native reports,
screenshots and protected entry hashes. The ten-minute pure controller test
covers repeated following and turns. The three-minute native test advances
the new adapter after 120 full-game frames; it is not a full-world performance
run. Separate station and local rescue tests drive the full game through actual
input after one labelled initial fixture each. The installed skill client also
ran and its actual screenshot/state were reviewed; that short burst establishes
import readiness only. No physical controller or touchscreen testing is claimed.

## Outstanding work

Close captures confirm that all three vehicle variants and public visitors render
in the actual city. Their art is still simple, and the inherited HUD obstructs
several views. The initial market wide inspection is blocked by architecture;
separate close views are included. Final matched reference cameras,
Blender/browser renders, materials, lighting and HUD work remain open. Nine
advanced graph edges still lack measured timings. All final retained gameplay
scenarios and matched active performance runs of at least 60 seconds remain
required. Train boarding and moving character support are not implemented;
the public waiting platform remains separated by its rail screen.
