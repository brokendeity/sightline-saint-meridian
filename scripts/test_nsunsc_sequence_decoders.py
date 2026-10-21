import unittest,struct,json
from pathlib import Path
from decode_nsunsc_post_curves import parse as post
from decode_nsunsc_particle_sections import parse as particle
from decode_nsunsc_billboards import parse as billboard
from decode_nsunsc_particle_events import event
from resolve_nsunsc_particle_resources import resource_indices
from nsunsc_chunk_references import chunk_index,resolve_reference
from types import SimpleNamespace
import hashlib
ROOT=Path(__file__).resolve().parents[1]
class Decoders(unittest.TestCase):
 def test_billboard_modes_and_widths(self):
  flags=(1<<1)|(2<<3)|(1<<5);b=struct.pack('>IIHHI',4,flags,2,0,0)+struct.pack('>7f',1,2,3,.25,.75,2,3);d=billboard(b);self.assertEqual(d['channels'][0]['samples'],[[1,2,3]]);self.assertEqual(d['channels'][1]['samples'],[[.25],[.75]]);self.assertEqual(d['channels'][2]['samples'],[[2,3]])
 def test_all_billboard_channel_boundaries(self):
  widths=[3,1,2,1,2,2,1,1,1,2,2,1,1];flags=sum(1<<(1+i*2) for i in range(13));rows=[[100*i+j for j in range(w)] for i,w in enumerate(widths)];values=[v for row in rows for v in row];d=billboard(struct.pack('>IIHHI',0,flags,1,0,100)+struct.pack('>'+str(len(values))+'f',*values));self.assertEqual([c['samples'][0] for c in d['channels']],rows)
 def test_billboard_rejects_malformed(self):
  for b in [bytes(15),struct.pack('>IIHHI',0,6,1,0,0),struct.pack('>IIHHI',0,2,1,0,0),struct.pack('>IIHHI',0,0,1,0,0)+b'x',struct.pack('>IIHHI',0,2,1,0,0)+struct.pack('>3f',float('nan'),1,2)]:
   with self.assertRaises((ValueError,AssertionError)):billboard(b)
 def test_real_billboard(self):
  d=billboard((ROOT/'assets/nsunsc-library/13437a5b01c6a7d7cd13/raw-dd70f47431b998cda661942335cf631496efc1216ab4046413e01a25a100d503.bin').read_bytes());self.assertEqual(d['ticksPerFrame'],50);self.assertEqual(d['sourceFramesPerSecond'],60);self.assertEqual(d['decodedBytes'],464);self.assertTrue(d['frameCount']>0)
 def test_identical_payloads_keep_source_identity(self):
  a=SimpleNamespace(name='smoke',data=b'identical',chunks=[SimpleNamespace(name='smokeModel',filePath='smoke.max')]);b=SimpleNamespace(name='fire',data=b'identical',chunks=[SimpleNamespace(name='fireModel',filePath='fire.max')]);lookup=chunk_index([a,b]);self.assertEqual(resolve_reference(lookup[('smoke',hashlib.sha256(b'identical').hexdigest())],0)['name'],'smokeModel')
 def test_conflicting_page_contexts_rejected(self):
  a=SimpleNamespace(chunks=[SimpleNamespace(name='first',filePath='a')]);b=SimpleNamespace(chunks=[SimpleNamespace(name='second',filePath='b')]);self.assertEqual(resolve_reference([a,b],0)['status'],'ambiguous');self.assertEqual(resolve_reference([],0)['status'],'unresolved')
 def test_resource_generator_mapping(self):
  record={'sections':[{'count':2},{'recordBytes':32,'start':0,'end':64,'count':2}]};raw=struct.pack('>II',7,2)+bytes(24)+struct.pack('>II',9,1)+bytes(24);rows=resource_indices(raw,record);self.assertEqual([(r['index'],r['generatorIndex']) for r in rows],[(7,1),(9,0)])
 def test_invalid_resource_association(self):
  record={'sections':[{'count':1},{'recordBytes':32,'start':0,'end':32,'count':1}]};self.assertIsNone(resource_indices(struct.pack('>II',1,0)+bytes(24),record)[0]['generatorIndex'])
  with self.assertRaises(ValueError):resource_indices(bytes(16),record)
 def test_particle_event_commands(self):
  self.assertEqual(event(0x80000021)['milliseconds'],33);self.assertEqual(event(0x40000e52)['seconds'],3.666);self.assertEqual(event(0x80000021)['command'],'enable');self.assertEqual(event(0x40000e52)['command'],'stop-and-drain');self.assertEqual(event(0)['command'],'disable-emission')
 def test_source_glare(self):
  b=(ROOT/'assets/nsunsc-library/c5fa8247ee6d9495a0fc/raw-339ccccbae2647e381360b9ec05658bb11efc8ea95f4c71c31e57d4d1308202e.bin').read_bytes();d=post(b);self.assertEqual(d['type'],'FCURVE_TYPE_GLARE');self.assertEqual([k[0] for k in d['keys']],[0,109,110]);self.assertEqual(d['channelCount'],3)
 def test_optional_version(self):
  s=b'FCURVE_TYPE_FOG,\nFCURVE_INTERPOLATION_LINEAR,\nver_1,\n2,\n0,0,\n30,1,\n';d=post(struct.pack('>I',len(s))+s);self.assertEqual(d['version'],'ver_1');self.assertEqual(d['keys'][-1],[30,1])
 def test_invalid_csv(self):
  for s in [b'FCURVE_TYPE_FOG,\nFCURVE_INTERPOLATION_LINEAR,\n2,\n0,1,\n',b'FCURVE_TYPE_FOG,\nFCURVE_INTERPOLATION_LINEAR,\n1,\n0,0.1.000000,\n',b'FCURVE_TYPE_FOG,\nFCURVE_INTERPOLATION_LINEAR,\n1,\n0,nan,\n']:
   with self.assertRaises((ValueError,AssertionError)):post(struct.pack('>I',len(s))+s)
 def test_length_rejection(self):
  with self.assertRaises(ValueError):post(b'\x00\x00\x00\x01FCURVE_TYPE_FOG')
 def test_source_particle(self):
  d=particle((ROOT/'assets/nsunsc-library/c426d45069048ff1a4d4/raw-d999ff4fb7e9ad05ac8cb3182785b7287652ae8d49829dcfcec1d835903973f3.bin').read_bytes());self.assertEqual([s['bytes'] for s in d['sections']],[208,32,56,0,8]);self.assertEqual(d['sections'][0]['recordBytes'],208);self.assertEqual(d['opaqueTailBytes'],0);self.assertEqual(d['sections'][4]['lists'],[{'count':1,'values':[2147483681]}])
 def test_particle_bounds(self):
  with self.assertRaises(ValueError):particle(bytes(39))
  b=bytearray(40);struct.pack_into('>IHH',b,0,40,1,208)
  with self.assertRaises(ValueError):particle(b)
 def test_unknown_particle_tail_preserved(self):
  b=bytearray(40);struct.pack_into('>I',b,0,40);d=particle(b+b'opaque');self.assertEqual(d['opaqueTailBytes'],6);self.assertTrue(d['opaqueTailSha256'])
if __name__=='__main__':unittest.main()
