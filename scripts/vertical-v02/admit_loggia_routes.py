"""Admit only ordered, continuously supported native loggia passages.

Runtime source proposals remain unchanged. This separate graph overlay binds
each admitted edge to the current build and a bounded interval of its trace.
"""
from pathlib import Path
import copy,csv,gzip,hashlib,json,math
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02'
read=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
native=read(D/'V02_Loggia_Terraces_Native.json');build=read(D/'V02_Loggia_Terraces_Build.json');assert native['status'].startswith('PASS')
raw=json.loads(gzip.decompress((D/native['fullTrace']).read_bytes()));assert sha(D/native['fullTrace'])==native['fullTraceSHA256']
metadata=read(D/'V02_Loggia_Terraces_Metadata.json');parent=read(D/'V02_Maintenance_Movement_Graph.json');graph=copy.deepcopy(parent)
rows=raw['trace'];points=[[r['p'][0],r['p'][1]-.42,r['p'][2]]for r in rows]
def distance_to_path(p,path):
 best=math.inf
 for a,b in zip(path,path[1:]):
  delta=[b[i]-a[i]for i in range(3)];square=sum(v*v for v in delta);t=max(0,min(1,sum((p[i]-a[i])*delta[i]for i in range(3))/square))if square>1e-10 else 0
  best=min(best,math.dist(p,[a[i]+t*delta[i]for i in range(3)]))
 return best
admitted=[]
for edge in metadata['newEdges']:
 path=edge['path'];near=[i for i,p in enumerate(points)if math.dist(p,path[0])<=.25];starts=[i for j,i in enumerate(near)if j==0 or i>near[j-1]+1];candidates=[]
 for start in starts:
  matches=[start];cursor=start;failed=False
  for target in path[1:]:
   found=False
   for cursor in range(cursor+1,len(points)):
    if not rows[cursor]['grounded']or rows[cursor]['trauma']!=0 or rows[cursor]['releases']!=native['initial']['releases']or distance_to_path(points[cursor],path)>.8:
     failed=True;break
    if math.dist(points[cursor],target)<=.25:matches.append(cursor);found=True;break
   if failed or not found:failed=True;break
  if not failed:candidates.append((cursor-start,matches))
 assert candidates,('No continuous ordered supported passage',edge['id'])
 _,matches=min(candidates);start,end=matches[0],matches[-1];actualDistance=sum(math.dist(rows[i]['p'],rows[i-1]['p'])for i in range(start+1,end+1));seconds=(end-start)/60
 admitted.append({'edge':edge['id'],'source':edge['source'],'destination':edge['destination'],'startFrame':start,'endFrame':end,'orderedVertexFrames':matches,'seconds':seconds,'distance':actualDistance,'maximumPathDeviation':max(distance_to_path(points[i],path)for i in range(start,end+1)),'requiredAfterstepImpulses':0,'powerReleases':rows[end]['releases']-rows[start]['releases'],'sourceTrace':native['fullTrace'],'traceSHA256':native['fullTraceSHA256']})
graph['parentCurrentIdentity']={k:parent[k]for k in ['currentEntry','currentEntrySHA256','currentManifest','currentManifestSHA256','status','publicConnectivity']}
graph.update(currentEntry=build['entry'],currentEntrySHA256=native['entrySHA256'],currentManifest=build['manifest'],currentManifestSHA256=native['manifestSHA256'],status='PARTIAL ADMISSION:22new current loggia edges; archived parent evidence is preserved without recertifying its individual edges')
graph['nodes']+=metadata['newNodes'];graph['edges']+=metadata['newEdges'];by={r['edge']:r for r in admitted}
for node in graph['nodes'][-len(metadata['newNodes']):]:node['validation']='ADMITTED node proximity in current loggia input trace; component/source bounds verified separately'
for approach in graph.get('stationApproaches',[]):
 if 'currentInputEvidence'in approach:approach['archivedParentInputEvidence']=approach.pop('currentInputEvidence')
 approach['inputValidation']='Parent route evidence is archived here; current complete approaches are separately bound in V02_Loggia_Terraces_Routes.json'
graph['publicConnectivity']={'status':'Topology counts only; native admission is explicit per edge/report','nodes':len(graph['nodes']),'edges':len(graph['edges']),'parentConnectivity':parent['publicConnectivity']}
for edge in graph['edges']:
 if edge['id']not in by:continue
 evidence=by[edge['id']];edge['expectedSeconds']=evidence['seconds'];edge['timeEvidence']='Actual current supported normal-input trace boundary-to-boundary interval; includes native waypoint settling when inside this interval';edge['validation']={'geometry':'Reopened-source, packed-export and native contact validation','input':'ADMITTED on the bound loggia build and trace only'};edge['measuredEvidence']=evidence
graph['loggiaAdmission']={'entrySHA256':native['entrySHA256'],'manifestSHA256':native['manifestSHA256'],'nativeReportSHA256':sha(D/'V02_Loggia_Terraces_Native.json'),'parentGraphSHA256':sha(D/'V02_Maintenance_Movement_Graph.json'),'scope':'Only22new directed loggia edges are admitted here. Existing parent edge admission/proposals are preserved without recertifying them.'}
(D/'V02_Loggia_Movement_Graph.json').write_text(json.dumps(graph,indent=2)+'\n')
with(D/'V02_Loggia_AbilityRoute_Matrix.csv').open('w',newline='')as f:
 writer=csv.DictWriter(f,fieldnames=list(admitted[0]));writer.writeheader();writer.writerows({k:json.dumps(v)if isinstance(v,(list,dict))else v for k,v in r.items()}for r in admitted)
result={'status':'PASS22current supported directed loggia passages; parent edges not recertified','entrySHA256':native['entrySHA256'],'manifestSHA256':native['manifestSHA256'],'traceSHA256':native['fullTraceSHA256'],'parentGraphSHA256':sha(D/'V02_Maintenance_Movement_Graph.json'),'graphSHA256':sha(D/'V02_Loggia_Movement_Graph.json'),'matrixSHA256':sha(D/'V02_Loggia_AbilityRoute_Matrix.csv'),'admitted':admitted,'toleranceMetres':.25,'continuousPathToleranceMetres':.8}
(D/'V02_Loggia_Terraces_Admission.json').write_text(json.dumps(result,indent=2)+'\n');print(result['status'])
