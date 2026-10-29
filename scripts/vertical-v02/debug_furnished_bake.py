"""Current furnished-room UV2, fixture-only atlases and matching reflection probes.
Derived from the independently validated prior bake workflow. Current source
includes flared bridges, real seating and graph-backed public route boards.

The room source remains immutable. UV2, packed local-emitter atlases and a new96-strength ceiling-fixture material
are added in a separate master. All original materials and global lights are
restored before source save; geometry, base UV, contacts and actors are unchanged.
"""
import ast
import gzip
import hashlib
import json
import math
import struct
import sys
import time
from array import array
from pathlib import Path

import bpy
from mathutils import Matrix

ROOT = Path(__file__).resolve().parents[2]
DEV = ROOT / 'development/vertical-city-v02'
OUT = ROOT / 'assets/city/vertical-v02/furnished-public-rooms'
EVIDENCE = DEV / 'evidence/furnished-public-rooms'
OUT.mkdir(exist_ok=True)
EVIDENCE.mkdir(exist_ok=True)
sys.path.insert(0,str(Path(__file__).parent))
from v02_saved_scene_snapshots import signatures,source_props

sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
read = lambda p: json.loads(p.read_text())
author = read(DEV/'V02_Furnished_Public_Rooms_Authoring.json')
assert author['status'].startswith('PASS')
source = ROOT/author['master']
assert sha(source) == author['masterSHA256']
start = time.monotonic()
report = {'status':'RUNNING source room lighting','sourceMaster':author['master'],
          'sourceMasterSHA256':sha(source),'scriptSHA256':sha(Path(__file__)),
          'savedSceneSnapshotSHA256':sha(Path(__file__).with_name('v02_saved_scene_snapshots.py')),
          'stages':[],'rooms':[],'exports':[],'newDynamicLights':0,
          'scope':__doc__.strip()}
report_file = DEV/'V02_Furnished_Public_Lighting_Authoring.json'


def save():
    report_file.write_text(json.dumps(report,indent=2)+'\n')


def stage(name, **details):
    report['stage'] = name
    report['stages'].append({'name':name,'wallSeconds':time.monotonic()-start,**details})
    save()
    print(name,details,flush=True)


def geometry_base_uv(obj):
    h = hashlib.sha256()
    for v in obj.data.vertices:
        h.update(struct.pack('<3f',*v.co))
    for p in obj.data.polygons:
        h.update(struct.pack('<II',len(p.vertices),p.material_index))
        h.update(struct.pack('<'+'I'*len(p.vertices),*p.vertices))
    for uv in obj.data.uv_layers[0].data:
        h.update(struct.pack('<2f',*uv.uv))
    h.update(json.dumps(['V02_east_loggia_luminaire' if m.name=='V02_east_loggia_luminaire_v2' else m.name for m in obj.data.materials]).encode())
    return h.hexdigest()


def image_pixels(image):
    result = array('f',[0]) * len(image.pixels)
    image.pixels.foreach_get(result)
    assert all(math.isfinite(x) and x >= 0 for x in result)
    return result


def rgba16f(values,width,height,top_first):
    rows = reversed(range(height)) if top_first else range(height)
    return b''.join(struct.pack('<'+'e'*(width*4),*values[y*width*4:(y+1)*width*4]) for y in rows)


try:
    bpy.ops.wm.open_mainfile(filepath=str(source))
    bpy.context.view_layer.update()
    before = signatures()
    helper = Path(__file__).with_name('validate_upper_anchor_master.py')
    defs = [n for n in ast.parse(helper.read_text()).body
            if isinstance(n,ast.FunctionDef) and n.name in ['props','value','materials','packed']]
    assert len(defs) == 4
    exec(compile(ast.Module(body=defs,type_ignores=[]),str(helper),'exec'),globals())
    props=source_props
    old_props, old_materials, old_packed = props(), materials(), packed()
    old_lights = sorted(o.name for o in bpy.data.objects if o.type == 'LIGHT')
    room_ids = {floor:next(c['recordIDs'] for c in author['exports']
                          if c['id']==f'east-public-room-{floor}') for floor in [24,52,84]}
    allowed = {stable_id for ids in room_ids.values() for stable_id in ids}
    allowed.update(f'east-public-room-{floor}::{stable_id}'
                   for floor,ids in room_ids.items() for stable_id in ids)
    allowed.update(f'east-public-room-{floor}' for floor in room_ids)
    base_uv_signatures = {name:geometry_base_uv(bpy.data.objects[name])
                          for ids in room_ids.values() for name in ids}
    # The current source already owns the six physical96-strength fixtures.
    # Reuse their unmodified material; boards are diffuse printed surfaces.
    lamp=bpy.data.materials['V02_east_loggia_luminaire_v2']
    assert lamp.node_tree.nodes.get('Principled BSDF').inputs['Emission Strength'].default_value==96
    report['luminaire']={'material':lamp.name,'emissionColor':[.8,.42,.14],'emissionStrength':96,
        'previousStrength':96,'physicalFixtureIDs':[stable_id for ids in room_ids.values() for stable_id in ids if 'warm-ceiling' in stable_id]}
    assert len(report['luminaire']['physicalFixtureIDs'])==6
    scene = bpy.context.scene
    original_world=scene.world
    black_world=bpy.data.worlds.new('V02 temporary isolated emitter bake')
    black_world.use_nodes=True
    black_world.node_tree.nodes.get('Background').inputs['Strength'].default_value=0
    scene.world=black_world
    light_visibility={o.name:o.hide_render for o in bpy.data.objects if o.type=='LIGHT'}
    for name in light_visibility:
        bpy.data.objects[name].hide_render=True
    emission_restore=[]
    for material in bpy.data.materials:
        if material==lamp or not material.use_nodes:
            continue
        for node in material.node_tree.nodes:
            socket=(node.inputs.get('Emission Strength') if node.type=='BSDF_PRINCIPLED'
                    else node.inputs.get('Strength') if node.type=='EMISSION' else None)
            if socket is None:
                continue
            links=[link.from_socket for link in material.node_tree.links if link.to_socket==socket]
            emission_restore.append((material,socket,socket.default_value,links))
            for link in list(material.node_tree.links):
                if link.to_socket==socket:
                    material.node_tree.links.remove(link)
            socket.default_value=0
    report['bakeScope']='Only the six new room fixtures: full direct+indirect diffuse. Sun, sky, old emitters and global lights are excluded from these atlases.'
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = 8
    scene.cycles.use_denoising = False
    scene.cycles.max_bounces = 6
    scene.cycles.transparent_max_bounces = 5
    scene.render.threads_mode = 'FIXED'
    scene.render.threads = 8
    scene.render.bake.use_pass_direct = True
    scene.render.bake.use_pass_indirect = True
    scene.render.bake.use_pass_color = False
    scene.render.bake.use_selected_to_active = False
    for floor,ids in room_ids.items():
        objects = [bpy.data.objects[name] for name in ids]
        bpy.ops.object.select_all(action='DESELECT')
        for obj in objects:
            assert obj.type=='MESH' and len(obj.data.uv_layers)>=1
            while len(obj.data.uv_layers)>1:obj.data.uv_layers.remove(obj.data.uv_layers[-1])
            obj.data.uv_layers.new(name='V02_East_Diffuse')
            obj.data.uv_layers.active_index=1
            obj.data.uv_layers[0].active_render=True
            obj.select_set(True)
        bpy.context.view_layer.objects.active=objects[0]
        bpy.ops.object.mode_set(mode='EDIT')
        bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.uv.smart_project(angle_limit=math.radians(66),margin_method='FRACTION',
                                 island_margin=8/512,correct_aspect=True,scale_to_bounds=True)
        bpy.ops.object.mode_set(mode='OBJECT')
        for obj in objects:
            assert geometry_base_uv(obj)==base_uv_signatures[obj.name]
            assert all(math.isfinite(x) and -.00001<=x<=1.00001
                       for uv in obj.data.uv_layers[1].data for x in uv.uv)
            obj.data.uv_layers.active_index=0
            obj.data.uv_layers[0].active_render=True
        width=height=512
        image=bpy.data.images.new(f'V02 east room {floor} diffuse bake',width=width,height=height,
                                  alpha=True,float_buffer=True)
        image.colorspace_settings.name='Non-Color'
        clones={}
        original_slots={obj.name:list(obj.data.materials) for obj in objects}
        for original in {m for obj in objects for m in obj.data.materials}:
            clone=original.copy()
            clone.name=original.name+f'__EastBake{floor}'
            for node in clone.node_tree.nodes:
                node.select=False
            target=clone.node_tree.nodes.new('ShaderNodeTexImage')
            target.name='Source diffuse bake target'
            target.image=image
            target.select=True
            clone.node_tree.nodes.active=target
            clones[original.name]=clone
        for obj in objects:
            for i,material in enumerate(original_slots[obj.name]):
                obj.data.materials[i]=clones[material.name]
        scene.cycles.seed=731+floor
        stage('baking isolated new-fixture diffuse',floor=floor,resolution=[width,height],samples=512,
              sourceObjects=len(objects),temporaryGlobalLightingIsolation=True)
        print('BAKE_DIAGNOSTIC',[(o.name,o.select_get(),[(uv.name,len(uv.data),sum(float(c.uv.length) for c in uv.data))for uv in o.data.uv_layers])for o in objects],flush=True)
        bpy.ops.object.bake(type='DIFFUSE',pass_filter={'DIRECT','INDIRECT'},
                            use_clear=True,margin=4,uv_layer='V02_East_Diffuse')
        raw_debug=image_pixels(image)
        print('BAKE_IMAGE',image.name,max(raw_debug),sum(raw_debug[i+3]>.99 for i in range(0,len(raw_debug),4)),flush=True)
        bpy.ops.wm.save_as_mainfile(filepath=str(DEV/'evidence/furnished-public-lighting-first-atlas/debug-post-bake.blend'))
        raise RuntimeError('Controlled diagnostic stop after first8sample bake; not an acceptance result')
        for obj in objects:
            for i,material in enumerate(original_slots[obj.name]):
                obj.data.materials[i]=material
        values=image_pixels(image)
        exr=EVIDENCE/f'room-{floor}-diffuse.exr'
        scene.render.image_settings.file_format='OPEN_EXR'
        scene.render.image_settings.color_depth='16'
        image.save_render(str(exr),scene=scene)
        # Pack the EXR file itself. A generated-image PNG packing fallback would
        # discard scene-linear HDR information and must not enter the source.
        canonical=bpy.data.images.load(str(exr),check_existing=False)
        canonical.name=f'V02 east room {floor} source diffuse atlas'
        canonical.colorspace_settings.name='Non-Color'
        canonical.use_fake_user=True
        canonical.pack()
        values=image_pixels(canonical)
        raw=rgba16f(values,width,height,True)
        archive=OUT/f'room-{floor}-diffuse.rgba16f.gz'
        archive.write_bytes(gzip.compress(raw,mtime=0))
        covered=sum(values[i+3]>.99 for i in range(0,len(values),4))
        lit=sum(max(values[i:i+3])>1e-5 for i in range(0,len(values),4))
        assert covered>20000 and lit>covered*.02
        scene.render.image_settings.file_format='PNG'
        scene.render.image_settings.color_depth='8'
        canonical.save_render(str(EVIDENCE/f'room-{floor}-diffuse-preview.png'),scene=scene)
        atlas={'url':str(archive.relative_to(ROOT)),'sha256':sha(archive),
               'rawSHA256':hashlib.sha256(raw).hexdigest(),'rawBytes':len(raw),
               'bytes':archive.stat().st_size,'width':width,'height':height,'sourceImage':canonical.name,
               'sourceEXR':str(exr.relative_to(ROOT)),'sourceEXRSHA256':sha(exr),
               'samples':512,'coveredPixels':covered,'litPixels':lit,
               'maxRGB':max(values[i+k] for i in range(0,len(values),4) for k in range(3)),
               'format':'scene-linear uncolored new-fixture direct+indirect diffuse only, little-endian RGBA16F, top row first',
               'uv':'glTF TEXCOORD_1 with texture.flipY=false'}
        bpy.data.objects[f'east-public-room-{floor}']['sourceDiffuseImage']=canonical.name
        report['rooms'].append({'floor':floor,'chunk':f'east-public-room-{floor}',
                                'sourceIDs':ids,'atlas':atlas})
        for clone in clones.values():
            bpy.data.materials.remove(clone)
        bpy.data.images.remove(image)
        stage('source diffuse atlas packed',floor=floor,coveredPixels=covered,litPixels=lit)

    # Restore the complete source scene before exporting or saving it. Room
    # reflections are then rendered from the full scene with the new fixtures.
    for material,socket,emission_strength,links in emission_restore:
        socket.default_value=emission_strength
        for source_socket in links:
            material.node_tree.links.new(source_socket,socket)
    for name,flag in light_visibility.items():
        bpy.data.objects[name].hide_render=flag
    scene.world=original_world
    bpy.data.worlds.remove(black_world)
    report['globalLightingRestored']=True
    # Export UV2 from the exact same local source meshes and saved TRS already
    # validated for the room source. UV0 remains the tangent/normal-map basis.
    collection=bpy.data.collections['SM_V02_EAST_LOGGIA_EXPORT']
    collection_flags=(collection.hide_render,collection.hide_viewport)
    collection.hide_render=collection.hide_viewport=False
    restore=[]
    used={m for ids in room_ids.values() for stable_id in ids
          for m in bpy.data.objects[stable_id].data.materials}
    for material in used:
        output=material.node_tree.nodes.get('Material Output')
        prior=next((l.from_socket for l in material.node_tree.links
                    if l.to_socket==output.inputs['Surface']),None)
        if prior:
            restore.append((material,output,prior))
            material.node_tree.links.new(material.node_tree.nodes.get('Principled BSDF').outputs['BSDF'],
                                          output.inputs['Surface'])
    for room in report['rooms']:
        name=room['chunk']
        bpy.ops.object.select_all(action='DESELECT')
        root=bpy.data.objects[name]
        root.select_set(True)
        for child in root.children:
            child.data.uv_layers.active_index=0
            child.data.uv_layers[0].active_render=True
            child.select_set(True)
        bpy.context.view_layer.objects.active=root
        bpy.context.view_layer.update()
        file=OUT/(name+'-uv2.glb')
        bpy.ops.export_scene.gltf(filepath=str(file),export_format='GLB',use_selection=True,
                                  export_yup=True,export_extras=True,export_tangents=True,export_texcoords=True)
        blob=file.read_bytes()
        gltf=json.loads(blob[20:20+struct.unpack_from('<I',blob,12)[0]])
        primitives=[p for m in gltf['meshes'] for p in m['primitives']]
        assert primitives and all('TEXCOORD_1' in p['attributes'] for p in primitives)
        report['exports'].append({'id':name,'url':str(file.relative_to(ROOT)),
                                  'sha256':sha(file),'bytes':len(blob),'primitives':len(primitives)})
    for material,output,socket in restore:
        material.node_tree.links.new(socket,output.inputs['Surface'])
    collection.hide_render,collection.hide_viewport=collection_flags
    bpy.context.view_layer.update()
    after=signatures()
    assert set(before)==set(after)
    assert all(after[name]==sig for name,sig in before.items() if name not in allowed)
    assert all(geometry_base_uv(bpy.data.objects[name])==sig for name,sig in base_uv_signatures.items())
    current_materials=materials()
    assert all(current_materials[name]==sig for name,sig in old_materials.items())
    current_packed=packed()
    assert all(current_packed[name]==sig for name,sig in old_packed.items())
    master=DEV/'blender/SaintMeridian_V02_Furnished_Public_Lighting.blend'
    bpy.ops.wm.save_as_mainfile(filepath=str(master))
    bpy.ops.wm.open_mainfile(filepath=str(master))
    bpy.context.view_layer.update()
    after=signatures()
    assert all(after[name]==sig for name,sig in before.items() if name not in allowed)
    assert all(geometry_base_uv(bpy.data.objects[name])==sig for name,sig in base_uv_signatures.items())
    current_materials=materials()
    assert all(current_materials[name]==sig for name,sig in old_materials.items())
    current_packed=packed()
    assert all(current_packed[name]==sig for name,sig in old_packed.items())
    assert props()==old_props
    assert sorted(o.name for o in bpy.data.objects if o.type=='LIGHT')==old_lights
    report.update({'master':str(master.relative_to(ROOT)),'masterSHA256':sha(master),
                   'unchangedObjects':sum(name not in allowed for name in before),
                   'controlledUV2Objects':sorted(allowed),'geometryBaseUVSignatures':base_uv_signatures,
                   'originalMaterialsPreserved':len(old_materials),'originalImagesPreserved':len(old_packed),
                   'lighting':'Preserve live game direct/environment lighting; standard PBR light maps add only source-baked new-fixture diffuse once. Retain original specular and emission.'})
    stage('saved and reopened source lighting master',masterSHA256=report['masterSHA256'])
    scene=bpy.context.scene
    scene.render.engine='CYCLES'
    scene.cycles.device='CPU'
    scene.cycles.samples=64
    scene.cycles.use_denoising=True
    scene.render.threads_mode='FIXED'
    scene.render.threads=8
    scene.render.resolution_x=512
    scene.render.resolution_y=256
    scene.render.resolution_percentage=100
    probe=bpy.data.objects['V02 corridor HDR reflection probe']
    scene.camera=probe
    for room in report['rooms']:
        floor=room['floor']
        probe.matrix_world=Matrix(((0,0,-1,102.1),(-1,0,0,-310),(0,1,0,floor+1.6),(0,0,0,1)))
        scene.render.image_settings.file_format='OPEN_EXR'
        scene.render.image_settings.color_depth='16'
        exr=EVIDENCE/f'room-{floor}-radiance.exr'
        scene.render.filepath=str(exr)
        stage('rendering source room reflection',floor=floor)
        bpy.ops.render.render(write_still=True)
        image=bpy.data.images.load(str(exr),check_existing=False)
        values=image_pixels(image)
        raw=rgba16f(values,512,256,False)
        file=OUT/f'room-{floor}-radiance.rgba16f.gz'
        file.write_bytes(gzip.compress(raw,mtime=0))
        room['reflection']={'url':str(file.relative_to(ROOT)),'sha256':sha(file),
                            'rawSHA256':hashlib.sha256(raw).hexdigest(),'rawBytes':len(raw),
                            'bytes':file.stat().st_size,'width':512,'height':256,
                            'position':[102.1,floor+1.6,310],'sourceMasterSHA256':report['masterSHA256'],
                            'format':'scene-linear RGBA16F bottom row first, centre+X/right+Z/up+Y; flipY=false'}
        scene.render.image_settings.file_format='PNG'
        scene.render.image_settings.color_depth='8'
        image.save_render(str(EVIDENCE/f'room-{floor}-radiance.png'),scene=scene)
        save()
    report['status']='AUTHORED source UV2/diffuse/room reflection; independent and native acceptance pending'
    stage('source room lighting complete')
except Exception as error:
    report['status']='FAIL source room lighting'
    report['error']=str(error)
    save()
    raise
