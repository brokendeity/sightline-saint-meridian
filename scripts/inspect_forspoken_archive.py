"""Bounded read-only ZIP member extraction. Never executes archived programs."""
from pathlib import Path
import ctypes,ctypes.util,hashlib,json,struct,zlib,zipfile
ROOT=Path(__file__).resolve().parents[1];ARCHIVE=ROOT/'FORSPOKEN-AnkerGames.zip';OUT=ROOT/'output/rea-forspoken'
def read_member(name,max_bytes=160*1024*1024):
 with zipfile.ZipFile(ARCHIVE) as z:
  row=z.getinfo(name)
  if row.file_size>max_bytes or row.compress_size>max_bytes:raise ValueError('Member exceeds selected extraction budget')
  with ARCHIVE.open('rb') as f:
   f.seek(row.header_offset);h=f.read(30)
   if h[:4]!=b'PK\x03\x04':raise ValueError('Invalid local ZIP header')
   nl,el=struct.unpack_from('<HH',h,26);f.seek(nl+el,1);raw=f.read(row.compress_size)
  if row.compress_type==0:decoded=raw
  elif row.compress_type==8:decoded=zlib.decompress(raw,-15)
  elif row.compress_type==93:
   lib=ctypes.CDLL(ctypes.util.find_library('zstd'));lib.ZSTD_decompress.argtypes=[ctypes.c_void_p,ctypes.c_size_t,ctypes.c_void_p,ctypes.c_size_t];lib.ZSTD_decompress.restype=ctypes.c_size_t;lib.ZSTD_isError.argtypes=[ctypes.c_size_t];lib.ZSTD_isError.restype=ctypes.c_uint
   target=ctypes.create_string_buffer(row.file_size);n=lib.ZSTD_decompress(target,len(target),raw,len(raw))
   if lib.ZSTD_isError(n):raise ValueError('ZSTD decode failed')
   decoded=target.raw[:n]
  else:raise ValueError('Unsupported ZIP compression '+str(row.compress_type))
  if len(decoded)!=row.file_size or zlib.crc32(decoded)!=row.CRC:raise ValueError('Decoded member size/CRC mismatch')
  return decoded
if __name__=='__main__':
 OUT.mkdir(exist_ok=True);name='FORSPOKEN/FORSPOKEN.exe';b=read_member(name);p=OUT/'FORSPOKEN.exe';p.write_bytes(b)
 (OUT/'extraction.json').write_text(json.dumps(dict(archive=str(ARCHIVE),member=name,bytes=len(b),sha256=hashlib.sha256(b).hexdigest(),zipCrcVerified=True,executed=False),indent=2));print(p)

def read_member_range(name,start,length):
 """Decode only a bounded prefix. Full-member CRC is intentionally not claimed."""
 if start<0 or length<0 or length>64*1024*1024 or start+length>4*1024**3:raise ValueError('Range exceeds selected budget')
 limit=start+length
 class In(ctypes.Structure):_fields_=[('src',ctypes.c_void_p),('size',ctypes.c_size_t),('pos',ctypes.c_size_t)]
 class Out(ctypes.Structure):_fields_=[('dst',ctypes.c_void_p),('size',ctypes.c_size_t),('pos',ctypes.c_size_t)]
 with zipfile.ZipFile(ARCHIVE) as z:
  row=z.getinfo(name)
  with ARCHIVE.open('rb') as f:
   f.seek(row.header_offset);h=f.read(30);nl,el=struct.unpack_from('<HH',h,26);f.seek(nl+el,1)
   if row.compress_type==0:f.seek(start,1);return f.read(min(length,max(0,row.file_size-start)))
   if row.compress_type!=93:raise ValueError('Prefix reader requires stored/ZSTD member')
   lib=ctypes.CDLL(ctypes.util.find_library('zstd'));lib.ZSTD_createDStream.restype=ctypes.c_void_p;lib.ZSTD_initDStream.argtypes=[ctypes.c_void_p];lib.ZSTD_freeDStream.argtypes=[ctypes.c_void_p];lib.ZSTD_decompressStream.argtypes=[ctypes.c_void_p,ctypes.POINTER(Out),ctypes.POINTER(In)];lib.ZSTD_decompressStream.restype=ctypes.c_size_t;lib.ZSTD_isError.argtypes=[ctypes.c_size_t];lib.ZSTD_isError.restype=ctypes.c_uint
   stream=lib.ZSTD_createDStream();lib.ZSTD_initDStream(stream);chunks=[];total=0;remaining=row.compress_size
   try:
    while total<limit and remaining:
     raw=f.read(min(131072,remaining));remaining-=len(raw);src=ctypes.create_string_buffer(raw);ib=In(ctypes.cast(src,ctypes.c_void_p),len(raw),0)
     while ib.pos<ib.size and total<limit:
      dst=ctypes.create_string_buffer(min(131072,limit-total));ob=Out(ctypes.cast(dst,ctypes.c_void_p),len(dst),0);n=lib.ZSTD_decompressStream(stream,ctypes.byref(ob),ctypes.byref(ib))
      if lib.ZSTD_isError(n):raise ValueError('ZSTD prefix decode failed')
      begin=max(0,start-total);finish=min(ob.pos,limit-total)
      if finish>begin:chunks.append(dst.raw[begin:finish])
      total+=ob.pos
    return b''.join(chunks)
   finally:lib.ZSTD_freeDStream(stream)

def read_member_prefix(name,limit=8*1024*1024):return read_member_range(name,0,limit)
