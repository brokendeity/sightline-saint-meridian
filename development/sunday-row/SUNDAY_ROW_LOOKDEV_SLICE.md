# Sunday Row look-dev slice (2026-11-09)

**What it is:** a standalone look-development page for Backspool's home district, not a game build.

- **The page:** `LOOKDEV_SUNDAY_ROW.html`.
  - It shows one block of Mercer Avenue (the Mercer Strip), about 180 m.
  - The block is authored in Blender, and the anime look is rendered in Three.js r128.
- **Controls:**
  - keys **1–5** jump to preset views;
  - drag to orbit, mouse wheel to zoom, **WASD** to move;
  - **H** hides the panel.

**Files:**
- **Geometry:** `scripts/sunday-row/blender_sunday_row_slice.py` produces `assets/city/sunday-row/slice/mercer_strip_slice.glb` and `.json` (sign anchors, views, layout). It is deterministic.
- **Look:** `scripts/sunday-row/sunday_row_look.js`. It is a reusable module and entirely procedural: no image assets.
- **Captures:** `scripts/sunday-row/capture_slice_views.cjs` writes `development/sunday-row/evidence/slice-v1` … `slice-v4`.

## Canon used (Map Bible, read for the first time this session)

**Who and where:**
- Backspool is **Aramis Ward**.
- His district is **Sunday Row**: "the loud, dense, lived-in Black neighborhood of churches, food spots, apartment buildings, schoolyards, corner stores, stoops."
- His home is **406 Bell Street**, a 4-storey brick walk-up in the Interior Courts.

**Mercer Strip street character:**
- two- to four-storey brick mixed-use buildings;
- ground-floor businesses with apartments above;
- fire escapes, window AC units, church placards.

**Canon places in the slice:**
- Weller's Bakery, with a planter (the bakery planter site);
- Mr. Lawson's bodega and its milk-crate corner, with folding chairs;
- Lawson Court, the service spur behind the bodega, with a laundry line;
- the Mercer bus stop;
- a barber;
- a Mount Gideon annex placard.

The shop names are original, with no real brands.

**What this means for the look:** the reference video is a Japanese anime repaint of GTA. So the slice takes its rendering principles, but not its places. A Japanese suburb would contradict canon.

## What is in the look

- **Sky:**
  - a painted sky dome with procedural cumulus;
  - 18 art-directed cumulus sprites, each one silhouette with a lit top and lavender belly;
  - three hazy layers of skyline towers.
- **Lighting:** a warm sun from the south-west with soft 4K shadows, and a cool sky fill.
- **Materials:**
  - toon materials on a 4-step ramp, plus a separate foliage ramp;
  - painted canvas maps for brick, sidewalk slabs, asphalt and leaf dabs;
  - window glass with sky gradient and highlight streaks;
  - warm, amber-lit storefront interiors.
- **Signs:** canon and shop signs, sidewalk A-frames and wall posters.
- **Post:** ink lines from depth and normal edges, soft bloom, an anime grade (saturation, cool shadows, warm highlights) and a vignette.
- **Street life:**
  - power poles with sagging wires, service drops and transformers;
  - street lamps, trees, hydrants, bins and news boxes;
  - parked cars, bikes, potted stoop plants;
  - rooftop tanks and boxes, tar roofs.
- **Surroundings:** low-detail brick blocks, so raised views do not show a void.

## Honest status

- **Implemented:** everything above, rendering with no page errors, captured at 1280×720.
- **Judged against the reference (side by side; not committed, because it uses third-party frames):**
  - **Matched:** the block's structure, density and composition.
  - **Not matched:** the painted surface detail and wear, painted leaf silhouettes (ours are blobs), modelled cars and props (ours are boxes), dappled light and bounce light, a painted skyline matte, people, and a night version.
  - **Overall:** roughly a clean stylized cartoon, about 40–50% of the reference's feel.
- **NOT TESTED:**
  - frame time and draw calls for the scene (not measured);
  - playing it as Backspool (not in the game yet);
  - a night or dusk version;
  - phones.

## What closes the gap (the next steps)

1. **A Blender asset kit with real modelled detail:**
   - storefront modules, cornices, stoops;
   - fire escapes with ladders;
   - cars, vending and newspaper boxes, chairs, crates.

   Optional Tripo3D hero props need the user's approval and a credit cap.
2. **Painted surfaces:**
   - wear and variation masks;
   - decals (grime, posters, graffiti, shop stickers);
   - a sky reflection in windows.
3. **Foliage:** leaf cards with painted leaf textures and wind sway, so the silhouettes look like the reference.
4. **Light:**
   - dappled light under trees (light-cookie decals);
   - warmer bounce light on sunlit walls;
   - a painted skyline matte in place of box towers.
5. **Night version:** neon, wet asphalt, warm windows and lamp pools. The reference's night back lane is the target.
6. **Then the game:** place Sunday Row in the city, add traversal routes for Backspool (walls and Threadrail anchors), measure performance, and test with real input.

---

# Anime-paint look: location-independent (2026-11-09, second pass)

**Your clarification:** what has to transfer is the **visual look**, so it should work on any location.

**What the reference really is:** realistic game rendering (GTA V) repainted by an AI. Its look comes from four things:
- realistic light underneath: occlusion, bounce, sky-lit blue shadows, glints;
- painterly simplification of detail into brush patches;
- a film grade: saturation, teal shadows, warm highlights, glow, crisp local contrast;
- sparing ink lines on silhouettes.

Toon bands, as used in the first slice, belong to a different family.

**New module:** `scripts/look/anime_paint_look.js`. It wraps any Three.js r128 scene:
- **Materials:** it converts the scene's materials to physically based ones (roughness and metalness come from a role hint). Glass and car paint get clearcoat.
- **Lighting:** an environment map is built from the scene's own sky.
- **Post:**
  - depth-based ambient occlusion;
  - a 4-sector Kuwahara painterly filter;
  - ink on depth silhouettes;
  - warm halation;
  - luminance-only local contrast;
  - an ACES tone curve and the grade.
- **On the slice:** `LOOKDEV_SUNDAY_ROW.html?look=paint`. The default without the parameter is still the toon look.

**Results:**
- `paint-v1` had artifacts: the skyline went black because a material shared by about 200 towers was converted once per tower, there were colour fringes from chroma-based local contrast, and highlights blew out.
- All of them were fixed in `paint-v2`.
- Judgement: the light and grade now belong to the reference's family.

**The limit, stated plainly:** the post-process cannot invent detail. The reference looks rich because detailed models are underneath. The slice's boxy cars and props are now the main giveaway. Next:
- Tripo hero props (approved, 800-credit cap, generating);
- the Blender detail pass through the Blender MCP;
- a test on the existing V02 city, to prove the look transfers.

**NOT TESTED:** frame time. The Kuwahara filter samples about 100 times per pixel at full resolution, so it may need half resolution in the game.
