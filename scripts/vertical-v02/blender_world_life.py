"""Preserve the accepted station master; add current routes and shared fleet.

No architectural geometry or runtime GLBs are exported or changed here.
"""
import bpy,json,hashlib,sys
from pathlib import Path
from mathutils import Vector,Quaternion
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();read=lambda p:json.loads(p.read_text())
master=D/'blender/SaintMeridian_V02_World_Life_Master.blend';snapshot=read(D/'V02_World_Life_Authoring_Snapshot.json');assets=read(R/'assets/city/vertical-v02/world-life/air_assets.json');station=read(D/'V02_Transit_Station_Evidence.json');mp=R/'assets/city/vertical-v02/transit-world/manifest.json';manifest=read(mp)
assert all(sha(R/f)==h for f,h in snapshot['sources'].items())
def game(p):return(p[0],-p[2],p[1])
if '--validate' not in sys.argv:
 source=R/station['master'];assert sha(source)==station['masterSHA256'];bpy.ops.wm.open_mainfile(filepath=str(source))
 col=bpy.data.collections['SM_V02_AERIAL_TRAFFIC_ROUTES']
 for o in list(col.objects):bpy.data.objects.remove(o,do_unlink=True)
 ambient=bpy.data.collections.new('SM_V02_AMBIENT_ACTIVITY');bpy.context.scene.collection.children.link(ambient)
 preview=bpy.data.collections.new('SM_V02_SHARED_FLEET_PREVIEW');bpy.context.scene.collection.children.link(preview)
 with bpy.data.libraries.load(str(R/assets['master']),link=False)as(data_from,data_to):data_to.collections=['SM_V02_AIR_'+m['id'].upper()for m in assets['models']]
 models=data_to.collections
 def curve(id,points,collection,kind):
  data=bpy.data.curves.new(id,'CURVE');data.dimensions='3D';poly=data.splines.new('POLY');poly.points.add(len(points)-1)
  for v,p in zip(poly.points,points):v.co=(*game(p),1)
  poly.use_cyclic_u=True;o=bpy.data.objects.new(id,data);collection.objects.link(o);o.hide_render=True;o['navigationRole']=kind;o['exportAsGeometry']=False;return o
 for lane in snapshot['lanes']:
  o=curve(lane['id'],lane['displayPoints'],col,'scenic air route');o['runtimeLengthMetres']=lane['length']
  for agent in lane['agents']:
   o=bpy.data.objects.new(agent['id'],None);preview.objects.link(o);o.instance_type='COLLECTION';o.instance_collection=models[agent['variant']];o.location=game(agent['position']);q=agent['quaternion'];o.rotation_mode='QUATERNION';o.rotation_quaternion=Quaternion((q[3],q[0],-q[2],q[1]));o['scenicOnly']=True;o['snapshotClock']=0;o['exportAsGeometry']=False
 for route in snapshot['ambient']['routes']:
  o=curve(route['id'],route['points'],ambient,'ordinary public visitor route');o['purpose']=route['purpose'];o['count']=route['count'];o['dwellWaypoints']=json.dumps(route['dwellAt']);o['exportAsGeometry']=False
  for index in route['dwellAt']:
   o=bpy.data.objects.new(route['id']+' destination '+str(index),None);ambient.objects.link(o);o.location=game(route['points'][index]);o.empty_display_type='SPHERE';o.empty_display_size=.3;o['purpose']=route['purpose'];o['exportAsGeometry']=False
 bpy.context.scene['worldLifeSnapshotSHA256']=sha(D/'V02_World_Life_Authoring_Snapshot.json');bpy.context.scene['sourceStationMasterSHA256']=station['masterSHA256'];bpy.ops.wm.save_as_mainfile(filepath=str(master));print('Saved separate world-life master',master)
else:
 bpy.ops.wm.open_mainfile(filepath=str(master));bpy.context.view_layer.update();failures=[];maximum=0
 for r in manifest['records']:
  o=bpy.data.objects.get(r['id']);assert o and o.type=='MESH',r['id'];points=[o.matrix_world@v.co for v in o.data.vertices];lo=[min(p[k]for p in points)for k in[0,2,1]];hi=[max(p[k]for p in points)for k in[0,2,1]];lo[2],hi[2]=-hi[2],-lo[2];error=max(abs(b[i]-r['box'][k][i])for k,b in[('min',lo),('max',hi)]for i in range(3));maximum=max(maximum,error)
  if error>.0001:failures.append({'id':r['id'],'reason':'source architecture bounds changed','error':error})
 for lane in snapshot['lanes']:
  o=bpy.data.objects[lane['id']];assert o.type=='CURVE';points=o.data.splines[0].points;assert len(points)==len(lane['displayPoints'])
  assert all((Vector(v.co[:3])-Vector(game(p))).length<.0001 for v,p in zip(points,lane['displayPoints']))
  for agent in lane['agents']:
   o=bpy.data.objects[agent['id']];assert(o.location-Vector(game(agent['position']))).length<.0001;assert o.instance_type=='COLLECTION';assert o.instance_collection.name=='SM_V02_AIR_'+assets['models'][agent['variant']]['id'].upper()
   q=agent['quaternion'];assert o.rotation_quaternion.rotation_difference(Quaternion((q[3],q[0],-q[2],q[1]))).angle<.0001
 for route in snapshot['ambient']['routes']:
  o=bpy.data.objects[route['id']];assert o['count']==route['count'];assert all((Vector(v.co[:3])-Vector(game(p))).length<.0001 for v,p in zip(o.data.splines[0].points,route['points']))
 refs=[o for o in bpy.data.collections['SM_EXISTING_REFERENCE'].all_objects if o.type=='MESH'];assert len(refs)==310;assert not failures
 result={'status':'PASS separate saved world-life master and route/instance transforms','master':str(master.relative_to(R)),'masterSHA256':sha(master),'sourceStationMasterSHA256':sha(R/station['master']),'manifestSHA256':sha(mp),'snapshotSHA256':sha(D/'V02_World_Life_Authoring_Snapshot.json'),'authoringSHA256':sha(Path(__file__)),'preservedArchitecturalComponents':len(manifest['records']),'maximumArchitecturalBoundsErrorMetres':maximum,'originalReferenceBuildings':len(refs),'aerialRoutes':len(snapshot['lanes']),'aircraftInstances':sum(len(l['agents'])for l in snapshot['lanes']),'ambientRoutes':len(snapshot['ambient']['routes']),'scope':'Saved Blender source bounds, native route samples and clock-zero shared asset instances. Not matched reference renders, final art, or gameplay certification.','failures':failures}
 (D/'V02_World_Life_Master_Validation.json').write_text(json.dumps(result,indent=2)+'\n');print(result['status'])
