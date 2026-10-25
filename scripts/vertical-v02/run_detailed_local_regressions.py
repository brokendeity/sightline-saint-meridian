"""Repeat retained cases on the actual detailed entry without overwriting graybox evidence.

This bounded local suite is not the complete31-case/release acceptance suite.
Every child opens the detailed HTML and records its actual manifest hash.
"""
from pathlib import Path
import hashlib,json,os,subprocess,time,sys
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02'
out=D/'evidence/detailed-regressions';out.mkdir(parents=True,exist_ok=True)
files=['SIGHTLINE_SAINT_MERIDIAN_V02_DETAILED.html','assets/city/vertical-v02/detailed/manifest.json',
       'scripts/game_vertical_discovery_v02.js','scripts/game_vertical_market_v02.js',
       'scripts/game_vertical_pursuit_v02.js','scripts/game_vertical_encounters_v02.js']
hashes=lambda:{f:hashlib.sha256((R/f).read_bytes()).hexdigest()for f in files}
report={'status':'RUNNING','hashes':hashes(),'scope':__doc__.strip(),'jobs':[]}
jobs=[('market-lifecycle','test_market_lifecycle.cjs',{}),
      ('market-public','test_market_rescue.cjs',{}),
      ('market-south','test_market_rescue.cjs',{'LOCAL_ONLY':'1','SOUTH_ROUTE':'1'}),
      ('service-echo','test_service_replay.cjs',{}),
      ('discovery-lifecycle','test_discovery_lifecycle.cjs',{}),
      ('discovery-tour','test_discovery.cjs',{})]
for name,file,env in jobs:
    report['active']=name;(D/'V02_Detailed_Regression_Run.json').write_text(json.dumps(report,indent=2)+'\n')
    print('START',name,flush=True);start=time.monotonic();log=out/(name+'.log')
    with log.open('w')as f:
        result=subprocess.run(['node','scripts/vertical-v02/'+file],cwd=R,
          env={**os.environ,'V02_STAGE':'detailed',**env},stdout=f,stderr=subprocess.STDOUT)
    assert hashes()==report['hashes'],'Detailed runtime changed during tests'
    report['jobs'].append({'name':name,'file':file,'environment':{'V02_STAGE':'detailed',**env},
      'returncode':result.returncode,'wallSeconds':time.monotonic()-start,'log':str(log.relative_to(D))})
    print('DONE',name,result.returncode,flush=True)
    if result.returncode:
        report['status']='FAILED';(D/'V02_Detailed_Regression_Run.json').write_text(json.dumps(report,indent=2)+'\n')
        print(log.read_text()[-4000:]);sys.exit(result.returncode)
report.pop('active',None);report['status']='PASS six retained detailed local gameplay scenarios'
(D/'V02_Detailed_Regression_Run.json').write_text(json.dumps(report,indent=2)+'\n')
print(report['status'],flush=True)
