"""Controlled station stair-roof/clerestory revision in actual world coordinates."""
from pathlib import Path
import copy,hashlib,json,math
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';read=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
source='assets/city/vertical-v02/public-terraces/runtime/manifest.json';m=read(R/source);world=read(D/'V02_LiveWorld_Authoritative.json');air=read(R/'assets/city/vertical-v02/world-life/air_routes.json');train=read(R/'assets/city/vertical-v02/transit/definition.json');trainBounds=read(D/'V02_Transit_Station_Geometry.json')
def bounds(p,s):return {'min':[p[i]-s[i]/2 for i in range(3)],'max':[p[i]+s[i]/2 for i in range(3)]}
def overlap(a,b):return all(a['min'][i]<b['max'][i]-1e-5 and a['max'][i]>b['min'][i]+1e-5 for i in range(3))
changes=[];additions=[]
for old in m['records']:
 if not old['id'].startswith('station-stair-weather-'):continue
 r=copy.deepcopy(old);id=r['id']
 if id=='station-stair-weather-roof'or'roof-trim'in id:r['center'][1]+=.9
 elif abs(r['box']['max'][1]-103.1)<1e-6:r['center'][1]+=.45;r['size'][1]+=.9
 else:continue
 if id=='station-stair-weather-roof':r['size'][0]=72.5-60.08;r['center'][0]=(72.5+60.08)/2
 if id=='station-stair-weather-west-1':r['size'][2]=385.32-377;r['center'][2]=(385.32+377)/2
 r['box']=bounds(r['center'],r['size']);r['pavilionRevision']='Raised framed glazed roof; explicit80mm clearance notch around existing column; original entrances/floors retained'
 changes.append({'before':old,'after':r})
roof=next(c['after']for c in changes if c['after']['id']=='station-stair-weather-roof')
assert abs(roof['box']['min'][1]-104)<1e-6 and abs(roof['box']['max'][1]-104.2)<1e-6
for id,lo,hi,material,walkable in [
 ('station-pavilion-roof-west-before',[58.7,104,370.95],[60.08,104.2,385.32],'steel',True),
 ('station-pavilion-roof-west-after',[58.7,104,386.68],[60.08,104.2,386.95],'steel',True),
 ('station-pavilion-west-return',[58.8,84,386.68],[58.9,104,386.8],'glass',False)]:
 p=[(a+b)/2 for a,b in zip(lo,hi)];s=[b-a for a,b in zip(lo,hi)]
 additions.append({'id':id,'owner':'v02:'+id,'center':p,'size':s,'box':bounds(p,s),'material':material,'solid':True,'walkable':walkable,'collection':'SM_V02_TRANSIT_STRUCTURES','detail':True,'stationPavilion':True,'role':'Column-cleared weather-pavilion roof/wall segment; actual source geometry and compound contact'})
for j,z in enumerate([373,377,381,385]):
 p=[65.6,103.995,z];s=[.075,.01,1.2];id='station-pavilion-rib-light-'+str(j)
 additions.append({'id':id,'owner':'v02:'+id,'center':p,'size':s,'box':bounds(p,s),'material':'warm','solid':False,'walkable':False,'collection':'SM_V02_TRANSIT_STRUCTURES','detail':True,'stationPavilion':True,'sourceSurface':roof['id'],'role':'Warm strip physically mounted to the central roof rib; no new dynamic light'})
ids={c['after']['id']for c in changes};obstacles=[{'id':p['id'],'box':p['box']}for b in world['buildings']for p in b['parts']]+[{'id':p['id'],'box':p['box']}for p in world['props']if p['type']!='vertical-structure']+[{'id':r['id'],'box':r['box']}for r in m['records']if r['solid']and r['id']not in ids]
newVolumes=[]
for c in changes:
 a,b=c['before'],c['after'];bb=copy.deepcopy(b['box'])
 if'roof'not in b['id']:bb['min'][1]=a['box']['max'][1]
 newVolumes.append({'id':b['id'],'box':bb})
for r in additions:
 if not r['solid']:continue
 bb=copy.deepcopy(r['box'])
 if r['id']=='station-pavilion-west-return':bb['min'][1]=103.1
 newVolumes.append({'id':r['id'],'box':bb})
failures=[{'id':r['id'],'obstacle':o['id']}for r in newVolumes for o in obstacles if overlap(r['box'],o['box'])]
routeChecks=0
# Protect actual current input trajectories, not only the proposed graph.
routes=read(D/'V02_Current_Station_Routes.json')
import gzip
for job in routes['jobs']:
 r=json.loads(gzip.decompress((D/job['trace']).read_bytes()))
 for t in r['trace']:
  p=t['p'];body={'min':[p[0]-.665,p[1]-.4,p[2]-.665],'max':[p[0]+.665,p[1]+2.14,p[2]+.665]};routeChecks+=1
  for v in newVolumes:
   if overlap(body,v['box']):failures.append({'id':v['id'],'kind':'Retained actual body trace','run':job['name'],'position':p})
airChecks=[]
for lane in air['lanes']:
 assert all(p[1]==lane['elevation']for p in lane['points'])
 lo=lane['elevation']+air['clearanceEnvelope']['min'][1];hi=lane['elevation']+air['clearanceEnvelope']['max'][1]
 gaps=[max(lo-v['box']['max'][1],v['box']['min'][1]-hi)for v in newVolumes]
 assert min(gaps)>0;airChecks.append({'lane':lane['id'],'minimumContinuousVerticalGap':min(gaps),'vehicleY':[lo,hi]})
assert all(p[1]==100 for p in train['route']['points'])
maximumCarY=max(trainBounds['frontLocalBounds']['max'][1],trainBounds['passengerStaticBounds']['max'][1]);assert maximumCarY==3
minimumNewY=min(v['box']['min'][1]for v in newVolumes);assert minimumNewY>100+maximumCarY+.05
report={'status':'PASS controlled station pavilion volume/actual-route preflight'if not failures else'FAIL preflight','sourceManifest':source,'sourceManifestSHA256':sha(R/source),'sourceMaster':'development/vertical-city-v02/blender/SaintMeridian_V02_Public_Terraces.blend','sourceMasterSHA256':sha(D/'blender/SaintMeridian_V02_Public_Terraces.blend'),'sourceWorldSHA256':sha(D/'V02_LiveWorld_Authoritative.json'),'sourceRouteRunSHA256':sha(D/'V02_Current_Station_Routes.json'),'changes':changes,'additions':additions,'newVolumes':newVolumes,'actualBodySamples':routeChecks,'airChecks':airChecks,'trainClearance':{'constantRouteY':100,'measuredMaximumCarLocalY':maximumCarY,'reservedMaximumWorldY':103.05,'minimumAddedY':minimumNewY,'minimumContinuousVerticalGap':minimumNewY-103.05,'scope':'Full body height from independently loaded assets; native loaded four-car check remains required. Yaw/bogie articulation does not change body height.'},'failures':failures,'oldLandingHeadroom':3.1,'newLandingHeadroom':4.0,'newDynamicLights':0,'originalBuildingChanges':0,'scope':'Only raised stair-pavilion roof/wall tops/posts and rib-mounted emissive strips. Source meshes, packing, native support/input/camera and visual review remain separate.'}
(D/'V02_Station_Pavilion_Plan.json').write_text(json.dumps(report,indent=2)+'\n');print(report['status'],len(changes),'changed records',routeChecks,'actual body samples');print(failures[:8]);assert not failures
