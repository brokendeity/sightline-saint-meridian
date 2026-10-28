"""Independent saved-source geometry, marker and original-object preservation."""
import bpy,bmesh,json,hashlib,sys
from pathlib import Path
from mathutils import Vector
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';sys.path.insert(0,str(Path(__file__).parent));from v02_scene_signatures import signatures
read=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
a=read(D/'V02_Loggia_Terraces_Authoring.json');plan=read(D/'V02_Loggia_Terraces_Plan.json');assert sha(R/a['master'])==a['masterSHA256'];assert sha(R/a['sourceMaster'])==a['sourceMasterSHA256']
bpy.ops.wm.open_mainfile(filepath=str(R/a['master']));bpy.context.view_layer.update();current=signatures();objects={o.name:o for o in bpy.data.objects};markers={}
for o in bpy.data.collections['SM_V02_COLLISION'].objects:
    key=o.get('sourceComponent')or o.name.removesuffix('__COL');markers.setdefault(key,[]).append(o)
results=[]
for r in plan['additions']+[c['after']for c in plan['changes']]:
    o=objects[r['id']];points=[o.matrix_world@v.co for v in o.data.vertices]
    lo=[min(p[i]for p in points)for i in range(3)];hi=[max(p[i]for p in points)for i in range(3)]
    box={'min':[lo[0],lo[2],-hi[1]],'max':[hi[0],hi[2],-lo[1]]}
    assert all(box['min'][i]>=r['box']['min'][i]-.0005 and box['max'][i]<=r['box']['max'][i]+.0005 for i in range(3)),r['id']
    if r['solid']:
        assert max(abs(box[k][i]-r['box'][k][i])for k in ['min','max']for i in range(3))<.0005,r['id']
        bm=bmesh.new();bm.from_mesh(o.data);assert all(e.is_manifold for e in bm.edges),r['id'];bm.free()
        assert markers.get(r['id']),r['id']+' missing physical marker'
    if r['walkable']:
        top=r['box']['max'][1];faces=[f for f in o.data.polygons if f.normal.z>.999 and all(abs((o.matrix_world@o.data.vertices[i].co).z-top)<.0005 for i in f.vertices)]
        assert faces and sum(f.area for f in faces)>.7*r['size'][0]*r['size'][2],r['id']
    for marker in markers.get(r['id'],[]):
        assert (marker.location-o.location).length<.0005,r['id']
        assert (marker.scale-Vector((r['size'][0]/2,r['size'][2]/2,r['size'][1]/2))).length<.0005,r['id']
    results.append({'id':r['id'],'solid':r['solid'],'walkable':r['walkable'],'actualBounds':box})
def locals_snapshot():
    memberships={o.name:[]for o in bpy.data.objects}
    for c in bpy.data.collections:
        for o in c.objects:memberships[o.name].append(c.name)
    return{o.name:{'basis':[list(r)for r in o.matrix_basis],'parent':o.parent.name if o.parent else None,'collections':sorted(memberships[o.name]),'hideRender':o.hide_render,'hideViewport':o.hide_viewport}for o in bpy.data.objects}
current_local=locals_snapshot();bpy.ops.wm.open_mainfile(filepath=str(R/a['sourceMaster']));bpy.context.view_layer.update();prior=signatures();prior_local=locals_snapshot();allowed={c['after']['id']for c in plan['changes']};allowed|={id+'__COL'for id in allowed}
assert all(current[n]==h for n,h in prior.items()if n not in allowed)
assert all(current_local[n]==h for n,h in prior_local.items()if n not in allowed)
changed=[n for n,h in prior.items()if current[n]!=h];assert set(changed)<=allowed
report={'status':'PASS independently reopened component bounds/manifold/flat tops, physical markers and unrelated source geometry/local preservation','masterSHA256':a['masterSHA256'],'sourceMasterSHA256':a['sourceMasterSHA256'],'planSHA256':sha(D/'V02_Loggia_Terraces_Plan.json'),'validatorSHA256':sha(Path(__file__)),'components':len(results),'solidMeshes':sum(r['solid']for r in results),'walkableTops':sum(r['walkable']for r in results),'stairTreads':sum(r.get('stair',False)for r in plan['additions']),'unchangedSourceObjects':sum(n not in allowed for n in prior),'controlledSourceChanges':changed,'results':results,'limits':['Source adjacency is not structural engineering certification','Native headroom, supported movement and camera framing remain separate']}
(D/'V02_Loggia_Terraces_Master_Validation.json').write_text(json.dumps(report,indent=2)+'\n');print(report['status'],len(results),'components',flush=True)
