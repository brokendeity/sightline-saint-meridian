"""Frozen player/friendly-body physics candidate, sequential browser validation."""
from pathlib import Path
import hashlib,json,os,re,subprocess,sys,time
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';E=D/'evidence/friendly-contacts-checks';E.mkdir(exist_ok=True)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();read=lambda p:json.loads(p.read_text());b=read(D/'V02_Friendly_Contacts_Build.json');node='/opt/homebrew/bin/node'
common={'NODE_OPTIONS':'--require ./scripts/vertical-v02/friendly_contact_readiness.cjs','V02_GAMEPLAY_BUILD':'V02_Friendly_Contacts_Build.json'}
jobs=[
 ('capsule-core',[node,'scripts/vertical-v02/test_friendly_contact_core.cjs'],{}),
 ('stock-client',[node,'development/vertical-city-v02/tools/run-furnished-skill-client.cjs','--url','http://127.0.0.1:8766/'+b['entry']+'?capture=backspool','--click-selector','#v02Start','--actions-json','{"steps":[{"buttons":["up"],"frames":60},{"buttons":[],"frames":10}]}','--iterations','1','--pause-ms','300','--screenshot-dir','development/vertical-city-v02/evidence/friendly-contacts-stock'],{}),
 ('friendly-native',[node,'scripts/vertical-v02/test_friendly_contacts_native.cjs'],{**common,'V02_EVIDENCE_RUN':'friendly-contacts-native-final'}),
 ('keyboard',[node,'scripts/vertical-v02/test_friendly_contacts_keyboard.cjs'],{**common,'V02_EVIDENCE_RUN':'friendly-contacts-keyboard-final'}),
 ('touch',[node,'scripts/vertical-v02/test_friendly_contacts_touch.cjs'],{**common,'V02_EVIDENCE_RUN':'friendly-contacts-touch-final','V02_CONTACT_TOUCH':'1'}),
 ('friendly-camera',[node,'scripts/vertical-v02/test_friendly_camera.cjs'],{**common,'V02_EVIDENCE_RUN':'friendly-camera-final'}),
 ('friendly-top-falls',[node,'scripts/vertical-v02/test_friendly_vertical.cjs'],{**common,'V02_EVIDENCE_RUN':'friendly-top-final'}),
 ('world-life',[node,'scripts/vertical-v02/test_friendly_world_life.cjs'],{}),
 ('room-movement',[node,'scripts/vertical-v02/test_friendly_room_movement.cjs'],{}),
 ('wall-contacts',[node,'scripts/vertical-v02/test_friendly_wall_contacts.cjs'],{}),
 ('landing-contacts',[node,'scripts/vertical-v02/test_friendly_landing_contacts.cjs'],{}),
 ('city-loops',[node,'scripts/vertical-v02/test_east_public_room_life_city_loops.cjs'],{**common,'V02_LOOP_BUILD':'V02_Friendly_Contacts_Build.json','V02_LOOP_RUN':'friendly-contacts-loops','V02_LOOP_REPORT':'V02_Friendly_Contacts_Loops.json'}),
 ('station-routes',['python3','scripts/vertical-v02/run_current_station_routes.py'],{**common,'V02_ROUTE_BUILD_REPORT':'V02_Friendly_Contacts_Build.json','V02_ROUTE_SUITE':'friendly-contacts-station-routes','V02_ROUTE_REPORT':'V02_Friendly_Contacts_Station_Routes.json'}),
 ('short-catch',[node,'scripts/vertical-v02/test_mastery_route.cjs'],{**common,'FULL_ROUTE':'1','SHORT_CATCH':'1','V02_ROUTE_BUILD':'V02_Friendly_Contacts_Build.json','V02_ROUTE_RUN':'short-catch','V02_ROUTE_SUITE':'friendly-contacts-recovery'}),
 ('retained-gameplay',['python3','scripts/vertical-v02/run_current_gameplay_regressions.py'],{**common,'V02_GAMEPLAY_SUITE':'friendly-contacts-gameplay'})]
files={b['entry'],b['manifest'],b['friendlyCore'],b['friendlyScript'],'development/vertical-city-v02/V02_Friendly_Contacts_Build.json','scripts/vertical-v02/run_friendly_contacts_checks.py','scripts/vertical-v02/friendly_contact_readiness.cjs','scripts/vertical-v02/civilian_test_readiness.cjs','scripts/vertical-v02/slender_test_readiness.cjs'}
files.update(x.split('?')[0]for x in re.findall(r'<(?:script|link)[^>]+(?:src|href)="([^"]+)"',(R/b['entry']).read_text())if not x.startswith(('http:','https:','data:','#')))
for _,command,_ in jobs:files.update(x for x in command if not Path(x).is_absolute() and (R/x).is_file())
files.update('scripts/vertical-v02/'+name for name in ['market_test_helpers.cjs','evidence_io.cjs','station_route_environment.cjs','route_camera_probe.cjs','test_momentum_route.cjs','test_mastery_route.cjs','test_public_station.cjs','test_service_encounter.cjs','test_service_lifecycle.cjs','test_service_replay.cjs','test_market_rescue.cjs','test_market_lifecycle.cjs','test_pursuit.cjs','test_discovery.cjs','test_discovery_lifecycle.cjs'])
fingerprint=lambda:{f:sha(R/f)for f in sorted(files)}
report={'status':'RUNNING','entry':b['entry'],'entrySHA256':b['entrySHA256'],'hashes':fingerprint(),'jobs':[],'scope':'Live player/friendly capsules + street support. Analytic core, installed client, normal controller/keyboard/touch contacts and detours, all39scenic people180native seconds, nine rooms,13wall/10landing groups, three loops, six station approaches, recovery and12retained encounter/replay/discovery cases. Legal destruction/original mission, combined cost, final art/hardware remain open.'}
out=D/'V02_Friendly_Contacts_Checks.json'
for name,command,environment in jobs:
 report['active']=name;out.write_text(json.dumps(report,indent=2)+'\n');print('START',name,flush=True);begin=time.monotonic();log=E/(name+'.log')
 with log.open('w')as stream:result=subprocess.run(command,cwd=R,env={**os.environ,**environment},stdout=stream,stderr=subprocess.STDOUT)
 assert fingerprint()==report['hashes'],'Frozen runtime/test changed during acceptance'
 report['jobs'].append({'name':name,'command':command,'environment':environment,'returncode':result.returncode,'wallSeconds':time.monotonic()-begin,'log':str(log.relative_to(D))});print('DONE',name,result.returncode,flush=True)
 if result.returncode:
  report['status']='FAIL';out.write_text(json.dumps(report,indent=2)+'\n');print(log.read_text()[-7000:],flush=True);sys.exit(result.returncode)
report.pop('active',None);report['status']='PASS bounded friendly-contact and retained gameplay checks; full V02 unfinished';out.write_text(json.dumps(report,indent=2)+'\n');print(report['status'],flush=True)
