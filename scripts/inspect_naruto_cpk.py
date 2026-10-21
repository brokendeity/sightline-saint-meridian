"""Read-only CPK metadata inventory; never materializes archive payloads."""
import struct,json,hashlib,re
from pathlib import Path
from collections import Counter
ROOT=Path('/Users/richardmpayi/Downloads/nar/NARUTO X BORUTO Ultimate Ninja STORM CONNECTIONS')
OUT=Path(__file__).resolve().parents[1]/'output/rea-naruto';OUT.mkdir(exist_ok=True)
def utf(b):
 assert b[:4]==b'@UTF','Not a plaintext UTF table'
 size,rows,strings,data,name,columns,width,count=struct.unpack_from('>IIII IHHI',b,4)
 assert size+8<=len(b) and count<1000000
 def text(offset):
  start=8+strings+offset;assert 0<=start<len(b);end=b.find(b'\0',start);return b[start:end].decode('utf-8','replace')
 fmts={0:'B',1:'b',2:'H',3:'h',4:'I',5:'i',6:'Q',7:'q',8:'f',9:'d',10:'I',11:'II'}
 def value(offset,t):
  fmt='>'+fmts[t];v=struct.unpack_from(fmt,b,offset);v=v[0] if len(v)==1 else list(v)
  if t==10:v=text(v)
  return v,struct.calcsize(fmt)
 col=[];offset=32
 for i in range(columns):
  flags=b[offset];key=text(struct.unpack_from('>I',b,offset+1)[0]);offset+=5;storage=flags&0xf0;t=flags&15
  v=0
  if storage==0x30:v,n=value(offset,t);offset+=n
  assert storage in [0x10,0x30,0x50],hex(storage)
  col.append((key,t,storage,v))
 result=[]
 for row in range(count):
  offset=8+rows+row*width;record={}
  for key,t,storage,v in col:
   if storage==0x50:v,n=value(offset,t);offset+=n
   record[key]=v
  result.append(record)
 return text(name),result
summary=[];members=[]
for p in sorted(ROOT.rglob('*.cpk')):
 with p.open('rb') as f:
  head=f.read(16);assert head[:4]==b'CPK '
  size=struct.unpack_from('<Q',head,8)[0];assert size<16*1024*1024
  raw=f.read(size);name,records=utf(raw);header=records[0];toc=header.get('TocOffset');content=header.get('ContentOffset');record={'archive':str(p.relative_to(ROOT)),'bytes':p.stat().st_size,'header_sha256':hashlib.sha256(head+raw).hexdigest(),'header':header,'toc_name':None,'member_count':0}
  if isinstance(toc,int) and toc and toc<p.stat().st_size:
   f.seek(toc);th=f.read(16);assert th[:4]==b'TOC ';ts=struct.unpack_from('<Q',th,8)[0];assert ts<64*1024*1024;traw=f.read(ts);tn,rows=utf(traw);record.update(toc_name=tn,toc_sha256=hashlib.sha256(th+traw).hexdigest(),member_count=len(rows));base=min(toc,content)
   for r in rows:
    offset=base+r['FileOffset'];length=r['FileSize'];assert offset>=0 and offset+length<=p.stat().st_size
    filename='/'.join(x for x in [r.get('DirName',''),r.get('FileName','')] if x)
    members.append({'archive':record['archive'],'path':filename,'offset':offset,'stored_bytes':length,'unpacked_bytes':r.get('ExtractSize'), 'id':r.get('ID')})
   record['extensions']=dict(Counter(Path(r.get('FileName','')).suffix.lower() for r in rows))
 summary.append(record)
(OUT/'cpk-headers.json').write_text(json.dumps(summary,indent=2));(OUT/'cpk-members.json').write_text(json.dumps(members,indent=2))
keys=re.compile('battle|command|combo|attack|cancel|camera|damage|guard|chakra|support|skill|param|motion|effect|input|collision|substitut',re.I)
interesting=[m for m in members if keys.search(m['path'])];(OUT/'cpk-feature-candidates.json').write_text(json.dumps(interesting,indent=2))
print(json.dumps({'archives':len(summary),'members':len(members),'feature_candidates':len(interesting),'extensions':dict(Counter(Path(m['path']).suffix.lower() for m in members)),'examples':interesting[:35]},indent=2))
