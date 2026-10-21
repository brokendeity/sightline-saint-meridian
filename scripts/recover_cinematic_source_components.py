"""Read-only bounded recovery of Minato action rows and installed DX11 bytecode.
No original executable is run; behavior and shader translations remain unverified.
"""
import hashlib,json,struct
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
GAME=Path('/Users/richardmpayi/Downloads/nar/NARUTO X BORUTO Ultimate Ninja STORM CONNECTIONS')
OUT=ROOT/'assets/nsunsc-library'
def sha(b):return hashlib.sha256(b).hexdigest()
def string(b,o,end=None):
 end=len(b) if end is None else end
 if not 0<=o<end<=len(b):raise ValueError('string bounds')
 z=b.find(b'\0',o,end)
 if z<0:raise ValueError('unterminated string')
 return b[o:z].decode('ascii')
def dxbc(b,o):
 if o+32>len(b) or b[o:o+4]!=b'DXBC':raise ValueError('DXBC header')
 size,n=struct.unpack_from('<II',b,o+24)
 if size<32+4*n or o+size>len(b) or n>128:raise ValueError('DXBC length')
 chunks=[]
 for i in range(n):
  rel=struct.unpack_from('<I',b,o+32+4*i)[0]
  if rel<32+4*n or rel+8>size:raise ValueError('chunk offset')
  tag=b[o+rel:o+rel+4].decode('ascii');length=struct.unpack_from('<I',b,o+rel+4)[0]
  if rel+8+length>size:raise ValueError('chunk length')
  row=dict(tag=tag,offset=rel,bytes=length)
  body=b[o+rel+8:o+rel+8+length]
  if tag in ('SHDR','SHEX'):
   if len(body)<8:raise ValueError('program header')
   token,words=struct.unpack_from('<II',body)
   if words*4!=len(body):raise ValueError('program length')
   row['program']=dict(type=token>>16,major=(token>>4)&15,minor=token&15)
  if tag=='RDEF':
   if len(body)<28:raise ValueError('reflection header')
   cb,co,resources,ro=struct.unpack_from('<IIII',body)
   if co+cb*24>len(body) or ro+resources*32>len(body):raise ValueError('reflection bounds')
   row['constantBuffers']=[dict(name=string(body,struct.unpack_from('<I',body,co+j*24)[0]),bytes=struct.unpack_from('<I',body,co+j*24+12)[0]) for j in range(cb)]
   row['resources']=[]
   for j in range(resources):
    v=struct.unpack_from('<8I',body,ro+j*32);row['resources'].append(dict(name=string(body,v[0]),type=v[1],bindPoint=v[5],bindCount=v[6]))
  chunks.append(row)
 return size,chunks

def action_rows(b):
 if len(b)<68 or struct.unpack_from('>I',b)[0]!=len(b)-4 or b[4:12]!=b'ver0.000':raise ValueError('action header')
 count=struct.unpack_from('<I',b,52)[0];o=68;rows=[]
 if count!=7:raise ValueError('not the validated Minato table')
 for _ in range(count):
  if o+212>len(b):raise ValueError('row header bounds')
  row=dict(offset=o,action=string(b,o,o+32),timeline=string(b,o+32,o+64),headerHex=b[o:o+212].hex(),commands=[])
  n=struct.unpack_from('<I',b,o+80)[0];o+=212
  if n>1000:raise ValueError('command count')
  for j in range(n):
   if o+64>len(b):raise ValueError('command bounds')
   name=string(b,o,o+32);frame,opcode=struct.unpack_from('<HH',b,o+32)
   c=dict(offset=o,name=name,sourceFrame=frame,opcode=opcode,rawHex=b[o:o+64].hex());o+=64
   extension=opcode in (0x8a,0x8b) or (opcode==0x83 and b[o:o+11].startswith(b'SPSKILL_END')) or (0xa0<=opcode<=0xa6 and b[o:o+7].startswith(b'SKL_ATK'))
   if extension:
    if o+96>len(b):raise ValueError('extension bounds')
    c['extensionHex']=b[o:o+96].hex();c['extensionName']=string(b,o,o+96);o+=96
   row['commands'].append(c)
  rows.append(row)
 if o!=len(b):raise ValueError('unparsed action bytes')
 return rows

def build():
 p=OUT/'64b73d61b3185c10fe96/raw-f1e4ea0dd7502340e08326dca096fc338fb543e85d863c98a35282cf3b72d985.bin';b=p.read_bytes()
 evidence=[]
 for address in ['140a5dbb0','140a50a30','140a23250','140a26c50','140a240a0','140a26850']:
  f=ROOT/'output/rea-naruto/ghidra/full-export/main/functions'/address[:6]/(address+'.c')
  evidence.append(dict(path=str(f.relative_to(ROOT)),sha256=sha(f.read_bytes())))
 result=dict(schemaVersion=1,id='source:3mnt-action-bindings',sourcePath=str(p.relative_to(ROOT)),sha256=sha(b),rows=action_rows(b),evidence=evidence,executionRecovered=False,limits=['Explicit action-to-timeline bindings; not a recovered complete execution graph.','Command frame clock, conditional consumers and SPSKILL_END transition semantics remain unresolved.'])
 (OUT/'minato-action-dispatch.json').write_text(json.dumps(result,indent=2)+'\n')
 folder=OUT/'original-shaders';folder.mkdir(exist_ok=True);packages=[]
 for name in ['nuccMaterial_dx11.nsh','nuccPostEffect_dx11.nsh']:
  p=GAME/'data/system'/name;b=p.read_bytes()
  if b[:4]!=b'NUP4':raise ValueError('package header')
  row=dict(source=str(p),sha256=sha(b),bytes=len(b),shaders=[]);pos=0
  while True:
   o=b.find(b'DXBC',pos)
   if o<0:break
   size,chunks=dxbc(b,o);blob=b[o:o+size];dest=folder/(sha(blob)+'.dxbc');dest.write_bytes(blob)
   row['shaders'].append(dict(offset=o,bytes=size,sha256=sha(blob),path=str(dest.relative_to(ROOT)),chunks=chunks));pos=o+size
  if not row['shaders']:raise ValueError('no shaders')
  packages.append(row)
 index=dict(schemaVersion=1,packages=packages,verified=False,limits=['Original DXBC recovered; package selector-to-Minato-material bindings remain unresolved.','No browser shader translation or visual fidelity certification is implied.'])
 (folder/'index.json').write_text(json.dumps(index,indent=2)+'\n')
 print(json.dumps(dict(actionRows=len(result['rows']),commands=sum(len(r['commands']) for r in result['rows']),shaderPrograms=sum(len(p['shaders']) for p in packages))))
if __name__=='__main__':build()
