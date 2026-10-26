"""Author the supported rail loop and public platform in a new full city master.

Reads the accepted detailed master; never overwrites it. Only two identified
V02 guard records are replaced to open a2.8m public connection. Original city
and every other accepted contact record remain immutable.
"""
import bpy,bmesh,json,math,hashlib,sys
from pathlib import Path
from mathutils import Vector
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';OUT=R/'assets/city/vertical-v02/transit-world';OUT.mkdir(parents=True,exist_ok=True)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
basePath=R/'assets/city/vertical-v02/detailed/manifest.json';base=json.loads(basePath.read_text())
placement=json.loads((D/'V02_Transit_Structural_Placement.json').read_text());engineering=json.loads((D/'V02_Transit_Engineering.json').read_text())
assert placement['status']=='PASS foundation/crosshead placement preflight only'
assert placement['sourceManifestSHA256']==sha(basePath)
assert placement['engineeringSHA256']==sha(D/'V02_Transit_Engineering.json')
master=D/'blender/SaintMeridian_V02_Detailed_Master.blend';assert sha(master)=='34ea869622914fc1a592964261cd41ebe3c3a84d537e0ccb45d117d2233a2096'
bpy.ops.wm.open_mainfile(filepath=str(master))
materials={k:bpy.data.materials['V02_'+k]for k in['deck','steel','cyan','warm','glass']}
retired=['public-guard-0185','public-guard-0185-cap'];records=[r for r in json.loads(json.dumps(base['records']))if r['id']not in retired]
for id in retired:
 for name in[id,id+'__COL']:
  if name in bpy.data.objects:bpy.data.objects.remove(bpy.data.objects[name],do_unlink=True)
V=[(-1,-1,-1),(-1,-1,1),(-1,1,-1),(-1,1,1),(1,-1,-1),(1,-1,1),(1,1,-1),(1,1,1)]
F=[(0,2,6,4),(1,5,7,3),(0,4,5,1),(2,3,7,6),(0,1,3,2),(4,6,7,5)]
def make_mesh(name,parts):
 verts=[];faces=[];slots=[];palette=[]
 for p,size,kind in parts:
  if kind not in palette:palette.append(kind)
  first=len(verts)
  for v in V:
   q=[p[i]+v[i]*size[i]/2 for i in range(3)];verts.append((q[0],-q[2],q[1]))
  faces.extend(tuple(first+j for j in f)for f in F);slots.extend([palette.index(kind)]*6)
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update()
 for kind in palette:mesh.materials.append(materials[kind])
 for p,index in zip(mesh.polygons,slots):p.material_index=index
 uv=mesh.uv_layers.new(name='Metres_2_4')
 for p in mesh.polygons:
  axis=max(range(3),key=lambda i:abs(p.normal[i]));axes=[i for i in range(3)if i!=axis]
  for loop in p.loop_indices:
   v=mesh.vertices[mesh.loops[loop].vertex_index].co;uv.data[loop].uv=(v[axes[0]]/2.4,v[axes[1]]/2.4)
 return mesh
def add(id,p,size,kind='steel',solid=True,walkable=False,parts=None,**extra):
 assert id not in{r['id']for r in records},id
 r={'id':id,'owner':'v02:'+id,'center':list(p),'size':list(size),'box':{'min':[p[i]-size[i]/2 for i in range(3)],'max':[p[i]+size[i]/2 for i in range(3)]},'solid':solid,'walkable':walkable,'material':kind,'collection':'SM_V02_TRANSIT_STRUCTURES','transitAddition':True,**extra}
 obj=bpy.data.objects.new(id,make_mesh(id,parts or[([0,0,0],size,kind)]));bpy.data.collections[r['collection']].objects.link(obj);obj.location=(p[0],-p[2],p[1]);obj['v02StableID']=id;obj['runtimeOwner']=r['owner'];obj['solid']=solid;obj['walkable']=walkable
 if solid:
  proxy=bpy.data.objects.new(id+'__COL',None);bpy.data.collections['SM_V02_COLLISION'].objects.link(proxy);proxy.location=obj.location;proxy.scale=(size[0]/2,size[2]/2,size[1]/2);proxy['sourceComponent']=id
 records.append(r);return r
def guard(id,x,a,b,height=1.1):
 length=b-a;parts=[([0,-height/2+.1,0],[.08,.2,length],'steel'),([0,.05,0],[.065,height-.2,length-.1],'glass')]
 for z in[-length/2+.035,length/2-.035]:parts.append(([0,0,z],[.08,height,.07],'steel'))
 add(id,[x,100+height/2,(a+b)/2],[.08,height,length],parts=parts,guardrail=True)
 add(id+'-cap',[x,100+height+.015,(a+b)/2],[.08,.025,length],'cyan',False,guardrail=True)
guard('transit-concourse-guard-south',74.95,359,384.2)
guard('transit-concourse-guard-north',74.95,387.0,393)
for support in placement['supports']:
 for r in support['records']:
  add(r['id'],r['center'],r['size'],role=r['role'],supportParent=r.get('supportParent'),foundation=support['id'],existingSupport=support['existingColumn'])

# Continuous box girder below the unchanged rail head. Segment bounds ARE its
# visible geometry, so the AABB collision proxy cannot form an invisible wedge.
samples=engineering['samples'];girderIDs=[]
for i,a in enumerate(samples):
 b=samples[(i+1)%len(samples)];points=[]
 for row in[a,b]:
  x,_,z=row['p'];tx,_,tz=row['t']
  for sign in[-1,1]:points.append([x+sign*tz*.65,z-sign*tx*.65])
 lo=[min(p[k]for p in points)for k in[0,1]];hi=[max(p[k]for p in points)for k in[0,1]]
 r=add('transit-longitudinal-girder-'+str(i).zfill(4),[(lo[0]+hi[0])/2,96.95,(lo[1]+hi[1])/2],[hi[0]-lo[0],1.4,hi[1]-lo[1]],role='continuous visible box-girder segment',structuralRun='main-loop');girderIDs.append(r['id'])

add('transit-public-platform',[76.575,99.775,380],[3.15,.45,64],'deck',True,True,role='public waiting platform; train boarding not yet admitted')
# Full-height screen prevents an unprotected drop into the rail corridor.
guard('transit-platform-screen',78.10,348,412,2.15)
for id,a,b in[('south',348,359),('north',393,412)]:guard('transit-platform-west-'+id,75.05,a,b)
for z in[348.05,411.95]:
 add('transit-platform-end-'+str(z),[76.575,100.55,z],[3.15,1.1,.08],guardrail=True)
 add('transit-platform-end-light-'+str(z),[76.575,101.115,z],[3.15,.025,.08],'cyan',False)
for z in[352,364,376,388,400,408]:
 add('transit-platform-outrigger-'+str(z),[78.3,96.95,z],[4.8,1.4,.6],role='platform cantilever connected to longitudinal girder')
 add('transit-platform-riser-'+str(z),[76.5,98.6,z],[.35,1.9,.35],role='platform slab to cantilever connection')
for z in[354,366,398,408]:
 add('transit-platform-canopy-post-'+str(z),[75.3,102.075,z],[.24,4.15,.24],role='waiting canopy support')
add('transit-platform-canopy',[77.325,104.275,380],[4.55,.25,64],'steel',role='public platform weather canopy')
add('transit-platform-soffit-light',[77.325,104.14,380],[.12,.02,63],'warm',False)
add('transit-platform-edge-line',[77.65,100.008,380],[.08,.016,63],'warm',False)

# Re-export only the affected original chunk. Reuse every other exact GLB.
changedChunk=next(c for c in base['chunks']if retired[0]in c['recordIDs']);replacementIDs=[r['id']for r in records if r['id'].startswith('transit-concourse-guard-')]
groups={changedChunk['id']+'-station':[id for id in changedChunk['recordIDs']if id not in retired]+replacementIDs}
baseIDs={r['id']for r in base['records']}
for r in records:
 if r['id']in baseIDs or r['id']in replacementIDs:continue
 zone=f'{int(r["center"][0]//64):02d}-{int(r["center"][1]//28):02d}-{int(r["center"][2]//64):02d}'
 groups.setdefault('v02-transit-world-'+zone,[]).append(r['id'])
chunks=[c for c in base['chunks']if c['id']!=changedChunk['id']]
# Remove stale visual export objects from the saved source master before adding
# the rebuilt chunk, so the two retired guard meshes cannot appear twice.
for o in list(bpy.data.collections['SM_V02_EXPORT'].objects):bpy.data.objects.remove(o,do_unlink=True)
bpy.data.collections['SM_V02_EXPORT'].hide_viewport=False
bpy.data.collections['SM_V02_EXPORT'].hide_render=False
bpy.context.view_layer.update()
for name,ids in groups.items():
 verts=[];faces=[];slots=[];uvs=[];palette=list(materials)
 for id in ids:
  obj=bpy.data.objects[id];first=len(verts);verts.extend(tuple(obj.matrix_world@v.co)for v in obj.data.vertices)
  for p in obj.data.polygons:
   faces.append(tuple(first+i for i in p.vertices));mat=obj.data.materials[p.material_index];kind=next(k for k,v in materials.items()if v==mat);slots.append(palette.index(kind));uvs.append([tuple(obj.data.uv_layers.active.data[i].uv)for i in p.loop_indices])
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update()
 for mat in materials.values():mesh.materials.append(mat)
 uv=mesh.uv_layers.new(name='Metres_2_4')
 for p,slot,coords in zip(mesh.polygons,slots,uvs):
  p.material_index=slot
  for loop,value in zip(p.loop_indices,coords):uv.data[loop].uv=value
 obj=bpy.data.objects.new(name,mesh);bpy.data.collections['SM_V02_EXPORT'].objects.link(obj);obj['v02Chunk']=name;obj['runtimeIDs']=json.dumps(ids)
 bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
 file=OUT/(name+'.glb');bpy.ops.export_scene.gltf(filepath=str(file),export_format='GLB',use_selection=True,export_yup=True,export_extras=True,export_tangents=True)
 exported=json.loads(file.read_bytes()[20:20+int.from_bytes(file.read_bytes()[12:16],'little')].decode())
 assert exported.get('meshes') and exported.get('accessors'),('Empty selected export',name)
 chunks.append({'id':name,'url':str(file.relative_to(R)),'sha256':sha(file),'bytes':file.stat().st_size,'triangles':sum(len(f)-2 for f in faces),'recordIDs':ids})

metadata={**base,'schema':'sm-v02-transit-world-1','records':records,'chunks':chunks,'status':'PHASE6 SOURCE CANDIDATE; native station and preservation acceptance pending',
 'sourceDetailedManifestSHA256':sha(basePath),'retiredV02ContactRecords':retired,
 'controlledModification':{'reason':'Public2.8m station access atZ384.2..387.0; original city untouched','originals':[r for r in base['records']if r['id']in retired],'replacements':replacementIDs},
 'transitStructure':{'supports':placement['supports'],'maximumSupportSpacing':placement['maximumSupportSpacing'],'girderIDs':girderIDs,'publicBoarding':False},
 'stationPublicRoute':{'ability':'walk','requiredAfterstepImpulses':0,'points':[[73,100,382],[73,100,385.4],[76.55,100,385.4],[76.55,100,405],[76.55,100,352],[76.55,100,385.4],[73,100,385.4],[73,100,382]]}}
sys.path.insert(0,str(Path(__file__).parent))
from build_transit_station_graph import build as build_station_graph
station_nodes=build_station_graph(metadata)
for id,p,kind in station_nodes:
 obj=bpy.data.objects.new(id,None);bpy.data.collections['SM_V02_TRAIN_ROUTES'].objects.link(obj);obj.location=(p[0],-p[2],p[1]);obj.empty_display_type='SPHERE';obj.empty_display_size=.3;obj['navigationRole']=kind;obj['exportAsGeometry']=False
(OUT/'manifest.json').write_text(json.dumps(metadata,indent=2)+'\n')
for filename,key in[('collisions.json','colliders'),('structure_ownership.json','structures')]:
 data=[{k:r[k]for k in['id','owner','box','solid','walkable','stair','stairLanding','flight','stepRise']if k in r}for r in records if r['solid']]if key=='colliders'else[{'id':r['id'],'owner':r['owner'],'collection':r['collection'],'operation':'preserved detailed source or explicit V02 station/support addition','nonDestructible':True}for r in records]
 (OUT/filename).write_text(json.dumps({'sourceManifestSHA256':sha(OUT/'manifest.json'),key:data},indent=2)+'\n')
surfaces=json.loads((R/'assets/city/vertical-v02/detailed/threadrail_surfaces.json').read_text());surfaces.update(sourceManifestSHA256=sha(OUT/'manifest.json'),status='Transit-master physical surfaces; individual native attachment admission remains separate',physicalSurfaceColliders=[{k:r[k]for k in['id','owner','box']}for r in records if r['solid']],physicalSurfaceGeometry=[{'id':c['id'],'url':c['url'],'recordIDs':c['recordIDs']}for c in chunks])
(OUT/'threadrail_surfaces.json').write_text(json.dumps(surfaces,indent=2)+'\n')
bpy.data.collections['SM_V02_EXPORT'].hide_viewport=True;bpy.data.collections['SM_V02_EXPORT'].hide_render=True
scene=bpy.context.scene;scene['v02AuthoringStage']='phase6 transit structures and public station candidate';scene['acceptedDetailedMasterSHA256']=sha(master);scene['stationPublicRoute']=json.dumps(metadata['stationPublicRoute'])
target=D/'blender/SaintMeridian_V02_Transit_Master.blend';bpy.ops.wm.save_as_mainfile(filepath=str(target))
report={'status':'AUTHORED SOURCE; validation pending','master':str(target.relative_to(R)),'masterSHA256':sha(target),'sourceDetailedMasterSHA256':sha(master),'authoringSHA256':sha(Path(__file__)),
 'placementSHA256':sha(D/'V02_Transit_Structural_Placement.json'),'graphBuilderSHA256':sha(Path(__file__).parent/'build_transit_station_graph.py'),'graphSHA256':metadata['graphSHA256'],'manifestSHA256':sha(OUT/'manifest.json'),'records':len(records),'newRecords':len(records)-len(base['records'])+2,'retiredV02Records':retired,'reusedChunks':len(base['chunks'])-1,'newChunks':len(groups),'totalChunks':len(chunks),'originalBuildingsExported':0}
(D/'V02_Transit_Environment_Authoring.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
