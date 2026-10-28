"""Independently reopen both masters; source preservation and surface witnesses."""
import bpy,bmesh,json,hashlib,math,sys
from pathlib import Path
from mathutils import Vector
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';sys.path.insert(0,str(Path(__file__).parent));from v02_scene_signatures import signatures
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();read=lambda p:json.loads(p.read_text());a=read(D/'V02_Upper_Anchor_Authoring.json');plan=read(D/'V02_Upper_Anchor_Plan.json');assert sha(R/a['sourceMaster'])==a['sourceMasterSHA256'];assert sha(R/a['master'])==a['masterSHA256'];assert sha(Path(__file__).with_name('blender_upper_anchor_mounts.py'))==a['authoringSHA256']
def props():return{o.name:{'parent':o.parent.name if o.parent else None,'local':[list(r)for r in o.matrix_local],'hideRender':o.hide_render,'hideViewport':o.hide_viewport}for o in bpy.data.objects}
def value(v):
 if v is None or isinstance(v,(str,bool,int,float)):return v
 if hasattr(v,'name'):return v.name
 try:return list(v)
 except TypeError:return str(v)
def materials():
 result={}
 for m in bpy.data.materials:
  data={'useNodes':m.use_nodes,'diffuse':list(m.diffuse_color)}
  if m.use_nodes:data.update({'nodes':sorted([{'name':n.name,'type':n.bl_idname,'inputs':[(i.identifier,value(i.default_value))for i in n.inputs if hasattr(i,'default_value')],'image':n.image.name if getattr(n,'image',None)else None}for n in m.node_tree.nodes],key=lambda x:x['name']),'links':sorted((l.from_node.name,l.from_socket.identifier,l.to_node.name,l.to_socket.identifier)for l in m.node_tree.links)})
  result[m.name]=hashlib.sha256(json.dumps(data,sort_keys=True).encode()).hexdigest()
 return result
def packed():return{i.name:hashlib.sha256(i.packed_file.data).hexdigest()for i in bpy.data.images if i.packed_file}
bpy.ops.wm.open_mainfile(filepath=str(R/a['sourceMaster']));bpy.context.view_layer.update();old=signatures();extra=props();mats=materials();images=packed();lightNames=sorted(o.name for o in bpy.data.objects if o.type=='LIGHT')
bpy.ops.wm.open_mainfile(filepath=str(R/a['master']));bpy.context.view_layer.update();now=signatures();newExtra=props();assert all(now[n]==h and newExtra[n]==extra[n]for n,h in old.items());assert materials()==mats;assert packed()==images;assert sorted(o.name for o in bpy.data.objects if o.type=='LIGHT')==lightNames
points=lambda v:[float(v.x),float(v.z),float(-v.y)];components=[];triangles=[]
for r in plan['additions']:
 o=bpy.data.objects[r['id']];assert o['runtimeOwner']==r['owner']and bool(o['solid'])==r['solid'];mesh=o.data;bm=bmesh.new();bm.from_mesh(mesh);assert all(len(e.link_faces)==2 for e in bm.edges),'Nonmanifold '+r['id'];assert bm.calc_volume(signed=True)>0,'Inside-out component';bm.free();assert mesh.uv_layers.active and len(mesh.uv_layers.active.data)==len(mesh.loops)
 world=[points(o.matrix_world@v.co)for v in mesh.vertices];minimum=[min(v[i]for v in world)for i in range(3)];maximum=[max(v[i]for v in world)for i in range(3)];error=max(abs(x-y)for axis in ['min','max']for x,y in zip(minimum if axis=='min'else maximum,r['box'][axis]));assert error<2e-5,(r['id'],error,minimum,maximum)
 if r['solid']:
  marker=bpy.data.objects[r['id']+'__COL'];assert marker['sourceComponent']==r['id'];assert list(marker.location)==list(o.location);expected=[r['size'][0]/2,r['size'][2]/2,r['size'][1]/2];assert max(abs(x-y)for x,y in zip(marker.scale,expected))<2e-6
 mesh.calc_loop_triangles();normalMatrix=o.matrix_world.to_3x3().inverted().transposed();normals=mesh.corner_normals
 for tri in mesh.loop_triangles:
  corners=[]
  for loop in tri.loops:
   v=o.matrix_world@mesh.vertices[mesh.loops[loop].vertex_index].co;n=(normalMatrix@normals[loop].vector).normalized();uv=mesh.uv_layers.active.data[loop].uv;assert all(math.isfinite(x)for x in [*v,*n,*uv]);corners.append({'position':points(v),'normal':points(n),'sourceUV':list(uv)})
  triangles.append({'id':r['id'],'material':mesh.materials[mesh.polygons[tri.polygon_index].material_index].name,'corners':corners})
 components.append({'id':r['id'],'triangles':len(mesh.loop_triangles),'manifold':True,'boundsError':error,'worldBox':{'min':minimum,'max':maximum},'solid':r['solid']})
witness={'masterSHA256':a['masterSHA256'],'coordinates':'Source Blender X/-Z/Y to game X/Y-up/Z; UV retained in Blender lower-left convention for independent GLB comparison','triangles':triangles};W=D/'V02_Upper_Anchor_Source_Witness.json';W.write_text(json.dumps(witness,separators=(',',':'))+'\n')
report={'status':'PASS independently reopened prior-object/local-transform/visibility/material/packed-image preservation and new manifold/source-UV/bounds; runtime clearance/input still pending','sourceMasterSHA256':a['sourceMasterSHA256'],'masterSHA256':a['masterSHA256'],'validatorSHA256':sha(Path(__file__)),'authoringSHA256':a['authoringSHA256'],'unchangedObjects':len(old),'preservedMaterials':len(mats),'packedImages':images,'lightsUnchanged':len(lightNames),'components':components,'witness':str(W.relative_to(R)),'witnessSHA256':sha(W),'sourceTriangles':len(triangles),'scope':'Physical source evidence only; no camera/route or original-reference visual certification'};(D/'V02_Upper_Anchor_Master_Validation.json').write_text(json.dumps(report,indent=2)+'\n');print(report['status'],len(old),'objects;',len(triangles),'triangles',flush=True)
