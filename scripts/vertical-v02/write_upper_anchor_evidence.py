"""Bind a bounded source/geometry/input checkpoint without passing full V02."""
from pathlib import Path
import hashlib,json,subprocess
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();read=lambda f:json.loads((D/f).read_text())
b=read('V02_Upper_Anchor_Build.json');checks=read('V02_Upper_Anchor_Checks.json')
assert checks['status'].startswith('PASS')and len(checks['jobs'])==18
assert all(j['returncode']==0 for j in checks['jobs'])
assert all(sha(R/f)==v for f,v in checks['hashes'].items())
for key in ['entry','manifest','master','bodyScript','bodyStyles','noticeScript']:assert sha(R/b[key])==b[key+'SHA256']
names=['V02_Upper_Anchor_Master_Validation.json','V02_Upper_Anchor_Package.json','V02_Upper_Anchor_GLTF_Validation.json','V02_Upper_Anchor_Native.json','V02_Upper_Anchor_Clearance.json','V02_Upper_Anchor_Controller_Vector.json','V02_Upper_Anchor_Station_Routes.json','V02_Upper_Anchor_Graph_Validation.json','V02_Upper_Anchor_City_Loops.json','V02_Upper_Anchor_Blender.json','V02_Upper_Anchor_Reference_Surfaces.json','V02_Body_Framing_upper.json','V02_Body_Camera_Ownership_upper.json','V02_Body_Movement_upper.json','V02_Body_Movement_upper_touch.json','V02_Upper_Anchor_Stairs.json','V02_Upper_Anchor_HUD.json','V02_Upper_Anchor_Notices.json','V02_Upper_Anchor_Touch_Look.json','evidence/upper-anchor-orbits/V02_Body_Camera_Orbits.json','evidence/upper-anchor-replay/V02_Body_Replay_Escape.json','evidence/upper-anchor-gameplay/run.json']
for name in names:
 r=read(name)
 if name=='V02_Upper_Anchor_GLTF_Validation.json':assert r['issues']['numErrors']==r['issues']['numWarnings']==0
 else:assert r['status'].startswith('PASS'),(name,r['status'])
 assert not r.get('errors'),name
 if 'entrySHA256'in r:assert r['entrySHA256']==b['entrySHA256'],name
 if 'manifestSHA256'in r:assert r['manifestSHA256']==b['manifestSHA256'],name
 for f,h in r.get('hashes',{}).items():assert sha(R/f)==h,(name,f)
routes=read('V02_Upper_Anchor_Station_Routes.json');assert len(routes['jobs'])==6
for j in routes['jobs']:
 assert sha(D/j['report'])==j['reportSHA256']and sha(D/j['trace'])==j['traceSHA256']
 if j['cameraVisibility']is not None:assert j['cameraVisibility']['problemSamples']==0
 else:assert j['name'].startswith('public-'),'Advanced route camera evidence missing'
loops=read('V02_Upper_Anchor_City_Loops.json');assert len(loops['results'])==3
assert all(x['cameraInsideFrames']==0 for x in loops['results'])
perf=read('V02_Upper_Anchor_Benchmark.json');assert perf['status'].startswith('MEASURED')and len(perf['runs'])==2
assert all(sha(R/f)==h for f,h in perf['hashes'].items())
assert all(r['simulationSeconds']>=60 and not r['errors']and r['entrySHA256']==sha(R/r['entry'])for r in perf['runs'])
assert perf['comparison']['maxPositionDifference']==perf['comparison']['maxCameraDifference']==0
stock=D/'evidence/upper-anchor-stock';st=json.loads((stock/'state-0.json').read_text());assert st['ready']and st['active']and abs(st['pos'][0]-55)>.1;assert not list(stock.glob('*errors*'))
preserved={};baseline='87c493105f3fac4dfb27524dd56e04d80c233317'
priorEntries=[f for f in subprocess.check_output(['git','ls-tree','-r','--name-only',baseline],cwd=R,text=True).splitlines()if Path(f).suffix.lower()=='.html']
assert len(priorEntries)>=48,'Prior game entries were not enumerated'
for f in priorEntries:
 h=hashlib.sha256(subprocess.check_output(['git','show',baseline+':'+f],cwd=R)).hexdigest();assert sha(R/f)==h,f;preserved[f]=h
files={R/b['entry'],R/b['source'],R/b['master'],R/b['bodyScript'],R/b['bodyStyles'],R/b['noticeScript'],D/'V02_UPPER_ANCHORS.md',D/'V02_REFERENCE_SURFACE_STUDY.md',D/'V02_BODY_FRAMING.md',R/'README.md',D/'tools/run-skill-client.cjs'}
files.update(D.glob('V02_Upper_Anchor*.json'));files.update(D.glob('V02_Body*.json'))
files.update((R/'scripts/vertical-v02').glob('*upper_anchor*'));files.update((R/'scripts/vertical-v02').glob('*body*'))
files.update(R/f for f in ['scripts/vertical-v02/test_native_camera_vector.cjs','scripts/vertical-v02/test_momentum_route.cjs','scripts/vertical-v02/test_mastery_route.cjs','scripts/vertical-v02/station_route_environment.cjs','scripts/vertical-v02/market_test_helpers.cjs','scripts/vertical-v02/test_hud_candidate.cjs','scripts/vertical-v02/audit_current_reference_surfaces.cjs','scripts/game_v02_body_framing.js'])
files.update(p for p in (R/'assets/city/vertical-v02/upper-anchor-mounts').rglob('*')if p.is_file())
for root in (D/'evidence').iterdir():
 if root.is_dir()and root.name.startswith(('upper-anchor','body-framing','body-camera-ownership','body-touch-look')):
  # Rejected source binaries stay locally preserved. Their reports remain visible.
  files.update(p for p in root.rglob('*')if p.is_file()and p.suffix not in ['.blend','.blend1'])
out=D/'V02_Upper_Anchor_Evidence.json';files.discard(out)
report={'status':'PASS bounded upper-receiver/source/camera/input evidence; full V02 incomplete','entry':b['entry'],'entrySHA256':b['entrySHA256'],'manifestSHA256':b['manifestSHA256'],'masterSHA256':b['masterSHA256'],'checksReportSHA256':sha(D/'V02_Upper_Anchor_Checks.json'),'preservationBaselineCommit':baseline,'preservedPriorGameEntries':preserved,'reports':[{'file':f,'sha256':sha(D/f)}for f in names],'stationRoutes':[{'name':j['name'],'inputSeconds':j['seconds'],'distance':j['distance'],'initialBank':j['initialBank']}for j in routes['jobs']],'performance':perf['comparison'],'scopeLimits':['Only listed normal-input cases, fixtures and source bounds certified; arbitrary routes, camera poses and human robustness remain separate','Public station reports do not include the advanced-route10Hz head/hips probe; the separate continuous public stair/body tour and current loops provide their stated camera coverage','Touch-layout keyboard movement and CDP look drags are distinct; no physical controller or touchscreen acceptance','Source optics match does not establish source/native shading equivalence or approved-reference quality','Lower-loop60second benchmark is not combined combat/replay/destruction release stress','Historical failed experiments retain their original identities and status'],'fullVisualGate':'FAIL/incomplete: facades, occupied terraces, station detail, lighting/noise/parallax and original A/B reference match','releaseGatesRemaining':['Final broad mission/destruction/failure acceptance','Combined real active combat/replay/drone/destruction sustained CPU/GPU workload','Approved-reference architecture/material/lighting acceptance','Physical controller/touchscreen and thermal stability'],'artifacts':[{'file':str(p.relative_to(R)),'sha256':sha(p),'bytes':p.stat().st_size}for p in sorted(files)]}
out.write_text(json.dumps(report,indent=2)+'\n');print(report['status'],len(files),'artifacts',len(preserved),'unchanged prior HTML builds')
