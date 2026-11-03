# V02 air test stability (`test_forspoken_air.cjs`)

Status, 2026-11-03: **cause identified, test fixed, PASS 12/12 unseeded on `NO_HALO_TRUCKS`**, plus 8/8 seeded and 5/5 on the uncommitted `MENU_STYLE` candidate. No game build was changed. Evidence is in `evidence/air-test-stability/summary.json`.

## Cause
The flake was not wall-clock time and not async loading. It came from a halo patrol drone shooting Backspool during the jump.

- `configurePatrol()` sets every drone's `patrolPhase` and `patrolRadius` with `Math.random()`, not the seeded `rand()`. Each page load starts the drones at a different point in their patrol. At the ready point, the seeded `seed` and every `e.t` were identical across runs, but `patrolPhase` differed.
- On some loads, one of the eight near-ring drones (patrol centres 90 m from the origin) sweeps its searchlight over the test plaza at (30, 50). It switches to CHASE, hovers 18 m above Backspool and fires.
- The projectile reaches `backspoolCombat.receiveProjectile`. The hit reaction locks movement and plays `action-v2-flow-reaction`, which owns the pose ahead of Flow. This produces each observed failure:
  - (a) A rising frame with `sourcePlayback.role === null`, because combat owns the pose and Flow writes nothing.
  - (b) The running jump latches `jump`, because the latch is first taken after the hit, once steering has slowed him below 3 m/s.
  - A rise with no Flow role at all.
- **Proof that wall-clock time is not involved:**
  - With `Math.random` replaced by a fixed seed (test-only init script), seed 4 fails 3 of 3 runs. Every run has the same drone-hit frames (27, 85), unthrottled and at 4× CPU throttle.
  - Seed 1 passes under 4× throttle.
  - Unseeded runs of the old test logic in this session:
    - unthrottled: 0 of 19 failed;
    - at 4× throttle: 3 of 11 failed.

    For a fixed seed, throttling never changed the outcome, so this split is attributed to chance. It is NOT TESTED beyond that.
- **The earlier leads don't hold up:**
  - "Settling for 8 s fixes it" (3 of 3) is within chance at that pass rate.
  - "Backdrop blur makes it worse" did not reproduce: 4 of 4 passed with a blur overlay present during load.
  - Frames ticked before `startGame` never advance the drones, because the world is paused.

## Could a player hit this?
Only as intended combat: a chasing drone can shoot Backspool mid-jump, and the hit reaction overrides the take-off clip. That is not a take-off bug, so no game change was made.

The `Math.random` patrol phases do make drone pressure on a given spot vary from load to load. Switching them to the seeded `rand()` would shift every later seeded draw, which changes the city, missions and drones. That would be a separate, deliberate change.

## Fix: test setup only (labelled)
In `home()`, every drone is held in PATROL with a long alert cooldown, every courier guard is stunned, and in-flight projectiles are cleared before the actor is placed. The test also asserts `hostileShots === 0` across all measurements, so any future hostile fire fails loudly and is not mistaken for a take-off regression. Inputs are unchanged: real keyboard input, and the same plaza placement.

`test_forspoken_air.cjs` changed in place (previous SHA-256 is recorded in the summary). Older evidence that pins the earlier test hash still matches that version in git history.

## Independent recheck
The parent session reran the fixed test one browser at a time: 5 of 5 on `MENU_STYLE` and 3 of 3 on `NO_HALO_TRUCKS` (`evidence/air-test-stability/independent-recheck/`).
