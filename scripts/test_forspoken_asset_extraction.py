import ctypes,ctypes.util,unittest
from extract_forspoken_asset import decode_lz4
class TestAssetFrame(unittest.TestCase):
 def test_checked_lz4_roundtrip(self):
  lib=ctypes.CDLL(ctypes.util.find_library('lz4'))
  lib.LZ4F_compressFrameBound.argtypes=[ctypes.c_size_t,ctypes.c_void_p];lib.LZ4F_compressFrameBound.restype=ctypes.c_size_t
  lib.LZ4F_compressFrame.argtypes=[ctypes.c_void_p,ctypes.c_size_t,ctypes.c_void_p,ctypes.c_size_t,ctypes.c_void_p];lib.LZ4F_compressFrame.restype=ctypes.c_size_t
  src=b'bounded original asset frame test'*100;out=ctypes.create_string_buffer(lib.LZ4F_compressFrameBound(len(src),None));n=lib.LZ4F_compressFrame(out,len(out),src,len(src),None);raw=out.raw[:n]
  self.assertEqual(decode_lz4(raw,len(src)),src)
  for bad,size in [(raw[:-1],len(src)),(raw,len(src)-1),(raw,len(src)+1),(raw+b'x',len(src)),(b'garbage',100)]:
   with self.assertRaises(ValueError):decode_lz4(bad,size)
 def test_budget(self):
  for n in [0,-1,100*1024*1024]:
   with self.assertRaises(ValueError):decode_lz4(b'',n)
if __name__=='__main__':unittest.main()
