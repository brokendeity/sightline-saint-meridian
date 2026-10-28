"""Independent reopened source invariants, manifold/opening and corner witness."""
import bpy,bmesh,json,hashlib,gzip,struct,sys,math,ast
from pathlib import Path
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';sys.path.insert(0,str(Path(__file__).parent));from v02_scene_signatures import signatures
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();read=lambda p:json.loads(p.read_text());a=read(D/'V02_Facade_Cassettes_Authoring.json');plan=read(D/'V02_Facade_Cassettes_Plan.json')
# Reuse only read-only snapshot helpers, never the prior validation program.
helper=Path(__file__).with_name('validate_upper_anchor_master.py');tree=ast.parse(helper.read_text());defs=[n for n in tree.body if isinstance(n,ast.FunctionDef)and n.name in ['props','value','materials','packed']];assert len(defs)==4;exec(compile(ast.Module(body=defs,type_ignores=[]),str(helper),'exec'),globals())
assert sha(R/a['sourceMaster'])==a['sourceMasterSHA256']and sha(R/a['master'])==a['masterSHA256'];assert sha(Path(__file__).with_name('blender_facade_cassettes.py'))==a['authoringSHA256']
bpy.ops.wm.open_mainfile(filepath=str(R/a['sourceMaster']));bpy.context.view_layer.update();old=signatures();oldProps=props();oldMaterials=materials();oldImages=packed();oldLights=sorted(o.name for o in bpy.data.objects if o.type=='LIGHT')
bpy.ops.wm.open_mainfile(filepath=str(R/a['master']));bpy.context.view_layer.update();now=signatures();newProps=props();newMaterials=materials();assert all(now[n]==h and newProps[n]==oldProps[n]for n,h in old.items());assert all(newMaterials[n]==h for n,h in oldMaterials.items());assert packed()==oldImages and sorted(o.name for o in bpy.data.objects if o.type=='LIGHT')==oldLights
records=[];data=bytearray();names=['V02_Cassette_midnight','V02_Cassette_charcoal','V02_Cassette_reveal'];maximumBoundsError=0;triangles=0
for f in plan['features']:
 o=bpy.data.objects[f['id']];assert o['runtimeOwner']==f['owner']and o['sourceBay']==f['sourceBayID'];mesh=o.data;bm=bmesh.new();bm.from_mesh(mesh);assert all(len(e.link_faces)==2 for e in bm.edges);assert bm.calc_volume(signed=True)>0;bm.free();assert mesh.uv_layers.active and len(mesh.uv_layers.active.data)==len(mesh.loops)
 for v in mesh.vertices:
  p=o.matrix_world@v.co;point=[p.x,p.z,-p.y]
  for i,x in enumerate(point):
   allowance=2**(math.floor(math.log2(max(abs(x),1)))-23)+1e-7;error=max(f['box']['min'][i]-x,x-f['box']['max'][i],0);maximumBoundsError=max(maximumBoundsError,error);assert error<=allowance,(f['id'],point,f['box'])
 mesh.calc_loop_triangles();normal=o.matrix_world.to_3x3().inverted().transposed();start=triangles
 for tri in mesh.loop_triangles:
  values=[];projected=[]
  for loop in tri.loops:
   p=o.matrix_world@mesh.vertices[mesh.loops[loop].vertex_index].co;n=(normal@mesh.corner_normals[loop].vector).normalized();uv=mesh.uv_layers.active.data[loop].uv;point=[p.x,p.z,-p.y];norm=[n.x,n.z,-n.y];values.extend(point+norm+list(uv));assert all(math.isfinite(x)for x in values);projected.append([point[f['uAxis']]-f['sourcePoint'][f['uAxis']],point[1]-f['sourcePoint'][1]])
  # The old 1.68x2.36m glazing/frame box must remain fully unobstructed.
  poly=projected
  for axis,edge,greater in [(0,-.84,True),(0,.84,False),(1,-1.18,True),(1,1.18,False)]:
   out=[]
   if not poly:break
   for p,q in zip(poly,poly[1:]+poly[:1]):
    x=(p[axis]-edge)*(1 if greater else-1);y=(q[axis]-edge)*(1 if greater else-1)
    if x>=0:out.append(p)
    if (x>=0)!=(y>=0):t=x/(x-y);out.append([p[j]+t*(q[j]-p[j])for j in range(2)])
   poly=out
  area=abs(sum(p[0]*q[1]-q[0]*p[1]for p,q in zip(poly,poly[1:]+poly[:1])))/2 if len(poly)>2 else 0;assert area<1e-8,(f['id'],'Original window covered',area)
  material=mesh.materials[mesh.polygons[tri.polygon_index].material_index].name;data.extend(struct.pack('<B24f',names.index(material),*values));triangles+=1
 records.append({'id':f['id'],'owner':f['owner'],'triangleStart':start,'triangleCount':triangles-start,'manifold':True,'oldWindowClear':True})
binary=D/'V02_Facade_Cassettes_Source_Corners.bin.gz';binary.write_bytes(gzip.compress(data,mtime=0));witness={'schema':'sm-v02-cassette-corners-1','masterSHA256':a['masterSHA256'],'format':'Little-endian B24f,97bytes per triangle: material index then3corners of positionXYZ,normalXYZ,sourceUV. GameY-up, UV in Blender lower-left convention.','materials':names,'triangles':triangles,'rawBytes':len(data),'binary':str(binary.relative_to(R)),'binarySHA256':sha(binary),'features':records};file=D/'V02_Facade_Cassettes_Source_Witness.json';file.write_text(json.dumps(witness,indent=2)+'\n')
report={'status':'PASS independent source reopening, prior object/material/image/light preservation, new closed manifolds and retained glazing openings','sourceMasterSHA256':a['sourceMasterSHA256'],'masterSHA256':a['masterSHA256'],'validatorSHA256':sha(Path(__file__)),'readOnlyHelperSHA256':sha(helper),'unchangedObjects':len(old),'unchangedMaterials':len(oldMaterials),'unchangedPackedImages':len(oldImages),'unchangedLights':len(oldLights),'components':len(records),'triangles':triangles,'maximumSourceEnvelopeError':maximumBoundsError,'witness':str(file.relative_to(R)),'witnessSHA256':sha(file),'scope':'Physical source and opening proof only. Source/native/export rendering, real contacts, motion, destruction and final reference acceptance remain separate.'};(D/'V02_Facade_Cassettes_Master_Validation.json').write_text(json.dumps(report,indent=2)+'\n');print(report['status'],triangles,'triangles',flush=True)
