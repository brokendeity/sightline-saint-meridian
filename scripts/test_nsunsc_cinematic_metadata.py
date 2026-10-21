import unittest,struct
from decode_nsunsc_finisher_variants import decode_table,STRIDE
from decode_nsunsc_sound_events import decode_events
class Metadata(unittest.TestCase):
 def cutin(self):
  body=bytearray(16+STRIDE);struct.pack_into('<IIQ',body,0,1000,1,8);start=len(body);body+=b'card.xfbin\0card\0';struct.pack_into('<qqii',body,32,start-32,start+11-40,0,124);return struct.pack('>I',len(body))+body
 def test_cutin_identity(self):
  d=decode_table(self.cutin());g=d['records'][0]['groups'][0];self.assertEqual(g['file'],'card.xfbin');self.assertEqual(g['resourceName'],'card');self.assertEqual(g['targetIdentity'],124)
 def test_cutin_bounds(self):
  r=self.cutin()
  for value in [r[:-1],r[:12],bytes(20)]:
   with self.assertRaises(ValueError):decode_table(value)
 def sound(self):
  record=bytearray(64);record[:5]=b'S_hit';struct.pack_into('<h',record,44,15);struct.pack_into('<h',record,56,60);body=struct.pack('<h',1)+record;return struct.pack('>I',len(body))+body
 def test_cue_start_separate_from_stop(self):
  d=decode_events(self.sound())['events'][0];self.assertEqual(d['sourceSeconds'],.5);self.assertEqual(d['rawI16_56'],60);self.assertEqual(d['cueName'],'S_hit')
 def test_sound_bounds_and_nonfinite(self):
  with self.assertRaises(ValueError):decode_events(self.sound()[:-1])
  r=bytearray(self.sound());struct.pack_into('<f',r,6+34,float('nan'))
  with self.assertRaises(ValueError):decode_events(r)
if __name__=='__main__':unittest.main()
