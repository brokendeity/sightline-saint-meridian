import hashlib
import json
import os
import unittest
os.environ['PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION'] = 'python'
from google.protobuf import descriptor_pb2, descriptor_pool, message_factory
from recover_forspoken_ik_schemas import BINDINGS, OUT, PE, extract


class IKSchemaTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = (OUT / 'FORSPOKEN.exe').read_bytes()
        cls.folder = OUT / 'ik-schemas-v9'
        cls.manifest = json.loads((cls.folder / 'manifest.json').read_text())
        cls.pool = descriptor_pool.DescriptorPool()
        for name in BINDINGS:
            cls.pool.AddSerializedFile((cls.folder / (name.removesuffix('.proto') + '.descriptor.bin')).read_bytes())

    def test_exact_native_lengths_hashes_and_common_registration(self):
        sizes = {'TuningSetCommon.proto': 88, 'IKData.proto': 5782, 'IKTunings.proto': 12577}
        for row in self.manifest['files']:
            raw, descriptor, proof = extract(self.data, row['name'], BINDINGS[row['name']])
            self.assertEqual(len(raw), sizes[row['name']])
            self.assertEqual(proof, row['evidence'])
            self.assertEqual(proof['sha256'], hashlib.sha256(raw).hexdigest())
            self.assertEqual(proof['registrationCallTarget'], '0x1430e6ed0')
            self.assertEqual(descriptor.name, row['name'])

    def test_complete_descriptor_set_and_dependency_resolution(self):
        records = descriptor_pb2.FileDescriptorSet.FromString((self.folder / 'IK.descriptor-set.bin').read_bytes())
        self.assertEqual(len(records.file), 3)
        self.assertEqual(self.manifest['messageCount'], 75)
        self.assertEqual(self.manifest['enumCount'], 11)
        self.assertEqual(self.manifest['fieldCount'], 375)
        joint = self.pool.FindMessageTypeByName('Luminous.IK.Protobuf.Joint')
        self.assertEqual(joint.fields_by_name['bindpose'].message_type.full_name, 'Luminous.IK.Protobuf.Frame')
        self.assertEqual(self.pool.FindEnumTypeByName('Luminous.IK.Protobuf.JointType').values_by_name['JointTypeDoubleHinge'].number, 3)

    def test_declared_defaults_are_not_zeroed(self):
        wall = message_factory.GetMessageClass(self.pool.FindMessageTypeByName('Tuning_Protobuf.WallTouchTuning'))()
        self.assertEqual(wall.accel, 40)
        self.assertAlmostEqual(wall.damping, 0.1)
        self.assertEqual(wall.sensor.reference, 'Trans')
        self.assertEqual(wall.sensor.range, 0.5)

    def test_original_extension_schema_roundtrip(self):
        base_class = message_factory.GetMessageClass(self.pool.FindMessageTypeByName('Tuning_Protobuf.TuningSetBase'))
        ext = self.pool.FindExtensionByName('Tuning_Protobuf.IKLookAtTuning.ext')
        self.assertEqual(ext.number, 16777243)
        base = base_class(TypeID=ext.number)
        base.Extensions[ext].tracker.SetInParent()
        joint = base.Extensions[ext].chain.add()
        joint.joint_name = 'C_Neck'
        joint.contribution = 0.5
        restored = base_class.FromString(base.SerializeToString())
        self.assertEqual(restored.Extensions[ext].chain[0].joint_name, 'C_Neck')
        self.assertEqual(restored.Extensions[ext].chain[0].contribution, 0.5)

    def test_changed_native_length_fails_closed(self):
        raw = bytearray(self.data)
        at = PE(raw).off(BINDINGS['IKData.proto'])
        raw[at - 4:at] = b'\xff' * 4
        with self.assertRaises(ValueError):
            extract(raw, 'IKData.proto', BINDINGS['IKData.proto'])


if __name__ == '__main__':
    unittest.main()
