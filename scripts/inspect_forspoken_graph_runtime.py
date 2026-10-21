"""Recover MSVC RTTI/vtable identities for a bounded animation-controller set.

Validates COL self references and executable-section method pointers. Static only.
"""
import hashlib
import json
import struct
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / 'output/rea-forspoken'


class PE:
    def __init__(self, data):
        self.data = data
        pe = struct.unpack_from('<I', data, 60)[0]
        count = struct.unpack_from('<H', data, pe + 6)[0]
        size = struct.unpack_from('<H', data, pe + 20)[0]
        self.base = struct.unpack_from('<Q', data, pe + 48)[0]
        self.sections = [struct.unpack_from('<8sIIIIIIHHI', data, pe + 24 + size + i * 40) for i in range(count)]

    def section(self, va):
        return next((s for s in self.sections if s[2] <= va - self.base < s[2] + s[3]), None)

    def off(self, va):
        section = self.section(va)
        if section is None:
            raise ValueError('Unmapped PE address')
        return section[4] + va - self.base - section[2]

    def va(self, off):
        s = next(s for s in self.sections if s[4] <= off < s[4] + s[3])
        return self.base + s[2] + off - s[4]

    def code(self, va):
        s = self.section(va)
        return s is not None and bool(s[-1] & 0x20000000)

    def rtti(self, name):
        needle = name.encode() + b'\0'
        start, result = 0, []
        while True:
            pos = self.data.find(needle, start)
            if pos < 0:
                break
            start = pos + len(needle)
            descriptor = self.va(pos) - 16
            type_rva = descriptor - self.base
            cursor = 0
            while True:
                at = self.data.find(struct.pack('<I', type_rva), cursor)
                if at < 0:
                    break
                cursor = at + 4
                col = at - 12
                if col < 0 or col + 24 > len(self.data):
                    continue
                sig, offset, cd, typ, hierarchy, self_rva = struct.unpack_from('<6I', self.data, col)
                if sig != 1 or self.va(col) != self.base + self_rva or typ != type_rva:
                    continue
                col_va = self.va(col)
                ptr_cursor = 0
                while True:
                    ptr = self.data.find(struct.pack('<Q', col_va), ptr_cursor)
                    if ptr < 0:
                        break
                    ptr_cursor = ptr + 8
                    if ptr % 8:
                        continue
                    methods = []
                    for i in range(64):
                        value = struct.unpack_from('<Q', self.data, ptr + 8 + 8 * i)[0]
                        if not self.code(value):
                            break
                        methods.append(hex(value))
                    if methods:
                        result.append({'className': name, 'typeDescriptor': hex(descriptor),
                                       'locator': hex(col_va), 'subobjectOffset': offset,
                                       'vtable': hex(self.va(ptr + 8)), 'methods': methods})
        return result


def main():
    data = (OUT / 'FORSPOKEN.exe').read_bytes()
    pe = PE(data)
    names = [
        '.?AVLmAnimStateMachineState@Animation@Luminous@@',
        '.?AVLmAnimStateMachineInstance@Animation@Luminous@@',
        '.?AVLmAnimStateMachineNode@Animation@Luminous@@',
        '.?AVLmAnimPlaybackLeafNode@Animation@Luminous@@',
        '.?AVLmAnimGraphPrimitiveValue@AnimGraph@Luminous@@',
        '.?AVLmAnimGraphLib@AnimGraph@Luminous@@',
        '.?AVLmAnimGraphAssetInitializer@AnimGraph@Luminous@@',
    ]
    records = [row for name in names for row in pe.rtti(name)]
    result = {'schema': 'forspoken-graph-runtime-rtti-v1', 'binarySha256': hashlib.sha256(data).hexdigest(),
              'records': records, 'limitations': ['MSVC RTTI identities prove class/vtable membership, not virtual method behavior.',
                                                'Only executable-section pointers before the next non-code entry are collected.']}
    (OUT / 'graph-runtime-rtti.json').write_text(json.dumps(result, indent=2) + '\n')
    methods = sorted({method for row in records if 'StateMachineNode@' in row['className'] or 'PlaybackLeafNode@' in row['className'] for method in row['methods']})
    (OUT / 'graph-controller-methods.txt').write_text('\n'.join(methods) + '\n')
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()
