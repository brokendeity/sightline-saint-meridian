"""Bind current body-composition proof; never certify complete V02 from it."""
from pathlib import Path
import json,hashlib,subprocess
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();read=lambda f:json.loads((D/f).read_text())
b=read('V02_Body_Framing_Build.json');assert sha(R/b['entry'])==b['entrySHA256']
c=read('V02_Body_Framing_Checks.json');assert c['status'].startswith('PASS');assert all(sha(R/f)==v for f,v in c['hashes'].items());assert all(j['returncode']==0 for j in c['jobs'])
names=['V02_Body_Framing_candidate.json','V02_Body_Camera_Ownership_candidate.json','V02_Body_Movement_candidate.json','V02_Body_Movement_candidate_touch.json','V02_Body_Framing_Stairs.json','V02_Body_Framing_HUD.json','V02_Body_Notices.json','V02_Body_Station_Routes.json','evidence/body-framing-orbits/V02_Body_Camera_Orbits.json','evidence/body-framing-replay-hud-final/V02_Body_Replay_Escape.json']
reports={n:read(n)for n in names}
for n,r in reports.items():
 assert r['status'].startswith('PASS'),(n,r['status']);assert r.get('entrySHA256',r.get('hashes',{}).get(b['entry']))==b['entrySHA256'],(n,r.get('entrySHA256'));assert all(sha(R/f)==v for f,v in r.get('hashes',{}).items());assert not r.get('errors'),n
for r in read('V02_Body_Touch_Look.json')['runs']:
 assert r['entrySHA256']==sha(R/r['entry'])
base=read('V02_Body_Movement_baseline.json');current=reports['V02_Body_Movement_candidate.json'];positionDelta=cameraDelta=0
assert len(base['runs'])==len(current['runs'])==9
for old,new in zip(base['runs'],current['runs']):
 assert old['view']==new['view'] and old['floor']==new['floor'] and len(old['trace'])==len(new['trace'])
 for a,z in zip(old['trace'],new['trace']):
  positionDelta=max(positionDelta,max(abs(x-y)for x,y in zip(a['position'],z['position'])));cameraDelta=max(cameraDelta,max(abs(x-y)for x,y in zip(a['camera'],z['camera'])))
assert positionDelta==cameraDelta==0
for r in [current,reports['V02_Body_Movement_candidate_touch.json']]:assert all(x['outside']==x['underVitals']==0 for x in r['bootSamples'])
stairs=reports['V02_Body_Framing_Stairs.json'];assert stairs['traceFrames']>14000 and not stairs['fullBodyFailures'] and not stairs['cameraOpaqueInside'];assert sha(D/stairs['fullTrace'])==stairs['fullTraceSHA256']
replay=reports['evidence/body-framing-replay-hud-final/V02_Body_Replay_Escape.json'];assert all(x['verticesUnderVitals']==0 for x in replay['avatarHUDCoverage'])
perf=read('V02_Body_Framing_Benchmark.json');assert len(perf['runs'])==2 and all(r['simulationSeconds']>=60 and not r['errors']and r['entrySHA256']==sha(R/r['entry'])for r in perf['runs']);assert all(sha(R/f)==v for f,v in perf['hashes'].items());assert perf['comparison']['maxPositionDifference']==perf['comparison']['maxCameraDifference']==0
stockDir=D/'evidence/body-framing-stock';stock=json.loads((stockDir/'state-0.json').read_text());assert stock['ready']and stock['active']and abs(stock['pos'][0]-55)>.1;assert not list(stockDir.glob('*errors*'))
old={}
baseline='87c493105f3fac4dfb27524dd56e04d80c233317'
for f in subprocess.check_output(['git','ls-tree','-r','--name-only',baseline,'--','*.html'],cwd=R,text=True).splitlines():
 blob=subprocess.check_output(['git','show',baseline+':'+f],cwd=R);expected=hashlib.sha256(blob).hexdigest();assert sha(R/f)==expected,f;old[f]=expected
files={R/b['entry'],R/b['bodyScript'],R/b['bodyStyles'],R/b['noticeScript'],D/'V02_BODY_FRAMING.md',D/'tools/run-skill-client.cjs',R/'scripts/vertical-v02/test_hud_candidate.cjs',R/'scripts/vertical-v02/market_test_helpers.cjs',R/'scripts/vertical-v02/test_momentum_route.cjs',R/'scripts/vertical-v02/test_mastery_route.cjs'}
files.update(D.glob('V02_Body*.json'));files.update((R/'scripts/vertical-v02').glob('*body*'))
for root in (D/'evidence').iterdir():
 if root.is_dir()and root.name.startswith(('body-framing','body-camera-ownership','body-touch-look')):files.update(p for p in root.rglob('*')if p.is_file())
output=D/'V02_Body_Framing_Evidence.json';files.discard(output)
report={'status':'PASS bounded body-composition evidence; full V02 remains incomplete','entry':b['entry'],'entrySHA256':b['entrySHA256'],'manifestSHA256':b['manifestSHA256'],'sourceMasterUnchanged':{'file':b['master'],'sha256':sha(R/b['master'])},'native':{'roomMovementFrames':sum(r['frames']for r in current['runs']),'roomBodyFailures':sum(r['failures']for r in current['runs']),'originalRoomBodyFailures':sum(r['failures']for r in base['runs']),'identicalSampledActorPositions':positionDelta==0,'identicalSampledConstrainedCameraPositions':cameraDelta==0,'stairFrames':stairs['traceFrames'],'stairSimulationSeconds':stairs['simSeconds'],'hudGroups':len(reports['V02_Body_Framing_HUD.json']['results']),'nativeCameraOwnership':reports['V02_Body_Camera_Ownership_candidate.json']['summary'],'replayHUDVertexSamples':replay['avatarHUDCoverage']},'preservationBaselineCommit':baseline,'acceptedReports':[{'file':n,'sha256':sha(D/n)}for n in names],'preservedPriorGameEntries':old,'performance':perf['comparison'],'scopeLimits':['Labelled initial fixtures; actual normal input thereafter. Not arbitrary pose/camera certification.','Touch room movement uses keys under touch layouts; separate CDP finger drags exercise native look. No physical devices.','Historical and rejected experiments are retained with their own hashes/status; only the reports above certify this entry.','Aim driver now requires settled visible aim, not a lucky transient crossing; source timing and actual routes are measured anew.'],'fullVisualGate':'FAIL / incomplete: broad approved-reference architecture/material response, bake noise and reflection parallax remain open','releaseGatesRemaining':['Current combined mission, destruction and failure-path coverage','Combined active combat/replay/drone/destruction GPU-aware sustained workload','Full architectural reference review','Physical controller and touchscreen playtesting'],'artifacts':[{'file':str(p.relative_to(R)),'sha256':sha(p),'bytes':p.stat().st_size}for p in sorted(files)]};output.write_text(json.dumps(report,indent=2)+'\n');print('PASS',len(files),'artifacts;',len(old),'prior game HTML entries preserved; full goal incomplete')
