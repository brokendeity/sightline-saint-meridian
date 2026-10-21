"""Inventory completeness and source integrity; does not certify original behavior."""
import collections,gzip,hashlib,json,math,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
class FullPlayerInventory(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.full=json.loads((ROOT/'output/rea-forspoken/full-player-inventory/manifest.json').read_text())
 def test_archive_index_completeness(self):
  index=json.loads((ROOT/'output/rea-forspoken/c000_001-index.json').read_text());ids={e['entry'] for e in index if '/hu000/anim/' in e['path'] and e['path'].endswith('.pka') and e['size']}
  self.assertEqual(ids,{e['entry'] for e in self.full['packages']});self.assertEqual(len(ids),30)
  self.assertEqual(sum(e['clips'] for e in self.full['packages']),len(self.full['clips']))
  for e in self.full['packages']:self.assertEqual(hashlib.sha256(Path(e['output']).read_bytes()).hexdigest(),e['sha256'])
 def test_source_curves_and_explicit_failures(self):
  for row in self.full['clips']:
   if row['status']!='decoded':self.assertTrue(row['reason']);self.assertIn('/facial/',row['pack']);continue
   d=json.loads(Path(row['output']).read_text());self.assertEqual(d['validation']['schedulingMismatches'],0)
   self.assertEqual(d['sourceSha256'],row['sourceSha256'])
   for t in d['tracks']:
    self.assertTrue(all(a<b for a,b in zip(t['timesSeconds'],t['timesSeconds'][1:])));self.assertTrue(all(math.isfinite(v) for k in t['values'] for v in k))
 def test_complete_lazy_body_exports(self):
  catalog=json.loads((ROOT/'assets/backspool/source-player-preview-index.json').read_text());rows=catalog['clips']
  expected={(r['pack'],r['animationId']) for r in self.full['clips'] if r['status']=='decoded' and '/facial/' not in r['pack']}
  self.assertEqual(expected,{(r['sourcePack'],r['sourceAnimationId']) for r in rows});self.assertEqual(len({r['id'] for r in rows}),len(rows))
  target=json.loads((ROOT/'output/rea-naruto/animation-pass/backspool-bind.json').read_text());bones={b['name']:b for b in target}
  for row in rows:
   raw=(ROOT/row['sourceUrl']).read_bytes();self.assertEqual(hashlib.sha256(raw).hexdigest(),row['sha256']);d=json.loads(gzip.decompress(raw));self.assertEqual(d['userData']['sourceSha256'],row['sourceSha256']);self.assertFalse(row['gameplayIntegrated'])
   for t in d['tracks']:
    n=t['name'].split('.')[0];self.assertIn(n,bones);self.assertTrue(all(math.isfinite(v) for v in t['values']))
    if t['name'].endswith('.position'):
     self.assertTrue(all(abs(v-bones[n]['position'][i%3])<1e-6 for i,v in enumerate(t['values'])))
    else:
     for i in range(0,len(t['values']),4):self.assertAlmostEqual(sum(v*v for v in t['values'][i:i+4]),1,places=4)
if __name__=='__main__':unittest.main()
