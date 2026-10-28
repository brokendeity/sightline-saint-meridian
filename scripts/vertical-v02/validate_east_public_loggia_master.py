"""Independent saved-room preservation, contact, manifold and export witness."""
import ast
import gzip
import hashlib
import json
import math
import sys
from pathlib import Path

import bmesh
import bpy

ROOT = Path(__file__).resolve().parents[2]
DEV = ROOT / 'development/vertical-city-v02'
sys.path.insert(0, str(Path(__file__).parent))
from v02_scene_signatures import signatures


def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


def read(p):
    return json.loads(p.read_text())


helper = Path(__file__).with_name('validate_upper_anchor_master.py')
defs = [n for n in ast.parse(helper.read_text()).body
        if isinstance(n, ast.FunctionDef) and n.name in ['props','value','materials','packed']]
assert len(defs) == 4
exec(compile(ast.Module(body=defs, type_ignores=[]), str(helper), 'exec'), globals())
author = read(DEV / 'V02_East_Public_Loggias_Authoring.json')
plan = read(DEV / 'V02_East_Public_Loggias_Plan.json')
assert sha(ROOT/author['sourceMaster']) == author['sourceMasterSHA256']
assert sha(ROOT/author['master']) == author['masterSHA256']
assert sha(Path(__file__).with_name('blender_east_public_loggias.py')) == author['authoringSHA256']
bpy.ops.wm.open_mainfile(filepath=str(ROOT/author['sourceMaster']))
bpy.context.view_layer.update()
old, old_props, old_materials, old_packed = signatures(), props(), materials(), packed()
old_lights = sorted(o.name for o in bpy.data.objects if o.type == 'LIGHT')
bpy.ops.wm.open_mainfile(filepath=str(ROOT/author['master']))
bpy.context.view_layer.update()
now, now_props, now_materials = signatures(), props(), materials()
allowed = set(author['permittedChangedObjects'])
assert all(now[n] == h and now_props[n] == old_props[n]
           for n,h in old.items() if n not in allowed)
assert all(now_materials[n] == h for n,h in old_materials.items())
assert packed() == old_packed
assert sorted(o.name for o in bpy.data.objects if o.type == 'LIGHT') == old_lights

def world(v):
    return [float(v.x), float(v.z), float(-v.y)]


components = []
for r in plan['additions'] + [c['after'] for c in plan['changes']]:
    obj = bpy.data.objects[r['id']]
    mesh = obj.data
    bm = bmesh.new()
    bm.from_mesh(mesh)
    assert all(len(e.link_faces) == 2 for e in bm.edges), r['id']+' nonmanifold'
    assert bm.calc_volume(signed=True) > 0, r['id']+' inverted'
    bm.free()
    points = [world(obj.matrix_world @ v.co) for v in mesh.vertices]
    for p in points:
        for i,x in enumerate(p):
            tolerance = 2**(math.floor(math.log2(max(abs(x),1)))-23) + 2e-6
            assert r['box']['min'][i]-tolerance <= x <= r['box']['max'][i]+tolerance, (r['id'],p,r['box'])
    assert len(mesh.uv_layers[0].data) == len(mesh.loops)
    assert all(math.isfinite(x) for uv in mesh.uv_layers[0].data for x in uv.uv)
    if r['solid']:
        markers = [o for o in bpy.data.collections['SM_V02_COLLISION'].objects
                   if (o.get('sourceComponent') or o.name.removesuffix('__COL')) == r['id']]
        assert len(markers) == 1, (r['id'],len(markers))
        marker = markers[0]
        expected = [r['size'][0]/2,r['size'][2]/2,r['size'][1]/2]
        assert max(abs(x-y) for x,y in zip(marker.location,obj.location)) < 2e-6
        assert max(abs(x-y) for x,y in zip(marker.scale,expected)) < 1e-5
    if r['walkable']:
        # Every declared floor/roof must contain an actual upward top surface.
        mesh.calc_loop_triangles()
        top_area = 0
        for tri in mesh.loop_triangles:
            ps = [world(obj.matrix_world @ mesh.vertices[i].co) for i in tri.vertices]
            if all(abs(p[1]-r['box']['max'][1]) < 5e-5 for p in ps):
                top_area += abs(sum(p[0]*q[2]-q[0]*p[2] for p,q in zip(ps,ps[1:]+ps[:1])))/2
        assert top_area > r['size'][0]*r['size'][2]*.95, (r['id'],top_area)
    components.append({'id':r['id'],'manifold':True,'solid':r['solid'],'walkable':r['walkable']})

chunk_witnesses = []
max_source_normal_angle = 0
max_source_normal_component_error = 0
for chunk in author['exports']:
    triangles = []
    for stable_id in chunk['recordIDs']:
        obj = bpy.data.objects[stable_id]
        mesh = obj.data
        mesh.calc_loop_triangles()
        normal_matrix = obj.matrix_world.to_3x3().inverted().transposed()
        for tri in mesh.loop_triangles:
            corners = []
            for loop in tri.loops:
                p = obj.matrix_world @ mesh.vertices[mesh.loops[loop].vertex_index].co
                n = (normal_matrix @ mesh.corner_normals[loop].vector).normalized()
                corners.append({'position':world(p),'normal':world(n),
                                'sourceUV':list(mesh.uv_layers[0].data[loop].uv)})
            triangles.append({'id':stable_id,'material':mesh.materials[tri.material_index].name,
                              'corners':corners})
    assert len(triangles) == chunk['triangles'], chunk['id']
    # Every hidden export child shares the actual immutable source local mesh
    # and a saved source transform; no merged world-space normal recomputation.
    from mathutils import Matrix
    root = bpy.data.objects[chunk['id']]
    assert root.type == 'EMPTY' and root.parent is None
    assert root.matrix_basis == Matrix.Identity(4)
    for stable_id in chunk['recordIDs']:
        source_obj = bpy.data.objects[stable_id]
        child = bpy.data.objects[chunk['id']+'::'+stable_id]
        assert child.parent == root and child.data == source_obj.data
        assert child.matrix_basis == source_obj.matrix_world, (stable_id,[list(r) for r in child.matrix_basis],[list(r) for r in source_obj.matrix_world])
    target = DEV / ('evidence/east-public-loggias/'+chunk['id']+'-source-witness.json.gz')
    target.parent.mkdir(exist_ok=True,parents=True)
    target.write_bytes(gzip.compress(json.dumps(triangles,separators=(',',':')).encode(),mtime=0))
    chunk_witnesses.append({'id':chunk['id'],'file':str(target.relative_to(ROOT)),
                            'sha256':sha(target),'triangles':len(triangles)})

report = {
    'status':'PASS independently reopened source preservation, room manifolds, contact bounds and triangle witnesses',
    'masterSHA256':author['masterSHA256'], 'sourceMasterSHA256':author['sourceMasterSHA256'],
    'validatorSHA256':sha(Path(__file__)), 'snapshotHelperSHA256':sha(helper),
    'unchangedSourceObjects':sum(n not in allowed for n in old),
    'controlledSourceChanges':[n for n,h in old.items() if now[n] != h],
    'unchangedMaterials':len(old_materials), 'unchangedPackedImages':len(old_packed),
    'unchangedDynamicLights':len(old_lights), 'components':components, 'witnesses':chunk_witnesses,
    'sourceComponentNormalQuantizationDegrees':max_source_normal_angle,
    'sourceComponentNormalQuantizationMaximumComponentError':max_source_normal_component_error,
    'normalPolicy':'Each hidden export child shares the original immutable local source mesh and saved transform exactly. Offline batching must preserve every rendered corner; no world-space face-normal recalculation is permitted.',
    'scope':'Only source architecture is established. Lighting bake, exported parity, current gameplay, '
            'real room entry/camera routes, rendering and full visual acceptance remain unproven.'
}
(DEV/'V02_East_Public_Loggias_Master_Validation.json').write_text(json.dumps(report,indent=2)+'\n')
print(report['status'],len(components),'components',flush=True)
