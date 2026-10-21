"""Recover only native-proven setup joint names and their original rig bindings."""
import hashlib
import json
from decode_forspoken_graph_nodes import Graph, OUT
from link_forspoken_ik_setup import PE, class_identity


def decode_bindings(payload, bones):
    graph = Graph(payload)
    root = graph.table(graph.u32(0))
    joints = graph.tables(root['fields'][2])
    by_name = {}
    for bone in bones:
        by_name.setdefault(bone['name'].casefold(), []).append(bone)
    rows = []
    for index, joint in enumerate(joints):
        name = graph.string(joint['fields'][1])
        matches = by_name.get(name.casefold(), [])
        if len(matches) != 1:
            raise ValueError(f'Expected one original rig binding for {name}, got {len(matches)}')
        bone = matches[0]
        rows.append({'setupJointIndex': index, 'name': name, 'sourceRigIndex': bone['index'],
                     'sourceRigParent': bone['parent'], 'sourceBoneId': bone['sourceBoneId'],
                     'nameFieldIndex': 1,
                     'unclassifiedFields': {str(k): graph.read(at, 4).hex()
                                            for k, at in joint['fields'].items() if k != 1}})
    return rows


def main():
    package = (OUT / 'hu000_ik.tspack').read_bytes()
    inventory = json.loads((OUT / 'native-ik-contracts-v8.json').read_text())['setup']['resources']
    resource = next(r for r in inventory if r['resourceId'] == 1)
    payload = package[resource['offset']:resource['offset'] + resource['spanBytes']]
    if hashlib.sha256(payload).hexdigest() != resource['sha256']:
        raise ValueError('Original setup payload changed')
    rig_path = OUT / 'hu000-rig.json'
    bones = json.loads(rig_path.read_text())['bones']
    binary = (OUT / 'FORSPOKEN.exe').read_bytes()
    pe = PE(binary)
    evidence = {p.name: hashlib.sha256(p.read_bytes()).hexdigest()
                for p in sorted((OUT / 'ghidra-ik-v10').glob('*.c'))}
    result = {'schema': 'forspoken-original-ik-bindings-v10',
              'binarySha256': hashlib.sha256(binary).hexdigest(),
              'rigSha256': hashlib.sha256(rig_path.read_bytes()).hexdigest(),
              'resourceId': 1, 'payloadSha256': resource['sha256'],
              'nativeReader': '0x143f07150', 'hierarchyBuilder': '0x143f061a0',
              'runtimeIdentity': class_identity(pe, 0x146b9e9a0),
              'runtimeConstructor': '0x143e99d50',
              'bindingSemantics': 'Reader compares setup field 1 names case-insensitively to original skeleton names; hierarchy builder traverses original skeleton child links.',
              'joints': decode_bindings(payload, bones),
              'evidenceSha256': evidence,
              'limitations': ['Other setup fields retain raw bytes; no guessed protobuf mapping.',
                              'Original skeleton indices are not Backspool skeleton indices.',
                              'Contact targets, collision sensors, solver updates and wall/tether action selection remain unresolved.',
                              'No gameplay modification or original-motion fidelity certification.']}
    target = OUT / 'ik-rig-bindings-v10.json'
    target.write_text(json.dumps(result, indent=2) + '\n')
    print(f'Recovered {len(result["joints"])} original rig bindings: {target}')


if __name__ == '__main__':
    main()
