import importlib.util,json,math,unittest
from pathlib import Path
P=Path(__file__).with_name('build_minato_source_shot_index.py');spec=importlib.util.spec_from_file_location('shots',P);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class SourceShots(unittest.TestCase):
 def test_build(self):
  d=m.build();self.assertFalse(d['verified']);self.assertEqual(len(d['timelines']),6);self.assertEqual(d['source']['sha256'],'dff90e64f02199e14e4a87bfac6e95a0b3748d760b0d3a23db49e975299c9971')
  rows={r['name']:r for r in d['timelines']};a=rows['3mntspl1_atk'];self.assertEqual(len(a['cameraEntries']),1);c=a['cameraEntries'][0];self.assertEqual(c['clump'],-1);self.assertEqual(len(c['samples']),461);self.assertEqual(len(c['shotBoundaryCandidates']),9)
  self.assertEqual([r['frame'] for r in c['shotBoundaryCandidates']],[49,93,125,159,172,216,256,304,422]);self.assertEqual(sum(len(r['sourceCommands']) for r in d['timelines']),69);self.assertEqual(sum(len(r['audioEvents']) for r in d['timelines']),63)
  for r in c['samples']:
   self.assertTrue(all(math.isfinite(v) for v in r['position']+r['quaternion']));self.assertAlmostEqual(sum(v*v for v in r['quaternion']),1);self.assertTrue(0<r['horizontalFov']<180)
  self.assertEqual(c['samples'][0]['position'],c['samples'][1]['position']);self.assertTrue(a['effectEvents']);self.assertTrue(a['bodyRootTracks']);self.assertEqual(len(rows['3mntspl1_s']['cameraEntries']),0)
 def test_sentinel_not_end(self):
  self.assertEqual(m.sample([[0,[1]],[1,[2]],[-.001,[999]]],.5),[1.5])
 def test_saved_reproducible(self):
  self.assertEqual(json.loads((m.ROOT/'assets/nsunsc-library/minato-source-shot-index.json').read_text()),m.build())
if __name__=='__main__':unittest.main()
