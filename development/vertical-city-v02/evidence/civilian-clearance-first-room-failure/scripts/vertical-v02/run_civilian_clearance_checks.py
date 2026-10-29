"""Frozen candidate, sequential native-input acceptance; no parallel GPU jobs."""
from pathlib import Path
import hashlib,json,os,re,subprocess,sys,time
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';E=D/'evidence/civilian-clearance-checks';E.mkdir(exist_ok=True)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();read=lambda p:json.loads(p.read_text());b=read(D/'V02_Civilian_Clearance_Build.json');node='/opt/homebrew/bin/node'
common={'NODE_OPTIONS':'--require ./scripts/vertical-v02/civilian_test_readiness.cjs','V02_GAMEPLAY_BUILD':'V02_Civilian_Clearance_Build.json'}
jobs=[
 ('stock-client',[node,'development/vertical-city-v02/tools/run-furnished-skill-client.cjs','--url','http://127.0.0.1:8766/'+b['entry']+'?capture=backspool','--click-selector','#v02Start','--actions-json','{"steps":[{"buttons":["up"],"frames":60},{"buttons":[],"frames":10}]}','--iterations','1','--pause-ms','300','--screenshot-dir','development/vertical-city-v02/evidence/civilian-clearance-stock'],{}),
 ('natural-dwell',[node,'scripts/vertical-v02/test_visitor_clearance.cjs'],{**common,'V02_EVIDENCE_RUN':'civilian-clearance-dwell'}),
 ('world-life',[node,'scripts/vertical-v02/test_civilian_world_life.cjs'],{}),
 ('room-movement',[node,'scripts/vertical-v02/test_civilian_room_movement.cjs'],{}),
 ('market-public',[node,'scripts/vertical-v02/test_civilian_rescue.cjs'],{**common,'V02_EVIDENCE_RUN':'civilian-clearance-public'}),
 ('market-south',[node,'scripts/vertical-v02/test_civilian_rescue.cjs'],{**common,'V02_EVIDENCE_RUN':'civilian-clearance-south','LOCAL_ONLY':'1','SOUTH_ROUTE':'1'}),
 ('market-lifecycle',[node,'scripts/vertical-v02/test_market_lifecycle.cjs'],{**common,'V02_EVIDENCE_RUN':'civilian-clearance-lifecycle'}),
 ('retained-gameplay',['python3','scripts/vertical-v02/run_current_gameplay_regressions.py'],{**common,'V02_GAMEPLAY_SUITE':'civilian-clearance-gameplay'})]
files={b['entry'],b['manifest'],b['worldLifeScript'],b['marketScript'],'development/vertical-city-v02/V02_Civilian_Clearance_Build.json','scripts/vertical-v02/run_civilian_clearance_checks.py','scripts/vertical-v02/civilian_test_readiness.cjs','scripts/vertical-v02/slender_test_readiness.cjs'}
files.update(x.split('?')[0]for x in re.findall(r'<(?:script|link)[^>]+(?:src|href)="([^"]+)"',(R/b['entry']).read_text())if not x.startswith(('http:','https:','data:','#')))
for _,command,_ in jobs:files.update(x for x in command if not Path(x).is_absolute() and (R/x).is_file())
files.update('scripts/vertical-v02/'+name for name in ['market_test_helpers.cjs','evidence_io.cjs','test_service_encounter.cjs','test_service_lifecycle.cjs','test_service_replay.cjs','test_market_rescue.cjs','test_market_lifecycle.cjs','test_pursuit.cjs','test_discovery.cjs','test_discovery_lifecycle.cjs'])
fingerprint=lambda:{f:sha(R/f)for f in sorted(files)}
report={'status':'RUNNING','entry':b['entry'],'entrySHA256':b['entrySHA256'],'hashes':fingerprint(),'jobs':[],'scope':'Two isolated civilian locomotion modules; natural waiting-state walk-up,180native seconds, nine room/input cases, public/south rescue and six animated-body camera rays at extraction, lifecycle, retained encounter/replay/discovery. Broader missions/destruction/performance/art/hardware remain open.'}
out=D/'V02_Civilian_Clearance_Checks.json'
for name,command,environment in jobs:
 report['active']=name;out.write_text(json.dumps(report,indent=2)+'\n');print('START',name,flush=True);begin=time.monotonic();log=E/(name+'.log')
 with log.open('w')as stream:result=subprocess.run(command,cwd=R,env={**os.environ,**environment},stdout=stream,stderr=subprocess.STDOUT)
 assert fingerprint()==report['hashes'],'Frozen candidate/tests changed during acceptance'
 report['jobs'].append({'name':name,'command':command,'environment':environment,'returncode':result.returncode,'wallSeconds':time.monotonic()-begin,'log':str(log.relative_to(D))});print('DONE',name,result.returncode,flush=True)
 if result.returncode:
  report['status']='FAIL';out.write_text(json.dumps(report,indent=2)+'\n');print(log.read_text()[-7000:],flush=True);sys.exit(result.returncode)
report.pop('active',None);report['status']='PASS bounded civilian clearance and retained gameplay checks; full V02 remains unfinished';out.write_text(json.dumps(report,indent=2)+'\n');print(report['status'],flush=True)
