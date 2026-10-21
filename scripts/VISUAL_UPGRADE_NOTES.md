# Saint Meridian visual polish

The implementation is `game_visual_upgrade.js`. Install once with:

```sh
python3 scripts/apply_visual_upgrade.py
```

The patcher only changes exact hooks and stops before writing if they have moved. It can write a separate test page with `--output SIGHTLINE_VISUAL_POLISH_QA.html`. Running it on an already integrated build is harmless; it also repairs the visor's old fog restoration value if needed.

Implemented:

- One shared imported-building shader supplies subdued panel paint, weather staining, warm room variation and four nearest motivated surface light sources. The full and low-detail versions retain shared geometry/materials and colored/emissive attributes.
- Midnight fronts are readable, while cyan edge emission, warm soffits and silver seams have lower brightness. Moon, hemisphere, rim, exposure and teal fog are composed together; the existing bloom and outline remain restrained.
- Sixteen district businesses use one 2048×512 canvas atlas. 606 front/back signs are ray-mounted on the actual imported facade; both edges are checked for a matching surface so signs do not bridge deep recesses.
- Fifty streetlights, wet light pools and signs use four instanced draw objects total. Nearby range is 360 m desktop and 230 m mobile; update/culling interval is 0.18 s. Existing two real neon PointLights are reused, rather than creating hundreds of lights.
- Collapsed or unsupported sign mounts and their light sources disappear. Both projected and real source selection honor the owner's damage state. New art never enters collision, walkable, camera obstacle, rail target or mission registries.
- **Actual render defect fixed:** r128's depth-only offscreen target defaults to a 16-bit depth renderbuffer. With near 0.05 / far 1800 it produces black diagonal stripes where glazing, mullions and recesses are close together. `stencilBuffer:true` requests packed 24-bit depth/stencil for the post target. It removes the stripes while retaining geometry, shadows, camera clipping and MSAA. A direct framebuffer render was clean before the fix; post rendering is now clean too.
- Standard vision restores density 0.00108 after visor mode. Shader/lighting state appears in `visualPolishState()` and `render_game_to_text().visuals.polish`.

Exact insertion and hook boundaries:

1. `new PhaseTarget(1,1,{depthBuffer:true})`: enable packed depth/stencil.
2. After `window.importedCityState=...`: insert the self-contained visual layer.
3. `importedBuildingMaterial()` final return: wrap the shared material with `cityVisualPolish.material(mat)`.
4. `prepareBuildingTemplate()` source material tint/emission: adjust only cladding, light strips, warm soffits and silver seam intensities.
5. `importBlenderCity()` status-ready commit: build scenic art after all 310 models/colliders are committed.
6. `renderNight()` after `updateVisualBudget` and `updateDroneSpotlights`: update scenic culling, projected light sources and camera-centered shadows. The rest of the render function and scene-call accounting stay intact.
7. `renderNight()` existing nearest neon source selector: filter invalid owner mounts.
8. `render_game_to_text()` visual object: attach diagnostics.
9. `toggleRailRead()` standard fog restoration: use the composed density.

Validation: 25/25 checks in `output/playwright/visual-polish-tests.js`, results saved to `visual-polish-results.txt`. Covers all eight families/310 lots, one shared atlas/material, four draw objects, unchanged gameplay registries, compiled shader status, finite projected sources, mobile culling, unsupported/removed mounts and collapsed phantom lights. The QA page has zero console errors; only the pre-existing FBX warnings remain.

Inspected captures: `visual-polish-depth-fixed.png` (clean close facade with shadows), `visual-polish-raw-debug.png` (direct framebuffer diagnostic), and `visual-polish-city.png` (city overview). Root should capture the final combined build at ground, rooftop and mobile view after applying its gameplay/HUD changes. The temporary QA HTML is disposable and should not ship.
