import unittest
from recover_minato_light_override import build
class LightTest(unittest.TestCase):
 def test_sign_and_scope(self):
  r=build();self.assertEqual(r['signMask']['u32'],0x80000000);self.assertEqual(r['renderState']['directionBytes'],12);self.assertEqual(r['bodyBinding']['status'],'GPU upload attribution unresolved');self.assertEqual(r['bodyBinding']['bufferOffset'],112)
if __name__=='__main__':unittest.main()
