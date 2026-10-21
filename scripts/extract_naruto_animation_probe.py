"""Bounded local extraction probe; source game is read-only. Decode per reviewed FastCPK source."""
import json,struct,hashlib,sys
from pathlib import Path
ROOT=Path('/Users/richardmpayi/Downloads/nar/NARUTO X BORUTO Ultimate Ninja STORM CONNECTIONS')
OUT=Path(__file__).resolve().parents[1]/'output/rea-naruto/animation-pass'
def decode(b):
 b=bytearray(b);x,y,z,w=0x154f048d,0x02b3d1cd,0x43a3d2f9,0x617e9602
 for i in range(0,len(b),4):
  t=(x^((x<<11)&0xffffffff));t^=t>>8;n=w^(w>>19)^t
  for j,v in enumerate(n.to_bytes(4,'little')):
   if i+j<len(b):b[i+j]^=v
  x,y,z,w=y,z,w,n
 if b[:8]!=b'CRILAYLA':return bytes(b)
 n,h=struct.unpack_from('<II',b,8);assert n<64*1024*1024 and h+272<=len(b)
 out=bytearray(n+256);out[:256]=b[h+16:h+272];pos=len(b)-257;pool=left=0
 def bits(k):
  nonlocal pos,pool,left
  v=0
  while k:
   if not left:assert pos>=16;pool=b[pos];pos-=1;left=8
   take=min(left,k);v=(v<<take)|((pool>>(left-take))&((1<<take)-1));left-=take;k-=take
  return v
 written=0;end=len(out)-1
 while written<n:
  if bits(1):
   src=end-written+bits(13)+3;length=3
   for count in [2,3,5,8]:
    part=bits(count);length+=part
    if part!=(1<<count)-1:break
   else:
    while True:
     part=bits(8);length+=part
     if part!=255:break
   for j in range(min(length,n-written)):
    assert 0<=src<len(out);out[end-written]=out[src];src-=1;written+=1
  else:out[end-written]=bits(8);written+=1
 return bytes(out)
if __name__=='__main__':
 members=json.loads((OUT.parent/'cpk-members.json').read_text());selected=[m for m in members if m['path'] in ['data/spc/1nrtbod1.xfbin','data/spc/1nrtbod1c.xfbin','data/spc/1nrtbod1l.xfbin','data/spc/1nrtbod1s.xfbin']];rows=[]
 for m in selected:
  with (ROOT/m['archive']).open('rb') as f:f.seek(m['offset']);raw=f.read(m['stored_bytes'])
  b=decode(raw);assert len(b)==m['unpacked_bytes'];assert b[:4]==b'NUCC';p=OUT/Path(m['path']).name;p.write_bytes(b);rows.append(dict(m,decoded_sha256=hashlib.sha256(b).hexdigest(),magic=b[:4].decode(),output=str(p)))
 (OUT/'extraction-evidence.json').write_text(json.dumps(rows,indent=2));print(json.dumps(rows,indent=2))
