"""Bounded static attribution of the source factory path for character ID 109."""
import hashlib,json,struct
from pathlib import Path
BASE=Path(__file__).resolve().parents[1]
EXE=Path('/Users/richardmpayi/Downloads/nar/NARUTO X BORUTO Ultimate Ninja STORM CONNECTIONS/NSUNSC.exe')
SHA='cecf0405b5ac00b9b9c95e8ff594bde5f8543413b6308f74991c701218b20d1e'
FUN=BASE/'output/rea-naruto/ghidra/full-export/main/functions'
def source(address):
 p=FUN/address[:6]/(address+'.c');return p,p.read_text()
def build():
 b=EXE.read_bytes();assert hashlib.sha256(b).hexdigest()==SHA
 pe=struct.unpack_from('<I',b,60)[0];n=struct.unpack_from('<H',b,pe+6)[0];opt=struct.unpack_from('<H',b,pe+20)[0];image=struct.unpack_from('<Q',b,pe+48)[0]
 def off(va):
  for i in range(n):
   vs,rva,size,pos=struct.unpack_from('<4I',b,pe+24+opt+i*40+8)
   if rva<=va-image<rva+size:return pos+va-image-rva
  raise ValueError('Unmapped source VA')
 rows=[]
 for va in range(0x1419551b0,0x1419556d0,16):
  fn,key=struct.unpack_from('<2Q',b,off(va));rows.append(dict(va=hex(va),factory=hex(fn),key=key))
 assert not any(r['key']==109 for r in rows)
 assert next(r for r in rows if r['factory']=='0x140a08330')['key']==45
 files=[]
 for a in ['140a0d850','140a07780','14084b3f0','14066af40','140645610']:
  p,s=source(a);files.append(dict(address='0x'+a,path=str(p.relative_to(BASE)),sha256=hashlib.sha256(p.read_bytes()).hexdigest()))
 p,s=source('140a0d850');assert 'param_1 == 0x6d' in s and 'DAT_1421c9460 + 0xba8' in s and '!= 0x1a' in s and 'FUN_14066af40' in s and '&DAT_1419551b8' in s and 'FUN_140a07780()' in s
 assert 'ccPlayerMainReliveStory::vftable' in source('14066af40')[1]
 assert 'FUN_14084b3f0' in source('140a07780')[1]
 return dict(schemaVersion=1,id='source:3mnt-factory-attribution',sourceSha256=SHA,characterId=109,modeCondition=dict(pointer='0x1421c9460',offset='0xba8',value=26,meaning='not independently identified'),specialCase=dict(constructor='0x14066af40',className='ccPlayerMainReliveStory'),otherwise=dict(factory='0x140a07780',constructor='0x14084b3f0',className='ccPlayerMain',proof='No key109 in exhaustive table scan after source conditional falls through'),excludedAttribution=dict(className='ccPlayerMain2FOU',factory='0x140a08330',tableKey=45),table=rows,pseudocode=files,limits=['Static Ghidra control flow and immutable PE table evidence; original executable not run.','Character settings ID109 correspondence to3mnt comes from prior source-table evidence.','Mode26 meaning is not established; do not label it standard versus story solely from class names.','Callsite argument identity and later per-instance vtable mutation remain separate audit questions.'])
if __name__=='__main__':
 r=build();p=BASE/'assets/nsunsc-library/minato-factory-attribution.json';p.write_text(json.dumps(r,indent=2)+'\n');print(json.dumps(dict(path=str(p),rows=len(r['table']),otherwise=r['otherwise'])))
