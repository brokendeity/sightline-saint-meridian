"""Bind the service architecture milestone to current source and native evidence.

This does not certify full visual fidelity, train/world life, the release suite
or sustained performance. Earlier detailed/graybox evidence stays versioned.
"""
import hashlib,json
from pathlib import Path
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
entry=R/'SIGHTLINE_SAINT_MERIDIAN_V02_DETAILED.html';mp=R/'assets/city/vertical-v02/detailed/manifest.json';master=D/'blender/SaintMeridian_V02_Detailed_Master.blend'
eh,mh,sh=sha(entry),sha(mp),sha(master)
m=json.loads(mp.read_text());a=json.loads((D/'V02_Detailed_Authoring.json').read_text())
assert a['masterSHA256']==sh and a['authoringScriptSHA256']==sha(R/'scripts/vertical-v02/blender_architecture.py')
assert all(sha(R/p)==h for p,h in a['dependencies'].items())
assert all(sha(R/c['url'])==c['sha256']for c in m['chunks'])
evidence=[]
for name in ['V02_Detailed_Authoring_Validation.json','V02_Reference_Appearance_Validation.json','V02_Detailed_Compatibility.json']:
    p=D/name;r=json.loads(p.read_text());assert r['status'].startswith('PASS')
    if 'manifestSHA256'in r:assert r['manifestSHA256']==mh
    if 'masterSHA256'in r:assert r['masterSHA256']==sh
    evidence.append({'file':name,'sha256':sha(p),'status':r['status']})
p=D/'V02_Detailed_GLB_Validation.json';r=json.loads(p.read_text())
assert r['manifestSHA256']==mh and len(r['results'])==len(m['chunks'])
assert all(not x['numErrors']and not x['numWarnings']for x in r['results'])
assert {x['id']:x['sha256']for x in r['results']}=={x['id']:x['sha256']for x in m['chunks']}
evidence.append({'file':p.name,'sha256':sha(p),'status':'PASS27 GLBs, no errors/warnings; individual bytes match manifest'})
for name in ['V02_Service_Encounter.json','V02_Service_Replay_Escape.json']:
    p=D/'evidence/detailed-service-revision'/name;r=json.loads(p.read_text())
    assert r['status'].startswith('PASS') and r['entrySHA256']==eh and r['manifestSHA256']==mh and not r['errors']
    evidence.append({'file':str(p.relative_to(D)),'sha256':sha(p),'status':r['status'],'fullTrace':str((p.parent/r['fullTrace']).relative_to(D)),'traceSHA256':sha(p.parent/r['fullTrace'])})
stock=D/'evidence/stock-detailed-service';s=json.loads((stock/'state-0.json').read_text())
assert s['ready']and s['active']and s['mode']=='GROUND' and not list(stock.glob('*error*'))
protected={'SIGHTLINE_BACKSPOOL_WHIP_THROW.html':'fac92161657cb93c8500d6afbc2900748b7cadfc015c019eeddf0366cdf070e4',
 'SIGHTLINE_VERTICAL_MEGACITY_V1.html':'45d868dcfcd1d0d9a382563bc984ebc657848cd6b2987f21bdf132edcf86d03b',
 'SIGHTLINE_SAINT_MERIDIAN_V02_GRAYBOX.html':'d425868ef4e117b3c8a3ab3b845e520ede0210a6599ee02f5af139e97ac151a8'}
assert all(sha(R/file)==digest for file,digest in protected.items())
report={'status':'PASS service architecture source and focused native gameplay milestone','scope':__doc__.strip(),
 'entrySHA256':eh,'manifestSHA256':mh,'masterSHA256':sh,'components':len(m['records']),'chunks':len(m['chunks']),
 'evidence':evidence,'stockClient':{'state':str((stock/'state-0.json').relative_to(D)),'stateSHA256':sha(stock/'state-0.json'),'imageSHA256':sha(stock/'shot-0.png')},
 'reviewedImageScope':'Actual service victory/overhead and camera-only utility import inspection plus stock-client image were opened and reviewed. Not reference-matched final art or sustained performance.',
 'preservedEntries':protected,'previousDetailedSlice':'V02_Detailed_Stage1_Evidence.json',
 'remaining':['Transit consist/track/station and aerial-route integration','Ambient world activity and final encounter presentation',
              'Final architectural/lighting refinement against matched Blender/browser reference views',
              'Nine explicitly unmeasured advanced-edge timing values','Current release suite and matched >=60-second performance'],
 'fullGoalComplete':False}
(D/'V02_Detailed_Service_Revision_Evidence.json').write_text(json.dumps(report,indent=2)+'\n')
print(report['status'])
