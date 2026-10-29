"""Freeze the bounded east-room checkpoint without certifying the full V02 goal."""
from pathlib import Path
import hashlib
import json
import subprocess

R=Path(__file__).resolve().parents[2]
D=R/'development/vertical-city-v02'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
read=lambda p:json.loads(p.read_text())
b=read(D/'V02_East_Public_Room_Life_Build.json')
lighting=read(D/'V02_East_Public_Emissive_Build.json')
checks=read(D/'V02_East_Public_Room_Life_Checks.json')
assert checks['status'].startswith('PASS') and len(checks['jobs'])==7
assert all(job['returncode']==0 for job in checks['jobs'])
assert all(sha(R/file)==value for file,value in checks['hashes'].items())
for build in [b,lighting]:
    for key in ['entry','manifest','master']:
        assert sha(R/build[key])==build[key+'SHA256']
assert b['sourceSHA256']==lighting['entrySHA256']
# Verify the actual child bytes, independently of the builder's assertions.
parent=(R/lighting['entry']).read_text()
old_tag='<script src="scripts/game_vertical_world_life_v02.js"></script>'
new_tag='<script src="'+b['worldLifeScript']+'?v='+sha(R/b['worldLifeScript'])[:12]+'"></script>'
surface_tag='<script src="'+b['surfaceNormalScript']+'?v='+sha(R/b['surfaceNormalScript'])[:12]+'"></script>\n'
assert (R/b['entry']).read_text().replace(new_tag,old_tag).replace(surface_tag,'')==parent
current_names=['V02_East_Public_Room_Life_Native.json','V02_East_Public_Room_Life_Movement.json',
    'V02_East_Public_Room_Life_City_Loops.json','V02_East_Public_Room_Life_Station_Routes.json',
    'V02_East_Public_Surface_Normals.json']
for name in current_names:
    report=read(D/name)
    assert report['status'].startswith('PASS') and not report.get('errors') and not report.get('failure'),name
    assert report['entrySHA256']==b['entrySHA256'],name
    assert report['manifestSHA256']==b['manifestSHA256'],name
for name in ['V02_East_Public_Emissive_Master_Validation.json','V02_East_Public_Emissive_Package.json',
             'V02_East_Public_Emissive_Native.json','V02_East_Public_Emissive_Blender.json']:
    report=read(D/name)
    assert report['status'].startswith('PASS') and not report.get('errors') and not report.get('failure'),name
    assert report['masterSHA256']==b['masterSHA256'],name
movement=read(D/'V02_East_Public_Room_Life_Movement.json')
assert len(movement['cases'])==9
assert all(case['minimumVisitorGap']>=.87 for case in movement['cases'])
routes=read(D/'V02_East_Public_Room_Life_Station_Routes.json')
assert len(routes['jobs'])==6
for job in routes['jobs']:
    assert sha(D/job['report'])==job['reportSHA256']
    assert sha(D/job['trace'])==job['traceSHA256']
    assert job['returncode']==0 and not job['reused']
    if job['cameraVisibility'] is not None:
        assert job['cameraVisibility']['problemSamples']==0
gameplay=read(D/'evidence/east-public-room-life-gameplay/run.json')
assert gameplay['status'].startswith('PASS') and len(gameplay['jobs'])==12
assert all(job['returncode']==0 for job in gameplay['jobs'])
perf=read(D/'V02_East_Public_Room_Life_Benchmark.json')
assert perf['status'].startswith('MEASURED') and len(perf['runs'])==2
assert all(sha(R/file)==value for file,value in perf['hashes'].items())
assert all(run['simulationSeconds']>=60 and not run['errors'] and
           sha(R/run['entry'])==run['entrySHA256'] for run in perf['runs'])
assert perf['comparison']['maxPositionDifference']==perf['comparison']['maxCameraDifference']==0
stock=D/'evidence/east-public-room-life/stock'
state=read(stock/'state-0.json')
assert state['ready'] and state['active'] and abs(state['pos'][0]-55)>.1
assert not list(stock.glob('*errors*'))
baseline='75f9013ee6f52ca43cda90f04c869241fac728f4'
prior=[row.split(b'\t',1)[1].decode() for row in subprocess.check_output(
    ['git','ls-tree','-rz',baseline],cwd=R).split(b'\0') if row and
    Path(row.split(b'\t',1)[1].decode()).suffix.lower()=='.html']
assert len(prior)==53
preserved={}
for file in prior:
    original=hashlib.sha256(subprocess.check_output(['git','show',baseline+':'+file],cwd=R)).hexdigest()
    assert sha(R/file)==original,file
    preserved[file]=original

files={R/b['entry'],R/lighting['entry'],R/b['master'],D/'V02_EAST_PUBLIC_ROOMS.md',
       D/'tools/run-east-public-skill-client.cjs',Path(__file__).resolve()}
programs=['blender_east_public_emissive.py','validate_east_public_emissive_master.py',
    'package_east_public_emissive.mjs','build_east_public_emissive.py','render_east_public_emissive.py',
    'v02_saved_scene_snapshots.py','static_gltf_batch_v02.mjs','admit_east_public_room_routes.py',
    'validate_east_public_room_admission.py','build_east_public_room_life.py',
    'test_east_public_emissive.cjs','test_east_public_emissive_movement.cjs',
    'test_east_public_room_life.cjs','test_east_public_room_life_movement.cjs',
    'test_east_public_room_life_city_loops.cjs','test_east_public_surface_normals.cjs',
    'east_public_test_readiness.cjs','run_east_public_room_life_checks.py','benchmark_east_public_room_life.cjs']
files.update(R/'scripts/vertical-v02'/name for name in programs)
files.update(R/name for name in [b['worldLifeScript'],b['surfaceNormalScript'],b['eastLightingScript']])
for prefix in ['V02_East_Public_Emissive','V02_East_Public_Room_Life_','V02_East_Public_Room_Admission','V02_East_Public_Surface_Normals']:
    files.update(D.glob(prefix+'*.json'))
files.add(D/'V02_East_Public_Room_Movement_Graph.json')
files.update(p for p in (R/'assets/city/vertical-v02/east-public-emissive').rglob('*') if p.is_file())
for name in ['east-public-emissive','east-public-emissive-movement','east-public-room-life',
    'east-public-room-life-movement','east-public-room-life-city-loops','east-public-room-life-station-routes',
    'east-public-room-life-recovery','east-public-room-life-gameplay','east-public-room-life-benchmark',
    'east-public-room-life-checks','east-public-room-life-first-playable-rejection','east-public-room-life-normal-fix']:
    folder=D/'evidence'/name
    assert folder.is_dir(),name
    files.update(p for p in folder.rglob('*') if p.is_file() and p.suffix not in ['.blend','.blend1'])
files.update(D/'evidence'/name for name in ['east-public-emissive-authoring.log','east-public-room-life-checks.log'])
out=D/'V02_East_Public_Room_Evidence.json'
files.discard(out)
assert all(p.is_file() for p in files)
result={'status':'PASS bounded east-room/source/input/visitor checkpoint; full V02 goal INCOMPLETE',
    'entry':b['entry'],'entrySHA256':b['entrySHA256'],'manifestSHA256':b['manifestSHA256'],
    'masterSHA256':b['masterSHA256'],'checksSHA256':sha(D/'V02_East_Public_Room_Life_Checks.json'),
    'preservationBaselineCommit':baseline,'preservedPriorHTML':preserved,
    'sourceStage':{'entry':lighting['entry'],'entrySHA256':lighting['entrySHA256'],
        'scope':'Intermediate source-light stage. Raw two-sided attachment normals are corrected only in the final child; do not use this intermediate as the preferred playable entry.'},
    'stationRoutes':[{'name':job['name'],'seconds':job['seconds'],'distance':job['distance'],
                     'initialBank':job['initialBank']} for job in routes['jobs']],
    'minimumMeasuredVisitorGap':min(case['minimumVisitorGap'] for case in movement['cases']),
    'performance':perf['comparison'],'visualReferenceGate':'FAIL: deck-dominated composition, pale141glare, unfinished architectural variety/interiors and civilian art',
    'scopeLimits':['Current explicit fixtures only; arbitrary routes and all inherited graph edges are not certified',
        'Touch layouts use simulated standard-controller input; physical devices remain untested',
        'Source/native projection and texel checks do not establish matching material/light appearance',
        'One matched lower-loop benchmark cannot establish combined combat/replay/drone/destruction release performance',
        'Original-city mission, legal-input destruction, broad failure and sustained thermal tests remain open',
        'Archived failed drafts/logs are evidence, not recommended rollback/playable releases'],
    'artifacts':[{'file':str(p.relative_to(R)),'sha256':sha(p),'bytes':p.stat().st_size} for p in sorted(files)]}
out.write_text(json.dumps(result,indent=2)+'\n')
print(result['status'],len(files),'artifacts;',len(preserved),'old HTML files unchanged')
