# Hi3D asset batch — preparation gate

Active gameplay foundation: `SIGHTLINE_BACKSPOOL_WHIP_THROW.html` on `feature/saint-meridian-vertical-megacity-v1`. The pre-megacity rollback remains separate. No playable source was changed by this audit.

## Connection evidence

2026-10-24: `codex mcp login hi3d` returned “Successfully logged in”. Streamable HTTP endpoint is `https://agent.hi3d.ai/mcp`. The running chat exposes no Hi3D tools yet; reconnect/reload the MCP session before schema discovery. Authentication success does not establish generation or export capability.

Do not submit paid requests until published tool schemas, account costs and a concrete batch budget are available. No costs have been estimated, no credits spent, and no new generation budget approved.

## Inventory

See `assets/city/vertical/development/asset-inventory.json` for existing GLB hashes and findings. Preserve all eight building families, ground props and existing transport assets. The current train and flying cars are procedural placeholders; they are not finished hero models. Ground Halo transport is not a substitute for an aerial patrol craft.

## Reference prompts

Shared direction: one coherent hard-surface object, completely visible, centered against neutral medium-gray background; midnight-blue cladding, graphite structural panels, thin cyan trim, restrained warm amber interior light. No city backdrop, text, logos, dramatic perspective, motion blur or cropped components. Use a clear three-quarter design view first. Derive consistent orthographic front/back/left/right views from the SAME design, rather than independently inventing each side. Exact upload ordering depends on Hi3D's published schema.

1. **Train front:** metropolitan passenger front carriage, 14 m long, 3.2 m wide, approximately 3.6 m tall; streamlined rectangular silhouette, readable windscreen, warm passenger windows, cyan running strip, visible bogies and underside, rear coupling interface. Matching repeated middle/rear carriages will be modeled traditionally.
2. **Civilian taxi:** compact 4.8 m aerial sedan, recognizable passenger cabin and doors, dark blue body, four recessed cyan lift units, warm cabin, coherent underside. Avoid wings and exposed weaponry.
3. **Halo aerial patrol:** 6 m armored civic patrol vehicle, angular graphite hull, cyan propulsion pods, articulated searchlight housing, small emergency indicators, readable cockpit and mechanical underside. Separate searchlight assembly in post-processing.
4. **Station:** 18 m repeatable transit-platform module, sheltered glass passenger waiting area, warm ceiling fixtures, cyan wayfinding strips without lettering, clear platform edge and end-to-end modular interfaces. Supports and long platforms remain procedural.
5. **Skybridge connector:** 6 m facade docking vestibule, dark steel load-bearing collar, glass passage, mechanically readable brackets, warm recessed ceiling and cyan safety trim; flat facade mating plane and unobstructed walkway opening.
6. **Elevator:** 3 m wide glass-fronted exterior lift pod with graphite frame, cyan trim, warm interior, closed sliding doors, visible guide shoes; long guide rails are modeled procedurally. Keep pod and guide interfaces distinct.
7. **Skyport:** 12 m taxi docking module, enclosed passenger entrance, dark structural perimeter, cyan landing guidance and warm recessed lighting; clear central docking zone. Long access decks and supports remain procedural.

Dimensions are target asset-authoring sizes, not confirmation of procedural-city clearance. Final placement must pass actual collision and traversal tests.

## Intake and delivery checks

For each approved task retain source image hash, exact schema/settings, task ID, actual credit charge, immutable original model, and retrieval receipt. Inspect silhouette, underside, texture coherence and fused parts before accepting. Blender processing adds correct meters/orientation, independent simple collision, pivots, moving-part separation and LOD. Never use whole decorative triangle meshes as gameplay collision.

Next gate: expose authenticated Hi3D tools, inspect actual Quality/Master options and image requirements, obtain exact batch quote, prepare reference imagery, then request paid-batch approval. Current geometry remains an unfinished prototype; reference matching and uninterrupted traversal acceptance remain open.
