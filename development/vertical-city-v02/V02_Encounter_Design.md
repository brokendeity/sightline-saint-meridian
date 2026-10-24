# V02 encounter spaces — service prototype and remaining designs

The current live city, collision export and measured 0.55 m body radius are authoritative. All coordinates below are game metres, Y up, with architectural deck-top heights; the player origin is 0.42 m higher. Original missions, building ownership and road graphs remain unchanged. Service-yard combat has a playable prototype; pursuit and rescue are still designs. Local service tests are not full district acceptance.

## Transit interchange pursuit

Station concourse: X58–75, Z359–393, deck Y100. Keep the concourse west of the moving guideway; a pedestrian destination is not permission to intersect a train envelope. Public stair C enters from the Y84 west gallery. Upper stair D reaches the north access deck. The two-part momentum approach arrives from a supported Y92 landing; the upper Pop approach arrives from above. Distinct elevations and approach directions must remain visible from the concourse.

Use a bounded pursuit runner with a deterministic supported route, trigger through an in-world interaction, and allow interception by the existing player/combatant distance rules. A new pursuit encounter adapter is required; scenic traffic is not a pursuit actor. The runner must stay on this route, slow for corners, pause with the game and retain its state during hero switching. The player can intercept at the entrance, cut across the gallery, or follow from above. The destination is a clear 8×8 m exit region, not an arbitrary timer.

Acceptance: start/finish/retry through real interaction input; both chase and interception; missed upper landing recovery; no runner/train overlap; route state survives pause and unrelated hero objectives.

## Multi-level service-yard combat

Main deck: X58–93, Z312–340, Y52 (35×28 m). This supplies more than five current 2.9 m opponent strike reaches across each dimension. Preserve a 6 m circulation lane on both gallery approaches. Use an 8×8 m clear center and three opponent spawn areas separated by at least 6.5 m. Proposed spawns: [65,52,320], [85,52,320], [75,52,334]. Positions remain proposals until actual support, full body and camera clearance pass.

Implemented graybox: a Y55.2 combat mezzanine, Y58.4 walkable overhead maintenance route and real 3.2 m stair flights, with <=0.18 m risers. Both elevated decks occupy X80–91, Z317–335, with actual stair openings and side return landings. A solid Y54 jump plinth occupies X87–92, Z336–340. Two separated low cover blocks remain0.9m high. A clear8×8m fighting region is X58–66/Z323.6–331.6. Both public gallery approaches remain open. Visible half-metre posts atX82/90.5,Z334.5 provide physical anchor surfaces; full cast/transfer and camera acceptance remain separate.

Runtime metadata and Blender encounter empties come from the same graph record: access[62,52,337]; lower spawns[65,52,330] and[73,52,327]; mezzanine spawn[85.5,55.2,329]. Earlier proposed spawn coordinates above are superseded by these measured supported placements. Opponents use existing sparring prototype meshes and legal shared combat damage, reactions, guard, leash and one-attacker coordination. No new fake hit/damage system or enemy teleport is introduced. The upper patrol holds its elevation; this does not claim stair-climbing enemy navigation.

At the access ring, press **I**, the existing controller **Y interaction**, or **Start encounter**. Combat, evasion, replay, Threadrail and hero-switch bindings remain intact. **J remains Retrace**. The local HUD owns its objective only while applicable, and existing street contracts retain their own usable controls. Restart preflights every fixed spawn before replacement, clears locks/owned replay through existing cleanup, and does not restore condition. Victory awards350once per attempt. Pause freezes the clock and actors. Defeat, End, respawn and actual hero switching have explicit local lifecycle handling.

Reuse the existing combatant registry, health, action/hit rules and encounter lifecycle. Do not duplicate damage logic or create invulnerable sparring opponents. Height-aware spawn validation is required. Death, end, restart and hero switch must use the established cleanup path. The encounter must be defeated through legal attacks and show an actual completion outcome.

Acceptance: three active opponents, natural win/defeat/retry, cross-level melee/Echo/guard interactions, camera room at the deck corners, collision-checked knockback and both escape routes. Layout changes must follow measured combat space needs rather than shrinking attacks to fit.

Current evidence: `V02_Service_Encounter.json` and `V02_Service_Lifecycle.json`, their compressed traces and actual browser captures. Legal heavy attacks defeat both lower opponents, then normal stair movement flanks and defeats the mezzanine opponent. Mezzanine/overhead access is grounded. Atomic invalid placement, pause, controller start, touch start, restart, hero selector and natural incoming-hit defeat are tested. Broader Echo, knockback/escape, camera, navigation-cue and physical-device playtests remain open; do not promote the whole encounter quality gate from these local cases alone.

## Suspended-market civilian rescue

Main deck: X58–93, Z353–379, Y24 (35×26 m). Two gallery entrances and the lower return crossing serve this public destination. Reserve a 6 m through-route; merchant stalls sit off it. Two civilians circulate on supported loops and through marked entrances. An incident occurs beside the central stall while the extraction point stays on the same deck, reachable without rails, Drive or courier flight.

Reuse civilian appearance and the existing rescue/follow primitives where valid. Backspool needs a local rescue objective adapter; the hero's rail-dependent courier objective must not be repurposed. The incident has a visible start, safe approach, escorted return and unambiguous extraction condition. Ambient walkers and incident actors have separate ownership and lifecycle.

Acceptance: interact, reach civilian, escort to extraction through normal movement; recover from leaving the deck; pause/retry/hero switch; no floating civilians or blocked stalls; keep existing rooftop rescues intact.

## Common ownership and feedback

Each encounter owns its actors, local objective, trigger, reset region and completion award. Structural decks are district-owned, never encounter-disposed. Existing global Halo consequences and per-hero mission progress remain authoritative. Candidate diagnostics must report actual states and failures. This document designs the spaces; it does not claim the adapters or encounters are implemented.
