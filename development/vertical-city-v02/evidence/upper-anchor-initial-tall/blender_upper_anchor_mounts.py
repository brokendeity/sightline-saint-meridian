"""Blender-first upper receiving posts. Separate master/export, not promoted."""
import bpy,bmesh,json,hashlib,sys,math
from pathlib import Path
from mathutils import Vector
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';O=R/'assets/city/vertical-v02/upper-anchor-mounts';O.mkdir(exist_ok=True)
sys.path.insert(0,str(Path(__file__).parent));from v02_scene_signatures import signatures
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();plan=json.loads((D/'V02_Upper_Anchor_Plan.json').read_text());source=R/plan['sourceMaster'];assert sha(source)==plan['sourceMasterSHA256'];assert sha(R/plan['sourceManifest'])==plan['sourceManifestSHA256'];base=json.loads((R/plan['sourceManifest']).read_text())
bpy.ops.wm.open_mainfile(filepath=str(source));bpy.context.view_layer.update()
def extra():return{o.name:{'parent':o.parent.name if o.parent else None,'local':[list(x)for x in o.matrix_local],'hideRender':o.hide_render,'hideViewport':o.hide_viewport}for o in bpy.data.objects}
def links():return{m.name:sorted((l.from_node.name,l.from_socket.identifier,l.to_node.name,l.to_socket.identifier)for l in m.node_tree.links)for m in bpy.data.materials if m.use_nodes}
before=signatures();oldExtra=extra();oldLinks=links();col=bpy.data.collections.new('SM_V02_UPPER_ANCHOR_MOUNTS');bpy.context.scene.collection.children.link(col);outcol=bpy.data.collections.new('SM_V02_UPPER_ANCHOR_EXPORT');bpy.context.scene.collection.children.link(outcol)
materials={k:bpy.data.materials['V02_'+k]for k in ['steel','deck','cyan','warm']};objects=[];witness=[]
for r in plan['additions']:
 bm=bmesh.new();bmesh.ops.create_cube(bm,size=1)
 sx,sy,sz=r['size'][0],r['size'][2],r['size'][1]
 for v in bm.verts:v.co.x*=sx;v.co.y*=sy;v.co.z*=sz
 bmesh.ops.bevel(bm,geom=list(bm.edges),offset=min(.018,min(sx,sy,sz)*.18),segments=2,affect='EDGES');bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));mesh=bpy.data.meshes.new(r['id']);bm.to_mesh(mesh);bm.free();mesh.materials.append(materials[r['material']]);uv=mesh.uv_layers.new(name='Metres_2_4')
 for f in mesh.polygons:
  axis=max(range(3),key=lambda i:abs(f.normal[i]));pair=[i for i in range(3)if i!=axis]
  for loop in f.loop_indices:
   v=mesh.vertices[mesh.loops[loop].vertex_index].co;uv.data[loop].uv=(v[pair[0]]/2.4,v[pair[1]]/2.4)
 o=bpy.data.objects.new(r['id'],mesh);col.objects.link(o);o.location=(r['center'][0],-r['center'][2],r['center'][1]);o['v02StableID']=r['id'];o['runtimeOwner']=r['owner'];o['solid']=r['solid'];o['walkable']=False;o['upperAnchorMount']='Visible receiving post outside the x64m running lane';objects.append(o)
 if r['solid']:
  marker=bpy.data.objects.new(r['id']+'__COL',None);marker.empty_display_type='CUBE';marker['sourceComponent']=r['id'];marker['runtimeOwner']=r['owner'];marker.location=o.location;marker.scale=(sx/2,sy/2,sz/2);bpy.data.collections['SM_V02_COLLISION'].objects.link(marker)
bpy.context.view_layer.update()
# Combine only the new source components, preserving their rendered corner data.
vertices=[];faces=[];values=[];localMats=[]
for o in objects:
 start=len(vertices);vertices.extend(tuple(o.matrix_world@v.co)for v in o.data.vertices);o.data.calc_loop_triangles()
 for f in o.data.polygons:
  m=o.data.materials[f.material_index]
  if m not in localMats:localMats.append(m)
  faces.append(tuple(start+i for i in f.vertices));values.append((localMats.index(m),[tuple(o.data.uv_layers.active.data[i].uv)for i in f.loop_indices]))
 witness.append({'id':o.name,'triangles':len(o.data.loop_triangles),'vertices':len(o.data.vertices),'sourceMatrix':[list(row)for row in o.matrix_world]})
mesh=bpy.data.meshes.new('upper-anchor-mounts');mesh.from_pydata(vertices,[],faces);mesh.update()
for m in localMats:mesh.materials.append(m)
uv=mesh.uv_layers.new(name='Metres_2_4')
for f,(slot,uvs)in zip(mesh.polygons,values):
 f.material_index=slot
 for i,value in zip(f.loop_indices,uvs):uv.data[i].uv=value
chunk=bpy.data.objects.new('upper-anchor-mounts',mesh);outcol.objects.link(chunk);chunk['runtimeIDs']=json.dumps([r['id']for r in plan['additions']]);restore=[]
for m in localMats:
 output=m.node_tree.nodes.get('Material Output');bs=m.node_tree.nodes.get('Principled BSDF');prior=next(l.from_socket for l in m.node_tree.links if l.to_socket==output.inputs['Surface']);restore.append((m,output,prior));m.node_tree.links.new(bs.outputs['BSDF'],output.inputs['Surface'])
bpy.ops.object.select_all(action='DESELECT');chunk.select_set(True);bpy.context.view_layer.objects.active=chunk;file=O/'upper-anchor-mounts.glb';bpy.ops.export_scene.gltf(filepath=str(file),export_format='GLB',use_selection=True,export_yup=True,export_extras=True,export_tangents=True)
for m,output,prior in restore:m.node_tree.links.new(prior,output.inputs['Surface'])
outcol.hide_render=outcol.hide_viewport=True;bpy.context.view_layer.update()
after=signatures();assert all(after[n]==h for n,h in before.items())
afterExtra=extra();assert all(afterExtra[n]==h for n,h in oldExtra.items());assert links()==oldLinks
master=D/'blender/SaintMeridian_V02_Upper_Anchor_Mounts.blend';bpy.ops.wm.save_as_mainfile(filepath=str(master));bpy.ops.wm.open_mainfile(filepath=str(master));bpy.context.view_layer.update();reopened=signatures();reopenExtra=extra();assert all(reopened[n]==h and reopenExtra[n]==oldExtra[n] for n,h in before.items());assert links()==oldLinks
chunks=[*base['chunks'],{'id':'upper-anchor-mounts','url':str(file.relative_to(R)),'sha256':sha(file),'bytes':file.stat().st_size,'triangles':sum(w['triangles']for w in witness),'recordIDs':[r['id']for r in plan['additions']]}];manifest={**base,'status':'UPPER ANCHOR MOUNT SOURCE CANDIDATE: native/clearance/input acceptance pending','records':base['records']+plan['additions'],'chunks':chunks,'upperAnchorMounts':{'mounts':plan['mounts'],'planSHA256':sha(D/'V02_Upper_Anchor_Plan.json'),'sourceMasterSHA256':sha(master)}};(O/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
report={'status':'PASS author saved/reopened existing-object/material-link preservation; independent master/export/clearance/native/input validation pending','sourceMaster':str(source.relative_to(R)),'sourceMasterSHA256':sha(source),'master':str(master.relative_to(R)),'masterSHA256':sha(master),'authoringSHA256':sha(Path(__file__)),'planSHA256':sha(D/'V02_Upper_Anchor_Plan.json'),'unchangedSourceObjects':len(before),'originalBuildingsChanged':0,'newDynamicLights':0,'components':witness,'chunk':chunks[-1],'reusedChunks':len(base['chunks']),'newColliders':sum(r['solid']for r in plan['additions'])};(D/'V02_Upper_Anchor_Authoring.json').write_text(json.dumps(report,indent=2)+'\n');print(report['status'],len(before),'preserved objects;',len(witness),'new source components',flush=True)
