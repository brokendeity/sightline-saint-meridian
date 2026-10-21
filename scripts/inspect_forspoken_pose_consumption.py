#!/usr/bin/env python3
"""Document and algebra-test recovered no-scale skeletal pose consumer.
Static pseudocode: FUN_1444982e0 -> FUN_140507700 scalar path.
No motion files or game builds are rewritten by this script.
"""
import hashlib,json,math,struct
from pathlib import Path
from inspect_forspoken_amdl import qmul,qrotate
ROOT=Path('output/rea-forspoken')
IDENTITY=[0.,0.,0.,1.]
def consume(rig,rotations,translations):
    """Output model-space poses; root-motion values stay outside child accumulation.
    rotations: bone-index -> decoded delta quaternion, Trans index0 ignored in children.
    translations: bone-index -> decoded world-reference displacement to parent.
    This implements the recovered no-scale ordinary mode, not other processor modes.
    """
    bones=rig['bones'];n=len(bones)
    accum=[None]*n;worldq=[None]*n;worldt=[None]*n
    accum[0]=IDENTITY;worldq[0]=IDENTITY;worldt[0]=[0.,0.,0.]
    for bone in sorted(bones[1:],key=lambda x:x['depth']):
        i=bone['index'];p=bone['parent']
        accum[i]=qmul(accum[p],rotations.get(i,IDENTITY))
        worldq[i]=qmul(accum[i],bone['sourceRotationXYZW'])
        reference=translations[i]
        delta=qrotate(accum[p],reference)
        worldt[i]=[worldt[p][j]+delta[j] for j in range(3)]
    # Recovered function copies source root into slot0 only after finishing children.
    worldq[0]=rotations.get(0,IDENTITY)
    worldt[0]=translations.get(0,[0.,0.,0.])
    return dict(accumulatedDeltaRotations=accum,modelRotations=worldq,modelPositions=worldt)

def inspect():
    rig=json.loads((ROOT/'hu000-rig.json').read_text());b=(ROOT/'hu000.amdl').read_bytes()
    bind=rig['header']['bindPoseOffset'];ro=struct.unpack_from('<I',b,0x10c)[0];to=struct.unpack_from('<I',b,0x16c)[0]
    rotations={i:list(struct.unpack_from('<4f',b,bind+ro+16*i)) for i in range(len(rig['bones']))}
    translations={i:list(struct.unpack_from('<3f',b,bind+to+16*i)) for i in range(len(rig['bones']))}
    result=consume(rig,rotations,translations)
    errors=[math.dist(result['modelPositions'][i],bone['derivedWorldPosition']) for i,bone in enumerate(rig['bones'])]
    qerrors=[min(math.dist(result['modelRotations'][i],bone['sourceRotationXYZW']),math.dist([-x for x in result['modelRotations'][i]],bone['sourceRotationXYZW'])) for i,bone in enumerate(rig['bones'])]
    if max(errors)>0.00001 or max(qerrors)>0.00001:raise ValueError('Consumer fails recovered default rest pose')
    # Algebraic nonzero-delta comparison: matrix-inverse-bind expression versus reduced formula.
    synthetic={1:[0,math.sin(.35),0,math.cos(.35)],2:[math.sin(.2),0,0,math.cos(.2)]}
    moved=consume(rig,synthetic,translations);e=[]
    for bone in rig['bones'][1:]:
        i=bone['index'];p=bone['parent'];m=rig['bones'][p]['bindMatrix16'];t=translations[i]
        inverse_rest_applied=[sum(m[row+col*4]*t[col] for col in range(3)) for row in range(3)]
        code_delta=qrotate(moved['modelRotations'][p] if p else IDENTITY,inverse_rest_applied)
        simple_delta=qrotate(moved['accumulatedDeltaRotations'][p],t)
        e.append(math.dist(code_delta,simple_delta))
    if max(e)>0.00001:raise ValueError('Reduced translation expression fails source matrix algebra')
    exports=['1444982e0.c','140507700.c','14050f780.c','14050fff0.c']
    return dict(schema='forspoken-pose-consumption-v1',sourceRigSha256=rig['source']['sha256'],
      evidence=[dict(file=str(ROOT/'ghidra-pose-evidence'/f),sha256=hashlib.sha256((ROOT/'ghidra-pose-evidence'/f).read_bytes()).hexdigest()) for f in exports],
      formulas=dict(childDeltaWorld='deltaWorld[parent] * decodedDelta[bone]',
        childModelRotation='deltaWorld[bone] * originalRestWorldRotation[bone]',
        childModelPosition='modelPosition[parent] + rotate(deltaWorld[parent], decodedReferenceTranslation[bone])',
        initialRoot='identity delta, identity output rotation, zero translation during child traversal',
        finalRoot='decoded root rotation/translation copied into output slot0 after child traversal'),
      validation=dict(defaultPosePositionMaxError=max(errors),defaultPosePositionMeanError=sum(errors)/len(errors),
        defaultPoseQuaternionMaxError=max(qerrors),nonzeroDeltaMatrixReductionMaxError=max(e),
        decodedDefaultSkeletalRotationsAllIdentity=all(q==IDENTITY for i,q in rotations.items() if i)),
      applicability=dict(mode='FUN_140507700 ordinary no-scale full-skeleton scalar path',
        decodedRotationSpace='parent-composed deltas in shared model reference axes',
        decodedTranslationSpace='parent-relative displacement in shared model reference axes, not local-bone rest axes',
        originalGameplayExecuted=False,retargeted=False),
      unresolved=['Global actor/world transform and root-motion application beyond skeletal pass remain untraced.',
        'Scale-aware, cutdown, IK, physics, facial and post-skin behaviors not reconstructed by this script.',
        'Source coordinate handedness, world unit conversion and Backspool retargeting require separate validation.',
        'Algebraic source/default-pose agreement is not matched original-game footage verification.'])
if __name__=='__main__':
    result=inspect();(ROOT/'pose-consumption-report.json').write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps(result['validation'],indent=2))
