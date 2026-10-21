"""Decode source emitter attachment identities. Does not invent transforms or spawn offsets.
Evidence: 141320290,141276690,1413201b0,1413200c0,14131c560.
"""
import json,gzip,ctypes,hashlib,struct,concurrent.futures,collections,math
from nsunsc_chunk_references import chunk_index,resolve_reference
from extract_nsunsc_library import ROOT,OUT,DEST,read_xfbin
BASE=DEST.parents[1]
def attachment_indices(raw,record,sectionIndex=2):
 s=record['sections'][sectionIndex];stride=s['recordBytes'];expected=[48,56] if sectionIndex==2 else [96,112]
 if not s['count']:return []
 if stride not in expected:raise ValueError('unsupported attachment stride')
 rows=[];contextOffset=48 if sectionIndex==2 else 96
 for i in range(s['count']):
  pos=s['start']+i*stride
  if pos+stride>s['end'] or pos+stride>len(raw):raise ValueError('attachment outside section')
  index,generator,flags=struct.unpack_from('>III',raw,pos);direction=struct.unpack_from('>3f',raw,pos+16)
  if not all(math.isfinite(v) for v in direction):raise ValueError('nonfinite attachment direction')
  context=struct.unpack_from('>i',raw,pos+contextOffset)[0] if stride>contextOffset else -1
  rows.append(dict(row=i,index=index,generatorId=generator,generatorIndex=generator-1 if 1<=generator<=record['sections'][0]['count'] else None,direction=list(direction),positionListFlag=struct.unpack_from('>I',raw,pos+28)[0],directionTransformMode=struct.unpack_from('>I',raw,pos+32)[0],opaqueHeaderU32=flags,contextIndex=context,kind='positionAttachment' if sectionIndex==2 else 'forceFieldAttachment'))
 return rows

def resolve(key):
 try:
  r=json.loads((DEST/key/'index.json').read_text());out=DEST/key/'particle-attachments.json.gz'
  if out.exists():
   prior=json.loads(gzip.decompress(out.read_bytes()))
   if prior.get('schemaVersion')==1 and prior.get('sourceSha256')==r['sha256']:return summary(key,prior['records'],True)
  data=json.loads(gzip.decompress((DEST/key/'particle-sections.json.gz').read_bytes()))
  lib=ctypes.CDLL(str(OUT.parent/'full-library/decode.dylib'));lib.decode_nsunsc.argtypes=[ctypes.c_void_p,ctypes.c_size_t,ctypes.c_void_p,ctypes.c_size_t,ctypes.POINTER(ctypes.c_size_t)]
  with (ROOT/r['archive']).open('rb') as f:f.seek(r['offset']);raw=f.read(r['stored_bytes'])
  buf=ctypes.create_string_buffer(r['unpacked_bytes']);size=ctypes.c_size_t();assert lib.decode_nsunsc(raw,len(raw),buf,len(buf),ctypes.byref(size))==0 and size.value==r['unpacked_bytes'];assert hashlib.sha256(buf.raw[:size.value]).hexdigest()==r['sha256']
  obj=read_xfbin(bytearray(buf.raw[:size.value]));chunks=[c for page in obj.pages for c in page.chunks if type(c).__name__=='NuccChunkParticle'];byIdentity=chunk_index(chunks);records=[]
  for record in data['records']:
   candidates=byIdentity.get((record['name'],record['sha256']),[]);raw=(BASE/record['rawUrl']).read_bytes();assert hashlib.sha256(raw).hexdigest()==record['sha256'];rows=attachment_indices(raw,record)+attachment_indices(raw,record,3)
   for row in rows:
    row['reference']=resolve_reference(candidates,row['index']);row['contextReference']=resolve_reference(candidates,row['contextIndex']) if row['contextIndex']>=0 else None
   records.append(dict(name=record['name'],sha256=record['sha256'],attachments=rows))
  out.write_bytes(gzip.compress(json.dumps(dict(schemaVersion=1,sourceSha256=r['sha256'],records=records,evidence=['141320290','141276690','1413201b0','1413200c0','14131c560'],boundary='Direction is not position. Resolve exact coord and clump context to animated world transforms; no original random emission or force simulation reproduced.'),separators=(',',':')).encode(),mtime=0));return summary(key,records,False)
 except Exception as e:return dict(bundle=key,error=f'{type(e).__name__}: {e}')
def summary(key,records,cached):
 rows=[x for r in records for x in r['attachments']]
 return dict(bundle=key,records=len(records),attachments=len(rows),linked=sum(x['reference']['status']=='resolved' for x in rows),unresolved=sum(x['reference']['status']!='resolved' for x in rows),invalidGenerator=sum(x['generatorIndex'] is None for x in rows),cached=cached)
if __name__=='__main__':
 import argparse
 ap=argparse.ArgumentParser();ap.add_argument('--probe',action='store_true');args=ap.parse_args();keys=list(json.loads((DEST/'particle-sections-index.json').read_text())['bundles']);keys=['000520679ef1b9a7264d','c426d45069048ff1a4d4','c5fa8247ee6d9495a0fc'] if args.probe else keys;rows=[]
 with concurrent.futures.ProcessPoolExecutor(max_workers=4) as pool:
  for row in pool.map(resolve,keys):
   rows.append(row)
   if len(rows)%25==0:print(len(rows),'/',len(keys),flush=True)
 report=dict(version=1,bundles={x['bundle']:dict(url=f"assets/nsunsc-library/{x['bundle']}/particle-attachments.json.gz",count=x['records']) for x in rows if 'error' not in x},rows=rows,**{k:sum(x.get(k,0) for x in rows) for k in ['attachments','linked','unresolved','invalidGenerator']},errors=sum('error' in x for x in rows));(DEST/('particle-attachments-probe.json' if args.probe else 'particle-attachments-index.json')).write_text(json.dumps(report,indent=2));print(json.dumps({k:v for k,v in report.items() if k not in ['rows','bundles']}),flush=True)
