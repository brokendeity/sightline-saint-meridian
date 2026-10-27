"""Blender master fork: raised glazed station stair pavilion with column notch."""
import bpy,bmesh,hashlib,json,sys,math
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent));from v02_scene_signatures import signatures
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';O=R/'assets/city/vertical-v02/station-pavilion';O.mkdir(exist_ok=True)
read=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();plan=read(D/'V02_Station_Pavilion_Plan.json');assert plan['status'].startswith('PASS');source=R/plan['sourceMaster'];assert sha(source)==plan['sourceMasterSHA256'];base=read(R/plan['sourceManifest']);assert sha(R/plan['sourceManifest'])==plan['sourceManifestSHA256'];bpy.ops.wm.open_mainfile(filepath=str(source));bpy.context.view_layer.update();before=signatures()
materials={k:bpy.data.materials['V02_'+k]for k in ['deck','steel','glass','cyan','warm']}
glass=materials['glass'].copy();glass.name='V02_station_canopy_glass';glass.diffuse_color=(.09,.20,.24,.28);bsdf=glass.node_tree.nodes.get('Principled BSDF');bsdf.inputs['Base Color'].default_value=(.09,.20,.24,1);bsdf.inputs['Alpha'].default_value=.28;bsdf.inputs['Roughness'].default_value=.24;bsdf.inputs['Metallic'].default_value=.12;glass.surface_render_method='DITHERED';materials['roofglass']=glass
col=bpy.data.collections.new('SM_V02_STATION_PAVILION');bpy.context.scene.collection.children.link(col);export=bpy.data.collections.new('SM_V02_STATION_PAVILION_EXPORT');bpy.context.scene.collection.children.link(export)
def mesh(name,verts,faces,kinds):
 data=bpy.data.meshes.new(name);data.from_pydata(verts,[],faces);data.update()
 for m in materials.values():data.materials.append(m)
 palette=list(materials)
 for p,k in zip(data.polygons,kinds):p.material_index=palette.index(k)
 bm=bmesh.new();bm.from_mesh(data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));assert all(e.is_manifold for e in bm.edges),name;bm.to_mesh(data);bm.free();data.update();assert not data.validate(verbose=True),name
 uv=data.uv_layers.new(name='Metres_2_4')
 for f in data.polygons:
  axes=[i for i in range(3)if i!=max(range(3),key=lambda i:abs(f.normal[i]))]
  for loop in f.loop_indices:v=data.vertices[data.loops[loop].vertex_index].co;uv.data[loop].uv=(v[axes[0]]/2.4,v[axes[1]]/2.4)
 return data
def boxmesh(r):
 x,h,z=r['size'];verts=[(a*x/2,b*z/2,c*h/2)for a,b,c in [(-1,-1,-1),(-1,-1,1),(-1,1,-1),(-1,1,1),(1,-1,-1),(1,-1,1),(1,1,-1),(1,1,1)]];faces=[(0,2,6,4),(1,5,7,3),(0,4,5,1),(2,3,7,6),(0,1,3,2),(4,6,7,5)]
 return mesh(r['id'],verts,faces,[r['material']]*6)
def roofmesh(r):
 sx,h,sz=r['size'];cx,_,cz=r['center'];loX,hiX=r['box']['min'][0],r['box']['max'][0];loZ,hiZ=r['box']['min'][2],r['box']['max'][2]
 xs=sorted(set([loX,hiX]+[58.7+2.3*i for i in range(7)if loX+1e-6<58.7+2.3*i<hiX-1e-6]));zs=sorted(set([loZ,hiZ]+[370.95+2*i for i in range(9)if loZ+1e-6<370.95+2*i<hiZ-1e-6]));verts=[];faces=[];kinds=[];lookup={}
 def face(points,kind):
  ids=[]
  for p in points:
   p=(p[0]-cx,p[1]-cz,p[2]);key=tuple(round(v,7)for v in p)
   if key not in lookup:lookup[key]=len(verts);verts.append(p)
   ids.append(lookup[key])
  faces.append(tuple(ids));kinds.append(kind)
 for ix,(x0,x1)in enumerate(zip(xs,xs[1:])):
  for iz,(z0,z1)in enumerate(zip(zs,zs[1:])):
   rim=min(.10,(x1-x0)*.15,(z1-z0)*.15);top=[(x0,z0,h/2),(x1,z0,h/2),(x1,z1,h/2),(x0,z1,h/2)];bottom=[(x0,z0,-h/2),(x1,z0,-h/2),(x1,z1,-h/2),(x0,z1,-h/2)]
   innerTop=[(x0+rim,z0+rim,h/2),(x1-rim,z0+rim,h/2),(x1-rim,z1-rim,h/2),(x0+rim,z1-rim,h/2)];innerBottom=[(x,z,-h/2+.02)for x,z,_ in innerTop]
   face(innerTop,'roofglass');face(innerBottom,'roofglass')
   for j in range(4):k=(j+1)%4;face([top[j],top[k],innerTop[k],innerTop[j]],'steel');face([bottom[j],bottom[k],innerBottom[k],innerBottom[j]],'steel')
   for j,outer in enumerate([iz==0,ix==len(xs)-2,iz==len(zs)-2,ix==0]):
    if outer:k=(j+1)%4;face([bottom[j],top[j],top[k],bottom[k]],'steel')
 return mesh(r['id'],verts,faces,kinds)
changed={c['after']['id']:c['after']for c in plan['changes']};allowed=set(changed);markers=[]
for r in list(changed.values())+plan['additions']:
 o=bpy.data.objects.get(r['id'])
 data=roofmesh(r)if r['id']=='station-stair-weather-roof'or r['id'].startswith('station-pavilion-roof-')else boxmesh(r)
 if o:o.data=data
 else:o=bpy.data.objects.new(r['id'],data);col.objects.link(o);o['v02StableID']=r['id'];o['runtimeOwner']=r['owner'];o['solid']=r['solid'];o['walkable']=r['walkable']
 o.location=(r['center'][0],-r['center'][2],r['center'][1]);o.scale=(1,1,1);o['pavilionRefinement']='Raised clerestory/glazed roof, actual column clearance and physically mounted rib lights'
 found=[]
 for c in bpy.data.collections['SM_V02_COLLISION'].objects:
  if c.get('sourceComponent')==r['id']or c.name==r['id']+'__COL':found.append(c)
 if r['solid']and not found:
  c=bpy.data.objects.new(r['id']+'__COL',None);c.empty_display_type='CUBE';c['sourceComponent']=r['id'];bpy.data.collections['SM_V02_COLLISION'].objects.link(c);found=[c]
 for c in found:c.location=o.location;c.scale=(r['size'][0]/2,r['size'][2]/2,r['size'][1]/2);allowed.add(c.name);markers.append(c.name)
bpy.context.view_layer.update();records=[changed.get(r['id'],r)for r in base['records']]+plan['additions'];affected=[c for c in base['chunks']if set(c['recordIDs'])&set(changed)];assert len(affected)==1
jobs=[('station-pavilion-replacement',affected[0]['recordIDs'],affected[0]),('station-pavilion-notched-roof',[r['id']for r in plan['additions']],None)];chunks=[c for c in base['chunks']if c not in affected];exports=[];restore=[]
# Retain the source render field; export underlying PBR exactly as the prior master did.
for m in materials.values():
 out=m.node_tree.nodes.get('Material Output');bsdf=m.node_tree.nodes.get('Principled BSDF');old=next((l.from_socket for l in m.node_tree.links if l.to_socket==out.inputs['Surface']),None)
 if old:restore.append((m,out,old));m.node_tree.links.new(bsdf.outputs['BSDF'],out.inputs['Surface'])
for name,ids,old in jobs:
 verts=[];faces=[];slots=[];uvs=[];palette=[]
 for id in ids:
  o=bpy.data.objects[id];first=len(verts);verts.extend(tuple(o.matrix_world@v.co)for v in o.data.vertices)
  for f in o.data.polygons:
   mat=o.data.materials[f.material_index]
   if mat not in palette:palette.append(mat)
   faces.append(tuple(first+i for i in f.vertices));slots.append(palette.index(mat));uvs.append([tuple(o.data.uv_layers.active.data[i].uv)for i in f.loop_indices])
 data=bpy.data.meshes.new(name);data.from_pydata(verts,[],faces);data.update()
 for m in palette:data.materials.append(m)
 uv=data.uv_layers.new(name='Metres_2_4')
 for f,slot,coords in zip(data.polygons,slots,uvs):
  f.material_index=slot
  for loop,value in zip(f.loop_indices,coords):uv.data[loop].uv=value
 obj=bpy.data.objects.new(name,data);export.objects.link(obj);obj['v02Chunk']=name;obj['runtimeIDs']=json.dumps(ids);bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj;file=O/(name+'.glb');bpy.ops.export_scene.gltf(filepath=str(file),export_format='GLB',use_selection=True,export_yup=True,export_extras=True,export_tangents=True);data.calc_loop_triangles();c={'id':name,'url':str(file.relative_to(R)),'sha256':sha(file),'bytes':file.stat().st_size,'triangles':len(data.loop_triangles),'recordIDs':ids}
 if old:c['replaces']=old['id']
 chunks.append(c);exports.append(c)
for m,out,socket in restore:m.node_tree.links.new(socket,out.inputs['Surface'])
export.hide_render=export.hide_viewport=True;bpy.context.view_layer.update();after=signatures();assert all(after[n]==h for n,h in before.items()if n not in allowed),'Unrelated source object changed'
master=D/'blender/SaintMeridian_V02_Station_Pavilion.blend';bpy.ops.wm.save_as_mainfile(filepath=str(master));bpy.ops.wm.open_mainfile(filepath=str(master));bpy.context.view_layer.update();after=signatures();assert all(after[n]==h for n,h in before.items()if n not in allowed)
manifest={**base,'records':records,'chunks':chunks,'stationPavilion':{'controlledModifications':plan['changes'],'addedIDs':[r['id']for r in plan['additions']],'roofHeadroom':4,'notchClearance':.08,'scope':'Actual raised framed glazing and column-cleared compound roof; existing original city and public floor routes unchanged'},'status':'STATION PAVILION CANDIDATE — native/source/export/visual acceptance pending'};(O/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
report={'status':'PASS saved/reopened bounded source preservation; shipping/native/visual checks pending','sourceMaster':str(source.relative_to(R)),'sourceMasterSHA256':sha(source),'master':str(master.relative_to(R)),'masterSHA256':sha(master),'planSHA256':sha(D/'V02_Station_Pavilion_Plan.json'),'authoringSHA256':sha(Path(__file__)),'unchangedSourceObjects':sum(n not in allowed for n in before),'controlledChangedSourceObjects':sorted(n for n,h in before.items()if after[n]!=h),'markers':markers,'exports':exports,'reusedChunks':len(base['chunks'])-len(affected),'newDynamicLights':0,'originalBuildingsChanged':0};(D/'V02_Station_Pavilion_Authoring.json').write_text(json.dumps(report,indent=2)+'\n');print(report['status'],len(changed),'modified source records',len(plan['additions']),'additions')
