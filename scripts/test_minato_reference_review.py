import unittest,json,hashlib
from pathlib import Path
from build_minato_reference_review import build,OUT
class ReferenceReview(unittest.TestCase):
 def test_alignment_and_limits(self):
  r=build();self.assertFalse(r['verification']['verified']);self.assertFalse(r['verification']['exactBuildMatched']);self.assertIsNone(r['verification']['referenceFileSha256']);a=r['alignment'];self.assertLess(a['interval'][1]-a['interval'][0],1/60);self.assertTrue(a['interval'][0]<=a['sourceZeroVideoSeconds']<=a['interval'][1]);self.assertEqual(len(a['cutBrackets']),3)
  for c in a['cutBrackets']:self.assertLess(c['videoBefore'],a['sourceZeroVideoSeconds']+c['sourceSeconds']);self.assertGreater(c['videoAfter'],a['sourceZeroVideoSeconds']+c['sourceSeconds'])
 def test_provenance_and_bookmarks(self):
  r=build();p=OUT/'minato-source-shot-index.json';self.assertEqual(hashlib.sha256(p.read_bytes()).hexdigest(),r['sourceEvidence']['shotIndexSha256']);self.assertEqual(len(r['bookmarks']),10);self.assertEqual(len({s['id'] for s in r['bookmarks']}),10)
  for s in r['bookmarks']:self.assertAlmostEqual(s['videoSeconds']-s['sourceSeconds'],793.8);self.assertTrue(s['url'].startswith(r['url']+'&t='));self.assertGreaterEqual(s['sourceSeconds'],0);self.assertLess(s['sourceSeconds'],46/3)
  self.assertEqual(len(r['mismatches']),6);self.assertTrue(all(m['required'] for m in r['mismatches']))
if __name__=='__main__':unittest.main()
