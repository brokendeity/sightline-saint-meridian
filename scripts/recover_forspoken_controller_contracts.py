"""Recover bounded parameter tables and exact motion labels; never execute the game.

Column IDs remain IDs where no schema name was recovered. A named motion is not
proof that the original controller selected it in the candidate's circumstances.
"""
import hashlib
import json
import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output/rea-forspoken'


def identity(path):
    data = path.read_bytes()
    return {'path': str(path.relative_to(ROOT)), 'sha256': hashlib.sha256(data).hexdigest(),
            'bytes': len(data)}


def names(data):
    if len(data) < 13:
        raise ValueError('Truncated name dictionary')
    count = struct.unpack_from('<I', data, 9)[0]
    if count > 500000:
        raise ValueError('Name dictionary exceeds budget')
    p, result = 13, {}
    for _ in range(count):
        if p + 4 > len(data):
            raise ValueError('Truncated dictionary record')
        at = p
        key = struct.unpack_from('<I', data, p)[0]
        p += 4
        end = data.find(b'\0', p)
        if end < p:
            raise ValueError('Unterminated dictionary label')
        raw = data[p:end]
        if key in result:
            raise ValueError('Duplicate dictionary ID')
        # Keep non-ASCII names immutable and undecoded; this pass needs ASCII IDs.
        result[key] = {'offset': at, 'name': raw.decode('ascii') if raw.isascii() else None,
                       'rawHex': raw.hex() if not raw.isascii() else None}
        p = end + 1
    if p != len(data):
        raise ValueError('Trailing dictionary bytes')
    return result


def tables(data, labels):
    def read(p, n):
        if p < 0 or n < 0 or p + n > len(data):
            raise ValueError('Parameter read outside resource')
        return data[p:p+n]

    def u32(p):
        return struct.unpack('<I', read(p, 4))[0]

    if read(0, 12) != b'BdevResource' or u32(12) != len(data) or u32(32) != 3:
        raise ValueError('Unsupported parameter resource')
    count = u32(36)
    if count > 256:
        raise ValueError('Table count exceeds budget')
    offsets = [32 + u32(40 + 4*i) for i in range(count)]
    if offsets != sorted(set(offsets)) or (offsets and offsets[0] != 40 + count*4):
        raise ValueError('Overlapping parameter directory')
    result = []
    for index, start in enumerate(offsets):
        limit = offsets[index+1] if index+1 < count else len(data)
        key, nc, nr, stride, slots, fixed, total, reserved = struct.unpack('<8I', read(start, 32))
        if nc > 256 or nr > 20000 or stride > 4096 or reserved:
            raise ValueError('Unsupported table header')
        if fixed != nc*8 + nr*stride or total < fixed or start + 32 + total > limit:
            raise ValueError('Table extent mismatch')
        if 4 + slots*4 > stride:
            raise ValueError('Scalar row extent mismatch')
        pool, pool_end = start+32+fixed, start+32+total
        read(start, limit-start)
        columns = []
        for i in range(nc):
            cid, kind, ordinal = struct.unpack('<IHH', read(start+32+i*8, 8))
            if kind == 1:
                if 4+slots*4+ordinal//8 >= stride:
                    raise ValueError('Boolean slot outside row')
            elif ordinal >= slots:
                raise ValueError('Scalar slot outside row')
            columns.append({'id': f'0x{cid:08x}', 'name': labels.get(cid, {}).get('name'),
                            'typeCode': kind, 'ordinal': ordinal})
        if [c['id'] for c in columns] != sorted(set(c['id'] for c in columns)):
            raise ValueError('Unsorted or duplicate column directory')
        begin = start + 32 + nc*8
        rows = []
        for i in range(nr):
            at = begin+i*stride
            rid = u32(at)
            values = {}
            for column in columns:
                kind, ordinal = column['typeCode'], column['ordinal']
                if kind == 1:
                    pos = at+4+slots*4+ordinal//8
                    cell = {'offset': pos, 'mask': 1 << (ordinal % 8),
                            'rawBit': bool(read(pos, 1)[0] & (1 << (ordinal % 8)))}
                else:
                    pos = at+4+ordinal*4
                    bits = u32(pos)
                    cell = {'offset': pos, 'rawU32': bits}
                    if kind == 8:
                        cell['float32'] = struct.unpack('<f', read(pos, 4))[0]
                    if kind == 4:
                        cell['int32'] = struct.unpack('<i', read(pos, 4))[0]
                    if kind == 16:
                        cell['referenceName'] = labels.get(bits, {}).get('name')
                    if kind == 18:
                        # 1446c19f0 establishes pool=table+32+fixedBytes;
                        # 1446c18f0/2190 establish signed word index, count, values.
                        array_index = struct.unpack('<i', read(pos, 4))[0]
                        array_at = pool + array_index*4
                        if array_index < 0 or array_at+4 > pool_end:
                            raise ValueError('Array index outside table pool')
                        size = struct.unpack('<i', read(array_at, 4))[0]
                        if size < 0 or size > 20000 or array_at+4+size*4 > pool_end:
                            raise ValueError('Array extent outside table pool')
                        items = [u32(array_at+4+j*4) for j in range(size)]
                        cell.update(arrayOffset=array_at, arrayLength=size, referenceIds=items,
                                    referenceNames=[labels.get(v, {}).get('name') for v in items])
                values[column['id']] = cell
            rows.append({'id': f'0x{rid:08x}', 'name': labels.get(rid, {}).get('name'),
                         'offset': at, 'values': values})
        if len({r['id'] for r in rows}) != len(rows):
            raise ValueError('Duplicate row ID')
        result.append({'id': f'0x{key:08x}', 'offset': start, 'end': limit,
                       'rowStride': stride, 'scalarSlots': slots, 'arrayPool': pool,
                       'arrayPoolEnd': pool_end, 'columns': columns, 'rows': rows,
                       'opaqueTrailingBytes': limit-(start+32+total)})
    return result


def relationships(parkour):
    """Link recovered IDs; do not infer engine eligibility or graph selection."""
    table = {t['id']: t for t in parkour}
    conditions = {}
    for row in table['0x01079165']['rows']:
        v = row['values']
        conditions[row['id']] = {'id': row['id'], 'name': row['name'],
            'inputId': v['0x01025fcb']['rawU32'],
            'controlKind': v['0x01079172']['rawU32'],
            'holdMin': v['0x01079173']['float32'], 'holdMax': v['0x01079174']['float32']}
    actions = []
    for row in table['0x01078c86']['rows']:
        v = row['values']
        refs = v['0x01079ee2']['referenceIds']
        if len(refs) != 3 or any(f'0x{key:08x}' not in conditions for key in refs):
            raise ValueError('Unresolved original action button-condition slots')
        actions.append({'id': row['id'], 'name': row['name'],
            'actionType': v['0x01001e8d']['rawU32'], 'actorAction': v['0x0100494b']['rawU32'],
            'buttonConditions': [conditions[f'0x{key:08x}'] for key in refs]})
    action_ids = {int(a['id'], 16) for a in actions}
    abilities = []
    for row in table['0x01079ed5']['rows']:
        refs = row['values']['0x01079ee1']['referenceIds']
        abilities.append({'id': row['id'], 'name': row['name'], 'sourceActionSlots': refs,
                         'actions': [f'0x{key:08x}' for key in refs if key in action_ids],
                         'unresolvedSlots': [key for key in refs if key not in action_ids]})
    return {'actions': actions, 'conditions': list(conditions.values()), 'abilities': abilities}


def main():
    dictionary = OUT/'param_table_cache_translation.id2s'
    labels = names(dictionary.read_bytes())
    paths = [OUT/'parkour.parambin', OUT/'movement.parambin']
    resources = [{'source': identity(p), 'tables': tables(p.read_bytes(), labels)} for p in paths]
    inventory = json.loads((OUT/'full-player-inventory/manifest.json').read_text())
    motions = []
    for clip in inventory['clips']:
        record = labels.get(int(clip['animationId'], 16))
        if record and record['name']:
            motions.append({'animationId': clip['animationId'], 'originalName': record['name'],
                            'dictionaryOffset': record['offset'], 'sourceSha256': clip.get('sourceSha256'),
                            'pack': clip['pack'], 'status': clip['status']})
    parkour = resources[0]['tables']
    actions = next(t['rows'] for t in parkour if t['id'] == '0x01078c86')
    for action in actions:
        action['actionType'] = action['values']['0x01001e8d']
        action['actorAction'] = action['values']['0x0100494b']
    linked = relationships(parkour)
    result = {'schema': 'forspoken-controller-contracts-v13',
              'binary': identity(OUT/'FORSPOKEN.exe'), 'dictionary': identity(dictionary),
              'dictionaryRecordCount': len(labels), 'resources': resources, 'motions': motions,
              'actionCount': len(actions), 'actions': actions, 'relationships': linked,
              'nativeEvidence': ['MagicParkourComponent RTTI: 14513c848',
                                 '142c2b540: actor action field selected through vtable slot 26',
                                 '142c2b7b0: button, actor, terrain and resource eligibility gates',
                                 '142c308e0 / 142c2e780: trigger/release/hold/inverted-hold conditions',
                                 '1446c19f0: variable-pool base; 1446c18f0/1446c2190: array count and element'],
              'completeOriginalController': False, 'verifiedOriginalIK': False,
              'limitations': ['Parameter column IDs are retained where names remain unavailable.',
                             'Engine blackboard/actor-action selection remains unresolved.',
                             'Named motions establish original labels, not complete runtime state transitions.',
                             'Video is an observational reference; no matched original-build capture exists.']}
    (OUT/'native-controller-contracts-v13.json').write_text(json.dumps(result, indent=2, allow_nan=False)+'\n')
    import gzip
    compact = {'schema': result['schema'], 'binary': result['binary'],
               'dictionary': result['dictionary'], **linked, 'completeOriginalController': False}
    path = ROOT/'assets/backspool/original-controller-contracts-v13.json.gz'
    path.write_bytes(gzip.compress(json.dumps(compact, separators=(',', ':'), allow_nan=False).encode(), mtime=0))
    print(json.dumps({'dictionaryRecords': len(labels), 'namedMotionEntries': len(motions),
                      'parkourActions': len(actions), 'conditions': len(linked['conditions']),
                      'abilities': len(linked['abilities']), 'tables': [len(r['tables']) for r in resources]}))


if __name__ == '__main__':
    main()
