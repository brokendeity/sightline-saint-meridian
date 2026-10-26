"""Inspect saved Blender source, not authoring intent or declared dimensions."""
import bpy,json,hashlib
from pathlib import Path
from mathutils import Vector
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';OUT=R/'assets/city/vertical-v02/transit'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
master=D/'blender/SaintMeridian_V02_Transit_Assets.blend'
bpy.ops.wm.open_mainfile(filepath=str(master));engineering=json.loads((D/'V02_Transit_Engineering.json').read_text())
report={'scope':'Independent saved Blender wheel/rail, attachment and coordinate checks; not native moving geometry or engineering load certification.','masterSHA256':sha(master),'assetManifestSHA256':sha(OUT/'assets.json'),'wheels':[],'failures':[]}
for obj in bpy.data.objects:
 if obj.get('transitRole')!='wheelAxle':continue
 points=[obj.matrix_world@v.co for v in obj.data.vertices]
 for side in [-1,1]:
  half=[v for v in points if v.x*side>0];lo=min(v.x for v in half);hi=max(v.x for v in half);bottom=min(v.z for v in half)+100;rail=side*engineering['gauge']/2
  sample={'axle':obj.name,'side':side,'wheelRangeX':[lo,hi],'railCenterX':rail,'bottomY':bottom,'railHeadY':engineering['railHeadY'],'lateralContact':lo<=rail<=hi,'verticalError':abs(bottom-engineering['railHeadY'])};report['wheels'].append(sample)
  if not sample['lateralContact']or sample['verticalError']>.01:report['failures'].append(sample)
doors=[o for o in bpy.data.objects if o.get('transitRole')=='slidingDoor'];bogies=[o for o in bpy.data.objects if o.get('transitRole')=='bogie']
assert len(doors)==8 and len(bogies)==2 and len(report['wheels'])==8
report['doors']=len(doors);report['bogies']=len(bogies);report['status']='FAIL source wheel/rail contact'if report['failures']else'PASS saved transit source contacts'
(D/'V02_Transit_Authoring_Validation.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
assert not report['failures'],'Saved wheel geometry does not meet actual authored rails'
