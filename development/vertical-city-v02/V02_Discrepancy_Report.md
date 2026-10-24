# V02 live-world discrepancy report

Live source: `c3eacd02ba2dbc0c964f27e4c9ffe92b48118737`; entry SHA-256 `fac92161657cb93c8500d6afbc2900748b7cadfc015c019eeddf0366cdf070e4`.

310 index-mapped envelopes: 310 agree within 1 mm; 0 differ. Matching outer envelopes do not prove imported facade or roof equivalence.

## Proposed crossings
- V2-BR-L2: compound-box clear; gameplay not tested; deck conflicts 0, headroom conflicts 0. 17 local offsets pass box/headroom checks only.
- V2-BR-M1: conflict; deck conflicts 1, headroom conflicts 1. 14 local offsets pass box/headroom checks only.
- V2-BR-M2: compound-box clear; gameplay not tested; deck conflicts 0, headroom conflicts 0. 17 local offsets pass box/headroom checks only.
- V2-BR-H2: compound-box clear; gameplay not tested; deck conflicts 0, headroom conflicts 0. 23 local offsets pass box/headroom checks only.

## Side spines
- V2-SP-55-24: 0/44 5 m segments obstructed. Whole-span admission is unsuitable.
- V2-SP-55-52: 0/44 5 m segments obstructed. Whole-span admission is unsuitable.
- V2-SP-55-84: 0/44 5 m segments obstructed. Whole-span admission is unsuitable.
- V2-SP-105-24: 13/44 5 m segments obstructed. Whole-span admission is unsuitable.
- V2-SP-105-52: 13/44 5 m segments obstructed. Whole-span admission is unsuitable.
- V2-SP-105-84: 13/44 5 m segments obstructed. Whole-span admission is unsuitable.

## Export gaps and next work
Roof top candidates are collision-box projections, not accepted walkable surfaces. Mission export covers the initialized mission only. Spawn/reset source entrypoints need a separate catalog. Source families, exact normalized meshes and world transforms are exported, allowing later triangle-level checks. No proposed route is certified. No game geometry has been changed in this phase.
