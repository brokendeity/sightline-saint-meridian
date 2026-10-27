"""Retain current metadata and append actual new portal-to-roof contacts."""
from pathlib import Path
import json,hashlib
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';O=R/'assets/city/vertical-v02/service-tower'
read=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
m=read(O/'manifest.json');base=read(R/'assets/city/vertical-v02/station-pavilion/runtime/manifest.json');plan=read(D/'V02_Service_Tower_Plan.json');by={r['id']:r for r in m['records']};contacts=[]
for c in plan['sourceContacts']:
 a,b=by[c['lower']]['box'],by[c['upper']]['box'];gaps=[max(a['min'][i]-b['max'][i],b['min'][i]-a['max'][i],0)for i in range(3)];assert max(gaps)<1e-5,c
 contacts.append({**c,'type':'source-bounds-contact'})
m['supportConnections']=base['supportConnections']+contacts;m['serviceTower']['sourceContactConnections']=contacts
(O/'manifest.json').write_text(json.dumps(m,indent=2)+'\n')
(D/'V02_Service_Tower_Metadata.json').write_text(json.dumps({'status':'PASS new source portal-to-roof contact adjacency','contacts':contacts,'manifestSHA256':sha(O/'manifest.json'),'limits':['Contact adjacency is not structural engineering certification.']},indent=2)+'\n')
print('PASS',len(contacts),'source contacts')
