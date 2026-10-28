# V02 body framing candidate — district release incomplete

The separate `SIGHTLINE_SAINT_MERIDIAN_V02_BODY_FRAMING.html` derives from the immutable diffuse-lighting entry. Older game entries, the default candidate pointer, Blender masters, assets, physics, powers and missions are preserved. This work addresses the observed confined-room/stair camera crop; it does not establish full reference-quality architecture or release acceptance.

## Behavior and ownership

The existing camera director and collision solver retain camera-position ownership. A final composition pass uses 17 animated bone envelopes, a small actor-rotated support envelope while grounded, and the selected live combat target's hurt volume. It changes orientation and, when required, field of view up to 86 degrees. It does not reposition the camera, move the actor or write input yaw/pitch. Near-plane conflicts and exhausted framing remain visible in diagnostics.

Player pitch input takes ownership of the view. The most recent composition bias is held rather than continually solving the body back onto the screen. Precision aiming inherits that same visible composition, avoiding an entry snap. The native input curve and smoothing remain unchanged. Automatic composition resumes after the player returns near neutral pitch and stops pitching for 400 ms. Deliberately looking up/down can place the avatar outside the screen; the automatic fit guarantee does not apply while manual look owns the view. A candidate-only reset hook clears cached composition on respawn; inactive/different heroes and model changes also clear it. Sightline retains its existing camera.

Two cheap read-only getters expose precision ownership and the selected combat target; they avoid serializing large diagnostics in the frame loop. A third controlled integration change invokes the private composition reset at the start of `resetPlayer`. The builder independently reverses these changes and removes all appended adapters to recover the exact parent HTML.

The private non-touch layout places existing vitals above the lower playfield. In wide windows, compact combat feedback sits beside those vitals; narrow windows use the retained compact layout. Narrow native warnings move the same banner nodes into the existing context stack; IDs, text, input handlers and the simulation-clock opacity remain native. Wide windows restore the original banner parent. Touch uses the native move/look/button handlers. No gameplay resources or controls are removed.

## Reproduction and evidence

Run with the repository server on port 8766. `python3 scripts/vertical-v02/build_body_framing.py` rebuilds the candidate and its build manifest. Evidence reports bind their exact entry hash; historical intermediate reports do not certify a later build.

- `probe_body_framing.cjs`: six settled supported room fixtures; the parent crops feet/toes in the three rear-room views.
- `probe_body_camera_ownership.cjs`: native simulated right-stick pitch, real R precision entry/release and respawn. Current manual view delta matches the parent; entry/release snap must remain below the stated assertions.
- `test_body_touch_look.cjs`: actual CDP finger drags through the existing pointer-captured look pad at portrait/landscape sizes, compared against the parent. These are simulated touchscreen events, not physical-device certification.
- `test_body_movement.cjs`, repeated with `V02_BODY_DEVICE=touch`: nine ordinary-key room journeys, selected-target lock/attacks, per-frame bone checks and actual skinned boot vertices at 18 endpoints per layout. The touch-layout movement itself still uses keyboard controls.
- `test_body_stair_tour.cjs`: continuous ordinary-input public 24→128→24 m tour, three room visits and all 26 stair flights in both directions. Every frame checks head/hips/feet/toes; 52 additional mid-flight pose samples are retained.
- `test_body_orbits.cjs`: 56 settled native-stick orbits plus the existing controlled recovery drop; not arbitrary pitch/high-speed certification.
- `test_hud_candidate.cjs` with the body entry: 18 retained HUD/input/pause groups. `test_body_notices.cjs` exercises six warning identity/layout/expiry cases.
- The installed develop-web-game client runs unchanged through the Metal/readiness wrapper, with actual movement, screenshot, text state and console review.
- `test_service_replay.cjs`: normal recording/Echo release damages a real yard opponent, then two supported public escapes and End cleanup. It proves those interactions, not all replay/camera states.
- The current station-route runner exercises all three uninterrupted approaches with legal zero/full-bank starts, including actual physical cartridge casts/riding, wall ascents and landings.
- `benchmark_body_framing.cjs`: sequential parent/candidate 60-simulation-second fixed1280×800 native-RAF high-speed lower-loop workloads, asynchronous GPU timers and separate CPU measurements. Final combat/replay/destruction stress remains separate.

## Remaining acceptance

Full approved-reference visual quality remains **FAIL / incomplete**. Source bake noise, room-reflection parallax and broader architecture/material coherence remain open. A native replay screenshot exposed a wide-window vitals panel covering an extended arm during a hit reaction. The first coverage test reproduced 94 skinned avatar vertices beneath it. Moving the vitals also exposed a combat-status overlap in actual visual review; the status now sits beside the upper vitals. The final replay check measures both panels and finds no overlap at its five captured stages. This is bounded pose evidence, not a guarantee for every animation and camera angle.

Final mission, destruction, failure and sustained combined stress coverage remain open. Physical controller and touchscreen testing remain unperformed. This candidate has not replaced the default playable entry or any GitHub snapshot.

## Retained route-test failure

The old aiming driver stopped on the first angular-error crossing, waited eight frames without checking the camera again, then threw. In the body candidate, native smoothing coasted to 0.00524 radians of pitch error during that wait; the second station anchor attached about 20 cm lower and the Pop hit the platform edge. The failed source driver, complete physical trace and observational replay are retained. The revised driver requires both arrival and post-settle visible error below 0.0015 radians, using only the same standard controller axes and normal throw input. Game timing, power limits, surfaces and physics are unchanged. A first attempted strict driver incorrectly zeroed small corrections before applying them; that failed test is also retained.

The revised pilot reaches the station through actual casts/riding/Pop/landing. All six current route variants still need their own current-entry acceptance, rather than inheriting the old timings. The observed low-anchor failure also remains useful level-design evidence: wider landing tolerances and reachable recovery from that undershoot need separate physical trials and, where needed, Blender-authored recovery architecture. It is not erased by obtaining one successful well-aimed route.
