# Three-level gallery weather arcades

The complete-game candidate is `SIGHTLINE_SAINT_MERIDIAN_V02_GALLERY_ARCADES.html`. It derives from the current façade-architecture game and changes only the V02 geometry-manifest folder. Existing gameplay, inputs, animations, powers, missions, hero switching, appearance shaders and camera policies remain unchanged. All twelve previous protected entries remain byte-identical.

## Architecture and circulation

Three Blender-authored public shelters occupy existing supported galleries:

| Level | Existing gallery | Covered section | Function |
|---|---|---|---|
| 24 m | West, `gallery-W-24-326` | Z330–344 | Weather shelter on the lower public loop |
| 52 m | East, `gallery-E-52-300` | Z312–324 | Covered circulation beside the service-yard approach |
| 84 m | West, `gallery-W-84-376` | Z380–392 | Covered upper-gallery passage near the public transfer |

The minimum passage between columns is 5.16m; the lowest beam has 4.05m of headroom. Roofs, beams and posts have visible source geometry and matching registered physical records. Warm recessed ceiling cassettes, flush-mounted strips and thin cyan drip edges extend the established dark-metal language. These are public weather shelters, not invented private apartments or false entrances into the original buildings.

The new master, `blender/SaintMeridian_V02_Gallery_Arcades.blend`, forks the validated façade master. All 40,496 previous source objects retain their transforms, custom properties and mesh signatures. No old building, floor, guardrail or accepted structure is removed or repositioned. The addition contains 54 records, including 30 solids, in three modular chunks with 2,292 triangles. It adds one shared soffit material and no dynamic lights, exposure or bloom changes.

The first middle-canopy location placed a post inside the E0138/E0139 service-yard approach. That failed preflight is retained in `evidence/gallery-arcades/preflight-source-route-conflict.json`. Moving the canopy two metres along the same gallery preserved the junction. Dense existing-world volume checks and conservative directed-route body corridors then passed. These checks protect proposed paths; they do not upgrade untested graph edges to certified routes.

The full bank-inclusive aerial envelopes are vertically disjoint from every added component at every route position. The actual loaded train profile, with a further one-metre articulation margin, fits inside the reserved Y96–106m envelope; the highest new roof is Y88.6m. Existing ground roads remain unchanged. Source-supported floor→column→beam→roof relationships are retained in the support metadata.

## Native gameplay evidence

Eleven native groups pass on the combined candidate. They cover preservation of all 310 original building meshes/transforms/compound parts, 7,012 previous structural contacts, ground roads and light count; registration of the 30 new contacts; three normal-W passages with ordinary camera movement; the exact Z326 service entrance; three normal-gravity roof landings; a faster downward/lateral roof-contact fixture; and actual source-triangle ceiling/top contacts.

Each public passage uses one labelled initial gallery setup, then native movement only. It stays grounded and consumes no power releases. The service-yard entrance also uses ordinary movement. Roof landing tests are clearly labelled local initial fixtures, **not** proof of a route onto those roofs or a full Sightline flight-input sequence.

Three additional recovery cases start locally on the maintenance roofs, then use W, native gravity and native camera/contact handling to return to the connected public galleries without damage or power releases. They demonstrate recovery from those surfaces, while access to them remains separately unverified. Native source rays see the actual four-centimetre ceiling recesses and flat roof tops; these API probes do not certify new normal-input cartridge throws.

Fifteen retained HUD/input cases pass with no console errors, including keyboard, simulated controller and browser touch emulation. The installed Develop Web Game client also ran unchanged with its supported KeyA for a short live smoke. Physical-device checks and sustained performance remain separate. The stock state retains actual CPU and dropped-time observations; it must not be presented as a performance pass.

## Visual evidence and limitations

The A/B before/after pairs are actual browser renderer captures at the saved comparison bookmarks. D is a labelled, camera-only view beneath the lower arcade. `inside-lower.png`, `inside-middle.png` and `inside-upper.png` capture the animated hero during normal movement beneath the roofs. The C pair is retained but obscured by an existing column, and is not used as a successful inspection.

Actual saved-master Cycles A/B renders and an additional render-only D camera are retained beside the native images. Projection error is below 0.004 pixels at the test landmarks. This proves optical agreement only. The underpass now has physical framed depth and warm ceiling structure, but repeated tower silhouettes, the large central mass, skyline layering and native material presentation still fall short of the approved art.

## Reproduction

From the repository root, with the local game server on 8766:

```sh
python3 scripts/vertical-v02/plan_gallery_arcades.py
/Applications/Blender.app/Contents/MacOS/Blender --background --python-exit-code 1 --python scripts/vertical-v02/blender_gallery_arcades.py
node scripts/vertical-v02/package_gallery_arcades.mjs
node scripts/vertical-v02/validate_gallery_arcade_exports.cjs
python3 scripts/vertical-v02/build_gallery_arcade_candidate.py
node scripts/vertical-v02/test_gallery_arcades.cjs
node scripts/vertical-v02/test_arcade_roof_recovery.cjs
/Applications/Blender.app/Contents/MacOS/Blender --background --python-exit-code 1 --python scripts/vertical-v02/render_gallery_arcades.py
V02_HUD_ENTRY=SIGHTLINE_SAINT_MERIDIAN_V02_GALLERY_ARCADES.html V02_HUD_RUN=gallery-arcade-hud V02_HUD_REPORT=V02_Gallery_Arcade_HUD.json node scripts/vertical-v02/test_hud_candidate.cjs
python3 scripts/vertical-v02/write_gallery_arcade_evidence.py
```

The evidence report binds the current source/master, raw and shipping geometry, metadata, rendered artifacts and native tests. The full city remains active and incomplete. Remaining work includes final reference-quality architecture and materials, nine advanced-edge timings, the complete combined regression suite and matched active performance recordings of at least 60 seconds. The substantial simulation cost seen in short smoke samples also needs profiling and correction. Generated HTML retains its source’s existing trailing space on line 73 so the source inverse remains byte-exact.
