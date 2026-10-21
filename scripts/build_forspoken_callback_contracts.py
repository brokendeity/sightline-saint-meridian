"""Attach only native-backed callback semantics; retain v6 evidence unchanged."""
import gzip
import hashlib
import json
import struct
from pathlib import Path
from inspect_forspoken_graph_runtime import PE, OUT

ROOT = Path(__file__).resolve().parents[1]


def playback_contract(data):
    pe = PE(data)
    registration = 0x144c1ca52
    at = pe.off(registration)
    if data[at:at + 3] != bytes.fromhex('c74510'):
        raise ValueError('Playback registry instruction changed')
    native_id = struct.unpack_from('<I', data, at + 3)[0]
    if native_id != 0x040c8553:
        raise ValueError('Playback registry ID changed')
    lea = 0x144c1ca5d
    at = pe.off(lea)
    if data[at:at + 3] != bytes.fromhex('488d0d'):
        raise ValueError('Playback function pointer instruction changed')
    function = lea + 7 + struct.unpack_from('<i', data, at + 3)[0]
    if function != 0x144c21280 or not pe.code(function):
        raise ValueError('Playback setter binding changed')
    default = struct.unpack_from('<f', data, pe.off(0x146d53f28))[0]
    if default != 1.0:
        raise ValueError('Playback default changed')
    files = ['144c21280.c', '140517ab0.c']
    evidence = []
    for file in files:
        p = OUT / 'ghidra-graph-v7' / file
        evidence.append({'file': str(p.relative_to(ROOT)), 'sha256': hashlib.sha256(p.read_bytes()).hexdigest()})
    return {'name': 'SetPlaybackRate', 'path': 'sdk://udf/Animation/Animation/SetPlaybackRate.json',
            'nativeFunctionId': native_id, 'nativeFunction': hex(function),
            'registryBindingInstruction': hex(registration),
            'defaultAddress': '0x146d53f28', 'parameterField': 0,
            'parameterType': 'float32', 'default': default,
            'nonpositivePolicy': 'ignore; do not replace the active rate',
            'evidence': evidence, 'visualFidelityVerified': False}


def main():
    data = (OUT / 'FORSPOKEN.exe').read_bytes()
    contract = playback_contract(data)
    source = ROOT / 'assets/backspool/source-graph-evidence-v6.json.gz'
    result = json.loads(gzip.decompress(source.read_bytes()))
    typed = 0
    for nodes in result['clipIds'].values():
        for node in nodes:
            for callback_field, reference_field in [('2', 'field4References'), ('3', 'field5References')]:
                callbacks, references = node['callbacks'][callback_field], node[reference_field]
                if len(callbacks) != len(references):
                    raise ValueError('Callback/function slot correspondence failed')
                for callback, native_id in zip(callbacks, references):
                    callback['nativeFunctionId'] = native_id
                    if native_id != contract['nativeFunctionId']:
                        continue
                    if callback['path'] != contract['path']:
                        raise ValueError('Callback/native setter identity disagreement')
                    params = callback['parameters']
                    scalar = next((s for s in params['scalarFields'] if s['fieldIndex'] == 0), None)
                    value = scalar['f32Interpretation'] if scalar else contract['default']
                    callback['typedParameters'] = {
                        'contract': contract['name'], 'nativeFunction': contract['nativeFunction'],
                        'field': 0, 'type': 'float32', 'value': value,
                        'origin': 'explicit' if scalar else 'native default',
                        'appliesWhenInvoked': value is not None and value > 0,
                        'scope': 'Native setter semantics; not proof of context selection or original visual fidelity'}
                    typed += 1
    result['contractsRevision'] = 'native-playback-contract-v7'
    result['nativeContracts'] = [contract]
    result['typedCallbackCount'] = typed
    result['limitations'] = [
        'State resource equality establishes graph membership, not a wall/tether action name.',
        'Callback execution phases and context selection remain unresolved; only listed native parameter contracts are typed.',
        'Inspection never applies playback-rate changes or original IK to gameplay.']
    target = ROOT / 'assets/backspool/source-graph-evidence-v7.json.gz'
    target.write_bytes(gzip.compress(json.dumps(result, separators=(',', ':'), allow_nan=False).encode(), mtime=0))
    report = {'binarySha256': hashlib.sha256(data).hexdigest(), 'contract': contract,
              'typedMotionCallbackCount': typed, 'sourceV6Sha256': hashlib.sha256(source.read_bytes()).hexdigest(),
              'exportSha256': hashlib.sha256(target.read_bytes()).hexdigest(),
              'gameplayRateChanges': False, 'contextSelectionRecovered': False}
    (OUT / 'native-playback-contract-v7.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()
