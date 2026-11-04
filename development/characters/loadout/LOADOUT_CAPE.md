# Loadout with a cloth cape

Loadout is a new character from the user's Tripo exports: a Mixamo-preset rigged body and a separate fur cloak. The cloak is fitted to the user's front and back reference sheet and moves as a short cape. It is not in a game build yet.

## Files (all new)

| File | What it is |
|---|---|
| `scripts/characters/loadout/blender_build_loadout_cape.py` | Headless Blender build: fits the cloak, adds the cape bones, weights the cloak to them, writes the FBX and the rig JSON. |
| `assets/loadout/loadout_caped.fbx` | Body and cape as one skinned mesh (two materials), the 65 Mixamo bones plus 55 cape bones, 2048 px textures embedded (4.6 MB). |
| `assets/loadout/loadout_cape_rig.json` | Cape chains, rest lengths and body colliders, as fractions of body height. |
| `assets/loadout/textures/` | The two base-colour textures (JPEG, 2048 px). The cape texture is recoloured to black in the build (see below). |
| `scripts/game_loadout_cape_cloth.js` | Runtime cape cloth (`LoadoutCapeCloth.create(model, rig, {height})`). |
| `scripts/game_mixamo_retarget.js` | Retargets clips between Mixamo-named skeletons with different bone orientations (`MixamoRetarget.retargetClip`). |
| `scripts/vendor/fflate-r128.js`, `scripts/vendor/FBXLoader-r128.js` | Copied verbatim from the inline blocks of the V02 build so standalone pages can load FBX. |
| `LOADOUT_CAPE_TEST.html` | Standalone test page (not a game build). |
| `scripts/characters/loadout/test_cape_chain_unit.cjs`, `test_loadout_cape_real_input.cjs` | Tests. |
| `evidence/fit/`, `evidence/cape-cloth/` | Fit renders, real-input results and screenshots. |

The Tripo source exports stay outside the repo in `3dmodels/` next to the project. Rebuild with:

```bash
Blender -b --factory-startup -P scripts/characters/loadout/blender_build_loadout_cape.py -- <body.fbx> <cloak.glb> <out dir>
```

## How it works

**Fit (Blender).**
- The cloak is turned 180°, so its pointed tail is down his back and the opening is at his chest.
- It is scaled to the sheet: collar at the base of the neck (89.5% of height), tail tip at mid-thigh.
- It is seated on an A-posed copy of the body.
- 1,390 vertices that cut into the body are pushed back out. The correction is spread to neighbouring vertices so strands bend rather than tear.

**Colour.** Tripo's cloak texture is olive-black. The build removes the tint: it keeps each pixel's brightness, so the fur strands stay readable, sets it to neutral grey, and darkens it (`CAPE_BLACK_GAIN = 0.5`) so the cape matches the black of his suit. The mean colour goes from RGB (23, 25, 20) to about (12, 12, 12).

**Cape bones.**
- 11 chains of 5 joints run round the collar, leaving an 80° opening at the front. Each chain follows the cloak's own drape, so the back chains are long and the shoulder flaps short.
- They are parented to `mixamorig:Spine2`.
- The cloak is weighted to these chains only, and the body's skin weights are unchanged apart from a limit of 4 per vertex.

**Cloth (runtime).**
- It runs position-based dynamics on the chain grid:
  - the top row is pinned to the collar each frame;
  - gravity and air drag act on the rest;
  - soft links between neighbouring chains make the chains act as one panel;
  - capsule colliders cover his hips, spine, chest, neck, arms and thighs, with radii measured from the body;
  - a backstop keeps every point on its own side of the torso, so a hard stop cannot wrap the tail through his legs;
  - a per-row swing limit applies.
- Each step ends with follow-the-leader passes, so the cape bones land on their cloth points, and then a final push out of the body. That final push can leave a bone up to about 2 cm off its point, but never leaves a point inside him.
- It rotates cape bones only. It never moves the character, his capsule or any Mixamo bone.

**Animation.**
- Tripo's "Mixamo preset" uses Mixamo bone names but not Mixamo bone orientations or units, so Backspool's clips do not play directly.
- `game_mixamo_retarget.js` converts them: it compares each bone's world-space rest pose on both skeletons and moves the hips by the hip-height ratio.

## Results: `test_loadout_cape_real_input.cjs` (real keyboard input, no setup)

The sequence is idle, then W (run), Shift (sprint), D while sprinting (turn), release, and P twice (cloth off and on). These are the four runs after the black cape and the final collision push; all PASS:

| | Result |
|---|---|
| Cape angle from vertical, idle | 0–0.3° |
| Running at 4.2 m/s | 36.5–41.8° back |
| Sprinting at 7 m/s | 40.3–47.7° back |
| Settles after stopping | 0.2–0.6 s |
| Worst penetration into the body | 0 cm |
| Cape bone to cloth point, worst | 0.9–1.8 cm (limit 2 cm) |
| Cloth CPU, mean | 0.75–0.88 ms per frame (single-frame spikes up to 2.9 ms) |
| Page errors | none |

**Margins are thin:**
- **Aim:** one run reached 1.77 cm against the 2 cm aim limit.
- **Penetration before the final push:** in the run just before the push was added, one turn frame left a point 2.15 cm inside the body, and that run FAILED. After the push was added, penetration was 0 in all four runs.

`test_cape_chain_unit.cjs` (Node, no browser) checks that the chain rests in place, trails back by roughly what air drag predicts, keeps its length, settles, and stays outside a collider: PASS.

**Earlier failures, now fixed:**
- **Skeleton:** the FBX loader duplicated the skeleton when the body and cape were separate meshes, so they are now one mesh.
- **Colours:** Tripo's material fed colour into alpha (a see-through body) and the exporter added a white emissive.
- **Frame lag:** the cloth stepped zero times on some frames.
- **Stops:** a hard stop could wrap the tail between his legs; the backstop prevents it.

## Not done / not tested

- **Not in the game.** Loading Loadout in a V02 build still needs:
  - the character loader path;
  - retargeting the clip bank at load;
  - the cape update after the animation mixer and before rendering;
  - a decision on his role (third hero, NPC or enemy).
- **NOT TESTED:**
  - jumps and falls, combat clips, wall runs and vaults;
  - Threadrail;
  - hero switching;
  - collisions with the city;
  - wind in the city.
  - The cape only collides with his own body.
- **Sprint swing:** sprinting swings the cape only a few degrees more than running, and one run was 1.5° less. The drag (2.4/s) can be raised if the user wants more flare.
- **Retarget quality:** checked by eye on idle, run and sprint only. Finger and foot contact quality not checked.
- **Look:** judged from headless screenshots; the user has not reviewed it in motion yet.
