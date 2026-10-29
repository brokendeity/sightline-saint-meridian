"""Hash-bind the bounded architectural-shadow experiment, without a full V02 claim."""
from pathlib import Path
import hashlib,json,subprocess
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
read=lambda p:json.loads(p.read_text())
b=read(D/'V02_Rim_Shadow_Build.json');source=read(D/'V02_Rim_Shadow_Source.json')
for key in ['entry','script','contract','master']:
 assert sha(R/b[key])==b[key+'SHA256']
assert sha(R/b['source'])==b['sourceSHA256']=='d40e10c5d47b82ecd0eac30adc64e383566ce68cb0504635e256781a43c80300'
tag=f'<script src="{b["script"]}?v={b["scriptSHA256"][:12]}&amp;contract={b["contractSHA256"]}"></script>\n'
assert (R/b['entry']).read_text().replace(tag,'')==(R/b['source']).read_text()
assert source['masterSHA256']==b['masterSHA256'] and source['contractSHA256']==b['contractSHA256']
assert source['preservedObjects']==50173 and source['status'].startswith('PASS')
assert source['scriptSHA256']==sha(R/'scripts/vertical-v02/blender_rim_shadow_domain.py')
n=read(D/'V02_Rim_Shadow_Native.json');m=read(D/'V02_Rim_Shadow_Movement.json');v=read(D/'V02_Rim_Shadow_Blender.json');p=read(D/'V02_Rim_Shadow_Benchmark.json')
for j in [n,m,v]:
 assert j['status'].startswith('PASS') and not j.get('errors') and not j.get('failure')
 assert j['entrySHA256']==b['entrySHA256']
assert n['scriptSHA256']==b['scriptSHA256'] and n['masterSHA256']==v['masterSHA256']==b['masterSHA256']
assert n['testSHA256']==sha(R/'scripts/vertical-v02/test_rim_shadows.cjs')
assert m['testSHA256']==sha(R/'scripts/vertical-v02/test_rim_shadow_movement.cjs')
assert v['nativeReportSHA256']==sha(D/'V02_Rim_Shadow_Native.json')
assert n['preservation']['originalBuildings']==310 and n['preservation']['contacts']==9692 and n['preservation']['lights']==11
assert n['state']['updates']==1 and n['invalidation']['beforeStable']==n['invalidation']['afterStable']
assert len(m['cases'])==9 and min(c['minimumVisitorGap'] for c in m['cases'])>=.87
assert len(v['captures'])==3
assert p['status'].startswith('MEASURED') and len(p['runs'])==2
for file,value in p['hashes'].items():assert sha(R/file)==value,file
for run in p['runs']:
 assert sha(R/run['entry'])==run['entrySHA256'] and not run['errors'] and run['simulationSeconds']>=60
assert p['runs'][1]['entrySHA256']==b['entrySHA256']
assert p['runs'][1]['end']['shadow']['updates']==1
assert p['comparison']['maxPositionDifference']==p['comparison']['maxCameraDifference']==0
stock=D/'evidence/rim-shadow/stock';state=read(stock/'state-0.json');assert state['ready'] and state['active'];assert not list(stock.glob('*errors*'))
base='ceeef43fcebeebd8e3b0648c56aa84d33e2de032'
prior=[row.split(b'\t',1)[1].decode()for row in subprocess.check_output(['git','ls-tree','-rz',base],cwd=R).split(b'\0')if row and Path(row.split(b'\t',1)[1].decode()).suffix=='.html']
assert len(prior)==56
for file in prior:assert sha(R/file)==hashlib.sha256(subprocess.check_output(['git','show',base+':'+file],cwd=R)).hexdigest(),file
files={R/b[k]for k in ['entry','script','contract','master']}
files.update({D/'V02_RIM_SHADOWS.md',Path(__file__).resolve()})
for name in ['blender_rim_shadow_domain.py','build_rim_shadow_candidate.py','test_rim_shadows.cjs',
 'benchmark_rim_shadows.cjs','test_rim_shadow_movement.cjs','render_rim_shadows.py','review_rim_shadow_optics.py','inspect_facade_light_contributions.cjs']:
 files.add(R/'scripts/vertical-v02'/name)
files.update(D.glob('V02_Rim_Shadow_*.json'));files.add(D/'V02_Facade_Light_Contributions.json')
for name in ['rim-shadow','rim-shadow-movement','rim-shadow-benchmark','facade-light-contributions']:
 files.update(p for p in (D/'evidence'/name).rglob('*')if p.is_file() and p.suffix not in ['.blend','.blend1'])
files.update(D/'evidence'/name for name in ['rim-shadow-source.log','rim-shadow-benchmark.log','rim-shadow-movement.log'])
index=D/'V02_Rim_Shadow_Evidence.json';files.discard(index)
assert all(p.is_file() and p.stat().st_size<100_000_000 for p in files)
result={'status':'PASS bounded source/cache/input checks; timing MEASURED; full V02 remains INCOMPLETE',
 'entry':b['entry'],'entrySHA256':b['entrySHA256'],'masterSHA256':b['masterSHA256'],'contractSHA256':b['contractSHA256'],
 'preservationBaseCommit':base,'preservedPriorHTML':len(prior),'opticalInterpretation':'Warm architectural occlusion is improved; manual source/native comparison is not full visual fidelity.',
 'visualReferenceGate':'FAIL: broad slabs, repeated tower grids, sparse interiors, placeholder civilian art',
 'releaseLimits':['Nine current room routes and controlled cache fixtures only; no broad inherited encounter recertification for this lighting child',
  'Controlled mutation/restoration is not legal-input destruction acceptance',
  'One lower-loop60s pair is not combined combat/replay/drone/destruction stress or sustained thermal acceptance',
  'Candidate348.9ms maximum frame interval /324.5ms render-submission hitch still requires investigation',
  'Physical controller/touchscreen not tested; viewport layouts and simulated standard controller only',
  'Static rim map excludes moving actors/train/aircraft; original sun dynamic shadows remain',
  'Approximate four-tap depth-map occlusion is not Cycles angular softness or tinted-glass transmission parity',
  'Archived failures are evidence, not standalone usable rollback distributions'],
 'benchmarkComparison':p['comparison'],'artifacts':[{'file':str(p.relative_to(R)),'sha256':sha(p),'bytes':p.stat().st_size}for p in sorted(files)]}
index.write_text(json.dumps(result,indent=2)+'\n');print(result['status'],len(files),'artifacts;',len(prior),'older HTML unchanged')
