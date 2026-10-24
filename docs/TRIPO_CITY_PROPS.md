# Tripo city props

Candidate: `SIGHTLINE_BACKSPOOL_TRIPO_CITY.html`, based on `SIGHTLINE_BACKSPOOL_AFTERSTEP_VFX.html` without changing either older build.

The generated barrier and planter are installed in the central plaza's automatic vault lane. Three copies span each original obstacle footprint. GLBs rotate 90 degrees to align the source long axis with the lane, then fit to the established width, depth and height. Solid collision proxies remain authoritative for automatic traversal, support, camera and impact queries. Original visible placeholders are suppressed only after successful model loading; failures retain the placeholders and report diagnostics in `backspoolVaultCourse.state().imported`.

`assets/city/tripo/manifest.json` records Tripo task IDs, source-page URLs, SHA256 hashes and sizes. Original 4K downloads are preserved in `source/`; shipped copies use 1024px maps with unchanged meshes. Browser download exports used GLB and incurred no further generation credits.

Rebuild assets with `python3 scripts/prepare_tripo_city.py` while the original Downloads files exist; build candidate with `python3 scripts/build_tripo_city.py`. Run `node scripts/test_tripo_city.cjs` for asset loading and fitted bounds. The adapted existing vault regression passed all 16 cases; captures and evidence are in `output/tripo-city/`. This pass does not claim a new performance benchmark or physical-device playtest.
