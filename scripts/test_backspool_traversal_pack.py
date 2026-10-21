import gzip,hashlib,json,math,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
class Pack(unittest.TestCase):
 def test_integrity(self):
  m=json.loads((ROOT/'assets/backspool/traversal-native-candidate-manifest.json').read_text());p=ROOT/m['packUrl'];self.assertEqual(hashlib.sha256(p.read_bytes()).hexdigest(),m['packSha256']);data=json.loads(gzip.decompress(p.read_bytes()));self.assertEqual(len(data),5)
  for e,record in zip(data,m['clips']):
   self.assertEqual(e['id'],record['id']);self.assertEqual(record['playbackRate'],1);self.assertEqual(hashlib.sha256(Path(record['sourcePath']).read_bytes()).hexdigest(),record['sourceSha256'])
   for track in e['clip']['tracks']:
    times=track['times'];self.assertTrue(all(math.isfinite(v) for v in times+track['values']));self.assertEqual(times,sorted(times));self.assertGreater(len(times),0)
  self.assertFalse(m['admittedToActiveGame'])
if __name__=='__main__':unittest.main()
