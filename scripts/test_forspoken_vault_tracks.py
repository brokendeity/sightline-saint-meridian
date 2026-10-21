import copy,json,math,struct,unittest
from pathlib import Path
from decode_forspoken_vault_tracks import indices_for_frame,decode_clip,OUT
from decode_forspoken_seed import quaternion48
class VaultTracks(unittest.TestCase):
 def test_complete_source_streams(self):
  total=0
  for clip in json.loads((OUT/'vault-rig-binding.json').read_text())['clips']:
   r=decode_clip(clip);total+=r['validation']['scheduledKeys']
   for t in r['tracks']:
    self.assertEqual(t['timesSeconds'][0],0)
    self.assertTrue(all(a<b for a,b in zip(t['timesSeconds'],t['timesSeconds'][1:])))
    for v in t['values']:
     self.assertTrue(all(math.isfinite(x) for x in v))
     if len(v)==4:self.assertLess(abs(sum(x*x for x in v)-1),1e-5)
  self.assertEqual(total,37825)
 def test_run_validation(self):
  f={'keyCount':3,'headerFlags':0,'stepModifiers':[3]}
  self.assertEqual(indices_for_frame(f,[3]),[0,1,2])
  self.assertEqual(indices_for_frame({'keyCount':2,'headerFlags':0,'stepModifiers':[0,1,2]},[3]),[1,2])
  for bad in [dict(f,stepModifiers=[4]),dict(f,keyCount=2),dict(f,headerFlags=1)]:
   with self.assertRaises(ValueError):indices_for_frame(bad,[3])
 def test_codec_rejections(self):
  for raw in [struct.pack('<3H',0x8000,0x8000,0x8000),bytes(6)]:
   with self.assertRaises(ValueError):quaternion48(raw,True,False)
if __name__=='__main__':unittest.main()
