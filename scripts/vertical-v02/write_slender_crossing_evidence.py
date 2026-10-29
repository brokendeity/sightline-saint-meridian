"""Seal the flared-crossing checkpoint; this does not certify the whole city."""
from pathlib import Path
import hashlib,json,subprocess

R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
read=lambda p:json.loads(p.read_text())
b=read(D/'V02_Slender_Crossings_Build.json')
for key,value in b.items():
    if key.endswith('SHA256') and key[:-6] in b and (R/str(b[key[:-6]])).is_file():
        assert sha(R/b[key[:-6]])==value,key
suite=read(D/'V02_Slender_Crossings_Checks.json')
assert suite['status'].startswith('PASS') and len(suite['jobs'])==7
assert all(j['returncode']==0 for j in suite['jobs'])
for f,h in suite['hashes'].items():assert sha(R/f)==h,f
reports={p.stem:read(p)for p in D.glob('V02_Slender_Crossings_*.json') if p.stem not in ['V02_Slender_Crossings_Build','V02_Slender_Crossings_Evidence']}
for name,j in reports.items():
    assert j['status'].startswith(('PASS','MEASURED')),name
    if 'entrySHA256'in j:assert j['entrySHA256']==b['entrySHA256'],name
    if 'masterSHA256'in j:assert j['masterSHA256']==b['masterSHA256'],name
assert len(reports['V02_Slender_Crossings_Guards']['cases'])==33
assert len(reports['V02_Slender_Crossings_Room_Movement']['cases'])==9
assert len(reports['V02_Slender_Crossings_Blender']['captures'])==4
assert len(reports['V02_Slender_Crossings_Station_Routes']['jobs'])==6
assert all(j['returncode']==0 for j in reports['V02_Slender_Crossings_Station_Routes']['jobs'])
perf=reports['V02_Slender_Crossings_Benchmark']
assert len(perf['runs'])==2
assert perf['comparison']['maxPositionDifference']==perf['comparison']['maxCameraDifference']==0
for f,h in perf['hashes'].items():assert sha(R/f)==h,f
gameplay=read(D/'evidence/slender-crossings-gameplay/run.json')
assert len(gameplay['jobs'])==12 and all(j['returncode']==0 for j in gameplay['jobs'])
stock=D/'evidence/slender-crossings/stock'
assert read(stock/'state-0.json')['ready'] and not list(stock.glob('*errors*'))
base='609c83ed13ccc741fa5c7a03e02de2935487e7ba'
prior=[row.split(b'\t',1)[1].decode() for row in subprocess.check_output(['git','ls-tree','-rz',base],cwd=R).split(b'\0') if row and Path(row.split(b'\t',1)[1].decode()).suffix=='.html']
for f in prior:assert sha(R/f)==hashlib.sha256(subprocess.check_output(['git','show',base+':'+f],cwd=R)).hexdigest(),f
files={R/b[k]for k in ['entry','master','worldLifeScript','shadowScript']}
files.update(D.glob('V02_Slender_Crossings_*.json'))
files.add(D/'V02_SLENDER_CROSSINGS.md');files.add(Path(__file__).resolve())
names=['plan_slender_crossings.py','validate_slender_crossing_clearance.py','validate_slender_crossing_traffic.cjs','blender_slender_crossings.py','validate_slender_crossing_master.py','package_slender_crossings.mjs','build_slender_crossings.py','inspect_slender_crossings.cjs','render_slender_crossings.py','run_slender_crossing_checks.py','slender_test_readiness.cjs','test_slender_crossing_life.cjs','test_slender_crossing_rooms.cjs','test_slender_guard_approaches.cjs','benchmark_slender_crossings.cjs']
files.update(R/'scripts/vertical-v02'/n for n in names)
files.add(D/'tools/run-slender-skill-client.cjs')
files.update(p for p in (R/'assets/city/vertical-v02/slender-crossings').rglob('*')if p.is_file())
for name in ['slender-crossings','slender-crossings-checks','slender-crossings-loops','slender-crossings-life','slender-crossings-room-movement','slender-crossings-station-routes','slender-crossings-recovery','slender-crossings-gameplay','slender-crossings-benchmark','slender-crossings-guards']:
    files.update(p for p in (D/'evidence'/name).rglob('*') if p.is_file() and p.suffix not in ['.blend1'])
files.update(D.glob('evidence/slender-crossings*.log'))
index=D/'V02_Slender_Crossings_Evidence.json';files.discard(index)
assert all(p.is_file() and p.stat().st_size<100_000_000 for p in files)
result={'status':'PASS bounded source/native/input/encounter checks; timing MEASURED; full V02 INCOMPLETE',
 'entry':b['entry'],'entrySHA256':b['entrySHA256'],'masterSHA256':b['masterSHA256'],'manifestSHA256':b['manifestSHA256'],
 'preservationBaseCommit':base,'preservedPriorHTML':len(prior),
 'visualReferenceGate':'FAIL: large bare platforms, repeated window grids, sparse interiors and placeholder civilian art; market civilian/hero overlap remains open',
 'reviewedCaptures':['three public loop endpoints','desktop/portrait/landscape room entries','native before/after bridge-top and canonical B','source four current camera renders','180-second room life','33-approach guard test sample','mastery-zero and short-catch completion','service Echo contact','market extraction','pursuit victory','discovery street return','both benchmark timeline contact sheets'],
 'benchmarkComparison':perf['comparison'],
 'limits':['Room fixture bake/reflection coupling must be updated for current geometry','One bounded 60-second pair is not combined combat/replay/drone/destruction stress or thermal acceptance','Remaining original missions, legal destruction and broad failure regressions are not certified by these retained12cases','Guard checks cover walking, not all high-speed vault/landing/impact cases','Physical controller and touchscreen testing remains open','Canonical cameras unchanged; matched source/native optics do not establish approved-reference fidelity'],
 'artifacts':[{'file':str(p.relative_to(R)),'sha256':sha(p),'bytes':p.stat().st_size}for p in sorted(files)]}
index.write_text(json.dumps(result,indent=2)+'\n')
print(result['status'],len(files),'artifacts;',len(prior),'prior HTML preserved')
