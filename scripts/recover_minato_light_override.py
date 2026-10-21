"""Static script-to-render-state light override trace; not a proved body GPU upload."""
import hashlib,json,struct
from pathlib import Path
from recover_minato_factory_attribution import BASE,EXE,FUN,SHA

def build():
 b=EXE.read_bytes();assert hashlib.sha256(b).hexdigest()==SHA
 pe=struct.unpack_from('<I',b,60)[0];n=struct.unpack_from('<H',b,pe+6)[0];opt=struct.unpack_from('<H',b,pe+20)[0]
 va=0x1417611a0;raw=None
 for i in range(n):
  vs,rva,size,pos=struct.unpack_from('<4I',b,pe+24+opt+40*i+8)
  if rva<=va-0x140000000<rva+size:raw=b[pos+va-0x140000000-rva:pos+va-0x140000000-rva+4]
 assert raw==bytes.fromhex('00000080')
 files=[]
 for a in ['140aa49e0','1405c10b0','140ae1af0','140ae1b00','1405c0c60','1405fa800']:
  p=FUN/a[:6]/(a+'.c');text=p.read_text();files.append(dict(address='0x'+a,path=str(p.relative_to(BASE)),sha256=hashlib.sha256(p.read_bytes()).hexdigest()))
  if a=='140aa49e0':assert "ccEnableLightDirection" in text and 'FUN_1405c10b0((float)dVar1,(float)dVar2,(float)dVar3)' in text
  if a=='140ae1b00':assert 'param_1 + 0x34' in text and 'param_1 + 0x3c' in text
 return dict(schemaVersion=1,id='source:minato-light-override-trace',sourceSha256=SHA,scriptEntry='0x140aa49e0',setter='0x1405c10b0',signMask=dict(address=hex(va),hex=raw.hex(),u32=struct.unpack('<I',raw)[0]),renderState=dict(base='0x1421d0890',index='TLS thread/render index at TLS+0x10',stride='0x2400',enabledOffset='0x30',directionOffset='0x34',directionBytes=12),operation='Source ccEnableLightDirection casts script xyz to float, flips each IEEE754 sign bit, enables override and stores xyz; no normalization is performed on this path.',otherWriter=dict(function='0x1405fa800',sourceOffset='0x3238',note='An actor path can overwrite the same render-state direction; script value is not necessarily final draw value.'),pseudocode=files,bodyBinding=dict(shaderSelector='0xf00a',reflectedVariable='g_lightDirection',bufferOffset=112,status='GPU upload attribution unresolved'),limits=['No Minato script invocation arguments were recovered for this trace.','No association between state+0x34 and the shader reflected slot112 is proven.','Light color, ambient, shade color, point-light and stage-color per-draw values remain unavailable.','This evidence must not activate an original-shading mode or substitute a guessed light vector.'])
if __name__=='__main__':
 r=build();p=BASE/'assets/nsunsc-library/minato-light-override-trace.json';p.write_text(json.dumps(r,indent=2)+'\n');print(p)
