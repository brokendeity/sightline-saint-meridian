"""Independent saved-master parity and six-axis panorama orientation test."""
import bpy,json,hashlib,array,sys,gzip,struct,math
from pathlib import Path
from mathutils import Matrix
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';E=D/'evidence/material-response'
sys.path.insert(0,str(Path(__file__).parent));from v02_scene_signatures import signatures
read=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
c=read(R/'assets/city/vertical-v02/material-response/materials.json');selected={o['id']for o in c['owners']}
report={'status':'FAIL','masterSHA256':c['masterSHA256'],'sourceMasterSHA256':c['sourceMasterSHA256'],'contractSHA256':sha(R/'assets/city/vertical-v02/material-response/materials.json'),'validatorSHA256':sha(Path(__file__)),'checks':[],'scope':'Saved Blender geometry/material and HDR orientation/data checks; not native visual or full fidelity acceptance'}
def exact_mesh(o):
    m=o.data;raw=b''
    for prop,n,src in [('co',3,m.vertices),('normal',3,m.vertices)]:
        a=array.array('f',[0])*(len(src)*n);src.foreach_get(prop,a);raw+=a.tobytes()
    for uv in m.uv_layers:
        a=array.array('f',[0])*(len(uv.data)*2);uv.data.foreach_get('uv',a);raw+=a.tobytes()
    return hashlib.sha256(raw+json.dumps([(list(p.vertices),p.material_index)for p in m.polygons]).encode()).hexdigest()
assert sha(R/c['sourceMaster'])==c['sourceMasterSHA256'] and sha(R/c['master'])==c['masterSHA256']
bpy.ops.wm.open_mainfile(filepath=str(R/c['sourceMaster']));bpy.context.view_layer.update();before=signatures()
original={n:exact_mesh(bpy.data.objects[n])for n in selected}
locals_before={o.name:{'basis':[list(r)for r in o.matrix_basis],'parent':o.parent.name if o.parent else None}for o in bpy.data.objects}
bpy.ops.wm.open_mainfile(filepath=str(R/c['master']));bpy.context.view_layer.update();after=signatures()
assert all(after[n]==h for n,h in before.items()if n not in selected)
assert len(after)==len(before)+1
objects={o.name:o for o in bpy.data.objects}
for n in before:
    o=objects[n];assert locals_before[n]=={'basis':[list(r)for r in o.matrix_basis],'parent':o.parent.name if o.parent else None}
for o in c['owners']:
    obj=bpy.data.objects[o['id']];assert exact_mesh(obj)==original[o['id']]
    assert len(obj.data.materials)==len(o['palette'])
    for m,p in zip(obj.data.materials,o['palette']):
        b=m.node_tree.nodes.get('Principled BSDF');assert m.name==p['sourceMaterial']
        for key,value in [('Metallic',p['metalness']),('Roughness',p['roughness'])]:assert abs(b.inputs[key].default_value-value)<1e-6
        assert max(abs(x-y)for x,y in zip(b.inputs['Base Color'].default_value,p['color']))<1e-6
        assert max(abs(x-y)for x,y in zip(b.inputs['Emission Color'].default_value,p['emission']))<1e-6
report['checks'].append('All original source objects/locals/parents preserved; three controlled material bindings only; exact coordinates/normals/UV/indices/face assignments unchanged')
raw=gzip.decompress((R/c['environment']['url']).read_bytes());assert hashlib.sha256(raw).hexdigest()==c['environment']['rawSHA256']
values=struct.unpack('<'+'e'*(len(raw)//2),raw);assert all(math.isfinite(v)and v>=0 for v in values)
report['radiance']={'minimum':min(values),'maximum':max(values),'rawBytes':len(raw),'packedBytes':(R/c['environment']['url']).stat().st_size}
assert report['radiance']['maximum']>1,'Probe must retain scene-linear HDR values'
report['checks'].append('Probe raw bytes/hash/finite nonnegative scene-linear HDR values validated')

# A separate diagnostic scene: six original-coordinate cube faces have distinct
# emission colors. Read untonemapped pixels, so this tests projection and upload
# conventions without relying on the megacity image looking plausible.
scene=bpy.data.scenes.new('Six-axis panorama calibration');scene.world=bpy.data.worlds.new('Calibration black')
scene.render.engine='CYCLES';scene.cycles.samples=1;scene.cycles.use_denoising=False
scene.render.resolution_x=256;scene.render.resolution_y=128;scene.render.resolution_percentage=100
scene.render.threads_mode='FIXED';scene.render.threads=4
faces=[('+X',0,1,(1,0,0),(.5,.5)),('-X',0,-1,(0,1,1),(.01,.5)),('+Y',1,1,(0,1,0),(.5,.99)),('-Y',1,-1,(1,0,1),(.5,.01)),('+Z',2,1,(0,0,1),(.75,.5)),('-Z',2,-1,(1,1,0),(.25,.5))]
for name,axis,sign,color,uv in faces:
    axes=[i for i in range(3)if i!=axis];points=[]
    for a,b in [(-1,-1),(-1,1),(1,1),(1,-1)]:
        p=[0,0,0];p[axis]=sign*3;p[axes[0]]=a*3;p[axes[1]]=b*3;points.append((p[0],-p[2],p[1]))
    mesh=bpy.data.meshes.new('calibration '+name);mesh.from_pydata(points,[],[(0,1,2,3)]);obj=bpy.data.objects.new(mesh.name,mesh);scene.collection.objects.link(obj)
    m=bpy.data.materials.new(mesh.name);m.use_nodes=True;n=m.node_tree.nodes;n.clear();out=n.new('ShaderNodeOutputMaterial');emit=n.new('ShaderNodeEmission');emit.inputs['Color'].default_value=(*color,1);m.node_tree.links.new(emit.outputs[0],out.inputs['Surface']);mesh.materials.append(m)
data=bpy.data.cameras.new('calibration camera');data.type='PANO';data.panorama_type='EQUIRECTANGULAR'
camera=bpy.data.objects.new(data.name,data);scene.collection.objects.link(camera);camera.matrix_world=Matrix(((0,0,-1,0),(-1,0,0,0),(0,1,0,0),(0,0,0,1)));scene.camera=camera
scene.render.image_settings.file_format='OPEN_EXR';scene.render.image_settings.color_depth='16';file=E/'six-axis-calibration.exr';scene.render.filepath=str(file)
bpy.ops.render.render(write_still=True,scene=scene.name);img=bpy.data.images.load(str(file),check_existing=False);pixels=list(img.pixels);report['axisSamples']=[]
for name,axis,sign,color,uv in faces:
    x=min(255,int(uv[0]*256));y=min(127,int(uv[1]*128));sample=pixels[(y*256+x)*4:(y*256+x)*4+3]
    row={'direction':name,'uv':uv,'expected':color,'actual':sample};report['axisSamples'].append(row)
    assert max(abs(x-y)for x,y in zip(sample,color))<.005,row
report['checks'].append('Six-axis source panorama matches Three.js equirectangular +X/+Z/+Y and bottom-first RGBA orientation')
report['status']='PASS saved-source parity, PBR contract and six-axis HDR probe calibration'
(D/'V02_Material_Response_Validation.json').write_text(json.dumps(report,indent=2)+'\n');print(report['status'],flush=True)
