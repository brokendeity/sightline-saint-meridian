# Backspool Threadrail + Afterstep candidate

Run `python3 scripts/build_backspool_threadrail_candidate.py`, serve this directory, and open `SIGHTLINE_BACKSPOOL_THREADRAIL_CANDIDATE.html?capture=backspool`. Main game, v15 rollback HTML and existing snapshot refs are preserved. Source motions/identity hashes remain in the role manifests. Travel, role selection, source contact admission and equipment controllers are authored Backspool behavior; full original Forspoken controller and IK verification remain false.

## Controls

| Action | Traversal controller preset | Keyboard / mouse |
|---|---|---|
| Toggle Flow sprint | Click L3; B outside combat | Shift or Ctrl, one tap |
| Jump / directional flip | A; move direction + Flow | Space |
| Light / heavy | RT / D-pad Up | LMB / Q |
| Guard / evade | LT / D-pad Down; B in combat | RMB / C |
| State / lock | D-pad Left/Right / R3 release | 1–3 / Alt |
| Threadrail | X tap; hold then release for precision anchors | R or K |
| Drive | RB | E |
| Drive mode wheel | Hold LB, left stick chooses | Hold Tab, click mode |
| Action Replay bank / Echo / Retrace / next | View + LB / RB / X / D-pad Up | G / H / J / N |
| Hero switch | L3 + LT + RT + R3 | Existing hero selector |

Classic retains the earlier combat/controller bindings. Its experimental launch/Skip/dash keys now request eligible Drive releases; they do not grant free magic boosts. Touch exposes Flow, Jump, Threadrail, Drive and modes alongside combat. Neutral input stops travel while the Flow toggle remains armed. Pause, focus/input reset, disconnect, defeat and hero changes clear latches. Releasing Shift no longer triggers a dash.

## Physical rules

Real supported foot plants, jumps, landing impacts, wall kicks, vault pushes, side steps and rebounds can supply the five-slot bank. Each impulse expires after eight simulation seconds. Drive modes consume compatible recorded vectors, with strain, timing and collision validation before spending. No banking from Drive/replay output. Ghoststep is a checked additional stride, not teleportation. Brake opposes travel without reversing it. DoubleStep's second timing beat is 320 ±60 ms.

Threadrail uses live scene-owned endpoints, checked spans and full actor sweeps. Limits: four segments/eight anchors, 6–100 m, 55° slope, 30 simulation seconds, 2 m attach reach, 3 m transfer reach and 28 m/s speed cap. Approaches take 120 ms, then inertia, gravity and friction determine travel. Compatible linked junctions use input and cosine speed loss; sharp or invalid exits detach with physical velocity. Small course anchor masts are attachment hardware, not separate crash volumes; the supporting platforms, wall and vault have actor collision. The visible cable is at sole support height, 42 cm below the actor's clearance reference.

The lower-back Temporal Exhaust consumes confirmed **applied** velocity changes. It does not move the character. Slivers, rings, threads and localized refraction are pooled (at most five effect draw calls). Original lower-back equipment and character proportions are unchanged. The rail sliding loop preserves Forspoken limb rotations; its pelvis curve is separately admitted for rail sole contact, not claimed as recovered Forspoken rail behavior.

Replay Route records one trace of up to four seconds/eight actions/120 samples. Reconnect within 1.35 m. Fresh impulses are reserved and spent by exact ID at executed actions; expiry is unchanged. Steering uses ordinary movement, never waypoint position writes. Manual input, obstruction, deviation, lifecycle changes and changed geometry interrupt it and release unused reservations.

## Try it

Use “Traversal course” to add four platforms, connected sloped rails, a wall and a vault in the plaza's south area. Existing buildings and missions stay fixed. Run before attaching: stationary flat/uphill rails supply no free launch energy. Tap R/X near a cable to attach; press Jump for a momentum-preserving slingshot. Hold R/X to set two physical surface anchors. Aim in the travel direction at linked junctions. Build a bank by moving before pressing E/RB; a rejected release preserves resources and explains why.

Required chain checklist: sprint → Drive → jump → wall kick → landing; sprint → automatic vault → Drive → roof jump; jump → rail attach → grind → Drive; grind → junction/transfer → slingshot; wall run → boost → rail → land; aerial evade → rebound → land; sprint → foot bank → rail → release; grind → combat → ordinary traversal.

## Validation

Evidence and limitations are recorded under `output/threadrail/`. New pure cores, source-contact admission and real-input browser flows complement the original 48 source/numeric checks and 119 retained Classic-control assertions. Source-data checks cannot establish original-game equivalence. Physical controller/touchscreen playtesting and matched Windows captures remain separate release checks. Performance evidence includes hashes and settings; do not infer a GPU guarantee from CPU/frame measurements.
