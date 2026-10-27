"""Bind current routes, calibrated graph, retained failures and actual captures."""
from pathlib import Path
import hashlib,json
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();read=lambda p:json.loads(p.read_text())
routes=read(D/'V02_Current_Station_Routes.json');graph=read(D/'V02_Current_Movement_Graph.json');validation=read(D/'V02_Current_Movement_Graph_Validation.json');terraces=read(D/'V02_Public_Terrace_Evidence.json')
assert routes['status'].startswith('PASS')and validation['status'].startswith('PASS')
assert len(routes['jobs'])==6 and graph['formerlyNullTimingsFilled']==validation['formerlyNullTimingsFilled']==9
assert sha(D/'V02_Current_Movement_Graph.json')==validation['graphSHA256']
for f,h in routes['hashes'].items():assert sha(R/f)==h
protected={**terraces['protectedEntries'],terraces['entry']:terraces['entrySHA256']}
for f,h in protected.items():assert sha(R/f)==h
assert sha(R/terraces['master'])==terraces['masterSHA256']
assert routes['entrySHA256']==terraces['entrySHA256']==graph['currentEntrySHA256']
assert routes['manifestSHA256']==terraces['manifestSHA256']==graph['currentManifestSHA256']
summary=[]
for j in routes['jobs']:
 p=D/j['report'];r=read(p);assert sha(p)==j['reportSHA256'];assert sha(D/j['trace'])==j['traceSHA256']
 assert r['status'].startswith('PASS')and not r.get('failure')and not r['errors']
 assert r['initialBank']==(5 if j['name'].endswith(('banked','brake'))else 0)
 if 'public-'in j['name']:
  assert r['airFrames']==0 and r['final']['trauma']==0 and r['final']['releases']==0
  assert r['capture']['player']==r['final']['p']
 elif'momentum-'in j['name']:assert r['powerReleases']==0 and r['cameraVisibility']['problemSamples']==0
 else:
  assert r['final']['trauma']==0 and r['cameraVisibility']['problemSamples']==0
  assert len(r['powerReleases'])==(1 if j['name']=='mastery-brake'else 0)
 summary.append({k:j[k]for k in ['name','seconds','distance','initialBank','finalPosition','report','reportSHA256','trace','traceSHA256']})
artifacts={str(p.relative_to(D)):sha(p)for p in(D/'evidence/current-station-routes').rglob('*')if p.is_file()}
reports=['V02_Current_Station_Routes.json','V02_Current_Route_Event_Timings.json','V02_Current_Route_Event_Timings.csv','V02_Current_Movement_Graph.json','V02_Current_AbilityRoute_Matrix.csv','V02_Current_Movement_Graph_Validation.json']
result={'status':'PASS six current approaches and calibrated nine missing phase timings; full V02 remains INCOMPLETE',
 'entry':routes['entry'],'entrySHA256':routes['entrySHA256'],'manifest':routes['manifest'],'manifestSHA256':routes['manifestSHA256'],
 'reports':{f:sha(D/f)for f in reports},'protectedEntries':protected,'masterUnchanged':True,
 'routes':summary,'nodes':validation['nodes'],'edges':validation['edges'],'timedAbilityEdges':13,'newlyFilledTimings':9,'calibratedNodes':6,
 'artifacts':artifacts,'visualReview':{'allThreeCurrentRouteContactSheetsOpened':True,'individualNativeStationAndPopImagesOpened':True,
 'observations':['All retained route sheets show the hero and actual structures; no final reference-quality approval.',
 'Station overhang occupies a large dark upper portion of the native view. Roof proportions, soffit response and broad scene appearance remain visual work.',
 'Initial public arrival captures were stale plaza frames; rejected copies and explanation retained. Both actual input runs repeated with an explicit render-only arrival capture.']},
 'remaining':['Full approved-reference visual architecture, structural proportions, lighting and material appearance',
 'Remaining graph edges and endpoint-adjusted adjoining routes require separate admission; measured phases do not certify every path',
 'Complete current retained encounter/replay/destruction/mission/failure-path regression suite',
 'Current combined>=60second matched performance with fixed internal resolution and GPU-aware measurements where supported',
 'Physical controller/touchscreen playtesting'],
 'fullGoalComplete':False}
(D/'V02_Current_Station_Evidence.json').write_text(json.dumps(result,indent=2)+'\n');print(result['status'])
