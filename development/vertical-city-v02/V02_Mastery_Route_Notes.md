# Mastery route and district roundtrip — implemented graybox

The current entry is `SIGHTLINE_SAINT_MERIDIAN_V02_GRAYBOX.html?capture=backspool`. This is a circulation milestone; it does not complete the full V02 brief. Current pass claims must match the entry/manifest hashes in `V02_Traversal_Validation.json`.

## Physical route

From the Y84 west gallery, enter the launch courtyard. Approach the south-facing service-room wall near[64,84,301.2]. Flow into the face and use Jump for a wall boost. Each roof is a real supported surface; four short climbs reachY96,108,120 and128. Their south faces are atZ300/292/284/276. The roof link joins the upper west gallery atX55/Z276.

Follow the upper gallery to the observation deck. Place two real precision cartridges on its floor near[64,128,424] and the upper exit deck near[64,128,400]. Back up along the supported run-up toZ440. Flow towardA, catch the rail and Pop shortly beforeB. Redirect onto the large Y118 maintenance roof, then make the bounded drops toY108 and the station atY100. The common objective is[66.5,100,376].

The longer run-up provides enough actual incoming momentum to clear the upper exit deck. No movement/rail/jump/Drive limit was widened. A short run-up is recoverable: the player returns to the supported upper deck, then continues through the lower terraces. The test confirms that intermediate recovery actually occurs, rather than assuming it from floor bounds.

The ordinary descent needs no Drive release. An optional brake variant consumes one eligible impulse collected from a real landing before the final8m drop. Merely having five horizontal running impulses does not make an arbitrary early fall brake compatible. No synthetic resources are created to bypass that rule.

## Proven scopes

- `V02_Mastery_Full_Zero.json`: complete ground-to-station input route, starting with zero impulses; four wall boosts, supported mantles, physical A/B construction, catch, Pop and118→108→100m descent. No Drive release or damage.
- `V02_Mastery_Full_Banked_Brake.json`: same complete route, starting with five impulses obtained through normal running before timing, plus one confirmed brake during the lower drop. No damage.
- `V02_Mastery_Pilot_Zero_ShortCatch.json`: one labelled Y84 start fixture, short physical catch, actual upper-deck recovery and complete lower descent. This is not another full ground approach.
- `V02_Public_Roundtrip_Validation.json`: one ground start, stairsA→C→D, upper crossing, stairsB down through every layer, and original ground-road return. No jumps, power releases, position assignments after start, damage or airborne frames.
- `V02_Impact_Ownership_Validation.json`: actual high gravity drop onto a new roof retains normal damage/debris/decals without attempting to carve a grouped immutable GLB owner. A separately labelled direct test still carves original building0 and updates its parts/integrity. This does not replace full destruction gameplay regression.

Input routes use DOM key events and standard simulated controller axes. Camera inspection happens after a route; camera aim during traversal uses normal look axes. There are no actor/camera/rail mutations after each initial fixture. Keyboard/controller/touch cast regression remains separate from physical hardware playtesting.

## Reproduced failures and corrections

1. A28m direct station drop called `carveBuilding` on a V02 owner without an individual mesh, causing an exception. The candidate now respects `nonDestructible` ownership in the mutation path; collision, injury and effects remain active. Failure: `evidence/fixed-defects/vertical-impact-owner-before.trace.json.gz`.
2. After fixing the exception, the direct drop still caused3.22 trauma. Early braking from a bank of horizontal impulses was incompatible. The architecture now supplies Y118/Y108 recovery roofs rather than increasing power or reducing damage thresholds. Failures: `mastery-direct-drop-hard-landing.trace.json.gz` and `mastery-incompatible-brake.trace.json.gz` in the same folder.
3. Public station egress crossed a0.65m gap left by the stairwell approach opening, producing eight unsupported frames. A visible side connection atX64..73/Z376..379 closes this gap without covering the actual final flight atX58.75..63.25. The complete public roundtrip now requires zero unsupported frames. Failure: `station-exit-gap-before.trace.json.gz`.

## Reproduce

Serve the repository at8766, then:

```sh
FULL_ROUTE=1 node scripts/vertical-v02/test_mastery_route.cjs
FULL_ROUTE=1 BANKED_START=1 USE_BRAKE=1 node scripts/vertical-v02/test_mastery_route.cjs
SHORT_CATCH=1 node scripts/vertical-v02/test_mastery_route.cjs
node scripts/vertical-v02/test_public_roundtrip.cjs
node scripts/vertical-v02/test_impact_ownership.cjs
```

A local wall-only fixture (`WALL_ONLY=1`) proves only its four ascents. It cannot certify a station approach. Timings count fixed60Hz input frames, including precision slow-motion, and exclude preparatory bank collection.

## Remaining full-objective work

Three functional encounters and four discoverable POIs are not implemented yet. Guardrails, navigation cues, actual graph-junction/admission alignment, fresh physical rail transfers, missed anchors/no-Pop cases, wider recovery and camera/contact review remain gameplay-acceptance work. Detailed architecture must follow those essential gates. Full train/traffic sweeps, living-world refinement, matched Blender/game visuals, sustained60s performance and retained mission/combat/destruction regressions remain required. Earlier game builds and snapshot refs remain protected.
