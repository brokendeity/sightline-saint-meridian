"""Run retained gameplay cases on an explicit immutable current candidate.

Each case retains its own complete reports/images, with real entry/manifest
hashes. Resume only at the first unfinished case with identical fingerprints.
These tests do not establish final art quality or sustained combined performance.
"""
from pathlib import Path
import hashlib,json,os,re,subprocess,sys,time
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02'
name=os.environ.get('V02_GAMEPLAY_BUILD','V02_Loggia_Terraces_Build.json');assert re.fullmatch(r'[A-Za-z0-9_]+\.json',name)
b=json.loads((D/name).read_text());suite=os.environ.get('V02_GAMEPLAY_SUITE','loggia-terraces-gameplay');assert re.fullmatch(r'[a-z0-9-]+',suite)
E=D/'evidence'/suite;E.mkdir(parents=True,exist_ok=True);reportFile=E/'run.json'
jobs=[('service','test_service_encounter.cjs',{}),('service-lifecycle','test_service_lifecycle.cjs',{}),('service-replay','test_service_replay.cjs',{}),
 ('market-public','test_market_rescue.cjs',{}),('market-south','test_market_rescue.cjs',{'LOCAL_ONLY':'1','SOUTH_ROUTE':'1'}),('market-lifecycle','test_market_lifecycle.cjs',{}),
 ('pursuit-intercept','test_pursuit.cjs',{}),('pursuit-chase','test_pursuit.cjs',{'PURSUIT_CASE':'chase'}),('pursuit-escape','test_pursuit.cjs',{'PURSUIT_CASE':'escape'}),('pursuit-lifecycle','test_pursuit.cjs',{'PURSUIT_CASE':'lifecycle'}),
 ('discovery-tour','test_discovery.cjs',{}),('discovery-lifecycle','test_discovery_lifecycle.cjs',{})]
files={b['entry'],b['manifest'],b['materialContract']}
files.update(x.split('?')[0]for x in re.findall(r'<script[^>]+src="([^"]+)"',(R/b['entry']).read_text())if not x.startswith(('http:','https:')))
files.update('scripts/vertical-v02/'+f for _,f,_ in jobs)
files.update(['scripts/vertical-v02/market_test_helpers.cjs','scripts/vertical-v02/evidence_io.cjs','scripts/vertical-v02/run_current_gameplay_regressions.py'])
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();hashes=lambda:{f:sha(R/f)for f in sorted(files)}
report={'status':'RUNNING','entry':b['entry'],'manifest':b['manifest'],'hashes':hashes(),'jobs':[], 'scope':__doc__.strip()}
start=0
if len(sys.argv)==3 and sys.argv[1]=='--from':
 start=next(i for i,x in enumerate(jobs)if x[0]==sys.argv[2]);prior=json.loads(reportFile.read_text());assert prior['hashes']==report['hashes'],'Cannot reuse changed runtime/test evidence';report['jobs']=prior['jobs'][:start];assert len(report['jobs'])==start and all(j['returncode']==0 for j in report['jobs'])
for label,file,extra in jobs[start:]:
 report['active']=label;reportFile.write_text(json.dumps(report,indent=2)+'\n');print('START',label,flush=True)
 env={'V02_GAMEPLAY_BUILD':name,'V02_EVIDENCE_RUN':suite+'/'+label,**extra};log=E/(label+'.log');t=time.monotonic()
 with log.open('w')as out:run=subprocess.run(['node','scripts/vertical-v02/'+file],cwd=R,env={**os.environ,**env},stdout=out,stderr=subprocess.STDOUT)
 assert hashes()==report['hashes'],'Runtime/test changed during acceptance'
 report['jobs'].append({'name':label,'script':file,'environment':env,'returncode':run.returncode,'wallSeconds':time.monotonic()-t,'log':str(log.relative_to(D))});print('DONE',label,run.returncode,flush=True)
 if run.returncode:
  report['status']='FAIL';reportFile.write_text(json.dumps(report,indent=2)+'\n');print(log.read_text()[-4000:],flush=True);sys.exit(run.returncode)
report.pop('active',None);report['status']='PASS12current encounter/replay/discovery cases; final release scope remains separate';reportFile.write_text(json.dumps(report,indent=2)+'\n');print(report['status'],flush=True)
