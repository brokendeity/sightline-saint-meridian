# V02 landmarks and discovery — prototype evidence and remaining gates

Three architectural landmarks remain graybox proposals: the elevated transit interchange at [66.5,100,376], suspended commercial complex at [75.5,24,366], and upper observation structure at [72,128,420]. They have distinct functional destinations but their final silhouettes, facade materials, lighting and readability from both reference bookmarks remain unaccepted. Detailed authoring follows the essential gameplay gates.

Four useful discovery locations are now implemented in the Blender master and browser candidate:

| Location | Supported interaction position | Function |
|---|---|---|
| Market assembly | [64,24,356] | Reports the rescue power state and guides to the actual rescue access. |
| Maintenance access | [86,52,314.8] | Guides along the supported service stair to the 58.4m overhead flank. |
| Observation deck | [72,128,420] | Supplies district orientation and a supported public return to street level. |
| Transit information | [73,100,382] | Reports actual train presence/through-service limits and guides to pursuit access. |

The street directory at [55,0,210] is an entrance information point, separate from the four discovery records. All five kiosks are individually editable Blender objects, with dark steel bodies and restrained cyan trim. Runtime labels are depth-tested; the kiosk geometry blocks reading through its back. Reading requires proximity, correct supported elevation and line of sight. Discovery grants no health, power or score.

The market board was moved outside the landing region. Maintenance moved clear of its flank route. The station board uses the supported X73 corridor outside the actual stairwell. The observation route now turns on the west public spine instead of cutting diagonally across the necessary upper stair opening. An initial tour exposed seven unsupported frames; that failed trace is retained in fixed-defects evidence.

Public guidance consumes the same directed three-dimensional design graph, restricted to player walk/run/stair edges without resource or encounter conditions. It incrementally checks actual collision and elevated support before publishing a route. Pending and active guides cancel or invalidate when the native navigation revision changes. No player movement is automated by the guide.

`V02_Discovery_Tour.json` records a complete normal-input visit to all four locations, useful local routes and a street return. `V02_Discovery_Lifecycle.json` covers below-floor rejection, front/back line of sight, pause, hero switching, simulated controller and CDP touch controls, and pending/active world-revision invalidation. `V02_Discovery_Authoring.json` binds kiosk geometry and graph provenance to the saved master. Current hash-bound reports, rather than this plan, determine whether a test run passed.

These are functional discovery prototypes, not finished architectural landmarks. High-speed cue readability, wider camera review, guardrails, final pedestrian presentation, approved-reference appearance and physical-device playtesting remain open. Functional names do not introduce new canon history. Preserve the midnight-blue/charcoal, cyan and warm amber direction; graybox cubes are not final architecture.
