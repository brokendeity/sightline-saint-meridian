"""Remove empty Blender export scenes from runtime GLBs, preserving mesh buffers."""
import json,struct
from pathlib import Path
root=Path(__file__).resolve().parents[1]
for path in (root/'buildings/saint_meridian').glob('*.glb'):
 data=path.read_bytes();size,kind=struct.unpack_from('<II',data,12);doc=json.loads(data[20:20+size]);kept=[(i,s) for i,s in enumerate(doc['scenes']) if s.get('nodes')]
 doc['scene']=next(j for j,(i,s) in enumerate(kept) if i==doc.get('scene',0));doc['scenes']=[s for i,s in kept]
 raw=json.dumps(doc,separators=(',',':')).encode();raw+=b' '*((-len(raw))%4);tail=data[20+size:];result=struct.pack('<III',0x46546c67,2,20+len(raw)+len(tail))+struct.pack('<II',len(raw),kind)+raw+tail;path.write_bytes(result)
 print(path.name,len(result))
