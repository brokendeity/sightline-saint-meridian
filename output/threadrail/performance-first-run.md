# Threadrail candidate performance

One Chromium/ANGLE Metal browser; sequential baseline/candidate runs. Both warmed for12s, then measured for60 wall-clock seconds at1280×800, device scale/pixel ratio/resolution scale1. The fixed camera and same standard-gamepad walking circle avoid adaptive-quality masking. City simulation remains active.

|Metric|v15 baseline|Threadrail candidate|
|---|---:|---:|
|Frame interval ms p50 / p95|8.30 / 9.80|8.30 / 9.30|
|Simulation CPU ms p50 / p95|1.10 / 5.20|1.30 / 5.30|
|Render submission CPU ms p50 / p95|1.90 / 2.40|1.90 / 2.20|
|Visible scene draw calls p50 / p95|171.00 / 177.00|172.00 / 178.00|

Median frame-time change: 0.00%; draw-call change: 1. Targets: <=10% median time increase and <=20 additional visible calls.

Dropped simulation: baseline 0.01s; candidate 0.18s. GPU timer availability: baseline true, candidate true. CPU submissions do not measure GPU completion.

Build hashes and renderer identity are in performance.json. The stress run is reported separately and is not used as a matched comparison. It uses fixture placement but simulated controller actions; it cannot establish physical-controller latency, exact original Forspoken fidelity, all chaining quality, or prolonged hardware thermal stability.

Stress peaks: 5 impulses, 51 VFX records, 3 rails, 32 debris; 374 simulation samples with an active combat action.

Errors: 0 matched errors; 0 stress errors.
