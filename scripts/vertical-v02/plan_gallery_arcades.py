"""Concrete public weather-arcade volumes on existing supported galleries.
Source clearance and graph/body margins are preflight, not input acceptance.
"""
import json,hashlib,math
from pathlib import Path
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';read=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
files=['assets/city/vertical-v02/coffered/runtime/manifest.json','development/vertical-city-v02/V02_LiveWorld_Authoritative.json','development/vertical-city-v02/V02_Movement_Graph.json','assets/city/vertical-v02/world-life/air_routes.json']
base,world,graph,air=[read(R/f)for f in files];records=[];supports=[];arcades=[];failures=[]
def box(p,s):return {'min':[p[i]-s[i]/2 for i in range(3)],'max':[p[i]+s[i]/2 for i in range(3)]}
def overlaps(a,b):return all(a['min'][i]<b['max'][i]-1e-5 and a['max'][i]>b['min'][i]+1e-5 for i in range(3))
obstacles=[{'id':p['id'],'box':p['box']}for b in world['buildings']for p in b['parts']]+[{'id':p['id'],'box':p['box']}for p in world['props']if p['type']!='vertical-structure']+[{'id':r['id'],'box':r['box']}for r in base['records']if r['solid']]
def add(id,p,s,material='steel',solid=True,walkable=False,**extra):
 r={'id':id,'owner':'v02:'+id,'center':p,'size':s,'box':box(p,s),'material':material,'solid':solid,'walkable':walkable,'collection':'SM_V02_GALLERIES','detail':True,'arcade':True,**extra}
 if solid:
  hit=[o['id']for o in obstacles if overlaps(r['box'],o['box'])]
  if hit:failures.append({'id':id,'kind':'existing physical geometry','hits':hit})
 records.append(r);return r
for id,x,y,z,length,floorID in [('lower',55,24,337,14,'gallery-W-24-326'),('middle',96,52,318,12,'gallery-E-52-300'),('upper',55,84,386,12,'gallery-W-84-376')]:
 prefix='arcade-'+id;floor=next(r for r in base['records']if r['id']==floorID);parts=[];width=6.2;roofBase=y+4.35;roof=add(prefix+'-roof',[x,roofBase+.125,z],[width,.25,length+.4],'deck',walkable=True,role='Closed coffered weather roof; physical maintenance/landing surface, not a new public navigation edge');parts.append(roof['id'])
 for j,zz in enumerate([z-length/2+.4,z,z+length/2-.4]):
  beam=add(prefix+'-beam-'+str(j),[x,y+4.2,zz],[5.7,.3,.24],role='Public arcade portal beam, directly supported by paired columns');parts.append(beam['id']);supports.append({'lower':beam['id'],'upper':roof['id']})
  for side in [-1,1]:
   p=[x+side*2.68,y+2.025,zz];post=add(prefix+'-post-'+str(j)+'-'+str(side),p,[.2,4.05,.24],role='Source-floor-supported arcade column; central public passage remains open',supportFloor=floorID);parts.append(post['id']);supports.extend([{'lower':floorID,'upper':post['id']},{'lower':post['id'],'upper':beam['id']}])
   assert all(floor['box']['min'][k]+.001<=post['box']['min'][k]and floor['box']['max'][k]-.001>=post['box']['max'][k]for k in [0,2]),post['id']
   assert abs(post['box']['min'][1]-floor['box']['max'][1])<1e-6
 for side in [-1,1]:
  r=add(prefix+'-edge-'+str(side),[x+side*(width/2+.025),roofBase+.12,z],[.05,.20,length+.35],solid=False,role='Attached dark folded drip-edge fascia; shallow cosmetic roof edge');parts.append(r['id'])
  r=add(prefix+'-edge-light-'+str(side),[x+side*(width/2+.052),roofBase+.16,z],[.008,.035,length+.15],'cyan',solid=False,role='Thin cyan roof-edge source, no dynamic light');parts.append(r['id'])
 for j in range(max(2,math.floor(length/3))):
  zz=z+(j+.5)/math.floor(length/3)*length-length/2
  r=add(prefix+'-soffit-'+str(j),[x,roofBase-.0125,zz],[.09,.025,1.2],'warm',solid=False,sourceSurface=roof['id'],role='Warm strip flush-mounted on the closed centre rib, not a dynamic light');parts.append(r['id'])
 arcades.append({'id':id,'floor':floorID,'center':[x,y,z],'length':length,'width':width,'roofID':roof['id'],'roofTop':roofBase+.25,'minimumBeamHeadroom':4.05,'minimumCentralPassageWidth':5.16,'recordIDs':parts,'function':'Public weather shelter on the existing connected gallery; no false building entrance or new district lore'})
# Every existing directed route retains a conservative body corridor. A route
# proposal is not certified here; it is only protected from these additions.
routeChecks=0
for edge in graph['edges']:
 for a,b in zip(edge.get('path',[]),edge.get('path',[])[1:]):
  body={'min':[min(a[i],b[i])+[-.665,.02,-.665][i]for i in range(3)],'max':[max(a[i],b[i])+[.665,2.14,.665][i]for i in range(3)]};routeChecks+=1
  for r in records:
   if r['solid']and overlaps(body,r['box']):failures.append({'id':r['id'],'kind':'directed source-route body envelope','edge':edge['id']})
# Full bank-inclusive scenic vehicle bounds are vertically disjoint from all
# added geometry, including decorative roof edges. This proves clearance for
# every route position without relying on centreline sampling.
airChecks=[]
for lane in air['lanes']:
 assert all(p[1]==lane['elevation']for p in lane['points'])
 lo=lane['elevation']+air['clearanceEnvelope']['min'][1];hi=lane['elevation']+air['clearanceEnvelope']['max'][1]
 gaps=[max(lo-r['box']['max'][1],r['box']['min'][1]-hi)for r in records];assert min(gaps)>0
 airChecks.append({'lane':lane['id'],'bankInclusiveVerticalEnvelope':[lo,hi],'minimumVerticalGap':min(gaps),'proof':'Every route position; conservative complete banked vehicle envelope'})
# The accepted train engineering rail-head is above every added roof. Reserve
# a deliberately larger96..106m train envelope than the measured body envelope.
assert max(r['box']['max'][1]for r in records)<96
report={'status':'PASS source-volume/route-envelope preflight'if not failures else'FAIL preflight','sources':{f:sha(R/f)for f in files},'arcades':arcades,'records':records,'supportConnections':supports,'existingRouteSegmentChecks':routeChecks,'airClearance':airChecks,'trainClearance':{'conservativeY':[96,106],'minimumVerticalGap':96-max(r['box']['max'][1]for r in records)},'failures':failures,'scope':'Actual compound source/prop/V02 boxes and conservative graph body corridors. No original building/route relocation. Normal input, native support/camera, source/export and visual acceptance remain separate.'}
(D/'V02_Gallery_Arcade_Plan.json').write_text(json.dumps(report,indent=2)+'\n');print(report['status'],len(records),'records',len(failures),'failures');print(failures[:15]);assert not failures
