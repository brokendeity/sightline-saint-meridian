import json
import struct
import unittest
from pathlib import Path
from recover_forspoken_controller_contracts import names, tables, relationships, OUT


class ControllerContracts(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dictionary = (OUT/'param_table_cache_translation.id2s').read_bytes()
        cls.labels = names(cls.dictionary)
        cls.data = (OUT/'parkour.parambin').read_bytes()
        cls.decoded = tables(cls.data, cls.labels)

    def test_dictionary_consumption_and_exact_labels(self):
        self.assertEqual(len(self.labels), 305642)
        self.assertEqual(self.labels[0x28119eec]['name'], 'ldr_ntl_move_loop_base_u000a')
        self.assertEqual(self.labels[0x2811042b]['name'], 'pkr000_mgc_climb_first_base_h300a')
        self.assertEqual(self.labels[0x2811b550]['name'], 'pkr_mgc_grab_base_f000a')

    def test_dictionary_rejects_truncation_and_trailing_data(self):
        for broken in [self.dictionary[:-1], self.dictionary+b'\0']:
            with self.assertRaises(ValueError):
                names(broken)

    def test_tables_and_original_action_identity(self):
        self.assertEqual(len(self.decoded), 18)
        action = next(t for t in self.decoded if t['id'] == '0x01078c86')
        self.assertEqual(len(action['rows']), 94)
        climb = next(r for r in action['rows'] if r['name'] == 'PARKOUR_ACTION_CLIMB')
        self.assertEqual(climb['values']['0x01001e8d']['referenceName'], 'PARKOUR_ACTION_TYPE_CLIMB')
        self.assertEqual(climb['values']['0x0100494b']['rawU32'], 0x46ae2e7)

    def test_float_parameter_bits(self):
        row = next(r for t in self.decoded for r in t['rows'] if r['name'] == 'PARKOUR_PARAM_CUFF_MOVE_TIME')
        cell = row['values']['0x0100c5d4']
        self.assertEqual(cell['float32'], 3)
        self.assertEqual(cell['rawU32'], 0x40400000)

    def test_malformed_table_is_rejected(self):
        for broken in [self.data[:-1], b'Bad!'+self.data[4:]]:
            with self.assertRaises(ValueError):
                tables(broken, self.labels)
        corrupted = bytearray(self.data)
        struct.pack_into('<I', corrupted, 0x70+20, 1)
        with self.assertRaises(ValueError):
            tables(corrupted, self.labels)

    def test_reference_arrays_have_original_pool_offsets(self):
        action = next(t for t in self.decoded if t['id'] == '0x01078c86')
        arrays = [c['id'] for c in action['columns'] if c['typeCode'] == 18]
        self.assertTrue(arrays)
        climb = next(r for r in action['rows'] if r['name'] == 'PARKOUR_ACTION_CLIMB')
        cell = climb['values']['0x01079ee2']
        self.assertEqual(cell['arrayOffset'], action['arrayPool']+cell['rawU32']*4)
        self.assertEqual(cell['referenceIds'], [0x107e073, 0x1079166, 0x1079166])
        self.assertEqual(cell['arrayLength'], 3)
        self.assertEqual(struct.unpack_from('<4I', self.data, cell['arrayOffset']),
                         (3, *cell['referenceIds']))

    def test_array_bounds_fail_closed(self):
        action = next(t for t in self.decoded if t['id'] == '0x01078c86')
        cell = action['rows'][0]['values']['0x01079ee2']
        for offset, value in [(cell['offset'], 0xffffffff), (cell['offset'], 0x7fffffff),
                              (cell['arrayOffset'], 0xffffffff), (cell['arrayOffset'], 100000)]:
            broken = bytearray(self.data)
            struct.pack_into('<I', broken, offset, value)
            with self.assertRaisesRegex(ValueError, 'Array'):
                tables(broken, self.labels)

    def test_original_abilities_link_actions_without_dropping_unknown_slots(self):
        linked = relationships(self.decoded)
        self.assertEqual(len(linked['abilities']), 39)
        self.assertEqual(len(linked['conditions']), 24)
        self.assertEqual(len(linked['actions']), 94)
        sprint = next(a for a in linked['abilities'] if a['name'] == 'PARKOUR_ABILITY_SPRINT')
        self.assertEqual(sprint['actions'], ['0x010799d1', '0x01079e4a'])
        self.assertEqual(len(sprint['sourceActionSlots']), 29)
        self.assertTrue(sprint['unresolvedSlots'])
        climb = next(a for a in linked['actions'] if a['name'] == 'PARKOUR_ACTION_CLIMB')
        self.assertEqual(climb['actorAction'], 0x046ae2e7)
        self.assertEqual(climb['buttonConditions'][0]['controlKind'], 0x1079170)
        hold = next(c for c in linked['conditions'] if c['id'] == '0x010866d8')
        self.assertEqual(hold['holdMin'], struct.unpack('<f', struct.pack('<f', .1))[0])
        self.assertEqual(hold['holdMax'], struct.unpack('<f', struct.pack('<f', .15))[0])

    def test_source_only_roles_match_dictionary_and_hash(self):
        import gzip, hashlib
        root = OUT.parents[1]
        manifest = json.loads((root/'assets/backspool/traversal-named-parkour-roles-v12.json').read_text())
        self.assertEqual(len(manifest['roles']), 14)
        for role in manifest['roles']:
            self.assertEqual(self.labels[int(role['sourceAnimationId'], 16)]['name'], role['originalMotionName'])
            data = (root/role['url']).read_bytes()
            self.assertEqual(hashlib.sha256(data).hexdigest(), role['sha256'])
            clip = json.loads(gzip.decompress(data))
            self.assertEqual(clip['userData']['sourceAnimationId'], role['sourceAnimationId'])
            self.assertEqual(role['playbackRate'], 1)
        self.assertFalse(manifest['originalControllerVerified'])
        self.assertFalse(manifest['originalIKVerified'])


if __name__ == '__main__':
    unittest.main()
