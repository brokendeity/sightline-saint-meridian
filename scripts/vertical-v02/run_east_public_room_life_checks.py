"""Current room/life candidate input, gameplay and performance checks, sequential."""
from pathlib import Path
import hashlib
import json
import os
import re
import subprocess
import sys
import time

R=Path(__file__).resolve().parents[2]
D=R/'development/vertical-city-v02'
E=D/'evidence/east-public-room-life-checks'
E.mkdir(exist_ok=True)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
read=lambda p:json.loads(p.read_text())
b=read(D/'V02_East_Public_Room_Life_Build.json')
node='/opt/homebrew/bin/node'
guard={'NODE_OPTIONS':'--require ./scripts/vertical-v02/east_public_test_readiness.cjs'}
jobs=[
 ('room-movement',[node,'scripts/vertical-v02/test_east_public_room_life_movement.cjs'],{}),
 ('loops',[node,'scripts/vertical-v02/test_east_public_room_life_city_loops.cjs'],{}),
 ('stock',[node,'development/vertical-city-v02/tools/run-east-public-skill-client.cjs',
   '--url','http://127.0.0.1:8766/'+b['entry']+'?capture=backspool','--click-selector','#v02Start',
   '--actions-json',json.dumps({'steps':[{'buttons':['a'],'frames':45},{'buttons':[],'frames':12}]}),
   '--iterations','1','--pause-ms','250','--screenshot-dir','development/vertical-city-v02/evidence/east-public-room-life/stock'],{}),
 ('station-routes',['python3','scripts/vertical-v02/run_current_station_routes.py'],
  {**guard,'V02_ROUTE_BUILD_REPORT':'V02_East_Public_Room_Life_Build.json',
   'V02_ROUTE_SUITE':'east-public-room-life-station-routes','V02_ROUTE_REPORT':'V02_East_Public_Room_Life_Station_Routes.json'}),
 ('short-catch',[node,'scripts/vertical-v02/test_mastery_route.cjs'],
  {**guard,'FULL_ROUTE':'1','SHORT_CATCH':'1','V02_ROUTE_BUILD':'V02_East_Public_Room_Life_Build.json',
   'V02_ROUTE_RUN':'short-catch','V02_ROUTE_SUITE':'east-public-room-life-recovery'}),
 ('retained-gameplay',['python3','scripts/vertical-v02/run_current_gameplay_regressions.py'],
  {**guard,'V02_GAMEPLAY_BUILD':'V02_East_Public_Room_Life_Build.json','V02_GAMEPLAY_SUITE':'east-public-room-life-gameplay'}),
 ('benchmark',[node,'scripts/vertical-v02/benchmark_east_public_room_life.cjs'],{})]
files={b['entry'],b['manifest'],b['master'],b['eastLightingScript'],b['eastLightingContract'],
       b['ambientRoutes'],b['worldLifeScript'],b['cassetteManifest'],b['cassetteRuntime'],
       'scripts/vertical-v02/run_east_public_room_life_checks.py',
       'scripts/vertical-v02/east_public_test_readiness.cjs',
       'development/vertical-city-v02/V02_East_Public_Room_Life_Build.json'}
files.update(x.split('?')[0] for x in re.findall(r'<(?:script|link)[^>]+(?:src|href)="([^"]+)"',(R/b['entry']).read_text())
             if not x.startswith(('http:','https:','data:','#')))
files.update(command[1] for _,command,_ in jobs)
files.update(chunk['url'] for chunk in read(R/b['manifest'])['chunks'])
lighting=read(R/b['eastLightingContract'])
for room in lighting['rooms']:
    files.update(room[key]['url'] for key in ['atlas','reflection'])
files.update('scripts/vertical-v02/'+name for name in [
    'station_route_environment.cjs','market_test_helpers.cjs','evidence_io.cjs','route_camera_probe.cjs',
    'test_momentum_route.cjs','test_mastery_route.cjs','test_public_station.cjs',
    'test_service_encounter.cjs','test_service_lifecycle.cjs','test_service_replay.cjs',
    'test_market_rescue.cjs','test_market_lifecycle.cjs','test_pursuit.cjs','test_discovery.cjs','test_discovery_lifecycle.cjs'])
for name in ['V02_East_Public_Emissive_Master_Validation.json','V02_East_Public_Emissive_Package.json',
             'V02_East_Public_Emissive_Native.json','V02_East_Public_Emissive_Blender.json',
             'V02_East_Public_Room_Admission_Validation.json','V02_East_Public_Room_Life_Native.json',
             'V02_East_Public_Surface_Normals.json']:
    gate=read(D/name)
    assert gate['status'].startswith('PASS'),name
    if 'masterSHA256' in gate:
        assert gate['masterSHA256']==b['masterSHA256'],name
    if name in ['V02_East_Public_Room_Life_Native.json','V02_East_Public_Surface_Normals.json']:
        assert gate['entrySHA256']==b['entrySHA256'],name
    files.add('development/vertical-city-v02/'+name)
fingerprint=lambda:{file:sha(R/file) for file in sorted(files)}
report={'status':'RUNNING','entry':b['entry'],'entrySHA256':b['entrySHA256'],
    'manifestSHA256':b['manifestSHA256'],'hashes':fingerprint(),'jobs':[],
    'scope':'Bounded current room/life, public loop, station route, recovery,12encounter/replay/discovery and matched lower-loop performance checks. Full visual and combined mission/destruction/failure release acceptance remain open.'}
out=D/'V02_East_Public_Room_Life_Checks.json'
start=0
if len(sys.argv)==3 and sys.argv[1]=='--from':
    start=next(i for i,job in enumerate(jobs) if job[0]==sys.argv[2])
    prior=read(out)
    assert prior['hashes']==report['hashes'],'Changed candidate/test inputs'
    report['jobs']=prior['jobs'][:start]
    assert len(report['jobs'])==start and all(job['returncode']==0 for job in report['jobs'])
for name,command,env in jobs[start:]:
    report['active']=name
    out.write_text(json.dumps(report,indent=2)+'\n')
    print('START',name,flush=True)
    log=E/(name+'.log')
    begin=time.monotonic()
    with log.open('w') as stream:
        process=subprocess.run(command,cwd=R,env={**os.environ,**env},stdout=stream,stderr=subprocess.STDOUT)
    assert fingerprint()==report['hashes'],'Candidate/test bytes changed during acceptance'
    report['jobs'].append({'name':name,'command':command,'environment':env,'returncode':process.returncode,
        'wallSeconds':time.monotonic()-begin,'log':str(log.relative_to(D))})
    print('DONE',name,process.returncode,flush=True)
    if process.returncode:
        report['status']='FAIL'
        out.write_text(json.dumps(report,indent=2)+'\n')
        print(log.read_text()[-5000:],flush=True)
        sys.exit(process.returncode)
report.pop('active',None)
report['status']='PASS bounded room/life/source/input/gameplay/performance checks; full V02 remains incomplete'
out.write_text(json.dumps(report,indent=2)+'\n')
print(report['status'],flush=True)
