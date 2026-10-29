"""Independent current furnished-source preservation, packed-light identity and continuous UV2 checks."""
import ast
import gzip
import hashlib
import json
import math
import struct
import sys
from array import array
from pathlib import Path

import bpy

ROOT=Path(__file__).resolve().parents[2]
DEV=ROOT/'development/vertical-city-v02'
EVIDENCE=DEV/'evidence/furnished-public-rooms'
sys.path.insert(0,str(Path(__file__).parent))
from v02_saved_scene_snapshots import signatures,source_props

sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
read=lambda p:json.loads(p.read_text())
author=read(DEV/'V02_Furnished_Public_Lighting_Authoring.json')
assert author['status'].startswith('AUTHORED')
furnishing=read(DEV/'V02_Furnished_Public_Rooms_Master_Validation.json')
assert furnishing['status'].startswith('PASS') and furnishing['masterSHA256']==author['sourceMasterSHA256']
assert sha(ROOT/author['sourceMaster'])==author['sourceMasterSHA256']
assert sha(ROOT/author['master'])==author['masterSHA256']
assert sha(Path(__file__).with_name('blender_furnished_public_lighting.py'))==author['scriptSHA256']
helper=Path(__file__).with_name('validate_upper_anchor_master.py')
defs=[n for n in ast.parse(helper.read_text()).body
      if isinstance(n,ast.FunctionDef) and n.name in ['props','value','materials','packed']]
assert len(defs)==4
exec(compile(ast.Module(body=defs,type_ignores=[]),str(helper),'exec'),globals())
props=source_props


def source_lighting():
    world=bpy.context.scene.world
    world_data={'name':world.name,'useNodes':world.use_nodes,'color':list(world.color)}
    if world.use_nodes:
        world_data['nodes']=sorted([
            {'name':node.name,'type':node.bl_idname,
             'inputs':[(socket.identifier,value(socket.default_value))
                       for socket in node.inputs if hasattr(socket,'default_value')]}
            for node in world.node_tree.nodes],key=lambda node:node['name'])
        world_data['links']=sorted((link.from_node.name,link.from_socket.identifier,
                                   link.to_node.name,link.to_socket.identifier)
                                  for link in world.node_tree.links)
    fields=['type','energy','color','angle','shadow_soft_size','spot_size','spot_blend',
            'shape','size','size_y','use_shadow','use_custom_distance','cutoff_distance']
    lights={obj.name:{field:value(getattr(obj.data,field)) for field in fields
                      if hasattr(obj.data,field)}
            for obj in bpy.data.objects if obj.type=='LIGHT'}
    return {'world':world_data,'lights':lights}


def base_geometry(obj):
    h=hashlib.sha256()
    for v in obj.data.vertices:
        h.update(struct.pack('<3f',*v.co))
    for p in obj.data.polygons:
        h.update(struct.pack('<II',len(p.vertices),p.material_index))
        h.update(struct.pack('<'+'I'*len(p.vertices),*p.vertices))
    for uv in obj.data.uv_layers[0].data:
        h.update(struct.pack('<2f',*uv.uv))
    h.update(json.dumps(['V02_east_loggia_luminaire' if m.name=='V02_east_loggia_luminaire_v2' else m.name for m in obj.data.materials]).encode())
    return h.hexdigest()


def polygon_area(poly):
    return abs(sum(p[0]*q[1]-q[0]*p[1] for p,q in zip(poly,poly[1:]+poly[:1])))/2 if len(poly)>2 else 0


def intersection(a,b):
    poly=a
    signed=sum(p[0]*q[1]-q[0]*p[1] for p,q in zip(b,b[1:]+b[:1]))
    sign=1 if signed>=0 else -1
    for c,d in zip(b,b[1:]+b[:1]):
        if not poly:
            break
        out=[]
        cross=lambda p:sign*((d[0]-c[0])*(p[1]-c[1])-(d[1]-c[1])*(p[0]-c[0]))
        for p,q in zip(poly,poly[1:]+poly[:1]):
            x,y=cross(p),cross(q)
            if x>=0:
                out.append(p)
            if (x>=0)!=(y>=0):
                t=x/(x-y)
                out.append([p[i]+t*(q[i]-p[i]) for i in range(2)])
        poly=out
    return polygon_area(poly)


def linear_alpha(values,width,height,uv):
    x=max(0,min(width-1,uv[0]*width-.5))
    y=max(0,min(height-1,uv[1]*height-.5))
    x0,y0=math.floor(x),math.floor(y)
    tx,ty=x-x0,y-y0
    return sum(values[(min(y0+dy,height-1)*width+min(x0+dx,width-1))*4+3]*wx*wy
               for dx,wx in [(0,1-tx),(1,tx)] for dy,wy in [(0,1-ty),(1,ty)])


bpy.ops.wm.open_mainfile(filepath=str(ROOT/author['sourceMaster']))
bpy.context.view_layer.update()
before,old_props,old_materials,old_packed=signatures(),props(),materials(),packed()
old_world=bpy.context.scene.world.name
old_lighting=source_lighting()
old_lights=sorted(o.name for o in bpy.data.objects if o.type=='LIGHT')
bpy.ops.wm.open_mainfile(filepath=str(ROOT/author['master']))
bpy.context.view_layer.update()
after,new_props,new_materials,new_packed=signatures(),props(),materials(),packed()
allowed=set(author['controlledUV2Objects'])
assert set(before)==set(after)
assert all(before[name]==after[name] for name in before if name not in allowed)
assert old_props==new_props
assert all(new_materials[name]==sig for name,sig in old_materials.items())
assert all(new_packed[name]==sig for name,sig in old_packed.items())
assert sorted(o.name for o in bpy.data.objects if o.type=='LIGHT')==old_lights
assert bpy.context.scene.world.name==old_world
assert source_lighting()==old_lighting,'Saved source global-light/world parameters changed'
lamp=bpy.data.materials[author['luminaire']['material']].node_tree.nodes.get('Principled BSDF')
assert lamp.inputs['Emission Strength'].default_value==96
assert author['globalLightingRestored'] and author['bakeScope'].startswith('Only the six')
assert all(base_geometry(bpy.data.objects[name])==sig
           for name,sig in author['geometryBaseUVSignatures'].items())
rooms=[]
for room in author['rooms']:
    atlas=room['atlas']
    image=bpy.data.images[atlas['sourceImage']]
    assert image.packed_file and image.is_float and image.file_format=='OPEN_EXR'
    width,height=image.size
    assert [width,height]==[atlas['width'],atlas['height']]
    pixels=array('f',[0])*len(image.pixels)
    image.pixels.foreach_get(pixels)
    assert all(math.isfinite(x) and x>=0 for x in pixels)
    raw=b''.join(struct.pack('<'+'e'*(width*4),*pixels[y*width*4:(y+1)*width*4])
                 for y in reversed(range(height)))
    assert sha(ROOT/atlas['url'])==atlas['sha256']
    archived=gzip.decompress((ROOT/atlas['url']).read_bytes())
    assert raw==archived and hashlib.sha256(raw).hexdigest()==atlas['rawSHA256']
    witness=[]
    uv_triangles=[]
    coverage=[]
    for stable_id in room['sourceIDs']:
        obj=bpy.data.objects[stable_id]
        mesh=obj.data
        assert len(mesh.uv_layers)==2 and mesh.uv_layers[0].active_render
        assert mesh.uv_layers[1].name=='V02_East_Diffuse'
        mesh.calc_loop_triangles()
        normal_matrix=obj.matrix_world.to_3x3().inverted().transposed()
        for triangle in mesh.loop_triangles:
            corners=[]
            for loop in triangle.loops:
                p=obj.matrix_world@mesh.vertices[mesh.loops[loop].vertex_index].co
                n=(normal_matrix@mesh.corner_normals[loop].vector).normalized()
                uv0=list(mesh.uv_layers[0].data[loop].uv)
                uv1=list(mesh.uv_layers[1].data[loop].uv)
                assert all(math.isfinite(x) and -.00001<=x<=1.00001 for x in uv1)
                corners.append({'position':[p.x,p.z,-p.y],'normal':[n.x,n.z,-n.y],
                                'sourceUV':uv0,'sourceUV1':uv1})
            material=mesh.materials[triangle.material_index].name
            witness.append({'id':stable_id,'material':material,'corners':corners})
            tri=[c['sourceUV1'] for c in corners]
            uv_triangles.append(tri)
            area=polygon_area(tri)*width*height
            # Check actual packed texel coverage on broad opaque faces. Tiny
            # bevels/foliage and transparent/emissive surfaces are not promoted
            # into a claim about texel density or visible lighting quality.
            sides=[math.dist(p,q)*width for p,q in zip(tri,tri[1:]+tri[:1])]
            altitude=2*area/max(sides) if max(sides)>0 else 0
            if area>36 and altitude>6 and material not in ['V02_glass','V02_cyan','V02_east_loggia_luminaire_v2']:
                uv=[sum(p[i] for p in tri)/3 for i in range(2)]
                alpha=linear_alpha(pixels,width,height,uv)
                coverage.append({'id':stable_id,'triangle':len(witness)-1,'alpha':alpha,'pixelArea':area})
                assert alpha>.2, ('Missing source bake coverage',stable_id,uv,alpha,area)
    # Spatial buckets only accelerate pair discovery. Exact convex clipping
    # establishes continuous UV-triangle intersection, not raster samples.
    grid={}
    overlaps=[]
    tests=0
    for i,tri in enumerate(uv_triangles):
        if polygon_area(tri)<1e-12:
            continue
        minimum=[math.floor(min(p[k] for p in tri)*16) for k in range(2)]
        maximum=[math.floor(max(p[k] for p in tri)*16) for k in range(2)]
        cells=[(x,y) for x in range(minimum[0],maximum[0]+1)
                     for y in range(minimum[1],maximum[1]+1)]
        candidates={j for cell in cells for j in grid.get(cell,[])}
        for j in candidates:
            tests+=1
            area=intersection(tri,uv_triangles[j])
            if area>1e-9:
                overlaps.append({'a':i,'b':j,'uvArea':area})
        for cell in cells:
            grid.setdefault(cell,[]).append(i)
    assert not overlaps, ('UV2 islands overlap',room['floor'],overlaps[:8])
    assert coverage, 'No broad opaque surface coverage was exercised'
    file=EVIDENCE/f"room-{room['floor']}-source-witness.json.gz"
    file.write_bytes(gzip.compress(json.dumps(witness,separators=(',',':')).encode(),mtime=0))
    rooms.append({'floor':room['floor'],'triangles':len(witness),'witness':str(file.relative_to(ROOT)),
                  'witnessSHA256':sha(file),'packedAtlasExact':True,'atlasRawSHA256':atlas['rawSHA256'],
                  'uvIntersectionTests':tests,'uvOverlaps':overlaps,'broadFaceCoverageProbes':coverage})
report={'status':'PASS independent source preservation, HDR atlas identity, UV2 witnesses/coverage/nonoverlap',
        'masterSHA256':author['masterSHA256'],'sourceMasterSHA256':author['sourceMasterSHA256'],
        'validatorSHA256':sha(Path(__file__)),'readOnlySnapshotHelperSHA256':sha(helper),
        'savedSceneSnapshotSHA256':sha(Path(__file__).with_name('v02_saved_scene_snapshots.py')),
        'unchangedObjects':sum(name not in allowed for name in before),
        'originalMaterials':len(old_materials),'originalPackedImages':len(old_packed),
        'lightsUnchanged':len(old_lights),'rooms':rooms,
        'globalLightAndWorldParametersUnchanged':True,
        'scope':'Source data and broad opaque texel coverage only. Does not establish browser orientation, '
                'rendering fidelity, room entry, gameplay, or approved-reference acceptance.'}
(DEV/'V02_Furnished_Public_Lighting_Master_Validation.json').write_text(json.dumps(report,indent=2)+'\n')
print(report['status'],flush=True)
