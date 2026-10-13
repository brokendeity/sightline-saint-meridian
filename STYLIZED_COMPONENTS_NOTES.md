# Saint Meridian — stylized shader integration

Implemented in SIGHTLINE_SAINT_MERIDIAN_TOON.html; backup: SIGHTLINE_SAINT_MERIDIAN_TOON.pre-stylized.html.

## Rendering changes

- Sky: spherical four-octave 3D value noise replaces the old projected clouds. Teal cloud masses have violet detail and moon-facing rims; the textured moon and halo are obscured by cloud cover. Existing warm horizon, altitude response and sparse stars remain. Reduced motion freezes sky animation.
- Wet streets: 142 existing puddle patches plus six plaza patches share one instanced shader. Two expanding cel-style rings respond to rain, grounded movement, landings, ground impacts and debris. Eight reusable world-space event records bound the cost; rings are clipped to wet ellipses. Dry surfaces and airborne movement cannot emit puddle rings. Footstep events are independent of audio initialization. Reduced motion suppresses ripple emission. These are stylized light patterns, not real-time mirror reflections or a fluid simulation.
- Outlines: an eight-tap luminance Sobel kernel is integrated into the existing bloom/color pass. Strength is 0.18 and luminous pixels are protected, preserving neon highlights. This adds subtle contrast edges without extra geometry or depth renders. It is not a depth-only architectural silhouette filter, so high-contrast texture details can also be affected.
- Adaptive resolution: keeps existing desktop/mobile pixel caps, then reduces the drawing-buffer ratio to 75% after two sustained slow sampling windows. Six healthy windows restore it. After three changes it settles at the reduced setting to avoid repeated resizing. Initial loading, paused and hidden frames are excluded. Simulation and HUD dimensions are unaffected. A detected fast frame cadence can tighten the target toward 120 Hz; display refresh detection is heuristic.

## Source and license

Adapted from Christian Ortiz (Cortiz), [stylized-components](https://github.com/cortiz2894/stylized-components): SkyDome spherical noise helpers, OutlineFilter Sobel equations, and WaterFloor ripple evaluation. The adaptive policy follows AdaptiveResolution's single reduced step and oscillation fallback, implemented for our plain Three.js runtime. React/R3F components and the newer Three.js runtime were not imported.

The source commit is recorded in third-party/stylized-components/SOURCE_COMMIT. Its complete MIT copyright and permission notice is preserved in third-party/stylized-components/LICENSE and in the HTML source.

## Validation

80 checks passed: 20 new shader/interaction/adaptive checks, 24 Courier regressions, 20 base regressions and 16 route/results checks. Existing FBX warnings remain; no new browser/shader errors. The supplied web-game client completed a smoke run.

Inspected desktop sky, clean ripple, city outlines, normal ground play, and a 390×844 portrait play view. A frozen before/after outline comparison changed 122,724 pixels at 1280×720, confirming the subtle pass is active. A short portrait sample with 120 measured frames returned median/p95 approximately 16.7 ms at DPR 1; this does not establish performance across hardware or at full rail speed. Real controller hardware and broad browser/GPU testing remain unverified.
