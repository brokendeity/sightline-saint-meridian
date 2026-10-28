"""Freeze bounded cassette evidence; the complete V02 visual/release gate stays open."""
import hashlib
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DEV = ROOT / 'development/vertical-city-v02'


def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


def read(name):
    return json.loads((DEV/name).read_text())


build = read('V02_Facade_Cassettes_Build.json')
checks = read('V02_Facade_Cassettes_Checks.json')
assert checks['status'].startswith('PASS') and len(checks['jobs']) == 8
assert all(j['returncode'] == 0 for j in checks['jobs'])
assert all(sha(ROOT/f) == h for f,h in checks['hashes'].items())
for key in ['entry','manifest','master']:
    assert sha(ROOT/build[key]) == build[key+'SHA256']
names = [
    'V02_Facade_Cassettes_Authoring.json', 'V02_Facade_Cassettes_Package.json',
    'V02_Facade_Cassettes_Master_Validation.json', 'V02_Facade_Cassettes_Export_Validation.json',
    'V02_Facade_Cassettes_Native.json', 'V02_Facade_Cassettes_Blender.json',
    'V02_Facade_Cassettes_City_Loops.json', 'V02_Facade_Cassettes_Station_Routes.json',
    'V02_Body_Movement_cassettes.json', 'V02_Body_Movement_cassettes_touch.json',
    'evidence/facade-cassette-gameplay/run.json'
]
for name in names:
    report = read(name)
    assert report['status'].startswith('PASS'), name
    assert not report.get('errors'), name
    if 'entrySHA256' in report:
        assert report['entrySHA256'] == build['entrySHA256'], name
    if 'masterSHA256' in report:
        assert report['masterSHA256'] == build['masterSHA256'], name
    for f,h in report.get('hashes',{}).items():
        assert sha(ROOT/f) == h, (name,f)
pack = read('V02_Facade_Cassettes_Package.json')
assert len(pack['models']) == 3
assert all(m['errors'] == m['warnings'] == 0 for m in pack['models'])
routes = read('V02_Facade_Cassettes_Station_Routes.json')
assert len(routes['jobs']) == 6
for job in routes['jobs']:
    assert sha(DEV/job['report']) == job['reportSHA256']
    assert sha(DEV/job['trace']) == job['traceSHA256']
    assert job['returncode'] == 0 and not job['reused']
    if job['cameraVisibility'] is not None:
        assert job['cameraVisibility']['problemSamples'] == 0
    else:
        assert job['name'].startswith('public-')
gameplay = read('evidence/facade-cassette-gameplay/run.json')
assert len(gameplay['jobs']) == 12 and all(j['returncode'] == 0 for j in gameplay['jobs'])
perf = read('V02_Facade_Cassettes_Benchmark.json')
assert perf['status'].startswith('MEASURED') and len(perf['runs']) == 2
assert all(sha(ROOT/f) == h for f,h in perf['hashes'].items())
assert all(r['simulationSeconds'] >= 60 and not r['errors'] and
           r['entrySHA256'] == sha(ROOT/r['entry']) for r in perf['runs'])
assert perf['comparison']['maxPositionDifference'] == perf['comparison']['maxCameraDifference'] == 0
stock = DEV/'evidence/facade-cassettes/stock'
state = json.loads((stock/'state-0.json').read_text())
assert state['ready'] and state['active'] and abs(state['pos'][0]-55) > .1
assert not list(stock.glob('*errors*'))

baseline = '7a3b1fe1f44d005f0245371bbda429aaa9012b49'
prior = [f for f in subprocess.check_output(
    ['git','ls-tree','-r','--name-only',baseline],cwd=ROOT,text=True).splitlines()
    if Path(f).suffix.lower() == '.html']
assert len(prior) >= 50, 'Prior complete-game HTML inventory was not enumerated'
preserved = {}
for name in prior:
    before = hashlib.sha256(subprocess.check_output(['git','show',baseline+':'+name],cwd=ROOT)).hexdigest()
    assert sha(ROOT/name) == before, name
    preserved[name] = before

files = {ROOT/build['entry'], ROOT/build['master'], ROOT/'scripts/game_v02_facade_cassettes.js',
         DEV/'V02_FACADE_CASSETTES.md', DEV/'tools/run-cassette-skill-client.cjs',
         ROOT/'scripts/vertical-v02/cassette_test_readiness.cjs', Path(__file__).resolve()}
files.update(DEV.glob('V02_Facade_Cassettes*'))
files.update(DEV/name for name in ['V02_Body_Movement_cassettes.json','V02_Body_Movement_cassettes_touch.json'])
files.update((ROOT/'scripts/vertical-v02').glob('*facade_cassette*'))
files.update(p for p in (ROOT/'assets/city/vertical-v02/facade-cassettes').rglob('*') if p.is_file())
for folder in (DEV/'evidence').iterdir():
    if folder.is_dir() and folder.name.startswith(('facade-cassette','facade-cassettes')):
        files.update(p for p in folder.rglob('*') if p.is_file() and p.suffix not in ['.blend','.blend1'])
for folder in ['body-framing-movement','body-framing-movement-touch']:
    files.update((DEV/'evidence'/folder).glob('cassettes-*.png'))
out = DEV/'V02_Facade_Cassettes_Evidence.json'
files.discard(out)
assert all(p.is_file() for p in files)
result = {
    'status':'PASS bounded source/export/current-input cassette checkpoint; full V02 incomplete',
    'entry':build['entry'], 'entrySHA256':build['entrySHA256'],
    'masterSHA256':build['masterSHA256'], 'manifestSHA256':build['manifestSHA256'],
    'checksReportSHA256':sha(DEV/'V02_Facade_Cassettes_Checks.json'),
    'preservationBaselineCommit':baseline, 'preservedPriorGameEntries':preserved,
    'reports':[{'file':name,'sha256':sha(DEV/name)} for name in names],
    'stationRoutes':[{'name':j['name'],'seconds':j['seconds'],'distance':j['distance'],
                      'initialBank':j['initialBank']} for j in routes['jobs']],
    'performance':perf['comparison'],
    'scopeLimits':[
        'Owner breach/collapse cleanup uses explicitly labelled native API setup, not legal-input destruction acceptance.',
        'Current movement/route/encounter fixtures establish only their stated coverage; arbitrary path robustness remains open.',
        'Touch-layout movement uses keyboard and is not physical touchscreen acceptance.',
        'Source/native optical correspondence does not certify matching shader or light response.',
        'One matched lower-loop benchmark is not combined combat/replay/drone/destruction release stress.',
        'The separate east public-room proposal is not included in this playable checkpoint.'
    ],
    'fullVisualGate':'FAIL/incomplete: approved-reference massing, occupied terraces, material/lighting response and complete A/B match',
    'releaseGatesRemaining':['Approved-reference architecture and source/native visual quality',
        'Broad current missions, legal-input destruction and failure cases',
        'Combined sustained real combat/replay/drones/destruction CPU/GPU workload',
        'Physical controller/touchscreen playtesting and thermal stability'],
    'artifacts':[{'file':str(p.relative_to(ROOT)),'sha256':sha(p),'bytes':p.stat().st_size}
                 for p in sorted(files)]
}
out.write_text(json.dumps(result,indent=2)+'\n')
print(result['status'],len(files),'artifacts;',len(preserved),'older HTML builds unchanged')
