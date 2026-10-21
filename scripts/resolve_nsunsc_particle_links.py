"""Resolve particle A records through their original page-local XFBIN chunk tables."""
import json,gzip,ctypes,hashlib,concurrent.futures
from pathlib import Path
from nsunsc_chunk_references import chunk_index,resolve_reference
from extract_nsunsc_library import ROOT,OUT,DEST,read_xfbin

def resolve(meta):
 try:
  r=json.loads((DEST/meta/'index.json').read_text());p=DEST/meta/'particle-sections.json.gz';data=json.loads(gzip.decompress(p.read_bytes()));
  if data.get('referenceSchemaVersion')==2 and data.get('referenceSourceSha256')==r['sha256']:
   refs=[x for record in data['records'] for x in record.get('references',[])];return dict(bundle=meta,linked=sum(x['status']=='resolved' for x in refs),unresolved=sum(x['status']!='resolved' for x in refs),cached=True)
  lib=ctypes.CDLL(str(OUT.parent/'full-library/decode.dylib'));lib.decode_nsunsc.argtypes=[ctypes.c_void_p,ctypes.c_size_t,ctypes.c_void_p,ctypes.c_size_t,ctypes.POINTER(ctypes.c_size_t)]
  with (ROOT/r['archive']).open('rb') as f:f.seek(r['offset']);raw=f.read(r['stored_bytes'])
  buf=ctypes.create_string_buffer(r['unpacked_bytes']);size=ctypes.c_size_t();assert lib.decode_nsunsc(raw,len(raw),buf,len(buf),ctypes.byref(size))==0 and size.value==r['unpacked_bytes']
  obj=read_xfbin(bytearray(buf.raw[:size.value]));chunks=[c for p in obj.pages for c in p.chunks if type(c).__name__=='NuccChunkParticle'];byIdentity=chunk_index(chunks)
  p=DEST/meta/'particle-sections.json.gz';data=json.loads(gzip.decompress(p.read_bytes()));linked=unresolved=0
  for record in data['records']:
   candidates=byIdentity.get((record['name'],record['sha256']),[]);refs=[]
   for index in record['sections'][0].get('chunkRefIndices',[]):
    ref=resolve_reference(candidates,index);refs.append(ref)
    if ref['status']=='resolved':linked+=1
    else:unresolved+=1
   record['references']=refs
  data['referenceSchemaVersion']=2;data['referenceSourceSha256']=r['sha256'];data['referenceEvidence']='Page-local chunk lookup; target identity resolved, emitter execution semantics unverified.';p.write_bytes(gzip.compress(json.dumps(data,separators=(',',':')).encode(),mtime=0));return dict(bundle=meta,linked=linked,unresolved=unresolved)
 except Exception as e:return dict(bundle=meta,error=f'{type(e).__name__}: {e}')
if __name__=='__main__':
 import argparse
 ap=argparse.ArgumentParser();ap.add_argument('--probe',action='store_true');args=ap.parse_args();index=json.loads((DEST/'particle-sections-index.json').read_text());keys=list(index['bundles'])
 if args.probe:keys=['c426d45069048ff1a4d4','c5fa8247ee6d9495a0fc']
 rows=[]
 with concurrent.futures.ProcessPoolExecutor(max_workers=4) as pool:
  for r in pool.map(resolve,keys):
   rows.append(r)
   if len(rows)%25==0:print(len(rows),'/',len(keys),flush=True)
 (DEST/('particle-links-probe.json' if args.probe else 'particle-links-report.json')).write_text(json.dumps(dict(rows=rows,linked=sum(x.get('linked',0) for x in rows),unresolved=sum(x.get('unresolved',0) for x in rows),errors=sum('error' in x for x in rows)),indent=2));print(json.dumps(rows[:2]),flush=True)
