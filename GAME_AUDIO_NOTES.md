# Game audio

Current toon build includes self-contained synthesized Web Audio: low city rumble, filtered rain ambience, distant tonal ambience, footsteps, takeoff/jump, rail ignition, velocity-reactive wind/engine, impacts/crashes, building collapse, vector strikes/dodges and drone alerts/shots. Master compressor and14-voice cap limit peaks/resources. Sound ON/OFF and volume controls are at upper left; preferences persist. Audio fades out on pause/focus loss. Click Enter Sandbox or sound control to satisfy browser audio activation requirements; controller-only starts may need one click.

Verified AudioContext reaches running after a genuine start-button click, events trigger, flight gain responds to velocity, mute state persists and pause gain fades to zero.20/20 gameplay regressions passed. These checks validate audio wiring; no claim of a professionally mixed recording or subjective listening review. One invalid manually staged TRANSIT fixture caused null-target errors during testing; rerun used a valid rail target and did not reproduce them.

Audio is procedurally synthesized rather than imported copyrighted recordings. No API key, network audio fetch or external sound dependency required.
