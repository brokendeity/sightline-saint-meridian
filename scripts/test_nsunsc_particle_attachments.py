import unittest,struct,gzip,json
from pathlib import Path
from resolve_nsunsc_particle_attachments import attachment_indices
class Attachments(unittest.TestCase):
 def fixture(self,stride=56):
  raw=bytearray(stride);struct.pack_into('>III',raw,0,3,1,99);struct.pack_into('>3f',raw,16,1,2,3)
  if stride==56:struct.pack_into('>i',raw,48,-1)
  return raw,{'sections':[{'count':1},{},{'count':1,'recordBytes':stride,'start':0,'end':stride}]}
 def test_field_offsets(self):
  raw,record=self.fixture();r=attachment_indices(raw,record)[0];self.assertEqual(r['direction'],[1,2,3]);self.assertEqual(r['contextIndex'],-1);self.assertEqual(r['generatorIndex'],0)
 def test_old_version(self):
  raw,record=self.fixture(48);self.assertEqual(attachment_indices(raw,record)[0]['contextIndex'],-1)
 def test_bounds_and_nonfinite(self):
  raw,record=self.fixture()
  with self.assertRaises(ValueError):attachment_indices(raw[:-1],record)
  struct.pack_into('>f',raw,16,float('nan'))
  with self.assertRaises(ValueError):attachment_indices(raw,record)
 def test_canonical(self):
  for key,name,coord,context in [('c426d45069048ff1a4d4','3mntspl1_atk','1efc_dmy01_hrs01','1efc_dmy01_trall'),('c5fa8247ee6d9495a0fc','2sskspl1_atk','1efc_dmy01_01','1efc_dmy01_01')]:
   d=json.loads(gzip.decompress((Path(__file__).resolve().parents[1]/'assets/nsunsc-library'/key/'particle-attachments.json.gz').read_bytes()));r=next(r for r in d['records'] if r['name']==name)['attachments'][0];self.assertEqual(r['reference']['name'],coord);self.assertEqual(r['contextReference']['name'],context);self.assertEqual(r['direction'],[0,-1,0])
if __name__=='__main__':unittest.main()
