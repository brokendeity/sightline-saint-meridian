"""Inspect the saved detailed Blender master, independent of generated bounds."""
import bpy,json,hashlib
from pathlib import Path
from mathutils import Vector
R=Path(__file__).resolve().parents[2]
D=R/'development/vertical-city-v02'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
MP=R/'assets/city/vertical-v02/detailed/manifest.json'
master=D/'blender/SaintMeridian_V02_Detailed_Master.blend'
m=json.loads(MP.read_text());gate=json.loads((D/'V02_Phase4_Gate.json').read_text())
assert Path(bpy.data.filepath).resolve()==master
assert sha(D/'blender/SaintMeridian_V02_AAA_Master.blend')==gate['masterSHA256']
assert len(bpy.data.collections['SM_EXISTING_REFERENCE'].objects)==310
maximum=0;materials=set();uv_count=0;actual_bounds={}
for record in m['records']:
    obj=bpy.data.objects[record['id']]
    assert obj in bpy.data.collections[record['collection']].objects.values()
    assert obj['solid']==record['solid'] and obj['walkable']==record['walkable']
    assert obj['runtimeOwner']==record['owner']
    points=[obj.matrix_world@Vector(v)for v in obj.bound_box]
    game=[[p.x,p.z,-p.y]for p in points]
    bounds={key:[fn(p[i]for p in game)for i in range(3)]for key,fn in [('min',min),('max',max)]}
    error=max(abs(bounds[key][i]-record['box'][key][i])for key in ['min','max']for i in range(3))
    assert error<5e-5,(record['id'],error,bounds,record['box'])
    maximum=max(maximum,error)
    actual_bounds[record['id']]=bounds
    assert obj.data.uv_layers and len(obj.data.uv_layers.active.data)==len(obj.data.loops)
    uv_count+=1;materials.update(mat.name for mat in obj.data.materials)
    if record['solid']:assert bpy.data.objects.get(record['id']+'__COL') is not None
assert materials=={'V02_deck','V02_steel','V02_glass','V02_cyan','V02_warm'}
images=[]
for name in ['BaseColor','Roughness','Normal']:
    image=bpy.data.images['V02_MetalPanel_'+name]
    assert tuple(image.size)==(512,512) and image.packed_file
    assert image.colorspace_settings.name==('sRGB'if name=='BaseColor'else'Non-Color')
    images.append({'name':image.name,'size':list(image.size),'colorSpace':image.colorspace_settings.name,'packed':True})
assert bpy.data.collections['SM_V02_EXPORT'].hide_render
supports=[]
for pair in m['supportConnections']:
    lower,upper=(actual_bounds[pair[k]]for k in ['lower','upper'])
    gap=upper['min'][1]-lower['max'][1]
    overlap=[min(lower['max'][i],upper['max'][i])-max(lower['min'][i],upper['min'][i])for i in [0,2]]
    assert abs(gap)<5e-5 and min(overlap)>0,(pair,gap,overlap)
    supports.append({**pair,'gapMetres':gap,'horizontalOverlapMetres':overlap})
report={'status':'PASS saved detailed Blender bounds, materials, UVs, images and reference exclusion',
 'scope':__doc__.strip()+' Source inspection only; live movement, visual matching and performance require their separate evidence.',
 'masterSHA256':sha(master),'manifestSHA256':sha(MP),'phase4MasterUnchanged':True,
 'components':len(m['records']),'maximumBoundsErrorMetres':maximum,'uvComponents':uv_count,
 'materials':sorted(materials),'packedPBRImages':images,'referenceBuildingObjects':310,
 'supportContacts':supports,'supportScope':'Measured saved-mesh envelope contacts for the new market/observation pavilion supports; not a structural engineering certification',
 'originalCopiesExported':sum(id.startswith('building-')for c in m['chunks']for id in c['recordIDs'])}
assert report['originalCopiesExported']==0
(D/'V02_Detailed_Authoring_Validation.json').write_text(json.dumps(report,indent=2)+'\n')
print(report['status'],report['components'])
