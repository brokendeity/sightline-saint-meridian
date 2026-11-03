# V02 Menu style: "Midnight Slash"

Candidate: `SIGHTLINE_SAINT_MERIDIAN_V02_MENU_STYLE.html`. It is built from the no-halo-trucks candidate by `scripts/vertical-v02/build_menu_style_candidate.py`, which applies 1 inverse-verified hook. The hook loads `scripts/game_v02_menu_style.js` after the HUD module. That script links `scripts/game_v02_menu_style.css` after the HUD stylesheet and adds three decorative layers.

This is presentation only. Every id, button, tab, select and handler is the one the HUD module already owns.

## Reference and what was taken from it

The user pointed to the Game UI Database page for Persona 5 (`gameuidatabase.com/gameData.php?id=72`). Its title, menu, settings, load and stats screens were reviewed after the user passed the site's Cloudflare check.

Following the project rule, only design principles were taken. No layout, art, typography or assets were copied:

| Principle | Saint Meridian version |
|---|---|
| Full-screen diagonal composition instead of a centred box | A midnight slab on the left with a slanted edge; the live city stays visible and unblurred on the right. |
| One loud selection colour with hard offset shadows | The selected tab and primary buttons are cyan slabs with an amber hard shadow. There is no glow or bloom. |
| Stamped labels and skewed plates | Amber parallelogram stamps for the eyebrow and section headings; skewed slab buttons. |
| Oversized, tilted display type | `SIGHTLINE` set large, tilted, with a hard cyan shadow. The active hero's name appears as an outlined backdrop word. |
| Stacked, staggered slips | The three objectives are staggered, tilted slips. |
| Small stamped button prompts in the footer | Key-cap prompts for the keys the menu really answers to: arrows switch tabs, Tab moves, Enter selects. Escape only pauses, so it isn't listed. |
| Snappy entrances | 0.2–0.4 s slide and punch-in animations, turned off under `prefers-reduced-motion`. |

The palette follows the city art direction: midnight blue and charcoal, thin cyan strips, warm amber. The old orange-red buttons were off-palette and are now amber or cyan.

## Layout changes

- **District tab:** "Enter V02 district" now sits directly under the objectives. Before, it was below the City views panel and off-screen at 1440×900.
- **Anchoring:** the menu is anchored to the top instead of centred, so short tabs no longer float mid-screen.
- **Narrow screens:** below 900 px the slab covers the screen, and the hero word and edge strips are hidden. Below 700 px the mission brief stays hidden, as before. Below 620 px the five tabs wrap onto two rows instead of scrolling sideways, so "Controls" is no longer cut off.

## Evidence: `test_menu_style.cjs` (real mouse and keyboard)

Results are in `evidence/menu-style/`. PASS:
- **Stylesheet order:** the menu stylesheet loads after the HUD stylesheet, and no later stylesheet restyles the menu.
- **Decoration:** the three decorative layers are aria-hidden and ignore the pointer.
- **Nothing covered:** on every tab, each drawn control is the top element at its own centre, at both 1440×900 and 390×844. Controls inside a closed `<details>` are not drawn and are skipped. The old menu has the same closed-details geometry.
- **Tabs:** mouse clicks select all five tabs. ArrowRight, ArrowLeft, Home and End move between tabs. Tab keeps focus inside the card.
- **Hero word:** a real hero switch through the Hero tab's select changes the backdrop word to Sightline and back.
- **Play controls:** "Enter V02 district" (mouse) starts play, Escape pauses, and Resume (keyboard Enter) resumes.
- **Phone width:** the primary button and Resume are on screen, with no horizontal scroll.
- No page errors.

## Limits

- **Visual review:** the look was judged from screenshots only, and the user has not reviewed it yet.
- **Font:** the display font is the system Impact family, with condensed fallbacks. Other machines may substitute a different heavy face.
- **Gamepad:** there is still no gamepad navigation inside the menu, so there are no pad prompts.
- **Air test:** its occasional failure was a randomly placed halo drone shooting Backspool mid-jump, not timing. It is fixed in the test's labelled setup; see `V02_AIR_TEST_STABILITY.md`.

## Regressions (`evidence/menu-style-checks/`, run muted)

All PASS:
- 13 friendly wall-contact scenarios and the graded landing test
- three city loops and six station approaches
- the 12 retained encounter, replay and discovery cases
- the stride, vault and crouch tests
- the 8-hit combat, Sightline melee, burst rhythm and themed-slot tests
- the impact FX, no-halo-trucks and menu tests

**Correction (later the same day):** the conclusion below was wrong. The air test's failures came from a halo patrol drone whose patrol phase is set by `Math.random`. On some page loads it shoots Backspool mid-jump, and its hit reaction replaces the take-off. The blur had nothing to do with it; with a blur overlay present during load, the test passed 4 of 4. The pass rates below are chance at a roughly 70% per-run pass rate.

The test now stands hostile fire down in its labelled setup and asserts that no shot lands. With that, it passes 8 of 8 here: 5 of 5 on this build and 3 of 3 on the no-halo-trucks build. See `V02_AIR_TEST_STABILITY.md` for the full account.

The backdrop blur stays removed, because the menu reads well without it. The comment in `scripts/game_v02_menu_style.css` that says the blur caused the failures is outdated. It is left unedited because the build records that stylesheet's hash.

*Original (superseded) account:* the first version of this menu used a backdrop blur, and with it the air test failed in the full run. A bisect traced the failure to the stylesheet; with it blocked, the test passed 2 of 2. The test also passed every time with an 8 s settle after load.

The blur over the WebGL canvas was then removed. Air-test results, with the earlier baseline runs and the later runs interleaved on one machine (`air-flake-study/`, `air-noblur-*.log`):

| Build | Air test passes |
|---|---|
| No-halo-trucks (previous build) | 5 of 7 |
| Menu, with blur | 1 of 5 (1 of 2 alone after the full run, then 0 of 3) |
| Menu, final (no blur) | 9 of 10 |

The final build is no worse than the previous one.

Since removing the blur, the menu test has passed twice more.
