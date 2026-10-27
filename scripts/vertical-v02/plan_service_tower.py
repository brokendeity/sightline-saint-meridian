"""Replace four solid climb-block interiors with actual stepped plant chambers.

Preserve every measured front climb plane and the complete original roof-top
footprint. New surfaces stay inside those accepted volumes, except small
floor infills beside existing supported slabs. No original city shell moves.
"""
from pathlib import Path
import copy,gzip,hashlib,json,math
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';read=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
basefile='assets/city/vertical-v02/station-pavilion/runtime/manifest.json';base=read(R/basefile);world=read(D/'V02_LiveWorld_Authoritative.json');records=[];changes=[];rooms=[];contacts=[]
def box(p,s):return {'min':[p[i]-s[i]/2 for i in range(3)],'max':[p[i]+s[i]/2 for i in range(3)]}
def overlap(a,b):return all(a['min'][i]<b['max'][i]-1e-5 and a['max'][i]>b['min'][i]+1e-5 for i in range(3))
def add(id,p,s,mat='steel',solid=True,walkable=False,**extra):
 r={'id':id,'owner':'v02:'+id,'center':p,'size':s,'box':box(p,s),'material':mat,'solid':solid,'walkable':walkable,'collection':'SM_V02_ROOFTOP_ROUTES','serviceTower':True,**extra};records.append(r);return r
def rect(id,x0,x1,y0,y1,z0,z1,**kw):return add(id,[(x0+x1)/2,(y0+y1)/2,(z0+z1)/2],[x1-x0,y1-y0,z1-z0],**kw)
def subtract(a,b):
 x0,x1,z0,z1=a;u0,u1,v0,v1=b;u0=max(x0,u0);u1=min(x1,u1);v0=max(z0,v0);v1=min(z1,v1)
 if u1<=u0+1e-6 or v1<=v0+1e-6:return[a]
 return[r for r in [(x0,u0,z0,z1),(u1,x1,z0,z1),(u0,u1,z0,v0),(u0,u1,v1,z1)]if r[1]-r[0]>1e-5 and r[3]-r[2]>1e-5]
priorRoofs=[]
for top in [96,108,120,128]:
 old=next(r for r in base['records']if r['id']=='mastery-wall-room-'+str(top));floor=old['box']['min'][1];back=old['box']['min'][2];front=old['box']['max'][2];prefix='service-plant-'+str(top);first=len(records)
 main=copy.deepcopy(old);main['center']=[64,(floor+top)/2,front-.15];main['size']=[8,top-floor,.3];main['box']=box(main['center'],main['size']);main['material']='steel';main['role']='Full-width original climb/firewall plane and top retained; former solid plant-room interior is physically hollow';changes.append({'before':old,'after':main})
 roof=rect(prefix+'-roof',60,68,top-.6,top,back,front-.3,mat='deck',walkable=True,roofSoffit=True,sourceRoom=old['id'],role='Flat supported roof joins the preserved front-wall top without overlapping it')
 # Fill only uncovered floor regions. Existing courtyard and preceding roof
 # continue to support their actual areas; no doubled horizontal surfaces.
 pieces=[(60,68,back,front-.3)]
 covers=[r for r in base['records']if r['walkable']and abs(r['box']['max'][1]-floor)<1e-5 and not r['id'].startswith('mastery-wall-room-')]+priorRoofs
 for r in covers:
  b=r['box'];pieces=[p for a in pieces for p in subtract(a,(b['min'][0],b['max'][0],b['min'][2],b['max'][2]))]
 floors=[]
 for i,(x0,x1,z0,z1)in enumerate(pieces):floors.append(rect(prefix+'-floor-'+str(i),x0,x1,floor-.4,floor,z0,z1,mat='deck',walkable=True,sourceRoom=old['id'],role='Non-overlapping floor infill adjoining existing supported slab/previous roof'))
 priorRoofs += [roof,main]
 # Four steel portal posts and longitudinal roof beams articulate the original
 # stepped mass. Upper floors overlap4m of the preceding structural roof.
 for x in [60.15,67.85]:
  for z in [back+.15,front-.45]:
   post=add(prefix+f'-post-{x}-{z}',[x,(floor+top-.6)/2,z],[.3,top-.6-floor,.3],sourceRoom=old['id'],role='Continuous plant-bay portal post on the actual floor, bearing at the roof underside');contacts.append({'lower':post['id'],'upper':roof['id']})
  add(prefix+f'-roof-girder-{x}',[x,top-.85,(back+front-.3)/2],[.3,.5,front-.3-back],sourceRoom=old['id'],role='Longitudinal roof girder between portal posts')
 def glasswall(side,z0,z1,y0,y1):
  if min(z1-z0,y1-y0)<.01:return
  serial=sum(r['id'].startswith(prefix+'-'+side+'-glass-')for r in records)
  if side=='rear':r=rect(prefix+'-'+side+'-glass-'+str(serial),z0,z1,y0,y1,back,back+.15,mat='glass')
  else:
   x0,x1=(60,60.15)if side=='west'else(67.85,68);r=rect(prefix+'-'+side+'-glass-'+str(serial),x0,x1,y0,y1,z0,z1,mat='glass')
  r.update(sourceRoom=old['id'],role='Actual transparent enclosure of a volumetric plant chamber, not a painted interior')
 # Human-scale transom rhythm, even in a tall industrial room.
 levels=[floor]+[floor+3.6*i for i in range(1,4)if floor+3.6*i<top-.9]+[top-.6]
 for i,(a,b)in enumerate(zip(levels,levels[1:])):
  y0=a+(.16 if i else .28);y1=b-.06
  glasswall('rear',60.3,67.7,y0,y1)
  for side in ['west','east']:
   lo,hi=back+.3,front-.6
   if top==96 and side=='west':
    glasswall(side,lo,294.48,y0,y1);glasswall(side,297.32,hi,y0,y1)
    glasswall(side,294.48,297.32,max(y0,floor+2.92),y1)
   else:glasswall(side,lo,hi,y0,y1)
  if i:
   y=a+.05;add(prefix+'-rear-transom-'+str(i),[64,y,back+.075],[7.4,.12,.15],sourceRoom=old['id'])
   for side,x in [('west',60.075),('east',67.925)]:add(prefix+'-'+side+'-transom-'+str(i),[x,y,(back+front-.3)/2],[.15,.12,front-back-.9],sourceRoom=old['id'])
 if top==96:
  for z in [294.54,297.26]:add(prefix+'-door-jamb-'+str(z),[60.075,floor+1.4,z],[.15,2.8,.12],sourceRoom=old['id'])
  add(prefix+'-door-header',[60.075,floor+2.86,295.9],[.15,.12,2.84],sourceRoom=old['id'],role='Open2.6m west inspection entrance; no fake door or disabled wall')
 # Real plant equipment, with load-bearing skids and contained grille details.
 for x in [63,65]:add(prefix+'-machine-skid-'+str(x),[x,floor+.1,back+4],[.28,.2,3.2],sourceRoom=old['id'],role='Grounded machine skid')
 machine=add(prefix+'-machine',[64,floor+2.6,back+4],[3,4.8,3.2],sourceRoom=old['id'],role='Closed heat-exchanger/ventilation housing in the visible chamber')
 ductH=min(3.6,top-floor-5.4);add(prefix+'-duct',[64.9,floor+5+ductH/2,back+4],[.9,ductH,1.2],sourceRoom=old['id'],role='Equipment-supported vertical ventilation riser')
 add(prefix+'-fan',[64,floor+2.7,back+2.385],[1.8,1.8,.03],mat='steel',solid=False,primitive='fan',sourceSurface=machine['id'],sourceRoom=old['id'],role='Closed low-poly fan/grille relief attached to the physical housing')
 add(prefix+'-control-panel',[62.485,floor+1.5,back+4],[.03,.52,.65],mat='warm',solid=False,sourceSurface=machine['id'],sourceRoom=old['id'],role='Housing-mounted warm status panel; no dynamic light')
 for j,z in enumerate([back+3,back+7.8]):add(prefix+'-ceiling-light-'+str(j),[64,top-.6125,z],[2.8,.025,.08],mat='warm',solid=False,sourceSurface=roof['id'],sourceRoom=old['id'],role='Warm fixture flush-mounted below the roof, outside the measured climb band')
 rooms.append({'id':prefix,'floor':floor,'roofTop':top,'sourceRoom':old['id'],'frontZ':front,'backZ':back,'climbFaceUnchanged':{'normal':[0,0,1],'z':front,'width':8,'minY':floor,'maxY':top},'roofID':roof['id'],'recordIDs':[r['id']for r in records[first:]],'publicInspectionEntrance':{'center':[60,84,295.9],'clearWidth':2.6,'height':2.8}if top==96 else None,'function':'Sealed service plant; upper maintenance access is outside this pass, no public interior route claimed'if top!=96 else'Grounded inspection bay accessible from the existing84m public gallery'})
oldVolumes=[c['before']['box']for c in changes];exceptions=[];failures=[]
obstacles=[{'id':p['id'],'box':p['box']}for b in world['buildings']for p in b['parts']]+[{'id':p['id'],'box':p['box']}for p in world['props']if p['type']!='vertical-structure']+[{'id':r['id'],'box':r['box']}for r in base['records']if r['solid']and r['id']not in {c['before']['id']for c in changes}]
for r in records+[c['after']for c in changes]:
 if not r['solid']:continue
 for o in obstacles:
  if not overlap(r['box'],o['box']):continue
  inherited=any(all(r['box']['min'][i]>=v['min'][i]-1e-5 and r['box']['max'][i]<=v['max'][i]+1e-5 for i in range(3))and overlap(v,o['box'])for v in oldVolumes)
  if inherited:exceptions.append({'component':r['id'],'existingContact':o['id'],'scope':'Contained in the former solid block and retains its established structural contact'})
  else:failures.append({'component':r['id'],'obstacle':o['id']})
report={'status':'PASS contained service-tower replacement preflight'if not failures else'FAIL preflight','sourceManifest':basefile,'sourceManifestSHA256':sha(R/basefile),'sourceMaster':'development/vertical-city-v02/blender/SaintMeridian_V02_Station_Pavilion.blend','sourceMasterSHA256':sha(D/'blender/SaintMeridian_V02_Station_Pavilion.blend'),'changes':changes,'additions':records,'rooms':rooms,'sourceContacts':contacts,'inheritedContacts':exceptions,'failures':failures,'newDynamicLights':0,'originalBuildingChanges':0,'scope':'Actual chamber shells/equipment and exact old climb planes/complete roof footprint. Full source/GLB/native route/camera acceptance remains separate.'}
(D/'V02_Service_Tower_Plan.json').write_text(json.dumps(report,indent=2)+'\n');print(report['status'],len(records),'new records;',len(exceptions),'inherited contacts;',len(failures),'failures');print(failures[:12]);assert not failures
