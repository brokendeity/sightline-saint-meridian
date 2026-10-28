"""Sequential hash-locked current upper-mount/camera validation.

This bounded candidate does not establish final reference-quality architecture,
full mission/destruction/failure coverage, combined stress or physical devices.
"""
from pathlib import Path
import hashlib,json,os,re,subprocess,sys,time
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';E=D/'evidence/upper-anchor-checks';E.mkdir(exist_ok=True);b=json.loads((D/'V02_Upper_Anchor_Build.json').read_text());node='/opt/homebrew/bin/node';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
body={'V02_BODY_ENTRY':b['entry'],'V02_BODY_VARIANT':'upper'};native={'V02_GAMEPLAY_BUILD':'V02_Upper_Anchor_Build.json','V02_STAGE':'hud'}
def job(n,f,e={}):return(n,[node,'scripts/vertical-v02/'+f],e)
jobs=[job('native','test_upper_anchor_mounts.cjs'),job('clearance','validate_upper_anchor_clearance.cjs'),job('settled','probe_body_framing.cjs',body),job('ownership','probe_body_camera_ownership.cjs',body),job('touch-look','test_body_touch_look.cjs',{'V02_BODY_ENTRY':b['entry'],'V02_BODY_RUN':'upper-anchor-touch-look','V02_BODY_TOUCH_REPORT':'V02_Upper_Anchor_Touch_Look.json'}),job('movement','test_body_movement.cjs',body),job('movement-touch','test_body_movement.cjs',{**body,'V02_BODY_DEVICE':'touch'}),job('stairs','test_upper_anchor_stairs.cjs'),job('orbits','test_body_orbits.cjs',{**native,'V02_EVIDENCE_RUN':'upper-anchor-orbits'}),job('hud','test_hud_candidate.cjs',{'V02_HUD_ENTRY':b['entry'],'V02_HUD_RUN':'upper-anchor-hud','V02_HUD_REPORT':'V02_Upper_Anchor_HUD.json'}),job('notices','test_body_notices.cjs',{'V02_BODY_ENTRY':b['entry'],'V02_BODY_RUN':'upper-anchor-notices','V02_NOTICE_REPORT':'V02_Upper_Anchor_Notices.json'}),('stock',[node,'development/vertical-city-v02/tools/run-skill-client.cjs','--url','http://127.0.0.1:8766/'+b['entry']+'?capture=backspool','--click-selector','#v02Start','--actions-json',json.dumps({'steps':[{'buttons':['a'],'frames':45},{'buttons':[],'frames':12}]}),'--iterations','1','--pause-ms','250','--screenshot-dir','development/vertical-city-v02/evidence/upper-anchor-stock'],{}),job('replay','test_body_replay.cjs',{**native,'V02_EVIDENCE_RUN':'upper-anchor-replay'}),job('controller-vector','test_native_camera_vector.cjs'),('station-routes',['python3','scripts/vertical-v02/run_current_station_routes.py'],{'V02_ROUTE_BUILD_REPORT':'V02_Upper_Anchor_Build.json','V02_ROUTE_SUITE':'upper-anchor-station-routes','V02_ROUTE_REPORT':'V02_Upper_Anchor_Station_Routes.json'}),job('short-catch','test_mastery_route.cjs',{'FULL_ROUTE':'1','SHORT_CATCH':'1','V02_ROUTE_BUILD':'V02_Upper_Anchor_Build.json','V02_ROUTE_RUN':'short-catch','V02_ROUTE_SUITE':'upper-anchor-recovery'}),('retained-gameplay',['python3','scripts/vertical-v02/run_current_gameplay_regressions.py'],{'V02_GAMEPLAY_BUILD':'V02_Upper_Anchor_Build.json','V02_GAMEPLAY_SUITE':'upper-anchor-gameplay'}),job('benchmark','benchmark_upper_anchor_mounts.cjs')]
files={b['entry'],b['manifest'],'development/vertical-city-v02/V02_Upper_Anchor_Build.json','scripts/vertical-v02/run_upper_anchor_checks.py'}
files.update(x.split('?')[0]for x in re.findall(r'<(?:script|link)[^>]+(?:src|href)="([^"]+)"',(R/b['entry']).read_text())if not x.startswith(('http:','https:','data:','#')))
for _,cmd,_ in jobs:
 if len(cmd)>1 and(R/cmd[1]).is_file():files.add(cmd[1])
files.update('scripts/vertical-v02/'+x for x in ['market_test_helpers.cjs','evidence_io.cjs','test_momentum_route.cjs','test_mastery_route.cjs','test_public_station.cjs','station_route_environment.cjs','route_camera_probe.cjs','test_service_encounter.cjs','test_service_lifecycle.cjs','test_service_replay.cjs','test_market_rescue.cjs','test_market_lifecycle.cjs','test_pursuit.cjs','test_discovery.cjs','test_discovery_lifecycle.cjs'])
manifest=json.loads((R/b['manifest']).read_text());files.update(c['url']for c in manifest['chunks']);hashes=lambda:{f:sha(R/f)for f in sorted(files)};report={'status':'RUNNING','entry':b['entry'],'entrySHA256':sha(R/b['entry']),'manifestSHA256':sha(R/b['manifest']),'scope':__doc__.strip(),'hashes':hashes(),'jobs':[]};out=D/'V02_Upper_Anchor_Checks.json';start=0
if len(sys.argv)==3 and sys.argv[1]=='--from':
 start=next(i for i,j in enumerate(jobs)if j[0]==sys.argv[2]);prior=json.loads(out.read_text())
 changed={f for f in set(prior['hashes'])|set(report['hashes']) if prior['hashes'].get(f)!=report['hashes'].get(f)}
 if changed:
  allowed={'scripts/vertical-v02/test_momentum_route.cjs','scripts/vertical-v02/test_mastery_route.cjs','scripts/vertical-v02/test_native_camera_vector.cjs','scripts/vertical-v02/run_upper_anchor_checks.py'}
  assert sys.argv[2]=='controller-vector' and start==13 and changed<=allowed,('Cannot reuse evidence after changed runtime or prefix-test dependency',changed)
  # These two route drivers are used only by jobs at/after station-routes.
  # Every prefix job, its helpers, runtime, source/manifest and assets stay locked.
  for name,cmd,env in jobs[:start]:
   source=(R/cmd[1]).read_text()
   assert 'test_mastery_route.cjs'not in source and 'test_momentum_route.cjs'not in source
  report['reusedPrefixEvidence']={'priorReportSHA256':sha(out),'changedPaths':sorted(changed),'reason':'Only downstream simulated route-input drivers and suite/new controller test changed; 13 independent prefix jobs and all runtime/asset inputs are byte-identical.'}
 report['jobs']=prior['jobs'][:start]
 assert len(report['jobs'])==start and all(x['returncode']==0 for x in report['jobs'])
 for (name,cmd,env),old in zip(jobs[:start],report['jobs']):
  assert old['name']==name and old['command']==cmd and old['environment']==env,'Prefix command/configuration mismatch'
 report['reusedPrefixEvidenceSHA256']=sha(out)
for name,cmd,env in jobs[start:]:
 report['active']=name;out.write_text(json.dumps(report,indent=2)+'\n');print('START',name,flush=True);t=time.monotonic();log=E/(name+'.log')
 with log.open('w')as f:run=subprocess.run(cmd,cwd=R,env={**os.environ,**env},stdout=f,stderr=subprocess.STDOUT)
 assert hashes()==report['hashes'],'Runtime/tests changed during validation'
 report['jobs'].append({'name':name,'command':cmd,'environment':env,'returncode':run.returncode,'wallSeconds':time.monotonic()-t,'log':str(log.relative_to(D))});print('DONE',name,run.returncode,flush=True)
 if run.returncode:
  report['status']='FAIL';out.write_text(json.dumps(report,indent=2)+'\n');print(log.read_text()[-5000:],flush=True);sys.exit(run.returncode)
report.pop('active',None);report['status']='PASS bounded current source/native/camera/route/input/replay/recovery/gameplay checks; fixed lower-loop performance measured; full V02 release incomplete';out.write_text(json.dumps(report,indent=2)+'\n');print(report['status'],flush=True)
