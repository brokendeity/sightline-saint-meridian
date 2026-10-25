"""Check detailed graph/schema/export alignment, not native traversal fidelity."""
from pathlib import Path
import csv,hashlib,json,math
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
mp=R/'assets/city/vertical-v02/detailed/manifest.json';m=json.loads(mp.read_text())
gp=D/'V02_Detailed_Movement_Graph.json';g=json.loads(gp.read_text())
assert m['graphSHA256']==sha(gp)
assert g['sourceGraphSHA256']==sha(D/'V02_Movement_Graph.json')
assert g['sourceBuilderSHA256']==sha(R/'scripts/vertical-v02/build_detailed_graph.py')
nodes={n['id']:n for n in g['nodes']};edges={e['id']:e for e in g['edges']}
assert len(nodes)==len(g['nodes'])and len(edges)==len(g['edges'])
fields=['elevationChange','horizontalDistance','distance3D','requiredAfterstepImpulses','requiredReplaySlots',
        'expectedSeconds','timeEvidence','directionality','difficulty','risk','failureRecovery','validation']
unmeasured=[]
for e in edges.values():
    assert all(k in e for k in fields),e['id']
    assert e['directionality']=='directed'
    if e['expectedSeconds']is None:
        assert 'pending'in e['timeEvidence'] and e['ability']in ['threadrail','rail-pop','controlled-drop','afterstep-transfer']
        unmeasured.append({'id':e['id'],'ability':e['ability'],'reason':e['timeEvidence']})
    else:assert e['expectedSeconds']>=0
    assert e['requiredAfterstepImpulses']>=0 and e['requiredReplaySlots']>=0
    p=e['path'];assert math.dist(nodes[e['source']]['position'],p[0])<1e-6
    assert math.dist(nodes[e['destination']]['position'],p[-1])<1e-6
    assert abs(e['distance3D']-sum(math.dist(a,b)for a,b in zip(p,p[1:])))<1e-7
    assert abs(e['horizontalDistance']-sum(math.hypot(a[0]-b[0],a[2]-b[2])for a,b in zip(p,p[1:])))<1e-7
    assert abs(e['elevationChange']-(p[-1][1]-p[0][1]))<1e-7
    assert e['validation']['input'].startswith('NOT TESTED'), 'Do not silently inherit native certification'
for e in m['navigation']['edges']:assert e==edges[e['id']]
for n in m['navigation']['nodes']:assert n==nodes[n['id']]
matrix=list(csv.DictReader((D/'V02_Detailed_AbilityRoute_Matrix.csv').open()))
assert len(matrix)==len(edges) and {r['id']for r in matrix}==set(edges)
for row in matrix:
    for key in fields:
        actual=edges[row['id']][key]
        assert row[key]==(json.dumps(actual)if isinstance(actual,dict)else ''if actual is None else str(actual)),(row['id'],key)
for file in ['collisions.json','structure_ownership.json','threadrail_surfaces.json']:
    assert json.loads((mp.parent/file).read_text())['sourceManifestSHA256']==sha(mp)
report={'status':'PARTIAL detailed graph: schema/alignment passes; advanced-edge times remain unmeasured'if unmeasured else'PASS detailed graph schema/alignment',
 'scope':__doc__.strip(),'entrySHA256':sha(R/'SIGHTLINE_SAINT_MERIDIAN_V02_DETAILED.html'),
 'manifestSHA256':sha(mp),'graphSHA256':sha(gp),'nodes':len(nodes),'edges':len(edges),
 'publicRuntimeEdges':len(m['navigation']['edges']),'matrixRows':len(matrix),
 'unmeasuredTimings':unmeasured,'timingScope':'Preserve unknown original design values explicitly. Do not fabricate timings or count schema coverage as complete design acceptance.',
 'endpointRepairs':{'railAttachmentOffsets':'Explicit source attachment positions and two-centimetre floor access',
                    'recoveryDrop':'Separate108m landing atZ377 and ordinary grounded exit toZ375'},
 'nativeTraversalAcceptance':'Separate current input evidence is required; this check does not certify gameplay'}
(D/'V02_Detailed_Graph_Validation.json').write_text(json.dumps(report,indent=2)+'\n')
print(report['status'],len(edges),'edges')
