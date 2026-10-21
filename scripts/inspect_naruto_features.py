"""Read-only feature evidence; parameter payloads decoded in memory only."""
import json,struct,re,hashlib
from pathlib import Path
ROOT=Path('/Users/richardmpayi/Downloads/nar/NARUTO X BORUTO Ultimate Ninja STORM CONNECTIONS')
OUT=Path(__file__).resolve().parents[1]/'output/rea-naruto'
def decompress(b):
 if b[:8]!=b'CRILAYLA':return b
 size,packed=struct.unpack_from('<II',b,8);assert size<16*1024*1024 and packed+272<=len(b)
 result=bytearray(size+256);result[:256]=b[16+packed:16+packed+256];pos=size+255;offset=15+packed;pool=bits=0
 def get(n):
  nonlocal offset,pool,bits
  while bits<n:
   assert offset>=16
   pool=(pool<<8)|b[offset];offset-=1;bits+=8
  bits-=n;v=(pool>>bits)&((1<<n)-1);pool&=(1<<bits)-1;return v
 while pos>=256:
  if get(1)==0:result[pos]=get(8);pos-=1
  else:
   distance=get(13)+3;length=3
   for n in [2,3,5,8]:
    v=get(n);length+=v
    if v!=(1<<n)-1:break
   else:
    while True:
     v=get(8);length+=v
     if v!=255:break
   assert pos+distance<len(result) and pos-length+1>=256
   for _ in range(length):result[pos]=result[pos+distance];pos-=1
 return bytes(result)
def strings(b):return [{'offset':m.start(),'text':m.group().decode('ascii')} for m in re.finditer(rb'[ -~]{5,}',b)]
ms=json.load(open(OUT/'cpk-members.json'));selected=[m for m in ms if m['path'].startswith('data/spc/') and m['stored_bytes']<200000 and ('Param' in m['path'] or 'param' in m['path'] or 'camera' in m['path'].lower())]
selected+=[m for m in ms if m['path']=='data/rpg/battleParam.xfbin']
records=[]
for m in selected:
 with (ROOT/m['archive']).open('rb') as f:f.seek(m['offset']);b=f.read(m['stored_bytes'])
 r={**m,'stored_sha256':hashlib.sha256(b).hexdigest(),'compression_magic':b[:8].hex()}
 try:
  payload=decompress(b);assert len(payload)==m['unpacked_bytes'];assert payload[:4]==b'NUCC'
  r.update(decoded_bytes=len(payload),decoded_sha256=hashlib.sha256(payload).hexdigest(),decoded_magic='NUCC',strings=strings(payload))
 except Exception as e:r['error']=str(e) or type(e).__name__
 records.append(r)
(OUT/'parameter-evidence.json').write_text(json.dumps(records,indent=2))
b=(ROOT/'NSUNSC.exe').read_bytes();pe=struct.unpack_from('<I',b,60)[0];machine,n=struct.unpack_from('<HH',b,pe+4);op=pe+24;opsize=struct.unpack_from('<H',b,pe+20)[0];sections=[]
for i in range(n):
 o=op+opsize+i*40;name=b[o:o+8].split(b'\0')[0].decode();vs,va,rs,rp=struct.unpack_from('<IIII',b,o+8);sections.append({'name':name,'virtual_size':vs,'rva':va,'raw_size':rs,'offset':rp,'entropy':None})
def loc(rva):
 for s in sections:
  if s['rva']<=rva<s['rva']+s['raw_size']:return s['offset']+rva-s['rva']
 raise ValueError(hex(rva))
imports=[];rva=struct.unpack_from('<I',b,op+112+8)[0]
if rva:
 off=loc(rva)
 for i in range(1000):
  desc=struct.unpack_from('<IIIII',b,off+i*20)
  if not any(desc):break
  no=loc(desc[3]);imports.append(b[no:b.index(b'\0',no)].decode('ascii','replace'))
patterns={'combat':r'combo|attack|guard|chakra|hitstop|hit_stop|cancel|substitution|knockback|knock_back|duel|support','camera':r'camera|lockon|lock_on','animation':r'animation|motion|blend','rendering':r'celshade|outline|toon|rimlight|shadow|posteffect|bloom|ssao'}
found={};allstrings=strings(b)
for category,p in patterns.items():found[category]=[x for x in allstrings if re.search(p,x['text'],re.I) and len(x['text'])<220][:250]
exe={'sha256':hashlib.sha256(b).hexdigest(),'machine':hex(machine),'sections':sections,'imports':imports,'strings_total':len(allstrings),'bounded_feature_strings':found,'limitations':'String matches are candidates, not executed behavior, function boundaries, timing or formulas.'}
(OUT/'executable-feature-evidence.json').write_text(json.dumps(exe,indent=2))
print('Decoded parameter containers',sum('decoded_magic' in r for r in records),'/',len(records))
for r in records:print(r['path'],r.get('decoded_magic',r.get('error')),len(r.get('strings',[])))
print('Imports',imports)
for k,v in found.items():print(k,[(hex(x['offset']),x['text']) for x in v[:15]])
