"""Recover PE chained-unwind owning ranges; no target execution."""
import struct,json
from pathlib import Path
OUT=Path(__file__).resolve().parents[1]/'output/rea-forspoken';b=(OUT/'FORSPOKEN.exe').read_bytes();pe=struct.unpack_from('<I',b,60)[0];n=struct.unpack_from('<H',b,pe+6)[0];opt=struct.unpack_from('<H',b,pe+20)[0];ss=[struct.unpack_from('<8sIIIIIIHHI',b,pe+24+opt+i*40) for i in range(n)]
def off(r):
 s=next(s for s in ss if s[2]<=r<s[2]+s[3]);return s[4]+r-s[2]
p=next(s for s in ss if s[0].rstrip(b'\0')==b'.pdata');fs=[struct.unpack_from('<III',b,i) for i in range(p[4],p[4]+p[3]-11,12)];fs=[f for f in fs if 0<f[0]<f[1] and f[2]>0]
def root(f):
 seen=set()
 while True:
  if f in seen:raise ValueError('Unwind chain cycle')
  seen.add(f);h=off(f[2]);ver,pro,count,frame=struct.unpack_from('<4B',b,h)
  if not ((ver>>3)&4):return f
  f=struct.unpack_from('<III',b,h+4+((count+1)//2)*4)
targets=[0x51ac5f,0x51b28c,0x51c173,0x51c941,0x527a90];roots={root(next(f for f in fs if f[0]==t))[0] for t in targets};rows=[]
for r in sorted(roots):
 parts=[f for f in fs if root(f)[0]==r];rows.append({'root':hex(0x140000000+r),'fragments':[[hex(0x140000000+a),hex(0x140000000+c)] for a,c,u in parts]})
(OUT/'codec-unwind-groups.json').write_text(json.dumps(rows,indent=2));(OUT/'codec-unwind-groups.txt').write_text('\n'.join(' '.join([r['root']]+[x for pair in r['fragments'] for x in pair]) for r in rows)+'\n');print([(r['root'],len(r['fragments'])) for r in rows])
