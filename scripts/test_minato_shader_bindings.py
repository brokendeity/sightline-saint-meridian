import unittest
from recover_minato_shader_bindings import build,reflect
class BindingTest(unittest.TestCase):
 def test_source_contracts(self):
  data=build();self.assertEqual(len(data['programs']),26)
  pixel=next(p for p in data['programs'] if p['selector']==0xf00a and p['stage']=='pixel')
  buf=pixel['constantBuffers'][0];self.assertEqual(buf['bytes'],528)
  self.assertEqual(next(x for x in buf['variables'] if x['name']=='g_commonParam')['offset'],0)
  self.assertTrue(all(v['defaultHex'] is None for v in buf['variables']))
  self.assertEqual([s['register'] for s in pixel['OSGN']],[0,1,2])
  vertex=next(p for p in data['programs'] if p['selector']==0xf00a and p['stage']=='vertex')
  self.assertEqual(len(vertex['ISGN']),4)
 def test_bad_signature(self):
  import struct
  from recover_minato_shader_bindings import signatures
  with self.assertRaises(ValueError):signatures(struct.pack('<2I',1,8))
if __name__=='__main__':unittest.main()
