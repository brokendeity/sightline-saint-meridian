import bpy,json
from pathlib import Path
project=Path(__file__).resolve().parents[1];root=project/'blender/SaintMeridian/models';out=project/'buildings/saint_meridian';out.mkdir(exist_ok=True)
result=[]
for i in range(1,9):
 bpy.ops.wm.open_mainfile(filepath=str(root/f'building_{i:02d}.blend'))
 objects=[o for o in bpy.data.objects if o.type=='MESH'];boxes=[]
 for o in objects:
  role=o.get('architectural_role',o.name)
  material=o.data.materials[0].name if o.data.materials else ''
  if material not in ['Midnight alloy cladding','Dark structural steel','Concrete foundations','Teal architectural glass']:continue
  if any(s in role.lower() for s in ['mullion','handle','vent','rail','balcony glass','balcony returns','counter','antenna','louvers']):continue
  # Authored cuboids are disconnected eight-vertex components, before decorative bevels.
  verts=list(o.data.vertices)
  if len(verts)%8:continue
  for k in range(0,len(verts),8):
   p=[o.matrix_world@v.co for v in verts[k:k+8]]
   lo=[min(v[a] for v in p) for a in range(3)];hi=[max(v[a] for v in p) for a in range(3)]
   if min(hi[a]-lo[a] for a in range(3))<.07:continue
   boxes.append({'min':[lo[0],lo[2],-hi[1]],'max':[hi[0],hi[2],-lo[1]],'role':role})
 # Remove redundant volumes fully enclosed by other structural volumes.
 boxes=[b for n,b in enumerate(boxes) if not any(n!=j and all(a['min'][k]<=b['min'][k]+1e-5 and a['max'][k]>=b['max'][k]-1e-5 for k in range(3)) and (j<n or a['min']!=b['min'] or a['max']!=b['max']) for j,a in enumerate(boxes))]
 result.append({'file':f'building_{i:02d}.glb','boxes':boxes});print(i,len(boxes))
(out/'collisions.json').write_text(json.dumps(result,separators=(',',':')))
