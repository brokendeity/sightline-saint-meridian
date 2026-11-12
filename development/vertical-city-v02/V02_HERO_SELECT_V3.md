# V02 hero select v3: the redesign

**Build:** `SIGHTLINE_SAINT_MERIDIAN_V02_HERO_SELECT_V3.html`, SHA256 `078c315c…20cebe53`, record `V02_Hero_Select_V3_Build.json`.
- **Where:** branch `feature/hero-select-v3`, in its own worktree `../hero-select-v3`, cut from `3da20d1` (the v2 costume carousel). Local only, never pushed.
- **How it was built:** from `src/v02` with `scripts/build_v02.py`; `--check` reports IDENTICAL against this build.
- **Serving:** run `python3 -m http.server 8767 --bind 127.0.0.1` from the worktree, and open `SIGHTLINE_SAINT_MERIDIAN_V02_HERO_SELECT_V3.html?capture=backspool`.

## New files (v1 and v2 untouched)
- **Module:** `scripts/game_v02_hero_select_v3.js` and `scripts/game_v02_hero_select_v3.css`.
- **Switcher:** `scripts/game_backspool_switch_v03.js`, a copy of `game_backspool_switch_v02.js` plus `prewarm(key)` and `warmBanks()`.
  - `performChange` waits for a bank that is still warming, so a confirm during preload never builds the same bank twice.
  - `src/v02/engine.json` now includes v03 instead of v02.
- **`src/v02/page.html`:** the v2 tag is replaced by `scripts/look/anime_paint_look.js` (committed in `075c391`, unchanged) and the v3 module.
- **Test:** `scripts/vertical-v02/test_hero_select_v3.cjs`, 43 checks. It takes `V02_PORT`, default 8767.
- **Regression runner:** `scripts/vertical-v02/run_hero_select_v3_checks.py`.

## Look
- **The hero owns the screen.**
  - A full-screen 3D stage and a larger figure: about 75% of screen height, against about 50% before.
  - A slightly low camera: eye at 0.62 m, looking up to 0.98 m.
  - Hero-coloured lights that ease on a switch:

    | Hero | Key | Rim |
    |---|---|---|
    | Backspool | yellow `#ffc23a` | cyan `#5fe3e8` |
    | Sightline | red `#ff3b47` | navy `#3552e0` |
    | Loadout | violet `#8a5cff` | deep violet `#4a2399` |

  - The hero's name in huge outlined letters behind the model, in the pause menu's "Active hero" word style, drawn in the 3D pass so the model covers it.
- **A painted backdrop per hero,** rendered through `AnimePaintLook` (materials converted, environment from each sky, Kuwahara paint, ink, halation, grade):
  - **Backspool:** a Sunday Row rooftop at dusk, with the subtitle "Aramis Ward · Sunday Row" from Map Bible canon:
    - tar roof and brick parapet, a water tank, AC units, a chimney;
    - brick walk-ups with warm windows, a church steeple, a violet-to-orange sky.
  - **Sightline:** above the city:
    - an antenna deck, tower tops far below;
    - straight cyan rail lines running to fixed points, with no curves;
    - a navy sky with a red horizon.
  - **Loadout:** a street-runner alley:
    - asphalt and kerbs, painted walls, sodium lamps, a dumpster;
    - a violet night.
  - Simple geometry, 15–25 meshes per backdrop. Each backdrop is converted once, taking 13–272 ms.
- **The hero is drawn after the paint pass** (depth cleared), so the painterly filter never smears his toon look.
- **Fewer boxes:**
  - identity, roster, one radar chart (four axes) and icon ability cards sit on the scene;
  - edge shading instead of framed panels;
  - "Midnight Slash" type and palette, with a per-hero accent.
- **Motion:**
  - On every hero change: a slash wipe (DOM) and a 0.6 s camera dolly-in.
  - On selection, a signature pose plays while the switch runs, and the screen resumes after at least 0.9 s:
    - **Backspool:** the Echo pose ("Shooting ability out of hand") with a 0.5 s pulse of 26 cyan/violet Afterstep glass shards. There are no flames and no lasting trail; every shard is removed when the pulse ends.
    - **Sightline:** his aim (`Standing Aim Idle`).
    - **Loadout:** a Runner flip (`Jmp_FrontAir_Roll_All`).
  - Hovering, focusing or tapping an ability plays that move on the preview model.

## Function
- **Try before you pick.** Each ability previews its move. The clips are presentation stand-ins from each hero's own sets:

  | Hero | Ability | Clip |
  |---|---|---|
  | Backspool | Echo | "Shooting ability out of hand", plus shards |
  | | Retrace | "Running to Forward Flip" |
  | | Threadrail | "rail grinding" |
  | | Afterstep Drive | "Aerial Evade", plus shards |
  | Sightline | Kinetic rail | aim-shoot-fly |
  | | Brace | controlled fall |
  | | Scan | standing aim |
  | | Bloom | hard landing |
  | Loadout | Flow | front-air roll |
  | | Combat | kick |
  | | Cape | slide |
  | | No powers | spawn landing |

- **Controls tab.** Each hero's own bindings:
  - **Sightline:** the page's original guide, captured before the gameplay-fixes module replaces it.
  - **Backspool and Loadout:** the gameplay-fixes guide's tables, with Loadout's power keys removed.
- **Costumes and gear:**
  - **Backspool's costume carousel:** left/right or the D-pad. The arrows now follow his projected silhouette at any window size.
  - **His Threadrail cartridge showcase:** under his abilities, hidden on the Controls tab.
- **No freeze on switching.**
  - Opening the screen preloads every preview rig, then every hero's game bank through `characterSwitcher.prewarm`.
  - A "Preparing heroes" shimmer shows while it runs.
  - Measured:
    - the first Loadout switch now takes 67 ms, against about 1.2 s before;
    - the chord switch while open takes 28 ms.
  - **Cost:** the menu itself hitches once per bank built: up to about 1.1–1.4 s for Loadout, and about 1.2 s for the half mask, on the first open of a session. Later opens do no work. That cost has moved, not disappeared.
- **Every input:**

  | | Keyboard | Controller | Mouse / touch |
  |---|---|---|---|
  | Heroes | ↑ ↓, 1–3 | LB/RB, D-pad ↑ ↓, left stick | cards (click or tap) |
  | Costume | ← → | D-pad ← →, either stick sideways | arrows |
  | Try ability | Q / E | X | hover, focus or tap a card |
  | Controls tab | C | Y | tab buttons |
  | Select | Enter | A | Select button |
  | Back | Esc | B, Start | Back button |

  - The L3+LT+RT+R3 chord is handed to the engine first and keeps top priority.
  - While the screen is open, the Threadrail key handler is gated, the same way as the paused-overlay gate. It had been consuming E, Q, C and R even while paused.

## Found along the way (v1 and v2 are not changed)
- **Duplicate id.** v1 and v2 give their name heading the id `v02HeroName`, which the Loggia HUD already uses for its toolbar label. So they wrote the browsed hero's name into the HUD label until the HUD next refreshed it. v3 uses `hsV3Name`, and checks that every id inside the screen is unique.
- **Leaked button styles.** The page's generic `button{…}` style (margin, radius, orange fill) leaks into overlays. v3 resets it inside its own root.

## Results (real input, headless Chromium, ANGLE/Metal)
- `test_hero_select_v3.cjs`: 43/43 PASS. Evidence and screenshots are in `evidence/hero-select-v3/`:
  - `v3-backspool.png`, `v3-sightline.png`, `v3-loadout.png`;
  - `transition-1-wipe.png`, `transition-2-dolly.png`;
  - `ability-echo-shards.png`, `ability-hover-threadrail.png`;
  - `controls-tab-backspool.png`;
  - `touch-loadout.png`;
  - `framing-*`;
  - `01`–`12` for the input flows.
- **Frame interval** with the painted backdrop: p50 8.4–8.5 ms, p95 17.0–17.2 ms, worst 25–34 ms. CPU per frame p95 is about 0.9 ms. These numbers are headless and indicative only; the real GPU was NOT TESTED.
- **Regression runner** (`run_hero_select_v3_checks.py`, 25 jobs): **25/25 PASS counting reruns.**
  - The first full run was 22/25: station-routes, crouch and sightline failed while the v3 screen was rendering in the user's browser pane at the same time.
  - Rerun alone: crouch PASS, sightline PASS.
  - station-routes failed once more at a different route, then passed, with the control (`…HERO_SELECT_COSTUMES`) also passing back to back under the same load, with identical route timings.
  - The details are in `evidence/hero-select-v3-checks/summary.json` (`rerun`, `rerun2`, `verdict`).
  - Every suite talks to port 8766, so this worktree was served on 8766 for the run, and the main checkout's server was restored afterwards.
- **NOT TESTED:** a physical controller, a real touchscreen device, and real-GPU frame cost.
