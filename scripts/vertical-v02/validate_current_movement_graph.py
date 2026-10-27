"""Independent saved graph/trace check; not a new gameplay execution."""
from pathlib import Path
import gzip,hashlib,json,math
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();read=lambda p:json.loads(p.read_text())
graphFile=D/'V02_Current_Movement_Graph.json';g=read(graphFile);parent=read(D/'V02_Transit_Movement_Graph.json')
assert sha(D/'V02_Transit_Movement_Graph.json')==g['sourceTransitGraphSHA256']
assert sha(R/g['currentEntry'])==g['currentEntrySHA256'] and sha(R/g['currentManifest'])==g['currentManifestSHA256']
timingFile=D/'V02_Current_Route_Event_Timings.json';timings=read(timingFile);assert sha(timingFile)==g['eventTimingReportSHA256']
assert sha(R/'scripts/vertical-v02/build_current_movement_graph.py')==g['sourceBuilderSHA256']
nodes={n['id']:n for n in g['nodes']};edges={e['id']:e for e in g['edges']};old={e['id']:e for e in parent['edges']}
assert len(nodes)==len(g['nodes'])==138 and len(edges)==len(g['edges'])==297
measured=set(g['measuredAbilityEdges']);assert len(measured)==13
formerlyNull={e['id']for e in parent['edges']if e['expectedSeconds']is None};assert len(formerlyNull)==9 and formerlyNull<=measured
changes={c['nodeID']:c for c in g['nodeCalibrations']};assert len(changes)==6
oldNodes={n['id']:n for n in parent['nodes']}
for id,node in oldNodes.items():
 if id in changes:
  assert changes[id]['before']==node['position'] and changes[id]['after']==nodes[id]['position']
  assert math.dist(changes[id]['before'],changes[id]['after'])>.35
 else:assert nodes[id]==node,(id,'Unrelated source node changed')
cache={};checks=[]
for id,e in edges.items():
 assert e['source']in nodes and e['destination']in nodes and len(e['path'])>=2
 radius=e.get('nodeCaptureRadius',.011)
 assert math.dist(e['path'][0],nodes[e['source']]['position'])<radius,(id,'source mismatch')
 assert math.dist(e['path'][-1],nodes[e['destination']]['position'])<radius,(id,'destination mismatch')
 assert isinstance(e['expectedSeconds'],(int,float))and e['expectedSeconds']>0
 actual=sum(math.dist(a,b)for a,b in zip(e['path'],e['path'][1:]));assert abs(actual-e['distance3D'])<1e-7
 if id not in measured:
  assert not e['validation']['input'].startswith('PASS'),'Non-measured edge falsely admitted'
  if e.get('endpointCalibrationPendingInput'):assert e['sourceExpectedSeconds']==old[id]['expectedSeconds'] and 'NOT stopwatch'in e['timeEvidence']
  continue
 for v in e['phaseTimings']:
  name=v['run'];source=timings['sources'][name]
  if name not in cache:
   p=D/source['trace'];assert sha(p)==source['traceSHA256'];r=json.loads(gzip.decompress(p.read_bytes()));assert r['status'].startswith('PASS')and not r['errors']and not r.get('failure');cache[name]=r['trace']
  trace=cache[name];a=v['beginFrame']-1;b=v['endFrame']-1;assert 0<=a<b<len(trace)
  p,q=trace[a],trace[b];foot=lambda t:[t['p'][0],t['p'][1]-.42,t['p'][2]]
  assert v['actualStartFoot']==foot(p)and v['actualEndFoot']==foot(q)
  assert abs(v['inputSeconds']-(b-a)/60)<1e-9 and abs(v['sequenceClockSeconds']-(q['clock']-p['clock']))<1e-9
  assert math.dist(foot(p),nodes[e['source']]['position'])<.35 and math.dist(foot(q),nodes[e['destination']]['position'])<.35
  assert all(t['trauma']==0 for t in trace[a:b+1])
  if e['ability']=='threadrail':
   assert p['rail']and (a==0 or not trace[a-1]['rail'])and not q['rail']and trace[b-1]['rail']
   assert q['message']=='PERFECT RAIL POP'
  elif e['ability']=='rail-pop':assert p['message']=='PERFECT RAIL POP'and q['grounded']and not trace[b-1]['grounded']
  elif e['ability']=='wall-climb':assert p['grounded']and q['grounded']and any(t['advanced']['kind']=='wall'for t in trace[a:b+1])
  elif id in ['E0249','E0250']:
   assert p['grounded']and q['grounded']and math.dist(foot(p),oldNodes[old[id]['source']]['position'])<.2
   assert math.dist(foot(q),oldNodes[old[id]['destination']]['position'])<.2
  if id=='E0250':assert len(v['releases'])==1 and v['releases'][0]['mode']=='brake'and v['releases'][0]['spent']
  elif id in ['E0249','E0248']:assert not v['releases']
  checks.append({'edgeID':id,'run':name,'seconds':v['inputSeconds'],'startNodeDistance':math.dist(foot(p),nodes[e['source']]['position']),'endNodeDistance':math.dist(foot(q),nodes[e['destination']]['position'])})
 assert any(abs(v['inputSeconds']-e['expectedSeconds'])<1e-9 for v in e['phaseTimings'])
# Public topology still connects all three circulation levels and the station.
adj={id:[]for id in nodes}
for e in edges.values():
 if e['ability']in ['run','walk','stairs']and not e['requiredAfterstepImpulses']:adj[e['source']].append(e['destination'])
def reaches(a,b):
 seen={a};queue=[a]
 for p in queue:
  for q in adj[p]:
   if q not in seen:seen.add(q);queue.append(q)
 return b in seen
for target in ['W24_300','W52_300','W84_300','W128_430','station-concourse']:
 assert reaches('ground-access',target)and reaches(target,'ground-access')
result={'status':'PASS saved current graph,24 independent trace/event intervals and public directed connectivity; bounded admission only',
 'graphSHA256':sha(graphFile),'eventTimingReportSHA256':sha(timingFile),'validatorSHA256':sha(Path(__file__)),
 'nodes':len(nodes),'edges':len(edges),'measuredAbilityEdges':len(measured),'formerlyNullTimingsFilled':len(formerlyNull),
 'calibratedNodes':len(changes),'traceIntervals':checks,'publicGroundReturnTopology':True,
 'activeGameUnchanged':True,'limits':['This independently re-reads saved graph and original full traces; it is not another gameplay run.',
 'Only listed ability phases are individually admitted here. Endpoint-adjusted adjoining paths and the remaining public edges remain separate.',
 'A0.35m endpoint capture region reflects discrete60Hz input and supported native catches; the six larger source-plan discrepancies were explicitly corrected.',
 'Directed connectivity is not physical input certification. Full visual/gameplay/performance release remains incomplete.']}
assert len(checks)==24
(D/'V02_Current_Movement_Graph_Validation.json').write_text(json.dumps(result,indent=2)+'\n');print(result['status'])
