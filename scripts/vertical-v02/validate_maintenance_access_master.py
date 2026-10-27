"""Reopen the saved master independently and inspect actual component meshes."""
import bpy,bmesh,json,hashlib
from pathlib import Path
from mathutils import Vector
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';read=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();author=read(D/'V02_Maintenance_Access_Authoring.json');plan=read(D/'V02_Maintenance_Access_Plan.json');master=R/author['master'];assert sha(master)==author['masterSHA256'];bpy.ops.wm.open_mainfile(filepath=str(master));bpy.context.view_layer.update();results=[];proxies=[]
collisionMarkers={}
for marker in bpy.data.collections['SM_V02_COLLISION'].objects:
 key=marker.get('sourceComponent')
 if key:collisionMarkers.setdefault(key,[]).append(marker)
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
 for p in collisionMarkers.get(r['id'],[]):
  assert (p.location-o.location).length<.0005,(r['id'],p.name)
  expected=Vector((r['size'][0]/2,r['size'][2]/2,r['size'][1]/2));assert (p.scale-expected).length<.0005,(r['id'],p.name)
  proxies.append({'component':r['id'],'marker':p.name,'localPosition':list(p.location),'localScale':list(p.scale)})
surfaceChecks=[]
manifest=read(R/'assets/city/vertical-v02/maintenance-access/manifest.json')
for door in plan['doors']+[{'center':[49.2,floor,299.5],'clearWidth':2.6,'clearHeight':2.8}for floor in [84,96,108,120]]:
 x,y,z=door['center'];volume={'min':[x-.1,y+.03,z-1.2999],'max':[x+.3,y+2.7999,z+1.2999]};blockers=[r['id']for r in manifest['records']if r['solid']and all(r['box']['min'][i]<volume['max'][i]-1e-5 and r['box']['max'][i]>volume['min'][i]+1e-5 for i in range(3))];assert not blockers,(door,blockers)
 surfaceChecks.append({'door':door,'clearVolume':volume,'blockers':blockers})
assert sum(r.get('stair',False)for r in plan['additions'])==204
# Hidden source collision collections may not refresh matrix_world until
# unhidden. Independently compare saved local bases too, so an unchanged cached
# world matrix cannot conceal a stale or accidentally changed collision marker.
def locals_snapshot():
 memberships={o.name:[]for o in bpy.data.objects}
 for collection in bpy.data.collections:
  for obj in collection.objects:memberships[obj.name].append(collection.name)
 return {o.name:{'basis':[list(row)for row in o.matrix_basis],'parent':o.parent.name if o.parent else None,'collections':sorted(memberships[o.name]),'hideRender':o.hide_render,'hideViewport':o.hide_viewport}for o in bpy.data.objects}
current=locals_snapshot();bpy.ops.wm.open_mainfile(filepath=str(R/author['sourceMaster']));original=locals_snapshot();allowed={c['after']['id']for c in plan['changes']}|{c['after']['id']+'__COL'for c in plan['changes']};assert set(original)<=set(current)
localChanges=[n for n in original if current[n]!=original[n]];assert set(localChanges)<=allowed,localChanges
report={'status':'PASS independently reopened source bounds/manifold/flat tops plus 204 actual treads and seven complete doorway clearances','masterSHA256':sha(master),'planSHA256':sha(D/'V02_Maintenance_Access_Plan.json'),'components':len(results),'solidMeshes':sum(r['solid']for r in results),'walkableTops':sum(r['walkable']for r in results),'sourceCollisionMarkers':proxies,'savedLocalTransformChanges':localChanges,'savedUnrelatedLocalTransformsPreserved':sum(n not in allowed for n in original),'results':results,'surfaceChecks':surfaceChecks,'stairTreads':204,'clearDoorVolumes':surfaceChecks,'limits':['Source-contact adjacency is not strength certification','Cosmetic grille relief stays inside its declared envelope; only solid component envelopes are exact extrema']};(D/'V02_Maintenance_Access_Master_Validation.json').write_text(json.dumps(report,indent=2)+'\n');print(report['status'],len(results),'components')
