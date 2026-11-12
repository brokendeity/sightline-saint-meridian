# Kinsmoke cape: arms clipping the cape while running (2026-11-10)

**Measured with** `review/arm_clip_measure.cjs`:
- Real W input, Mvm_Dash at 8.6 m/s.
- 20 frames sampled, with every second cape vertex (35,453 points) skinned on the CPU.
- A point counts as clipping when it is inside a capsule: upper arm or forearm (rig radius), or hand (wrist to middle fingertip, 1.3 × 0.03 H).

| Build | Mean points inside arms per frame | Worst frame | Max depth |
|---|---|---|---|
| v7 | 181.7 | 446 | 7.3 cm |
| v8 particle clearance only (armMargin 0.10) | 59.1 | 210 | 6.5 cm |
| v8 (particle clearance 0.06 + GPU push) | **0** | **0** | **0** |

**Why particles alone could not fix it:** the mesh is skinned to only 9 × 7 broad chains. The cape over the shoulder blades follows the centre-back chain, and the arms swing far behind him in Mvm_Dash.

**The v8 fix:** the vertex shader pushes every skinned cape vertex, and the cape's ink outline, out of six arm capsules each frame. Each capsule's radius is the rig radius plus 1.5 cm.

**Caveat:** the v8 row is measured with a CPU copy of that push (`kinsmokeHero.armPush().pushLocal`, using the same uniforms). The GPU result is checked by eye only, in `cape-v8/*.png`.

**NOT TESTED:**
- the full regression;
- the cape's shadow, which still uses the unpushed shape.
