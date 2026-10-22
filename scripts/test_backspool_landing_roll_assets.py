import gzip,hashlib,json,math,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
class SourceMotions(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.roles=json.loads((ROOT/'assets/backspool/traversal-landing-roll-roles-v15.json').read_text())['roles']
  cls.names={m['animationId']:m for m in json.loads(gzip.decompress((ROOT/'assets/backspool/original-motion-names-v12.json.gz').read_bytes()))['motions']}
 def test_source_identity_and_limits(self):
  for r in self.roles:
   with self.subTest(role=r['role']):
    native=self.names[r['sourceAnimationId']];p=ROOT/r['url'];self.assertEqual(hashlib.sha256(p.read_bytes()).hexdigest(),r['sha256']);self.assertEqual(native['sourceSha256'],r['sourceSha256']);self.assertEqual(native['originalName'],r['originalMotionName']);self.assertFalse(r['verifiedOriginalRole']);self.assertLessEqual(r['playbackRate'],1.4);self.assertGreater(r['end'],r['start']);self.assertLessEqual(r['end'],r['duration']+1e-6)
 def test_unit_scale_fixed_limb_lengths_and_quaternions(self):
  for r in self.roles:
   c=json.loads(gzip.decompress((ROOT/r['url']).read_bytes()))
   for t in c['tracks']:
    with self.subTest(role=r['role'],track=t['name']):
     v=t['values'];self.assertTrue(all(math.isfinite(x) for x in v))
     if t['name'].endswith('.scale'):self.assertTrue(all(abs(x-1)<1e-6 for x in v))
     if t['name'].endswith('.position') and t['name']!='mixamorigHips.position':self.assertTrue(all(abs(x-v[i%3])<1e-6 for i,x in enumerate(v)))
     if t['name'].endswith('.quaternion'):
      self.assertTrue(all(abs(sum(x*x for x in v[i:i+4])-1)<.0002 for i in range(0,len(v),4)))
 def test_directional_motion_identity(self):
  roles={r['role']:r for r in self.roles}
  for role,suffix in [('sideFlipLeft','l000a'),('sideFlipRight','r000a'),('backFlip','b000a')]:self.assertTrue(roles[role]['originalMotionName'].endswith(suffix))
  self.assertTrue(roles['groundRoll']['originalMotionName'].startswith('pkr000_ntl_land_'))
  self.assertEqual(len({roles[k]['sourceAnimationId'] for k in ['roll','rollLeft','rollRight','rollBack']}),4)
if __name__=='__main__':unittest.main()
