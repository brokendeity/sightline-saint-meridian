# Threadrail candidate performance

One Chromium/ANGLE Metal browser; sequential baseline/candidate runs. Both warmed for12s, then measured for60 wall-clock seconds at1280×800, device scale/pixel ratio/resolution scale1. The fixed camera and same standard-gamepad walking circle avoid adaptive-quality masking. City simulation remains active.

|Metric|v15 baseline|Threadrail candidate|
|---|---:|---:|
|Frame interval ms p50 / p95|8.30 / 9.30|8.30 / 9.50|
|Simulation CPU ms p50 / p95|1.00 / 5.70|1.30 / 5.50|
|Render submission CPU ms p50 / p95|1.80 / 2.10|1.80 / 2.00|
|Visible scene draw calls p50 / p95|172.00 / 174.00|168.00 / 174.00|

Median frame-time change: 0.00%; draw-call change: -4. Targets: <=10% median time increase and <=20 additional visible calls.

Dropped simulation: baseline 0.00s; candidate 0.00s. GPU timer availability: baseline true, candidate true. CPU submissions do not measure GPU completion.

Build hashes and renderer identity are in performance.json. The stress run is reported separately and is not used as a matched comparison. It uses fixture placement but simulated controller actions; it cannot establish physical-controller latency, exact original Forspoken fidelity, all chaining quality, or prolonged hardware thermal stability.

Stress peaks: 5 impulses, 33 VFX records, 3 rails, 32 debris; 373 simulation samples with an active combat action.

Errors: 0 matched errors; 0 stress errors.

The final 60 s stress run reached 3 body silhouettes and 2 supported footfall marks; the silhouette/footfall batch is bounded to two draw calls. Peak CPU skin capture was 3.60 ms. Stress frame interval p50/p95 was 8.30/9.50 ms, simulation CPU 1.60/5.50 ms, with zero dropped simulation time. Matched simulation median increased from 1.00 to 1.30 ms; frame median stayed flat. GPU p50/p95: baseline 3.83/4.92 ms, candidate 4.01/5.39 ms. Dynamic city visibility contributes to draw-call variation; the negative median difference does not mean the effects are free.
