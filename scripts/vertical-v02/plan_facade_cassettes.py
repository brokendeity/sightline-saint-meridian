"""Continuous source-face admission for rebated window cassette surrounds.

Convex polygon subtraction proves the whole annular footprint is backed by
retained dark source triangles and compound solids. No centre-point shortcut.
"""
from pathlib import Path
import json,hashlib,math,collections
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02'
read=lambda f:json.loads((R/f).read_text());sha=lambda f:hashlib.sha256((R/f).read_bytes()).hexdigest()
files=['development/vertical-city-v02/V02_LiveWorld_Authoritative.json','development/vertical-city-v02/V02_BuildingGeometry.json','development/vertical-city-v02/V02_Reference_Appearance.json','assets/city/vertical-v02/facade-architecture/facades.json','assets/city/vertical-v02/upper-anchor-mounts/runtime/manifest.json','development/vertical-city-v02/V02_Upper_Anchor_Build.json']
w=read(files[0]);geos={g['id']:g for g in read(files[1])['geometries']};families={f['family']:f for f in read(files[2])['families']};old=read(files[3]);district=read(files[4]);build=read(files[5]);rejected=collections.Counter();features=[]
def area(p):return abs(sum(a[0]*b[1]-b[0]*a[1]for a,b in zip(p,p[1:]+p[:1])))/2 if len(p)>2 else 0
def cross(a,b,p):return(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0])
def clip(poly,a,b,inside):
 out=[]
 for p,q in zip(poly,poly[1:]+poly[:1]):
  x=cross(a,b,p);y=cross(a,b,q);px=x>=-1e-10 if inside else x<=1e-10;qx=y>=-1e-10 if inside else y<=1e-10
  if px:out.append(p)
  if px!=qx and abs(x-y)>1e-16:
   t=x/(x-y);out.append([p[0]+t*(q[0]-p[0]),p[1]+t*(q[1]-p[1])])
 return out if area(out)>1e-10 else []
def subtract(poly,cutter):
 remaining=poly;out=[]
 if sum(a[0]*b[1]-b[0]*a[1]for a,b in zip(cutter,cutter[1:]+cutter[:1]))<0:cutter=list(reversed(cutter))
 for a,b in zip(cutter,cutter[1:]+cutter[:1]):
  if not remaining:break
  outside=clip(remaining,a,b,False)
  if outside:out.append(outside)
  remaining=clip(remaining,a,b,True)
 return out
def bounds2(p):return[min(v[0]for v in p),min(v[1]for v in p),max(v[0]for v in p),max(v[1]for v in p)]
def intersects2(a,b):return a[0]<b[2]+1e-9 and a[2]>b[0]-1e-9 and a[1]<b[3]+1e-9 and a[3]>b[1]-1e-9
def remaining(polys,cutters):
 parts=polys
 for cutter in cutters:
  cb=bounds2(cutter);parts=[piece for p in parts for piece in (subtract(p,cutter)if intersects2(bounds2(p),cb)else[p])]
  if not parts:break
 return sum(area(p)for p in parts)
def ring(width,height,c):
 x=width/2;y=height/2
 return[[-x+c,-y],[x-c,-y],[x,-y+c],[x,y-c],[x-c,y],[-x+c,y],[-x,y-c],[-x,-y+c]]
def overlap3(a,b):return all(a['min'][i]<b['max'][i]-1e-6 and a['max'][i]>b['min'][i]+1e-6 for i in range(3))
outer=ring(3.10,3.80,.12);inner=ring(1.90,2.56,.06)
for chunk in old['chunks']:
 b=w['buildings'][chunk['sourceIndex']];assert b['id']==chunk['owner'];g=geos[b['geometry']];family=families[b['family']];m=b['transform']['matrixWorld'];v=g['positions'];world=[]
 for x,y,z in zip(v[::3],v[1::3],v[2::3]):world.append([m[i]*x+m[i+4]*y+m[i+8]*z+m[i+12]for i in range(3)])
 ids=g['indices']or list(range(len(world)));triangles=[]
 for j in range(0,len(ids),3):
  points=[world[i]for i in ids[j:j+3]];a,c,d=points;u=[c[i]-a[i]for i in range(3)];v=[d[i]-a[i]for i in range(3)];n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];length=math.sqrt(sum(x*x for x in n))
  if length<1e-10:continue
  n=[x/length for x in n];palette=family['palette'][family['faceMaterials'][j//3]];triangles.append({'points':points,'normal':n,'face':j//3,'dark':max(palette['emission'])<=.005 and max(palette['color'])<=.3})
 cache={}
 for bay in chunk['bays']:
  if bay.get('kind'):continue
  axis=bay['axis'];u=bay['uAxis'];normal=bay['normal'];sign=normal[axis];plane=bay['sourcePoint'][axis];centre=bay['sourcePoint'];key=(axis,sign,round(plane,4))
  if key not in cache:
   valid=[];blockers=[]
   for t in triangles:
    projected=[[p[u],p[1]]for p in t['points']]
    if area(projected)<1e-9:continue
    offsets=[(p[axis]-plane)*sign for p in t['points']]
    if max(abs(x)for x in offsets)<.002 and t['normal'][axis]*sign>.999 and t['dark']:valid.append(projected)
    elif max(offsets)>.002 and min(offsets)<.085 and max(offsets)>0:blockers.append(projected)
   support=[]
   for part in b['parts']:
    box=part['box']
    if box['min'][axis]-.025<=plane<=box['max'][axis]+.025:
     lo=box['min'];hi=box['max'];support.append([[lo[u]-.001,lo[1]-.001],[hi[u]+.001,lo[1]-.001],[hi[u]+.001,hi[1]+.001],[lo[u]-.001,hi[1]+.001]])
   cache[key]=(valid,blockers,support)
  valid,blockers,support=cache[key];a=[[centre[u]+p[0],centre[1]+p[1]]for p in outer];z=[[centre[u]+p[0],centre[1]+p[1]]for p in inner];quads=[[a[i],a[(i+1)%8],z[(i+1)%8],z[i]]for i in range(8)];footprint=sum(area(q)for q in quads)
  missing=remaining(quads,valid)
  if missing>1e-6:rejected['unsupported source triangle footprint']+=1;continue
  if remaining(quads,support)>1e-6:rejected['unsupported compound footprint']+=1;continue
  if remaining(quads,blockers)<footprint-1e-6:rejected['original projecting detail']+=1;continue
  lo=centre.copy();hi=centre.copy();lo[u]-=1.55;hi[u]+=1.55;lo[1]-=1.9;hi[1]+=1.9;lo[axis]=plane+sign*.004;hi[axis]=plane+sign*.078
  if lo[axis]>hi[axis]:lo[axis],hi[axis]=hi[axis],lo[axis]
  box={'min':lo,'max':hi}
  if any(r['solid']and overlap3(box,r['box'])for r in district['records']):rejected['current V02 structural clearance']+=1;continue
  if any(other['id']!=bay['id']and overlap3(box,other['box'])for other in chunk['bays']):rejected['retained facade fitting clearance']+=1;continue
  probes=[]
  for p in a+z+[[sum(p[0]for p in q)/4,sum(p[1]for p in q)/4]for q in quads]:
   point=centre.copy();point[u]=p[0];point[1]=p[1];probes.append({'point':point})
  features.append({'id':bay['id'].replace('light-bay','cassette'),'owner':b['id'],'sourceIndex':b['sourceIndex'],'cityBuildingId':b['cityBuildingId'],'sourceBayID':bay['id'],'sourcePoint':centre,'sourceFace':bay['sourceFace'],'sourceProbes':probes,'normal':normal,'axis':axis,'uAxis':u,'box':box,'outer':[3.1,3.8,.12],'inner':[1.9,2.56,.06],'continuousSupportedArea':footprint,'uncoveredSourceArea':missing,'style':'midnight'if round(centre[1]/4.2)%3 else'charcoal','role':'Source-backed chamfered rainscreen surround, retaining original glazing/trim. No new doorway, interior, floor or invisible collision.'})
assert len(features)>300,('Insufficient source-cleared architecture',len(features),rejected)
report={'status':'PASS continuous source footprint/palette/compound and current-structure preflight; Blender/native/visual pending','sources':{f:sha(f)for f in files},'sourceMaster':build['master'],'sourceMasterSHA256':build['masterSHA256'],'features':features,'rejected':dict(rejected),'newDynamicLights':0,'newCollisionRecords':0,'originalBuildingGeometryChanges':0,'maximumProjectionMetres':.078,'coveragePolicy':'Eight convex annular strips minus exact source triangles and compound rectangles; uncovered area tolerance1e-6 square metres. Existing forward details and other visual/physical fittings excluded.','scope':'Rebated window surrounds are decorative original-owner additions inside the prior shallow envelope. They do not establish final architecture, new circulation or full contact fidelity.'}
(D/'V02_Facade_Cassettes_Plan.json').write_text(json.dumps(report,indent=2)+'\n');print(report['status'],len(features),'cassettes;',dict(rejected))
