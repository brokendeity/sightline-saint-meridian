"""Serial browser acceptance with explicit build/asset/script identity locking."""
from pathlib import Path
import os,sys,json,hashlib,time,subprocess
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';E=D/'evidence/material-response-checks';E.mkdir(exist_ok=True)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();read=lambda p:json.loads(p.read_text())
b=read(D/'V02_Material_Response_Build.json')
locked={f:sha(R/f)for f in[b['entry'],b['manifest'],b['script'],b['materialContract']]}
assert locked[b['entry']]==b['entrySHA256']and locked[b['script']]==b['scriptSHA256']and locked[b['materialContract']]==b['materialContractSHA256']
jobs=[('native',['node','scripts/vertical-v02/test_material_response.cjs'],{}),
 ('station-routes',['python3','scripts/vertical-v02/run_current_station_routes.py'],{'V02_ROUTE_BUILD_REPORT':'V02_Material_Response_Build.json','V02_ROUTE_SUITE':'material-response-routes','V02_ROUTE_REPORT':'V02_Material_Response_Routes.json'}),
 ('loops',['node','scripts/vertical-v02/test_current_city_loops.cjs'],{'V02_LOOP_BUILD':'V02_Material_Response_Build.json','V02_LOOP_RUN':'material-response-loops','V02_LOOP_REPORT':'V02_Material_Response_Loops.json'}),
 ('hud',['node','scripts/vertical-v02/test_hud_candidate.cjs'],{'V02_HUD_ENTRY':b['entry'],'V02_HUD_RUN':'material-response-hud','V02_HUD_REPORT':'V02_Material_Response_HUD.json'}),
 ('stock',['node','development/vertical-city-v02/tools/run-skill-client.cjs','--url','http://127.0.0.1:8766/'+b['entry']+'?capture=backspool','--click-selector','#v02Start','--actions-json',json.dumps({'steps':[{'buttons':['a'],'frames':45},{'buttons':[],'frames':12}]}),'--iterations','1','--pause-ms','250','--screenshot-dir',str(D/'evidence/stock-material-response')],{})]
report={'status':'RUNNING','entry':b['entry'],'identities':locked,'jobs':[]}
for name,cmd,env in jobs:
    report['active']=name;(D/'V02_Material_Response_Checks.json').write_text(json.dumps(report,indent=2)+'\n');print('START',name,flush=True)
    t=time.monotonic();file=E/(name+'.txt')
    with file.open('w')as log:r=subprocess.run(cmd,cwd=R,env={**os.environ,**env},stdout=log,stderr=subprocess.STDOUT)
    assert all(sha(R/f)==h for f,h in locked.items()),'Build mutated during acceptance'
    if name=='stock'and r.returncode==0:
        state=read(D/'evidence/stock-material-response/state-0.json');assert state['ready']and state['active']and abs(state['pos'][0]-55)>.1
        assert not list((D/'evidence/stock-material-response').glob('errors-*.json'))
    report['jobs'].append({'name':name,'command':cmd,'environment':env,'returncode':r.returncode,'wallSeconds':time.monotonic()-t,'log':str(file.relative_to(D))})
    print('DONE',name,r.returncode,flush=True)
    if r.returncode:
        report['status']='FAIL';(D/'V02_Material_Response_Checks.json').write_text(json.dumps(report,indent=2)+'\n');print(file.read_text()[-5000:]);sys.exit(r.returncode)
report.pop('active',None);report['status']='PASS bounded native material, six station approaches, three public loops, HUD/input and installed-client movement'
(D/'V02_Material_Response_Checks.json').write_text(json.dumps(report,indent=2)+'\n');print(report['status'],flush=True)
