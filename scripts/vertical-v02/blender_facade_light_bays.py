"""Blender-authored shallow facade fittings, owned by original buildings."""
import bpy,bmesh,json,hashlib
from pathlib import Path
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';OUT=R/'assets/city/vertical-v02/visual';OUT.mkdir(exist_ok=True);sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();plan=json.loads((D/'V02_Facade_Light_Bays.json').read_text());assert all(sha(R/f)==h for f,h in plan['sources'].items())
master=D/'blender/SaintMeridian_V02_Visual_Study.blend';bpy.ops.wm.open_mainfile(filepath=str(master));collection=bpy.data.collections.new('SM_V02_ORIGINAL_OWNER_FACADE_DETAILS');bpy.context.scene.collection.children.link(collection)
materials={}
for id,color,emit,energy in [('frame',(.025,.055,.08,1),(0,0,0,1),0),('warm',(.21,.09,.025,1),(.60,.26,.07,1),1.1),('warm-soft',(.18,.085,.03,1),(.40,.20,.07,1),1.0),('warm-neutral',(.20,.12,.055,1),(.62,.38,.17,1),1.0),('cool',(.025,.10,.14,1),(.025,.22,.29,1),.75),('dark',(.018,.035,.05,1),(0,0,0,1),0)]:
 m=bpy.data.materials.new('V02_Facade_'+id);m.use_nodes=True;m.diffuse_color=color;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=color;p.inputs['Metallic'].default_value=.65 if id=='frame'else.25;p.inputs['Roughness'].default_value=.34 if id=='frame'else.23;p.inputs['Emission Color'].default_value=emit;p.inputs['Emission Strength'].default_value=energy;materials[id]=m
V=[(-1,-1,-1),(-1,-1,1),(-1,1,-1),(-1,1,1),(1,-1,-1),(1,-1,1),(1,1,-1),(1,1,1)]
# Correct full cube winding before the independent bounds/export check.
F=[(0,2,6,4),(1,5,7,3),(0,4,5,1),(2,3,7,6),(0,1,3,2),(4,6,7,5)]
chunks=[]
for owner in plan['targets']:
 bays=[b for b in plan['bays']if b['owner']==owner]
 if not bays:continue
 verts=[];faces=[];slots=[];palette=list(materials)
 def box(p,size,kind):
  first=len(verts)
  for v in V:
   q=[p[i]+v[i]*size[i]/2 for i in range(3)];verts.append((q[0],-q[2],q[1]))
  faces.extend(tuple(first+j for j in f)for f in F);slots.extend([palette.index(kind)]*6)
 for bay in bays:
  p=bay['centre'];axis=bay['axis'];u=bay['uAxis'];n=bay['normal'][axis]
  def part(depth,y,width,dy=0,du=0,out=0,kind='frame'):
   centre=list(p);centre[axis]+=n*out;centre[1]+=dy;centre[u]+=du;size=[0,0,0];size[axis]=depth;size[1]=y;size[u]=width;box(centre,size,kind)
  # Hollow outer frame: there is no backing plane competing with the glass.
  for du in[-.795,.795]:part(.04,2.36,.09,du=du)
  for dy in[-1.135,1.135]:part(.04,.09,1.50,dy=dy)
  part(.012,2.18,1.48,out=.025,kind=bay['style'])
  for du in[-.25,.25]:part(.008,2.2,.028,du=du,out=.036)
  part(.008,.035,1.5,dy=-.35,out=.036)
 mesh=bpy.data.meshes.new(owner+' light bays');mesh.from_pydata(verts,[],faces);mesh.update()
 for m in materials.values():mesh.materials.append(m)
 for p,index in zip(mesh.polygons,slots):p.material_index=index
 bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
 obj=bpy.data.objects.new('Facade fittings / '+owner,mesh);collection.objects.link(obj);obj['originalOwner']=owner;obj['visualOnly']=True;obj['notNewInterior']=True
 bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj;file=OUT/('facade-'+owner+'.glb');bpy.ops.export_scene.gltf(filepath=str(file),export_format='GLB',use_selection=True,export_yup=True,export_extras=True)
 chunks.append({'owner':owner,'sourceIndex':bays[0]['sourceIndex'],'cityBuildingId':bays[0]['cityBuildingId'],'url':str(file.relative_to(R)),'sha256':sha(file),'bytes':file.stat().st_size,'bays':bays,'triangles':len(bays)*96})
# Shared source-fixture atlas; world-space lighting is preview-only material data.
fill=json.loads((OUT/'soffit_fill.json').read_text());assert fill['sourceManifestSHA256']==sha(R/'assets/city/vertical-v02/transit-world/manifest.json');assert fill['sha256']==sha(R/fill['url']);atlas=bpy.data.images.load(str(R/fill['url']),check_existing=True);atlas.colorspace_settings.name='Non-Color';atlas.pack()
for name in['V02_deck','V02_steel']:
 m=bpy.data.materials[name];nodes=m.node_tree.nodes;links=m.node_tree.links;output=nodes.get('Material Output');surface=next(link.from_socket for link in links if link.to_socket==output.inputs['Surface']);geometry=nodes.new('ShaderNodeNewGeometry');position=nodes.new('ShaderNodeSeparateXYZ');links.new(geometry.outputs['Position'],position.inputs[0]);normal=nodes.new('ShaderNodeSeparateXYZ');links.new(geometry.outputs['Normal'],normal.inputs[0])
 def math_node(op,a,b=None):
  n=nodes.new('ShaderNodeMath');n.operation=op
  if isinstance(a,(int,float)):n.inputs[0].default_value=a
  else:links.new(a,n.inputs[0])
  if b is not None:
   if isinstance(b,(int,float)):n.inputs[1].default_value=b
   else:links.new(b,n.inputs[1])
  return n.outputs[0]
 def ramp(socket,lo,hi,out0,out1):
  n=nodes.new('ShaderNodeMapRange');n.interpolation_type='SMOOTHSTEP';n.clamp=True;n.inputs['From Min'].default_value=lo;n.inputs['From Max'].default_value=hi;n.inputs['To Min'].default_value=out0;n.inputs['To Max'].default_value=out1;links.new(socket,n.inputs['Value']);return n.outputs['Result']
 x0,z0,sx,sz=fill['boundsXZ'];u=math_node('MULTIPLY',math_node('SUBTRACT',position.outputs['X'],x0),1/sx);v=math_node('MULTIPLY',math_node('SUBTRACT',math_node('MULTIPLY',position.outputs['Y'],-1),z0),1/sz);inside=math_node('MULTIPLY',math_node('MULTIPLY',math_node('GREATER_THAN',u,0),math_node('LESS_THAN',u,1)),math_node('MULTIPLY',math_node('GREATER_THAN',v,0),math_node('LESS_THAN',v,1)));weight=0
 for index,level in enumerate(fill['levels']):
  uv=nodes.new('ShaderNodeCombineXYZ');links.new(u,uv.inputs['X']);links.new(math_node('SUBTRACT',1,math_node('MULTIPLY',math_node('ADD',v,index),1/len(fill['levels']))),uv.inputs['Y']);texture=nodes.new('ShaderNodeTexImage');texture.image=atlas;texture.extension='CLIP';links.new(uv.outputs[0],texture.inputs['Vector']);height=ramp(math_node('ABSOLUTE',math_node('SUBTRACT',position.outputs['Z'],level)),.12,.6,1,0);term=math_node('MULTIPLY',height,math_node('ADD',.08,math_node('MULTIPLY',texture.outputs['Color'],.92)));weight=math_node('ADD',weight,term)
 weight=math_node('MULTIPLY',inside,math_node('MULTIPLY',weight,ramp(math_node('MULTIPLY',normal.outputs['Z'],-1),.7,.95,0,1)));emission=nodes.new('ShaderNodeEmission');emission.inputs['Color'].default_value=(*fill['colorLinear'],1);links.new(weight,emission.inputs['Strength']);add=nodes.new('ShaderNodeAddShader');links.new(surface,add.inputs[0]);links.new(emission.outputs[0],add.inputs[1]);links.new(add.outputs[0],output.inputs['Surface']);m['sourceSoffitAtlasSHA256']=fill['sha256']
master=D/'blender/SaintMeridian_V02_Visual_Detail_Candidate.blend';bpy.ops.wm.save_as_mainfile(filepath=str(master));result={'status':'AUTHORED shallow facade candidate; native/export/destruction checks pending','master':str(master.relative_to(R)),'masterSHA256':sha(master),'planSHA256':sha(D/'V02_Facade_Light_Bays.json'),'authoringSHA256':sha(Path(__file__)),'fillDefinitionSHA256':sha(OUT/'soffit_fill.json'),'chunks':chunks,'limits':['Decorative light/glazing bays; no new rooms, doors or collider changes','Runtime attachment must inherit original building destruction and LOD visibility','Original source buildings and accepted architecture remain unchanged']};(OUT/'facades.json').write_text(json.dumps(result,indent=2)+'\n');print('Authored',sum(len(c['bays'])for c in chunks),'bays on',len(chunks),'original owners')
