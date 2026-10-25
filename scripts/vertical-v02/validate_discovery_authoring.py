"""Inspect saved Blender kiosks, stances and the exported public graph subset."""
import bpy,json,hashlib,math
from pathlib import Path
from mathutils import Vector
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';M=R/'assets/city/vertical-v02/graybox/manifest.json'
m=json.loads(M.read_text());g=json.loads((D/'V02_Movement_Graph.json').read_text())
assert m['pointsOfInterest']==g['pointsOfInterest']and m['directory']==g['directory']
assert len(m['pointsOfInterest'])==4 and len({p['id']for p in m['pointsOfInterest']})==4
expected=[{k:e[k]for k in ['id','source','destination','ability','path','distance3D']}for e in g['edges']if e['traversalAgent']=='player'and e['ability']in ['walk','run','stairs']and not e['requiredAfterstepImpulses']and not e.get('requiredGameplayConditions')]
assert m['navigation']['edges']==expected
rows=[]
for p in [m['directory'],*m['pointsOfInterest']]:
 stance=bpy.data.objects['poi-'+p['id']];actual=[stance.location.x,stance.location.z,-stance.location.y];stance_error=math.dist(actual,p['position']);assert stance_error<5e-5,(p['id'],actual,p['position'],stance_error)
 board=bpy.data.objects['kiosk-'+p['id']];points=[board.matrix_world@Vector(v)for v in board.bound_box];game=[[v.x,v.z,-v.y]for v in points]
 bounds={'min':[min(v[i]for v in game)for i in range(3)],'max':[max(v[i]for v in game)for i in range(3)]};record=next(r for r in m['records']if r['id']==board.name)
 error=max(abs(bounds[k][i]-record['box'][k][i])for k in ['min','max']for i in range(3))
 # Blender world matrices are float32: at Z420 one ULP is about31 micrometres.
 # Preserve a sub-tenth-millimetre authoring gate and record the actual error.
 assert error<5e-5,(p['id'],error,bounds,record['box'])
 assert record['solid']and record['material']=='steel'and board in bpy.data.collections[p['collection']].objects.values()
 pos=p['position'];supports=[r['id']for r in m['records']if r['walkable']and abs(r['box']['max'][1]-pos[1])<.001 and all(r['box']['min'][i]<=pos[i]<=r['box']['max'][i]for i in [0,2])]
 if pos[1]>0:assert supports,p['id']
 rows.append({'id':p['id'],'stance':actual,'stanceErrorMetres':stance_error,'boardBounds':bounds,'maximumBoundsErrorMetres':error,'supports':supports,'groundNote':None if supports else'Original ground; normal-input runtime support remains the authority'})
report={'status':'PASS four POIs and directory match saved Blender/metadata','scope':'Physical authoring and public-graph provenance only; gameplay, guide continuity and readable captures are separate.','manifestSHA256':hashlib.sha256(M.read_bytes()).hexdigest(),'masterSHA256':hashlib.sha256((D/'blender/SaintMeridian_V02_AAA_Master.blend').read_bytes()).hexdigest(),'graphSHA256':hashlib.sha256((D/'V02_Movement_Graph.json').read_bytes()).hexdigest(),'points':rows,'publicEdges':len(expected),'boundsToleranceMetres':5e-5}
(D/'V02_Discovery_Authoring.json').write_text(json.dumps(report,indent=2)+'\n');print(report['status'],len(rows))
