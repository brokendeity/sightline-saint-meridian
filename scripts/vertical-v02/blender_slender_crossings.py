"""Author flared bridge meshes and their explicit physical decomposition.
Unchanged original city, rooms, encounters, materials and source lights remain
immutable. The inherited room bake is retained component data, not rebaked here.
"""
import ast,bmesh,bpy,copy,hashlib,json,math,sys
from pathlib import Path
from mathutils import Vector
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';O=R/'assets/city/vertical-v02/slender-crossings';O.mkdir(exist_ok=True)
sys.path.insert(0,str(Path(__file__).parent));from v02_saved_scene_snapshots import signatures,source_props
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();read=lambda p:json.loads(p.read_text())
plan=read(D/'V02_Slender_Crossings_Plan.json')
for key in ['Geometry_Clearance','Traffic_Clearance']:
 gate=read(D/f'V02_Slender_Crossings_{key}.json');assert gate['status'].startswith('PASS')
 for file,digest in gate['hashes'].items():assert sha(R/file)==digest,file
source=R/plan['sourceMaster'];assert sha(source)==plan['sourceMasterSHA256'];assert sha(R/plan['sourceManifest'])==plan['sourceManifestSHA256']
base=read(R/plan['sourceManifest']);changes={c['after']['id']:c['after']for c in plan['changes']};original={r['id']:r for r in base['records']};design={b['id']:b for b in plan['designs']}
bpy.ops.wm.open_mainfile(filepath=str(source));bpy.context.view_layer.update();before=signatures();before_props=source_props()
helper=Path(__file__).with_name('validate_upper_anchor_master.py');defs=[n for n in ast.parse(helper.read_text()).body if isinstance(n,ast.FunctionDef)and n.name in ['value','materials','packed']]
scope=dict(globals());exec(compile(ast.Module(body=defs,type_ignores=[]),str(helper),'exec'),scope)
snapshot_materials=scope['materials'];snapshot_packed=scope['packed'];old_materials=snapshot_materials();old_packed=snapshot_packed()
def lights():return{o.name:{'type':o.data.type,'color':list(o.data.color),'energy':o.data.energy,'angle':getattr(o.data,'angle',None),'shadow':o.data.use_shadow}for o in bpy.data.objects if o.type=='LIGHT'}
old_lights=lights();allowed=set(changes);marker_names=[]
for marker in bpy.data.collections['SM_V02_COLLISION'].objects:
 key=marker.get('sourceComponent')or marker.name.removesuffix('__COL')
 if key in changes:
  marker['solid']=False;marker['supersededBySlenderContacts']=True;allowed.add(marker.name);marker_names.append(marker.name)

def factor(x,d):return max(0,min(1,(x-d['x0'])/7,(d['x1']-x)/7))

def world(v):return [float(v.x),float(v.z),float(-v.y)]
components=[]
for stable in changes:
 old=original[stable];parent=old.get('sourceSurface',stable);d=design[parent];obj=bpy.data.objects[stable]
 assert obj.type=='MESH'and obj.parent is None and not obj.data.has_custom_normals,stable
 matrix=obj.matrix_basis.copy();inverse=matrix.inverted();bm=bmesh.new();bm.from_mesh(obj.data)
 for cut in [d['x0']+7,d['x1']-7]:
  local_point=inverse@Vector((cut,-d['z'],d['topY']))
  local_normal=(matrix.to_3x3().transposed()@Vector((1,0,0))).normalized()
  bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),dist=1e-7,
   plane_co=local_point,plane_no=local_normal,clear_inner=False,clear_outer=False)
 for vertex in bm.verts:
  p=matrix@vertex.co;x,z=float(p.x),float(-p.y);f=factor(x,d)
  if stable==d['id']:
   u=(z-(d['z']-3.5))/7;lo=d['z']-3.5+d['southInset']*f;hi=d['z']+3.5-d['northInset']*f;z=lo+u*(hi-lo)
  else:
   sign=1 if old['center'][2]>d['z']else-1;delta=d['northInset']if sign>0 else d['southInset'];z-=sign*delta*f
  p.y=-z;vertex.co=inverse@p
 bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));assert all(e.is_manifold for e in bm.edges),stable
 assert bm.calc_volume(signed=True)>0,stable
 mesh=bpy.data.meshes.new(stable+'__slender')
 for mat in obj.data.materials:mesh.materials.append(mat)
 bm.to_mesh(mesh);bm.free();mesh.update()
 assert len(mesh.uv_layers)==1,stable
 for poly in mesh.polygons:
  axis=max(range(3),key=lambda i:abs(poly.normal[i]));axes=[i for i in range(3)if i!=axis]
  for li in poly.loop_indices:
   v=mesh.vertices[mesh.loops[li].vertex_index].co;mesh.uv_layers[0].data[li].uv=(v[axes[0]]/2.4,v[axes[1]]/2.4)
 assert not mesh.validate(verbose=True),stable
 obj.data=mesh;obj['solid']=False;obj['v02SlenderCrossing']=parent
 points=[world(matrix@v.co)for v in mesh.vertices]
 box={'min':[min(p[i]for p in points)for i in range(3)],'max':[max(p[i]for p in points)for i in range(3)]}
 r=changes[stable]
 assert max(abs(box[k][i]-r['box'][k][i])for k in ['min','max']for i in range(3))<1e-4,(stable,box,r['box'])
 components.append({'id':stable,'bounds':box,'vertices':len(mesh.vertices)})
for r in plan['collisionAdditions']:
 marker=bpy.data.objects.new(r['id']+'__COL',None);bpy.data.collections['SM_V02_COLLISION'].objects.link(marker)
 marker.empty_display_type='CUBE';marker.location=(r['center'][0],-r['center'][2],r['center'][1]);marker.scale=(r['size'][0]/2,r['size'][2]/2,r['size'][1]/2)
 marker['sourceComponent']=r['id'];marker['sourceSurface']=r['sourceSurface'];marker['solid']=True;marker['walkable']=r['walkable'];marker['runtimeOwner']=r['owner']
# The old domain is metadata, not a visible source light. Its saved source link
# now names this geometry revision; all actual SUN settings remain unchanged.
master=D/'blender/SaintMeridian_V02_Slender_Crossings.blend';domain=bpy.data.objects['V02 existing warm SUN native shadow domain'];allowed.add(domain.name)
shadow=json.loads(domain['runtimeShadowContract']);shadow.update(parentMaster=str(source.relative_to(R)),parentMasterSHA256=sha(source),master=str(master.relative_to(R)))
domain['runtimeShadowContract']=json.dumps(shadow,sort_keys=True)
exports_col=bpy.data.collections.new('SM_V02_SLENDER_CROSSING_EXPORT');bpy.context.scene.collection.children.link(exports_col)
affected=[c for c in base['chunks']if set(c['recordIDs'])&set(changes)];exports=[];restore=[]
# Export underlying source PBR surfaces, then restore all source shader links.
used={slot.material for c in affected for stable in c['recordIDs']for slot in bpy.data.objects[stable].material_slots if slot.material}
for mat in used:
 assert mat.use_nodes
 output=mat.node_tree.nodes.get('Material Output');bsdf=mat.node_tree.nodes.get('Principled BSDF');assert output and bsdf,mat.name
 prior=next((l.from_socket for l in mat.node_tree.links if l.to_socket==output.inputs['Surface']),None);assert prior
 restore.append((mat,output,prior));mat.node_tree.links.new(bsdf.outputs['BSDF'],output.inputs['Surface'])
for c in affected:
 name=c['id']+'-slender';root=bpy.data.objects.new(name,None);exports_col.objects.link(root);root['v02Chunk']=name;root['runtimeIDs']=json.dumps(c['recordIDs']);selected=[root];triangles=0
 for stable in c['recordIDs']:
  obj=bpy.data.objects[stable];assert obj.parent is None,stable
  child=obj.copy();child.name=name+'::'+stable;exports_col.objects.link(child);child.parent=root;child['sourceStableID']=stable;selected.append(child)
  obj.data.calc_loop_triangles();triangles+=len(obj.data.loop_triangles)
 bpy.ops.object.select_all(action='DESELECT')
 for obj in selected:obj.select_set(True)
 bpy.context.view_layer.objects.active=root;bpy.context.view_layer.update();file=O/(name+'.glb')
 bpy.ops.export_scene.gltf(filepath=str(file),export_format='GLB',use_selection=True,export_yup=True,export_extras=True,export_tangents=True)
 exports.append({'id':name,'replaces':c['id'],'url':str(file.relative_to(R)),'sha256':sha(file),'bytes':file.stat().st_size,'triangles':triangles,'recordIDs':c['recordIDs']})
for mat,output,socket in restore:mat.node_tree.links.new(socket,output.inputs['Surface'])
exports_col.hide_render=exports_col.hide_viewport=True

def preserved():
 now=signatures();props=source_props()
 assert all(now[n]==v and props[n]==before_props[n]for n,v in before.items()if n not in allowed),'Unrelated source geometry/properties changed'
 assert snapshot_materials()==old_materials and snapshot_packed()==old_packed
 assert lights()==old_lights
 return now
preserved();bpy.ops.wm.save_as_mainfile(filepath=str(master));bpy.ops.wm.open_mainfile(filepath=str(master));now=preserved()
manifest={**base,'schema':'sm-v02-flared-crossings-1','records':[changes.get(r['id'],r)for r in base['records']]+plan['collisionAdditions'],
 'chunks':[next((e for e in exports if e['replaces']==c['id']),c)for c in base['chunks']],
 'slenderCrossings':{'master':str(master.relative_to(R)),'masterSHA256':sha(master),'planSHA256':sha(D/'V02_Slender_Crossings_Plan.json'),
  'designs':plan['designs'],'newContactSegments':len(plan['collisionAdditions']),
  'lightingCaveat':'Inherited new-room fixture atlases have unchanged receiver geometry; their wider-scene bake coupling needs reassessment after this bridge geometry change.'},
 'status':'SOURCE CANDIDATE; current native/input/source export/visual/performance acceptance pending'}
(O/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
shadow['masterSHA256']=sha(master);(O/'shadow-contract.json').write_text(json.dumps(shadow,indent=2)+'\n')
report={'status':'PASS saved/reopened controlled bridge authoring; independent source/export/native/input acceptance pending',
 'sourceMaster':str(source.relative_to(R)),'sourceMasterSHA256':sha(source),'master':str(master.relative_to(R)),'masterSHA256':sha(master),
 'planSHA256':sha(D/'V02_Slender_Crossings_Plan.json'),'scriptSHA256':sha(Path(__file__)),
 'manifestSHA256':sha(O/'manifest.json'),'shadowContractSHA256':sha(O/'shadow-contract.json'),
 'preservedSourceObjects':sum(n not in allowed for n in before),'permittedChanges':sorted(allowed),
 'actualChanges':[n for n,v in before.items()if now[n]!=v],'materialsPreserved':len(old_materials),'packedImagesPreserved':len(old_packed),
 'components':components,'disabledOldMarkers':marker_names,'collisionAdditions':len(plan['collisionAdditions']),'exports':exports,'reusedChunks':len(base['chunks'])-len(affected),
 'limits':['Original unrelated source preserved; new geometry still requires independent witnesses and real-input acceptance','Inherited room-lighting scene coupling and full reference architecture remain open']}
(D/'V02_Slender_Crossings_Authoring.json').write_text(json.dumps(report,indent=2)+'\n');print(report['status'],len(exports),'chunks')
