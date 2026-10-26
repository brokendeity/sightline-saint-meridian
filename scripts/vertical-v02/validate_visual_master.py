"""Inspect the actual saved visual candidate, independently of authoring code."""
import bpy,json,hashlib
from pathlib import Path
from mathutils import Matrix
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();read=lambda p:json.loads(p.read_text());facades=read(R/'assets/city/vertical-v02/visual/facades.json');world=read(D/'V02_LiveWorld_Authoritative.json');geometry={g['id']:g for g in read(D/'V02_BuildingGeometry.json')['geometries']};manifest=read(R/'assets/city/vertical-v02/transit-world/manifest.json');master=R/facades['master'];assert sha(master)==facades['masterSHA256'];bpy.ops.wm.open_mainfile(filepath=str(master));bpy.context.view_layer.update();C=Matrix(((1,0,0,0),(0,0,-1,0),(0,1,0,0),(0,0,0,1)));maximum=0;checked=set()
for b in world['buildings']:
 o=bpy.data.objects[b['id']];g=geometry[b['geometry']]
 if o.data not in checked:
  assert len(o.data.vertices)*3==len(g['positions']);assert max(abs(v.co[k]-g['positions'][i*3+k])for i,v in enumerate(o.data.vertices)for k in range(3))<.000001;checked.add(o.data)
 expected=C@Matrix([b['transform']['matrixWorld'][i::4]for i in range(4)]);assert max(abs(o.matrix_world[i][j]-expected[i][j])for i in range(4)for j in range(4))<.0001
for r in manifest['records']:
 o=bpy.data.objects[r['id']];points=[o.matrix_world@v.co for v in o.data.vertices];lo=[min(p[k]for p in points)for k in[0,2,1]];hi=[max(p[k]for p in points)for k in[0,2,1]];lo[2],hi[2]=-hi[2],-lo[2];error=max(abs(bounds[i]-r['box'][key][i])for key,bounds in[('min',lo),('max',hi)]for i in range(3));maximum=max(maximum,error);assert error<.0001,r['id']
new=[]
for chunk in facades['chunks']:
 o=bpy.data.objects['Facade fittings / '+chunk['owner']];assert o['originalOwner']==chunk['owner']and o['visualOnly'];triangles=sum(len(p.vertices)-2 for p in o.data.polygons);assert triangles==chunk['triangles'];new.append({'owner':chunk['owner'],'sourceMeshVertices':len(o.data.vertices),'triangles':triangles,'bays':len(chunk['bays'])})
fill=read(R/'assets/city/vertical-v02/visual/soffit_fill.json');assert all(bpy.data.materials[name]['sourceSoffitAtlasSHA256']==fill['sha256']for name in['V02_deck','V02_steel'])
report={'status':'PASS actual saved original geometry/transforms, accepted architecture and authored facade meshes','scope':'Source geometry/transform/material provenance, not final visual quality or complete gameplay acceptance.','master':facades['master'],'masterSHA256':sha(master),'facadesSHA256':sha(R/'assets/city/vertical-v02/visual/facades.json'),'originalBuildingGeometrySHA256':sha(D/'V02_BuildingGeometry.json'),'worldManifestSHA256':sha(R/'assets/city/vertical-v02/transit-world/manifest.json'),'originalBuildings':len(world['buildings']),'originalSharedGeometryFamilies':len(checked),'preservedArchitecturalRecords':len(manifest['records']),'maximumArchitecturalBoundsErrorMetres':maximum,'sourceFixtures':fill['fixtureCount'],'newFacadeOwners':new};(D/'V02_Visual_Master_Validation.json').write_text(json.dumps(report,indent=2)+'\n');print(report['status'],sum(c['bays']for c in new),'bays')
