# Loadout, the third hero

**Build:** `SIGHTLINE_SAINT_MERIDIAN_V02_LOADOUT.html`. It is a new file built from the menu-style candidate by `scripts/vertical-v02/build_loadout_hero_candidate.py`, which applies 25 inverse-verified hooks. The record is `development/vertical-city-v02/V02_Loadout_Hero_Build.json`. No earlier build or shared module was edited.

## What the user asked for, and the choices made

- **Role:** Loadout is a third playable hero.
- **Moveset, as chosen by the user:** Backspool's moves without his powers. Loadout can:
  - run, sprint, use Flow and jump;
  - use Backspool's traversal and parkour, and his melee combat;
  - evade.
- **No powers:** Loadout has no Threadrail (rails or cartridges), no Afterstep Drive (releases and contact impulses), no Snapback, no recorded routes, and no Echo or Retrace. This is a placeholder until his own abilities are designed; no new powers or lore were invented.
- **Hero switching:** the L3 + LT + RT + R3 chord cycles Sightline → Backspool → Loadout → Sightline, and the Hero tab's character list includes Loadout.
- **Cape:** the menu's Hero tab shows a Loadout section with a Cape On/Off switch, but only while Loadout is the active hero. The game remembers the choice.

## How it works

| Piece | What it does |
|---|---|
| Switcher hooks | `characterState()` now reports `hero` (`sightline`, `backspool` or `loadout`) next to `active`, the controller. For Loadout, `active` stays `backspool`, so every existing Backspool movement, traversal, combat, camera and encounter path applies unchanged. Animation banks are kept per hero. |
| `scripts/game_v02_loadout_hero.js` | Builds Loadout's bank from Backspool's: loads `assets/loadout/loadout_caped.fbx`, normalises it like Backspool (1.82 m tall), matches his facing, and retargets all 183 Backspool clips onto Loadout's skeleton. It splits the cape into its own mesh on the same skeleton (so it and its outline can be hidden, and the foot sampler never mistakes the cape hem for feet), applies the game's toon look and outline, and runs the cape cloth. It also owns the Hero-tab Loadout section and the power HUD overrides. |
| `scripts/game_mixamo_retarget.js` | Clip retargeting between Mixamo-named skeletons whose bone orientations differ. |
| `scripts/game_loadout_cape_cloth.js` | Cape cloth. It runs once a frame just before rendering, after every animation and pose pass. It rotates cape bones only and never moves the actor (movement ownership is unchanged). After a teleport or respawn it starts again from the rigid cape. |
| Power hooks | Guards at the top of `contact`, `release`, `quickRail`, `attach`, `createConnection`, `precisionStart`, `snapAction`, `recordRoute` and `replayRoute`. Also covered: the Echo/Retrace `enabled()` check and the cartridge drawing. |
| HUD | While Loadout is active, the Afterstep panel (Drive strain and Echo slots) and Drive/Threadrail buttons are hidden. The hero name and the "BACKSPOOL ·" mission prefix read LOADOUT, and the controls hint lists only Flow and evade. All of it is restored when you switch away. |
| `scripts/game_v02_menu_style_v2.js` | A copy of the menu-style module that knows the third hero, so the backdrop word reads LOADOUT. The v1 file is unchanged; only the new build loads v2. |

**Switch time.** About 3.3–4.0 s from Sightline, which includes building Backspool's bank first. Loadout's own part is about 1.0–1.2 s, of which retargeting the 183 clips takes about 0.56 s.

## Evidence

**`scripts/characters/loadout/test_loadout_hero_real_input.cjs`.** Inputs: real menu clicks and selections, the keyboard, a page reload, and the chord on a simulated standard gamepad read by the game's own polling. There are no teleports. All 16 checks PASS (`evidence/hero/`):
- **Hero tab:**
  - no Loadout section for Sightline;
  - a Loadout section with a working Cape switch for Loadout;
  - the backdrop word reads Loadout.
- **Movement:** Loadout runs on the Backspool controller, all clips are retargeted, and W moves him 15.5 m in 2.5 s.
- **Cape:**
  - while on, the cloth updates, stays finite and stays outside the body;
  - switching it off hides the cape and stops the cloth;
  - the hero and the cape choice survive a reload;
  - switching it back on works.
- **Powers and HUD:**
  - U (Snapback), E (Drive) and R (rail) do nothing for Loadout;
  - the same Snapback key banks for Backspool, the control;
  - the power HUD is hidden and relabelled for Loadout and restored for Backspool.
- **Chord:** it cycles Loadout → Sightline → Backspool → Loadout.
- **Errors:** no page errors.

**The standalone cape tests from `LOADOUT_CAPE.md` still apply** to the cloth itself.

**Regressions:** the full V02 set was run against this build, muted and with one browser at a time (`development/vertical-city-v02/evidence/loadout-hero-checks/`). All 16 steps PASS:
- **Traversal:** friendly wall contacts, landing and roll flows, three city loops, and three station approaches.
- **Gameplay:** the 12 retained encounter, replay and discovery cases.
- **Backspool movement:** strides, graded vaults and climbs, standing and running take-offs, and crouch.
- **Combat:** 8-hit combat, Sightline burst, kick, guard and rail separation, burst rhythm, and themed slots.
- **Build features:** impact FX, no halo trucks, and the menu (including the backdrop word for Backspool).

These cover Backspool and Sightline in the new build. None of them plays as Loadout.

## Not done / NOT TESTED

- **Loadout's moves:** Loadout's combat, vaults, wall runs, ladders, swimming, crouching and landings use Backspool's systems with retargeted clips. They were not tested with Loadout, and contact-heavy moves may need foot and hand offsets for his proportions.
- **Missions:** Backspool's lessons that depend on Echo, such as the Action Replay lesson, cannot be completed as Loadout. Which missions he should have is a design decision.
- **Placeholder clips:** Loadout inherits Backspool's placeholder Forspoken and NSUNSC clips, so the same pre-release replacement rule applies to him.
- **HUD:** the general STRAIN bar still shows (at 0%) for Loadout.
- **Name clash:** the Hero tab already has a "▶ LOADOUT" button from the motion-library feature (`game_motion_loadout.js`), which stages combat moves. It shares the name with the character; renaming one of them is the user's call.
- **Cape against the world:** the cape collides only with his own body, not the city.
