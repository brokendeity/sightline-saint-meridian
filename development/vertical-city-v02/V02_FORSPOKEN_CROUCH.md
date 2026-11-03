# V02 Forspoken motion v20: crouch transitions

Candidate: `SIGHTLINE_SAINT_MERIDIAN_V02_FORSPOKEN_CROUCH.html`, built from the v19 air candidate by `scripts/vertical-v02/build_forspoken_crouch_candidate.py`. The builder applies 5 inverse-verified hooks. Posture rules and crouch speeds are unchanged; the default checkpoint and older builds are unchanged.

## What changed

Before this build, crouching snapped straight between the standing and crouch loops. `scripts/build_backspool_forspoken_v20_roles.py` admits four transition roles from the committed retargets in `assets/backspool/source-movement`. The roles are listed in `assets/backspool/traversal-forspoken-v20-roles.json`, and each is marked `replaceable`.

| Role | Source clip | Window | Plays when | Gives way when |
|---|---|---|---|---|
| `crouchDown` | `cuh_shift_from_neutral_n000a` | 0–0.9 s ×1.2 | Crouch turns on | Moving |
| `crouchUp` | Same window, **played in reverse** | 0.9 s ×1.2 | Crouch turns off | Moving after 0.15 s |
| `crouchStart` | `cuh_move_begin_gear1_f000a` | 0–0.7 s | Moving off while crouched | Input released |
| `crouchStop` | `cuh_move_stop_gear1_f000a` | 0–1.1 s ×1.1 | Stopping while crouched | Moving again |

- **`crouchUp` is an authored derivative.** Forspoken has no crouch-to-stand clip, so the builder reverses the crouch-down window. Every source key is kept, and the clip is marked `authoredDerivative`. A check confirms that its first pose equals the end of crouch-down, and its last pose equals the start.
- **Priority:** aiming, Retrace, combat actions, stagger and leaving the ground all cancel a transition.

## How crouch is reached in V02

Crouch is only reachable in some control setups:

- **Traversal controls (the V02 default):** crouch has no binding. View is the powers modifier and keyboard Ctrl toggles sprint.
- **Classic controls:** the controller View button toggles crouch. Choose Classic from the "Backspool control preset" menu.
- **Touch:** the Crouch button in the expanded combat HUD.

Making crouch reachable in Traversal controls would change the controls, so it is not part of this build.

## Evidence

- **Crouch test** (`test_forspoken_crouch.cjs`):
  - **Setup:** the test chooses Classic controls through the preset menu's own change handler, then uses a virtual pad's View button through the game's normal poll, plus keyboard W.
  - **Transitions:** down, start, stop and up each play and then hand back to the crouch loops or to standing.
  - **Cancel and errors:** standing up gives way to running, and there are no page errors.
- **Regressions on entry `5218ed7a`** (`evidence/forspoken-crouch-checks/`) all PASS:
  - 13 friendly wall-contact scenarios
  - the graded landing test (`evidence/forspoken-crouch-landing/`)
  - three city loops
  - six station approaches
  - the 12 retained encounter/replay/discovery cases (`evidence/forspoken-crouch-gameplay/`)
  - the stride, vault and air tests

## Limits

- **Reachability:** none of this is reachable from the default Traversal controls or the keyboard.
- **Standing up** is a reversed clip, not a real Forspoken motion.
- **Crouch turns** (`cuh_move_turn_*`) and crouch veers are not added.
- **Clip windows** were chosen by visual review.
- **Release:** these clips are derived from Forspoken and must be replaced before any public release (handoff §12).
- **Hardware:** nothing has been tested on a physical controller or touchscreen.
