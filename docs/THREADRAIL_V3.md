# Threadrail V3 — replay integrity and city traversal validation

V3 keeps the Threadrail/Afterstep scope and controls from V2. The original Saint Meridian game, v15 traversal build and V1/V2 releases are protected by their recorded hashes. This update is a separate local release; the published V2 GitHub snapshot stays unchanged.

## Fixed behavior

- **Rail lifetime during Retrace:** all physical rails continue aging and validating their owners while Action Replay owns the actor. Rail movement does not overwrite replay movement. The V2 reproduction advanced the equipment clock by 0.35 s while rail time stayed frozen; the fixed clocks advance together.
- **Replay impulse farming:** recorded jumps and landings cannot supply fresh Afterstep resources. This protection follows inherited airborne velocity through the physical landing after a recording ends. A subsequent fresh player jump can bank normally. Reproduction recorded one extra landing impulse in V2; the fixed run keeps the existing IDs.
- **Controller banking:** holding View+LB permits A jump and Dpad-Down evade, so players can bank those actions without releasing the modifier. RT strikes remain owned by combat, and View+X still releases Retrace. Pause is available while View is held. A simulated standard controller exercises recording, release and completion.
- **Failure feedback:** lower-case rail errors such as `blocked-path` now appear in the F9 overlay's last-failure field. Invalid placement preserves the bank, strain and existing geometry.

## City coverage

The new acceptance suite finds real city geometry in four quadrants: four roads, four sidewalk curbs, four imported rooftops and four building walls. Only initial player/camera poses are fixtures. Subsequent transitions use normal keyboard input; the optional traversal course and fabricated impulse contacts are not used.

The 52 checks cover footfall banking/Drive, native jumps, rooftop precision placement, attach/slingshot/landing, wall entry/boost/kick/landing, blocked placement, Action Replay ownership/clock/resource integrity, pause/resume and thirty-second active rail expiry. The 11 controller checks cover jump/strike/evade banking, Retrace, fresh physical contacts after replay and modifier-safe pause. These are sampled routes, not exhaustive coverage of the city.

## Reproduce

```sh
python3 scripts/build_backspool_threadrail_candidate.py
python3 -m http.server 8766
python3 scripts/validate_threadrail.py --browser \
  --source-evidence '/Users/richardmpayi/Downloads/sight game rail/output/rea-forspoken'
node scripts/benchmark_threadrail.cjs
node scripts/benchmark_threadrail.cjs --soak-seconds 300
python3 scripts/promote_threadrail.py --version V3
```

Promotion requires the exact validated and measured candidate hash, all original chains, city/controller acceptance, the paired performance budget and the five-minute soak. Existing versioned files are never overwritten with different bytes. The builder still restores the prior traversal HTML even when baseline generation fails.

## Verification boundary

Physical controller/touchscreen playtesting and original Forspoken controller/IK equivalence remain unverified. The five-minute soak is one bounded Mac/browser run, not a thermal or device certification. Replay Route remains the approved four-second/eight-action prototype. No Naruto library, Blender, Unity, traffic actors or new source-game powers are changed.

## Five-minute endurance result

The 300-second Chromium/ANGLE Metal run alternated four 20-second phases: Flow/Drive, combat, rail/slingshot and controller-recorded jump/Retrace, with periodic destruction. Initial pose changes at phase boundaries are fixtures; movement inside each phase uses normal simulated controller input.

- Frame interval p50 / p95 / max: 8.3 / 9.6 / 150.1 ms.
- Simulation CPU p50 / p95 / max: 1.6 / 5.8 / 19.6 ms.
- Zero console errors, invalid state samples or movement-owner conflicts; nine Retrace releases exercised.
- Peaks: five banked impulses, three body silhouettes, two footfall marks and three rails, within their limits.
- Dropped simulation time: 0.0499 s overall. No frame exceeded 250 ms in this run.
- Sampled GPU resources rose during lazy initialization and destruction, reaching 320 geometries / 35 textures at 240 s and remaining at those counts at 260 s / 280 s; final counts 321 / 35. This short plateau is evidence, not a leak-free or thermal certification.

The first paired comparison met the median budget but contained a 348.7 ms candidate outlier and 0.1822 s dropped simulation time (baseline 0.0087 s). It is retained in `output/threadrail/performance-first-run.json`. A separate isolated comparison follows; it does not erase the first run.

## Accepted local release

Play `SIGHTLINE_BACKSPOOL_THREADRAIL_V3.html?capture=backspool` on port 8766. The release is byte-identical to the tested candidate (`66bbea3c3c0be5a09054676df6f1e8ddcabcf2ba197d7941846be148379ac124`). All 28 validation groups passed, retaining 119 Classic assertions, 19 presentation checks and eight input-driven movement chains alongside the 52 city and 11 controller cases.

The isolated matched 60-second runs kept frame p50 at 8.3 ms in both builds; frame p95 was 10.1 ms baseline and 9.7 ms candidate. Candidate maximum frame was 18.2 ms and dropped simulation time was 0.0000 s. Simulation CPU p50 was 1.1 → 1.3 ms. Visible draw-call p50 was 171 → 172. Both median-frame and draw-call budgets passed. The repeated baseline had its own 290 ms outlier; these measurements do not isolate host scheduling from engine causes, so occasional stalls remain unclassified. The subsequent 60-second active stress also passed with no console errors.

The installed develop-web-game Playwright client ran against active gameplay; its final screenshots and state were inspected. Only its browser backend was selected to ANGLE Metal by a local launcher; the client itself was unchanged. Desktop, portrait and landscape captures and overlay checks remain part of the presentation suite.

Evidence: `output/threadrail/acceptance-v3.json`, `release-v3.json`, `validation-run.json`, `city-routes/report.json`, `city-routes/v2-reproduction.json`, `controller-bank-report.json`, `performance.json`, `performance-first-run.json`, `soak.json` and `stock-v3-final/`. Original V2 evidence remains frozen in GitHub tag `update-2026-10-22-threadrail-v2`.

V3 is saved locally. No GitHub branch, tag, original game entrypoint or older release was overwritten.
