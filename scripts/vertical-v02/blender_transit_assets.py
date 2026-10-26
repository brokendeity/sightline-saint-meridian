"""Separate Blender-authored dynamic carriage and continuous rail geometry.

Does not open/write accepted city masters or the immutable Hi3D front. Runtime
coordinate convention: x,y,z -> Blender x,-z,y. No paid asset generation.
"""
import bpy, bmesh, json, math, hashlib
from pathlib import Path
from mathutils import Vector
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';OUT=R/'assets/city/vertical-v02/transit'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene;scene.unit_settings.system='METRIC';scene.unit_settings.scale_length=1
root=bpy.data.collections.new('SM_V02_TRANSIT_ASSETS');scene.collection.children.link(root)
car=bpy.data.collections.new('SM_V02_PASSENGER_CARRIAGE');root.children.link(car)
tracks=bpy.data.collections.new('SM_V02_TRAIN_ROUTES');root.children.link(tracks)
materials={}
for name,color,metal,rough,emission in [
 ('navy',(0.025,.07,.115,1),.62,.32,0),('steel',(.13,.19,.25,1),.72,.38,0),
 ('glass',(.02,.21,.29,1),.45,.19,0),('rubber',(.012,.018,.025,1),.15,.72,0),
 ('cyan',(.06,.74,.95,1),.2,.27,2),('warm',(.95,.57,.23,1),.1,.38,1.3)]:
 m=bpy.data.materials.new('V02_Transit_'+name);m.diffuse_color=color;m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=color;p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
 if emission:p.inputs['Emission Color'].default_value=color;p.inputs['Emission Strength'].default_value=emission
 materials[name]=m
V=[(-1,-1,-1),(-1,-1,1),(-1,1,-1),(-1,1,1),(1,-1,-1),(1,-1,1),(1,1,-1),(1,1,1)]
F=[(0,2,6,4),(1,5,7,3),(0,4,5,1),(2,3,7,6),(0,1,3,2),(4,6,7,5)]
def mesh(name,parts,collection=car,parent=None):
 vertices=[];faces=[];slots=[];palette=[]
 for p,size,kind in parts:
  if kind not in palette:palette.append(kind)
  start=len(vertices)
  for v in V:
   q=[p[i]+v[i]*size[i]/2 for i in range(3)];vertices.append((q[0],-q[2],q[1]))
  faces.extend(tuple(start+i for i in face)for face in F);slots.extend([palette.index(kind)]*6)
 data=bpy.data.meshes.new(name);data.from_pydata(vertices,[],faces);data.update()
 for kind in palette:data.materials.append(materials[kind])
 for p,slot in zip(data.polygons,slots):p.material_index=slot
 obj=bpy.data.objects.new(name,data);collection.objects.link(obj);obj.parent=parent
 return obj
body=[]
def part(p,size,kind='navy'):body.append((p,size,kind))
part([0,-.14,0],[2.96,.28,13.2],'steel');part([0,-.55,0],[2.5,.55,11.8])
part([0,2.74,0],[3.0,.28,13.2]);part([0,2.94,0],[2.45,.12,9.8],'steel')
for z in [-6.5,6.5]:
 part([0,1.3,z],[2.96,2.6,.2]);part([0,1.35,z*1.017],[.95,1.8,.035],'glass')
 part([0,.4,z*1.02],[1.2,.08,.05],'cyan')
for side in [-1,1]:
 x=side*1.46
 # Actual openings at +/-4.15. Closed glass bays between them; no wall behind doors.
 for a,b in [(-6.4,-4.88),(-3.42,3.42),(4.88,6.4)]:
  z=(a+b)/2;span=b-a
  part([x,.42,z],[.08,.84,span]);part([x,2.43,z],[.08,.34,span])
  part([x,1.53,z],[.055,1.38,span],'glass')
  for j in range(math.ceil(span/1.7)+1):
   zz=a+j*span/math.ceil(span/1.7);part([x+side*.018,1.55,zz],[.045,1.42,.055],'steel')
 part([side*1.505,.1,0],[.035,.065,13.0],'cyan')
 part([side*1.41,2.53,0],[.06,.05,12.5],'warm')
 for z in [-4.15,4.15]:
  for end in [-1,1]:part([x,1.15,z+end*.75],[.12,2.3,.10],'steel')
  part([x,2.36,z],[.12,.12,1.6],'warm')
# Seats and a continuous aisle give the visible shell a real interior.
for side in [-1,1]:
 for z in [-2.4,0,2.4]:
  part([side*.96,.48,z],[.65,.12,1.8],'steel');part([side*1.25,.82,z],[.12,.7,1.8])
mesh('passenger_body',body)
doors=[]
for side in [-1,1]:
 for doorway,z in enumerate([-4.15,4.15]):
  for leaf,direction in enumerate([-1,1]):
   name=f'door_{"left" if side<0 else "right"}_{doorway}_{leaf}'
   # Local origin is the sliding leaf centre. Export extras retain its axis/home.
   obj=mesh(name,[([0,1.12,0],[.075,2.22,.69],'navy'),([side*.045,1.47,0],[.025,1.05,.52],'glass'),([side*.061,.63,direction*.25],[.025,.3,.035],'steel')])
   obj.location=(side*1.49,-(z+direction*.355),0);obj['transitRole']='slidingDoor';obj['side']='left' if side<0 else 'right';obj['slideMetres']=direction*.70
   doors.append(name)
bogies=[]
for j,z in enumerate([-4.4,4.4]):
 group=bpy.data.objects.new(f'bogie_{j}',None);car.objects.link(group);group.location=(0,-z,-1.05);group['transitRole']='bogie';group['longitudinalOffset']=z
 mesh(f'bogie_frame_{j}',[([0,0,0],[1.7,.34,2.05],'steel')],parent=group)
 for k,zz in enumerate([-.67,.67]):
  pieces=[]
  for x in [-.7175,.7175]:
   bpy.ops.mesh.primitive_cylinder_add(vertices=20,radius=.40,depth=.24,location=(0,0,0),rotation=(0,math.pi/2,0))
   wheel=bpy.context.object;wheel.name=f'wheel_{j}_{k}_{x}';wheel.data.materials.append(materials['rubber']);wheel.location=(x,0,0);pieces.append(wheel)
  bpy.ops.object.select_all(action='DESELECT')
  for obj in pieces:obj.select_set(True)
  bpy.context.view_layer.objects.active=pieces[0];bpy.ops.object.join();obj=pieces[0]
  # Apply wheel assembly about the axle centre, rather than one wheel's centre.
  bpy.context.scene.cursor.location=(0,0,0);bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
  bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
  for col in list(obj.users_collection):col.objects.unlink(obj)
  car.objects.link(obj);obj.parent=group;obj.location=(0,-zz,-.15);obj.name=f'axle_{j}_{k}';obj['transitRole']='wheelAxle';obj['radius']=.4
 bogies.append(group.name)
for z in [-6.85,6.85]:mesh('coupling_socket_'+str(z),[([0,-.62,z],[.42,.24,.5],'steel')])

def export(collection,file):
 bpy.ops.object.select_all(action='DESELECT')
 for o in collection.all_objects:o.select_set(True)
 bpy.context.view_layer.objects.active=next(o for o in collection.all_objects if o.type=='MESH')
 bpy.ops.export_scene.gltf(filepath=str(file),export_format='GLB',use_selection=True,export_extras=True,export_yup=True)

export(car,OUT/'passenger_car.glb')
# Continuous closed track strips share exact native curve sample end vertices.
# Supports are not invented here; their placement is a separate clearance gate.
engineering=json.loads((D/'V02_Transit_Engineering.json').read_text());samples=engineering['samples'];chunks=[];trackRecords=[]
cross_sections=[('deck',-1.9,1.9,97.65,98.08,'navy'),('rail_left',-.7175-.055,-.7175+.055,98.08,98.3964,'steel'),('rail_right',.7175-.055,.7175+.055,98.08,98.3964,'steel'),('edge_light',-1.94,-1.90,98.12,98.17,'cyan')]
for first in range(0,len(samples),64):
 collection=bpy.data.collections.new(f'track_chunk_{first//64:02}');tracks.children.link(collection)
 for label,x0,x1,y0,y1,kind in cross_sections:
  vertices=[];faces=[]
  last=min(first+64,len(samples))
  for i in range(first,last+1):
   row=samples[i%len(samples)];p=row['p'];t=row['t'];right=(t[2],-t[0])
   for x,y in [(x0,y0),(x1,y0),(x1,y1),(x0,y1)]:
    vertices.append((p[0]+right[0]*x,-(p[2]+right[1]*x),y))
  for i in range(last-first):
   for a,b in [(0,1),(1,2),(2,3),(3,0)]:faces.append((4*i+a,4*i+b,4*(i+1)+b,4*(i+1)+a))
  faces.extend([(3,2,1,0),tuple(4*(last-first)+i for i in range(4))])
  data=bpy.data.meshes.new(label);data.from_pydata(vertices,[],faces);data.update();data.materials.append(materials[kind]);obj=bpy.data.objects.new(label+'_'+str(first//64),data);collection.objects.link(obj)
  obj['transitRole']='fixedTrack';obj['runtimeOwner']='v02-transit-track'
 file=OUT/(collection.name+'.glb');export(collection,file);chunks.append({'url':str(file.relative_to(R)),'sha256':sha(file),'bytes':file.stat().st_size,'firstSample':first,'lastSample':min(first+64,len(samples))})
master=D/'blender/SaintMeridian_V02_Transit_Assets.blend'
scene['coordinateConvention']='Runtime (x,y,z) = Blender (x,z,-y)';scene['hi3dFrontPreserved']=True
bpy.ops.wm.save_as_mainfile(filepath=str(master))
report={'schema':'sm-v02-transit-assets-1','status':'AUTHORED AND EXPORTED; native validation pending','master':str(master.relative_to(R)),'masterSHA256':sha(master),'authoringSHA256':sha(Path(__file__)),
 'definitionSHA256':sha(OUT/'definition.json'),'engineeringSHA256':sha(D/'V02_Transit_Engineering.json'),
 'passenger':{'url':str((OUT/'passenger_car.glb').relative_to(R)),'sha256':sha(OUT/'passenger_car.glb'),'bytes':(OUT/'passenger_car.glb').stat().st_size,'doors':doors,'bogies':bogies},
 'trackChunks':chunks,'originalFrontModified':False,'publicBoarding':False,
 'limitations':['Mechanical support placement, station platform/gates and passenger boarding acceptance remain open.','Original Hi3D front doors and bogies remain fused.']}
(OUT/'assets.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
