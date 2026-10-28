"""Sequential current-source cassette candidate checks; full V02 stays open."""
from pathlib import Path
import json,hashlib,os,re,subprocess,time,sys
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';E=D/'evidence/facade-cassette-checks';E.mkdir(exist_ok=True);sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();read=lambda p:json.loads(p.read_text());b=read(D/'V02_Facade_Cassettes_Build.json');node='/opt/homebrew/bin/node';guard={'NODE_OPTIONS':'--require ./scripts/vertical-v02/cassette_test_readiness.cjs'}
jobs=[('loops',[node,'scripts/vertical-v02/test_facade_cassette_city_loops.cjs'],{}),('room-movement',[node,'scripts/vertical-v02/test_facade_cassette_body_movement.cjs'],{'V02_BODY_ENTRY':b['entry'],'V02_BODY_VARIANT':'cassettes'}),('room-movement-touch-layout',[node,'scripts/vertical-v02/test_facade_cassette_body_movement.cjs'],{'V02_BODY_ENTRY':b['entry'],'V02_BODY_VARIANT':'cassettes','V02_BODY_DEVICE':'touch'}),('stock',[node,'development/vertical-city-v02/tools/run-cassette-skill-client.cjs','--url','http://127.0.0.1:8766/'+b['entry']+'?capture=backspool','--click-selector','#v02Start','--actions-json',json.dumps({'steps':[{'buttons':['a'],'frames':45},{'buttons':[],'frames':12}]}),'--iterations','1','--pause-ms','250','--screenshot-dir','development/vertical-city-v02/evidence/facade-cassettes/stock'],{}),('station-routes',['python3','scripts/vertical-v02/run_current_station_routes.py'],{**guard,'V02_ROUTE_BUILD_REPORT':'V02_Facade_Cassettes_Build.json','V02_ROUTE_SUITE':'facade-cassette-station-routes','V02_ROUTE_REPORT':'V02_Facade_Cassettes_Station_Routes.json'}),('short-catch',[node,'scripts/vertical-v02/test_mastery_route.cjs'],{**guard,'FULL_ROUTE':'1','SHORT_CATCH':'1','V02_ROUTE_BUILD':'V02_Facade_Cassettes_Build.json','V02_ROUTE_RUN':'short-catch','V02_ROUTE_SUITE':'facade-cassette-recovery'}),('retained-gameplay',['python3','scripts/vertical-v02/run_current_gameplay_regressions.py'],{**guard,'V02_GAMEPLAY_BUILD':'V02_Facade_Cassettes_Build.json','V02_GAMEPLAY_SUITE':'facade-cassette-gameplay'}),('benchmark',[node,'scripts/vertical-v02/benchmark_facade_cassettes.cjs'],{})]
files={b['entry'],b['manifest'],b['master'],b['cassetteManifest'],b['cassetteRuntime'],'development/vertical-city-v02/V02_Facade_Cassettes_Build.json','scripts/vertical-v02/run_facade_cassette_checks.py'}
files.update(x.split('?')[0]for x in re.findall(r'<(?:script|link)[^>]+(?:src|href)="([^"]+)"',(R/b['entry']).read_text())if not x.startswith(('http:','https:','data:','#')))
for _,cmd,_ in jobs:files.add(cmd[1])
files.update('scripts/vertical-v02/'+f for f in ['cassette_test_readiness.cjs','station_route_environment.cjs','market_test_helpers.cjs','evidence_io.cjs','test_momentum_route.cjs','test_mastery_route.cjs','test_public_station.cjs','route_camera_probe.cjs','test_service_encounter.cjs','test_service_lifecycle.cjs','test_service_replay.cjs','test_market_rescue.cjs','test_market_lifecycle.cjs','test_pursuit.cjs','test_discovery.cjs','test_discovery_lifecycle.cjs'])
m=read(R/b['manifest']);files.update(c['url']for c in m['chunks']);p=read(D/'V02_Facade_Cassettes_Package.json')
for model in p['models']:
 for key in ['rawURL','shippingURL','compressedURL']:files.add(model[key])
gates=['V02_Facade_Cassettes_Master_Validation.json','V02_Facade_Cassettes_Export_Validation.json','V02_Facade_Cassettes_Native.json','V02_Facade_Cassettes_Blender.json']
for name in gates:
 r=read(D/name);assert r['status'].startswith('PASS'),name
 if 'masterSHA256'in r:assert r['masterSHA256']==b['masterSHA256'],name
 files.add('development/vertical-city-v02/'+name)
fingerprint=lambda:{f:sha(R/f)for f in sorted(files)};report={'status':'RUNNING','entry':b['entry'],'entrySHA256':b['entrySHA256'],'manifestSHA256':b['manifestSHA256'],'hashes':fingerprint(),'sourceGates':gates,'jobs':[],'scope':'Current cassette asset readiness, normal-input loop/room/route/recovery/encounter checks and one matched lower-loop benchmark. Full approved architecture, mission/destruction/failure release acceptance and combined stress remain separate.'};out=D/'V02_Facade_Cassettes_Checks.json';start=0
if len(sys.argv)==3 and sys.argv[1]=='--from':
 start=next(i for i,j in enumerate(jobs)if j[0]==sys.argv[2]);prior=read(out);assert prior['hashes']==report['hashes'],'Changed source/runtime/test inputs';report['jobs']=prior['jobs'][:start];assert len(report['jobs'])==start and all(j['returncode']==0 for j in report['jobs'])
for name,cmd,env in jobs[start:]:
 report['active']=name;out.write_text(json.dumps(report,indent=2)+'\n');print('START',name,flush=True);log=E/(name+'.log');t=time.monotonic()
 with log.open('w')as f:process=subprocess.run(cmd,cwd=R,env={**os.environ,**env},stdout=f,stderr=subprocess.STDOUT)
 assert fingerprint()==report['hashes'],'Candidate/test bytes changed during checks'
 report['jobs'].append({'name':name,'command':cmd,'environment':env,'returncode':process.returncode,'wallSeconds':time.monotonic()-t,'log':str(log.relative_to(D))});print('DONE',name,process.returncode,flush=True)
 if process.returncode:
  report['status']='FAIL';out.write_text(json.dumps(report,indent=2)+'\n');print(log.read_text()[-5000:],flush=True);sys.exit(process.returncode)
report.pop('active',None);report['status']='PASS bounded current cassette/source/input/gameplay/performance checks; full V02 remains incomplete';out.write_text(json.dumps(report,indent=2)+'\n');print(report['status'],flush=True)
