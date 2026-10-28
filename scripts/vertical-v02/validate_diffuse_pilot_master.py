"""Independent reopen, preservation and atlas/UV witnesses for the lighting pilot."""
from pathlib import Path
import bpy,sys,json,hashlib,gzip,struct,math
from array import array
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';E=D/'evidence/diffuse-pilot';sys.path.insert(0,str(Path(__file__).parent))
from v02_scene_signatures import signatures
sha=lambda b:hashlib.sha256(b).hexdigest()
a=json.loads((D/'V02_Diffuse_Pilot_Authoring.json').read_text());source=R/a['sourceMaster'];master=R/a['master']
assert sha(source.read_bytes())==a['sourceMasterSHA256'];assert sha(master.read_bytes())==a['masterSHA256']
def topology(o):
 return sha(json.dumps({'matrix':[list(r)for r in o.matrix_world],'verts':[list(v.co)for v in o.data.vertices],'polys':[(list(p.vertices),p.material_index)for p in o.data.polygons],'uv0':[list(v.uv)for v in o.data.uv_layers[0].data],'mats':['V02_warm'if m.name=='V02_loggia_luminaire'else m.name for m in o.data.materials]},sort_keys=True).encode())
bpy.ops.wm.open_mainfile(filepath=str(source));bpy.context.view_layer.update();before=signatures();original=topology(bpy.data.objects['loggia-rooms']);fixture_before={id:topology(bpy.data.objects[id])for id in a.get('controlledFixtureMaterialBindings',[])};localsBefore={o.name:(list(o.location),list(o.rotation_euler),list(o.scale),o.parent.name if o.parent else None,o.hide_render,o.hide_viewport)for o in bpy.data.objects}
bpy.ops.wm.open_mainfile(filepath=str(master));bpy.context.view_layer.update();after=signatures();assert set(before)==set(after)
assert all(before[n]==after[n]for n in before if n!='loggia-rooms' and n not in a.get('controlledFixtureMaterialBindings',[]));assert original==topology(bpy.data.objects['loggia-rooms']);assert all(topology(bpy.data.objects[id])==v for id,v in fixture_before.items())
lamp=bpy.data.materials[a['luminaire']['material']].node_tree.nodes.get('Principled BSDF');assert abs(lamp.inputs['Emission Strength'].default_value-a['luminaire']['emissionStrength'])<1e-6
assert all(localsBefore[o.name]==(list(o.location),list(o.rotation_euler),list(o.scale),o.parent.name if o.parent else None,o.hide_render,o.hide_viewport)for o in bpy.data.objects)
o=bpy.data.objects['loggia-rooms'];g=o.data;g.calc_loop_triangles();witness=[]
for tri in g.loop_triangles:
 mat=g.materials[tri.material_index].name;row=[]
 for li in tri.loops:
  p=o.matrix_world@g.vertices[g.loops[li].vertex_index].co
  row.append({'p':[p.x,p.z,-p.y],'uv0':[g.uv_layers[0].data[li].uv.x,1-g.uv_layers[0].data[li].uv.y],'uv1':[g.uv_layers[1].data[li].uv.x,1-g.uv_layers[1].data[li].uv.y]})
 witness.append({'material':mat,'corners':row})
(E/'source-uv-witness.json.gz').write_bytes(gzip.compress(json.dumps(witness,separators=(',',':')).encode(),mtime=0))
im=bpy.data.images[o['diffuseAtlasImage']];pixels=array('f',[0])*(len(im.pixels));im.pixels.foreach_get(pixels);width,height=im.size
raw=b''.join(struct.pack('<'+'e'*(width*4),*pixels[y*width*4:(y+1)*width*4])for y in reversed(range(height)))
fileRaw=gzip.decompress((R/a['atlas']['file']).read_bytes());match=sha(raw)==sha(fileRaw)
report={'status':'PASS independent source preservation; atlas packing '+('PASS'if match else'FAIL'),'sourceSHA256':a['sourceMasterSHA256'],'masterSHA256':a['masterSHA256'],'unchangedObjects':len(before)-1-len(a.get('controlledFixtureMaterialBindings',[])),'controlledFixtureBindings':a.get('controlledFixtureMaterialBindings',[]),'allLocalTransformsParentsVisibilityPreserved':True,'targetTopologyMaterialSlotsBaseUVPreserved':True,'sourceTriangles':len(witness),'uv2Witness':'source-uv-witness.json.gz','packedImage':bool(im.packed_file),'packedFormat':im.file_format,'floatImage':im.is_float,'packedRawSHA256':sha(raw),'shippingRawSHA256':sha(fileRaw),'packedAtlasExact':match,'maxPackedRGB':max(pixels[i+k]for i in range(0,len(pixels),4)for k in range(3))}
(D/'V02_Diffuse_Pilot_Master_Validation.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report),flush=True)
assert match,'Packed Blender image differs from source-linear atlas; repair source packing before runtime admission'
