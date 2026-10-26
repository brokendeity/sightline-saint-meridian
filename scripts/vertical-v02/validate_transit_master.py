"""Independently inspect actual saved source mesh bounds and load-path contacts."""
import bpy,json,hashlib
from pathlib import Path
from mathutils import Vector
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
master=D/'blender/SaintMeridian_V02_Transit_Master.blend';mp=R/'assets/city/vertical-v02/transit-world/manifest.json';m=json.loads(mp.read_text());bpy.ops.wm.open_mainfile(filepath=str(master));bpy.context.view_layer.update()
actual={};failures=[];maximum=0
for r in m['records']:
 o=bpy.data.objects.get(r['id'])
 if not o or o.type!='MESH':failures.append({'id':r['id'],'reason':'missing source mesh'});continue
 points=[o.matrix_world@v.co for v in o.data.vertices];lo=[min(p[k]for p in points)for k in[0,2,1]];hi=[max(p[k]for p in points)for k in[0,2,1]];lo[2],hi[2]=-hi[2],-lo[2]
 b={'min':lo,'max':hi};actual[r['id']]=b;error=max(abs(b[k][i]-r['box'][k][i])for k in['min','max']for i in range(3));maximum=max(maximum,error)
 if error>.0001:failures.append({'id':r['id'],'reason':'actual bounds differ','error':error})
def contact(a,b):return all(a['min'][i]<=b['max'][i]+.0001 and a['max'][i]>=b['min'][i]-.0001 for i in range(3))
connections=[]
def join(a,b):
 ok=contact(actual[a],actual[b]);connections.append({'a':a,'b':b,'contact':ok})
 if not ok:failures.append({'id':a,'reason':'load path gap','to':b})
for support in m['transitStructure']['supports']:
 parent=support['existingColumn']or next(r['id']for r in support['records']if r['id'].startswith('transit-pier-'))
 beams=[r['id']for r in support['records']if'crosshead'in r['id']or'approach'in r['id']]
 join(parent,beams[0])
 if len(beams)>1:join(beams[0],beams[1])
 if not any(contact(actual[beams[-1]],actual[id])for id in m['transitStructure']['girderIDs']):failures.append({'id':beams[-1],'reason':'no actual longitudinal girder contact'})
for z in[352,364,376,388,400,408]:
 join('transit-public-platform','transit-platform-riser-'+str(z));join('transit-platform-riser-'+str(z),'transit-platform-outrigger-'+str(z))
 if not any(contact(actual['transit-platform-outrigger-'+str(z)],actual[id])for id in m['transitStructure']['girderIDs']):failures.append({'id':str(z),'reason':'platform outrigger misses actual girder'})
for z in[354,366,398,408]:join('transit-platform-canopy','transit-platform-canopy-post-'+str(z));join('transit-platform-canopy-post-'+str(z),'transit-public-platform')
refs=list(bpy.data.collections['SM_EXISTING_REFERENCE'].all_objects);assert len([o for o in refs if o.type=='MESH'])==310
result={'status':'FAIL saved transit master'if failures else'PASS saved transit master bounds and support contacts','masterSHA256':sha(master),'manifestSHA256':sha(mp),'meshes':len(actual),'maximumBoundsErrorMetres':maximum,'referenceBuildingMeshes':310,'connections':connections,'failures':failures,'scope':'Actual saved component bounds and load-path contacts; no structural load/soil certification or native gameplay claim.'}
(D/'V02_Transit_Master_Validation.json').write_text(json.dumps(result,indent=2)+'\n');print(result['status'],'maximum error',maximum,'connections',len(connections));print(failures[:12]);assert not failures
