"""Source-cleared stacked loggias and a real 24→128m public stair."""
from pathlib import Path
import json,hashlib,math,gzip
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02'
read=lambda p:json.loads((R/p).read_text());sha=lambda p:hashlib.sha256((R/p).read_bytes()).hexdigest()
source=read('development/vertical-city-v02/V02_Material_Response_Authoring.json')
manifest='assets/city/vertical-v02/maintenance-access/runtime/manifest.json';base=read(manifest);world=read('development/vertical-city-v02/V02_LiveWorld_Authoritative.json')
additions=[];changes=[];routes=[];failures=[];contacts=[]
def bounds(p,s):return{'min':[p[i]-s[i]/2 for i in range(3)],'max':[p[i]+s[i]/2 for i in range(3)]}
def overlap(a,b,eps=1e-5):return all(a['min'][i]<b['max'][i]-eps and a['max'][i]>b['min'][i]+eps for i in range(3))
def add(id,p,s,material='steel',solid=True,walkable=False,**extra):
    r={'id':'loggia-'+id,'owner':'v02:loggia-'+id,'center':p,'size':s,'box':bounds(p,s),'material':material,'solid':solid,'walkable':walkable,'collection':'SM_V02_LOGGIA_TERRACES','loggiaTerraces':True,**extra};additions.append(r);return r
def guard(id,p,s):
    r=add(id,p,s,'glass',guardrail=True,role='Physical low glass edge protection; clear circulation openings')
    cap=p.copy();cap[1]+=s[1]/2+.0125;size=s.copy();size[1]=.025;add(id+'-cap',cap,size,'cyan',solid=False,role='Thin attached cyan edge light; no dynamic light');return r

# The new rooms use the existing independent terrace frame. They do not invent
# private interiors or doorways through the preserved original tower.
for y,title in [(40,'Public resting loggia'),(68,'Service-worker break loggia'),(100,'High-city waiting loggia')]:
    add(f'room-{y}-floor',[36.4,y-.30,300],[8.8,.6,8],'deck',walkable=True,role=title+' walking floor')
    for x in [32.5,40.8]:
        b=add(f'room-{y}-floor-beam-{x}',[x,y-.9,300],[.35,.6,7.6],role='Floor girder contacts retained ground-rooted terrace columns')
        for z in [296.4,303.6]:contacts.append({'lower':f'terrace-frame-{x}-{z}','upper':b['id']})
    add(f'room-{y}-roof',[36.4,y+4.475,300],[9.1,.25,8.3],'deck',walkable=True,roofSoffit=True,role='Closed coffered canopy; actual solid roof landing surface')
    for x in [32.5,40.8]:
        add(f'room-{y}-roof-post-{x}',[x,y+2.15,303.6],[.18,4.3,.18],role='Canopy pier on retained independent frame')
        add(f'room-{y}-roof-beam-{x}',[x,y+4.2,300],[.22,.30,7.6],role='Canopy beam on retained terrace frame')
    add(f'room-{y}-rear-glass',[36.55,y+2,303.55],[7.3,4,.09],'glass',role='Tinted rear enclosure between retained piers; no fake interior opening')
    for x in [33,35.3,37.6,39.9]:add(f'room-{y}-rear-mullion-{x}',[x,y+2.05,303.48],[.075,4.1,.10],solid=False,role='Attached rear glazing mullion')
    guard(f'room-{y}-side-guard-west',[32.05,y+.55,300],[.08,1.1,7.8])
    guard(f'room-{y}-side-guard-east',[40.75,y+.55,300],[.08,1.1,6.7])
    guard(f'room-{y}-back-guard',[36.4,y+.55,303.95],[8.7,1.1,.08])
    # 3.2m front entrance aligns with the real stair landing.
    for side,x,w in [('left',33.375,2.65),('right',39.425,2.65)]:guard(f'room-{y}-front-{side}',[x,y+.55,296.05],[w,1.1,.08])
    for x in [34,38.5]:
        add(f'room-{y}-bench-{x}',[x,y+.24,302.1],[2,.48,.65],'deck',role='Solid seating outside through-circulation')
        add(f'room-{y}-planter-{x}',[x,y+.4,303.02],[1.7,.8,.55],role='Planted bed outside through-circulation')
        add(f'room-{y}-foliage-{x}',[x,y+1.03,303.02],[1.6,.66,.5],'foliage',solid=False,primitive='foliage',role='Low foliage within planted bed')
    for x in [33.2,35.3,37.5,39.6]:add(f'room-{y}-warm-{x}',[x,y+4.06,300],[.09,.025,6.7],'warm',solid=False,role='Warm luminaire fixed to canopy; no dynamic light')
    add(f'room-{y}-roof-cyan',[36.4,y+4.5,295.83],[9.1,.035,.03],'cyan',solid=False,role='Thin cyan canopy fascia')
    path=[[36.4,y,294.2],[36.4,y,298],[36.4,y,300.5],[36.4,y,298],[36.4,y,294.2]]
    if y in [68,100]:path=[[36.4,y,284.2]]+path+[[36.4,y,284.2]]
    routes.append({'floor':y,'title':title,'roomPath':path})

# Controlled rail openings only at the three retained public terrace entries.
for y in [24,52,128]:
    for suffix in ['', '-cap']:
        old=next(r for r in base['records']if r['id']==f'public-terrace-{y}-guard-front'+suffix)
        new=json.loads(json.dumps(old));lo=old['box']['min'][0];hi=34.8;new['center'][0]=(lo+hi)/2;new['size'][0]=hi-lo;new['box']=bounds(new['center'],new['size']);changes.append({'before':old,'after':new,'reason':'Actual3.2m public stair doorway; visual and physical rail cut together'})
        extra=add(f'old-terrace-{y}-front-right'+suffix,[40.955,old['center'][1],old['center'][2]],[5.91,old['size'][1],old['size'][2]],old['material'],old['solid'],guardrail=not suffix,role='Retained terrace rail right half around real stair entrance')

room_levels={24,40,52,68,100,128};stair=[]
for flight in range(26):
    low=24+flight*4;high=low+4;lane=33.5 if flight%2==0 else 39.1
    south_to_north=flight%2==0;near=293.2 if south_to_north else 285.64;direction=-1 if south_to_north else 1
    start=[lane,low,294.2 if south_to_north else 284.2];end=[lane,high,284.2 if south_to_north else 294.2]
    if not stair:stair.append([36.4,24,294.2])
    stair.append(start);stair.append(end)
    for j in range(21):
        top=low+(j+1)*4/21;z=near+direction*(j+.5)*.36
        add(f'stair-{flight:02d}-tread-{j:02d}',[lane,top-.09,z],[2.6,.18,.36],'deck',walkable=True,stair=True,flight=flight,role='Physical public stair tread; rise4/21m')
        for side in [-1,1]:guard(f'stair-{flight:02d}-guard-{j:02d}-{side}',[lane+side*1.34,top+.55,z],[.08,1.1,.36])
    stair.append([36.4,high,end[2]])
# Every landing is a real floor; only destinations project through to old/new
# room entrances. Intermediate landings stay clear of old canopy overhangs.
for y in range(24,129,4):
    # flight0 ends north at28, flight1 south at32, etc.
    north=(y-24)%8==4
    z0,z1=(282.64,285.64)if north else(293.2,296 if y in room_levels else 295.55)
    floor=add(f'landing-{y}',[36.4,y-.09,(z0+z1)/2],[8.8,.18,z1-z0],'deck',walkable=True,role='Supported stair landing and cross-flight transition')
    for x in [32.05,40.75]:guard(f'landing-{y}-side-{x}',[x,y+.55,(z0+z1)/2],[.08,1.1,z1-z0])
    outside=z0 if north else z1
    if not north and y in room_levels:
        for name,x,w in [('left',33.375,2.65),('right',39.425,2.65)]:guard(f'landing-{y}-outer-{name}',[x,y+.55,outside-.04],[w,1.1,.08])
    else:guard(f'landing-{y}-outer',[36.4,y+.55,outside+(.04 if north else-.04)],[8.7,1.1,.08])
    for x in [32.2,40.6]:add(f'landing-{y}-girder-{x}',[x,y-.39,(z0+z1)/2],[.28,.42,z1-z0],role='Landing girder on continuous independent ground supports')
for y in [52,68,100]:
    add(f'central-walk-{y}',[36.4,y-.09,290.82],[2.8,.18,10.36],'deck',walkable=True,role='Supported cross-core room approach from north stair landing')
    for x in [35.1,37.6]:guard(f'central-walk-{y}-guard-{x}',[x,y+.55,290.82],[.08,1.1,10.36])
    # The central beam rests on north/south landing girders; no unsupported
    # vertical adjacency is represented as a walk edge.
    add(f'central-walk-{y}-beam',[36.4,y-.39,290.82],[.28,.42,10.36],role='Longitudinal girder spans the actual two stair landings')
for x in [32.2,40.6]:
    for z in [282.9,295.5]:add(f'frame-{x}-{z}',[x,66.25,z],[.4,132.5,.4],role='Continuous public-stair frame rooted on validated clear ground')

# Exact old contacts are retained; new architecture must clear source solids.
modified={r['after']['id']:r['after']for r in changes};old=[modified.get(r['id'],r)for r in base['records']if r['solid']]
obstacles=[{'id':r['id'],'box':r['box']}for b in world['buildings']for r in b['parts']]
obstacles += [{'id':r['id'],'box':r['box']}for r in world['props']if r['type']!='vertical-structure']+old
envelope={'min':[min(r['box']['min'][i]for r in additions)-.01 for i in range(3)],'max':[max(r['box']['max'][i]for r in additions)+.01 for i in range(3)]}
obstacles=[o for o in obstacles if overlap(o['box'],envelope)]
intentional=[]
for r in additions:
    if not r['solid']:continue
    hits=[o['id']for o in obstacles if overlap(r['box'],o['box'])]
    # Floor beams deliberately cross the retained ground-rooted terrace piers.
    contacts_hit=[id for id in hits if (id.startswith('terrace-frame-')and ('floor'in r['id']or'roof'in r['id']))]
    intentional += [{'addition':r['id'],'contact':id}for id in contacts_hit]
    hits=[id for id in hits if id not in contacts_hit]
    if hits:failures.append({'id':r['id'],'kind':'Existing source-solid overlap','hits':hits})
for r in additions:
    if not r['id'].startswith('loggia-frame-'):continue
    for patch in world['roads']['surfacePatches']:
        b=patch['bounds'];b={s:[b[s][axis]for axis in ['x','y','z']]for s in ['min','max']}
        if all(r['box']['min'][i]<b['max'][i]-1e-5 and r['box']['max'][i]>b['min'][i]+1e-5 for i in [0,2]):failures.append({'id':r['id'],'kind':'Ground road/sidewalk footprint','patch':patch.get('id')})
report={'status':'PASS source preflight'if not failures else'FAIL source preflight','sourceManifest':manifest,'sourceManifestSHA256':sha(manifest),'sourceMaster':source['master'],'sourceMasterSHA256':source['masterSHA256'],'additions':additions,'changes':changes,'rooms':routes,'stairPoints':stair,'failures':failures,'intentionalSourceContacts':intentional,'sourceSupportConnections':contacts,'newDynamicLights':0,'originalBuildingChanges':0,'scope':'Actual source coordinates; saved Blender/export/native input and camera acceptance remain separate'}
(D/'V02_Loggia_Terraces_Plan.json').write_text(json.dumps(report,indent=2)+'\n');print(report['status'],len(additions),'new components,',len(changes),'rail changes');print(json.dumps(failures[:25],indent=2));assert not failures
