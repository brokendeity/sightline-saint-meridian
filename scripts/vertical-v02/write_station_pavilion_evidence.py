"""Bind the actual source, new geometry and bounded current gameplay evidence."""
from pathlib import Path
import collections,hashlib,json
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';read=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
names=['Plan','Authoring','Master_Validation','Metadata','Package','Exports','Build','Native','Blender','Routes','Loops','HUD','Checks'];reports={n:read(D/f'V02_Station_Pavilion_{n}.json')for n in names};plan,author,source,meta,pack,exports,build,native,blender,routes,loops,hud,checks=[reports[n]for n in names]
for n,r in reports.items():
 if n=='Build':continue
 assert r['status'].startswith('PASS')and not r.get('failure'),(n,r.get('status'),r.get('failure'))
assert sha(R/build['entry'])==build['entrySHA256']==native['entrySHA256']==routes['entrySHA256']==loops['entrySHA256']==checks['entrySHA256']==hud['hashes'][build['entry']]
assert sha(R/build['manifest'])==build['manifestSHA256']==native['manifestSHA256']==routes['manifestSHA256']==pack['manifestSHA256']==exports['manifestSHA256']==checks['manifestSHA256']
assert sha(R/author['master'])==author['masterSHA256']==source['masterSHA256']==pack['masterSHA256']==blender['masterSHA256']
assert sha(R/author['sourceMaster'])==author['sourceMasterSHA256']==plan['sourceMasterSHA256']
assert sha(R/'scripts/vertical-v02/blender_station_pavilion.py')==author['authoringSHA256']
assert sha(D/'V02_Station_Pavilion_Plan.json')==author['planSHA256']==source['planSHA256']
assert sha(D/'V02_Station_Pavilion_Native.json')==blender['nativeReportSHA256']
base=read(R/plan['sourceManifest']);m=read(R/build['manifest']);modified={c['after']['id']:c['after']for c in plan['changes']};assert m['records']==[modified.get(r['id'],r)for r in base['records']]+plan['additions']
replaced={c['replaces']:c for c in m['chunks']if c['id']=='station-pavilion-replacement'};assert len(replaced)==1
for c in base['chunks']:
 if c['id']in replaced:assert replaced[c['id']]['recordIDs']==c['recordIDs']
 else:assert c in m['chunks']
for c in m['chunks']:assert sha(R/c['url'])==c['sha256']
ids=[id for c in m['chunks']for id in c['recordIDs']];assert collections.Counter(ids)==collections.Counter(r['id']for r in m['records'])
for key in ['navigation','paths','encounters','pointsOfInterest','directory','detailedPublicRoutes','stationPublicRoute','guardrails']:assert m[key]==base[key]
assert m['supportConnections']==base['supportConnections']+meta['contacts']
for file,key in [('collisions.json','colliders'),('structure_ownership.json','structures'),('threadrail_surfaces.json','physicalSurfaceColliders')]:
 before=read(R/'assets/city/vertical-v02/public-terraces/runtime'/file);after=read(R/'assets/city/vertical-v02/station-pavilion/runtime'/file);assert after['sourceManifestSHA256']==build['manifestSHA256']
 assert [r['id']for r in after[key][:len(before[key])]]==[r['id']for r in before[key]]
 for a,b in zip(before[key],after[key]):
  if a['id']not in modified:assert a==b
  elif key=='structures':assert {k:v for k,v in a.items()if k!='operation'}=={k:v for k,v in b.items()if k!='operation'}
  else:assert b=={**a,'box':modified[a['id']]['box']}
 assert {r['id']for r in after[key]}=={r['id']for r in m['records']if key=='structures'or r['solid']}
parent=read(D/'V02_Current_Station_Evidence.json');protected=parent['protectedEntries']
for file,h in protected.items():assert sha(R/file)==h
assert sha(R/build['source'])==build['sourceSHA256'];assert (R/build['entry']).read_text().replace(build['newSelector'],build['oldSelector'],1)==(R/build['source']).read_text()
assert native['preservation']['originalBuildings']==310 and len(native['results'])==6 and not native['errors']
assert len(routes['jobs'])==6 and len(hud['results'])==15 and len(loops['results'])==3
assert all(r['cameraInsideFrames']==r['powerReleases']==0 for r in loops['results'])
for j in routes['jobs']:
 assert sha(D/j['report'])==j['reportSHA256']and sha(D/j['trace'])==j['traceSHA256']
 r=read(D/j['report']);assert r['status'].startswith('PASS')and not r['errors']and not r.get('failure')
assert not hud['errors']and not loops['errors']
for c in native['captures']+blender['captures']:assert sha(D/c['file'])==c['sha256']
stock=D/'evidence/stock-station-pavilion';state=read(stock/'state-0.json');assert state['ready']and state['active']and abs(state['pos'][0]-55)>.1
result={'status':'PASS bounded raised/notched station pavilion, six current station journeys, three current loops and retained input/UI; full V02 remains INCOMPLETE',
 'entry':build['entry'],'entrySHA256':build['entrySHA256'],'master':author['master'],'masterSHA256':author['masterSHA256'],'manifest':build['manifest'],'manifestSHA256':build['manifestSHA256'],
 'protectedEntries':protected,'sourceInverseExact':True,'reports':{f'V02_Station_Pavilion_{n}.json':sha(D/f'V02_Station_Pavilion_{n}.json')for n in names},
 'unchangedSourceObjects':author['unchangedSourceObjects'],'controlledChangedSourceRecords':len(plan['changes']),'addedRecords':len(plan['additions']),'reusedChunks':author['reusedChunks'],'newDynamicLights':0,
 'stationHeadroomBefore':3.1,'stationHeadroomAfter':4,'columnNotchClearanceMetres':.08,
 'originalBuildings':310,'nativeGroups':6,'currentStationJourneys':6,'currentLoops':3,'retainedHUDGroups':15,
 'nativeStationComparisonCameraMatricesEqual':next(c['viewMatrix']for c in native['captures']if c['id']=='S'and c['variant']=='before')==next(c['viewMatrix']for c in native['captures']if c['id']=='S'and c['variant']=='after'),
 'review':{'actualNativeBeforeAfterSAndJumpOpened':True,'actualBlenderABSOpened':True,'currentRouteHudLoopStockImagesOpened':True,
 'localStationView':'Improved: higher framed glass canopy exposes city layers and warm ribs instead of an opaque black ceiling.',
 'fullApprovedReferenceVisualQuality':'FAIL / incomplete; broad massing, structural proportions and engine material/lighting differences remain'},
 'remaining':['Full approved-reference architecture, structural proportions, skyline depth and material/lighting refinement','Entire current retained encounter/replay/destruction/mission/failure-path regression suite','Final combined>=60second fixed-internal-resolution/GPU-aware performance workload','Physical controller/touchscreen playtesting','Unadmitted adjoining/remaining movement-graph edges retain their separate evidence gates'],
 'artifacts':{},'fullGoalComplete':False}
assert result['nativeStationComparisonCameraMatricesEqual']
for folder in ['station-pavilion','station-pavilion-routes','station-pavilion-loops','station-pavilion-hud','station-pavilion-checks','stock-station-pavilion']:
 for p in(D/'evidence'/folder).rglob('*'):
  if p.is_file():result['artifacts'][str(p.relative_to(D))]=sha(p)
(D/'V02_Station_Pavilion_Evidence.json').write_text(json.dumps(result,indent=2)+'\n');print(result['status'])
