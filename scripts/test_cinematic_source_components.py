import unittest,struct
from recover_cinematic_source_components import action_rows,dxbc,OUT
class Recovery(unittest.TestCase):
 def test_actions(self):
  b=next((OUT/'64b73d61b3185c10fe96').glob('raw-f1e4*')).read_bytes();rows=action_rows(b)
  self.assertEqual(len(rows),7);self.assertEqual(sum(len(r['commands']) for r in rows),69)
  self.assertEqual(rows[3]['timeline'],'3mntspl1_atk')
  self.assertTrue(any(c.get('extensionName')=='SPSKILL_END' for c in rows[3]['commands']))
  for bad in [b[:-1],b[:100],b'xxxx'+b[4:]]:
   with self.assertRaises(ValueError):action_rows(bad)
 def test_shaders(self):
  blobs=list((OUT/'original-shaders').glob('*.dxbc'));self.assertGreater(len(blobs),100)
  for p in blobs:
   b=p.read_bytes();size,chunks=dxbc(b,0);self.assertEqual(size,len(b));self.assertTrue(chunks)
  b=bytearray(blobs[0].read_bytes());struct.pack_into('<I',b,24,len(b)+1)
  with self.assertRaises(ValueError):dxbc(b,0)
  struct.pack_into('<I',b,24,len(b));struct.pack_into('<I',b,32,len(b))
  with self.assertRaises(ValueError):dxbc(b,0)
if __name__=='__main__':unittest.main()
