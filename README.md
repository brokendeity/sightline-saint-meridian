# Sightline / Backspool — 21 October 2026 snapshot

Separate update: `snapshots/2026-10-21-pose-binding-v14`, tagged `snapshot-2026-10-21-pose-binding-v14`. Earlier branches and tags are preserved.

## Run

```sh
python3 -m http.server 8765
```

Open http://localhost:8765/SIGHTLINE_BACKSPOOL_TRAVERSAL_CANDIDATE.html?v=pose-binding-v14 for the current traversal candidate. The separate main game remains available as SIGHTLINE_SAINT_MERIDIAN_TOON.html. Keep all asset directories in place, including `characters ` (trailing space).

Includes current gameplay source, native motion preview assets, traversal modules and numerical controller/pose evidence. Full original Forspoken controller and IK are unfinished; the new pose kernels are not applied directly to the hero. See docs/traversal-v14/POSE_BINDING_V14.md for scope and validation (48 unit checks, 119 retained regressions and 248 sampled poses).

Rebuild the candidate with `python3 scripts/build_backspool_traversal_candidate.py`. Extraction scripts may require the external source archives and RE tools, which are not included. The runtime does not require those archives or executables. Original proprietary game executables, installation archives, Ghidra projects and the separate Naruto cinematic library are excluded.

## Roll back

Use a separate checkout: `git worktree add ../sightline-pre-rea snapshot-2026-10-15-pre-rea`. The original build is also retained as `archive/pre-roads-backspool-2026-10-14`. No existing branch or archive tag was replaced.

This private development snapshot contains supplied and recovered assets; their original ownership remains unchanged. Third-party notices remain in third-party/. File identities are recorded in SNAPSHOT_MANIFEST.json.
