"""Recover native biped input order from setup chains and their actual readers.

Original rig indices are never used as target-hero indices. No target execution.
"""
import gzip
import hashlib
import json
from pathlib import Path
from decode_forspoken_graph_nodes import Graph, OUT

ROOT = Path(__file__).resolve().parents[1]


def decode(payload, rig):
    g = Graph(payload)
    root = g.table(g.u32(0))
    joints = g.tables(root['fields'][2])
    by_name = {}
    for bone in rig['bones']:
        by_name.setdefault(bone['name'].casefold(), []).append(bone)

    def resolve(index):
        if not 0 <= index < len(joints):
            raise ValueError('Setup joint index outside directory')
        name = g.string(joints[index]['fields'][1])
        matches = by_name.get(name.casefold(), [])
        if len(matches) != 1:
            raise ValueError('Ambiguous original joint '+name)
        bone = matches[0]
        return {'setupJointIndex': index, 'name': name, 'sourceRigIndex': bone['index'],
                'sourceBoneId': bone['sourceBoneId'], 'sourceRigParent': bone['parent']}

    base = []
    for chain in g.tables(root['fields'][3]):
        kind = g.u32(chain['fields'][0]) if 0 in chain['fields'] else 0
        at, n = g.vector(chain['fields'][1])
        indices = [g.u32(at+4+i*4) for i in range(n)]
        base.append({'kind': kind, 'offset': chain['offset'], 'joints': [resolve(i) for i in indices]})
    hips = [chain for chain in base if chain['kind'] == 7]
    if len(hips) != 1 or len(hips[0]['joints']) != 1:
        raise ValueError('Unresolved original biped root chain')
    legs = {}
    for chain in g.tables(root['fields'][5]):
        # Native 143ead050: absent kind / kind0 -> slots5..8, kind1 -> slots1..4.
        kind = g.u32(chain['fields'][0]) if 0 in chain['fields'] else 0
        if kind not in [0, 1] or kind in legs:
            raise ValueError('Unsupported or duplicate biped limb kind')
        ids = [g.u32(chain['fields'][f]) if f in chain['fields'] else 0 for f in range(3, 7)]
        legs[kind] = {'kind': kind, 'offset': chain['offset'], 'joints': [resolve(i) for i in ids]}
    if set(legs) != {0, 1}:
        raise ValueError('Incomplete original biped leg chains')
    order = hips[0]['joints']+legs[1]['joints']+legs[0]['joints']
    if len({joint['sourceRigIndex'] for joint in order}) != 9:
        raise ValueError('Original biped input joints overlap')
    # 143f31d00 copies its nine input indices then makes this interleaved packet map.
    packet_slots = [0, 1, 5, 2, 6, 3, 7]
    body = [{**order[slot], 'packetIndex': i, 'inputSlot': slot,
             'contextIndexOffset': hex(0x1f0+i*4)} for i, slot in enumerate(packet_slots)]
    return {'inputOrder': [{**j, 'inputSlot': i, 'contextIndexOffset': hex(0xe0+i*4)} for i, j in enumerate(order)],
            'bodyPoints': body, 'baseChains': base, 'limbChains': list(legs.values()),
            'indexConvention': 'runtime index = sourceRigIndex - original skeleton slice start; target indices must be rebound',
            'probeVectors': [{'packetIndex': 7, 'contextVectorOffset': '0x140', 'rotationInputSlot': 3, 'kind': 'foot offset'},
                {'packetIndex': 8, 'contextVectorOffset': '0x150', 'rotationInputSlot': 7, 'kind': 'foot offset'},
                {'packetIndex': 9, 'contextVectorOffset': '0x160', 'rotationInputSlot': 3, 'kind': 'foot offset'},
                {'packetIndex': 10, 'contextVectorOffset': '0x170', 'rotationInputSlot': 7, 'kind': 'foot offset'},
                {'packetIndex': 11, 'contextVectorOffset': '0x180', 'rotationInputSlot': 2, 'kind': 'leg-axis vector'},
                {'packetIndex': 12, 'contextVectorOffset': '0x190', 'rotationInputSlot': 6, 'kind': 'leg-axis vector'}]}


def main():
    raw = (OUT/'hu000_ik.tspack').read_bytes()
    inventory = json.loads((OUT/'native-ik-contracts-v8.json').read_text())['setup']['resources']
    r = next(r for r in inventory if r['resourceId'] == 1)
    payload = raw[r['offset']:r['offset']+r['spanBytes']]
    if hashlib.sha256(payload).hexdigest() != r['sha256']:
        raise ValueError('Original setup resource identity changed')
    rig_path = OUT/'hu000-rig.json'
    data = decode(payload, json.loads(rig_path.read_text()))
    evidence = [OUT/'ghidra-ik-v12/143ead050.c', OUT/'ghidra-ik-v14/143eaca30.c',
                OUT/'ghidra-ik-v14/143eacc00.c', OUT/'ghidra-ik-v14/143f31d00.c',
                OUT/'ghidra-ik-v12/143f32cb0.c', OUT/'ghidra-ik-v14/143f34d30.c']
    data.update(schema='forspoken-original-biped-bindings-v14',
                setupSha256=hashlib.sha256(raw).hexdigest(), resourceSha256=r['sha256'],
                rigSha256=hashlib.sha256(rig_path.read_bytes()).hexdigest(),
                evidence=[{'file': str(p.relative_to(ROOT)), 'sha256': hashlib.sha256(p.read_bytes()).hexdigest()} for p in evidence],
                originalIKComplete=False, originalGameplayExecuted=False,
                unresolved=['Original runtime probe values and enable/target-selection policy are not supplied by this index map.',
                            'Full contact solver and engine graph transitions remain unfinished.',
                            'No original rig index may be applied to Backspool without explicit name/space adaptation.'])
    (OUT/'original-biped-bindings-v14.json').write_text(json.dumps(data, indent=2)+'\n')
    (ROOT/'assets/backspool/original-biped-bindings-v14.json.gz').write_bytes(gzip.compress(json.dumps(data, separators=(',', ':')).encode(), mtime=0))
    print(json.dumps({'inputJoints': len(data['inputOrder']), 'bodyPoints': len(data['bodyPoints']), 'probeVectors': len(data['probeVectors'])}))


if __name__ == '__main__':
    main()
