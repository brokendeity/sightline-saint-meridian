# V02 Forspoken motion v17: ground starts, stops and turns

Candidate: `SIGHTLINE_SAINT_MERIDIAN_V02_FORSPOKEN_STRIDES.html`. It is built from the v16 Forspoken motion candidate by `scripts/vertical-v02/build_forspoken_strides_candidate.py`, which adds 4 inverse-verified hooks. Ground physics is unchanged; the clips only dress Backspool's existing acceleration, braking and reversal. The default checkpoint and older builds are unchanged.

## What changed

Roles are built by `scripts/build_backspool_forspoken_v17_roles.py` from the retargets already committed in `assets/backspool/source-movement`. Nothing new was extracted. They are listed in `assets/backspool/traversal-forspoken-v17-roles.json`, and each role is marked `replaceable`.

| Role | Source clip | Window | Used when |
|---|---|---|---|
| `moveStart` | `ntl_move_begin_gear3_f000a` | 0–0.6 s ×1.2 | Moving off after 0.3 s without input |
| `moveStartFast` | `ntl_move_begin_gear4_f000a` | 0–0.6 s ×1.2 | The same start with sprint held |
| `moveStartTurn` | `ntl_move_begin_gear3_l180a` | 0–0.75 s ×1.25 | Starting more than 137° away from facing |
| `moveStop` | `ntl_move_stop_gear3_f000a` | 0–1.25 s ×1.3 | Releasing input above 6 m/s |
| `moveStopFast` | `ntl_move_stop_gear4_f000a` | 0–1.2 s ×1.3 | Releasing input above 11 m/s |
| `moveStopWalk` | `ntl_move_stop_gear2_f000a` | 0–1.4 s ×1.3 | Releasing input between 3.5 and 6 m/s |
| `moveTurn` | `ntl_move_veer_gear3_l180a` | 0–0.8 s ×1.2 | Input opposing travel by more than 137° above 3.5 m/s |
| `moveTurnFast` | `ntl_move_veer_gear4_l180a` | 0–0.75 s ×1.2 | The same reversal above 11 m/s |

Each window was chosen from the source root speed: starts end at the first full stride, and stops end once the root is at rest.

### How it works

- **Turns carry baked root yaw.** Retargeting drops the source root, and that is where Forspoken stores a turn's 180° rotation. The builder bakes that root yaw back into the hips, relative to the final heading. When a turn starts, facing snaps to the new heading and the clip shows the spin. Turns cut in with no crossfade, because blending two poses 180° apart produces a sideways frame.
- **Triggers read the previous frame.** Backspool stops dead when input is released, swings its velocity round on a reversal, and turns the body before animation runs. So stops, turns and turn-starts all read the previous frame's speed, heading and yaw.
- **When a stride gives way:**
  - A stop gives way after 0.12 s if input returns.
  - A start or turn gives way when input is released.
  - Landings, flow actions, combat actions, aiming, traversal poses and ladders all take priority.

## Evidence

- **Stride test** (`test_forspoken_strides.cjs`): keyboard input on the open plaza selects each start, stop and turn role and then hands back to the run loop or idle. A stop cancels when movement resumes. No page errors.
- **Regressions on entry `ad49d966`** (`evidence/forspoken-strides-checks/`) all PASS:
  - 13 friendly wall-contact scenarios
  - the graded landing test (output in `evidence/forspoken-strides-landing/`)
  - three city loops
  - six station approaches
  - the 12 retained encounter/replay/discovery cases (`evidence/forspoken-strides-gameplay/`)
- **Contact sheets** (in the probe, not committed): the turn-start pivots from facing the camera to running away; the stop brakes over steps into a stand.

## Limits

- **`moveStopWalk` is only reachable with analog input:** Backspool's keyboard run is already 6.6 m/s.
- **Only left-turn source clips exist** for the gear 3 and 4 veers and the gear 3 turn-start, so every 180° turn spins the same way.
- **90° veers are not added:** the existing yaw damping handles them.
- **Clip windows were chosen by visual review**, not by comparison with matched Forspoken footage.
- **Release:** these clips are derived from Forspoken and must be replaced before any public release (handoff §12).
- **Untested input:** nothing has been tested on a physical controller or touchscreen.
