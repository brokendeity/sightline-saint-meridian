"""Paint Kinsmoke's v2 cape texture (procedural, no external art): mottled moss-green cloth with rust and verdigris patches,
braided gold borders, a brass patch and a rope-braid strip. The UV layout is the one blender_build_kinsmoke_cape_v2.py
writes (image x = u, image y = v, both from the top-left):
  u in [0, CLOTH_U]  cloth; u is the distance (along the row) from the nearest front edge / U_SCALE body heights, so the
                     front-edge band is u < EDGE_U on both wings, and the cloth is mirror-symmetric about the centre back
  v in [0, 1]        top (collar) to hem; top band v < TOP_V, hem band v > HEM_V
  u in [ROPE_U0, 1], v in [0, ROPE_V1]   rope braid running along v (the collar ring)
  u in [ROPE_U0, 1], v in [BRASS_V0, 1]  brass (the clasps)
Usage: python3 make_kinsmoke_cape_texture.py <out.png>"""
import sys, math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SIZE = 2048
CLOTH_U, EDGE_U, TOP_V, HEM_V = 0.94, 0.034, 0.026, 0.948
ROPE_U0, ROPE_V1, BRASS_V0 = 0.952, 0.88, 0.90
rng = np.random.default_rng(7)

def field(scale, seed):
    r = np.random.default_rng(seed).random((max(2, SIZE // scale), max(2, SIZE // scale)))
    im = Image.fromarray((r * 255).astype(np.uint8)).resize((SIZE, SIZE), Image.BICUBIC).filter(ImageFilter.GaussianBlur(scale / 3))
    a = np.asarray(im).astype(np.float32) / 255.0
    return (a - a.min()) / max(1e-6, a.max() - a.min())

# ---- cloth: moss green, mottled with rust and verdigris, a little vertical grain ----
n1, n2, n3, n4 = field(160, 1), field(48, 2), field(12, 3), field(96, 4)
base = np.array([30, 60, 38], np.float32); light = np.array([48, 96, 58], np.float32)
rust = np.array([92, 64, 32], np.float32); teal = np.array([38, 92, 80], np.float32); deep = np.array([14, 30, 20], np.float32)
m = 0.55 * n1 + 0.3 * n2 + 0.15 * n3
img = base[None, None] * (1 - m[..., None]) + light[None, None] * m[..., None]
rmask = np.clip((n4 - 0.62) * 4.0, 0, 1) * (0.6 + 0.4 * n3)
img = img * (1 - rmask[..., None] * 0.7) + rust[None, None] * rmask[..., None] * 0.7
tmask = np.clip((n2 - 0.7) * 4.0, 0, 1) * np.clip((0.5 - n4) * 3, 0, 1)
img = img * (1 - tmask[..., None] * 0.6) + teal[None, None] * tmask[..., None] * 0.6
grain = field(6, 9)
gx = np.clip(np.asarray(Image.fromarray((grain * 255).astype(np.uint8)).resize((SIZE // 16, SIZE)).resize((SIZE, SIZE))) / 255.0, 0, 1)
img = img * (0.88 + 0.12 * gx[..., None])
dmask = np.clip((0.25 - n1) * 3, 0, 1)
img = img * (1 - dmask[..., None] * 0.5) + deep[None, None] * dmask[..., None] * 0.5
img = img * 0.82   # deep green, as the reference
out = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))

# ---- braid strip (drawn horizontally, then pasted along each band) ----
GOLD, GOLD_HI, GOLD_LO, INK = (176, 138, 64), (222, 186, 104), (112, 82, 34), (38, 26, 12)
def braid(length, width):
    s = Image.new('RGB', (length, width), GOLD_LO); d = ImageDraw.Draw(s)
    P = width * 1.7; amp = width * 0.30; th = width * 0.26; segs = []
    for k in range(3):
        ph = 2 * math.pi * k / 3; x = -P
        while x < length + P:
            x2 = x + 3
            a, b = 2 * math.pi * x / P + ph, 2 * math.pi * x2 / P + ph
            segs.append((math.cos(a), (x, width / 2 + amp * math.sin(a)), (x2, width / 2 + amp * math.sin(b))))
            x = x2
    segs.sort(key=lambda t: t[0])
    for depth, p, q in segs:
        d.line([p, q], fill=INK, width=int(th + 4))
    for depth, p, q in segs:
        c = GOLD_HI if depth > 0.5 else GOLD if depth > -0.3 else GOLD_LO
        d.line([p, q], fill=c, width=int(th))
    d.line([(0, 1), (length, 1)], fill=INK, width=3); d.line([(0, width - 2), (length, width - 2)], fill=INK, width=3)
    d.line([(0, 4), (length, 4)], fill=GOLD, width=2); d.line([(0, width - 5), (length, width - 5)], fill=GOLD, width=2)
    return s

W = SIZE
ew = int(EDGE_U * W); tw = int(TOP_V * W); hw = int((1 - HEM_V) * W); cu = int(CLOTH_U * W)
out.paste(braid(cu, hw), (0, W - hw))                       # hem
out.paste(braid(cu, tw), (0, 0))                            # top
out.paste(braid(W, ew).rotate(90, expand=True), (0, 0))     # front edges (both wings share u < EDGE_U)
ru0 = int(ROPE_U0 * W)
rope = braid(int(ROPE_V1 * W), W - ru0).rotate(90, expand=True)
out.paste(rope, (ru0, 0))
brass = Image.new('RGB', (W - ru0, W - int(BRASS_V0 * W)), (150, 112, 46)); bd = ImageDraw.Draw(brass)
for i in range(brass.size[1]):
    t = i / max(1, brass.size[1] - 1); c = tuple(int(a * (1 - t) + b * t) for a, b in zip((206, 164, 80), (120, 86, 34)))
    bd.line([(0, i), (brass.size[0], i)], fill=c)
out.paste(brass, (ru0, int(BRASS_V0 * W)))
out.save(sys.argv[1])
print('TEXTURE', sys.argv[1], out.size)
