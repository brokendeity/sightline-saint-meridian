"""Separate immutable-source-derived collision, ownership and anchor intake metadata."""
from pathlib import Path
import json,hashlib
R=Path(__file__).resolve().parents[2];A=R/'assets/city/vertical-v02/graybox';mp=A/'manifest.json';m=json.loads(mp.read_text());g=json.loads((R/'development/vertical-city-v02/V02_Movement_Graph.json').read_text());assert m['graphSHA256']==hashlib.sha256((R/'development/vertical-city-v02/V02_Movement_Graph.json').read_bytes()).hexdigest(),'Graph and exported geometry metadata are from different builds'
base={'sourceManifestSHA256':hashlib.sha256(mp.read_bytes()).hexdigest(),'status':'graybox; full V02 acceptance incomplete'}
def write(name,data):(A/name).write_text(json.dumps({**base,**data},indent=2)+'\n')
write('collisions.json',{'axes':'game Y-up metres','colliders':[{k:r[k]for k in['id','owner','box','solid','walkable']if k in r}|{k:r[k]for k in['stair','stairLanding','flight','stepRise','guardrail','sourceSurface','edgeAxis','edgeSign']if k in r}for r in m['records']if r['solid']]})
write('structure_ownership.json',{'structures':[{'id':r['id'],'owner':r['owner'],'collection':r['collection'],'sourceStructure':r.get('sourceStructure',r['id']),'sourceSurface':r.get('sourceSurface'),'operation':'new independent district structure in V02 candidate; original buildings not replaced','nonDestructible':True}for r in m['records']]})
anchors=[]
for e in g['edges']:
 for endpoint,p in e.get('anchors',{}).items():
  if endpoint not in ['a','b']:continue
  normal=e['anchors'].get(endpoint+'SurfaceNormal',[0,1,0]);offset=.44 if normal[1]>.5 else .72
  contact=[p[i]-normal[i]*offset for i in range(3)];owners=[]
  for r in m['records']:
   q=r['box'];axis=max(range(3),key=lambda i:abs(normal[i]));face=q['max'][axis]if normal[axis]>0 else q['min'][axis]
   if abs(face-contact[axis])<1e-4 and all(q['min'][i]-1e-5<=contact[i]<=q['max'][i]+1e-5 for i in range(3)if i!=axis):owners.append(r['owner'])
  anchors.append({'edge':e['id'],'endpoint':endpoint,'contact':contact,'normal':normal,'matchingPhysicalOwners':owners,'status':'surface-box precheck only; normal-input acceptance belongs to the hash-bound route reports'})
write('threadrail_surfaces.json',{'anchors':anchors,'missingSurfaceCandidates':[a for a in anchors if not a['matchingPhysicalOwners']],'physicalSurfaceColliders':[r['id']for r in m['records']if r['solid']],'physicalSurfaceGeometry':'axis-aligned Blender cuboids; six faces referenced through collisions.json. Actual ray contact remains authoritative; this does not certify capsule clearance or a usable launch/landing.'})
write('encounter_points.json',{'runtimeEncounters':m.get('encounters',[]),'points':m.get('pointsOfInterest',[]),'directory':m.get('directory'),'pointPolicy':'Actual supported information/discovery stances from the same exported manifest; runtime route and interaction acceptance is separate.'})
print('Wrote collision/ownership/anchor/encounter sidecars; missing anchor candidates:',sum(not a['matchingPhysicalOwners']for a in anchors))
