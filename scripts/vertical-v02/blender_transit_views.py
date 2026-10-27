"""Fork the saved architecture master and add the two runtime camera bookmarks.
All source objects/data remain unchanged. Cameras are authored compositions,
not calibrated cameras recovered from the supplied reference art.
"""
import bpy,json,hashlib,math,array
from pathlib import Path
from mathutils import Matrix,Vector
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();read=lambda p:json.loads(p.read_text())
source=read(D/'V02_Coffered_Authoring.json');master=R/source['master'];assert sha(master)==source['masterSHA256']
contract=read(R/'assets/city/vertical-v02/reference_views.json');bpy.ops.wm.open_mainfile(filepath=str(master));bpy.context.view_layer.update()
def fingerprint(o):
 data={'type':o.type,'matrix':[list(row)for row in o.matrix_world],'properties':dict(o.items())}
 raw=b''
 if o.type=='MESH':
  a=array.array('f',[0])*(len(o.data.vertices)*3);o.data.vertices.foreach_get('co',a);raw+=a.tobytes()
  for layer in o.data.uv_layers:
   a=array.array('f',[0])*(len(layer.data)*2);layer.data.foreach_get('uv',a);raw+=a.tobytes()
  data.update(faces=[(list(p.vertices),p.material_index)for p in o.data.polygons],materials=[m.name if m else None for m in o.data.materials])
 return hashlib.sha256(raw+json.dumps(data,sort_keys=True,default=str).encode()).hexdigest()
before={o.name:fingerprint(o)for o in bpy.data.objects};C=Matrix(((1,0,0,0),(0,0,-1,0),(0,1,0,0),(0,0,0,1)));collection=bpy.data.collections['SM_V02_CAMERA_BOOKMARKS'];scene=bpy.context.scene;results=[]
for v in contract['views']:
 name='V02-transit-camera-'+v['id'];assert name not in bpy.data.objects
 data=bpy.data.cameras.new(name);o=bpy.data.objects.new(name,data);collection.objects.link(o)
 position=C@Vector((*v['position'],1));look=C@Vector((*v['look'],1));o.location=position.xyz;o.rotation_euler=(look.xyz-position.xyz).to_track_quat('-Z','Y').to_euler()
 data.type='PERSP';data.sensor_fit='VERTICAL';data.sensor_height=24;data.lens=12/math.tan(math.radians(contract['verticalFOVDegrees']/2));data.clip_start=contract['near'];data.clip_end=contract['far'];o['viewContract']='assets/city/vertical-v02/reference_views.json';o['viewContractSHA256']=sha(R/'assets/city/vertical-v02/reference_views.json');o['role']=v['role'];results.append({'id':v['id'],'object':name,'positionGame':v['position'],'lookGame':v['look']})
scene.render.resolution_x=contract['width'];scene.render.resolution_y=contract['height'];scene.render.resolution_percentage=100;scene.camera=bpy.data.objects['V02-transit-camera-A'];bpy.context.view_layer.update();assert all(fingerprint(bpy.data.objects[n])==f for n,f in before.items())
target=D/'blender/SaintMeridian_V02_Transit_Views.blend';bpy.ops.wm.save_as_mainfile(filepath=str(target));assert sha(master)==source['masterSHA256'];bpy.ops.wm.open_mainfile(filepath=str(target));bpy.context.view_layer.update();assert all(fingerprint(bpy.data.objects[n])==f for n,f in before.items())
report={'status':'PASS saved-source camera fork; paired native rendering pending','sourceMaster':str(master.relative_to(R)),'sourceMasterSHA256':sha(master),'master':str(target.relative_to(R)),'masterSHA256':sha(target),'contractSHA256':sha(R/'assets/city/vertical-v02/reference_views.json'),'authoringScriptSHA256':sha(Path(__file__)),'unchangedSourceObjects':len(before),'addedCameras':results,'scope':'Only two camera objects and scene render-resolution/active-camera settings added. Original mesh vertices/UV/polygon material binding/transforms/custom properties and all source object transforms unchanged. No runtime geometry re-export.'}
(D/'V02_Views_Authoring.json').write_text(json.dumps(report,indent=2)+'\n');print(report['status'],len(before))
