"""Independent preservation, world/road/body compatibility and support topology.

Metadata preflight only. Saved Blender meshes, imported GLBs, train motion and
normal-input station walking are validated separately.
"""
from pathlib import Path
import json,math,hashlib,gzip,collections,itertools
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
base=json.loads((R/'assets/city/vertical-v02/detailed/manifest.json').read_text());mp=R/'assets/city/vertical-v02/transit-world/manifest.json';m=json.loads(mp.read_text());w=json.loads((D/'V02_LiveWorld_Authoritative.json').read_text())
by={r['id']:r for r in m['records']};assert len(by)==len(m['records'])
retired=set(m['retiredV02ContactRecords']);assert retired=={'public-guard-0185','public-guard-0185-cap'}
assert not retired.intersection(by)
for r in base['records']:
 if r['id']in retired:continue
 assert r==by[r['id']],r['id']
ids=[id for c in m['chunks']for id in c['recordIDs']];assert len(ids)==len(by)and set(ids)==set(by)
assert not any(id.startswith('building-')for id in ids)
assert all(sha(R/c['url'])==c['sha256']for c in m['chunks'])
assert m['sourceDetailedManifestSHA256']==sha(R/'assets/city/vertical-v02/detailed/manifest.json')
for suffix,a,b in[('south',359,384.2),('north',387,393)]:
 g=by['transit-concourse-guard-'+suffix];assert all(abs(x-y)<1e-9 for x,y in[(g['box']['min'][2],a),(g['box']['max'][2],b),(g['box']['min'][0],74.91),(g['box']['max'][0],74.99)])
new=[r for r in m['records']if r['id']not in{q['id']for q in base['records']}]
def overlap(a,b):return all(a['min'][i]<b['max'][i]-1e-5 and a['max'][i]>b['min'][i]+1e-5 for i in range(3))
def intersects(a,b,eps=.00001):return all(a['min'][i]<=b['max'][i]+eps and a['max'][i]>=b['min'][i]-eps for i in range(3))
CELL=16;grid=collections.defaultdict(list)
def cells(b):return itertools.product(range(math.floor(b['min'][0]/CELL),math.floor(b['max'][0]/CELL)+1),range(math.floor(b['min'][2]/CELL),math.floor(b['max'][2]/CELL)+1))
for b in w['buildings']:
 for p in b['parts']:
  for k in cells(p['box']):grid[k].append(p)
original=[]
for r in new:
 seen=set()
 for k in cells(r['box']):
  for p in grid[k]:
   if p['id']not in seen and overlap(r['box'],p['box']):original.append({'new':r['id'],'original':p['id']})
   seen.add(p['id'])
ground=[r for r in new if r['solid']and r['box']['min'][1]<4.4]
def obb_hit(x,z,dx,dz,b):
 cx=(b['min'][0]+b['max'][0])/2;cz=(b['min'][2]+b['max'][2])/2;hx=(b['max'][0]-b['min'][0])/2;hz=(b['max'][2]-b['min'][2])/2
 for ax,az in[(1,0),(0,1),(dx,dz),(-dz,dx)]:
  ra=abs(dx*ax+dz*az)*4.75+abs(-dz*ax+dx*az)*1.65;rb=abs(ax)*hx+abs(az)*hz
  if abs((x-cx)*ax+(z-cz)*az)>=ra+rb-1e-5:return False
 return True
road=[];road_samples=0;lanes=[r for r in w['roads']['lanes']if r['active']];laneids={r['id']for r in lanes}
for route in lanes+[r for r in w['roads']['turns']if r['from']in laneids and r['to']in laneids]:
 for a,b in zip(route['points'],route['points'][1:]):
  length=math.hypot(b[0]-a[0],b[2]-a[2]);n=max(1,math.ceil(length/.5))
  if length<1e-8:continue
  dx=(b[0]-a[0])/length;dz=(b[2]-a[2])/length
  for i in range(n+1):
   x=a[0]+(b[0]-a[0])*i/n;z=a[2]+(b[2]-a[2])*i/n
   near=[r for r in ground if abs(r['center'][0]-x)<7 and abs(r['center'][2]-z)<7]
   if not near:continue
   road_samples+=1
   for r in near:
    if obb_hit(x,z,dx,dz,r['box']):road.append({'new':r['id'],'lane':route['id'],'at':[x,z]})
pedestrian=[]
for edge in w['roads']['pedestrian']['edges']:
 for a,b in zip(edge['points'],edge['points'][1:]):
  bb={'min':[min(a[i],b[i])-[.7,0,.7][i]for i in range(3)],'max':[max(a[i],b[i])+[.7,2.2,.7][i]for i in range(3)]}
  for r in ground:
   if overlap(bb,r['box']):pedestrian.append({'new':r['id'],'edge':edge['id']})
# Retained body trace preflight, with the same capsule planning dimensions as
# the accepted detailed geometry validator. This is not input reexecution.
bodygrid=collections.defaultdict(list)
for r in new:
 if not r['solid']:continue
 b={'min':[r['box']['min'][i]-[.665,1.72,.665][i]for i in range(3)],'max':[r['box']['max'][i]+[.665,.4,.665][i]for i in range(3)]}
 for k in itertools.product(*(range(math.floor(b['min'][i]/12),math.floor(b['max'][i]/12)+1)for i in range(3))):bodygrid[k].append((r,b))
body=[];body_samples=0
gate=json.loads((D/'V02_Phase4_Gate.json').read_text())
for item in gate['evidence']:
 report=json.loads((D/item['file']).read_text())
 if not report.get('fullTrace'):continue
 raw=json.load(gzip.open(D/report['fullTrace']))
 groups=[r['trace']for r in raw.get('results',[])if r.get('pass')and'trace'in r]if item['file']=='V02_Loop_Validation.json'else[raw.get('trace',[])]
 for rows in groups:
  for i,row in enumerate(rows):
   p=row.get('p',row.get('pos'))
   if not p:continue
   body_samples+=1
   for r,b in bodygrid[tuple(math.floor(v/12)for v in p)]:
    if all(b['min'][i]+1e-5<p[i]<b['max'][i]-1e-5 for i in range(3)):
     body.append({'new':r['id'],'source':item['file'],'frame':i,'position':p})

girder=[by[id]for id in m['transitStructure']['girderIDs']];connections=[];support_errors=[]
for a,b in zip(girder,girder[1:]+girder[:1]):
 if not intersects(a['box'],b['box']):support_errors.append({'gap':[a['id'],b['id']]})
for support in m['transitStructure']['supports']:
 beams=[by[r['id']]for r in support['records']if 'crosshead'in r['id']or'approach'in r['id']]
 parent=by[support['existingColumn']]if support['existingColumn']else next(by[r['id']]for r in support['records']if'piers'in r['id']or r['id'].startswith('transit-pier-'))
 assert parent['box']['min'][1]==0
 connected={parent['id']};pending=beams[:]
 while pending:
  added=False
  for beam in pending[:]:
   if any(intersects(beam['box'],by[id]['box'])for id in connected):connected.add(beam['id']);pending.remove(beam);added=True
  if not added:break
 if pending:support_errors.append({'unconnectedSupport':support['id']})
 touched=[r['id']for r in girder if any(intersects(r['box'],beam['box'])for beam in beams)]
 if not touched:support_errors.append({'noGirderContact':support['id']})
 connections.append({'support':support['id'],'foundation':parent['id'],'girderContacts':touched})
result={'status':'FAIL transit environment preflight'if original or road or pedestrian or body or support_errors else'PASS transit environment preservation/compatibility preflight only',
 'manifestSHA256':sha(mp),'preservedDetailedRecords':len(base['records'])-2,'controlledRetirements':sorted(retired),'newRecords':len(new),
 'originalBuildingConflicts':original,'roadVehicleEnvelopeSamplesNearNewPiers':road_samples,'roadVehicleConflicts':road[:80],'roadVehicleConflictCount':len(road),
 'pedestrianConflicts':pedestrian[:80],'pedestrianConflictCount':len(pedestrian),'acceptedBodySamples':body_samples,'acceptedBodyConflicts':body[:80],'acceptedBodyConflictCount':len(body),
 'supportConnections':connections,'supportErrors':support_errors,'maximumSupportSpacing':m['transitStructure']['maximumSupportSpacing'],
 'remaining':['Saved Blender bounds and platform-to-girder contacts','Actual GLB import/coordinates','Native station approach and safety boundary','New full convoy envelope checks','Retained input regressions and final performance']}
(D/'V02_Transit_Environment_Preflight.json').write_text(json.dumps(result,indent=2)+'\n');print(result['status']);print('original',len(original),'vehicle',len(road),'pedestrian',len(pedestrian),'body',len(body),'support',len(support_errors));print(json.dumps({'original':original[:8],'body':body[:8],'support':support_errors[:8]},indent=2))
assert not(original or road or pedestrian or body or support_errors)
