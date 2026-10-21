#!/usr/bin/env python3
"""Regression checks for source curves, independent vault output and failure paths."""
import json,unittest
from pathlib import Path
from decode_forspoken_movement import ROOT,decode_clip
from decode_forspoken_vault_tracks import decode_clip as vault_decode,indices_for_frame
class MovementDecoderTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.manifest=json.loads((ROOT/'movement-source-tracks/manifest.json').read_text());cls.rig=json.loads((ROOT/'hu000-rig.json').read_text());cls.inventory=json.loads((ROOT/'movement-coverage.json').read_text())['clips']
 def test_complete_denominator(self):
  self.assertEqual(self.manifest['indexedTotal'],532);self.assertEqual(len(self.manifest['clips']),532)
  for c in self.manifest['clips']:
   self.assertIn(c['status'],('decoded-source-curves','unsupported'))
   if c['status']=='unsupported':self.assertTrue(c['reason'])
 def test_every_decoded_clip_has_finite_monotonic_values(self):
  import math
  for clip in self.manifest['clips']:
   if clip['status']!='decoded-source-curves':continue
   data=json.loads(Path(clip['output']).read_text());self.assertEqual(data['validation']['schedulingMismatches'],0)
   for t in data['tracks']:
    self.assertEqual(len(t['timesSeconds']),len(t['values']));self.assertTrue(t['values'])
    self.assertTrue(all(x<y for x,y in zip(t['timesSeconds'],t['timesSeconds'][1:])))
    self.assertTrue(all(math.isfinite(x) for v in t['values'] for x in v))
    if t['constant']:self.assertEqual(len(t['values']),1)
 def test_vault_outputs_match_specialized_decoder(self):
  binding=json.loads((ROOT/'vault-rig-binding.json').read_text())['clips']
  for clip in binding:
   expected=vault_decode(clip);entry=next(c for c in self.inventory if c['animationId']==expected['animationId'] and '/vault/' in c['pack']);actual=decode_clip(entry,self.rig)
   self.assertEqual([(x['partBit'],x['timesSeconds'],x['values']) for x in expected['tracks']],[(x['partBit'],x['timesSeconds'],x['values']) for x in actual['tracks']])
 def test_constant_and_fps_profiles(self):
  decoded=[c for c in self.manifest['clips'] if c['status']=='decoded-source-curves'];self.assertEqual(sum(c['constantTracks']>0 for c in decoded),207)
  byid={c['animationId']:c for c in self.inventory};self.assertTrue(any(byid[c['animationId']]['fps']==30 for c in decoded));self.assertTrue(any(c['animatedTracks']==0 for c in decoded))
 def test_bad_runs_rejected(self):
  for frame,sizes in [({'keyCount':1,'headerFlags':1,'stepModifiers':[1]},[1]),({'keyCount':1,'headerFlags':0,'stepModifiers':[2]},[1]),({'keyCount':1,'headerFlags':0,'stepModifiers':[0]},[1])]:
   with self.assertRaises(ValueError):indices_for_frame(frame,sizes)
if __name__=='__main__':unittest.main()
