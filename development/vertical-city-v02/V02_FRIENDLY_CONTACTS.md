# V02 friendly contact reliability candidate

Status: experimental; not the default and not release accepted. Latest build identity is in `V02_Friendly_Contacts_Build.json`; existing published civilian checkpoint and all original architecture remain unchanged.

## Reproduced failures

- Fixed incident resident could be crossed to a .010m centre gap; original street pedestrian to .017539m.
- Adding live physical capsules exposed a mutual market circulation deadlock. At180 native seconds, three visitors remained at19.78/14.91/10.02m travel. Exact blocker probe identifies circulating resident1 at .7314m from the nearest visitor, with two followers queued behind it.
- Portrait native composition cast exact friendly mesh hits toward Hips, RightHand and RightFoot at fixed resident contact. Physical clearance alone did not fix readability.
- An exactly axial airborne fall onto a civilian stopped at y26.187 in AIR after five seconds instead of reaching the market floor at y24.42.

## Candidate changes

A separate spatially filtered friendly capsule channel covers the existing45friendly actors. It merges earliest contacts into native free/flight/grounded actor sweeps, preserves static responses, prevents friendly impacts from damaging buildings and keeps civilians out of vault/attachment geometry. Original road walkers wait for hero occupancy without consuming their route progress; actual source mesh soles track native road support.

A new visitor module retains existing routes and dwell state. Scenic visitors step aside on checked supported geometry for mission residents, then rejoin circulation. No NPC route resets or teleports are used to clear queues. The published visitor module remains unchanged.

A request-only camera planner proposes bounded shoulder/height offsets before the existing director blend/static collision pass. The exploration look target follows the peek so the hero does not move beneath the vitals panel. Exact six-bone/mesh rays, HUD overlap and normal manual orbit are tested at desktop/portrait/landscape. Body framing remains orientation/FOV only; its measured positionDelta remains0.

For exactly centred top contacts with no useful horizontal tangent, the physical response supplies bounded separation velocity toward a nearby supported and static-clear floor. Native gravity and swept movement perform the descent. Humans are not registered as standable roofs. Nearby ledges/crowd configurations still need broader coverage.

## Evidence and limits

- Rejected0310 source/evidence closure: `evidence/friendly-contact-regression-0310/manifest.json` (128files).
- Supported visitor candidate8c68 passed180native seconds with all11visitors/36aircraft, all39scenic feet, room destinations and pause/hero-yield/resume. Market visitors each120m+/28+arrivals.
- Dense ee037 world test passed180seconds with minimum peer/resident centre distances .68449m/1.19152m. Subsequent frozen candidate must rerun this and includes every-frame speed bounds.
- Exact original camera failure: `evidence/friendly-camera-baseline/V02_Friendly_Camera.json`.
- Camera composition ee037 passed all3aspect ratios and manual orbit; actual screenshots reviewed. Original/native/keyboard/touch tests also passed the first frozen b117 run. Broader suite stopped on the first top-fall test assertion.
- First top-fall assertion mistakenly rejected the original ground impact. The full trace confirms zero trauma and grounded recovery. That rejected test/source is retained at `evidence/friendly-top-first-assertion/`; corrected acceptance permits impact only at the native floor landing.
- Authoritative next complete suite result: `V02_Friendly_Contacts_Checks.json`. A FAIL or RUNNING result is not promotion approval.

Legal destruction/navigation continuity, original courier completion, combined performance stress, final art and physical hardware checks remain open. This checkpoint does not certify full NPC physics, all camera situations or full V02 completion. Older GitHub refs and default build are preserved.

## Further current evidence

Current b117 frozen run passes every-frame180-second scenic clearance: peer minimum .68449048m, resident minimum1.19152246m, maximum visitor step .02666667m (1.6m/s at60Hz). Four centred/off-centre top-contact falls now land supported with100health; native floor impact remains active.

A separate legal-input test fired Sightline's rail at original imported building59: damage0→1, parts36→41, navigation2→3, maximum observed street-walker displacement .02229452m/frame, native pause freeze, debris0after expiry. No damage-count/collider/target/velocity writes after the initial supported hero/camera fixture. This is one breach; invalidatedEdges remained0, so the latent invalid-edge reassignment path and full collapse remain unproven.

Visual review rejected two immediate wall-resize captures as black. A separate13-case rerun waits for actual aspect/viewport synchronization and advances2native ticks before capture; both aspect ratios render correctly, with framebuffer nonblack checks and actual screenshot review. This fixes the test capture ordering, not the game runtime. Original evidence remains intact.

Original courier investigation has begun using only native reset, UI hero switch and standard controller aim. The first recovery ring is occluded from the central reset despite precise angular alignment; no teleport or forced target was used. This does not yet prove an impossible route or a V02 regression. Next investigate actual airborne approach/alternative lines and compare the parent build before proposing any mission/layout change. Full courier completion is still unverified.

## Encounter route admission fix — 3 November 2026 (Claude Code)

The previous frozen run failed at `retained-gameplay / pursuit-intercept` with `PREFLIGHT SEGMENT 1`. A probe showed that station commuter `visitor 0` stood on the runner's authored path at (73, 100, 382). The static city check passed (`safeStaticGroundMove`), but the live friendly-body check (`safeGroundMove`) failed, so the pursuit refused to start. Discovery route guidance used the same live check and could reject public routes whenever a pedestrian was standing on them.

Fix: two new modules, loaded only by this candidate. The published modules used by older builds are unchanged.

- `scripts/game_v02_friendly_pursuit.js`: route preflight checks city geometry only. If a person blocks the runner but the city geometry is clear, the runner yields for up to 1.5 s and then passes. This never counts toward the 3 s `ROUTE OBSTRUCTED` failure.
- `scripts/game_v02_friendly_discovery.js`: route guidance validation checks city geometry only.
- `build_friendly_contacts_candidate.py` now swaps those two script tags. The rebuilt entry (`a8ffd650…`) differs from the previous candidate only in those tags. The previous HTML, builder, build record, check record and failing log are kept in `evidence/friendly-contacts-pre-encounter-fix/`.

Result: the full frozen suite `run_friendly_contacts_checks.py` **PASS**es on `a8ffd650`. That is all 15 jobs, including 12/12 retained encounter/replay/discovery cases, six station approaches, three loops, short-catch recovery, keyboard, touch and camera checks.

Original courier probe: this is not a Friendly Contacts regression. The contact journal shows that an enemy projectile hit Sightline mid-rail (`updateWorld` → `loseControl`) with no successful brace. That follows the existing rule that crashes drop carried civilians. The bot then landed about 3 m below the Disruption roof with no recovery logic. Friendly bodies were not involved, and mission difficulty is unchanged.

Still open: legal destruction/navigation reset breadth, a full natural courier run, combined performance (p95), final art, and testing on physical hardware.
