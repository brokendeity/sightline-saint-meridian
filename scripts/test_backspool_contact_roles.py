"""Source pelvis reconstruction with unchanged target proportions/root-travel policy."""
import gzip,json,math,unittest
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parent))
from profile_forspoken_movement import sample
ROOT=Path(__file__).resolve().parents[1]
class ContactRoles(unittest.TestCase):
 def test_all_contact_banks_reconstruct_hips_only(self):
  entries=json.loads((ROOT/'output/rea-forspoken/movement-source-tracks/manifest.json').read_text())['clips'];byid={r['animationId']:r for r in entries}
  bones=json.loads((ROOT/'output/rea-naruto/animation-pass/backspool-bind.json').read_text());target={r['name']:r for r in bones};rig=json.loads((ROOT/'output/rea-forspoken/hu000-rig.json').read_text());rest=next(b for b in rig['bones']if b['name']=='C_Hip')['defaultPoseModelSpaceOffset'][:3];seen=set();animated=0
  for manifest in (ROOT/'assets/backspool').glob('*roles-contact-v4.json'):
   m=json.loads(manifest.read_text());self.assertFalse(m['rootTravelApplied'])
   for role in m['roles']:
    if role['sourceAnimationId']in seen:continue
    seen.add(role['sourceAnimationId']);src=json.loads(Path(byid[role['sourceAnimationId']]['output']).read_text());out=json.loads(gzip.decompress((ROOT/role['url']).read_bytes()));scale=out['userData']['pelvisUnitScale'];self.assertFalse(out['userData']['sourceRootTranslationApplied']);hip=next((t for t in src['tracks']if t['channel']=='skeletalTranslation'and t['boneName']=='C_Hip'),None)
    for t in out['tracks']:
     if not t['name'].endswith('.position'):continue
     name=t['name'].split('.')[0];self.assertTrue(all(math.isfinite(v)for v in t['values']))
     if name!='mixamorigHips':self.assertTrue(all(abs(v-target[name]['position'][i%3])<1e-7 for i,v in enumerate(t['values'])));continue
     if hip:
      if any(abs(v-t['values'][i%3])>1e-5 for i,v in enumerate(t['values'])):animated+=1
      for i,time in enumerate(t['times']):
       val=sample(hip,time)
       for j in range(3):self.assertAlmostEqual(t['values'][3*i+j],target[name]['position'][j]+(val[j]-rest[j])*scale,places=6)
  self.assertGreaterEqual(len(seen),33);self.assertGreater(animated,25)
if __name__=='__main__':unittest.main()
