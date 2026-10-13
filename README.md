# Sightline — Saint Meridian

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
