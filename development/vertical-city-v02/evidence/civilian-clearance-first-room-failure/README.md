# Rejected first visitor candidate

Full-game b73f7854, visitor module b1911132. The current room suite failed desktop84 with eleven frames below the retained .87m body-clearance threshold (minimum .61973665m). The exact source/build/generator/tests/failed trace and screenshots are retained here. Stock, waiting-state and180native-second checks had passed; those narrower passes did not establish all interactions.

A separate read-only reproduction adds actual visitor positions and nearby solid boxes: during the return-to-gallery turn, camera avoidance took the visitor west into the later running line. At frame322 the player was accelerating along+Z, while the velocity-only forecast still underestimated the forthcoming run. No nearby solid blocked the alternatives. Camera avoidance also competed with body separation.

The revised candidate reads permitted movement intent once per simulation substep, including the existing native walking/run/sprint target speeds, before acceleration finishes; body-path avoidance takes priority over close-view avoidance. The original movement inputs, hero physics, route coordinates and .87m acceptance assertion are unchanged. A new current run must pass independently. This rejected snapshot is evidence, not a usable rollback recommendation.
