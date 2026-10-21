"""Native-backed IK callback fields and immutable Frey setup inventory.

Does not infer solver names from package position, emulate IK, or alter gameplay.
"""
import hashlib
import json
import re
import struct
from pathlib import Path
from decode_forspoken_graph_nodes import Graph, OUT
from inspect_forspoken_graph_runtime import PE

ROOT = Path(__file__).resolve().parents[1]
SPECS = {
    'EnableIKHipCorrection.json': (0x046b03cb, 0x144c1cfd2, 0x144c1cfdd, 0x144c1d720),
    'IKDisable.json': (0x040ce7be, 0x144c1c2d2, 0x144c1c2dd, 0x144c1f890),
    'IKEnable.json': (0x040ce7bd, 0x144c1c252, 0x144c1c25d, 0x144c1fa90),
}


def registry(data, spec):
    ident, instruction, lea, target = spec
    pe = PE(data)
    at = pe.off(instruction)
    if data[at:at + 3] != bytes.fromhex('c74510') or struct.unpack_from('<I', data, at + 3)[0] != ident:
        raise ValueError('IK callback registry ID changed')
    at = pe.off(lea)
    if data[at:at + 3] != bytes.fromhex('488d0d'):
        raise ValueError('IK callback pointer instruction changed')
    resolved = lea + 7 + struct.unpack_from('<i', data, at + 3)[0]
    if resolved != target or not pe.code(resolved):
        raise ValueError('IK native function binding changed')
    return {'nativeId': ident, 'registryInstruction': hex(instruction), 'nativeFunction': hex(target)}


def parameter_reader(callback):
    raw = bytes.fromhex(callback['parameters']['bytesHex'])
    graph = Graph(raw)
    table = graph.table(graph.u32(0))
    fields = table['fields']
    def scalar(index, fmt, default):
        if index not in fields:
            return {'value': default, 'origin': 'native default'}
        at = fields[index]
        end = min([p for p in fields.values() if p > at] + [table['offset'] + table['objectBytes']])
        if at + struct.calcsize(fmt) > end:
            raise ValueError('Typed IK field overlaps an adjacent field')
        value = struct.unpack(fmt, graph.read(at, struct.calcsize(fmt)))[0]
        return {'value': value, 'origin': 'explicit', 'byteOffsetInParameterBuffer': at,
                'widthBytes': struct.calcsize(fmt)}
    return scalar


def typed_callback(callback, hip_default):
    name = callback['path'].split('/')[-1]
    read = parameter_reader(callback)
    if name == 'EnableIKHipCorrection.json':
        enabled = read(0, '<B', 1)
        enabled['value'] = enabled['value'] != 0
        transition = read(1, '<f', hip_default)
        return {'name': name, 'enabled': enabled, 'transitionValue': transition,
                'transitionUnit': 'not yet established from the update consumer',
                'solverReconstructed': False}
    kind = read(0, '<h', 0)
    identifier = read(1, '<I', 0)
    return {'name': name, 'branchIndex': kind, 'identifier': identifier,
            'branch': 'global component enable/disable' if kind['value'] == 0 else 'indexed native dispatch',
            'identifierForwarded': kind['value'] != 0,
            'indexedTargetMeaning': None, 'identifierSemanticUse': 'not established for indexed dispatch' if kind['value'] else 'not read by global branch', 'solverReconstructed': False}


def setup_inventory(path):
    b = path.read_bytes()
    if len(b) < 32:
        raise ValueError('Truncated IK setup package')
    _, guid, size, kind, nids, overrides, count = struct.unpack_from('<Q6I', b)
    if size != len(b) or count != nids or not 0 < count <= 64 or overrides:
        raise ValueError('Unsupported IK setup package header')
    end = 36 + 4 * (count * 2 + nids)
    if end > len(b):
        raise ValueError('Truncated IK setup index')
    offsets = list(struct.unpack_from('<%dI' % count, b, 32))
    ids = struct.unpack_from('<%dI' % nids, b, 32 + count * 4)
    hashes = struct.unpack_from('<%dI' % count, b, 36 + (count + nids) * 4)
    if offsets != sorted(set(offsets)) or offsets[0] < end or offsets[-1] >= len(b):
        raise ValueError('Invalid IK setup resource spans')
    rig = json.loads((OUT / 'hu000-rig.json').read_text())
    bones = {bone['name']: bone for bone in rig['bones']}
    resources = []
    for i, begin in enumerate(offsets):
        finish = offsets[i + 1] if i + 1 < count else len(b)
        payload = b[begin:finish]
        graph = Graph(payload)
        table = graph.table(graph.u32(0))
        names = []
        for match in re.finditer(rb'[A-Za-z][A-Za-z0-9_]{2,}\x00', payload):
            name = match[0][:-1].decode()
            if name in bones:
                names.append({'name': name, 'absoluteOffset': begin + match.start(),
                              'sourceBoneId': bones[name]['sourceBoneId'], 'rigIndex': bones[name]['index']})
        resources.append({'index': i, 'resourceId': ids[i], 'hash': hex(hashes[i]),
                          'offset': begin, 'spanBytes': len(payload), 'sha256': hashlib.sha256(payload).hexdigest(),
                          'rootOffset': begin + table['offset'],
                          'rootFieldOffsets': {str(k): begin + v for k, v in table['fields'].items()},
                          'exactRigNameOccurrences': names, 'solverRole': None,
                          'fieldTypes': 'unresolved; raw fields are not assigned guessed joint/constraint meanings'})
    return {'path': str(path), 'sha256': hashlib.sha256(b).hexdigest(), 'sizeBytes': len(b),
            'guid': hex(guid), 'packageType': kind, 'resourceCount': count,
            'resources': resources, 'originalSolverRecovered': False}


def main():
    data = (OUT / 'FORSPOKEN.exe').read_bytes()
    bindings = {name: registry(data, spec) for name, spec in SPECS.items()}
    hip_default = struct.unpack_from('<f', data, PE(data).off(0x146d53bf0))[0]
    if hip_default != 0.25:
        raise ValueError('Hip transition default changed')
    nodes = json.loads((OUT / 'root-motion-nodes.json').read_text())['nodes']
    records = []
    for node in nodes:
        for field, ref in [('2', 'field4References'), ('3', 'field5References')]:
            if len(node['callbacks'][field]) != len(node[ref]):
                raise ValueError('IK callback/reference correspondence mismatch')
            for callback, ident in zip(node['callbacks'][field], node[ref]):
                name = callback['path'].split('/')[-1]
                if name not in bindings:
                    continue
                if ident != bindings[name]['nativeId']:
                    raise ValueError('IK callback path/native ID mismatch')
                records.append({'stateIndex': node['index'], 'resourceId': node['resourceId'],
                                'listField': int(field), 'callbackOffset': callback['offset'],
                                'nativeBinding': bindings[name], 'parameters': typed_callback(callback, hip_default),
                                'wallOrTetherIdentity': None})
    setup = setup_inventory(OUT / 'hu000_ik.tspack')
    result = {'schema': 'forspoken-native-ik-contracts-v8',
              'binarySha256': hashlib.sha256(data).hexdigest(), 'bindings': bindings,
              'hipTransitionDefault': hip_default, 'setup': setup, 'callbacks': records,
              'limitations': ['No original solver or wall/tether action mapping is implemented.',
                             'Callback phase and controller selection remain unresolved.',
                             'Rig-name occurrences are exact matches, not a recovered constraint schema.',
                             'Global IK branches do not consume their optional identifier field.']}
    (OUT / 'native-ik-contracts-v8.json').write_text(json.dumps(result, indent=2, allow_nan=False) + '\n')
    print(json.dumps({'callbacks': len(records), 'states': len({r['stateIndex'] for r in records}),
                      'setupResources': setup['resourceCount'],
                      'boneNameOccurrences': sum(len(r['exactRigNameOccurrences']) for r in setup['resources'])}))


if __name__ == '__main__':
    main()
