import json
import struct
import unittest
from decode_forspoken_graph_nodes import Graph, OUT, decode


class GraphNodeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.path = OUT / 'movement-assets/40009-hu000_root.anmgph'
        cls.data = cls.path.read_bytes()
        cls.result = decode(cls.path, json.loads((OUT / 'full-player-inventory/manifest.json').read_text()))

    def test_root_vector_and_coverage(self):
        self.assertEqual(self.result['nodeCount'], 6065)
        self.assertEqual(self.result['referencedSourceMotionIds'], 1004)
        self.assertEqual(self.result['motionNodeCount'], 1737)
        self.assertEqual(self.result['failures'], [])
        self.assertEqual(len({n['offset'] for n in self.result['nodes']}), 6065)

    def test_distinct_ladder_contexts_and_callback_payload(self):
        nodes = [n for n in self.result['nodes'] if n['resourceId'] == '0x28119eec']
        self.assertEqual([n['index'] for n in nodes], [735, 746])
        self.assertEqual(nodes[0]['callbacks'], {'2': [], '3': []})
        active = nodes[1]
        self.assertEqual(active['offset'], 2332388)
        rate = active['callbacks']['2'][0]
        self.assertTrue(rate['path'].endswith('/SetPlaybackRate.json'))
        scalar = rate['parameters']['scalarFields'][0]
        self.assertEqual(scalar['absoluteOffset'], 2332588)
        self.assertEqual(scalar['u32'], 0x3fb33333)
        self.assertAlmostEqual(scalar['f32Interpretation'], 1.4, places=6)
        # An omitted value is not silently converted to an assumed zero rate.
        self.assertEqual(active['callbacks']['3'][0]['parameters']['scalarFields'], [])
        self.assertIn('unknown', active['callbacks']['3'][0]['parameters']['omittedFieldDefaults'])

    def test_membership_does_not_name_or_certify_actions(self):
        self.assertTrue(all(n['semanticActionName'] is None and not n['originalRoleVerified'] for n in self.result['nodes']))
        # This ID occurs in graph bytes, but isn't a direct resource in this vector.
        self.assertIn(struct.pack('<I', 0x281103f8), self.data)
        self.assertFalse(any(n['resourceId'] == '0x281103f8' for n in self.result['nodes']))

    def test_malformed_graph_is_rejected(self):
        g = Graph(self.data)
        root = g.table(g.u32(0))
        p, count = g.vector(root['fields'][4])
        corrupt = bytearray(self.data)
        struct.pack_into('<I', corrupt, p, 0xffffffff)
        with self.assertRaises(ValueError):
            Graph(corrupt).tables(root['fields'][4])
        with self.assertRaises(ValueError):
            g.table(len(self.data) - 1)
        with self.assertRaises(ValueError):
            g.read(-1, 4)


if __name__ == '__main__':
    unittest.main()
