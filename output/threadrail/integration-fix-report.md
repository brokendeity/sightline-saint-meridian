# Integration repair evidence

The six adapter findings in `integration-review.md` are resolved in the equipment candidate. The previous main game, v15 HTML and historical Git refs are preserved.

| Finding | Repair | Executed evidence |
|---|---|---|
| Idle rail overwrote gravity and momentum | Apply non-owning rail velocity only on an attached-to-detached transition | Ordinary jump ascent/apex/descent; six-frame gravity and Drive persistence; slingshot to supported contact |
| Transfer always selected the current rail | Exclude it, use the separate 3 m transfer reach, and sweep a 120 ms approach | Actual R transfer from 2.5 m; remains attached after another 80 frames; invalid transfer preserves momentum |
| Committed traversal swallowed a paid Drive | Validate movement ownership before spending; permit stable wall/ledge and authored recovery handoffs | Exact resource preservation during ladder, vault, mantle, roll/flip startup, guard, combat and stagger; accepted wall/flip/roll recovery retains physical motion |
| Classic chord fell through to old free tether | Consume the complete chord and disable experimental free movement entrypoints only in this candidate | Held/released Classic chord; direct-entry rejection; repeated evade cannot become the old teleport |
| Speed caps consumed resources for zero motion | Validate the final bounded velocity; core commits that applied delta | Both caps preserve exact bank IDs, expiry, strain, events and exhaust; partial-cap success reports the actual 2 m/s change |
| Mobile route buttons were unavailable | Expandable touch options, 44 px route controls, landscape grid and panel placement | Real Record/Replay taps at 430×932 and 932×430; character remains visible in final captures |

Minor repairs: preset-aware View+LB/Alt teaching labels, rollback restoration in `finally`, and contact-phase tracking reset on lifecycle changes. New course roof pads provide collision-checked run-up distance after a vault; no existing building was moved. The optional wall has sufficient depth for a physical side-face run and boost.

`fix-regression-report.json` contains 40 focused checks. `chain-report.json` summarizes all eight required input chains; complete position/velocity/contact traces are retained in `chain-report.json.gz`. Each independent chain reloads its world before fixture placement, resolves imported city and roads, and then uses normal key/mouse actions. Fixtures are initial test locations and camera directions; they do not move the actor during a chain. The vault-to-roof case waits for the actual 1.65 s source-owned vault to finish and then tests real swept Drive/jump motion.

The final retained result is copied into `retained-report.json`: 44 combat, 28 integration, 11 defense, 14 power-edge, 9 controller and 13 lesson assertions, all passing (119 total). The validation runner also preserves the v15 flip/roll/landing suite, 48 source/numeric checks, source admission, core resource/rail/route checks and ordinary browser input/replay flows.

Final exact build hashes, commands and outcomes are in `validation-run.json` and `candidate-manifest.json`. Matched rendering and active stress measurements are in `performance.json` / `performance.md`; earlier pre-fix timings are not substituted for final-build evidence. Final captures include neutral idle, Drive rear/side, braking, rail contact, portrait and landscape. The stock development-game Playwright client also ran against active gameplay.

No original-controller or original-IK equivalence is claimed. Physical controller and touchscreen hardware, arbitrary city routes and long thermal-load sessions remain release playtests. This repair was reviewed locally against the original findings and executed regressions; no fresh independent approval is claimed.
