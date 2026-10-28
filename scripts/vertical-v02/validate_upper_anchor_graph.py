"""Independent trace/identity checks for the separate upper-receiver graph."""
from pathlib import Path
import gzip,hashlib,json,math
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02'
read=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
file=D/'V02_Upper_Anchor_Movement_Graph.json';g=read(file);parent=D/'V02_Loggia_Movement_Graph.json';old=read(parent);b=read(D/'V02_Upper_Anchor_Build.json');a=g['upperAnchorAdmission']
assert sha(parent)==g['sourceGraphSHA256']
for field in ['entry','entrySHA256','manifest','manifestSHA256']:assert g['current'+field[0].upper()+field[1:]]==b[field]
assert sha(R/b['entry'])==b['entrySHA256']and sha(R/b['manifest'])==b['manifestSHA256']
suite=D/'V02_Upper_Anchor_Station_Routes.json';assert sha(suite)==a['suiteSHA256'];s=read(suite);assert s['status'].startswith('PASS')and len(s['jobs'])==6
assert len(g['nodes'])==len(old['nodes'])+2 and len(g['edges'])==len(old['edges'])
nodes={n['id']:n for n in g['nodes']};edges={e['id']:e for e in g['edges']};oldNodes={n['id']:n for n in old['nodes']}
assert len(nodes)==len(g['nodes'])and len(edges)==len(g['edges'])
changes={c['id']for c in a['nodeCalibrations']}
assert changes=={'high-rail-start','pop-launch','mastery-recovery-118'},changes
for id,n in oldNodes.items():
 if id not in changes:assert nodes[id]==n,id
 else:assert math.dist(nodes[id]['position'],n['position'])<3,id
assert {e['id']for e in old['edges']}==set(edges)
for run in ['mastery-zero','mastery-brake']:
 src=a['sources'][run];p=D/src['report'];t=D/src['trace'];assert sha(p)==src['reportSHA256']and sha(t)==src['traceSHA256'];r=read(p);trace=json.loads(gzip.decompress(t.read_bytes()))['trace']
 assert r['entrySHA256']==b['entrySHA256']and r['manifestSHA256']==b['manifestSHA256']
 for rec in [x for x in a['records']if x['run']==run]:
  ts=trace[rec['beginFrame']-1:rec['endFrame']];path=[[v['p'][0],v['p'][1]-.42,v['p'][2]]for v in ts]
  assert path[0]==rec['actualStartGroundReference']and path[-1]==rec['actualEndGroundReference']
  assert rec['inputSeconds']==(rec['endFrame']-rec['beginFrame'])/60
  assert abs(rec['travelMetres']-sum(math.dist(x,y)for x,y in zip(path,path[1:])))<1e-8
  assert all(v['trauma']==0 for v in ts)
  edge=edges[rec['edgeID']]
  assert math.dist(nodes[edge['source']]['position'],path[0])<.05
  assert math.dist(nodes[edge['destination']]['position'],path[-1])<.05
  if run=='mastery-zero':assert edge['path']==path
for oldEdge in old['edges']:
 e=edges[oldEdge['id']]
 if e['id']in ['E0246','E0247']:continue
 assert e['path']==oldEdge['path'],'Historical path was silently modified'
 assert 'PASS'not in e['validation']['input'],'Inherited input silently readmitted'
 if e['source']in changes or e['destination']in changes:assert e.get('endpointCalibrationPendingInput')
manifest=read(R/b['manifest'])
for mount in manifest['upperAnchorMounts']['mounts']:
 n=nodes[mount['id']+'-contact'];assert n['position']==mount['target']and n['normal']==mount['contactNormal']and n['expectedRailRoot']==mount['expectedRailRoot']
 assert not any(n['id']in [e['source'],e['destination']]for e in g['edges']),'Surface contacts cannot be walk nodes'
for approach in g['stationApproaches']:
 assert len(approach['currentInputEvidence'])==2
 assert all(x in s['jobs']for x in approach['currentInputEvidence'])
out={'status':'PASS separate graph identity, unchanged inherited topology, two exact current trace paths and distinct physical contact nodes','scope':'Only listed native phases admitted; no whole-graph or arbitrary-route certification','graphSHA256':sha(file),'validatorSHA256':sha(Path(__file__)),'nodes':len(nodes),'edges':len(edges),'admittedEdges':['E0246','E0247'],'contactNodes':a['contactNodes'],'changedPlayerNodes':sorted(changes)}
(D/'V02_Upper_Anchor_Graph_Validation.json').write_text(json.dumps(out,indent=2)+'\n');print(out['status'])
