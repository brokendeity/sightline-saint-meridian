"""Serial current-candidate checks; never treats this as full V02 acceptance.

A failed job stops the chain. Do not restart on an observation timeout: inspect
its live process/handle. Resume requires identical source/runtime/test hashes.
"""
from pathlib import Path
import hashlib,json,os,re,subprocess,sys,time
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';E=D/'evidence/loggia-candidate-validation';E.mkdir(exist_ok=True)
read=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();b=read(D/'V02_Loggia_Terraces_Build.json');a=read(D/'V02_Loggia_Terraces_Authoring.json');m=read(R/b['manifest'])
jobs=[('gameplay',['python3','scripts/vertical-v02/run_current_gameplay_regressions.py']),('native-routes-input',['python3','scripts/vertical-v02/run_loggia_terraces_checks.py']),('loaded-vehicles',['node','scripts/vertical-v02/test_loggia_vehicle_bounds.cjs']),('graph-admission',['python3','scripts/vertical-v02/admit_loggia_routes.py']),('graph-independent',['python3','scripts/vertical-v02/validate_loggia_admission.py']),('source-renders',['/Applications/Blender.app/Contents/MacOS/Blender','--background','--factory-startup','--python-exit-code','1','--python','scripts/vertical-v02/render_loggia_terraces.py']),('performance',['node','scripts/vertical-v02/benchmark_loggia_terraces.cjs'])]
files={b['entry'],b['manifest'],b['materialContract'],a['master'],a['sourceMaster']}
files.update(x.split('?')[0]for x in re.findall(r'<script[^>]+src="([^"]+)"',(R/b['entry']).read_text())if not x.startswith(('http:','https:')))
files.update(c['url']for c in m['chunks']);contract=read(R/b['materialContract']);files.add(contract['environment']['url'])
# Test files are deliberately locked, including helpers and the installed-client wrapper.
files.update(str(p.relative_to(R))for p in (R/'scripts/vertical-v02').glob('*')if p.suffix in ['.cjs','.py','.mjs'])
files.add('development/vertical-city-v02/tools/run-skill-client.cjs')
hashes=lambda:{f:sha(R/f)for f in sorted(files)}
report={'status':'RUNNING','scope':__doc__.strip(),'entry':b['entry'],'entrySHA256':b['entrySHA256'],'manifestSHA256':b['manifestSHA256'],'hashes':hashes(),'jobs':[]};output=D/'V02_Loggia_Candidate_Validation.json';save=lambda:output.write_text(json.dumps(report,indent=2)+'\n');start=0
if len(sys.argv)==3 and sys.argv[1]=='--from':
 start=next(i for i,x in enumerate(jobs)if x[0]==sys.argv[2]);prior=read(output);assert prior['hashes']==report['hashes'],'Source/runtime/test changed; earlier results cannot be reused by this runner';report['jobs']=prior['jobs'][:start];assert len(report['jobs'])==start and all(j['returncode']==0 for j in report['jobs'])
for label,command in jobs[start:]:
 report['active']=label;save();print('START',label,flush=True);t=time.monotonic();log=E/(label+'.log')
 with log.open('w')as out:
  process=subprocess.Popen(command,cwd=R,stdout=out,stderr=subprocess.STDOUT);report['childPID']=process.pid;save();result=process.wait()
 assert hashes()==report['hashes'],'Source/runtime/test mutated during acceptance'
 report['jobs'].append({'name':label,'command':command,'pid':process.pid,'returncode':result,'wallSeconds':time.monotonic()-t,'log':str(log.relative_to(D))});report.pop('childPID',None);save();print('DONE',label,result,flush=True)
 if result:
  report['status']='FAIL';save();print(log.read_text()[-4000:],flush=True);sys.exit(result)
report.pop('active',None);report['status']='PASS listed current loggia candidate checks; full visual/combined-release goal remains INCOMPLETE';save();print(report['status'],flush=True)
