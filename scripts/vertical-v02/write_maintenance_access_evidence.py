"""Bind the stepped maintenance-access checkpoint; do not certify the full city."""
from pathlib import Path
import collections,hashlib,json
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02'
read=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
names=['Plan','Authoring','Master_Validation','Metadata','Package','Exports','Build','Native','Blender','Clearance','Routes','Loops','HUD','Checks','Admission','Admission_Validation','Stair_Pose']
reports={n:read(D/f'V02_Maintenance_Access_{n}.json')for n in names}
for name,report in reports.items():
 if name!='Build':assert report['status'].startswith('PASS')and not report.get('failure'),(name,report.get('failure'))
plan,author,source,meta,pack,exports,build,native,blender,clearance,routes,loops,hud,checks=[reports[n]for n in names[:14]]
assert sha(R/build['entry'])==build['entrySHA256']==native['entrySHA256']==routes['entrySHA256']==loops['entrySHA256']==checks['entrySHA256']==hud['hashes'][build['entry']]
assert sha(R/build['manifest'])==build['manifestSHA256']==native['manifestSHA256']==routes['manifestSHA256']==pack['manifestSHA256']==exports['manifestSHA256']==checks['manifestSHA256']
assert sha(R/author['master'])==author['masterSHA256']==source['masterSHA256']==pack['masterSHA256']==blender['masterSHA256']
assert sha(R/author['sourceMaster'])==author['sourceMasterSHA256']==plan['sourceMasterSHA256']
assert sha(R/'scripts/vertical-v02/blender_maintenance_access.py')==author['authoringSHA256']
assert sha(D/'V02_Maintenance_Access_Plan.json')==author['planSHA256']==source['planSHA256']==clearance['planSHA256']
assert sha(D/'V02_Maintenance_Access_Native.json')==blender['nativeReportSHA256']
base=read(R/plan['sourceManifest']);m=read(R/build['manifest']);modified={c['after']['id']:c['after']for c in plan['changes']}
assert m['records']==[modified.get(r['id'],r)for r in base['records']]+plan['additions']
replaced={c['replaces']:c for c in m['chunks']if c['id'].startswith('maintenance-access-replacement-')};assert set(replaced)=={c['id']for c in base['chunks']if set(c['recordIDs'])&set(modified)}
for c in base['chunks']:
 if c['id']in replaced:assert replaced[c['id']]['recordIDs']==c['recordIDs']
 else:assert c in m['chunks']
for c in m['chunks']:assert sha(R/c['url'])==c['sha256']
assert collections.Counter(id for c in m['chunks']for id in c['recordIDs'])==collections.Counter(r['id']for r in m['records'])
for key in ['encounters','pointsOfInterest','directory','detailedPublicRoutes','stationPublicRoute']:assert m[key]==base[key]
assert m['navigation']['nodes']==base['navigation']['nodes']+meta['newNodes']and m['navigation']['edges']==base['navigation']['edges']+meta['newEdges']
assert all(m['paths'][k]==v for k,v in base['paths'].items())
assert m['guardrails']['reservedOpenings']==base['guardrails']['reservedOpenings']
assert m['guardrails']['parapets']==sum(r['solid']and bool(r.get('guardrail'))for r in m['records'])
assert m['supportConnections']==base['supportConnections']+meta['contacts']
for file,key in [('collisions.json','colliders'),('structure_ownership.json','structures'),('threadrail_surfaces.json','physicalSurfaceColliders')]:
 before=read(R/'assets/city/vertical-v02/service-tower/runtime'/file);after=read(R/'assets/city/vertical-v02/maintenance-access/runtime'/file);assert after['sourceManifestSHA256']==build['manifestSHA256']
 assert [r['id']for r in after[key][:len(before[key])]]==[r['id']for r in before[key]]
 for a,b in zip(before[key],after[key]):
  if a['id']not in modified:assert a==b
  elif key=='structures':assert {k:v for k,v in a.items()if k!='operation'}=={k:v for k,v in b.items()if k!='operation'}
  else:assert b=={**a,'box':modified[a['id']]['box']}
 assert {r['id']for r in after[key]}=={r['id']for r in m['records']if key=='structures'or r['solid']}
prior=read(D/'V02_Service_Tower_Evidence.json');protected={**prior['protectedEntries'],prior['entry']:prior['entrySHA256']}
for file,h in protected.items():assert sha(R/file)==h
assert sha(R/build['source'])==build['sourceSHA256'];assert (R/build['entry']).read_text().replace(build['newSelector'],build['oldSelector'],1)==(R/build['source']).read_text()
assert native['preservation']['originalBuildings']==310 and len(native['results'])==2 and not native['errors']
assert len(routes['jobs'])==6 and len(hud['results'])==15 and len(loops['results'])==3
assert all(r['cameraInsideFrames']==r['powerReleases']==0 for r in loops['results'])
for j in routes['jobs']:
 assert sha(D/j['report'])==j['reportSHA256']and sha(D/j['trace'])==j['traceSHA256']
 r=read(D/j['report']);assert r['status'].startswith('PASS')and not r['errors']and not r.get('failure')
assert not hud['errors']and not loops['errors']
for c in native['captures']+blender['captures']:assert sha(D/c['file'])==c['sha256']
for id in ['A','B','S','M']:
 assert next(c['viewMatrix']for c in native['captures']if c['id']==id and c['variant']=='before')==next(c['viewMatrix']for c in native['captures']if c['id']==id and c['variant']=='after'),id
stock=D/'evidence/stock-maintenance-access';state=read(stock/'state-0.json');assert state['ready']and state['active']and abs(state['pos'][0]-55)>.1;assert not list(stock.glob('errors-*.json'))
assert sha(D/native['fullTrace'])==native['fullTraceSHA256']
assert len(native['cameraOpaqueInside'])==0
for c in reports['Stair_Pose']['captures']:assert sha(D/c['file'])==c['sha256']
assert reports['Admission']['graphSHA256']==sha(D/'V02_Maintenance_Movement_Graph.json')
assert reports['Admission']['matrixSHA256']==sha(D/'V02_Maintenance_AbilityRoute_Matrix.csv')
assert reports['Admission_Validation']['admissionSHA256']==sha(D/'V02_Maintenance_Access_Admission.json')
for c in read(D/'evidence/maintenance-access/contact-sheets.json'):
 assert sha(D/c['file'])==c['sha256']
 for file,h in c['inputs'].items():assert sha(D/file)==h
result={'status':'PASS bounded stepped maintenance-access reconstruction and retained journeys/loops/input; full V02 remains INCOMPLETE',
 'entry':build['entry'],'entrySHA256':build['entrySHA256'],'master':author['master'],'masterSHA256':author['masterSHA256'],'manifest':build['manifest'],'manifestSHA256':build['manifestSHA256'],
 'protectedEntries':protected,'sourceInverseExact':True,'reports':{f'V02_Maintenance_Access_{n}.json':sha(D/f'V02_Maintenance_Access_{n}.json')for n in names},
 'unchangedSourceObjects':author['unchangedSourceObjects'],'independentLocalTransformChanges':source['savedLocalTransformChanges'],'controlledChangedSourceRecords':len(plan['changes']),'addedRecords':len(plan['additions']),'reusedChunks':author['reusedChunks'],'newDynamicLights':0,
 'originalBuildings':310,'nativeGroups':len(native['results']),'currentStationJourneys':6,'currentLoops':3,'retainedHUDGroups':15,
 'sevenDoorClearVolumes':source['clearDoorVolumes'],'stairTreads':source['stairTreads'],'maintenanceTourSeconds':native['simSeconds'],'maintenanceTourDistance':native['distance'],'admittedMaintenanceEdges':len(reports['Admission']['admitted']),'stairFraming':reports['Stair_Pose']['framing'],
 'review':{'nativeBeforeAfterABMAndPlantVisitsOpened':True,'actualBlenderABMAndRouteContactSheetsOpened':True,
 'localArchitecture':'Twelve ordinary stair flights, real canopy shaft, three supported upper galleries and actual west doorways make all four plant rooms reachable. Original climb faces and roof geometry are unchanged.',
 'fullApprovedReferenceVisualQuality':'FAIL / incomplete; broad massing, skyline depth, material/lighting and architectural variety remain unfinished'},
 'remaining':['Full approved-reference architecture, structural proportions, skyline depth and material/lighting refinement','Entire current retained encounter/replay/destruction/mission/failure-path regression suite','Final combined>=60second fixed-internal-resolution/GPU-aware performance workload','Physical controller/touchscreen playtesting','Unadmitted adjoining/remaining movement-graph edges retain separate evidence gates'],
 'toolSources':{str(p.relative_to(R)):sha(p)for p in (R/'scripts/vertical-v02').glob('*maintenance*')if p.is_file()},
 'artifacts':{},'fullGoalComplete':False}
for folder in ['maintenance-access','maintenance-access-routes','maintenance-access-loops','maintenance-access-hud','maintenance-access-checks','stock-maintenance-access','maintenance-stair-pose']:
 for p in(D/'evidence'/folder).rglob('*'):
  if p.is_file():result['artifacts'][str(p.relative_to(D))]=sha(p)
(D/'V02_Maintenance_Access_Evidence.json').write_text(json.dumps(result,indent=2)+'\n');print(result['status'])
