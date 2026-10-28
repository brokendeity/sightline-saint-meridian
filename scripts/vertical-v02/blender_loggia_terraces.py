"""Source-authored stacked rooms, real stair and controlled old rail portals."""
import bpy,bmesh,json,hashlib,math,sys,ast,copy,gzip,struct
from pathlib import Path
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';O=R/'assets/city/vertical-v02/loggia-terraces';O.mkdir(exist_ok=True)
sys.path.insert(0,str(Path(__file__).parent));from v02_scene_signatures import signatures
read=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
plan=read(D/'V02_Loggia_Terraces_Plan.json');assert plan['status'].startswith('PASS');source=R/plan['sourceMaster'];assert sha(source)==plan['sourceMasterSHA256'];base=read(R/plan['sourceManifest']);assert sha(R/plan['sourceManifest'])==plan['sourceManifestSHA256']
bpy.ops.wm.open_mainfile(filepath=str(source));bpy.context.view_layer.update();before=signatures()
materials={k:bpy.data.materials['V02_'+k]for k in ['deck','steel','cyan','warm','glass']};materials['soffit']=bpy.data.materials['V02_arcade_soffit'];materials['foliage']=bpy.data.materials['V02_terrace_foliage'];palette=list(materials)
V=[(-1,-1,-1),(-1,-1,1),(-1,1,-1),(-1,1,1),(1,-1,-1),(1,-1,1),(1,1,-1),(1,1,1)];F=[(0,2,6,4),(1,5,7,3),(0,4,5,1),(2,3,7,6),(0,1,3,2),(4,6,7,5)]
# Reuse the saved/reopened public-terrace manifold roof/guard/foliage authoring
# functions only; never execute the older project's mutation/export program.
helper=Path(__file__).with_name('blender_public_terraces.py');tree=ast.parse(helper.read_text());functions=[n for n in tree.body if isinstance(n,ast.FunctionDef)and n.name in ['finish','parts','make']]
assert len(functions)==3;exec(compile(ast.Module(body=functions,type_ignores=[]),str(helper),'exec'),globals())
col=bpy.data.collections.new('SM_V02_LOGGIA_TERRACES');bpy.context.scene.collection.children.link(col);export=bpy.data.collections.new('SM_V02_LOGGIA_EXPORT');bpy.context.scene.collection.children.link(export)
changed={c['after']['id']:c['after']for c in plan['changes']};allowed=set(changed)
markers_by_id={}
for marker in bpy.data.collections['SM_V02_COLLISION'].objects:
    key=marker.get('sourceComponent')or marker.name.removesuffix('__COL');markers_by_id.setdefault(key,[]).append(marker)
for r in list(changed.values())+plan['additions']:
    o=bpy.data.objects.get(r['id']);data=make(r)
    if o:o.data=data
    else:o=bpy.data.objects.new(r['id'],data);col.objects.link(o);o['v02StableID']=r['id'];o['runtimeOwner']=r['owner'];o['solid']=r['solid'];o['walkable']=r['walkable']
    o.location=(r['center'][0],-r['center'][2],r['center'][1]);o.scale=(1,1,1);o['loggiaTerraceRefinement']='Public stacked loggias and24→128m ordinary stair'
    markers=markers_by_id.get(r['id'],[])
    if r['solid']and not markers:
        marker=bpy.data.objects.new(r['id']+'__COL',None);marker['sourceComponent']=r['id'];marker.empty_display_type='CUBE';bpy.data.collections['SM_V02_COLLISION'].objects.link(marker);markers=[marker]
    for marker in markers:marker.location=o.location;marker.scale=(r['size'][0]/2,r['size'][2]/2,r['size'][1]/2);allowed.add(marker.name)
bpy.context.view_layer.update();records=[changed.get(r['id'],r)for r in base['records']]+plan['additions'];affected=[c for c in base['chunks']if set(c['recordIDs'])&set(changed)]
rooms=[r['id']for r in plan['additions']if r['id'].startswith('loggia-room-')];others=[r['id']for r in plan['additions']if r['id']not in set(rooms)]
jobs=[('loggia-portal-replacement-'+str(i),c['recordIDs'],c)for i,c in enumerate(affected)]+[('loggia-rooms',rooms,None),('loggia-public-stair',others,None)]
chunks=[c for c in base['chunks']if c not in affected];exports=[];restore=[]
for m in materials.values():
    out=m.node_tree.nodes.get('Material Output');bs=m.node_tree.nodes.get('Principled BSDF');prior=next((l.from_socket for l in m.node_tree.links if l.to_socket==out.inputs['Surface']),None)
    if prior:restore.append((m,out,prior));m.node_tree.links.new(bs.outputs['BSDF'],out.inputs['Surface'])
for name,ids,old in jobs:
    verts=[];faces=[];slots=[];uvs=[];local=[]
    for id in ids:
        o=bpy.data.objects[id];first=len(verts);verts.extend(tuple(o.matrix_world@v.co)for v in o.data.vertices)
        for f in o.data.polygons:
            m=o.data.materials[f.material_index]
            if m not in local:local.append(m)
            faces.append(tuple(first+i for i in f.vertices));slots.append(local.index(m));uvs.append([tuple(o.data.uv_layers.active.data[i].uv)for i in f.loop_indices])
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update()
    for m in local:mesh.materials.append(m)
    uv=mesh.uv_layers.new(name='Metres_2_4')
    for f,slot,values in zip(mesh.polygons,slots,uvs):
        f.material_index=slot
        for loop,value in zip(f.loop_indices,values):uv.data[loop].uv=value
    o=bpy.data.objects.new(name,mesh);export.objects.link(o);o['v02Chunk']=name;o['runtimeIDs']=json.dumps(ids)
    bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;file=O/(name+'.glb');bpy.ops.export_scene.gltf(filepath=str(file),export_format='GLB',use_selection=True,export_yup=True,export_extras=True,export_tangents=True)
    mesh.calc_loop_triangles();c={'id':name,'url':str(file.relative_to(R)),'sha256':sha(file),'bytes':file.stat().st_size,'triangles':len(mesh.loop_triangles),'recordIDs':ids}
    if old:c['replaces']=old['id']
    chunks.append(c);exports.append(c)
for m,out,socket in restore:m.node_tree.links.new(socket,out.inputs['Surface'])
export.hide_render=export.hide_viewport=True;bpy.context.view_layer.update();after=signatures();assert all(after[n]==h for n,h in before.items()if n not in allowed)
master=D/'blender/SaintMeridian_V02_Loggia_Terraces.blend';bpy.ops.wm.save_as_mainfile(filepath=str(master));bpy.ops.wm.open_mainfile(filepath=str(master));bpy.context.view_layer.update();after=signatures();assert all(after[n]==h for n,h in before.items()if n not in allowed)
manifest={**base,'records':records,'chunks':chunks,'loggiaTerraces':{'controlledModifications':plan['changes'],'addedIDs':[r['id']for r in plan['additions']],'rooms':plan['rooms'],'stairPoints':plan['stairPoints'],'scope':'Physical public loggias at40/68/100 and26stair flights24→128; no new private doorway through original tower'},'status':'LOGGIA TERRACES CANDIDATE; native/input/visual acceptance pending'}
(O/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
report={'status':'PASS saved/reopened bounded source preservation; shipping/native/input/visual pending','sourceMaster':str(source.relative_to(R)),'sourceMasterSHA256':sha(source),'master':str(master.relative_to(R)),'masterSHA256':sha(master),'authoringSHA256':sha(Path(__file__)),'helperSHA256':sha(helper),'planSHA256':sha(D/'V02_Loggia_Terraces_Plan.json'),'unchangedSourceObjects':sum(n not in allowed for n in before),'controlledChangedSourceObjects':sorted(n for n,h in before.items()if after[n]!=h),'exports':exports,'reusedChunks':len(base['chunks'])-len(affected),'newDynamicLights':0,'originalBuildingsChanged':0}
(D/'V02_Loggia_Terraces_Authoring.json').write_text(json.dumps(report,indent=2)+'\n');print(report['status'],len(exports),'new shipping chunks',flush=True)

# Re-bake the existing source-authored local panorama from the new actual city.
# Original owners/reflectance stay unchanged; no older contract or probe changes.
contract=read(R/'assets/city/vertical-v02/material-response/materials.json');scene=bpy.context.scene;scene.camera=bpy.data.objects['V02 corridor HDR reflection probe'];scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=32;scene.cycles.use_denoising=True;scene.cycles.max_bounces=6;scene.cycles.transparent_max_bounces=5;scene.render.threads_mode='FIXED';scene.render.threads=8;scene.render.resolution_x=1024;scene.render.resolution_y=512;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='OPEN_EXR';scene.render.image_settings.color_depth='16';E=D/'evidence/loggia-terraces';E.mkdir(exist_ok=True);scene.render.filepath=str(E/'corridor-radiance.exr');bpy.ops.render.render(write_still=True);img=bpy.data.images.load(str(E/'corridor-radiance.exr'),check_existing=False);pixels=list(img.pixels);assert len(pixels)==1024*512*4 and all(math.isfinite(x)and x>=0 for x in pixels);raw=struct.pack('<'+'e'*len(pixels),*pixels);file=O/'corridor-radiance.rgba16f.gz';file.write_bytes(gzip.compress(raw,mtime=0));scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_depth='8';img.save_render(str(E/'corridor-radiance.png'),scene=scene)
contract.update({'master':str(master.relative_to(R)),'masterSHA256':sha(master),'sourceMaster':str(source.relative_to(R)),'sourceMasterSHA256':sha(source),'status':'AUTHORED current loggia city; native visual acceptance pending'})
contract['environment'].update({'url':str(file.relative_to(R)),'sha256':sha(file),'rawSHA256':hashlib.sha256(raw).hexdigest(),'bytes':file.stat().st_size})
(O/'materials.json').write_text(json.dumps(contract,indent=2)+'\n');print('PASS new actual-city reflection probe',file.stat().st_size,'bytes',flush=True)
