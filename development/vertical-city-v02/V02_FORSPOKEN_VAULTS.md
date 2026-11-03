# V02 Forspoken motion v18: vaults and climbs graded by height

Candidate: `SIGHTLINE_SAINT_MERIDIAN_V02_FORSPOKEN_VAULTS.html`. It is built from the v17 strides candidate by `scripts/vertical-v02/build_forspoken_vaults_candidate.py`, which adds 7 inverse-verified hooks. The traversal controller, its swept paths and its durations (1.8 s vault, 1.599 s climb) are unchanged. The default checkpoint and older builds are unchanged.

## What changed

Before this build, every vault and every climb played the same clip, `vlt_ntl_over_base_h080a`; climbs used it as `mantle`. The six vault clips had already been retargeted in `traversal-source-vault-candidate.json.gz`, but only the 0.8 m one was in use. `scripts/build_backspool_forspoken_v18_segments.py` admits four more as segments, listed in `assets/backspool/traversal-forspoken-v18-segments.json`. Each is marked `replaceable`.

| Segment | Source clip | Window → played in | Used when |
|---|---|---|---|
| `vault` (existing) | `vlt_ntl_over_base_h080a` | 0–1.8 s → 1.8 s | Vault rise under 1 m |
| `vaultHigh` | `vlt_ntl_over_base_h120a` | 0–2.66 s → 1.8 s | Vault rise from 1 m up to the 1.25 m vault limit |
| `climbLow` | `vlt_ntl_up_base_h080a` | 0–1.5 s → 1.599 s | Climb rise under 1 m |
| `climbMid` | `vlt_ntl_up_base_h120a` | 0–2.1 s → 1.599 s | Climb rise from 1 m to 1.4 m |
| `climbHigh` | `vlt_ntl_up_base_h160a` | 0–2.1 s → 1.599 s | Climb rise from 1.4 m up to the 2.3 m climb limit |

- **Rise** is the obstacle height above the feet, recorded when the controller admits the obstacle. The segment is chosen once, when the vault or climb starts.
- **Climb windows** end once the clip is standing on the ledge.
- **Fallback:** `mantle` remains as a fallback if a segment is missing.

### Foot anchors

Each segment carries a visual foot anchor, using the same rule as the committed vault: the lowest skinned vertex, with the hips position held at its first key. `scripts/vertical-v02/measure_forspoken_vault_anchors.cjs` measures these in-game into `assets/backspool/forspoken-v18-vault-anchors.json`, and the builder converts them to segment time.

As a check on the method, re-measuring the committed 0.8 m vault matches its stored anchors to within 8.5 mm.

The pack clips have no `uuid`. Once parsed, each one needs its own, or the mixer reuses the first clip's action. The measuring script does this; the game's own `prepare()` already builds new clips.

## Evidence

- **Vault test** (`test_forspoken_vaults.cjs`): normal keyboard walk plus Jump into one labelled probe box per case, on the open plaza.

  | Case | Segment played | Finishes |
  |---|---|---|
  | 0.8 m vault | `vault` | past the box |
  | 1.15 m vault | `vaultHigh` | past the box |
  | 0.8 m climb | `climbLow` | on top |
  | 1.2 m climb | `climbMid` | on top |
  | 1.8 m climb | `climbHigh` | on top |

  The measured rise matches each box height, and there are no page errors.
- **Regressions on entry `8a0ff191`** (`evidence/forspoken-vaults-checks/`) all PASS:
  - 13 friendly wall-contact scenarios
  - the graded landing test (`evidence/forspoken-vaults-landing/`)
  - three city loops
  - six station approaches
  - the 12 retained encounter/replay/discovery cases (`evidence/forspoken-vaults-gameplay/`)
  - the v17 stride test

## Limits

- **`vlt_ntl_over_base_h160a` is not admitted:** the controller never vaults above 1.25 m.
- **Climbs above 1.6 m** (up to the 2.3 m limit) reuse the 1.6 m clip.
- **The windows are compressed or stretched** to fit the unchanged physics timing. The 1.2 m vault plays about 1.5× fast.
- **Windows and thresholds were chosen by visual review** of contact sheets.
- **Release:** these clips are derived from Forspoken and must be replaced before any public release (handoff §12).
- **Untested input:** nothing has been tested on a physical controller or touchscreen.
