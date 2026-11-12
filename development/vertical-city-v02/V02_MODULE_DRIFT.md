# V02 module drift: findings and reconciliation plan

- **Date:** 2026-11-05.
- **Branch:** `feature/saint-meridian-aaa-vertical-city-v02`, at `112bf6c` (the canonical-source commit).
- **Scope:** the 20 modules in the drift table at the end of `src/v02/ENGINE_MAP.md`.
- **Status:** analysis only.
  - No source, test, build or evidence file was changed. This report is the only file written in the repo.
  - Nothing was committed.
  - `python3 scripts/build_v02.py --check` → `IDENTICAL SIGHTLINE_SAINT_MERIDIAN_V02_CANONICAL.html 7e9fe391…`, both before and after the analysis.

## Progress

The user accepted the five recommended decisions on 2026-11-06:
- delete the `src/v02` copies;
- assert the V02 gates and keep labelled legacy-mode runs;
- use a `window` stub in the tests;
- give the character loader its own file;
- use the `_v02` suffix.

**Batch 1, applied 2026-11-06, not committed.** It covers `game_afterstep_drive`, `game_backspool_advanced`, `game_backspool_flow` and `game_threadrail`.
- **Live copies moved:** each is now `scripts/<module>_v02.js`, byte for byte.
  - The Drive and Threadrail files hash to `08069ba0…` and `8cc6b7d1…`. These are the `embeddedSHA256` values already recorded in `V02_Traversal_Validation.json`.
- **`engine.json` repointed.** Threadrail sits between two `"\n\n"` text entries.
- **Old copies deleted from the working tree:** `190-…`, `200-…`, `250-…live.js` and `260-threadrail-module.js`. They are not staged, and git still has them at `112bf6c`.
- **`build_v02.py --check`:** `IDENTICAL` against `…V02_THREADRAIL_GRIND.html` (`ab02ac2a…`), both before and after the deletions. The game's bytes did not change.
- **New tests**, all PASS:

  | Test | Result |
  |---|---|
  | `test_afterstep_drive_v02.cjs` | 46: the 42 retained tests plus 4 for `snapback` |
  | `test_threadrail_v02.cjs` | 27: the 25 retained tests plus 2 for `brake()` |
  | `test_backspool_advanced_v02.cjs` | both passes PASS |
  | `test_threadrail_foundation_v02.cjs` | both passes PASS |
  | `test_backspool_flow_v02.cjs` | both passes PASS |
  | `test_backspool_mobility_v02.cjs` | both passes PASS |
  | `test_backspool_roll_physics_v02.cjs` | both passes PASS |

  - Each of the five Backspool tests runs twice: once with Threadrail absent, then again with `window.threadrailGame` set.
  - In the second pass, two gated assertions are replaced by the V02 gates: "Float never starts" and "no roll teleport".
- **Negative control:** with the frozen ancestors swapped in, `test_afterstep_drive_v02`, `test_threadrail_v02`, `test_backspool_advanced_v02` and `test_backspool_flow_v02` FAIL as they should.
- **Drift guard:** `scripts/vertical-v02/test_v02_module_sources.cjs` PASS, 4 checks.
  - Removing one `PENDING` entry makes it FAIL, naming the module.
- **Unchanged:** the 8 original tests and all 20 ancestor files.
- **Docs:** `src/v02/ENGINE_MAP.md` and `src/v02/README.md` updated.
- **Committed** locally as `2c6c399`, not pushed.

**Batch 2, applied 2026-11-06, not committed.**
- **Scope:** the nine remaining `.live.js` copies. The plan said "8"; that was a miscount, because `game_threadrail` was never a `.live.js` file.
  - `browser_building_import`, `gameplay_upgrade`
  - `game_backspool_advanced_runtime`, `game_backspool_flow_runtime`
  - `game_road_infrastructure`
  - `game_backspool_combat`, `game_backspool_powers`, `game_backspool_encounters`, `game_backspool_vault_course`
- **Moved:** each live copy is now `scripts/<module>_v02.js`, byte for byte. I compared each one to its source.
- **`engine.json`:** repointed in place.
- **Deleted from the working tree:** all nine `.live.js` files. No `.live.js` remains.
- **`build_v02.py --check`:** `IDENTICAL` against `…V02_THREADRAIL_GRIND.html` (`ab02ac2a…`), both before and after the deletions.
- **Drift guard:** the 9 modules moved from `PENDING` to `RECONCILED`, and the guard PASSES with 4 checks.
- **Tests:** none of these nine has a plain-node test, so their behaviour is NOT TESTED at node level. The proof for the move is byte identity.
- **Committed** locally as `8cd98e9`, not pushed.

**Batch 3, applied 2026-11-06, not committed.**
- **Scope:** the five whole-part embedded copies left after `game_threadrail`:
  - `game_vertical_city` (was `290`)
  - `game_runtime_polish` (was `330`)
  - `game_action_world` (was `470`)
  - `game_halo_transport` (was all of `360`; `370` keeps the "Halo trucks removed" comment and the courier init)
  - `game_action_foundation` (was `420` plus `430`, combined into one file as in its ancestor)
- **Check before moving:** each new file matches the live region extracted for this report, byte for byte.
- **`engine.json`:** each part, or pair of parts, is replaced by the new file plus a `"\n\n"` text entry where the part ended in a blank line. Six parts were deleted.
- **`build_v02.py --check`:** `IDENTICAL` against `…V02_THREADRAIL_GRIND.html`, both before and after the deletions.
- **Drift guard:** the 5 modules moved to `RECONCILED`.
  - It then flagged `game_halo_trucks`, one of the 7 undetected modules, as no longer drifted. Its code had lived only in `360`.
  - `game_halo_trucks.js` (2026-10-21) is the older predecessor of `game_halo_transport.js` (2026-10-24), and 24 of its 40 windows are in `game_halo_transport_v02.js`. So it is now a 21st frozen ancestor in the guard, with its hash, rather than a pending module.
  - The guard PASSES with 4 checks.
- **Tests:** none of these five has a plain-node test, so their behaviour is NOT TESTED at node level. The proof for the move is byte identity.
- **Committed** locally as `1967731`, not pushed.

**Batch 4, applied 2026-11-06, not committed.** These are the two real splits.
- **Check before splitting:** both regions match the live regions extracted for this report.
- **`game_visual_upgrade`:**
  - The old part `040` becomes three entries:
    1. a `"\n\n"` text entry;
    2. `scripts/game_visual_upgrade_v02.js` (old `040` characters 2–18,338);
    3. `src/v02/engine/045-city-visual-polish-tail.js`, the rest of `040`: the statue replacement, destruction and collapse code.
  - `040` is deleted.
- **`game_action_character_loader`:**
  - The old part `380` becomes three entries:
    1. `src/v02/engine/380-character-switcher-head.js` (its first 8 lines);
    2. `scripts/game_action_character_loader_v02.js` (characters 2,733–14,244);
    3. `src/v02/engine/385-character-switcher-tail.js`.
  - The old `380-character-switcher.js` is deleted.
  - The loader file is a function-body fragment, like its ancestor. Node cannot load it on its own.
- **`build_v02.py --check`:** `IDENTICAL` against `…V02_THREADRAIL_GRIND.html`, both before and after the deletions.
- **Drift guard:** both modules moved to `RECONCILED`. `PENDING` now holds only the 6 undetected modules, and the guard PASSES with 4 checks.
- **Tests:** neither module has a plain-node test, so their behaviour is NOT TESTED at node level. The proof for the move is byte identity.
- **Docs:**
  - `src/v02/README.md`: the drift section is rewritten for the finished state.
  - `src/v02/ENGINE_MAP.md`: the drift table is now empty.
  - The map's line numbers after `280` read 2 low, because the `V02_THREADRAIL_GRIND` build added lines. The new rows use the current numbers.

**All 20 modules are reconciled.**
- **Still open:** the 6 undetected modules, whose `scripts/` file is still not what the game runs:
  - `game_backspool_traversal_runtime`
  - `game_backspool_posture_runtime`
  - `game_backspool_threadrail_runtime`
  - `game_vertical_district_v02`
  - `game_presentation_upgrade`
  - `game_backspool_switch`

## Verdict

- **For all 20 modules, the live copy is newer and is the intended state.**
  - Every difference between a `scripts/` file and its live copy was written into the inlined copy by a later patcher: hooks, features, retunes and removals.
  - Each change is traceable to a named build, and has shipped in every build since.
- **No `scripts/` file was edited after its last inlining.**
  - Every piece of text the `scripts/` side has and the live copy lacks is in one of two places:
    - an older build's inlined copy;
    - for `browser_building_import`, the exact anchor text of the patcher that replaced it.
  - Each file's newest git revision was inlined before the hooks went in.
  - So the 20 files are **frozen ancestors** of the live code:
    - last edited 2026-10-14 to 10-24;
    - their live copies last changed between 10-22 and 11-04.
- **Tests.** Seven plain-node tests load 4 of the 20 files (`game_afterstep_drive`, `game_threadrail`, `game_backspool_advanced`, `game_backspool_flow`).
  - Against the `scripts/` files: **7 of 7 PASS**.
  - Against the live copies, run unchanged in node: **4 PASS, 3 FAIL**. The 3 failures are a hook that reads the bare `window` global, which node does not have.
  - With `window = {}`: **7 of 7 PASS**.
  - With `window.threadrailGame` set, as it always is in V02: **2 FAIL**, the Float group and the "charge → aerial roll → teleport chain" group. V02 gates both behaviours off.
  - The other **16 modules have no plain-node test**.
- **Pins.**
  - 14 of the 20 current file hashes are pinned by older evidence, mostly `SNAPSHOT_MANIFEST.json`.
  - All 20 files are read by the old patchers that built the history.
  - The plan therefore edits none of them. Each live copy gets a new `scripts/<module>_v02.js`.
- **The drift table itself is wrong in two ways.**
  - 6 of the 8 copies it calls "not cleanly separable" are a whole engine part, apart from blank lines. Only 2 need a real split.
  - It is incomplete. **7 more** `scripts/` modules have a patched copy in the engine, and the extractor missed them because their first 300 characters changed (see the last section).

## How this was checked

1. **Live copies.**
   - The 12 split-out copies are the `src/v02/engine/*.live.js` files.
   - For the other 8, I located the file's first 300 characters in the assembled engine (the `engine.json` parts concatenated), then its last unchanged line, then extended the range over the patched tail lines.
   - I checked that every range is the exact engine bytes.
2. **Diffs.** These are token-level diffs (identifiers, numbers and punctuation). The modules are minified long lines, so a line diff hides the hooks.
3. **History.** I searched all 77 HTML builds, including `.pre-backspool-switch.html` and `.pre-road-infrastructure.html`, for:
   - the file verbatim;
   - the live copy verbatim;
   - every git revision of the file, verbatim;
   - every changed region, with 8 tokens of context on each side.
   I also searched the patchers (`scripts/**/*.py`) for each inserted text. A patcher is named below wherever its text matched literally.
   Caveat: build order comes from file dates, which is approximate. `SIGHTLINE_SAINT_MERIDIAN_TOON.html` was rewritten in place by the early `apply_*.py` patchers.
4. **Pins.**
   - I searched for the SHA256 of each current file across 5,143 `json`/`md`/`py`/`cjs`/`js`/`html`/`txt` files in the repo (`assets/` excluded).
   - For the 6 unpinned modules, I also searched the hashes of their older git revisions.
5. **Tests.**
   - First run in place against `scripts/`. I checked beforehand that none of these tests writes a file.
   - Then run against the live copies, in a scratch folder outside the repo. It held copies of every `scripts/*.js` and of the test files, with the drifted module replaced byte for byte by its live copy. That way `require` and the tests' own `readFileSync(require.resolve(…))` both read the live code.
   - Window stubs were loaded with `node -r`.
   - `test_embedded_core.cjs` was run only with a case argument. Without one, it rewrites `V02_Embedded_Core_Units.json`.

## Per-module findings

"Change" counts the characters added and removed by the token diff, going from the `scripts/` file to the live copy. "Live copy since" is the oldest surviving build that contains today's live copy verbatim. "File last verbatim" is the newest build that inlined the `scripts/` file unchanged.

| # | Module | Live copy | Change | Live copy since | File last verbatim | Current hash pinned by | Plain-node tests |
|---|---|---|---|---|---|---|---|
| 1 | `browser_building_import` | `030-…live.js` | +302 / −11 | `.pre-backspool-switch.html` (oldest surviving) | none surviving | `SNAPSHOT_MANIFEST.json` | none |
| 2 | `game_action_character_loader` | inside `380-character-switcher.js`, lines 9–27 (bytes 2,733–14,244) | +7,010 / −4 | `V02_MIXAMO_COMBAT` | `SAINT_MERIDIAN_TOON` | `SNAPSHOT_MANIFEST.json`, `output/action-v2/build-manifest.json` | none |
| 3 | `game_action_foundation` | all of `420-combatants.js` + bytes 0–1,329 of `430-action-camera.js` | +518 / −101 | `V02_FRIENDLY_CONTACTS` | `BACKSPOOL_TRAVERSAL_CANDIDATE` | `SNAPSHOT_MANIFEST.json`, `action-v2/build-manifest.json` | none |
| 4 | `game_action_world` | `470-action-world.js` minus its trailing blank line | +640 / −0 | `V02_GRAYBOX` | `SAINT_MERIDIAN_TOON` | `SNAPSHOT_MANIFEST.json`, `action-v2/build-manifest.json` | none |
| 5 | `game_afterstep_drive` | `250-…live.js` | +442 / −4 | `BACKSPOOL_THREADRAIL_FUSION_V6` | `…FUSION_V5` | `V02_Embedded_Core_Units.json`, `V02_Traversal_Validation.json` | `test_afterstep_drive.cjs`; `vertical-v02/test_embedded_core.cjs` (drive) |
| 6 | `game_backspool_advanced` | `190-…live.js` | +24 / −0 | `BACKSPOOL_VAULT_PLAYGROUND` | none (inlined and hooked in one step) | not pinned (older revisions are pinned) | `test_backspool_advanced.cjs`, `test_threadrail_foundation.cjs` |
| 7 | `game_backspool_advanced_runtime` | `230-…live.js` | +183 / −17 | `V02_FORSPOKEN_MOTION` | none | not pinned (older revisions are pinned) | none |
| 8 | `game_backspool_combat` | `440-…live.js` | +3,221 / −106 | `V02_IMPACT_FX` | `SAINT_MERIDIAN_TOON` | `SNAPSHOT_MANIFEST.json`, `action-v2/build-manifest.json` | none |
| 9 | `game_backspool_encounters` | `460-…live.js` | +1,257 / −0 | `V02_SIGHTLINE_MELEE` | `BACKSPOOL_WHIP_THROW_PRE_HI3D_TRAIN` | `SNAPSHOT_MANIFEST.json`, `action-v2/build-manifest.json` | none |
| 10 | `game_backspool_flow` | `200-…live.js` | +24 / −0 | `BACKSPOOL_THREADRAIL_V1` | `BACKSPOOL_TRAVERSAL_CANDIDATE` | `action-v2/build-manifest.json` | `test_backspool_flow.cjs`, `test_backspool_mobility.cjs`, `test_backspool_roll_physics.cjs` |
| 11 | `game_backspool_flow_runtime` | `240-…live.js` | +3,178 / −170 | `V02_IMPACT_FX` | none | not pinned (older revisions are pinned) | none |
| 12 | `game_backspool_powers` | `450-…live.js` | +300 / −0 | `V02_LOADOUT` | `SAINT_MERIDIAN_TOON` | `SNAPSHOT_MANIFEST.json`, `action-v2/build-manifest.json` | none |
| 13 | `game_backspool_vault_course` | `480-…live.js` | +1,922 / −0 | `BACKSPOOL_TRIPO_CITY` | `BACKSPOOL_AFTERSTEP_VFX` | not pinned | none |
| 14 | `game_halo_transport` | all of `360-halo-trucks.js` | +212 / −17 | `V02_NO_HALO_TRUCKS` | `V02_IMPACT_FX` | not pinned | none |
| 15 | `game_road_infrastructure` | `340-…live.js` | +255 / −0 | `V02_FRIENDLY_CONTACTS` | `V02_CIVILIAN_CLEARANCE` | `SNAPSHOT_MANIFEST.json` | none |
| 16 | `game_runtime_polish` | `330-runtime-polish-collision.js` minus its trailing blank line | +190 / −0 | `V02_FRAME_PACING` | `.pre-road-infrastructure.html` | `SNAPSHOT_MANIFEST.json` | none |
| 17 | `game_threadrail` | `260-threadrail-module.js` minus its leading and trailing blank lines | +537 / −0 | `BACKSPOOL_THREADRAIL_FUSION_V5` | `…FUSION_V4` | `V02_Embedded_Core_Units.json`, `V02_Traversal_Validation.json` | `test_threadrail.cjs`; `vertical-v02/test_embedded_core.cjs` (threadrail) |
| 18 | `game_vertical_city` | `290-vertical-city.js` minus its trailing blank line | +205 / −2,705 | `V02_WORLD_LIFE` | `BACKSPOOL_WHIP_THROW` | not pinned | none |
| 19 | `game_visual_upgrade` | inside `040-city-visual-polish.js`, lines 3–164 (bytes 2–18,338) | +627 / −4 | `.pre-backspool-switch.html` (oldest surviving) | `.pre-road-infrastructure.html` | `SNAPSHOT_MANIFEST.json` | none |
| 20 | `gameplay_upgrade` | `100-…live.js` | +1,340 / −0 | `V02_GRAYBOX` | `.pre-road-infrastructure.html` | `SNAPSHOT_MANIFEST.json` | none |

Build names drop the `SIGHTLINE_SAINT_MERIDIAN_` / `SIGHTLINE_` prefix and `.html`.

### What the live copy adds, module by module

For all 20, the newer and intended copy is the live one. Where a patcher matched, it is named in brackets.

1. **`browser_building_import`: hooks plus a material retune** (`apply_visual_upgrade.py`, 2026-10-14).
   - Wraps the building material in `cityVisualPolish.material()`.
   - Changes the "Midnight alloy" tint from `.018,.038,.053` to `.032,.053,.075`.
   - Changes the cyan emission from ×1.4 to ×.85.
   - Adds warm-soffit and brushed-silver tints.
   - Calls `cityVisualPolish.build()` after import.
   - The build from before this patch no longer exists, because the patcher rewrote `TOON.html` in place. Its anchor strings are the file's exact text.
2. **`gameplay_upgrade`: hooks only.**
   - Jumps are routed through Backspool posture, Flow, ladders, Advanced, traversal, combat and `backspoolHop.jump()`. Backspool gets a Flow jump source clip.
   - Input reset now also resets the Backspool systems (Traversal and Threadrail candidates; `apply_backspool_combat.py`).
   - The INCOMING SHOT banner is hero-aware (`build_candidate.py`, `V02_GRAYBOX`).
3. **`game_backspool_advanced`: one hook.** Float can start only when `window.threadrailGame` is absent (`build_backspool_threadrail_candidate.py`).
4. **`game_backspool_flow`: one hook.** The evade-roll "teleport" applies only when `window.threadrailGame` is absent (same patcher).
5. **`game_backspool_advanced_runtime`.**
   - Starting a wall no longer zeroes velocity: `s.vel.set(0,0,0)` was removed.
   - Tether is disabled under Threadrail (Threadrail candidate).
   - Adds a wall flip / wall kick pose tail (`build_forspoken_motion_candidate.py`).
6. **`game_backspool_flow_runtime`.**
   - Under Threadrail, dash, Scale, Skip, charge, switchMove, tether aim, the gamepad poll and sprint-tap all return early. On a rail, the visual support bias is 0 (Threadrail candidate).
   - The magic trails are off: `moving` is set to `false`, since `BACKSPOOL_AFTERSTEP_VFX`.
   - Adds:
     - stride start, turn and stop roles;
     - a jump latch;
     - landing roles chosen by drop height, with a heavy-landing impact burst (`build_forspoken_motion_candidate.py`, `build_forspoken_air_candidate.py`, `build_forspoken_strides_candidate.py`, `build_impact_fx_candidate.py`);
     - landing cancel on move (`build_threadrail_fusion_v6.py`);
     - the `stride` / `tail` API.
7. **`game_afterstep_drive`: a new `snapback` release mode** (`build_threadrail_fusion_v6.py`).
   - Cost 12. Direction comes from the options, and retention is clamped to .5–1.
   - An energy-based check validates the applied delta.
   - Snapback is listed as a "demanding" mode.
8. **`game_road_infrastructure`: two Friendly Contacts hooks.** Walkers wait and settle near contacts (`build_friendly_contacts_candidate.py`).
9. **`game_backspool_combat`: the largest drift.**
   - Sightline melee: `isSightline`, `heroStyle()` (`'street'`) and `sightlineActionManifest` (`build_sightline_melee_candidate.py`).
   - Backspool traversal gates: locks from posture, Advanced and Flow; Flow evade and backstep; attack cancel (traversal candidate).
   - Friendly-contact and riser sweeps, plus `safeStaticGroundMove` (Friendly Contacts).
   - Height-aware and validate-only practice spawns (`encounter_adapter.py`).
   - Impact FX on hit (`build_impact_fx_candidate.py`).
   - A `cameraTarget` export, since `V02_BODY_FRAMING`.
10. **`game_backspool_powers`.**
    - Loadout blocks the powers (`build_loadout_hero_candidate.py`).
    - The traversal preset frees brace, RB and D-pad up.
    - Release is blocked while posture or Advanced is locked (Threadrail candidate).
11. **`game_backspool_encounters`.**
    - An options API: `positions`, `heightAware`, `preserveHealth`, `validateOnly`.
    - Vertical encounters can restart (`encounter_adapter.py`).
    - Lessons are Backspool-only.
    - Sparring burst, cover and counter behaviour (`build_sightline_melee_candidate.py`).
12. **`game_backspool_vault_course`.** Tripo barrier and planter GLBs replace the proxies (`build_tripo_city.py`).
13. **`game_action_character_loader`.**
    - Gameplay and manifest packs v2 → v3 (`V02_MIXAMO_COMBAT`).
    - Forspoken traversal, locomotion, ladder, crouch, Advanced and Flow role packs.
    - A pelvis-translation flag.
    - SHA-checked source preview clips and original motion names (Traversal and Forspoken candidates).
    - These are the Forspoken-derived placeholder clips covered by the IP constraint in `CLAUDE.md`.
14. **`game_action_foundation`, `actionCamera`.**
    - Threadrail camera composition, with input yaw and pitch (Threadrail candidate).
    - Mode tracking.
    - `v02FriendlyCamera.plan`, a follow rate and a re-constrained position (Friendly Contacts).
15. **`game_action_world`.**
    - Vertical pursuit and market gating, and presentation ownership (`encounter_adapter.py`).
    - The Backspool `present()` / `hint()` chain (traversal candidate).
    - `navigationVersion`.
16. **`game_halo_transport`.**
    - Pedestrian-edge lookup is now O(1) (`build_frame_pacing_candidate.py`).
    - The trucks are removed: `haloTrucks.load()` is no longer called, and the state says "removed" (`build_no_halo_trucks_candidate.py`).
17. **`game_runtime_polish`.**
    - Frame-pacing world boxes and a camera-ray cache (`build_frame_pacing_candidate.py`, `build_camera_acceleration_candidate.py`).
    - An `actionCost` metric (`build_action_game.py`).
18. **`game_threadrail`.** A new `brake(amount)` on the factory, plus its export (`build_threadrail_fusion_v5.py`).
19. **`game_vertical_city`.**
    - Removes the legacy construction: towers, bridges, galleries, terraces, risers, train route, supports and traffic. That is −2.7 KB.
    - It is now a V02 transit host, with `transitHost()` and `trainAsset` (`build_transit_candidate.py`).
20. **`game_visual_upgrade`.**
    - `grid` becomes `gridHelper`, which `apply_road_infrastructure.py` forced when it renamed the engine global.
    - Adds `relocateStreetLamps()` and an `asphaltMaterial` export (`apply_road_infrastructure.py`).

## Tests

| Test | Loads | Against `scripts/` file | Live copy, plain node | Live + `window = {}` | Live + `window.threadrailGame` (as in V02) |
|---|---|---|---|---|---|
| `scripts/test_afterstep_drive.cjs` | `game_afterstep_drive` | **PASS** (42) | **PASS** (42) | not run (no `window` use) | not run |
| `scripts/test_threadrail.cjs` | `game_threadrail` | **PASS** (25) | **PASS** (25) | not run (no `window` use) | not run |
| `scripts/test_backspool_advanced.cjs` | `game_backspool_advanced` | **PASS** (6 groups) | **FAIL**: `ReferenceError: window is not defined` (Float hook, line 85) | **PASS** (6 of 6) | **FAIL**: Float group, `assert(c.update(.01,f).floating)` |
| `scripts/test_threadrail_foundation.cjs` | `game_backspool_advanced` + `game_movement_coordinator` (unchanged) | **PASS** | **PASS** | **PASS** | **PASS** |
| `scripts/test_backspool_flow.cjs` | `game_backspool_flow` | **PASS** (10 groups) | **FAIL**: `ReferenceError` (evade hook, line 24) | **PASS** | **FAIL**: "charge -> aerial roll -> teleport chain", `assert(t.c.evade(t.f))` |
| `scripts/test_backspool_mobility.cjs` | `game_backspool_flow` + `game_backspool_traversal` (unchanged) | **PASS** | **PASS** | **PASS** | **PASS** |
| `scripts/test_backspool_roll_physics.cjs` | `game_backspool_flow` | **PASS** | **FAIL**: `ReferenceError` | **PASS** | **PASS** |
| `vertical-v02/test_embedded_core.cjs threadrail` | the Threadrail copy embedded in `V02_GRAYBOX.html` | n/a | **PASS** (25) | n/a | n/a |
| `vertical-v02/test_embedded_core.cjs drive` | the Drive copy embedded in `V02_GRAYBOX.html` | n/a | **PASS** (42) | n/a | n/a |

Notes:
- The two `test_embedded_core.cjs` cases extract their module from `V02_GRAYBOX.html`. I checked that both extracts are byte-identical to today's live copies.
  - Their "browser global" sub-check, inside the retained test, still reads the standalone `scripts/` file, not the embedded copy.
- **NOT TESTED:**
  - **The 16 modules with no plain-node test.** Their only coverage is the browser runners against built HTML. None of those were run here, because they write evidence into the repo and are out of scope.
  - **Live-only features with no node assertion anywhere:** the Drive's `snapback` mode, and Threadrail `brake()`.
    - `test_snapback.cjs` tests `game_snapback.js`, not the Drive.
    - `test_threadrail_fusion_v6.cjs` is a browser test.
  - **Real-input behaviour** of any of the 20 modules, in this session.

## What the plan has to handle

1. **Bare `window` in the hooks.**
   - The live `game_backspool_advanced` and `game_backspool_flow` hooks read `window.threadrailGame`.
   - In node, that is a ReferenceError. In the browser, it is fine.
2. **V02 gates behaviours that the retained tests assert.**
   - `280-threadrail-game.js` sets `window.threadrailGame=api` unconditionally. So in V02:
     - Float never starts.
     - The Flow evade-roll teleport is off.
     - `flow_runtime` returns early from dash, Scale, Skip, charge, switchMove, tether aim and the pad poll.
   - The retained tests exercise those paths at the factory level, so they pass only with Threadrail absent. They test code the V02 game never reaches through these gates.
   - The teleport chain also contradicts the locked Backspool rule "never give him teleporting".
3. **The ancestors are not drop-in.**
   - `scripts/game_visual_upgrade.js` uses `grid`, but the engine global has been `gridHelper` since `apply_road_infrastructure.py`.
   - Included as it stands, it would make `cityVisualPolish.build()` throw part-way. The live importer swallows that error (`try{cityVisualPolish.build()}catch…`), so the visual layer would fail silently.
   - Every ancestor references engine globals as they were when it was inlined. Pointing `engine.json` at any `scripts/<module>.js` would change the game.
4. **Pins and history.**
   - 14 current hashes are pinned (see the table).
   - All 20 files are inputs to old patchers:
     - `apply_visual_upgrade.py`, `apply_gameplay_upgrade.py`, `apply_runtime_polish.py`, `apply_road_infrastructure.py`, `apply_backspool_combat.py`;
     - `build_action_game.py`, `build_backspool_traversal_candidate.py`, `build_backspool_threadrail_candidate.py`, `build_backspool_vault_playground.py`, `build_tripo_city.py`, `build_halo_transport.py`, `build_vertical_city.py`, `build_candidate.py`.
   - Editing any of the 20 files would change what those patchers produce.
5. **The canonical record pins `src/v02`.**
   - `src/v02` is committed (`112bf6c`).
   - `V02_Canonical_Build.json` records the SHA256 of all 90 source files, including the 12 `.live.js` files and the parts to be split.
   - Removing or splitting those files is normal source editing, as the README says. But afterwards, that record describes commit `112bf6c`, not the working tree. Git keeps every byte.
6. **No trailing newline.** None of the 12 `.live.js` files ends in a newline, and the engine bytes depend on that. Each new file must keep the exact bytes.

## Plan (proposed, not applied)

### Rules
- **Never edit or delete** any of the 20 `scripts/<module>.js` files. They become documented frozen ancestors.
- **For each module, create `scripts/<module>_v02.js`**, following the `friendly_contact_core_v02.js` naming. It holds the live bytes exactly: no reformatting, and no newline added.
- **Point `engine.json` at the new file** in the same position, then remove the `src/v02` copy, so each module's live code exists once.
- **Success test for every step:** `python3 scripts/build_v02.py --check` → `IDENTICAL` against the newest build in `src/v02/latest.json`. That was `SIGHTLINE_SAINT_MERIDIAN_V02_CANONICAL.html` (`7e9fe391…`) when this report was written. As of 2026-11-06 it is `…V02_THREADRAIL_GRIND.html` (`ab02ac2a…`). The three builds in between changed only `180`, `280`, `310` and `page.html`, so none of the copies or offsets below moved.
  - The output bytes do not change, so the move itself needs no new HTML build and no browser re-test.
  - The 12 straight moves are expected to stay byte-identical. The 8 splits also land on exact byte boundaries, but only `--check` proves it.
- **Leave the 8 existing tests unchanged.**
  - 2 of them are pinned in `SNAPSHOT_MANIFEST.json`.
  - `test_threadrail.cjs` and `test_afterstep_drive.cjs` are named as `retainedTest` in V02 evidence.
  - They keep testing the ancestors and are labelled as ancestor tests.
- **Add `_v02` tests** for the live code.

### Per-module steps

The 12 split-out copies: in `engine.json`, replace `{"file":"src/v02/engine/NNN-<module>.live.js"}` with `{"file":"scripts/<module>_v02.js"}`, after the new file is copied byte for byte from the `.live.js`. Then delete the `.live.js`.

| Module | Copy from | New tests |
|---|---|---|
| `browser_building_import` | `030-…live.js` | none |
| `gameplay_upgrade` | `100-…live.js` | none |
| `game_backspool_advanced` | `190-…live.js` | `test_backspool_advanced_v02.cjs`, `test_threadrail_foundation_v02.cjs` |
| `game_backspool_flow` | `200-…live.js` | `test_backspool_flow_v02.cjs`, `test_backspool_mobility_v02.cjs`, `test_backspool_roll_physics_v02.cjs` |
| `game_backspool_advanced_runtime` | `230-…live.js` | none |
| `game_backspool_flow_runtime` | `240-…live.js` | none |
| `game_afterstep_drive` | `250-…live.js` | `test_afterstep_drive_v02.cjs` |
| `game_road_infrastructure` | `340-…live.js` | none |
| `game_backspool_combat` | `440-…live.js` | none |
| `game_backspool_powers` | `450-…live.js` | none |
| `game_backspool_encounters` | `460-…live.js` | none |
| `game_backspool_vault_course` | `480-…live.js` | none |

The 8 embedded copies. Byte offsets are within the named part.

| Module | New file holds | `engine.json` change | Removed |
|---|---|---|---|
| `game_threadrail` | `260` bytes 2–20,850 | `260` → `{"text":"\n\n"}`, new file, `{"text":"\n\n"}` | `260-threadrail-module.js` |
| `game_vertical_city` | `290` bytes 0–6,021 | `290` → new file, `{"text":"\n\n"}` | `290-vertical-city.js` |
| `game_runtime_polish` | `330` bytes 0–3,287 | `330` → new file, `{"text":"\n\n"}` | `330-runtime-polish-collision.js` |
| `game_action_world` | `470` bytes 0–24,702 | `470` → new file, `{"text":"\n\n"}` | `470-action-world.js` |
| `game_halo_transport` | all of `360` | `360` → new file. `370` is unchanged: it holds the "Halo trucks removed" comment and the courier init. | `360-halo-trucks.js` |
| `game_action_foundation` | all of `420` + `430` bytes 0–1,329 (combatants + actionCamera, as in its ancestor) | `420`, `430` → new file, `{"text":"\n\n"}` | `420-combatants.js`, `430-action-camera.js` |
| `game_visual_upgrade` | `040` bytes 2–18,338 | `040` → `{"text":"\n\n"}`, new file, new part `045-city-visual-polish-tail.js` (`040` bytes 18,338–end, from `// User-supplied FBX replaces the scenic guardian…`) | `040-city-visual-polish.js` |
| `game_action_character_loader` | `380` bytes 2,733–14,244 | `380` → `380-character-switcher-head.js` (bytes 0–2,733), new file, `385-character-switcher-tail.js` (bytes 14,244–end) | `380-character-switcher.js` |

- The first 6 rows are clean cuts at blank lines. The extractor's "not cleanly separable" label was wrong for them; its end-anchor test failed only because the module's last lines were patched.
- `game_action_character_loader` is a fragment. It is indented, and it is a function body inside the `characterSwitcher` IIFE, exactly like its ancestor. As an engine include it works, but node cannot load it. The alternative is to leave it in `380` and only mark the ancestor frozen (decision 4).

### Tests to add

None of these is a patcher. All are plain node, and none writes files.

- **`test_afterstep_drive_v02.cjs` and `test_threadrail_v02.cjs`.** Copies of the retained tests, with both the `require` and the vm-load check pointed at the `_v02` file. Add assertions for:
  - `snapback` mode in the Drive;
  - `brake()` in Threadrail.
- **The five Backspool `_v02` tests** (advanced, foundation, flow, mobility, roll physics).
  - **Pass 1:** set `globalThis.window = {}` before `require`, then run the retained assertions. This is "factory, Threadrail absent", expected PASS.
  - **Pass 2:** set `window.threadrailGame`, then assert the V02 gates in place of the gated assertions: Float does not start, and the roll teleport is unavailable. Expected PASS: today's runs show exactly those two assertions failing.
- **A drift guard, `vertical-v02/test_v02_module_sources.cjs`.** It checks that:
  - every `scripts/` file in `engine.json` is included once;
  - no `scripts/*.js` file that is *not* included has a 160-character window of its code inside a `src/v02/engine/` part. The 7 modules listed below are allow-listed until they are reconciled.
  - the 20 ancestors still match their recorded hashes.
- **`test_embedded_core.cjs`** stays as it is. It pins `V02_GRAYBOX`.
- **The 16 modules without node tests:** none proposed in this pass. For the move, their proof is the `--check` byte identity.

### Docs
- **`src/v02/ENGINE_MAP.md`:**
  - replace the drift table with an ancestor table: `scripts/<m>.js` → `scripts/<m>_v02.js`, frozen, with what pins it;
  - update the part rows;
  - list the 7 modules below as still drifted.
- **`src/v02/README.md`:** for these 20 modules, edit the `_v02` file, never the ancestor.

### Order

After each batch:
1. run `--check` (expect IDENTICAL) and the node tests;
2. report PASS/FAIL;
3. ask before committing.

| Batch | Modules |
|---|---|
| 1 | The 4 node-tested modules (`afterstep_drive`, `threadrail`, `backspool_advanced`, `backspool_flow`), their 7 new tests, and the drift guard. |
| 2 | The other 8 `.live.js` modules. |
| 3 | The 6 whole-part embedded modules. |
| 4 | `visual_upgrade` and `character_loader` (the real splits). |
| 5 | Follow-up: analyse the 7 undetected modules the same way. |

### Decisions for the user
1. **Can the `src/v02` copies be deleted** (the `.live.js` files, and the parts being split) once the `_v02` files hold them? Git keeps them at `112bf6c`. `V02_Canonical_Build.json` would then describe that commit.
2. **What should the V02-gated test groups do** (Float, and the charge → roll → teleport chain)?
   - **Recommended:** assert the gate in V02 mode, and keep a legacy-mode run labelled as factory-only coverage.
   - **Or:** drop the legacy assertions. The teleport chain contradicts the locked "no teleporting" rule.
3. **How should the `window` hooks be handled in node?**
   - **Recommended:** keep a `window` stub in the tests. The game does not change.
   - **Or:** make the hooks node-safe (`typeof window!=='undefined'&&…`). That changes the build, so it needs a new build plus real-input regressions.
4. **Where does `character_loader` go?** A fragment file in `scripts/`, as planned, or leave it in the engine.
5. **Is the `_v02` suffix right?**

## Undetected drifted modules (outside this scope)

The extractor only flagged files whose first 300 characters appear unchanged in the engine. Scanning every `scripts/*.js` that `engine.json` does not include, in 160-character windows, found 7 more modules whose code sits inside engine parts with changes.

| Module | Engine part | Windows found | Current hash pinned | Plain-node tests |
|---|---|---|---|---|
| `game_backspool_traversal_runtime.js` | `210-backspool-traversal-runtime.js` (also `240-…flow_runtime.live.js`) | 82% | `SNAPSHOT_MANIFEST.json` | none |
| `game_backspool_posture_runtime.js` | `220-backspool-posture-runtime.js` | 84% | `SNAPSHOT_MANIFEST.json` | none |
| `game_backspool_threadrail_runtime.js` | `280-threadrail-game.js` | 82% | not pinned | none |
| `game_vertical_district_v02.js` | `300-vertical-district.js` | 86% | not pinned | none |
| `game_presentation_upgrade.js` | `320-hud-presentation.js` (also `050-building-destruction.js`) | 78% | `SNAPSHOT_MANIFEST.json` | none |
| `game_halo_trucks.js` | `360-halo-trucks.js`, likely an older predecessor of `game_halo_transport.js` | 60% | `SNAPSHOT_MANIFEST.json` | none |
| `game_backspool_switch.js` | `380-character-switcher.js` (also `410-hero-switch-input.js`) | 65% | `SNAPSHOT_MANIFEST.json` | none |

The same caveat applies to these 7 as to the 20: editing the `scripts/` file does not change the game.

## The six missed modules: findings (2026-11-06)

**Status:** analysis only. No source changed for these six.

**How this was checked:** the same way as the 20 modules.
- **Token diffs** between each file and its live code in the engine.
- **History:** every changed region, with 8 tokens of context, searched in all surviving builds. Inserted text searched in the patchers.
- **Pins:** each SHA256 checked against `SNAPSHOT_MANIFEST.json` and the V02 evidence.
- **Tests:** every `scripts/**/test_*.cjs` searched for the file name.

`game_halo_trucks` was settled in batch 3. It is a frozen ancestor of `game_halo_transport`.

### Verdict

**For all six, the live engine code is newer and is the intended state.** Every `scripts/`-side difference traces either to an older build or to a git snapshot, except one: `game_presentation_upgrade` has a bug that never shipped (row 5 below). Each file is a frozen ancestor.

| # | Module | Live code | Change (chars) | Live code since | File last inlined verbatim | Hash pinned by | Read by | Plain-node tests |
|---|---|---|---|---|---|---|---|---|
| 1 | `game_backspool_traversal_runtime` | all of `210-backspool-traversal-runtime.js` | +467 / −0 | `V02_FORSPOKEN_VAULTS` | `V02_CIVILIAN_CLEARANCE` | `SNAPSHOT_MANIFEST.json`, `action-v2/build-manifest.json` | `build_backspool_traversal_candidate.py` | none |
| 2 | `game_backspool_posture_runtime` | all of `220-backspool-posture-runtime.js` | +1,359 / −0 | `V02_FORSPOKEN_CROUCH` | `V02_FORSPOKEN_AIR` | `SNAPSHOT_MANIFEST.json`, `action-v2/build-manifest.json` | `build_backspool_traversal_candidate.py` | none |
| 3 | `game_backspool_threadrail_runtime` | all of `280-threadrail-game.js`. Its first line, the "Backspool's equipment adapter" comment, sits in `270-…-note.js`, separated from the code by inlined modules. | +18,212 / −715 | `V02_THREADRAIL_GRIND` (it changed again today) | `BACKSPOOL_VAULT_PLAYGROUND` | `action-v2/build-manifest.json` | `build_backspool_threadrail_candidate.py` | none |
| 4 | `game_vertical_district_v02` | all of `300-vertical-district.js` | +1,549 / −38 | `V02_FURNISHED_PUBLIC_ROOMS` | `V02_GRAYBOX` | not pinned | `build_candidate.py` | none |
| 5 | `game_presentation_upgrade` | all of `320-hud-presentation.js` | +414 / −10 | `SAINT_MERIDIAN_TOON` (oldest surviving) | none surviving | `SNAPSHOT_MANIFEST.json` | `apply_presentation_upgrade.py` | none |
| 6 | `game_backspool_switch` | the whole `characterSwitcher` IIFE: `380-character-switcher-head.js` + `scripts/game_action_character_loader_v02.js` + `385-character-switcher-tail.js`. Its last lines, the hero-switch chord (`heroSwitchInput`, `handleHeroSwitchChord`), are `410-hero-switch-input.js`, with five evidence modules between. | +11,244 / −301 | `V02_LOADOUT` (and the loader part since `V02_FORSPOKEN_CROUCH`) | none surviving | `SNAPSHOT_MANIFEST.json`, `action-v2/build-manifest.json` | `apply_backspool_switch.py` | none |

### What the live code adds

1. **Traversal runtime.**
   - Vault and climb segments chosen by rise height: `segmentFor`, `poseSpec`, and `segment`/`rise` in the state (`build_forspoken_vaults_candidate.py`).
   - Friendly colliders count as obstacles (`build_friendly_contacts_candidate.py`).
2. **Posture runtime.** Crouch shift animation, `crouchShiftAnimate` with a `shift()` export (`build_forspoken_crouch_candidate.py`).
3. **Threadrail runtime.** This is the Backspool equipment adapter, `threadrailGame`, and the biggest drift. Its changes arrive across 15 builds:
   - Threadrail Fusion V3–V6 (`build_threadrail_fusion*.py`);
   - the whip (`build_threadrail_whip.py`);
   - the megacity;
   - the V02 HUD and graybox (`encounter_adapter.py`);
   - architecture finish;
   - body framing;
   - Afterstep VFX;
   - Loadout (+12.8 KB);
   - Loadout runner, and Loadout runner without Afterstep;
   - Threadrail grind (+0.7 KB, today).
4. **Vertical district.**
   - Moves from the graybox and contact assets to the detailed, architecture and furnished-public-rooms assets.
   - Texture disposal keeps shared maps.
   - Adds `cartridgeSurface()` ray hits for the Threadrail cartridge (`build_architecture_candidate.py`, `build_coffered_candidate.py`, `build_furnished_public_rooms.py`, `write_phase4_gate.py`).
5. **Presentation.**
   - Hero-aware objective and hints: Backspool gets the action-world objective and combat hints (`build_action_game.py`, `apply_backspool_combat.py`).
   - **The file has a bug that never shipped.** The file reads `alert?.telegraphs`, but `mechanicPolishState()` has only ever returned `charging`, in both the live code and the ancestor. Every surviving build has `alert?.charging`, which is correct. With the file's version, the "time your guard as the warning line flashes" hint would never show.
6. **Switcher.**
   - Loadout as a third hero (`build_loadout_hero_candidate.py`).
   - Backspool traversal hooks (`build_backspool_traversal_candidate.py`).
   - Action-game hooks (`build_action_game.py`).
   - The loader section. `apply_backspool_switch.py` first inlined the whole file, including an old `buildBackspool()` that loads `animations-web.json.gz`. Then `build_action_game.py` replaced that section with `game_action_character_loader.js`, which is the fragment moved to `_v02` in batch 4. The old loader text survives only in git snapshots (`892a7a9`, `f1eaad7`, …). No surviving build has it.

### Tests

- **NOT TESTED:** none of the six has a plain-node test. Only the drift guard names them, and it lists them as `PENDING`.
- **No browser tests run** for this analysis.

## Batch 5: plan (proposed, not applied)

**Rules:** the same as batches 1–4.
- Leave the 6 `scripts/` files untouched. Five are hash-pinned, and the old patchers read all six.
- Create a new file holding the live bytes exactly, and point `engine.json` at it.
- Remove the `src/v02` copy.
- `build_v02.py --check` must stay `IDENTICAL`.
- Move each module from `PENDING` to `RECONCILED` in the guard.

| Module | New file | `engine.json` change | Removed |
|---|---|---|---|
| `game_backspool_traversal_runtime` | `scripts/game_backspool_traversal_runtime_v02.js` (`210` minus its trailing blank line) | `210` → new file, `{"text":"\n\n"}` | `210-backspool-traversal-runtime.js` |
| `game_backspool_posture_runtime` | `scripts/game_backspool_posture_runtime_v02.js` (`220` minus its trailing blank line) | `220` → new file, `{"text":"\n\n"}` | `220-backspool-posture-runtime.js` |
| `game_backspool_threadrail_runtime` | `scripts/game_backspool_threadrail_runtime_v02.js` (`280` minus its trailing blank line) | `280` → new file, `{"text":"\n\n"}`; `270`'s comment stays where it is | `280-threadrail-game.js` |
| `game_vertical_district_v02` | `scripts/game_vertical_district_v02_v02.js` (`300` minus its trailing blank line; see decision 1) | `300` → new file, `{"text":"\n\n"}` | `300-vertical-district.js` |
| `game_presentation_upgrade` | `scripts/game_presentation_upgrade_v02.js` (`320` minus its trailing blank line) | `320` → new file, `{"text":"\n\n"}` | `320-hud-presentation.js` |
| `game_backspool_switch` | `scripts/game_backspool_switch_v02.js` = `380-character-switcher-head.js` + `game_action_character_loader_v02.js` + `385-character-switcher-tail.js`, concatenated: the whole `characterSwitcher` IIFE, one module in one file (decision 2) | those three entries → new file | `380-character-switcher-head.js`, `385-character-switcher-tail.js` and `scripts/game_action_character_loader_v02.js` (created in batch 4) |

- **`410-hero-switch-input.js` stays as engine code.** It is the live copy of the last lines of `game_backspool_switch.js`, separated from the switcher by five evidence modules. It is small, it is the only copy, and the guard does not flag it.
- **Guard changes:**
  - `game_action_character_loader` becomes "absorbed into `game_backspool_switch_v02.js`", so it is no longer a `RECONCILED` entry with its own `_v02` file.
  - `PENDING` becomes empty.

**Watch for:** `280-threadrail-game.js` changed in today's `V02_THREADRAIL_GRIND` build, and `210`/`220` are Backspool movement code that other sessions work on.
- After the move, those edits go to the `_v02` files instead.
- Just before applying, check that no session has uncommitted edits to these parts.
- Tell the other sessions through the shared notes.

### Decisions for the user

1. **What should the vertical district file be called?** Its ancestor is already named `game_vertical_district_v02.js`.
   - **Recommended:** `game_vertical_district_v02_v02.js`. The rule stays mechanical, so the guard and the docs need no exception.
   - **Or:** a clearer name such as `game_vertical_district_live.js`.
2. **How should the switcher be laid out?**
   - **Recommended:** merge the loader fragment from batch 4 into `game_backspool_switch_v02.js`. That gives one module in one file and no fragment left.
   - **Or:** keep the batch-4 layout and add `_v02` head and tail files for the switcher.

### Batch 5: applied 2026-11-06, not committed

The user accepted both recommendations: the name `game_vertical_district_v02_v02.js`, and merging the switcher into one file.

- **Check before moving:** no uncommitted edits to any affected part, the other worktrees are snapshot branches, and every linked session was idle.
- **New files:**
  - `scripts/game_backspool_traversal_runtime_v02.js` (was `210`)
  - `scripts/game_backspool_posture_runtime_v02.js` (was `220`)
  - `scripts/game_backspool_threadrail_runtime_v02.js` (was `280`; the `270` header comment stays)
  - `scripts/game_vertical_district_v02_v02.js` (was `300`)
  - `scripts/game_presentation_upgrade_v02.js` (was `320`)
  - `scripts/game_backspool_switch_v02.js`, which is `380-character-switcher-head.js` + `game_action_character_loader_v02.js` + `385-character-switcher-tail.js` concatenated, the whole `characterSwitcher` IIFE
  - Each is byte for byte; where a part ended in a blank line, that blank line became a text entry.
- **Removed:**
  - engine parts `210`, `220`, `280`, `300` and `320`;
  - `380-character-switcher-head.js` and `385-character-switcher-tail.js`;
  - `scripts/game_action_character_loader_v02.js`, created in batch 4 and now absorbed into the switcher.
- **Unchanged:** `410-hero-switch-input.js` stays as engine code.
- **`build_v02.py --check`:** `IDENTICAL` against `…V02_THREADRAIL_GRIND.html` (`ab02ac2a…`), both before and after the removals.
- **Drift guard changes:**
  - 6 more modules in `RECONCILED`;
  - 6 more frozen ancestor hashes, 27 in all;
  - a new `ABSORBED` map (`game_action_character_loader` → `game_backspool_switch`), checked: the host must be reconciled, the absorbed module has no `_v02` file, and every ancestor is accounted for;
  - `PENDING` is now empty.
  - Result: PASS, 4 checks.
- **Tests:** none of the six has a plain-node test, so their behaviour is NOT TESTED at node level. The proof for the move is byte identity.

**All 26 drifted modules are reconciled.** No `scripts/` module's code is left inside a `src/v02/engine/` part.
