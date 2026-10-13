# Saint Meridian — browser toon visuals

Build: `SIGHTLINE_SAINT_MERIDIAN_TOON.html`, based on Phase E. Previous builds and the supplied Unity package remain unchanged.

Inspected the nested RealToon Built-In RP shader's property set: self-shadow threshold/hardness, shadow color, highlight/gloss, outlines, texture preservation and rim lighting. Implemented an independent browser-native visual interpretation with four-step lighting, cool shadow tint, rim highlights, stylized gloss and a thin skinned character outline. Original diffuse/normal/emissive maps are retained. Wet pavement stays PBR to preserve Phase D reflections; neon signs, rain, sky and transparent red body ghosts keep their existing effects.

This is not a Unity RealToon import, byte-for-byte shader port or full feature-equivalent implementation. Unity HLSL, tessellation, URP/HDRP integrations and MatCap masking are not executed in the Three.js browser build. Proprietary shader source was not embedded in the browser artifact.

Validation: character uses MeshToonMaterial with a shared-skeleton outline; shader diagnostics show zero compile failures. 20/20 gameplay regressions passed. Ground and aiming screenshots inspected. Existing FBX skin-weight warning remains. Prior controller/animation/collision/mission behavior preserved. Evidence: `output/playwright/toon-character.png`, `toon-ground.png`, `toon-regression-results.txt`.
