"""Actual saved-source render, with native projection agreement kept separate
from visual fidelity. Scene shading/animated world state may differ by engine.
"""
import bpy,json,hashlib,math
from mathutils import Matrix,Vector
from pathlib import Path
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';E=D/'evidence/public-terraces';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();read=lambda p:json.loads(p.read_text())
source=read(D/'V02_Public_Terrace_Authoring.json');native=read(D/'V02_Public_Terrace_Native.json');views=read(R/'assets/city/vertical-v02/reference_views.json');assert native['status'].startswith('PASS')and not native.get('failure');assert sha(R/native['entry'])==native['entrySHA256'];master=R/source['master'];assert sha(master)==source['masterSHA256'];bpy.ops.wm.open_mainfile(filepath=str(master));scene=bpy.context.scene;C=Matrix(((1,0,0,0),(0,0,-1,0),(0,1,0,0),(0,0,0,1)));matrix=lambda a:Matrix([a[i::4]for i in range(4)])
result={'status':'FAIL','masterSHA256':sha(master),'nativeReportSHA256':sha(D/'V02_Public_Terrace_Native.json'),'contractSHA256':sha(R/'assets/city/vertical-v02/reference_views.json'),'captures':[],'scope':'Saved-source Cycles16sample renders and geometric projection only. Not full visual-reference acceptance; toon/ACES vs Principled/AgX shading and animated world presentation remain separate.'}
scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=16;scene.cycles.use_denoising=True;scene.render.threads_mode='FIXED';scene.render.threads=8;scene.render.resolution_x=views['width'];scene.render.resolution_y=views['height'];scene.render.resolution_percentage=100
for v in views['views']+[{'id':'E'}]:

 if v['id']=='E':
  data=bpy.data.cameras.new('Terrace-interior-inspection');camera=bpy.data.objects.new(data.name,data);scene.collection.objects.link(camera);camera.location=(48,-292,55.2);camera.rotation_euler=(Vector((37,-302.5,54.0))-camera.location).to_track_quat('-Z','Y').to_euler();data.sensor_fit='VERTICAL';data.sensor_height=24;data.lens=12/math.tan(math.radians(25));data.clip_start=.05;data.clip_end=1800;bpy.context.view_layer.update()
 else:camera=bpy.data.objects['V02-transit-camera-'+v['id']]
 scene.camera=camera;n=next(c for c in native['captures']if c['id']==v['id']and c['variant']=='after');P=camera.calc_matrix_camera(bpy.context.evaluated_depsgraph_get(),x=views['width'],y=views['height'],scale_x=1,scale_y=1);V=camera.matrix_world.inverted()@C;P2=matrix(n['projection']);V2=matrix(n['viewMatrix']);errors=[]
 for p in [[76,100,300],[72,24,360],[80,128,420],[80,0,300],[60,70,320]]:
  a=P@V@Vector((*p,1));b=P2@V2@Vector((*p,1));errors.append(math.hypot((a.x/a.w-b.x/b.w)*views['width']/2,(a.y/a.w-b.y/b.w)*views['height']/2))
 assert max(errors)<.05,errors
 file=E/('blender-'+v['id']+'.png');scene.render.filepath=str(file);bpy.ops.render.render(write_still=True);result['captures'].append({'id':v['id'],'file':str(file.relative_to(D)),'sha256':sha(file),'maximumLandmarkProjectionErrorPixels':max(errors),'samples':16})
result['status']='PASS paired source renders and projection; full reference quality remains unaccepted';(D/'V02_Public_Terrace_Blender.json').write_text(json.dumps(result,indent=2)+'\n');print(result['status'])
