"""Pin camera projection source and read-only PE constants; no target execution."""
import hashlib,json,struct
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
EXE=Path('/Users/richardmpayi/Downloads/nar/NARUTO X BORUTO Ultimate Ninja STORM CONNECTIONS/NSUNSC.exe')
ADDRESSES=['1412b7510','1412b8ac0','1412b71d0','1412320b0','1412a2050','1412a2200','14127e340','1411eb690','1411eb2a0','1412b8ca0','14109a780']
def build():
 b=EXE.read_bytes();nt=struct.unpack_from('<I',b,0x3c)[0];n=struct.unpack_from('<H',b,nt+6)[0];o=nt+24;s=o+struct.unpack_from('<H',b,nt+20)[0];base=struct.unpack_from('<Q',b,o+24)[0]
 constants=[]
 for a in [0x14176a448,0x1417617e8,0x1417617ec,0x14176a458,0x14176a440]:
  r=a-base
  for i in range(n):
   row=s+i*40;vs,va,rs,rp=struct.unpack_from('<IIII',b,row+8)
   if va<=r<va+rs:
    off=rp+r-va;constants.append(dict(address=hex(a),fileOffset=off,bytes=b[off:off+4].hex(),value=struct.unpack_from('<f',b,off)[0]));break
  else:raise ValueError('Unmapped constant')
 evidence=[]
 for address in ADDRESSES:
  p=ROOT/'output/rea-naruto/ghidra/full-export/main/functions'/address[:6]/(address+'.c')
  evidence.append(dict(address='0x'+address,path=str(p.relative_to(ROOT)),sha256=hashlib.sha256(p.read_bytes()).hexdigest()))
 return dict(schemaVersion=1,id='source:camera-projection',binarySha256=hashlib.sha256(b).hexdigest(),evidence=evidence,constants=constants,
  proven=[dict(claim='The original perspective lens scalar is horizontal field of view in degrees.',source=['0x1412b7510','0x1412b8ac0'],expression='tanHorizontal=tan(lensDegrees*PI/180*0.5); tanVertical=(viewportHeight/viewportWidth)*tanHorizontal'),dict(claim='Original viewport width/height are configured runtime fields, not a hardcoded 16:9 aspect in this path.',source=['0x1412b71d0'],fields=dict(width='+0x250 from config+0x5d0',height='+0x254 from config+0x5d4')),dict(claim='Camera +0x30 stores a view-like inverse matrix; conversion helper 141280750 invokes general inverse1411eb2a0. This alone does not establish correct ANM quaternion-parent composition.',source=['0x1412a2050','0x1412a2200','0x1411eb690','0x1411eb2a0'])],
  helper=dict(path='scripts/source_minato_camera.js',globalName='SourceMinatoCamera',method='horizontalToVertical(horizontalDegrees, aspect)',formula='2*atan(tan(horizontalDegrees*pi/360)/aspect)*180/pi',boundary='Centered full-viewport projection only; neither cropping nor actor-relative parent composition is recovered.'),
  unresolved=['Full animated camera quaternion/parent composition','Original scene/actor camera offsets','Viewport cropping and dynamic aspect policies','Matched original-game footage'],originalCompositionVerified=False)
if __name__=='__main__':
 out=ROOT/'assets/nsunsc-library/minato-camera-evidence.json';r=build();out.write_text(json.dumps(r,indent=2)+'\n');print(json.dumps(dict(output=str(out),constants=len(r['constants']),evidence=len(r['evidence']))))
