# V02 encounter spaces — graybox design, not gameplay acceptance

The current live city, collision export and measured 0.55 m body radius are authoritative. All coordinates below are game metres, Y up, with architectural deck-top heights; the player origin is 0.42 m higher. Original missions, building ownership and road graphs remain unchanged. These three encounters require candidate integration and input tests before they count as functional.

## Transit interchange pursuit

Station concourse: X58–75, Z359–393, deck Y100. Keep the concourse west of the moving guideway; a pedestrian destination is not permission to intersect a train envelope. Public stair C enters from the Y84 west gallery. Upper stair D reaches the north access deck. The two-part momentum approach arrives from a supported Y92 landing; the upper Pop approach arrives from above. Distinct elevations and approach directions must remain visible from the concourse.

Use a bounded pursuit runner with a deterministic supported route, trigger through an in-world interaction, and allow interception by the existing player/combatant distance rules. A new pursuit encounter adapter is required; scenic traffic is not a pursuit actor. The runner must stay on this route, slow for corners, pause with the game and retain its state during hero switching. The player can intercept at the entrance, cut across the gallery, or follow from above. The destination is a clear 8×8 m exit region, not an arbitrary timer.

Acceptance: start/finish/retry through real interaction input; both chase and interception; missed upper landing recovery; no runner/train overlap; route state survives pause and unrelated hero objectives.

## Multi-level service-yard combat

Main deck: X58–93, Z312–340, Y52 (35×28 m). This supplies more than five current 2.9 m opponent strike reaches across each dimension. Preserve a 6 m circulation lane on both gallery approaches. Use an 8×8 m clear center and three opponent spawn areas separated by at least 6.5 m. Proposed spawns: [65,52,320], [85,52,320], [75,52,334]. Positions remain proposals until actual support, full body and camera clearance pass.

Add a Y54 flank shelf reached by a native jump, two separated cover props no taller than 0.9 m, and an overhead maintenance route at Y58 with an accessible end. No cover is placed across the main Flow line. Keep rear and side escapes to both public galleries, with wall/Threadrail opportunities on solid, visibly corresponding support geometry.

Reuse the existing combatant registry, health, action/hit rules and encounter lifecycle. Do not duplicate damage logic or create invulnerable sparring opponents. Height-aware spawn validation is required. Death, end, restart and hero switch must use the established cleanup path. The encounter must be defeated through legal attacks and show an actual completion outcome.

Acceptance: three active opponents, natural win/defeat/retry, cross-level melee/Echo/guard interactions, camera room at the deck corners, collision-checked knockback and both escape routes. Layout changes must follow measured combat space needs rather than shrinking attacks to fit.

## Suspended-market civilian rescue

Main deck: X58–93, Z353–379, Y24 (35×26 m). Two gallery entrances and the lower return crossing serve this public destination. Reserve a 6 m through-route; merchant stalls sit off it. Two civilians circulate on supported loops and through marked entrances. An incident occurs beside the central stall while the extraction point stays on the same deck, reachable without rails, Drive or courier flight.

Reuse civilian appearance and the existing rescue/follow primitives where valid. Backspool needs a local rescue objective adapter; the hero's rail-dependent courier objective must not be repurposed. The incident has a visible start, safe approach, escorted return and unambiguous extraction condition. Ambient walkers and incident actors have separate ownership and lifecycle.

Acceptance: interact, reach civilian, escort to extraction through normal movement; recover from leaving the deck; pause/retry/hero switch; no floating civilians or blocked stalls; keep existing rooftop rescues intact.

## Common ownership and feedback

Each encounter owns its actors, local objective, trigger, reset region and completion award. Structural decks are district-owned, never encounter-disposed. Existing global Halo consequences and per-hero mission progress remain authoritative. Candidate diagnostics must report actual states and failures. This document designs the spaces; it does not claim the adapters or encounters are implemented.
