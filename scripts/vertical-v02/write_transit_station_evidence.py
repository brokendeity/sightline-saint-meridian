"""Bind the bounded station/support milestone; retain the complete city goal."""
from pathlib import Path
import json,hashlib,gzip
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();read=lambda p:json.loads(p.read_text())
mp=R/'assets/city/vertical-v02/transit-world/manifest.json';m=read(mp);build=read(D/'V02_Transit_Station_Build.json');auth=read(D/'V02_Transit_Environment_Authoring.json')
assert build['entrySHA256']==sha(R/build['entry'])and build['manifestSHA256']==sha(mp)
assert auth['masterSHA256']==sha(R/auth['master'])and auth['manifestSHA256']==sha(mp)
assert auth['authoringSHA256']==sha(R/'scripts/vertical-v02/blender_transit_environment.py')and auth['graphBuilderSHA256']==sha(R/'scripts/vertical-v02/build_transit_station_graph.py')
assert all(sha(R/c['url'])==c['sha256']for c in m['chunks'])
files={'preflight':'V02_Transit_Environment_Preflight.json','savedSource':'V02_Transit_Master_Validation.json','exports':'V02_Transit_World_GLB_Validation.json','convoy':'V02_Transit_Station_Geometry.json','graph':'V02_Transit_Graph_Validation.json','stationInput':'V02_Transit_Station_Input.json','nativeAdapter':'V02_Transit_Station_Native.json'}
reports={k:read(D/f)for k,f in files.items()}
assert all(r['status'].startswith('PASS')for r in reports.values())
assert all(r.get('manifestSHA256',sha(mp))==sha(mp)for r in reports.values())
for k in['stationInput','nativeAdapter']:
 r=reports[k];assert all(sha(R/f)==value for f,value in r['hashes'].items())and not r['errors']
 full=json.loads(gzip.decompress((D/r['fullTrace']).read_bytes()));assert len(full['trace'])==r['traceFrames']
inp=reports['stationInput'];assert inp['setup']['equipment']['drive']['bank']==[]and inp['finalEquipment']['releaseEvents']==[]
native=reports['nativeAdapter'];assert all(c['pixels']['coloredFraction']>.05 for c in native['captures'])
stock=D/'evidence/stock-transit-station';assert(stock/'shot-0.png').exists()and(stock/'state-0.json').exists()and not list(stock.glob('errors-*.json'))
protected={f:sha(R/f)for f in['SIGHTLINE_BACKSPOOL_WHIP_THROW.html','SIGHTLINE_VERTICAL_MEGACITY_V1.html','SIGHTLINE_SAINT_MERIDIAN_V02_GRAYBOX.html','SIGHTLINE_SAINT_MERIDIAN_V02_DETAILED.html','SIGHTLINE_SAINT_MERIDIAN_V02_TRANSIT.html']}
old=read(D/'V02_Transit_Implementation_Evidence.json');assert all(protected[f]==value for f,value in old['protectedEntries'].items())and protected['SIGHTLINE_SAINT_MERIDIAN_V02_TRANSIT.html']==old['entrySHA256']
captures=[]
for r in[inp,native]:
 for c in r['captures']:captures.append({**c,'sha256':sha(D/c['file'])})
report={'status':'PASS bounded public station and source support continuity milestone; full goal INCOMPLETE','entry':build['entry'],'entrySHA256':sha(R/build['entry']),'manifestSHA256':sha(mp),'master':auth['master'],'masterSHA256':auth['masterSHA256'],
 'evidence':{k:{'file':f,'sha256':sha(D/f),'status':reports[k]['status']}for k,f in files.items()},'captures':captures,
 'metrics':{'sourceComponentMeshes':reports['savedSource']['meshes'],'originalReferenceBuildings':310,'originalBuildingCopiesExported':0,'preservedDetailedContactRecords':reports['preflight']['preservedDetailedRecords'],'explicitV02GuardRetirements':reports['preflight']['controlledRetirements'],'supports':len(m['transitStructure']['supports']),'newGroundPiers':sum(not s['existingColumn']for s in m['transitStructure']['supports']),'maximumSupportSpacingMetres':m['transitStructure']['maximumSupportSpacing'],'actualSavedSupportContacts':len(reports['savedSource']['connections']),
 'glbs':len(m['chunks']),'glbBytes':sum(c['bytes']for c in m['chunks']),'triangles':sum(c['triangles']for c in m['chunks']),'nativeStationFrames':inp['traceFrames'],'nativeStationSimulationSeconds':inp['simulationSeconds'],'nativeStationTargets':len(inp['results']),'nativeConsoleErrors':len(inp['errors'])+len(native['errors']),'newDirectedStationEdges':8,'graphNodes':reports['graph']['nodes'],'graphEdges':reports['graph']['edges'],'convoySampledPoses':reports['convoy']['carriagePoses']},
 'protectedEntries':protected,'scopeLimits':['Source contacts and <=0.10m sampled convoy envelopes do not establish continuous collision or engineering load/soil certification.','Station test uses one explicit local fixture, then normal controller input; it is not a newly rerun whole street-to-station approach.','Full train loop on this revision is actual browser adapter stepping after120 whole-game frames, not a full-world regression.','The public platform remains behind a full-height screen. Moving character support and train boarding are not implemented.','Original lead-car doors and bogies remain fused.','Stock arrow burst is an import/capture check, not movement acceptance.'],
 'remaining':['Rework and validate aerial traffic routes and appropriate ambient/pedestrian activity.','Run all retained route, hero, mission and encounter input scenarios on the final integrated world.','Resolve nine explicitly unmeasured advanced-edge timing fields.','Matched Blender/browser reference renders and final architecture/material/lighting/HUD review.','At least60s matched active baseline/candidate performance and full release checks.'],'fullGoalComplete':False}
(D/'V02_Transit_Station_Evidence.json').write_text(json.dumps(report,indent=2)+'\n');print(report['status']);print(report['metrics'])
