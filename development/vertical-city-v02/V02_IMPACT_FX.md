# V02 Impact FX: debris, decals and hit feel

Candidate: `SIGHTLINE_SAINT_MERIDIAN_V02_IMPACT_FX.html`. It is built from the Sightline melee candidate by `scripts/vertical-v02/build_impact_fx_candidate.py`, which applies 9 inverse-verified hooks.

All effects live in one module, `scripts/game_impact_fx.js`. Damage, building carving, collapse and collision are unchanged; this is presentation only. The old rubble and decal code is kept as a fallback in case the module fails to load.

## Before

- Every crash left the same scorch plane, which was removed only when more than 48 had piled up.
- Grey icosahedron rubble flew out, one mesh per chunk.
- There was no dust, no sparks, no surface types, no flash and no world hit-stop.
- Enemy shots that hit walls simply vanished.

## What the module does

### 1. Debris (instanced particle systems)

- **Chunks:** low-poly 3D chunks, one instanced mesh (one draw call) per chunk kind, 220 per pool:
  - jagged rocks with jittered vertices for concrete and asphalt;
  - flat metallic shards for metal;
  - thin translucent slivers for glass.
- **Motion:** chunks burst outward in a cone around the surface normal with a high initial speed, then arc under the game's gravity (22 m/s²).
- **Landing:** they bounce off the real ground height, which is re-read every 4 frames, then slide with friction, stop, rest for 5 s and shrink away.
- **Dust:** a second layer of soft clouds that fade in, grow, rise slightly and linger 0.9–1.6 s. Strong ground impacts also push out a ring of dust.
- **Sparks:** glowing streaks stretched along their velocity, with gravity and drag, 320 at most. They are instanced boxes, because WebGL draws lines only 1 px wide.

### 2. Decals (lasting damage)

- **Art:** decals are drawn procedurally on a canvas with an alpha channel, two variants each:
  - cracked concrete: a chipped light core with tapering, branching fissures;
  - ground crater;
  - metal dent: a dark hole with a silver ring and scratches;
  - glass star crack;
  - shot scorch.
- **Placement:** each decal sits at the hit point, aligned to the hit surface's normal, randomly rotated and offset slightly to avoid z-fighting. Enemy shots take their normal from the raycast face.
- **Lifetime:** fully visible for **30 s**, then the opacity fades to 0 over **2 s**, then the decal is destroyed. At most 64 are live; past that, the oldest starts fading early.
- **Collapse:** when a building collapses, its decals are cleared.

### 3. Surfaces (physical materials)

| Surface | Chunks | Dust | Sparks | Decal | Flash | Sound |
|---|---|---|---|---|---|---|
| Concrete (buildings, default) | jagged grey rock | grey | – | cracked concrete (scorch for shots) | warm | low thud |
| Asphalt (ground) | dark rock | brown-grey, plus a ring | – | crater | warm | dirt thud |
| Metal (props) | bright metal shards | light | many | dent | cool white | metallic clink |
| Glass | translucent slivers | pale | few | star crack | cyan-white | high crack |
| Body (melee targets) | – | puff | amber, or cyan when guarded | – | warm on heavy hits | – |

- **How a surface is chosen:** from the collider, using building vs prop and the hit normal for ground.
- **Overrides:** any collider can set its own `surface` field.

### 4. Game feel

- **Dynamic light:** two point lights stay in the scene permanently at zero intensity, so shaders never recompile. Each impact flashes one for about 0.14 s.
- **Camera shake:** small and high-frequency, scaled by impact strength and faded out by distance to the camera (none beyond 45 m).
- **Hit-stop:** the whole world scales to 4% speed for a short time, capped at 0.1 s:

  | Impact | Hit-stop |
  |---|---|
  | Heavy melee hit | 0.07 s |
  | Breach or collapse | 0.09 s |
  | Hard landing | 0.06 s |
  | Flat impact | 0.08 s |

## Where impacts come from

| Source | Hook |
|---|---|
| Sightline crashes, structural breaches, building collapses | `surfaceImpact` (strength from speed; collapse 2.6) |
| Enemy shots striking walls | projectile wall raycast (strength 0.25, source `shot`) |
| Sightline hard and flat landings | `beginLanding` (crater) |
| Backspool drops over 4.5 m | graded landing selection (crater) |
| Every connected melee hit, both heroes | `resolveHit` (sparks and dust; heavy hits flash and hit-stop) |

## Evidence

- **Impact test** (`test_impact_fx.cjs`), using an effect harness plus three real sources:
  - **Surface layers:** every surface spawns chunks, dust and a decal. Metal throws sparks and concrete does not. A heavy body hit sparks and hit-stops without rubble.
  - **Debris settling:** debris comes to rest within 4 s, sitting on the ground rather than in it or floating.
  - **Decal lifetime:** a decal is at full opacity before 30 s, about half faded at 31 s, and destroyed after the fade.
  - **Flash and hit-stop:** the flash is gone by 0.25 s. A collapse-strength impact hit-stops the world for under 0.12 s.
  - **Sightline landing (real):** falling from height into a hard landing punches a crater.
  - **Enemy shot (real path):** a projectile run through the game's own update hits a concrete block and leaves a shot burst.
  - **Backspool heavy strike (real input):** a virtual-pad heavy (R3 lock, D-pad up) sparks, hit-stops the world and flashes.
  - No page errors.
- **Regressions on entry `07e664e4`** (`evidence/impact-fx-checks/`, run muted) all PASS:
  - 13 friendly wall-contact scenarios
  - the graded landing test
  - three city loops
  - six station approaches
  - the 12 retained encounter/replay/discovery cases
  - the stride, vault, crouch, 8-hit combat, Sightline, rhythm and themed-slot tests
  - the impact test
- **Load flake:** the air test failed once mid-run, with one rising frame showing no role, while a second headless browser was running alongside. It passed when rerun alone (`air-rerun.log`).
- **Performance:** twelve strength-1.5 bursts at once (about 200 chunks in flight) moved frame time from a median of 11.8 to 12.0 ms and p95 from 15.5 to 15.8 ms (headless).
- **Visual review:** close-up frame sequences of concrete, metal, a ground crater and a heavy body hit, plus the in-game landing and heavy-strike screenshots.

## Limits

- **Walls:** debris bounces off the ground only, so chunks can pass through walls. Removing the old swept wall check keeps the cost bounded.
- **Decal shape:** decals are flat quads. On edges and corners they overhang rather than wrap around (no projected geometry).
- **Surface detection:** surfaces come from the collider type. The 310 buildings are all concrete, so there are no per-façade glass panes yet.
- **Not covered by the test:** the four surfaces' sounds are synthesized but not checked.
- **Feel is untuned:** feel numbers (counts, speeds, shake, hit-stop lengths, flash strength) are first settings and have not been tuned by playing.
- **Other impacts:** Backspool's powers, Echo strikes and drone crashes do not route through the module yet.
- **Hardware:** nothing has been tested on a physical controller or a lower-end GPU.
