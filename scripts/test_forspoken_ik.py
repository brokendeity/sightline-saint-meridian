import json
import tempfile
import unittest
from pathlib import Path
from decode_forspoken_ik import OUT, SPECS, parameter_reader, registry, setup_inventory, typed_callback


class IKRecoveryTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.report = json.loads((OUT / 'native-ik-contracts-v8.json').read_text())
        cls.source = json.loads((OUT / 'root-motion-nodes.json').read_text())

    def test_native_callback_bindings(self):
        data = (OUT / 'FORSPOKEN.exe').read_bytes()
        for name, spec in SPECS.items():
            self.assertEqual(registry(data, spec), self.report['bindings'][name])
        self.assertEqual(len(self.report['callbacks']), 44)
        self.assertEqual(len({c['stateIndex'] for c in self.report['callbacks']}), 28)

    def test_short_field_is_not_read_as_float_or_u32(self):
        node = self.source['nodes'][6060]
        callback = next(c for c in node['callbacks']['2'] if c['path'].endswith('IKEnable.json')
                        and any(s['fieldIndex'] == 0 for s in c['parameters']['scalarFields']))
        read = parameter_reader(callback)
        self.assertEqual(read(0, '<h', 0)['value'], 6)
        with self.assertRaises(ValueError):
            read(0, '<I', 0)
        decoded = typed_callback(callback, 0.25)
        self.assertEqual(decoded['identifier']['value'], 74102090)
        self.assertTrue(decoded['identifierForwarded'])
        self.assertIsNone(decoded['indexedTargetMeaning'])

    def test_global_branch_does_not_consume_identifier(self):
        record = next(r for r in self.report['callbacks'] if r['stateIndex'] == 821 and r['listField'] == 3)
        params = record['parameters']
        self.assertEqual(params['branchIndex']['value'], 0)
        self.assertEqual(params['identifier']['value'], 67400226)
        self.assertFalse(params['identifierForwarded'])

    def test_hip_flag_and_defaults(self):
        record = next(r for r in self.report['callbacks'] if r['stateIndex'] == 68)
        self.assertFalse(record['parameters']['enabled']['value'])
        self.assertEqual(record['parameters']['enabled']['widthBytes'], 1)
        self.assertEqual(record['parameters']['transitionValue']['value'], 0.5)
        # A valid empty parameter table exercises defaults of the native hip schema.
        callback = self.source['nodes'][746]['callbacks']['3'][0].copy()
        callback['path'] = 'sdk://udf/Animation/Animation/EnableIKHipCorrection.json'
        empty = typed_callback(callback, 0.25)
        self.assertTrue(empty['enabled']['value'])
        self.assertEqual(empty['enabled']['origin'], 'native default')
        self.assertEqual(empty['transitionValue']['value'], 0.25)

    def test_setup_source_identity_and_rig_names(self):
        setup = setup_inventory(OUT / 'hu000_ik.tspack')
        proof = json.loads((OUT / 'hu000_ik.tspack.provenance.json').read_text())
        self.assertEqual(setup['sha256'], proof['decodedSha256'])
        self.assertEqual(setup['resourceCount'], 6)
        self.assertEqual([r['resourceId'] for r in setup['resources']], [1, 2, 3, 4, 5, 6])
        self.assertEqual(sum(len(r['exactRigNameOccurrences']) for r in setup['resources']), 48)
        names = {n['name'] for r in setup['resources'] for n in r['exactRigNameOccurrences']}
        self.assertTrue({'C_Hip', 'L_Foot', 'R_Foot', 'L_Hand', 'R_Hand', 'C_Head'} <= names)
        self.assertTrue(all(r['solverRole'] is None for r in setup['resources']))

    def test_malformed_setup_rejected(self):
        data = bytearray((OUT / 'hu000_ik.tspack').read_bytes())
        data[32:36] = b'\xff' * 4
        with tempfile.TemporaryDirectory() as folder:
            p = Path(folder) / 'bad.tspack'
            p.write_bytes(data)
            with self.assertRaises(ValueError):
                setup_inventory(p)


if __name__ == '__main__':
    unittest.main()
