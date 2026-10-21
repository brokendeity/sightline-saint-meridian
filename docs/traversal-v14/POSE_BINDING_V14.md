# Forspoken biped binding, pose packet and writeback — v14

Continued from contact-controller-v13. The separate candidate now contains two additional recovered numeric routines and inspectable original-to-Backspool joint bindings. **The complete original contact solver and movement controller are not implemented or enabled.** Gameplay movement, grounding and the main game were not changed in this pass.

## Original biped bindings

Native `143ead050` reads the original setup's chain tables through `143eaca30` and `143eacc00`. The resolved nine-joint input order is:

`C_Hip, L_UpLeg, L_Leg, L_Foot, L_Toe, R_UpLeg, R_Leg, R_Foot, R_Toe`.

The original initializer `143f31d00` builds seven interleaved body-point indices at context offsets `0x1f0..0x208`: hip, left/right upper legs, left/right lower legs, left/right feet. Four foot-offset vectors and two lower-leg axis vectors occupy `0x140..0x190`. The setup's torso chain contains `C_Spine`, `C_Spine1`, `C_Spine2`, `C_Spine3`; the biped helper reads only the requested subset. These are actual setup references and native-reader relationships, not names assigned to nearby data.

Original rig indices remain separate from target indices. The browser adapter explicitly resolves the nine corresponding Mixamo bone names and snapshots them in Backspool **model space**. It rejects missing bones and non-unit relative scales. Its position fourth component is explicitly zero by adapter convention; this is not a recovered Frey runtime value.

Reproducer/data: `scripts/recover_forspoken_biped_bindings.py`, `output/rea-forspoken/original-biped-bindings-v14.json` and the hash-checked compressed candidate copy.

## Ported numeric routines

`ForspokenPoseKernels.bodyPacket()` implements `143f32cb0`: the adjusted hip, six leg/foot centers, four rotated foot offsets and two rotated lower-leg axes form a **13-vector packet**. It retains the native ordering of scaling and rotation, separate solver/actor scale factors and fourth-component handling. Required frame and probe vectors must be supplied by the caller; the API does not invent defaults or claim to generate original targets.

`ForspokenPoseKernels.writeback()` implements `143f34d30`: correction quaternions left-multiply model-space pose rotations; positions rotate before translation. Null rotation and translation pointers follow separate paths. The signed, one-based cutdown selection preserves skipped entries and repeated execution. The native routine updates buffers in place; this host API copies and validates them before returning results.

These buffers are **not Three.js local bone transforms**. Applying them directly to local bone positions would be an incorrect integration and could distort limb lengths. Neither routine is automatically applied to Backspool. Generation of the solver's correction buffers and their complete hierarchy/skin adapter remain open.

## Animation-message dispatch

The previously dynamic receiver is now identified:

1. `14342c3d0` constructs the animation runtime and the owner of its message container.
2. The Windows x64 call at `14342c646..668` supplies the pointer at `AnimationComponent+0x130`, plus eight bytes, as initialization argument five.
3. `1444783c0` stores that pointer at runtime `+0x258`.
4. `1444eabd0` constructs the embedded container using `144dc0650`, with validation callback `1444ea280`.
5. RTTI identifies its vtable `146d50ec8` as `MessageContainer`. Request, status and cancel methods are `144dc0420`, `144dc03e0` and `144dc0340`.

The request method stores a message and validation result. **It does not itself select a source motion.** The original graph's root-field-10 identifier directory contains exact matches for **83 of 94 action records**. It has 529 entries and can contain duplicate identifiers. The other 11 records, including six with zero actor-action IDs, remain visible. These matches establish identifier membership, not a recovered action-to-animation timeline.

Instruction regions, pseudocode hashes, graph offsets, unresolved records and this dispatch trace are retained in `output/rea-forspoken/native-pose-evidence-v14.json`. Eighteen native functions are bound to executable identity. Unwind-less leaf regions are explicitly labelled as bounded regions that may contain alignment. The executable was not run.

## Candidate access

**Animations → Biped bindings / pose buffers** displays the original order, original indices, explicit target-name bindings and packet-vector origins.

```js
await forspokenBipedBindingEvidence(); // immutable public copy
await forspokenPoseSnapshot();         // read-only current target model-space pose
ForspokenPoseKernels.bodyPacket(rotations, positions, binding, suppliedFrame);
ForspokenPoseKernels.writeback(rotations, positions, corrections, optionalSelection);
forspokenNativeState();
```

The binding asset loads on demand, verifies its build-bound SHA-256 and supports explicit retry after corruption/network failure. Snapshot and inspection do not move the actor or bones. The existing controller/contact inspector and public diagnostic functions remain available.

## Validation and preservation

- **48 unit checks pass**: 9 parameter/provenance, 6 new biped-binding, 13 scalar/input, 9 contact-frame and 11 new pose-packet/writeback checks. Pose tests include **600 independent-oracle correction cases** and no-op preservation of all **5,977 original source pose entries**. These are numeric/source-contract checks, not execution-equivalence certification against Windows gameplay.
- Browser checks verify corrupt-asset rejection/retry, defensive copies, actual target-name binding and no mutation of actor/bone state. **248 sampled poses across 31 admitted traversal roles** produce finite pose packets and preserve input buffers under no-op writeback. The packet tests supply explicit test probe/frame values; they do not certify original runtime probe values, garment contact or complete animation fidelity.
- All **119 retained combat, defense, replay and lesson assertions pass** with explicit city/road readiness and no page errors. Required stock Playwright game-client run completed. Desktop, portrait and landscape captures were opened and reviewed.
- No new sustained-performance, physical-controller or physical-touchscreen certification is claimed. New inspection work is on demand, not an added per-frame solver.
- v13 rollback and source hashes: `output/backspool-traversal/rollback/pose-binding-v14/`. Candidate built through `scripts/build_backspool_traversal_candidate.py`. Main game hash remains `58f8de3207eb6b5ff5289a0a636e079fe030bbe970761933da1e2890081d1063`. GitHub snapshots, Naruto library, Blender and Unity are unchanged.

## Still required

Recover the original runtime probe values and target-selection phases; complete `143f37eb0` and production of its pose corrections; resolve message consumption into graph transitions and source motion selection; validate the complete target model-space/hierarchy adapter before enabling writeback. The supplied Forspoken video remains the qualitative reference from v12; no new full frame-matched comparison was performed in this pass. Full-original-controller and full-original-IK flags remain false.
