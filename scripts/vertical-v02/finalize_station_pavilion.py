"""Record source-bounds contacts and controlled station ownership changes."""
from pathlib import Path
import hashlib,json
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';O=R/'assets/city/vertical-v02/station-pavilion';read=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();m=read(O/'manifest.json');base=read(R/'assets/city/vertical-v02/public-terraces/runtime/manifest.json');plan=read(D/'V02_Station_Pavilion_Plan.json');by={r['id']:r for r in m['records']};connections=[]
for x in [58.85,72.35]:
 for z in [371.1,386.8]:
  post=f'station-stair-weather-post-{x}-{z}';roof='station-stair-weather-roof'if x>60 else 'station-pavilion-roof-west-'+('before'if z<380 else'after');connections.append({'lower':post,'upper':roof,'type':'source-bounds-contact'})
for side in ['before','after']:connections.append({'lower':'station-pavilion-roof-west-'+side,'upper':'station-stair-weather-roof','type':'source-bounds-contact'})
for c in connections:
 a,b=by[c['lower']]['box'],by[c['upper']]['box'];gaps=[max(a['min'][i]-b['max'][i],b['min'][i]-a['max'][i],0)for i in range(3)];assert max(gaps)<.00001,c
m['supportConnections']=base['supportConnections']+connections
m['stationPavilion']['sourceContactConnections']=connections;m['stationPavilion']['columnNotch']={'existingColumn':'column-59.4-386','clearanceMetres':.08,'roofParts':['station-stair-weather-roof','station-pavilion-roof-west-before','station-pavilion-roof-west-after'],'scope':'Actual cutout and exact compound contacts, no hidden full roof proxy over the notch'}
(O/'manifest.json').write_text(json.dumps(m,indent=2)+'\n');(D/'V02_Station_Pavilion_Metadata.json').write_text(json.dumps({'status':'PASS six declared source contacts and exact changed record union','manifestSHA256':sha(O/'manifest.json'),'contacts':connections,'limits':['Source adjacency does not certify engineering strength.']},indent=2)+'\n');print('PASS6 source contact connections')
