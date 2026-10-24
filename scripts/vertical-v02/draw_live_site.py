from pathlib import Path
import json,html
D=Path(__file__).resolve().parents[2]/'development/vertical-city-v02';w=json.loads((D/'V02_LiveWorld_Authoritative.json').read_text())
# Orthographic X/Z diagnostic drawing, not a construction-certified plan.
x=lambda a:80+(a+40)*3;z=lambda a:940-(a-160)*2.5
s=['<svg xmlns="http://www.w3.org/2000/svg" width="1150" height="1030" viewBox="0 0 1150 1030"><rect width="1150" height="1030" fill="#081723"/><g font-family="sans-serif" fill="#d1eff9"><text x="55" y="45" font-size="24">Saint Meridian V02 — live spatial baseline, Y52</text><text x="55" y="73" font-size="15">Actual compound structures + proposed offsets. Routes are NOT gameplay validated.</text>']
for b in w['buildings']:
 e=b['visualWorldBounds'];lo=e['min'];hi=e['max']
 if hi[0]<-40 or lo[0]>210 or hi[2]<160 or lo[2]>480:continue
 ps=' '.join(f'{x(a):.2f},{z(c):.2f}'for a,c in b['projectedHullXZ'])
 s.append(f'<polygon points="{ps}" fill="#122c3c" stroke="#386071" stroke-width="1"/>')
 for p in b['parts']:
  lo=p['box']['min'];hi=p['box']['max']
  if lo[1]<=54.2 and hi[1]>=51.4:s.append(f'<rect x="{x(lo[0]):.2f}" y="{z(hi[2]):.2f}" width="{(hi[0]-lo[0])*3:.2f}" height="{(hi[2]-lo[2])*2.5:.2f}" fill="#365061" fill-opacity=".6"/>')
 c=[(e['min'][i]+e['max'][i])/2 for i in range(3)];s.append(f'<text x="{x(c[0]):.2f}" y="{z(c[2]):.2f}" font-size="12">{html.escape(b["id"])}</text>')
for X in [55,105]:s.append(f'<path d="M{x(X)},{z(210)} L{x(X)},{z(430)}" stroke="#91d1e5" stroke-width="6" stroke-dasharray="8 7" fill="none"/>')
for Z,col,label in [(280,'#ff5966','Original crossing Z280: structural conflict'),(276,'#71e6ac','Offset Z276: box-clear candidate only')]:
 s.append(f'<path d="M{x(55)},{z(Z)} L{x(105)},{z(Z)}" stroke="{col}" stroke-width="5"/><text x="790" y="{z(Z)+(-18 if Z==280 else 20)}" font-size="14" fill="{col}">{label}</text>')
for Z in [210,350,430]:s.append(f'<text x="45" y="{z(Z)}" font-size="14">Z{Z}</text>')
s+=['<text x="790" y="180" font-size="16">Legend</text><text x="790" y="210" font-size="13">Dark outline: live projected mesh hull</text><text x="790" y="235" font-size="13">Gray: compound structures at this height</text><text x="790" y="260" font-size="13">Dashed: proposed circulation centerline</text><text x="790" y="285" font-size="13">Clearance is not support or route proof.</text><text x="60" y="995" font-size="14">Live lot/part IDs retained. No original buildings moved. Meters, game +Y up.</text></g></svg>']
(D/'V02_SourceVerified_Site_Plan.svg').write_text('\n'.join(s))
