# V02 upper receiving mounts and camera candidate

This is a separate, unpromoted development candidate. It does **not** establish
completion of Saint Meridian V02. The approved-reference architecture, materials
and lighting gate remains incomplete, as do combined release stress and physical
device playtests. Existing HTML builds and GitHub snapshots remain preserved.

Entry: `SIGHTLINE_SAINT_MERIDIAN_V02_UPPER_ANCHORS.html`.
Authoritative identities are in `V02_Upper_Anchor_Build.json`; entry SHA-256 starts
`f2c97a19`, manifest `792e4bb3`, saved Blender master `e027b3e5`.
The candidate derives from the preserved Body Framing entry `149603ae`, which
derives from the uploaded diffuse-lighting checkpoint `87c4931`.

## Actual problems and changes

The strict settled-aim route test exposed a real architectural weakness: the
upper second cartridge could hit the vertical deck edge a few millimetres below
the top. A successful grazing top hit was not a reliable receiving surface.
Two source-authored low utility bollards now provide real receiving faces on the
existing upper observation/exit decks. They sit east of the X64 running lane.
No throw reach, slope, attachment, collision or Afterstep limits were widened.

The first tall post version allowed attachment but obstructed the Pop. Its
source and failed evidence remain in `evidence/upper-anchor-initial-tall/`.
The current housings are 0.94m tall with 0.20m receiving plates centered at
Y128.8. The arrival face points toward the approaching rail. Six collision
records correspond to solid rendered housings, shoes and receiving plates;
thin decorative borders do not create invisible crash walls.

The new master forks the preserved diffuse master, retaining 47,082 existing
objects, local transforms, parents, visibility, material-node inputs/links and
packed images. Twelve new components use four shared materials, one additional
720-triangle GLB and zero additional dynamic lights. Independent master reopening,
source/export corner parity, UV conventions, winding, bounds and glTF validation
are recorded separately. Original-city and moving-vehicle clearance are separate
native/continuous checks, not inferred from the source render.

Camera V2 respects the existing camera-owner families. Manual exploration look
and precision aiming keep their presentation bias; equipment composition yields
to the existing rail/Drive camera after its 0.9s manual-input grace. The final
body fit only adjusts orientation/FOV within its cap, never camera position,
raw movement intent or physics. The V1 body script and prior builds remain intact.

Private HUD positioning keeps the actual avatar clear of vitals and combat
feedback. Native warning nodes retain their IDs, content and simulation-clock
lifetime. Native skeleton/mesh sampling, explicit manual-look and touch-drag
tests are needed in addition to settled camera fixtures.

## Route-driver correction

The first six-route attempt failed because the simulated controller inverted a
radial stick deadzone separately for each axis. Two tiny diagonal corrections
therefore became an excessive combined stick magnitude and caused aim to cycle
around the target. The correction uses the vector magnitude to invert the
shipped radial deadzone jointly. The game input code is unchanged.

`test_native_camera_vector.cjs` exercises actual Gamepad polling through native
ticks, including axis, diagonal and saturation cases. It also demonstrates the
old helper's overshoot through that same polling path. Strict visible and latent
settled-aim thresholds are preserved. This establishes the simulated test input,
not physical controller feel or arbitrary human route robustness.

The failed driver/scripts/check report remain in
`evidence/upper-anchor-diagonal-driver-failure/`. The runner can reuse only the
13 independent prefix checks when their commands, environments, tests, helpers,
runtime and assets remain identical. Its allowed changes are the two downstream
route drivers, the new controller regression and the runner itself. It records
the prior report hash and changed paths, then reruns all affected route cases.

## Evidence and acceptance

Current terminal/running results live in `V02_Upper_Anchor_Checks.json` and the
component reports it references. A running or failed report is never acceptance.
Route reports retain input traces, actual construction/catch/Pop/landing events,
resources, distances, camera samples and screenshots. One labelled initial setup
is allowed; routes do not teleport the actor or construct rails through APIs.

`V02_Upper_Anchor_Movement_Graph.json`, when generated after all six route passes,
admits only the two measured upper-rail/Pop phases. True surface attachment nodes
are separate from the actor-root-minus-0.42m ground-reference path. Inherited
edges and changed adjoining endpoints are not silently recertified.

The matched benchmark measures 60 simulation seconds at fixed 1280×800 on a
supported lower-loop workload, with native scheduling, CPU timing and GPU timer
queries where available. It does not establish combined combat/replay/destruction
release performance. Memory endpoint samples do not establish leak freedom. The inherited scheduler
dropped-time counter does not measure time discarded before its outer frame
clamp; a zero counter must not be described as zero real dropped time.

Saved-source fixture renders and native screenshots answer different questions.
Matching projection proves geometric optics, not matching shading, animation,
traffic, reflections or approved-reference visual quality. The original A/B
comparison cameras are preserved; a labelled elevated public-gallery study may
help diagnose facades but cannot replace the original comparison or pass the
visual gate by reframing.

## Remaining full V02 work

- Refine the actual Blender-authored facades, occupied terraces, structural
  detail, station architecture and warm/cool lighting toward both approved views.
- Resolve source/native lighting noise and reflection/parallax discrepancies.
- Complete broad mission, destruction, failure recovery and combined stress
  acceptance on the eventual final candidate.
- Verify physical controller/touchscreen behavior and sustained thermal stability.
- Publish bounded checkpoints without replacing older builds; promote a final
  candidate only when its full requirement-by-requirement gates pass.

## Current bounded performance result

The completed pair covered the same 640.6536m in 60 simulation seconds each.
All 30 sampled actor and constrained-camera positions matched exactly; final
orientation/FOV can differ because of body composition. At fixed1280×800:

| Measurement | Uploaded lighting baseline | Upper-mount/body candidate |
| --- | ---: | ---: |
| GPU p50 / p95 | 6.768 / 9.321ms | 6.656 / 9.298ms |
| Simulation CPU p50 / p95 | 8.7 / 16.9ms | 8.7 / 16.8ms |
| Frame interval p50 / p95 | 8.9 / 18.1ms | 8.6 / 18.3ms |
| Visible world calls p50 / p95 | 412 / 503 | 401 / 500 |
| Load to readiness | 8897ms | 8698ms |
| Coarse heap endpoints | 342MB → 342MB | 364MB → 364MB |

No runtime errors were reported. The scheduler recorded0.2401s/0.2432s of its
own dropped-time counter; the outer-clamp limitation above still applies.
Observed maximum frame intervals were119.1/124.8ms. This one pair shows no
median regression in this workload; it is not a general speedup claim, a
combined-stress result or a long-duration memory/thermal certification.
