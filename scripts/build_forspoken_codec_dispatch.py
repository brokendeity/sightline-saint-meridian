"""Static PE dispatch facts; runtime overrides/pose consumption are separate."""
import hashlib,json,struct
from pathlib import Path
OUT=Path(__file__).resolve().parents[1]/'output/rea-forspoken'
def inspect():
 b=(OUT/'FORSPOKEN.exe').read_bytes();sha=hashlib.sha256(b).hexdigest()
 if sha!='da0e172c7d1db082f5e1fd20978ae0b72c5c0995eb0f6b0b428afc23912e551c':raise ValueError('Executable identity mismatch')
 pe=struct.unpack_from('<I',b,60)[0];n=struct.unpack_from('<H',b,pe+6)[0];opt=struct.unpack_from('<H',b,pe+20)[0];sections=[struct.unpack_from('<8sIIIIIIHHI',b,pe+24+opt+i*40) for i in range(n)]
 def off(va):
  r=va-0x140000000;s=next(s for s in sections if s[2]<=r<s[2]+s[3]);return s[4]+r-s[2]
 rows=[]
 for i in range(8):
  va=0x147593970+i*56;o=off(va);ident,width,flags,*p=struct.unpack_from('<IIQ5Q',b,o);no=off(p[-1]);name=b[no:b.index(0,no)].decode('ascii')
  if width not in [5,6,16]:raise ValueError('Unexpected codec table schema')
  rows.append(dict(index=i,address=hex(va),name=name,sourceMetadata0=ident,packedBytes=width,flags=flags,callbacks=[hex(x) for x in p[:4]]))
 defaults=[]
 for i in range(6):
  o=off(0x147593b30+i*16);packed,blend,name=struct.unpack_from('<IIQ',b,o);no=off(name);defaults.append(dict(rawType=i,name=b[no:b.index(0,no)].decode('ascii'),packedType=packed,blendType=blend))
 proof={'sourceSha256':sha,'packedTable':rows,'rawTypeDefaults':defaults,'evidence':'PE table records + cache constructor1444bde40 uses147593b30 unless0x106 override; callback bodies retained as Ghidra pseudocode','status':'static source binding; original runtime execution not observed'}
 (OUT/'pka-codec-dispatch.json').write_text(json.dumps(proof,indent=2)+'\n');return proof
if __name__=='__main__':
 p=inspect();print(json.dumps(p['packedTable'][2],indent=2))
