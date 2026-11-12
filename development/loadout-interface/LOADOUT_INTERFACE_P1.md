# LOADOUT Interface — Phase 1 (2026-11-11)

The design brief comes from two documents the user wrote for Loadout: "Integrating his complete Interface into third-person gameplay" and "Interface UI Design". This file records the first slice of it that is actually playable.

- Build: `SIGHTLINE_SAINT_MERIDIAN_V02_LOADOUT_INTERFACE_P1.html`
- Branch: `feature/loadout-interface`, cut from `feature/kinsmoke` at `70e1e2fa`.

## Implemented and proven with real input (`scripts/characters/loadout/test_loadout_interface_p1.cjs`, 22/22 PASS)

All of these run as Loadout. They live in a new module, `scripts/game_v02_loadout_interface.js`, which owns Loadout's own power state.

| Key | System | Behaviour (tested) |
|---|---|---|
| T | Encounter | Spawns a Halo sparring construct, a humanoid that learns the player's habits, and a trapped worker. |
| RMB hold | Analyze | Cyan brackets and a tag with HP, phase and the attacks Analyze has observed. While the construct winds up, cyan Ghost Builds show each attack it could make, posed at that attack's impact frame, with a confidence %. The confidence comes from the observed habits (Laplace estimate), is narrowed by the high/low windup cue, and the wrong guesses fade once the construct commits. Analyze drains MP. Only attacks observed while analyzing are recorded. It never freezes the enemy and never counters automatically. |
| V hold | Guard | Blocks 70% of the damage. A guarded overhead injures the right forearm (`RightForearm → BluntImpact → StructuralStress`). The grab is unblockable. |
| 1–4 | Forms | **COUNTER / BOX:** Slip Counter, Tempo Jab, Power Cross, Feint Step. **GRAPPLE / CONTROL:** Clinch Entry, Balance Break, Grip Throw, Frame Off. Each Form needs stamina, footing and range; it auto-faces the target, and its damage scales with the reliability of the body parts it uses. A heavy Form fails ("FORM UNRELIABLE") when those parts are below 75%. Slip Counter slips the strike, then counters it in the window (2.2×). Balance Break and Grip Throw need a clinch. |
| (behaviour) | Habit learning | After two Tempo Jabs the construct learns to counter the lead. A Feint Step then baits that counter, and the construct whiffs and is left open. |
| Q tap / hold | Hotswap | A tap swaps to the other Loadout (0.7 s, vulnerable: a hit does 1.5× damage and interrupts the swap). Holding Q opens the Loadout wheel (1/2 choose; Pursuit and Rescue are shown locked). |
| X | Registered baton | Draws it from socket 01 or stows it, using the Runner pack's staff prop. Its durability persists (localStorage) and it can break. A broken baton stays registered, and there is no replacement. |
| B tap / hold | Status | The glance shows the integrity of each body part, the compromised Forms per Loadout, and a recommendation (for example "RECOMMENDED LOADOUT: COUNTER / BOX (LEFT-LEAD …)"). Holding B keeps it open as Body Inspection. |
| J | Quest | The primary Quest is "neutralise the construct" with an estimated success %. After 6 s a voice is heard, and the Quest keeps the line "unconfirmed occupant: excluded from model". Route B (unverified) is to free the worker. |
| I hold (near the worker) | OFF-SCRIPT | Frees the worker in 1.5 s, while the player is exposed. This is logged as OFF-SCRIPT if the construct is still active, and gives XP. |
| — | XP / Level | XP comes from reading and countering an analyzed attack, baiting a learned counter, a counter or feint followed by a hotswap and a clinch, rescuing the worker, and neutralising the construct. Collecting Movement Echoes (3/3 for the feint into grab) gives a "Skill acquisition" entry. Level starts at 11; LEVEL n → n+1 reads "INTERFACE CAPACITY EXPANDED". XP never comes from repeated hits. |
| — | HUD | HP/MP/STA, the registered gear, the active Loadout with its 4 Form slots and their reliability, the quest line, and a 5-line event log. |
| — | Isolation | After switching to Backspool, the layer is inactive, the HUD is hidden, the encounter is cleared, and Backspool's own keys work (2 = Impact style). |

## Shared code changed (versioned copies; the v02 files stay for older builds)

- `game_backspool_combat_v03.js`, `game_backspool_threadrail_runtime_v03.js` and `game_backspool_flow_runtime_v03.js`: while Loadout is the hero, the keys his layer claims (1–4, Q, V, X, B, J, T, and I near the worker) are left to it. Before this, Backspool's heavy attack, Flow dash and Ghoststep keys still fired for Loadout, because he runs on Backspool's controller.
- `src/v02/engine/010-setup-renderer-assets.js`: `window.loadoutInterface?.tick(dt)` is called once per frame before the hero `beforeRender` hooks.

## Not built yet (design intent only)

- The camera moves for Body Inspection and Inventory.
- The 8-section Core Wheel and the Deep Interface pages (Skills, Shop, Titles, Records).
- Deep Scan; Pursuit routes from real geometry; Conditions (OUTCLASSED); violet UNKNOWN anomalies and The Blank / Relay 9.
- Witness memory and TalkBack, and rival adaptation across encounters.
- The full inventory carousel with five sockets.
- Gamepad bindings. The brief's controller map (LT Analyze, RT+face buttons for Forms, RB hotswap, D-pad Inventory/Status/Quest) collides with the shared pad map (D-pad 12–15 are already rail-read, reset and shoulder swap), so it needs a decision first. **NOT TESTED** on a pad.

## Known limits

- **Placeholder clips:** the Grapple Forms use Runner pack clips (Attack_Hand_Ready, Attack_Kick_B, Attack_Hand_PwR, Esc_StandRoll_Back) with no real grappling motion. The role → clip map is in `FORMS` / `ATTACKS`.
- **The construct:** it is the Tripo humanoid (Kinsmoke's no-cape body) in a dark construct material, and it reads reddish under the game's lighting. Its AI moves straight along the ground with no collision sweep, within 12 m of its spawn point.
- **The worker:** a simple placeholder figure.
- **The test harness:** it hides gamepads, because a controller attached to the test machine was drifting the stick.

---

# Phase 2 — Deep Scan and Pursuit (2026-11-11)

- Build: `SIGHTLINE_SAINT_MERIDIAN_V02_LOADOUT_INTERFACE_P2.html`
- Module: `scripts/game_v02_loadout_interface_v2.js`, a copy of v1 plus the new systems. v1 is unchanged, because the P1 build loads it.
- Test: `scripts/characters/loadout/test_loadout_interface_p2.cjs`, **15/15 PASS** on two runs. The phase 1 test also passes on the P2 build, **22/22** on 4 of 5 runs. In the other run the encounter seemed to stall after it started; three reruns didn't reproduce it, so it is noted as unexplained.

## Implemented and proven with real input

- **Deep Scan (Y toggles):**
  - It labels what is within 35 m, up to 16 labels: walkers, combatants, the fleeing runner, the pursuit access marker, discovery points and the unclassified voice. Every label is shown as an interpretation, never as a fact; for example, a few walkers are deterministically flagged "gait resembles a threat profile · UNVERIFIED".
  - It drains 8 MP/s and raises Archive Saturation by 6%/s, which drains away when Deep Scan is off. Above 60% the labels turn reductive ("NPC · LV 1", "HOSTILE", "TERMINAL").
  - When MP runs out or saturation reaches 100%, the Interface overloads: Deep Scan and Analyze go offline for 4 s and MP drops to 0.
  - A vignette darkens the edges of the view. The HUD shows ATTENTION (PASSIVE / FOCUS / DEEP SCAN) and the saturation.
- **PURSUIT Loadout** (the third preset in the wheel; a Q tap now swaps to the *previous* Loadout). Its Forms:
  - **1 Burst Dash:** the Runner pack's `Esc_BoostDash_Front` with root motion, moved by the movement owner; the test measured 4.5 m.
  - **2 Route Assessment:**
    - It works on the existing transit pursuit (`verticalPursuit`), started with I at its access marker as before, which Loadout can now run.
    - It scores interception points along the runner's real remaining route. For each point it samples the straight line from Loadout every 0.5 m against the real ground (`actorGroundHeight`) and colliders (`actorSweep`): a hit is blocked (red), a drop over 1.4 m is an unsafe landing (amber), and a rise of 0.5–2.6 m is a climb (+1.2 s). Loadout's time at Dash pace (8.15 m/s) is compared with the runner's time along its route, including corner pauses.
    - It shows the earliest viable interception, an alternative, "Follow the runner (to its exit)", and a blocked line when one exists.
    - Each route is drawn on the ground and listed with a time range. The list reads "Illustrative route assessment, not a guaranteed outcome. You still have to run it."
    - With no chase running it shows no routes, only the distance to the access marker.
  - **3 Target Interception:** the runner's next 1.5 s along its route, drawn in amber.
  - **4 Ledge Read:** for 8 s it marks up to 10 ledges from the real collision boxes within 20 m whose tops are 0.6–2.6 m above his feet: VAULT if under 1.3 m, CLIMB above that.
- **Isolation:** after switching to Backspool, Deep Scan, the Pursuit overlay, the veil and the labels are all off, and Y does nothing for Backspool.

## Not built yet / limits

- **Route geometry:** routes are straight lines from Loadout, not pathfinding around obstacles. There are no rooftop routes, because no climb network is wired into the assessment. "Structural hazard" red is used only for lines blocked by geometry.
- **Deep Scan near the spawn:** street walkers are rarely within 35 m there; the test saw the construct and the voice. The label set is a first pass, with no vendors and no NPC relationships.
- **Not done:** gamepad bindings and the Deep Scan camera treatment.

---

# Phase 3 — Gamepad controls (2026-11-11)

- Build: `SIGHTLINE_SAINT_MERIDIAN_V02_LOADOUT_INTERFACE_P3.html`.
- Code:
  - `scripts/game_v02_loadout_interface_v3.js` (v2 unchanged);
  - `game_backspool_threadrail_runtime_v04.js`, which calls `loadoutInterface.poll(now,gp)` first, before the Runner pack and Backspool's handlers, so the buttons it uses are masked from the shared array;
  - `game_backspool_combat_v04.js`, whose raw RT read stands down for Loadout.
- **Priority:** the hero-switch chord L3+LT+RT+R3 is handled by the engine before all of this, and still switches heroes (tested).

## Loadout pad map

| Pad | Loadout (new) | Was, for Loadout |
|---|---|---|
| LT hold | Analyze | Backspool's guard (`input.actions.aim` is cleared for Loadout) |
| LT + R3 | Deep Scan on/off | lock toggle |
| LT + D-up | Quest panel | — |
| RT + X / Y / A / B | Forms 1 / 2 / 3 / 4 | — |
| RT tap (< 0.3 s, no face button) | basic strike (`backspoolCombat.pressAttack`) | basic strike |
| LB with the stick still | Guard | strafe (unchanged when the stick moves) |
| D-right tap / hold | hotswap to the previous Loadout / Loadout wheel (X / Y / A pick 1 / 2 / 3) | Backspool style cycle |
| D-left | baton | Backspool style cycle |
| D-up tap / hold | Status glance / Body Inspection | Backspool heavy |
| Y hold near the trapped worker | free him | interact (unchanged elsewhere) |

- **Unchanged:** A jump, B / D-down evade, X tumble, RB dash, LB strafe, L3 sprint, the View combos, Start pause.
- **HUD:** shows pad glyphs ("RT+X", "D→ SWAP" and so on) while the pad was used in the last 5 s.
- **Not mapped on the pad:** T, which starts the sparring encounter (a test-only entry point).

## Tests

- `scripts/characters/loadout/test_loadout_interface_p3_pad.cjs`, **20/20 PASS**, run with a virtual standard gamepad. The game reads it through its normal `pollGamepad` path; the controller attached to the test machine is hidden.
- The P1 keyboard test (22/22) and the P2 test (15/15) also pass on the P3 build.
- **NOT TESTED on a physical controller:** button feel, trigger thresholds on a real device, and the hero-switch chord's timing by hand.

---

# Phase 4 — Core Wheel and Deep Interface pages (2026-11-11)

- Build: `SIGHTLINE_SAINT_MERIDIAN_V02_LOADOUT_INTERFACE_P4.html`
- Module: `scripts/game_v02_loadout_interface_v4.js` (v3 unchanged; the P3 build loads it).
- Test: `scripts/characters/loadout/test_loadout_interface_p4.cjs`, **44/44 PASS** (keyboard and mouse, then a virtual gamepad). The P1 (22/22, on two runs), P2 (15/15) and P3 pad (20/20) tests also pass on the P4 build.

## Implemented and proven with real input

- **Core Wheel:** Tab, or a View tap with no other button held, opens 8 angular sections around the belt core: STATUS, SKILLS, LOADOUTS, INVENTORY, QUESTS, SHOP, TITLES, RECORDS. The world behind it is darkened and desaturated. The centre shows the active Title, the Level, and the selected section's purpose and fast-access input.
  - Select with the mouse direction or the left stick, step with ← → or the D-pad, open with 1–8, Enter, LMB or A.
- **Pages** (each with its own layout; they read and write the real gameplay state):
  - **STATUS:** a front body map coloured by integrity, the Forms that use the selected body part with their reliability, recent injury events, HP/MP/STA, Saturation, Level and XP. It states that Level does not raise physical strength.
  - **SKILLS:** every Form with its body parts, cost, reach, how many times you have used it and which Loadouts equip it; the incomplete Grip Reversal with its Movement Echoes (n/3).
  - **LOADOUTS (Build Deck):** three presets with four sockets each, plus Rescue (locked). Confirming a socket puts the next Form there; a Form already in the deck swaps places. The deck is saved and changes what 1–4 / RT+face perform (tested). EQUIP starts a real 0.7 s hotswap. The deck locks while an encounter is active.
  - **INVENTORY:** five belt sockets in an arc above the core and two consumable positions. Socket 01 holds the baton; confirming draws or stows it. The other sockets are shown empty.
  - **QUESTS:** the active Quest with its evidence, what it excluded, Route B and what is unresolved; the transit pursuit when it is running; a history of finished encounters, including whether you refused the recommendation (OFF-SCRIPT).
  - **SHOP:** a baton field repair for 30 credits (refused when the baton is full, when you can't pay, or during an encounter). Credits come from resolved Quests (+20 construct neutralised, +15 occupant freed); they are a placeholder currency. Grapnel, smoke capsules, rescue cutter and medical kit are blueprints only.
  - **TITLES:** a constellation of 7 Titles earned from lifetime records (HOTSWAP, PATTERN READER, COUNTER WINDOW, FALSE EXPECTATION, CLEAN TRANSITION, OFF-SCRIPT, ROUTE FINDER); an earned Title can be made active. Conditions: OUTCLASSED "not active, witness pressure 0" and INDEXED locked.
  - **RECORDS:** techniques observed while analyzing (lifetime counts), finished encounters, unclassified signals, The Blank (no records; not unlockable by Level), and the full event log.
- **Navigation in pages:** ↑ ↓ ← → / WASD / stick / D-pad move; Enter / E / Space / LMB / A confirm; Backspace / C / RMB / B back; Q / R / LB / RB previous / next page; Tab / View close. Esc pauses as usual and closes the Interface.
- **The world is not paused.** Enemies keep acting (the hint says so during an encounter); Loadout stands still and the camera does not turn while the Interface is open. Buttons still held when it closes are kept from the game until released, so closing with B does not evade.
- **Saved data:** the deck, credits, lifetime records, Titles, Quest history and signals are in localStorage `loadoutInterfaceV4`. Older builds keep `loadoutInterfaceV1`.
- **Isolation:** as Backspool, Tab is his own again (tested).

## Changed for Loadout

- On the pad, View no longer reaches Backspool's posture toggle while Loadout is the hero. Loadout's View combos were Backspool powers that are blocked for him anyway.

## Not built yet / limits

- Credits and the Titles list are gameplay placeholders, not canon; check the Map Bible before naming them for real.
- No time slow, no camera move toward his hands or belt, no Form nodes moving between joints, and no rotatable 3D body model; the body map is a flat diagram.
- Inventory registration through use, other items, utility sockets, training, the Condition system and witness memory are still design intent.
- **NOT TESTED** on a physical controller.

---

# Phase 5 — OUTCLASSED and witness memory (2026-11-11)

- Build: `SIGHTLINE_SAINT_MERIDIAN_V02_LOADOUT_INTERFACE_P5.html`
- Module: `scripts/game_v02_loadout_interface_v5.js` (v4 unchanged; the P4 build loads it).
- Test: `scripts/characters/loadout/test_loadout_interface_p5.cjs`, **19/19 PASS**. On the P5 build the P1 (22/22), P2 (15/15), P3 pad (20/20) and P4 (44/44) tests also pass.
- SETUP calls in the test (labelled): low HP to shorten a fight, a forced slow attack to counter into, and low construct HP to end a fight.

## Implemented and proven with real input

- **Witnesses:** every sparring encounter has 3 spectators standing behind the construct (placeholder figures). A witness counts as present if it is within 16 m of the fight.
- **Gaining OUTCLASSED:** if Loadout goes down with at least 2 witnesses present, each of them gives an account. It is shown over their heads, logged, and kept in RECORDS → WITNESS ACCOUNTS.
  - One insults him ("Taken apart by a training dummy.") and one agrees.
  - The third disputes it only if he had landed a counter in that fight.
  - The accounts set a witness pressure. A loss with fewer than 2 witnesses gives no Condition.
  - The Condition is saved and active in later encounters.
- **While it is active, only his perception changes:**
  - the threat bracket is larger and red;
  - the tag reads "THREAT · OVERWHELMING · counter window: UNCERTAIN";
  - the Ghost Builds are 1.3× larger and tinted red;
  - the attack the Interface fears most is labelled "SUCCESS 88–98%";
  - an amber ESCAPE ROUTE is drawn, with its label pinned to the screen edge when the route is off screen;
  - the edges of the screen get a red vignette.
  - **The opponent's real attacks are unchanged:** an unguarded lead jab still does −7 HP (tested).
- **Contradicting it:** each counter or evade of an attack while it is active logs "PREDICTION CONTRADICTED · the Interface gave it 9x%" and lowers the pressure.
  - After 3 contradictions, a win with at least 2 witnesses present makes them revise their accounts and **clears** the Condition (+80 XP).
  - A win without the 3 contradictions "reads as luck": the Condition persists and the pressure drops by 15.
  - A win nobody sees changes nothing.
- **Shown in:** the HUD (pressure and contradictions), STATUS (Conditions), TITLES (OUTCLASSED ACTIVE with pressure; how to clear it) and RECORDS (witness accounts).

## Not built yet / limits

- The witnesses are placeholder figures that stand still, with fixed lines. There is no TalkBack spreading accounts across the city, and no rival who remembers your techniques.
- Only the sparring construct can cause or clear OUTCLASSED. The camera itself is not changed (no FOV or shake), only the Interface overlays.
- The witness lines and the pressure numbers are placeholders, not canon.

---

# Phase 6 — Full belt Inventory (2026-11-11)

- Build: `SIGHTLINE_SAINT_MERIDIAN_V02_LOADOUT_INTERFACE_P6.html`
- Module: `scripts/game_v02_loadout_interface_v6.js` (v5 unchanged; the P5 build loads it).
- Test: `scripts/characters/loadout/test_loadout_interface_p6.cjs`, **36/36 PASS** on two runs (keyboard and mouse, a page reload, then a virtual gamepad). On the P6 build the P1 (22/22), P2 (15/15), P3 (20/20), P4 (44/44) and P5 (19/19) tests also pass.
- SETUP in the test (labelled): facing the nearest wall for the grapnel, a cable strung across the construct's path, teleports next to the cutter, the worker and out of the construct's leash, an injured arm, credits, and one forced jab.

## Implemented and proven with real input

- **Sockets:**

  | Position | Item |
  |---|---|
  | 01 | baton |
  | 02 | grapnel |
  | 03 | medical kit (4 doses) |
  | 04 | rescue cutter (has to be registered) |
  | 05 | empty |
  | C1 | smoke capsules (2) |
  | C2 | empty |

  The HUD shows the selected item, what is in his hands, and a deployed grapnel.
- **Quick retrieval:** a tap of X or D-left uses the selected item. With the baton selected this is the same as before.
- **Belt carousel:** holding X or D-left opens it.
  - The camera moves to a low view of his waist, the sockets fan out in front of the belt with their states, and Loadout stands still.
  - Select with the mouse, A D, ← →, the wheel, the stick or LB RB. Release to use; RMB or B cancels.
  - While it is open the sparring construct runs at half speed (measured 0.495). The rest of the world is not slowed.
- **Grapnel:**
  - Fires at the nearest collider face in an 80° fan within 22 m. The cable stays strung from the wall to the spool where he stood, it is saved, and it is rebuilt after a reload.
  - It trips the construct when it walks through it low (down 1.4 s). It trips it only once; after that the construct steps over that cable.
  - He gets it back only by walking to the spool and reeling it in (1.2 s). From further away it is refused.
- **Medical kit:** a 2.4 s treatment while exposed. A hit interrupts it and no dose is used. Otherwise it uses one dose: +25 to the worst body part and +15 HP. The doses run out.
- **Smoke:** a 6 s cloud at the opponent. While either of them is inside it, the construct starts no attack and drops any wind-up it hasn't committed to. Used capsules are gone.
- **Rescue cutter (registered through use):**
  - It lies near the trapped worker; I or Y picks it up.
  - Unregistered, it is carried in his hand: he can't draw the baton, and it frees the worker in about 0.6 s instead of 1.5 s.
  - It stays carried into later encounters. After 2 rescues with it, it registers into socket 04 (+50 XP), and from then on it is drawn and stowed like the baton.
- **Shop:** a smoke restock (25 CR, up to 2) and a medical kit refill (40 CR). It never makes new equipment. The Flash capsule for C2 is a blueprint only.
- **INVENTORY page:** shows every socket with its real state; confirming uses the item.

## Not built yet / limits

- The draw, throw and treat motions are Runner pack placeholders (Attack_Hand_Ready / Attack_Hand_1R). There is no negative-space-to-prop transition: only the cutter has a simple hand prop, besides the baton's existing staff.
- The grapnel is a fixed trip line, not a traversal tool, so movement ownership is unchanged. Only the sparring construct reacts to the cable and the smoke.
- Socket 05 and C2 have nothing to register yet.

---

# Phase 7 — socket cards, combat arc, reach and props (2026-11-11)

Build: `SIGHTLINE_SAINT_MERIDIAN_V02_LOADOUT_INTERFACE_P7.html` · module `scripts/game_v02_loadout_interface_v7.js` (a copy of v6 plus this phase; v6 and the P6 build are untouched) · test `scripts/characters/loadout/test_loadout_interface_p7.cjs` · evidence `development/loadout-interface/evidence/p7/`.

Source of the idea: the user's two reference pictures. No code was taken from `cortiz2894/showcase-images` (it has no licence and is React Three Fiber); the card shader here is our own. Kimodo was not installed or used.

## Implemented and proven with real input (19/19 PASS, keyboard)

- **Socket cards in the world:** the 7 sockets are shader cards (border, scanlines, item silhouette) tied to a glowing belt core by cyan tether lines. The selected card is about 15% larger and nearer. Empty sockets are dim.
- **Two views of the same belt:**
  - **Capsule view** outside a fight: rounded glass capsules fan above the belt and the camera comes down to his waist (as in phase 6).
  - **Combat arc** during an active encounter: cut-corner cards fan from the belt toward screen right, the camera stays on the fight, and the opponent still runs at half speed.
- **Reach and contact:** on release his right arm is steered (two-bone IK over the playing clip) to the socket card, which moves to his hip. The item changes hands at the contact moment, not at the button press (baton 0.09 s, others 0.25 s). Measured hand-to-card distance at contact: 0 cm.
- **A hit before contact interrupts the reach** and the item stays in its socket (tested with a smoke capsule: count unchanged).
- **Props in hand:** medical kit, smoke capsule, grapnel head and cutter have simple props from contact on. The baton uses the Runner pack's existing staff, so there is no second stick.
- **HUD:** "IN HAND · BATON · CONDITION n%" and "ITEM CAPACITY · n / 5"; the gear panel no longer covers the HP / MP / STA bars.

Regression on the P7 build, run one test at a time: P1 22/22, P2 15/15, P3 pad 20/20, P4 44/44, P5 19/19, P6 36/36. `build_v02.py --check`: IDENTICAL.

Test setup that is not player input (labelled SETUP in the test): `debug.hitPlayer` registers one hit through the game's own `hurt()` during the 0.25 s reach, because a real construct attack cannot be timed into that window reliably.

## NOT TESTED

- The card arc and the reach on a **gamepad** (the pad paths are the phase 6 ones and the P3 pad test passes, but P7 has no pad test of its own).
- The look on a real GPU at the user's resolution: screenshots are from headless Chromium at 1280×800.
- The interrupt by a real, untimed construct attack.

## Not built yet / limits

- The reach is IK over the Runner pack placeholder clips. There are no authored reach, draw, treat or throw animations. Kimodo could generate them, but it needs an NVIDIA GPU and a retarget from its 77-joint skeleton to the Mixamo rig; nothing was spent or installed.
- The props are primitive shapes, not modelled gear. There is no look-down first-person view as in reference picture 2; the capsule view is a third-person camera at his waist.
- The left hand never reaches; sockets on his left side are fetched by the right hand at the same hip point.
- Socket 05 and C2 still have nothing to register.

## Phase 7b — the belt opens in the over-the-shoulder view (2026-11-12)

Build `SIGHTLINE_SAINT_MERIDIAN_V02_LOADOUT_INTERFACE_P7B.html`, module `scripts/game_v02_loadout_interface_v7b.js`, test `test_loadout_interface_p7b.cjs`, evidence `evidence/p7b/`. The P7 build and v7 module are unchanged.

- User feedback: the camera went in front of him when the belt opened. Now the camera is never moved by the belt: capsule view and combat arc both keep the normal over-the-shoulder camera.
- The capsule fan is centred so that all 7 capsules stay on screen beside the HUD.
- Baton contact is 0.06 s (was 0.09 s), which made the P3 pad test's fixed 120 ms check timing-sensitive.
- P7B test 19/19 PASS (keyboard). On the P7B build: P1 22/22, P2 15/15, P3 pad 20/20 (3 runs), P4 44/44, P5 19/19, P6 35/36. The one P6 FAIL is its check that the camera lowers to his waist, which this change removes on purpose.
- NOT TESTED: gamepad use of the cards; the look on the user's own screen.

## Phase 7c — belt cards stand in front of him (2026-11-12)

Build: `SIGHTLINE_SAINT_MERIDIAN_V02_LOADOUT_INTERFACE_P7C.html` · module `scripts/game_v02_loadout_interface_v7c.js` (P7 and P7B and their modules are unchanged).

Why: in P7B the capsule fan sat above his hips in screen space, so it covered the character. The user's reference shows the cards standing in the world in front of him, to his right, on a ground ring.

What changed (one layout for calm and fight; `mode` only changes the banner text):
- The cards are placed in the world on a ring on the ground (radius 1.5 m), centred 1.8 m ahead of him and 1.45 m to the side the camera leaves open (right when he is on the left of the screen). "Ahead" is the camera's heading, so the over-the-shoulder view always sees them. The camera is not moved.
- The selected card is the nearest one (0.5 m ahead, 0.7 m to the side, by his hand) and 22% larger. The others follow the ring away from the camera and rise 5 cm each. Selecting rotates the ring.
- Each card carries its own text and picture (SLOT nn, name, item drawing, state), drawn on a canvas and redrawn when the state changes. The floating DOM labels are gone.
- A glowing ring on the ground (depth tested, so his legs stay in front of it), a stem from each card to the ring, and one line from the belt core to the selected card.
- Detail panel at the right (name, type, description, what release does, condition / doses / charges bar), "REGISTERED GEAR nn / 05" and the prompts in one bar at the bottom.
- `state().inv` adds `body` (his screen rectangle), `side`, `ring`, and per card `w`, `hp` (pixels), `ahead`, `side` (metres from his hips).

Test: `scripts/characters/loadout/test_loadout_interface_p7c.cjs` (keyboard input; one labelled SETUP hit). Evidence in `development/loadout-interface/evidence/p7c/`.

Not tested: gamepad use of the ring; the look on the user's own screen size (tested at 1280×800); the view when the camera faces his front.
Known limits: the item pictures are line drawings, not 3D renders as in the reference; with 7 sockets the last three cards sit close together at the far end of the ring.

Results on P7C (2026-11-12): P7C test 22/22 PASS. Regressions: P1 22/22, P2 15/15, P3 pad 20/20, P4 44/44, P5 19/19 PASS. P6 34/36: the two failures are checks of the old design ("the camera lowers to his waist", removed in P7B; "7 sockets shown with their state", which looks for the floating DOM labels that are now drawn on the cards). `build_v02.py --check`: identical.

## Phase 7d — energy lines from the belt to every card (2026-11-12)

Build: `SIGHTLINE_SAINT_MERIDIAN_V02_LOADOUT_INTERFACE_P7D.html` · module `scripts/game_v02_loadout_interface_v7d.js` (P7C unchanged).

The stems from each card down to the ground ring are gone. Each card is now tied to the belt core by its own energy line: a curved, camera-facing ribbon that leaves the belt, dips, and rises into the bottom of the card, with a pulse running from the belt outward. The selected card's line is thicker and brighter. The lines stay attached while the ring rotates. `state().inv.lines` counts the visible lines.

Results: P7D test 22/22 PASS (7 lines visible). Regressions on P7D: P1 22/22, P2 15/15, P3 pad 20/20, P4 44/44, P5 19/19 PASS; P6 34/36 (the same two checks of the replaced design as on P7C). Not tested: gamepad use of the ring; other screen sizes.

## Phase 8 — belt inventory visual overhaul (2026-11-12)

Build `SIGHTLINE_SAINT_MERIDIAN_V02_LOADOUT_INTERFACE_P8.html`, module `scripts/game_v02_loadout_interface_v8.js` (a copy of v7d with the
inventory view rewritten; v7d and the P7D build are untouched). Test `scripts/characters/loadout/test_loadout_interface_p8.cjs`,
evidence `development/loadout-interface/evidence/p8/`.

**Implemented**
- Inventory camera: while the belt is open the module blends the game camera to a close over-the-shoulder view (1.55 m behind his hips,
  0.62 m up, turned about 22° to the open side, fov 50). The heading is frozen from the gameplay camera when the belt opens, the move is
  eased with the open blend (about 0.3 s), the position goes through the game's `constrainCameraPosition`, and the gameplay camera takes
  over again when the blend returns to 0. Nothing in the game's own camera code changed.
- Five sockets from the inventory state, in belt order: 01 Baton, 02 Grapnel, 03 Smoke, 04 Med kit, 05 Rescue tool. The two old
  consumable positions (C1, C2) are gone: smoke is socket 03 and the unused C2 is removed. An unregistered rescue tool is drawn dimmed and
  cannot be equipped.
- Cards: curved quads on an arc centred on the camera, so they are evenly spaced on screen from the belt to the right edge. Cut-corner
  shader frame, charcoal interior, grid, cyan border; the selected card is about 1.6× the height of the others, with a stronger border and
  glow, and stands slightly nearer. Each card carries a 3D holographic copy of the real hand prop for that item (the existing prop
  geometry with a rim-lit shader), not a 2D icon.
- One energy line per card from the belt core on his hip; a small core mark replaces the large glow.
- Two short-range point lights (cyan at the selected card, cool white behind the camera) are on only while the belt is open. They are
  what make his black costume readable; his model and materials are unchanged.
- HUD while open: speed / strain panel, log, old HP bars, gear text, Counter / Box panel, district directory, pause button, crosshair and
  action hint are hidden (`body.loInvOpen`); `?lodebug=1` or `localStorage.loInvDebug='1'` keeps them. Shown instead: HP / MP / Stamina
  top left, objective top right (the quest line in a fight, the field task otherwise), registered gear bottom left, prompts bottom
  right, detail panel (name, class, description, use line, condition bar) right of the cards. Condensed sans type.

**Not done / honest limits**
- No minimap: the game has no minimap system, so none is shown.
- The item models are the game's simple primitive props. They are not detailed product-style models as in the reference image.
- The belt core is a drawn mark on his hip. His model has no belt-core part that is visible from behind.
- Scene: no new environment art, reflections or post effects were added. The street, windows and fog are as in P7D; only the two local
  lights are new. The reference image's wet reflections, depth of field and detailed city are not matched.
- His face and helmet front are not visible: the camera stays behind him, as the user asked in Phase 7b.
- Gamepad input for the inventory was not re-tested in the P8 test (keyboard and mouse only).

**Test results (2026-11-12, headless Chromium, ANGLE Metal, 1920×1080, real keyboard and mouse)**
- `scripts/characters/loadout/test_loadout_interface_p8.cjs <build> <outDir>`: 36/36 PASS. Covers the inventory camera and its
  release, composition, five cards, HUD collapse and restore, rotate, cancel, baton retrieval and stow, medical kit, the unregistered
  rescue tool, the slowed opponent and an interrupted retrieval in a fight, condition 50% (SETUP: saved durability), debug HUD mode,
  Backspool unchanged, no page errors. Evidence: `development/loadout-interface/evidence/p8/`.
- Frame time: closed avg 13.9–14.7 ms (p95 17.5–24.9), open avg 14.1–14.4 ms (p95 17.5–24.9). No measurable cost.
- `build_v02.py --check`: IDENTICAL.
- Older tests on the P8 build: P1 22/22, P2 15/15, P3 pad 20/20, P5 19/19, P4 43/44, P6 33/36, P7 12/19, P7B 11/19, P7C 7/16,
  P7D 7/16 (then a script error). The failing checks assert the old layout that P8 replaces: 7 sockets, the old slot order
  (D D = medical kit, now smoke), the gameplay camera staying at 3.87 m while open, the old card positions, labels and panel place.
  Those tests still describe their own builds (P4–P7D), which are unchanged. NOT TESTED in P8: gamepad inventory input (the pad RB
  check in P6 fails on the socket count), Sightline (not touched by this module).

## Phase 9 — third-person spatial inventory (2026-11-12)

Build `SIGHTLINE_SAINT_MERIDIAN_V02_LOADOUT_INTERFACE_P9.html`, module `scripts/game_v02_loadout_interface_v9.js` (new file; the v7d and v8 modules and the P7D / P8 builds are untouched). The existing Belt Inventory was changed, not replaced: same equipment state, same bindings.

**Implemented**
- Camera: locked behind Loadout and centred (2.2 m back, 1.25 m up, fov 50), eased in and out. No shoulder offset.
- Cards: five registered slots on an arc in front of him at chest-to-head height, in fixed order 01 Baton, 02 Grapnel, 03 Medical Kit, 04 Rescue Cutter, 05 Smoke Capsules, plus the dim capsule C2. The selected card is larger and nearer; one thin line per card runs back to the belt; ground ring.
- Selection: his head and neck turn toward the selected card (at most 0.5 rad); his body keeps facing the array.
- Retrieval: the selected card comes to his right hand, his fingertip touches it (ripple, the silhouette opens, the other cards dim), the hand goes about 10 cm in, grips, and comes out with the real 3D item; the card collapses, the others retract, the camera eases back and control returns. The item appears in his hand only at the grip. Stowing runs the same sequence in reverse meaning (the item leaves his hand at the grip).
- The card that comes to him is clamped to what his arm can reach from the pose he is in (found by the test: after a cancel and a quick reopen the fingertip stopped 5.6 cm short).
- Controls: hold X, mouse over a card or A / D / arrows, click / Enter / E / release X confirms, Esc / right mouse cancels. Pad: hold D-left, D-pad or right stick or LB / RB selects, A or release confirms, B cancels.
- Safety: a hit before the grip aborts the retrieval and the item stays in its socket; empty or unregistered slots start nothing; switching hero closes everything (a leftover `loInvOpen` body class after a switch was found by the test and fixed).

**Proven by real input** — `scripts/characters/loadout/test_loadout_interface_p9.cjs`, 48/48 PASS, headless 1920×1080, results and screenshots in `development/loadout-interface/evidence/p9/`. Covers the brief's 12 scenarios, plus empty / unregistered slots, mouse hover and click, controller, and the hero switch. SETUP used and labelled in the test: `debug.forceAttack('jab')` makes the construct start its own jab so it lands inside the reach, and `debug.setHp`. The controller is a test Gamepad object read through the normal Gamepad API.

Screenshots A / B / C (`A_inventory_open.png`, `B_fingertips_on_baton_card.png`, `C_withdrawing_baton.png`) come from `capture_loadout_interface_p9.cjs`, which presses real keys and steps the page clock so the frame lands on a known phase (capture SETUP).

**Not tested / gaps**
- No human hands-on session and no physical controller; frame rate was not measured.
- Only Baton (retrieve, use, stow), Medical Kit (retrieve) and Smoke (interrupted retrieve) go through the full sequence in the test. Grapnel is selected but not retrieved from the open belt here; the Rescue Cutter is only tested as unavailable.
- During the withdraw, the existing draw clip crouches and turns his torso, so the pose is less upright than the reference picture.
- The reach card arrives at his right front, so from the rear camera his shoulder covers part of it.
- Compared with the reference picture: the layout matches (centred back view, card arc, selected card enlarged, lines, ring, right-hand info panel). Differences: card art is the game's existing item meshes, not the reference's painted icons; the reference's cards are larger and brighter.

**Phase 9 follow-up (2026-11-12, user request):** the card lines now leave from the front of his belt (20 cm in front of the hips) and are depth-tested, so his body hides the part behind him; before, they started at his lower back and drew over him. Test rerun after the change; screenshots A / B / C replaced.

## Phase 10 — pocket-dimension reach with a Kimodo clip (2026-11-12)

Build `SIGHTLINE_SAINT_MERIDIAN_V02_LOADOUT_INTERFACE_P10.html`, module `scripts/game_v02_loadout_interface_v10.js` (new file; the v9 module and the P9 build are untouched). `python3 scripts/build_v02.py --check` reports the source rebuilds P10 byte for byte.

**The clip**
- Generated with NVIDIA Kimodo (`nvidia/Kimodo-SOMA-RP-v1.2`; code Apache-2.0, model under the NVIDIA Open Model License), run locally on CPU in `~/ai-tools/kimodo`. No paid credits. It is text-to-motion output, not extracted from any game.
- Prompt: "A person stands still, reaches their right arm straight forward at chest height into a small opening, grabs an object inside and pulls it back out toward their body." Seed 7, 3.0 s, 3 samples, 100 diffusion steps, `--no-postprocess` (the foot-contact correction extension is x86 only). Sample 1 was chosen.
- Packed by `scripts/characters/loadout/pack_kimodo_pocket_reach.py` into `assets/loadout/kimodo/pocket_reach.json` (89 frames at 30 fps; arm enters at frame 19, grip at frame 60). The source BVH is kept beside it.

**Implemented**
- The clip is retargeted at runtime onto his rig (27 bones: spine, neck, both arms, right fingers) and layered over his pose during the retrieval; the hips are not driven, so it cannot move the capsule. The existing fingertip IK then steers the hand to the card. If the clip fails to load, the P9 behaviour runs.
- Each card is a pocket: one clipping plane on the card face hides whatever part of his arm, its outline, and the held item is past it, so the hand disappears into the card. A cyan ring marks where the forearm crosses.
- The item is in his grip inside the pocket and grows out with the hand as it withdraws. Stowing runs the same clip and the item shrinks into the card.
- The pocket exists only while the hand can be in it, and closes once the fingertip is clear.
- Found from a side-view render: the engine's outline hull had no clipping code, so a black hand silhouette stayed visible behind the card. The module now adds the standard clipping chunks to that material.

**Proven by real-input test** (`scripts/characters/loadout/test_loadout_interface_p10.cjs`, results in `evidence/p10/`): 56/56 PASS. Eight checks are new: clip loaded (89 frames, 27 bones); played at full weight with the grip on frame 60 ± 2; fingertip 26.7 cm past the card face and wrist 2.4 cm past it at grip; clipping on with the rim shown while the arm is through; nothing but the reaching arm crosses the card; Baton scale under 10 % at grip and 100 % when clear; pocket closed afterwards; stow uses the same clip and shrinks the Baton. As in P9, the interrupt check uses a forced construct jab (test setup).

**Seen, not measured:** `06`–`08` in `evidence/p10/` are side-view renders taken with a moved camera (capture setup, not the game camera). They show the hand gone past the card and the Baton coming out. From the game's own behind-the-back camera his cape hides most of the hand, so the effect is hard to see there.

**NOT TESTED:** the look of the Grapnel, Medical Kit, Cutter and Smoke Capsules coming out (only the Baton was looked at); gamepad on the new checks; frame-time cost of local clipping; whether the patched outline material affects other heroes' outlines (each character has its own outline material, so it should not).

## Phase 10b — natural Baton grip (2026-11-12)

Build `SIGHTLINE_SAINT_MERIDIAN_V02_LOADOUT_INTERFACE_P10B.html`, module `scripts/game_v02_loadout_interface_v10b.js` (new file; v10 and the P10 build are unchanged).

**Before:** the staff was parented at the right wrist joint with no offset, so the shaft passed through his wrist and his hand stayed open.

**Implemented:**
- The shaft now lies across his palm: its line is computed each frame from his knuckles (index to pinky), set back 3 to 5 cm toward the palm and 3.2 cm off the palm surface.
- His fingers and thumb close from the bind pose joint by joint until each next joint reaches the shaft surface, so the fist fits the shaft instead of using fixed angles.
- In the pocket retrieval the fist closes at the grip moment and opens again when he stows it.
- The grip is applied after the animation each frame and restored before the next one, so no clip is edited and `game_v02_loadout_runner_full.js` is untouched.
- State: `loadoutInterface.state().inv.grip` (weight, measured gaps, joints closed).

**Proven by real-input test** (`scripts/characters/loadout/test_loadout_interface_p10b.cjs`, 60/60 PASS, evidence `evidence/p10b/`): grip weight 1 with 20 finger bones driven; shaft 5.5 cm from the knuckles and 9.8 cm from the wrist joint; fingertips 3.6 cm from the shaft axis; 14 joints closed onto it; hand open again after stowing. All 56 earlier checks still pass.

**Seen in renders (capture setup: cape hidden, added light, moved camera for 01–03; side camera for 04):** fist wrapped round the shaft in the idle weapon stance and in the pull-out.

**NOT TESTED:** how the grip looks in every weapon attack clip (two-handed staff clips keep the left hand where the clip puts it; the left hand is not fitted to the shaft); gamepad run of this build; other held items (they keep their P10 placement).

## Phase 10c — grip through the weapon attacks, left hand on the shaft (2026-11-12)

Build `SIGHTLINE_SAINT_MERIDIAN_V02_LOADOUT_INTERFACE_P10C.html`, module `scripts/game_v02_loadout_interface_v10c.js` (new file; v10b and the P10B build are unchanged). `game_v02_loadout_runner_full.js` is untouched and no clip is edited.

**Checked (right hand, P10B, before any change):** all 17 weapon clips that the move list plays (`Mvm_Wp_Charge*`, `WpAttack_Hand_*`, `WpAttack_Rolling*`, `WpJAttack_AirDrop*`, `WpJAttack_AirSwing*`) were played with real keys and recorded frame by frame. The right fist held the Baton at grip weight 1 with no error in every frame. Nothing needed fixing there.

**Implemented (left hand):**
- The clips are mostly one-handed. Where a clip brings the left hand to the shaft (heavy strike wind-up, second charge dash, parts of the rolling strikes), the left hand now takes hold of it.
- It engages when the left palm is within 8 cm of the shaft (fades out by 17 cm, with a 5 cm hold margin once it has hold), after 3 frames in range, so a hand that only passes the shaft does not snap to it.
- While it holds: the hand turns so its grip lies along the shaft, a two-bone arm solve brings it onto the shaft, and the fingers close with the right hand's fitted fist, mirrored through the bind pose (the two hands' bone frames are not mirror images in this rig).
- It never grips closer than 11 cm to the right-hand grip, and lets go if the shaft is out of the arm's reach instead of hovering.
- Farther away the arm and hand are exactly as the clip has them. All bones are restored before the next animation frame.
- State: `loadoutInterface.state().inv.grip.left` (weight, distance in the clip, gap after the fit, fingertip distance, distance from the right grip).

**Proven by real-input test** (`scripts/characters/loadout/test_loadout_weapon_grip_p10c.cjs`, keys G / M / Period, real time, 9/9 PASS): 17 clips played; right grip weight 1 in every frame; left hand at full hold for 119 frames of the heavy strike and 55 of the second charge dash, also in both rolling strikes; gap to the shaft axis at most 0.2 cm, fingertips at most 3 cm; hands at least 11 cm apart; one-handed clips stay one-handed; both hands release when the weapon is put away.

**Regression** (`test_loadout_interface_p10c.cjs`, the P10b set): 60/60 after the hover check was corrected (it was 59/60 first).
- The failing check was "2 · mouse over a card selects it". It failed on the committed P10B build as well, so the game had not changed.
- Cause: the test moved the cursor sideways to card 03, across card 02. Hovering 02 selects it; the selected card is 30% larger and pushes 03 about 105 px to the right, so the point the test aimed at (measured before the move) was then inside 02. Whether it passed depended on whether all the mouse steps arrived inside one rendered frame.
- Fix (test only, game unchanged): the cursor now comes down onto card 03 from above the row, still real mouse movement. `test_loadout_interface_p10b.cjs` is left as committed and can still fail this one check.
- Design note, not changed: because cards shift when the selection changes, a card's position moves as the cursor crosses its neighbours. Every card stays reachable (moving to the card's live position selects it).

**NOT TESTED:** gamepad; the combat-chain attacks (the test plays the clips from the move list, the chain uses windows of the same clips); how the two-hand hold looks at the normal game camera in motion (evidence sheets use a moved camera and stepped frames, labelled).

Evidence: `development/loadout-interface/evidence/p10c/`.
