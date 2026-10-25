"""Repeat current hash-bound input acceptance after district geometry changes.

Browser scenarios run sequentially to avoid desktop focus/pause interference.
Resume with --from NAME only when the recorded earlier hashes still match.
"""
import os,json,hashlib,subprocess,time,sys
from pathlib import Path
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02'
jobs=[
 ('actor-stairs',['node','scripts/vertical-v02/test_actor_stairs.cjs'],{}),
 ('pursuit-intercept',['node','scripts/vertical-v02/test_pursuit.cjs'],{}),
 ('pursuit-chase',['node','scripts/vertical-v02/test_pursuit.cjs'],{'PURSUIT_CASE':'chase'}),
 ('pursuit-escape',['node','scripts/vertical-v02/test_pursuit.cjs'],{'PURSUIT_CASE':'escape'}),
 ('pursuit-lifecycle',['node','scripts/vertical-v02/test_pursuit.cjs'],{'PURSUIT_CASE':'lifecycle'}),
 ('market-public',['node','scripts/vertical-v02/test_market_rescue.cjs'],{}),
 ('market-south',['node','scripts/vertical-v02/test_market_rescue.cjs'],{'LOCAL_ONLY':'1','SOUTH_ROUTE':'1'}),
 ('market-lifecycle',['node','scripts/vertical-v02/test_market_lifecycle.cjs'],{}),
 ('service',['node','scripts/vertical-v02/test_service_encounter.cjs'],{}),
 ('service-lifecycle',['node','scripts/vertical-v02/test_service_lifecycle.cjs'],{}),
 ('loops',['node','scripts/vertical-v02/test_loops.cjs'],{}),
 ('public-run',['node','scripts/vertical-v02/test_public_station.cjs'],{'RUN_PUBLIC':'1'}),
 ('public-walk',['node','scripts/vertical-v02/test_public_station.cjs'],{}),
 ('roundtrip',['node','scripts/vertical-v02/test_public_roundtrip.cjs'],{}),
 ('momentum-zero',['node','scripts/vertical-v02/test_momentum_route.cjs'],{'FULL_ROUTE':'1','RUN_PREFIX':'flow'}),
 ('momentum-banked',['node','scripts/vertical-v02/test_momentum_route.cjs'],{'FULL_ROUTE':'1','RUN_PREFIX':'flow','BANKED_START':'1'}),
 ('mastery-zero',['node','scripts/vertical-v02/test_mastery_route.cjs'],{'FULL_ROUTE':'1'}),
 ('mastery-brake',['node','scripts/vertical-v02/test_mastery_route.cjs'],{'FULL_ROUTE':'1','BANKED_START':'1','USE_BRAKE':'1'}),
 ('short-catch',['node','scripts/vertical-v02/test_mastery_route.cjs'],{'SHORT_CATCH':'1'}),
 ('impact',['node','scripts/vertical-v02/test_impact_ownership.cjs'],{}),
 ('whip',['node','scripts/vertical-v02/test_preserved_whip_inputs.cjs'],{}),
]
files={'entry':'SIGHTLINE_SAINT_MERIDIAN_V02_GRAYBOX.html','manifest':'assets/city/vertical-v02/graybox/manifest.json','encounters':'scripts/game_vertical_encounters_v02.js','market':'scripts/game_vertical_market_v02.js','pursuit':'scripts/game_vertical_pursuit_v02.js'}
hashes={k:hashlib.sha256((R/p).read_bytes()).hexdigest()for k,p in files.items()}
report_file=D/'V02_Regression_Run.json'
report={'status':'RUNNING','hashes':hashes,'jobs':[],'scope':'Current graybox circulation, actor stair clearance, pursuit, market rescue, local service combat and retained inputs; not complete V02 acceptance.'}
start=0
if len(sys.argv)>2 and sys.argv[1]=='--from':
 start=next(i for i,(name,_,_)in enumerate(jobs)if name==sys.argv[2])
 prior=json.loads(report_file.read_text());assert prior['hashes']==hashes,'Cannot resume stale build'
 report['jobs']=prior['jobs'][:start];assert len(report['jobs'])==start and all(r['returncode']==0 for r in report['jobs'])
for name,cmd,env in jobs[start:]:
 report['active']=name;report_file.write_text(json.dumps(report,indent=2)+'\n');print('START',name,flush=True)
 t=time.monotonic();log=D/'evidence'/('regression-'+name+'.log')
 with log.open('w')as f:run=subprocess.run(cmd,cwd=R,env={**os.environ,**env},stdout=f,stderr=subprocess.STDOUT)
 assert hashes=={k:hashlib.sha256((R/p).read_bytes()).hexdigest()for k,p in files.items()},'Runtime changed during acceptance; repeat against one build'
 report['jobs'].append({'name':name,'command':cmd,'environment':env,'returncode':run.returncode,'wallSeconds':round(time.monotonic()-t,2),'log':str(log.relative_to(R))})
 print('DONE',name,run.returncode,flush=True)
 if run.returncode:
  report['status']='FAILED';report_file.write_text(json.dumps(report,indent=2)+'\n');print(log.read_text()[-4000:],flush=True);sys.exit(run.returncode)
report['status']='PASS listed graybox regressions';report.pop('active',None);report_file.write_text(json.dumps(report,indent=2)+'\n');print(report['status'],flush=True)
