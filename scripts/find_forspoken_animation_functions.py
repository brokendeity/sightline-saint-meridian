"""RIP-relative LEA candidates cross-checked against PE exception ranges."""
import struct,json,bisect
from pathlib import Path
O=Path(__file__).resolve().parents[1]/'output/rea-forspoken';b=(O/'FORSPOKEN.exe').read_bytes();pe=struct.unpack_from('<I',b,60)[0];n=struct.unpack_from('<H',b,pe+6)[0];opt=struct.unpack_from('<H',b,pe+20)[0];base=struct.unpack_from('<Q',b,pe+48)[0];sections=[struct.unpack_from('<8sIIIIIIHHI',b,pe+24+opt+i*40) for i in range(n)]
def va(off):
 s=next(s for s in sections if s[4]<=off<s[4]+s[3]);return base+s[2]+off-s[4]
pd=next(s for s in sections if s[0].rstrip(b'\0')==b'.pdata');ranges=[struct.unpack_from('<III',b,i)[:2] for i in range(pd[4],pd[4]+pd[3]-11,12)];ranges=[(a,c) for a,c in ranges if a<c];ranges.sort();starts=[a for a,c in ranges]
strings=json.loads((O/'animation-decoder-strings.json').read_text());targets={va(e['offset']):e['text'] for e in strings if any(x in e['text'] for x in ['LmAnimModelTypeInfo.cpp','Anim bone table','Anim bone tabel'])}
s=next(s for s in sections if s[0].rstrip(b'\0')==b'.text');rows=[]
for i in range(s[4],s[4]+s[3]-7):
 if b[i] in (0x48,0x4c) and b[i+1]==0x8d and b[i+2]&0xc7==5:
  ref=va(i);target=ref+7+struct.unpack_from('<i',b,i+3)[0]
  if target in targets:
   j=bisect.bisect_right(starts,ref-base)-1;f=ranges[j] if j>=0 and ref-base<ranges[j][1] else None
   rows.append({'reference':hex(ref),'target':hex(target),'string':targets[target],'function':hex(base+f[0]) if f else None,'end':hex(base+f[1]) if f else None})
(O/'animation-function-candidates.json').write_text(json.dumps(rows,indent=2));fs=sorted({r['function'] for r in rows if r['function']});(O/'animation-functions.txt').write_text('\n'.join(fs)+'\n');print(json.dumps(rows,indent=2))
