"""Saved Blender master A/B and actual native station-camera source renders."""
import bpy,json,math,hashlib
from mathutils import Matrix,Vector
from pathlib import Path
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';E=D/'evidence/station-pavilion';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();read=lambda p:json.loads(p.read_text());author=read(D/'V02_Station_Pavilion_Authoring.json');native=read(D/'V02_Station_Pavilion_Native.json');assert native['status'].startswith('PASS');master=R/author['master'];assert sha(master)==author['masterSHA256'];bpy.ops.wm.open_mainfile(filepath=str(master));scene=bpy.context.scene
C=Matrix(((1,0,0,0),(0,0,-1,0),(0,1,0,0),(0,0,0,1)));matrix=lambda a:Matrix([a[i::4]for i in range(4)]);W=1664;H=936
scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=16;scene.cycles.use_denoising=True;scene.render.threads_mode='FIXED';scene.render.threads=8;scene.render.resolution_x=W;scene.render.resolution_y=H;scene.render.resolution_percentage=100
report={'status':'FAIL','masterSHA256':sha(master),'nativeReportSHA256':sha(D/'V02_Station_Pavilion_Native.json'),'captures':[],'scope':'Actual saved-source renders and geometric optics; not native/Blender shading equivalence or full approved-reference quality'}
for id in ['A','B','S']:
 n=next(c for c in native['captures']if c['id']==id and c['variant']=='after')
 if id=='S':
  data=bpy.data.cameras.new('Station-native-comparison');camera=bpy.data.objects.new(data.name,data);scene.collection.objects.link(camera);camera.matrix_world=C@matrix(n['cameraWorld']);data.sensor_fit='VERTICAL';data.sensor_height=24;data.lens=12/math.tan(math.radians(n['fov']/2));data.clip_start=.05;data.clip_end=1800;bpy.context.view_layer.update()
 else:camera=bpy.data.objects['V02-transit-camera-'+id]
 scene.camera=camera;P=camera.calc_matrix_camera(bpy.context.evaluated_depsgraph_get(),x=W,y=H,scale_x=1,scale_y=1);V=camera.matrix_world.inverted()@C;P2=matrix(n['projection']);V2=matrix(n['viewMatrix']);errors=[]
 for p in [[76,100,300],[72,24,360],[80,128,420],[80,0,300],[60,70,320]]:
  a=P@V@Vector((*p,1));b=P2@V2@Vector((*p,1));errors.append(math.hypot((a.x/a.w-b.x/b.w)*W/2,(a.y/a.w-b.y/b.w)*H/2))
 assert max(errors)<.05,(id,errors)
 file=E/('blender-'+id+'.png');scene.render.filepath=str(file);bpy.ops.render.render(write_still=True);report['captures'].append({'id':id,'file':str(file.relative_to(D)),'sha256':sha(file),'maximumProjectionErrorPixels':max(errors),'samples':16})
report['status']='PASS saved-source A/B/S renders and projection only; full reference quality remains unaccepted';(D/'V02_Station_Pavilion_Blender.json').write_text(json.dumps(report,indent=2)+'\n');print(report['status'])
