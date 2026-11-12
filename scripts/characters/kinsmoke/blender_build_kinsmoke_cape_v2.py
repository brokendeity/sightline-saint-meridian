"""Kinsmoke cape v2: a clean procedural cape built around his body, fitted like the user's reference art
(development/characters/kinsmoke/reference_kinsmoke_cape.webp), replacing the Tripo cape sculpt (whose wings are baked-in
twisted strands, held up past his head for an A-pose, and whose collar band sat at mask height).
  - collar ring (braided rope) around the BASE of the neck; the cape's top edge rides it and passes over the shoulders;
  - brass clasps on the front of the shoulders, where the front edges start;
  - two broad, symmetrical wings sweeping out from the shoulders to calf level, a few broad folds, a slight outward hem roll,
    a continuous braided gold border (front edges, top, hem) - all from one grid, so there are no strands or tendrils;
  - shape kept clear of the idle-posed body (arms lowered) by a measured clearance field, and never curving back in;
  - bone chains CapeC<col>_<row> placed ON the sheet's grid (chain c = grid column 6c), every vertex weighted bilinearly
    to its 2 chains x 2 bones (4 weights), so the runtime cloth moves one connected sheet;
  - collar ring and clasps weighted 100% to mixamorig:Spine2 (rigid).
Texture: scripts/characters/kinsmoke/make_kinsmoke_cape_texture.py (procedural; its UV layout is used here).
Writes, next to the v1 files (which stay unchanged): kinsmoke_caped_v2.fbx, kinsmoke_cape_rig_v2.json, fit_v2_*.png.
Run headless (Blender MCP not available in the session that wrote this):
  Blender -b --factory-startup -P blender_build_kinsmoke_cape_v2.py -- <body_mixamo.fbx> <cape_texture.png> <out dir>"""
import bpy, bmesh, sys, os, math, json
from mathutils import Vector, Matrix

argv = sys.argv[sys.argv.index('--') + 1:]
BODY_FBX, CAPE_TEX, OUT = argv[0], argv[1], argv[2]
os.makedirs(OUT, exist_ok=True)

# ---- design, in fractions of body height (feet 0, head top 1); the body faces -Y, his back is +Y ----
THETA_MAX = 108.0        # front edges, degrees from the centre back (0) toward the front on each side
Z_TOP = 0.812            # top edge / collar: the base of the neck (Neck joint 0.827, chin ~0.86)
TOP_A, TOP_B = 0.052, 0.054            # top edge ellipse half-widths (x, y) around the neck base
V_SHOULDER = 0.13        # first 13% of the length is the yoke: a rounded drape over the shoulders
Z_SHOULDER = 0.772       # nominal shoulder line (the yoke drops DROP_BACK..DROP_SIDE below the collar)
DROP_BACK, DROP_SIDE = 0.035, 0.065
HEM_BACK, HEM_EDGE = 0.215, 0.27       # hem height at the centre back and at the front edges (calf level)
R_SH_BACK, R_SH_SIDE = 0.088, 0.168    # radius at the end of the yoke (over the scapula / outside the deltoid and upper arm)
R_HEM_BACK, R_HEM_SIDE, R_HEM_EDGE = 0.26, 0.50, 0.46   # hem radius: broad wings at the sides
FLARE_BACK, FLARE_SIDE = 1.6, 1.2   # flare exponent: the back widens late, the wings sweep out from the shoulders
SLOPE_BACK, SLOPE_SIDE = 0.18, 0.40  # yoke slope (drop per unit radius) following the trapezius
YOKE_MARGIN = 0.012     # yoke height above the shoulder tops
FOLDS, FOLD_AMP = 4.5, 0.07            # broad symmetrical folds (crests at the centre back), added after smoothing, outward only
HEM_ROLL = 0.022         # slight outward roll of the hem
MARGIN = 0.02            # clearance from the idle-posed body
THICK = 0.0065           # cloth thickness (solidified shell)
COLS, ROWS = 15, 8       # bone chains x joints per chain (7 deforming bones + leaf)
SUB = 6                  # grid columns per chain gap
NU, NV = (COLS - 1) * SUB + 1, 64
ROW_V = [0.0, 0.10, 0.24, 0.39, 0.54, 0.69, 0.84, 1.0]
SWING = [0.0, 0.05, 0.22, 0.36, 0.48, 0.58, 0.68, 0.76]   # runtime max swing per row, fraction of chain length
A_POSE_DEG = 68.0        # arms lowered to the idle angle for the clearance field and the fit renders
U_SCALE = 0.9            # texture u = distance from the nearest front edge / U_SCALE (make_kinsmoke_cape_texture.py)
ROPE_U0, ROPE_V1, BRASS_V0 = 0.952, 0.88, 0.90
assert len(ROW_V) == ROWS and len(SWING) == ROWS

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=BODY_FBX)
arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
body = next(o for o in bpy.data.objects if o.type == 'MESH')
arm.name, body.name = 'KinsmokeArmature', 'KinsmokeBody'
def world_verts(o):
    e = o.evaluated_get(bpy.context.evaluated_depsgraph_get())
    return [o.matrix_world @ v.co for v in e.data.vertices]
bv = world_verts(body)
H = max(v.z for v in bv) - min(v.z for v in bv); FOOT = min(v.z for v in bv)
def bone_world(n): return arm.matrix_world @ arm.data.bones[n].head_local
neck = bone_world('mixamorig:Neck'); spine2 = bone_world('mixamorig:Spine2')
CX, CY = neck.x, (neck.y + spine2.y) / 2

def pose_arms(deg):
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='POSE')
    for side, sign in (('Left', 1), ('Right', -1)):
        pb = arm.pose.bones[f'mixamorig:{side}Arm']; head_w = arm.matrix_world @ pb.head
        rot = Matrix.Translation(head_w) @ Matrix.Rotation(math.radians(deg) * sign, 4, 'Y') @ Matrix.Translation(-head_w)
        pb.matrix = arm.matrix_world.inverted() @ rot @ arm.matrix_world @ pb.matrix
    bpy.ops.object.mode_set(mode='OBJECT'); bpy.context.view_layer.update()
pose_arms(A_POSE_DEG)
posed = world_verts(body)

# ---- clearance field from the idle-posed body: max radius from the neck axis per (angle, height) bin ----
DPHI, DZ = 4.0, 0.01
clear = {}
for p in posed:
    z = (p.z - FOOT) / H
    if z > 0.86: continue                         # the head is above the collar: never part of the drape
    phi = math.degrees(math.atan2(p.x - CX, p.y - CY)); rho = math.hypot(p.x - CX, p.y - CY) / H
    k = (int(round(phi / DPHI)), int(round(z / DZ)))
    if rho > clear.get(k, 0): clear[k] = rho
# shoulder-top height field: highest body point per (angle, radius) bin, below the jaw
DR = 0.008
top = {}
for p in posed:
    z = (p.z - FOOT) / H
    if z > 0.835: continue
    phi = math.degrees(math.atan2(p.x - CX, p.y - CY)); rho = math.hypot(p.x - CX, p.y - CY) / H
    k = (int(round(phi / DPHI)), int(round(rho / DR)))
    if z > top.get(k, -1): top[k] = z
def shoulder_top(theta, rho):
    best = -1.0
    for dk in range(-2, 3):
        for dr in range(-2, 3):
            best = max(best, top.get((int(round(theta / DPHI)) + dk, int(round(rho / DR)) + dr), -1.0))
    return best
def clearance(theta, z):
    best = 0.0
    for dk in range(-4, 5):
        for dz in range(-2, 3):
            best = max(best, clear.get((int(round(theta / DPHI)) + dk, int(round(z / DZ)) + dz), 0.0))
    return best + MARGIN if best > 0 else 0.0

def smoothstep(a, b, x):
    t = max(0.0, min(1.0, (x - a) / (b - a))); return t * t * (3 - 2 * t)

# ---- the design surface: radius R and height Z for each (theta, v) ----
thetas = [-THETA_MAX + 2 * THETA_MAX * j / (NU - 1) for j in range(NU)]
vs = [i / (NV - 1) for i in range(NV)]
def design(theta, v):
    s = abs(theta) / THETA_MAX; side = math.sin(math.radians(min(abs(theta), 90.0))) ** 2
    th = math.radians(theta)
    r_top = 1.0 / math.sqrt((math.sin(th) / TOP_A) ** 2 + (math.cos(th) / TOP_B) ** 2)
    r_sh = R_SH_BACK + (R_SH_SIDE - R_SH_BACK) * side
    drop = DROP_BACK + (DROP_SIDE - DROP_BACK) * side; slope = SLOPE_BACK + (SLOPE_SIDE - SLOPE_BACK) * side
    def yoke(a):             # sloping with the trapezius, rounding over the deltoid, ending straight down
        R = r_top + (r_sh - r_top) * math.sin(a)
        z = Z_TOP - slope * (R - r_top) - drop * (1 - math.cos(a)) ** 1.5
        # rides the shoulder tops, never above the collar (the neck's back is not a shoulder)
        return R, min(Z_TOP, max(z, shoulder_top(theta, R) + YOKE_MARGIN)) if a < math.pi / 2 * 0.98 else z
    if v <= V_SHOULDER: return yoke((v / V_SHOULDER) * math.pi / 2)
    t = (v - V_SHOULDER) / (1 - V_SHOULDER)
    z_sh = yoke(math.pi / 2)[1]
    FLARE = FLARE_BACK + (FLARE_SIDE - FLARE_BACK) * side
    r_hem = R_HEM_BACK + (R_HEM_SIDE - R_HEM_BACK) * smoothstep(0.0, 0.75, s)
    r_hem += (R_HEM_EDGE - R_HEM_SIDE) * smoothstep(0.85, 1.0, s)
    z_hem = HEM_BACK + (HEM_EDGE - HEM_BACK) * s * s
    R = r_sh + (r_hem - r_sh) * t ** FLARE
    roll = smoothstep(0.93, 1.0, v)
    return R + HEM_ROLL * roll, z_sh - (z_sh - z_hem) * t + 0.012 * roll
def folds(theta, v):
    if v <= V_SHOULDER: return 0.0
    t = (v - V_SHOULDER) / (1 - V_SHOULDER)
    return FOLD_AMP * t ** 1.2 * (0.5 + 0.5 * math.cos(FOLDS * math.pi * theta / THETA_MAX))
Rg = [[0.0] * NU for _ in range(NV)]; Zg = [[0.0] * NU for _ in range(NV)]; Cg = [[0.0] * NU for _ in range(NV)]
for i, v in enumerate(vs):
    for j, th in enumerate(thetas):
        R, Z = design(th, v); Rg[i][j], Zg[i][j] = R, Z; Cg[i][j] = clearance(th, Z)
def enforce():
    pushed = 0
    for i in range(NV):
        for j in range(NU):
            if vs[i] > V_SHOULDER and Rg[i][j] < Cg[i][j]: Rg[i][j] = Cg[i][j]; pushed += 1   # the yoke rides the height field instead
        if vs[i] > V_SHOULDER:
            for j in range(NU): Rg[i][j] = max(Rg[i][j], Rg[i - 1][j])   # never curves back in toward the body
    return pushed
pushed = enforce()
for _ in range(3):                                   # smooth the clearance bumps out along rows and columns, keep symmetry
    for i in range(1, NV):
        row = Rg[i][:]
        for j in range(NU):
            a, b = row[max(0, j - 1)], row[min(NU - 1, j + 1)]; Rg[i][j] = 0.25 * a + 0.5 * row[j] + 0.25 * b
    for j in range(NU):
        col = [Rg[i][j] for i in range(NV)]
        for i in range(2, NV - 1): Rg[i][j] = 0.25 * col[i - 1] + 0.5 * col[i] + 0.25 * col[i + 1]
    for i in range(NV):
        for j in range(NU // 2 + 1):
            m = max(Rg[i][j], Rg[i][NU - 1 - j]); Rg[i][j] = Rg[i][NU - 1 - j] = m
    pushed = max(pushed, enforce())
for i in range(NV):
    for j in range(NU): Rg[i][j] += folds(thetas[j], vs[i])
def point(i, j):
    th = math.radians(thetas[j]); R = Rg[i][j] * H
    return Vector((CX + R * math.sin(th), CY + R * math.cos(th), FOOT + Zg[i][j] * H))

# ---- mesh, UVs, weights ----
me = bpy.data.meshes.new('KinsmokeCape'); cape = bpy.data.objects.new('KinsmokeCape', me); bpy.context.collection.objects.link(cape)
bm = bmesh.new(); verts = [[bm.verts.new(point(i, j)) for j in range(NU)] for i in range(NV)]
faces = []
for i in range(NV - 1):
    for j in range(NU - 1):
        faces.append(bm.faces.new((verts[i][j], verts[i][j + 1], verts[i + 1][j + 1], verts[i + 1][j])))
bm.normal_update()
mid = faces[(NV // 2) * (NU - 1) + (NU - 1) // 2]; c = mid.calc_center_median(); out = Vector((c.x - CX, c.y - CY, 0))
flipped = mid.normal.dot(out) < 0
if flipped: bmesh.ops.reverse_faces(bm, faces=bm.faces[:])
# texture coordinates: u = distance along the row from the nearest front edge / U_SCALE; v = distance down the column / its length
U = [[0.0] * NU for _ in range(NV)]; Vt = [[0.0] * NU for _ in range(NV)]
for i in range(NV):
    acc = [0.0]
    for j in range(1, NU): acc.append(acc[-1] + (point(i, j) - point(i, j - 1)).length / H)
    for j in range(NU): U[i][j] = min(acc[j], acc[-1] - acc[j]) / U_SCALE
for j in range(NU):
    acc = [0.0]
    for i in range(1, NV): acc.append(acc[-1] + (point(i, j) - point(i - 1, j)).length / H)
    for i in range(NV): Vt[i][j] = acc[i] / acc[-1]
uvl = bm.loops.layers.uv.new('UVMap')
for i in range(NV):
    for j in range(NU):
        for loop in verts[i][j].link_loops: loop[uvl].uv = (min(U[i][j], 0.935), 1.0 - Vt[i][j])
# chains on the grid: chain c is grid column SUB*c; joint r at v = ROW_V[r] (interpolated between grid rows)
def surf(c, v):
    j = SUB * c; x = v * (NV - 1); i0 = min(NV - 2, int(x)); f = x - i0
    return point(i0, j).lerp(point(i0 + 1, j), f)
chains = [[surf(c, v) for v in ROW_V] for c in range(COLS)]
bm.to_mesh(me); bm.free()

# weights (vertex index order: cape grid rows first, then rope, then clasps)
names = [[f'CapeC{c:02d}_{r}' for r in range(ROWS)] for c in range(COLS)]
for row in names:
    for n in row[:-1]: cape.vertex_groups.new(name=n)
gS = cape.vertex_groups.new(name='mixamorig:Spine2')
centres = [(ROW_V[r] + ROW_V[r + 1]) / 2 for r in range(ROWS - 1)]
for i in range(NV):
    v = vs[i]
    if v <= centres[0]: rw = [(0, 1.0)]
    elif v >= centres[-1]: rw = [(ROWS - 2, 1.0)]
    else:
        r = max(k for k in range(ROWS - 1) if centres[k] <= v); f = (v - centres[r]) / (centres[r + 1] - centres[r]); rw = [(r, 1 - f), (r + 1, f)]
    for j in range(NU):
        fc = j / SUB; c0 = min(COLS - 2, int(fc)); fu = fc - c0; idx = i * NU + j
        for c, wc in ((c0, 1 - fu), (c0 + 1, fu)):
            for r, wr in rw:
                if wc * wr > 0: cape.vertex_groups[names[c][r]].add([idx], wc * wr, 'ADD')
# thickness: a closed shell (both sides render; weights carry over)
sol = cape.modifiers.new('Solidify', 'SOLIDIFY'); sol.thickness = THICK * H; sol.offset = 0.0; sol.use_rim = True
bpy.context.view_layer.objects.active = cape; cape.select_set(True)
bpy.ops.object.modifier_apply(modifier='Solidify')
for p in me.polygons: p.use_smooth = True
# collar ring and clasps are added after the solidify (they are closed solids already)
bm = bmesh.new(); bm.from_mesh(me); uvl = bm.loops.layers.uv.active; n_before = len(bm.verts)
# collar ring (braided rope) and two brass clasps, rigid on Spine2
rope_verts, clasp_verts = [], []
RING_N, TUBE_N, RING_A, RING_B, TUBE_R = 56, 8, TOP_A + 0.006, TOP_B + 0.004, 0.0095
ring = [[None] * TUBE_N for _ in range(RING_N + 1)]
for a in range(RING_N + 1):
    t = 2 * math.pi * a / RING_N; ctr = Vector((CX + RING_A * H * math.sin(t), CY + RING_B * H * math.cos(t), FOOT + (Z_TOP + 0.004) * H))
    radial = Vector((math.sin(t) * RING_B, math.cos(t) * RING_A, 0)).normalized(); up = Vector((0, 0, 1))
    for b in range(TUBE_N):
        s = 2 * math.pi * b / TUBE_N
        v = bm.verts.new(ctr + (radial * math.cos(s) + up * math.sin(s)) * TUBE_R * H); ring[a][b] = v; rope_verts.append(v)
for a in range(RING_N):
    for b in range(TUBE_N):
        f = bm.faces.new((ring[a][b], ring[a + 1][b], ring[a + 1][(b + 1) % TUBE_N], ring[a][(b + 1) % TUBE_N]))
        for loop in f.loops:
            ai = a + (1 if loop.vert in (ring[a + 1][b], ring[a + 1][(b + 1) % TUBE_N]) else 0)
            bi = b + (1 if loop.vert in (ring[a][(b + 1) % TUBE_N], ring[a + 1][(b + 1) % TUBE_N]) else 0)
            loop[uvl].uv = (ROPE_U0 + (1 - ROPE_U0) * bi / TUBE_N, 1.0 - ROPE_V1 * ai / RING_N)
bm.normal_update()
for f in {f for v in rope_verts for f in v.link_faces}:   # rope faces point outward from the tube
    cc = f.calc_center_median(); a = round((math.atan2(cc.x - CX, cc.y - CY) % (2 * math.pi)) / (2 * math.pi) * RING_N) % RING_N
    if f.normal.dot(cc - (ring[a][0].co + ring[a][TUBE_N // 2].co) / 2) < 0: f.normal_flip()
CLASP = (0.034, 0.014, 0.024)
for sgn in (-1, 1):
    # on the front of the shoulder: the front edge, a little down the yoke, seated on the cape's own surface normal
    j = 0 if sgn < 0 else NU - 1; jj = 1 if sgn < 0 else NU - 2; i = int(0.09 * (NV - 1)); p = point(i, j)
    du = (point(i, jj) - p) * (1 if sgn < 0 else -1); dv = point(i + 1, j) - p
    outw = du.cross(dv).normalized(); radial = Vector((p.x - CX, p.y - CY, 0))
    if outw.dot(radial) < 0: outw = -outw
    tang = du.normalized(); up = outw.cross(tang).normalized()
    p = p + du.normalized() * 0.012 * H        # just inside the edge, over the border
    ctr = p + outw * (THICK / 2 + CLASP[1] / 2) * H
    res = bmesh.ops.create_cube(bm, size=1.0)
    for v in res['verts']:
        loc = v.co.copy(); v.co = ctr + (tang * loc.x * CLASP[0] + outw * loc.y * CLASP[1] + up * loc.z * CLASP[2]) * H
        clasp_verts.append(v)
    for f in {f for v in res['verts'] for f in v.link_faces}:
        for loop in f.loops: loop[uvl].uv = (0.976, 1.0 - (BRASS_V0 + 0.05))
bm.to_mesh(me); bm.free()
gS = cape.vertex_groups['mixamorig:Spine2']
gS.add(list(range(n_before, len(cape.data.vertices))), 1.0, 'REPLACE')
RIGID = sum(1 for v in cape.data.vertices if any(g.group == gS.index and g.weight > 0.99 for g in v.groups))
print('RIGID', RIGID, 'of', len(cape.data.vertices) - n_before, 'mesh is me', cape.data == me)
assert RIGID == len(cape.data.vertices) - n_before, 'collar ring / clasps not weighted to Spine2'

# material
mat = bpy.data.materials.new('KinsmokeCape'); mat.use_nodes = True
bsdf = next(n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
tex = mat.node_tree.nodes.new('ShaderNodeTexImage'); tex.image = bpy.data.images.load(CAPE_TEX)
mat.node_tree.links.new(tex.outputs['Color'], bsdf.inputs['Base Color'])
for name, value in (('Specular IOR Level', 0.0), ('Emission Strength', 0.0), ('Metallic', 0.0), ('Roughness', 0.85)):
    if name in bsdf.inputs: bsdf.inputs[name].default_value = value
me.materials.append(mat)

# ---- bones (rest T-pose; the arms do not touch Spine2 or the cape) ----
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='POSE'); bpy.ops.pose.select_all(action='SELECT'); bpy.ops.pose.transforms_clear()
bpy.ops.object.mode_set(mode='EDIT')
ebs = arm.data.edit_bones; inv = arm.matrix_world.inverted()
for c, joints in enumerate(chains):
    prev = ebs['mixamorig:Spine2']
    for r, jn in enumerate(joints):
        b = ebs.new(names[c][r]); b.head = inv @ jn
        b.tail = inv @ (joints[r + 1] if r + 1 < ROWS else jn + (jn - joints[r - 1]).normalized() * 0.02 * H)
        b.parent = prev; b.use_connect = r > 0; b.use_deform = r + 1 < ROWS; prev = b
bpy.ops.object.mode_set(mode='OBJECT')
cape.parent = arm; cape.matrix_parent_inverse = arm.matrix_world.inverted()
mod = cape.modifiers.new('Armature', 'ARMATURE'); mod.object = arm

# ---- colliders for the runtime cloth (as v1: capsules between joints, radii from the idle-posed body) ----
def seg_dist(p, a, b):
    ab = b - a; t = max(0.0, min(1.0, (p - a).dot(ab) / max(ab.length_squared, 1e-12)))
    return (p - (a + ab * t)).length, t
COLLIDERS = [('mixamorig:Hips', 'mixamorig:Spine'), ('mixamorig:Spine', 'mixamorig:Spine2'),
             ('mixamorig:Spine2', 'mixamorig:Neck'), ('mixamorig:Neck', 'mixamorig:Head'),
             ('mixamorig:LeftArm', 'mixamorig:LeftForeArm'), ('mixamorig:RightArm', 'mixamorig:RightForeArm'),
             ('mixamorig:LeftForeArm', 'mixamorig:LeftHand'), ('mixamorig:RightForeArm', 'mixamorig:RightHand'),
             ('mixamorig:LeftUpLeg', 'mixamorig:LeftLeg'), ('mixamorig:RightUpLeg', 'mixamorig:RightLeg'),
             ('mixamorig:LeftLeg', 'mixamorig:LeftFoot'), ('mixamorig:RightLeg', 'mixamorig:RightFoot')]
pose_arms(A_POSE_DEG)
def posed_head(n): return arm.matrix_world @ arm.pose.bones[n].head
segs = [(posed_head(a), posed_head(b)) for a, b in COLLIDERS]
buckets = [[] for _ in segs]
for v in posed:
    best = None
    for k, (a, b) in enumerate(segs):
        d, t = seg_dist(v, a, b)
        if best is None or d < best[0]: best = (d, k, t)
    d, k, t = best
    if 0.15 <= t <= 0.85: buckets[k].append(d)
radii = [sorted(bk)[int(len(bk) * 0.75)] if bk else 0.05 * H for bk in buckets]
colliders = [{'from': a.replace(':', ''), 'to': b.replace(':', ''), 'radiusOfHeight': round(r / H, 4)} for (a, b), r in zip(COLLIDERS, radii)]

# ---- fit renders (arms lowered to the idle angle) ----
sc = bpy.context.scene
sc.render.engine = 'BLENDER_WORKBENCH'; sc.display.shading.light = 'STUDIO'; sc.display.shading.color_type = 'TEXTURE'
sc.render.resolution_x = sc.render.resolution_y = 800
sc.view_settings.view_transform = 'Standard'
camd = bpy.data.cameras.new('fitcam'); camd.type = 'ORTHO'; camd.ortho_scale = 1.15 * H
co = bpy.data.objects.new('fitcam', camd); sc.collection.objects.link(co); sc.camera = co
world = bpy.data.worlds.new('w'); sc.world = world; world.color = (0.55, 0.57, 0.6)
for k, loc, aim, scale in (('front', (0, -3, 0.5), 0.5, 1.15), ('back', (0, 3, 0.5), 0.5, 1.15), ('side', (3, 0, 0.5), 0.5, 1.15),
                           ('three_quarter_back', (2.1, 2.1, 0.9), 0.5, 1.15), ('collar_front', (0, -3, 0.82), 0.8, 0.42),
                           ('collar_side', (3, -0.4, 0.82), 0.8, 0.42)):
    camd.ortho_scale = scale * H
    co.location = Vector(loc) * H + Vector((CX, CY, FOOT))
    co.rotation_euler = (Vector((CX, CY, FOOT + aim * H)) - co.location).to_track_quat('-Z', 'Y').to_euler()
    sc.render.filepath = os.path.join(OUT, f'fit_v2_{k}.png'); bpy.ops.render.render(write_still=True)
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='POSE'); bpy.ops.pose.select_all(action='SELECT'); bpy.ops.pose.transforms_clear()
bpy.ops.object.mode_set(mode='OBJECT'); bpy.data.objects.remove(co)

# ---- body material: only its Base Color image (v1 lesson: other Tripo maps overwrote it with black), opaque ----
texdir = os.path.join(OUT, 'textures'); os.makedirs(texdir, exist_ok=True)
for slot in body.material_slots:
    m = slot.material; keep = []
    for n in m.node_tree.nodes:
        if n.type == 'BSDF_PRINCIPLED' and n.inputs['Base Color'].links:
            src = n.inputs['Base Color'].links[0].from_node
            if src.type == 'TEX_IMAGE' and src.image: keep.append(src)
        if n.type == 'BSDF_PRINCIPLED':
            for name, value in (('Specular IOR Level', 0.0), ('Emission Strength', 0.0), ('Metallic', 0.0), ('Roughness', 0.85)):
                if name in n.inputs:
                    for link in list(n.inputs[name].links): m.node_tree.links.remove(link)
                    n.inputs[name].default_value = value
            for link in list(n.inputs['Alpha'].links): m.node_tree.links.remove(link)
            n.inputs['Alpha'].default_value = 1.0
    for n in [n for n in m.node_tree.nodes if (n.type == 'TEX_IMAGE' and n not in keep) or n.type == 'NORMAL_MAP']: m.node_tree.nodes.remove(n)
    for n in keep:
        img = n.image
        if img.size[0] > 2048: img.scale(2048, 2048)
        path = os.path.join(texdir, 'kinsmoke_body_v2_basecolor.jpg')
        sc.render.image_settings.file_format = 'JPEG'; sc.render.image_settings.quality = 88
        img.save_render(path, scene=sc); img.source = 'FILE'; img.filepath = path
        if img.packed_file: img.unpack(method='REMOVE')
        img.reload()
    m.blend_method = 'OPAQUE'; m.name = 'KinsmokeBody'

# ---- one skinned mesh (body + cape), shared UV map name, 4 weights max, export ----
for o in (body, cape):
    uvs = o.data.uv_layers; keep = uvs.active or uvs[0]
    for l in [l for l in uvs if l != keep]: uvs.remove(l)
    keep.name = 'UVMap'
for o in (body, cape):
    mw = o.matrix_world.copy(); o.data.transform(arm.matrix_world.inverted() @ mw)
    o.parent = arm; o.matrix_parent_inverse = Matrix.Identity(4); o.matrix_basis = Matrix.Identity(4)
CAPE_VERTS = len(cape.data.vertices)
bpy.ops.object.select_all(action='DESELECT')
cape.select_set(True); body.select_set(True); bpy.context.view_layer.objects.active = body
bpy.ops.object.join()
body.name = 'KinsmokeBody'
assert sorted(m.name for m in body.data.materials) == ['KinsmokeBody', 'KinsmokeCape'], [m.name for m in body.data.materials]
deform = {g.index for g in body.vertex_groups if g.name in arm.data.bones and arm.data.bones[g.name].use_deform}
for v in body.data.vertices:
    gs = sorted((g for g in v.groups if g.group in deform and g.weight > 0), key=lambda g: -g.weight)
    keep = gs[:4]; kept = {g.group for g in keep}
    for gi in [g.group for g in v.groups if g.group not in kept]: body.vertex_groups[gi].remove([v.index])
    total = sum(g.weight for g in keep)
    if total > 0:
        for g in keep: body.vertex_groups[g.group].add([v.index], g.weight / total, 'REPLACE')
fbx = os.path.join(OUT, 'kinsmoke_caped_v2.fbx')
for o in bpy.data.objects: o.select_set(o in (arm, body))
bpy.ops.export_scene.fbx(filepath=fbx, use_selection=True, object_types={'ARMATURE', 'MESH'}, add_leaf_bones=False, bake_anim=False,
                         path_mode='COPY', embed_textures=True, mesh_smooth_type='FACE', use_armature_deform_only=False)
rig = {
    'character': 'Kinsmoke', 'version': 2,
    'heightUnits': 'all lengths are fractions of body height (feet to head top)',
    'columns': COLS, 'rows': ROWS, 'thetaMaxDeg': THETA_MAX, 'rowV': ROW_V,
    'rootParent': 'mixamorigSpine2', 'chains': names,
    'restBoneLengthOfHeight': [[round((chains[c][r + 1] - chains[c][r]).length / H, 4) for r in range(ROWS - 1)] for c in range(COLS)],
    'colliders': colliders,
    'cloth': {'swingOfChain': SWING},
    'fit': {'collarOfHeight': Z_TOP, 'shoulderLineOfHeight': Z_SHOULDER, 'hemOfHeight': [HEM_BACK, HEM_EDGE],
            'hemRadiusOfHeight': [R_HEM_BACK, R_HEM_SIDE, R_HEM_EDGE], 'aPoseDeg': A_POSE_DEG, 'gridPointsPushedByClearance': pushed,
            'grid': [NU, NV], 'capeVertices': CAPE_VERTS, 'normalsFlipped': flipped},
    'sources': {'body': os.path.basename(BODY_FBX), 'texture': os.path.basename(CAPE_TEX), 'cape': 'procedural (this script)'},
}
json.dump(rig, open(os.path.join(OUT, 'kinsmoke_cape_rig_v2.json'), 'w'), indent=1)
print('BUILT', fbx, 'H', round(H, 4), 'pushed', pushed, 'cape verts', CAPE_VERTS, 'bones', COLS * ROWS, 'flipped', flipped)
