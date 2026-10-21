import unittest
from source_minato_evidence import build
class EvidenceTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls): cls.data=build()
 def test_source_is_pinned(self):
  self.assertEqual(self.data['source']['sha256'],'dff90e64f02199e14e4a87bfac6e95a0b3748d760b0d3a23db49e975299c9971')
  self.assertEqual(len(self.data['evidence']),9)
 def test_not_a_silent_original_playlist(self):
  self.assertFalse(self.data['executableOriginal']);self.assertFalse(self.data['verified'])
  self.assertNotIn('phases',self.data)
  self.assertIn('NOT the full Minato',self.data['recoveredSubmachine']['scope'])
 def test_timeline_facts(self):
  rows={a['name']:a for a in self.data['timelines']}
  self.assertEqual(rows['3mntspl1_atk']['durationTicks'],46000)
  self.assertEqual(rows['3mntspl1_atk']['durationTicks'],rows['3mntspl1_dmg']['durationTicks'])
  self.assertFalse(any(9 in a['formats'] for a in rows.values()))
 def test_real_submachine_retains_predicates(self):
  rows=self.data['recoveredSubmachine']['states'];self.assertEqual([r['state'] for r in rows],list(range(7)))
  self.assertIn('FUN_140ac9870',rows[2]['guard']);self.assertIsNone(rows[6]['next'])
 def test_gate_remains_closed(self):
  self.assertIn('reference',[r['component'] for r in self.data['blockers']])
  self.assertGreaterEqual(len(self.data['prohibitedFallbacks']),4)
if __name__=='__main__': unittest.main()
