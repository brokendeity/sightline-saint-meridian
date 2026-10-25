"""Refine the accepted graybox into a separate Blender-authored V02 candidate.

Keeps the accepted graybox, original city and gameplay files immutable. Existing
contact records retain their exact boxes/IDs. New architecture has visible
geometry, ownership and explicit collision/support records of its own.
"""
import bpy, bmesh, json, math, hashlib, random
from pathlib import Path
from mathutils import Vector

R=Path(__file__).resolve().parents[2]
D=R/'development/vertical-city-v02'
OUT=R/'assets/city/vertical-v02/detailed'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
SCRIPT_SHA=sha(Path(__file__))
gate=json.loads((D/'V02_Phase4_Gate.json').read_text())
assert gate['status']=='PASS essential circulation, recovery and prototype encounters'
BASE=R/'assets/city/vertical-v02/graybox/manifest.json'
MASTER=D/'blender/SaintMeridian_V02_AAA_Master.blend'
assert gate['manifestSHA256']==sha(BASE) and gate['masterSHA256']==sha(MASTER)
assert gate['entrySHA256']==sha(R/'SIGHTLINE_SAINT_MERIDIAN_V02_GRAYBOX.html')
base=json.loads(BASE.read_text())
bpy.ops.wm.open_mainfile(filepath=str(MASTER))
OUT.mkdir(parents=True,exist_ok=True)
for obj in list(bpy.data.collections['SM_V02_EXPORT'].objects):
    bpy.data.objects.remove(obj,do_unlink=True)
bpy.data.collections['SM_V02_EXPORT'].hide_viewport=False
bpy.data.collections['SM_V02_EXPORT'].hide_render=False
records=json.loads(json.dumps(base['records']))
materials={name:bpy.data.materials['V02_'+name] for name in ['deck','steel','cyan','warm','glass']}

# Actual embedded PBR images, with metre-scaled UVs. No unsupported procedural
# shader is silently substituted by the browser export.
rng=random.Random(40817)
images={}
for name in ['BaseColor','Roughness','Normal']:
    image=bpy.data.images.new('V02_MetalPanel_'+name,width=512,height=512,alpha=True)
    if name!='BaseColor':image.colorspace_settings.name='Non-Color'
    pixels=[]
    for y in range(512):
        for x in range(512):
            seam=min(x%256,255-x%256,y%128,127-y%128)
            grain=rng.uniform(-1,1)
            if name=='BaseColor':
                shade=.60 if seam<2 else .88 if seam<4 else 1
                value=[max(0,min(1,(v+grain*2)/255*shade)) for v in [61,81,101]]
            elif name=='Roughness':
                rough=.52 if seam<3 else .37+.035*grain+.045*math.sin(x*.037)*math.sin(y*.021)
                value=[rough]*3
            else:
                dx=.11 if x%256==3 else -.11 if x%256==252 else 0
                dy=.11 if y%128==3 else -.11 if y%128==124 else 0
                value=[.5+dx,.5+dy,math.sqrt(max(0,1-4*dx*dx-4*dy*dy))*.5+.5]
            pixels.extend([*value,1])
    image.pixels.foreach_set(pixels);image.pack();images[name]=image
deck=materials['deck'];nodes=deck.node_tree.nodes;links=deck.node_tree.links
principled=nodes.get('Principled BSDF')
for name,socket in [('BaseColor','Base Color'),('Roughness','Roughness')]:
    tex=nodes.new('ShaderNodeTexImage');tex.image=images[name];tex.extension='REPEAT'
    links.new(tex.outputs['Color'],principled.inputs[socket])
tex=nodes.new('ShaderNodeTexImage');tex.image=images['Normal'];tex.extension='REPEAT'
normal=nodes.new('ShaderNodeNormalMap');normal.inputs['Strength'].default_value=.32
links.new(tex.outputs['Color'],normal.inputs['Color']);links.new(normal.outputs['Normal'],principled.inputs['Normal'])
principled.inputs['Metallic'].default_value=.48
for name in ['cyan','warm']:
    materials[name].node_tree.nodes.get('Principled BSDF').inputs['Emission Strength'].default_value=1.25 if name=='cyan' else .85

V=[(-1,-1,-1),(-1,-1,1),(-1,1,-1),(-1,1,1),(1,-1,-1),(1,-1,1),(1,1,-1),(1,1,1)]
F=[(0,2,6,4),(1,5,7,3),(0,4,5,1),(2,3,7,6),(0,1,3,2),(4,6,7,5)]
def uv_mesh(mesh):
    layer=mesh.uv_layers.new(name='Metres_2_4') if not mesh.uv_layers else mesh.uv_layers.active
    for poly in mesh.polygons:
        n=poly.normal;axis=max(range(3),key=lambda i:abs(n[i]));axes=[i for i in range(3)if i!=axis]
        for index in poly.loop_indices:
            v=mesh.vertices[mesh.loops[index].vertex_index].co
            layer.data[index].uv=(v[axes[0]]/2.4,v[axes[1]]/2.4)

def compound_mesh(name,parts,bevel=0):
    """Parts use local Blender XYZ centres/sizes and shared palette names."""
    verts=[];faces=[];slots=[];palette=[]
    for center,size,kind in parts:
        if kind not in palette:palette.append(kind)
        start=len(verts)
        verts.extend([tuple(center[i]+v[i]*size[i]/2 for i in range(3)) for v in V])
        faces.extend([tuple(start+j for j in face)for face in F]);slots.extend([palette.index(kind)]*6)
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update()
    for kind in palette:mesh.materials.append(materials[kind])
    for poly,index in zip(mesh.polygons,slots):poly.material_index=index
    if bevel:
        bm=bmesh.new();bm.from_mesh(mesh)
        bmesh.ops.bevel(bm,geom=list(bm.edges),offset=bevel,segments=2,affect='EDGES')
        bm.to_mesh(mesh);bm.free();mesh.update()
    uv_mesh(mesh);return mesh

refined=0;glass_guards=0
for record in records:
    obj=bpy.data.objects[record['id']]
    sx,sy,sz=record['size']
    if record.get('guardrail') and record['solid'] and max(sx,sz)>.22:
        # The full1.1m visible boundary remains physical: steel plinth/posts
        # plus actual glass infill, with the accepted bounding volume intact.
        along=0 if sx>sz else 1;length=max(sx,sz);thickness=min(sx,sz);post=min(.075,length*.16)
        parts=[]
        size=[sx,sz,.20];parts.append(([0,0,-.45],size,'steel'))
        size=[sx,sz,.90];size[along]=length-post*2
        parts.append(([0,0,.10],size,'glass'))
        for sign in [-1,1]:
            size=[sx,sz,1.1];size[along]=post;center=[0,0,0];center[along]=sign*(length-post)/2
            parts.append((center,size,'steel'))
        obj.data=compound_mesh(record['id']+'__refined',parts)
        obj.scale=(1,1,1);record['visualPolicy']='continuous steel plinth/posts and glass infill within accepted contact box'
        glass_guards+=1
    elif not record.get('stair') and record['material'] not in ['cyan','warm','glass'] and min(sx,sy,sz)>.08:
        obj.data=compound_mesh(record['id']+'__bevel',[([0,0,0],[sx,sz,sy],record['material'])],min(.025,min(sx,sy,sz)*.12))
        obj.scale=(1,1,1);refined+=1
    else:
        # Give the actual exported floor material a consistent metre scale.
        obj.data=obj.data.copy()
        for vertex in obj.data.vertices:
            vertex.co.x*=obj.scale.x;vertex.co.y*=obj.scale.y;vertex.co.z*=obj.scale.z
        obj.scale=(1,1,1);obj.data.update();uv_mesh(obj.data)

def add(id,p,size,col,kind='steel',solid=True,walkable=False,bevel=.02,**extra):
    assert not any(r['id']==id for r in records),id
    mesh=compound_mesh(id,[([0,0,0],[size[0],size[2],size[1]],kind)],min(bevel,min(size)*.15))
    obj=bpy.data.objects.new(id,mesh);bpy.data.collections[col].objects.link(obj)
    obj.location=(p[0],-p[2],p[1]);obj['v02StableID']=id;obj['runtimeOwner']='v02:'+id
    obj['solid']=solid;obj['walkable']=walkable;obj['exportRole']='detailed architecture'
    if solid:
        proxy=bpy.data.objects.new(id+'__COL',None);bpy.data.collections['SM_V02_COLLISION'].objects.link(proxy)
        proxy.empty_display_type='CUBE';proxy.empty_display_size=1;proxy.location=obj.location
        proxy.scale=(size[0]/2,size[2]/2,size[1]/2);proxy['sourceComponent']=id
    record={'id':id,'owner':'v02:'+id,'center':p,'size':size,'box':{'min':[p[i]-size[i]/2 for i in range(3)],'max':[p[i]+size[i]/2 for i in range(3)]},'solid':solid,'walkable':walkable,'material':kind,'collection':col,'detail':True,**extra}
    records.append(record);return record

def refine_parts(id,parts):
    """Refine a closed architectural envelope without changing its contact box.

    Parts use local game XYZ; panels/fixtures remain inside that envelope.
    The saved-master validator independently checks the resulting mesh bounds.
    """
    record=next(r for r in records if r['id']==id)
    converted=[([p[0],-p[2],p[1]],[s[0],s[2],s[1]],kind)for p,s,kind in parts]
    obj=bpy.data.objects[id];obj.data=compound_mesh(id+'__panelled',converted);obj.scale=(1,1,1)
    record['visualPolicy']='framed closed envelope; contact box and outer dimensions preserved'

def label(id,text,p,width,col,kind='warm'):
    """Actual Blender-authored lettering, not a DOM label or runtime canvas."""
    curve=bpy.data.curves.new(id+'__font',type='FONT');curve.body=text;curve.align_x='CENTER'
    curve.size=.25;curve.extrude=.0006;curve.resolution_u=2
    obj=bpy.data.objects.new(id,curve);bpy.data.collections[col].objects.link(obj)
    obj.location=(p[0],-p[2],p[1]);obj.rotation_euler=(math.pi/2,0,0)
    bpy.context.view_layer.update()
    scale=min(1,width/max(.001,obj.dimensions.x));obj.scale=(scale,scale,scale)
    bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
    bpy.ops.object.convert(target='MESH');obj=bpy.context.object;obj.data.materials.append(materials[kind]);uv_mesh(obj.data)
    bpy.context.view_layer.update();points=[obj.matrix_world@Vector(v)for v in obj.bound_box]
    game=[[v.x,v.z,-v.y]for v in points]
    box={key:[fn(q[i]for q in game)for i in range(3)]for key,fn in [('min',min),('max',max)]}
    obj['v02StableID']=id;obj['runtimeOwner']='v02:'+id;obj['solid']=False;obj['walkable']=False;obj['exportRole']='detailed wayfinding'
    records.append({'id':id,'owner':'v02:'+id,'center':[(a+b)/2 for a,b in zip(box['min'],box['max'])],
      'size':[b-a for a,b in zip(box['min'],box['max'])],'box':box,'solid':False,'walkable':False,
      'material':kind,'collection':col,'detail':True,'text':text,'role':'physical architectural wayfinding lettering'})

# Shaped deck edges and recessed warm fixtures below approved walking surfaces.
for record in base['records']:
    sx,sy,sz=record['size']
    if not record['walkable'] or record.get('stair')or record.get('stairLanding')or sy<.45 or min(sx,sz)<3:continue
    x,y,z=record['center'];top=record['box']['max'][1];id=record['id'];col=record['collection']
    for sign in [-1,1]:
        add('detail-fascia-'+id+'-'+str(sign),[x+sign*(sx/2+.025),top-.27,z],[.05,.32,max(.2,sz-.06)],col,solid=False,sourceSurface=id,role='thin cosmetic edge attachment')
    if max(sx,sz)>8:
        axis=0 if sx>sz else 2;span=max(sx,sz);count=max(1,int(span/8))
        for j in range(count):
            p=[x,top-sy-.025,z];p[axis]+=(j+.5)/count*span-span/2
            size=[.13,.025,1.5]if axis==2 else[1.5,.025,.13]
            add('detail-soffit-'+id+'-'+str(j),p,size,col,'warm',solid=False,bevel=0,sourceSurface=id,role='recessed emissive fixture, no dynamic light')

# Transit skyline gateway: supported fins clear all approved rail/drop paths.
C='SM_V02_TRANSIT_STRUCTURES'
for x in [58.85,74.65]:
    add('detail-transit-fin-'+str(x),[x,108.5,389.5],[.5,17,.65],C,role='supported transit landmark mast')
    add('detail-transit-fin-light-'+str(x),[x,109,389.84],[.075,15,.025],C,'cyan',False,bevel=0)
add('detail-transit-header',[66.75,115.9,389.5],[16.3,.65,.7],C,role='gateway header joining two supported fins')
add('detail-transit-header-warm',[66.75,115.56,389.5],[13.4,.025,.13],C,'warm',False,bevel=0)
# A layered, cantilevered shelter gives the interchange an actual roof profile
# rather than a naked rectangular gateway. Its loads meet the two existing
# masts; the complete public stair/rail/drop corridors remain below and open.
add('detail-transit-canopy-spine',[66.75,114.45,389.5],[16.3,.5,.65],C,role='continuous canopy beam supported by transit fins')
for j,z in enumerate([387.5,389.5,391.5]):
    y=114.2+(1-abs(j-1))*.45
    add('detail-transit-roof-blade-'+str(j),[66.75,y,z],[16.3,.18,1.9],C,'deck',walkable=True,role='layered transit roof blade supported by the spine and ribs')
    add('detail-transit-soffit-'+str(j),[66.75,y-.1,z],[12.8,.025,.12],C,'warm',False,bevel=0)
for x in [58.85,62.8,66.75,70.7,74.65]:
    add('detail-transit-canopy-rib-'+str(x),[x,114.25,389.5],[.12,.64,5.9],C,role='continuous roof rib returns every blade into the supported header beam')
add('detail-transit-canopy-cyan',[66.75,114.32,392.48],[16.3,.045,.025],C,'cyan',False,bevel=0)
add('detail-transit-sign-board',[66.75,114.85,392.47],[6.6,.65,.10],C,role='transit identification fascia')
label('detail-transit-sign','TRANSIT / 100M',[66.75,114.78,392.526],5.8,C)

# A real second commercial level, reached by tagged <=.18m risers. The stair
# opening stays physically open; the original rescue/civilian paths stay free.
C='SM_V02_MARKET'
add('detail-market-upper-west',[88.05,27.4,356.65],[4.1,.4,4.7],C,'deck',walkable=True,role='public upper commercial terrace supported by storefront walls')
add('detail-market-upper-landing',[88.5,27.45,353.4],[8.6,.3,1.8],C,'deck',walkable=True,stairLanding=True,role='supported top landing')
for i in range(20):
    height=24+(i+1)*.18;x=77+(i+.5)*.36
    add('detail-market-stair-'+str(i),[x,height-.09,353.9],[.36,.18,2],C,'deck',walkable=True,bevel=0,stair=True,flight='detail-market-stair',stepRise=.18)
for id,p,size in [
 ('west',[86.05,28.15,356.65],[.1,1.1,4.7]),
 ('west-landing-corner',[84.25,28.15,352.7],[.1,1.1,.4]),
 ('north',[88.5,28.15,352.55],[8.6,1.1,.1]),
 ('east-landing',[92.75,28.15,353.4],[.1,1.1,1.8]),
 ('south',[88.05,28.15,358.95],[4.1,1.1,.1]),
 ('inner',[90.05,28.15,356.65],[.1,1.1,4.7])]:
    add('detail-market-terrace-guard-'+id,p,size,C,'glass',role='physical glass boundary; stair entrance remains open')
    cap=p.copy();cap[1]=28.72;cap_size=size.copy();cap_size[1]=.03
    add('detail-market-terrace-cap-'+id,cap,cap_size,C,'cyan',False,bevel=0)
for side in [-1,1]:
    for i in range(20):
        height=24+(i+1)*.18;x=77+(i+.5)*.36
        add('detail-market-stair-guard-'+str(side)+'-'+str(i),[x,height+.55,353.9+side*.98],[.36,1.1,.08],C,role='visible stair edge parapet')
# Closed repair/supply frontage under the terrace is an occupied architectural
# volume, not an advertised interactive interior. Its frontage faces the market.
add('detail-market-shop-volume',[88,25.6,356.5],[3.8,3.2,3.4],C,role='closed supply storefront below public terrace')
add('detail-market-shop-glass',[88,25.7,358.215],[3.1,2.4,.025],C,'glass',False,bevel=0)
add('detail-market-shop-canopy',[88,27.35,358.4],[4.15,.15,.8],C,'steel',role='recessed shop entrance canopy')
add('detail-market-shop-light',[88,27.25,358.6],[2.8,.025,.1],C,'warm',False,bevel=0)
refine_parts('detail-market-shop-volume',[
 ([0,-1.485,0],[3.8,.23,3.4],'steel'),([0,1.49,0],[3.8,.22,3.4],'steel'),
 ([-1.85,0,0],[.1,3.2,3.4],'steel'),([1.85,0,0],[.1,3.2,3.4],'steel'),
 ([0,0,-1.65],[3.8,3.2,.1],'deck'),([0,.03,1.685],[3.5,2.65,.03],'glass'),
 *[([x,.03,1.665],[.065,2.65,.07],'steel')for x in [-1.1,0,1.1]],
 ([0,1.16,.9],[3.4,.045,.12],'warm'),([0,-.85,.55],[2.9,.15,.65],'deck'),
 *[([x,-.4,-1.4],[.25,1.1,.05],'warm')for x in [-1.3,-.65,0,.65,1.3]]])
add('detail-market-shop-fascia',[88,26.94,358.24],[3.4,.36,.05],C,'steel',False,bevel=0)
label('detail-market-shop-sign','REPAIR + SUPPLY',[88,26.88,358.272],3.0,C)
# Familiar human-scale stall detail stays within the previously physical
# counters/canopies, with no new prop in the civilian or rescue circulation.
for side in ['west','east']:
    counter=next(r for r in records if r['id']=='market-counter-'+side)
    refine_parts(counter['id'],[
      ([0,-.35,0],[4,.2,2],'steel'),([0,.38,0],[4,.14,2],'deck'),
      ([-1.91,0,0],[.18,.9,2],'steel'),([1.91,0,0],[.18,.9,2],'steel'),
      ([0,-.02,-.92],[3.64,.62,.16],'steel'),([0,-.02,.96],[3.64,.62,.08],'glass'),
      ([0,.18,.89],[3.6,.035,.04],'warm')])
    canopy=next(r for r in records if r['id']=='market-canopy-'+side)
    refine_parts(canopy['id'],[
      ([0,.11,0],[4.5,.08,2.5],'steel'),([0,-.105,1.18],[4.5,.09,.14],'steel'),
      ([0,-.105,-1.18],[4.5,.09,.14],'steel'),
      *[([x,-.02,0],[.1,.2,2.5],'steel')for x in [-2.2,-1.1,0,1.1,2.2]],
      ([0,-.135,.82],[3.6,.03,.10],'warm'),([0,-.135,-.82],[3.6,.03,.10],'warm')])
    x,y,z=canopy['center']
    add('detail-market-stall-fascia-'+side,[x,y-.05,z+1.27],[4.5,.4,.04],C,'steel',False,bevel=0)
    label('detail-market-stall-sign-'+side,'MARKET / '+('01'if side=='west'else'02'),[x,y-.10,z+1.295],3.8,C)
# A public upper balcony has a human-scale sheltered destination, rather than
# being only a stair landing. Posts sit against its existing closed boundaries.
for x in [86.16,89.94]:
    for z in [354.49,358.84]:
        add('detail-market-terrace-post-'+str(x)+'-'+str(z),[x,29.48,z],[.1,3.76,.1],C,role='terrace canopy support on the commercial deck boundary')
add('detail-market-terrace-roof',[88.05,31.45,356.65],[4.3,.18,4.9],C,'deck',walkable=True,role='sheltered upper commercial terrace roof')
add('detail-market-terrace-roof-trim',[88.05,31.41,359.115],[4.3,.06,.025],C,'cyan',False,bevel=0)
for z in [355.1,356.65,358.2]:
    add('detail-market-terrace-ceiling-'+str(z),[88.05,31.345,z],[3.3,.025,.09],C,'warm',False,bevel=0)

# The observation crown uses a different long-axis silhouette. Its two feet
# sit outside the rail lanes, run-up, pursuit interception and kiosk stances.
C='SM_V02_LANDMARKS'
for z in [413.2,426.8]:
    add('detail-observation-crown-foot-'+str(z),[82.7,134.5,z],[.6,13,.6],C,role='supported observation crown')
    add('detail-observation-crown-light-'+str(z),[82.385,135,z],[.025,11,.1],C,'cyan',False,bevel=0)
add('detail-observation-crown-header',[82.7,141.2,420],[.8,.6,14.2],C,role='observation crown header')
add('detail-observation-crown-warm',[82.7,140.88,420],[.15,.025,11],C,'warm',False,bevel=0)
# The observation roof deliberately has an asymmetric comb silhouette. A
# continuous edge beam bears on both crown feet; cantilever ribs reach west.
add('detail-observation-edge-beam',[82.7,139.95,420],[.7,.6,13.6],C,role='observation canopy load beam connecting the two supported feet')
for i in range(11):
    z=413.8+i*1.24;length=3.2+.6*math.sin(i*math.pi/10)
    add('detail-observation-canopy-rib-'+str(i),[82.7-length/2,139.95,z],[length,.22,.15],C,role='cantilever observation canopy rib')
    add('detail-observation-canopy-light-'+str(i),[82.7-length/2,139.825,z],[max(.2,length-.45),.025,.07],C,'warm',False,bevel=0)
add('detail-observation-canopy-glass',[80.8,140.10,420],[3.8,.08,13.6],C,'glass',walkable=True,role='glazed observation canopy on supported ribs')
add('detail-observation-west-fascia',[78.87,140.05,420],[.1,.32,13.6],C,role='continuous canopy perimeter fascia')
add('detail-observation-west-light',[78.81,139.92,420],[.025,.045,13.6],C,'cyan',False,bevel=0)
add('detail-observation-sign-board',[80.8,139.72,426.85],[3.9,.55,.10],C,role='observation wayfinding fascia')
label('detail-observation-sign','OBSERVATION / 128M',[80.8,139.65,426.906],3.6,C)
# A separate low pavilion supplies useful shelter and wind protection on the
# public deck. Its west side stays open; the original kiosk and through routes
# remain outside the pavilion. The tall crown is the skyline identity above it.
for x in [78.55,82.65]:
    for z in [414.25,425.75]:
        add('detail-observation-pavilion-post-'+str(x)+'-'+str(z),[x,129.795,z],[.10,3.59,.10],C,role='observation pavilion support on its own existing floor')
add('detail-observation-pavilion-roof',[80.6,131.7,420],[4.2,.22,11.6],C,'deck',walkable=True,role='human-scale public observation shelter')
for sign,z in [('north',414.2),('south',425.8)]:
    add('detail-observation-windscreen-'+sign,[80.6,129.1,z],[4.2,2.2,.1],C,'glass',role='visible physical windscreen; pavilion west entrance stays open')
    add('detail-observation-windscreen-cap-'+sign,[80.6,130.22,z],[4.2,.04,.1],C,'steel',False,bevel=0)
for z in [415.5,418.5,421.5,424.5]:
    add('detail-observation-pavilion-ceiling-'+str(z),[80.6,131.575,z],[3.4,.025,.10],C,'warm',False,bevel=0)

# Flush side/front detailing leaves the central measured wall-climb band clear.
for height in [96,108,120,128]:
    parent=next(r for r in base['records']if r['id']=='mastery-wall-room-'+str(height))
    x,y,z=parent['center'];sx,sy,sz=parent['size'];C=parent['collection']
    for sign in [-1,1]:
        add('detail-wall-room-fin-'+str(height)+'-'+str(sign),[x+sign*(sx/2-.22),y,z+sz/2+.025],[.10,max(.2,sy-.8),.025],C,'cyan',False,bevel=0,sourceSurface=parent['id'],role='flush flank marker outside central climb band')

# Merge by spatial zone while retaining complete per-component material sets.
# Each exported chunk therefore contains all geometry of its recordIDs; the
# existing runtime coordinate validator remains authoritative without a bypass.
groups={}
bpy.context.view_layer.update()
for record in records:
    obj=bpy.data.objects[record['id']];obj.update_tag();zone=f'{int(record["center"][1]//28):02d}-{int(record["center"][2]//60):02d}'
    batch=groups.setdefault(zone,{'verts':[],'faces':[],'materialIndices':[],'uv':[],'records':[]})
    start=len(batch['verts']);matrix=obj.matrix_world
    batch['verts'].extend([tuple(matrix@v.co)for v in obj.data.vertices])
    palette=list(materials)
    for poly in obj.data.polygons:
        batch['faces'].append(tuple(start+i for i in poly.vertices))
        material=obj.data.materials[poly.material_index];kind=next(k for k,v in materials.items()if v==material)
        batch['materialIndices'].append(palette.index(kind))
        batch['uv'].append([tuple(obj.data.uv_layers.active.data[i].uv)for i in poly.loop_indices])
    batch['records'].append(record['id'])
chunks=[]
for zone,batch in groups.items():
    name='v02-detailed-'+zone;mesh=bpy.data.meshes.new(name);mesh.from_pydata(batch['verts'],[],batch['faces']);mesh.update()
    for material in materials.values():mesh.materials.append(material)
    uv=mesh.uv_layers.new(name='Metres_2_4')
    for poly,index,coords in zip(mesh.polygons,batch['materialIndices'],batch['uv']):
        poly.material_index=index
        for loop,value in zip(poly.loop_indices,coords):uv.data[loop].uv=value
    obj=bpy.data.objects.new(name,mesh);bpy.data.collections['SM_V02_EXPORT'].objects.link(obj)
    obj['v02Chunk']=name;obj['runtimeIDs']=json.dumps(batch['records'])
    bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
    file=OUT/(name+'.glb')
    bpy.ops.export_scene.gltf(filepath=str(file),export_format='GLB',use_selection=True,export_yup=True,export_extras=True,export_materials='EXPORT',export_tangents=True)
    chunks.append({'id':name,'url':str(file.relative_to(R)),'sha256':sha(file),'bytes':file.stat().st_size,'triangles':sum(max(0,len(f)-2)for f in batch['faces']),'recordIDs':batch['records']})

support_connections=[{'lower':'detail-market-shop-volume','upper':'detail-market-upper-west'},
 {'lower':'suspended-market','upper':'detail-market-shop-volume'}]
for record in records:
    id=record['id']
    if id.startswith('detail-market-terrace-post-'):
        support_connections.extend([{'lower':'detail-market-upper-west','upper':id},{'lower':id,'upper':'detail-market-terrace-roof'}])
    if id.startswith('detail-observation-pavilion-post-'):
        support_connections.extend([{'lower':'observation-deck-opening-1','upper':id},{'lower':id,'upper':'detail-observation-pavilion-roof'}])
metadata={**base,'schema':'sm-v02-detailed-1','records':records,'chunks':chunks,'phase4GateSHA256':sha(D/'V02_Phase4_Gate.json'),
 'supportConnections':support_connections,
 'acceptedGrayboxManifestSHA256':sha(BASE),'architectureStage':'first detailed authoring pass; validation pending',
 'detailedPublicRoutes':[{'id':'market-upper-terrace','ability':'stairs','requiredAfterstepImpulses':0,
  'path':[[76,24,353.9],[76.95,24,353.9],[84.3,27.6,353.9],[85.1,27.6,353.4],[88,27.6,353.4],[88,27.6,357]]}],
 'status':'DETAILED CANDIDATE; new geometry, rendering and gameplay acceptance pending'}
terrace=metadata['detailedPublicRoutes'][0]
terrace['path']=[*terrace['path'][:2],*[[77+(i+.5)*.36,24+(i+1)*.18,353.9]for i in range(20)],*terrace['path'][2:]]
metadata['paths']['market-terrace']={'segments':[{'from':24,'to':27.6,'points':terrace['path']}],'endHeight':27.6}
nav=metadata['navigation']
nav['nodes'].extend([{'id':'detail-market-stair-entry','position':terrace['path'][0],'kind':'public-stair-access'},
                    {'id':'detail-market-upper-terrace','position':terrace['path'][-1],'kind':'commercial-terrace'}])
access=[[64,24,356],[64,24,357],[76,24,357],terrace['path'][0]]
for id,a,b,path,ability in [('detail-market-access','poi-market','detail-market-stair-entry',access,'run'),
                         ('detail-market-ascent','detail-market-stair-entry','detail-market-upper-terrace',terrace['path'],'stairs')]:
    assert a in {n['id']for n in nav['nodes']} and b in {n['id']for n in nav['nodes']}
    for reverse in [False,True]:
        points=path[::-1]if reverse else path
        nav['edges'].append({'id':id+('-return'if reverse else''),'source':b if reverse else a,'destination':a if reverse else b,
          'ability':ability,'path':points,'distance3D':sum(math.dist(x,y)for x,y in zip(points,points[1:])),
          'validation':'AUTHORED; new normal-input acceptance pending','requiredAfterstepImpulses':0})
(OUT/'manifest.json').write_text(json.dumps(metadata,indent=2)+'\n')
for name,key in [('collisions.json','colliders'),('structure_ownership.json','structures')]:
    data=[]
    for r in records:
        if key=='colliders' and r['solid']:
            data.append({k:r[k]for k in ['id','owner','box','solid','walkable','stair','stairLanding','flight','stepRise']if k in r})
        elif key=='structures':data.append({'id':r['id'],'owner':r['owner'],'collection':r['collection'],'operation':'preserved accepted geometry or visible detailed addition','nonDestructible':True})
    (OUT/name).write_text(json.dumps({'sourceManifestSHA256':sha(OUT/'manifest.json'),key:data},indent=2)+'\n')
anchors=json.loads((R/'assets/city/vertical-v02/graybox/threadrail_surfaces.json').read_text())
anchors.update(sourceManifestSHA256=sha(OUT/'manifest.json'),status='Detailed source surfaces; normal-input validation pending',
               physicalSurfaceColliders=[{k:r[k]for k in ['id','owner','box']}for r in records if r['solid']],
               physicalSurfaceGeometry=[{'id':c['id'],'url':c['url'],'recordIDs':c['recordIDs']}for c in chunks])
(OUT/'threadrail_surfaces.json').write_text(json.dumps(anchors,indent=2)+'\n')
bpy.data.collections['SM_V02_EXPORT'].hide_viewport=True;bpy.data.collections['SM_V02_EXPORT'].hide_render=True
bpy.context.scene['v02AuthoringStage']='phase5 detailed candidate'
bpy.context.scene['acceptedGrayboxMasterSHA256']=sha(MASTER)
target=D/'blender/SaintMeridian_V02_Detailed_Master.blend'
bpy.ops.wm.save_as_mainfile(filepath=str(target))
report={'status':'FIRST DETAILED AUTHORING PASS; validation pending','master':str(target.relative_to(R)),'masterSHA256':sha(target),
 'sourcePhase4GateSHA256':sha(D/'V02_Phase4_Gate.json'),'sourceGrayboxManifestSHA256':sha(BASE),'authoringScriptSHA256':SCRIPT_SHA,
 'refinedBevelComponents':refined,'physicalGlassParapets':glass_guards,'baseRecords':len(base['records']),
 'newRecords':len(records)-len(base['records']),'chunks':len(chunks),'triangles':sum(c['triangles']for c in chunks),
 'bytes':sum(c['bytes']for c in chunks),'originalBuildingCopiesExported':0,
 'remaining':['Export integrity, original-volume/route sweeps and real game import','Upper commercial stair input acceptance','Reference views and landmark silhouette refinement','Gameplay/camera/performance regression and later transit/world-life phases']}
(D/'V02_Detailed_Authoring.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
