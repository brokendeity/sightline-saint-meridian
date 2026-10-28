"""Build the source-backed east public rooms; do not promote a runtime build.

Only six named gallery guard spans/caps and their collision markers change.
The complete cassette master and original city remain the authoring foundation.
Warm ceiling strips are emissive source geometry; their room illumination still
requires a real diffuse bake, export parity and native-view validation.
"""
import ast
import copy
import hashlib
import json
import math
import sys
from pathlib import Path

import bmesh
import bpy

ROOT = Path(__file__).resolve().parents[2]
DEV = ROOT / 'development/vertical-city-v02'
OUT = ROOT / 'assets/city/vertical-v02/east-public-loggias'
OUT.mkdir(exist_ok=True)
sys.path.insert(0, str(Path(__file__).parent))
from v02_scene_signatures import signatures


def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


def read(p):
    return json.loads(p.read_text())


plan_path = DEV / 'V02_East_Public_Loggias_Plan.json'
plan = read(plan_path)
assert plan['status'].startswith('PASS')
for name in ['Geometry_Clearance', 'Traffic_Clearance']:
    gate = read(DEV / ('V02_East_Public_Loggias_' + name + '.json'))
    assert gate['status'].startswith('PASS')
    assert all(sha(ROOT / f) == h for f, h in gate['hashes'].items())
source = ROOT / plan['sourceMaster']
assert sha(source) == plan['sourceMasterSHA256']
assert sha(ROOT / plan['sourceManifest']) == plan['sourceManifestSHA256']
base = read(ROOT / plan['sourceManifest'])
bpy.ops.wm.open_mainfile(filepath=str(source))
bpy.context.view_layer.update()
before = signatures()

# Import only pure geometry helpers, not any older authoring program.
helper = Path(__file__).with_name('blender_public_terraces.py')
defs = [n for n in ast.parse(helper.read_text()).body
        if isinstance(n, ast.FunctionDef) and n.name in ['finish', 'parts', 'make']]
assert len(defs) == 3
materials = {k: bpy.data.materials['V02_' + k]
             for k in ['deck', 'steel', 'cyan', 'warm', 'glass']}
materials['soffit'] = bpy.data.materials['V02_arcade_soffit']
materials['foliage'] = bpy.data.materials['V02_terrace_foliage']
palette = list(materials)
V = [(-1,-1,-1),(-1,-1,1),(-1,1,-1),(-1,1,1),
     (1,-1,-1),(1,-1,1),(1,1,-1),(1,1,1)]
F = [(0,2,6,4),(1,5,7,3),(0,4,5,1),(2,3,7,6),(0,1,3,2),(4,6,7,5)]
exec(compile(ast.Module(body=defs, type_ignores=[]), str(helper), 'exec'), globals())

snapshot_helper = Path(__file__).with_name('validate_upper_anchor_master.py')
defs = [n for n in ast.parse(snapshot_helper.read_text()).body
        if isinstance(n, ast.FunctionDef) and n.name in ['props','value','materials','packed']]
# Avoid clobbering the geometry helper's material dictionary.
snapshot_scope = dict(globals())
exec(compile(ast.Module(body=defs, type_ignores=[]), str(snapshot_helper), 'exec'), snapshot_scope)
snapshot_props = snapshot_scope['props']
snapshot_materials = snapshot_scope['materials']
snapshot_packed = snapshot_scope['packed']
before_props, before_materials, before_packed = snapshot_props(), snapshot_materials(), snapshot_packed()
old_lights = sorted(o.name for o in bpy.data.objects if o.type == 'LIGHT')

col = bpy.data.collections.new('SM_V02_EAST_PUBLIC_LOGGIAS')
bpy.context.scene.collection.children.link(col)
exports_col = bpy.data.collections.new('SM_V02_EAST_LOGGIA_EXPORT')
bpy.context.scene.collection.children.link(exports_col)
changed = {c['after']['id']: c['after'] for c in plan['changes']}
allowed = set(changed)
markers_by_id = {}
for marker in bpy.data.collections['SM_V02_COLLISION'].objects:
    key = marker.get('sourceComponent') or marker.name.removesuffix('__COL')
    markers_by_id.setdefault(key, []).append(marker)

lamp = materials['warm'].copy()
lamp.name = 'V02_east_loggia_luminaire'
lamp_name = lamp.name
bsdf = lamp.node_tree.nodes.get('Principled BSDF')
bsdf.inputs['Emission Color'].default_value = (.8, .42, .14, 1)
bsdf.inputs['Emission Strength'].default_value = 34.0
lamp.node_tree.links.new(bsdf.outputs['BSDF'], lamp.node_tree.nodes.get('Material Output').inputs['Surface'])

for r in list(changed.values()) + plan['additions']:
    mesh = make(r)
    obj = bpy.data.objects.get(r['id'])
    if obj:
        obj.data = mesh
    else:
        obj = bpy.data.objects.new(r['id'], mesh)
        col.objects.link(obj)
        obj['v02StableID'] = r['id']
        obj['runtimeOwner'] = r['owner']
        obj['solid'] = r['solid']
        obj['walkable'] = r['walkable']
    obj.location = (r['center'][0], -r['center'][2], r['center'][1])
    obj.scale = (1,1,1)
    if r['material'] == 'warm':
        for i, mat in enumerate(mesh.materials):
            if mat == materials['warm']:
                mesh.materials[i] = lamp
    markers = markers_by_id.get(r['id'], [])
    if r['solid'] and not markers:
        marker = bpy.data.objects.new(r['id'] + '__COL', None)
        marker['sourceComponent'] = r['id']
        marker.empty_display_type = 'CUBE'
        bpy.data.collections['SM_V02_COLLISION'].objects.link(marker)
        markers = [marker]
    for marker in markers:
        marker.location = obj.location
        marker.scale = (r['size'][0]/2, r['size'][2]/2, r['size'][1]/2)
        allowed.add(marker.name)
bpy.context.view_layer.update()

affected = [c for c in base['chunks'] if set(c['recordIDs']) & set(changed)]
jobs = [('east-loggia-portal-' + str(i), c['recordIDs'], c)
        for i, c in enumerate(affected)]
for floor in [24,52,84]:
    ids = [r['id'] for r in plan['additions']
           if r['id'].startswith(f'east-loggia-{floor}-')]
    jobs.append((f'east-public-room-{floor}', ids, None))
jobs.append(('east-public-room-frame', [r['id'] for r in plan['additions']
            if r['id'].startswith('east-loggia-frame-')], None))
# Inherited right-side rail segments retain their original stable-ID suffix.
assigned = {name for _, ids, _ in jobs for name in ids}
right_rails = [r['id'] for r in plan['additions'] if r['id'] not in assigned]
assert len(right_rails) == 6
jobs.append(('east-loggia-right-guards', right_rails, None))

restore = []
for mat in materials.values():
    output = mat.node_tree.nodes.get('Material Output')
    prior = next((l.from_socket for l in mat.node_tree.links
                  if l.to_socket == output.inputs['Surface']), None)
    if prior:
        restore.append((mat, output, prior))
        mat.node_tree.links.new(mat.node_tree.nodes.get('Principled BSDF').outputs['BSDF'], output.inputs['Surface'])
chunks = [c for c in base['chunks'] if c not in affected]
new_chunks = []
for name, ids, old in jobs:
    root = bpy.data.objects.new(name, None)
    exports_col.objects.link(root)
    root['v02Chunk'] = name
    root['runtimeIDs'] = json.dumps(ids)
    selected = [root]
    for stable_id in ids:
        source_obj = bpy.data.objects[stable_id]
        # Preserve the actual local mesh, original normals, all UVs and source
        # transform. Runtime batching happens in glTF Transform, which applies
        # transforms without recalculating faces from rounded world positions.
        assert source_obj.parent is None, stable_id+' needs explicit parent-space export support'
        # Copy saved TRS directly. Assigning matrix_basis would decompose a
        # 90-degree Euler pose and introduce a float32 rotation round trip.
        obj = source_obj.copy()
        obj.name = name+'::'+stable_id
        exports_col.objects.link(obj)
        obj.parent = root
        obj['sourceStableID'] = stable_id
        selected.append(obj)
    bpy.ops.object.select_all(action='DESELECT')
    for obj in selected:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = root
    bpy.context.view_layer.update()
    file = OUT / (name + '.glb')
    bpy.ops.export_scene.gltf(filepath=str(file), export_format='GLB', use_selection=True,
                              export_yup=True, export_extras=True, export_tangents=True)
    triangle_count = 0
    for obj in selected[1:]:
        obj.data.calc_loop_triangles()
        triangle_count += len(obj.data.loop_triangles)
    chunk = {'id':name,'url':str(file.relative_to(ROOT)),'sha256':sha(file),
             'bytes':file.stat().st_size,'triangles':triangle_count,'recordIDs':ids,
             'normalPolicy':'Original source local geometry and normals; offline attribute-preserving batching required'}
    if old:
        chunk['replaces'] = old['id']
    chunks.append(chunk)
    new_chunks.append(chunk)
for mat, output, socket in restore:
    mat.node_tree.links.new(socket, output.inputs['Surface'])
exports_col.hide_render = exports_col.hide_viewport = True
bpy.context.view_layer.update()


def preserved():
    now, extra, mats = signatures(), snapshot_props(), snapshot_materials()
    assert all(now[n] == h and extra[n] == before_props[n]
               for n,h in before.items() if n not in allowed)
    assert all(mats[n] == h for n,h in before_materials.items())
    assert snapshot_packed() == before_packed
    assert sorted(o.name for o in bpy.data.objects if o.type == 'LIGHT') == old_lights
    return now


after = preserved()
master = DEV / 'blender/SaintMeridian_V02_East_Public_Loggias.blend'
bpy.ops.wm.save_as_mainfile(filepath=str(master))
bpy.ops.wm.open_mainfile(filepath=str(master))
bpy.context.view_layer.update()
after = preserved()
manifest = {**base,
    'records':[changed.get(r['id'], r) for r in base['records']] + plan['additions'],
    'chunks':chunks,
    'eastPublicLoggias': {'rooms':plan['rooms'], 'changes':plan['changes'],
                         'additions':[r['id'] for r in plan['additions']]},
    'status':'SOURCE AUTHORING; independent export, lighting and gameplay acceptance pending'}
(OUT / 'manifest.json').write_text(json.dumps(manifest, indent=2)+'\n')
report = {
    'status':'PASS source saved/reopened bounded preservation; unadmitted room candidate',
    'sourceMaster':str(source.relative_to(ROOT)), 'sourceMasterSHA256':sha(source),
    'master':str(master.relative_to(ROOT)), 'masterSHA256':sha(master),
    'planSHA256':sha(plan_path), 'authoringSHA256':sha(Path(__file__)),
    'geometryHelperSHA256':sha(helper), 'snapshotHelperSHA256':sha(snapshot_helper),
    'unchangedSourceObjects':sum(n not in allowed for n in before),
    'controlledChangedObjects':[n for n,h in before.items() if after[n] != h],
    'permittedChangedObjects':sorted(allowed), 'newRecords':len(plan['additions']),
    'newDynamicLights':0, 'originalBuildingChanges':0,
    'newSharedLuminaireMaterial':lamp_name, 'sourceEmissionStrength':34,
    'exports':new_chunks, 'reusedChunks':len(base['chunks'])-len(affected),
    'scope':__doc__.strip()
}
(DEV / 'V02_East_Public_Loggias_Authoring.json').write_text(json.dumps(report, indent=2)+'\n')
print(report['status'],len(new_chunks),'chunks',flush=True)
