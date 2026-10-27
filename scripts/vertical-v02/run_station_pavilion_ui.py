"""Sequential current public loops, retained UI/input cases and installed client."""
from pathlib import Path
import hashlib,json,os,subprocess,sys,time
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';E=D/'evidence/station-pavilion-checks';E.mkdir(parents=True,exist_ok=True)
read=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();build=read(D/'V02_Station_Pavilion_Build.json');assert sha(R/build['entry'])==build['entrySHA256'];assert read(D/'V02_Station_Pavilion_Routes.json')['status'].startswith('PASS')
jobs=[('loops',['node','scripts/vertical-v02/test_current_city_loops.cjs'],{'V02_LOOP_BUILD':'V02_Station_Pavilion_Build.json','V02_LOOP_RUN':'station-pavilion-loops','V02_LOOP_REPORT':'V02_Station_Pavilion_Loops.json'}),
 ('hud',['node','scripts/vertical-v02/test_hud_candidate.cjs'],{'V02_HUD_ENTRY':build['entry'],'V02_HUD_RUN':'station-pavilion-hud','V02_HUD_REPORT':'V02_Station_Pavilion_HUD.json'}),
 ('stock',['node','development/vertical-city-v02/tools/run-skill-client.cjs','--url','http://127.0.0.1:8766/'+build['entry']+'?capture=backspool','--click-selector','#v02Start','--actions-json',json.dumps({'steps':[{'buttons':['a'],'frames':45},{'buttons':[],'frames':12}]}),'--iterations','1','--pause-ms','250','--screenshot-dir',str(D/'evidence/stock-station-pavilion')],{})]
report={'status':'RUNNING','entrySHA256':build['entrySHA256'],'manifestSHA256':build['manifestSHA256'],'jobs':[]}
if'--stock-only'in sys.argv:
 prior=read(D/'V02_Station_Pavilion_Checks.json');assert prior['entrySHA256']==build['entrySHA256']and prior['manifestSHA256']==build['manifestSHA256'];assert [j['name']for j in prior['jobs'][:2]]==['loops','hud']and all(j['returncode']==0 for j in prior['jobs'][:2])
 for name in ['Loops','HUD']:
  r=read(D/f'V02_Station_Pavilion_{name}.json');assert r['status'].startswith('PASS')and not r['errors']
 report['jobs']=prior['jobs'][:2];jobs=jobs[2:]
for name,cmd,env in jobs:
 report['active']=name;(D/'V02_Station_Pavilion_Checks.json').write_text(json.dumps(report,indent=2)+'\n');print('START',name,flush=True);t=time.monotonic();log=E/(name+'.txt')
 with log.open('w')as f:result=subprocess.run(cmd,cwd=R,env={**os.environ,**env},stdout=f,stderr=subprocess.STDOUT)
 assert sha(R/build['entry'])==build['entrySHA256']and sha(R/build['manifest'])==build['manifestSHA256']
 if name=='stock'and result.returncode==0:
  state=read(D/'evidence/stock-station-pavilion/state-0.json');assert state['ready']and state['active']and abs(state['pos'][0]-55)>.1,'Installed client ran but failed to demonstrate movement'
  assert not list((D/'evidence/stock-station-pavilion').glob('errors-*.json')),'Installed client reported console errors'
 report['jobs'].append({'name':name,'command':cmd,'environment':env,'returncode':result.returncode,'wallSeconds':time.monotonic()-t,'log':str(log.relative_to(D))});print('DONE',name,result.returncode,flush=True)
 if result.returncode:report['status']='FAILED';(D/'V02_Station_Pavilion_Checks.json').write_text(json.dumps(report,indent=2)+'\n');print(log.read_text()[-5000:]);sys.exit(result.returncode)
report.pop('active',None);report['status']='PASS three current public loops, retained HUD/input cases and installed skill client';(D/'V02_Station_Pavilion_Checks.json').write_text(json.dumps(report,indent=2)+'\n');print(report['status'],flush=True)
