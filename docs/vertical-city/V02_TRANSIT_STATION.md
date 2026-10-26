# V02 public station and supported train loop

Candidate: `SIGHTLINE_SAINT_MERIDIAN_V02_TRANSIT_STATION.html?capture=backspool`.
This derives from the latest V02 transit game. Earlier entries stay intact.

Blender source: `SaintMeridian_V02_Transit_Master.blend` in the V02 development
directory. The accepted detailed master is opened read-only. The source keeps
the 310 original buildings as references and exports none of them again.

The wider rail loop has 50 support locations, using 48 new ground piers and two
existing V02 columns. Crossheads connect the piers to a continuous visible box
girder. AABB contacts match the visible segmented girder, avoiding a large hidden
collision wedge through curved track. Maximum source spacing is about 35 m.
These are architectural source contacts, not engineering load certification.

The public waiting platform is 3.15 m wide and 64 m long at 100 m. It connects
through a 2.8 m opening at Z384.2–387.0 in the existing V02 concourse guard.
Only `public-guard-0185` and its cap are replaced; all other detailed contact
records retain their exact metadata. The platform has a weather canopy,
cantilever/riser supports, end guards and a full-height rail screen.

The platform is walkable; **train boarding remains unavailable**. The screen
protects the rail gap. Moving carriage character support/collision has not been
implemented; moving carriage camera geometry is integrated and tested.

Four navigation nodes and eight directed public edges connect the existing
station information area to both platform ends and back. Collision, ownership,
physical Threadrail surfaces, movement graph and route matrix are exported
separately and bound to the current manifest. Nine inherited advanced-edge
timings remain explicitly unmeasured.

## Validation and reproduction

```sh
python3 scripts/vertical-v02/plan_transit_structure.py
/Applications/Blender.app/Contents/MacOS/Blender --background --python-exit-code 1 --python scripts/vertical-v02/blender_transit_environment.py
python3 scripts/vertical-v02/validate_transit_environment.py
python3 scripts/vertical-v02/build_transit_station_candidate.py
/Applications/Blender.app/Contents/MacOS/Blender --background --python-exit-code 1 --python scripts/vertical-v02/validate_transit_master.py
node scripts/vertical-v02/validate_transit_world_glbs.cjs
python3 scripts/vertical-v02/validate_transit_graph.py
V02_TRANSIT_WORLD=station node scripts/vertical-v02/check_transit_geometry.cjs
node scripts/vertical-v02/test_transit_station.cjs
V02_TRANSIT_WORLD=station TRANSIT_ADAPTER_ONLY=1 node scripts/vertical-v02/test_transit_native.cjs
```

Use the project server on 127.0.0.1:8766. Browser tests run sequentially. The
station test begins at one labelled local fixture with an empty Drive bank;
after that it uses ordinary controller movement, including attempted movement
into the visible screen and the guard outside the opening. It never injects
health, train motion, powers or intermediate player positions.

`V02_Transit_Station_Evidence.json` binds current source/export checks, original
road and recorded-route preflight, actual station input and browser train cycle,
screenshots and preserved-entry hashes. The train cycle's fast mode directly
advances the real browser adapter after its initial whole-game frames. A full
integrated world regression and sustained performance run remain separate.

The first export failure is preserved. A hidden Blender export collection had
produced empty GLBs; the runtime refused their coordinates. Authoring now makes
the collection exportable and rejects empty selected exports. An independent
validator also checks nonempty mesh/accessor data, bounds and Khronos results.

The full city objective remains incomplete. Aerial traffic, ambient destinations,
retained gameplay regressions on the final world, visual/reference matching and
sustained performance/release acceptance are still required.
