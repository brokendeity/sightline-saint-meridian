# V02 — Recessed ceiling and cartridge surface candidate

Playable entry: `SIGHTLINE_SAINT_MERIDIAN_V02_ARCHITECTURE_FINISH.html?capture=backspool` on the existing8766 server. This is a separate full-game candidate; the nine prior playable entries remain unchanged. The complete city and its approved-reference visual target remain unfinished.

## Architecture and lighting

The new saved Blender master is `blender/SaintMeridian_V02_Coffered_Soffits.blend`. It refines110 existing0.6m slabs into1424 ceiling cells with6.5cm of underside relief. Their walking tops, outer bounds and accepted contact boxes remain fixed. The even-numbered grid keeps227 existing source fixtures on mounting ribs. The other11141 architectural objects,310 original buildings and three existing facade-detail owners retain their mesh, UV, material bindings and transforms.

A separate warm-neutral reflected-fill definition uses the same232-fixture atlas and twelve elevations. It affects downward-facing V02 surfaces locally. Global exposure, bloom, light count, original city assets and the earlier appearance owner are unchanged. This is an authored reflected-fill approximation, not measured physical light transport.

Only21 affected architecture chunks are re-exported;42 are reused byte for byte. glTF Transform4.3.0 prunes unused resources and deduplicates textures/accessors while preserving decoded geometry, normals, UVs, indices and material bindings exactly. The affected raw payload is40,435,816bytes and shipping payload39,870,872bytes. The complete architectural triangle increase is25,288. These figures do not establish sustained performance.

## Cartridge contact defect and correction

The first real precision-cast test exposed a concrete mismatch: the inherited V02 aim helper returned the slab's flat box underside,23.4m, while the newly visible recessed face was23.465m. The cartridge consequently appeared6.5cm below the visible surface.

This candidate retains the existing coarse aim eligibility and owner identity, then confirms the actual imported static triangles for that V02 owner. It fails closed when no eligible source geometry is found. Original building/ground targeting, the120m ray cap, span/slope limits, capsule clearance, motion and resource costs remain unchanged. Static-owner/ray caching avoids repeated identical queries.

Two normal R precision casts now place the cartridge on the actual recessed face. A labelled close camera inspection shows the real attached asset, then restores the exact original camera before further input. The attempted ceiling rail remains rejected by the established body/headroom clearance; the fix does not make that unsafe rail traversable. The earlier failure is retained with its diagnostic report.

The retained high-city scenario separately constructs two legal rails through four real casts, catches the first, transfers with R, Pops and lands on the118m recovery surface. It passes in18.9667 simulated input seconds with zero damage and no powered release. One labelled initial setup is used; movement, aiming, casts, transfer and landing thereafter use ordinary keyboard and simulated controller inputs.

## Evidence

- `V02_Coffered_Evidence.json` binds all current sources, masters, assets and results.
- Independent saved-source validation checks manifold geometry, flat-top area, envelope bounds and unchanged objects.
- Independent packed-GLB checks validate actual world vertices, counts, envelopes and Khronos format results:21 chunks, zero errors or warnings.
- Native checks preserve the original city,7012 structural colliders, road readiness/counts, shared material parameters, light count and frozen clocks. Rays check110 recessed faces and330 flat-top samples; three independent gravity fixtures land on24/52/84m galleries.
- All15 focused keyboard/pointer/simulated-controller/touch/pause/UI checks pass on this exact entry.
- The installed Develop Web Game client ran the actual candidate; its actual canvas PNG and state were opened. Its short timing samples are not a release-performance result.
- A/B/C native before/after screenshots and paired A/B Blender renders were opened. Camera projection agrees within0.0002pixels at the saved probes. Native toon/ACES and Blender Principled/AgX shading differ, so this is optical alignment and source evidence, not final visual-fidelity approval.

Read-only captures:

| View | Browser before | Browser after | Blender after |
|---|---|---|---|
| A / overlook | `evidence/coffered-candidate/before-A.png` | `evidence/coffered-candidate/after-A.png` | `evidence/coffered-candidate/blender-A.png` |
| B / upward | `evidence/coffered-candidate/before-B.png` | `evidence/coffered-candidate/after-B.png` | `evidence/coffered-candidate/blender-B.png` |
| C / ceiling close view | `evidence/coffered-candidate/before-C.png` | `evidence/coffered-candidate/after-C.png` | — |

The first collider test used the wrong public API name; corrected it to `colliders()` without changing its assertions. The initial cast fixture also needed the native hero owner to synchronize before the first input. Actual earlier reports/captures are retained under `fixed-tests`, `fixed-defects` and `geometry-only`. Their statuses do not supersede the current evidence.

## Reproduce in an isolated checkout

Do not rebuild accepted asset directories in the user's running checkout. Use a fresh checkout of this milestone, then run:

```sh
npm ci --prefix development/vertical-city-v02/tools
/Applications/Blender.app/Contents/MacOS/Blender --background --python-exit-code 1 --python scripts/vertical-v02/blender_coffered_soffits.py
/Applications/Blender.app/Contents/MacOS/Blender --background --python-exit-code 1 --python scripts/vertical-v02/apply_coffered_finish.py
/Applications/Blender.app/Contents/MacOS/Blender --background --python-exit-code 1 --python scripts/vertical-v02/validate_coffered_master.py
node scripts/vertical-v02/package_coffered_assets.mjs
python3 scripts/vertical-v02/build_coffered_candidate.py
node scripts/vertical-v02/validate_coffered_exports.cjs
node scripts/vertical-v02/test_coffered_candidate.cjs
node scripts/vertical-v02/test_coffered_attachments.cjs
V02_TRANSFER_ENTRY=SIGHTLINE_SAINT_MERIDIAN_V02_ARCHITECTURE_FINISH.html V02_TRANSFER_RUN=coffered-transfer node scripts/vertical-v02/test_physical_transfer.cjs
V02_HUD_ENTRY=SIGHTLINE_SAINT_MERIDIAN_V02_ARCHITECTURE_FINISH.html V02_HUD_RUN=coffered-hud V02_HUD_REPORT=V02_Coffered_HUD_Tests.json node scripts/vertical-v02/test_hud_candidate.cjs
/Applications/Blender.app/Contents/MacOS/Blender --background --python-exit-code 1 --python scripts/vertical-v02/render_coffered_views.py
```

The browser scripts expect the existing local8766 server and this Mac's installed Playwright. The locked tools manifest supplies glTF Transform4.3.0 and Khronos gltf-validator2.0.0-dev.3.10. Run the installed skill client through `tools/run-skill-client.cjs` with the new entry and `evidence/stock-coffered` output, then run `scripts/vertical-v02/write_coffered_evidence.py`.

## Still required

Final approved-reference visual quality, more facade/structural variety, improved stair and train presentation, skyline depth, nine unmeasured advanced route timings, the entire eventual final-build gameplay/failure-path suite, physical-device playtesting and>=60-second matched active performance evidence. Conservative movement/camera slab proxies retain the original envelopes; the small decorative underside relief has a separate triangle-accurate cartridge contact check. This milestone is not final city acceptance.

The generated HTML retains the source's trailing space on line73 so the source-inverse check remains exact. New source files pass syntax checks; this inherited whitespace warning is recorded separately from functional validation.
