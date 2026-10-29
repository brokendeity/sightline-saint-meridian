"""Add measured public-room branches without recertifying the parent graph."""
from pathlib import Path
import copy
import gzip
import hashlib
import json
import math
import statistics

R=Path(__file__).resolve().parents[2]
D=R/'development/vertical-city-v02'
read=lambda p:json.loads(p.read_text())
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
build=read(D/'V02_East_Public_Emissive_Build.json')
native_file=D/'V02_East_Public_Emissive_Movement.json'
native=read(native_file)
assert native['status'].startswith('PASS') and not native.get('failure') and not native['errors']
assert native['entrySHA256']==build['entrySHA256']==sha(R/build['entry'])
assert native['manifestSHA256']==build['manifestSHA256']==sha(R/build['manifest'])
assert sha(R/native['traces'])==native['tracesSHA256']
traces=json.loads(gzip.decompress((R/native['traces']).read_bytes()))
parent_file=D/'V02_Upper_Anchor_Movement_Graph.json'
parent=read(parent_file)
graph=copy.deepcopy(parent)
new_nodes=[]
new_edges=[]
measurements=[]

def path_error(point,a,b):
    delta=[b[k]-a[k] for k in range(3)]
    square=sum(x*x for x in delta)
    t=max(0,min(1,sum((point[k]-a[k])*delta[k] for k in range(3))/square))
    return math.dist(point,[a[k]+t*delta[k] for k in range(3)])

for floor in [24,52,84]:
    junction=f'EPR{floor}-gallery'
    room=f'EPR{floor}-room'
    for stable_id,point,kind in [(junction,[96,floor,310],'public-gallery-junction'),
                                 (room,[102.1,floor,310],'public-waiting-room')]:
        new_nodes.append({'id':stable_id,'position':point,'layer':floor,'kind':kind,
            'structuralOwner':'v02:east-public-loggias',
            'validation':'Measured current normal-input proximity; support and source contacts checked separately'})
    pairs=[(f'E{floor}_300',junction,[96,floor,300],[96,floor,310]),
           (junction,room,[96,floor,310],[102.1,floor,310]),
           (room,junction,[102.1,floor,310],[96,floor,310]),
           (junction,f'E{floor}_326',[96,floor,310],[96,floor,326]),
           (f'E{floor}_326',junction,[96,floor,326],[96,floor,310]),
           (junction,f'E{floor}_300',[96,floor,310],[96,floor,300])]
    for segment,(source,destination,left,right) in enumerate(pairs):
        edge_id=f'EPR{floor}-{segment}'
        records=[]
        for case in [c for c in native['cases'] if c['floor']==floor]:
            trace=next(t['trace'] for t in traces if t['floor']==floor and t['view']==case['view'])
            assert len(case['waypoints'])==6
            end=case['waypoints'][segment]['frame']-1
            begin=case['waypoints'][segment-1]['frame']-1 if segment else 0
            rows=trace[begin:end+1]
            points=[[r['position'][0],r['position'][1]-.42,r['position'][2]] for r in rows]
            assert math.dist(points[0],left)<.25 and math.dist(points[-1],right)<.25
            assert all(r['grounded'] and r['trauma']==0 and not r['cameraInside'] and
                       all(b['framed'] for b in r['bones']) for r in rows)
            error=max(path_error(p,left,right) for p in points)
            assert error<.35,(edge_id,case['view'],error)
            rec={'edge':edge_id,'view':case['view'],'driver':case['driver'],'walking':case['walking'],
                 'beginFrame':begin,'endFrame':end,'seconds':(end-begin)/60,
                 'distanceMetres':sum(math.dist(a,b) for a,b in zip(points,points[1:])),
                 'maximumDeviationMetres':error}
            records.append(rec)
            measurements.append(rec)
        assert len(records)==3
        new_edges.append({'id':edge_id,'source':source,'destination':destination,'ability':'walk/run',
            'directionality':'directed','path':[left,right],'elevationChange':0,
            'horizontalDistance':math.dist(left,right),'distance3D':math.dist(left,right),
            'requiredAfterstepImpulses':0,'requiredReplaySlots':0,
            'expectedSeconds':statistics.median(r['seconds'] for r in records if not r['walking']),
            'timeEvidence':'Measured normal-input boundary interval, including waypoint settling; walking timing retained separately',
            'difficulty':'public','risk':'low','traversalAgent':'player',
            'failureRecovery':'Continuous supported gallery return through the same 3m entrance',
            'validation':{'input':'PASS three listed current keyboard/standard-controller-layout cases only',
                          'geometry':'Reopened-source room/guard opening, exact shipping geometry and native support'},
            'measuredEvidence':records})

graph['parentCurrentIdentity']={k:parent[k] for k in ['currentEntry','currentEntrySHA256','currentManifest','currentManifestSHA256']}
graph.update(schema='sm-v02-east-public-room-graph-1',
    status='PARTIAL ADMISSION:18new directed room passages; all parent edge evidence remains historical',
    currentEntry=build['entry'],currentEntrySHA256=build['entrySHA256'],
    currentManifest=build['manifest'],currentManifestSHA256=build['manifestSHA256'])
graph['nodes']+=new_nodes
graph['edges']+=new_edges
graph['eastPublicRoomAdmission']={'parentGraph':str(parent_file.relative_to(R)),
    'parentGraphSHA256':sha(parent_file),'report':str(native_file.relative_to(R)),
    'reportSHA256':sha(native_file),'traces':native['traces'],'tracesSHA256':native['tracesSHA256'],
    'builderSHA256':sha(Path(__file__)),'newNodeIDs':[n['id'] for n in new_nodes],
    'newEdgeIDs':[e['id'] for e in new_edges],
    'scope':'Only listed current directed passages admitted. Parent loops, ability routes and contacts retain their separately versioned evidence. No civilian route or release certification.'}
graph['publicConnectivity']={'status':'Counts include inherited topology; native current admission is per edge',
    'nodes':len(graph['nodes']),'edges':len(graph['edges'])}
out=D/'V02_East_Public_Room_Movement_Graph.json'
out.write_text(json.dumps(graph,indent=2)+'\n')
result={'status':'PASS18measured directed room passages; whole district and NPC admission remain separate',
    'entrySHA256':build['entrySHA256'],'manifestSHA256':build['manifestSHA256'],
    'graph':str(out.relative_to(R)),'graphSHA256':sha(out),
    'parentGraphSHA256':sha(parent_file),'nativeReportSHA256':sha(native_file),
    'measurements':measurements,'newNodes':len(new_nodes),'newEdges':len(new_edges)}
(D/'V02_East_Public_Room_Admission.json').write_text(json.dumps(result,indent=2)+'\n')
print(result['status'])
