"""Run inside Blender against the saved master; inspect without editing it."""
import bpy,json,hashlib,math
from pathlib import Path
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02'
m=json.loads((R/'assets/city/vertical-v02/graybox/manifest.json').read_text())
g=json.loads((D/'V02_Movement_Graph.json').read_text());assert m['encounters']==g['encounters']
rows=[]
for encounter in m['encounters']:
 for name,p in [('access',encounter['trigger'])]+[(f'actor-{i}',p)for i,p in enumerate(encounter['positions'])]+[(name,encounter[name])for name in ['isolation','extraction','escape','interception']if name in encounter]:
  id=encounter['id']+'-'+name;o=bpy.data.objects.get(id);assert o is not None,id
  actual=[o.location.x,o.location.z,-o.location.y]
  error=math.dist(actual,p);assert error<.0001,(id,actual,p)
  assert o in bpy.data.collections['SM_V02_ENCOUNTER_POINTS'].objects.values()
  assert o.get('exportRole')=='metadata only'
  supports=[r['id']for r in m['records']if r['walkable']and abs(r['box']['max'][1]-p[1])<.001 and r['box']['min'][0]<=p[0]<=r['box']['max'][0]and r['box']['min'][2]<=p[2]<=r['box']['max'][2]]
  assert supports,(id,'no authored floor')
  rows.append({'id':id,'position':p,'maximumCoordinateError':error,'supports':supports})
report={'status':'PASS saved Blender encounter markers and exported metadata','scope':'Editable source/metadata alignment and static support only; does not certify combat, routes or camera behavior.','masterSHA256':hashlib.sha256((D/'blender/SaintMeridian_V02_AAA_Master.blend').read_bytes()).hexdigest(),'manifestSHA256':hashlib.sha256((R/'assets/city/vertical-v02/graybox/manifest.json').read_bytes()).hexdigest(),'markers':rows}
(D/'V02_Encounter_Authoring_Validation.json').write_text(json.dumps(report,indent=2)+'\n');print(report['status'],len(rows))
