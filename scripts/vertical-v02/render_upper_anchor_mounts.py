"""Saved-source views matching the current native human-scale fixtures.

Run only after automated browser/performance jobs finish. Source has no animated
hero; this verifies source authoring/optics, never native visual equivalence.
"""
import bpy,json,math,hashlib
from mathutils import Matrix,Vector
from pathlib import Path
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';E=D/'evidence/upper-anchor-mounts';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();read=lambda p:json.loads(p.read_text());a=read(D/'V02_Upper_Anchor_Authoring.json');n=read(D/'V02_Upper_Anchor_Native.json');b=read(D/'V02_Upper_Anchor_Build.json');assert n['status'].startswith('PASS')and n['entrySHA256']==b['entrySHA256']and n['manifestSHA256']==b['manifestSHA256'];assert sha(R/a['master'])==a['masterSHA256'];bpy.ops.wm.open_mainfile(filepath=str(R/a['master']));scene=bpy.context.scene
C=Matrix(((1,0,0,0),(0,0,-1,0),(0,1,0,0),(0,0,0,1)));matrix=lambda values:Matrix([values[i::4]for i in range(4)]);W=1664;H=936;scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=32;scene.cycles.use_denoising=True;scene.render.threads_mode='FIXED';scene.render.threads=8;scene.render.resolution_x=W;scene.render.resolution_y=H;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_depth='8'
report={'status':'FAIL','masterSHA256':a['masterSHA256'],'entrySHA256':b['entrySHA256'],'manifestSHA256':b['manifestSHA256'],'nativeReportSHA256':sha(D/'V02_Upper_Anchor_Native.json'),'captures':[],'scope':'Saved-source receiving bollards and matching native fixture optics. Animated hero and time-varying traffic are not matched; source/native shading and full approved-reference quality remain distinct gates.'}
for view in n['captures']:
 data=bpy.data.cameras.new(view['id']+'-native-comparison');camera=bpy.data.objects.new(data.name,data);scene.collection.objects.link(camera);camera.matrix_world=C@matrix(view['cameraWorld']);data.sensor_fit='VERTICAL';data.sensor_height=24;data.lens=12/math.tan(math.radians(view['fov']/2));data.clip_start=.05;data.clip_end=1800;scene.camera=camera;bpy.context.view_layer.update();P=camera.calc_matrix_camera(bpy.context.evaluated_depsgraph_get(),x=W,y=H,scale_x=1,scale_y=1);V=camera.matrix_world.inverted()@C;P2=matrix(view['projection']);V2=matrix(view['cameraWorld']).inverted();z=424 if view['id'].endswith('departure') else 400;errors=[]
 for point in [[65.2,128,z],[65.2,128.8,z],[66,128.9,z],[65.3,128.5,z-.3],[64,128.4,z]]:
  p=P@V@Vector((*point,1));q=P2@V2@Vector((*point,1));errors.append(math.hypot((p.x/p.w-q.x/q.w)*W/2,(p.y/p.w-q.y/q.w)*H/2))
 assert max(errors)<.05,(view['id'],errors);file=E/('blender-'+view['id']+'.png');scene.render.filepath=str(file);bpy.ops.render.render(write_still=True);report['captures'].append({'id':view['id'],'file':str(file.relative_to(D)),'sha256':sha(file),'samples':32,'maximumProjectionErrorPixels':max(errors)})
report['status']='PASS saved-source fixture renders and geometric optics; whole-district visual reference gate remains incomplete';(D/'V02_Upper_Anchor_Blender.json').write_text(json.dumps(report,indent=2)+'\n');print(report['status'])
