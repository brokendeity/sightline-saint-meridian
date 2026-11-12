"""Pixel statistics for the stylized atmosphere before/after captures (same cameras, same pinned sky clock).
Writes development/vertical-city-v02/evidence/stylized-atmosphere/compare.json and side-by-side PNGs.
'after-all-off' (?stylized=0) checks that the module is visually neutral when switched off; moving pedestrians, trains and
aircraft still differ slightly between runs, which the changed-pixel fraction shows.
Usage: python3 -I compare_stylized_atmosphere_views.py"""
from pathlib import Path
import json
import numpy as np
from PIL import Image, ImageDraw
E=Path(__file__).resolve().parents[2]/'development/vertical-city-v02/evidence/stylized-atmosphere'
views=[c['id'] for c in json.loads((E/'before/captures.json').read_text())['captures']]
L=np.array([.2126,.7152,.0722])
def load(p):return np.asarray(Image.open(p).convert('RGB'),dtype=np.float32)/255
def stats(a):return{'meanRGB':[round(float(x),4) for x in a.reshape(-1,3).mean(0)],'meanLuma':round(float((a@L).mean()),4),'p95Luma':round(float(np.percentile(a@L,95)),4)}
report={'scope':'Inspection-camera pixel statistics; not gameplay or performance evidence.','pairs':{}}
for other in ['after','after-all-off']:
 rows={}
 for v in views:
  a,b=load(E/'before'/f'{v}.png'),load(E/other/f'{v}.png');d=np.abs(a-b).max(2)
  rows[v]={'before':stats(a),'after':stats(b),'meanAbsDiff':round(float(np.abs(a-b).mean()),4),'changedOver4pct':round(float((d>.04).mean()),4),'changedOver10pct':round(float((d>.10).mean()),4)}
  if other=='after':
   w,h=800,500;im=Image.new('RGB',(w*2+6,h+20),(16,16,16));im.paste(Image.open(E/'before'/f'{v}.png').resize((w,h)),(0,20));im.paste(Image.open(E/other/f'{v}.png').resize((w,h)),(w+6,20))
   dr=ImageDraw.Draw(im);dr.text((6,4),'BEFORE  V02_LOADOUT_RUNNER_NO_AFTERSTEP  '+v,fill=(235,235,235));dr.text((w+12,4),'AFTER  V02_STYLIZED_ATMOSPHERE  '+v,fill=(235,235,235));im.save(E/f'pair-{v}.png')
 report['pairs'][other]=rows
(E/'compare.json').write_text(json.dumps(report,indent=1)+'\n')
for other,rows in report['pairs'].items():
 print(other);[print(f"  {v:12s} luma {r['before']['meanLuma']:.4f}->{r['after']['meanLuma']:.4f}  meanAbsDiff {r['meanAbsDiff']:.4f}  changed>4% {r['changedOver4pct']:.3f}  >10% {r['changedOver10pct']:.3f}") for v,r in rows.items()]
