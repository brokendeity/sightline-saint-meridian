"""Hash-locked body-composition candidate checks; not complete V02 release.

Jobs are sequential so the native-RAF benchmark has no sibling automated GPU
workloads. Resume only with identical source hashes and prior successful jobs.
"""
from pathlib import Path
import hashlib,json,os,re,subprocess,sys,time
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';E=D/'evidence/body-framing';E.mkdir(exist_ok=True)
b=json.loads((D/'V02_Body_Framing_Build.json').read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
node='/opt/homebrew/bin/node'
body={'V02_GAMEPLAY_BUILD':'V02_Body_Framing_Build.json','V02_STAGE':'hud'}
job=lambda name,file,env={}: (name,[node,'scripts/vertical-v02/'+file],env)
jobs=[job('settled-baseline','probe_body_framing.cjs',{'V02_BODY_VARIANT':'baseline'}),job('settled','probe_body_framing.cjs',{'V02_BODY_ENTRY':b['entry']}),job('ownership-baseline','probe_body_camera_ownership.cjs',{'V02_BODY_VARIANT':'baseline'}),job('ownership','probe_body_camera_ownership.cjs'),job('touch-look','test_body_touch_look.cjs'),job('movement','test_body_movement.cjs'),job('movement-touch','test_body_movement.cjs',{'V02_BODY_DEVICE':'touch'}),job('stairs','test_body_stair_tour.cjs'),job('orbits','test_body_orbits.cjs',{**body,'V02_EVIDENCE_RUN':'body-framing-orbits'}),job('hud','test_hud_candidate.cjs',{'V02_HUD_ENTRY':b['entry'],'V02_HUD_RUN':'body-framing-hud','V02_HUD_REPORT':'V02_Body_Framing_HUD.json'}),job('notices','test_body_notices.cjs'),('stock',[node,'development/vertical-city-v02/tools/run-skill-client.cjs','--url','http://127.0.0.1:8766/'+b['entry']+'?capture=backspool','--click-selector','#v02Start','--actions-json',json.dumps({'steps':[{'buttons':['a'],'frames':45},{'buttons':[],'frames':12}]}),'--iterations','1','--pause-ms','250','--screenshot-dir','development/vertical-city-v02/evidence/body-framing-stock'],{}),job('replay','test_body_replay.cjs',{**body,'V02_EVIDENCE_RUN':'body-framing-replay-hud-final'}),('station-routes',['python3','scripts/vertical-v02/run_current_station_routes.py'],{'V02_ROUTE_BUILD_REPORT':'V02_Body_Framing_Build.json','V02_ROUTE_SUITE':'body-framing-station-routes','V02_ROUTE_REPORT':'V02_Body_Station_Routes.json'}),job('benchmark','benchmark_body_framing.cjs')]
files={b['entry'],b['manifest'],'scripts/vertical-v02/run_body_framing_checks.py','development/vertical-city-v02/V02_Body_Framing_Build.json'}
files.update(x.split('?')[0]for x in re.findall(r'<(?:script|link)[^>]+(?:src|href)="([^"]+)"',(R/b['entry']).read_text())if not x.startswith(('http:','https:','data:','#')))
for _,cmd,_ in jobs:
 if len(cmd)>1 and (R/cmd[1]).is_file():files.add(cmd[1])
files.update('scripts/vertical-v02/'+x for x in ['test_momentum_route.cjs','test_mastery_route.cjs','test_public_station.cjs','station_route_environment.cjs','route_camera_probe.cjs','market_test_helpers.cjs','evidence_io.cjs'])
hashes=lambda:{f:sha(R/f)for f in sorted(files)}
report={'status':'RUNNING','entry':b['entry'],'entrySHA256':sha(R/b['entry']),'scope':__doc__.strip(),'hashes':hashes(),'jobs':[]};out=D/'V02_Body_Framing_Checks.json'
start=0
if len(sys.argv)==3 and sys.argv[1]=='--from':
 start=next(i for i,j in enumerate(jobs)if j[0]==sys.argv[2]);prior=json.loads(out.read_text());assert prior['hashes']==report['hashes'],'Cannot resume altered runtime/tests';report['jobs']=prior['jobs'][:start];assert len(report['jobs'])==start and all(x['returncode']==0 for x in report['jobs'])
for name,cmd,extra in jobs[start:]:
 report['active']=name;out.write_text(json.dumps(report,indent=2)+'\n');print('START',name,flush=True);t=time.monotonic();log=E/(name+'-accepted.log')
 with log.open('w')as f:p=subprocess.run(cmd,cwd=R,env={**os.environ,'V02_BODY_VARIANT':'candidate',**extra},stdout=f,stderr=subprocess.STDOUT)
 assert report['hashes']==hashes(),'Runtime/tests changed during acceptance'
 report['jobs'].append({'name':name,'command':cmd,'environment':extra,'returncode':p.returncode,'wallSeconds':time.monotonic()-t,'log':str(log.relative_to(D))});print('DONE',name,p.returncode,flush=True)
 if p.returncode:
  report['status']='FAIL';out.write_text(json.dumps(report,indent=2)+'\n');print(log.read_text()[-5000:],flush=True);sys.exit(p.returncode)
report.pop('active',None);report['status']='PASS bounded body/movement/stair/input/route checks; benchmark measured separately; complete V02 release pending';out.write_text(json.dumps(report,indent=2)+'\n');print(report['status'],flush=True)
