"""Decode the recovered final-cut-in alternative table, never execute the game.

The table is a selector keyed by attacker/context and victim identity, not a
serial sequence. Keep every source field without inventing phase order.
"""
import argparse
import ctypes
import hashlib
import json
import struct
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
MEMBER = 'data/spc/finalSpSkillCutIn.bin.xfbin'
STRIDE = 0x4d8
GROUPS = 51
EVIDENCE = [
    'output/rea-naruto/ghidra/full-export/main-final/functions/14097d/14097da70.c',
    'output/rea-naruto/ghidra/full-export/main-final/functions/141094/141094170.c',
    'output/rea-naruto/ghidra/full-export/main-final/functions/14097f/14097f010.c',
    'output/rea-naruto/ghidra/full-export/main-final/functions/14097f/14097f4f0.c',
    'output/rea-naruto/ghidra/full-export/main-final/functions/14097f/14097f7f0.c',
    'output/rea-naruto/ghidra/full-export/main-final/functions/140980/140980d90.c',
    'output/rea-naruto/ghidra/full-export/main-final/functions/1410bc/1410bc600.c',
    'output/rea-naruto/ghidra/full-export/main-final/functions/1410bd/1410bd570.c',
]

def decode_table(raw):
    """Return JSON-safe records from NuccChunkBinary.data, with strict bounds."""
    raw = bytes(raw)
    if len(raw) < 20:
        raise ValueError('truncated binary header')
    declared, = struct.unpack_from('>I', raw)
    if declared != len(raw) - 4:
        raise ValueError('binary length mismatch')
    data = raw[4:]
    version, count, relative = struct.unpack_from('<IIQ', data)
    if version != 1000:
        raise ValueError(f'unsupported table version {version}')
    start = 8 + relative
    if start < 16 or start > len(data) or count > (len(data) - start) // STRIDE:
        raise ValueError('record range exceeds table')
    records_end = start + count * STRIDE

    def read_string(field):
        delta, = struct.unpack_from('<q', data, field)
        if not delta:
            return ''
        target = field + delta
        if target < records_end or target >= len(data):
            raise ValueError(f'string pointer outside string pool at {field}')
        end = data.find(b'\0', target, min(len(data), target + 4097))
        if end < 0:
            raise ValueError(f'unterminated or oversized string at {field}')
        try:
            text = data[target:end].decode('utf-8')
        except UnicodeDecodeError as err:
            raise ValueError(f'invalid string encoding at {field}') from err
        if any(ord(c) < 32 for c in text):
            raise ValueError(f'control character in string at {field}')
        return text

    records = []
    for row_index in range(count):
        offset = start + row_index * STRIDE
        headers = list(struct.unpack_from('<4i', data, offset))
        groups = []
        for group_index in range(GROUPS):
            pos = offset + 16 + group_index * 24
            filename = read_string(pos)
            resource_name = read_string(pos + 8)
            flag, target = struct.unpack_from('<ii', data, pos + 16)
            groups.append({'groupIndex': group_index,
                           'file': filename, 'resourceName': resource_name,
                           'flag': flag, 'targetIdentity': target})
        records.append({'rowIndex': row_index, 'headers': headers,
                        'groups': groups})
    return {'version': version, 'recordCount': count, 'recordStride': STRIDE,
            'groupCount': GROUPS, 'records': records}

def export(output):
    # Reuse bounded source decoder and XFBIN reader; imports do not extract.
    from extract_nsunsc_library import ROOT, OUT, read_xfbin
    members = json.loads((OUT.parent / 'cpk-members.json').read_text())
    member = next(row for row in members if row['path'] == MEMBER)
    lib = ctypes.CDLL(str(OUT.parent / 'full-library/decode.dylib'))
    lib.decode_nsunsc.argtypes = [ctypes.c_void_p, ctypes.c_size_t,
        ctypes.c_void_p, ctypes.c_size_t, ctypes.POINTER(ctypes.c_size_t)]
    with (ROOT / member['archive']).open('rb') as handle:
        handle.seek(member['offset'])
        stored = handle.read(member['stored_bytes'])
    if len(stored) != member['stored_bytes']:
        raise ValueError('truncated archive member')
    buffer = ctypes.create_string_buffer(member['unpacked_bytes'])
    size = ctypes.c_size_t()
    result = lib.decode_nsunsc(stored, len(stored), buffer, len(buffer), ctypes.byref(size))
    if result != 0 or size.value != member['unpacked_bytes']:
        raise ValueError(f'archive decode failed {result}')
    decoded = buffer.raw[:size.value]
    xfbin = read_xfbin(bytearray(decoded))
    chunks = [chunk for page in xfbin.pages for chunk in page.chunks
              if chunk.name == 'finalSpSkillCutIn' and type(chunk).__name__ == 'NuccChunkBinary']
    if len(chunks) != 1:
        raise ValueError('expected one finalSpSkillCutIn binary')
    binary = bytes(chunks[0].data)
    table = decode_table(binary)
    pairs = [group for row in table['records'] for group in row['groups']
             if group['file'] or group['resourceName']]
    table.update({'schemaVersion': 2, 'source': dict(member,
        sha256=hashlib.sha256(decoded).hexdigest(),
        binarySha256=hashlib.sha256(binary).hexdigest()),
        'evidence': EVIDENCE,
        'semantics': {
            'headers': ['contextSelector', 'specialSkillSelector',
                        'attackerIdentity', 'attackerVariant'],
            'headersConfidence': 'runtime selector use verified; labels descriptive',
            'group0': 'default or special-skill selected file/resource pair',
            'groups1to50': 'victim identity alternatives; not sequential phases',
            'flag': 'loader converts exact value 1 to runtime boolean; behavior unresolved',
            'targetIdentity': 'compared against resolved victim identity in 14097f010',
            'mapping': 'file names and resource names are explicit table strings; '
                       'runtime consumer resolves NuccChunkTexture and constructs ccUiSprite. '
                       'Resolve by exact bundle member basename and exact texture resource name. '
                       'Do not derive a serial phase order or use filename prefixes as identity.'},
        'limits': ['These are final cut-in texture/sprite alternatives, not motion animation clips.',
                   'No serial phase transitions are encoded by this alternative list.',
                   'Header identity numbers need verified character parameter mapping.',
                   'Empty file strings can invoke runtime name construction; not reconstructed here.',
                   'Cinematic audio, original material rendering and complete camera composition are separate.'],
        'stats': {'rows': len(table['records']),
                  'rowsWithNamedAlternatives': sum(any(g['file'] or g['resourceName'] for g in r['groups']) for r in table['records']),
                  'namedAlternatives': len(pairs),
                  'uniqueFileResourcePairs': len({(g['file'], g['resourceName']) for g in pairs})}})
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(table, separators=(',', ':')) + '\n')
    print(json.dumps(table['stats']))

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', type=Path,
                        default=BASE / 'assets/nsunsc-library/finisher-variants.json')
    export(parser.parse_args().output)
