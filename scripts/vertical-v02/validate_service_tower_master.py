"""Reopen the saved master independently and inspect actual component meshes."""
import bpy,bmesh,json,hashlib
from pathlib import Path
from mathutils import Vector
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';read=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();author=read(D/'V02_Service_Tower_Authoring.json');plan=read(D/'V02_Service_Tower_Plan.json');master=R/author['master'];assert sha(master)==author['masterSHA256'];bpy.ops.wm.open_mainfile(filepath=str(master));bpy.context.view_layer.update();results=[];proxies=[]
for r in plan['additions']+[x['after']for x in plan['changes']]:
 o=bpy.data.objects[r['id']];points=[o.matrix_world@v.co for v in o.data.vertices];bounds={'min':[min(v[i]for v in points)for i in[0,2,1]],'max':[max(v[i]for v in points)for i in[0,2,1]]};bounds['min'][2],bounds['max'][2]=-bounds['max'][2],-bounds['min'][2]
 assert all(bounds['min'][i]>=r['box']['min'][i]-.0005 and bounds['max'][i]<=r['box']['max'][i]+.0005 for i in range(3)),r['id']
 if r['solid']:
  assert max(abs(bounds[k][i]-r['box'][k][i])for k in['min','max']for i in range(3))<.0005,r['id'];bm=bmesh.new();bm.from_mesh(o.data);assert all(e.is_manifold for e in bm.edges),r['id'];bm.free()
 if r['walkable']:
  top=r['box']['max'][1];flat=[f for f in o.data.polygons if f.normal.z>.999 and all(abs((o.matrix_world@o.data.vertices[i].co).z-top)<.0005 for i in f.vertices)];assert flat and sum(f.area for f in flat)>.7*r['size'][0]*r['size'][2],r['id']
 results.append({'id':r['id'],'solid':r['solid'],'walkable':r['walkable'],'actualBounds':bounds})
 # If a source collision marker exists under an alternate name, it must agree
 # with its authored component instead of retaining the old closed rail span.
 for p in bpy.data.collections['SM_V02_COLLISION'].objects:
  if p.get('sourceComponent')!=r['id']:continue
  assert (p.location-o.location).length<.0005,(r['id'],p.name)
  expected=Vector((r['size'][0]/2,r['size'][2]/2,r['size'][1]/2));assert (p.scale-expected).length<.0005,(r['id'],p.name)
  proxies.append({'component':r['id'],'marker':p.name,'localPosition':list(p.location),'localScale':list(p.scale)})
surfaceChecks=[]
for room,c in zip(plan['rooms'],plan['changes']):
 top=room['roofTop'];old=c['before'];wall=bpy.data.objects[old['id']];roof=bpy.data.objects[room['roofID']]
 # Inspect actual face area, not a bbox-only top assertion. The two disjoint
 # coplanar rectangles cover the entire former8x12m supported roof.
 area=sum(f.area for o in [wall,roof]for f in o.data.polygons if f.normal.z>.999 and all(abs((o.matrix_world@o.data.vertices[i].co).z-top)<.0005 for i in f.vertices))
 expected=old['size'][0]*old['size'][2];assert abs(area-expected)<.002,(room['id'],area,expected)
 frontArea=sum(f.area for f in wall.data.polygons if f.normal.y<-.999 and all(abs(-(wall.matrix_world@wall.data.vertices[i].co).y-room['frontZ'])<.0005 for i in f.vertices))
 assert abs(frontArea-old['size'][0]*old['size'][1])<.002,room['id']
 surfaceChecks.append({'room':room['id'],'originalRoofArea':expected,'actualFlatTopArea':area,'actualOriginalFrontArea':frontArea})
manifest=read(R/'assets/city/vertical-v02/service-tower/manifest.json');door={'min':[59.7,84.03,294.6001],'max':[60.8,86.7999,297.1999]}
blockers=[r['id']for r in manifest['records']if r['solid']and all(r['box']['min'][i]<door['max'][i]-1e-5 and r['box']['max'][i]>door['min'][i]+1e-5 for i in range(3))];assert not blockers,blockers
# Hidden source collision collections may not refresh matrix_world until
# unhidden. Independently compare saved local bases too, so an unchanged cached
# world matrix cannot conceal a stale or accidentally changed collision marker.
def locals_snapshot():
 return {o.name:{'basis':[list(row)for row in o.matrix_basis],'parent':o.parent.name if o.parent else None,'collections':sorted(c.name for c in o.users_collection),'hideRender':o.hide_render,'hideViewport':o.hide_viewport}for o in bpy.data.objects}
current=locals_snapshot();bpy.ops.wm.open_mainfile(filepath=str(R/author['sourceMaster']));original=locals_snapshot();allowed={c['after']['id']for c in plan['changes']}|{c['after']['id']+'__COL'for c in plan['changes']};assert set(original)<=set(current)
localChanges=[n for n in original if current[n]!=original[n]];assert set(localChanges)<=allowed,localChanges
report={'status':'PASS independently reopened source bounds/manifold/flat tops plus complete original roof area and climb-face area','masterSHA256':sha(master),'planSHA256':sha(D/'V02_Service_Tower_Plan.json'),'components':len(results),'solidMeshes':sum(r['solid']for r in results),'walkableTops':sum(r['walkable']for r in results),'sourceCollisionMarkers':proxies,'savedLocalTransformChanges':localChanges,'savedUnrelatedLocalTransformsPreserved':sum(n not in allowed for n in original),'results':results,'surfaceChecks':surfaceChecks,'openEntrance':{'clearVolume':door,'blockers':blockers},'limits':['Source-contact adjacency is not strength certification','Cosmetic grille relief stays inside its declared envelope; only solid component envelopes are exact extrema']};(D/'V02_Service_Tower_Master_Validation.json').write_text(json.dumps(report,indent=2)+'\n');print(report['status'],len(results),'components')
