"""Independent interval, parent-preservation and identity check for16new edges."""
from pathlib import Path
import gzip,hashlib,json,math
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';read=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
a=read(D/'V02_Maintenance_Access_Admission.json');g=read(D/'V02_Maintenance_Movement_Graph.json');parent=read(D/'V02_Current_Movement_Graph.json');native=read(D/'V02_Maintenance_Access_Native.json');build=read(D/'V02_Maintenance_Access_Build.json');meta=read(D/'V02_Maintenance_Access_Metadata.json')
assert sha(D/'V02_Maintenance_Movement_Graph.json')==a['graphSHA256'];assert sha(D/'V02_Maintenance_AbilityRoute_Matrix.csv')==a['matrixSHA256'];assert sha(D/'V02_Current_Movement_Graph.json')==a['parentGraphSHA256']
assert g['nodes'][:len(parent['nodes'])]==parent['nodes']and g['edges'][:len(parent['edges'])]==parent['edges']
assert g['currentEntrySHA256']==a['entrySHA256']==native['entrySHA256']==build['entrySHA256']==sha(R/build['entry']);assert g['currentManifestSHA256']==a['manifestSHA256']==native['manifestSHA256']==build['manifestSHA256']==sha(R/build['manifest'])
assert len(g['nodes'])==146 and len(g['edges'])==313;assert len({n['id']for n in g['nodes']})==len(g['nodes']);assert len({e['id']for e in g['edges']})==len(g['edges'])
rows=json.loads(gzip.decompress((D/native['fullTrace']).read_bytes()))['trace'];assert sha(D/native['fullTrace'])==a['traceSHA256'];new={r['id']:r for r in meta['newEdges']}
def deviation(p,path):
 values=[]
 for left,right in zip(path,path[1:]):
  d=[right[k]-left[k]for k in range(3)];length=sum(v*v for v in d);t=min(1,max(0,sum((p[k]-left[k])*d[k]for k in range(3))/length))if length else 0
  values.append(math.sqrt(sum((p[k]-left[k]-t*d[k])**2 for k in range(3))))
 return min(values)
for item in a['admitted']:
 path=new[item['edge']]['path'];indices=item['orderedVertexFrames'];assert len(indices)==len(path)and all(b>c for c,b in zip(indices,indices[1:]));assert indices[0]==item['startFrame']and indices[-1]==item['endFrame'];assert abs(item['seconds']-(indices[-1]-indices[0])/60)<1e-9
 for i,p in zip(indices,path):
  actual=[rows[i]['p'][0],rows[i]['p'][1]-.42,rows[i]['p'][2]];assert math.dist(actual,p)<=a['toleranceMetres']+1e-9
 for i in range(indices[0],indices[-1]+1):
  r=rows[i];assert r['grounded']and r['trauma']==0 and r['releases']==native['initial']['releases'];assert deviation([r['p'][0],r['p'][1]-.42,r['p'][2]],path)<=a['continuousPathToleranceMetres']+1e-9
assert {r['edge']for r in a['admitted']}==set(new)
adj={r['id']:[]for r in g['nodes']}
for e in g['edges']:assert e['source']in adj and e['destination']in adj;adj[e['source']].append(e['destination'])
def reaches(start,target):
 pending=[start];seen=set()
 while pending:
  x=pending.pop()
  if x==target:return True
  if x in seen:continue
  seen.add(x);pending.extend(adj[x])
 return False
for y in [96,108,120]:assert reaches('W84_300','MAINT_PLANT'+str(y))and reaches('MAINT_PLANT'+str(y),'W84_300')
report={'status':'PASS independent16edge native admission, parent preservation and connected directed maintenance topology','entrySHA256':build['entrySHA256'],'manifestSHA256':build['manifestSHA256'],'admissionSHA256':sha(D/'V02_Maintenance_Access_Admission.json'),'graphSHA256':a['graphSHA256'],'parentNodesUnchanged':len(parent['nodes']),'parentEdgesUnchanged':len(parent['edges']),'newEdgesChecked':16,'limits':['Only maintenance edges are checked here; topology cannot certify other gameplay edges.']};(D/'V02_Maintenance_Access_Admission_Validation.json').write_text(json.dumps(report,indent=2)+'\n');print(report['status'])
