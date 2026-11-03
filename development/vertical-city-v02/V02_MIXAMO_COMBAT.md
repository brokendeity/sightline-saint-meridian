# V02 Mixamo combat: RT moves rebuilt, with 8-hit chains

Candidate: `SIGHTLINE_SAINT_MERIDIAN_V02_MIXAMO_COMBAT.html`, built from the v20 crouch candidate by `scripts/vertical-v02/build_mixamo_combat_candidate.py`. That builder adds one inverse-verified hook, which loads `assets/backspool/action-v3-manifest.json` and `action-v3-gameplay.json.gz` instead of the action-v2 pair. Combat logic is unchanged. The default checkpoint and older builds are unchanged.

## Why

Every RT move used to be a 0.3–0.75 s slice of a Naruto Storm Connections character combo, retargeted across 12 characters (action-v2). Out of context, those slices read as odd half-gestures rather than strikes. They are also third-party game data that would have had to be replaced anyway.

## What changed

`scripts/build_backspool_action_v3_mixamo.py` rebuilds all 36 moves, plus the stance, guard and dodge poses, from 25 of Backspool's own licensed Mixamo clips (`animations-web.json.gz`).

**Copied unchanged from action-v2:**
- move ids and kinds
- chains and the next/finisher links
- damage, push, reactions and launch flags
- support mode and movement policy

**Re-derived from the new clip, using the same rules as action-v2:**
- the clip
- the contact time and socket
- the chain, cancel and combo windows
- the support contact window

| Style | RT chain (light 1–4) | Left / right | Heavy / launcher | Air light / finisher | Counter 1 / 2 |
|---|---|---|---|---|---|
| Flow | Jab, lead hook, MMA kick, Martelo high kick | Roundhouse / side kick | Chapa-Giratória / flip kick | Flying kick / butterfly kick | Back side kick / Martelo do Chão |
| Impact | Jab, lead hook, body hook, uppercut | Back side kick / MMA kick | Heavy uppercut / jumping knee | Flying kick / knee-and-punch smash | Body hook / uppercut |
| Counter | Martelo, Chapa-Giratória, Armada, Martelo do Chão | Leg sweep / back side kick | Armada / inverted double kick | Flying kick / butterfly kick | Jab / side kick |

### Hits 5–8 from the NSUNSC Motion Library

Each style's RT chain now runs to eight hits. Light 4 links to light 5, and light 8 ends the chain as a finisher. The finisher carries heavy damage (+12), 2.3 push and a heavy reaction.

Hits 5–8 come from the Backspool-rig retargets in the NSUNSC Motion Library (`assets/motion-library/<family>.json.gz`, the version served by `NSUNSC_MOTION_LIBRARY.html`). Their reach is measured by `measure_action_v3_storm_reach.cjs`.

| Style | Light 5 | Light 6 | Light 7 | Light 8 (finisher) |
|---|---|---|---|---|
| Flow | Kakashi lunge punch (`2kkscmb02`) | Kakashi front kick (`2kkscmb10`) | Itachi side kick (`2itccmb08`) | Sasuke high kick (`2sskcmb10`) |
| Impact | Tsunade punch (`2tndcmb03`) | Sakura kick (`2skrcmb01`) | Lee high kick (`2roccmb05`) | Tsunade side kick (`2tndcmb15`) |
| Counter | Hinata palm thrust (`2hntcmb03`) | Hinata palm strike (`2hntcmb09`) | Neji palm (`2nejcmb02`) | Hinata sweep (`2hntcmb04`) |

- **Chosen by review:** every pick was rendered around its strike. Aerial flips (`2kkscmb06`, `2tndcmb07`, `2tndcmb11`) were rejected, because strike grounding would lay a horizontal body on the floor.
- **Placeholders:** these 12 moves are third-party NSUNSC data. Their provenance says so, and they must be replaced before any public release.

**Defence poses:**
- **Stance:** Action Idle To Fight Idle, or standing idle to fight stance.
- **Guard:** guard-up side step.
- **Dodge:** Standing Dodge Backward.
- **Reactions:** already native Mixamo, so they are reused unchanged.

### How each move is cut

- **Window:** each move is a window around its strike, played inside a duration of 0.38–0.85 s at ×1.0–1.46. The builder keeps the action-v2 limit of ×0.85–1.5.
- **Contact time:** `measure_action_v3_reach.cjs` records hand and foot positions on the native rig. The contact is the frame where the striking limb comes closest to a practice-sized target 1.1 m ahead, using the game's hurt column (0.6–1.6 m high). Furthest forward reach was tried first, and it is wrong for spinning kicks: the Chapa-Giratória crosses the target line well before it reaches furthest forward, and missed. The builder now asserts that every move gets within the game's hit radius.
- **Hips:** horizontal hips are centred on the actor in both the builder and the measurement. Some Mixamo clips start well off the origin: the heavy uppercut at z +1.40 m and Chapa-Giratória at x +1.65 m. Holding their first key drew the body 1.4–1.8 m from the capsule, which is why the uppercut showed up buried in the target. Centring fixed that.
- **Clip ids** keep the `action-v2-` prefix, so the runtime's strike foot grounding still applies.

## Evidence

**Combat test** (`test_mixamo_combat.cjs`):
- **Setup:** open plaza, the public practice button, and the style chosen through the style menu's change handler.
- **Input:** a virtual pad's R3 lock, RT and D-pad up, plus keyboard W to walk into range.
- **Results (PASS):** in each of the three styles, eight RT presses play all eight light segments in order, and every strike connects. After walking back into range, the heavy plays its segment and connects. No action-v2 STORM slice plays, and there are no page errors.
- **Pressing rhythm:** RT is pressed once the previous strike lands, as a player would. A press made during the wind-up of a long move expires before the combo window opens.
- **Practice-target shots:** these are held during the chain (labelled setup), because the targets' 1.5 s shots stagger a long chain. Shots and stagger are covered by the encounter suites.

**Regressions on entry `403e809f`** with the final 8-hit pack (`evidence/mixamo-combat-checks/`, run muted) all PASS:
- 13 friendly wall-contact scenarios
- the graded landing test (`evidence/mixamo-combat-landing/`)
- three city loops
- six station approaches
- the 12 retained encounter/replay/discovery cases (`evidence/mixamo-combat-gameplay/`)
- the stride, vault, air, crouch and 8-hit combat tests

**Comparison:** before the change, the same harness on the crouch build also landed four guarded contacts. The new chain takes about 13 frames longer, because each strike now has a real wind-up.

**Impact screenshots:** `evidence/mixamo-combat/<style>-<move>.png`.

## Limits

- **Feel:** lights take 0.38–0.66 s instead of 0.30–0.46 s, so the chain is slightly slower. An 8-hit chain lasts about 3.5 s, long enough for the practice targets to interrupt it. Chain and cancel windows follow the action-v2 rules and have not been tuned by hand.
- **Not tested:**
  - directional, launcher, air and counter moves (only the light chain and heavy are exercised)
  - real enemies in encounters, beyond the retained gameplay suite
- **Visual review** covers only the impact frames.
- **Leftover third-party data:**
  - Hits 5–8 are NSUNSC-derived.
  - The action-v2 STORM-derived pack is still in the repository and is used by older builds.
  - The Forspoken traversal clips in this chain still need replacing before release (handoff §12).
- **Hardware:** nothing has been tested on a physical controller.
