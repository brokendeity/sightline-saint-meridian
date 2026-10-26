"""Independent station topology, metadata ownership and support-height checks."""
from pathlib import Path
import json,hashlib,math
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';OUT=R/'assets/city/vertical-v02/transit-world'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
canonical=lambda x:hashlib.sha256(json.dumps(x,sort_keys=True,separators=(',',':')).encode()).hexdigest()
m=json.loads((OUT/'manifest.json').read_text());g=json.loads((D/'V02_Transit_Movement_Graph.json').read_text());base=json.loads((D/'V02_Detailed_Movement_Graph.json').read_text())
assert m['graphSHA256']==sha(D/'V02_Transit_Movement_Graph.json')and g['sourceDetailedGraphSHA256']==sha(D/'V02_Detailed_Movement_Graph.json')
assert g['exportedGeometrySHA256']==canonical({'records':m['records'],'chunks':m['chunks']})
nodes={n['id']:n for n in g['nodes']};edges={e['id']:e for e in g['edges']};assert len(nodes)==len(g['nodes'])and len(edges)==len(g['edges'])
for n in base['nodes']:assert nodes[n['id']]==n
for e in base['edges']:assert edges[e['id']]==e
for e in edges.values():
 assert e['source']in nodes and e['destination']in nodes
 assert math.dist(e['path'][0],nodes[e['source']]['position'])<.011 and math.dist(e['path'][-1],nodes[e['destination']]['position'])<.011
 assert abs(e['distance3D']-sum(math.dist(a,b)for a,b in zip(e['path'],e['path'][1:])))<.001
new=[e for id,e in edges.items()if id not in{e['id']for e in base['edges']}];assert len(new)==8
records=m['records'];samples=0
for e in new:
 assert e['ability']=='run'and e['requiredAfterstepImpulses']==0 and e['requiredReplaySlots']==0
 for a,b in zip(e['path'],e['path'][1:]):
  n=max(1,math.ceil(math.dist(a,b)/.2))
  for i in range(n+1):
   p=[a[k]+(b[k]-a[k])*i/n for k in range(3)];samples+=1
   assert any(r['walkable']and abs(r['box']['max'][1]-p[1])<.0001 and r['box']['min'][0]-.00001<=p[0]<=r['box']['max'][0]+.00001 and r['box']['min'][2]-.00001<=p[2]<=r['box']['max'][2]+.00001 for r in records),'Unbacked public path '+str(p)
adj={id:[]for id in nodes}
for e in edges.values():
 if e['ability']in['walk','run','stairs']and not e['requiredAfterstepImpulses']:adj[e['source']].append(e['destination'])
def reach(a,b):
 seen={a};queue=[a]
 for n in queue:
  for other in adj[n]:
   if other not in seen:seen.add(other);queue.append(other)
 return b in seen
assert all(reach('poi-station',id)and reach(id,'poi-station')for id in['station-public-entry','station-platform-centre','station-platform-north','station-platform-south'])
for filename,key in[('collisions.json','colliders'),('structure_ownership.json','structures'),('threadrail_surfaces.json','physicalSurfaceColliders')]:
 data=json.loads((OUT/filename).read_text());assert data['sourceManifestSHA256']==sha(OUT/'manifest.json')
 expected={r['id']for r in records if r['solid']}if key!='structures'else{r['id']for r in records}
 assert {r['id']for r in data[key]}==expected
unmeasured=[e['id']for e in g['edges']if e.get('expectedSeconds')is None]
assert unmeasured==[e['id']for e in base['edges']if e.get('expectedSeconds')is None]
report={'status':'PASS new station topology/support metadata; inherited timing gaps remain','manifestSHA256':sha(OUT/'manifest.json'),'graphSHA256':sha(D/'V02_Transit_Movement_Graph.json'),'nodes':len(nodes),'edges':len(edges),'newDirectedStationEdges':8,'sampledNewSupportPoints':samples,'publicStationRoundTrip':True,'unmeasuredInheritedEdgeTimings':unmeasured,'scope':'Directed graph, sample support heights and sidecar ownership; native input/camera validation is separate.'}
(D/'V02_Transit_Graph_Validation.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
