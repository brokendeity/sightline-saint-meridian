import unittest,json
from recover_nsunsc_audio_semantics import semantics,BASE
class Semantics(unittest.TestCase):
 def test_absolute_stop(self):
  e=dict(dispatchType=0.,rawFloat_60=1.,sourceFrame=15,rawI16_56=39,rawI16_58=20,rawFloat_34=.705,rawI16_32=0)
  s=semantics(e);self.assertEqual(s['stopSourceSeconds'],1.3);self.assertEqual(s['startSourceSeconds'],.5);self.assertAlmostEqual(s['fadeSeconds'],.6666600036621093)
 def test_voice_no_guessed_stop(self):
  e=dict(dispatchType=4.,rawFloat_60=8.,sourceFrame=0,rawI16_56=34,rawI16_58=0,rawFloat_34=1.,rawI16_32=0)
  self.assertIsNone(semantics(e)['stopSourceSeconds'])
 def test_pilot(self):
  m=json.loads((BASE/'assets/nsunsc-library/original-audio/minato3mntspl1-semantics.json').read_text());self.assertEqual(len(m['events']),63)
  self.assertEqual(sum(e['stopSourceSeconds'] is not None for e in m['events']),59)
  self.assertTrue(all(not x['loopChunkPresent'] for x in m['waves']))
  self.assertTrue(all(x['stopSourceSeconds']>=x['startSourceSeconds'] for x in m['events'] if x['stopSourceSeconds'] is not None))
if __name__=='__main__':unittest.main()
