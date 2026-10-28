"""Blender-authored UV2/full-diffuse-light pilot for existing public loggia rooms.

Only a hidden export object's additional UV layer and private bake materials
change. All original physical/source components remain unchanged. This creates
source/export data; it does not install a runtime candidate or pass visual review.
"""
from pathlib import Path
import bpy,sys,json,hashlib,math,struct,gzip,time
from array import array
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';O=R/'assets/city/vertical-v02/diffuse-pilot';O.mkdir(exist_ok=True);E=D/'evidence/diffuse-pilot';E.mkdir(exist_ok=True)
sys.path.insert(0,str(Path(__file__).parent));from v02_scene_signatures import signatures
read=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
a=read(D/'V02_Loggia_Terraces_Authoring.json');source=R/a['master'];assert sha(source)==a['masterSHA256'];start=time.monotonic()
report={'status':'RUNNING source UV2 preflight','sourceMaster':str(source.relative_to(R)),'sourceMasterSHA256':sha(source),'scriptSHA256':sha(Path(__file__)),'scope':__doc__.strip(),'stages':[]};save=lambda:(D/'V02_Diffuse_Pilot_Authoring.json').write_text(json.dumps(report,indent=2)+'\n')
save()
def stage(name,**detail):report['stage']=name;report['stages'].append({'name':name,'wallSeconds':time.monotonic()-start,**detail});save();print('PILOT',name,detail,flush=True)
def geometry_signature(o):
 h=hashlib.sha256()
 for v in o.data.vertices:h.update(struct.pack('<3f',*v.co))
 for f in o.data.polygons:h.update(struct.pack('<II',len(f.vertices),f.material_index));h.update(struct.pack('<'+'I'*len(f.vertices),*f.vertices))
 for x in o.data.uv_layers[0].data:h.update(struct.pack('<2f',*x.uv))
 return h.hexdigest()
try:
 bpy.ops.wm.open_mainfile(filepath=str(source));bpy.context.view_layer.update();before=signatures();target=bpy.data.objects['loggia-rooms'];original_signature=geometry_signature(target);original_uvs=[x.name for x in target.data.uv_layers];assert len(original_uvs)==1
 report['sourceImages']=[{'name':i.name,'source':i.source,'packed':bool(i.packed_file),'filepath':i.filepath,'exists':bool(i.packed_file)or i.source!='FILE'or Path(bpy.path.abspath(i.filepath)).is_file()}for i in bpy.data.images]
 assert all(i['exists']for i in report['sourceImages']),'Source image dependency unavailable'
 collection=next(c for c in target.users_collection if c.name=='SM_V02_LOGGIA_EXPORT');old_col=(collection.hide_render,collection.hide_viewport);old_hidden=(target.hide_render,target.hide_get());other_exports={o.name:o.hide_render for o in collection.objects if o!=target};collection.hide_render=collection.hide_viewport=False;target.hide_render=False;target.hide_set(False)
 for name in other_exports:bpy.data.objects[name].hide_render=True
 bpy.ops.object.select_all(action='DESELECT');target.select_set(True);bpy.context.view_layer.objects.active=target;uv=target.data.uv_layers.new(name='V02_Diffuse_Atlas');target.data.uv_layers.active_index=len(target.data.uv_layers)-1;target.data.uv_layers[0].active_render=True
 bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(angle_limit=math.radians(66),island_margin=.006,area_weight=0,correct_aspect=True,scale_to_bounds=True);bpy.ops.object.mode_set(mode='OBJECT');assert geometry_signature(target)==original_signature,'UV2 operation changed positions, polygons, slots or original UV'
 uv=target.data.uv_layers['V02_Diffuse_Atlas'];coords=[tuple(v.uv)for v in uv.data];assert coords and all(math.isfinite(v)and -.00001<=v<=1.00001 for p in coords for v in p);report['uv']={'name':uv.name,'loops':len(coords),'min':[min(p[k]for p in coords)for k in [0,1]],'max':[max(p[k]for p in coords)for k in [0,1]],'baseUVPreserved':True}
 original_mats=list(target.data.materials);restore=[]
 for m in original_mats:
  out=m.node_tree.nodes.get('Material Output');bs=m.node_tree.nodes.get('Principled BSDF');prior=next((l.from_socket for l in m.node_tree.links if l.to_socket==out.inputs['Surface']),None)
  if prior:restore.append((m,out,prior));m.node_tree.links.new(bs.outputs['BSDF'],out.inputs['Surface'])
 glb=O/'loggia-rooms-uv2.glb';bpy.ops.export_scene.gltf(filepath=str(glb),export_format='GLB',use_selection=True,export_yup=True,export_extras=True,export_tangents=True,export_texcoords=True)
 for m,out,socket in restore:m.node_tree.links.new(socket,out.inputs['Surface'])
 blob=glb.read_bytes();g=json.loads(blob[20:20+struct.unpack_from('<I',blob,12)[0]]);primitives=[p for mesh in g['meshes']for p in mesh['primitives']];assert all('TEXCOORD_1'in p['attributes']for p in primitives),'Exporter dropped unused UV2; no bake or runtime fallback allowed'
 report['export']={'file':str(glb.relative_to(R)),'sha256':sha(glb),'bytes':len(blob),'primitives':len(primitives),'uv2Primitives':sum('TEXCOORD_1'in p['attributes']for p in primitives)};stage('source UV2 exported',**report['export'])
 scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=64;scene.cycles.use_denoising=False;scene.cycles.max_bounces=6;scene.cycles.transparent_max_bounces=5;scene.render.threads_mode='FIXED';scene.render.threads=8
 image=bpy.data.images.new('V02 loggia source diffuse irradiance atlas',width=1024,height=1024,alpha=True,float_buffer=True);image.colorspace_settings.name='Non-Color';bake_mats=[]
 for m in original_mats:
  clone=m.copy();clone.name=m.name+'__DiffuseBake';clone.use_fake_user=True;node=clone.node_tree.nodes.new('ShaderNodeTexImage');node.name='V02 full diffuse atlas bake target';node.image=image;node.select=True;clone.node_tree.nodes.active=node;bake_mats.append(clone)
 for i,m in enumerate(bake_mats):target.data.materials[i]=m
 source_ids=next(c['recordIDs']for c in a['exports']if c['id']=='loggia-rooms');hidden={id:bpy.data.objects[id].hide_render for id in source_ids}
 for id in source_ids:bpy.data.objects[id].hide_render=True
 scene.render.bake.use_pass_direct=True;scene.render.bake.use_pass_indirect=True;scene.render.bake.use_pass_color=False;scene.render.bake.use_selected_to_active=False
 stage('baking source direct and indirect diffuse',resolution=[1024,1024],samples=64,physicalSourceComponents=len(source_ids),overlappingSourceDuplicatesHidden=True,sourceRenderUV=target.data.uv_layers[0].name,bakeUV=uv.name)
 bpy.ops.object.bake(type='DIFFUSE',pass_filter={'DIRECT','INDIRECT'},use_clear=True,margin=8,uv_layer=uv.name)
 for id,flag in hidden.items():bpy.data.objects[id].hide_render=flag
 for i,m in enumerate(original_mats):target.data.materials[i]=m
 pixels=array('f',[0])*(1024*1024*4);image.pixels.foreach_get(pixels);assert all(math.isfinite(x)for x in pixels),'Nonfinite baked irradiance';covered=sum(pixels[i+3]>.99 for i in range(0,len(pixels),4));lit=sum(max(pixels[i:i+3])>1e-5 for i in range(0,len(pixels),4));assert covered>100000 and lit>covered*.05,'Insufficient real indirect lighting/atlas coverage'
 # glTF UVs use the upper-left image convention. Raw data is explicitly stored
 # top row first and later must be sampled with texture.flipY=false. Runtime
 # admission still requires UV/texel orientation and native-view verification.
 raw=b''.join(struct.pack('<'+'e'*(1024*4),*pixels[y*4096:(y+1)*4096])for y in reversed(range(1024)));file=O/'loggia-diffuse.rgba16f.gz';file.write_bytes(gzip.compress(raw,mtime=0))
 report['atlas']={'file':str(file.relative_to(R)),'sha256':sha(file),'rawSHA256':hashlib.sha256(raw).hexdigest(),'bytes':file.stat().st_size,'rawBytes':len(raw),'width':1024,'height':1024,'components':4,'format':'little-endian IEEE754 binary16 RGBA, scene-linear uncolored source direct and indirect diffuse, top row first','uv':'glTF TEXCOORD_1 / texture.flipY=false; runtime orientation validation pending','samples':64,'coveredPixels':covered,'litPixels':lit,'minRGB':min(pixels[i+k]for i in range(0,len(pixels),4)for k in range(3)),'maxRGB':max(pixels[i+k]for i in range(0,len(pixels),4)for k in range(3))}
 scene.render.image_settings.file_format='OPEN_EXR';scene.render.image_settings.color_depth='16';image.save_render(str(E/'loggia-diffuse.exr'),scene=scene);scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_depth='8';image.save_render(str(E/'loggia-diffuse-preview.png'),scene=scene);image.pack()
 target['diffuseAtlasImage']=image.name;target['diffuseAtlasBakeMaterials']=json.dumps([m.name for m in bake_mats]);target['diffuseAtlasSourceComponents']=json.dumps(source_ids);target.data.uv_layers.active_index=0;target.data.uv_layers[0].active_render=True
 for name,flag in other_exports.items():bpy.data.objects[name].hide_render=flag
 collection.hide_render,collection.hide_viewport=old_col;target.hide_render=old_hidden[0];target.hide_set(old_hidden[1]);bpy.context.view_layer.update();after=signatures();assert all(after[n]==h for n,h in before.items()if n!='loggia-rooms');assert geometry_signature(target)==original_signature
 master=D/'blender/SaintMeridian_V02_Diffuse_Pilot.blend';bpy.ops.wm.save_as_mainfile(filepath=str(master));bpy.ops.wm.open_mainfile(filepath=str(master));bpy.context.view_layer.update();after=signatures();assert all(after[n]==h for n,h in before.items()if n!='loggia-rooms');assert geometry_signature(bpy.data.objects['loggia-rooms'])==original_signature
 report.update({'status':'AUTHORED UV2 and real source full-diffuse-light atlas; independent export/native/visual verification pending','master':str(master.relative_to(R)),'masterSHA256':sha(master),'unchangedSourceObjects':len(before)-1,'controlledSourceUVChange':'loggia-rooms hidden export only','geometryBaseUVSignature':original_signature,'newDynamicLights':0,'runtimeLightingPolicy':'Replace selected materials diffuse contributions with source bake; preserve original specular/environment and emissive terms. Never add the full bake on top of existing scene diffuse.'});stage('saved source pilot',masterSHA256=report['masterSHA256'])
except Exception as error:
 report['status']='FAIL source lighting pilot';report['error']=str(error);save();raise
save()
