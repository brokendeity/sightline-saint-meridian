import unittest,json,hashlib
from pathlib import Path
from translate_minato_pixel_shader import translate
class BodyShaders(unittest.TestCase):
 def test_source_programs(self):
  r=json.loads(Path('assets/nsunsc-library/minato-body-shader-equations.json').read_text());self.assertEqual(len(r['programs']),2)
  for p in r['programs']:
   b=Path(p['source']['url']).read_bytes();self.assertEqual(hashlib.sha256(b).hexdigest(),p['source']['sha256']);text,rows=translate(b);self.assertEqual(len(rows),p['instructions']);self.assertEqual(text,Path(p['url']).read_text());self.assertIn('sourceRoundEven',text);self.assertIn('o[2]',text);self.assertIn('sourceTexture1',text)
 def test_reject_vertex_program(self):
  r=json.loads(Path('assets/nsunsc-library/minato-material-evidence.json').read_text());p=next(x for x in r['shaderPairs'] if x['selector']==0xf00a)
  with self.assertRaises(ValueError):translate(Path(p['vertex']['url']).read_bytes())
if __name__=='__main__':unittest.main()
