"""Source seating and wayfinding, preserving actual public-room circulation.

Six benches retain their exact old collision envelopes. Three thin boards are
attached to existing rear walls; their explicit contacts do not enter through
routes. Source/global lighting and all old materials/images remain unchanged.
Fresh UV2 fixtures and reflection baking follow in a separate source child.
"""
from pathlib import Path
import ast,copy,hashlib,json,math,sys
import bpy,bmesh
from mathutils import Vector
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02'
O=R/'assets/city/vertical-v02/furnished-public-rooms';O.mkdir(exist_ok=True)
sys.path.insert(0,str(Path(__file__).parent))
from v02_saved_scene_snapshots import signatures,source_props
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();read=lambda p:json.loads(p.read_text())
build=read(D/'V02_Slender_Crossings_Build.json');source=R/build['master'];assert sha(source)==build['masterSHA256']
base=read(R/build['manifest']);boards=read(D/'V02_Public_Room_Boards.json')
for spec in boards['files']:assert sha(R/spec['file'])==spec['sha256']
bpy.ops.wm.open_mainfile(filepath=str(source));bpy.context.view_layer.update();before=signatures();old_props=source_props()
helper=Path(__file__).with_name('validate_upper_anchor_master.py');scope=dict(globals())
defs=[n for n in ast.parse(helper.read_text()).body if isinstance(n,ast.FunctionDef)and n.name in ['value','materials','packed']]
exec(compile(ast.Module(body=defs,type_ignores=[]),str(helper),'exec'),scope)
old_materials=scope['materials']();old_images=scope['packed']()
materials={'steel':bpy.data.materials['V02_steel'],'seat':bpy.data.materials.new('V02_public_seating_composite')}
seat=materials['seat'];seat.use_nodes=True;seat.diffuse_color=(.032,.065,.082,1)
bs=seat.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=seat.diffuse_color;bs.inputs['Roughness'].default_value=.52;bs.inputs['Metallic'].default_value=.12
palette=list(materials)
V=[(-1,-1,-1),(-1,-1,1),(-1,1,-1),(-1,1,1),(1,-1,-1),(1,-1,1),(1,1,-1),(1,1,1)]
F=[(0,2,6,4),(1,5,7,3),(0,4,5,1),(2,3,7,6),(0,1,3,2),(4,6,7,5)]
helper2=Path(__file__).with_name('blender_public_terraces.py');defs=[n for n in ast.parse(helper2.read_text()).body if isinstance(n,ast.FunctionDef)and n.name in ['finish','parts']]
exec(compile(ast.Module(body=defs,type_ignores=[]),str(helper2),'exec'),globals())
col=bpy.data.collections.new('SM_V02_PUBLIC_ROOM_FURNITURE');bpy.context.scene.collection.children.link(col)
manifest=copy.deepcopy(base);allowed=set();new_records=[];changed=[];new_objects=[];exports=[]
for floor in [24,52,84]:
 for z in [307.4,312.6]:
  id=f'east-loggia-{floor}-bench-{z}';obj=bpy.data.objects[id];old_mesh=obj.data
  # Actual 48cm seat height, three composite seat panels, under-seat beam and
  # two narrow U-shaped metal supports. Everything fits the old 55x180cm box.
  values=[]
  for zz in [-.60,0,.60]:values.append(([0,zz,.195],[.55,.582,.09],'seat'))
  values.append(([0,0,.105],[.15,1.66,.09],'steel'))
  for zz in [-.64,.64]:
   for xx in [-.19,.19]:values.append(([xx,zz,-.0475],[.055,.09,.385],'steel'))
   values.append(([0,zz,-.215],[.435,.12,.05],'steel'))
  mesh=parts(id+'__furnished',values,.008)
  obj.data=mesh;allowed.add(id)
  # Hidden source export copies are tied to the same exact new source mesh.
  for other in bpy.data.objects:
   if other.type=='MESH'and other.data==old_mesh:
    assert 'EXPORT'in ' '.join(c.name for c in other.users_collection),other.name
    other.data=mesh;allowed.add(other.name)
  for vertex in mesh.vertices:
   p=obj.matrix_world@vertex.co;game=(p.x,p.z,-p.y)
   record=next(r for r in base['records']if r['id']==id)
   assert all(record['box']['min'][i]-.00002<=game[i]<=record['box']['max'][i]+.00002 for i in range(3)),(id,game)
  changed.append(id)
 root=bpy.data.objects[f'east-public-room-{floor}'];ids=json.loads(root['runtimeIDs']);assert len(ids)>10
 spec=next(s for s in boards['files']if s['floor']==floor);image=bpy.data.images.load(str(R/spec['file']),check_existing=False);image.name=f'V02 public circulation diagram {floor}';image.pack();image.use_fake_user=True
 material=bpy.data.materials.new(f'V02_public_wayfinding_{floor}');material.use_nodes=True;material.diffuse_color=(.04,.08,.11,1)
 node=material.node_tree.nodes.new('ShaderNodeTexImage');node.image=image;node.interpolation='Linear';bs=material.node_tree.nodes.get('Principled BSDF');bs.inputs['Roughness'].default_value=.68;bs.inputs['Metallic'].default_value=.1;material.node_tree.links.new(node.outputs['Color'],bs.inputs['Base Color'])
 id=f'east-loggia-{floor}-wayfinding';x=104.075;z=310;y=floor+1.65
 # Box uses local Blender X/-Z/Y; only front face receives full image UV.
 mesh=parts(id, [([0,0,0],[.055,3.24,1.64],'steel')],.008);mesh.materials.append(material)
 # Front facing west, image right goes along positive game Z. Face geometry
 # is a thin separate surface to keep bevel/frame out of the image UV.
 obj=bpy.data.objects.new(id,mesh);col.objects.link(obj);obj.location=(x,-z,y)
 plane=bpy.data.meshes.new(id+'__diagram');plane.from_pydata([(-.028,-1.6,-.8),(-.028,1.6,-.8),(-.028,1.6,.8),(-.028,-1.6,.8)],[],[(0,3,2,1)]);plane.materials.append(material)
 uv=plane.uv_layers.new(name='Wayfinding_UV');vertsUV=[(1,0),(0,0),(0,1),(1,1)]
 for loop in plane.loops:uv.data[loop.index].uv=vertsUV[loop.vertex_index]
 plane.update();panel=bpy.data.objects.new(id+'-diagram',plane);col.objects.link(panel);panel.location=obj.location
 assert plane.polygons[0].normal.x<-.99
 for o in [obj,panel]:
  o['v02StableID']=o.name;o['runtimeOwner']='v02:'+id;o['solid']=o==obj;o['walkable']=False;new_objects.append(o.name)
 new_record={'id':id,'owner':'v02:'+id,'center':[x,y,z],'size':[.055,1.64,3.24],'box':{'min':[x-.0275,y-.82,z-1.62],'max':[x+.0275,y+.82,z+1.62]},'solid':True,'walkable':False,'material':'steel','collection':col.name,'role':'Wall-mounted public circulation board, no new circulation obstacle'}
 assert new_record['box']['min'][0]-(102.1+.55)>1.3
 marker=bpy.data.objects.new(id+'__COL',None);marker['sourceComponent']=id;marker.location=obj.location;marker.scale=(.0275,1.62,.82);marker.empty_display_type='CUBE';bpy.data.collections['SM_V02_COLLISION'].objects.link(marker);new_objects.append(marker.name)
 new_records.append(new_record)
 diagram=copy.deepcopy(new_record);diagram.update({'id':panel.name,'solid':False,'primitive':'source-textured-plane','role':'Physical UV-mapped public route diagram'});new_records.append(diagram)
 # Mounting straps/ribs run only against rear wall, away from entrances.
 values=[]
 for zz in [-3.55,-3.30,-3.05,-2.80,-2.55,-2.30,-2.05,2.05,2.30,2.55,2.80,3.05,3.30,3.55]:values.append(([.025,-zz,.40],[.035,.035,2.75],'steel'))
 ribmesh=parts(id+'__wall-ribs',values,.004);ribs=bpy.data.objects.new(id+'-wall-ribs',ribmesh);col.objects.link(ribs);ribs.location=(104.07,-310,floor+1.65);ribs['runtimeOwner']='v02:'+id;ribs['v02StableID']=ribs.name;new_objects.append(ribs.name)
 ribrecord=copy.deepcopy(diagram);ribrecord.update({'id':ribs.name,'center':[104.095,floor+2.05,310],'size':[.035,2.75,7.135],'box':{'min':[104.0775,floor+.675,306.4325],'max':[104.1125,floor+3.425,313.5675]},'primitive':'source-wall-ribs','role':'Rear wall acoustic/protective metal ribs'});new_records.append(ribrecord)
 ids.extend([obj.name,panel.name,ribs.name]);root['runtimeIDs']=json.dumps(ids);allowed.add(root.name)
 # Export children retain actual local mesh/TRS and originals remain source.
 expcol=bpy.data.collections['SM_V02_EAST_LOGGIA_EXPORT']
 for original in [obj,panel,ribs]:
  clone=original.copy();clone.name=root.name+'::'+original.name;clone.parent=root;clone['sourceStableID']=original.name;expcol.objects.link(clone);new_objects.append(clone.name)
 exports.append({'id':root.name,'recordIDs':ids})
bpy.context.view_layer.update()
manifest['records'].extend(new_records)
for exp in exports:
 chunk=next(c for c in manifest['chunks']if c['id']==exp['id']);chunk['recordIDs']=exp['recordIDs']
manifest['publicRoomFurnishing']={'changedBenches':changed,'newRecords':[r['id']for r in new_records],'diagramSource':str((D/'V02_Public_Room_Boards.json').relative_to(R)),'scope':__doc__.strip()}
manifest['status']='SOURCE FURNISHING; fresh UV2, reflection, independent/native and input acceptance pending'
def preserve():
 after=signatures();assert all(after[n]==sig for n,sig in before.items()if n not in allowed)
 assert source_props()=={**old_props,**{n:source_props()[n]for n in new_objects}},'Unexpected old object TRS change'
 now=scope['materials']();assert all(now[n]==sig for n,sig in old_materials.items())
 now=scope['packed']();assert all(now[n]==sig for n,sig in old_images.items())
 return after
preserve();master=D/'blender/SaintMeridian_V02_Furnished_Public_Rooms.blend'
bpy.ops.wm.save_as_mainfile(filepath=str(master));bpy.ops.wm.open_mainfile(filepath=str(master));bpy.context.view_layer.update();after=preserve()
manifestPath=O/'manifest.json';manifestPath.write_text(json.dumps(manifest,indent=2)+'\n')
report={'status':'PASS saved/reopened controlled source furnishing; UV2, export, native and input acceptance pending','sourceMaster':str(source.relative_to(R)),'sourceMasterSHA256':sha(source),'master':str(master.relative_to(R)),'masterSHA256':sha(master),'sourceManifest':build['manifest'],'sourceManifestSHA256':build['manifestSHA256'],'manifest':str(manifestPath.relative_to(R)),'manifestSHA256':sha(manifestPath),'scriptSHA256':sha(Path(__file__)),'boardsSHA256':sha(D/'V02_Public_Room_Boards.json'),'changedSourceObjects':sorted(allowed),'newObjects':new_objects,'preservedSourceObjects':len(before)-len(allowed),'preservedMaterials':len(old_materials),'preservedImages':len(old_images),'exports':exports,'newRecords':new_records,'scope':__doc__.strip()}
(D/'V02_Furnished_Public_Rooms_Authoring.json').write_text(json.dumps(report,indent=2)+'\n');print(report['status'],flush=True)
