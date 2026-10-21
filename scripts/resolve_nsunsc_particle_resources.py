"""Resolve section-B resource references and one-based generator associations.
Evidence: 141320290 source lookup, 141276690 generator construction.
"""
import json,gzip,ctypes,hashlib,struct,concurrent.futures,collections
from nsunsc_chunk_references import chunk_index,resolve_reference
from extract_nsunsc_library import ROOT,OUT,DEST,read_xfbin
BASE=DEST.parents[1]
def resource_indices(raw,record):
 s=record['sections'][1]
 if s['recordBytes']!=32:raise ValueError('unsupported B stride')
 rows=[]
 for i in range(s['count']):
  pos=s['start']+i*32
  if pos+32>s['end'] or pos+32>len(raw):raise ValueError('resource outside section')
  index,generator=struct.unpack_from('>II',raw,pos)
  rows.append(dict(row=i,index=index,generatorId=generator,generatorIndex=generator-1 if 1<=generator<=record['sections'][0]['count'] else None))
 return rows

def resolve(key):
 try:
  r=json.loads((DEST/key/'index.json').read_text());p=DEST/key/'particle-sections.json.gz';data=json.loads(gzip.decompress(p.read_bytes()))
  if data.get('resourceReferenceSchema')==2 and data.get('resourceReferenceSourceSha256')==r['sha256']:
   rows=[x for record in data['records'] for x in record.get('resources',[])];return summary(key,rows,True)
  lib=ctypes.CDLL(str(OUT.parent/'full-library/decode.dylib'));lib.decode_nsunsc.argtypes=[ctypes.c_void_p,ctypes.c_size_t,ctypes.c_void_p,ctypes.c_size_t,ctypes.POINTER(ctypes.c_size_t)]
  with (ROOT/r['archive']).open('rb') as f:f.seek(r['offset']);raw=f.read(r['stored_bytes'])
  buf=ctypes.create_string_buffer(r['unpacked_bytes']);size=ctypes.c_size_t();assert lib.decode_nsunsc(raw,len(raw),buf,len(buf),ctypes.byref(size))==0 and size.value==r['unpacked_bytes'];assert hashlib.sha256(buf.raw[:size.value]).hexdigest()==r['sha256']
  obj=read_xfbin(bytearray(buf.raw[:size.value]));chunks=[c for page in obj.pages for c in page.chunks if type(c).__name__=='NuccChunkParticle'];byIdentity=chunk_index(chunks);rows=[]
  for record in data['records']:
   candidates=byIdentity.get((record['name'],record['sha256']),[]);raw=(BASE/record['rawUrl']).read_bytes();assert hashlib.sha256(raw).hexdigest()==record['sha256'];record['resources']=resource_indices(raw,record)
   for row in record['resources']:
    ref=resolve_reference(candidates,row['index'])
    row['reference']=ref;rows.append(row)
  data['resourceReferenceSchema']=2;data['resourceReferenceSourceSha256']=r['sha256'];data['resourceReferenceEvidence']='141320290 page-local B source lookup; 141276690 B generatorId compared with one-based A loop counter';p.write_bytes(gzip.compress(json.dumps(data,separators=(',',':')).encode(),mtime=0));return summary(key,rows,False)
 except Exception as e:return dict(bundle=key,error=f'{type(e).__name__}: {e}')
def summary(key,rows,cached):
 return dict(bundle=key,resources=len(rows),linked=sum(x['reference']['status']=='resolved' for x in rows),unresolved=sum(x['reference']['status']!='resolved' for x in rows),invalidGenerator=sum(x['generatorIndex'] is None for x in rows),types=dict(collections.Counter(x['reference'].get('type','unresolved') for x in rows)),cached=cached)
if __name__=='__main__':
 import argparse
 ap=argparse.ArgumentParser();ap.add_argument('--probe',action='store_true');args=ap.parse_args();keys=list(json.loads((DEST/'particle-sections-index.json').read_text())['bundles']);keys=['000520679ef1b9a7264d','c426d45069048ff1a4d4','c5fa8247ee6d9495a0fc'] if args.probe else keys;rows=[]
 with concurrent.futures.ProcessPoolExecutor(max_workers=4) as pool:
  for row in pool.map(resolve,keys):
   rows.append(row)
   if len(rows)%25==0:print(len(rows),'/',len(keys),flush=True)
 types=collections.Counter()
 for row in rows:types.update(row.get('types',{}))
 report=dict(rows=rows,**{key:sum(x.get(key,0) for x in rows) for key in ['resources','linked','unresolved','invalidGenerator']},types=dict(types),errors=sum('error' in x for x in rows));(DEST/('particle-resources-probe.json' if args.probe else 'particle-resources-report.json')).write_text(json.dumps(report,indent=2));print(json.dumps({k:v for k,v in report.items() if k!='rows'}),flush=True)
