import json,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
class WrapperTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):cls.data=json.loads((ROOT/'assets/nsunsc-library/minato-finisher-wrapper.json').read_text())
 def test_original_wrapper_domain_not_hold(self):
  a=next(a for a in self.data['animations'] if a['name']=='pre_spl_fin')
  self.assertEqual(a['durationTicks'],10000);self.assertEqual(a['loopFlag'],1)
  self.assertFalse(self.data['executableOriginal']);self.assertFalse(self.data['verified'])
 def test_binding_and_source_camera(self):
  a=next(a for a in self.data['animations'] if a['name']=='pre_spl_fin')
  self.assertEqual(a['clumps'][0]['reference'],'dmy_fin')
  c=next(e for e in a['entries'] if e['format']==2)
  self.assertEqual(c['name'],'camera001')
  self.assertEqual({x['path'] for x in c['curves']},{'location','rotation_quaternion','data.lens'})
 def test_companions_and_shader_controls(self):
  names={a['name'] for a in self.data['animations']}
  self.assertIn('pre_spl_finish_fade01_anm',names);self.assertIn('pre_spl_finish_line01_anm',names)
  self.assertIn('pre_spl_fcv_fin_blur',{c['name'] for c in self.data['binaryControls']})
 def test_postprocess_curves_are_recovered_without_invented_clock(self):
  curves={c['type']:c for c in self.data['postprocessCurves']}
  self.assertEqual(len(curves),5)
  self.assertEqual(curves['FCURVE_TYPE_BLUR']['keyCount'],6)
  self.assertEqual([k['sourceFrame'] for k in curves['FCURVE_TYPE_BLUR']['keys']],[0,5,10,40,45,55])
  self.assertEqual(curves['FCURVE_TYPE_SOFTFOCUS']['keyCount'],6)
  self.assertTrue(all(c['clockHz'] is None for c in curves.values()))
 def test_strict_fcurve_rejects_corruption(self):
  from source_minato_wrapper import decode_fcurve
  import struct
  body=b'FCURVE_TYPE_BLUR,\nFCURVE_INTERPOLATION_LINEAR,\n1,\n0,3,4,\n'
  good=struct.pack('>I',len(body))+body
  self.assertEqual(decode_fcurve(good)['valueWidth'],2)
  with self.assertRaises(ValueError):decode_fcurve(good[:-1])
  with self.assertRaises(ValueError):decode_fcurve(struct.pack('>I',len(body))+body.replace(b'0,3,4',b'0,nan,4'))
 def test_scene_identity_and_finiteness(self):
  self.assertTrue((ROOT/self.data['sceneUrl']).exists())
  self.assertEqual(len(self.data['source']['sha256']),64)
  import math
  for a in self.data['animations']:
   for e in a['entries']:
    for c in e['curves']:
     for t,v in c['keys']:self.assertTrue(math.isfinite(t));self.assertTrue(all(math.isfinite(x) for x in v))
if __name__=='__main__':unittest.main()
