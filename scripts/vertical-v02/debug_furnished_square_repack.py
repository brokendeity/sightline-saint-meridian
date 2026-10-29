from pathlib import Path
import bpy,ast,json,math,sys
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';E=D/'evidence/furnished-public-lighting-uv-review'
script=Path(__file__).with_name('validate_furnished_public_lighting.py');defs=[n for n in ast.parse(script.read_text()).body if isinstance(n,ast.FunctionDef)and n.name in ['polygon_area','intersection']];exec(compile(ast.Module(body=defs,type_ignores=[]),str(script),'exec'),globals())
a=json.loads((D/'V02_Furnished_Public_Lighting_Authoring.json').read_text());bpy.ops.wm.open_mainfile(filepath=str(R/a['master']))
for room in a['rooms']:
 objects=[bpy.data.objects[n]for n in room['sourceIDs']]
 bpy.ops.object.select_all(action='DESELECT')
 for obj in objects:obj.select_set(True);obj.data.uv_layers.active_index=1
 bpy.context.view_layer.objects.active=objects[0]
 before={o.name:[list(u.uv)for u in o.data.uv_layers[0].data]for o in objects}
 bpy.context.scene.tool_settings.use_uv_select_sync=True
 bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT')
 print('PACK_OBJECTS',room['floor'],len(bpy.context.objects_in_mode),flush=True)
 bpy.ops.uv.smart_project(angle_limit=math.radians(66),margin_method='FRACTION',island_margin=2/1024,correct_aspect=False,scale_to_bounds=True)
 bpy.ops.uv.pack_islands(rotate=True,rotate_method='CARDINAL',scale=True,merge_overlap=False,margin_method='FRACTION',margin=2/1024,shape_method='AABB')
 bpy.ops.object.mode_set(mode='OBJECT')
 for obj in objects:assert before[obj.name]==[list(u.uv)for u in obj.data.uv_layers[0].data]
 tris=[]
 for obj in objects:
  obj.data.calc_loop_triangles();uv=obj.data.uv_layers[1]
  tris.extend([[list(uv.data[i].uv)for i in t.loops]for t in obj.data.loop_triangles])
 grid={};bad=[]
 for i,tri in enumerate(tris):
  if polygon_area(tri)<1e-12:continue
  low=[math.floor(min(p[k]for p in tri)*16)for k in range(2)];high=[math.floor(max(p[k]for p in tri)*16)for k in range(2)]
  cells=[(x,y)for x in range(low[0],high[0]+1)for y in range(low[1],high[1]+1)]
  for j in {j for cell in cells for j in grid.get(cell,[])}:
   area=intersection(tri,tris[j])
   if area>1e-9:bad.append([i,j,area])
  for cell in cells:grid.setdefault(cell,[]).append(i)
 print('PACK_OVERLAPS',room['floor'],len(bad),max([b[2]for b in bad]or[0]),flush=True)
 (E/f'room-{room["floor"]}-repacked-uv.json').write_text(json.dumps({'triangles':tris,'overlaps':bad}))
 assert not bad
print('PASS explicit all-room AABB pack diagnostic; lighting must be rebaked',flush=True)
