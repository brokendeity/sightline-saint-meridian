"""Frozen full-game crossing candidate; retained inputs and sequential GPU work."""
from pathlib import Path
import hashlib,json,os,re,subprocess,sys,time
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';E=D/'evidence/furnished-public-rooms-checks';E.mkdir(exist_ok=True)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();read=lambda p:json.loads(p.read_text())
b=read(D/'V02_Furnished_Public_Rooms_Build.json');node='/opt/homebrew/bin/node'
guard={'NODE_OPTIONS':'--require ./scripts/vertical-v02/slender_test_readiness.cjs'}
jobs=[('native-inspection',[node,'scripts/vertical-v02/inspect_furnished_public_rooms.cjs'],{}),
 ('stock-client',[node,'development/vertical-city-v02/tools/run-furnished-skill-client.cjs','--url','http://127.0.0.1:8766/'+b['entry']+'?capture=backspool','--click-selector','#v02Start','--actions-json','{"steps":[{"buttons":["up"],"frames":60},{"buttons":[],"frames":10}]}','--iterations','1','--pause-ms','300','--screenshot-dir','development/vertical-city-v02/evidence/furnished-public-rooms/stock'],{}),
 ('world-life',[node,'scripts/vertical-v02/test_furnished_room_life.cjs'],{}),
 ('room-movement',[node,'scripts/vertical-v02/test_furnished_public_rooms.cjs'],{}),
 ('city-loops',[node,'scripts/vertical-v02/test_east_public_room_life_city_loops.cjs'],{**guard,'V02_LOOP_BUILD':'V02_Furnished_Public_Rooms_Build.json','V02_LOOP_RUN':'furnished-public-rooms-loops','V02_LOOP_REPORT':'V02_Furnished_Public_Rooms_Loops.json'}),
 ('station-routes',['python3','scripts/vertical-v02/run_current_station_routes.py'],{**guard,'V02_ROUTE_BUILD_REPORT':'V02_Furnished_Public_Rooms_Build.json','V02_ROUTE_SUITE':'furnished-public-rooms-station-routes','V02_ROUTE_REPORT':'V02_Furnished_Public_Rooms_Station_Routes.json'}),
 ('short-catch',[node,'scripts/vertical-v02/test_mastery_route.cjs'],{**guard,'FULL_ROUTE':'1','SHORT_CATCH':'1','V02_ROUTE_BUILD':'V02_Furnished_Public_Rooms_Build.json','V02_ROUTE_RUN':'short-catch','V02_ROUTE_SUITE':'furnished-public-rooms-recovery'}),
 ('retained-gameplay',['python3','scripts/vertical-v02/run_current_gameplay_regressions.py'],{**guard,'V02_GAMEPLAY_BUILD':'V02_Furnished_Public_Rooms_Build.json','V02_GAMEPLAY_SUITE':'furnished-public-rooms-gameplay'}),
 ('source-views',['/Applications/Blender.app/Contents/MacOS/Blender','--background','--factory-startup','--python-exit-code','1','--python','scripts/vertical-v02/render_furnished_public_rooms.py'],{}),
 ('benchmark',[node,'scripts/vertical-v02/benchmark_furnished_public_rooms.cjs'],{})]
files={b['entry'],b['manifest'],b['master'],b['eastLightingScript'],b['eastLightingContract'],b['ambientRoutes'],b['worldLifeScript'],b['shadowScript'],b['shadowContract'],b['cassetteManifest'],b['cassetteRuntime'],
 'scripts/vertical-v02/run_furnished_public_room_checks.py','scripts/vertical-v02/slender_test_readiness.cjs','development/vertical-city-v02/V02_Furnished_Public_Rooms_Build.json'}
files.update(x.split('?')[0]for x in re.findall(r'<(?:script|link)[^>]+(?:src|href)="([^"]+)"',(R/b['entry']).read_text())if not x.startswith(('http:','https:','data:','#')))
files.update(c['url']for c in read(R/b['manifest'])['chunks'])
for room in read(R/b['eastLightingContract'])['rooms']:files.update(room[key]['url']for key in ['atlas','reflection'])
for _,command,_ in jobs:
 files.update(part for part in command if not Path(part).is_absolute() and (R/part).is_file())
files.update('scripts/vertical-v02/'+name for name in ['station_route_environment.cjs','market_test_helpers.cjs','evidence_io.cjs','route_camera_probe.cjs','test_momentum_route.cjs','test_mastery_route.cjs','test_public_station.cjs','test_service_encounter.cjs','test_service_lifecycle.cjs','test_service_replay.cjs','test_market_rescue.cjs','test_market_lifecycle.cjs','test_pursuit.cjs','test_discovery.cjs','test_discovery_lifecycle.cjs'])
for name in ['V02_Furnished_Public_Lighting_Master_Validation.json','V02_Furnished_Public_Lighting_Package.json']:
 gate=read(D/name);assert gate['status'].startswith('PASS'),name
 if 'masterSHA256'in gate:assert gate['masterSHA256']==b['masterSHA256'],name
 if 'entrySHA256'in gate:assert gate['entrySHA256']==b['entrySHA256'],name
 files.add('development/vertical-city-v02/'+name)
fingerprint=lambda:{file:sha(R/file)for file in sorted(files)}
report={'status':'RUNNING','entry':b['entry'],'entrySHA256':b['entrySHA256'],'manifestSHA256':b['manifestSHA256'],'hashes':fingerprint(),'jobs':[],
 'scope':'Current furnished-room full-native NPC, nine room/controller cases, six station approaches, short-catch recovery, twelve retained encounter/replay/discovery cases, matched saved-source views and60s timing. Room fixture atlases/reflections are rebound to current geometry; wider global lighting coupling, broader original mission/destruction/failure and final reference/release acceptance remain open.'}
out=D/'V02_Furnished_Public_Rooms_Checks.json'
for name,command,environment in jobs:
 report['active']=name;out.write_text(json.dumps(report,indent=2)+'\n');print('START',name,flush=True);begin=time.monotonic();log=E/(name+'.log')
 with log.open('w')as stream:result=subprocess.run(command,cwd=R,env={**os.environ,**environment},stdout=stream,stderr=subprocess.STDOUT)
 assert fingerprint()==report['hashes'],'Candidate/test bytes changed during acceptance'
 report['jobs'].append({'name':name,'command':command,'environment':environment,'returncode':result.returncode,'wallSeconds':time.monotonic()-begin,'log':str(log.relative_to(D))});print('DONE',name,result.returncode,flush=True)
 if result.returncode:
  report['status']='FAIL';out.write_text(json.dumps(report,indent=2)+'\n');print(log.read_text()[-6000:],flush=True);sys.exit(result.returncode)
report.pop('active',None);report['status']='PASS bounded furnished-room source/input/world/gameplay checks; timing measured; full V02 unfinished';out.write_text(json.dumps(report,indent=2)+'\n');print(report['status'],flush=True)
