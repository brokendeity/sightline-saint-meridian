"""Extend the immutable detailed navigation graph with the real station path."""
from pathlib import Path
import copy,json,hashlib,math,csv
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
canonical=lambda x:hashlib.sha256(json.dumps(x,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def build(m):
 source=D/'V02_Detailed_Movement_Graph.json';graph=copy.deepcopy(json.loads(source.read_text()));nodes={n['id']:n for n in graph['nodes']};edges=graph['edges']
 assert nodes['poi-station']['position']==[73,100,382]
 additions=[('station-public-entry',[73,100,385.4],'concourse access'),('station-platform-centre',[76.55,100,385.4],'public waiting platform'),('station-platform-north',[76.55,100,405],'public platform end'),('station-platform-south',[76.55,100,352],'public platform end')]
 for id,p,kind in additions:
  assert id not in nodes;nodes[id]={'id':id,'position':p,'kind':kind,'layer':100,'structuralOwner':'v02:transit-public-platform'if'platform'in id else'v02:station-concourse-opening-1','supportStatus':'Authored in current Blender transit master; native acceptance separate','validation':'CURRENT INPUT ADMISSION PENDING'}
 new=[]
 for id,a,b in [('station-concourse-access','poi-station','station-public-entry'),('station-platform-access','station-public-entry','station-platform-centre'),('station-platform-north-walk','station-platform-centre','station-platform-north'),('station-platform-south-walk','station-platform-centre','station-platform-south')]:
  for reverse in[False,True]:
   sourceID,destID=(b,a)if reverse else(a,b);points=[nodes[sourceID]['position'],nodes[destID]['position']];length=math.dist(*points)
   new.append({'id':id+('-return'if reverse else''),'source':sourceID,'destination':destID,'ability':'run','path':points,'directionality':'directed','elevationChange':0,'horizontalDistance':length,'distance3D':length,'requiredAfterstepImpulses':0,'requiredReplaySlots':0,'expectedSeconds':round(length/6.6,3),'timeEvidence':'Planning estimate from measured6.6m/s native movement; actual station input timings reported separately','difficulty':'public','risk':'low','failureRecovery':'Remain behind the full-height rail screen; return through the2.8m concourse opening','requiredAbilities':['ordinary grounded movement'],'traversalAgent':'player','validation':{'geometry':'Current transit-master export; separate world and contact preflight','input':'NOT TESTED on this current manifest'}})
 graph.update(schema='sm-v02-transit-movement-1',authority='Current transit-master geometry and preserved detailed design graph',status='Current station topology; native input admission is separate',sourceDetailedGraphSHA256=sha(source),sourceBuilderSHA256=sha(Path(__file__)),nodes=list(nodes.values()),edges=[*edges,*new],exportedGeometrySHA256=canonical({'records':m['records'],'chunks':m['chunks']}))
 topology={'nodes':[{'id':n['id'],'position':n['position']}for n in graph['nodes']],'edges':[{k:e[k]for k in['id','source','destination','ability','path']}for e in graph['edges']]};graph['topologySHA256']=canonical(topology)
 adjacency={id:[]for id in nodes}
 for e in graph['edges']:
  if e['ability']in['walk','run','stairs']and not e['requiredAfterstepImpulses']:adjacency[e['source']].append(e['destination'])
 def reach(a,b):
  seen={a};queue=[a]
  for n in queue:
   for other in adjacency[n]:
    if other not in seen:seen.add(other);queue.append(other)
  return b in seen
 assert all(reach('poi-station',id)and reach(id,'poi-station')for id,_,_ in additions)
 graph['publicConnectivity']={'status':'PASS directed topology only; not native walking acceptance','stationPlatformRoundTrip':True,'nodes':len(nodes),'edges':len(graph['edges'])}
 file=D/'V02_Transit_Movement_Graph.json';file.write_text(json.dumps(graph,indent=2)+'\n')
 fields=['id','source','destination','ability','elevationChange','horizontalDistance','distance3D','requiredAfterstepImpulses','requiredReplaySlots','expectedSeconds','timeEvidence','difficulty','risk','failureRecovery','validation']
 with(D/'V02_Transit_AbilityRoute_Matrix.csv').open('w',newline='')as f:
  writer=csv.DictWriter(f,fieldnames=fields,lineterminator='\n');writer.writeheader();writer.writerows({k:json.dumps(e.get(k))if isinstance(e.get(k),dict)else e.get(k)for k in fields}for e in graph['edges'])
 m['navigation']['nodes'].extend(nodes[id]for id,_,_ in additions);m['navigation']['edges'].extend(new);m['graphSHA256']=sha(file);m['navigationAuthority']='V02_Transit_Movement_Graph.json; input evidence remains separately hash-bound'
 return additions
