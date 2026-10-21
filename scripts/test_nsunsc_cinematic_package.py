import hashlib,importlib.util,json,tempfile,unittest,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('exporter',ROOT/'scripts/export_nsunsc_cinematic_package.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class PackageTests(unittest.TestCase):
 def test_paths(self):
  for p in ['../secret','/tmp/secret','assets/../../secret','assets\\evil']:
   with self.assertRaises(ValueError):m.safe_path(ROOT,p)
  with tempfile.TemporaryDirectory() as d:
   p=Path(d);(p/'link').symlink_to('/tmp')
   with self.assertRaises(ValueError):m.safe_path(p,'link/secret')
 def test_remix(self):
  good=dict(originalSequenceId='original:x',sourceBuildSha256='abc')
  self.assertEqual(m.remix_validate(good,'original:x','abc'),good)
  for seq,build in [('original:y','abc'),('original:x','def')]:
   with self.assertRaises(ValueError):m.remix_validate(good,seq,build)
 def test_reproducible_fixture(self):
  with tempfile.TemporaryDirectory() as d:
   root=Path(d);base=root/'assets/nsunsc-library';base.mkdir(parents=True);(root/'assets/motion-library').mkdir()
   seq=dict(id='original:x',name='x',sourceBundle='bundle',sourceBuildSha256='abc',status='recovered',components={})
   (base/'cinematic-collection.json').write_text(json.dumps(dict(sequences=[seq])))
   scene=base/'bundle';scene.mkdir();(scene/'scene.json').write_text(json.dumps(dict(animations=[],references=[],textures=[{'url':'assets/nsunsc-library/bundle/texture.bin'}])));(scene/'texture.bin').write_bytes(b'original')
   (root/'assets/motion-library/catalog.json').write_text(json.dumps(dict(nativeBundles={'bundle':{'scene':'assets/nsunsc-library/bundle/scene.json','path':'data/x.xfbin'}},nativeRigs={})))
   a=root/'a.zip';b=root/'b.zip';one=m.export(root,'original:x',a);two=m.export(root,'original:x',b)
   self.assertEqual(a.read_bytes(),b.read_bytes());self.assertEqual(one['entries'],two['entries']);self.assertFalse(one['verified'])
 def test_real_pilot(self):
  p=ROOT/'output/cinematic-collection/minato-recovery.zip'
  if not p.exists():self.skipTest('pilot package absent')
  with zipfile.ZipFile(p) as z:
   manifest=json.loads(z.read('package-manifest.json'));self.assertFalse(manifest['verified']);self.assertEqual(manifest['sequenceId'],'original:3mntspl1')
   paths={e['path'] for e in manifest['entries']};self.assertIn('assets/nsunsc-library/original-audio/minato3mntspl1.json',paths)
   self.assertIn('assets/nsunsc-library/minato-camera-evidence.json',paths);self.assertIn('assets/nsunsc-library/minato-victim-binding.json',paths);self.assertIn('assets/nsunsc-library/minato-shader-bindings.json',paths);self.assertIn('scripts/minato_victim_adapter.js',paths);self.assertIn('assets/nsunsc-library/minato-sprite-path.json',paths);self.assertIn('scripts/cinematic_source_audio.js',paths);self.assertIn('assets/motion-library/engine.js',paths);self.assertIn('assets/nsunsc-library/original-audio/minato3mntspl1-semantics.json',paths)
   self.assertTrue(any(x.endswith('.hca') for x in paths));self.assertTrue(any('57fbb94874bb40c5fa03/scene' in x for x in paths))
   for e in manifest['entries']:
    h=hashlib.sha256();size=0
    with z.open(e['path']) as f:
     while block:=f.read(1024*1024):h.update(block);size+=len(block)
    self.assertEqual(e['sha256'],h.hexdigest());self.assertEqual(size,e['bytes'])
if __name__=='__main__':unittest.main()
