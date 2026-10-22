# Temporal Exhaust implementation

Files owned by the VFX task:

- `scripts/game_temporal_exhaust.js`
- `scripts/test_temporal_exhaust.cjs`
- `output/threadrail/exhaust-report.md`

`window.createTemporalExhaust(THREE, scene, options)` creates scene-owned VFX without imports, lights, bloom, character edits, or actor forces. CommonJS exports the same factory for tests. The game supplies its existing Three.js r128 instance.

## Runtime API and triggers

- `bind(model)` finds `mixamorigHips` (then compatible hip/spine names, finally model fallback). It clears the previous model's effects.
- `bank({id, type/source})` receives a confirmed accepted bank event. It emits five short inward-moving luminous fragments plus one small collapsing broken ring. Repeated IDs are ignored.
- `release({id, deltaVelocity:{x,y,z}, mode, perfect, magnitude})` receives the **actual applied world-space** impulse. Direction is normalized negative `deltaVelocity`; visual strength also uses that vector's real magnitude. Zero/nonfinite impulses and repeated IDs are ignored. Upward braking creates downward-facing broken rings and compact layered slivers, with a faster stagger. Perfect or magnitude >=13 releases add a few rings and slices, within the same pools. Diagonal and sideways impulses orient the fan and rings opposite the actual force.
- `update(dt, {model, hero, active, velocity, position})` runs after character animation and transforms. It does not need velocity/position to invent any effect. `hero` other than `backspool`, or `active:false`, clears and hides everything immediately. Ordinary free fall has no trigger.
- `capture(renderer, camera)` runs immediately **after the existing world render**. While a release pulse is alive, it copies a single clamped 128×128 pixel framebuffer rectangle around the emitter into a reused texture. It never renders the world again. A faint next-frame sampled distortion is restricted to approximately 44 cm around the outlet. Unavailable framebuffer APIs or copy failure disable it safely. `options.refraction:false` disables it explicitly.
- `reset(reason)` clears all live pools and geometry visibility. Call for interruption, death, respawn, focus/pause cancellation and other lifecycle transitions.
- `state()` exposes source, meter offset, world outlet, emission direction, last accepted events, pool occupancy/capacities, visible draw calls, bounded refraction rectangle/support/copy count and reset reason.
- `dispose()` removes the group and disposes all owned GPU objects.

The effect combines cyan-white narrow curved motion slivers, restrained violet edges, discontinuous expanding annuli, thread fragments and small low-opacity body-shaped staggered slices. Lifetimes are 0.18–0.30 seconds, plus bounded event staggers. Nothing glows permanently. Free fall or continuous running alone cannot emit a release pulse.

## Existing device attachment evidence

The existing yellow-suit FBX contains one skinned body/device mesh; no added nozzle or device geometry is necessary. `BACKSPOOL_CHARACTER_NOTES.md` specifies the existing 1.82 m normalized model. The actual bundled r128 FBX parser produced normalized scale `1.9134289183030124`. In its rest pose, hips world position is approximately `(0,1.0602674,0.0143156)`.

Central lower-back device vertices inspected around the existing waist have rear extent `z=-0.1663039`, between `y=1.0015607` and `1.1248872`. Default hip-relative meter offset `(0,-0.020,-0.190)` places the outlet near `(0,1.0402674,-0.1756844)` before game yaw, slightly behind the existing device's rear surface. Offset is rotated by the animated hip's world quaternion every frame, so running, flips and wall movement retain attachment. Released fragments then retain their confirmed world impulse direction. `options.outletOffsetMeters` permits an explicit later visual calibration without modifying the model.

## Bounds

Four preallocated geometry batches: 48 slivers, 24 rings, 64 line fragments, 12 silhouette slices. Full pools recycle the oldest finishing item. Total maximum is 148 pooled records and four VFX draw calls, or **five** including optional refraction. Geometry and materials are created once. There are no skeleton clones, unbounded particles, effect-created lights, extra world passes or actor writes.

## Verification completed by VFX task

`node --check scripts/game_temporal_exhaust.js`

`node scripts/test_temporal_exhaust.cjs`

The test loads the exact Three r128/FBXLoader bundled in the candidate and the actual Backspool FBX. It verifies calibrated attachment, flipping around the hip, no model/hip position writes, direction from actual applied delta velocity, downward braking, duplicate/zero/nonfinite event rejection, 300-release saturation, finite generated geometry and buffer bounds, pool/draw-call caps, bounded capture arguments, inactive/hero clearing, natural expiration, explicit reset and disposal. Pass. The existing FBX loader's >4 skin-weight warning is unchanged.

A headless Chromium/Metal WebGL smoke test loaded the actual game and its Backspool model, then rendered the effect with the model in an isolated test scene. All VFX shaders compiled; optional framebuffer copy succeeded; the graphics context reported WebGL error 0. Perfect release had 15 slivers, six rings, 20 thread fragments and four slices (45 total), and five visible VFX draw calls. The scene's model plus initial VFX render used six calls. No browser or shader errors were reported.

Playable input, event wiring and rear/side/air/high-speed captures belong to the parent runtime integration and its game-level report. This report's WebGL smoke test establishes shader/runtime compatibility, not those full gameplay acceptance cases.
