"""Blender-authored rebated rainscreen geometry around retained window bays."""
import bpy,bmesh,json,hashlib,sys,gzip
from pathlib import Path
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';O=R/'assets/city/vertical-v02/facade-cassettes';O.mkdir(exist_ok=True)
sys.path.insert(0,str(Path(__file__).parent));from v02_scene_signatures import signatures
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();plan=json.loads((D/'V02_Facade_Cassettes_Plan.json').read_text());assert plan['status'].startswith('PASS');assert all(sha(R/f)==h for f,h in plan['sources'].items());source=R/plan['sourceMaster'];assert sha(source)==plan['sourceMasterSHA256']
bpy.ops.wm.open_mainfile(filepath=str(source));bpy.context.view_layer.update();before=signatures()
extra=lambda:{o.name:{'parent':o.parent.name if o.parent else None,'local':[list(row)for row in o.matrix_local],'hide':[o.hide_render,o.hide_viewport]}for o in bpy.data.objects}
oldExtra=extra();oldLinks={m.name:sorted((l.from_node.name,l.from_socket.identifier,l.to_node.name,l.to_socket.identifier)for l in m.node_tree.links)for m in bpy.data.materials if m.use_nodes}
materialInputs=lambda:{m.name:{n.name:{i.identifier:tuple(i.default_value)if hasattr(i.default_value,'__iter__')else i.default_value for i in n.inputs if hasattr(i,'default_value')}for n in m.node_tree.nodes}for m in bpy.data.materials if m.use_nodes}
oldInputs=materialInputs();col=bpy.data.collections.new('SM_V02_FACADE_CASSETTES');bpy.context.scene.collection.children.link(col);exports=bpy.data.collections.new('SM_V02_CASSETTE_EXPORT');bpy.context.scene.collection.children.link(exports)
materials=[]
for name,color,metal,rough in [('midnight',(.015,.028,.045,1),.45,.46),('charcoal',(.012,.023,.037,1),.42,.48),('reveal',(.025,.040,.055,1),.55,.40)]:
 m=bpy.data.materials.new('V02_Cassette_'+name);m.use_nodes=True;m.diffuse_color=color;bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=color;bs.inputs['Metallic'].default_value=metal;bs.inputs['Roughness'].default_value=rough;materials.append(m)
def ring(width,height,c):
 x=width/2;y=height/2
 return[[-x+c,-y],[x-c,-y],[x,-y+c],[x,y-c],[x-c,y],[-x+c,y],[-x,y-c],[-x,-y+c]]
objects={};witness=[]
for f in plan['features']:
 sourcePoint=f['sourcePoint'];axis=f['axis'];u=f['uAxis'];sign=f['normal'][axis];vertices=[]
 for width,height,corner,depth in [(3.10,3.80,.12,.004),(3.04,3.74,.10,.045),(1.90,2.56,.06,.066),(1.90,2.56,.06,.009)]:
  for a,z in ring(width,height,corner):
   p=sourcePoint.copy();p[u]+=a;p[1]+=z;p[axis]+=sign*depth;vertices.append((p[0],-p[2],p[1]))
 faces=[]
 for layer in range(4):
  for j in range(8):faces.append((layer*8+j,layer*8+(j+1)%8,((layer+1)%4)*8+(j+1)%8,((layer+1)%4)*8+j))
 mesh=bpy.data.meshes.new(f['id']);mesh.from_pydata(vertices,[],faces);mesh.update();bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));assert all(e.is_manifold for e in bm.edges);bm.to_mesh(mesh);bm.free()
 for m in materials:mesh.materials.append(m)
 for p in mesh.polygons:p.material_index=(0 if f['style']=='midnight'else 1)if 8<=p.index<16 or p.index>=24 else 2
 uv=mesh.uv_layers.new(name='ArchitecturalMetres')
 for p in mesh.polygons:
  for loop in p.loop_indices:
   v=mesh.vertices[mesh.loops[loop].vertex_index].co;world=(v.x,v.z,-v.y);uv.data[loop].uv=(world[u]/2.4,world[1]/2.4)
 o=bpy.data.objects.new(f['id'],mesh);col.objects.link(o);o['v02StableID']=f['id'];o['runtimeOwner']=f['owner'];o['sourceBay']=f['sourceBayID'];o['sourceFace']=f['sourceFace'];o['solid']=False;o['walkable']=False;objects[f['id']]=o
chunks=[]
for owner in sorted({f['owner']for f in plan['features']}):
 fs=[f for f in plan['features']if f['owner']==owner];vertices=[];faces=[];values=[]
 for f in fs:
  mesh=objects[f['id']].data;start=len(vertices);vertices.extend(tuple(v.co)for v in mesh.vertices)
  for p in mesh.polygons:faces.append(tuple(start+i for i in p.vertices));values.append((p.material_index,[tuple(mesh.uv_layers.active.data[i].uv)for i in p.loop_indices]))
 mesh=bpy.data.meshes.new(owner+'-cassette-export');mesh.from_pydata(vertices,[],faces);mesh.update()
 for m in materials:mesh.materials.append(m)
 uv=mesh.uv_layers.new(name='ArchitecturalMetres')
 for p,(slot,vs)in zip(mesh.polygons,values):
  p.material_index=slot
  for loop,value in zip(p.loop_indices,vs):uv.data[loop].uv=value
 o=bpy.data.objects.new(owner+'-cassette-export',mesh);exports.objects.link(o);o['runtimeOwner']=owner;o['featureCount']=len(fs)
 bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;file=O/(owner+'.glb');bpy.ops.export_scene.gltf(filepath=str(file),export_format='GLB',use_selection=True,export_yup=True,export_extras=True,export_tangents=True)
 mesh.calc_loop_triangles();chunks.append({'owner':owner,'sourceIndex':fs[0]['sourceIndex'],'cityBuildingId':fs[0]['cityBuildingId'],'url':str(file.relative_to(R)),'sha256':sha(file),'bytes':file.stat().st_size,'triangles':len(mesh.loop_triangles),'sourceObject':o.name,'features':fs})
exports.hide_render=exports.hide_viewport=True;bpy.context.view_layer.update()
def preserved():
 after=signatures();e=extra();i=materialInputs();assert all(after[n]==h and e[n]==oldExtra[n]for n,h in before.items());assert all(i[n]==v for n,v in oldInputs.items())
 for name,links in oldLinks.items():assert sorted((l.from_node.name,l.from_socket.identifier,l.to_node.name,l.to_socket.identifier)for l in bpy.data.materials[name].node_tree.links)==links
preserved();master=D/'blender/SaintMeridian_V02_Facade_Cassettes.blend';bpy.ops.wm.save_as_mainfile(filepath=str(master));bpy.ops.wm.open_mainfile(filepath=str(master));bpy.context.view_layer.update();preserved()
report={'status':'PASS source author saved/reopened prior object/material/transform/visibility preservation; independent source/export/native/visual acceptance pending','sourceMaster':str(source.relative_to(R)),'sourceMasterSHA256':sha(source),'master':str(master.relative_to(R)),'masterSHA256':sha(master),'authoringSHA256':sha(Path(__file__)),'planSHA256':sha(D/'V02_Facade_Cassettes_Plan.json'),'unchangedSourceObjects':len(before),'newComponents':len(objects),'newDynamicLights':0,'newCollisionRecords':0,'chunks':chunks,'scope':'Actual closed manifold annular surrounds; existing window/trim, original city, all walking surfaces and power limits preserved. Native appearance and destruction cleanup require validation.'};(O/'facades.json').write_text(json.dumps(report,indent=2)+'\n');(D/'V02_Facade_Cassettes_Authoring.json').write_text(json.dumps({k:v for k,v in report.items()if k!='chunks'},indent=2)+'\n');print(report['status'],len(objects),'components;',sum(c['triangles']for c in chunks),'triangles')
