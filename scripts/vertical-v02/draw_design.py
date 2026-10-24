from pathlib import Path
import json,html,hashlib
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02'
g=json.loads((D/'V02_Movement_Graph.json').read_text());w=json.loads((D/'V02_LiveWorld_Authoritative.json').read_text());m=json.loads((R/'assets/city/vertical-v02/graybox/manifest.json').read_text());assert m['graphSHA256']==hashlib.sha256((D/'V02_Movement_Graph.json').read_bytes()).hexdigest()
for y in [24,52,84,100,128]:
 out=['<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="950" viewBox="0 0 1400 950">','<defs><clipPath id="site"><rect x="140" y="110" width="1100" height="740"/></clipPath></defs>','<rect width="1400" height="950" fill="#081523"/>',f'<text x="55" y="48" font-family="monospace" font-size="25" fill="#d7efff">SAINT MERIDIAN V02 — FLOOR Y{y} m</text>','<text x="55" y="78" font-family="monospace" font-size="15" fill="#e3ba79">LIVE CITY REFERENCE + BLENDER GRAYBOX; ACCEPTANCE RECORDED SEPARATELY</text>']
 def xy(x,z):return(140+(x-10)*9,840-(z-185)*2.7)
 def rect(a,b,color,stroke='none',opacity=1):
  x,z=xy(a[0],b[2]);xx,zz=xy(b[0],a[2]);return f'<rect x="{x}" y="{z}" width="{xx-x}" height="{zz-z}" fill="{color}" stroke="{stroke}" opacity="{opacity}"/>'
 out.append('<g clip-path="url(#site)">')
 for b in w['buildings']:
  for p in b['parts']:
   q=p['box']
   if q['min'][1]<=y+2.5 and q['max'][1]>=y-.6:out.append(rect(q['min'],q['max'],'#273a4b','#3d5264',.5))
 for st in m['records']:
  if not st.get('walkable'):continue
  q=st['box']
  if abs(q['max'][1]-y)<.05:out.append(rect(q['min'],q['max'],'#195165','#49cee5',.8))
 for st in g['publicStairs']:
  if st['levels'][0]<=y<=st['levels'][-1]:
   a=[st['x']-4.6,y,st['z']-6];b=[st['x']+7.8,y,st['z']+6.5]
   out.append(rect(a,b,'#68522c','#edb568',.8));x,z=xy(st['x'],st['z']);out.append(f'<text x="{x-28}" y="{z}" fill="#fff" font-size="13">{st["id"]}</text>')
 for side,x in [('old east',105),('revised east',96)]:
  ax,az=xy(x,195);bx,bz=xy(x,440);out.append(f'<path d="M{ax} {az}L{bx} {bz}" fill="none" stroke="{"#d3686f"if x==105 else"#62f6d3"}" stroke-width="2" stroke-dasharray="6 5"/>')
 out.append('</g>')
 for z in range(200,451,50):
  x,yy=xy(10,z);out.append(f'<text x="70" y="{yy}" fill="#b4ccdc" font-family="monospace" font-size="14">Z{z}</text>')
 out.append('<text x="55" y="900" fill="#cee4ee" font-family="monospace" font-size="15">Cyan: Blender decks · Amber: public transfers · Grey: actual city parts at elevation · Red dashed: rejected east alignment</text><text x="55" y="925" fill="#9ab9ca" font-family="monospace" font-size="14">All coordinates are game metres. Exact staircase openings, train/traffic envelopes and input acceptance remain separate gates.</text></svg>')
 (D/f'V02_Revised_Floor_Y{y}.svg').write_text('\n'.join(out))
print('Wrote five revised source-aware floor sheets')
