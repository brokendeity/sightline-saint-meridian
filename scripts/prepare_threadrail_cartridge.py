# Run with Blender --background --python. Imported Tripo body remains the asset core.
import bpy,math,json,sys
from pathlib import Path
from mathutils import Vector
import numpy as np
R=Path(__file__).resolve().parents[1];D=R/'assets/backspool/threadrail-cartridge';O=R/'output/threadrail-cartridge';(D/'textures').mkdir(exist_ok=True);O.mkdir(exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(D/'source/model.glb'))
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH'];bpy.ops.object.select_all(action='DESELECT')
for o in meshes:o.select_set(True)
bpy.context.view_layer.objects.active=meshes[0];bpy.ops.object.join();body=bpy.context.object;bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
xyz=np.array([v.co[:] for v in body.data.vertices]);values,axes=np.linalg.eigh(np.cov(xyz.T));normal=Vector(axes[:,0]);
if normal.z<0:normal=-normal
rotation=normal.rotation_difference(Vector((0,0,1)));xyz=np.array([(rotation@Vector(v)).to_tuple() for v in xyz]);center=(xyz.max(0)+xyz.min(0))*.5;xyz-=center;diameter=max(np.ptp(xyz[:,0]),np.ptp(xyz[:,1]));height=np.ptp(xyz[:,2]);xyz[:,:2]*=.08/diameter;xyz[:,2]*=.02/height
for vertex,p in zip(body.data.vertices,xyz):vertex.co=p
body.name='Disc_MainBody';body.data.update()
root=bpy.data.objects.new('ThreadrailCartridge_Root',None);bpy.context.collection.objects.link(root);body.parent=root;root['sourceTask']='b71871c5-e9e6-4e89-b6f7-723182ab3c8e';root['provenance']='Tripo body; locally authored mechanical moving parts';root['diameterMeters']=.08
# Split the genuine central source geometry into a rotating component; retain UVs.
import bmesh
spool=body.copy();spool.data=body.data.copy();bpy.context.collection.objects.link(spool);spool.name='Spool_Core'
for obj,keep_center in [(body,False),(spool,True)]:
 bm=bmesh.new();bm.from_mesh(obj.data);discard=[]
 for f in bm.faces:
  c=f.calc_center_median();is_center=math.hypot(c.x,c.y)<.019
  if is_center!=keep_center:discard.append(f)
 bmesh.ops.delete(bm,geom=discard,context='FACES');bm.to_mesh(obj.data);bm.free();obj.data.update()
# Preserve extracted source textures and add an emissive core mask from the source albedo.
base_mat=body.data.materials[0];bs=next(n for n in base_mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED');images=[n for n in base_mat.node_tree.nodes if n.type=='TEX_IMAGE'];base=None
for n in images:
 if n.outputs['Color'].is_linked and any(link.to_socket==bs.inputs['Base Color'] for link in n.outputs['Color'].links):base=n.image
for i,n in enumerate(images):
 im=n.image
 if not im:continue
 im.filepath_raw=str(D/'textures'/('source-map-'+str(i)+'.png'));im.file_format='PNG';im.save()
if base:
 w,h=base.size;pix=np.array(base.pixels[:],dtype=np.float32).reshape(h,w,4);mask=np.clip((pix[:,:,2]-pix[:,:,0])*.9,0,1);e=np.zeros_like(pix);e[:,:,:3]=pix[:,:,:3]*mask[:,:,None];e[:,:,3]=1
 glow=bpy.data.images.new('Core_Emission',width=w,height=h,alpha=True);glow.pixels.foreach_set(e.ravel());glow.filepath_raw=str(D/'textures/core-emission.png');glow.file_format='PNG';glow.save();n=base_mat.node_tree.nodes.new('ShaderNodeTexImage');n.image=glow;base_mat.node_tree.links.new(n.outputs['Color'],bs.inputs['Emission Color']);bs.inputs['Emission Strength'].default_value=.8
# Locally authored parts, clearly separate from generated body.
def material(name,color,metal=0,rough=.4,emission=0,alpha=1):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,alpha);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,alpha);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough;p.inputs['Emission Color'].default_value=(*color,1);p.inputs['Emission Strength'].default_value=emission;p.inputs['Alpha'].default_value=alpha
 if alpha<1:m.surface_render_method='DITHERED'
 return m
silver=material('Authored_Jaw_Silver',(.45,.56,.63),.8,.3);glass=material('Authored_Fin_Cyan',(.025,.5,.8),.12,.2,.35,.64);red=material('Pair_Identifier',(.7,.015,.025),.4,.3);white=material('Identifier_White',(.9,.96,1),.3,.3)
def empty(name,position,parent=root):
 o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);o.parent=parent;o.location=position;return o
def cube(name,position,scale,mat,parent):
 bpy.ops.mesh.primitive_cube_add(size=1);o=bpy.context.object;o.name=name;o.parent=parent;o.location=position;o.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(mat);return o
for i in range(4):
 a=i*math.pi/2;v=Vector((math.cos(a),math.sin(a),0));fin=empty('AnchorFin_%02d'%(i+1),v*.021);fin.rotation_euler.z=a;fin['deployOffset']=[v.x*.02,0,-v.y*.02]
 verts=[(0,-.004,-.001),(0,.004,-.001),(.019,0,-.001),(0,-.004,.001),(0,.004,.001),(.019,0,.001)]
 mesh=bpy.data.meshes.new('Authored_Fin_Mesh');mesh.from_pydata(verts,[],[(0,2,1),(3,4,5),(0,1,4,3),(1,2,5,4),(2,0,3,5)]);mesh.materials.append(glass);o=bpy.data.objects.new('Fin_Glass_%02d'%i,mesh);bpy.context.collection.objects.link(o);o.parent=fin
 jaw=empty('LockingJaw_%02d'%(i+1),(v.x*.032,v.y*.032,-.004));jaw.rotation_euler.z=a
 cube('Jaw_Grip_%02d'%i,(.003,0,0),(.011,.004,.003),silver,jaw);cube('Jaw_Tooth_%02d'%i,(.007,0,-.0025),(.003,.004,.005),silver,jaw)
 # Transform configurations are authoritative at runtime; scene keyframes also make edit preview easy.
 fin.location=v*.021;fin.keyframe_insert('location',frame=1);fin.keyframe_insert('location',frame=10);fin.location=v*.041;fin.keyframe_insert('location',frame=24)
 jaw.rotation_euler.y=0;jaw.keyframe_insert('rotation_euler',frame=1);jaw.keyframe_insert('rotation_euler',frame=10);jaw.rotation_euler.y=.9;jaw.keyframe_insert('rotation_euler',frame=24)
# The inferred underside is irregular; repair it with a real opaque lower plate.
graphite=material('Authored_Lower_Housing',(.035,.045,.055),.65,.4)
bpy.ops.mesh.primitive_cylinder_add(vertices=64,radius=.038,depth=.0012,location=(0,0,-.0104));lower=bpy.context.object;lower.name='Housing_Lower';lower.parent=root;lower.data.materials.append(graphite)
for radius in [.02,.034]:
 bpy.ops.mesh.primitive_torus_add(major_radius=radius,minor_radius=.00035,major_segments=64,minor_segments=4,location=(0,0,-.0111));o=bpy.context.object;o.name='Lower_Housing_Trim';o.parent=root;o.data.materials.append(silver)
# Detachable belt clip stays on the belt while the cartridge is thrown.
clip_parts=[]
for position,scale in [((-.025,0,-.0128),(.004,.048,.003)),((.025,0,-.0128),(.004,.048,.003)),((0,-.023,-.0128),(.05,.004,.003))]:clip_parts.append(cube('Clip_Part',position,scale,graphite,root))
bpy.ops.object.select_all(action='DESELECT')
for o in clip_parts:o.select_set(True)
bpy.context.view_layer.objects.active=clip_parts[0];bpy.ops.object.join();bpy.context.object.name='DockingClip';bpy.context.object.data.materials.clear();bpy.context.object.data.materials.append(graphite)
for polygon in bpy.context.object.data.polygons:polygon.material_index=0
empty('ThreadExit',(.034,0,.007));empty('DockingMount',(0,0,-.01))
marker=cube('A_B_Identifier',(.026,-.014,.0098),(.01,.006,.001),red,root)
for letter in ['A','B']:
 curve=bpy.data.curves.new(letter+'_Label','FONT');curve.body=letter;curve.size=.004;curve.align_x='CENTER';curve.align_y='CENTER';curve.extrude=.00008;obj=bpy.data.objects.new(letter+'_Label',curve);bpy.context.collection.objects.link(obj);obj.parent=root;obj.location=(.026,-.014,.0105 if letter=='A' else 0);obj.data.materials.append(white);bpy.context.view_layer.objects.active=obj;obj.select_set(True);bpy.ops.object.convert(target='MESH');obj.select_set(False)
# Ensure all mesh selection is limited to the asset before export.
scene=bpy.context.scene;scene.frame_end=48;scene.frame_set(1)
def asset_select():
 bpy.ops.object.select_all(action='DESELECT');root.select_set(True)
 for o in root.children_recursive:o.select_set(True)
asset_select();bpy.ops.export_scene.gltf(filepath=str(D/'backspool_threadrail_cartridge_master.glb'),export_format='GLB',use_selection=True,export_extras=True,export_animations=False)
# Runtime images are downsampled locally; no paid remesh or retexture.
for im in bpy.data.images:
 if im.size[0]>1024 or im.size[1]>1024:
  im.scale(1024,1024)
asset_select();bpy.ops.export_scene.gltf(filepath=str(D/'backspool_threadrail_cartridge_game.glb'),export_format='GLB',use_selection=True,export_extras=True,export_animations=False)
(D/'states.json').write_text(json.dumps({'units':'meters','foldedDiameter':.08,'thickness':.02,'axes':{'face':'+Y','spin':'+Y','throw':'+Z'},'deploySeconds':.18,'finTranslation':'node extras deployOffset * deployment','jawLocalAxis':[0,0,1],'jawRadians':-.9,'spinRadiansPerSecond':{'folded':1,'flight':35,'anchored':5},'sourceBody':'Tripo b71871c5-e9e6-4e89-b6f7-723182ab3c8e','authoredParts':['four retractable fins','four hinged jaws','A/B markers','sockets'],'states':['folded','flight','anchored']},indent=2)+'\n')
# Neutral inspection renders in Blender; scene is not game evidence.
scene.render.engine='CYCLES';scene.cycles.samples=16;scene.render.resolution_x=640;scene.render.resolution_y=640;scene.render.resolution_percentage=100;scene.world.color=(.25,.25,.25);scene.view_settings.view_transform='AgX'
bpy.ops.object.camera_add();camera=bpy.context.object;scene.camera=camera;camera.data.type='ORTHO';camera.data.ortho_scale=.14
for location,power,size in [((.1,-.06,.15),.5,.15),((-.1,.1,.06),.25,.12),((.05,-.03,-.15),.3,.12)]:
 bpy.ops.object.light_add(type='AREA',location=location);light=bpy.context.object;light.data.energy=power;light.data.shape='DISK';light.data.size=size;light.rotation_euler=(-light.location).to_track_quat('-Z','Y').to_euler()
bpy.data.objects['B_Label'].hide_render=True
for name,location,frame in [('three-quarter',(.1,-.13,.12),1),('top',(0,0,.2),1),('bottom',(0,0,-.2),1),('side',(.15,0,.015),1),('deployed',(.1,-.13,.12),24)]:
 scene.frame_set(frame);camera.location=location;camera.rotation_euler=(-camera.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(O/(name+'.png'));bpy.ops.render.render(write_still=True)
scene.frame_set(1);bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=str(D/'backspool_threadrail_cartridge_source.blend'))
print('CARTRIDGE_EXPORT_COMPLETE')
