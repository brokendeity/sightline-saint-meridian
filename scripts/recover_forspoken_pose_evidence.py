"""Retain pose-kernel evidence and bounded actor-action identifier membership."""
import hashlib
import json
import struct
from decode_forspoken_graph_nodes import Graph, OUT
from inspect_forspoken_graph_runtime import PE


def main():
    binary = (OUT/'FORSPOKEN.exe').read_bytes()
    pe = PE(binary)
    pdata = next(s for s in pe.sections if s[0].rstrip(b'\0') == b'.pdata')
    extents = {pe.base+a: pe.base+b for a, b in
               (struct.unpack_from('<II', binary, i) for i in range(pdata[4], pdata[4]+pdata[3]-11, 12)) if a < b}
    paths = {
        0x143f31d00: 'ghidra-ik-v14', 0x143eaca30: 'ghidra-ik-v14',
        0x143eacc00: 'ghidra-ik-v14', 0x143f32cb0: 'ghidra-ik-v12',
        0x143f34d30: 'ghidra-ik-v14', 0x143f31070: 'ghidra-ik-v14b',
        0x143f33490: 'ghidra-ik-v14', 0x143f350d0: 'ghidra-ik-v14',
        0x14342c3d0: 'ghidra-action-v14', 0x144478270: 'ghidra-action-v14b',
        0x1444783c0: 'ghidra-action-v14c', 0x1444eabd0: 'ghidra-action-v14d',
        0x144dc0650: 'ghidra-action-v14e', 0x1444ea280: 'ghidra-action-v14e',
        0x144dc0420: 'ghidra-action-v14f', 0x144dc03e0: 'ghidra-action-v14f',
        0x144dc0340: 'ghidra-action-v14f', 0x144dc0390: 'ghidra-action-v14f'}
    methods = []
    for address, directory in paths.items():
        extent_source = 'PE exception range'
        end = extents.get(address)
        if end is None:
            # Bounded leaf regions include alignment; no invented unwind extent.
            following = {0x144dc0340: 0x144dc0390, 0x144dc0390: 0x144dc03e0,
                         0x144dc03e0: 0x144dc0420}
            end = following.get(address)
            if address == 0x1444ea280:
                end = min(at for at in extents if at > address)
                if end-address > 512:
                    raise ValueError('Unbounded message callback leaf')
                extent_source = 'bounded leaf region to next PE function entry; may include alignment'
            if end is None:
                raise ValueError('Unresolved native extent '+hex(address))
            if address != 0x1444ea280:
                extent_source = 'bounded leaf region to next known vtable method; may include alignment'
        code = binary[pe.off(address):pe.off(end-1)+1]
        source = OUT/directory/f'{address:x}.c'
        methods.append({'entry': hex(address), 'endExclusive': hex(end),
                        'extentSource': extent_source, 'bytes': len(code),
                        'instructionSha256': hashlib.sha256(code).hexdigest(),
                        'pseudocode': str(source.relative_to(OUT)),
                        'pseudocodeSha256': hashlib.sha256(source.read_bytes()).hexdigest()})
    graph_path = OUT/'movement-assets/40009-hu000_root.anmgph'
    raw = graph_path.read_bytes()
    g = Graph(raw)
    root = g.table(g.u32(0))
    identifiers = g.tables(root['fields'][10])
    indexed = {}
    for index, entry in enumerate(identifiers):
        if set(entry['fields']) != {0}:
            raise ValueError('Unsupported root-field10 identifier entry')
        at = entry['fields'][0]
        key = g.u32(at)
        indexed.setdefault(key, []).append({'index': index, 'offset': at})
    controller = json.loads((OUT/'native-controller-contracts-v13.json').read_text())['relationships']['actions']
    matches = [{'actionId': a['id'], 'name': a['name'], 'actorAction': a['actorAction'],
                'rootField10Entries': indexed.get(a['actorAction'], []) if a['actorAction'] else []}
               for a in controller]
    record = {'schema': 'forspoken-native-pose-evidence-v14',
        'binarySha256': hashlib.sha256(binary).hexdigest(), 'targetExecuted': False,
        'methods': methods,
        'graphIdentifiers': {'file': str(graph_path.relative_to(OUT)), 'sha256': hashlib.sha256(raw).hexdigest(),
            'rootField': 10, 'entryCount': len(identifiers), 'actions': matches,
            'matchedActions': sum(bool(m['rootField10Entries']) for m in matches),
            'meaning': 'Exact identifier equality only; graph state/timeline selection is not established.'},
        'dispatch': ['14342c3d0 constructs the animation runtime and owner of its message container',
            '14342c646..668 passes AnimationComponent+130 pointee+8 as init arg5 (Windows x64 stack+20)',
            '1444783c0 stores arg5 at runtime+258',
            '1444eabd0 constructs that embedded container via144dc0650, with validation callback1444ea280',
            'MessageContainer RTTI vtable146d50ec8: request144dc0420, status144dc03e0, cancel144dc0340',
            '144dc0420 stores the request and callback result; it does not directly select a source motion'],
        'implementedKernels': ['143f32cb0 model-space biped input packet', '143f34d30 model-space pose writeback'],
        'poseAppliedToBackspool': False, 'completeOriginalController': False, 'completeOriginalIK': False,
        'remaining': ['Original solver/probe values and contact-selection phases',
            'Full143f37eb0 solve and its pose-delta output production',
            'Message consumption and original graph state selection', 'Matched original gameplay fidelity review']}
    (OUT/'native-pose-evidence-v14.json').write_text(json.dumps(record, indent=2)+'\n')
    print(json.dumps({'nativeFunctions': len(methods), 'graphIdentifierEntries': len(identifiers),
                      'matchedActionRecords': record['graphIdentifiers']['matchedActions']}))


if __name__ == '__main__':
    main()
