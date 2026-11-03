# V02 Forspoken motion v16 — wall kick-offs and graded landings

Candidate: `SIGHTLINE_SAINT_MERIDIAN_V02_FORSPOKEN_MOTION.html`, built from the Friendly Contacts checkpoint by `scripts/vertical-v02/build_forspoken_motion_candidate.py`. It adds 7 inverse-verified hooks. The default checkpoint and older builds are unchanged.

## What changed

Roles come from the already decoded local movement tracks via `scripts/build_backspool_forspoken_v16_roles.py`. Nothing new was extracted from game files. The roles are listed in `assets/backspool/traversal-forspoken-v16-roles.json`, and each is marked `replaceable`.

| Role | Source clip | Used when |
|---|---|---|
| `wallKick` | `pkr000_ntl_wallkick_base_b000a`, 0–0.65 s (backflip only) | Jumping off a wall climb or ledge |
| `wallFlip` | `pkr000_ntl_wall_rondart_base_f000a`, 0–0.9 s (cartwheel only) | Jumping off mid wall-run |
| `landSoft` | `pkr000_ntl_land_hgt1_base_f000a` | Standing landing under 1 m |
| `landSoftMove` | `pkr000_ntl_land_hgt1_move_f000a` | Moving landing under 1 m |
| `landHeavy` | `air_land_hgt3_inplace_n000a` | Standing landing from 4.5–8.5 m (knee-down) |
| `landMoveFast` | `pkr000_mgc_land_hgt3_move_f000a` | Moving landing over 4.5 m |

Landings are graded by the real fall height from the airborne peak, not by impact speed. Sprint flips peak near 3.9 m and keep the normal landing; standing jumps drop about 2 m. The existing `land`, `landMove`, `landBack` and `landHard` (over 8.5 m) roles are kept.

## Clips reviewed and rejected

- **`wall_rondart` as a wall-run loop:** it is a cartwheel off the wall followed by a ground run. Forspoken has no sideways wall-run loop, so wall-running keeps Codex's climb pose.
- **`pkr000_ntl_land_hgt4_base` for heavy landings:** it is a forward roll, which reads wrong with the hips held in place. `air_land_hgt3_inplace` replaces it.
- **`air_land_hgt4_inplace`:** it is still rising when the 1.6 s window ends.

## Evidence

- **Clip selection** (headless probes, normal tick):
  - Drops of 0.5 / 2 / 5 / 9 m play landSoft / land / landHeavy / landHard.
  - Moving drops play landSoftMove and landMove.
  - Wall-run jump-off plays wallFlip; wall-climb jump-off plays wallKick.
  - No page errors.
- **Retarget parity:** rebuilding an existing v15 clip through the new builder matches the committed file to 1e-16.
- **Landing test copy:** `test_forspoken_motion_landing_contacts.cjs` copies `test_friendly_landing_contacts.cjs` and only widens the role assertions to accept graded roles. It passes, covering flips, sprint jump, rolls and roll-to-strike floor contact. The original test is unchanged.

- **Regressions on the final entry `8a271543`** (`evidence/forspoken-motion-checks-final/`) all PASS:
  - 13 friendly wall-contact scenarios
  - the graded landing test copy
  - three city loops
  - six station approaches
  - the 12 retained encounter/replay/discovery cases (`evidence/forspoken-motion-gameplay/`)

  The wall test writes into the Friendly Contacts evidence folder, so its output was copied into this run's folder and the committed files were restored.

## Limits

- `landMoveFast` is not reachable with current physics. The base game halts horizontal motion on drops big enough to enter its landing state, so those play `landHeavy`.
- Clip timing windows were chosen by visual review of contact sheets, not by comparison with matched Forspoken footage.
- These clips are derived from Forspoken and must be replaced before any public release (handoff §12).
- Nothing has been tested on a physical controller or touchscreen.
