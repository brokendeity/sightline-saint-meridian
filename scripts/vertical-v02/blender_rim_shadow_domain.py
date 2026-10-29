"""Author a bounded native shadow domain for the existing source SUN.
No city geometry, materials, source light, or previous source file is changed.
Cycles already occludes this SUN; the runtime previously did not shadow it.
"""
import bpy, json, math, hashlib, sys
from pathlib import Path
from mathutils import Vector
sys.path.insert(0,str(Path(__file__).parent))
from v02_saved_scene_snapshots import signatures
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
parent=D/'blender/SaintMeridian_V02_East_Public_Emissive.blend'
assert sha(parent)=='8dead00f5b5a9b268d2ea74765e33347e04488040179a72c5db918c3ec06649f'
master=D/'blender/SaintMeridian_V02_Rim_Shadow_Domain.blend'
folder=R/'assets/city/vertical-v02/rim-shadow';folder.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(parent))
before=signatures()
def lights():
 return {o.name:{'type':o.data.type,'energy':o.data.energy,'color':list(o.data.color),
   'angle':getattr(o.data,'angle',None),'shadow':o.data.use_shadow,
   'rotation':[list(row)for row in o.matrix_basis]} for o in bpy.data.objects if o.type=='LIGHT'}
oldlights=lights()
choices=[o for o in bpy.data.objects if o.type=='LIGHT' and o.data.type=='SUN' and abs(o.data.energy-.25)<1e-6]
assert len(choices)==1
sun=choices[0];assert sun.data.use_shadow
incoming=sun.matrix_basis.to_quaternion()@Vector((0,0,-1))
game=Vector((incoming.x,incoming.z,-incoming.y));expected=-Vector((90,95,140)).normalized()
assert (game-expected).length<3e-7,(sun.name,list(game),list(expected))
assert max(abs(a-b) for a,b in zip(sun.data.color,[1,173/255,118/255]))<1e-7
collection=bpy.data.collections.new('SM_V02_RIM_SHADOW_DOMAIN');bpy.context.scene.collection.children.link(collection)
o=bpy.data.objects.new('V02 existing warm SUN native shadow domain',None);collection.objects.link(o)
o.location=(80,-340,75);o.empty_display_type='CUBE';o.empty_display_size=200;o.hide_render=True
contract={'schema':'sm-v02-existing-rim-shadow-1','parentMaster':str(parent.relative_to(R)),
 'parentMasterSHA256':sha(parent),'master':str(master.relative_to(R)),
 'sourceLight':{'name':sun.name,'type':'SUN','color':list(sun.data.color),'intensity':sun.data.energy,
  'toward':list(game),'sourceAngularDiameterRadians':sun.data.angle,'castsSourceShadows':sun.data.use_shadow},
 'runtimeShadow':{'center':[80,75,340],'lightDistance':650,'halfWidth':220,'halfHeight':210,
  'near':.5,'far':1400,'mapSize':2048,'bias':-.00002,'normalBias':.04,'radius':-1,'filter':'Four nearest depth comparisons with bilinear weights; existing dynamic-light filters remain unchanged'},
 'policy':{'scope':'Bounded static architectural occlusion of the existing warm directional light. Main sun retains dynamic actor shadows.',
  'casters':'Original full building geometry, original fixed facade fittings, and loaded V02 static architectural meshes; no actors, train, aircraft, vegetation or debris.',
  'transparency':'Transparent materials do not cast opaque architectural rim shadows. Mixed original facade glazing requires a per-vertex reflectance depth mask.',
  'invalidation':'Rebuild on source mesh/geometry or saved world-matrix changes and building damage/destruction; source visibility culling does not remove static casters.',
  'fidelity':'PCF depth-map approximation to source SUN occlusion; no claim of Cycles soft-shadow or complete material equivalence.'}}
o['runtimeShadowContract']=json.dumps(contract,sort_keys=True)
o['exportAsGeometry']=False;o['sourceLightName']=sun.name
assert {k:v for k,v in signatures().items() if k in before}==before
assert oldlights==lights()
bpy.ops.wm.save_as_mainfile(filepath=str(master))
bpy.ops.wm.open_mainfile(filepath=str(master))
after=signatures();assert {k:after[k] for k in before}==before;assert oldlights==lights()
assert len(after)==len(before)+1
assert json.loads(bpy.data.objects['V02 existing warm SUN native shadow domain']['runtimeShadowContract'])==contract
contract['masterSHA256']=sha(master)
file=folder/'contract.json';file.write_text(json.dumps(contract,indent=2)+'\n')
report={'status':'PASS authored/reopened source shadow domain; runtime appearance and performance untested',
 'parentMasterSHA256':sha(parent),'masterSHA256':sha(master),'contractSHA256':sha(file),
 'preservedObjects':len(before),'preservedLights':len(oldlights),'sourceLight':contract['sourceLight'],
 'scriptSHA256':sha(Path(__file__))}
(D/'V02_Rim_Shadow_Source.json').write_text(json.dumps(report,indent=2)+'\n')
print(report['status'],report['preservedObjects'])
