"""Audit decoded ORIGINAL cinematic data; availability is not fidelity certification.

Reads local decoded assets only, never executes or modifies the original game.
Negative-time keys are preserved source sentinels, not automatically corrupt data.
"""
import collections
import gzip
import hashlib
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path):
    p = ROOT / path
    return json.loads(gzip.decompress(p.read_bytes()) if p.suffix == '.gz' else p.read_text())


def audit_animation(animation):
    issues = []
    counts = collections.Counter()
    for entry in animation.get('entries', []):
        counts['entries'] += 1
        for curve in entry.get('curves', []):
            counts['curves'] += 1
            previous = -math.inf
            for time, value in curve.get('keys', []):
                counts['keys'] += 1
                values = value if isinstance(value, list) else [value]
                if not all(isinstance(v, (int, float)) and math.isfinite(v) for v in [time, *values]):
                    issues.append({'entry': entry['name'], 'path': curve['path'], 'issue': 'non-finite key'})
                if time < 0:
                    counts['negativeTimeSentinels'] += 1
                elif time > animation['duration'] + .001:
                    counts['keysPastDuration'] += 1
                if time >= 0:
                    if time < previous:
                        counts['outOfOrderKeyTransitions'] += 1
                    previous = time
    cameras = [dict(name=e['name'], clump=e.get('clump'), paths=[c['path'] for c in e.get('curves', [])])
               for e in animation.get('entries', []) if e['format'] == 2]
    return dict(counts=counts, cameras=cameras, issues=issues)


def main():
    catalog = read('assets/motion-library/catalog.json')
    cards = read('assets/nsunsc-library/cutin-catalog.json')['items']
    sounds = read('assets/nsunsc-library/sound-events-index.json')
    sound_tables = {r['name']: r['eventCount'] for b in sounds['bundles'].values() for r in b['records']}
    candidates = [c for c in catalog['clips'] if c.get('nativeBundle') and
                  c.get('sourceAnimation', '').endswith('_atk') and 'spl' in c['sourceAnimation']]
    rows, total = [], collections.Counter()
    for item in candidates:
        bundle = catalog['nativeBundles'][item['nativeBundle']]
        scene = read(bundle['scene'])
        animation = scene['animations'][item['nativeIndex']]
        assert animation['name'] == item['sourceAnimation']
        stem = animation['name'][:-4]
        siblings = {a['name']: a for a in scene['animations']}
        audit = audit_animation(animation)
        for key, value in audit['counts'].items():
            total[key] += value
        reaction = siblings.get(stem + '_dmg')
        row = dict(id=item['id'], name=animation['name'], family=item['family'],
                   bundle=item['nativeBundle'], sourcePath=bundle['path'],
                   decodedSceneSha256=hashlib.sha256((ROOT / bundle['scene']).read_bytes()).hexdigest(),
                   duration=animation['duration'], frameSize=animation['frameSize'],
                   audit=audit, sourceTimelines=[n for n in [stem+'_s',stem+'_atk',stem+'_dmg',stem+'_cut',stem+'_atk_e',stem+'_cut_nc'] if n in siblings],
                   reactionDurationMatches=bool(reaction and abs(reaction['duration']-animation['duration'])<.001),
                   sourceClumpInstances=len(animation['clumps']),
                   sourceMaterialEntries=sum(e['format']==4 for e in animation['entries']),
                   soundCueCount=sound_tables.get(animation['name']+'_snd', 0),
                   finalImages=[a['resourceName'] for a in cards if a['status']=='resolved image' and a['resourceName'].startswith(stem+'_fin')],
                   verification={'sourceData':'decoded and structurally audited',
                                 'originalRuntimePlayback':'not observed',
                                 'phaseOrder':'authored; original transitions unresolved',
                                 'rendering':'partial; original shaders and particle simulation unresolved'})
        rows.append(row)
    report = dict(version=1, boundary='Static source-data validation only. Source families and timeline variants are not unique characters or attacks. No original runtime execution or frame-perfect comparison is claimed.',
                  summary=dict(routes=len(rows), sourceCameraRoutes=sum(bool(r['audit']['cameras']) for r in rows),
                               matchingReactionTimelines=sum(r['reactionDurationMatches'] for r in rows),
                               withSoundCues=sum(r['soundCueCount']>0 for r in rows),
                               withFinalImages=sum(bool(r['finalImages']) for r in rows),
                               malformedKeys=sum(len(r['audit']['issues']) for r in rows), **total),
                  routes=rows)
    for path in ['assets/nsunsc-library/cinematic-audit.json', 'output/motion-library/v9-source-audit.json']:
        (ROOT/path).write_text(json.dumps(report, indent=2))
    print(json.dumps(report['summary']))


if __name__ == '__main__':
    main()
