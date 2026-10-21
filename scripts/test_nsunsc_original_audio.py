"""Source-bank and decoded-wave checks; no original-cinematic fidelity claim."""
import unittest,struct,json,pathlib,hashlib,wave,array
from recover_nsunsc_original_audio import afs2,utf,BASE
class AudioTests(unittest.TestCase):
 def test_invalid_utf(self):
  for data in [b'',b'@UTF'+bytes(28)]:
   with self.assertRaises(ValueError):utf(data)
 def test_afs2_bounds(self):
  with self.assertRaises(ValueError):afs2(b'AFS2'+bytes(12))
  b=b'AFS2'+bytes([2,4,2,0])+struct.pack('<IHH',1,32,0)+struct.pack('<HII',7,26,36)+bytes(6)+b'HCA\0'
  result=afs2(b);self.assertEqual(result['waves'][0]['offset'],32);self.assertEqual(result['waves'][0]['id'],7)
 def test_pilot_all_events(self):
  m=json.loads((BASE/'assets/nsunsc-library/original-audio/minato3mntspl1.json').read_text())
  self.assertEqual(len(m['events']),63);self.assertTrue(all(e['status']=='mapped' and len(e['matches'])==1 for e in m['events']))
  self.assertEqual(len(m['cues']),32)
  voices=[c for c in m['cues'] if c['cueName'].startswith('V_')];self.assertEqual(len(voices),4)
  for c in m['cues']:
   p=BASE/c['url'];self.assertEqual(hashlib.sha256(p.read_bytes()).hexdigest(),c['decodedSha256'])
   with wave.open(str(p)) as w:
    self.assertGreater(w.getnframes(),0);self.assertEqual(w.getframerate(),c['waveform']['SamplingRate']);self.assertEqual(w.getsampwidth(),2)
    samples=array.array('h',w.readframes(w.getnframes()));self.assertGreater(max(abs(x) for x in samples),100)
if __name__=='__main__':unittest.main()
