"""Read both saved masters; independently check declared changes and source invariants."""
import bpy,bmesh,json,hashlib,array
from pathlib import Path
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();read=lambda p:json.loads(p.read_text());report=read(D/'V02_Coffered_Authoring.json');base=read(R/'assets/city/vertical-v02/transit-world/manifest.json');candidate=read(R/'assets/city/vertical-v02/coffered/manifest.json');world=read(D/'V02_LiveWorld_Authoritative.json');changed={c['id']for c in report['changedSlabs']}
assert base['records']==candidate['records'] and base['navigation']==candidate['navigation'] and base['paths']==candidate['paths'] and base['stationPublicRoute']==candidate['stationPublicRoute']
def fingerprint(o):
 a=array.array('f',[0])*(len(o.data.vertices)*3);o.data.vertices.foreach_get('co',a);uv=array.array('f',[0])*(len(o.data.loops)*2)
 if o.data.uv_layers:o.data.uv_layers.active.data.foreach_get('uv',uv)
 return hashlib.sha256(a.tobytes()+uv.tobytes()+json.dumps({'matrix':[list(row)for row in o.matrix_world],'faces':[(list(p.vertices),p.material_index)for p in o.data.polygons],'materials':[m.name for m in o.data.materials]}).encode()).hexdigest()
master=R/report['sourceMaster'];assert sha(master)==report['sourceMasterSHA256'];bpy.ops.wm.open_mainfile(filepath=str(master));bpy.context.view_layer.update();ids=[r['id']for r in base['records']]+[b['id']for b in world['buildings']]+['Facade fittings / '+c['owner']for c in read(R/'assets/city/vertical-v02/visual/facades.json')['chunks']];before={id:fingerprint(bpy.data.objects[id])for id in ids}
master=R/report['master'];assert sha(master)==report['masterSHA256'];bpy.ops.wm.open_mainfile(filepath=str(master));bpy.context.view_layer.update();maximum=0;tops=0
for id in ids:
 o=bpy.data.objects[id]
 if id not in changed:assert fingerprint(o)==before[id],id;continue
 r=next(r for r in base['records']if r['id']==id);bm=bmesh.new();bm.from_mesh(o.data);assert all(e.is_manifold for e in bm.edges),id;bm.free()
 points=[o.matrix_world@v.co for v in o.data.vertices];lo=[min(p[k]for p in points)for k in[0,2,1]];hi=[max(p[k]for p in points)for k in[0,2,1]];lo[2],hi[2]=-hi[2],-lo[2];err=max(abs(bounds[i]-r['box'][key][i])for key,bounds in[('min',lo),('max',hi)]for i in range(3));maximum=max(maximum,err);assert err<.0001,id
 top=[p for p in o.data.polygons if p.normal.z>.999];assert abs(sum(p.area for p in top)-r['size'][0]*r['size'][2])<.003,id;assert all(abs((o.matrix_world@o.data.vertices[i].co).z-r['box']['max'][1])<.0001 for p in top for i in p.vertices),id;tops+=len(top)
finish=report.get('lookFinish');assert finish
definition=read(R/finish['definition']);assert sha(R/finish['definition'])==finish['sha256']
for name in ['V02_deck','V02_steel']:
 nodes=[n for n in bpy.data.materials[name].node_tree.nodes if n.type=='EMISSION'];assert len(nodes)==1;assert max(abs(nodes[0].inputs['Color'].default_value[i]-definition['colorLinear'][i])for i in range(3))<.000001
assert len(changed)==110
result={'status':'PASS independent saved-source mesh/UV/material/transform preservation and coffered top/envelope/manifold checks','masterSHA256':sha(master),'sourceMasterSHA256':report['sourceMasterSHA256'],'authoringSHA256':sha(D/'V02_Coffered_Authoring.json'),'fillDefinitionSHA256':finish['sha256'],'fillColorLinear':definition['colorLinear'],'changedSlabs':len(changed),'unchangedArchitecturalObjects':len(base['records'])-len(changed),'unchangedOriginalBuildings':len(world['buildings']),'unchangedFacadeOwners':3,'closedManifoldChangedSlabs':len(changed),'flatTopFaces':tops,'maximumEnvelopeErrorMetres':maximum,'fixtureMountsOnRibs':len(report['fixtureMountsOnRibs']),'navigationAndContactMetadataUnchanged':True,'scope':'Saved-source checks only; actual GLB and native collision/support/attachment checks remain separate.'};(D/'V02_Coffered_Master_Validation.json').write_text(json.dumps(result,indent=2)+'\n');print(result)
