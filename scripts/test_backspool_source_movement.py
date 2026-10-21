"""Validate all exported motion identities and target rig invariants.
These invariants do not certify gameplay contacts or original-game fidelity.
"""
import gzip,hashlib,json,math,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
class SourceMovement(unittest.TestCase):
 def test_inventory_rig_and_provenance(self):
  source=json.loads((ROOT/'output/rea-forspoken/movement-source-tracks/manifest.json').read_text());source={e['animationId'].removeprefix('0x'):e for e in source['clips']}
  manifest=json.loads((ROOT/'assets/backspool/source-movement/manifest.json').read_text());target={b['name']:b for b in json.loads((ROOT/'output/rea-naruto/animation-pass/backspool-bind.json').read_text())}
  self.assertEqual(manifest['exported'],532);self.assertEqual({e['id'] for e in manifest['clips']},set(source));tracks=0
  for entry in manifest['clips']:
   raw=(ROOT/entry['url']).read_bytes();self.assertEqual(hashlib.sha256(raw).hexdigest(),entry['sha256']);clip=json.loads(gzip.decompress(raw));original=json.loads(Path(source[entry['id']]['output']).read_text())
   self.assertEqual(clip['userData']['sourceSha256'],original['sourceSha256']);self.assertTrue(clip['userData']['anatomicalRestCalibration']);self.assertFalse(clip['userData']['sourceRootTranslationApplied']);self.assertFalse(clip['userData']['gameplayIntegrated']);self.assertEqual(clip['duration'],original['durationSeconds'])
   positions={}
   for tr in clip['tracks']:
    tracks+=1;name,kind=tr['name'].split('.');self.assertIn(name,target);stride=4 if kind=='quaternion' else 3;times=tr['times'];self.assertEqual(len(tr['values']),len(times)*stride);self.assertTrue(all(a<b for a,b in zip(times,times[1:])));self.assertEqual(times[0],0);self.assertEqual(times[-1],clip['duration']);self.assertTrue(all(math.isfinite(x) for x in tr['values']))
    if kind=='position':
     positions[name]=tr;self.assertTrue(all(abs(x-target[name]['position'][i%3])<1e-12 for i,x in enumerate(tr['values'])))
    else:
     for i in range(0,len(tr['values']),4):self.assertLess(abs(sum(x*x for x in tr['values'][i:i+4])-1),1e-5)
   self.assertEqual(set(positions),set(target))
  print('Validated',len(source),'source identities and',tracks,'target tracks; fixed native bone offsets and normalized rotations')
 def test_admitted_role_hashes(self):
  roles=json.loads((ROOT/'assets/backspool/traversal-locomotion-roles.json').read_text())['roles'];self.assertEqual(len(roles),6)
  for role in roles:self.assertEqual(hashlib.sha256((ROOT/role['url']).read_bytes()).hexdigest(),role['sha256'])
if __name__=='__main__':unittest.main()
