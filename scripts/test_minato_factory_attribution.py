import unittest
from recover_minato_factory_attribution import build
class FactoryTest(unittest.TestCase):
 def test_minato_paths(self):
  r=build();self.assertEqual(len(r['table']),82);self.assertFalse(any(x['key']==109 for x in r['table']))
  self.assertEqual(r['otherwise']['className'],'ccPlayerMain');self.assertEqual(r['modeCondition']['value'],26)
  self.assertEqual(r['specialCase']['className'],'ccPlayerMainReliveStory');self.assertEqual(r['excludedAttribution']['tableKey'],45)
if __name__=='__main__':unittest.main()
