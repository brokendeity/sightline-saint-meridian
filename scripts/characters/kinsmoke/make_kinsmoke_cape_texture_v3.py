"""Kinsmoke cape v3 texture, made only from the ORIGINAL Tripo cape's own art (its 4096 px atlas,
assets/characters/kinsmoke/source/70b3c4f4-.../*.fbm/tripo_rgb_*.jpg), laid out for the v2/v3 cape UVs:
  - cloth: the atlas's mottled green/moss cloth, re-synthesised over the whole sheet by quilting trim-free patches with
    feathered seams (the atlas is a fragmented bake, so its pieces cannot be used in place);
  - border: the atlas's Celtic knotwork band (the cleanest straight piece, atlas px 1052..1325 x 488..588) made seamless
    by cross-fading its ends, tinted toward bronze-gold, and laid WIDE along the front edges and the hem (and a thin
    strip along the top under the collar); the collar ring uses the same knotwork; a brass patch for the clasps.
UV layout (image x = u, image y = v, from the top-left), shared with blender_build_kinsmoke_cape_v3.py:
  u in [0, CLOTH_U] cloth, u = distance from the nearest front edge / U_SCALE (1.45 body heights); edge band u < EDGE_U
  v in [0, 1] top to hem; top band v < TOP_V; hem band v > HEM_V
  u in [ROPE_U0, 1], v < ROPE_V1: collar ring knotwork;  v > BRASS_V0: brass
Usage: python3 make_kinsmoke_cape_texture_v3.py <tripo cape atlas.jpg> <out.png>"""
import sys, math
import numpy as np
from PIL import Image, ImageFilter

ATLAS, OUT = sys.argv[1], sys.argv[2]
SIZE = 2048
CLOTH_U, EDGE_U, TOP_V, HEM_V = 0.935, 0.045, 0.022, 0.905
U_SCALE, V_LEN = 1.45, 0.62      # body heights per unit u; typical column length (v runs 0..1 down each column)
ASP = (1.0 / V_LEN) / (1.0 / U_SCALE)   # texture px per metre along v / along u: content is pre-squashed by this
ROPE_U0, ROPE_V1, BRASS_V0 = 0.952, 0.88, 0.90
BRAID_BOX = (1052, 488, 1325, 588)
rng = np.random.default_rng(11)
atlas = Image.open(ATLAS).convert('RGB')
A = np.asarray(atlas).astype(np.float32)

# ---- cloth: pick trim-free, not-black patches of the atlas and quilt them ----
P = 160
lum = A.mean(2); sat = A.max(2) - A.min(2)
trim = (lum > 90) & (sat < 40)                      # the beige knotwork / bone-coloured pieces
tan = (A[..., 0] >= A[..., 1] - 3) & (lum > 42)    # tan / bone fragments of trim (red at least as strong as green)
cands = []
for y in range(0, A.shape[0] - P, 32):
    for x in range(0, A.shape[1] - P, 32):
        t = trim[y:y + P, x:x + P].mean(); l = lum[y:y + P, x:x + P]
        g = A[y:y + P, x:x + P, 1].mean() - A[y:y + P, x:x + P, 0].mean()
        tn = tan[y:y + P, x:x + P].mean()
        if t < 0.002 and tn < 0.01 and l.mean() > 26 and (l < 10).mean() < 0.02 and g > 6: cands.append((x, y))
print('cloth patches', len(cands))
assert len(cands) > 20, 'not enough clean cloth patches in the atlas'
target = np.mean([A[y:y + P, x:x + P].reshape(-1, 3).mean(0) for x, y in cands], axis=0)
w1 = np.sin(np.linspace(0, math.pi, P))[:, None] * np.sin(np.linspace(0, math.pi, P))[None, :]
acc = np.zeros((SIZE + 2 * P, SIZE + 2 * P, 3), np.float32); wsum = np.zeros((SIZE + 2 * P, SIZE + 2 * P, 1), np.float32)
STEP = P // 2
for yy in range(-STEP, SIZE, STEP):
    for xx in range(-STEP, SIZE, STEP):
        x, y = cands[rng.integers(len(cands))]
        patch = A[y:y + P, x:x + P].copy()
        if rng.random() < 0.5: patch = patch[:, ::-1]
        patch = patch + (target - patch.reshape(-1, 3).mean(0)) * 0.6     # even out patch-to-patch brightness
        y0, x0 = yy + STEP, xx + STEP
        acc[y0:y0 + P, x0:x0 + P] += patch * w1[..., None]; wsum[y0:y0 + P, x0:x0 + P] += w1[..., None]
cloth = (acc / np.maximum(wsum, 1e-6))[STEP:STEP + SIZE, STEP:STEP + SIZE]
# isotropic on the cape: keep a SIZE x SIZE/ASP piece and stretch it along v (the cape stretches u by ASP relative to v)
out = Image.fromarray(np.clip(cloth, 0, 255).astype(np.uint8)).crop((0, 0, SIZE, int(SIZE / ASP))).resize((SIZE, SIZE), Image.BICUBIC)

# ---- knotwork strip: seamless, bronze-gold ----
strip = np.asarray(atlas.crop(BRAID_BOX)).astype(np.float32)
L = strip.shape[1]; F = 70
loop = strip[:, :L - F].copy()
t = np.linspace(0, 1, F)[None, :, None]
loop[:, :F] = strip[:, L - F:] * (1 - t) + strip[:, :F] * t            # last F px fade into the first F px
gold = np.array([1.28, 1.05, 0.6], np.float32)
l2 = loop.mean(2, keepdims=True)
loop = np.clip((loop - l2) * 1.1 + l2, 0, 255) * gold
loop = np.clip((loop - 128) * 1.25 + 128 + 14, 0, 255)                   # more contrast, brighter bronze-gold (reads in the night lighting)
knot = Image.fromarray(loop.astype(np.uint8))
def band(length, width, stretch=1.0):
    # stretch: repeat length factor that undoes the cape's u/v density difference for this band's direction
    k = knot.resize((max(8, int(knot.width * width / knot.height * stretch)), width), Image.LANCZOS)
    s = Image.new('RGB', (length, width))
    for x in range(0, length, k.width): s.paste(k, (x, 0))
    edge = Image.new('RGB', (length, max(2, width // 28)), (34, 24, 10))
    s.paste(edge, (0, 0)); s.paste(edge, (0, width - edge.height))
    return s
W = SIZE
ew, tw, hw, cu = int(EDGE_U * W), int(TOP_V * W), int((1 - HEM_V) * W), int(CLOTH_U * W)
out.paste(band(cu, hw, 1 / ASP), (0, W - hw))                              # hem (runs along u)
out.paste(band(cu, tw, 1 / ASP), (0, 0))                                   # top (under the collar)
out.paste(band(W, ew, ASP).rotate(90, expand=True), (0, 0))                # front edges (run along v; u < EDGE_U on both wings)
ru0 = int(ROPE_U0 * W)
out.paste(band(int(ROPE_V1 * W), W - ru0).rotate(90, expand=True), (ru0, 0))
brass = np.zeros((W - int(BRASS_V0 * W), W - ru0, 3), np.float32)
for i in range(brass.shape[0]):
    k = i / max(1, brass.shape[0] - 1); brass[i] = np.array([206, 164, 80]) * (1 - k) + np.array([120, 86, 34]) * k
out.paste(Image.fromarray(brass.astype(np.uint8)), (ru0, int(BRASS_V0 * W)))
out.save(OUT)
print('TEXTURE', OUT, out.size, 'cloth mean', [round(v) for v in np.asarray(out).reshape(-1, 3).mean(0)])
