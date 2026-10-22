# Threadrail candidate performance

One Chromium/ANGLE Metal browser; sequential baseline/candidate runs. Both warmed for12s, then measured for60 wall-clock seconds at1280×800, device scale/pixel ratio/resolution scale1. The fixed camera and same standard-gamepad walking circle avoid adaptive-quality masking. City simulation remains active.

|Metric|v15 baseline|Threadrail candidate|
|---|---:|---:|
|Frame interval ms p50 / p95|8.30 / 9.60|8.30 / 9.70|
|Simulation CPU ms p50 / p95|1.00 / 5.40|1.20 / 5.50|
|Render submission CPU ms p50 / p95|1.80 / 2.10|1.80 / 2.10|
|Visible scene draw calls p50 / p95|169.00 / 173.00|171.00 / 177.00|

Median frame-time change: 0.00%; draw-call change: 2. Targets: <=10% median time increase and <=20 additional visible calls.

Dropped simulation: baseline 0.00s; candidate 0.00s. GPU timer availability: baseline true, candidate true. CPU submissions do not measure GPU completion.

Build hashes and renderer identity are in performance.json. The stress run is reported separately and is not used as a matched comparison. It uses fixture placement but simulated controller actions; it cannot establish physical-controller latency, exact original Forspoken fidelity, all chaining quality, or prolonged hardware thermal stability.

Stress peaks: 5 impulses, 33 VFX records, 3 rails, 32 debris; 374 simulation samples with an active combat action.

Errors: 0 matched errors; 0 stress errors.

Final stress duration: 60 s. Frame interval p50/p95: 8.30/9.40 ms; simulation CPU: 1.50/5.80 ms; render submission: 1.90/2.20 ms. Dropped simulation: 0.00 s. The recorded rail events confirm attachment followed by a slingshot jump.

Matched simulation CPU increased by 0.20 ms at the median (20%), despite unchanged frame-time median. GPU timer p50/p95: baseline 4.56/8.24 ms; candidate 4.42/7.23 ms. These measurements describe this Mac, renderer and test route, rather than a hardware-independent performance guarantee.
