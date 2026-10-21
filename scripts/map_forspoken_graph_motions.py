#!/usr/bin/env python3
"""Index original motion-ID references; do not infer action labels from pack names."""
import hashlib,json,struct,re
from collections import Counter
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]/'output/rea-forspoken'
def table_containing(b,offset):
 candidates=[]
 for t in range(max(0,offset-256)//4*4,offset+1,4):
  d=struct.unpack_from('<i',b,t)[0];v=t-d
  if not 0<=v<=len(b)-4:continue
  size,obj=struct.unpack_from('<HH',b,v)
  if not 8<=size<=64 or size%2 or not 8<=obj<=256 or v+size>len(b) or t+obj>len(b) or not t<=offset<t+obj:continue
  fs=struct.unpack_from('<%dH'%((size-4)//2),b,v+4)
  if any(f and not 4<=f<obj for f in fs):continue
  fields=[i for i,f in enumerate(fs) if f and t+f==offset]
  if not fields:continue
  values=[{'field':i,'offset':t+f,'u32':struct.unpack_from('<I',b,t+f)[0]} for i,f in enumerate(fs) if f and t+f+4<=len(b)]
  candidates.append(dict(tableOffset=t,vtableOffset=v,objectBytes=obj,referenceFieldIndices=fields,fields=values))
 return sorted(candidates,key=lambda x:(x['objectBytes'],offset-x['tableOffset']))
def main():
 graph=ROOT/'movement-assets/40009-hu000_root.anmgph';b=graph.read_bytes();inventory=json.loads((ROOT/'movement-coverage.json').read_text());rows=[]
 for clip in inventory['clips']:
  needle=struct.pack('<I',int(clip['animationId'],16));positions=[];start=0
  while True:
   p=b.find(needle,start)
   if p<0:break
   positions.append(p);start=p+1
  refs=[dict(offset=p,aligned=p%4==0,containingTables=table_containing(b,p)) for p in positions]
  rows.append(dict(animationId=clip['animationId'],sourcePack=clip['pack'],sourceAni=clip['file'],graphReferences=refs,semanticActionName=None,semanticStatus='unresolved; graph ID reference proves use but does not name movement state'))
 act=ROOT/'movement-actid.parambin';ab=act.read_bytes();strings=[dict(offset=m.start(),value=m[0].decode()) for m in re.finditer(rb'[ -~]{4,}',ab)]
 result=dict(schema='forspoken-graph-motion-references-v1',graph=dict(file=str(graph),sha256=hashlib.sha256(b).hexdigest(),sizeBytes=len(b)),indexedClips=len(rows),graphReferencedClips=sum(bool(x['graphReferences']) for x in rows),referenceOccurrences=sum(len(x['graphReferences']) for x in rows),exactSemanticLabelsRecovered=0,actidResource=dict(file=str(act),sha256=hashlib.sha256(ab).hexdigest(),strings=strings,semanticMotionNamesRecovered=False),clips=rows)
 (ROOT/'movement-graph-motion-references.json').write_text(json.dumps(result,indent=2)+'\n')
 print(json.dumps({k:v for k,v in result.items() if k not in ('clips','actidResource')}))
if __name__=='__main__':main()
