import importlib.util,json,struct,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('builder',ROOT/'scripts/build_nsunsc_cinematic_collection.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class CollectionTests(unittest.TestCase):
 def test_bounds(self):
  with self.assertRaises(ValueError):m.fixed_rows(b'\0'*24,112)
 def test_pointer(self):
  b=struct.pack('<q',8)+b'original\0';self.assertEqual(m.ptr(b,0),'original')
  self.assertIsNone(m.ptr(struct.pack('<q',999),0))
 def test_manifest(self):
  d=json.loads((ROOT/'assets/nsunsc-library/cinematic-collection.json').read_text());c=json.loads((ROOT/'assets/motion-library/catalog.json').read_text());ids={i['id'] for i in c['clips']}
  self.assertEqual(len({s['id'] for s in d['sequences']}),len(d['sequences']))
  self.assertEqual(d['queue']['pilotSequenceId'],'original:3mntspl1')
  self.assertEqual(d['stats']['verifiedSequences'],0)
  for s in d['sequences']:
   self.assertIn(s['sourceClipId'],ids);self.assertFalse(s['execution']['recovered']);self.assertNotEqual(s['status'],'verified')
   self.assertTrue(s['components']['reference']['blockers'])
  self.assertFalse(d['stats']['authoritativeCinematicDenominatorComplete'])
  pilot=next(s for s in d['sequences'] if s['id']=='original:3mntspl1')
  audio=pilot['components']['soundBank'];self.assertEqual(audio['status'],'recovered');self.assertEqual(audio['evidence'][0]['mappedEventCount'],63);self.assertEqual(audio['evidence'][0]['waveformCount'],32)
  self.assertEqual(audio['evidence'][1]['sourceSfxAbsoluteStops'],59);self.assertEqual(audio['evidence'][1]['voiceStopExclusions'],4)
  self.assertTrue(pilot['execution']['recoveredSubmachine']);self.assertFalse(pilot['execution']['recovered'])
 def test_provenance_and_unknowns(self):
  d=json.loads((ROOT/'assets/nsunsc-library/cinematic-collection.json').read_text())
  for row in d['sourceTables']['teamSettings']:
   self.assertTrue(row['characterIds']);self.assertIn(row['requiredParticipantCount'],[2,3]);self.assertEqual(len(bytes.fromhex(row['rawHex'])),112)
  self.assertEqual(len(d['sourceBuild']['executableSha256']),64)
  first=d['sourceTables']['teamSettings'][0]
  self.assertIn('2nrt',first['characterIds']);self.assertIn('2ssk',first['characterIds']);self.assertEqual(first['requiredParticipantCount'],2)
  for seq in d['sequences']:self.assertEqual(seq['sourceBuildSha256'],d['sourceBuild']['executableSha256'])
  for src in d['sourceBuild']['sources'].values():self.assertEqual(len(src['payloadSha256']),64)
if __name__=='__main__':unittest.main()
