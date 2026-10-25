"""Detailed candidate export/preservation and recorded-route compatibility.

Point-envelope compatibility of previous inputs is a preflight, not a replay of
new gameplay, a swept-arc guarantee, or acceptance of new routes/camera views.
"""
from pathlib import Path
import json, hashlib, gzip, math, itertools, collections
R=Path(__file__).resolve().parents[2]
D=R/'development/vertical-city-v02'
MP=R/'assets/city/vertical-v02/detailed/manifest.json'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
metadata=json.loads(MP.read_text())
base=json.loads((R/'assets/city/vertical-v02/graybox/manifest.json').read_text())
gate=json.loads((D/'V02_Phase4_Gate.json').read_text())
by={r['id']:r for r in metadata['records']}
assert len(by)==len(metadata['records'])
for record in base['records']:
    other=by[record['id']]
    for key in ['owner','box','solid','walkable','stair','stairLanding','flight','stepRise']:
        assert other.get(key)==record.get(key),(record['id'],key)
assert metadata['acceptedGrayboxManifestSHA256']==sha(R/'assets/city/vertical-v02/graybox/manifest.json')
assert metadata['phase4GateSHA256']==sha(D/'V02_Phase4_Gate.json')
assert all(sha(R/c['url'])==c['sha256']for c in metadata['chunks'])
exported=[id for c in metadata['chunks']for id in c['recordIDs']]
assert len(exported)==len(by) and set(exported)==set(by)
assert not any(id.startswith('building-')for id in exported)
new=[r for r in metadata['records']if r['id']not in {r['id']for r in base['records']}]
world=json.loads((D/'V02_LiveWorld_Authoritative.json').read_text())
def overlaps(a,b):
    return all(a['min'][i]<b['max'][i]-1e-5 and a['max'][i]>b['min'][i]+1e-5 for i in range(3))
original_conflicts=[{'detail':r['id'],'building':b['id'],'part':p['id']}for r in new for b in world['buildings']for p in b['parts']if overlaps(r['box'],p['box'])]

# The accepted source uses a.55m radius. An additional.115m lateral planning
# margin also covers the observed guardrail approach separation.
grid=collections.defaultdict(list);cell=12
for record in new:
    if not record['solid']:continue
    box={'min':[record['box']['min'][i]-[.665,1.72,.665][i]for i in range(3)],
         'max':[record['box']['max'][i]+[.665,.4,.665][i]for i in range(3)]}
    for key in itertools.product(*(range(math.floor(box['min'][i]/cell),math.floor(box['max'][i]/cell)+1)for i in range(3))):
        grid[key].append((record['id'],box))
rows=[];failures=[]
for item in gate['evidence']:
    source=json.loads((D/item['file']).read_text())
    if not source.get('fullTrace'):continue
    raw=json.load(gzip.open(D/source['fullTrace']))
    groups=[(r['id'],r['trace'])for r in raw['results']if r.get('pass')and 'trace'in r]if item['file']=='V02_Loop_Validation.json'else[('route',raw.get('trace',[]))]
    for name,trace in groups:
        bad=[];samples=0
        for frame,row in enumerate(trace):
            point=row.get('p',row.get('pos'))
            if not point:continue
            samples+=1
            for id,box in grid[tuple(math.floor(v/cell)for v in point)]:
                if all(box['min'][i]+1e-5<point[i]<box['max'][i]-1e-5 for i in range(3)):
                    bad.append({'frame':frame,'position':point,'detail':id})
        rows.append({'source':item['file'],'group':name,'traceSHA256':sha(D/source['fullTrace']),'samples':samples,'conflicts':len(bad)})
        failures.extend({'source':item['file'],'group':name,**b}for b in bad[:30])
report={'status':'FAIL detailed preservation/recorded-route preflight'if original_conflicts or failures else'PASS detailed preservation/recorded-route preflight only',
 'scope':__doc__.strip(),'manifestSHA256':sha(MP),'sourcePhase4GateSHA256':sha(D/'V02_Phase4_Gate.json'),
 'baseContactRecordsPreserved':len(base['records']),'newComponents':len(new),
 'originalBuildingConflicts':original_conflicts,'recordedRouteConflicts':failures,'traces':rows,
 'referenceBody':{'nativeRadius':.55,'extraLateralPlanningMargin':.115,'height':1.72,'roofClearance':.4},
 'remaining':['Saved Blender per-component bounds/materials','Actual detailed game import, new terrace/stair input','Camera, old-route reexecution, visuals and performance']}
(D/'V02_Detailed_Compatibility.json').write_text(json.dumps(report,indent=2)+'\n')
print(report['status']);print('Original conflicts',len(original_conflicts),'route conflict samples',sum(r['conflicts']for r in rows))
assert not original_conflicts and not failures
