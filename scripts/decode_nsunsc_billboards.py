"""Decode billboard channel layout from original loader, not the older importer assumptions."""
import json,struct,gzip,math,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];DEST=ROOT/'assets/nsunsc-library'
# Source loader14134c4e0 + pointer setup1413917e0 establish widths and0/1/N storage modes.
CHANNELS=[('position',3),('rotationScalar',1),('scale2',2),('opacity',1),('uv0Offset',2),('uv0Scale',2),('channel6',1),('channel7',1),('channel8',1),('channel9',2),('channel10',2),('channel11',1),('channel12',1)]
def parse(data):
 if len(data)<16 or len(data)>16*1024*1024:raise ValueError('size outside bounds')
 model,flags,count,reserved,unknown=struct.unpack_from('>IIHHI',data);assert 0<count<=65535
 cursor=16;channels=[]
 for i,(name,width) in enumerate(CHANNELS):
  mode=(flags>>(1+i*2))&3
  if mode==3:raise ValueError('unverified storage mode3')
  samples=0 if mode==0 else 1 if mode==1 else count
  end=cursor+samples*width*4
  if end>len(data):raise ValueError('channel extends beyond record')
  values=[list(struct.unpack_from('>'+str(width)+'f',data,cursor+j*width*4)) for j in range(samples)]
  if not all(math.isfinite(v) for row in values for v in row):raise ValueError('non-finite channel')
  channels.append(dict(index=i,name=name,width=width,mode=mode,samples=values));cursor=end
 if cursor!=len(data):raise ValueError('uninterpreted trailing bytes')
 return dict(modelIndex=model,flags=flags,frameCount=count,reserved=reserved,opaqueHeaderU32=unknown,ticksPerFrame=unknown,sourceFramesPerSecond=3000/unknown if unknown else None,loop=bool(flags&1),channels=channels,decodedBytes=cursor,status='decoded channels; original spawn timing unresolved')
def main():
 index={};assets=[];errors=[];total=0;modes={};widths={}
 for p in sorted(DEST.glob('*/index.json')):
  r=json.loads(p.read_text());records=[];priorFile=p.parent/'billboards.json.gz';prior=json.loads(gzip.decompress(priorFile.read_bytes())) if priorFile.exists() else {};sources={(x['name'],x['sha256']):x.get('sourceReference') for x in prior.get('records',[]) if x.get('sourceReference')};refs={(x['name'],x['sha256']):x.get('modelReference') for x in prior.get('records',[]) if x.get('modelReference')}
  for raw in r.get('unsupported',[]):
   if raw['type']!='NuccChunkBillboard':continue
   try:
    item=parse((ROOT/raw['url']).read_bytes());item.update(name=raw['name'],sha256=raw['sha256'],rawUrl=raw['url'])
    if (item['name'],item['sha256']) in refs:item['modelReference']=refs[(item['name'],item['sha256'])]
    if (item['name'],item['sha256']) in sources:item['sourceReference']=sources[(item['name'],item['sha256'])]
    records.append(item);assets.append(dict(bundle=r['key'],name=item['name'],sha256=item['sha256'],sourceReference=item.get('sourceReference'),modelReference=item.get('modelReference')));total+=1
    for ch in item['channels']:modes[str(ch['mode'])]=modes.get(str(ch['mode']),0)+1
   except Exception as e:errors.append(dict(bundle=r['key'],name=raw['name'],rawUrl=raw['url'],reason=str(e)))
  if records:
   url=f"assets/nsunsc-library/{r['key']}/billboards.json.gz";(ROOT/url).write_bytes(gzip.compress(json.dumps(dict(version=2,records=records,sourceSha256=r['sha256'],referenceSchemaVersion=prior.get('referenceSchemaVersion'),referenceSourceSha256=prior.get('referenceSourceSha256')),separators=(',',':')).encode(),mtime=0));index[r['key']]=dict(url=url,count=len(records))
 result=dict(version=2,bundles=index,assets=assets,stats=dict(bundles=len(index),records=total,channelStorageModes=modes,rejected=len(errors)),errors=errors,evidence=['output/rea-naruto/ghidra/full-export/main-final/functions/14134c/14134c4e0.c','output/rea-naruto/ghidra/full-export/main-final/functions/141391/1413917e0.c'])
 (DEST/'billboards-index.json').write_text(json.dumps(result,separators=(',',':')));print(json.dumps(result['stats'],indent=2))
if __name__=='__main__':main()
