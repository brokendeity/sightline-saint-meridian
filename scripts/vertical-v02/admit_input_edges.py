"""Overlay observed, ordered ground passages on the proposed design graph.

Never changes authored geometry or silently certifies untested abilities. A
passing complete route does not imply that every edge in its vicinity passed.
"""
from pathlib import Path
import json,gzip,hashlib,math,itertools,collections
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
eh=sha(R/'SIGHTLINE_SAINT_MERIDIAN_V02_GRAYBOX.html');mh=sha(R/'assets/city/vertical-v02/graybox/manifest.json')
graph_path=D/'V02_Movement_Graph.json';graph=json.loads(graph_path.read_text());CELL=.75
def key(p):return tuple(math.floor(v/CELL)for v in p)
def dist(a,b):return math.dist(a,b)
def samples(poly,step=.4):
 out=[poly[0]]
 for a,b in zip(poly,poly[1:]):
  n=max(1,math.ceil(dist(a,b)/step))
  out += [[a[k]+(b[k]-a[k])*i/n for k in range(3)]for i in range(1,n+1)]
 return out
def line_distance(p,a,b):
 d=[b[k]-a[k]for k in range(3)];den=sum(v*v for v in d)
 t=max(0,min(1,sum((p[k]-a[k])*d[k]for k in range(3))/den))if den else 0
 return dist(p,[a[k]+d[k]*t for k in range(3)])
traces=[];skipped=[]
files=['V02_Loop_Validation.json','V02_Public_Route_Validation.json','V02_Public_Route_Run_Validation.json','V02_Public_Roundtrip_Validation.json','V02_Service_Encounter.json','V02_Market_Rescue_Public.json','V02_Market_Rescue_South.json','V02_Pursuit_intercept.json','V02_Pursuit_chase.json','V02_Pursuit_intercept_ground.json','V02_Discovery_Tour.json']
for name in files:
 p=D/name
 if not p.exists():skipped.append({'file':name,'reason':'missing'});continue
 report=json.loads(p.read_text())
 if report.get('entrySHA256')!=eh or report.get('manifestSHA256')!=mh or report.get('errors'):
  skipped.append({'file':name,'reason':'stale runtime hashes or errors'});continue
 if not report.get('fullTrace'):
  skipped.append({'file':name,'reason':'no complete input trace'});continue
 raw=json.load(gzip.open(D/report['fullTrace']))
 groups=[(r['id'],r['trace'])for r in raw['results']if r.get('pass')and 'trace'in r]if name=='V02_Loop_Validation.json'else [('route',raw.get('trace',[]))]if report.get('status','').startswith('PASS')else []
 for label,rows in groups:
  if not rows:continue
  positions=[];grid=collections.defaultdict(list)
  for frame,row in enumerate(rows):
   p=row.get('p',row.get('pos'));p=[p[0],p[1]-.42,p[2]];positions.append(p)
   if row.get('grounded'):grid[key(p)].append(frame)
  traces.append({'id':name+':'+label,'positions':positions,'rows':rows,'grid':grid,'source':report['fullTrace'],'sha256':sha(D/report['fullTrace'])})
def nearby(trace,p,radius):
 cell=key(p);found=[]
 for off in itertools.product([-1,0,1],repeat=3):
  for frame in trace['grid'].get(tuple(cell[i]+off[i]for i in range(3)),[]):
   if dist(trace['positions'][frame],p)<=radius:found.append(frame)
 return sorted(found)
def match(edge,trace):
 poly=edge['path'];probe=samples(poly);radius=.7 if edge['ability']=='stairs'else .45
 matches=[nearby(trace,p,radius)for p in probe]
 if any(not m for m in matches):return None
 starts=matches[0];starts=[v for i,v in enumerate(starts)if i==0 or v>starts[i-1]+1]
 for start in starts:
  cursor=start;valid=True
  for candidates in matches[1:]:
   cursor=next((f for f in candidates if f>=cursor),None)
   if cursor is None:valid=False;break
  if not valid or cursor<=start:continue
  rows=trace['rows'][start:cursor+1];points=trace['positions'][start:cursor+1]
  if any(not r.get('grounded')for r in rows):continue
  # Reject a distant detour or stitched visits through the same endpoint.
  if any(min(line_distance(p,a,b)for a,b in zip(poly,poly[1:]))>radius+.05 for p in points):continue
  if any(r.get('action')for r in rows):continue
  # Some encounter traces record positions but not velocity. Never treat an
  # absent velocity as zero; include measured frame-to-frame horizontal travel.
  observed_speed=max((math.hypot(b[0]-a[0],b[2]-a[2])*60 for a,b in zip(points,points[1:])),default=0)
  reported_speed=max((math.hypot(*(r.get('v',r.get('vel'))[i]for i in [0,2]))for r in rows if r.get('v',r.get('vel'))is not None),default=0)
  max_speed=max(observed_speed,reported_speed)
  if edge['ability']=='walk'and max_speed>1.7:continue
  if edge['ability']in ['run','stairs']and max_speed>6.7:continue
  if edge['ability']=='flow-run'and max_speed<7:continue
  if any(dist(a,b)>.8 or abs(b[1]-a[1])>.201 for a,b in zip(points,points[1:])):continue
  return {'trace':trace['id'],'completeTrace':trace['source'],'traceSHA256':trace['sha256'],'startFrame':start,'endFrame':cursor,'seconds':(cursor-start)/60,'actualDistance':sum(dist(a,b)for a,b in zip(points,points[1:])),'maximumHorizontalSpeed':max_speed,'endpointTolerance':radius,'method':'ordered supported input passage within authored path corridor; not a new sweep or visual-camera certificate'}
 return None
rows=[]
for edge in graph['edges']:
 rec={'id':edge['id'],'source':edge['source'],'destination':edge['destination'],'ability':edge['ability'],'agent':edge['traversalAgent'],'status':'NOT ADMITTED','evidence':None}
 if edge['traversalAgent']!='player':rec['reason']='actor-specific behavior requires separate route and encounter evidence'
 elif edge['ability']not in ['walk','run','stairs','flow-run']:rec['reason']='ability-specific contacts, resources and trajectory need separate admission'
 else:
  rec['evidence']=next((result for t in traces if(result:=match(edge,t))),None)
  if rec['evidence']:rec['status']='PASS observed ground passage'
  else:rec['reason']='no matching complete ordered passage in current hash-bound input evidence'
 rows.append(rec)
report={'status':'PARTIAL edge admission overlay; not full district acceptance','entrySHA256':eh,'manifestSHA256':mh,'designGraphSHA256':sha(graph_path),'scope':'Only input-observed directed ground edges. Stair polylines are circulation corridors, not planted-foot meshes. Abilities, NPCs, camera, train and failure recovery retain separate gates. Design graph is immutable to this tool.','edges':rows,'admitted':sum(r['status'].startswith('PASS')for r in rows),'total':len(rows),'currentInputTraces':len(traces),'skipped':skipped}
(D/'V02_Input_Edge_Admission.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({k:report[k]for k in ['status','admitted','total','currentInputTraces']},indent=2))
