# Backspool Threadrail + Afterstep Drive — approved implementation contract

Source: user-approved plan in this chat and attachments 0d1cb35b-245c-4483-9cfd-187ff299cbc4, 9827f50b-1ddc-4b61-8b12-e78aee8430f3. Branch from snapshot-2026-10-21-pose-binding-v14-complete; carry v15 first (949ed83). Preserve old snapshots and main game. Candidate served on8766.

Tasks: A audit/baseline; B movement coordinator, seamless walls, neutral idle and toggle sprint; C automatic 5-slot impulse bank/Afterstep; D physical Threadrail; E eight required chains; F lower-back Temporal Exhaust, camera/input/HUD; G bounded Replay Route; H regressions, input browser tests, screenshots/performance, docs, commit.

Shared contracts: world vectors plain {x,y,z}; one runtime coordinator commits position, controllers return requests. Pure Afterstep core contact(event), update(dt,frame), release(mode,frame), state(), reset(reason); release returns ok/reason/deltaVelocity/spent/event and validates before consumption. Threadrail core validates endpoints/path through callbacks, manages finite topology, returns swept movement plan. Temporal Exhaust factory receives real confirmed contact/release events; never writes actor velocity.

Resources: capacity5, lifetime8s, running plant min250ms; no duplicates or synthetic re-banking. Full bank non-run may replace oldest run. Perfect window±60ms, imperfect strength70%; full costs standard8/directional10/launch14/ghost10/brake8, perfect75%cost. DoubleStep second release target320ms±60ms. Strain0..100, demanding releases blocked>=85, recovery8/s after1.5s. Max combined ground/rail28m/s. Bank cleared on lifecycle; strain persists across hero switch. Base ordinary parkour free.

Rails: physical scene-owned anchors, span6..100m, incline<=55deg, foursegments/eightanchors, life30s. Validate full actor sweep, support/owner and changes. No arbitrary midair origins. Momentum/gravity/friction uphill; junction<=75deg with projected speed; slingshots and transfers preserve safe momentum. Failed placement no teleport/freeze/consumption. Endpoints, destruction, expiry and interruption detach safely.

Input default: L3 togglesFlow, B togglesFlow in exploration/dodges in combat/detaches onrail; A jump; X quickrail/hold precision; RB Drive; LB holdDrivewheel; RTlight LTguard; DpadUpheavy Downalwaysdodge LRstates; R3lock; Yinteract. View+LBbank, +RBEcho, +XRetrace, +Upselect; hero chord L3+LT+RT+R3 consumed before all. Keyboard Shift/Ctrl Flow toggle; Spacejump; Cevade; Rrail/holdprecision; EDrive; Tabwheel; LMB/ RMBcombat; Qheavy;1..3states; Altlock; Finteract; G/H/J/Nexistingreplay. Touch equivalent controls. Classic selectable. Clear latches on pause/focusloss/disconnect/lifecycle. Sprint release no longer dashes.

Replace experimental unlimited magic inputs with resource-eligible Drive/physical rail equivalents; keep old source/motions in archives/previews. Neutral idle0x281116bb; combatstance only real combat context. OriginalIK/fullcontroller flags remain false; no unsafe modelspace->local bone writes. Rates0.85..1.4x and12cmcontact tolerance; v15 touch-down policies retained.

Temporal Exhaust: original lower-back device geometry preserved; stable bone-relative outlet. Cyan-white/pale violet slivers, brokenrings, brief slices/refraction; emission opposite actual applied deltaV (down for braking). Bank inwardshimmer; inactive invisible. Pools/lifetimes/cleanup, no fire/smoke/rockettrail/giantburst.

Replay Route: one route<=4s/8actions, reconnect1.35m; resource reservation/step consumption, unchanged expiry, real collision, interruption, no teleport. Reuse existing replay systems where appropriate.

Required chains: sprint>drive>jump>wallkick>land; sprint>autovault>drive>roofjump; jump>attach>grind>raildrive; grind>transfer>slingshot>aircontrol; wallrun>boost>rail>land; aerialdodge>rebound>land; sprint>bankfoot>rail>releasefoot; grind>combat>traversal.

Acceptance: applicable48unit/119retained/v15tests plus real input cases all resources, rail/owner failures and transitions; no NaNs/duplicates/camera clipping. Responsive captures; pooled effect bounds. Warmup plus matched60s performance, <=20visiblecalls/+10%median target, reportp95/GPUavailability honestly. No hardware claims. Deliver commit, files, controls, demo checklist, limitations, reproducible run.
