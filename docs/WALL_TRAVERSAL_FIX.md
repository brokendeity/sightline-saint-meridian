# Backspool wall traversal repair

Playable entrypoint: `SIGHTLINE_BACKSPOOL_VAULT_PLAYGROUND.html?capture=backspool&vaultcourse=1&v=wall-fix-v3` on port 8766. The accepted Threadrail V3, main game, traversal rollback and GitHub snapshots remain unchanged. The pre-fix playground is recoverable from local commit `50968c7`.

## Reproduced problems

The pre-fix browser run reproduced an incorrect entry pose, upward movement after releasing the stick, and repeated wall grabs after the short 1.6-second wall timeout. Imported facade projections also exposed an automatic retry loop after a collision stopped the climb. Full traces and captures are preserved under `output/wall-seamless/baseline*`.

## Changes

- Wall entry integrates tangential motion once per frame and eases only the remaining normal offset into the 0.62 m physical stand-off. Reported velocity matches the integrated movement.
- Wall entry and sustained movement share an advancing source pose clock. Lateral run/climb selection uses hysteresis, and facing turns smoothly.
- Releasing movement (with an 80 ms dead-zone grace), steering away, or toggling Flow off releases the wall. Neutral input cannot initiate a climb.
- Wall runs have one continuous 4.2-second budget. Boosts retain the budget. Edge exits, expired runs and obstructed paths cannot automatically grab the same plane again; move away or land and deliberately release/reapply movement to retry.
- The rooftop transition retains swept clearance and support checks. Blocked overhangs stop traversal safely rather than passing through geometry.
- Wall poses use their own contact policy, bypassing ordinary floor/landing attraction. A whole-hierarchy orientation correction prevents the recovered body pose rotating sideways. Sole/contact offsets are local visual adjustments and never move the physical actor.
- Short source loops receive exponential local rotation blending (18/s) across discontinuities; only pelvis translation is blended. Bone scales and limb offsets remain unchanged. The source assets and playback rate remain unchanged; no native Backspool fallback clips were added.
- Wall diagnostics now include elapsed wall time, regrab lock, contact plane and visual correction data.

These are authored integration repairs around recovered Forspoken motions. Original Forspoken controller/IK fidelity remains unverified.

## Evidence

- `node scripts/test_backspool_wall_seamless.cjs`: 13 scenarios, plus finite visible-pose, upright-contact and loop-seam assertions. Includes keyboard, simulated controller, a physical test wall, clear imported city facades, blocked imported facades, boosts, kick-off, owner changes, pause and supported rooftop/ground exits. Full traces are compressed; the JSON report is a compact index.
- `node scripts/test_backspool_vault_course.cjs`: all 16 checks still pass, including full-speed automatic flips, gentle-stick vaults and grounded exits.
- Advanced traversal unit tests: all six groups plus the water-to-tether case pass. Threadrail foundation ownership and entry-momentum checks pass.
- Existing eight physical Threadrail chain cases also pass against this playground, including wall boost to rail, combat handoff, tree rebound and supported landings. Reports are in `output/wall-seamless/chain-report*`.
- Visible endpoint displacement during the sampled sustained lateral run dropped from a measured 1.119 m seam spike before smoothing to 0.295 m per 60 Hz frame after smoothing. This is a local regression metric, not a comparison with original-game footage.
- Reviewed wall-run, boost, mantle, roof landing, city wall and portrait/landscape captures. The installed develop-web-game client also exercised active gameplay; no page errors occurred. Physical controller and touchscreen playtesting remain unverified.

Rebuild using `python3 scripts/build_backspool_vault_playground.py`. The builder verifies the immutable V3 base, then integrates the maintained wall controller/runtime and optional vault lane into the playground only.
