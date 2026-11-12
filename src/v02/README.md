# V02 canonical source

This folder is the single source of the V02 game page. It replaces the HTML patch chain: before this, each build was made by
string-patching the previous 1.6 MB HTML, so the engine's code existed only inside the builds (44 recorded layers back to
`V02_VISUAL_CANDIDATE`).

- **Created:** 2026-11-05, by `scripts/vertical-v02/extract_v02_canonical_source.py`, from `SIGHTLINE_SAINT_MERIDIAN_V02_SIGHTLINE_FRAMING.html`.
- **Proof:** the source rebuilt that build byte for byte (SHA256 `e4c76db6…`).
- **First build from it:** `SIGHTLINE_SAINT_MERIDIAN_V02_CANONICAL.html`. It differs from `…SIGHTLINE_FRAMING` in exactly one place: the `?v=` cache tag of `scripts/game_v02_menu_style_v2.js`, which had been stale since the Loadout commit `a0620ef`.

**Invariant:** `python3 scripts/build_v02.py --check` passes. That means the source rebuilds the newest build exactly; the newest build is named in `latest.json`.

## Layout

| Path | What it is |
|---|---|
| `page.html` | The page markup. Every inline `<script>`/`<style>` body is an `@@include …@@` marker. External `<script src="scripts/…?v=…">` tags are written here. |
| `engine.json` | The engine's parts, in order. Entries are `{"file": …}` or `{"text": …}` (whitespace between parts). The parts are concatenated into one `<script>`, so they share one global scope and **order matters**. |
| `engine/NNN-*.js` | The engine's own code, split at its section boundaries. `ENGINE_MAP.md` lists what each file defines, for example `updateCamera`, `tickFrame` and `updatePlayer` in `310-frame-loop-player-camera-hud.js`. |
| `engine/NNN-*.live.js` | Live copies of `scripts/` modules that the old builds inlined and then patched (see "Drifted modules"). |
| `styles/`, `boot/` | The stylesheets and the small inline scripts. |
| `latest.json` | The newest build and its record. `build_v02.py` updates it. |
| `ENGINE_MAP.md` | Where each part of the engine lives, and the drifted-module table. |

**Included from existing files, not copied:**
- 29 `scripts/*.js` modules that were inlined unchanged. `engine.json` points at them. Alongside them, `engine/` holds 49 files of the engine's own code.
- `scripts/vendor/three-r128.js` and `GLTFLoader-r128.js`, unchanged.
- `fflate-r128.js` and `FBXLoader-r128.js`, minus their one-line "Extracted verbatim" header.

## Making a change

1. **Edit the source.**
   - **Engine code:** files in `engine/`.
   - **Markup or a module tag:** `page.html`.
   - **CSS:** `styles/`.
   - **A module:** its file in `scripts/`. Two kinds of modules use that file:
     - modules loaded by a `<script src>` tag in `page.html`;
     - the 29 modules listed in `engine.json`. Editing one of these changes the engine in the next build, and also the file that plain-node tests load.
   - **A new module:** create `scripts/game_v02_<name>.js` and add `<script src="scripts/game_v02_<name>.js?v=000000000000"></script>` to `page.html`. The build fills in the real hash.
   - Do not edit an older HTML build, and do not write a new patcher.
2. **Build a new, separately named page:**
   ```
   python3 scripts/build_v02.py --out SIGHTLINE_SAINT_MERIDIAN_V02_<NAME>.html --record V02_<Name>_Build.json --label "what changed"
   ```
   - It refuses to overwrite an existing, different build.
   - It refreshes every stale `?v=` tag, in the build and in `page.html`.
   - It writes a build record. The record carries the previous record's fields, so existing test runners keep working; its `source` is the previous build, which serves as the control.
   - It updates `latest.json`.
3. **Test with real input:**
   ```
   V02_ACTION_BUILD=V02_<Name>_Build.json node scripts/vertical-v02/test_….cjs
   ```
   For a quick boot check:
   ```
   node scripts/vertical-v02/test_canonical_smoke.cjs V02_<Name>_Build.json
   ```
   The full V02 regression set uses the `run_*_checks.py` runners. Copy the latest one and point it at the new record.
4. **Check the source and the build agree:**
   ```
   python3 scripts/build_v02.py --check
   ```

`python3 scripts/build_v02.py --map` prints every source file the page is assembled from, with sizes.

## Drifted modules (read before trusting a `scripts/` file)

The old builds inlined 26 `scripts/` modules and then patched the inlined copy, so each `scripts/` file stopped being the code the game ran (20 were found when `src/v02` was extracted; 6 more later). All 26 are now **reconciled** (2026-11-06, `development/vertical-city-v02/V02_MODULE_DRIFT.md`):

- **The live code is `scripts/<module>_v02.js`**, which `engine.json` includes. It is byte for byte what the engine ran, so the page did not change. Edit the `_v02` file.
- **`scripts/<module>.js` is a frozen ancestor.** It is hash-pinned by older evidence and read by the old patchers, so it is never edited, and editing it changes nothing in the game. `scripts/game_halo_trucks.js` is a frozen ancestor too, an older predecessor of `game_halo_transport`.
- **Tests:** the original plain-node tests still test the ancestors. The `_v02` tests (`scripts/test_*_v02.cjs`) test the live code. 22 of the 26 modules have no plain-node test at all.
- **The character switcher is one file:** `scripts/game_backspool_switch_v02.js` holds the whole `characterSwitcher` IIFE, including the Backspool loader section whose ancestor is `scripts/game_action_character_loader.js`. The hero-switch chord (`410-hero-switch-input.js`) stays engine code.
- **Still drifted:** none. If you find a `scripts/` file whose code also sits in `src/v02/engine/`, the guard below fails.
- **Guard:** run `node scripts/vertical-v02/test_v02_module_sources.cjs` after touching any module. It fails if a module's code drifts into an engine part, or if an ancestor is edited.

The tables are in `ENGINE_MAP.md`.

## Not changed

- The 76 older HTML builds, their patchers and their build records. They stay for history and evidence; nothing was deleted or rewritten.
- No `scripts/` module was edited.
