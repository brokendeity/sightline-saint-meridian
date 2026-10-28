"""Bound current source-lighting/HUD/client byte identity and explicit readiness."""
from pathlib import Path
import json,hashlib,subprocess,time,os,sys
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';E=D/'evidence/diffuse-pilot';b=json.loads((D/'V02_Diffuse_Lighting_Build.json').read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();locked={f:sha(R/f)for f in[b['entry'],b['manifest'],b['script'],b['lightingContract']]};report={'status':'RUNNING','identities':locked,'jobs':[]};save=lambda:(D/'V02_Diffuse_Lighting_Checks.json').write_text(json.dumps(report,indent=2)+'\n')
jobs=[('hud',['node','scripts/vertical-v02/test_hud_candidate.cjs'],{'V02_HUD_ENTRY':b['entry'],'V02_HUD_RUN':'diffuse-lighting-hud','V02_HUD_REPORT':'V02_Diffuse_Lighting_HUD.json'}),('stock',['node','development/vertical-city-v02/tools/run-skill-client.cjs','--url','http://127.0.0.1:8766/'+b['entry']+'?capture=backspool','--click-selector','#v02Start','--actions-json',json.dumps({'steps':[{'buttons':['a'],'frames':45},{'buttons':[],'frames':12}]}),'--iterations','1','--pause-ms','250','--screenshot-dir',str(D/'evidence/stock-diffuse-lighting')],{})]
for name,cmd,env in jobs:
 report['active']=name;save();print('START',name,flush=True);start=time.monotonic();file=E/(name+'.log')
 with file.open('w')as log:result=subprocess.run(cmd,cwd=R,env={**os.environ,**env},stdout=log,stderr=subprocess.STDOUT)
 report['jobs'].append({'name':name,'returncode':result.returncode,'seconds':time.monotonic()-start,'command':cmd,'environment':env,'log':str(file.relative_to(D))});assert all(sha(R/f)==h for f,h in locked.items());save();print('DONE',name,result.returncode,flush=True)
 if result.returncode:report['status']='FAIL';save();sys.exit(result.returncode)
 if name=='stock':
  state=json.loads((D/'evidence/stock-diffuse-lighting/state-0.json').read_text());assert state['ready']and state['active']and abs(state['pos'][0]-55)>.1;assert not list((D/'evidence/stock-diffuse-lighting').glob('errors-*.json'))
report.pop('active',None);report['status']='PASS18HUD/input checks and installed-client actual movement after explicit source-light readiness';save();print(report['status'],flush=True)
