"""Blender-first modular V02 graybox. --pilot proves staircase contact first.
Blender coordinates (x,-z,y) export back to game Y-up with standard glTF export.
Reference meshes are actual loaded city meshes, shared by family, never exported.
"""
import bpy,json,sys,math,hashlib
from pathlib import Path
from mathutils import Matrix
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';G=json.loads((D/'V02_Movement_Graph.json').read_text());world=json.loads((D/'V02_LiveWorld_Authoritative.json').read_text())
args=sys.argv[sys.argv.index('--')+1:]if'--'in sys.argv else [];pilot='--pilot'in args
OUT=R/'assets/city/vertical-v02'/('pilot'if pilot else'graybox');OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
collections={}
for n in ['SM_EXISTING_REFERENCE','SM_V02_BLOCKOUT','SM_V02_SKYBRIDGES','SM_V02_GALLERIES','SM_V02_TRANSIT_STRUCTURES','SM_V02_ELEVATED_ROADS','SM_V02_VERTICAL_TRANSFERS','SM_V02_BUILDING_EXTENSIONS','SM_V02_SERVICE_YARDS','SM_V02_MARKET','SM_V02_ROOFTOP_ROUTES','SM_V02_LANDMARKS','SM_V02_COLLISION','SM_V02_THREADRAIL_SURFACES','SM_V02_TRAIN_ROUTES','SM_V02_AERIAL_TRAFFIC_ROUTES','SM_V02_ENCOUNTER_POINTS','SM_V02_CAMERA_BOOKMARKS','SM_V02_EXPORT']:
 c=bpy.data.collections.new(n);bpy.context.scene.collection.children.link(c);collections[n]=c
materials={}
for name,color,metal,rough in [('deck',(0.06,.12,.18,1),.45,.5),('steel',(.035,.07,.1,1),.65,.4),('cyan',(.025,.65,.78,1),.2,.4),('warm',(.8,.42,.14,1),.15,.6),('reference',(.045,.075,.105,1),.25,.6)]:
 m=bpy.data.materials.new('V02_'+name);m.diffuse_color=color;m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=color;p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
 if name in['cyan','warm']:p.inputs['Emission Color'].default_value=color;p.inputs['Emission Strength'].default_value=.7
 materials[name]=m
# Exact reference mesh data, no procedural substitute towers.
C=Matrix(((1,0,0,0),(0,0,-1,0),(0,1,0,0),(0,0,0,1)))
if not pilot:
 geos=json.loads((D/'V02_BuildingGeometry.json').read_text())['geometries'];ref={}
 for g in geos:
  if g['id']=='geometry-8':continue
  p=g['positions'];verts=[p[i:i+3]for i in range(0,len(p),3)];idx=g['indices']or list(range(len(verts)));mesh=bpy.data.meshes.new(g['id']);mesh.from_pydata(verts,[],[idx[i:i+3]for i in range(0,len(idx),3)]);mesh.materials.append(materials['reference']);ref[g['id']]=mesh
 for b in world['buildings']:
  o=bpy.data.objects.new(b['id'],ref[b['geometry']]);collections['SM_EXISTING_REFERENCE'].objects.link(o);m=b['transform']['matrixWorld'];o.matrix_world=C@Matrix([m[i::4]for i in range(4)]);o['runtimeExistingID']=b['id'];o['export']=False
records=[];chunks={};walkpaths={};serial=0
verts0=[(-1,-1,-1),(-1,-1,1),(-1,1,-1),(-1,1,1),(1,-1,-1),(1,-1,1),(1,1,-1),(1,1,1)]
faces0=[(0,4,6,2),(1,3,7,5),(0,1,5,4),(2,6,7,3),(0,2,3,1),(4,5,7,6)]
def raw_add(id,p,size,col='SM_V02_VERTICAL_TRANSFERS',kind='deck',solid=True,walkable=False,**extra):
 global serial
 assert all(math.isfinite(v)and v>0 for v in size)
 lo=[p[i]-size[i]/2 for i in range(3)];hi=[p[i]+size[i]/2 for i in range(3)]
 rec={'id':id,'owner':'v02:'+id,'center':p,'size':size,'box':{'min':lo,'max':hi},'solid':solid,'walkable':walkable,'material':kind,'collection':col,**extra};records.append(rec)
 # Keep editable architectural components in semantic collections in the master.
 unit_name='V02_author_unit_'+kind
 unit=bpy.data.meshes.get(unit_name)
 if unit is None:
  unit=bpy.data.meshes.new(unit_name);unit.from_pydata(verts0,[],[tuple(reversed(f))for f in faces0]);unit.materials.append(materials[kind])
 author=bpy.data.objects.new(id,unit);collections[col].objects.link(author);author.location=(p[0],-p[2],p[1]);author.scale=(size[0]/2,size[2]/2,size[1]/2);author['v02StableID']=id;author['runtimeOwner']='v02:'+id;author['solid']=solid;author['walkable']=walkable;author['exportRole']='authoring component; runtime uses separately selected export batches'
 if solid:
  proxy=bpy.data.objects.new(id+'__COL',None);collections['SM_V02_COLLISION'].objects.link(proxy);proxy.empty_display_type='CUBE';proxy.empty_display_size=1;proxy.location=author.location;proxy.scale=author.scale;proxy['sourceComponent']=id

 zone='pilot'if pilot else f'{int(p[1]//28):02d}-{int(p[2]//60):02d}'
 key=(zone,kind);entry=chunks.setdefault(key,{'verts':[],'faces':[],'records':[],'collection':col});start=len(entry['verts'])
 for v in verts0:
  x,y,z=[p[i]+v[i]*size[i]/2 for i in range(3)];entry['verts'].append((x,-z,y))
 entry['faces'] += [tuple(start+i for i in reversed(f))for f in faces0];entry['records'].append(id)
 return rec
def subtract(rect,cut):
 x0,x1,z0,z1=rect;a,b,c,d=cut
 if a>=x1-1e-6 or b<=x0+1e-6 or c>=z1-1e-6 or d<=z0+1e-6:return[rect]
 a=max(a,x0);b=min(b,x1);c=max(c,z0);d=min(d,z1);out=[]
 if a>x0+1e-6:out.append((x0,a,z0,z1))
 if b<x1-1e-6:out.append((b,x1,z0,z1))
 if c>z0+1e-6:out.append((a,b,z0,c))
 if d<z1-1e-6:out.append((a,b,d,z1))
 return out
def add(id,p,size,col='SM_V02_VERTICAL_TRANSFERS',kind='deck',solid=True,walkable=False,**extra):
 if not walkable:return raw_add(id,p,size,col,kind,solid,walkable,**extra)
 top=p[1]+size[1]/2;rects=[(p[0]-size[0]/2,p[0]+size[0]/2,p[2]-size[2]/2,p[2]+size[2]/2)]
 # A shared top surface is emitted once, including adjacent landing/bridge junctions.
 for r in records:
  if r['walkable']and abs(r['box']['max'][1]-top)<1e-5:
   q=r['box'];cut=(q['min'][0],q['max'][0],q['min'][2],q['max'][2]);rects=[v for rect in rects for v in subtract(rect,cut)]
 out=[]
 for i,(x0,x1,z0,z1)in enumerate(rects):out.append(raw_add(id if len(rects)==1 else f'{id}-union-{i}',[(x0+x1)/2,p[1],(z0+z1)/2],[x1-x0,size[1],z1-z0],col,kind,solid,walkable,sourceStructure=id,**extra))
 return out[0]if out else None
# Cut real openings over the final stair flight; a closed slab would block the climb.
openings=[]
for spec in G['publicStairs']:
 for lo,hi in zip(spec['levels'],spec['levels'][1:]):
  flights=math.ceil((hi-lo)/3.2-1e-9);rise=(hi-lo)/flights;run=math.ceil(rise/.18)*.36;xj=spec['x']-3 if (flights-1)%2==0 else spec['x']+3
  openings.append((hi,(xj-2.25,xj+2.25,spec['z']-3-.65,spec['z']-3+run+.65)))
  approach=spec['z']-4.5 if (flights-1)%2==0 else spec['z']-3+run+1.5
  openings.append((hi,(spec['x']-5.25,spec['x']+8.45,approach-2.15,approach+2.15)))
if not pilot:
 for st in G['structures']:
  p=st['center'];sz=st['size'];top=p[1]+sz[1]/2;rects=[(p[0]-sz[0]/2,p[0]+sz[0]/2,p[2]-sz[2]/2,p[2]+sz[2]/2)]
  for y,cut in openings:
   if abs(y-top)<1e-5 and not st.get('besideStairFlight'):rects=[v for r in rects for v in subtract(r,cut)]
  for i,(x0,x1,z0,z1)in enumerate(rects):add(st['id']if len(rects)==1 else st['id']+f'-opening-{i}',[(x0+x1)/2,p[1],(z0+z1)/2],[x1-x0,sz[1],z1-z0],st['collection'],walkable=st.get('walkable',False))
def landing(id,x,y,z,width=12.4,depth=3):
 # Offset east to provide an outside return corridor without covering stair flights.
 return add(id,[x+1.6,y-.09,z],[width,.18,depth],walkable=True,stairLanding=True)
def staircase(spec,pilot_only=False):
 id=spec['id'];x=spec['x'];z=spec['z'];levels=spec['levels'];paths=[]
 for seg,(lo,hi)in enumerate(zip(levels,levels[1:])):
  flights=math.ceil((hi-lo)/3.2-1e-9);rise=(hi-lo)/flights;steps=math.ceil(rise/.18);run=steps*.36;north=z-4.5;south=z-3+run+1.5;poly=[[x-3,lo,north]]
  for j in range(flights):
   y0=lo+j*rise;y1=y0+rise;xj=x-3 if j%2==0 else x+3;sign=1 if j%2==0 else-1;front=z-3 if sign>0 else z-3+run
   if j==0:landing(f'{id}-{seg}-start',x,y0,north)
   poly.append([xj,y0,north if sign>0 else south])
   flight=f'{id}-{seg}-flight-{j}'
   for k in range(steps):
    top=y0+(k+1)*rise/steps;zz=front+sign*(k+.5)*.36
    add(f'{flight}-riser-{k}',[xj,top-.09,zz],[3.2,.18,.36],walkable=True,stair=True,flight=flight,stepRise=rise/steps)
   endz=south if sign>0 else north;landing(f'{id}-{seg}-landing-{j}',x,y1,endz)
   poly += [[xj,y1,endz],[x+3 if sign>0 else x-3,y1,endz]]
   if pilot_only and j==1:
    poly += [[x-3,y1,north]];walkpaths[id]={'points':poly,'endHeight':y1,'maxRise':rise/steps,'tread':.36};return
  # If the last flight arrives south, a supported outside corridor returns to the public north portal.
  if flights%2:
   landing(f'{id}-{seg}-north-exit',x,hi,north)
   add(f'{id}-{seg}-return',[x+6.2,hi-.09,(north+south)/2],[3.2,.18,south-north],walkable=True,stairLanding=True)
   poly += [[x+6.2,hi,south],[x+6.2,hi,north],[x-3,hi,north]]
  poly.append([x-3,hi,north]);paths.append({'from':lo,'to':hi,'points':poly})
  for y in([lo,hi]if spec.get('publicPortal',True)else[]):
   # Landing portals meet the public gallery; any coplanar overlaps are flagged in the graybox audit.
   side=55 if x<80 else 96;middle=(side+x-3)/2;width=abs(side-(x-3))
   if width>.01:add(f'{id}-{seg}-portal-{y}',[middle,y-.09,north],[width,.18,3],walkable=True,stairLanding=True)
 walkpaths[id]={'segments':paths,'endHeight':levels[-1]}
if pilot:staircase(G['publicStairs'][0],True)
else:
 for spec in G['publicStairs']:staircase(spec)
 # District support cadence and visible structural continuity, outside central road lane.
 for x in[59.4,91]:
  for z in[204,270,346,386,438]:add(f'column-{x}-{z}',[x,64,z],[1.2,128,1.2],kind='steel')
# Source objects are grouped by spatial chunk/material, with matching metadata IDs.
manifest=[]
for (zone,kind),v in chunks.items():
 name=f'v02-{zone}-{kind}';mesh=bpy.data.meshes.new(name);mesh.from_pydata(v['verts'],[],v['faces']);mesh.materials.append(materials[kind]);mesh.update();o=bpy.data.objects.new(name,mesh);collections['SM_V02_EXPORT'].objects.link(o);o['v02Chunk']=name;o['runtimeIDs']=json.dumps(v['records']);o['sourceAuthority']='V02_LiveWorld_Authoritative.json'
 bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
 file=OUT/(name+'.glb');bpy.ops.export_scene.gltf(filepath=str(file),export_format='GLB',use_selection=True,export_yup=True,export_extras=True,export_materials='EXPORT')
 manifest.append({'id':name,'url':str(file.relative_to(R)),'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'bytes':file.stat().st_size,'triangles':len(v['faces'])*2,'recordIDs':v['records']})
# No reference object may enter a chunk export.
assert all(not id.startswith('building-')for v in chunks.values()for id in v['records'])
meta={'schema':'sm-v02-graybox-1','pilot':pilot,'coordinateSystem':'game X/Y-up/Z metres; deck tops and actor +.42 are distinct','sourceEntrySHA256':world['provenance']['entrySHA256'],'graphSHA256':hashlib.sha256((D/'V02_Movement_Graph.json').read_bytes()).hexdigest(),'records':records,'paths':walkpaths,'encounters':G.get('encounters',[]),'chunks':manifest,'referenceOnlyBuildingCount':0 if pilot else len(world['buildings']),'status':'EXPERIMENTAL GRAYBOX; no gameplay acceptance claim'}
(OUT/'manifest.json').write_text(json.dumps(meta,indent=2)+'\n')
# Encounter authoring markers stay editable and reference the exact exported
# runtime positions. They are metadata, never invisible collision geometry.
if not pilot:
 for encounter in G.get('encounters',[]):
  for name,p in [('access',encounter['trigger'])]+[(f'actor-{i}',p)for i,p in enumerate(encounter['positions'])]+[(name,encounter[name])for name in ['isolation','extraction']if name in encounter]:
   o=bpy.data.objects.new(encounter['id']+'-'+name,None);collections['SM_V02_ENCOUNTER_POINTS'].objects.link(o);o.location=(p[0],-p[2],p[1]);o.empty_display_type='ARROWS';o.empty_display_size=.8;o['runtimePosition']=json.dumps(p);o['encounterID']=encounter['id'];o['exportRole']='metadata only'
# Matching raw view bookmarks are created now; detailed render matching remains a later gate.
from mathutils import Vector
for id,p,look in[('A',(78,132,185),(82,70,400)),('B',(80,2,185),(80,90,400))]:
 data=bpy.data.cameras.new('V02-camera-'+id);o=bpy.data.objects.new('V02-camera-'+id,data);collections['SM_V02_CAMERA_BOOKMARKS'].objects.link(o);o.location=(p[0],-p[2],p[1]);target=Vector((look[0],-look[2],look[1]));o.rotation_euler=(target-o.location).to_track_quat('-Z','Y').to_euler();data.lens=35
bpy.context.scene.unit_settings.system='METRIC';bpy.context.scene.world.color=(.02,.035,.05)
collections['SM_V02_EXPORT'].hide_viewport=True;collections['SM_V02_EXPORT'].hide_render=True;collections['SM_V02_COLLISION'].hide_viewport=True;collections['SM_V02_COLLISION'].hide_render=True
master=D/'blender'/('SaintMeridian_V02_Stair_Pilot.blend'if pilot else'SaintMeridian_V02_AAA_Master.blend');bpy.ops.wm.save_as_mainfile(filepath=str(master))
print(json.dumps({'master':str(master),'chunks':len(manifest),'records':len(records),'triangles':sum(m['triangles']for m in manifest),'pilot':pilot}))
