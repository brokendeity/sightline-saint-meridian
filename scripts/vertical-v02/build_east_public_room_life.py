"""Create an isolated full-game variant with three room visitors on admitted paths."""
from pathlib import Path
import copy
import hashlib
import json
import math

R=Path(__file__).resolve().parents[2]
D=R/'development/vertical-city-v02'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
read=lambda p:json.loads(p.read_text())
build=read(D/'V02_East_Public_Emissive_Build.json')
gate=read(D/'V02_East_Public_Room_Admission_Validation.json')
graph=read(D/'V02_East_Public_Room_Movement_Graph.json')
assert gate['status'].startswith('PASS')
assert gate['entrySHA256']==build['entrySHA256']==sha(R/build['entry'])
assert gate['manifestSHA256']==build['manifestSHA256']==sha(R/build['manifest'])
assert gate['graphSHA256']==sha(D/'V02_East_Public_Room_Movement_Graph.json')
nodes={node['id']:node for node in graph['nodes']}
edges={edge['id']:edge for edge in graph['edges']}
old_ambient='assets/city/vertical-v02/world-life/ambient_routes.json'
ambient=copy.deepcopy(read(R/old_ambient))
ambient['schema']='sm-v02-east-public-room-visitors-1'
ambient['parentAmbientSHA256']=sha(R/old_ambient)
ambient['worldManifestSHA256']=build['manifestSHA256']
ambient['admittedPlayerGraphSHA256']=gate['graphSHA256']
ambient['admissionPolicy']='Player path evidence is a placement prerequisite, not NPC acceptance. Runtime sweeps/support/yield checks and current visitor tests remain required.'
for floor in [24,52,84]:
    ids=[f'E{floor}_300',f'EPR{floor}-gallery',f'EPR{floor}-room',
         f'EPR{floor}-gallery',f'E{floor}_326',f'EPR{floor}-gallery']
    edge_ids=[f'EPR{floor}-{i}' for i in range(6)]
    for i,edge_id in enumerate(edge_ids):
        edge=edges[edge_id]
        assert edge['source']==ids[i] and edge['destination']==ids[(i+1)%6]
    centreline=[nodes[stable_id]['position'] for stable_id in ids]
    # Separate slow visitors from the player's normal gallery/room centreline.
    # The 3m portal retains .13m clearance beyond the NPC's .32m sweep radius.
    # The actual offset path requires its own native support/clearance evidence.
    points=[[97,floor,300],[97,floor,308.95],[103.15,floor,308.95],
            [97,floor,308.95],[97,floor,326],[97,floor,308.95]]
    ambient['routes'].append({'id':f'east-public-room-{floor}-visitor',
        'purpose':'Walk the public gallery, visit its sheltered waiting room and return to circulation',
        'count':1,'points':points,'dwellAt':[2,4],'closed':True,'baseSpeed':1.05,
        'minimumSpacing':.68,'dwellSeconds':8,
        'length':sum(math.dist(a,b) for a,b in zip(points,points[1:]+points[:1])),
        'placementEvidenceEdges':edge_ids,'playerReferenceCentreline':centreline,
        'placementPolicy':'Offset scenic pedestrian lane; .32m swept envelope and actual support must pass native visitor testing'})
ambient['actorCount']=sum(route['count'] for route in ambient['routes'])
assert ambient['actorCount']==11
assert ambient['routes'][:3]==read(R/old_ambient)['routes']
ambient_path='assets/city/vertical-v02/east-public-emissive/runtime/ambient_routes.json'
(R/ambient_path).write_text(json.dumps(ambient,indent=2)+'\n')
source_script='scripts/game_vertical_world_life_v02.js'
script='scripts/game_vertical_east_public_life_v02.js'
source=(R/source_script).read_text()
old="const fetchJSON=async file=>{const response=await fetch('assets/city/vertical-v02/world-life/'+file);if(!response.ok)throw Error(response.status+' '+file);return response.json();};"
new="""const fetchJSON=async file=>{
  if(file!=='ambient_routes.json'){
   const response=await fetch('assets/city/vertical-v02/world-life/'+file);
   if(!response.ok)throw Error(response.status+' '+file);return response.json();
  }
  const response=await fetch('AMBIENT_URL');if(!response.ok)throw Error('Public-room routes '+response.status);
  const bytes=new Uint8Array(await response.arrayBuffer());
  const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(x=>x.toString(16).padStart(2,'0')).join('');
  if(digest!=='AMBIENT_SHA')throw Error('Public-room route version mismatch');
  return JSON.parse(new TextDecoder().decode(bytes));
 };""".replace('AMBIENT_URL',ambient_path).replace('AMBIENT_SHA',sha(R/ambient_path))
assert source.count(old)==1
text=source.replace(old,new)
old_diagnostics='return{...state,clock,scenicOnly:true'
new_diagnostics="return{...state,clock,ambientManifestSHA256:ambientDefinition?.worldManifestSHA256,roomGraphSHA256:ambientDefinition?.admittedPlayerGraphSHA256,scenicOnly:true"
assert text.count(old_diagnostics)==1
text=text.replace(old_diagnostics,new_diagnostics)
assert text.replace(new,old).replace(new_diagnostics,old_diagnostics)==source
(R/script).write_text(text)
entry_source=(R/build['entry']).read_text()
old_tag='<script src="'+source_script+'"></script>'
new_tag='<script src="'+script+'?v='+sha(R/script)[:12]+'"></script>'
assert entry_source.count(old_tag)==1
entry='SIGHTLINE_SAINT_MERIDIAN_V02_PUBLIC_ROOM_LIFE.html'
text=entry_source.replace(old_tag,new_tag)
assert text.replace(new_tag,old_tag)==entry_source
surface_script='scripts/game_v02_surface_normals.js'
surface_tag='<script src="'+surface_script+'?v='+sha(R/surface_script)[:12]+'"></script>\n'
assert text.count('</body>')==1
text=text.replace('</body>',surface_tag+'</body>')
assert text.replace(surface_tag,'').replace(new_tag,old_tag)==entry_source
(R/entry).write_text(text)
report={**build,'entry':entry,'entrySHA256':sha(R/entry),
    'source':build['entry'],'sourceSHA256':build['entrySHA256'],
    'worldLifeScript':script,'worldLifeScriptSHA256':sha(R/script),
    'sourceWorldLifeScript':source_script,'sourceWorldLifeScriptSHA256':sha(R/source_script),
    'ambientRoutes':ambient_path,'ambientRoutesSHA256':sha(R/ambient_path),
    'surfaceNormalScript':surface_script,'surfaceNormalScriptSHA256':sha(R/surface_script),
    'admittedPlayerGraphSHA256':gate['graphSHA256'],
    'scope':'Unpromoted full-game child with three added scenic room visitors in offset lanes and incoming-ray-facing cartridge normals. Old8visitors/36aircraft preserved. Contacts/owners/reach/clearance remain unchanged. Current NPC/input/route/performance and final visual gates remain required.'}
(D/'V02_East_Public_Room_Life_Build.json').write_text(json.dumps(report,indent=2)+'\n')
print('BUILT',entry,report['entrySHA256'])
