"""Native loader + MSVC RTTI associations, without inferred FlatBuffer fields."""
import hashlib
import json
import struct
from inspect_forspoken_graph_runtime import PE, OUT

READERS = {
    1: ('143f07150', None, None),
    2: ('143e94630', None, None),
    3: ('143e94d20', 0x146ba7c90, 0),
    4: ('143e94a30', 0x146b9f0a8, 10),
    5: ('143e94640', 0x146b9e8d8, 12),
    6: ('143e94d00', 0x146ba7c90, 6),
}


def class_identity(pe, vtable):
    data = pe.data
    locator = struct.unpack_from('<Q', data, pe.off(vtable) - 8)[0]
    sig, subobject, _, descriptor, _, self_rva = struct.unpack_from('<6I', data, pe.off(locator))
    if sig != 1 or self_rva + pe.base != locator:
        raise ValueError('Invalid IK controller complete-object locator')
    name_at = pe.off(pe.base + descriptor) + 16
    end = data.index(0, name_at, name_at + 512)
    return {'vtable': hex(vtable), 'locator': hex(locator), 'subobjectOffset': subobject,
            'className': data[name_at:end].decode('ascii')}


def main():
    data = (OUT / 'FORSPOKEN.exe').read_bytes()
    pe = PE(data)
    source = json.loads((OUT / 'native-ik-contracts-v8.json').read_text())
    loader = OUT / 'ghidra-ik-v9/143469330.c'
    rows = []
    for resource in source['setup']['resources']:
        index = resource['resourceId']
        reader, vtable, slot = READERS[index]
        path = OUT / 'ghidra-ik-v9' / (reader + '.c')
        rows.append({'resourceId': index, 'resourceHash': resource['hash'],
                     'payloadSha256': resource['sha256'], 'nativeReader': '0x' + reader,
                     'nativeLoader': '0x143469330',
                     'readerEvidenceSha256': hashlib.sha256(path.read_bytes()).hexdigest(),
                     'controllerIdentity': class_identity(pe, vtable) if vtable else None,
                     'controllerSlot': slot,
                     'controllerPointerOffset': hex(0x1498 + slot * 8) if slot is not None else None,
                     'flatbufferFieldSchemaRecovered': False})
    result = {'schema': 'forspoken-ik-setup-native-links-v9',
              'binarySha256': hashlib.sha256(data).hexdigest(),
              'loaderEvidenceSha256': hashlib.sha256(loader.read_bytes()).hexdigest(),
              'resources': rows,
              'indexedCallback6': {'configurationResourceId': 6, 'nativeReader': '0x143e94d00',
                                   'controllerPointerOffset': '0x14c8',
                                   'meaning': 'Second look-at controller; animated target and selected body chain remain unresolved'},
              'limitations': ['Class identity does not prove original target coordinates or solver update behavior.',
                              'Protobuf schemas are retained separately from the FlatBuffer setup resources.',
                              'The two unclassified resources are not labelled as foot/wall solvers without evidence.',
                              'No gameplay change or original fidelity certification.']}
    (OUT / 'ik-setup-native-links-v9.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()
