"""Recover DXBC reflection contracts, without inventing per-draw buffer values."""
import hashlib,json,struct
from pathlib import Path
from translate_minato_pixel_shader import chunks
BASE=Path(__file__).resolve().parents[1]
def cstring(data,offset):
 if not 0<=offset<len(data):raise ValueError('String offset out of bounds')
 end=data.find(b'\0',offset)
 if end<0:raise ValueError('Unterminated string')
 return data[offset:end].decode('ascii')
def signatures(data):
 count,offset=struct.unpack_from('<2I',data)
 if offset+24*count>len(data):raise ValueError('Truncated signature')
 rows=[]
 for i in range(count):
  name,index,system,component,register,masks=struct.unpack_from('<6I',data,offset+24*i)
  rows.append(dict(semantic=cstring(data,name),semanticIndex=index,systemValue=system,componentType=component,register=register,mask=masks&255,readWriteMask=(masks>>8)&255))
 return rows
def reflect(blob):
 result={}
 for tag,data in chunks(blob):
  if tag in ['ISGN','OSGN']:result[tag]=signatures(data)
  if tag!='RDEF':continue
  nc,co,nr,ro=struct.unpack_from('<4I',data)
  resources=[]
  for i in range(nr):
   name,typ,ret,dim,samples,bind,count,flags=struct.unpack_from('<8I',data,ro+i*32)
   resources.append(dict(name=cstring(data,name),type=typ,returnType=ret,dimension=dim,samples=samples,bindPoint=bind,bindCount=count,flags=flags))
  buffers=[]
  for i in range(nc):
   name,nv,vo,size,flags,typ=struct.unpack_from('<6I',data,co+i*24)
   variables=[]
   for j in range(nv):
    vn,start,length,vflags,vt,default=struct.unpack_from('<6I',data,vo+j*24)
    if start+length>size:raise ValueError('Variable exceeds buffer')
    defaultBytes=data[default:default+length] if default else None
    if default and len(defaultBytes)!=length:raise ValueError('Truncated default')
    variables.append(dict(name=cstring(data,vn),offset=start,bytes=length,used=bool(vflags&2),defaultHex=defaultBytes.hex() if defaultBytes else None))
   buffers.append(dict(name=cstring(data,name),bytes=size,variables=variables))
  result.update(resources=resources,constantBuffers=buffers)
 return result
def build():
 evidence=json.loads((BASE/'assets/nsunsc-library/minato-material-evidence.json').read_text());programs=[]
 for pair in evidence['shaderPairs']:
  for stage in ['vertex','pixel']:
   source=pair[stage];blob=(BASE/source['url']).read_bytes()
   assert hashlib.sha256(blob).hexdigest()==source['sha256']
   programs.append(dict(selector=pair['selector'],stage=stage,source=source,**reflect(blob)))
 return dict(schemaVersion=1,id='source:minato-shader-binding-contracts',programs=programs,limits=['Reflection proves register/semantic contracts, not the runtime values supplied to them.','Absent defaultHex means no constant initializer is present; no zero or inspection value is admitted as original.','Texture resource names identify shader slots, not which XFBIN texture was bound for a particular draw.','Original vertex declaration, skinning palette, per-draw buffer uploads and MRT composition still require recovery.'])
if __name__=='__main__':
 result=build();path=BASE/'assets/nsunsc-library/minato-shader-bindings.json';path.write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(dict(programs=len(result['programs']),path=str(path))))
