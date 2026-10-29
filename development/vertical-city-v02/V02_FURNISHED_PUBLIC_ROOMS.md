# Furnished public rooms — current candidate

Full-game entry: `SIGHTLINE_SAINT_MERIDIAN_V02_FURNISHED_PUBLIC_ROOMS.html`, SHA256 `0fe895d6f438c7a640f9903f98a28dd89229f2186e050093f4bbdf7cc847a289`. This is a separate child of the published flared-crossing game; neither the default entry nor earlier builds are replaced.

Six 48 cm-high benches now have individual composite seat panels, under-seat beams and U-shaped steel supports. Their actual rendered meshes fit the exact previous physical envelopes. Three rear-wall circulation diagrams show the established street/gallery/transit/observation heights, highlighting the current level. The artwork is locally drawn from existing graph data, packed into the Blender source and exported with physical UVs. Rear-wall metal ribs give the waiting areas a more specific architectural purpose. No new hero powers, district expansion or paid generation is included.

The three printed boards have explicit thin contacts. All original shipping records and all existing collision boxes are preserved, with three additional solids: 10,647 contacts total. New geometry stays outside the established room through-path. The existing eleven visitors and 36 scenic aircraft retain their routes and behavior. The known market civilian/hero overlap is not fixed by this room-only update.

## Source and lighting

`SaintMeridian_V02_Furnished_Public_Rooms.blend` is the saved/reopened furniture source. An independent validator compares it against the flared-crossing source, checks old object transforms/materials/packed images, actual manifold bench geometry and bounds, board orientation and unmirrored UVs.

`SaintMeridian_V02_Furnished_Public_Lighting.blend` is the separate current lighting child, SHA256 `491bc0e50571debe92fc0707bc312fc28f97fb70b0bc4d581932f1bd15dc32b1`. Every room has a new 1024×1024 scene-linear UV2 atlas baked with 512 CPU samples from only the six existing physical room fixtures. Global lights, sky and other emitters are isolated during this bake and restored before saving. The fixture intensity remains96; no new dynamic light is added. Room-local 512×256 reflection probes are rendered with64samples from the full updated source scene.

Two real pipeline failures are retained. The initial inherited gutter collapsed the crowded furniture atlas. The next result had inter-object UV overlaps because differing original material-image aspect ratios affected multi-object packing. The final pipeline binds the square destination image before UV operations, disables base-image aspect correction and explicitly packs cardinal AABB islands without overlap merging. Independent source checks prove finite UVs, continuous triangle nonoverlap, broad opaque texel coverage and exact packed HDR identity; none of those gates were weakened. The rejected source/report/GLBs/atlases and diagnostic scripts are separate evidence, not usable rollback games.

All three shipping GLBs pass source/raw/batched rendered-corner, normal, UV, tangent and material checks and Khronos validation with zero errors/warnings. Seventy-eight other chunks are reused. The complete game builder inverse-proves that only the manifest and three source-contract/loader tags change; original hero, animation, power, combat, mission and input code remains byte-identical.

Packaging terminology: the packager's `recordsUnchanged` assertion compares the shipping records against the **furnished source manifest**. Its `parentManifestSHA256` identifies the earlier **flared shipping manifest** used for inherited metadata. These are distinct parents. The separate provenance record names both explicitly and verifies that the flared records are preserved with exactly nine rendered/physical records appended, three of which are solid. Do not interpret that field as claiming no new records were added.

## Verification status

The current ten-job suite is `V02_Furnished_Public_Rooms_Checks.json`. It records terminal results separately for native inspection, the unchanged installed web-game client, 180native simulation seconds of world life, nine room/control cases, three public loops, six station approaches, short-catch recovery, twelve retained encounter/replay/discovery cases, five saved-source camera renders and a matched60-second performance pair. A running job is not a pass.

Native inspection already confirms the original310building full/LOD attributes, transforms, materials, compound parts, plaza and main lights; the inherited bridge support/removed-area queries; actual textured-board ray hits; and rendered gaps under the new seats. Current board PNGs were opened: text reads in the correct direction and highlights each level correctly. The boards remain printed surfaces under scene lighting, not self-lit UI overlays. Canonical reference cameras were not moved.

The full approved-reference art gate remains **FAIL**. Large bare platforms, repeated facade grids and placeholder civilian art remain. Remaining original mission/destruction/failure regressions, broader traversal/combat camera cases, combined stress/frame-spike investigation and physical-device playtesting are open. The wider inherited global lighting outside these newly baked rooms is not certified by this local fixture/probe pass.

## Reliability work next

Finish current-build gameplay acceptance first. Then address the reproduced market NPC separation failure, traversal/camera edge cases, encounter lifecycle/destruction/original mission preservation and combined performance. Keep the full city objective active and preserve every older checkpoint. New architecture and additional powers wait behind that reliability work.

## Terminal current suite and measured cost

All ten sequential current jobs terminated0. The six station routes use actual controller/keyboard input, four real wall ascents, physically thrown cartridges, rail transfers and landings; the short-catch demonstrates a supported recovery. All twelve retained encounter/replay/discovery cases also terminated0. Actual source5renders, native boards/canonical views, current room desktop/portrait/landscape, stock/world-life, key encounter outcomes and both benchmark timelines were opened. These bounded passes do not certify the broader release.

The fixed1280×800 pair covers640.6536m over60simulation seconds each, with identical sampled player/camera positions. Frame p50/p95 changed8.5/17.8→9.5/25.0ms (+11.8%median); simulation CPU7.1/15.7→8.9/17.5ms. Render submission4.1/5.0→4.4/5.2ms; GPU7.426875/10.004125→7.489541/10.436207ms,1223/1079valid samples, zero disjoint. Draw-call medians408→407, p95525→522. Dropped time0.2198→0.5269s, load9389→10430ms. Candidate max frame133.2ms. Memory API reported the same coarse386MBused/435MBtotal; this is not total GPU/native memory. The CPU/frame-time increase is an open regression/investigation, not a performance PASS or proven causal cost of furniture. No other automated browser/Blender workload ran during this pair. Video first tiles include loading before the measured workload.
