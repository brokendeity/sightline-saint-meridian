# V02 Sightline melee and the burst rhythm

Candidate: `SIGHTLINE_SAINT_MERIDIAN_V02_SIGHTLINE_MELEE.html`. It is built from the Mixamo combat candidate by `scripts/vertical-v02/build_sightline_melee_candidate.py`, which applies 21 inverse-verified edits. Engine edits stay within the combat module text. The default checkpoint and older builds are unchanged.

The reference was a grounded street-fight clip (`【Girls Fight】Raichi vs Anne【Blender】.mp4`), used for rhythm only. Its pattern:
- high guards and circling at range;
- one fighter closes and throws a short burst of 2–4 strikes;
- the other covers, then counters;
- both reset distance;
- a knockdown ends it.

No choreography or assets were copied.

## Sightline can fight

Sightline now runs on the same combat engine as Backspool, rather than a new one, with his own move set (`street`):

| Input | Move |
|---|---|
| RT / LMB on the ground, **not aiming** | Four-hit burst: jab → lead hook → body hook → uppercut. A press during the uppercut does not extend it; a fresh press after the reset starts a new burst. |
| Stick left or right + RT | MMA kick / side kick |
| LB / Q (held) | High guard. It blocks strikes and cuts an enemy hit from 8 to 1 chip damage. His timed brace still works on the same button. |
| LT + RT | Unchanged: aims and commits a rail. No strike can start while he aims. |

- **Clips:** `scripts/build_sightline_street_combat.py` cuts the moves from the licensed Mixamo combat clips (`assets/sightline/action-street-*`) with the same window, contact and hip-centring rules as Backspool's v3 moves.
- **Hip height:** Sightline's FBX uses centimetre units, so hip height is rescaled at load, from his idle hips height over the source rest height.
- **Defence and reaction poses:**
  - stance: standing idle to fight stance (high guard)
  - guard: guard-up side step
  - slip: Standing Dodge Left
  - reactions: hit, uppercut-to-face and body-blow

### What stays Backspool-only

- **Engine calls:** flow, powers recording, jump acrobatics, combat evade and the three-style cycle are gated by `isBackspool()` inside the engine.
- **Lessons:** replay lessons start only for Backspool. Plain **Sparring** now runs for either hero.
- **Sightline's own moves:** his jump, dodge, brace, scan and rails are untouched.

## The burst rhythm (opponents)

Sparring opponents (`backspoolEncounters`, which V02's Backspool street contracts also use) now play the exchange:

1. **Burst counting:** the opponent counts the hero's connected hits. Keep pressing on rhythm and the whole chain lands: Sightline's 4, or Backspool's 8.
2. **Cover:** once the hero stops for 0.55 s after three or more hits, the opponent covers (guards) for 0.3 s. Blocked hits do not interrupt the cover; a guard-breaking heavy does.
3. **Counter:** a fast counter with a 0.45 s windup, against the normal 0.8 s attack. Guard it (LB), dodge it, or take 8.
4. **Reset:** the opponent steps back for 0.5 s to reopen the distance, then re-engages with its normal approach and attacks.

## Evidence

- **Sightline test** (`test_sightline_melee.cjs`), with a virtual pad through the game's own poll:
  - The burst plays jab → hook → body hook → uppercut, and all four strikes connect.
  - A press during the uppercut does not extend the burst; a fresh press restarts it.
  - Stick + RT kicks.
  - LB raises the guard and RT cannot strike through it.
  - LT puts Sightline in rail aim, and RT does not strike while aiming.
  - No page errors.
- **Rhythm test** (`test_burst_rhythm.cjs`): Sparring started from the HUD button, with one opponent, Sightline placed in range, and a virtual pad.
  - Opponent phases run: approach → stagger → recover → **cover → windup → reset** → ready.
  - The reset opens the distance.
  - The unguarded counter lands for 8 or more; with LB held, the counter takes chip damage only.
  - No page errors.

- **Regressions on entry `314f92a2`** (`evidence/sightline-melee-checks/`, run muted) all PASS:
  - 13 friendly wall-contact scenarios
  - the graded landing test (`evidence/sightline-melee-landing/`)
  - three city loops
  - six station approaches
  - the 12 retained encounter/replay/discovery cases (`evidence/sightline-melee-gameplay/`)
  - the stride, vault, air and crouch tests
  - Backspool's 8-hit combat test
  - the Sightline and rhythm tests

## Limits

- **Sightline has no heavy yet.** D-pad up is his Rail Read and Y is his scan, so neither is free for it. His move set has a heavy and a launcher, but no input reaches them.
- **No knockdown finisher yet.** The reaction clips are cut, but a knocked-down state needs opponents that can fall; they are still cylinders.
- **The opponents are the original cylinder dummies.** The rhythm is mechanical: phases, timing and damage. Their bodies do not animate it.
- **Untested opponents:** the rhythm is only in the sparring/encounter AI. Practice targets and ranged drones and guards are unchanged.
- **Feel numbers are first guesses**, not hand-tuned: the 0.55 s hesitation, 0.3 s cover, 0.45 s counter and 0.5 s reset.
- **Combat HUD:** it still says "BACKSPOOL · COMBAT" and shows the style menu while Sightline is active.
- **Hardware:** nothing has been tested on a physical controller.
