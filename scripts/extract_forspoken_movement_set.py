"""One bounded streaming pass for movement packs and their source graph/custom data."""
import ctypes,ctypes.util,hashlib,json,struct,zipfile
from pathlib import Path
from inspect_forspoken_archive import ARCHIVE,OUT
from extract_forspoken_asset import decode_lz4

def selected_ranges(member,entries,max_prefix_bytes=4*1024**3):
 if not entries:return {}
 entries=sorted(entries,key=lambda e:e['offset']);end=max(e['offset']+e['stored'] for e in entries)
 if end>max_prefix_bytes or sum(e['stored'] for e in entries)>64*1024**2:raise ValueError('Selected extraction budget exceeded')
 class In(ctypes.Structure):_fields_=[('src',ctypes.c_void_p),('size',ctypes.c_size_t),('pos',ctypes.c_size_t)]
 class OutBuffer(ctypes.Structure):_fields_=[('dst',ctypes.c_void_p),('size',ctypes.c_size_t),('pos',ctypes.c_size_t)]
 lib=ctypes.CDLL(ctypes.util.find_library('zstd'));lib.ZSTD_createDStream.restype=ctypes.c_void_p;lib.ZSTD_initDStream.argtypes=[ctypes.c_void_p];lib.ZSTD_initDStream.restype=ctypes.c_size_t;lib.ZSTD_decompressStream.argtypes=[ctypes.c_void_p,ctypes.POINTER(OutBuffer),ctypes.POINTER(In)];lib.ZSTD_decompressStream.restype=ctypes.c_size_t;lib.ZSTD_isError.argtypes=[ctypes.c_size_t];lib.ZSTD_isError.restype=ctypes.c_uint;lib.ZSTD_freeDStream.argtypes=[ctypes.c_void_p]
 buffers={e['entry']:bytearray() for e in entries};stream=lib.ZSTD_createDStream()
 try:
  if lib.ZSTD_isError(lib.ZSTD_initDStream(stream)):raise ValueError('ZSTD init failed')
  with zipfile.ZipFile(ARCHIVE) as z:
   row=z.getinfo(member)
   if row.compress_type!=93 or end>row.file_size:raise ValueError('Unsupported member/range')
   with ARCHIVE.open('rb') as f:
    f.seek(row.header_offset);h=f.read(30)
    if h[:4]!=b'PK\x03\x04':raise ValueError('Invalid local header')
    nl,el=struct.unpack_from('<HH',h,26);f.seek(nl+el,1);remaining=row.compress_size;total=cursor=0
    while total<end and remaining:
     raw=f.read(min(1024*1024,remaining))
     if not raw:raise ValueError('Truncated compressed member')
     remaining-=len(raw);src=ctypes.create_string_buffer(raw);ib=In(ctypes.cast(src,ctypes.c_void_p),len(raw),0)
     while ib.pos<ib.size and total<end:
      dst=ctypes.create_string_buffer(min(1024*1024,end-total));ob=OutBuffer(ctypes.cast(dst,ctypes.c_void_p),len(dst),0);before=ib.pos;hint=lib.ZSTD_decompressStream(stream,ctypes.byref(ob),ctypes.byref(ib))
      if lib.ZSTD_isError(hint):raise ValueError('ZSTD streaming decode failed')
      if ib.pos==before and not ob.pos:raise ValueError('ZSTD stream made no progress')
      stop=total+ob.pos
      while cursor<len(entries) and entries[cursor]['offset']+entries[cursor]['stored']<=total:cursor+=1
      i=cursor
      while i<len(entries) and entries[i]['offset']<stop:
       e=entries[i];lo=max(total,e['offset']);hi=min(stop,e['offset']+e['stored'])
       if hi>lo:buffers[e['entry']].extend(dst.raw[lo-total:hi-total])
       i+=1
      total=stop
  for e in entries:
   if len(buffers[e['entry']])!=e['stored']:raise ValueError('Selected asset is truncated')
  return buffers
 finally:lib.ZSTD_freeDStream(stream)

def main():
 entries=json.loads((OUT/'c000_001-index.json').read_text());selected=[]
 for e in entries:
  if not e['size'] or e['offset']+e['stored']>4*1024**3:continue
  p=e['path']
  if '/hu000/anim/' not in p:continue
  if (p.endswith('.pka') and ('/mode/' in p or p.endswith('/active/ability.pka'))) or p.endswith('/hu000_root.anmgph') or p.endswith('.customdata'):selected.append(e)
 target=OUT/'movement-assets';target.mkdir(exist_ok=True);plan={'archive':str(ARCHIVE),'member':'FORSPOKEN/datas/c000_001.earc','entries':selected,'storedBytes':sum(e['stored'] for e in selected),'decodedBytes':sum(e['size'] for e in selected),'zipWholeMemberCrcVerified':False,'executed':False};(target/'extraction-plan.json').write_text(json.dumps(plan,indent=2));raws=selected_ranges(plan['member'],selected);records=[]
 for e in selected:
  raw=bytes(raws[e['entry']]);b=decode_lz4(raw,e['size']) if raw[:4]==b'\x04\x22\x4d\x18' else raw
  if len(b)!=e['size']:raise ValueError('Unsupported inner codec/size')
  p=target/(str(e['entry'])+'-'+Path(e['path']).name)
  if p.exists() and p.read_bytes()!=b:raise ValueError('Immutable output collision')
  p.write_bytes(b);records.append({**e,'output':str(p),'sha256':hashlib.sha256(b).hexdigest(),'storedSha256':hashlib.sha256(raw).hexdigest()})
 (target/'manifest.json').write_text(json.dumps({**plan,'entries':records},indent=2));print('Recovered',len(records),'movement/config assets,',sum(e['size'] for e in records),'decoded bytes')
if __name__=='__main__':main()
