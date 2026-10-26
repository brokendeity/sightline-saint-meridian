# V02 scheduled transit candidate

This is a separate phase-six candidate, not the completed city or a replacement
for the accepted detailed, graybox, V1 or original gameplay builds.

Entry: `SIGHTLINE_SAINT_MERIDIAN_V02_TRANSIT.html?capture=backspool`.

The unchanged Hi3D lead car now pulls three Blender-authored passenger cars on
the measured wider block loop. Native THREE arc-length sampling drives body
poses, independent bogie steering and wheel rotation. Passenger plug doors move
out before sliding along the sidewall. Only the station-side passenger doors
open; fused front doors/bogies remain rigid. Coupling rods connect actual car
end sockets. This is kinematic transit, not a vehicle dynamics simulation.

The controller has a 16 m/s straight-line ceiling, curvature-dependent speed
limits, 1.2 m/s² acceleration and 1.7 m/s² braking. It stops the front at
`[80,100,402]`, opens for 0.8 s, dwells 8 s and closes for 0.8 s before departing.
All phases use simulation time. Pause freezes cars, doors, wheels and events.
The public `verticalCityState()` interface remains available and reports the
replacement service; `verticalTransitState()` exposes detailed diagnostics.

The previous four cars and 200 old track blocks are retired only inside this
candidate. Blender exports continuous rail/deck strips in 20 chunks from exact
native curve samples. The saved dynamic carriage and fixed track source is
`development/vertical-city-v02/blender/SaintMeridian_V02_Transit_Assets.blend`.
No original buildings or building models are exported again.

## Reproduce

Run from the repository root, with the project server on 127.0.0.1:8766:

```sh
node scripts/vertical-v02/build_transit_definition.cjs
node scripts/vertical-v02/test_transit_core.cjs
/Applications/Blender.app/Contents/MacOS/Blender --background --python-exit-code 1 --python scripts/vertical-v02/blender_transit_assets.py
/Applications/Blender.app/Contents/MacOS/Blender --background --python-exit-code 1 --python scripts/vertical-v02/validate_transit_authoring.py
python3 scripts/vertical-v02/build_transit_candidate.py
node scripts/vertical-v02/check_transit_geometry.cjs
TRANSIT_ADAPTER_ONLY=1 node scripts/vertical-v02/test_transit_native.cjs
```

Omitting `TRANSIT_ADAPTER_ONLY` runs every frame through the whole game and is
substantially slower. Keep browser tests sequential. The fast mode performs
120 whole-game settling frames, then directly advances the actual browser
transit adapter; its complete loop is not a full-world gameplay regression.
Both modes load real exported assets, inspect actual door/bogie matrices and
use the existing shared camera solver. No train transforms, phase timers or
speeds are injected by the test.

`V02_Transit_Implementation_Evidence.json` binds current source, assets, saved
Blender contact checks, exported bounds/triangle checks, native adapter traces
and the installed web-game skill client's actual state/image. The historical
full-world cycle predates the wheel and timer fixes and is labelled accordingly.
It is not evidence that the latest candidate passed the final release suite.

## Remaining work

The train is **not boardable**. A safe connected platform, gap protection,
carriage physical support/contact and any admitted boarding flow remain open.
Only camera collision has been integrated with moving carriage geometry.
The new loop's static mechanical supports are unfinished; free spans are not
structurally certified. Continuous track geometry alone does not establish
support continuity. Aerial traffic and ambient destinations still need work.

The wider original objective remains active: full retained gameplay checks,
reference-matched Blender/browser views, final materials/lighting/HUD review,
the outstanding advanced-edge timings and sustained matched performance tests
have not been completed by this checkpoint.
