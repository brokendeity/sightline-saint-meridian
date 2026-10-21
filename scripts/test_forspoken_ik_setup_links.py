import json
import unittest
from link_forspoken_ik_setup import OUT, PE, class_identity


class SetupLinkTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.result = json.loads((OUT / 'ik-setup-native-links-v9.json').read_text())
        cls.pe = PE((OUT / 'FORSPOKEN.exe').read_bytes())

    def test_original_rtti_controller_identities(self):
        rows = {r['resourceId']: r for r in self.result['resources']}
        for r in rows.values():
            if r['controllerIdentity']:
                self.assertEqual(class_identity(self.pe, int(r['controllerIdentity']['vtable'], 16)), r['controllerIdentity'])
        self.assertIn('UIKLookAtTuning', rows[3]['controllerIdentity']['className'])
        self.assertEqual(rows[6]['controllerIdentity'], rows[3]['controllerIdentity'])
        self.assertIn('EyesController', rows[4]['controllerIdentity']['className'])
        self.assertIn('SaccadeController', rows[5]['controllerIdentity']['className'])
        self.assertIsNone(rows[1]['controllerIdentity'])
        self.assertIsNone(rows[2]['controllerIdentity'])

    def test_indexed_branch_pointer_matches_configuration(self):
        row = next(r for r in self.result['resources'] if r['resourceId'] == 6)
        self.assertEqual(row['controllerSlot'], 6)
        self.assertEqual(int(row['controllerPointerOffset'], 16), 0x1498 + 6 * 8)
        self.assertEqual(row['controllerPointerOffset'], self.result['indexedCallback6']['controllerPointerOffset'])

    def test_loader_retains_all_original_hashes_and_readers(self):
        loader = (OUT / 'ghidra-ik-v9/143469330.c').read_text()
        for row in self.result['resources']:
            self.assertIn(row['resourceHash'], loader)
            self.assertIn(row['nativeReader'][2:], loader)
            self.assertFalse(row['flatbufferFieldSchemaRecovered'])


if __name__ == '__main__':
    unittest.main()
