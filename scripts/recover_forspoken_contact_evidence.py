"""Bind the implemented frame/input contracts to immutable local binary evidence."""
import hashlib
import json
import struct
from pathlib import Path
from inspect_forspoken_graph_runtime import PE, OUT


def main():
    binary = (OUT/'FORSPOKEN.exe').read_bytes()
    pe = PE(binary)
    pdata = next(s for s in pe.sections if s[0].rstrip(b'\0') == b'.pdata')
    ranges = {pe.base+a: pe.base+b for a, b in
              (struct.unpack_from('<II', binary, i) for i in range(pdata[4], pdata[4]+pdata[3]-11, 12))}
    targets = {
        'solverRaycastFrame': (0x143f368a0, 'ghidra-ik-v12'),
        'solverNormalGate': (0x143f36320, 'ghidra-ik-v12'),
        'synchronousActorRaycast': (0x14346e0e0, 'ghidra-contact-v13'),
        'actorFrameSnapshot': (0x14346e940, 'ghidra-contact-v13'),
        'snapshotQueryIssue': (0x14346e980, 'ghidra-contact-v13'),
        'snapshotQueryResolve': (0x14346edf0, 'ghidra-contact-v13'),
        'parameterPoolBase': (0x1446c19f0, 'ghidra-contact-v13c'),
        'parameterArrayCount': (0x1446c18f0, 'ghidra-contact-v13c'),
        'parameterArrayValue': (0x1446c2190, 'ghidra-contact-v13b'),
        'timedHeldInput': (0x1446490a0, 'ghidra-contact-v13d'),
        'timedTriggeredInput': (0x144648fe0, 'ghidra-contact-v13d'),
        'timedReleasedInput': (0x1446486b0, 'ghidra-contact-v13d'),
        'threeSlotInputOR': (0x142c2e780, 'ghidra-parkour-v12'),
        'parkourActorRequest': (0x144641c60, 'ghidra-contact-v13b'),
        'graphMessageRequest': (0x1434328d0, 'ghidra-contact-v13c'),
        'animationMessageDispatch': (0x143430100, 'ghidra-contact-v13e'),
        'ikRaycastConstruction': (0x143431530, 'ghidra-contact-v13b'),
    }
    methods = {}
    for name, (address, directory) in targets.items():
        end = ranges.get(address)
        extent_source = 'PE exception range'
        if end is None:
            # Only bounded leaf snapshots are admitted without an unwind entry.
            if address != 0x14346e940:
                raise ValueError('Unresolved native function extent '+hex(address))
            from capstone import Cs, CS_ARCH_X86, CS_MODE_64
            instructions = list(Cs(CS_ARCH_X86, CS_MODE_64).disasm(binary[pe.off(address):pe.off(address)+256], address))
            ret = next((i for i in instructions if i.mnemonic == 'ret'), None)
            if ret is None:
                raise ValueError('Unterminated bounded snapshot leaf')
            end = ret.address+ret.size
            extent_source = 'bounded leaf through RET; no PE unwind entry'
        raw = binary[pe.off(address):pe.off(end-1)+1]
        source = OUT/directory/f'{address:x}.c'
        if not source.is_file():
            raise ValueError('Missing decompiler evidence '+str(source))
        methods[name] = {'entry': hex(address), 'endExclusive': hex(end), 'extentSource': extent_source, 'bytes': len(raw),
                         'instructionSha256': hashlib.sha256(raw).hexdigest(),
                         'pseudocode': str(source.relative_to(OUT)),
                         'pseudocodeSha256': hashlib.sha256(source.read_bytes()).hexdigest()}
    record = {'schema': 'forspoken-native-contact-evidence-v13',
              'binarySha256': hashlib.sha256(binary).hexdigest(), 'targetExecuted': False,
              'methods': methods,
              'verifiedNativeLink': ['143469330 uses actor-context+148 as runtime constructor arg5',
                '143e99d50 stores arg5 at runtime+98, matching biped-wrapper+68',
                '143431530 constructs AnimationRaycastImpl at actor-context+148',
                'AnimationRaycastImpl vtable146a29078+8 resolves to14346e0e0'],
              'actionDispatchBoundary': {
                  'requestParameterClass': '.?AVLmAnimGraphMessageParameter@Animation@Luminous@@',
                  'requestParameterVtable': '0x146a290b0',
                  'componentClass': '.?AVAnimationComponent@AnimationModule@Luminous@@',
                  'componentSubobjectOffset': 64, 'componentVtable': '0x146a28f58',
                  'handler': '0x143430100',
                  'nextDynamicReceiver': '*( *(AnimationComponent+0x128) + 0x258 )',
                  'sourceMotionSelectionRecovered': False},
              'implemented': ['sync solver/actor/world frame conversions', 'saved frame copies',
                'raw sync hit ownership and flag acceptance', 'solver normal.z rejection',
                'bounded reference arrays', 'timed input rules', 'base three-slot OR'],
              'notImplemented': ['original probe/bone target selection', 'biped pose solver',
                'original async physics scheduling and lifetime ownership', 'original collision mask semantics',
                'engine eligibility overrides', 'graph-message dispatch to animation states'],
              'originalControllerComplete': False, 'originalIKComplete': False}
    (OUT/'native-contact-evidence-v13.json').write_text(json.dumps(record, indent=2)+'\n')
    print(json.dumps({'evidenceMethods': len(methods), 'originalIKComplete': False}))


if __name__ == '__main__':
    main()
