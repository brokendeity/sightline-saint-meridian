# Asset Store clips are not in this branch

This branch is the game as of local commit `6f488278` (Loadout Interface P10C), published as one commit on top of
`a0620ef`. The converted clip data of the licensed Unity Asset Store pack "Runner Action Animation Pack v1.7.2" is
left out on purpose. These files exist only in the local working copy:

- `assets/loadout/runner/loadout_runner_clips.json.gz`
- `assets/loadout/runner/full/runner_full_index.json`
- `assets/loadout/runner/full/runner_full_P1.bin.gz` … `runner_full_P6.bin.gz`

What this means for a checkout of this branch:

- Builds from `…V02_LOADOUT_RUNNER.html` onward ask for those files. Checked on the P10C build with the eight files
  answered as "not found" (real keys, 2026-11-12): the game starts and Sightline runs normally; choosing Loadout in the
  Hero tab does not complete ("Loadout runner asset unavailable"), so Loadout, his Runner Action animations and his
  weapon clips are not playable from this branch alone. Other builds and Backspool were NOT TESTED in this state.
- Backspool, Sightline, the city and the missions do not use these files.
- To get the full game, copy the eight files above into the same paths from the local working copy.

Kept in the branch: the role mapping (`assets/loadout/runner/loadout_runner_roles.json`), the conversion records
(clip names, durations, checksums) and the converter scripts. They hold no animation curves.
