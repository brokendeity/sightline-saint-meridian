# Kinsmoke cape v9: the cape drapes over the arms (2026-11-10)

**What the user saw on v8:** "still the elbows going through the cape when he's running".

**Cause:**
- v8 pushed each cape vertex straight out from the arm's centre line.
- Where the cape lay between an arm and his back, that pushed the cape toward his body, under the arm. Mvm_Dash swings the arms far behind him, so this happens often.
- The silver elbow band then showed through the back of the cape (see `v8_running_from_behind.png`).
- v8's push radii were also smaller than the real arm mesh. Measured while running with `review/arm_profile_measure.cjs`: upper arm 8.3 cm, forearm 7.7 cm, hand 12 cm.

**v9 fix:**
- Every cape vertex in an arm's path goes to the arm's outer side, away from the torso axis (Hips to Neck).
- That covers vertices inside the capsule, and vertices between the arm and the torso within the arm's width, up to 35 cm deep.
- Two passes, for the elbow where the upper-arm and forearm zones overlap.
- The push radii are the measured ones plus 1.5 cm of air.
- It runs in the cape's toon shader and in its outline shader.

**Measured** with `review/arm_clip_measure_v9.cjs`:
- Setup: real W input, 30 frames, 35,453 sampled cape points.
- The count is cape points inside an arm, or between an arm and his body.

| | Mean per frame | Worst frame |
|---|---|---|
| Before the push | 748.9 | 2,490 |
| After the v9 push | 0 | 0 |

**Caveat:** the count uses a CPU copy of the shader push, with the same uniforms. The shader is checked by compile (both programs contain it) and by eye (`v9_running_from_behind.png`).

**NOT TESTED:**
- the full regression;
- the cape's shadow, which uses the unpushed shape.
