"""A bounded phase-six evidence checkpoint, never a full city completion gate."""
from pathlib import Path
import json,hashlib,gzip
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';read=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
build=read(D/'V02_World_Life_Build.json');station=read(D/'V02_Transit_Station_Evidence.json');mp=R/'assets/city/vertical-v02/transit-world/manifest.json';airPath=R/'assets/city/vertical-v02/world-life/air_assets.json';air=read(airPath)
assert build['entrySHA256']==sha(R/build['entry'])and build['worldManifestSHA256']==sha(mp)
assert build['sourceStationEntrySHA256']==station['entrySHA256']==sha(R/station['entry'])
for group in['sources','assets']:
 assert all(sha(R/f)==h for f,h in build[group].items())
files={'fleetSource':'V02_Air_Assets_Validation.json','routeClearance':'V02_Air_Route_Preflight.json','flow':'V02_Air_Flow_Tests.json','ambientClearance':'V02_Ambient_Route_Preflight.json','nativeAdapter':'V02_World_Life_Native.json','nativeBindings':'V02_World_Life_Binding.json','savedMaster':'V02_World_Life_Master_Validation.json','stationInputs':'V02_World_Life_Station_Input.json','marketInputs':'evidence/world-life-regressions/V02_Market_Rescue_Public.json'}
reports={k:read(D/f)for k,f in files.items()};assert all(r['status'].startswith('PASS')for r in reports.values())
for k in['nativeAdapter','nativeBindings','stationInputs']:
 r=reports[k];assert all(sha(R/f)==h for f,h in r['hashes'].items());assert r['errors']==[]
for k in['nativeAdapter','stationInputs','marketInputs']:
 r=reports[k];full=read(D/files[k]) if 'fullTrace' not in r else json.loads(gzip.decompress((D/files[k]).parent.joinpath(r['fullTrace']).read_bytes()));assert len(full['trace'])==r['traceFrames']
route=reports['routeClearance'];assert route['manifestSHA256']==sha(mp)and route['sourceWorldSHA256']==sha(D/'V02_LiveWorld_Authoritative.json')
for key,file in[('builderSHA256','scripts/vertical-v02/build_air_routes.cjs'),('clearanceSHA256','scripts/vertical-v02/air_clearance.cjs'),('definitionSHA256','assets/city/vertical-v02/world-life/air_routes.json')]:assert route[key]==sha(R/file)
ambient=reports['ambientClearance'];assert ambient['failureCount']==0 and ambient['manifestSHA256']==sha(mp)and ambient['sourceWorldSHA256']==sha(D/'V02_LiveWorld_Authoritative.json')and ambient['builderSHA256']==sha(R/'scripts/vertical-v02/build_ambient_routes.cjs')
flow=reports['flow'];assert flow['definitionSHA256']==route['definitionSHA256']and flow['coreSHA256']==sha(R/'scripts/game_aerial_traffic_core_v02.js')
fleet=reports['fleetSource'];assert fleet['manifestSHA256']==sha(airPath)and fleet['masterSHA256']==sha(R/air['master']);assert all(sha(R/m['url'])==m['sha256']for m in air['models'])
master=reports['savedMaster'];assert master['masterSHA256']==sha(R/master['master'])and master['sourceStationMasterSHA256']==station['masterSHA256']==sha(R/station['master'])and master['manifestSHA256']==sha(mp)
assert master['snapshotSHA256']==sha(D/'V02_World_Life_Authoring_Snapshot.json')and master['authoringSHA256']==sha(R/'scripts/vertical-v02/blender_world_life.py')
snapshot=read(D/'V02_World_Life_Authoring_Snapshot.json');assert all(sha(R/f)==h for f,h in snapshot['sources'].items())
market=reports['marketInputs'];assert market['entry']==build['entry']and market['entrySHA256']==sha(R/build['entry'])and market['manifestSHA256']==sha(mp)and market['errors']==[]and market['courierPreserved']and market['powerReleases']==0
inp=reports['stationInputs'];assert inp['entry']==build['entry']and inp['setup']['equipment']['drive']['bank']==[]and inp['finalEquipment']['releaseEvents']==[]
protected={**station['protectedEntries'],station['entry']:station['entrySHA256']};assert all(sha(R/f)==h for f,h in protected.items())
captures=[]
for key in['nativeAdapter','nativeBindings','stationInputs']:
 for c in reports[key]['captures']:captures.append({**c,'sha256':sha(D/c['file'])})
stock=D/'evidence/stock-world-life';assert(stock/'shot-0.png').exists()and(stock/'state-0.json').exists()and not list(stock.glob('errors-*.json'))
report={'status':'PASS bounded scenic traffic and public ambient activity milestone; full city goal INCOMPLETE','entry':build['entry'],'entrySHA256':sha(R/build['entry']),'manifestSHA256':sha(mp),'sourceStationCommit':'376345f4d08c6d0b11928e7c4262bd71cb823d91','master':master['master'],'masterSHA256':master['masterSHA256'],
 'evidence':{k:{'file':f,'sha256':sha(D/f),'status':reports[k]['status']}for k,f in files.items()},'captures':captures,
 'stockClient':{'scope':'Installed skill client, short input burst/import only; actual PNG and state reviewed','screenshotSHA256':sha(stock/'shot-0.png'),'stateSHA256':sha(stock/'state-0.json')},
 'metrics':{'originalReferenceBuildings':310,'preservedArchitecturalComponents':master['preservedArchitecturalComponents'],'maximumSavedArchitecturalBoundsErrorMetres':master['maximumArchitecturalBoundsErrorMetres'],'sharedFleetModels':3,'fleetAssetBytes':sum(m['bytes']for m in air['models']),'fleetAssetTriangles':sum(m['triangles']for m in air['models']),'aircraft':36,'aerialBandsMetres':[38,65,114],'airMaterialBatches':reports['nativeAdapter']['final']['state']['airBatches'],'additionalDynamicLights':0,'ambientVisitors':8,'ambientRoutes':3,'ambientPreflightSamples':ambient['samples'],'oldRouteObstacleCounts':[len(b['hits'])for b in route['baseline']],'newRouteSamples':[t['samples']for t in route['trials']if not t['hits']],'pureControllerSimulatedSeconds':600,'nativeWorldLifeAdapterSeconds':180,'stationNormalInputSeconds':inp['simulationSeconds'],'stationInputTargets':len(inp['results']),'localMarketInputSeconds':market['totalInputSeconds'],'marketSecondsToExtraction':market['secondsToExtraction']},
 'protectedEntries':protected,
 'limits':['Traffic is bounded scenic kinematic flow, not intelligent police/vehicle combat or traffic physics.','Eight public visitors use existing lightweight prototype street-pedestrian appearance, flat-level routes and destination dwell. They yield to hero/residents, have no combat/reward ownership and are not physical blockers.','Clearance uses conservative full bank-enclosing boxes sampled at<=0.25m, not continuous collision certification.','Native long flow test advances only the world-life adapter after120 whole-game frames; station and local market tests use full-world stepping and normal controller/keyboard input after labelled initial fixtures.','Independent GLB and saved-source checks prove geometry/transform consistency, not final visual quality.','Initial market wide inspection is blocked by architecture; separate close inspection views are provided.','Current hovercraft and pedestrians remain simple; final art/reference matching, inherited HUD clutter and all retained gameplay/performance release gates remain open.','The station is protected behind the rail screen. Train boarding/moving character support remains unimplemented.'],
 'remaining':['Final matched Blender/browser reference cameras and architecture/material/lighting/HUD refinement.','Resolve nine explicitly unmeasured advanced-edge timings.','Run all retained hero, mission, traversal, combat and destruction scenarios on the final integrated world.','At least60s matched active baseline/candidate performance with CPU/frame/render/memory/load/error evidence.'],'fullGoalComplete':False}
(D/'V02_World_Life_Evidence.json').write_text(json.dumps(report,indent=2)+'\n');print(report['status']);print(json.dumps(report['metrics'],indent=2))
