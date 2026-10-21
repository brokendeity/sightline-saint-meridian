"""Selectively recover one indexed, bounded asset. Never runs game code."""
import argparse,ctypes,ctypes.util,hashlib,json
from pathlib import Path
from inspect_forspoken_archive import read_member_range,OUT

def decode_lz4(raw,expected):
 if not 0<expected<=64*1024*1024:raise ValueError('Decoded asset exceeds budget')
 lib=ctypes.CDLL(ctypes.util.find_library('lz4'));ctx=ctypes.c_void_p()
 lib.LZ4F_createDecompressionContext.argtypes=[ctypes.POINTER(ctypes.c_void_p),ctypes.c_uint];lib.LZ4F_createDecompressionContext.restype=ctypes.c_size_t
 lib.LZ4F_decompress.argtypes=[ctypes.c_void_p,ctypes.c_void_p,ctypes.POINTER(ctypes.c_size_t),ctypes.c_void_p,ctypes.POINTER(ctypes.c_size_t),ctypes.c_void_p];lib.LZ4F_decompress.restype=ctypes.c_size_t
 lib.LZ4F_isError.argtypes=[ctypes.c_size_t];lib.LZ4F_isError.restype=ctypes.c_uint
 lib.LZ4F_freeDecompressionContext.argtypes=[ctypes.c_void_p]
 if lib.LZ4F_isError(lib.LZ4F_createDecompressionContext(ctypes.byref(ctx),100)):raise ValueError('LZ4 init failed')
 src=ctypes.create_string_buffer(raw);dst=ctypes.create_string_buffer(expected);si=di=0
 try:
  while True:
   sn=ctypes.c_size_t(len(raw)-si);dn=ctypes.c_size_t(expected-di)
   hint=lib.LZ4F_decompress(ctx,ctypes.byref(dst,di),ctypes.byref(dn),ctypes.byref(src,si),ctypes.byref(sn),None)
   if lib.LZ4F_isError(hint):raise ValueError('LZ4 decode failed')
   si+=sn.value;di+=dn.value
   if hint==0:break
   if not sn.value and not dn.value:raise ValueError('Truncated or oversized LZ4 stream')
  if di!=expected or si!=len(raw):raise ValueError('LZ4 length/consumption mismatch')
  return dst.raw
 finally:lib.LZ4F_freeDecompressionContext(ctx)

def extract(path,name):
 entries=json.loads((OUT/'c000_001-index.json').read_text());matches=[x for x in entries if x['path']==path and x['size']>0]
 if len(matches)!=1:raise ValueError('Asset identity ambiguous/missing')
 e=matches[0];raw=read_member_range('FORSPOKEN/datas/c000_001.earc',e['offset'],e['stored']);b=decode_lz4(raw,e['size'])
 target=OUT/name
 if target.exists() and target.read_bytes()!=b:raise ValueError('Refusing to overwrite different asset')
 target.write_bytes(b);proof={**e,'decodedSha256':hashlib.sha256(b).hexdigest(),'storedSha256':hashlib.sha256(raw).hexdigest(),'decodedSizeVerified':True,'zipWholeMemberCrcVerified':False,'executed':False}
 target.with_suffix(target.suffix+'.provenance.json').write_text(json.dumps(proof,indent=2));print(target)
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('path');p.add_argument('name');a=p.parse_args()
 if Path(a.name).name!=a.name:raise ValueError('Output must be a basename')
 extract(a.path,a.name)
