"""Author real public terrace rooms and controlled gallery rail openings.
Original city meshes and every unrelated source object remain immutable.
"""
import bpy,bmesh,json,hashlib,math,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent));from v02_scene_signatures import signatures
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';O=R/'assets/city/vertical-v02/public-terraces';O.mkdir(exist_ok=True);read=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();plan=read(D/'V02_Public_Terrace_Plan.json');assert plan['status'].startswith('PASS');assert all(sha(R/f)==h for f,h in plan['sources'].items());base=read(R/'assets/city/vertical-v02/gallery-arcades/runtime/manifest.json');prior=read(D/'V02_Gallery_Arcade_Authoring.json');source=R/prior['master'];assert sha(source)==prior['masterSHA256'];bpy.ops.wm.open_mainfile(filepath=str(source));bpy.context.view_layer.update();before=signatures();allowed={r['after']['id']for r in plan['controlledModifications']};allowed|={id+'__COL'for id in allowed};materials={k:bpy.data.materials['V02_'+k]for k in ['deck','steel','cyan','warm','glass']};materials['soffit']=bpy.data.materials['V02_arcade_soffit'];m=bpy.data.materials.new('V02_terrace_foliage');m.use_nodes=True;m.diffuse_color=(.025,.075,.037,1);p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=m.diffuse_color;p.inputs['Roughness'].default_value=.8;materials['foliage']=m;palette=list(materials)
col=bpy.data.collections.new('SM_V02_PUBLIC_TERRACES');bpy.context.scene.collection.children.link(col);export=bpy.data.collections.new('SM_V02_TERRACE_EXPORT');bpy.context.scene.collection.children.link(export)
V=[(-1,-1,-1),(-1,-1,1),(-1,1,-1),(-1,1,1),(1,-1,-1),(1,-1,1),(1,1,-1),(1,1,1)];F=[(0,2,6,4),(1,5,7,3),(0,4,5,1),(2,3,7,6),(0,1,3,2),(4,6,7,5)]
def finish(name,verts,faces,slots,bevel=0):
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update()
 for m in materials.values():mesh.materials.append(m)
 for f,i in zip(mesh.polygons,slots):f.material_index=i
 bm=bmesh.new();bm.from_mesh(mesh)
 if bevel:bmesh.ops.bevel(bm,geom=list(bm.edges),offset=bevel,segments=2,affect='EDGES')
 bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free();mesh.update();uv=mesh.uv_layers.new(name='Metres_2_4')
 for f in mesh.polygons:
  axis=max(range(3),key=lambda i:abs(f.normal[i]));axes=[i for i in range(3)if i!=axis]
  for i in f.loop_indices:v=mesh.vertices[mesh.loops[i].vertex_index].co;uv.data[i].uv=(v[axes[0]]/2.4,v[axes[1]]/2.4)
 assert not mesh.validate(verbose=True),name+' invalid mesh'
 return mesh
def parts(name,values,bevel=0):
 verts=[];faces=[];slots=[]
 for center,size,kind in values:
  first=len(verts);verts.extend(tuple(center[i]+v[i]*size[i]/2 for i in range(3))for v in V);faces.extend(tuple(first+j for j in f)for f in F);slots.extend([palette.index(kind)]*6)
 return finish(name,verts,faces,slots,bevel)
def make(r):
 sx,sy,sz=r['size'];kind=r['material'];name=r['id']
 if r.get('guardrail')and r['solid']:
  along=0 if sx>sz else 1;length=max(sx,sz);post=min(.075,length*.16);a=[sx,sz,.20];values=[([0,0,-.45],a,'steel')];a=[sx,sz,.90];a[along]=length-post*2;values.append(([0,0,.1],a,'glass'))
  for sign in[-1,1]:a=[sx,sz,1.1];a[along]=post;c=[0,0,0];c[along]=sign*(length-post)/2;values.append((c,a,'steel'))
  return parts(name,values)
 if kind=='foliage':
  verts=[];faces=[];slots=[]
  for j in range(18):
   angle=j*2.399;cx=math.cos(angle)*sx*.22;cy=math.sin(angle)*sz*.22;z=-sy*.3+(j%4)*sy*.13;length=sx*.16;lengthz=sz*.16;width=sx*.10;widthz=sz*.10;first=len(verts);points=[(cx,cy,z),(cx+math.cos(angle)*length,cy+math.sin(angle)*lengthz,z+sy*.25),(cx+math.cos(angle)*length*.6-math.sin(angle)*width,cy+math.sin(angle)*lengthz*.6+math.cos(angle)*widthz,z+sy*.1),(cx+math.cos(angle)*length*.6+math.sin(angle)*width,cy+math.sin(angle)*lengthz*.6-math.cos(angle)*widthz,z+sy*.1)];verts.extend(points);faces.extend([(first,first+1,first+2),(first,first+3,first+1),(first,first+2,first+3),(first+1,first+3,first+2)]);slots.extend([palette.index(kind)]*4)
  return finish(name,verts,faces,slots)
 if name.endswith('-roof'):
  # Closed stepped ceiling cells, full flat roof top. No cutout hole or fake
  # warm plane suspended below an intact ceiling.
  verts=[];faces=[];slots=[];lookup={}
  def face(points,kind):
   out=[]
   for p in points:
    k=tuple(round(v,7)for v in p)
    if k not in lookup:lookup[k]=len(verts);verts.append(p)
    out.append(lookup[k])
   faces.append(tuple(out));slots.append(palette.index(kind))
  for ix in range(4):
   for iz in range(4):
    x0=-sx/2+sx*ix/4;x1=x0+sx/4;z0=-sz/2+sz*iz/4;z1=z0+sz/4;lo=-sy/2;hi=sy/2;top=[(x0,z0,hi),(x1,z0,hi),(x1,z1,hi),(x0,z1,hi)];outer=[(x0,z0,lo),(x1,z0,lo),(x1,z1,lo),(x0,z1,lo)];inner=[(x0+.12,z0+.12,lo+.04),(x1-.12,z0+.12,lo+.04),(x1-.12,z1-.12,lo+.04),(x0+.12,z1-.12,lo+.04)];face(top,'deck');face(inner,'soffit')
    for j in range(4):k=(j+1)%4;face([outer[j],outer[k],inner[k],inner[j]],'steel')
    for j,edge in enumerate([iz==0,ix==3,iz==3,ix==0]):
     if edge:k=(j+1)%4;face([outer[j],top[j],top[k],outer[k]],'steel')
  return finish(name,verts,faces,slots)
 return parts(name,[([0,0,0],[sx,sz,sy],kind)],min(.025,min(sx,sy,sz)*.08)if r['solid']and kind!='glass'else 0)
# Only the named six rail spans and their light caps are shortened.
for change in plan['controlledModifications']:
 r=change['after'];o=bpy.data.objects[r['id']];o.data=make(r);o.location=(r['center'][0],-r['center'][2],r['center'][1]);o.scale=(1,1,1)
 c=bpy.data.objects.get(r['id']+'__COL')
 if c:c.location=o.location;c.scale=(r['size'][0]/2,r['size'][2]/2,r['size'][1]/2)
for r in plan['records']:
 assert r['id']not in bpy.data.objects;o=bpy.data.objects.new(r['id'],make(r));col.objects.link(o);o.location=(r['center'][0],-r['center'][2],r['center'][1]);o['v02StableID']=r['id'];o['runtimeOwner']=r['owner'];o['solid']=r['solid'];o['walkable']=r['walkable'];o['exportRole']='gallery-connected public terrace'
 if r['solid']:
  c=bpy.data.objects.new(r['id']+'__COL',None);bpy.data.collections['SM_V02_COLLISION'].objects.link(c);c.empty_display_type='CUBE';c.location=o.location;c.scale=(r['size'][0]/2,r['size'][2]/2,r['size'][1]/2);c['sourceComponent']=r['id']
bpy.context.view_layer.update();changed={r['after']['id']:r['after']for r in plan['controlledModifications']};records=[changed.get(r['id'],r)for r in base['records']]+plan['records'];affected=[c for c in base['chunks']if set(c['recordIDs'])&set(changed)];jobs=[('terrace-portal-'+str(i),c['recordIDs'],c)for i,c in enumerate(affected)]+[(level['id'],level['recordIDs'],None)for level in plan['levels']]+[('public-terrace-frame',[r['id']for r in plan['records']if r['id'].startswith('terrace-frame-')],None)];chunks=[c for c in base['chunks']if c not in affected];restore=[]
for m in materials.values():
 out=m.node_tree.nodes.get('Material Output');bsdf=m.node_tree.nodes.get('Principled BSDF');old=next((l.from_socket for l in m.node_tree.links if l.to_socket==out.inputs['Surface']),None)
 if old:restore.append((m,out,old));m.node_tree.links.new(bsdf.outputs['BSDF'],out.inputs['Surface'])
exports=[]
for name,ids,old in jobs:
 verts=[];faces=[];slots=[];uvs=[]
 for id in ids:
  o=bpy.data.objects[id];first=len(verts);verts.extend(tuple(o.matrix_world@v.co)for v in o.data.vertices)
  for f in o.data.polygons:faces.append(tuple(first+i for i in f.vertices));slots.append(palette.index(next(k for k,m in materials.items()if m==o.data.materials[f.material_index])));uvs.append([tuple(o.data.uv_layers.active.data[i].uv)for i in f.loop_indices])
 mesh=finish(name,verts,faces,slots)
 for f,values in zip(mesh.polygons,uvs):
  for i,uv in zip(f.loop_indices,values):mesh.uv_layers.active.data[i].uv=uv
 o=bpy.data.objects.new(name,mesh);export.objects.link(o);o['v02Chunk']=name;o['runtimeIDs']=json.dumps(ids);bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;file=O/(name+'.glb');bpy.ops.export_scene.gltf(filepath=str(file),export_format='GLB',use_selection=True,export_yup=True,export_extras=True,export_tangents=True);mesh.calc_loop_triangles();c={'id':name,'url':str(file.relative_to(R)),'sha256':sha(file),'bytes':file.stat().st_size,'triangles':len(mesh.loop_triangles),'recordIDs':ids}
 if old:c['replaces']=old['id']
 chunks.append(c);exports.append(c)
for m,out,socket in restore:m.node_tree.links.new(socket,out.inputs['Surface'])
export.hide_render=export.hide_viewport=True;bpy.context.view_layer.update();after=signatures();assert all(after[n]==h for n,h in before.items()if n not in allowed),'Unrelated source object changed';target=D/'blender/SaintMeridian_V02_Public_Terraces.blend';bpy.ops.wm.save_as_mainfile(filepath=str(target));bpy.ops.wm.open_mainfile(filepath=str(target));bpy.context.view_layer.update();after=signatures();assert all(after[n]==h for n,h in before.items()if n not in allowed)
manifest={**base,'records':records,'chunks':chunks,'publicTerraces':{'levels':plan['levels'],'controlledModifications':plan['controlledModifications'],'scope':'Public connected seating/outlook rooms; original tower remains intact and has no new private entrance'},'status':'PUBLIC TERRACE CANDIDATE — native/visual acceptance pending'};(O/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');report={'status':'PASS saved-source bounded preservation; export/native/visual acceptance pending','sourceMaster':str(source.relative_to(R)),'sourceMasterSHA256':sha(source),'master':str(target.relative_to(R)),'masterSHA256':sha(target),'planSHA256':sha(D/'V02_Public_Terrace_Plan.json'),'authoringSHA256':sha(Path(__file__)),'unchangedSourceObjects':sum(n not in allowed for n in before),'controlledChangedSourceObjects':sorted(n for n,h in before.items()if after[n]!=h),'newRecords':len(plan['records']),'modifiedRecords':len(changed),'exports':exports,'reusedChunks':len(base['chunks'])-len(affected),'newDynamicLights':0};(D/'V02_Public_Terrace_Authoring.json').write_text(json.dumps(report,indent=2)+'\n');print(report['status'],len(exports),'chunks')
