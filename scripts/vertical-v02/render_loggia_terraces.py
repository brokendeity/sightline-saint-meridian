"""Saved-source material renders using actual current browser camera matrices."""
import bpy,json,hashlib,math
from pathlib import Path
from mathutils import Matrix,Vector
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';E=D/'evidence/loggia-terraces'
read=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
a=read(D/'V02_Loggia_Terraces_Authoring.json');n=read(D/'V02_Loggia_Terraces_Native.json');assert n['status'].startswith('PASS')
assert sha(R/a['master'])==a['masterSHA256'];bpy.ops.wm.open_mainfile(filepath=str(R/a['master']));scene=bpy.context.scene
C=Matrix(((1,0,0,0),(0,0,-1,0),(0,1,0,0),(0,0,0,1)));matrix=lambda a:Matrix([a[i::4]for i in range(4)])
scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=16;scene.cycles.use_denoising=True
scene.render.threads_mode='FIXED';scene.render.threads=8;scene.render.resolution_x=1664;scene.render.resolution_y=936;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_depth='8'
report={'status':'FAIL','masterSHA256':a['masterSHA256'],'nativeReportSHA256':sha(D/'V02_Loggia_Terraces_Native.json'),'captures':[],'scope':'Saved-source material response and actual native optics only; browser/source shading equality and full reference quality remain unaccepted'}
for id in ['A','B','L']:
    capture=next(c for c in n['captures']if c['id']==id and c['variant']=='after')
    data=bpy.data.cameras.new('Material source comparison '+id);camera=bpy.data.objects.new(data.name,data);scene.collection.objects.link(camera)
    camera.matrix_world=C@matrix(capture['cameraWorld']);data.sensor_fit='VERTICAL';data.sensor_height=24;data.lens=12/math.tan(math.radians(25));data.clip_start=.05;data.clip_end=1800;scene.camera=camera;bpy.context.view_layer.update()
    P=camera.calc_matrix_camera(bpy.context.evaluated_depsgraph_get(),x=1664,y=936,scale_x=1,scale_y=1);V=camera.matrix_world.inverted()@C;P2=matrix(capture['projection']);V2=matrix(capture['viewMatrix']);errors=[]
    for p in [[76,100,300],[72,24,360],[80,128,420],[80,0,300],[60,70,320]]:
        v=Vector((*p,1));x=P@V@v;y=P2@V2@v;errors.append(math.hypot((x.x/x.w-y.x/y.w)*832,(x.y/x.w-y.y/y.w)*468))
    assert max(errors)<.05
    file=E/('blender-'+id+'.png');scene.render.filepath=str(file);bpy.ops.render.render(write_still=True)
    report['captures'].append({'id':id,'file':str(file.relative_to(D)),'sha256':sha(file),'maximumProjectionErrorPixels':max(errors),'samples':16})
report['status']='PASS saved-source A/B renders and matched native optics; visual reference gate still open'
(D/'V02_Loggia_Terraces_Blender.json').write_text(json.dumps(report,indent=2)+'\n');print(report['status'],flush=True)
