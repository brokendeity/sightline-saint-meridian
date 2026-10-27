"""Recess existing V02 slab undersides; preserve tops, sides and contact boxes.

Separate Blender master and selective replacement chunks. Original city assets,
accepted masters, collision records and public route metadata remain immutable.
"""
import bpy,bmesh,json,math,hashlib
from pathlib import Path
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';OUT=R/'assets/city/vertical-v02/coffered';OUT.mkdir(exist_ok=True)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
basefile=R/'assets/city/vertical-v02/transit-world/manifest.json';base=json.loads(basefile.read_text());visual=json.loads((R/'assets/city/vertical-v02/visual/facades.json').read_text());source=R/visual['master'];assert sha(source)==visual['masterSHA256'];bpy.ops.wm.open_mainfile(filepath=str(source))
materials={k:bpy.data.materials['V02_'+k]for k in ['deck','steel','cyan','warm','glass']};palette=list(materials)
selected=[r for r in base['records']if r.get('walkable') and r['material']=='deck' and abs(r['size'][1]-.6)<1e-8 and min(r['size'][0],r['size'][2])>=4]
changes=[]
for r in selected:
 obj=bpy.data.objects[r['id']];sx,h,sy=r['size'];depth=.065;rim=.15;bevel=.055
 nx=max(2,2*math.ceil(sx/8.4));ny=max(2,2*math.ceil(sy/8.4));verts=[];faces=[];slots=[];indices={}
 def vertex(v):
  key=tuple(round(x,7)for x in v)
  if key not in indices:indices[key]=len(verts);verts.append(v)
  return indices[key]
 def face(points,kind):faces.append(tuple(vertex(p)for p in points));slots.append(palette.index(kind))
 for ix in range(nx):
  for iy in range(ny):
   x0=-sx/2+sx*ix/nx;x1=-sx/2+sx*(ix+1)/nx;y0=-sy/2+sy*iy/ny;y1=-sy/2+sy*(iy+1)/ny
   z0=-h/2;z1=h/2
   # Full top stays flat and supported; adjacent cell vertices are shared.
   top=[(x0,y0,z1),(x1,y0,z1),(x1,y1,z1),(x0,y1,z1)];face(top,'deck')
   outer=[(x0,y0,z0),(x1,y0,z0),(x1,y1,z0),(x0,y1,z0)]
   ring=[(x0+rim,y0+rim,z0),(x1-rim,y0+rim,z0),(x1-rim,y1-rim,z0),(x0+rim,y1-rim,z0)]
   inset=[(x0+rim+bevel,y0+rim+bevel,z0+depth),(x1-rim-bevel,y0+rim+bevel,z0+depth),(x1-rim-bevel,y1-rim-bevel,z0+depth),(x0+rim+bevel,y1-rim-bevel,z0+depth)]
   for i in range(4):
    j=(i+1)%4;face([outer[i],outer[j],ring[j],ring[i]],'steel');face([ring[i],ring[j],inset[j],inset[i]],'steel')
   face(inset,'deck')
   for i,edge in enumerate([iy==0,ix==nx-1,iy==ny-1,ix==0]):
    if edge:j=(i+1)%4;face([outer[i],top[i],top[j],outer[j]],'deck')
 mesh=bpy.data.meshes.new(r['id']+'__coffered');mesh.from_pydata(verts,[],faces);mesh.update()
 for m in materials.values():mesh.materials.append(m)
 for poly,slot in zip(mesh.polygons,slots):poly.material_index=slot
 bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));assert all(e.is_manifold for e in bm.edges),r['id'];bm.to_mesh(mesh);bm.free();mesh.update()
 uv=mesh.uv_layers.new(name='Metres_2_4')
 for p in mesh.polygons:
  axis=max(range(3),key=lambda i:abs(p.normal[i]));axes=[i for i in range(3)if i!=axis]
  for loop in p.loop_indices:
   v=mesh.vertices[mesh.loops[loop].vertex_index].co;uv.data[loop].uv=(v[axes[0]]/2.4,v[axes[1]]/2.4)
 original=obj.data;obj.data=mesh;obj['v02CeilingDepthMeters']=depth;obj['v02UnchangedTopHeight']=r['box']['max'][1];obj['v02VisualRefinement']='Recessed soffit inside accepted slab envelope'
 changes.append({'id':r['id'],'cells':nx*ny,'grid':[nx,ny],'depth':depth,'bounds':r['box'],'topY':r['box']['max'][1],'oldVertices':len(original.vertices),'vertices':len(mesh.vertices),'triangles':sum(len(p.vertices)-2 for p in mesh.polygons)})
bpy.context.view_layer.update()
ids={r['id']for r in selected};fixtureMounts=[]
for f in base['records']:
 if f.get('sourceSurface')not in ids or not f['id'].startswith('detail-soffit-'):continue
 r=next(r for r in selected if r['id']==f['sourceSurface']);nx,ny=next(c['grid']for c in changes if c['id']==r['id']);supported=False
 for axis,n in [(0,nx),(2,ny)]:
  lo=r['box']['min'][axis];length=r['size'][axis];q=f['center'][axis];boundary=lo+round((q-lo)/length*n)*length/n
  if abs(boundary-q)+f['size'][axis]/2<=.15+.00001:supported=True
 assert supported,('Fixture falls inside a recess instead of its mounting rib',f['id'])
 fixtureMounts.append(f['id'])
affected=[c for c in base['chunks']if ids.intersection(c['recordIDs'])]
exportCollection=bpy.data.collections['SM_V02_EXPORT']
for o in list(exportCollection.objects):bpy.data.objects.remove(o,do_unlink=True)
exportCollection.hide_viewport=False;exportCollection.hide_render=False
# The saved visual master has a browser-equivalent fixture-atlas shader. glTF
# exports its underlying PBR surface; the existing runtime installs that field.
restore=[]
for m in materials.values():
 output=m.node_tree.nodes.get('Material Output');bsdf=m.node_tree.nodes.get('Principled BSDF')
 prior=[link.from_socket for link in m.node_tree.links if link.to_socket==output.inputs['Surface']]
 if prior:restore.append((m,output,prior[0]));m.node_tree.links.new(bsdf.outputs['BSDF'],output.inputs['Surface'])
chunks=[c for c in base['chunks']if c not in affected]
for old in affected:
 name=old['id']+'-coffered';verts=[];faces=[];slots=[];uvs=[]
 for id in old['recordIDs']:
  o=bpy.data.objects[id];first=len(verts);verts.extend(tuple(o.matrix_world@v.co)for v in o.data.vertices)
  for p in o.data.polygons:
   faces.append(tuple(first+i for i in p.vertices));m=o.data.materials[p.material_index];slots.append(next(i for i,k in enumerate(palette)if materials[k]==m));uvs.append([tuple(o.data.uv_layers.active.data[i].uv)for i in p.loop_indices])
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update()
 for m in materials.values():mesh.materials.append(m)
 uv=mesh.uv_layers.new(name='Metres_2_4')
 for p,slot,coords in zip(mesh.polygons,slots,uvs):
  p.material_index=slot
  for i,value in zip(p.loop_indices,coords):uv.data[i].uv=value
 o=bpy.data.objects.new(name,mesh);exportCollection.objects.link(o);o['v02Chunk']=name;o['runtimeIDs']=json.dumps(old['recordIDs'])
 bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
 file=OUT/(name+'.glb');bpy.ops.export_scene.gltf(filepath=str(file),export_format='GLB',use_selection=True,export_yup=True,export_extras=True,export_tangents=True)
 data=file.read_bytes();g=json.loads(data[20:20+int.from_bytes(data[12:16],'little')]);assert g.get('meshes') and g.get('accessors'),name
 chunks.append({**old,'id':name,'url':str(file.relative_to(R)),'sha256':sha(file),'bytes':file.stat().st_size,'triangles':sum(len(f)-2 for f in faces),'replaces':old['id']})
for m,output,socket in restore:m.node_tree.links.new(socket,output.inputs['Surface'])
exportCollection.hide_viewport=True;exportCollection.hide_render=True
manifest={**base,'schema':'sm-v02-coffered-soffits-1','chunks':chunks,'status':'VISUAL CANDIDATE — exported and native acceptance pending','sourceTransitWorldManifestSHA256':sha(basefile),'soffitRefinement':{'changedIDs':sorted(ids),'depthMeters':.065,'topAndContactRecordsUnchanged':True,'sourceMasterSHA256':sha(source)}}
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
master=D/'blender/SaintMeridian_V02_Coffered_Soffits.blend';bpy.ops.wm.save_as_mainfile(filepath=str(master))
report={'status':'AUTHORED recessed soffits; independent source/export/native checks pending','master':str(master.relative_to(R)),'masterSHA256':sha(master),'sourceMaster':str(source.relative_to(R)),'sourceMasterSHA256':sha(source),'sourceManifestSHA256':sha(basefile),'authoringSHA256':sha(Path(__file__)),'manifestSHA256':sha(OUT/'manifest.json'),'fixtureMountsOnRibs':fixtureMounts,'changedSlabs':changes,'changedChunks':[c for c in chunks if c.get('replaces')],'reusedChunks':len(base['chunks'])-len(affected),'recordsUnchanged':manifest['records']==base['records'],'floorSupportAndRoutesUnchanged':True,'originalBuildingCopiesExported':0,'limitations':['6.5cm underside relief uses the existing conservative slab contact envelope','This authoring report alone does not establish runtime geometry, camera, Threadrail or visual acceptance']}
(D/'V02_Coffered_Authoring.json').write_text(json.dumps(report,indent=2)+'\n');print('Coffered slabs',len(changes),'replacement chunks',len(affected),'cells',sum(c['cells']for c in changes))
