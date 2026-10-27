"""Describe actual guard counts and contact-connected terrace load paths.
No source/runtime geometry or navigation record is modified here.
"""
from pathlib import Path
import json,hashlib
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';P=R/'assets/city/vertical-v02/public-terraces/manifest.json';m=json.loads(P.read_text());plan=json.loads((D/'V02_Public_Terrace_Plan.json').read_text());by={r['id']:r for r in m['records']};before={k:json.dumps(m[k],sort_keys=True)for k in ['records','chunks','navigation']};connections=[]
def link(a,b,role):
 x=by[a]['box'];y=by[b]['box'];assert all(x['min'][i]<=y['max'][i]+.0005 and x['max'][i]>=y['min'][i]-.0005 for i in range(3)),(a,b);connections.append({'lower':a,'upper':b,'role':role,'publicTerrace':True,'evidence':'Actual source record bounds touch/intersect; structural strength is not certified by this adjacency check'})
for level in plan['levels']:
 y=level['elevation'];p=level['id']
 for x in[32.5,40.8]:
  for z in[296.4,303.6]:
   link(f'terrace-frame-{x}-{z}',p+'-beam-'+str(x),'Independent continuous frame to floor crossbeam');link(f'terrace-frame-{x}-{z}',p+'-roof-beam-'+str(x),'Independent frame to shelter portal beam')
  link(p+'-beam-'+str(x),p+'-floor','Crossbeam bears flat public terrace slab');link(p+'-roof-beam-'+str(x),p+'-roof','Portal beam bears closed shelter roof')
 for x in[40.8,51.2]:link(f'terrace-frame-{x}-303.6',p+'-neck-beam','Rear transverse frame girder')
 link(p+'-neck-beam',p+'-floor','Rear girder meets terrace slab');link(p+'-floor',p+'-neck','Same-level welded public floor junction')
 for z in[276,300]:link(('upper-gallery-W-'if y==128 else f'gallery-W-{y}-')+str(z),p+'-neck','Existing supported gallery meets new public floor span')
oldCount=m['guardrails']['parapets'];actual=[r for r in m['records']if r.get('guardrail')and r['solid']];m['guardrails']['parapets']=len(actual);m['guardrails']['lengthMetres']=sum(max(r['size'][0],r['size'][2])for r in actual);m['guardrails']['summaryAuthority']='Current solid source guard records; previous inherited count was stale';m['guardrails']['reservedOpenings']=[r for r in m['guardrails']['reservedOpenings']if not r['opening'].startswith('public-terrace-')];m['guardrails']['reservedOpenings'].extend({'opening':l['id']+'-entrance','axis':0,'plane':52.05,'elevation':l['elevation'],'supportedZInterval':[298.25,301.75],'source':'Controlled source rail/cap shortening with supported terrace neck'}for l in plan['levels']);m['supportConnections']=[r for r in m['supportConnections']if not r.get('publicTerrace')];m['supportConnections'].extend(connections)
assert all(json.dumps(m[k],sort_keys=True)==v for k,v in before.items());P.write_text(json.dumps(m,indent=2)+'\n');report={'status':'PASS actual guard summary and source-contact adjacency; no geometry/navigation change','previousInheritedGuardCount':oldCount,'actualGuardCount':len(actual),'actualGuardLengthMetres':m['guardrails']['lengthMetres'],'newContactConnections':connections,'geometryAndNavigationUnchanged':True};(D/'V02_Public_Terrace_Metadata.json').write_text(json.dumps(report,indent=2)+'\n');print(report['status'],len(actual),'guards',len(connections),'contacts')
