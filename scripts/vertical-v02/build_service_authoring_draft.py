"""Prepare the next Blender source revision while runtime acceptance is frozen.

No active master, runtime chunk, manifest or HTML is changed. The draft uses the
exact existing authoring helpers, then checks actual mesh bounds and original
building clearance before saving. This is source evidence, not gameplay proof.
"""
import ast,bpy,bmesh,hashlib,json,math
from pathlib import Path
from mathutils import Vector
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
original=D/'blender/SaintMeridian_V02_Detailed_Master.blend';mp=R/'assets/city/vertical-v02/detailed/manifest.json'
original_hash=sha(original);manifest_hash=sha(mp)
base=json.loads(mp.read_text());records=json.loads(json.dumps(base['records']))
bpy.ops.wm.open_mainfile(filepath=str(original))
materials={name:bpy.data.materials['V02_'+name]for name in ['deck','steel','cyan','warm','glass']}
script=R/'scripts/vertical-v02/blender_architecture.py';code=script.read_text();tree=ast.parse(code)
names={'uv_mesh','compound_mesh','add','refine_parts','label'}
for node in tree.body:
    if isinstance(node,ast.Assign)and any(isinstance(t,ast.Name)and t.id in ['V','F']for t in node.targets):exec(ast.get_source_segment(code,node),globals())
    if isinstance(node,ast.FunctionDef)and node.name in names:exec(ast.get_source_segment(code,node),globals())
assert all(name in globals()for name in names)
import sys
sys.path.insert(0,str(script.parent))
from apply_reference_appearance import apply
from architecture_service_detail import build
appearance=apply(bpy,R,D);service=build(globals());bpy.context.view_layer.update()
new=[r for r in records if r['id']not in {r['id']for r in base['records']}]
modified=[r for r in records if r['id']in service['preservedContactRecords']]
maximum=0
for r in new+modified:
    obj=bpy.data.objects[r['id']];points=[obj.matrix_world@Vector(v)for v in obj.bound_box]
    game=[[v.x,v.z,-v.y]for v in points]
    box={key:[fn(p[i]for p in game)for i in range(3)]for key,fn in [('min',min),('max',max)]}
    error=max(abs(box[key][i]-r['box'][key][i])for key in ['min','max']for i in range(3));maximum=max(maximum,error)
    assert error<5e-5,(r['id'],box,r['box'])
world=json.loads((D/'V02_LiveWorld_Authoritative.json').read_text())
conflicts=[{'new':r['id'],'original':p['id']}for r in new for b in world['buildings']for p in b['parts']
 if all(r['box']['min'][i]<p['box']['max'][i]-1e-5 and r['box']['max'][i]>p['box']['min'][i]+1e-5 for i in range(3))]
assert not conflicts,conflicts
target=D/'blender/SaintMeridian_V02_Service_Architecture_Draft.blend'
bpy.context.scene['v02DraftPolicy']='New service architecture and original reference appearance; runtime export not promoted'
bpy.ops.wm.save_as_mainfile(filepath=str(target))
assert sha(original)==original_hash and sha(mp)==manifest_hash
report={'status':'PASS saved source draft bounds/original-volume clearance; runtime export and native acceptance pending',
 'scope':__doc__.strip(),'master':str(target.relative_to(R)),'masterSHA256':sha(target),
 'sourceMasterSHA256':original_hash,'sourceManifestSHA256':manifest_hash,'activeFilesUnchanged':True,
 'helperSourceSHA256':sha(script),'serviceModuleSHA256':sha(R/'scripts/vertical-v02/architecture_service_detail.py'),
 'referenceModuleSHA256':sha(R/'scripts/vertical-v02/apply_reference_appearance.py'),
 'referenceAppearance':appearance,'newRecords':new,'modifiedRecords':modified,'maximumNewBoundsError':maximum,
 'originalVolumeConflicts':conflicts,'remaining':['Promotion through the normal detailed exporter','Recorded-input compatibility','Native service combat/flank/Echo and camera review']}
(D/'V02_Service_Architecture_Draft.json').write_text(json.dumps(report,indent=2)+'\n')
print(report['status'],len(new),'new records;',len(modified),'existing contact envelopes unchanged')
