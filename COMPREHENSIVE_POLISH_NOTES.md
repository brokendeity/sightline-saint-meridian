# Sightline comprehensive polish

The playable build is `SIGHTLINE_SAINT_MERIDIAN_TOON.html`. This pass improves the existing eight-family city and traversal game; the editable Blender assets and separate Unity preview remain available.

## Visuals and lighting

Midnight cladding now has quiet panel variation and rain staining, tinted glass has selective warm interior color, and moon/fill lighting reveals the architecture's volume. Neon edges and soffits are balanced against deep shadows. Procedural asphalt variation and colored pavement pools make the streets less uniform.

Sixteen Saint Meridian businesses share one 2048×512 sign atlas. There are 606 facade-mounted signs and 50 scenic streetlights across the city, culled to nearby ranges. The additional signs, pavement pools, poles and luminaires use four instanced draw objects. Four nearby projected light sources shade actual buildings and asphalt, while the existing two real neon point lights remain the budget. Destroyed or unsupported sign mounts and their light sources are retired. Street furniture is scenic and does not block rail movement.

Packed depth/stencil on the post-processing target gives the bundled Three.js renderer a 24-bit depth buffer instead of the previous 16-bit depth buffer. This removes diagonal stripes caused by quantization between thin doors, windows and trim; geometry and shadows are retained. Camera near distance stays 0.05m.

## Gameplay and mechanics

Jump presses are buffered for 0.16 seconds, with 0.11 seconds of ledge grace. Keyboard, controller and touch use the same edge-triggered request; holding jump does not automatically repeat after landing. Ground aim still locks body translation. Jump takeoff leads into controlled fall; airborne LT aim retains that pose until RT launches the straight rail into flight.

Drone and rooftop guard shots have a visible committed aim shaft and endpoint before firing. Two enemies can wind up simultaneously, with a four-projectile cap. Breaking line of sight, stunning/blinding an enemy, or escaping its leash cancels the attack. Shared projectile and warning assets keep allocation bounded. Drones retain their white bodies, patrol beams and red high-alert state.

Q/LB retains its one-per-rail pressure vent and adds a 0.22-second timed projectile guard, with a 0.65-second cooldown. A successful guard deflects the shot, grants 150 points, and briefly exposes weakpoints through the existing perception system. Clean landings give modest strain/debt recovery with a cooldown and a readable HUD cue. E/X remains the dodge.

## Camera, controls and presentation

The camera is constrained against nearby detailed surfaces after both interpolation and shake. Looking steeply upward no longer puts it underground; close and thin walls no longer contain it. Flight floor constraints shorten the camera-focus vector to retain centered crosshair alignment. The established base and LT camera distances/FOV are preserved.

The normal HUD shows speed, strain, condition, passengers and alert status. Numbered route diamonds show the next recovery/approach/rescue/extraction target, with edge arrows for offscreen targets. Context hints identify firing, recovery, guard and rescue actions. F3 exposes the retained diagnostics panel. The start/pause menu explains the mission in three short steps, with a collapsible controls guide.

## Runtime performance

A fixed 60Hz accumulator carries the remainder and bounds long-frame catch-up. Near-60Hz frames no longer trigger two complete simulation updates. HUD throttling uses actual simulation delta. Static geometry ray candidates are filtered spatially, and remote patrol beam occlusion checks are staggered; active chase and nearby beams stay responsive. Camera queries preserve actual triangle hits, and building compound collision remains authoritative.

The old render counters reported only the final two-triangle post quad. `runtimePolishState()` now includes scene draw/triangle counters captured before post-processing. Short local CPU samples showed substantially lower world/camera update cost; those are diagnostics, not a guaranteed frame rate across devices.

## Validation and limits

The integrated build passed 80 existing gameplay/visual/courier regressions, 29 new mechanic checks, 13 runtime/camera checks, 14 presentation checks, 25 lighting/material/sign checks, and 21 building contact/destruction checks. Screenshots cover street, skyline, roof, incoming shot and portrait UI. Console and shader compilation are checked; the prior FBX loader warnings remain.

Keyboard, touch actions and a simulated standard controller were exercised. Physical controller hardware, rumble and a broad device/browser performance sweep were not repeated. Opaque tinted glass, procedural illumination and local light budgets are deliberate browser approximations rather than refractive glass or baked global illumination.

Original game backup: `.pre-comprehensive-polish.html`. Implementation fragments and targeted patchers live under `scripts/` for review. The current HTML contains the integrated runtime; rebuilding from the backup requires the patchers in presentation → runtime → gameplay → visual order, plus the small final integration refinements documented in `progress.md`.
