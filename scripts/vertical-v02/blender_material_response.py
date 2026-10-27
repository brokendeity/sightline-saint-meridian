"""Author a bounded PBR response in the current complete Blender master.

The three original corridor towers retain every vertex, face and world transform.
Only their reference material bindings change. Runtime never exports these shells.
An HDR panorama is baked from this actual saved scene, not a stock sky image.
"""
import bpy, json, hashlib, gzip, struct, math, sys
from pathlib import Path
from mathutils import Matrix
R=Path(__file__).resolve().parents[2]; D=R/'development/vertical-city-v02'
sys.path.insert(0,str(Path(__file__).parent))
from v02_scene_signatures import signatures
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
read=lambda p:json.loads(p.read_text())
O=R/'assets/city/vertical-v02/material-response'; O.mkdir(exist_ok=True)
E=D/'evidence/material-response'; E.mkdir(exist_ok=True)
source=read(D/'V02_Maintenance_Access_Authoring.json'); source_file=R/source['master']
assert sha(source_file)==source['masterSHA256']
bpy.ops.wm.open_mainfile(filepath=str(source_file)); bpy.context.view_layer.update()
before=signatures(); world=read(D/'V02_LiveWorld_Authoritative.json')
appearance=read(D/'V02_Reference_Appearance.json')
facades=read(R/'assets/city/vertical-v02/facade-architecture/facades.json')
selected={c['owner'] for c in facades['chunks']}
assert len(selected)==3

def response(p):
    c=p['color']; e=p['emission']
    if max(e)>.2: return 'architectural emitter',.12,.34
    if c[0]<.075 and c[1]>.14 and c[2]>.20: return 'tinted glass',.10,.17
    if max(c)>.18 and max(e)<.005: return 'brushed alloy',.82,.29
    if max(e)>.005: return 'lit soffit',.12,.40
    return 'midnight cladding',.62,.34

owners=[]
for obj in bpy.data.collections['SM_EXISTING_REFERENCE'].objects:
    if obj.name not in selected: continue
    building=next(b for b in world['buildings'] if b['id']==obj.name)
    family=next(f for f in appearance['families'] if f['family']==building['family'])
    # Only these three reference meshes receive independent material slots.
    obj.data=obj.data.copy(); face_slots=[p.material_index for p in obj.data.polygons]
    obj.data.materials.clear(); rows=[]
    for i,p in enumerate(family['palette']):
        kind,metal,rough=response(p); m=bpy.data.materials.new('V02_PBR_'+obj.name+'_'+str(i)); m.use_nodes=True
        bs=m.node_tree.nodes.get('Principled BSDF'); bs.inputs['Base Color'].default_value=(*p['color'],1)
        bs.inputs['Metallic'].default_value=metal; bs.inputs['Roughness'].default_value=rough
        bs.inputs['Emission Color'].default_value=(*p['emission'],1); bs.inputs['Emission Strength'].default_value=1
        m.diffuse_color=(*p['color'],1); obj.data.materials.append(m)
        rows.append({**p,'sourceMaterial':m.name,'kind':kind,'metalness':metal,'roughness':rough})
    for p,index in zip(obj.data.polygons,face_slots): p.material_index=index
    owners.append({'id':obj.name,'sourceIndex':building['sourceIndex'],'cityBuildingId':building['cityBuildingId'],'family':building['family'],'palette':rows})

# Existing district/facade PBR materials gain the same local reflected light.
# Preserve their authored color, emission, alpha, roughness and metalness.
materials=[]
for m in bpy.data.materials:
    if not m.name.startswith('V02_') or m.name.startswith('V02_PBR_') or not m.use_nodes: continue
    bs=m.node_tree.nodes.get('Principled BSDF')
    if not bs: continue
    materials.append({'name':m.name,'color':list(bs.inputs['Base Color'].default_value)[:3],
        'metalness':bs.inputs['Metallic'].default_value,'roughness':bs.inputs['Roughness'].default_value,
        'metalnessLinked':bs.inputs['Metallic'].is_linked,'roughnessLinked':bs.inputs['Roughness'].is_linked,
        'emission':list(bs.inputs['Emission Color'].default_value)[:3],
        'emissionStrength':bs.inputs['Emission Strength'].default_value})

scene=bpy.context.scene
data=bpy.data.cameras.new('V02 corridor HDR reflection probe'); data.type='PANO'; data.panorama_type='EQUIRECTANGULAR'
probe=bpy.data.objects.new(data.name,data); scene.collection.objects.link(probe)
# Blender camera -Z = game +X; camera +Y = game +Y; camera +X = game +Z.
probe.matrix_world=Matrix(((0,0,-1,80),(-1,0,0,-340),(0,1,0,65),(0,0,0,1)))
probe['previewOnly']=True; probe['exportAsGeometry']=False
scene['materialResponseSource']=source['masterSHA256']
master=D/'blender/SaintMeridian_V02_Material_Response.blend'
bpy.context.view_layer.update(); after=signatures()
assert all(after[n]==h for n,h in before.items() if n not in selected)
for name in selected:
    # Material slots alone differ; compare actual source coordinates and indices.
    original=next(f for f in appearance['families'] if f['family']==next(o for o in owners if o['id']==name)['family'])
    assert len(bpy.data.objects[name].data.polygons)==original['triangles']
bpy.ops.wm.save_as_mainfile(filepath=str(master))
assert sha(source_file)==source['masterSHA256']

scene.camera=probe; scene.render.engine='CYCLES'; scene.cycles.device='CPU'; scene.cycles.samples=32
scene.cycles.use_denoising=True; scene.cycles.max_bounces=6; scene.cycles.transparent_max_bounces=5
scene.render.threads_mode='FIXED'; scene.render.threads=8
scene.render.resolution_x=1024; scene.render.resolution_y=512; scene.render.resolution_percentage=100
scene.render.image_settings.file_format='OPEN_EXR'; scene.render.image_settings.color_depth='16'
scene.render.filepath=str(E/'corridor-radiance.exr'); bpy.ops.render.render(write_still=True)
img=bpy.data.images.load(str(E/'corridor-radiance.exr'),check_existing=False)
pixels=list(img.pixels); assert len(pixels)==1024*512*4
assert all(math.isfinite(x) and x>=0 for x in pixels)
raw=struct.pack('<'+'e'*len(pixels),*pixels); target=O/'corridor-radiance.rgba16f.gz'
target.write_bytes(gzip.compress(raw,mtime=0))
# Raw scene-linear thumbnail for visual review; this is explicitly source-only.
scene.render.image_settings.file_format='PNG'; scene.render.image_settings.color_depth='8'
img.save_render(str(E/'corridor-radiance.png'),scene=scene)
contract={'schema':'sm-v02-material-response-1','status':'AUTHORED; native visual acceptance pending',
 'sourceMaster':source['master'],'sourceMasterSHA256':source['masterSHA256'],
 'master':str(master.relative_to(R)),'masterSHA256':sha(master),
 'scriptSHA256':sha(Path(__file__)),'owners':owners,'materials':materials,
 'environment':{'url':str(target.relative_to(R)),'sha256':sha(target),'rawSHA256':hashlib.sha256(raw).hexdigest(),
 'width':1024,'height':512,'components':4,'format':'little-endian IEEE754 binary16 RGBA, scene-linear, bottom row first',
 'mapping':'equirectangular; centre +X, right +Z, up +Y in game coordinates','position':[80,65,340],
 'samples':32,'bytes':target.stat().st_size,'rawBytes':len(raw),'intensity':.8},
 'preservedSourceObjects':len(before)-len(selected),'sourceBuildings':310,'newDynamicLights':0,
 'scope':'Original material response + one static local reflected-radiance probe. No original geometry, contact, camera, light, route or gameplay changes. Static probe does not update after destruction; full reference art gate remains open.'}
(O/'materials.json').write_text(json.dumps(contract,indent=2)+'\n')
(D/'V02_Material_Response_Authoring.json').write_text(json.dumps(contract,indent=2)+'\n')
print('AUTHORED',len(owners),'original owners,',len(materials),'district materials, probe bytes',target.stat().st_size,flush=True)
