"""Inspect visible parapets in the saved Blender master against runtime boxes."""
import bpy,json,hashlib,math
from pathlib import Path
from mathutils import Vector
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';M=R/'assets/city/vertical-v02/graybox/manifest.json';m=json.loads(M.read_text());by={r['id']:r for r in m['records']};rows=[];maximum=0
for r in m['records']:
 if not r.get('guardrail'):continue
 o=bpy.data.objects[r['id']];assert o in bpy.data.collections[r['collection']].objects.values();assert o.get('solid')==r['solid']and not o.get('walkable');q=[o.matrix_world@Vector(v)for v in o.bound_box];game=[[p.x,p.z,-p.y]for p in q];bounds={k:[f(p[i]for p in game)for i in range(3)]for k,f in [('min',min),('max',max)]};error=max(abs(bounds[k][i]-r['box'][k][i])for k in ['min','max']for i in range(3));assert error<5e-5,(r['id'],error);maximum=max(maximum,error)
 source=by[r['sourceSurface']];assert source['walkable'];cap=r['id'].endswith('-cap');assert r['solid']!=cap;assert abs(r['size'][1]-(.025 if cap else 1.1))<1e-6
 if not cap:assert abs(r['box']['min'][1]-source['box']['max'][1])<1e-6;rows.append(r['id'])
assert len(rows)==m['guardrails']['parapets']
# Reserve both actual physical transfer lines, not just the graph's first
# centreline. Root expansion matches native .55m radius/1.72m body/.40 clearance.
native=(R/'SIGHTLINE_SAINT_MERIDIAN_V02_GRAYBOX.html').read_text()
assert 'BODY_RADIUS=.55,BODY_HEIGHT=1.72,ROOF_CLEARANCE=.40'in native
transfer_lines=[]
def swept_parapet(a,b,r):
 enter,leave=0.,1.
 for i in range(3):
  low=r['box']['min'][i]-[.55,1.72,.55][i];high=r['box']['max'][i]+[.55,.4,.55][i];delta=b[i]-a[i]
  if abs(delta)<1e-9:
   if not low<=a[i]<=high:return False
  else:
   lo,hi=sorted([(low-a[i])/delta,(high-a[i])/delta]);enter=max(enter,lo);leave=min(leave,hi)
   if enter>leave:return False
 return True
for x in [64,66.5]:
 a=[x,128.44,424];b=[x,128.44,399.8]
 hits=[r['id']for r in m['records']if r.get('guardrail')and r['solid']and swept_parapet(a,b,r)]
 assert not hits,('Physical transfer line blocked by parapet',x,hits)
 transfer_lines.append({'from':a,'to':b,'guardrailBodyConflicts':hits})
master=D/'blender/SaintMeridian_V02_AAA_Master.blend';report={'status':'PASS saved Blender parapets and exported collision geometry match','scope':'Source geometry/metadata only. Public walking, stair circulation, ability openings, camera and performance require separate runtime evidence.','manifestSHA256':hashlib.sha256(M.read_bytes()).hexdigest(),'masterSHA256':hashlib.sha256(master.read_bytes()).hexdigest(),'parapets':len(rows),'maximumBoundsErrorMetres':maximum,'boundsToleranceMetres':5e-5,'collisionPolicy':'Each solid box is the visible low parapet; cyan caps are nonsolid decoration.','reservedOpenings':m['guardrails']['reservedOpenings']}
report['physicalTransferLinePrecheck']={'scope':'Reference body sweeps against saved parapets only; actual cartridge/rail/Pop input evidence remains required.','lines':transfer_lines}
(D/'V02_Guardrail_Source_Validation.json').write_text(json.dumps(report,indent=2)+'\n');print(report['status'],len(rows))
