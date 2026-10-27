"""Calibrate a separate current graph against actual movement event boundaries.

Original design graphs and active geometry remain immutable. This export has
measured timings for thirteen discrete ability phases, including the nine old
null timings. Other edges remain proposals or retain their separate evidence;
changing an endpoint does not automatically certify an adjoining route.
"""
from pathlib import Path
import copy,csv,gzip,hashlib,json,math
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();read=lambda p:json.loads(p.read_text())
parent=D/'V02_Transit_Movement_Graph.json';source=read(parent);graph=copy.deepcopy(source)
timingFile=D/'V02_Current_Route_Event_Timings.json';timing=read(timingFile);assert timing['status'].startswith('PASS')
manifest=read(R/timing['manifest']);assert sha(R/timing['entry'])==timing['entrySHA256'] and sha(R/timing['manifest'])==timing['manifestSHA256']
nodes={n['id']:n for n in graph['nodes']};edges={e['id']:e for e in graph['edges']}
for n in manifest['navigation']['nodes']:
 if n['id']not in nodes:node=copy.deepcopy(n);nodes[n['id']]=node;graph['nodes'].append(node)
for e in manifest['navigation']['edges']:
 if e['id']not in edges:edge=copy.deepcopy(e);edges[e['id']]=edge;graph['edges'].append(edge)
originalNodes={id:copy.deepcopy(n['position'])for id,n in nodes.items()}
canonical={}
for record in timing['records']:
 if record['run'].endswith('zero')or record['edgeID']=='E0250':canonical[record['edgeID']]=record
assert len(canonical)==13
# Large mismatches are corrected in the new graph, never hidden inside a wider
# admission radius. Surface attachment positions are retained separately from
# the player's blended catch pose. Small deviations retain a0.35m capture region.
changes=[]
for id in ['E0230','E0233','E0246','E0247','E0248']:
 e=edges[id];r=canonical[id]
 for key,actual in [('source',r['actualStartFoot']),('destination',r['actualEndFoot'])]:
  n=nodes[e[key]];before=n['position']
  if math.dist(before,actual)>.35:
   changes.append({'nodeID':n['id'],'before':copy.deepcopy(before),'after':copy.deepcopy(actual),'edgeID':id,'run':r['run'],'reason':'Replace nominal point with actual native event/catch/landing boundary; no geometry or power limit change'})
   n['position']=copy.deepcopy(actual);n['layer']=actual[1];n['sourcePlannedPosition']=copy.deepcopy(before)
   n['supportStatus']='Executed native movement event; sampled original-rig pose and exact route capture remain separate'
assert len(changes)==6,changes
cache={}
def trace(name):
 if name not in cache:
  s=timing['sources'][name];p=D/s['trace'];assert sha(p)==s['traceSHA256'];cache[name]=json.loads(gzip.decompress(p.read_bytes()))['trace']
 return cache[name]
for e in graph['edges']:
 id=e['id'];e['validation']={'input':'NOT ADMITTED by this export; retained source evidence is separate','geometry':'Actual manifest/source placement; whole-edge clearance and input admission are separate'}
 if id in canonical:
  r=canonical[id];ts=trace(r['run'])[r['beginFrame']-1:r['endFrame']]
  e['sourceDesignPath']=copy.deepcopy(e['path']);e['path']=[[t['p'][0],t['p'][1]-.42,t['p'][2]]for t in ts]
  assert math.dist(e['path'][0],nodes[e['source']]['position'])<.35,(id,'start')
  assert math.dist(e['path'][-1],nodes[e['destination']]['position'])<.35,(id,'end')
  variants=[copy.deepcopy(v)for v in timing['records']if v['edgeID']==id]
  for v in variants:
   assert math.dist(v['actualStartFoot'],nodes[e['source']]['position'])<.35
   assert math.dist(v['actualEndFoot'],nodes[e['destination']]['position'])<.35
  e.update(expectedSeconds=r['inputSeconds'],timeEvidence='Measured normal-input native event interval on current combined build;60Hz input-step time, not wall-clock/human performance',
   phaseTimings=variants,nodeCaptureRadius=.35,pathSemantics='Observed60Hz actor-foot trajectory, not a teleport or steering script',
   endpointPolicy='Source/destination capture regions around measured native event boundaries; physical attachments remain distinct',
   validation={'input':'PASS measured canonical normal-input phase and listed variants only','geometry':'Actual executed movement on hash-bound current manifest; no universal corridor/variant certification'})
  if e['ability']=='threadrail':e['sourcePlannedAttachmentPosition']=originalNodes[e['source']];e['nativeRailStartAuthority']=r['railStartAuthority']
 else:
  changed=[]
  for index,key in [(0,'source'),(-1,'destination')]:
   if nodes[e[key]]['position']!=originalNodes[e[key]]:
    changed.append(e[key]);e['path'][index]=copy.deepcopy(nodes[e[key]]['position'])
  if changed:e['endpointCalibrationPendingInput']=changed
 path=e['path'];e['elevationChange']=nodes[e['destination']]['position'][1]-nodes[e['source']]['position'][1]
 e['horizontalDistance']=sum(math.hypot(b[0]-a[0],b[2]-a[2])for a,b in zip(path,path[1:]));e['distance3D']=sum(math.dist(a,b)for a,b in zip(path,path[1:]))
 if e.get('endpointCalibrationPendingInput'):
  e['sourceExpectedSeconds']=e.get('expectedSeconds')
  speed=16.36 if e['ability']=='flow-run'else 1.65 if e['ability']in ['walk','stairs']else 6.6
  e['expectedSeconds']=e['horizontalDistance']/speed
  e['timeEvidence']='Recomputed geometric planning estimate after endpoint calibration; NOT stopwatch measured or input-admitted'
 e.setdefault('requiredAfterstepImpulses',0);e.setdefault('requiredReplaySlots',0);e.setdefault('directionality','directed')
 e.setdefault('difficulty','public');e.setdefault('risk','low');e.setdefault('failureRecovery','Return over the same supported public connection')
 assert e.get('expectedSeconds') is not None,(id,'Missing timing')
for approach in graph['stationApproaches']:
 prefix={'A-public':'public-','B-momentum':'momentum-','C-mastery':'mastery-'}[approach['id']]
 routes=read(D/'V02_Current_Station_Routes.json')
 approach['currentInputEvidence']=[j for j in routes['jobs']if j['name'].startswith(prefix)]
 assert len(approach['currentInputEvidence'])==2
 approach['inputValidation']='PASS two listed complete current normal-input approaches; exact individual graph-edge admission remains separate'
graph.update(schema='sm-v02-current-calibrated-movement-1',status='PARTIAL ADMISSION: thirteen current native ability phases timed; public/remaining edge admission remains separate',
 authority='Current combined geometry and retained normal-input event traces; original design graphs immutable',
 currentEntry=timing['entry'],currentEntrySHA256=timing['entrySHA256'],currentManifest=timing['manifest'],currentManifestSHA256=timing['manifestSHA256'],
 sourceTransitGraphSHA256=sha(parent),eventTimingReportSHA256=sha(timingFile),sourceBuilderSHA256=sha(Path(__file__)),
 nodeCalibrations=changes,measuredAbilityEdges=list(canonical),formerlyNullTimingsFilled=9,
 runtimeUse='Separate design/evidence export. Active game manifest and gameplay routing are unchanged; no automatic global admission.',
 remainingGates=['Individually admit the other graph edges and endpoint-adjusted adjoining approaches','Current complete encounter/replay/destruction/failure-path regressions',
  'Final approved-reference architecture/material/lighting quality','Current combined>=60second performance and fixed-resolution/GPU-aware release measurements','Physical controller/touchscreen review'])
topology={k:[{f:v[f]for f in (['id','position']if k=='nodes'else['id','source','destination','ability','path'])}for v in graph[k]]for k in ['nodes','edges']}
graph['topologySHA256']=hashlib.sha256(json.dumps(topology,sort_keys=True,separators=(',',':')).encode()).hexdigest()
assert sha(parent)==graph['sourceTransitGraphSHA256'];assert sha(R/timing['manifest'])==graph['currentManifestSHA256']
(D/'V02_Current_Movement_Graph.json').write_text(json.dumps(graph,indent=2)+'\n')
fields=['id','source','destination','ability','elevationChange','horizontalDistance','distance3D','requiredAfterstepImpulses','requiredReplaySlots','expectedSeconds','timeEvidence','difficulty','risk','failureRecovery','validation']
with(D/'V02_Current_AbilityRoute_Matrix.csv').open('w',newline='')as f:
 w=csv.DictWriter(f,fieldnames=fields,lineterminator="\n");w.writeheader();w.writerows({k:json.dumps(e.get(k))if isinstance(e.get(k),dict)else e.get(k)for k in fields}for e in graph['edges'])
print(graph['status']);print(len(nodes),'nodes',len(edges),'edges',len(changes),'calibrated nodes')
