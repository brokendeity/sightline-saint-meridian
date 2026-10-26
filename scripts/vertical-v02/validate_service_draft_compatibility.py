"""Preflight recorded input positions against the next Blender service draft.

This is a body-envelope check at recorded points. Current native reexecution,
continuous clearance, camera composition and combat behavior remain separate.
"""
import gzip,hashlib,json
from pathlib import Path
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
draft=json.loads((D/'V02_Service_Architecture_Draft.json').read_text())
assert sha(R/draft['master'])==draft['masterSHA256']
gate=json.loads((D/'V02_Phase4_Gate.json').read_text())
solids=[r for r in draft['newRecords']if r['solid']];rows=[];failures=[]
for e in gate['evidence']:
    source=json.loads((D/e['file']).read_text())
    if not source.get('fullTrace'):continue
    full=json.load(gzip.open(D/source['fullTrace']))
    groups=[(r['id'],r['trace'])for r in full['results']if r.get('pass')and'trace'in r]if e['file']=='V02_Loop_Validation.json'else[('route',full.get('trace',[]))]
    for name,trace in groups:
        samples=0;bad=[]
        for frame,t in enumerate(trace):
            p=t.get('p',t.get('pos'))
            if p is None:continue
            samples+=1
            for r in solids:
                lo=[r['box']['min'][i]-[.665,1.72,.665][i]for i in range(3)]
                hi=[r['box']['max'][i]+[.665,.4,.665][i]for i in range(3)]
                if all(lo[i]+1e-5<p[i]<hi[i]-1e-5 for i in range(3)):bad.append({'frame':frame,'p':p,'id':r['id']})
        rows.append({'file':e['file'],'group':name,'samples':samples,'conflicts':len(bad),'traceSHA256':sha(D/source['fullTrace'])})
        failures.extend({'file':e['file'],**b}for b in bad[:10])
report={'status':'FAIL source-draft recorded-path preflight'if failures else'PASS source-draft recorded-path preflight only',
 'scope':__doc__.strip(),'sourceDraftMasterSHA256':draft['masterSHA256'],'sourceManifestSHA256':draft['sourceManifestSHA256'],
 'rows':rows,'failures':failures,'referenceBody':{'nativeRadius':.55,'planningMargin':.115,'height':1.72,'roofClearance':.4}}
(D/'V02_Service_Draft_Compatibility.json').write_text(json.dumps(report,indent=2)+'\n')
print(report['status'],sum(row['samples']for row in rows),'positions,',len(failures),'conflicts');assert not failures
