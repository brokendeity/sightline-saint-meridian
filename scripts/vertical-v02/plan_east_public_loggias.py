"""Real gallery-connected public-room proposal on the clear east corridor.

Independent frames avoid fictitious doors through the retained original tower.
This source preflight is not admission; train/air/source/input gates follow.
"""
from pathlib import Path
import json,hashlib,copy
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';read=lambda f:json.loads((R/f).read_text());sha=lambda f:hashlib.sha256((R/f).read_bytes()).hexdigest()
b=read('development/vertical-city-v02/V02_Facade_Cassettes_Build.json');base=read(b['manifest']);world=read('development/vertical-city-v02/V02_LiveWorld_Authoritative.json');new=[];changes=[];rooms=[];intentional=[]
def box(p,s):return{'min':[p[i]-s[i]/2 for i in range(3)],'max':[p[i]+s[i]/2 for i in range(3)]}
def overlap(a,b):return all(a['min'][i]<b['max'][i]-1e-5 and a['max'][i]>b['min'][i]+1e-5 for i in range(3))
def add(id,p,s,mat='steel',solid=True,walkable=False,**extra):
 r={'id':'east-loggia-'+id,'owner':'v02:east-loggia-'+id,'center':p,'size':s,'box':box(p,s),'material':mat,'solid':solid,'walkable':walkable,'collection':'SM_V02_EAST_PUBLIC_LOGGIAS',**extra};new.append(r);return r
def guard(id,p,s):
 add(id,p,s,'glass',role='Physical1.1m edge protection');p=p.copy();p[1]+=.5625;s=s.copy();s[1]=.025;add(id+'-cap',p,s,'cyan',False,role='Attached thin cyan edge light, no dynamic fixture')
for y,title in [(24,'PUBLIC REST'),(52,'SERVICE ACCESS'),(84,'TRANSIT INFO')]:
 gallery=next(r for r in base['records']if r['id']==f'gallery-E-{y}-300');assert gallery['box']['max'][0]==99 and gallery['box']['max'][1]==y
 rails=[r for r in base['records']if r.get('guardrail')or r['id'].startswith('public-guard-')]
 rail=next(r for r in rails if r['solid']and abs(r['box']['min'][1]-y)<.001 and r['box']['min'][0]>98.8 and r['box']['max'][0]<99.1 and r['box']['min'][2]==300 and r['box']['max'][2]==326)
 for suffix in ['', '-cap']:
  old=next(r for r in base['records']if r['id']==rail['id']+suffix);left=copy.deepcopy(old);left['box']['max'][2]=308.5;left['center'][2]=(300+308.5)/2;left['size'][2]=8.5;changes.append({'before':old,'after':left,'reason':'Real3m portal to the new supported public room; collision and visible rail change together'})
  right=copy.deepcopy(old);right['id']='east-loggia-'+old['id']+'-right';right['owner']='v02:'+right['id'];right['box']['min'][2]=311.5;right['center'][2]=(311.5+326)/2;right['size'][2]=14.5;new.append(right)
 add(f'{y}-room-floor',[102.475,y-.15,310],[3.55,.30,8],'deck',walkable=True,role=title+' public walking floor')
 add(f'{y}-bridge-floor',[99.85,y-.15,310],[1.7,.30,3],'deck',walkable=True,role='Level floor joints at x99 and100.7, no duplicate coplanar floor')
 for z in [308.46,311.54]:guard(f'{y}-bridge-edge-{z}',[99.865,y+.55,z],[1.67,1.1,.08])
 add(f'{y}-roof',[102.425,y+4.325,310],[3.65,.25,8.2],'deck',walkable=True,roofSoffit=True,role='Actual closed canopy/roof landing surface')
 add(f'{y}-back',[104.19,y+2.05,310],[.12,4.1,7.8],'steel',role='Independent room back wall, clear of retained building160/cassettes')
 for z in [306.05,313.95]:add(f'{y}-side-glazing-{z}',[102.45,y+2, z],[3.3,4,.08],'glass',role='Actual side enclosure')
 for z in [307.3,312.7]:add(f'{y}-front-glazing-{z}',[100.76,y+2.05,z],[.08,4.1,2.4],'glass',role='Front glazing outside real3m entrance')
 for x in [100.85,104.1]:
  for z in [306.15,313.85]:add(f'{y}-canopy-post-{x}-{z}',[x,y+2.05,z],[.14,4.1,.14],role='Canopy post on room floor')
 for z in [306.8,313.2]:add(f'{y}-floor-girder-{z}',[102.475,y-.5,z],[3.55,.4,.22],role='Girder on independent continuous frame')
 for z in [307.4,312.6]:add(f'{y}-bench-{z}',[103.55,y+.24,z],[.55,.48,1.8],'deck',role='Solid seating outside the entrance through-route')
 for z in [306.7,313.3]:
  add(f'{y}-planter-{z}',[102.8,y+.35,z],[1.6,.70,.55],role='Low planting bed outside the through-route');add(f'{y}-foliage-{z}',[102.8,y+.95,z],[1.45,.50,.45],'foliage',False,primitive='foliage',role='Foliage within planted bed')
 for z in [306.6,313.4]:add(f'{y}-warm-ceiling-{z}',[102.45,y+4.13,z],[3.25,.025,.08],'warm',False,role='Recessed luminaire; source-baked illumination required, no dynamic light')
 add(f'{y}-canopy-cyan',[100.61,y+4.34,310],[.03,.035,8.2],'cyan',False,role='Thin canopy fascia')
 rooms.append({'id':'east-public-loggia-'+str(y),'floor':y,'title':title,'publicPath':[[96,y,300],[96,y,310],[102.1,y,310],[96,y,310],[96,y,326]],'entryWidth':3,'floorClearDepth':2.15,'role':'Accessible public room, with independent ground-rooted frame; no fictional original-tower doorway'})
for x in [100.85,102.45]:
 for z in [306.8,313.2]:add(f'frame-{x}-{z}',[x,44.1,z],[.28,88.2,.28],role='Continuous independent ground-rooted public-room frame')
old={c['after']['id']:c['after']for c in changes};obstacles=[{'id':p['id'],'box':p['box']}for building in world['buildings']for p in building['parts']]+[{'id':p['id'],'box':p['box']}for p in world['props']if p['type']!='vertical-structure']+[{'id':r['id'],'box':old.get(r['id'],r)['box']}for r in base['records']if r['solid']]
failures=[]
for r in new:
 if not r['solid']:continue
 hits=[o['id']for o in obstacles if overlap(r['box'],o['box'])]
 if hits:failures.append({'id':r['id'],'hits':hits})
for r in new:
 if not r['id'].startswith('east-loggia-frame-'):continue
 for patch in world['roads']['surfacePatches']:
  bb=patch['bounds'];bounds={k:[bb[k][i]for i in ['x','y','z']]for k in ['min','max']}
  if all(r['box']['min'][i]<bounds['max'][i]-1e-5 and r['box']['max'][i]>bounds['min'][i]+1e-5 for i in [0,2]):failures.append({'id':r['id'],'roadPatch':patch.get('id')})
report={'status':'PASS source-obstacle preflight; unadmitted proposal'if not failures else'FAIL source-obstacle preflight; proposal must change','sourceBuild':'development/vertical-city-v02/V02_Facade_Cassettes_Build.json','sourceBuildSHA256':sha('development/vertical-city-v02/V02_Facade_Cassettes_Build.json'),'sourceMaster':b['master'],'sourceMasterSHA256':b['masterSHA256'],'sourceManifest':b['manifest'],'sourceManifestSHA256':b['manifestSHA256'],'rooms':rooms,'additions':new,'changes':changes,'failures':failures,'newDynamicLights':0,'originalBuildingChanges':0,'requiredGates':['Continuous all-carriage/air-vehicle envelope clearance around full-height frame','Original facade/cassette world-mesh separation including source support joints','Blender manifold/UV/normal/export/physical/native validation','Source-baked warm room lighting and matched source/native render','Real ordinary-input door/bridge/camera/landing/route tests at all3elevations','New graph edges admitted from real traces; no blank-wall or isolated-room certification'],'scope':'Actual source dimensions, original geometry fixed. New warm public-room architecture is not implemented or accepted by this preflight.'};(D/'V02_East_Public_Loggias_Plan.json').write_text(json.dumps(report,indent=2)+'\n');print(report['status'],len(new),'components;',len(changes),'controlled rail changes; failures',len(failures));print(json.dumps(failures[:12],indent=2))
