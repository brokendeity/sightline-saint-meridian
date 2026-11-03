# V02 Forspoken motion v19: running take-off

Candidate: `SIGHTLINE_SAINT_MERIDIAN_V02_FORSPOKEN_AIR.html`. It is built from the v18 vaults candidate by `scripts/vertical-v02/build_forspoken_air_candidate.py`, which adds 3 inverse-verified hooks. Jump physics is unchanged. The default checkpoint and older builds are unchanged.

## What changed

Every Backspool jump used to take off with `air_jump_begin_inplace_n000a`, even at a full run. `scripts/build_backspool_forspoken_v19_roles.py` admits `air_jump_begin_move_n000a` (0.1–2.0 s) as `jumpMove` from the committed retarget in `assets/backspool/source-movement`. The role is listed in `assets/backspool/traversal-forspoken-v19-roles.json` and marked `replaceable`.

- **Which clip:** a jump taken above 3 m/s ground speed rises with `jumpMove`; slower jumps keep `jump`.
- **Latching:** the choice is made when `jumpAge` restarts, so steering in the air never swaps clips mid-rise.
- **Unchanged:** the fall and landing clips. Sprint jumps still become flow flips.

## Considered and left out

- **`air_fall_high_begin` / `air_fall_high_loop` (long falls):** both tip the body into a horizontal skydive pose. Blending out of that into the upright heavy landing would pop, so long falls keep the ordinary fall clip.
- **`pkr000_mgc_move_stop_base_f000a` (dash stop):** the flow dash never starts while Threadrail owns Shift, which is always the case in V02, so a dash stop would never play.

## Evidence

- **Air test** (`test_forspoken_air.cjs`), using keyboard input on the open plaza, with no page errors:
  - A standing jump rises with `jump`.
  - A running jump rises with `jumpMove`, even when the input is reversed mid-air, and then falls with `fall`.
  - A following standing jump re-latches `jump`.
- **Regressions on entry `6eb79ff4`** (`evidence/forspoken-air-checks/`) all PASS:
  - 13 friendly wall-contact scenarios
  - the graded landing test (`evidence/forspoken-air-landing/`)
  - three city loops
  - six station approaches
  - the 12 retained encounter/replay/discovery cases (`evidence/forspoken-air-gameplay/`)
  - the v17 stride test
  - the v18 vault test

## Limits

- **Clip windows were chosen by visual review.**
- **Release:** these clips are derived from Forspoken and must be replaced before any public release (handoff §12).
- **Untested input:** nothing has been tested on a physical controller or touchscreen.
