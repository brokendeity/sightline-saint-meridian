"""Separate visual study: accepted architecture plus native render references.

Runtime sources and earlier Blender masters remain untouched. The reference
train/streets collection is preview-only and never a runtime architecture export.
"""
import bpy,json,gzip,hashlib,math,base64,sys
from pathlib import Path
from mathutils import Matrix,Vector
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';E=D/'evidence/reference-baseline';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();read=lambda p:json.loads(p.read_text())
candidate='--candidate'in sys.argv
if candidate:E=D/'evidence/visual-candidate'
views=read(D/'V02_Reference_Views.json');browserFile=D/('V02_Visual_Candidate_Native.json'if candidate else'V02_Reference_Browser_Baseline.json');browser=read(browserFile);accepted=read(D/'V02_World_Life_Evidence.json');master=D/'blender/SaintMeridian_V02_Visual_Study.blend'
if candidate:
 assert '--render'in sys.argv and browser['status'].startswith('PASS');facades=read(R/'assets/city/vertical-v02/visual/facades.json');master=R/facades['master'];assert sha(master)==facades['masterSHA256']
else:assert browser['status'].startswith('PASS native')and browser['entrySHA256']==sha(R/browser['entry'])and browser['viewsSHA256']==sha(D/'V02_Reference_Views.json')
C=Matrix(((1,0,0,0),(0,0,-1,0),(0,1,0,0),(0,0,0,1)));columns=lambda a:Matrix([a[i::4]for i in range(4)]);flat=lambda m:[m[row][col]for col in range(4)for row in range(4)]
if '--render' not in sys.argv:
 assert sha(R/accepted['master'])==accepted['masterSHA256'];bpy.ops.wm.open_mainfile(filepath=str(R/accepted['master']))
 snapshotFile=D/browser['transitRenderSnapshot']['file'];assert sha(snapshotFile)==browser['transitRenderSnapshot']['sha256'];snapshot=json.loads(gzip.decompress(snapshotFile.read_bytes()))
 refs=bpy.data.collections.new('SM_V02_NATIVE_RENDER_REFERENCE');bpy.context.scene.collection.children.link(refs)
 materials={};textures={};geometries={};textureDir=E/'native-textures';textureDir.mkdir(exist_ok=True)
 for id,texture in snapshot['textures'].items():
  file=textureDir/(id+'.png');file.write_bytes(base64.b64decode(texture['png'].split(',')[1]));image=bpy.data.images.load(str(file),check_existing=True);image.pack();textures[id]=image
 for id,m in snapshot['materials'].items():
  material=bpy.data.materials.new('SM_NATIVE_'+m['name']+'_'+id[:8]);material.use_nodes=True;bsdf=material.node_tree.nodes.get('Principled BSDF');color=m.get('color')or[.035,.06,.09];bsdf.inputs['Base Color'].default_value=(*color,1);bsdf.inputs['Metallic'].default_value=m.get('metalness',0)or 0;bsdf.inputs['Roughness'].default_value=m.get('roughness',.5)or.5
  emission=m.get('emissive')or[0,0,0];bsdf.inputs['Emission Color'].default_value=(*emission,1);bsdf.inputs['Emission Strength'].default_value=m.get('emissiveIntensity',1)or 0
  if m.get('map'):
   node=material.node_tree.nodes.new('ShaderNodeTexImage');node.image=textures[m['map']];mix=material.node_tree.nodes.new('ShaderNodeMixRGB');mix.blend_type='MULTIPLY';mix.inputs[0].default_value=1;mix.inputs[1].default_value=(*color,1);material.node_tree.links.new(node.outputs['Color'],mix.inputs[2]);material.node_tree.links.new(mix.outputs[0],bsdf.inputs['Base Color'])
  tint=material.node_tree.nodes.new('ShaderNodeMixRGB');tint.blend_type='MULTIPLY';tint.inputs[0].default_value=1;existing=next((link.from_socket for link in material.node_tree.links if link.to_socket==bsdf.inputs['Base Color']),None);info=material.node_tree.nodes.new('ShaderNodeObjectInfo');material.node_tree.links.new(info.outputs['Color'],tint.inputs[2]);tint.inputs[1].default_value=(*color,1)
  if existing:material.node_tree.links.new(existing,tint.inputs[1])
  material.node_tree.links.new(tint.outputs[0],bsdf.inputs['Base Color'])
  material['sourceRuntimeType']=m['type'];material['previewOnly']=True;materials[id]=material
 for gID,g in snapshot['geometries'].items():
  p=g['position'];points=[(p[i],-p[i+2],p[i+1])for i in range(0,len(p),3)];indices=g['index']or list(range(len(points)));mesh=bpy.data.meshes.new('SM_NATIVE_'+gID);mesh.from_pydata(points,[],[indices[i:i+3]for i in range(0,len(indices),3)]);mesh.update()
  if g.get('uv'):
   uv=mesh.uv_layers.new(name='native_uv');values=g['uv']
   for loop in mesh.loops:
    i=loop.vertex_index*2;uv.data[loop.index].uv=(values[i],1-values[i+1])
  if g.get('normal')and hasattr(mesh,'normals_split_custom_set_from_vertices'):
   n=g['normal'];normals=[(n[i],-n[i+2],n[i+1])for i in range(0,len(n),3)]
   for face in mesh.polygons:face.use_smooth=True
   mesh.normals_split_custom_set_from_vertices(normals)
  geometries[gID]=mesh
 # Material binding belongs to geometry in Blender; clone mesh data only when
 # the native instance actually uses a different material tuple.
 bound={}
 for i,m in enumerate(snapshot['meshes']):
  key=(m['geometry'],tuple(m['materials']));mesh=bound.get(key)
  if mesh is None:
   mesh=geometries[m['geometry']].copy();bound[key]=mesh
   for id in m['materials']:mesh.materials.append(materials[id])
   for group in(snapshot['geometries'][m['geometry']]['groups']if len(m['materials'])>1 else[]):
    for j in range(group['start']//3,(group['start']+group['count'])//3):mesh.polygons[j].material_index=group['materialIndex']
  o=bpy.data.objects.new('SM_NATIVE_'+str(i)+' '+m['name'],mesh);refs.objects.link(o);o.matrix_world=C@columns(m['matrix'])@C.inverted();o['sourceRuntimeMesh']=m['name'];o['exportAsGeometry']=False
  if m.get('color'):o.color=(*m['color'],1)
 lights=bpy.data.collections.new('SM_V02_VISUAL_STUDY_LIGHTING');bpy.context.scene.collection.children.link(lights)
 for index,l in enumerate(browser['captures'][0]['lights']):
  if l['type']!='DirectionalLight':continue
  data=bpy.data.lights.new('Study directional '+str(index),'SUN');data.color=l['color'];data.energy=l['intensity'];data.angle=math.radians(4);o=bpy.data.objects.new(data.name,data);lights.objects.link(o);pos=Vector((l['position'][0],-l['position'][2],l['position'][1]));o.rotation_euler=(-pos).to_track_quat('-Z','Y').to_euler();o['previewOnly']=True
 scene=bpy.context.scene;scene.world=bpy.data.worlds.new('V02 night interpretation');scene.world.use_nodes=True;bg=scene.world.node_tree.nodes.get('Background');bg.inputs['Color'].default_value=(.035,.075,.105,1);bg.inputs['Strength'].default_value=.5
 scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=16;scene.cycles.use_denoising=True;scene.cycles.max_bounces=5;scene.cycles.transparent_max_bounces=4;scene.render.threads_mode='FIXED';scene.render.threads=8
 scene.render.resolution_x=views['width'];scene.render.resolution_y=views['height'];scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.film_transparent=False;scene.view_settings.view_transform='AgX'
 for view in views['views']:
  native=next(c for c in browser['captures']if c['id']==view['id']);o=bpy.data.objects['V02-camera-'+view['id']];o.matrix_world=C@columns(native['viewMatrix']).inverted();data=o.data;data.type='PERSP';data.sensor_fit='VERTICAL';data.sensor_height=24;data.lens=12/math.tan(math.radians(views['verticalFOVDegrees']/2));data.clip_start=views['near'];data.clip_end=views['far'];data.shift_x=data.shift_y=0;o['sharedReferenceViewsSHA256']=sha(D/'V02_Reference_Views.json')
 scene['visualStudyOnly']=True;scene['sourceWorldLifeMasterSHA256']=accepted['masterSHA256'];scene['nativeRenderSnapshotSHA256']=sha(snapshotFile);scene['referenceViewsSHA256']=sha(D/'V02_Reference_Views.json');bpy.ops.wm.save_as_mainfile(filepath=str(master));print('Saved visual study',master,'native references',len(snapshot['meshes']))
else:
 bpy.ops.wm.open_mainfile(filepath=str(master));scene=bpy.context.scene;report={'status':'FAIL','scope':'Shared actual camera projection/framing and Blender authoring renders. Principled/AgX lighting interprets runtime toon/ACES; atmosphere, hero, drones and procedural pavement shaders are not reproduced. Not final visual acceptance.','masterSHA256':sha(master),'sourceWorldLifeMasterSHA256':accepted['masterSHA256'],'browserCaptureFile':str(browserFile.relative_to(D)),'browserCaptureSHA256':sha(browserFile),'viewsSHA256':sha(D/'V02_Reference_Views.json'),'captures':[]}
 for view in views['views']:
  camera=bpy.data.objects['V02-camera-'+view['id']];scene.camera=camera;bpy.context.view_layer.update();projection=camera.calc_matrix_camera(bpy.context.evaluated_depsgraph_get(),x=views['width'],y=views['height'],scale_x=1,scale_y=1);native=next(c for c in browser['captures']if c['id']==view['id']);nativeP=columns(native['projection']);nativeV=columns(native['viewMatrix']);equivalentV=camera.matrix_world.inverted()@C
  probes=[[76,100,380],[72,24,360],[80,128,420],[80,0,300],[60,70,320]];errors=[]
  for p in probes:
   a=projection@equivalentV@Vector((*p,1));b=nativeP@nativeV@Vector((*p,1));errors.append(math.hypot((a.x/a.w-b.x/b.w)*views['width']/2,(a.y/a.w-b.y/b.w)*views['height']/2))
  assert max(errors)<.05,errors;file=E/('blender-'+view['id']+'.png');scene.render.filepath=str(file);bpy.ops.render.render(write_still=True)
  report['captures'].append({'id':view['id'],'file':str(file.relative_to(D)),'sha256':sha(file),'projection':flat(projection),'equivalentGameViewMatrix':flat(equivalentV),'maximumLandmarkProjectionErrorPixels':max(errors),'renderSamples':scene.cycles.samples})
 report['status']='PASS matched camera projection and baseline Blender renders only; final visual acceptance pending';(D/('V02_Reference_Blender_Candidate.json'if candidate else'V02_Reference_Blender_Baseline.json')).write_text(json.dumps(report,indent=2)+'\n');print(report['status'])
