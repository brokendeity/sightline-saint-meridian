"""Export integrity, positive-volume preservation and original road-envelope precheck."""
from pathlib import Path
import json,hashlib,math
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';m=json.loads((R/'assets/city/vertical-v02/graybox/manifest.json').read_text());w=json.loads((D/'V02_LiveWorld_Authoritative.json').read_text())
parts=[(p['id'],p['box'])for b in w['buildings']for p in b['parts']];bad=[]
def overlap(a,b):return all(a['min'][i]<b['max'][i]-1e-5 and a['max'][i]>b['min'][i]+1e-5 for i in range(3))
for r in m['records']:
 for id,b in parts:
  if overlap(r['box'],b):bad.append({'new':r['id'],'existing':id})
flat=[r for r in m['records']if r['walkable']];duplicates=[]
for i,a in enumerate(flat):
 for b in flat[i+1:]:
  if abs(a['box']['max'][1]-b['box']['max'][1])<1e-5 and all(a['box']['min'][k]<b['box']['max'][k]-1e-5 and a['box']['max'][k]>b['box']['min'][k]+1e-5 for k in[0,2]):duplicates.append([a['id'],b['id']])
# OBB SAT for the existing 9m x2.8m Halo truck; full height4m, 0.5m centre samples.
ground=[r for r in m['records']if r['solid']and r['box']['min'][1]<4.1 and r['box']['max'][1]>.1]
def obb_hit(x,z,dx,dz,b):
 cx=(b['min'][0]+b['max'][0])/2;cz=(b['min'][2]+b['max'][2])/2;hx=(b['max'][0]-b['min'][0])/2;hz=(b['max'][2]-b['min'][2])/2
 for ax,az in[(1,0),(0,1),(dx,dz),(-dz,dx)]:
  ra=abs(dx*ax+dz*az)*4.5+abs(-dz*ax+dx*az)*1.4;rb=abs(ax)*hx+abs(az)*hz
  if abs((x-cx)*ax+(z-cz)*az)>=ra+rb-1e-5:return False
 return True
road_hits=[];samples=0
lanes=[l for l in w['roads']['lanes']if l['active']];ids={l['id']for l in lanes};turns=[t for t in w['roads']['turns']if t['from']in ids and t['to']in ids]
for route in lanes+turns:
 points=route['points']
 for a,b in zip(points,points[1:]):
  length=math.hypot(b[0]-a[0],b[2]-a[2])
  if length<1e-8:continue
  dx=(b[0]-a[0])/length;dz=(b[2]-a[2])/length;n=math.ceil(length/.5)
  for i in range(n+1):
   x=a[0]+(b[0]-a[0])*i/n;z=a[2]+(b[2]-a[2])*i/n
   if x<35 or x>125 or z<190 or z>450:continue
   samples+=1
   for c in ground:
    q=c['box']
    if q['max'][0]<x-6 or q['min'][0]>x+6 or q['max'][2]<z-6 or q['min'][2]>z+6:continue
    if obb_hit(x,z,dx,dz,q):road_hits.append({'route':route['id'],'new':c['id'],'at':[x,z]})
report={'scope':'Blender export integrity, original compound-box overlap and sampled existing road truck envelopes only. Not continuous physics, train/air-traffic or full route certification.','originalBuildingsAsReference':m['referenceOnlyBuildingCount'],'exportedOriginalBuildingCopies':sum(r['id'].startswith('building-')for r in m['records']),'chunks':len(m['chunks']),'records':len(m['records']),'triangles':sum(c['triangles']for c in m['chunks']),'bytes':sum(c['bytes']for c in m['chunks']),'originalGeometryConflicts':bad,'coplanarSurfaceOverlaps':duplicates,'roadEnvelopeSamples':samples,'roadEnvelopeConflicts':road_hits[:100],'roadEnvelopeConflictCount':len(road_hits),'graphHashMatches':m['graphSHA256']==hashlib.sha256((D/'V02_Movement_Graph.json').read_bytes()).hexdigest(),'chunkHashesMatch':all(hashlib.sha256((R/c['url']).read_bytes()).hexdigest()==c['sha256']for c in m['chunks'])}
(D/'V02_Graybox_Integrity.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2)[:4000]);assert not bad and not duplicates and not road_hits and report['graphHashMatches']and report['chunkHashesMatch']
