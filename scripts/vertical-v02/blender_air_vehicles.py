"""Original lightweight shared hover vehicles; no paid generation or old assets changed."""
import bpy,bmesh,math,json,hashlib
from pathlib import Path
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';OUT=R/'assets/city/vertical-v02/world-life';OUT.mkdir(parents=True,exist_ok=True);sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
bpy.ops.wm.read_factory_settings(use_empty=True);scene=bpy.context.scene;scene.unit_settings.system='METRIC'
materials={}
for id,color,metal,rough,emit in[('navy',(.025,.065,.10,1),.7,.3,0),('white',(.64,.71,.76,1),.5,.36,0),('glass',(.018,.14,.19,1),.5,.18,0),('cyan',(.03,.65,.9,1),.1,.2,1.5),('warm',(.95,.56,.18,1),.1,.3,1.2),('red',(.8,.035,.03,1),.1,.3,1.1)]:
 m=bpy.data.materials.new('V02_Air_'+id);m.use_nodes=True;m.diffuse_color=color;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=color;p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
 if emit:p.inputs['Emission Color'].default_value=color;p.inputs['Emission Strength'].default_value=emit
 materials[id]=m
V=[(-1,-1,-1),(-1,-1,1),(-1,1,-1),(-1,1,1),(1,-1,-1),(1,-1,1),(1,1,-1),(1,1,1)];F=[(0,2,6,4),(1,5,7,3),(0,4,5,1),(2,3,7,6),(0,1,3,2),(4,6,7,5)]
results=[]
for variant,name in enumerate(['commuter','delivery','municipal']):
 collection=bpy.data.collections.new('SM_V02_AIR_'+name.upper());scene.collection.children.link(collection);verts=[];faces=[];slots=[];palette=list(materials)
 def poly(points,polygons,kind):
  start=len(verts);verts.extend((p[0],-p[2],p[1])for p in points);faces.extend(tuple(start+i for i in f)for f in polygons);slots.extend([palette.index(kind)]*len(polygons))
 def box(p,s,kind):poly([[p[i]+v[i]*s[i]/2 for i in range(3)]for v in V],F,kind)
 # Chamfered8-sided hull with a swept nose; not a cuboid scenic placeholder.
 outline=[(-.85,-2.55),(.85,-2.55),(1.15,-2.15),(1.15,1.9),(.8,2.55),(-.8,2.55),(-1.15,1.9),(-1.15,-2.15)]
 points=[[x,-.4,z]for x,z in outline]+[[x,.22,z]for x,z in outline];polygons=[tuple(range(7,-1,-1)),tuple(range(8,16))]+[(i,(i+1)%8,(i+1)%8+8,i+8)for i in range(8)];poly(points,polygons,'white'if variant==2 else'navy')
 cabin=[[-.9,.23,-1.65],[.9,.23,-1.65],[-.9,.23,1.65],[.9,.23,1.65],[-.72,.78,-1.2],[.72,.78,-1.2],[-.72,.78,.9],[.72,.78,.9]];poly(cabin,F,'glass')
 box([0,.795,-.15],[1.49,.07,2.2],'white'if variant==2 else'navy')
 for x in[-1,1]:
  box([x*1.25,-.22,-.2],[.28,.13,3.7],'navy');box([x*1.32,-.14,-.2],[.05,.05,3.4],'cyan')
  box([x*.78,.02,2.50],[.48,.10,.09],'warm');box([x*.78,-.01,-2.55],[.48,.10,.08],'red')
  box([x*.92,.47,-.25],[.045,.06,1.9],'navy')
 for x in[-.85,.85]:
  for z in[-1.7,1.7]:
   # Visible hover pad and its inset emissive face, built from actual polygons.
   for y,r,kind in[(-.50,.36,'navy'),(-.64,.29,'cyan')]:
    circle=[[x+math.cos(i*math.tau/16)*r,y,z+math.sin(i*math.tau/16)*r]for i in range(16)];poly(circle,[tuple(range(16))],kind)
 if variant==0:box([0,.85,-.4],[.65,.07,.45],'warm')
 if variant==1:box([0,.49,-1.65],[1.55,.64,1.5],'navy');box([0,.82,-1.65],[1.4,.025,1.3],'white')
 if variant==2:box([0,.85,-.45],[1.0,.07,.22],'cyan')
 mesh=bpy.data.meshes.new('air_'+name);mesh.from_pydata(verts,[],faces);mesh.update()
 for m in materials.values():mesh.materials.append(m)
 for p,slot in zip(mesh.polygons,slots):p.material_index=slot
 bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free();mesh.update()
 obj=bpy.data.objects.new('air_'+name,mesh);collection.objects.link(obj);obj['scenicOnly']=True;obj['frontAxis']='+gameZ';obj['variant']=name
 bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
 file=OUT/('air_'+name+'.glb');bpy.ops.export_scene.gltf(filepath=str(file),export_format='GLB',use_selection=True,export_yup=True,export_extras=True)
 points=[v.co for v in mesh.vertices];lo=[min(p[k]for p in points)for k in[0,2,1]];hi=[max(p[k]for p in points)for k in[0,2,1]];lo[2],hi[2]=-hi[2],-lo[2]
 assert all(lo[i]>=(-1.4,-.9,-2.8)[i]and hi[i]<=(1.4,.9,2.8)[i]for i in range(3))
 results.append({'id':name,'url':str(file.relative_to(R)),'sha256':sha(file),'bytes':file.stat().st_size,'triangles':sum(len(p.vertices)-2 for p in mesh.polygons),'localBounds':{'min':lo,'max':hi}})
master=D/'blender/SaintMeridian_V02_Air_Vehicles.blend';bpy.ops.wm.save_as_mainfile(filepath=str(master));report={'schema':'sm-v02-air-assets-1','status':'AUTHORED; native/appearance acceptance pending','master':str(master.relative_to(R)),'masterSHA256':sha(master),'authoringSHA256':sha(Path(__file__)),'models':results,'declaredFleetEnvelope':{'min':[-1.4,-.9,-2.8],'max':[1.4,.9,2.8]},'dynamicLights':0}
(OUT/'air_assets.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
