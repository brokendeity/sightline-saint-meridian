# First Hi3D train asset — candidate integration

One approved v3.0 Quality generation completed for exactly 40 credits (4020 → 3980). Geometry plus stylized texture, Private, no PBR, no paid retries. Reference and exact settings are recorded in `assets/city/vertical/development/train-reference-task.json`. Published MCP tools remain unavailable in this running chat; generation used Hi3D's visible website controls.

Raw export is preserved locally at `assets/city/vertical/train/source/model.glb` (145235676 bytes). This exceeds GitHub's ordinary per-file limit and is intentionally not included in Git. The editable normalized Blender source is `assets/city/vertical/train/train_front_source.blend`, also retained locally. Neither local source should be deleted. Runtime GLBs and hashes are versioned separately.

## Integration

Latest game remains `SIGHTLINE_BACKSPOOL_WHIP_THROW.html`; its builder composes the current vertical module. The first carriage now loads the actual generated front GLB; remaining three cars are still procedural placeholders. Asset loading failure is visible through `verticalCityState().trainAssetStatus` and `.trainAssetError`. No building layout, hero animation, cartridge binding, main build or old GitHub snapshot was replaced.

The normalized model is approximately 3.10 m wide × 4.49 m high × 14 m long. Uniform scaling preserved the generated proportions. It is taller than the initial 3.6 m art target. Conservative static route sample envelope enlarged to 4 × 6 × 16 m; this remains sampled clearance, not swept turn/coupling certification. Existing tight return curve, track alignment/support gaps and scenic traffic limitations remain open.

## Optimization and evidence

LOD0: 59985 triangles, 7176620 bytes. LOD1: 23358 triangles, 3221276 bytes. LOD2 stalled at the same 23358 triangles; the 4000-triangle goal was NOT achieved and it is not wired into runtime. Current integration uses LOD0 only. Textures were downsampled to 2048 locally. Separate doors/bogies, geometry cleanup and traditional middle/rear modeling remain pending.

Blender emitted mesh-validity warnings. The resulting GLBs passed Khronos glTF Validator with zero errors/warnings, and browser renders were inspected from front, side and rear. This format validation does not establish production topology quality or all-distance silhouette acceptance.

`VERTICAL_TRAIN_INSPECTOR.html` provides a neutral model preview. `scripts/capture_vertical_train.cjs` waits for full city/road/Backspool readiness, stops animation scheduling for a stable camera capture and asserts the real train asset loaded. The game screenshot is `output/vertical-city/hi3d-train-in-game.png`; the generated concept image is not used as game evidence.

Validation run: vertical-city train motion/pause/310-lot checks; whip keyboard, simulated controller and touch-input regressions; installed web-game skill client capture. Physical device testing remains separate. GLB validation details in `assets/city/vertical/train/validation.json`. Sustained performance targets and complete district traversal acceptance remain pending.

This is the first generated asset integration, not completion of the megacity brief. Six other hero-asset families have not been submitted for paid generation.
