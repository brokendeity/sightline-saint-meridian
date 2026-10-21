"""Structural particle inventory supported by saved Ghidra loader evidence; no emitter simulation."""
import struct,json,hashlib,gzip
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];DEST=ROOT/'assets/nsunsc-library'
def parse(data):
 if len(data)<40 or len(data)>16*1024*1024:raise ValueError('particle size outside bounds')
 triples=[struct.unpack_from('>IHH',data,i*8) for i in range(5)]
 if triples[0][0]!=40:raise ValueError('unrecognized particle header marker')
 cursor=40;sections=[];warnings=[]
 for i,(opaque,count,size) in enumerate(triples):
  end=cursor+size
  if end>len(data):raise ValueError('section extends beyond payload')
  block=data[cursor:end];section=dict(label=chr(65+i),opaqueU32=opaque,count=count,bytes=size,start=cursor,end=end,sha256=hashlib.sha256(block).hexdigest())
  if i<4:
   strides=[[208],[32],[48,56],[96,112]][i]
   stride=next((s for s in strides if count*s==size),None)
   if count and stride is None:warnings.append('Unresolved stride in section '+section['label'])
   section['recordBytes']=stride
   if i==0 and stride:section['chunkRefIndices']=[struct.unpack_from('>I',block,j*stride)[0] for j in range(count)]
  else:
   lists=[];offset=0
   for _ in range(count):
    if offset+4>len(block):warnings.append('Section E list header exceeds section');break
    n=struct.unpack_from('>I',block,offset)[0];stride=(n*4+11)&~7
    if offset+stride>len(block):warnings.append('Section E list exceeds section');break
    lists.append(dict(count=n,values=list(struct.unpack_from('>'+str(n)+'I',block,offset+4)) if n else []));offset+=stride
   section['lists']=lists
   if offset!=len(block):warnings.append('Section E contains uninterpreted bytes')
  sections.append(section);cursor=end
 return dict(status='structural-only',sections=sections,opaqueTailBytes=len(data)-cursor,opaqueTailSha256=hashlib.sha256(data[cursor:]).hexdigest() if cursor<len(data) else None,warnings=warnings)
def main():
 index={};errors=[];tracks=tail=warnings=0
 for p in sorted(DEST.glob('*/index.json')):
  r=json.loads(p.read_text());records=[];priorFile=p.parent/'particle-sections.json.gz';prior=json.loads(gzip.decompress(priorFile.read_bytes())) if priorFile.exists() else {};prior=prior if prior.get('referenceSourceSha256')==r.get('sha256') else {};priorRows={(x['name'],x['sha256']):x for x in prior.get('records',[])};priorRefs={(x['name'],x['sha256']):x['references'] for x in prior.get('records',[]) if 'references' in x}
  for raw in r.get('unsupported',[]):
   if raw['type']!='NuccChunkParticle':continue
   try:
    record=parse((ROOT/raw['url']).read_bytes());record.update(name=raw['name'],rawUrl=raw['url'],sha256=raw['sha256']);
    if (record['name'],record['sha256']) in priorRefs:record['references']=priorRefs[(record['name'],record['sha256'])]
    old=priorRows.get((record['name'],record['sha256']),{})
    for field in ['resources','emissionEvents','eventGeneratorCountMatches','generatorConfigs']:
     if field in old:record[field]=old[field]
    records.append(record);tracks+=1;tail+=bool(record['opaqueTailBytes']);warnings+=bool(record['warnings'])
   except Exception as e:errors.append(dict(bundle=r['key'],name=raw['name'],reason=str(e)))
  if records:
   url=f"assets/nsunsc-library/{r['key']}/particle-sections.json.gz";(ROOT/url).write_bytes(gzip.compress(json.dumps(dict(version=1,records=records,**({k:prior[k] for k in ['referenceSchemaVersion','referenceSourceSha256','referenceEvidence','resourceReferenceSchema','resourceReferenceSourceSha256','resourceReferenceEvidence','eventSchemaVersion','eventEvidence'] if k in prior} if all('references' in r for r in records) else {}),boundary='Structural decoding only. Opaque fields, timing, shader interpretation and emitter behavior remain unresolved.'),separators=(',',':')).encode(),mtime=0));index[r['key']]=dict(url=url,count=len(records))
 result=dict(version=1,bundles=index,stats=dict(bundles=len(index),records=tracks,withOpaqueTail=tail,withWarnings=warnings,rejected=len(errors)),errors=errors,evidence=['output/rea-naruto/ghidra/full-export/main-final/functions/141320/141320290.c','output/rea-naruto/ghidra/full-export/main-final/functions/14131f/14131fdf0.c'])
 (DEST/'particle-sections-index.json').write_text(json.dumps(result,separators=(',',':')));print(json.dumps(result['stats'],indent=2))
if __name__=='__main__':main()
