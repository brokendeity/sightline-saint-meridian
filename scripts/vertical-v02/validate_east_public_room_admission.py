"""Independently check saved graph intervals and bidirectional room links."""
from pathlib import Path
import gzip
import hashlib
import json
import math

R=Path(__file__).resolve().parents[2]
D=R/'development/vertical-city-v02'
read=lambda p:json.loads(p.read_text())
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
graph_file=D/'V02_East_Public_Room_Movement_Graph.json'
g=read(graph_file)
a=read(D/'V02_East_Public_Room_Admission.json')
b=read(D/'V02_East_Public_Emissive_Build.json')
e=g['eastPublicRoomAdmission']
parent=read(R/e['parentGraph'])
native=read(R/e['report'])
assert sha(graph_file)==a['graphSHA256']
assert sha(R/e['parentGraph'])==e['parentGraphSHA256']==a['parentGraphSHA256']
assert sha(R/e['report'])==e['reportSHA256']==a['nativeReportSHA256']
assert sha(R/e['traces'])==e['tracesSHA256']==native['tracesSHA256']
assert sha(R/b['entry'])==b['entrySHA256']==g['currentEntrySHA256']==native['entrySHA256']
assert sha(R/b['manifest'])==b['manifestSHA256']==g['currentManifestSHA256']==native['manifestSHA256']
assert g['nodes'][:len(parent['nodes'])]==parent['nodes']
assert g['edges'][:len(parent['edges'])]==parent['edges']
nodes={n['id']:n for n in g['nodes']}
edges={x['id']:x for x in g['edges']}
assert len(nodes)==len(g['nodes']) and len(edges)==len(g['edges'])
assert len(e['newNodeIDs'])==6 and len(e['newEdgeIDs'])==18
traces=json.loads(gzip.decompress((R/e['traces']).read_bytes()))
adj={n:[] for n in nodes}
for stable_id in e['newEdgeIDs']:
    edge=edges[stable_id]
    left,right=[nodes[edge[key]]['position'] for key in ['source','destination']]
    assert edge['path']==[left,right] and left[1]==right[1]
    assert edge['requiredAfterstepImpulses']==edge['requiredReplaySlots']==0
    adj[edge['source']].append(edge['destination'])
    assert len(edge['measuredEvidence'])==3
    for proof in edge['measuredEvidence']:
        trace=next(t['trace'] for t in traces if t['view']==proof['view'] and t['floor']==left[1])
        lo,hi=proof['beginFrame'],proof['endFrame']
        assert 0<=lo<hi<len(trace) and proof['seconds']==(hi-lo)/60
        points=[[r['position'][0],r['position'][1]-.42,r['position'][2]] for r in trace[lo:hi+1]]
        assert math.dist(left,points[0])<.25 and math.dist(right,points[-1])<.25
        axis=0 if left[2]==right[2] else 2
        cross=2-axis
        for r,p in zip(trace[lo:hi+1],points):
            assert abs(p[1]-left[1])<.03 and abs(p[cross]-left[cross])<.35
            assert min(left[axis],right[axis])-.35<p[axis]<max(left[axis],right[axis])+.35
            assert r['grounded'] and r['trauma']==0 and not r['cameraInside']
            assert all(bone['framed'] for bone in r['bones'])

def reachable(start,end):
    seen=set()
    todo=[start]
    while todo:
        n=todo.pop()
        if n==end:
            return True
        if n not in seen:
            seen.add(n)
            todo.extend(adj[n])
    return False

for floor in [24,52,84]:
    for gallery in [f'E{floor}_300',f'E{floor}_326']:
        assert reachable(gallery,f'EPR{floor}-room') and reachable(f'EPR{floor}-room',gallery)
report={'status':'PASS independent18edge intervals, unchanged parent graph and both-direction room/gallery connectivity',
    'entrySHA256':b['entrySHA256'],'manifestSHA256':b['manifestSHA256'],
    'graphSHA256':sha(graph_file),'validatorSHA256':sha(Path(__file__)),
    'newNodes':6,'newEdges':18,'measuredIntervals':54,
    'scope':'Listed player room branches only; inherited edges, NPC routes and full release remain separate.'}
(D/'V02_East_Public_Room_Admission_Validation.json').write_text(json.dumps(report,indent=2)+'\n')
print(report['status'])
