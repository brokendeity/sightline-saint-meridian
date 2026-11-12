# Converts a Tripo "UE5 Manny" rigged Backspool costume into a Mixamo-named rig the game can drive.
#   1. UE bone names -> mixamorig names (unmapped twist/metacarpal/extra spine bones keep their weights, renamed ue_*)
#   2. rest pose A -> the old Backspool skeleton's T-pose limb directions (mesh baked, pose applied as rest)
#   3. every mapped bone's rest orientation copied from assets/backspool/backspool.fbx (the mesh does not move), so code
#      that reads bone axes (Afterstep exhaust outlet on Hips, cartridge hand pose) behaves as on the default model
#   4. Mixamo end bones added (HeadTop_End, Toe_End, finger 4 tips), then FBX export with embedded textures
# Usage: blender -b --factory-startup --python convert_ue_costume_to_mixamo.py -- <costume.fbx> <backspool.fbx> <out.fbx> <report.json>
import bpy, sys, math, json
from mathutils import Vector, Matrix
src, old_fbx, out_fbx, report = sys.argv[sys.argv.index('--')+1:][:4]
R = {}
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=src)
arm = [o for o in bpy.data.objects if o.type == 'ARMATURE'][0]; mesh = [o for o in bpy.data.objects if o.type == 'MESH'][0]
arm.animation_data_clear()
for o in (arm, mesh):
    o.select_set(True)
bpy.context.view_layer.objects.active = arm
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
# face like Backspool (left arm toward +X, facing -Y): turn about Z so upperarm_r -> upperarm_l points along +X
_l = arm.data.bones['upperarm_l'].head_local; _r = arm.data.bones['upperarm_r'].head_local
_yaw = math.atan2((_l - _r).y, (_l - _r).x)
R_turn = Matrix.Rotation(-_yaw, 4, 'Z')
for o in (arm, mesh): o.matrix_world = R_turn @ o.matrix_world
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
R0 = {'facing_turn_deg': round(math.degrees(-_yaw), 1)}

SIDE = {'l': 'Left', 'r': 'Right'}
MAP = {'pelvis': 'Hips', 'spine_01': 'Spine', 'spine_03': 'Spine1', 'spine_05': 'Spine2', 'neck_01': 'Neck', 'head': 'Head'}
for s, S in SIDE.items():
    MAP.update({f'clavicle_{s}': f'{S}Shoulder', f'upperarm_{s}': f'{S}Arm', f'lowerarm_{s}': f'{S}ForeArm', f'hand_{s}': f'{S}Hand',
                f'thigh_{s}': f'{S}UpLeg', f'calf_{s}': f'{S}Leg', f'foot_{s}': f'{S}Foot', f'ball_{s}': f'{S}ToeBase'})
    for f in ('thumb', 'index', 'middle', 'ring', 'pinky'):
        for i in (1, 2, 3): MAP[f'{f}_0{i}_{s}'] = f'{S}Hand{f.capitalize()}{i}'
renamed, extra = 0, []
for b in arm.data.bones:
    if b.name in MAP: b.name = 'mixamorig:' + MAP[b.name]; renamed += 1
    else: extra.append(b.name); b.name = 'ue_' + b.name
R.update(R0); R['mapped'] = renamed; R['extra_bones'] = extra
R['vertex_groups_renamed'] = sum(1 for g in mesh.vertex_groups if g.name.startswith('mixamorig:'))

# ---------------------------------------------------------------- merge in-between bones into their parents
# game_mixamo_retarget.js holds a target-only bone at its REST world rotation when it sits between two mapped bones, so
# anything above spine_02 / spine_04 / neck_02 / a metacarpal would inherit the wrong rotation (measured: arms 50-130 deg
# off, legs exact). Merge each such bone and its skin weights into its parent so the chain is pure mixamorig.
def between(b):
    return (not b.name.startswith('mixamorig:')) and b.parent is not None and any(c.name.startswith('mixamorig:') for c in b.children_recursive)
merged = []
while True:
    cand = [b.name for b in arm.data.bones if between(b)]
    if not cand: break
    name = cand[0]; parent = arm.data.bones[name].parent.name
    g = mesh.vertex_groups.get(name); pg = mesh.vertex_groups.get(parent) or mesh.vertex_groups.new(name=parent)
    if g:
        for v in mesh.data.vertices:
            for e in v.groups:
                if e.group == g.index: pg.add([v.index], e.weight, 'ADD')
        mesh.vertex_groups.remove(g)
    bpy.context.view_layer.objects.active = arm; bpy.ops.object.mode_set(mode='EDIT')
    E0 = arm.data.edit_bones; x = E0[name]
    for c in list(x.children): c.use_connect = False; c.parent = E0[parent]
    E0.remove(x); bpy.ops.object.mode_set(mode='OBJECT'); merged.append(name + '->' + parent)
R['merged_in_between_bones'] = merged

# ---------------------------------------------------------------- old skeleton (rest, joint positions + orientations)
before = set(bpy.data.objects)
bpy.ops.import_scene.fbx(filepath=old_fbx)
old = [o for o in bpy.data.objects if o not in before and o.type == 'ARMATURE'][0]
for o in [o for o in bpy.data.objects if o not in before and o.type == 'MESH']: bpy.data.objects.remove(o)
old.animation_data_clear()
def oh(n): return old.matrix_world @ old.data.bones[n].head_local
def orot(n): return (old.matrix_world.to_3x3().normalized() @ old.data.bones[n].matrix_local.to_3x3()).normalized()
CHILD = {'Shoulder': 'Arm', 'Arm': 'ForeArm', 'ForeArm': 'Hand', 'Hand': 'HandMiddle1', 'UpLeg': 'Leg', 'Leg': 'Foot', 'Foot': 'ToeBase'}
olddir = {}
for S in SIDE.values():
    for p, c in CHILD.items(): olddir[f'mixamorig:{S}{p}'] = (oh(f'mixamorig:{S}{c}') - oh(f'mixamorig:{S}{p}')).normalized()

# ---------------------------------------------------------------- A -> T
def sel_only(o):
    if bpy.context.object and bpy.context.object.mode != 'OBJECT': bpy.ops.object.mode_set(mode='OBJECT')
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
sel_only(arm); bpy.ops.object.mode_set(mode='POSE')
for pb in arm.pose.bones: pb.rotation_mode = 'QUATERNION'; pb.rotation_quaternion = (1, 0, 0, 0); pb.location = (0, 0, 0)
angles = {}
for S in SIDE.values():
    for p, c in CHILD.items():
        n = f'mixamorig:{S}{p}'; bpy.context.view_layer.update()
        pb = arm.pose.bones[n]; cur = (arm.pose.bones[f'mixamorig:{S}{c}'].head - pb.head).normalized()
        Rm = cur.rotation_difference(olddir[n]).to_matrix().to_4x4(); h = pb.head.copy()
        pb.matrix = Matrix.Translation(h) @ Rm @ Matrix.Translation(-h) @ pb.matrix
        angles[n] = round(math.degrees(cur.angle(olddir[n])), 1)
bpy.context.view_layer.update(); bpy.ops.object.mode_set(mode='OBJECT')
R['a_to_t_deg'] = angles
sel_only(mesh); bpy.ops.object.modifier_apply(modifier=[m for m in mesh.modifiers if m.type == 'ARMATURE'][0].name)
sel_only(arm); bpy.ops.object.mode_set(mode='POSE'); bpy.ops.pose.armature_apply(selected=False); bpy.ops.object.mode_set(mode='OBJECT')
am = mesh.modifiers.new('Armature', 'ARMATURE'); am.object = arm

# ---------------------------------------------------------------- copy Backspool's rest orientations + add end bones
sel_only(arm); bpy.ops.object.mode_set(mode='EDIT'); E = arm.data.edit_bones
for b in E: b.use_connect = False
heads = {b.name: b.head.copy() for b in E}; lengths = {b.name: max(b.length, 0.01) for b in E}
for b in E:
    if b.name.startswith('mixamorig:') and b.name in old.data.bones:
        M = orot(b.name).to_4x4(); M.translation = heads[b.name]; b.matrix = M; b.length = lengths[b.name]
def add_end(name, parent, offset):
    if name in E: return
    p = E[parent]; e = E.new(name); e.head = p.head + offset; e.tail = e.head + offset.normalized() * 0.02; e.parent = p; e.use_deform = False
zs = [v.co.z for v in mesh.data.vertices]; top = max(zs)
add_end('mixamorig:HeadTop_End', 'mixamorig:Head', Vector((0, 0, top - E['mixamorig:Head'].head.z)))
for S in SIDE.values():
    tb = E[f'mixamorig:{S}ToeBase']; fwd = (tb.head - E[f'mixamorig:{S}Foot'].head); fwd.z = 0
    add_end(f'mixamorig:{S}Toe_End', f'mixamorig:{S}ToeBase', fwd.normalized() * 0.06 if fwd.length else Vector((0, -0.06, 0)))
    for f in ('Thumb', 'Index', 'Middle', 'Ring', 'Pinky'):
        b3 = E[f'mixamorig:{S}Hand{f}3']; b2 = E[f'mixamorig:{S}Hand{f}2']
        add_end(f'mixamorig:{S}Hand{f}4', f'mixamorig:{S}Hand{f}3', (b3.head - b2.head) * 0.8)
bpy.ops.object.mode_set(mode='OBJECT')
bpy.data.objects.remove(old)
R['bones'] = len(arm.data.bones); R['mixamorig_bones'] = sum(1 for b in arm.data.bones if b.name.startswith('mixamorig:'))
old_names = set()
R['height_units'] = round(max(zs) - min(zs), 4)
arm.name = 'Armature'; mesh.name = 'BackspoolHalfMask'
for m in mesh.data.materials: m.name = 'BackspoolHalfMaskMat'
# ---------------------------------------------------------------- export
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.fbx(filepath=out_fbx, use_selection=True, object_types={'ARMATURE', 'MESH'}, add_leaf_bones=False, bake_anim=False,
                         path_mode='COPY', embed_textures=True, mesh_smooth_type='FACE', armature_nodetype='NULL')
import os
R['out_bytes'] = os.path.getsize(out_fbx)
json.dump(R, open(report, 'w'), indent=1)
print('CONVERTED', json.dumps({k: v for k, v in R.items() if k != 'extra_bones'}))
