"""Seal a bounded furnished-room checkpoint; full V02 is still incomplete."""
from pathlib import Path
import hashlib,json,subprocess
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();read=lambda p:json.loads(p.read_text())
b=read(D/'V02_Furnished_Public_Rooms_Build.json');suite=read(D/'V02_Furnished_Public_Rooms_Checks.json')
assert suite['status'].startswith('PASS') and len(suite['jobs'])==10
assert all(j['returncode']==0 for j in suite['jobs'])
for f,h in suite['hashes'].items():assert sha(R/f)==h,f
for k,v in b.items():
 if k.endswith('SHA256')and isinstance(b.get(k[:-6]),str)and (R/b[k[:-6]]).is_file():assert sha(R/b[k[:-6]])==v,k
reports={p.stem:read(p)for pattern in ['V02_Furnished_Public_Rooms_*.json','V02_Furnished_Public_Lighting_*.json'] for p in D.glob(pattern)if 'Evidence'not in p.name and 'Build'not in p.name}
for name,j in reports.items():
 assert j['status'].startswith(('PASS','MEASURED','AUTHORED')),name
 if 'entrySHA256'in j:assert j['entrySHA256']==b['entrySHA256'],name
 if 'masterSHA256'in j and 'Rooms_Authoring'not in name and 'Rooms_Master_Validation'not in name:assert j['masterSHA256']==b['masterSHA256'],name
assert len(reports['V02_Furnished_Public_Rooms_Movement']['cases'])==9
assert len(reports['V02_Furnished_Public_Rooms_Blender']['captures'])==5
routes=reports['V02_Furnished_Public_Rooms_Station_Routes'];assert len(routes['jobs'])==6 and all(j['returncode']==0 for j in routes['jobs'])
gameplay=read(D/'evidence/furnished-public-rooms-gameplay/run.json');assert len(gameplay['jobs'])==12 and all(j['returncode']==0 for j in gameplay['jobs'])
perf=reports['V02_Furnished_Public_Rooms_Benchmark'];assert len(perf['runs'])==2
assert perf['comparison']['maxPositionDifference']==perf['comparison']['maxCameraDifference']==0
for f,h in perf['hashes'].items():assert sha(R/f)==h,f
for run in perf['runs']:assert run['simulationSeconds']>=60 and not run['errors']
stock=D/'evidence/furnished-public-rooms/stock';assert read(stock/'state-0.json')['ready'] and not list(stock.glob('*errors*'))
base='5be9998f018865901c3aba99357ad472d91871ed'
prior=[r.split(b'\t',1)[1].decode()for r in subprocess.check_output(['git','ls-tree','-rz',base],cwd=R).split(b'\0')if r and Path(r.split(b'\t',1)[1].decode()).suffix=='.html']
assert len(prior)==60
for f in prior:assert sha(R/f)==hashlib.sha256(subprocess.check_output(['git','show',base+':'+f],cwd=R)).hexdigest(),f
source=read(D/'V02_Furnished_Public_Rooms_Authoring.json')
files={R/b[k]for k in ['entry','master','eastLightingScript','worldLifeScript','shadowScript']}
files.add(R/source['master']);files.add(Path(__file__).resolve());files.add(D/'V02_FURNISHED_PUBLIC_ROOMS.md');files.add(D/'V02_Public_Room_Boards.json');files.add(D/'V02_Market_Hero_Overlap_Baseline.json')
files.update(D.glob('V02_Furnished_Public_Rooms_*.json'));files.update(D.glob('V02_Furnished_Public_Lighting_*.json'))
names=['draw_public_room_boards.py','blender_furnished_public_rooms.py','validate_furnished_public_rooms.py','blender_furnished_public_lighting.py','validate_furnished_public_lighting.py','package_furnished_public_rooms.mjs','build_furnished_public_rooms.py','verify_furnished_room_provenance.py','inspect_furnished_public_rooms.cjs','test_furnished_room_life.cjs','test_furnished_public_rooms.cjs','render_furnished_public_rooms.py','benchmark_furnished_public_rooms.cjs','run_furnished_public_room_checks.py','debug_furnished_bake.py','debug_furnished_uv.py','debug_furnished_repack.py','debug_furnished_square_repack.py','debug_furnished_target_repack.py','debug_furnished_target_nosync.py']
files.update(R/'scripts/vertical-v02'/n for n in names);files.add(D/'tools/run-furnished-skill-client.cjs')
files.update(p for p in (R/'assets/city/vertical-v02/furnished-public-rooms').rglob('*')if p.is_file())
for name in ['furnished-public-rooms','furnished-public-rooms-checks','furnished-public-room-movement','furnished-public-room-life','furnished-public-rooms-loops','furnished-public-rooms-station-routes','furnished-public-rooms-recovery','furnished-public-rooms-gameplay','furnished-public-rooms-benchmark','furnished-public-lighting-first-atlas','furnished-public-lighting-uv-review']:
 files.update(p for p in (D/'evidence'/name).rglob('*')if p.is_file()and p.suffix!='.blend1')
files.update(D.glob('evidence/furnished-public*.log'))
index=D/'V02_Furnished_Public_Rooms_Evidence.json';files.discard(index)
assert all(p.is_file()and p.stat().st_size<100_000_000 for p in files)
result={'status':'PASS bounded furnished-room source/native/input/encounter checks; timing MEASURED; full V02 INCOMPLETE',
 'entry':b['entry'],'entrySHA256':b['entrySHA256'],'masterSHA256':b['masterSHA256'],'manifestSHA256':b['manifestSHA256'],
 'preservationBaseCommit':base,'preservedPriorHTML':len(prior),'visualReferenceGate':'FAIL: broad platforms, repeated tower grids and placeholder civilian art remain',
 'benchmarkComparison':perf['comparison'],
 'releaseLimits':['Current room fixture atlases and reflections are baked from the new source; wider inherited lighting is not certified',
 'Market hero/NPC clearance failure is reproduced, not fixed by this room-only child',
 'Remaining original missions, legal destruction and broader failure/camera cases remain open',
 'A matched60second loop is not combined combat/replay/drone/destruction stress or sustained thermal acceptance',
 'Physical controller and touchscreen testing remains open; simulated inputs/layouts only',
 'Archived diagnostic/failed source files are evidence, not standalone usable game distributions'],
 'artifacts':[{'file':str(p.relative_to(R)),'sha256':sha(p),'bytes':p.stat().st_size}for p in sorted(files)]}
index.write_text(json.dumps(result,indent=2)+'\n');print(result['status'],len(files),'artifacts;',len(prior),'older HTML unchanged')
