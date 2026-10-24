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
  contact=[p[0],p[1]-.44,p[2]];owners=[r['owner']for r in m['records']if r['walkable']and abs(r['box']['max'][1]-contact[1])<1e-4 and r['box']['min'][0]-1e-5<=p[0]<=r['box']['max'][0]+1e-5 and r['box']['min'][2]-1e-5<=p[2]<=r['box']['max'][2]+1e-5]
  anchors.append({'edge':e['id'],'endpoint':endpoint,'contact':contact,'normal':[0,1,0],'matchingPhysicalOwners':owners,'status':'surface-box precheck; normal-input throw/catch/ride not accepted'})
write('threadrail_surfaces.json',{'anchors':anchors,'missingSurfaceCandidates':[a for a in anchors if not a['matchingPhysicalOwners']]})
write('encounter_points.json',{'points':[{'id':id,'position':p,'status':'planned gameplay adapter; not an active encounter'}for id,p in [('transit-interception',[66.5,100,376]),('service-combat',[75.5,52,326]),('market-rescue',[75.5,24,366]),('market-incident-poi',[64,24,366]),('maintenance-poi',[86,52,320]),('observation-poi',[72,128,420]),('signal-desk-poi',[68,100,382])]]})
print('Wrote collision/ownership/anchor/encounter sidecars; missing anchor candidates:',sum(not a['matchingPhysicalOwners']for a in anchors))
