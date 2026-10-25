"""Check the saved authoring components, export bounds and glass material.
Source checks supplement rather than replace actual portal/camera/input tests.
"""
import bpy,json,hashlib
from pathlib import Path
from mathutils import Vector
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02'
mp=R/'assets/city/vertical-v02/graybox/manifest.json'
m=json.loads(mp.read_text());rows=[]
for r in m['records']:
    if not r['id'].startswith('station-stair-weather-'):continue
    o=bpy.data.objects[r['id']]
    assert o in bpy.data.collections['SM_V02_TRANSIT_STRUCTURES'].objects.values()
    assert o['solid'] and r['solid']
    points=[o.matrix_world@Vector(p) for p in o.bound_box]
    game=[[p.x,p.z,-p.y] for p in points]
    error=max(abs(fn(p[i] for p in game)-r['box'][key][i])
              for key,fn in [('min',min),('max',max)] for i in range(3))
    assert error<5e-5,(r['id'],error)
    assert o.data.materials[0].name=='V02_'+r['material']
    rows.append({'id':r['id'],'boundsErrorMetres':error,'material':r['material']})
assert len(rows)==34
glass=bpy.data.materials['V02_glass'];shader=glass.node_tree.nodes.get('Principled BSDF')
assert abs(shader.inputs['Alpha'].default_value-.22)<1e-6
# Test source geometry is genuinely absent in all four public door volumes.
doors=[('west',[58.7,84.01,374.12],[59,86.65,376.88]),
       ('east',[72.2,100.01,375.42],[72.5,102.65,378.18]),
       ('south',[65.02,100.01,386.65],[67.98,102.65,386.95]),
       ('north',[62.42,100.01,370.95],[68.68,102.65,371.25])]
parts=[r for r in m['records'] if r['id'].startswith('station-stair-weather-')]
for name,lo,hi in doors:
    hits=[r['id'] for r in parts if all(r['box']['min'][i]<hi[i]-1e-5 and r['box']['max'][i]>lo[i]+1e-5 for i in range(3))]
    assert not hits,(name,hits)
report={'status':'PASS saved stair enclosure bounds, glass alpha and four open portals',
        'scope':'Blender source and exported components only; native projectile, circulation and camera reports are separate.',
        'manifestSHA256':hashlib.sha256(mp.read_bytes()).hexdigest(),
        'masterSHA256':hashlib.sha256((D/'blender/SaintMeridian_V02_AAA_Master.blend').read_bytes()).hexdigest(),
        'components':rows,'portalIDs':[d[0] for d in doors],'glassAlpha':shader.inputs['Alpha'].default_value}
(D/'V02_Stair_Enclosure_Authoring.json').write_text(json.dumps(report,indent=2)+'\n')
print(report['status'])
