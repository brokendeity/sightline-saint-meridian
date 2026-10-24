# Current game snapshot — 25 October 2026

Branch: `snapshots/2026-10-25-current-game`

Tag: `snapshot-2026-10-25-current-game`

This is a preservation checkpoint of the current working game, not a completed V02 release. Existing branches, tags, and main remain unchanged.

## Play

Run from the repository root:

```sh
python3 -m http.server 8766 --bind 127.0.0.1
```

- Current playable megacity/Threadrail/Afterstep game: `http://127.0.0.1:8766/SIGHTLINE_BACKSPOOL_WHIP_THROW.html?capture=backspool&vaultcourse=1`
- Hi3D train inspection: `http://127.0.0.1:8766/VERTICAL_TRAIN_INSPECTOR.html`
- Newest experimental Blender graybox: `http://127.0.0.1:8766/SIGHTLINE_SAINT_MERIDIAN_V02_GRAYBOX.html?capture=backspool` — select **Enter V02 district**.

Keep the asset directories beside the HTML files. The snapshot contains the runtime models, source scripts, the editable V02 Blender master and curated development evidence. Source game archives/executables, local reverse-engineering databases, unrelated scratch captures and raw large Hi3D authoring exports are excluded; runtime exports are included.

## Development status

The V02 candidate includes connected elevated routes, three station approaches, service-yard combat, and a suspended-market rescue with power isolation and a supported civilian escort. The latest resident idle/sole correction is included.

At snapshot preparation, the current regression runner reported **12 passing jobs** and status **FAILED**. Failed job: `mastery-brake`. The failed regression and unfinished suite are retained as known issues; uploading this backup does not certify the candidate. Existing acceptance reports retain their own build hashes and may describe earlier revisions. This upload makes no full-city, final visual quality, sustained performance, or physical-device acceptance claim.

Transit pursuit, further route/recovery/camera validation, detailed architecture and the remaining V02 acceptance gates are unfinished. The original playable WHIP build and train inspector remain available alongside this candidate.

## Restore

Use this branch or annotated tag in a separate checkout. Every prior snapshot remains available in GitHub history.
