#!/usr/bin/env python3
"""Read ANIB FlatBuffer bindings using Ghidra 1444c6440 recovered field accesses.
Does not execute target code. Source IDs are matched exactly to the AMDL IDs.
"""
import json,struct,hashlib
from pathlib import Path
from inspect_forspoken_amdl import Reader,CHANNELS
ROOT=Path('output/rea-forspoken')
def parse_binding(path,rig,mask_bits=None):
 b=path.read_bytes();r=Reader(b)
 def u(o):return r.unpack('<I',o)[0]
 def h(o):return r.unpack('<H',o)[0]
 def table(t):
  v=t-r.unpack('<i',t)[0];size,obj=h(v),h(v+2)
  if size<4 or size>64 or size%2:raise ValueError('Invalid vtable')
  r.span(t,obj);r.span(v,size)
  return [t+h(v+i) if h(v+i) else None for i in range(4,size,2)]
 def vec(a):
  v=a+u(a);n=u(v)
  if n>20000:raise ValueError('Invalid vector length')
  return r.array('I',n,v+4)
 # Follow the typed custom-data dependency, rather than searching packed bytes:
 # arbitrary compressed transform payloads may coincidentally contain 'ANIB'.
 custom_index=r.unpack('<Q',96)[0]; custom_count=u(104)
 if custom_count>4096:raise ValueError('Invalid custom node count')
 targets=[]
 for node in range(custom_count):
  rel,kind,_=r.unpack('<QII',custom_index+node*16)
  if kind==0x108:
   target=custom_index+rel
   if r.span(target+4,4)!=b'ANIB':raise ValueError('Typed animation binding lacks ANIB identifier')
   targets.append(target)
 if len(targets)!=1:raise ValueError('Expected one typed ANIB dependency')
 base=targets[0];t=base+u(base);fs=table(t)
 version,flags=r.unpack('<HH',fs[0]);entries=vec(fs[1]);channels=[]
 by_id={x['sourceBoneId']:x for x in rig['bones']}
 v=fs[1]+u(fs[1])
 for i,rel in enumerate(entries):
  loc=v+4+i*4;f=table(loc+rel)
  def scalar(j,fmt,default=0):return r.unpack(fmt,f[j])[0] if j<len(f) and f[j] else default
  kind=scalar(0,'<H');count=scalar(2,'<H');first=scalar(3,'<H');part=scalar(4,'<I')
  ids=vec(f[5]) if len(f)>5 and f[5] else []
  mapped=[dict(sourceId=hex(x),boneIndex=by_id[x]['index'],boneName=by_id[x]['name']) for x in ids if x in by_id]
  missing=[hex(x) for x in ids if x not in by_id]
  selected=[x for x in (mask_bits or []) if part<=x<part+count]
  if mask_bits is not None and len(selected)!=len(ids):
   raise ValueError(f'Channel {kind} mask/ID length mismatch: {len(selected)} vs {len(ids)}')
  key_bindings=[dict(partBit=bit,sourceId=hex(source_id),boneIndex=by_id[source_id]['index'],boneName=by_id[source_id]['name']) for bit,source_id in zip(selected,ids)]
  channels.append(dict(channel=kind,name=CHANNELS[kind] if kind<len(CHANNELS) else 'unknown',
     sourceFlags=scalar(1,'<H'),count=count,firstIndex=first,partMaskStartBit=part,
     sourceIds=[hex(x) for x in ids],animatedPartBindings=key_bindings,mappedBones=mapped,unmatchedIds=missing,
     tableOffset=loc+rel))
 return dict(file=str(path),sha256=hashlib.sha256(b).hexdigest(),anibOffset=base,
    version=version,flags=flags,channels=channels,
    allIdsMatch=all(not x['unmatchedIds'] for x in channels),
    evidence='FlatBuffer field accesses from Ghidra FUN_1444c6440; exact uint32 IDs matched to AMDL',
    limitations=['Part ranges retain source values; sparse part-bit to ID order follows Ghidra mask/hash traversal and requires packed-transform decoding validation.',
      'No animation quaternion/vector decoder is implemented by this inspector.'])
if __name__=='__main__':
 rig=json.loads((ROOT/'hu000-rig.json').read_text())
 manifest=json.loads((ROOT/'pka-ani/manifest.json').read_text())
 result=dict(schema='forspoken-anib-binding-v1',clips=[parse_binding(Path(c['file']),rig,c['candidateBitMasks'][0]['setBits']) for c in manifest['clips']])
 (ROOT/'vault-rig-binding.json').write_text(json.dumps(result,indent=2)+'\n')
 print(json.dumps([dict(file=x['file'],allIdsMatch=x['allIdsMatch'],channels=[(c['name'],c['count'],len(c['mappedBones'])) for c in x['channels']]) for x in result['clips']],indent=2))
