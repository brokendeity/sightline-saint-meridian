"""Source-authored painted-cladding study; geometry and gameplay stay frozen.

This design experiment is not a final reference match. Midnight panels represent
paint over metal, rather than exposed metal; glass/alloy/emission stay unchanged.
"""
import bpy,array,hashlib,json,copy
from pathlib import Path
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';O=R/'assets/city/vertical-v02/painted-cladding-study';O.mkdir(exist_ok=True)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();read=lambda p:json.loads(p.read_text())
b=read(D/'V02_Upper_Anchor_Build.json');assert sha(R/b['master'])==b['masterSHA256'];c=read(R/b['materialContract'])
bpy.ops.wm.open_mainfile(filepath=str(R/b['master']));bpy.context.view_layer.update()
def signature():
 meshes={};objects={}
 for o in bpy.data.objects:
  if o.type=='MESH'and o.data.as_pointer()not in meshes:
   h=hashlib.sha256()
   for attr,n,source in [('co',3,o.data.vertices),('normal',3,o.data.vertices)]:
    values=array.array('f',[0])*(len(source)*n);source.foreach_get(attr,values);h.update(values.tobytes())
   for uv in o.data.uv_layers:
    values=array.array('f',[0])*(len(uv.data)*2);uv.data.foreach_get('uv',values);h.update(values.tobytes())
   h.update(json.dumps([(list(p.vertices),p.material_index)for p in o.data.polygons]).encode());meshes[o.data.as_pointer()]=h.hexdigest()
  objects[o.name]={'type':o.type,'parent':o.parent.name if o.parent else None,'local':[list(v)for v in o.matrix_local],'visible':[o.hide_viewport,o.hide_render],'materials':[m.name if m else None for m in o.data.materials]if o.type=='MESH'else None,'mesh':meshes.get(o.data.as_pointer())if o.type=='MESH'else None}
 return objects
def material_signature():
 out={}
 for m in bpy.data.materials:
  nodes={};links=[]
  if m.use_nodes:
   for n in m.node_tree.nodes:
    inputs={}
    for i in n.inputs:
     if hasattr(i,'default_value'):
      v=i.default_value
      try:v=list(v)
      except TypeError:pass
      inputs[i.identifier]=v
    nodes[n.name]={'type':n.bl_idname,'inputs':inputs,'image':n.image.name if hasattr(n,'image')and n.image else None}
   links=sorted((l.from_node.name,l.from_socket.identifier,l.to_node.name,l.to_socket.identifier)for l in m.node_tree.links)
  out[m.name]={'nodes':nodes,'links':links,'diffuse':list(m.diffuse_color)}
 return out
before=signature();materials=material_signature();changes=[]
for owner in c['owners']:
 for p in owner['palette']:
  if p['kind']!='midnight cladding':continue
  m=bpy.data.materials[p['sourceMaterial']];nodes=[n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED'];assert len(nodes)==1
  node=nodes[0];assert not node.inputs['Metallic'].is_linked and not node.inputs['Roughness'].is_linked
  old={'metalness':node.inputs['Metallic'].default_value,'roughness':node.inputs['Roughness'].default_value}
  node.inputs['Metallic'].default_value=0.;node.inputs['Roughness'].default_value=.46
  changes.append({'owner':owner['id'],'sourceIndex':owner['sourceIndex'],'material':m.name,'node':node.name,'old':old,'new':{'metalness':float(node.inputs['Metallic'].default_value),'roughness':float(node.inputs['Roughness'].default_value)},'color':p['color'],'emission':p['emission'],'kind':p['kind']})
assert changes and len({v['sourceIndex']for v in changes})==3
def validate():
 assert signature()==before,'Unexpected geometry/transform/material-slot/visibility mutation'
 after=material_signature();expected=copy.deepcopy(materials)
 for change in changes:
  p=expected[change['material']]['nodes'][change['node']]['inputs'];p['Metallic']=change['new']['metalness'];p['Roughness']=change['new']['roughness']
 assert after==expected,'Unexpected material-node/link/input change'
validate();target=D/'blender/SaintMeridian_V02_Painted_Cladding_Study.blend';bpy.ops.wm.save_as_mainfile(filepath=str(target));bpy.ops.wm.open_mainfile(filepath=str(target));validate()
contract={'schema':'sm-v02-painted-cladding-study-1','status':'AUTHORED source material study; native visual/geometry/destruction/performance acceptance pending','sourceMaster':b['master'],'sourceMasterSHA256':b['masterSHA256'],'sourceMaterialContract':b['materialContract'],'sourceMaterialContractSHA256':sha(R/b['materialContract']),'sourceEntry':b['entry'],'sourceEntrySHA256':b['entrySHA256'],'master':str(target.relative_to(R)),'masterSHA256':sha(target),'authoringSHA256':sha(Path(__file__)),'preservedObjects':len(before),'preservedMaterialsExceptListedPins':len(materials),'changes':changes,'scope':'Only source-author midnight-cladding metallic/roughness pins. Existing vertex colors/emission, glass/alloy, source geometry/UV/normal/transform/visibility and all gameplay are preserved. Geometry relief, motivated lighting/shadows and occupied terraces still require refinement; no final reference-quality claim.'}
(O/'materials.json').write_text(json.dumps(contract,indent=2)+'\n');(D/'V02_Painted_Cladding_Authoring.json').write_text(json.dumps(contract,indent=2)+'\n');print('AUTHORED material study',len(changes),'materials; preserved',len(before),'objects; native comparison pending')
