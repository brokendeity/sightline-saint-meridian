"""Blender master fork: stepped plant chambers retaining every original climb face and rooftop."""
import bpy,bmesh,hashlib,json,sys,math
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent));from v02_scene_signatures import signatures
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';O=R/'assets/city/vertical-v02/maintenance-access';O.mkdir(exist_ok=True)
read=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();plan=read(D/'V02_Maintenance_Access_Plan.json');assert plan['status'].startswith('PASS');source=R/plan['sourceMaster'];assert sha(source)==plan['sourceMasterSHA256'];base=read(R/plan['sourceManifest']);assert sha(R/plan['sourceManifest'])==plan['sourceManifestSHA256'];bpy.ops.wm.open_mainfile(filepath=str(source));bpy.context.view_layer.update();before=signatures()
materials={k:bpy.data.materials['V02_'+k]for k in ['deck','steel','glass','cyan','warm']}
materials['plantglass']=bpy.data.materials['V02_service_plant_glass']
col=bpy.data.collections['SM_V02_VERTICAL_TRANSFERS'];export=bpy.data.collections.new('SM_V02_MAINTENANCE_ACCESS_EXPORT');bpy.context.scene.collection.children.link(export)
def mesh(name,verts,faces,kinds):
 data=bpy.data.meshes.new(name);data.from_pydata(verts,[],faces);data.update()
 for m in materials.values():data.materials.append(m)
 palette=list(materials)
 for p,k in zip(data.polygons,kinds):p.material_index=palette.index(k)
 bm=bmesh.new();bm.from_mesh(data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));assert all(e.is_manifold for e in bm.edges),name;bm.to_mesh(data);bm.free();data.update();assert not data.validate(verbose=True),name
 uv=data.uv_layers.new(name='Metres_2_4')
 for f in data.polygons:
  axes=[i for i in range(3)if i!=max(range(3),key=lambda i:abs(f.normal[i]))]
  for loop in f.loop_indices:v=data.vertices[data.loops[loop].vertex_index].co;uv.data[loop].uv=(v[axes[0]]/2.4,v[axes[1]]/2.4)
 return data
def boxmesh(r):
 x,h,z=r['size'];verts=[(a*x/2,b*z/2,c*h/2)for a,b,c in [(-1,-1,-1),(-1,-1,1),(-1,1,-1),(-1,1,1),(1,-1,-1),(1,-1,1),(1,1,-1),(1,1,1)]];faces=[(0,2,6,4),(1,5,7,3),(0,4,5,1),(2,3,7,6),(0,1,3,2),(4,6,7,5)]
 return mesh(r['id'],verts,faces,[r['material']]*6)
def roofmesh(r):
 sx,h,sz=r['size'];xs=[-sx/2+i*sx/4 for i in range(5)];zs=[-sz/2+i*sz/6 for i in range(7)];verts=[];faces=[];kinds=[];lookup={}
 def face(points,kind):
  ids=[]
  for p in points:
   key=tuple(round(v,7)for v in p)
   if key not in lookup:lookup[key]=len(verts);verts.append(p)
   ids.append(lookup[key])
  faces.append(tuple(ids));kinds.append(kind)
 for ix,(x0,x1)in enumerate(zip(xs,xs[1:])):
  for iz,(z0,z1)in enumerate(zip(zs,zs[1:])):
   top=[(x0,z0,h/2),(x1,z0,h/2),(x1,z1,h/2),(x0,z1,h/2)];bottom=[(x0,z0,-h/2),(x1,z0,-h/2),(x1,z1,-h/2),(x0,z1,-h/2)];inner=[(x0+.10,z0+.10,-h/2+.10),(x1-.10,z0+.10,-h/2+.10),(x1-.10,z1-.10,-h/2+.10),(x0+.10,z1-.10,-h/2+.10)]
   face(top,'deck');face(inner,'deck')
   for j in range(4):k=(j+1)%4;face([bottom[j],bottom[k],inner[k],inner[j]],'steel')
   for j,outer in enumerate([iz==0,ix==3,iz==5,ix==0]):
    if outer:k=(j+1)%4;face([bottom[j],top[j],top[k],bottom[k]],'steel')
 return mesh(r['id'],verts,faces,kinds)
def fanmesh(r):
 # Closed ring and six closed blades; all remain inside the housing-mounted
 # decorative envelope. The physical housing owns collision, not the grille.
 verts=[];faces=[];kinds=[];th=r['size'][2]/2
 for i in range(24):
  a=2*math.pi*i/24;b=2*math.pi*(i+1)/24;base=len(verts)
  for z in [-th,th]:
   for angle,rad in [(a,.90),(b,.90),(b,.76),(a,.76)]:verts.append((math.cos(angle)*rad,z,math.sin(angle)*rad))
  faces.extend(tuple(base+j for j in f)for f in [(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]);kinds.extend(['steel']*6)
 for i in range(6):
  a=i*math.pi/3;base=len(verts)
  for z in [-th,th]:
   for rad,angle in [(.13,a-.2),(.73,a+.18),(.73,a+.40),(.13,a+.35)]:verts.append((math.cos(angle)*rad,z,math.sin(angle)*rad))
  faces.extend(tuple(base+j for j in f)for f in [(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]);kinds.extend(['steel']*6)
 return mesh(r['id'],verts,faces,kinds)
changed={c['after']['id']:c['after']for c in plan['changes']};allowed=set(changed);markers=[]
for r in list(changed.values())+plan['additions']:
 print('AUTHOR_COMPONENT',r['id'],flush=True)
 o=bpy.data.objects.get(r['id'])
 data=roofmesh(r)if r.get('roofSoffit')else fanmesh(r)if r.get('primitive')=='fan'else boxmesh({**r,'material':'plantglass'}if r['material']=='glass'else r)
 if o:o.data=data
 else:o=bpy.data.objects.new(r['id'],data);col.objects.link(o);o['v02StableID']=r['id'];o['runtimeOwner']=r['owner'];o['solid']=r['solid'];o['walkable']=r['walkable']
 o.location=(r['center'][0],-r['center'][2],r['center'][1]);o.scale=(1,1,1);o['maintenanceAccessRefinement']='Real public stair shaft and upper plant-room side entrances'
 found=[]
 for c in bpy.data.collections['SM_V02_COLLISION'].objects:
  if c.get('sourceComponent')==r['id']or c.name==r['id']+'__COL':found.append(c)
 if r['solid']and not found:
  c=bpy.data.objects.new(r['id']+'__COL',None);c.empty_display_type='CUBE';c['sourceComponent']=r['id'];bpy.data.collections['SM_V02_COLLISION'].objects.link(c);found=[c]
 for c in found:c.location=o.location;c.scale=(r['size'][0]/2,r['size'][2]/2,r['size'][1]/2);allowed.add(c.name);markers.append(c.name)
bpy.context.view_layer.update();records=[changed.get(r['id'],r)for r in base['records']]+plan['additions'];affected=[c for c in base['chunks']if set(c['recordIDs'])&set(changed)]
jobs=[('maintenance-access-replacement-'+str(i),c['recordIDs'],c)for i,c in enumerate(affected)]+[('maintenance-access-plant-chambers',[r['id']for r in plan['additions']],None)];chunks=[c for c in base['chunks']if c not in affected];exports=[];restore=[]
# Retain the source render field; export underlying PBR exactly as the prior master did.
for m in materials.values():
 out=m.node_tree.nodes.get('Material Output');bsdf=m.node_tree.nodes.get('Principled BSDF');old=next((l.from_socket for l in m.node_tree.links if l.to_socket==out.inputs['Surface']),None)
 if old:restore.append((m,out,old));m.node_tree.links.new(bsdf.outputs['BSDF'],out.inputs['Surface'])
for name,ids,old in jobs:
 verts=[];faces=[];slots=[];uvs=[];palette=[]
 for id in ids:
  o=bpy.data.objects[id];first=len(verts);verts.extend(tuple(o.matrix_world@v.co)for v in o.data.vertices)
  for f in o.data.polygons:
   mat=o.data.materials[f.material_index]
   if mat not in palette:palette.append(mat)
   faces.append(tuple(first+i for i in f.vertices));slots.append(palette.index(mat));uvs.append([tuple(o.data.uv_layers.active.data[i].uv)for i in f.loop_indices])
 data=bpy.data.meshes.new(name);data.from_pydata(verts,[],faces);data.update()
 for m in palette:data.materials.append(m)
 uv=data.uv_layers.new(name='Metres_2_4')
 for f,slot,coords in zip(data.polygons,slots,uvs):
  f.material_index=slot
  for loop,value in zip(f.loop_indices,coords):uv.data[loop].uv=value
 obj=bpy.data.objects.new(name,data);export.objects.link(obj);obj['v02Chunk']=name;obj['runtimeIDs']=json.dumps(ids);bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj;file=O/(name+'.glb');bpy.ops.export_scene.gltf(filepath=str(file),export_format='GLB',use_selection=True,export_yup=True,export_extras=True,export_tangents=True);data.calc_loop_triangles();c={'id':name,'url':str(file.relative_to(R)),'sha256':sha(file),'bytes':file.stat().st_size,'triangles':len(data.loop_triangles),'recordIDs':ids}
 if old:c['replaces']=old['id']
 chunks.append(c);exports.append(c)
for m,out,socket in restore:m.node_tree.links.new(socket,out.inputs['Surface'])
export.hide_render=export.hide_viewport=True;bpy.context.view_layer.update();after=signatures();assert all(after[n]==h for n,h in before.items()if n not in allowed),'Unrelated source object changed'
master=D/'blender/SaintMeridian_V02_Maintenance_Access.blend';bpy.ops.wm.save_as_mainfile(filepath=str(master));bpy.ops.wm.open_mainfile(filepath=str(master));bpy.context.view_layer.update();after=signatures();assert all(after[n]==h for n,h in before.items()if n not in allowed)
manifest={**base,'records':records,'chunks':chunks,'maintenanceAccess':{'controlledModifications':plan['changes'],'addedIDs':[r['id']for r in plan['additions']],'routes':plan['routes'],'doors':plan['doors'],'scope':'Real84→120m maintenance stair, controlled canopy shaft and upper west doorways; original climb planes and roof footprints unchanged'},'status':'MAINTENANCE ACCESS CANDIDATE — source/native/input/visual acceptance pending'};(O/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
report={'status':'PASS saved/reopened bounded source preservation; shipping/native/visual checks pending','sourceMaster':str(source.relative_to(R)),'sourceMasterSHA256':sha(source),'master':str(master.relative_to(R)),'masterSHA256':sha(master),'planSHA256':sha(D/'V02_Maintenance_Access_Plan.json'),'authoringSHA256':sha(Path(__file__)),'unchangedSourceObjects':sum(n not in allowed for n in before),'controlledChangedSourceObjects':sorted(n for n,h in before.items()if after[n]!=h),'markers':markers,'exports':exports,'reusedChunks':len(base['chunks'])-len(affected),'newDynamicLights':0,'originalBuildingsChanged':0};(D/'V02_Maintenance_Access_Authoring.json').write_text(json.dumps(report,indent=2)+'\n');print(report['status'],len(changed),'modified source records',len(plan['additions']),'additions')
