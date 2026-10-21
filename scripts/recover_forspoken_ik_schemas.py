"""Extract exact native-length protobuf descriptors; no guessed string boundary."""
import hashlib
import json
import os
import struct
from pathlib import Path
# The installed upb backend crashed on an incomplete dynamic proto2 extension
# fixture. Use predictable pure-Python validation for these small descriptors.
os.environ.setdefault('PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION', 'python')
from google.protobuf import descriptor_pb2, descriptor_pool, json_format, text_format
from inspect_forspoken_graph_runtime import PE, OUT

BINDINGS = {
    'TuningSetCommon.proto': 0x143ebcbaf,
    'IKData.proto': 0x143effe01,
    'IKTunings.proto': 0x143ee60e1,
}


def extract(data, name, reference):
    pe = PE(data)
    at = pe.off(reference)
    if data[at - 5] != 0xba or data[at:at + 3] != bytes.fromhex('488d0d'):
        raise ValueError('Descriptor pointer/length instruction pattern changed')
    length = struct.unpack_from('<I', data, at - 4)[0]
    target = reference + 7 + struct.unpack_from('<i', data, at + 3)[0]
    begin = pe.off(target)
    section = pe.section(target)
    if not 0 < length <= 1024 * 1024 or begin + length > section[4] + section[3]:
        raise ValueError('Descriptor exceeds bounded source section')
    payload = data[begin:begin + length]
    descriptor = descriptor_pb2.FileDescriptorProto()
    if descriptor.MergeFromString(payload) != length or descriptor.name != name:
        raise ValueError('Native-length descriptor identity/consumption mismatch')
    if data[at + 7] != 0xe8:
        raise ValueError('Missing descriptor registration call')
    call_target = reference + 12 + struct.unpack_from('<i', data, at + 8)[0]
    evidence = {'name': name, 'reference': hex(reference), 'lengthInstruction': hex(reference - 5),
                'target': hex(target), 'fileOffset': begin, 'byteLength': length,
                'sha256': hashlib.sha256(payload).hexdigest(), 'registrationCallTarget': hex(call_target)}
    return payload, descriptor, evidence


def catalog(descriptor):
    messages, enums = [], []
    def enum(e, prefix):
        enums.append({'name': prefix + e.name, 'values': {v.name: v.number for v in e.value}})
    def message(m, prefix):
        name = prefix + m.name
        messages.append({'name': name, 'fields': [json_format.MessageToDict(f, preserving_proto_field_name=True) for f in m.field],
                         'extensions': [json_format.MessageToDict(f, preserving_proto_field_name=True) for f in m.extension]})
        for n in m.nested_type:
            message(n, name + '.')
        for e in m.enum_type:
            enum(e, name + '.')
    for m in descriptor.message_type:
        message(m, descriptor.package + '.')
    for e in descriptor.enum_type:
        enum(e, descriptor.package + '.')
    return {'name': descriptor.name, 'package': descriptor.package, 'dependencies': list(descriptor.dependency),
            'messages': messages, 'enums': enums}


def main():
    data = (OUT / 'FORSPOKEN.exe').read_bytes()
    target = OUT / 'ik-schemas-v9'
    target.mkdir(exist_ok=True)
    pool = descriptor_pool.DescriptorPool()
    descriptor_set = descriptor_pb2.FileDescriptorSet()
    rows = []
    for name, reference in BINDINGS.items():
        raw, descriptor, evidence = extract(data, name, reference)
        pool.AddSerializedFile(raw)
        descriptor_set.file.add().CopyFrom(descriptor)
        stem = name.removesuffix('.proto')
        (target / (stem + '.descriptor.bin')).write_bytes(raw)
        (target / (stem + '.descriptor.textproto')).write_text(text_format.MessageToString(descriptor))
        row = catalog(descriptor)
        row['evidence'] = evidence
        rows.append(row)
    (target / 'IK.descriptor-set.bin').write_bytes(descriptor_set.SerializeToString())
    doc = {'schema': 'forspoken-native-ik-schemas-v9', 'binarySha256': hashlib.sha256(data).hexdigest(),
           'files': rows, 'messageCount': sum(len(r['messages']) for r in rows),
           'enumCount': sum(len(r['enums']) for r in rows),
           'fieldCount': sum(len(m['fields']) for r in rows for m in r['messages']),
           'limitations': ['These are original protobuf schema declarations, not reconstructed original .proto source formatting.',
                          'The six tspack resources use FlatBuffer roots; protobuf field numbering is not blindly applied to them.',
                          'No solver, runtime wall/tether state mapping or original visual fidelity is certified.']}
    (target / 'manifest.json').write_text(json.dumps(doc, indent=2) + '\n')
    lines = ['# Original IK schema catalog', '', 'Recovered from exact native registration lengths. Setup-pack schema association and solver behavior remain separate evidence gates.', '']
    for row in rows:
        lines += ['## ' + row['name'], '', f"Original payload: {row['evidence']['byteLength']} bytes; SHA-256 `{row['evidence']['sha256']}`.", '']
        for message in row['messages']:
            lines += ['### ' + message['name'], '', '| Field | Name | Type | Declared default |', '|---|---|---|---|']
            for f in message['fields']:
                lines += [f"| {f['number']} | {f['name']} | {f.get('type_name', f['type'])} | {f.get('default_value', 'not declared')} |"]
            lines += ['']
    (target / 'CATALOG.md').write_text('\n'.join(lines))
    print(json.dumps({k: doc[k] for k in ['messageCount', 'enumCount', 'fieldCount']}))


if __name__ == '__main__':
    main()
