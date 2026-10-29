"""Pre-authoring separation of proposed rooms from immutable visible geometry.

Clips original triangles against open room boxes, including non-solid glazing
and canopies. Cassette envelopes are conservative closed source bounds. This
does not certify gameplay, grounded foundations or load-bearing engineering.
"""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DEV = ROOT / 'development/vertical-city-v02'


def read(name):
    return json.loads((ROOT / name).read_text())


def sha(name):
    return hashlib.sha256((ROOT / name).read_bytes()).hexdigest()


def overlap(a, b):
    return all(a['min'][i] < b['max'][i] - 1e-6 and
               a['max'][i] > b['min'][i] + 1e-6 for i in range(3))


def clip_triangle(points, box):
    # Shrink to an open interior: exact joints at a face are permitted.
    polygon = points
    for axis in range(3):
        for sign, edge in [(1, box['min'][axis] + 1e-5),
                           (-1, box['max'][axis] - 1e-5)]:
            out = []
            if not polygon:
                return []
            for p, q in zip(polygon, polygon[1:] + polygon[:1]):
                a = sign * (p[axis] - edge)
                b = sign * (q[axis] - edge)
                if a >= 0:
                    out.append(p)
                if (a >= 0) != (b >= 0):
                    t = a / (a - b)
                    out.append([p[j] + t * (q[j] - p[j]) for j in range(3)])
            polygon = out
    return polygon


def area(poly):
    if len(poly) < 3:
        return 0
    total = 0
    for j in range(1, len(poly) - 1):
        u = [poly[j][i] - poly[0][i] for i in range(3)]
        v = [poly[j + 1][i] - poly[0][i] for i in range(3)]
        cross = [u[1]*v[2]-u[2]*v[1], u[2]*v[0]-u[0]*v[2],
                 u[0]*v[1]-u[1]*v[0]]
        total += sum(x*x for x in cross)**0.5 / 2
    return total


files = ['development/vertical-city-v02/V02_Slender_Crossings_Plan.json',
         'scripts/vertical-v02/plan_slender_crossings.py',
         'development/vertical-city-v02/V02_LiveWorld_Authoritative.json',
         'development/vertical-city-v02/V02_BuildingGeometry.json',
         'development/vertical-city-v02/V02_Facade_Cassettes_Plan.json',
         'scripts/vertical-v02/validate_slender_crossing_clearance.py']
plan, world = read(files[0]), read(files[2])
assert plan['status'].startswith('PASS')
assert sha(plan['sourceMaster']) == plan['sourceMasterSHA256']
assert sha(plan['sourceManifest']) == plan['sourceManifestSHA256']
geometries = {g['id']: g for g in read(files[3])['geometries']}
cassettes = read(files[4])['features']
old_facades_name = 'assets/city/vertical-v02/facade-architecture/facades.json'
files.append(old_facades_name)
old_facades = [bay for chunk in read(old_facades_name)['chunks']
               for bay in chunk['bays']]
records = [c['after'] for c in plan['changes']]
parents={r['id']:r for r in records}
for contact in plan['collisionAdditions']:
    outer=parents[contact['sourceStructure']]['box'];inner=contact['box']
    assert all(outer['min'][i]-1e-8<=inner['min'][i] and outer['max'][i]+1e-8>=inner['max'][i] for i in range(3)),contact['id']

failures, cassette_tests, triangle_tests, original_owners = [], 0, 0, []
for r in records:
    # Both visible decoration and solid features must clear real facade geometry.
    for f in cassettes + old_facades:
        cassette_tests += 1
        if overlap(r['box'], f['box']):
            failures.append({'new': r['id'], 'originalDetail': f['id'],
                             'kind': 'conservative source envelope overlap'})

for building in world['buildings']:
    candidates = [r for r in records if overlap(r['box'], building['visualWorldBounds'])]
    if not candidates:
        continue
    original_owners.append(building['id'])
    g = geometries[building['geometry']]
    m = building['transform']['matrixWorld']
    positions = g['positions']
    points = [[m[i]*x + m[i+4]*y + m[i+8]*z + m[i+12] for i in range(3)]
              for x, y, z in zip(positions[::3], positions[1::3], positions[2::3])]
    indices = g['indices'] or list(range(len(points)))
    for j in range(0, len(indices), 3):
        tri = [points[k] for k in indices[j:j+3]]
        bounds = {k: [fn(p[i] for p in tri) for i in range(3)]
                  for k, fn in [('min', min), ('max', max)]}
        for r in candidates:
            if not overlap(bounds, r['box']):
                continue
            triangle_tests += 1
            intersection = area(clip_triangle(tri, r['box']))
            if intersection > 1e-9:
                failures.append({'new': r['id'], 'original': building['id'],
                                 'sourceTriangle': j//3, 'interiorArea': intersection})

report = {
    'status': ('PASS' if not failures else 'FAIL') + ' original visible geometry separation preflight',
    'hashes': {f: sha(f) for f in files},
    'newRecords': len(records), 'originalOwnersCompared': original_owners,
    'triangleInteriorClips': triangle_tests, 'detailEnvelopeComparisons': cassette_tests,
    'failures': failures,
    'scope': 'Immutable original building triangle surfaces plus original fitting and cassette envelopes. '
             'Static obstacle/road preflight remains separate. No room is yet authored or playable.'
}
(DEV / 'V02_Slender_Crossings_Geometry_Clearance.json').write_text(json.dumps(report, indent=2)+'\n')
print(report['status'], len(failures), 'conflicts', flush=True)
for failure in failures[:15]:
    print(failure)
if failures:
    raise SystemExit(1)
