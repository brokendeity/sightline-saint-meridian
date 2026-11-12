"""Kinsmoke cape v5: the user's ORIGINAL Tripo cape mesh (its sculpted waves, curling folds, rolled hem, wide wings and
braided border, its own texture) with only the v3 FIT: the collar band seated at the base of the neck on the shoulders,
a braided rope collar ring there and brass clasps on the front of the shoulders.
  - fit: the original mesh is lowered rigidly so its collar band sits at the neck base (v1 put it at 0.90 of body
    height, mask level; the neck base is ~0.82), then pushed out of the shoulders with v1's soft, spreading push (a
    local deformation with falloff; everything else keeps the sculpt);
  - rig: every chain starts ON the collar ring at its angle (pinned at the neck base) and follows the cape's own drape
    below (v1 started chains at the top of each wedge, which pinned the wing tips); 15 chains x 10 joints; the original
    high-detail mesh is skinned to them (inverse-square to the 4 nearest segments, smoothed), so its waves ride along;
  - collar ring / clasps: rigid on Spine2, UV-mapped onto the Tripo atlas's own knotwork band.
Writes kinsmoke_caped_v5.fbx, kinsmoke_cape_rig_v5.json, fit_v5_*.png (v1-v4 files unchanged).
Run headless (Blender MCP is not available in the session that wrote this):
  Blender -b --factory-startup -P blender_build_kinsmoke_cape_v5.py -- <body_mixamo.fbx> <tripo cape.fbx> <out dir>
--- v1 notes follow ---
Build Kinsmoke with a cloth-ready cape (adapted from scripts/characters/loadout/blender_build_loadout_cape.py).
Kinsmoke's body is a Tripo UE5-rigged model already converted to mixamorig names and Backspool's T-pose rest by
scripts/characters/backspool/convert_ue_costume_to_mixamo.py; the cape is Tripo's unrigged wide moss-green cape with
gold trim (FBX); the staff Witnesspillar is exported separately (menu only).
Differences from Loadout's build: FBX cape, uniform scale with the collar seated at the base of the neck (a long,
Spawn-like cape), arms lowered to the idle angle for the fit, 15 x 6 cape chains, shin colliders, the cape texture kept.

Original description (Loadout):

Run headless:
  Blender -b --factory-startup -P scripts/characters/loadout/blender_build_loadout_cape.py -- \
      <body.fbx from Tripo, Mixamo preset> <cloak.glb from Tripo> <output dir>

What it does
- Imports the Mixamo-rigged body and the unrigged fur cloak.
- Turns the cloak to face the body (its long tail at his back, the opening at his chest), scales it
  to the reference sheet (collar at the base of the neck, tail tip at mid-thigh) and seats it on an
  A-posed copy of the body, pushing any vertex that cuts into the body back out.
- Adds a fan of cape chains (CapeC<col>_<row>) parented to mixamorig:Spine2 that follow the cloak's
  own drape, weights the cloak to those chains only (the body's skin weights are untouched), and
  writes loadout_cape_rig.json describing the chains and the body colliders for the runtime cloth.
- Exports one FBX (body + cloak + skeleton, textures embedded at 2048 px) plus the rig JSON.
"""
import bpy, bmesh, sys, os, math, json, mathutils
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree

argv = sys.argv[sys.argv.index('--') + 1:]
BODY_FBX, CLOAK_GLB, OUT = argv[0], argv[1], argv[2]
STAFF_FBX = argv[3] if len(argv) > 3 else None
os.makedirs(OUT, exist_ok=True)

# Reference sheet proportions, as fractions of body height (feet at 0, head top at 1).
COLLAR_TOP = 0.815      # v5: the cape's collar band (its 0.90-height level) sits here, the base of the neck (v1: 0.90, mask level)
Z_TOP = 0.812           # collar ring height (v3's seat)
RING_A, RING_B = 0.058, 0.058   # collar ring half-widths (x, y) around the neck base, body heights
COLLAR_LEVEL = 0.90     # which level of the cape (fraction of its own height) is the collar band
SCALE_XYZ = (1.0, 1.0, 1.0)   # cape native ~1.0 wide x 0.70 tall in body-height units: 1:1 gives a long, very wide Spawn-like cape
A_POSE_DEG = 68.0       # arms lowered to the idle angle for fitting
PUSH_MARGIN = 0.006     # cloak kept this far outside the body
COLUMNS = 15            # chains around the collar, opening at the chest
ROWS = 10               # joints per chain (9 weighted bones + a leaf at the hem); joint 0 on the collar ring
OPENING_DEG = 70.0      # width of the gap at the front of the collar
TEX_SIZE = 2048
CAPE_BLACK_GAIN = 0.5    # cape texture: Tripo's olive tint removed, brightness kept for the strand detail, then darkened

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=BODY_FBX)
arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
body = next(o for o in bpy.data.objects if o.type == 'MESH')
before = set(bpy.data.objects)
bpy.ops.import_scene.fbx(filepath=CLOAK_GLB)
cloak = next(o for o in bpy.data.objects if o not in before and o.type == 'MESH')
cloak.data.transform(cloak.matrix_world)    # bake the import transform into the mesh
cloak.parent = None
cloak.matrix_world = Matrix.Identity(4)
for o in list(bpy.data.objects):            # glTF import can add an empty root
    if o not in before and o is not cloak and o.type == 'EMPTY':
        bpy.data.objects.remove(o)
arm.name, body.name, cloak.name = 'KinsmokeArmature', 'KinsmokeBody', 'KinsmokeCape'

dg = bpy.context.evaluated_depsgraph_get()
def world_verts(o):
    e = o.evaluated_get(bpy.context.evaluated_depsgraph_get())
    return [o.matrix_world @ v.co for v in e.data.vertices]

# Body height in world units (feet at z=0 after the FBX import).
bv = world_verts(body)
H = max(v.z for v in bv) - min(v.z for v in bv)
FOOT = min(v.z for v in bv)

def bone_world(name, tail=False):
    b = arm.data.bones[name]
    return arm.matrix_world @ (b.tail_local if tail else b.head_local)

# 1. A-pose the arms for fitting (rotation about the world front-back axis through the shoulder joint).
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='POSE')
for side, sign in (('Left', 1), ('Right', -1)):
    pb = arm.pose.bones[f'mixamorig:{side}Arm']
    head_w = arm.matrix_world @ pb.head
    rot = Matrix.Translation(head_w) @ Matrix.Rotation(math.radians(A_POSE_DEG) * sign, 4, 'Y') @ Matrix.Translation(-head_w)
    pb.matrix = arm.matrix_world.inverted() @ rot @ arm.matrix_world @ pb.matrix
bpy.ops.object.mode_set(mode='OBJECT')
bpy.context.view_layer.update()
posed = world_verts(body)
bm = bmesh.new(); bm.from_mesh(body.evaluated_get(bpy.context.evaluated_depsgraph_get()).to_mesh())
bm.transform(body.matrix_world)
for i, v in enumerate(bm.verts): v.co = posed[i]
bm.normal_update()
body_bvh = BVHTree.FromBMesh(bm)

# 2. Place the cape: its back is already +Y like the body's (no turn); uniform scale; collar band at the neck base.
cloak.rotation_mode = 'XYZ'
cloak.matrix_world = Matrix.Identity(4)
me = cloak.data
cv = [v.co.copy() for v in me.vertices]
cz0 = min(v.z for v in cv); cz1 = max(v.z for v in cv)
sx, sy, sz = (s * H for s in SCALE_XYZ)
neck = bone_world('mixamorig:Neck')
ccx = (min(v.x for v in cv) + max(v.x for v in cv)) / 2
collar_z = cz0 + COLLAR_LEVEL * (cz1 - cz0)
def place(v, dy):
    x, y, z = (v.x - ccx) * sx, v.y * sy, (v.z - collar_z) * sz
    return Vector((neck.x + x, neck.y + dy + y, FOOT + COLLAR_TOP * H + z))
# Slide the cloak front-to-back until its back panel rests on the upper back.
back_y = max(v.y for v in posed if abs(v.x) < 0.04 * H and 0.70 * H < v.z - FOOT < 0.82 * H)
best = 0.0
for step in range(80):
    dy = -0.10 * H + step * 0.0025 * H
    pts = [place(v, dy) for v in cv]
    panel = [p for p in pts if abs(p.x) < 0.04 * H and 0.70 * H < p.z - FOOT < 0.82 * H and p.y > neck.y]
    if panel and min(p.y for p in panel) >= back_y + PUSH_MARGIN:
        best = dy; break
for i, v in enumerate(me.vertices):
    v.co = place(cv[i], best)

# 3. Push any vertex inside the body back out, spreading the correction to neighbours so strands bend instead of tearing.
adj = [[] for _ in me.vertices]
for e in me.edges:
    a, b = e.vertices; adj[a].append(b); adj[b].append(a)
pushed = 0
for it in range(4):
    disp = [Vector() for _ in me.vertices]
    hit = 0
    for i, v in enumerate(me.vertices):
        loc, n, _, _ = body_bvh.find_nearest(v.co, 0.25 * H)
        if loc is None: continue
        d = (v.co - loc).dot(n)
        if d < PUSH_MARGIN:
            disp[i] = n * (PUSH_MARGIN - d); hit += 1
    if not hit: break
    pushed = max(pushed, hit)
    for _ in range(6):
        nd = []
        for i, d in enumerate(disp):
            if adj[i]:
                avg = sum((disp[j] for j in adj[i]), Vector()) / len(adj[i])
                nd.append(d if d.length >= avg.length else avg * 0.85 + d * 0.15)
            else:
                nd.append(d)
        disp = nd
    for i, v in enumerate(me.vertices): v.co += disp[i]
me.update()

# 4. Cape chains that follow the cloak's own drape.
pts = [v.co.copy() for v in me.vertices]
cx, cy = neck.x, neck.y
top_z = max(p.z for p in pts)
def ang(p): return math.degrees(math.atan2(p.y - cy, p.x - cx)) % 360
# Front is -Y (270 deg). Columns run from just left of the opening, around the back, to just right of it.
start = 270 + OPENING_DEG / 2
span = 360 - OPENING_DEG
col_angles = [(start + span * c / (COLUMNS - 1)) % 360 for c in range(COLUMNS)]
half = span / (COLUMNS - 1) / 2 * 1.4
def in_wedge(p, a):
    d = (ang(p) - a + 180) % 360 - 180
    return abs(d) <= half
chains = []
for c, a in enumerate(col_angles):
    wedge = [p for p in pts if in_wedge(p, a)]
    lo = min(p.z for p in wedge); hi = max(p.z for p in wedge)
    hem = lo + 0.04 * (hi - lo)
    th = math.radians(a)
    joints = [Vector((cx + (RING_A + 0.004) * H * math.cos(th), cy + (RING_B + 0.004) * H * math.sin(th), FOOT + Z_TOP * H))]
    z1 = min(hi - 0.03 * H, FOOT + (Z_TOP - 0.045) * H)
    for r in range(1, ROWS):
        z = z1 - (z1 - hem) * (r - 1) / (ROWS - 2)
        band = [p for p in wedge if abs(p.z - z) < 0.035 * H] or wedge
        m = sum(band, Vector()) / len(band)
        joints.append(Vector((m.x, m.y, z)))
    chains.append(joints)

# 5. Add the bones (armature space), parented to Spine2.
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='POSE')
bpy.ops.pose.select_all(action='SELECT'); bpy.ops.pose.transforms_clear()   # back to the T-pose rest
bpy.ops.object.mode_set(mode='EDIT')
ebs = arm.data.edit_bones
inv = arm.matrix_world.inverted()
spine2 = ebs['mixamorig:Spine2']
names = []
for c, joints in enumerate(chains):
    prev = spine2; row = []
    for r, j in enumerate(joints):
        b = ebs.new(f'CapeC{c:02d}_{r}')
        b.head = inv @ j
        if r + 1 < len(joints):
            b.tail = inv @ joints[r + 1]
        else:
            b.tail = inv @ (j + (j - joints[r - 1]).normalized() * 0.02 * H)
        b.parent = prev
        b.use_connect = r > 0
        b.use_deform = r + 1 < len(joints)
        prev = b; row.append(b.name)
    names.append(row)
bpy.ops.object.mode_set(mode='OBJECT')

# 6. Weight the cloak to the chains only: inverse-square distance to the 4 nearest bone segments, then smoothed.
segs = []
for c, joints in enumerate(chains):
    for r in range(ROWS - 1):
        segs.append((names[c][r], joints[r], joints[r + 1]))
def seg_dist(p, a, b):
    ab = b - a; t = max(0.0, min(1.0, (p - a).dot(ab) / max(ab.length_squared, 1e-12)))
    return (p - (a + ab * t)).length, t
W = []
for p in pts:
    ds = sorted(((seg_dist(p, a, b)[0], n) for n, a, b in segs))[:4]
    ws = {n: 1.0 / (d * d + (0.01 * H) ** 2) for d, n in ds}
    s = sum(ws.values()); W.append({n: w / s for n, w in ws.items()})
for _ in range(3):
    nW = []
    for i, w in enumerate(W):
        acc = dict((k, v * 0.5) for k, v in w.items())
        for j in adj[i]:
            for k, v in W[j].items(): acc[k] = acc.get(k, 0) + v * 0.5 / len(adj[i])
        top = sorted(acc.items(), key=lambda kv: -kv[1])[:4]; s = sum(v for _, v in top)
        nW.append({k: v / s for k, v in top})
    W = nW
for row in names:
    for n in row[:-1]: cloak.vertex_groups.new(name=n)
for i, w in enumerate(W):
    for n, v in w.items(): cloak.vertex_groups[n].add([i], v, 'REPLACE')

# 6b. v3's collar ring (braided rope) at the neck base and brass clasps on the front of the shoulders, rigid on Spine2,
#     UV-mapped onto the Tripo atlas's own knotwork band (atlas px 1052..1325 x 488..588 of 4096).
KU0, KU1, KV0, KV1 = 1052 / 4096, 1325 / 4096, 1 - 588 / 4096, 1 - 488 / 4096
bm = bmesh.new(); bm.from_mesh(me); uvl = bm.loops.layers.uv.active; n_before = len(bm.verts)
RING_N, TUBE_N, TUBE_R, REP = 56, 8, 0.0095, 7
ring = [[None] * TUBE_N for _ in range(RING_N + 1)]
for a_ in range(RING_N + 1):
    t_ = 2 * math.pi * a_ / RING_N
    ctr = Vector((cx + RING_A * H * math.cos(t_), cy + RING_B * H * math.sin(t_), FOOT + (Z_TOP + 0.004) * H))
    radial = Vector((math.cos(t_), math.sin(t_), 0)); up = Vector((0, 0, 1))
    for b_ in range(TUBE_N):
        s_ = 2 * math.pi * b_ / TUBE_N
        ring[a_][b_] = bm.verts.new(ctr + (radial * math.cos(s_) + up * math.sin(s_)) * TUBE_R * H)
for a_ in range(RING_N):
    for b_ in range(TUBE_N):
        q = (ring[a_][b_], ring[a_ + 1][b_], ring[a_ + 1][(b_ + 1) % TUBE_N], ring[a_][(b_ + 1) % TUBE_N])
        f_ = bm.faces.new(q)
        ua = (a_ % REP) / REP; ub = ua + 1.0 / REP
        for loop, (uu, vv) in zip(f_.loops, ((ua, b_ / TUBE_N), (ub, b_ / TUBE_N), (ub, (b_ + 1) / TUBE_N), (ua, (b_ + 1) / TUBE_N))):
            loop[uvl].uv = (KU0 + (KU1 - KU0) * uu, KV0 + (KV1 - KV0) * vv)
        cc = f_.calc_center_median(); axis = (ring[a_][0].co + ring[a_][TUBE_N // 2].co) / 2
        f_.normal_update()
        if f_.normal.dot(cc - axis) < 0: f_.normal_flip()
# clasps: on the body's surface at the front of each shoulder, just below the ring, standing off the cape
from mathutils.bvhtree import BVHTree as _B
CLASP = (0.034, 0.014, 0.024)
cape_bvh = _B.FromBMesh(bm)
for sgn in (-1, 1):
    # the cape's own surface at the front of the shoulder: its most forward point in a box over the clavicle
    cand = [v.co for v in bm.verts[:n_before] if (FOOT + (Z_TOP - 0.075) * H) < v.co.z < (FOOT + (Z_TOP - 0.005) * H)
            and 0.05 * H < sgn * (v.co.x - cx) < 0.16 * H]
    if not cand: print('NO CLASP SEAT', sgn); continue
    seat = min(cand, key=lambda p: p.y)                 # front is -Y
    loc, nrm, _, _ = cape_bvh.find_nearest(seat, 0.1 * H)
    outw = nrm.normalized()
    if outw.y > 0: outw = -outw                         # face forward, off the cape
    tang = Vector((0, 0, 1)).cross(outw).normalized(); upv = outw.cross(tang).normalized()
    ctr = loc + outw * (CLASP[1] / 2 + 0.002) * H
    res = bmesh.ops.create_cube(bm, size=1.0)
    for v in res['verts']:
        l = v.co.copy(); v.co = ctr + (tang * l.x * CLASP[0] + outw * l.y * CLASP[1] + upv * l.z * CLASP[2]) * H
    for f_ in {f for v in res['verts'] for f in v.link_faces}:
        for loop in f_.loops: loop[uvl].uv = (0.26819, 0.87805)   # a uniform bronze patch of the Tripo knotwork (atlas px 1098, 499)
bm.to_mesh(me); bm.free()
gS = cloak.vertex_groups.get('mixamorig:Spine2') or cloak.vertex_groups.new(name='mixamorig:Spine2')
gS.add(list(range(n_before, len(cloak.data.vertices))), 1.0, 'REPLACE')
RIGID = sum(1 for v in cloak.data.vertices if any(g.group == gS.index and g.weight > 0.99 for g in v.groups))
assert RIGID == len(cloak.data.vertices) - n_before, 'collar ring / clasps not weighted to Spine2'
cloak.parent = arm
cloak.matrix_parent_inverse = arm.matrix_world.inverted()
mod = cloak.modifiers.new('Armature', 'ARMATURE'); mod.object = arm

# 7. Colliders for the runtime cloth: capsules between bone joints, radii measured from the A-posed body.
def collider_radii(segments):
    """Each body vertex counts only towards its nearest segment; radius = 75th percentile of its distance."""
    buckets = [[] for _ in segments]
    for v in posed:
        best = None
        for i, (a, b) in enumerate(segments):
            d, t = seg_dist(v, a, b)
            if best is None or d < best[0]: best = (d, i, t)
        d, i, t = best
        if 0.15 <= t <= 0.85: buckets[i].append(d)
    return [sorted(bk)[int(len(bk) * 0.75)] if bk else 0.05 * H for bk in buckets]
COLLIDERS = [('mixamorig:Hips', 'mixamorig:Spine'), ('mixamorig:Spine', 'mixamorig:Spine2'),
             ('mixamorig:Spine2', 'mixamorig:Neck'), ('mixamorig:Neck', 'mixamorig:Head'),
             ('mixamorig:LeftArm', 'mixamorig:LeftForeArm'), ('mixamorig:RightArm', 'mixamorig:RightForeArm'),
             ('mixamorig:LeftForeArm', 'mixamorig:LeftHand'), ('mixamorig:RightForeArm', 'mixamorig:RightHand'),
             ('mixamorig:LeftUpLeg', 'mixamorig:LeftLeg'), ('mixamorig:RightUpLeg', 'mixamorig:RightLeg'),
             ('mixamorig:LeftLeg', 'mixamorig:LeftFoot'), ('mixamorig:RightLeg', 'mixamorig:RightFoot')]
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='POSE')
for side, sign in (('Left', 1), ('Right', -1)):
    pb = arm.pose.bones[f'mixamorig:{side}Arm']; head_w = arm.matrix_world @ pb.head
    rot = Matrix.Translation(head_w) @ Matrix.Rotation(math.radians(A_POSE_DEG) * sign, 4, 'Y') @ Matrix.Translation(-head_w)
    pb.matrix = arm.matrix_world.inverted() @ rot @ arm.matrix_world @ pb.matrix
bpy.context.view_layer.update()
def posed_head(n): return arm.matrix_world @ arm.pose.bones[n].head
radii = collider_radii([(posed_head(a), posed_head(b)) for a, b in COLLIDERS])
colliders = [{'from': a.replace(':', ''), 'to': b.replace(':', ''), 'radiusOfHeight': round(r / H, 4)}
             for (a, b), r in zip(COLLIDERS, radii)]
bpy.ops.object.mode_set(mode='OBJECT')

# Renders of the fit (A-pose) for review.
sc = bpy.context.scene
sc.render.engine = 'BLENDER_WORKBENCH'; sc.display.shading.light = 'STUDIO'; sc.display.shading.color_type = 'TEXTURE'
sc.display.shading.show_xray = False
sc.render.resolution_x = sc.render.resolution_y = 700
cam = bpy.data.cameras.new('fitcam'); cam.type = 'ORTHO'; cam.ortho_scale = 1.15 * H
co = bpy.data.objects.new('fitcam', cam); sc.collection.objects.link(co); sc.camera = co
world = bpy.data.worlds.new('w'); sc.world = world; world.color = (0.55, 0.57, 0.6)
for k, loc, aim, scale in (('front', (0, -3, 0.5), 0.5, 1.25), ('back', (0, 3, 0.5), 0.5, 1.25), ('side', (3, 0, 0.5), 0.5, 1.25), ('three_quarter_back', (2.1, 2.1, 0.9), 0.5, 1.25),
                           ('collar_front', (0, -3, 0.82), 0.8, 0.42), ('collar_side', (3, -0.4, 0.82), 0.8, 0.42)):
    cam.ortho_scale = scale * H
    co.location = Vector(loc) * H + Vector((0, 0, FOOT))
    co.rotation_euler = (Vector((0, 0, FOOT + aim * H)) - co.location).to_track_quat('-Z', 'Y').to_euler()
    sc.render.filepath = os.path.join(OUT, f'fit_v5_{k}.png'); bpy.ops.render.render(write_still=True)

# Back to the bind pose for export.
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='POSE'); bpy.ops.pose.select_all(action='SELECT'); bpy.ops.pose.transforms_clear()
bpy.ops.object.mode_set(mode='OBJECT')
bpy.data.objects.remove(co)

# 8. Textures at 2048 px JPEG, embedded in the FBX.
texdir = os.path.join(OUT, 'textures'); os.makedirs(texdir, exist_ok=True)
sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'
sc.render.image_settings.file_format = 'JPEG'; sc.render.image_settings.quality = 88
def base_color_image_nodes(mat):
    # Only the image wired into Base Color. Tripo materials also carry roughness, metallic and normal images; saving every
    # image to the one basecolor path let the last (an all-black map) win, which made the body a black silhouette.
    # The game's toon look uses the colour map only, so the other image nodes are removed.
    keep = []
    for node in mat.node_tree.nodes:
        if node.type == 'BSDF_PRINCIPLED' and node.inputs['Base Color'].links:
            src = node.inputs['Base Color'].links[0].from_node
            if src.type == 'TEX_IMAGE' and src.image: keep.append(src)
    for node in [n for n in mat.node_tree.nodes if n.type == 'TEX_IMAGE' and n not in keep]: mat.node_tree.nodes.remove(node)
    for node in [n for n in mat.node_tree.nodes if n.type == 'NORMAL_MAP']: mat.node_tree.nodes.remove(node)
    return keep
for o, tag in ((body, 'kinsmoke_body'), (cloak, 'kinsmoke_cape')):
    for slot in o.material_slots:
        for node in base_color_image_nodes(slot.material):
            if True:
                img = node.image
                if img.size[0] > TEX_SIZE: img.scale(TEX_SIZE, TEX_SIZE)
                if False:   # Kinsmoke's moss-green and gold cape texture is kept as modelled
                    import numpy as np
                    px = np.array(img.pixels[:], dtype=np.float32).reshape(-1, 4)
                    lum = px[:, :3] @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
                    px[:, :3] = (lum * CAPE_BLACK_GAIN)[:, None]
                    img.pixels.foreach_set(px.ravel())
                    img.update()
                path = os.path.join(texdir, f'{tag}_v5_basecolor.jpg')
                img.filepath_raw = path; img.file_format = 'JPEG'
                img.save_render(path, scene=sc)
                img.source = 'FILE'; img.filepath = path
                if img.packed_file: img.unpack(method='REMOVE')
                img.reload()

# Both meshes must share one bind setup, or the FBX loader builds a second skeleton for one of them:
# put their geometry in armature space with identity parent and local transforms.
for o in (body, cloak):
    mw = o.matrix_world.copy()
    o.data.transform(arm.matrix_world.inverted() @ mw)
    o.parent = arm
    o.matrix_parent_inverse = Matrix.Identity(4)
    o.matrix_basis = Matrix.Identity(4)
# Tripo's material feeds the colour texture into alpha, which renders dark areas see-through: make everything opaque.
for o in (body, cloak):
    for slot in o.material_slots:
        mat = slot.material
        for node in mat.node_tree.nodes:
            if node.type == 'BSDF_PRINCIPLED':
                for link in list(node.inputs['Alpha'].links): mat.node_tree.links.remove(link)
                node.inputs['Alpha'].default_value = 1.0
                # The FBX exporter turns these into Phong specular/emissive; Blender's defaults wash the texture out.
                for name, value in (('Specular IOR Level', 0.0), ('Emission Strength', 0.0), ('Metallic', 0.0), ('Roughness', 0.85)):
                    if name in node.inputs:
                        for link in list(node.inputs[name].links): mat.node_tree.links.remove(link)
                        node.inputs[name].default_value = value
                if 'Specular Tint' in node.inputs and node.inputs['Specular Tint'].type == 'RGBA':
                    node.inputs['Specular Tint'].default_value = (0, 0, 0, 1)
                if 'Emission Color' in node.inputs:
                    for link in list(node.inputs['Emission Color'].links): mat.node_tree.links.remove(link)
                    node.inputs['Emission Color'].default_value = (0, 0, 0, 1)
        mat.blend_method = 'OPAQUE'
CLOAK_VERTS = len(cloak.data.vertices)
# One UV map per mesh, both named 'UVMap', before the join. Tripo names them differently; joined, each mesh would keep
# its UVs in its own layer and leave zeros in the other's, and three.js reads only the first layer ('uv'), so the body
# sampled a single dark texel and rendered as a black silhouette.
for o in (body, cloak):
    uvs = o.data.uv_layers; keep = uvs.active or uvs[0]
    for l in [l for l in uvs if l != keep]: uvs.remove(l)
    keep.name = 'UVMap'
# One skinned mesh: r128's FBXLoader gives every additional skin that shares bones its own nested copy of them.
bpy.ops.object.select_all(action='DESELECT')
cloak.select_set(True); body.select_set(True); bpy.context.view_layer.objects.active = body
bpy.ops.object.join()
body.name = 'KinsmokeBody'
# Stable material names: the game splits the cape into its own mesh by material so it can be switched off.
body.data.materials[0].name, body.data.materials[1].name = 'KinsmokeBody', 'KinsmokeCape'
# Three.js skins with at most 4 weights per vertex; Tripo's body has more. Keep the strongest 4 and renormalise.
deform = {g.index for g in body.vertex_groups if g.name in arm.data.bones and arm.data.bones[g.name].use_deform}
for v in body.data.vertices:
    gs = sorted((g for g in v.groups if g.group in deform and g.weight > 0), key=lambda g: -g.weight)
    keep = gs[:4]; kept = {g.group for g in keep}
    for gi in [g.group for g in v.groups if g.group not in kept]:   # extra, zero-weight and non-deform entries
        body.vertex_groups[gi].remove([v.index])
    total = sum(g.weight for g in keep)
    if total > 0:
        for g in keep: body.vertex_groups[g.group].add([v.index], g.weight / total, 'REPLACE')

fbx = os.path.join(OUT, 'kinsmoke_caped_v5.fbx')
for o in bpy.data.objects: o.select_set(o in (arm, body))
bpy.ops.export_scene.fbx(filepath=fbx, use_selection=True, object_types={'ARMATURE', 'MESH'},
                         add_leaf_bones=False, bake_anim=False, path_mode='COPY', embed_textures=True,
                         mesh_smooth_type='FACE', use_armature_deform_only=False)

rig = {
    'character': 'Kinsmoke',
    'heightUnits': 'all lengths are fractions of body height (feet to head top)',
    'version': 5, 'columns': COLUMNS, 'rows': ROWS, 'openingDeg': OPENING_DEG, 'thetaMaxDeg': (360 - OPENING_DEG) / 2,
    'cloth': {'swingOfChain': [0.0, 0.04] + [round(0.04 + 0.70 * ((r - 1) / (ROWS - 2)) ** 1.25, 4) for r in range(2, ROWS)]},
    'rootParent': 'mixamorigSpine2',
    'chains': names,
    'restBoneLengthOfHeight': [[round((chains[c][r + 1] - chains[c][r]).length / H, 4) for r in range(ROWS - 1)] for c in range(COLUMNS)],
    'colliders': colliders,
    'fit': {'collarTopOfHeight': COLLAR_TOP, 'scaleXYZOfHeight': SCALE_XYZ, 'aPoseDeg': A_POSE_DEG,
            'verticesPushedOut': pushed, 'cloakVertices': CLOAK_VERTS},
    'sources': {'body': os.path.basename(BODY_FBX), 'cloak': os.path.basename(CLOAK_GLB)},
}
json.dump(rig, open(os.path.join(OUT, 'kinsmoke_cape_rig_v5.json'), 'w'), indent=1)

# 9. Witnesspillar (menu only): its own small FBX, height 0.95 x body height, base at 0, texture 1024 px.
if STAFF_FBX:
    bpy.ops.object.select_all(action='DESELECT')
    before = set(bpy.data.objects)
    bpy.ops.import_scene.fbx(filepath=STAFF_FBX)
    staff = next(o for o in bpy.data.objects if o not in before and o.type == 'MESH')
    staff.data.transform(staff.matrix_world); staff.parent = None; staff.matrix_world = Matrix.Identity(4)
    sv = [v.co for v in staff.data.vertices]; z0 = min(v.z for v in sv); z1 = max(v.z for v in sv)
    k = 0.95 * H / (z1 - z0); cxs = sum(v.x for v in sv) / len(sv); cys = sum(v.y for v in sv) / len(sv)
    staff.data.transform(Matrix.Scale(k, 4) @ Matrix.Translation((-cxs, -cys, -z0)))
    staff.name = 'Witnesspillar'
    for slot in staff.material_slots:
        slot.material.name = 'Witnesspillar'
        for node in slot.material.node_tree.nodes:
            if node.type == 'TEX_IMAGE' and node.image and node.image.size[0] > 1024: node.image.scale(1024, 1024)
            if node.type == 'BSDF_PRINCIPLED':
                for link in list(node.inputs['Alpha'].links): slot.material.node_tree.links.remove(link)
                node.inputs['Alpha'].default_value = 1.0
        slot.material.blend_method = 'OPAQUE'
    for o in bpy.data.objects: o.select_set(o is staff)
    bpy.ops.export_scene.fbx(filepath=os.path.join(OUT, 'kinsmoke_witnesspillar.fbx'), use_selection=True, object_types={'MESH'},
                             path_mode='COPY', embed_textures=True, mesh_smooth_type='FACE')
    print('STAFF', round(0.95, 2), 'of height')
print('BUILT', fbx, 'H', round(H, 4), 'pushed', pushed, 'bones', sum(len(r) for r in names))
