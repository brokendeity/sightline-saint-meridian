"""Translate bounded original SM4 pixel arithmetic to GLSL, retaining exact source offsets.
No guessed runtime constant values, textures, vertex inputs or render states are supplied.
"""
import json,struct,hashlib
from pathlib import Path
BASE=Path(__file__).resolve().parents[1];DEST=BASE/'assets/nsunsc-library'
def chunks(b):
 n=struct.unpack_from('<I',b,28)[0]
 for off in struct.unpack_from('<'+'I'*n,b,32):
  size=struct.unpack_from('<I',b,off+4)[0];yield b[off:off+4].decode(),b[off+8:off+8+size]
def literal(x):
 v=struct.unpack('<f',struct.pack('<I',x))[0]
 if not __import__('math').isfinite(v):raise ValueError('Nonfinite immediate')
 return repr(v) if '.' in repr(v) or 'e' in repr(v) else str(v)+'.0'
def operand(t,i):
 token=t[i];i+=1;modifier=0
 if token>>31:
  e=t[i];i+=1
  if e&63!=1 or e>>31:raise ValueError('Unsupported operand extension')
  modifier=(e>>6)&255
 typ=token>>12&255;nc=token&3;dim=token>>20&3;rep=[(token>>(22+3*j))&7 for j in range(dim)]
 if any(rep):raise ValueError('Relative operand indexing unsupported')
 indices=list(t[i:i+dim]);i+=dim
 if typ==4:
  n={1:1,2:4}[nc];value='vec4('+','.join(literal(x) for x in t[i:i+n])+')';i+=n
 elif typ in [0,1,2,8]:
  value={0:'r',1:'v',2:'o',8:'cb0'}[typ]+'['+str(indices[-1])+']'
  if typ==8 and indices[0]!=0:raise ValueError('Unsupported constant buffer')
 elif typ in [6,7]:value=str(indices[0])
 else:raise ValueError('Unsupported operand type '+str(typ))
 mask='xyzw'
 if typ not in [4,6,7]:
  mode=token>>2&3
  if mode==0:mask=''.join('xyzw'[j] for j in range(4) if token&(1<<(4+j))) or 'xyzw'
  elif mode==1:value+='.'+''.join('xyzw'[(token>>(4+2*j))&3] for j in range(4))
  elif mode==2:value+='.'+('xyzw'[(token>>4)&3]*4)
  else:raise ValueError('Operand component mode')
 if modifier in [2,3]:value='abs('+value+')'
 if modifier in [1,3]:value='(-'+value+')'
 if modifier>3:raise ValueError('Unknown source modifier')
 return dict(value=value,mask=mask,type=typ,indices=indices),i
NAMES={0:'add',1:'and',13:'discard',14:'div',15:'dp4',16:'dp3',25:'exp',29:'ge',47:'log',49:'lt',50:'mad',51:'min',52:'max',54:'mov',55:'movc',56:'mul',57:'ne',62:'ret',64:'round_ne',69:'sample',75:'sqrt'}
def translate(b):
 tokens=None
 for tag,d in chunks(b):
  if tag in ['SHDR','SHEX']:tokens=list(struct.unpack('<'+'I'*(len(d)//4),d))
 if tokens is None:raise ValueError('No shader program')
 if tokens[0]>>16!=0:raise ValueError('Not pixel shader')
 if tokens[1]!=len(tokens):raise ValueError('Token length mismatch')
 i=2;lines=[];records=[];temps=0
 while i<len(tokens):
  at=i;inst=tokens[i];op=inst&2047;n=inst>>24&127
  if n<1 or i+n>len(tokens):raise ValueError('Instruction bounds')
  t=tokens[i+1:i+n];i+=n
  if op==104:temps=t[0];continue
  if op in [88,89,90,98,100,101]:continue
  if op==62:lines.append('return;');continue
  if op not in NAMES:raise ValueError('Unsupported opcode '+str(op))
  a=[];j=0
  while j<len(t):p,j=operand(t,j);a.append(p)
  if op==13:
   cond='!=' if inst&(1<<18) else '==';lines.append('if ('+a[0]['value']+'.x '+cond+' 0.0) discard;');continue
  dst=a[0];s=[x['value'] for x in a[1:]];v=lambda x:'('+x+')';rhs=None
  if op==0:rhs=v(s[0])+'+'+v(s[1])
  if op==1:rhs='vec4('+','.join('('+s[0]+'.'+c+' != 0.0 && '+s[1]+'.'+c+' != 0.0) ? 1.0 : 0.0' for c in 'xyzw')+')'
  if op==14:rhs=v(s[0])+'/'+v(s[1])
  if op in [15,16]:rhs='vec4(dot('+s[0]+('.xyz' if op==16 else '')+','+s[1]+('.xyz' if op==16 else '')+'))'
  if op in [25,47,64,75]:rhs={25:'exp2',47:'log2',64:'sourceRoundEven',75:'sqrt'}[op]+'('+s[0]+')'
  if op in [29,49,57]:rhs='vec4('+','.join('('+s[0]+'.'+c+{29:' >= ',49:' < ',57:' != '}[op]+s[1]+'.'+c+') ? 1.0 : 0.0' for c in 'xyzw')+')'
  if op==50:rhs=v(s[0])+'*'+v(s[1])+'+'+v(s[2])
  if op in [51,52]:rhs={51:'min',52:'max'}[op]+'('+s[0]+','+s[1]+')'
  if op==54:rhs=s[0]
  if op==55:rhs='vec4('+','.join('('+s[0]+'.'+c+' != 0.0) ? '+s[1]+'.'+c+' : '+s[2]+'.'+c for c in 'xyzw')+')'
  if op==56:rhs=v(s[0])+'*'+v(s[1])
  if op==69:rhs='texture2D(sourceTexture'+str(a[2]['indices'][0])+','+s[0]+'.xy)'
  if rhs is None:raise ValueError('Unhandled equation')
  if inst&(1<<13):rhs='clamp('+rhs+',0.0,1.0)'
  mask=dst['mask'];line=dst['value']+'.'+mask+' = ('+rhs+').'+mask+';';lines.append('// source token '+str(at)+' '+NAMES[op]+'\n'+line);records.append(dict(tokenOffset=at,opcode=NAMES[op],raw=t))
 glsl='''// Original DXBC arithmetic translation. Source vertex inputs and CB values must be supplied.
vec4 sourceRoundEven(vec4 x) {vec4 a=floor(x);vec4 f=x-a;return a+vec4(f.x>.5 || (f.x==.5 && mod(a.x,2.0)!=0.0)?1.0:0.0,f.y>.5 || (f.y==.5 && mod(a.y,2.0)!=0.0)?1.0:0.0,f.z>.5 || (f.z==.5 && mod(a.z,2.0)!=0.0)?1.0:0.0,f.w>.5 || (f.w==.5 && mod(a.w,2.0)!=0.0)?1.0:0.0);}
void sourcePixel(vec4 v[4], out vec4 o[3]) {
vec4 r['''+str(temps)+'''];
'''+ '\n'.join(lines)+'\n}\n'
 return glsl,records
if __name__=='__main__':
 evidence=json.loads((DEST/'minato-material-evidence.json').read_text());rows=[]
 for selector in [0xf00a,0x2f00a]:
  pair=next(x for x in evidence['shaderPairs'] if x['selector']==selector);path=BASE/pair['pixel']['url'];glsl,inst=translate(path.read_bytes());name='original-shaders/source-'+hex(selector)[2:]+'.glsl';(DEST/name).write_text(glsl);rows.append(dict(selector=selector,source=pair['pixel'],url='assets/nsunsc-library/'+name,sha256=hashlib.sha256(glsl.encode()).hexdigest(),instructions=len(inst),sourceInstructions=inst,requiredConstantVectors=33 if selector==0xf00a else 36,requiredTextureSlots=2 if selector==0xf00a else 3,requiredInputs=['SV_Position.xy','source UVs','directional cel-ramp UV + fog factor','point-light cel-ramp UV + attenuation'],outputs=3,status='arithmetic translated; source vertex inputs and runtime constant values unresolved'))
 (DEST/'minato-body-shader-equations.json').write_text(json.dumps(dict(schemaVersion=1,programs=rows,verified=False,limits=['Source pixel equations translated, not a complete draw pipeline.','Boolean results represented as zero/one; source uses comparison bitmasks and only boolean consumers in these bounded shaders.','No runtime constants or ramp input parameters guessed. Three MRT outputs require original compositing passes.']),indent=2)+'\n');print([(hex(r['selector']),r['instructions']) for r in rows])
