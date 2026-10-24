# Current game snapshot — 2026-10-24

- Branch: `snapshots/2026-10-24-current-game-v02-baseline`
- Tag: `snapshot-2026-10-24-current-game-v02-baseline`
- Starting commit: `bedf90c63aeb6b57d08fa302320bd27b31a2106d`
- Playable entry: `SIGHTLINE_BACKSPOOL_WHIP_THROW.html?capture=backspool&vaultcourse=1`
- Train inspector: `VERTICAL_TRAIN_INSPECTOR.html`
- Playable HTML SHA-256: `fac92161657cb93c8500d6afbc2900748b7cadfc015c019eeddf0366cdf070e4`

The game retains Threadrail/whip/cartridge, Afterstep, imported city assets, vertical megacity and the first Hi3D train carriage. This is a development snapshot, not a completed V02 release. V02 contains the authoritative live-world export, blueprint reconciliation, clearance findings and preliminary movement measurements. Known measurement limitations are recorded in the V02 README. Full route acceptance and detailed V02 construction remain pending.

Runtime assets, optimized train GLBs and game source are versioned. The raw Hi3D export and local Blender authoring source remain excluded as previously documented; they are not required to play. Transient screenshots and local scratch output are not part of this snapshot. Existing snapshots remain available through their original branches and tags.

To restore independently:

```sh
git clone --branch snapshots/2026-10-24-current-game-v02-baseline https://github.com/brokendeity/sightline-saint-meridian.git sightline-current
cd sightline-current
python3 -m http.server 8766 --bind 127.0.0.1
```

Open `http://127.0.0.1:8766/SIGHTLINE_BACKSPOOL_WHIP_THROW.html?capture=backspool&vaultcourse=1`.

Verification evidence is in `docs/snapshots/2026-10-24-startup-check.json`. It checks game/hero/city/roads/train readiness, console exceptions, HTTP failures and whether startup-loaded local files are tracked. It does not certify every gameplay flow.
