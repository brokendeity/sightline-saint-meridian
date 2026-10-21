import json
import unittest
from recover_forspoken_ik_bindings import OUT, decode_bindings


class BindingTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.bones = json.loads((OUT / 'hu000-rig.json').read_text())['bones']
        cls.payload = (OUT / 'hu000_ik.tspack').read_bytes()[112:1984]
        cls.rows = decode_bindings(cls.payload, cls.bones)

    def test_all_original_named_joints_resolve(self):
        self.assertEqual(len(self.rows), 27)
        self.assertEqual(len({r['sourceRigIndex'] for r in self.rows}), 27)
        for r in self.rows:
            self.assertEqual(self.bones[r['sourceRigIndex']]['name'], r['name'])
        self.assertTrue({'L_Hand', 'R_Hand', 'L_Foot', 'R_Foot', 'C_Hip'} <= {r['name'] for r in self.rows})

    def test_case_insensitive_native_lookup(self):
        changed = [dict(b, name=b['name'].swapcase()) for b in self.bones]
        self.assertEqual(decode_bindings(self.payload, changed), self.rows)

    def test_missing_or_ambiguous_binding_fails(self):
        hip = next(b for b in self.bones if b['name'] == 'C_Hip')
        with self.assertRaises(ValueError):
            decode_bindings(self.payload, [b for b in self.bones if b is not hip])
        with self.assertRaises(ValueError):
            decode_bindings(self.payload, self.bones + [hip])

    def test_truncation_fails(self):
        with self.assertRaises(ValueError):
            decode_bindings(self.payload[:100], self.bones)


if __name__ == '__main__':
    unittest.main()
