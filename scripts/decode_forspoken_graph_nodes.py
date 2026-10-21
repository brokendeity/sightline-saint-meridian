"""Bounded root-vector traversal of the recovered animation graph.

Field numbers are retained until their runtime meaning is proven. In particular,
callback lists must not be called entry/exit lists merely from their order.
Never executes the target or modifies source assets.
"""
import hashlib
import gzip
import json
import struct
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output/rea-forspoken'


class Graph:
    def __init__(self, data):
        self.data = data

    def read(self, offset, size):
        if offset < 0 or size < 0 or offset + size > len(self.data):
            raise ValueError(f'Out-of-bounds graph read at {offset}+{size}')
        return self.data[offset:offset + size]

    def u32(self, p):
        return struct.unpack('<I', self.read(p, 4))[0]

    def table(self, p):
        v = p - struct.unpack('<i', self.read(p, 4))[0]
        size, obj = struct.unpack('<HH', self.read(v, 4))
        if size < 4 or size % 2 or size > 256 or obj < 4 or obj > 4096:
            raise ValueError(f'Invalid table header at {p}')
        self.read(p, obj)
        fields = struct.unpack('<%dH' % ((size - 4) // 2), self.read(v + 4, size - 4))
        if any(f and not 4 <= f < obj for f in fields):
            raise ValueError(f'Invalid table fields at {p}')
        return {'offset': p, 'vtableOffset': v, 'objectBytes': obj,
                'fields': {i: p + f for i, f in enumerate(fields) if f}}

    def pointer(self, field):
        delta = self.u32(field)
        if not delta:
            raise ValueError(f'Null relative pointer at {field}')
        target = field + delta
        self.read(target, 4)
        return target

    def vector(self, field, stride=4):
        p = self.pointer(field)
        count = self.u32(p)
        self.read(p + 4, count * stride)
        return p, count

    def tables(self, field):
        p, count = self.vector(field)
        return [self.table(self.pointer(p + 4 + i * 4)) for i in range(count)]

    def string(self, field):
        p, count = self.vector(field, 1)
        if self.read(p + 4 + count, 1) != b'\0':
            raise ValueError('Missing FlatBuffer string terminator')
        return self.read(p + 4, count).decode('utf8')

    def parameter_buffer(self, field):
        p, count = self.vector(field, 1)
        payload = self.read(p + 4, count)
        nested = Graph(payload)
        table = nested.table(nested.u32(0))
        # Without the UDF schema these are bit interpretations, not typed values.
        scalars = []
        for i, at in table['fields'].items():
            if at + 4 <= table['offset'] + table['objectBytes']:
                raw = nested.read(at, 4)
                f = struct.unpack('<f', raw)[0]
                scalars.append({'fieldIndex': i, 'absoluteOffset': p + 4 + at,
                                'u32': struct.unpack('<I', raw)[0],
                                'f32Interpretation': f if abs(f) < 1e30 else None})
        return {'offset': p, 'byteLength': count,
                'sha256': hashlib.sha256(payload).hexdigest(),
                'bytesHex': payload.hex(), 'rootTable': table['offset'],
                'scalarFields': scalars, 'omittedFieldDefaults': 'unknown without UDF schema'}

    def callback(self, table):
        fs = table['fields']
        path_table = self.table(self.pointer(fs[0]))
        return {'offset': table['offset'], 'identifier': self.u32(fs[1]) if 1 in fs else 0,
                'path': self.string(path_table['fields'][1]) if 1 in path_table['fields'] else '',
                'parameters': self.parameter_buffer(fs[2]) if 2 in fs else None}


def decode(path, inventory):
    b = path.read_bytes()
    graph = Graph(b)
    root = graph.table(graph.u32(0))
    # This is a direct root-vector walk, not byte-pattern/table-neighbour scanning.
    nodes = graph.tables(root['fields'][4])
    resources = defaultdict(list)
    for clip in inventory['clips']:
        resources[int(clip['animationId'], 16)].append({
            k: clip[k] for k in ('pack', 'animationId', 'sourceSha256', 'status') if k in clip})
    records, failures, callback_counts = [], [], Counter()
    for index, node in enumerate(nodes):
        fs = node['fields']
        resource = graph.u32(fs[1]) if 1 in fs else 0
        rec = {'index': index, 'offset': node['offset'], 'vtableOffset': node['vtableOffset'],
               'resourceId': f'0x{resource:08x}',
               'sourceClips': resources.get(resource, []), 'callbacks': {},
               'semanticActionName': None, 'originalRoleVerified': False}
        for field in (6, 7):
            rec[f'field{field}Identifier'] = graph.u32(fs[field]) if field in fs else None
        for field in (4, 5):
            if field in fs:
                p, n = graph.vector(fs[field])
                rec[f'field{field}References'] = [graph.u32(p + 4 + 4 * i) for i in range(n)]
        for field in (2, 3):
            callbacks = []
            try:
                for callback in graph.tables(fs[field]) if field in fs else []:
                    decoded = graph.callback(callback)
                    callbacks.append(decoded)
                    callback_counts[decoded['path']] += 1
            except (ValueError, KeyError, UnicodeError, struct.error) as error:
                failures.append({'node': index, 'field': field, 'error': str(error)})
            rec['callbacks'][str(field)] = callbacks
        records.append(rec)
    known_ids = set(resources)
    referenced = {int(r['resourceId'], 16) for r in records if r['sourceClips']}
    return {'schema': 'forspoken-root-motion-nodes-v1',
            'source': {'file': str(path), 'sha256': hashlib.sha256(b).hexdigest(),
                       'sizeBytes': len(b)},
            'rootFieldIndex': 4, 'nodeCount': len(records),
            'motionNodeCount': sum(bool(r['sourceClips']) for r in records),
            'uniqueSourceMotionIds': len(known_ids), 'referencedSourceMotionIds': len(referenced),
            'unreferencedSourceMotionIds': [f'0x{i:08x}' for i in sorted(known_ids - referenced)],
            'callbackCounts': dict(callback_counts), 'failures': failures,
            'limitations': ['Node resource equality establishes graph membership, not a move name.',
                           'Callback list phase and parameter types/defaults require runtime/UDF schema evidence.',
                           'No gameplay playback-rate or IK changes are authorized by this structural decode alone.'],
            'nodes': records}


if __name__ == '__main__':
    result = decode(OUT / 'movement-assets/40009-hu000_root.anmgph',
                    json.loads((OUT / 'full-player-inventory/manifest.json').read_text()))
    (OUT / 'root-motion-nodes.json').write_text(json.dumps(result, indent=2, allow_nan=False) + '\n')
    by_id = defaultdict(list)
    for node in result['nodes']:
        if node['sourceClips']:
            by_id[node['resourceId']].append(node)
    browser = {'schema': result['schema'], 'source': result['source'],
               'nodeCount': result['nodeCount'], 'clipIds': dict(by_id),
               'limitations': result['limitations'], 'failures': result['failures']}
    target = ROOT / 'assets/backspool/source-graph-evidence-v6.json.gz'
    target.write_bytes(gzip.compress(json.dumps(browser, separators=(',', ':'), allow_nan=False).encode(), mtime=0))
    print(json.dumps({k: v for k, v in result.items() if k not in ('nodes', 'unreferencedSourceMotionIds')}))
