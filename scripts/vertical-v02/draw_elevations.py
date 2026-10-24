"""True orthographic sections from the current Blender export and live-city boxes.
A section includes geometry intersecting its declared plane; projected neighbours
are deliberately excluded. These drawings do not certify physical traversal.
"""
from pathlib import Path
import json,hashlib,html
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';mp=R/'assets/city/vertical-v02/graybox/manifest.json';m=json.loads(mp.read_text());g=json.loads((D/'V02_Movement_Graph.json').read_text());w=json.loads((D/'V02_LiveWorld_Authoritative.json').read_text())
assert m['graphSHA256']==hashlib.sha256((D/'V02_Movement_Graph.json').read_bytes()).hexdigest()
for label,axis,plane,haxis,low,high in [('West_X55',0,55,2,190,450),('Transfer_X64',0,64,2,190,450),('Station_Z376',2,376,0,35,115)]:
 sx=1100/(high-low);sy=4.6
 def point(h,y):return 125+(h-low)*sx,795-y*sy
 def rectangle(q,color,opacity=1):
  x,y=point(q['min'][haxis],q['max'][1]);xx,yy=point(q['max'][haxis],q['min'][1]);return f'<rect x="{x:.3f}" y="{y:.3f}" width="{xx-x:.3f}" height="{yy-y:.3f}" fill="{color}" opacity="{opacity}"><title>{html.escape(json.dumps(q))}</title></rect>'
 out=['<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="950" viewBox="0 0 1400 950">','<defs><clipPath id="section"><rect x="125" y="105" width="1100" height="690"/></clipPath></defs>','<rect width="1400" height="950" fill="#081523"/>',f'<text x="55" y="45" fill="#d7efff" font-family="monospace" font-size="25">SAINT MERIDIAN V02 — SECTION {label.replace("_"," ")}</text>',f'<text x="55" y="75" fill="#e3ba79" font-family="monospace" font-size="15">EXACT SECTION PLANE {"X"if axis==0 else"Z"}={plane}m · LIVE CITY + EXPORTED BLENDER GRAYBOX</text>']
 for y in [0,24,52,84,92,100,128]:
  _,yy=point(low,y);out += [f'<path d="M125 {yy}H1225" stroke="#284053" stroke-width="1"/>',f'<text x="55" y="{yy+5}" fill="#a4c3d7" font-family="monospace" font-size="14">Y{y}</text>']
 out.append('<g clip-path="url(#section)">')
 for b in w['buildings']:
  for part in b['parts']:
   q=part['box']
   if q['min'][axis]<=plane<=q['max'][axis]:out.append(rectangle(q,'#344757',.5))
 for rec in m['records']:
  q=rec['box']
  if q['min'][axis]<=plane<=q['max'][axis]:out.append(rectangle(q,'#dfac62'if rec.get('stair')or rec.get('stairLanding')else'#46b8d0'if rec['walkable']else'#466779'))
 # Rail lines are projected only when their entire segment is within one metre of this plane.
 for e in g['edges']:
  if e['ability']!='threadrail':continue
  a=e['anchors']['a'];b=e['anchors']['b']
  if max(abs(a[axis]-plane),abs(b[axis]-plane))<=1:
   x,y=point(a[haxis],a[1]);xx,yy=point(b[haxis],b[1]);out.append(f'<path d="M{x} {y}L{xx} {yy}" fill="none" stroke="#c7a8ff" stroke-width="2" stroke-dasharray="6 4"><title>PROPOSED rail centerline; physical evidence reported separately</title></path>')
 out.append('</g>')
 for h in range(int(low)//10*10,int(high)+1,20 if axis==2 else 25):
  x,y=point(h,0);out.append(f'<text x="{x-15}" y="{y+25}" fill="#a4c3d7" font-family="monospace" font-size="13">{h}</text>')
 out += ['<text x="55" y="870" fill="#cee4ee" font-family="monospace" font-size="15">Cyan: walking surfaces · Amber: individual stairs and landings · Steel: supports · Grey: original compound city</text>','<text x="55" y="900" fill="#9ab9ca" font-family="monospace" font-size="14">Horizontal and vertical scales differ. Geometry outside the named plane is omitted. No implied vertical walk connections.</text>',f'<text x="55" y="925" fill="#9ab9ca" font-family="monospace" font-size="12">Manifest SHA256 {hashlib.sha256(mp.read_bytes()).hexdigest()}</text></svg>']
 (D/f'V02_Revised_Section_{label}.svg').write_text('\n'.join(out))
print('Wrote three exact source-aware elevation sections')
