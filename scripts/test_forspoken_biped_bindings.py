import copy
import hashlib
import json
import unittest
from recover_forspoken_biped_bindings import decode, OUT


class BipedBindings(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        raw = (OUT/'hu000_ik.tspack').read_bytes()
        cls.resource = json.loads((OUT/'native-ik-contracts-v8.json').read_text())['setup']['resources'][0]
        cls.payload = raw[cls.resource['offset']:cls.resource['offset']+cls.resource['spanBytes']]
        cls.rig = json.loads((OUT/'hu000-rig.json').read_text())
        cls.result = decode(cls.payload, cls.rig)

    def test_native_nine_joint_order(self):
        self.assertEqual([x['name'] for x in self.result['inputOrder']],
                         ['C_Hip', 'L_UpLeg', 'L_Leg', 'L_Foot', 'L_Toe',
                          'R_UpLeg', 'R_Leg', 'R_Foot', 'R_Toe'])
        self.assertEqual(self.result['inputOrder'][3]['sourceRigIndex'], 5608)
        self.assertEqual(self.result['inputOrder'][7]['sourceRigIndex'], 5645)

    def test_native_body_packet_interleaves_sides(self):
        points = self.result['bodyPoints']
        self.assertEqual([p['inputSlot'] for p in points], [0, 1, 5, 2, 6, 3, 7])
        self.assertEqual([p['contextIndexOffset'] for p in points],
                         [hex(0x1f0+i*4) for i in range(7)])
        self.assertEqual([p['name'] for p in points],
                         ['C_Hip', 'L_UpLeg', 'R_UpLeg', 'L_Leg', 'R_Leg', 'L_Foot', 'R_Foot'])

    def test_actual_setup_chain_types_and_source_identity(self):
        self.assertEqual(hashlib.sha256(self.payload).hexdigest(), self.resource['sha256'])
        self.assertEqual([c['kind'] for c in self.result['baseChains']], [4, 7])
        self.assertEqual([j['name'] for j in self.result['baseChains'][0]['joints']],
                         ['C_Spine', 'C_Spine1', 'C_Spine2', 'C_Spine3'])
        for record in self.result['inputOrder']:
            bone = self.rig['bones'][record['sourceRigIndex']]
            self.assertEqual(bone['name'], record['name'])
            self.assertEqual(bone['sourceBoneId'], record['sourceBoneId'])

    def test_probe_indices_keep_foot_and_knee_rotation_separate(self):
        probes = self.result['probeVectors']
        self.assertEqual([p['packetIndex'] for p in probes], list(range(7, 13)))
        self.assertEqual([p['rotationInputSlot'] for p in probes], [3, 7, 3, 7, 2, 6])
        self.assertEqual([p['contextVectorOffset'] for p in probes],
                         [hex(0x140+i*16) for i in range(6)])

    def test_missing_or_ambiguous_source_bone_fails(self):
        for kind in ['missing', 'duplicate']:
            rig = copy.deepcopy(self.rig)
            if kind == 'missing':
                rig['bones'][5608]['name'] = 'MISSING'
            else:
                rig['bones'].append(copy.deepcopy(rig['bones'][5608]))
            with self.assertRaisesRegex(ValueError, 'Ambiguous original joint'):
                decode(self.payload, rig)

    def test_corrupt_setup_cannot_create_a_binding(self):
        for payload in [self.payload[:20], b'\xff\xff\xff\xff'+self.payload[4:]]:
            with self.assertRaises(ValueError):
                decode(payload, self.rig)


if __name__ == '__main__':
    unittest.main()
