"""Independent reopened source, dense polygon/contact and export witnesses."""
import ast,bmesh,bpy,gzip,hashlib,json,math,sys
from pathlib import Path
from mathutils import Matrix,Vector
from mathutils.bvhtree import BVHTree
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';E=D/'evidence/slender-crossings';E.mkdir(exist_ok=True)
sys.path.insert(0,str(Path(__file__).parent));from v02_saved_scene_snapshots import signatures,source_props
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();read=lambda p:json.loads(p.read_text())
a=read(D/'V02_Slender_Crossings_Authoring.json');p=read(D/'V02_Slender_Crossings_Plan.json')
assert sha(R/a['sourceMaster'])==a['sourceMasterSHA256']==p['sourceMasterSHA256'];assert sha(R/a['master'])==a['masterSHA256']
assert a['scriptSHA256']==sha(Path(__file__).with_name('blender_slender_crossings.py'))
helper=Path(__file__).with_name('validate_upper_anchor_master.py');defs=[n for n in ast.parse(helper.read_text()).body if isinstance(n,ast.FunctionDef)and n.name in ['value','materials','packed']]
scope=dict(globals());exec(compile(ast.Module(body=defs,type_ignores=[]),str(helper),'exec'),scope)
def lights():return{o.name:{'type':o.data.type,'color':list(o.data.color),'energy':o.data.energy,'angle':getattr(o.data,'angle',None),'shadow':o.data.use_shadow}for o in bpy.data.objects if o.type=='LIGHT'}
bpy.ops.wm.open_mainfile(filepath=str(R/a['sourceMaster']));old=signatures();props=source_props();mats=scope['materials']();images=scope['packed']();lamps=lights()
changed={c['after']['id']:c for c in p['changes']};allowed=set(changed)|{'V02 existing warm SUN native shadow domain'}
for marker in bpy.data.collections['SM_V02_COLLISION'].objects:
 if (marker.get('sourceComponent')or marker.name.removesuffix('__COL'))in changed:allowed.add(marker.name)
assert allowed==set(a['permittedChanges'])
bpy.ops.wm.open_mainfile(filepath=str(R/a['master']));now=signatures();newprops=source_props()
assert all(now[n]==h and newprops[n]==props[n]for n,h in old.items()if n not in allowed)
assert all(newprops[n]==props[n]for n in allowed),'Existing object transforms changed'
assert scope['materials']()==mats and scope['packed']()==images and lights()==lamps
assert set(a['actualChanges'])=={n for n,h in old.items()if now[n]!=h}
world=lambda v:[float(v.x),float(v.z),float(-v.y)]
checks=[]
for stable,c in changed.items():
 obj=bpy.data.objects[stable];mesh=obj.data;assert not mesh.has_custom_normals
 bm=bmesh.new();bm.from_mesh(mesh);assert all(e.is_manifold for e in bm.edges),stable;assert bm.calc_volume(signed=True)>0,stable;bm.free()
 points=[world(obj.matrix_basis@v.co)for v in mesh.vertices];r=c['after']
 for i in range(3):
  assert abs(min(v[i]for v in points)-r['box']['min'][i])<1e-4
  assert abs(max(v[i]for v in points)-r['box']['max'][i])<1e-4
 assert all(math.isfinite(x)for uv in mesh.uv_layers[0].data for x in uv.uv)
 checks.append({'id':stable,'manifold':True,'positiveVolume':True,'worldBounds':True})
floors=[];rays=0
for d in p['designs']:
 obj=bpy.data.objects[d['id']];mesh=obj.data;mesh.calc_loop_triangles();positions=[obj.matrix_basis@v.co for v in mesh.vertices]
 tree=BVHTree.FromPolygons(positions,[list(t.vertices)for t in mesh.loop_triangles],all_triangles=True,epsilon=1e-7)
 area=0
 for tri in mesh.loop_triangles:
  ps=[world(positions[i])for i in tri.vertices]
  if all(abs(q[1]-d['topY'])<5e-5 for q in ps):area+=abs(sum(u[0]*v[2]-v[0]*u[2]for u,v in zip(ps,ps[1:]+ps[:1])))/2
 assert abs(area-d['newTopArea'])<.01,(d['id'],area,d['newTopArea'])
 inside=outside=0
 for i in range(280):
  x=d['x0']+(i+.5)*.125;f=min(1,(x-d['x0'])/7,(d['x1']-x)/7);lo=d['z']-3.5+d['southInset']*f;hi=d['z']+3.5-d['northInset']*f
  for z in [lo+.025,d['z'],hi-.025]:
   hit=tree.ray_cast(Vector((x,-z,d['topY']+.15)),Vector((0,0,-1)),.3)[0]
   assert hit is not None and abs(hit.z-d['topY'])<1e-4,(d['id'],x,z,'missing floor');inside+=1
  for z in [lo-.025,hi+.025]:
   hit=tree.ray_cast(Vector((x,-z,d['topY']+.15)),Vector((0,0,-1)),.3)[0]
   assert hit is None,(d['id'],x,z,'floor outside authored profile');outside+=1
  contacts=[r for r in p['collisionAdditions']if r['walkable']and r['sourceStructure']==d['id']and r['box']['min'][0]-1e-8<=x<=r['box']['max'][0]+1e-8]
  assert contacts
  for r in contacts:
   assert r['box']['min'][2]>=lo-1e-8 and r['box']['max'][2]<=hi+1e-8
   assert max(r['box']['min'][2]-lo,hi-r['box']['max'][2])<.047
   assert r['box']['min'][2]+.55<d['z']<r['box']['max'][2]-.55
 floors.append({'id':d['id'],'topArea':area,'insideSourceRays':inside,'outsideSourceRays':outside,'maximumInwardProxyError':d['proxyMaximumInwardError']});rays+=inside+outside
for r in p['collisionAdditions']:
 marker=bpy.data.objects[r['id']+'__COL'];assert marker['sourceComponent']==r['id']and marker['solid']
 assert max(abs(v-w)for v,w in zip(marker.location,[r['center'][0],-r['center'][2],r['center'][1]]))<5e-5
 assert max(abs(v-w)for v,w in zip(marker.scale,[r['size'][0]/2,r['size'][2]/2,r['size'][1]/2]))<1e-5
for name in a['disabledOldMarkers']:assert not bpy.data.objects[name]['solid']
witnesses=[]
for chunk in a['exports']:
 root=bpy.data.objects[chunk['id']];assert root.type=='EMPTY' and root.parent is None and root.matrix_basis==Matrix.Identity(4)
 triangles=[]
 for stable in chunk['recordIDs']:
  obj=bpy.data.objects[stable];child=bpy.data.objects[chunk['id']+'::'+stable]
  assert obj.parent is None and child.parent==root and child.data==obj.data and child.matrix_basis==obj.matrix_basis
  mesh=obj.data;mesh.calc_loop_triangles();normal_matrix=obj.matrix_basis.to_3x3().inverted().transposed()
  for tri in mesh.loop_triangles:
   corners=[]
   for li in tri.loops:
    point=obj.matrix_basis@mesh.vertices[mesh.loops[li].vertex_index].co;normal=(normal_matrix@mesh.corner_normals[li].vector).normalized()
    corners.append({'position':world(point),'normal':world(normal),'uvs':[list(layer.data[li].uv)for layer in mesh.uv_layers]})
   triangles.append({'id':stable,'material':mesh.materials[tri.material_index].name,'corners':corners})
 assert len(triangles)==chunk['triangles'],chunk['id']
 target=E/(chunk['id']+'-source-witness.json.gz');target.write_bytes(gzip.compress(json.dumps(triangles,separators=(',',':')).encode(),mtime=0))
 witnesses.append({'id':chunk['id'],'file':str(target.relative_to(R)),'sha256':sha(target),'triangles':len(triangles)})
report={'status':'PASS independently reopened source, analytic profiles, dense source rays, conservative contact support and export witnesses',
 'masterSHA256':a['masterSHA256'],'sourceMasterSHA256':a['sourceMasterSHA256'],'authoringSHA256':sha(D/'V02_Slender_Crossings_Authoring.json'),
 'planSHA256':sha(D/'V02_Slender_Crossings_Plan.json'),'validatorSHA256':sha(Path(__file__)),
 'preservedSourceObjects':sum(n not in allowed for n in old),'preservedMaterials':len(mats),'preservedPackedImages':len(images),
 'components':checks,'floors':floors,'sourceRays':rays,'contactMarkers':len(p['collisionAdditions']),'witnesses':witnesses,
 'scope':'Source shape/support/export authority only. Current GLB, actual input, NPC, camera, lighting coupling, performance and final reference acceptance remain pending.'}
(D/'V02_Slender_Crossings_Master_Validation.json').write_text(json.dumps(report,indent=2)+'\n');print(report['status'],rays,'rays')
