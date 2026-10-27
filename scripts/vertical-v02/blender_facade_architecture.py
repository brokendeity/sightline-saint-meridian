"""Recessed glazing, chamfered frames and source-backed architectural seams.
Fork the current master; replace only its three decorative facade meshes.
"""
import bpy,bmesh,json,hashlib,array
from pathlib import Path
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';O=R/'assets/city/vertical-v02/facade-architecture';O.mkdir(exist_ok=True);read=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
plan=read(D/'V02_Facade_Architecture_Plan.json');prior=read(R/'assets/city/vertical-v02/visual/facades.json');source=read(D/'V02_Views_Authoring.json');master=R/source['master'];assert sha(master)==source['masterSHA256'];assert all(sha(R/f)==h for f,h in plan['sources'].items());bpy.ops.wm.open_mainfile(filepath=str(master));bpy.context.view_layer.update();replace={'Facade fittings / '+c['owner']for c in prior['chunks']}
def signatures():
 cache={};result={}
 for o in bpy.data.objects:
  data={'type':o.type,'matrix':[list(row)for row in o.matrix_world],'properties':dict(o.items())}
  if o.type=='MESH'and o.name not in replace:
   key=o.data.as_pointer()
   if key not in cache:
    raw=b''
    for prop,n,src in [('co',3,o.data.vertices),('normal',3,o.data.vertices)]:
     a=array.array('f',[0])*(len(src)*n);src.foreach_get(prop,a);raw+=a.tobytes()
    for uv in o.data.uv_layers:
     a=array.array('f',[0])*(len(uv.data)*2);uv.data.foreach_get('uv',a);raw+=a.tobytes()
    cache[key]=hashlib.sha256(raw+json.dumps([(list(p.vertices),p.material_index)for p in o.data.polygons]).encode()).hexdigest()
   data['mesh']=cache[key];data['materials']=[m.name if m else None for m in o.data.materials]
  result[o.name]=hashlib.sha256(json.dumps(data,sort_keys=True,default=str).encode()).hexdigest()
 return result
before=signatures();palette=['frame','warm','warm-soft','warm-neutral','cool','dark'];materials={k:bpy.data.materials['V02_Facade_'+k]for k in palette}
for key,color,emit,rough in [('spandrel',(.012,.027,.042,1),(0,0,0,1),.33),('cyan',(.018,.10,.14,1),(.025,.25,.34,1),.28)]:
 m=bpy.data.materials.new('V02_Facade_'+key);m.use_nodes=True;m.diffuse_color=color;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=color;p.inputs['Metallic'].default_value=.7;p.inputs['Roughness'].default_value=rough;p.inputs['Emission Color'].default_value=emit;p.inputs['Emission Strength'].default_value=1.15 if key=='cyan'else 0;materials[key]=m;palette.append(key)
cube=[(-1,-1,-1),(-1,-1,1),(-1,1,-1),(-1,1,1),(1,-1,-1),(1,-1,1),(1,1,-1),(1,1,1)];cube_faces=[(0,2,6,4),(1,5,7,3),(0,4,5,1),(2,3,7,6),(0,1,3,2),(4,6,7,5)];chunks=[]
for c in prior['chunks']:
 verts=[];faces=[];slots=[]
 def world(p):return(p[0],-p[2],p[1])
 def face(v,kind):faces.append(tuple(v));slots.append(palette.index(kind))
 def box(p,size,kind):
  first=len(verts);verts.extend(world([p[i]+v[i]*size[i]/2 for i in range(3)])for v in cube)
  for f in cube_faces:face([first+j for j in f],kind)
 def part(b,depth,height,width,dy=0,du=0,out=0,kind='frame'):
  p=list(b['centre']);axis=b['axis'];u=b['uAxis'];p[axis]+=b['normal'][axis]*out;p[1]+=dy;p[u]+=du;size=[0,0,0];size[axis]=depth;size[1]=height;size[u]=width;box(p,size,kind)
 def loop(b,width,height,corner,out):
  x=width/2;y=height/2;points=[(-x+corner,-y),(x-corner,-y),(x,-y+corner),(x,y-corner),(x-corner,y),(-x+corner,y),(-x,y-corner),(-x,-y+corner)];first=len(verts)
  for u,v in points:
   p=list(b['centre']);p[b['uAxis']]+=u;p[1]+=v;p[b['axis']]+=b['normal'][b['axis']]*out;verts.append(world(p))
  return list(range(first,first+8))
 for b in c['bays']:
  rings=[loop(b,1.68,2.36,.08,-.02),loop(b,1.65,2.33,.08,.02),loop(b,1.50,2.20,.035,.02),loop(b,1.48,2.18,.035,-.02)]
  for a,z in zip(rings,rings[1:]+rings[:1]):
   for j in range(8):face([a[j],a[(j+1)%8],z[(j+1)%8],z[j]],'frame')
  part(b,.008,2.20,1.50,out=.008,kind=b['style'])
  part(b,.008,2.20,.028,out=.018)
  part(b,.008,.035,1.50,dy=-.35,out=.018)
 features=[f for f in plan['features']if f['owner']==c['owner']]
 for b in features:
  part(b,.04,b['height'],b['width'],kind='spandrel')
  if b['kind']=='spine':
   part(b,.012,b['height']-.08,.055,out=.027,kind='cyan');part(b,.012,b['height']-.08,.025,du=-.115,out=.026)
  else:
   part(b,.012,.035,b['width']-.04,dy=-.105,out=.027,kind='cyan');part(b,.012,.025,b['width']-.04,dy=.105,out=.026)
 mesh=bpy.data.meshes.new(c['owner']+' architectural facade');mesh.from_pydata(verts,[],faces);mesh.update()
 for m in materials.values():mesh.materials.append(m)
 for p,index in zip(mesh.polygons,slots):p.material_index=index
 bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));assert all(e.is_manifold for e in bm.edges);bm.to_mesh(mesh);bm.free();obj=bpy.data.objects['Facade fittings / '+c['owner']];obj.data=mesh
 bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj;file=O/('facade-'+c['owner']+'.glb');bpy.ops.export_scene.gltf(filepath=str(file),export_format='GLB',use_selection=True,export_yup=True,export_extras=True);mesh.calc_loop_triangles()
 chunks.append({**c,'url':str(file.relative_to(R)),'sha256':sha(file),'bytes':file.stat().st_size,'bays':c['bays']+features,'windowBays':len(c['bays']),'architecturalFeatures':len(features),'triangles':len(mesh.loop_triangles)})
bpy.context.view_layer.update();after=signatures();assert all(after[n]==h for n,h in before.items());target=D/'blender/SaintMeridian_V02_Facade_Architecture.blend';bpy.ops.wm.save_as_mainfile(filepath=str(target));assert sha(master)==source['masterSHA256'];bpy.ops.wm.open_mainfile(filepath=str(target));bpy.context.view_layer.update();after=signatures();assert all(after[n]==h for n,h in before.items())
report={'status':'AUTHORED source-backed facade architecture; export/native/visual acceptance pending','master':str(target.relative_to(R)),'masterSHA256':sha(target),'sourceMaster':str(master.relative_to(R)),'sourceMasterSHA256':source['masterSHA256'],'planSHA256':sha(D/'V02_Facade_Architecture_Plan.json'),'authoringSHA256':sha(Path(__file__)),'unchangedSourceObjects':len(before)-len(replace),'replacedDecorativeMeshes':sorted(replace),'sourceObjectTransformsAndPropertiesUnchanged':len(before),'chunks':chunks,'limits':['No original building geometry/collision changes','Only original-owner decorative facade meshes replaced','8.5cm source-backed shallow envelope; no new rooms, balconies or walk surfaces','Original source material slots reused; two new shared metal/linear-cyan materials','Actual full reference quality remains unaccepted']};(O/'facades.json').write_text(json.dumps(report,indent=2)+'\n');print('AUTHORED',sum(c['architecturalFeatures']for c in chunks),'features;',sum(c['triangles']for c in chunks),'triangles')
