"""Three gallery-connected public terraces against the preserved rear facade.
Actual world contacts, road patches and route envelopes are authoritative.
"""
from pathlib import Path
import json,hashlib,math
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';read=lambda f:json.loads((R/f).read_text());sha=lambda f:hashlib.sha256((R/f).read_bytes()).hexdigest()
files=['assets/city/vertical-v02/gallery-arcades/runtime/manifest.json','development/vertical-city-v02/V02_LiveWorld_Authoritative.json','development/vertical-city-v02/V02_Movement_Graph.json','assets/city/vertical-v02/world-life/air_routes.json'];base,world,graph,air=[read(f)for f in files];records=[];modified=[];levels=[];failures=[]
def box(p,s):return{'min':[p[i]-s[i]/2 for i in range(3)],'max':[p[i]+s[i]/2 for i in range(3)]}
def overlap(a,b,eps=1e-5):return all(a['min'][i]<b['max'][i]-eps and a['max'][i]>b['min'][i]+eps for i in range(3))
def add(id,p,s,material='steel',solid=True,walkable=False,**extra):
 r={'id':id,'owner':'v02:'+id,'center':p,'size':s,'box':box(p,s),'material':material,'solid':solid,'walkable':walkable,'collection':'SM_V02_PUBLIC_TERRACES','publicTerrace':True,**extra};records.append(r);return r
for y,pair in[(24,[7,9]),(52,[50,52]),(128,[234,236])]:
 prefix='public-terrace-'+str(y);ids=[]
 for n in pair:
  for suffix in['','-cap']:
   old=next(r for r in base['records']if r['id']==f'public-guard-{n:04d}'+suffix);new=json.loads(json.dumps(old));end=0 if old['box']['max'][2]<=300 else 1;lo=old['box']['min'][2]if end==0 else 301.75;hi=298.25 if end==0 else old['box']['max'][2];new['center'][2]=(lo+hi)/2;new['size'][2]=hi-lo;new['box']=box(new['center'],new['size']);modified.append({'before':old,'after':new,'reason':'3.5m open, floor-supported public terrace entrance; no disabled collision behind an intact visual rail'})
 for part,p,s in [('floor',[38,y-.3,300],[12,.6,8]),('neck',[48,y-.3,300],[8,.6,3.8])]:ids.append(add(prefix+'-'+part,p,s,'deck',walkable=True,role='Gallery-connected public terrace flat walking floor')['id'])
 # Independent ground-supported frame. The preserved facade is a backdrop,
 # never a false structural parent or an invented private entrance.
 for x in[32.5,40.8]:
  ids.append(add(prefix+'-beam-'+str(x),[x,y-.9,300],[.35,.6,7.6],role='Floor crossbeam on independent ground-supported frame')['id'])
 ids.append(add(prefix+'-neck-beam',[46.3,y-.9,303.6],[11.4,.6,.35],role='Rear transverse girder connects independent frame and supported gallery neck')['id'])
 ids.append(add(prefix+'-roof',[38,y+4.475,300],[12.3,.25,8.3],'deck',walkable=True,role='Sheltered public room roof; maintenance contact, not certified public roof access')['id'])
 for x in[32.5,40.8]:ids.append(add(prefix+'-roof-beam-'+str(x),[x,y+4.2,300],[.24,.3,7.6],role='Portal roof beam on continuous frame')['id'])
 # A real shallow pavilion: transparent rear/side glazing, actual seating and
 # open front/south approach. No painted fake room or door in original tower.
 for id,p,s in [('back',[37,y+2.0,303.55],[9.2,4,.09]),('west',[32.45,y+2.0,302.0],[.09,4,3.1])]:ids.append(add(prefix+'-glazing-'+id,p,s,'glass',role='Physical tinted-glass pavilion enclosure; front open to terrace')['id'])
 for x in[32.5,35.5,38.5,41.5]:ids.append(add(prefix+'-mullion-'+str(x),[x,y+2.05,303.48],[.075,4.1,.10],solid=False,role='Attached glazing mullion')['id'])
 # Benches and planted beds stay away from the validated centre circulation.
 for x in[34.5,39.5]:
  ids.append(add(prefix+'-bench-'+str(x),[x,y+.24,302.3],[2,.48,.65],'deck',role='Solid public bench outside walking corridor')['id'])
  ids.append(add(prefix+'-planter-'+str(x),[x,y+.40,303.05],[1.7,.8,.55],'steel',role='Planted bed outside walking corridor')['id'])
  ids.append(add(prefix+'-foliage-'+str(x),[x,y+1.0,303.05],[1.6,.6,.5],'foliage',solid=False,role='Low stylized foliage within planter volume')['id'])
 # Physical perimeter railings keep all unsupported edges guarded.
 for name,p,s in [('west',[32.05,y+.55,300],[.08,1.1,7.8]),('front',[38,y+.55,296.05],[11.9,1.1,.08]),('back',[38,y+.55,303.95],[11.9,1.1,.08]),('east-front',[43.95,y+.55,297.075],[.08,1.1,2.05]),('east-back',[43.95,y+.55,302.925],[.08,1.1,2.05]),('neck-front',[48,y+.55,298.14],[8,1.1,.08]),('neck-back',[48,y+.55,301.86],[8,1.1,.08])]:
  r=add(prefix+'-guard-'+name,p,s,'steel',guardrail=True,role='Public edge protection with open supported entrance');ids.append(r['id']);cap=list(p);cap[1]=y+1.115;size=list(s);size[1]=.025;ids.append(add(r['id']+'-cap',cap,size,'cyan',solid=False,role='Thin rail-edge light; no dynamic light')['id'])
 for j,x in enumerate([32.5,40.8]):ids.append(add(prefix+'-warm-'+str(j),[x,y+4.035,300],[.10,.025,6.8],'warm',solid=False,role='Warm luminaire attached beneath visible roof beam; no dynamic light')['id'])
 for side in[-1,1]:ids.append(add(prefix+'-roof-edge-'+str(side),[38,y+4.52,300+side*4.17],[12.3,.045,.03],'cyan',solid=False,role='Thin roof fascia light')['id'])
 levels.append({'id':prefix,'elevation':y,'recordIDs':ids,'path':[[55,y,300],[48,y,300],[38,y,300],[38,y,297.7]],'entranceWidth':3.5,'publicFunction':'Sheltered public seating terrace and outlook connected to existing gallery','originalBuilding':141,'sourceSurface':('upper-gallery-W-300'if y==128 else f'gallery-W-{y}-300')})
for x,z in[(32.5,296.4),(32.5,303.6),(40.8,296.4),(40.8,303.6),(51.2,303.6)]:
 add(f'terrace-frame-{x}-{z}',[x,66.25,z],[.5,132.5,.5],'steel',role='Independent frame rooted on clear ground; no structural dependency on destructible original building')
 # Narrow cyan panel on outward face, inside the existing column envelope.
 add(f'terrace-frame-light-{x}-{z}',[x-.251,66.25,z],[.008,132.1,.045],'cyan',solid=False,role='Attached continuous frame marker; no dynamic light')
mods={r['after']['id']:r['after']for r in modified};obstacles=[{'id':p['id'],'box':p['box']}for b in world['buildings']for p in b['parts']]+[{'id':p['id'],'box':p['box']}for p in world['props']if p['type']!='vertical-structure']+[{'id':r['id'],'box':mods.get(r['id'],r)['box']}for r in base['records']if r['solid']]
for r in records:
 if r['solid']:
  hits=[o['id']for o in obstacles if overlap(r['box'],o['box'])]
  if hits:failures.append({'id':r['id'],'kind':'existing geometry','hits':hits})
for level in levels:
 for a,b in zip(level['path'],level['path'][1:]):
  body={'min':[min(a[i],b[i])+[-.665,.03,-.665][i]for i in range(3)],'max':[max(a[i],b[i])+[.665,2.14,.665][i]for i in range(3)]}
  hits=[o['id']for o in obstacles+records if o.get('solid',True)and overlap(body,o['box'])]
  if hits:failures.append({'level':level['id'],'kind':'terrace body corridor','hits':hits})
# Enclose every aerial path segment with a conservative direction-independent
# half diagonal; this includes allowed bank and the entire spline corridor here.
# Existing traffic is far to the east of the complete new frame footprint.
min_air_x=min(p[0]for lane in air['lanes']for p in lane['points'])-4;max_new_x=max(r['box']['max'][0]for r in records);assert min_air_x>max_new_x+1
for r in records:
 if r['id'].startswith('terrace-frame-')and r['solid']:
  ground=r['box'];
  for patch in world['roads']['surfacePatches']:
   b=patch['bounds'];b={side:[b[side][axis]for axis in ['x','y','z']]for side in ['min','max']}
   if all(ground['min'][i]<b['max'][i]-1e-5 and ground['max'][i]>b['min'][i]+1e-5 for i in [0,2]):failures.append({'id':r['id'],'kind':'road or sidewalk footprint','patch':patch.get('id')})
report={'status':'PASS source/portal/path preflight'if not failures else'FAIL preflight','sources':{f:sha(f)for f in files},'levels':levels,'records':records,'controlledModifications':modified,'failures':failures,'airEnvelopeMinimumX':min_air_x,'newGeometryMaximumX':max_new_x,'roadSurfaceFootprintChecks':5*len(world['roads']['surfacePatches']),'scope':'Actual source geometry and body corridors; native input, source exports and visual review remain separate'};(D/'V02_Public_Terrace_Plan.json').write_text(json.dumps(report,indent=2)+'\n');print(report['status'],len(records),'new records',len(modified),'controlled rail changes');print(failures[:20]);assert not failures
