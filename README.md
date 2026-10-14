# Preserved game snapshot — before REA-inspired changes

This branch saves the current playable browser game as of 15 October 2026. The earlier build remains on `main` at `9a800a7` and is tagged `archive/pre-roads-backspool-2026-10-14`. This updated build is separately tagged `snapshot-2026-10-15-pre-rea`.

Included since the previous GitHub build:

- Connected roads, sidewalks, crossings, signals and pedestrian routes.
- Sightline / Backspool character selection and all 121 supplied Backspool animation clips in a searchable preview menu.
- L3 + LT + RT + R3 hero switching, once per complete press/release.
- Backspool's own powers remain undefined; Sightline powers are disabled for him.
- Truck models removed. No REA-inspired gameplay changes or Naruto assets are included.

See [ROAD_INFRASTRUCTURE_NOTES.md](ROAD_INFRASTRUCTURE_NOTES.md) and [BACKSPOOL_CHARACTER_NOTES.md](BACKSPOOL_CHARACTER_NOTES.md). Latest baseline validation passed 225 checks, plus 11 hero-switch and power-separation checks. Historical animation checks involving Backspool's former shared powers are superseded by the hero-separation checks.

## Run this version

```sh
python3 -m http.server 8765
```

Open `http://localhost:8765/SIGHTLINE_SAINT_MERIDIAN_TOON.html`. Keep `assets`, `buildings` and `characters ` (trailing space) beside the HTML. Core browser libraries and Sightline animations are embedded. Backspool's runtime model, texture and compressed animation library are included; original FBX animation source folders are not required to play.

## Rebuild the current HTML

```sh
python3 scripts/apply_backspool_switch.py
```

The tracked `.pre-backspool-switch.html` is the truck-free road-enabled base for this patch. Its rebuilt output was verified byte-for-byte against the saved game. `.pre-road-infrastructure.html` preserves the prior base used by the road patcher. See `SNAPSHOT_MANIFEST.json` for runtime file hashes.

## Return to the older version

Use a separate checkout to preserve both versions:

```sh
git worktree add ../sightline-original archive/pre-roads-backspool-2026-10-14
```

Or check out the old archive tag in a clean checkout. To recover this newer snapshot, check out `snapshot-2026-10-15-pre-rea`. Do not force-push or move these archive tags.

---

# Sightline — Saint Meridian · 2026-10-15 snapshot

Current anime-noir toon browser game, including the ten Courier priorities, city atmosphere, destructible buildings, white patrol drones, and procedural audio.

## Run locally

Requires Python 3 and a modern WebGL browser. From this directory:

```sh
python3 -m http.server 8765
```

Open http://localhost:8765/SIGHTLINE_SAINT_MERIDIAN_TOON.html . Click the game to enable audio, then use its on-screen controls. Keyboard/mouse and standard gamepads are supported. Serve the folder over HTTP rather than opening the HTML directly.

See [COURIER_FEATURES.md](COURIER_FEATURES.md) for the ten priorities and controls, plus the other notes for audio, destruction and rendering details. Keep the buildings and characters folders alongside the HTML; the player animations and core browser libraries are embedded in the HTML.

## Assets and ownership

This private snapshot includes user-supplied statue, drone and character assets. Their original ownership and license terms continue to apply. No additional license or redistribution permission is granted by this repository.

## Validation

The source build passed 64 automated checks for this snapshot: 24 Courier checks, 20 base game checks, 16 route/presentation checks and four continuation/input checks. Physical controller rumble and broad cross-browser performance remain unverified.

## Stylized rendering additions

Spherical night clouds, reactive puddles, subtle edge outlines and adaptive resolution are included. See [STYLIZED_COMPONENTS_NOTES.md](STYLIZED_COMPONENTS_NOTES.md) for implementation and validation. Portions are adapted from [Christian Ortiz (Cortiz)'s stylized-components](https://github.com/cortiz2894/stylized-components); its MIT notice is included in [third-party/stylized-components/LICENSE](third-party/stylized-components/LICENSE). The updated build passed 80 automated checks.

## Blender city buildings

Eight reference-based architectural families now replace all 310 city buildings, fitted to their original footprints and heights. Nearby buildings use detailed models; distant ones use shared simplified geometry. Compound surfaces support balcony and stepped-roof contact, and impacts carve destructible colored geometry without changing neighboring instances. See [BUILDING_IMPORT_NOTES.md](BUILDING_IMPORT_NOTES.md). The updated build passed 101 gameplay/asset integration checks and glTF validation for all eight runtime models.

## Comprehensive polish

The current build adds clearer facade and street lighting, mounted neighborhood business signs, improved surface shading, and a depth-precision fix for diagonal window artifacts. Traversal now has buffered/coyote jumps; drone/guard shots have visible windups and bounded projectile density; Q/LB adds a timed shot guard while retaining rail pressure venting. A compact HUD and numbered route markers replace the default diagnostics panel (F3). Camera floor/wall clipping and duplicate simulation updates are fixed. See [COMPREHENSIVE_POLISH_NOTES.md](COMPREHENSIVE_POLISH_NOTES.md) for behavior and validation.
