"""Blender offline train intake. Run only after preserving source/model.glb.
Blender --background --python scripts/prepare_vertical_train.py
Input front direction is inspected before choosing TRAIN_FRONT_AXIS (default -Y).
No semantic moving-part separation is inferred from a fused generated mesh.
"""
import bpy, json, math, os, hashlib
import numpy as np
from pathlib import Path
from mathutils import Vector
R=Path(__file__).resolve().parents[1]
D=R/'assets/city/vertical/train';SRC=D/'source/model.glb'
if not SRC.exists(): raise RuntimeError('Immutable Hi3D source/model.glb is required')
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(SRC),merge_vertices=True)
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
if not meshes: raise RuntimeError('Source contains no mesh')
# Work on independent imported mesh data and keep world transforms before reparenting.
for o in meshes:
 o.data=o.data.copy();matrix=o.matrix_world.copy();o.parent=None;o.matrix_world=matrix
bpy.ops.object.select_all(action='DESELECT')
for o in meshes:o.select_set(True)
bpy.context.view_layer.objects.active=meshes[0]
bpy.ops.object.join();body=bpy.context.object;body.name='Train_FrontCarriage'
bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
axis=os.environ.get('TRAIN_FRONT_AXIS','-Y')
front={'+X':Vector((1,0,0)),'-X':Vector((-1,0,0)),'+Y':Vector((0,1,0)),'-Y':Vector((0,-1,0))}[axis]
# Blender +Y forward becomes glTF -Z; use Blender -Y for game +Z forward.
rot=front.rotation_difference(Vector((0,-1,0)))
coords=np.empty(len(body.data.vertices)*3,dtype=np.float32);body.data.vertices.foreach_get('co',coords);coords=coords.reshape(-1,3)
coords=coords@np.array(rot.to_matrix(),dtype=np.float32).T
lo=coords.min(axis=0);hi=coords.max(axis=0);extent=hi-lo;size=Vector(extent.tolist())
if min(size)<=0:raise RuntimeError('Degenerate bounds')
scale=14/size.y;center=np.array(((lo[0]+hi[0])/2,(lo[1]+hi[1])/2,lo[2]),dtype=np.float32)
coords=(coords-center)*scale;body.data.vertices.foreach_set('co',coords.ravel())
body.data.update()
root=bpy.data.objects.new('SaintMeridian_TrainRoot',None);bpy.context.collection.objects.link(root);body.parent=root
root['sourceSHA256']=hashlib.sha256(SRC.read_bytes()).hexdigest();root['forwardAxis']='+Z glTF';root['authoring']='Hi3D source; normalized and simplified locally'
for im in bpy.data.images:
 if im.size[0]>2048 or im.size[1]>2048:im.scale(min(2048,im.size[0]),min(2048,im.size[1]))
sourceTriangles=sum(len(p.vertices)-2 for p in body.data.polygons)
records=[]
for name,target in [('lod0',60000),('lod1',18000),('lod2',4000)]:
 copy=body.copy();copy.data=body.data.copy();bpy.context.collection.objects.link(copy);copy.name='Train_Front_'+name
 bpy.ops.object.select_all(action='DESELECT');copy.select_set(True);root.select_set(True);bpy.context.view_layer.objects.active=copy
 if sourceTriangles>target:
  mod=copy.modifiers.new('Runtime triangle budget','DECIMATE');mod.ratio=target/sourceTriangles;bpy.ops.object.modifier_apply(modifier=mod.name)
 dest=D/('train_front_'+name+'.glb')
 bpy.ops.export_scene.gltf(filepath=str(dest),export_format='GLB',use_selection=True,export_animations=False,export_extras=True)
 records.append({'file':dest.name,'triangles':sum(len(p.vertices)-2 for p in copy.data.polygons),'bytes':dest.stat().st_size})
 bpy.data.objects.remove(copy,do_unlink=True)
# Retain the normalized editable full geometry; runtime colliders are separate.
bpy.ops.object.select_all(action='DESELECT');body.select_set(True);root.select_set(True)
bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=str(D/'train_front_source.blend'))
(D/'intake.json').write_text(json.dumps({'sourceSHA256':root['sourceSHA256'],'sourceTriangles':sourceTriangles,'frontAxisBlender':axis,'sizeMeters':list(size*scale),'lods':records,'validation':'Pending visual silhouette, orientation and runtime clearance review','movingParts':'Fused source; no independent doors or bogies claimed'},indent=2)+'\n')
print('TRAIN_INTAKE_COMPLETE',records)
