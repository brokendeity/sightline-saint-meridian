"""Preserve exact source ANM coordinate aliases and cross-clump parent indices.
Reads archives only. This metadata restores identities omitted by scene schema 1;
it does not infer unknown particle simulation, camera composition, or shaders.
"""
import argparse,ctypes,gzip,hashlib,json,concurrent.futures
from extract_nsunsc_library import ROOT,OUT,DEST,read_xfbin

def describe_animation(a):
 ids={id(b):(i,j) for i,c in enumerate(a.clumps) for j,b in enumerate(c.bones)}
 return dict(name=a.name,sha256=hashlib.sha256(a.data).hexdigest(),clumps=[dict(name=c.name,reference=c.referenced_name,path=getattr(c.chunk,'filePath',''),bones=[dict(name=b.name,reference=b.referenced_name,path=getattr(b.chunk,'filePath',''),parent=list(ids[id(b.parent)]) if id(b.parent) in ids else None) for b in c.bones]) for c in a.clumps])

def extract(key):
 try:
  r=json.loads((DEST/key/'index.json').read_text());path=DEST/key/'anm-bindings.json.gz'
  if path.exists():
   prior=json.loads(gzip.decompress(path.read_bytes()))
   if prior.get('sourceSha256')==r['sha256']:return dict(bundle=key,url=f'assets/nsunsc-library/{key}/anm-bindings.json.gz',animations=len(prior['animations']),cached=True)
  lib=ctypes.CDLL(str(OUT.parent/'full-library/decode.dylib'));lib.decode_nsunsc.argtypes=[ctypes.c_void_p,ctypes.c_size_t,ctypes.c_void_p,ctypes.c_size_t,ctypes.POINTER(ctypes.c_size_t)]
  with (ROOT/r['archive']).open('rb') as f:f.seek(r['offset']);raw=f.read(r['stored_bytes'])
  buf=ctypes.create_string_buffer(r['unpacked_bytes']);size=ctypes.c_size_t();assert lib.decode_nsunsc(raw,len(raw),buf,len(buf),ctypes.byref(size))==0 and size.value==r['unpacked_bytes'];assert hashlib.sha256(buf.raw[:size.value]).hexdigest()==r['sha256']
  obj=read_xfbin(bytearray(buf.raw[:size.value]));rows=[describe_animation(c) for p in obj.pages for c in p.chunks if type(c).__name__=='NuccChunkAnm' and getattr(c,'has_data',False)]
  path.write_bytes(gzip.compress(json.dumps(dict(schemaVersion=1,sourceSha256=r['sha256'],animations=rows,boundary='Exact parsed source coordinate-parent links and reference aliases; no runtime target execution.'),separators=(',',':')).encode(),mtime=0))
  return dict(bundle=key,url=f'assets/nsunsc-library/{key}/anm-bindings.json.gz',animations=len(rows),crossClumpParents=sum(b['parent'] is not None and b['parent'][0]!=i for a in rows for i,c in enumerate(a['clumps']) for b in c['bones']))
 except Exception as e:return dict(bundle=key,error=f'{type(e).__name__}: {e}')
if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('keys',nargs='*');ap.add_argument('--all',action='store_true');ap.add_argument('--cinematics',action='store_true');ap.add_argument('--workers',type=int,default=4);args=ap.parse_args()
 keys=sorted(p.parent.name for p in DEST.glob('*/index.json')) if args.all else args.keys
 if args.cinematics:
  catalog=json.loads((DEST.parents[0]/'motion-library/catalog.json').read_text());keys=sorted({x['nativeBundle'] for x in catalog['clips'] if x.get('nativeBundle') and 'spl' in x.get('sourceAnimation',x.get('name','')) and x.get('sourceAnimation',x.get('name','')).endswith('_atk')})
 if not keys:ap.error('Provide bundle keys or --all')
 with concurrent.futures.ProcessPoolExecutor(max_workers=args.workers) as pool:rows=list(pool.map(extract,keys))
 report=dict(bundles={r['bundle']:r for r in rows if 'error' not in r},errors=[r for r in rows if 'error' in r]);(DEST/'anm-bindings-report.json').write_text(json.dumps(report,indent=2));index=dict(schemaVersion=1,bundles={p.parent.name:dict(url=f'assets/nsunsc-library/{p.parent.name}/anm-bindings.json.gz') for p in DEST.glob('*/anm-bindings.json.gz')});(DEST/'anm-bindings-index.json').write_text(json.dumps(index,separators=(',',':')));print(json.dumps(dict(bundles=len(report['bundles']),errors=report['errors'],indexed=len(index['bundles'])),indent=2))
