"""Measure the playback speed of the Runner Action Animation Pack's promotion video against the converted clips.

The video (https://www.youtube.com/watch?v=59_yV7DdakM, "PromotionVideo Unity", 1920x1080, 60 fps) ends with
"Animation at a glance" grids: 7 x 2 cells, each looping one clip in place with its name above it. For each cell named
below, this finds the loop period (the first deep minimum of the frame-difference energy over lags, refined to a
sub-frame) and divides it by the clip's length in assets/loadout/runner/full/runner_full_index.json.
A ratio of 1.0 means the video plays the clip at its own 30 fps rate, which is the speed the game uses.

The video itself is not in the repo. Index it once with the eyes tool (`eyes index <url>`), which caches it as
~/.cache/eyes/youtube-59-yv7ddakm/video.mp4, or pass another path.
Usage: python3 -I scripts/characters/loadout/measure_runner_video_speed.py [video.mp4]
Writes development/characters/loadout/runner/video_speed.json. Needs ffmpeg and numpy."""
import json, os, subprocess, sys
import numpy as np

VIDEO = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser('~/.cache/eyes/youtube-59-yv7ddakm/video.mp4')
INDEX = 'assets/loadout/runner/full/runner_full_index.json'
OUT = 'development/characters/loadout/runner/video_speed.json'
# (grid start s, seconds to sample, row, column) -> clip. Labels as shown in the video; the clip is the pack clip that
# label names. Cells whose label maps to several clips are left out, and so are the three Idle cells: they barely move,
# so the frame-difference minimum lands on noise (0.2 s) rather than on the loop.
CELLS = {
    'Walk': (106.5, 10, 0, 0, 'Mvm_Walk'), 'Jog': (106.5, 10, 0, 1, 'Mvm_Jog'), 'Dash': (106.5, 10, 0, 2, 'Mvm_Dash'),
    'Boost': (106.5, 10, 0, 3, 'Mvm_Boost'), 'ChargeDash': (106.5, 10, 0, 4, 'Mvm_ChargeDash'),
    'ChargeBoost': (106.5, 10, 0, 5, 'Mvm_ChargeBoost'), 'BoostEnd': (106.5, 10, 1, 3, 'Mvm_BoostEnd'),
    'Dodge-Right': (125.5, 12, 0, 0, 'Esc_Dodge_Right'), 'Dodge-Left': (125.5, 12, 0, 1, 'Esc_Dodge_Left'),
    'Move-Right': (125.5, 12, 0, 2, 'Esc_Move_Right'), 'Move-Left': (125.5, 12, 0, 3, 'Esc_Move_Left'),
    'Slide-Right': (125.5, 12, 0, 4, 'Esc_Slide_Right'), 'Slide-Left': (125.5, 12, 0, 6, 'Esc_Slide_Left'),
    'Roll-Right': (125.5, 12, 1, 0, 'Esc_Roll_Right'), 'Roll-Back': (125.5, 12, 1, 1, 'Esc_Roll_Back'),
    'Roll-Left': (125.5, 12, 1, 2, 'Esc_Roll_Left'), 'Roll-Front': (125.5, 12, 1, 3, 'Esc_Roll_Front'),
    'Roll-JFront': (125.5, 12, 1, 4, 'Esc_Roll_JFront'),
}
W, H = 64, 108


def period(start, dur, row, col):
    # Grid geometry measured on the 1024x576 overview frames, scaled to 1920x1080.
    x = (12 + 143 * col) / 1024 * 1920; y = (14 if row == 0 else 256) / 576 * 1080; w = 141 / 1024 * 1920; h = 238 / 576 * 1080
    cmd = ['ffmpeg', '-v', 'error', '-ss', str(start), '-t', str(dur), '-i', VIDEO, '-vf',
           f'crop={w:.0f}:{h:.0f}:{x:.0f}:{y:.0f},scale={W}:{H},format=gray', '-f', 'rawvideo', '-']
    f = np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, np.uint8).reshape(-1, H * W).astype(np.float32)
    f -= f.mean(0)
    lags = np.arange(12, min(len(f) // 2, 300)); es = np.array([np.mean((f[l:] - f[:-l]) ** 2) for l in lags])
    thr = es.min() + .25 * (np.median(es) - es.min())
    c = [k for k in range(1, len(es) - 1) if es[k] < es[k - 1] and es[k] <= es[k + 1] and es[k] < thr]
    k = c[0] if c else int(es.argmin()); off = 0.
    if 0 < k < len(es) - 1:
        a, b, d = es[k - 1], es[k], es[k + 1]; den = a - 2 * b + d; off = .5 * (a - d) / den if den else 0.
    return (lags[k] + off) / 60, float(es[k] / np.median(es))


idx = json.load(open(INDEX))['clips']
rows = {}
for label, (start, dur, row, col, clip) in CELLS.items():
    p, depth = period(start, dur, row, col); d = idx[clip]['duration']
    # A one-shot clip looped in a cell may repeat after a whole number of clip lengths; report the nearest multiple.
    n = max(1, round(p / d)); rows[label] = {'clip': clip, 'clipDuration': d, 'videoPeriod': round(p, 4), 'cycles': n,
                                               'ratio': round(p / (n * d), 4), 'minimumDepth': round(depth, 3)}
    print(f'{label:12s} {clip:18s} clip {d:.4f}s video {p:.4f}s x{n} ratio {p / (n * d):.4f}')
ratios = [r['ratio'] for r in rows.values()]
out = {'video': 'https://www.youtube.com/watch?v=59_yV7DdakM', 'videoFile': os.path.basename(VIDEO), 'fps': 60, 'cells': rows,
       'ratio': {'min': min(ratios), 'max': max(ratios), 'mean': round(sum(ratios) / len(ratios), 4)},
       'method': 'loop period of each grid cell from frame-difference energy; ratio = period / (cycles x clip length)'}
os.makedirs(os.path.dirname(OUT), exist_ok=True); json.dump(out, open(OUT, 'w'), indent=1)
print('ratio min', out['ratio']['min'], 'max', out['ratio']['max'], 'mean', out['ratio']['mean'])
