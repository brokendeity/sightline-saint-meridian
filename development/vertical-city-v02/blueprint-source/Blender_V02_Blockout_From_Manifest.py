"""Proposed V02 Saint Meridian architectural blockout for Blender 4.x.

NOT an approved live-level export. The original building proxies derive from the
prior reconstructed plan and should be replaced by current runtime world data.

Run from Blender: blender --background --python Blender_V02_Blockout_From_Manifest.py
Run in a NEW Blender file only. Does not write into game source or commit assets.
"""
from pathlib import Path
import json, csv, math
import bpy
from mathutils import Vector

ROOT=Path(__file__).resolve().parent
PLAN=json.loads((ROOT/'V02_CurrentBranch_SiteStudy_Manifest.json').read_text())
source=PLAN['new_v02']
scene=bpy.context.scene
scene.unit_settings.system='METRIC';scene.unit_settings.scale_length=1.0
# Coordinates from Three.js game X,Y(height),Z(depth) -> Blender X,-Z,Y

def B(x,y,z):return (float(x),-float(z),float(y))

def collection(name):
 c=bpy.data.collections.get(name) or bpy.data.collections.new(name)
 if c.name not in scene.collection.children:scene.collection.children.link(c)
 return c

reference=collection('00_EXISTING_LOTS_PROXY_NOT_AUTHORITATIVE')
current=collection('01_V1_RECORDED_GEOMETRY_SCHEMATIC')
proposal=collection('02_V2_PROPOSED_STRUCTURES_NOT_VALIDATED')
graph=collection('03_V2_NAV_GRAPH_PROPOSED')
notes=collection('04_PROVENANCE_AND_CAMERAS')
materials={}

def mat(name,color):
 if name in materials:return materials[name]
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*color,1);bs.inputs['Roughness'].default_value=.65
 materials[name]=m;return m

MAT={
 'proxy':mat('Schematic / older footprint reference',(0.18,.34,.46)),
 'v1':mat('V1 / admitted structure',(.23,.72,.67)),
 'bad':mat('V1 / rejected DO NOT BUILD',(.95,.21,.29)),
 'v2':mat('V2 / proposal - unverified',(.23,.82,.9)),
 'graph':mat('V2 / route topology',(.72,.54,.95)),
 'hub':mat('V2 / encounter hub',(.95,.66,.3)),
 'train':mat('V1 / train guide y100',(.95,.7,.35)),
 'traffic':mat('V1 / traffic lanes',(.51,.55,.95)),
}

def move_to(obj,col):
 for c in list(obj.users_collection):c.objects.unlink(obj)
 col.objects.link(obj)

def cube(name,loc,scale,material,col,meta=None):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.dimensions=scale
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 move_to(o,col);o.data.materials.append(material)
 o['source_status']=('REFERENCE PROXY' if col==reference else 'PROPOSED UNTESTED' if col in (proposal,graph) else 'SCHEMATIC')
 for k,v in (meta or {}).items():o[k]=v if isinstance(v,(int,float,str,bool)) else str(v)
 return o

def link(name,a,b,r,material,col,meta=None):
 p0,p1=Vector(a),Vector(b)
 mid=(p0+p1)*.5;vec=p1-p0
 bpy.ops.mesh.primitive_cylinder_add(vertices=10,radius=r,depth=max(.00001,vec.length),location=mid)
 o=bpy.context.object;o.name=name;o.rotation_euler=vec.to_track_quat('Z','Y').to_euler();move_to(o,col);o.data.materials.append(material)
 for k,v in (meta or {}).items():o[k]=str(v)
 return o

# Original reconstructed lots are VIEWPORT REFERENCE ONLY. Do not export into runtime!
with (ROOT/'V02_Existing_Buildings_ReferenceOnly.csv').open() as f:
 for b in csv.DictReader(f):
  x,z,h,w,d=map(lambda k:float(b[k]),('x','z','h','w','d'))
  cube('REF_'+b['id'],B(x,h/2,z),(w,d,h),MAT['proxy'],reference,{'original_id':b['id'],'source':'OLDER RECONSTRUCTED LOT - NOT RUNTIME VERIFIED'})

# V1 recorded bridges: schematic boxes only. Rejected crossing is not in current game.
for br in PLAN['verified_branch_facts']['current_bridge_decks']:
 y,z=br['y'],br['z']
 o=cube(br['id']+'_'+br['status'],B(80,y-.3,z),(50,7,.6),MAT['bad' if br['status']=='rejected' else 'v1'],current,br)
 o.hide_render = (br['status']=='rejected')

# V1 train: route is loop, shown as simplified guide; the actual train moves in Three.js
train_pts=[(80,100,180),(80,100,250),(80,100,390),(80,100,460),(83,100,470),(87,100,450),(87,100,300),(87,100,190),(83,100,170),(80,100,180)]
for k,(a,b) in enumerate(zip(train_pts,train_pts[1:])):
 link('V1_TRAIN_ROUTE_SEG'+str(k),B(*a),B(*b),.3,MAT['train'],current,{'not_track_geometry':True})

# V1 three traffic loops: path projections shown as guideline, not collision envelopes
for i,h in enumerate((38,65,114)):
 points=[(76,h,185),(76,h,450),(80,h,470),(84,h,440),(84,h,190),(80,h,165),(76,h,185)]
 for j,(a,b) in enumerate(zip(points,points[1:])):
  link(f'V1_SCENIC_TRAFFIC_Y{h}_{j}',B(*a),B(*b),.12,MAT['traffic'],current,{'height_band':h,'scenic':True})

# V02 crossings are schematic/proposed, including bridge replacement for rejected V1 Y52.
for br in source['crossings']:
 cube(br['id'],B(br['x'],br['y']-.3,br['z']),(br['width'],br['depth'],.6),MAT['bad' if br['status']=='redesign' else 'v2'],proposal,br)

# Spines are DRAWN AS SINGLE GUIDES; Codex must segment around actual collisions.
for sp in source['segmented_spines']:
 link(sp['id'],B(sp['x'],sp['y'],sp['z0']),B(sp['x'],sp['y'],sp['z1']),.25,MAT['v2'],proposal,sp)
for tr in source['vertical_transfers']:
 link(tr['id'],B(tr['x'],tr['y0'],tr['z']),B(tr['x'],tr['y1'],tr['z']),.4,MAT['graph'],proposal,tr)
for h in source['hubs']:
 cube(h['id']+'_'+h['type'],B(h['x'],h['y']+.15,h['z']),(7,7,.3),MAT['hub'],proposal,h)

pmap={v['id']:v for v in source['nodes']}
for e in source['edges']:
 a,b=pmap[e['a']],pmap[e['b']]
 link('EDGE_'+e['id'],B(a['x'],a['y']+.85,a['z']),B(b['x'],b['y']+.85,b['z']),.12,MAT['graph'],graph,e)

# Current branch camera references.
for cid,cam in {'A':{'position':[78,132,185],'look':[82,70,400]},'B':{'position':[80,2,185],'look':[80,90,400]}}.items():
 obj=bpy.data.cameras.new('Current V1 Camera '+cid);camobj=bpy.data.objects.new('CAM_'+cid,obj);notes.objects.link(camobj)
 camobj.location=B(*cam['position']);target=Vector(B(*cam['look']));camobj.rotation_euler=(target-camobj.location).to_track_quat('-Z','Y').to_euler();obj.lens=27

# Keep the existing Blender render engine; this script is a schematic scene authoring tool.
scene.render.resolution_x=1600;scene.render.resolution_y=900;scene.render.resolution_percentage=100
for c in [reference,current,proposal,graph,notes]:c['status']='DO NOT EXPORT TO LIVE GAME WITHOUT RUNTIME / COLLISION VALIDATION'
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'SaintMeridian_V02_Schematic_Blockout_UNVERIFIED.blend'))
print('Saved V02 schematic Blender scene. It is intentionally NOT a certified runtime-matched build.')
