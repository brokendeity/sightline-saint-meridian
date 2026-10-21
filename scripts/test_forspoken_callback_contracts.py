import gzip
import hashlib
import json
import struct
import unittest
from build_forspoken_callback_contracts import playback_contract, ROOT, OUT
from inspect_forspoken_graph_runtime import PE


class CallbackContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = (OUT / 'FORSPOKEN.exe').read_bytes()
        cls.result = json.loads(gzip.decompress((ROOT / 'assets/backspool/source-graph-evidence-v7.json.gz').read_bytes()))

    def test_native_registration_and_rtti(self):
        contract = playback_contract(self.data)
        self.assertEqual(contract['nativeFunction'], '0x144c21280')
        self.assertEqual(contract['default'], 1.0)
        pe = PE(self.data)
        state = pe.rtti('.?AVLmAnimStateMachineState@Animation@Luminous@@')
        self.assertEqual(state[0]['vtable'], '0x146bda6d0')
        self.assertEqual(state[0]['methods'], ['0x140517c80'])

    def test_changed_registration_rejected(self):
        b = bytearray(self.data)
        at = PE(b).off(0x144c1ca52)
        struct.pack_into('<I', b, at + 3, 123)
        with self.assertRaises(ValueError):
            playback_contract(b)

    def test_explicit_and_omitted_native_parameter(self):
        nodes = self.result['clipIds']['0x28119eec']
        self.assertEqual(len(nodes), 2)
        self.assertEqual(nodes[0]['callbacks'], {'2': [], '3': []})
        active = nodes[1]
        explicit = active['callbacks']['2'][0]['typedParameters']
        default = active['callbacks']['3'][0]['typedParameters']
        self.assertAlmostEqual(explicit['value'], 1.4, places=6)
        self.assertEqual(explicit['origin'], 'explicit')
        self.assertEqual(default['value'], 1.0)
        self.assertEqual(default['origin'], 'native default')
        self.assertEqual(self.result['typedCallbackCount'], 8)
        self.assertFalse(active['originalRoleVerified'])

    def test_preserved_v6_and_slot_correspondence(self):
        old = ROOT / 'assets/backspool/source-graph-evidence-v6.json.gz'
        self.assertEqual(hashlib.sha256(old.read_bytes()).hexdigest(), '9abfd897e6bbe82894b496acb0585faad561587082117ea98f74adef162e2ac7')
        for nodes in self.result['clipIds'].values():
            for node in nodes:
                for field, references in [('2', 'field4References'), ('3', 'field5References')]:
                    self.assertEqual(len(node['callbacks'][field]), len(node[references]))
                    self.assertEqual([c['nativeFunctionId'] for c in node['callbacks'][field]], node[references])


if __name__ == '__main__':
    unittest.main()
