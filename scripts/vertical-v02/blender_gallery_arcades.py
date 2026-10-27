"""Three actual supported arcade roofs on the existing public galleries.
No existing object is replaced; export only the new modular additions.
"""
import bpy,bmesh,json,hashlib,math,sys
from pathlib import Path
from mathutils import Vector
sys.path.insert(0,str(Path(__file__).parent));from v02_scene_signatures import signatures
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';O=R/'assets/city/vertical-v02/gallery-arcades';O.mkdir(exist_ok=True);read=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();plan=read(D/'V02_Gallery_Arcade_Plan.json');assert plan['status'].startswith('PASS');assert all(sha(R/f)==h for f,h in plan['sources'].items());prior=read(D/'V02_Facade_Architecture_Evidence.json');source=R/prior['master'];assert sha(source)==prior['masterSHA256'];base=read(R/'assets/city/vertical-v02/coffered/runtime/manifest.json');bpy.ops.wm.open_mainfile(filepath=str(source));bpy.context.view_layer.update();before=signatures();col=bpy.data.collections['SM_V02_GALLERIES'];exports=bpy.data.collections.new('SM_V02_ARCADE_EXPORT');bpy.context.scene.collection.children.link(exports)
materials={k:bpy.data.materials['V02_'+k]for k in ['deck','steel','cyan','warm','glass']};m=bpy.data.materials.new('V02_arcade_soffit');m.use_nodes=True;m.diffuse_color=(.12,.075,.035,1);p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=m.diffuse_color;p.inputs['Metallic'].default_value=.4;p.inputs['Roughness'].default_value=.44;p.inputs['Emission Color'].default_value=(.08,.042,.016,1);p.inputs['Emission Strength'].default_value=.8;materials['soffit']=m;palette=list(materials)
cube=[(-1,-1,-1),(-1,-1,1),(-1,1,-1),(-1,1,1),(1,-1,-1),(1,-1,1),(1,1,-1),(1,1,1)];F=[(0,2,6,4),(1,5,7,3),(0,4,5,1),(2,3,7,6),(0,1,3,2),(4,6,7,5)]
def finish(name,verts,faces,slots,bevel=0):
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update()
 for m in materials.values():mesh.materials.append(m)
 for p,i in zip(mesh.polygons,slots):p.material_index=i
 bm=bmesh.new();bm.from_mesh(mesh)
 if bevel:bmesh.ops.bevel(bm,geom=list(bm.edges),offset=bevel,segments=1,affect='EDGES')
 bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));assert all(e.is_manifold for e in bm.edges),name;bm.to_mesh(mesh);bm.free();mesh.update();uv=mesh.uv_layers.new(name='Metres_2_4')
 for p in mesh.polygons:
  axis=max(range(3),key=lambda i:abs(p.normal[i]));axes=[i for i in range(3)if i!=axis]
  for i in p.loop_indices:v=mesh.vertices[mesh.loops[i].vertex_index].co;uv.data[i].uv=(v[axes[0]]/2.4,v[axes[1]]/2.4)
 return mesh
def roof(r):
 sx,h,sy=r['size'];nx=2;ny=2*math.ceil(sy/6);verts=[];faces=[];slots=[];indices={}
 def vertex(p):
  key=tuple(round(v,7)for v in p)
  if key not in indices:indices[key]=len(verts);verts.append(p)
  return indices[key]
 def face(points,kind):faces.append(tuple(vertex(p)for p in points));slots.append(palette.index(kind))
 for ix in range(nx):
  for iy in range(ny):
   x0=-sx/2+sx*ix/nx;x1=-sx/2+sx*(ix+1)/nx;y0=-sy/2+sy*iy/ny;y1=-sy/2+sy*(iy+1)/ny;z0=-h/2;z1=h/2;rim=.12;depth=.04;chamfer=.03
   top=[(x0,y0,z1),(x1,y0,z1),(x1,y1,z1),(x0,y1,z1)];face(top,'deck');outer=[(x0,y0,z0),(x1,y0,z0),(x1,y1,z0),(x0,y1,z0)];ring=[(x0+rim,y0+rim,z0),(x1-rim,y0+rim,z0),(x1-rim,y1-rim,z0),(x0+rim,y1-rim,z0)];inset=[(x0+rim+chamfer,y0+rim+chamfer,z0+depth),(x1-rim-chamfer,y0+rim+chamfer,z0+depth),(x1-rim-chamfer,y1-rim-chamfer,z0+depth),(x0+rim+chamfer,y1-rim-chamfer,z0+depth)]
   for j in range(4):k=(j+1)%4;face([outer[j],outer[k],ring[k],ring[j]],'steel');face([ring[j],ring[k],inset[k],inset[j]],'steel')
   face(inset,'soffit')
   for j,edge in enumerate([iy==0,ix==nx-1,iy==ny-1,ix==0]):
    if edge:k=(j+1)%4;face([outer[j],top[j],top[k],outer[k]],'steel')
 return finish(r['id']+'__coffered',verts,faces,slots)
for r in plan['records']:
 assert r['id']not in bpy.data.objects
 if r['id'].endswith('-roof'):mesh=roof(r)
 else:
  sx,sy,sz=r['size'];verts=[(v[0]*sx/2,v[1]*sz/2,v[2]*sy/2)for v in cube];mesh=finish(r['id'],verts,F,[palette.index(r['material'])]*6,min(.015,min(r['size'])*.12)if r['solid']else 0)
 o=bpy.data.objects.new(r['id'],mesh);col.objects.link(o);o.location=(r['center'][0],-r['center'][2],r['center'][1]);o['v02StableID']=r['id'];o['runtimeOwner']=r['owner'];o['solid']=r['solid'];o['walkable']=r['walkable'];o['exportRole']='public gallery weather arcade'
 if r['solid']:
  c=bpy.data.objects.new(r['id']+'__COL',None);bpy.data.collections['SM_V02_COLLISION'].objects.link(c);c.empty_display_type='CUBE';c.location=o.location;c.scale=(r['size'][0]/2,r['size'][2]/2,r['size'][1]/2);c['sourceComponent']=r['id']
bpy.context.view_layer.update();restore=[]
for m in materials.values():
 out=m.node_tree.nodes.get('Material Output');bsdf=m.node_tree.nodes.get('Principled BSDF');socket=next((l.from_socket for l in m.node_tree.links if l.to_socket==out.inputs['Surface']),None)
 if socket:restore.append((m,out,socket));m.node_tree.links.new(bsdf.outputs['BSDF'],out.inputs['Surface'])
chunks=[]
for a in plan['arcades']:
 verts=[];faces=[];slots=[];uvs=[]
 for id in a['recordIDs']:
  o=bpy.data.objects[id];first=len(verts);verts.extend(tuple(o.matrix_world@v.co)for v in o.data.vertices)
  for p in o.data.polygons:faces.append(tuple(first+i for i in p.vertices));slots.append(next(i for i,k in enumerate(palette)if o.data.materials[p.material_index]==materials[k]));uvs.append([tuple(o.data.uv_layers.active.data[i].uv)for i in p.loop_indices])
 mesh=finish('arcade-chunk-'+a['id'],verts,faces,slots)
 for p,values in zip(mesh.polygons,uvs):
  for i,uv in zip(p.loop_indices,values):mesh.uv_layers.active.data[i].uv=uv
 o=bpy.data.objects.new(mesh.name,mesh);exports.objects.link(o);o['v02Chunk']=mesh.name;o['runtimeIDs']=json.dumps(a['recordIDs']);bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;file=O/(mesh.name+'.glb');bpy.ops.export_scene.gltf(filepath=str(file),export_format='GLB',use_selection=True,export_yup=True,export_extras=True,export_tangents=True);mesh.calc_loop_triangles();chunks.append({'id':mesh.name,'url':str(file.relative_to(R)),'sha256':sha(file),'bytes':file.stat().st_size,'triangles':len(mesh.loop_triangles),'recordIDs':a['recordIDs']})
for m,out,socket in restore:m.node_tree.links.new(socket,out.inputs['Surface'])
exports.hide_render=exports.hide_viewport=True;bpy.context.view_layer.update();after=signatures();assert all(after[n]==h for n,h in before.items()),'Source object changed'
target=D/'blender/SaintMeridian_V02_Gallery_Arcades.blend';bpy.ops.wm.save_as_mainfile(filepath=str(target));assert sha(source)==prior['masterSHA256'];bpy.ops.wm.open_mainfile(filepath=str(target));bpy.context.view_layer.update();after=signatures();assert all(after[n]==h for n,h in before.items())
manifest={**base,'records':base['records']+plan['records'],'chunks':base['chunks']+chunks,'supportConnections':base['supportConnections']+plan['supportConnections'],'galleryArcades':{'sourcePlanSHA256':sha(D/'V02_Gallery_Arcade_Plan.json'),'arcades':plan['arcades'],'scope':'Source-floor-supported weather shelters on existing public galleries; roof support indexed physically but not certified as a new public route'},'status':'ARCADE CANDIDATE; native/visual/input acceptance pending'};(O/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');report={'status':'PASS saved-source original preservation and authored new arcades; native/export acceptance pending','sourceMaster':str(source.relative_to(R)),'sourceMasterSHA256':prior['masterSHA256'],'master':str(target.relative_to(R)),'masterSHA256':sha(target),'sourceManifestSHA256':sha(R/'assets/city/vertical-v02/coffered/runtime/manifest.json'),'planSHA256':sha(D/'V02_Gallery_Arcade_Plan.json'),'authoringSHA256':sha(Path(__file__)),'unchangedSourceObjects':len(before),'addedRecords':len(plan['records']),'addedSolidRecords':sum(r['solid']for r in plan['records']),'addedTriangles':sum(c['triangles']for c in chunks),'newChunks':chunks,'newMaterial':'V02_arcade_soffit','publicNavigationAndOriginalRecordsUnchanged':True,'limits':['Conservative source-matched physical proxies;4cm roof underside recess uses actual-triangle cartridge confirmation','Roof landing surfaces are physical, not certified public navigation edges','No new vehicle actors, powers, missions or source building replacement']};(D/'V02_Gallery_Arcade_Authoring.json').write_text(json.dumps(report,indent=2)+'\n');print(report['status'],report['addedRecords'],report['addedTriangles'])
