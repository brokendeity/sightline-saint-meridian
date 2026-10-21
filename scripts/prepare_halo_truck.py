import bpy, os, json
from mathutils import Vector
root='/Users/richardmpayi/Downloads/sight game rail/assets/halo-truck'
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.fbx(filepath=root+'/source/tripo_convert_c5c5a55c-a32a-4c12-91d7-bd5e3c50ca16.fbx')
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
bpy.ops.object.select_all(action='DESELECT')
for o in meshes:o.select_set(True)
bpy.context.view_layer.objects.active=meshes[0];bpy.ops.object.join();o=bpy.context.object
bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
pts=[o.matrix_world@Vector(c) for c in o.bound_box];mn=Vector(tuple(min(p[i] for p in pts) for i in range(3)));mx=Vector(tuple(max(p[i] for p in pts) for i in range(3)))
print('TRUCK_BOUNDS',list(mx-mn),'POLYS',len(o.data.polygons))
# Normalize long horizontal axis to Blender Y (glTF Z); width X, wheels at zero.
if (mx-mn).x>(mx-mn).y:
 o.rotation_euler.z=1.57079632679;bpy.ops.object.transform_apply(location=False,rotation=True,scale=False)
pts=[o.matrix_world@Vector(c) for c in o.bound_box];mn=Vector(tuple(min(p[i] for p in pts) for i in range(3)));mx=Vector(tuple(max(p[i] for p in pts) for i in range(3)))
scale=min(4.8/(mx.y-mn.y),2/(mx.x-mn.x));center=(mn+mx)/2
for v in o.data.vertices:v.co=(v.co-Vector((center.x,center.y,mn.z)))*scale
o.location=(0,0,0);o.name='Halo_Surveillance_Truck'
texture=bpy.data.images.load(root+'/truck-basecolor.jpg')
for mat in bpy.data.materials:
 if mat.use_nodes:
  for node in mat.node_tree.nodes:
   if node.type=='TEX_IMAGE':
    node.image=texture
  for node in mat.node_tree.nodes:
   if node.type=='BSDF_PRINCIPLED':
    for name in ['Normal','Metallic','Roughness','Alpha']:
     for link in list(node.inputs[name].links):mat.node_tree.links.remove(link)
    node.inputs['Base Color'].default_value=(1,1,1,1);node.inputs['Metallic'].default_value=.05;node.inputs['Roughness'].default_value=.65
bpy.ops.export_scene.gltf(filepath=root+'/halo-truck.glb',export_format='GLB',use_selection=True,export_yup=True)
print('FINAL_DIMENSIONS',list(o.dimensions),'FINAL_POLYS',len(o.data.polygons))
