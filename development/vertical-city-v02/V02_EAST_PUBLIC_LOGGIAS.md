# East public loggias — source-only development

**Not integrated into a playable game.** The tested game checkpoint remains the facade candidate. This project adds three public rooms to the Blender master at 24, 52 and 84 m, connected to the existing east gallery by level 3 m entrances. These are independent public spaces, not fictitious doorways through the original tower.

The master is `blender/SaintMeridian_V02_East_Public_Loggias.blend`. The source plan adds 91 records and changes six named guard/cap spans. Room floors extend from X100.7 to104.25, Z306 to314; 1.7 m bridges join the original gallery at X99 without overlapping coplanar floors. Canopies remain clear of the original building and the new window surrounds. Physical glass, seating, planting, roof surfaces and a continuous ground-rooted frame are present. No new dynamic light or original-building modification is introduced. Six source emissive ceiling strips use an independent material; that does not establish accepted room illumination.

## Completed source gates

- Original building triangles, original facade fittings and cassette envelopes clear every proposed new component. The source planner separately checks original compound obstacles, current V02 solids and road surface footprints.
- Continuous complete-vehicle envelopes clear the additions. Bounds retain the previously measured four-car train hierarchy, bogies, doors and interpolation error, and every air-model vertex under rigid rotation. Cubic Bezier hulls cover the entire native paths; centre samples do not establish this proof. All inherited geometry and route dependencies are hash checked.
- The current source is saved/reopened independently. Original objects outside the six controlled rail/cap changes and corresponding markers retain geometry, transforms, parents, properties, material nodes/links, images and lights. All 97 new/controlled components pass manifold, positive-volume, UV and envelope checks. Every walking floor/roof has an actual upward surface covering over95% of its declared footprint.
- Eight raw and eight packaged chunks cover25,742 source triangles, including replacements for three inherited affected chunks. All source corners are matched with orientation, material, UV and normal checks. Every rendered attribute, including tangents, is compared before/after offline batching. All eight assets report zero Khronos errors and warnings. Collider and ownership metadata have complete, unique record coverage.

## Export precision repair

The initial world-space mesh merge altered normals on small inherited bevels. The replacement pipeline keeps each actual Blender component's original local mesh and saved transform. Hidden export children share those source meshes; copying the saved TRS avoids a matrix-to-Euler decomposition round trip. glTF meshes are batched offline.

Dense rendered-corner checks also reproduced an in-place tangent-rotation bug in the installed glTF Transform4.3.0 `applyTangentMatrix`: its second and third assignments read already-overwritten components. The installed package is unchanged. The room packager explicitly transforms immutable input triples, then batches identity-space nodes. Current maximum batching position error is approximately0.00001514 m, maximum normal/tangent component error is below0.000000034 and UV error is zero. Raw source/export UV differences from the glTF image-coordinate conversion are reported separately. Material factors, texture images, samplers and bindings remain exact.

The rejected first world-space experiment remains locally preserved under `evidence/east-public-loggias/rejected-recomputed-export-normals`. Earlier room preview PNGs refer to that explicitly identified earlier source draft; they are not current-hash visual acceptance or browser evidence.

## Required next work

1. Bake and independently validate actual source diffuse lighting/UV2 for the new rooms. Preserve specular, environment and emissive contributions without double-counting existing diffuse light.
2. Derive a complete child game entry from the tested facade build. Load the room replacement chunks and their matching contacts; preserve all other city, controller, animation, mission, power and destruction systems.
3. Walk into and out of all three rooms using ordinary input. Check floor joints, guard openings, landings, camera clearance, visibility and desktop/portrait/landscape layouts. Teleporting is allowed only for labelled initial fixtures.
4. Admit graph nodes and public-room paths only from real traces. Existing commuters may enter only after their pedestrian routes and support are validated.
5. Re-run affected current routes, encounters, destruction/cleanup and sustained performance checks. Assess the support frame, furnishing, occupied-space readability and structural detail as architecture, not only collision boxes.
6. Continue the full V02 visual gate. The current district still has overly dominant continuous deck undersides, broad facade/massing issues and source/native lighting differences. These rooms and the window surrounds do not establish an approved-reference match.

The complete V02 goal remains open, including final mission/failure/legal-input destruction coverage, combined combat/replay/drone/destruction CPU/GPU stress, physical-device checks and final visual acceptance.
