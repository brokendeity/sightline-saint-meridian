# Kinsmoke cape v10: arms and the cape, second pass (2026-11-10)

**What the user saw on v9:** "almost good, it's still showing a little bit".

**Changes since v9:**
- **Cloth** (`game_kinsmoke_cape_cloth_v8.js`): arm and hand capsules now lift the cloth particles over the arm, away from the torso axis, instead of pushing them radially under it.
- **Shader** (`game_v02_kinsmoke_hero_v10.js`):
  - 3 cm of air between arm and cape (v9: 1.5 cm);
  - a feather beside each arm, 8 cm wide or 1.3 × the lift, whichever is larger;
  - the lift fades out over the last 15 cm before the torso axis, which is inside his body.
  - With these, the push has no hard edge. v9 had a cliff where the lift dropped from 30 cm to 0 within 4 mm, which stretched cape triangles across the forearms.

**Measured** with `review/arm_clip_measure_v10.cjs`:
- Setup: real W input, 20 frames, every second cape vertex.
- The count is cape points or triangles inside an arm, or between an arm and the torso up to 35 cm deep, excluding points inside his body.

| | Cape points left after the push (mean per frame) | Triangles across an arm (mean / worst) | Mostly |
|---|---|---|---|
| v9 | 0 (counted including points inside his body) | 31 / 84 | hands, forearms, a few upper arms |
| v10 | 8.8 | 28 / 93 | hands and forearms only; upper arms 0 |

**Verdict:** a small measured improvement, and slightly better by eye in a few frames (`v9_vs_v10_running_closeups.png`). It is not fully solved.

**What remains:** where his hands pass close to his hips, the lift direction (away from the torso axis) turns sharply. The cape then still forms steep tents over the hands.

**Next options:**
- a denser cape mesh;
- smaller hand capsules;
- a hand-specific lift direction (straight back from the torso).

**NOT TESTED:**
- the full regression;
- the cape's shadow, which uses the unpushed shape.
