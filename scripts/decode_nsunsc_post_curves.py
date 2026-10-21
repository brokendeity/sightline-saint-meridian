"""Decode bounded length-prefixed FCURVE CSV, preserving unnamed channels and raw frames."""
import json,struct,math,re,gzip,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];DEST=ROOT/'assets/nsunsc-library'
def parse(data):
 if len(data)<12 or len(data)>1024*1024:raise ValueError('size outside decoder bounds')
 length=struct.unpack_from('>I',data)[0]
 if length!=len(data)-4:raise ValueError('length prefix mismatch')
 lines=[x.strip().rstrip(',') for x in data[4:].decode('ascii').strip('\x00\r\n ').splitlines() if x.strip()]
 if len(lines)<4 or not re.fullmatch(r'FCURVE_TYPE_[A-Z0-9_]+',lines[0]):raise ValueError('not an FCURVE CSV')
 if not re.fullmatch(r'FCURVE_INTERPOLATION_[A-Z0-9_]+',lines[1]):raise ValueError('unrecognized interpolation tag')
 version=None
 if lines[2].startswith('ver_'):
  version=lines.pop(2)
 count=int(lines[2]);assert 0<count<=10000
 if count!=len(lines)-3:raise ValueError('row count mismatch')
 keys=[[float(x) for x in line.split(',')] for line in lines[3:]]
 width=len(keys[0]);assert 2<=width<=65 and all(len(k)==width and all(math.isfinite(v) for v in k) for k in keys)
 assert all(k[0]>=0 and int(k[0])==k[0] for k in keys)
 assert all(keys[i][0]<=keys[i+1][0] for i in range(len(keys)-1))
 return dict(version=version,type=lines[0],interpolation=lines[1],channelCount=width-1,keys=keys)

def main():
 index={};errors=[];types={};total=0
 for p in sorted(DEST.glob('*/index.json')):
  r=json.loads(p.read_text());records=[]
  for raw in r.get('unsupported',[]):
   if raw['type']!='NuccChunkBinary':continue
   data=(ROOT/raw['url']).read_bytes()
   if b'FCURVE_TYPE_' not in data[:100]:continue
   try:
    item=parse(data);item.update(name=raw['name'],rawUrl=raw['url'],sha256=raw['sha256']);records.append(item);types[item['type']]=types.get(item['type'],0)+1;total+=1
   except Exception as e:errors.append(dict(bundle=r['key'],name=raw['name'],reason=str(e)))
  if records:
   url=f"assets/nsunsc-library/{r['key']}/post-curves.json.gz";(ROOT/url).write_bytes(gzip.compress(json.dumps(dict(version=1,tracks=records,boundary='Numeric channels preserved without assigning unverified renderer meanings. Raw frames require the associated source animation frame size.'),separators=(',',':')).encode(),mtime=0));index[r['key']]=dict(url=url,count=len(records))
 result=dict(version=1,bundles=index,stats=dict(bundles=len(index),tracks=total,types=types,rejected=len(errors)),errors=errors,evidence=['output/rea-naruto/ghidra/full-export/main-final/functions/14137d/14137d500.c','output/rea-naruto/ghidra/full-export/main-final/functions/141380/141380520.c'])
 (DEST/'post-curves-index.json').write_text(json.dumps(result,separators=(',',':')));print(json.dumps(result['stats'],indent=2))
if __name__=='__main__':main()
