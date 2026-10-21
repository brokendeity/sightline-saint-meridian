import unittest,json
from pathlib import Path
from recover_minato_materials import program_pairs
class Materials(unittest.TestCase):
 def test_original_package(self):
  r=json.loads(Path('assets/nsunsc-library/minato-material-evidence.json').read_text());b=Path(r['sourcePackage']['path']).read_bytes();pairs=program_pairs(b);self.assertEqual(len(pairs),224);self.assertEqual(len({p['selector'] for p in pairs}),224);self.assertIn(0x1f002,{p['selector'] for p in pairs});self.assertEqual(len(r['bundles']),2)
 def test_reject(self):
  with self.assertRaises(ValueError):program_pairs(b'nope')
  r=json.loads(Path('assets/nsunsc-library/minato-material-evidence.json').read_text());b=Path(r['sourcePackage']['path']).read_bytes()
  with self.assertRaises(ValueError):program_pairs(b[:-1])
 def test_bindings(self):
  r=json.loads(Path('assets/nsunsc-library/minato-material-evidence.json').read_text());m=next(m for b in r['bundles'] for m in b['models'] if m['name']=='3mntspl1_aura01');self.assertEqual(m['meshes'][0]['flags'],0x1f002);self.assertEqual(m['meshes'][0]['sourceFactor'],5)
if __name__=='__main__':unittest.main()
