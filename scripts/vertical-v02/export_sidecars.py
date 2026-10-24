"""Separate immutable-source-derived collision, ownership and anchor intake metadata."""
from pathlib import Path
import json,hashlib
R=Path(__file__).resolve().parents[2];A=R/'assets/city/vertical-v02/graybox';mp=A/'manifest.json';m=json.loads(mp.read_text());g=json.loads((R/'development/vertical-city-v02/V02_Movement_Graph.json').read_text());base={'sourceManifestSHA256':hashlib.sha256(mp.read_bytes()).hexdigest(),'status':'graybox; full V02 acceptance incomplete'}
def write(name,data):(A/name).write_text(json.dumps({**base,**data},indent=2)+'\n')
write('collisions.json',{'axes':'game Y-up metres','colliders':[{k:r[k]for k in['id','owner','box','solid','walkable']if k in r}|{k:r[k]for k in['stair','stairLanding','flight','stepRise']if k in r}for r in m['records']if r['solid']]})
write('structure_ownership.json',{'structures':[{'id':r['id'],'owner':r['owner'],'collection':r['collection'],'sourceStructure':r.get('sourceStructure',r['id']),'operation':'new independent district structure in V02 candidate; original buildings not replaced','nonDestructible':True}for r in m['records']]})
anchors=[]
for e in g['edges']:
 for endpoint,p in e.get('anchors',{}).items():
  if endpoint not in ['a','b']:continue
  normal=e['anchors'].get(endpoint+'SurfaceNormal',[0,1,0]);offset=.44 if normal[1]>.5 else .72
  contact=[p[i]-normal[i]*offset for i in range(3)];owners=[]
  for r in m['records']:
   q=r['box'];axis=max(range(3),key=lambda i:abs(normal[i]));face=q['max'][axis]if normal[axis]>0 else q['min'][axis]
   if abs(face-contact[axis])<1e-4 and all(q['min'][i]-1e-5<=contact[i]<=q['max'][i]+1e-5 for i in range(3)if i!=axis):owners.append(r['owner'])
  anchors.append({'edge':e['id'],'endpoint':endpoint,'contact':contact,'normal':normal,'matchingPhysicalOwners':owners,'status':'surface-box precheck; normal-input throw/catch/ride not accepted'})
write('threadrail_surfaces.json',{'anchors':anchors,'missingSurfaceCandidates':[a for a in anchors if not a['matchingPhysicalOwners']]})
write('encounter_points.json',{'runtimeEncounters':m.get('encounters',[]),'points':[{'id':id,'position':p,'status':'planned gameplay adapter; not an active encounter'}for id,p in [('transit-interception',[66.5,100,376]),('market-rescue',[75.5,24,366]),('market-incident-poi',[64,24,366]),('maintenance-poi',[86,52,320]),('observation-poi',[72,128,420]),('signal-desk-poi',[68,100,382])]]})
print('Wrote collision/ownership/anchor/encounter sidecars; missing anchor candidates:',sum(not a['matchingPhysicalOwners']for a in anchors))
