# Saint Meridian: Blender buildings in the browser game

The current `SIGHTLINE_SAINT_MERIDIAN_TOON.html` uses all eight authored building families across the existing 310 city lots, following the assignments in the Blender city. X/Z footprints and overall heights remain fitted to the original lots. Recesses, balconies, stepped roofs, crowns and rooftop machinery come from the authored models. Family usage: 62 terrace apartments, 58 balcony towers, 15 showrooms, 45 utility works, 24 townhouse blocks, 20 civic atria, 11 vertical spires and 75 twin-crown megablocks.

## Runtime assets

Eight self-contained GLBs and `collisions.json` live in `buildings/saint_meridian/`. glTF Transform 4.5.1 deduplicated and pruned the exports. Empty auxiliary Blender scenes were removed to satisfy glTF validation. Combined model transfer is approximately 3.2 MB. The editable Blender sources and original FBX exports remain under `blender/SaintMeridian/`.

The runtime directly reads indexed/interleaved accessor values; this avoids compatibility problems with the bundled Three.js r128 buffer conversion. Blender's procedural brick node does not export its base color, so the renderer restores the authored midnight cladding tint. A shared toon material receives per-vertex color and emission, retaining cyan edges, teal glazing, warm soffits and pale lamps in one draw per visible building. Glass uses opaque tinted shading for this browser preview; it is not real-time refractive glass.

Eight shared detailed geometries are used nearby; eight simpler versions omit panel seams, mullions, louvers and small trim at distance (460m desktop / 310m coarse pointer). Physics and ray targets always use the detailed building. Damaged buildings retain their changed detailed geometry at every distance. This is a bounded LOD strategy, not a claim of a sustained frame rate on every device.

## Contact and destruction

Compound collision boxes are exported from actual structural cuboids in the native libraries, with redundant enclosed boxes removed. Building shells are no longer treated as solid cuboids: visible balcony recesses and stepped roofs have matching structural volumes. Tiny decorative rails, aerials and bevel edges are not separate gameplay obstacles. Broadphase filtering bounds player collision searches to the relevant lots.

Courier civilians and guards relocate to actual broad roof surfaces, and rescue approach corridors are recalculated after import. Previous flat-shell facades, window cards, rooftop caps and fans are retired. District signs and steam are mounted to real facade surfaces where a ray finds support.

Impacts clip triangles at the damage box and preserve color/emission attributes. Geometry becomes unique only when damaged; carving/collapse never damages another instance sharing the original asset. Collision sections split with impact holes. Both detail and distant meshes disappear on collapse, while the existing crack decals, debris, sound and rescue recovery remain active.

The start button becomes ready after character and city loading. If any building download fails, the complete original city remains playable instead of showing partial replacements.

## Validation

- 21 building checks pass: all model families and lots, bounds, compound ownership, shared assets, LOD, 310 roof contacts and swept landings, player landing across eight families, damage, debris, shared-instance isolation, collapse, overlap recovery and four rescue route variants.
- 80 existing visual, courier, movement and route checks pass. The overlap assertion now checks actual compound volumes rather than assuming hollow imported architecture is a solid outer box.
- Browser console: no new runtime or shader errors. The previous FBX loader warnings remain.
- Screenshots reviewed at street/plaza and rooftop levels; automated keyboard movement/jump run completed. Physical controller hardware and a broad device performance sweep have not been repeated for this asset import.

These are interpretations of the supplied single-view references. Hidden elevations were inferred during authoring. Source art rights are not expanded by the browser conversion.
