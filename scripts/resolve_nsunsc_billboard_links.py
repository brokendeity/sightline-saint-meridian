"""Resolve original billboard model indices without the legacy channel parser."""
import json,gzip,ctypes,hashlib,concurrent.futures
from extract_nsunsc_library import ROOT,OUT,DEST,read_xfbin
from nsunsc_chunk_references import chunk_index,resolve_reference,source_identity
from xfbin.structure.nucc import NuccChunkBillboard
from xfbin.structure.br.br_nucc import BrNuccChunkBillboard,BrNuccChunk
BrNuccChunkBillboard.init_data=BrNuccChunk.init_data
def context(self,chunk,chunk_list,chunk_indices,chunk_refs,initial_chunks):
 self.data=chunk.data;self.chunks=initial_chunks;self.has_data=True
NuccChunkBillboard.init_data=context

def resolve(key):
 try:
  r=json.loads((DEST/key/'index.json').read_text());p=DEST/key/'billboards.json.gz';data=json.loads(gzip.decompress(p.read_bytes()))
  if data.get('referenceSchemaVersion')==4 and data.get('referenceSourceSha256')==r['sha256']:return dict(bundle=key,cached=True,linked=sum(x.get('modelReference',{}).get('status')=='resolved' for x in data['records']))
  lib=ctypes.CDLL(str(OUT.parent/'full-library/decode.dylib'));lib.decode_nsunsc.argtypes=[ctypes.c_void_p,ctypes.c_size_t,ctypes.c_void_p,ctypes.c_size_t,ctypes.POINTER(ctypes.c_size_t)]
  with (ROOT/r['archive']).open('rb') as f:f.seek(r['offset']);raw=f.read(r['stored_bytes'])
  buf=ctypes.create_string_buffer(r['unpacked_bytes']);size=ctypes.c_size_t();assert lib.decode_nsunsc(raw,len(raw),buf,len(buf),ctypes.byref(size))==0 and size.value==r['unpacked_bytes']
  assert hashlib.sha256(buf.raw[:size.value]).hexdigest()==r['sha256']
  obj=read_xfbin(bytearray(buf.raw[:size.value]));chunks=[c for page in obj.pages for c in page.chunks if isinstance(c,NuccChunkBillboard)];byIdentity=chunk_index(chunks)
  linked=0
  for record in data['records']:
   candidates=byIdentity.get((record['name'],record['sha256']),[]);ref=resolve_reference(candidates,record['modelIndex']);record['modelReference']=ref;record['sourceReference']=source_identity(candidates)
   if ref['status']=='resolved':linked+=1
  data['referenceSchemaVersion']=4;data['referenceSourceSha256']=r['sha256'];p.write_bytes(gzip.compress(json.dumps(data,separators=(',',':')).encode(),mtime=0));return dict(bundle=key,linked=linked,unresolved=len(data['records'])-linked)
 except Exception as e:return dict(bundle=key,error=f'{type(e).__name__}: {e}')
if __name__=='__main__':
 index=json.loads((DEST/'billboards-index.json').read_text());rows=[]
 with concurrent.futures.ProcessPoolExecutor(max_workers=4) as pool:
  for row in pool.map(resolve,index['bundles']):
   rows.append(row)
   if len(rows)%25==0:print(len(rows),flush=True)
 report=dict(rows=rows,linked=sum(x.get('linked',0) for x in rows),unresolved=sum(x.get('unresolved',0) for x in rows),errors=sum('error' in x for x in rows));(DEST/'billboard-links-report.json').write_text(json.dumps(report,indent=2));print(json.dumps({k:v for k,v in report.items() if k!='rows'}),flush=True)
