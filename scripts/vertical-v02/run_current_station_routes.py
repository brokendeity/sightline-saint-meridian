"""Run all three current station approaches with legal zero/full-bank starts.

Browser jobs are sequential. --resume accepts only a terminal PASS with the
current build, current test/configuration source hashes and retained full trace.
This runner does not alter the game, synthesize rails or inject resources.
"""
from pathlib import Path
import gzip,hashlib,json,os,re,subprocess,sys,time
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02'
build=json.loads((D/'V02_Public_Terrace_Build.json').read_text())
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
assert sha(R/build['entry'])==build['entrySHA256']
assert sha(R/build['manifest'])==build['manifestSHA256']
base=D/'evidence/current-station-routes';base.mkdir(parents=True,exist_ok=True)
files=[build['entry'],build['manifest'],'scripts/vertical-v02/station_route_environment.cjs',
       'scripts/vertical-v02/route_camera_probe.cjs','scripts/vertical-v02/test_public_station.cjs',
       'scripts/vertical-v02/test_momentum_route.cjs','scripts/vertical-v02/test_mastery_route.cjs',
       'scripts/vertical-v02/run_current_station_routes.py']
files+=re.findall(r'<script[^>]*src="([^"?]+)(?:\?[^" ]*)?"', (R/build['entry']).read_text())
files=list(dict.fromkeys(f for f in files if not f.startswith(('https:','http:'))))
fingerprint=lambda:{f:sha(R/f)for f in files}
locked=fingerprint()
jobs=[
 ('momentum-zero','test_momentum_route.cjs','V02_Momentum_Full_Zero_Flow.json',{'FULL_ROUTE':'1','RUN_PREFIX':'flow'}),
 ('mastery-zero','test_mastery_route.cjs','V02_Mastery_Full_Zero.json',{'FULL_ROUTE':'1'}),
 ('momentum-banked','test_momentum_route.cjs','V02_Momentum_Full_Banked_Flow.json',{'FULL_ROUTE':'1','RUN_PREFIX':'flow','BANKED_START':'1'}),
 ('mastery-brake','test_mastery_route.cjs','V02_Mastery_Full_Banked_Brake.json',{'FULL_ROUTE':'1','BANKED_START':'1','USE_BRAKE':'1'}),
 ('public-zero','test_public_station.cjs','V02_Public_Route_Run_Validation.json',{'RUN_PUBLIC':'1'}),
 ('public-banked','test_public_station.cjs','V02_Public_Route_Run_Validation.json',{'RUN_PUBLIC':'1','BANKED_START':'1'}),
]
report={'status':'RUNNING','entry':build['entry'],'entrySHA256':build['entrySHA256'],
 'manifest':build['manifest'],'manifestSHA256':build['manifestSHA256'],'hashes':locked,
 'scope':'Six uninterrupted normal-input station approaches on the current combined city. One labelled starting fixture per run; full bank is earned by actual running. Not full city/release/performance acceptance.', 'jobs':[]}
out=D/'V02_Current_Station_Routes.json'
def save():out.write_text(json.dumps(report,indent=2)+'\n')
def valid(name,file,summary):
 p=base/name/summary
 if not p.exists():return False
 r=json.loads(p.read_text());trace=p.parent/r.get('fullTrace','missing')
 return r.get('status','').startswith('PASS') and not r.get('failure') and not r.get('errors') and r.get('entrySHA256')==build['entrySHA256'] and r.get('manifestSHA256')==build['manifestSHA256'] and r.get('testSourceSHA256')==sha(R/'scripts/vertical-v02'/file) and r.get('testConfigurationSHA256')==sha(R/'scripts/vertical-v02/station_route_environment.cjs') and trace.is_file()
for name,file,summary,env in jobs:
 report['active']=name;save();start=time.monotonic();log=base/(name+'.log')
 reused='--resume'in sys.argv and valid(name,file,summary)
 if reused:print('REUSE hash-bound PASS',name,flush=True);code=0
 else:
  print('START',name,flush=True)
  with log.open('w')as f:
   run=subprocess.run(['node','scripts/vertical-v02/'+file],cwd=R,stdout=f,stderr=subprocess.STDOUT,env={**os.environ,**env,'V02_ROUTE_BUILD':'V02_Public_Terrace_Build.json','V02_ROUTE_RUN':name})
  code=run.returncode
 assert fingerprint()==locked,'Runtime/test configuration changed during route acceptance'
 if code or not valid(name,file,summary):
  report['status']='FAILED';report['failure']=name;save()
  if log.exists():print(log.read_text()[-6000:],flush=True)
  sys.exit(code or 1)
 p=base/name/summary;r=json.loads(p.read_text());trace=p.parent/r['fullTrace'];full=json.loads(gzip.decompress(trace.read_bytes()))
 assert len(full['trace'])==r['traceFrames']
 report['jobs'].append({'name':name,'file':file,'environment':env,'returncode':0,'reused':reused,'wallSeconds':time.monotonic()-start,'report':str(p.relative_to(D)),'reportSHA256':sha(p),'trace':str(trace.relative_to(D)),'traceSHA256':sha(trace),'seconds':r['seconds'],'distance':r['distance'],'initialBank':r['initialBank'],'finalPosition':full.get('final',{}).get('p',full['trace'][-1]['p']),'cameraVisibility':r.get('cameraVisibility')})
 print('PASS',name,r['seconds'],r['distance'],flush=True);save()
report.pop('active',None);report['status']='PASS all three current approaches, zero/full legal bank starts';save();print(report['status'],flush=True)
