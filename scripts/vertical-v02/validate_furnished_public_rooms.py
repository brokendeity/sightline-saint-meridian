"""Independently reopen the actual furniture child, not an authoring summary."""
from pathlib import Path
import ast,hashlib,json,sys,math
import bpy,bmesh
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02'
sys.path.insert(0,str(Path(__file__).parent))
from v02_saved_scene_snapshots import signatures,source_props
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();read=lambda p:json.loads(p.read_text())
a=read(D/'V02_Furnished_Public_Rooms_Authoring.json')
assert a['status'].startswith('PASS')
assert sha(R/a['master'])==a['masterSHA256'] and sha(R/a['sourceMaster'])==a['sourceMasterSHA256']
assert a['scriptSHA256']==sha(Path(__file__).with_name('blender_furnished_public_rooms.py'))
helper=Path(__file__).with_name('validate_upper_anchor_master.py');scope=dict(globals())
defs=[n for n in ast.parse(helper.read_text()).body if isinstance(n,ast.FunctionDef)and n.name in ['value','materials','packed']]
exec(compile(ast.Module(body=defs,type_ignores=[]),str(helper),'exec'),scope)
bpy.ops.wm.open_mainfile(filepath=str(R/a['sourceMaster']));before=signatures();props=source_props();mats=scope['materials']();images=scope['packed']()
bpy.ops.wm.open_mainfile(filepath=str(R/a['master']));after=signatures();newprops=source_props();allowed=set(a['changedSourceObjects'])
assert set(after)-set(before)==set(a['newObjects']) and not set(before)-set(after)
assert all(after[n]==h for n,h in before.items()if n not in allowed)
assert all(newprops[n]==props[n]for n in before)
assert all(scope['materials']()[n]==h for n,h in mats.items())
assert all(scope['packed']()[n]==h for n,h in images.items())
parent=read(R/a['sourceManifest']);current=read(R/a['manifest'])
assert current['records'][:len(parent['records'])]==parent['records']
world=lambda p:[p.x,p.z,-p.y]
benches=[];boards=[]
for floor in [24,52,84]:
 for z in [307.4,312.6]:
  id=f'east-loggia-{floor}-bench-{z}';o=bpy.data.objects[id];m=o.data;bm=bmesh.new();bm.from_mesh(m)
  assert all(e.is_manifold for e in bm.edges) and bm.calc_volume(signed=True)>0
  volume=bm.calc_volume(signed=True);bm.free();r=next(r for r in parent['records']if r['id']==id)
  vertices=[world(o.matrix_world@v.co)for v in m.vertices]
  assert all(r['box']['min'][i]-.0001<=p[i]<=r['box']['max'][i]+.0001 for p in vertices for i in range(3))
  assert max(p[1]for p in vertices)-min(p[1]for p in vertices)>.47
  assert volume<.55*1.8*.48*.5,'Bench is still predominantly a solid block'
  benches.append({'id':id,'vertices':len(vertices),'manifold':True,'positiveVolume':volume,'insideOldContactEnvelope':True})
 panel=bpy.data.objects[f'east-loggia-{floor}-wayfinding-diagram'];mesh=panel.data
 assert len(mesh.polygons)==1 and mesh.polygons[0].normal.x<-.99
 assert len(mesh.uv_layers)==1
 for loop in mesh.loops:
  p=world(panel.matrix_world@mesh.vertices[loop.vertex_index].co);uv=mesh.uv_layers[0].data[loop.index].uv
  assert abs(uv.x-(p[2]-308.4)/3.2)<.0001
  assert abs(uv.y-(p[1]-floor-.85)/1.6)<.0001
 tex=next(n for n in mesh.materials[0].node_tree.nodes if n.type=='TEX_IMAGE');assert tex.image.packed_file and list(tex.image.size)==[1536,768]
 for r in a['newRecords']:
  if r['id'].startswith(f'east-loggia-{floor}-'):
   assert r['box']['min'][0]-(102.1+.55)>1.3
   obj=bpy.data.objects[r['id']]
   for vertex in obj.data.vertices:
    p=world(obj.matrix_world@vertex.co)
    assert all(r['box']['min'][i]-.001<=p[i]<=r['box']['max'][i]+.001 for i in range(3)),(r['id'],p,r['box'])
 boards.append({'floor':floor,'westFacing':True,'unmirroredSourceUV':True,'packedImage':tex.image.name,'normalThroughRouteClearanceMinimum':1.3})
result={'status':'PASS independent source preservation, six physical bench meshes and three unmirrored graph-backed boards; bake/export/native acceptance separate','masterSHA256':a['masterSHA256'],'sourceMasterSHA256':a['sourceMasterSHA256'],'authoringSHA256':sha(D/'V02_Furnished_Public_Rooms_Authoring.json'),'validatorSHA256':sha(Path(__file__)),'preservedObjects':len(before)-len(allowed),'oldMaterials':len(mats),'oldImages':len(images),'benches':benches,'boards':boards}
(D/'V02_Furnished_Public_Rooms_Master_Validation.json').write_text(json.dumps(result,indent=2)+'\n');print(result['status'],flush=True)
