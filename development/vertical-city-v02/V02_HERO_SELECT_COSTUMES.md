# V02 hero select v2: Backspool costume carousel

**Build:** `SIGHTLINE_SAINT_MERIDIAN_V02_HERO_SELECT_COSTUMES.html`, SHA256 `4bdd19e9…c558519205`, record `V02_Hero_Select_Costumes_Build.json`.
The v1 hero select and its builds are described in `V02_HERO_SELECT.md`.

## New files; v1 is left as it was
- **Module:** `scripts/game_v02_hero_select_v2.js` and `scripts/game_v02_hero_select_v2.css`.
- **Test:** `scripts/vertical-v02/test_hero_select_v2.cjs`.
- **Regression runner:** `scripts/vertical-v02/run_hero_select_costumes_checks.py`.
- **v1 is unchanged** (`scripts/game_v02_hero_select.js`, `.css` and `test_hero_select.cjs`). The builds that load it keep exactly the module their evidence was recorded with: HERO_SELECT, HERO_SELECT_RUNNER_FULL, HERO_SELECT_FRAMING, HERO_SELECT_CARTRIDGE, THREADRAIL_GRIND and BACKSPOOL_COSTUME.
- `test_hero_select_v2.cjs` checks `loadsV2ModuleOnly`: the page loads `game_v02_hero_select_v2.js` and not v1.

## Source and build
- **Source:** the committed canonical source at `acd0035`; its `src/v02` is identical to `1a6be58`, the Backspool costume build. The only change is in `src/v02/page.html`: its v1 tag `game_v02_hero_select.js` is replaced by `game_v02_hero_select_v2.js?v=ebfd87c1f1ef`.
- **Check:** `build_v02.py --check` reported IDENTICAL against BACKSPOOL_COSTUME before the build, and against this build after it.
- **Where it was built:** in a clean `git archive` export of `HEAD`. The worktree's `src/v02` holds another session's uncommitted Sunday Row work (engine files, `page.html`, and a `latest.json` pointing at `…SUNDAY_ROW_SIGNS_WEAR08.html`).
- **How it was committed:** only the one-line `page.html` change and the new `latest.json` went in, through the git index. That session's uncommitted edits stay in its working files. The same one-line tag swap was also applied to the working `page.html`, so its next build carries v2.

## What v2 adds
- **The carousel.** On Backspool's page, arrows either side of his turntable step through his costumes, and a label at the stage's top left reads "Costume 1/2 · Default" or "Costume 2/2 · Half mask".
  - The list comes from the game's costume module, `window.backspoolCostume.list()`.
  - Each costume turns on the turntable as its own preview rig. The half mask is `assets/backspool/costumes/half-mask/backspool_halfmask_mixamo.fbx`, wearing Backspool's idle clip retargeted onto it the way the costume module builds its game bank: `backspool.fbx` as the rest source, faced alike, `MixamoRetarget.retargetClip`.
  - Preview rigs are built once and reused for later opens.
- **Selecting a costume** goes through `backspoolCostume.set(id)`, the Hero tab's own path. The Hero tab radios stay in sync, and the choice is remembered (`localStorage backspoolCostume`).
  - If Backspool is already the hero, the module swaps his model.
  - Otherwise the costume is stored, then `characterSwitcher.change('backspool')` loads that bank.
  - The confirm button reads "Select Backspool · Half mask", or "Resume as Backspool" when nothing changes.
- **Input, chosen so costumes never clash with hero browsing:**

| | Heroes | Backspool costumes |
|---|---|---|
| Keyboard | ↑ ↓, W S, 1–3 | ← →, A D |
| Controller | LB / RB, D-pad ↑ ↓, left stick up/down | D-pad ← →, left or right stick sideways |
| Mouse | hero cards | the arrows beside the model |

  - Left/right on Sightline's or Loadout's page does nothing; they show no arrows.
  - **Behaviour change from v1:** hero browsing was ←/→ and D-pad ←/→; it is now ↑/↓, matching the vertical roster.
  - The L3+LT+RT+R3 chord is unchanged.
- **Also in v2:**
  - The outline width uses each mesh's world scale; the costume FBX nests its mesh under a scaled node.
  - The label and bottom bar fit at 1024 px wide.
  - A `CSS_REV` in the module means a CSS-only change still changes the script's cache tag.

## Test checks (`test_hero_select_v2.cjs`, 30 in all)
- Everything from v1's test, with hero browsing on ↑/↓, the D-pad and the left stick vertical.
- `loadsV2ModuleOnly`.
- `costumeCarouselBackspoolOnly`, across 16 framing runs (both costumes, three viewports): the arrows and label show only on Backspool's page, with the right label, clear of his model, text, panels and the cartridge card.
- `sideKeysIdleOnSightline`.
- `keyboardSelectsHalfMaskInGame`: → then Enter. The bank becomes `backspool@halfmask`, the costume module's applied bank matches, the Hero tab radio is checked, and W moves him.
- `padAndMouseBringBackDefault`: Y opens; the mouse arrows step both ways; D-pad ← lands on Default; A equips it. The bank is `backspool` again, the Hero tab is in sync, and the stick moves him.
- The framing and cartridge checks also cover the half mask (16 runs each).

## Results
- `test_hero_select_v2.cjs`: 30/30 PASS. Evidence is in `evidence/hero-select-v2/`; the costume screenshots are `10-costume-halfmask.png`, `11-playing-halfmask.png`, `12-costume-default.png` and `framing-*-backspool*.png`.
- Regression runner, 25 jobs: **25/25 PASS** (`evidence/hero-select-costumes-checks/summary.json`).
- NOT TESTED: touch input, and frame cost on a real GPU.
