# V02 hero select (pause menu)

## Current build: `SIGHTLINE_SAINT_MERIDIAN_V02_HERO_SELECT_CARTRIDGE.html`
- **Build:** SHA256 `e5fa166e…84b54f31`, record `V02_Hero_Select_Cartridge_Build.json`, made from `src/v02`. `build_v02.py --check` reports IDENTICAL against it.
- **New: Backspool's Threadrail cartridge display.** When Backspool is the selected hero, a "Threadrail cartridge" card appears in the upper right of his stage. It is hidden for Sightline and Loadout.
- **The asset** is the game GLB, `assets/backspool/threadrail-cartridge/backspool_threadrail_cartridge_game.glb`: 4 MB, 9,498 triangles. The 35 MB master is not used.
- **The display:**
  - It turns slowly and cycles folded → deployed → folded every 6 seconds.
  - It uses the in-game transforms from `game_threadrail_cartridge_visuals.js` and `states.json`:
    - fins slide out by their `deployOffset`;
    - jaws turn −0.9 rad about local Z;
    - the spool spins, and its core brightens from 0.3 to 1.0 when deployed.
  - It is pair A: red identifier, A label shown, B label hidden. The belt clip is hidden.
  - Lighting is the asset viewer's, with the key light warmed toward amber.
  - The camera is fitted to the deployed extent: 12 cm across, against 8 cm folded.
- **Cost:**
  - It is drawn as a second, scissored pass of the existing preview renderer, so there is no extra WebGL context.
  - It is drawn only while Backspool is selected and the screen is open.
  - The GLB is fetched and parsed once on first use, and the parsed scene is kept.
  - When the screen closes, its GPU geometry, materials and textures are freed: in the test run, geometries went 39 → 20 and textures 13 → 9. three.js uploads them again on the next draw.
- **New test checks** in `test_hero_select.cjs`:
  - `cartridgeDisplayBackspoolOnly`, across the 12 framing runs:
    - for Backspool, the card is visible and draws the GLB (more than 1,000 triangles per pass, frames advancing);
    - the card lies inside the stage, below the title and description, clear of every panel and of his model;
    - the deployed cartridge's projected box stays inside the card's view (3 px tolerance);
    - for Sightline and Loadout, the card is hidden and not drawing.
  - `cartridgeFreedOnCloseAndReused`: the GPU buffers are freed on close, and the cartridge draws again on reopen.
- **Results:**
  - `test_hero_select.cjs`: 25/25 PASS;
  - canonical smoke: PASS;
  - evidence in `evidence/hero-select-cartridge/`. Backspool's screen is in `09-backspool-cartridge.png` and `framing-*-backspool.png`.
  - The 21-job regression set was not re-run for this build: NOT TESTED. Only the hero-select module and its styles changed.

## Previous build: `SIGHTLINE_SAINT_MERIDIAN_V02_HERO_SELECT_FRAMING.html`
- **Build:** SHA256 `c4af0ebe…2630a1e8`, record `V02_Hero_Select_Framing_Build.json`, made from `src/v02`. `build_v02.py --check` reports IDENTICAL against it.
- **Fixes, compared with `…HERO_SELECT_RUNNER_FULL`:**
  - **Framing bug.** When a hero's preview left the turntable, its height was reset to 0. That wiped out the offset that stands each animated skin on the base. Sightline's idle clip carries extra hip height, so on his second showing he floated about 1 m up: head cut off at the top, body over the description text. Each rig now keeps its ground offset (`baseY`).
  - **Stage placement.** In the wide layout, the stage now starts 14 px below the title block, measured on the page and re-measured on every swap and on resize. A longer description can never reach the model.
  - **Badge.** The "Active" badge moved under the role line; on narrow cards it overlapped the name at 1024 px wide.
- **New test check: `previewFramingClearOfTextAndOnBase`** in `test_hero_select.cjs`.
  - **Runs:** each hero shown twice at 1280×800, and once each at 1920×1080 and 1024×768, chosen with the 1–3 keys. 12 runs in all.
  - **Asserts** that the projected box of the animated skin:
    - lies fully inside the stage;
    - sits below the eyebrow, name plate, role and description;
    - overlaps no panel (traits, roster, abilities, bottom bar);
    - has its feet on the base: world min Y within 6 cm of 0, and the box's bottom edge within the base rim on screen.
  - **Not shown failing.** The check passes on the fixed module. It was not re-run against the old module, but the old evidence screenshot `evidence/hero-select/02-hero-select-sightline.png` shows the failure it targets.
- **Results:**
  - `test_hero_select.cjs`: 23/23 PASS, including 12/12 framing runs;
  - canonical smoke: 4/4 PASS;
  - evidence in `evidence/hero-select-framing/`, with the smoke output in its `smoke/` folder.
  - The 21-job regression set was not re-run for this build: NOT TESTED. Only the module's preview code and styles changed.

## Previous build: `SIGHTLINE_SAINT_MERIDIAN_V02_HERO_SELECT_RUNNER_FULL.html`
- **Build:** SHA256 `5a239402…cbe1fe55`, record `V02_Hero_Select_Runner_Full_Build.json`.
- **Source:** the current canonical source (Loadout Runner Full, `884e5df`) plus the hero-select tag in `src/v02/page.html`. `build_v02.py --check` reports IDENTICAL against it, so it is the source's newest build.
- **Canvas fix, compared with the first build below:** the turntable `<canvas>` is now attached to the page only while the screen is open, so during play the page has a single canvas.
  - The first build kept the turntable canvas in the page at all times.
  - `test_friendly_landing_contacts.cjs` clicks a bare `locator('canvas')`, and failed on that build with a strict-mode violation.
  - `test_hero_select.cjs` now also checks `singleCanvasWhileClosed`.
- **Regression set:** `scripts/vertical-v02/run_hero_select_runner_full_checks.py`, 21 jobs: smoke, hero select, the 16 V02 suites and the 3 Loadout jobs. Evidence in `evidence/hero-select-runner-full-checks/`.
- **Older builds load the current module.** All builds load `scripts/game_v02_hero_select.js` from disk; the `?v=` tag only busts the cache. So `…V02_HERO_SELECT.html`, served from a checkout that has the fix, runs the fixed module too.

## First build: `SIGHTLINE_SAINT_MERIDIAN_V02_HERO_SELECT.html`, commit `88ec58d`

**Build:** `SIGHTLINE_SAINT_MERIDIAN_V02_HERO_SELECT.html` (SHA256 `2af17e20…1ebadb`), record `V02_Hero_Select_Build.json`.
**Regression results** (`evidence/hero-select-checks/summary.json`), stopped by hand:
- PASS: smoke, hero-select, wall-contacts, city-loops;
- FAIL: landing-contacts, from the extra canvas described above;
- NOT TESTED: the rest. The run was stopped because, after the fix, its remaining jobs would have loaded the fixed module.
**Made:** 2026-11-06, by `scripts/build_v02.py`, from the committed canonical source at `112bf6c`. The control is `…V02_CANONICAL.html`.
**The only source change:** one line added to `src/v02/page.html`, after the `game_v02_close_camera.js` tag:

```html
<script src="scripts/game_v02_hero_select.js?v=fe7a12d973f6"></script>
```

> The first build was assembled in a clean export of `112bf6c`, because `src/v02/` then held another session's
> uncommitted Runner Full work. Once that work was committed as `884e5df`, the line went into the shared
> `src/v02/page.html`, producing `…HERO_SELECT_RUNNER_FULL`, described above.

## What it is
A full-screen character-selection screen, reachable while the game is paused. It shows Backspool, Sightline and Loadout, each with:
- a live 3D turntable of the hero's real model playing their idle clip;
- name, code and role, plus a one-line description;
- four "play style" bars;
- four ability cards.

Confirming a hero switches through the game's existing `characterSwitcher.change(id)`, then resumes play with `startGame()`. That is the same path as the Hero tab's Character dropdown and the L3+LT+RT+R3 chord. There is no new switch mechanism.

## Ways to open it (only while paused)
- the **Heroes** button in the pause footer, next to Resume;
- the **Hero select** section at the top of the Hero tab;
- the **H** key;
- controller **Y** (button 3, which the pause screen did not use before).

## Controls inside it
| | Keyboard | Controller | Mouse |
|---|---|---|---|
| Browse | ← → ↑ ↓, WASD, 1–3 | D-pad, left stick, LB / RB | Click a card |
| Select | Enter | A | Click the focused card again, or **Select** |
| Back to pause | Esc, Backspace | B, Y, Start | **Back** |
| Turn the hero | | | Drag the turntable |

- Space is swallowed and never selects, so mashing jump cannot switch hero.
- Gameplay keys and pad buttons pressed while the screen is open do not reach the game.
- **L3+LT+RT+R3 keeps priority.** It is passed through to the engine even while the screen is open. The hero switches and the screen updates its Active badge.

## How it plugs in (no engine file edited)
- It joins the paused-overlay gate that the City views module already uses: `window.verticalViews.active` and `.poll`.
  - While the screen is open, `startGame`, `activateGame` and pointer lock stay blocked.
  - The engine's gamepad poll hands each frame's pad state to this screen first.
- The hero-switch chord is handed back to the engine's `handleHeroSwitchChord`: when all four buttons are down, or while it is latched.
- **Turntables:**
  - The previews are separate copies, drawn by their own small `THREE.WebGLRenderer` on the screen's canvas, only while the screen is open. The game's renderer, scene, toon material cache and shared shader chunks are not touched. (The lesson from earlier sessions: lit-chunk additions are expensive on ANGLE/Metal.)
  - **Sightline:** the idle FBX bytes the game already holds (`EMBEDDED_FBX[ASSET_KEYS.idle]`) and that file's own idle clip.
  - **Backspool:** `assets/backspool/backspool.fbx`, and from `action-v2-core-native.json.gz` the clip `Breathing Idle without skin`, which is his bank's base idle.
  - **Loadout:** `assets/loadout/loadout_caped.fbx`, and the Runner clip named by `loadout_runner_roles.json` → `flow.idle` (`Idle_Wait_A`).
  - Each copy gets the same toon conversion as the game's `applyToonVisuals`, built locally, plus the game's `outlineCharacter`.
  - Each hero stands on the base by its **animated** skin, the way the game's foot samples work. Sightline's idle clip has a hip height that would otherwise float him.

## Design source
- The reference is `cortiz2894/ship-selection-page`. It was read, not run.
- It has **no licence file**, so all rights are reserved. Its code and assets were not used; only design principles were taken:
  - roster list on the left;
  - name plate and description top centre;
  - stat bars that fill one after another;
  - feature cards on the right;
  - the model on a turning base that spins on a swap;
  - a wireframe-to-solid reveal;
  - cut-corner panels, and a light sweep on the focused card.
- These are expressed in the "Midnight Slash" menu language: midnight-blue and charcoal slabs, thin cyan strips, amber accents, no bloom, no backdrop blur.

## Files
- `scripts/game_v02_hero_select.js`: the module. `window.v02HeroSelect.state()` reports its state for tests.
- `scripts/game_v02_hero_select.css`: the styles. The module links it, using its own `?v=` tag.
- `scripts/vertical-v02/test_hero_select.cjs`: the real-input test, 21 checks.
- `scripts/vertical-v02/run_hero_select_checks.py`: the regression runner. It runs the 16 suites from `run_sightline_framing_checks.py`, plus the canonical smoke check and the test above.
- `development/vertical-city-v02/evidence/hero-select/`: test report and screenshots.
- `development/vertical-city-v02/evidence/hero-select-checks/`: regression logs and summary.

## Status
Results are in the session report and in `evidence/hero-select-checks/summary.json`.

| Item | Status |
|---|---|
| Pause → hero select → pick each hero, by keyboard (Sightline), controller (Loadout) and mouse (Backspool); hero changes and play resumes with real movement | **PASS** (real input, headless Chromium, ANGLE/Metal) |
| Back out with Esc and with B: no switch, still paused | **PASS** |
| Browse by arrows (with wrap), stick, D-pad, LB/RB | **PASS** |
| Input does not leak into the game while open | **PASS** |
| Holding A through a switch does not resume early | **PASS** |
| L3+LT+RT+R3 during play, and while the screen is open | **PASS** |
| "Resume as" the current hero resumes with no switch | **PASS** |
| All three turntables render with no errors; drawing stops when closed | **PASS** |
| V02 regression set on `…HERO_SELECT_RUNNER_FULL` (smoke, hero select, the 16 V02 suites, loadout-hero, loadout-runner-roles, loadout-runner-full) | **21/21 PASS** (`evidence/hero-select-runner-full-checks/summary.json`) |
| V02 regression set on the first `…HERO_SELECT` build | 4 PASS, 1 FAIL (landing-contacts: extra canvas, since fixed), 13 NOT TESTED (run stopped) |
| Touch input (`touchPlay`) | NOT TESTED |
| Frame cost on a real GPU while the screen is open | NOT TESTED (headless only). While open, the paused city still renders underneath, plus the small preview context. |

## Known limits
- **Load and memory.** The previews are second copies of the models. On first open:
  - Backspool and Loadout are fetched again, about 11 MB, usually from the browser cache;
  - every hero's textures are uploaded a second time, to the preview's own WebGL context;
  - the copies are kept for later opens and never freed.
- **Backspool's preview idle** is his bank's base idle. Forspoken-era Flow remaps of `idle`, if any are active, are not applied to the preview.
- **Loadout's cape** has no cloth simulation in the preview. The cape bones hold their rest pose.
- **The play-style ratings** (Traversal, Reach, Combat, Powers) are presentation values chosen for this screen, not gameplay numbers. They are in `HEROES` at the top of the module, for the user to tune.
- **Unhandled LOW CEILING case.** If the switcher refuses a switch (LOW CEILING), the screen stays open and shows the switcher's message. This path was not exercised by the test.
