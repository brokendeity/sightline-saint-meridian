"""Resolve real foundation/cantilever pockets around the measured train route.

Produces concrete component boxes for subsequent Blender authoring. Placement
checks are preflight only; exported meshes and native routes remain separate.
"""
from pathlib import Path
import json,math,hashlib,collections,itertools,gzip
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
w=json.loads((D/'V02_LiveWorld_Authoritative.json').read_text())
m=json.loads((R/'assets/city/vertical-v02/detailed/manifest.json').read_text())
engineering=json.loads((D/'V02_Transit_Engineering.json').read_text());samples=engineering['samples'];L=engineering['routeLength']
obstacles=[{'id':p['id'],'box':p['box'],'kind':'original-building'}for b in w['buildings']for p in b['parts']]
obstacles += [{'id':p['id'],'box':p['box'],'kind':'preserved-prop'}for p in w['props']if p['type']!='vertical-structure']
obstacles += [{'id':r['id'],'box':r['box'],'kind':'detailed-world'}for r in m['records']if r['solid']]
grid=collections.defaultdict(list);CELL=16
def cells(b):return itertools.product(range(math.floor(b['min'][0]/CELL),math.floor(b['max'][0]/CELL)+1),range(math.floor(b['min'][2]/CELL),math.floor(b['max'][2]/CELL)+1))
def add_obstacle(o):
 for key in cells(o['box']):grid[key].append(o)
for o in obstacles:add_obstacle(o)
def overlap(a,b):return all(a['min'][i]<b['max'][i]-1e-5 and a['max'][i]>b['min'][i]+1e-5 for i in range(3))
def hits(b,ignore=()):
 seen=set();out=[]
 for key in cells(b):
  for o in grid[key]:
   if o['id']in seen or o['id']in ignore:continue
   seen.add(o['id'])
   if overlap(b,o['box']):out.append(o['id'])
 return out
def box(p,size):return{'min':[p[i]-size[i]/2 for i in range(3)],'max':[p[i]+size[i]/2 for i in range(3)]}
def record(id,p,size,kind='steel',solid=True,walkable=False,**extra):return{'id':id,'owner':'v02:'+id,'center':p,'size':size,'box':box(p,size),'material':kind,'solid':solid,'walkable':walkable,'collection':'SM_V02_TRANSIT_STRUCTURES',**extra}
def region(b):return b['max'][0]>=35 and b['min'][0]<=285 and b['max'][2]>=35 and b['min'][2]<=605
road_samples=0
# Conservative AABBs of the actual oriented vehicle envelopes. Inflation gives
# 25cm each side of the original 9x2.8m truck; no support relies on a5cm gap.
active=[r for r in w['roads']['lanes']if r['active']];ids={r['id']for r in active}
for route in active+[r for r in w['roads']['turns']if r['from']in ids and r['to']in ids]:
 for a,b in zip(route['points'],route['points'][1:]):
  length=math.hypot(b[0]-a[0],b[2]-a[2]);n=max(1,math.ceil(length/.5))
  if length<1e-8:continue
  dx=(b[0]-a[0])/length;dz=(b[2]-a[2])/length
  extent=[abs(dx)*4.75+abs(dz)*1.65,2.2,abs(dz)*4.75+abs(dx)*1.65]
  for i in range(n+1):
   p=[a[0]+(b[0]-a[0])*i/n,2.2,a[2]+(b[2]-a[2])*i/n];bb=box(p,[v*2 for v in extent])
   if region(bb):add_obstacle({'id':'vehicle:'+route['id']+':'+str(road_samples),'box':bb});road_samples+=1
pedestrian_segments=0
for edge in w['roads']['pedestrian']['edges']:
 for a,b in zip(edge['points'],edge['points'][1:]):
  bb={'min':[min(a[i],b[i])-[.7,0,.7][i]for i in range(3)],'max':[max(a[i],b[i])+[.7,2.2,.7][i]for i in range(3)]}
  if region(bb):add_obstacle({'id':'pedestrian:'+edge['id']+':'+str(pedestrian_segments),'box':bb});pedestrian_segments+=1

# Actual accepted hero positions retain the previous capsule planning margin.
gate=json.loads((D/'V02_Phase4_Gate.json').read_text());body_samples=0
for item in gate['evidence']:
 report=json.loads((D/item['file']).read_text())
 if not report.get('fullTrace'):continue
 raw=json.load(gzip.open(D/report['fullTrace']))
 groups=[r['trace']for r in raw.get('results',[])if r.get('pass')and'trace'in r]if item['file']=='V02_Loop_Validation.json'else[raw.get('trace',[])]
 for rows in groups:
  for row in rows:
   p=row.get('p',row.get('pos'))
   if not p:continue
   bb={'min':[p[0]-.665,p[1]-.4,p[2]-.665],'max':[p[0]+.665,p[1]+1.72,p[2]+.665]}
   if region(bb):add_obstacle({'id':'accepted-body:'+str(body_samples),'box':bb});body_samples+=1

def row_at(d):return samples[round((d%L)/L*len(samples))%len(samples)]
columns=[r for r in m['records']if r['id'].startswith('column-')and r['box']['min'][1]<.01 and r['box']['max'][1]>=98]
supports=[];rejected=collections.Counter()
def gap(a,b):return min(abs(a-b),L-abs(a-b))
def choose(d):
 candidates=[]
 for delta in[0,-2,2,-4,4,-6,6,-8,8,-10,10]:
  row=row_at(d+delta);distance=row['distance'];p=row['p']
  if any(gap(distance,s['distance'])<12 for s in supports):continue
  for parent in columns:
   c=parent['center']
   # Existing piers may be reused only on the same axis-aligned beam section.
   if abs(c[0]-p[0])<.61 or abs(c[2]-p[2])<.61:
    if math.hypot(c[0]-p[0],c[2]-p[2])<=26:candidates.append((abs(delta)*2+math.dist([c[0],c[2]],[p[0],p[2]])*.2, row,[c[0],c[2]],parent['id']))
  for offset in[8,10,12,14,16,18,20,22,24,26]:
   for axis in[0,1]:
    for sign in[-1,1]:
     c=[p[0],p[2]];c[axis]+=offset*sign
     candidates.append((abs(delta)*2+offset+4,row,c,None))
 for _,row,c,parent in sorted(candidates,key=lambda v:v[0]):
  p=row['p'];distance=row['distance'];suffix=str(len(supports)).zfill(3)
  if math.hypot(*c)<117:rejected['plaza']+=1;continue
  records=[]
  if not parent:
   col=record('transit-pier-'+suffix,[c[0],48.125,c[1]],[1.2,96.25,1.2],role='foundation to crosshead underside')
   conflicts=hits(col['box'])
   if conflicts:rejected['foundation:'+conflicts[0].split(':')[0]]+=1;continue
   records.append(col)
  # Align any <=.61m longitudinal mismatch exactly at the existing column;
  # two connected orthogonal members avoid a large invisible diagonal AABB.
  elbow=[c[0],p[2]]
  for label,a,b in [('approach',[c[0],c[1]],elbow),('crosshead',elbow,[p[0],p[2]])]:
   length=math.dist(a,b)
   if length<.01:continue
   size=[abs(a[0]-b[0])+1.2,1.4,abs(a[1]-b[1])+1.2]
   rec=record('transit-'+label+'-'+suffix,[(a[0]+b[0])/2,96.95,(a[1]+b[1])/2],size,role='box girder connection',supportParent=parent or records[0]['id'])
   conflicts=hits(rec['box'],[parent]if parent else[])
   if conflicts:rejected['beam:'+conflicts[0].split(':')[0]]+=1;break
   records.append(rec)
  else:
   return{'id':'support-'+suffix,'distance':distance,'head':p,'foundation':c,'existingColumn':parent,'records':records}
 return None

for d in range(0,math.ceil(L),25):
 support=choose(d)
 if support:supports.append(support)
for _ in range(100):
 supports.sort(key=lambda s:s['distance']);gaps=[(b['distance']-a['distance'])%L for a,b in zip(supports,supports[1:]+supports[:1])]
 if not gaps or max(gaps)<=38:break
 i=max(range(len(gaps)),key=gaps.__getitem__);support=choose(supports[i]['distance']+gaps[i]/2)
 if not support:break
 supports.append(support)
supports.sort(key=lambda s:s['distance']);gaps=[(b['distance']-a['distance'])%L for a,b in zip(supports,supports[1:]+supports[:1])]
result={'status':'PASS foundation/crosshead placement preflight only'if gaps and max(gaps)<=38 else'PARTIAL support gaps require resolution',
 'sourceManifestSHA256':sha(R/'assets/city/vertical-v02/detailed/manifest.json'),'engineeringSHA256':sha(D/'V02_Transit_Engineering.json'),
 'scriptSHA256':sha(Path(__file__)),'routeLength':L,'supports':supports,'maximumSupportSpacing':max(gaps)if gaps else None,
 'unresolvedSpans':[{'after':supports[i]['id'],'distance':g}for i,g in enumerate(gaps)if g>38],
 'roadVehicleEnvelopeSamples':road_samples,'pedestrianEnvelopeSegments':pedestrian_segments,'acceptedBodySamples':body_samples,
 'rejectionCounts':dict(rejected),'limitations':['Preflight only: independent exported mesh, train sweep and native route checks required.','Continuous longitudinal girder and station platform are authored separately.','No structural load or foundation soil certification is implied.']}
(D/'V02_Transit_Structural_Placement.json').write_text(json.dumps(result,indent=2)+'\n');print(result['status'],len(supports),'supports; maximum gap',result['maximumSupportSpacing']);print(result['unresolvedSpans'])
