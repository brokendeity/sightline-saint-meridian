"""Saved Blender source views at actual current native loggia camera matrices."""
import bpy,json,hashlib,math
from pathlib import Path
from mathutils import Matrix,Vector
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';E=D/'evidence/diffuse-pilot'
read=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
a=read(D/'V02_Diffuse_Pilot_Authoring.json');n=read(D/'V02_Diffuse_Lighting_Native.json');assert n['status'].startswith('PASS');assert sha(R/n['entry'])==n['entrySHA256']
assert sha(R/a['master'])==a['masterSHA256'];bpy.ops.wm.open_mainfile(filepath=str(R/a['master']));scene=bpy.context.scene
C=Matrix(((1,0,0,0),(0,0,-1,0),(0,1,0,0),(0,0,0,1)));matrix=lambda a:Matrix([a[i::4]for i in range(4)])
scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=32;scene.cycles.use_denoising=True;scene.render.threads_mode='FIXED';scene.render.threads=8;scene.render.resolution_x=1664;scene.render.resolution_y=936;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_depth='8'
report={'status':'RUNNING','masterSHA256':a['masterSHA256'],'nativeReportSHA256':sha(D/'V02_Diffuse_Lighting_Native.json'),'captures':[],'scope':'Actual saved-source3loggia renders at native optics; source/native shading and final reference-art quality assessed separately'}
for id in ['loggia-40','loggia-68','loggia-100']:
 capture=next(c for c in n['captures']if c['id']==id and c['variant']=='after');data=bpy.data.cameras.new('Diffuse source comparison '+id);camera=bpy.data.objects.new(data.name,data);scene.collection.objects.link(camera);camera.matrix_world=C@matrix(capture['cameraWorld']);data.sensor_fit='VERTICAL';data.sensor_height=24;data.lens=12/math.tan(math.radians(25));data.clip_start=.05;data.clip_end=1800;scene.camera=camera;bpy.context.view_layer.update();P=camera.calc_matrix_camera(bpy.context.evaluated_depsgraph_get(),x=1664,y=936,scale_x=1,scale_y=1);V=camera.matrix_world.inverted()@C;P2=matrix(capture['projection']);V2=matrix(capture['viewMatrix']);errors=[]
 floor=int(id.split('-')[-1])
 for p in [[36.4,floor+.2,300],[34,floor+.3,300],[39,floor+1.8,301],[35,floor+2.7,301],[38,floor+.3,301]]:
  v=Vector((*p,1));x=P@V@v;y=P2@V2@v;errors.append(math.hypot((x.x/x.w-y.x/y.w)*832,(x.y/x.w-y.y/y.w)*468))
 assert max(errors)<.05,errors;file=E/('blender-'+id+'.png');scene.render.filepath=str(file);bpy.ops.render.render(write_still=True);report['captures'].append({'id':id,'file':str(file.relative_to(D)),'sha256':sha(file),'maximumProjectionErrorPixels':max(errors),'samples':32});(D/'V02_Diffuse_Lighting_Blender.json').write_text(json.dumps(report,indent=2)+'\n');print('RENDERED',id,flush=True)
report['status']='PASS three saved-source renders and native camera optics; full approved-reference quality unaccepted';(D/'V02_Diffuse_Lighting_Blender.json').write_text(json.dumps(report,indent=2)+'\n')
