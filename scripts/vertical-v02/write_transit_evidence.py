"""Hash-bind the bounded phase-six transit checkpoint without claiming release."""
from pathlib import Path
import json,hashlib,gzip
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
read=lambda p:json.loads(p.read_text())
build=read(D/'V02_Transit_Build.json');asset=read(R/'assets/city/vertical-v02/transit/assets.json')
assert build['entrySHA256']==sha(R/build['entry'])
assert build['assetManifestSHA256']==sha(R/'assets/city/vertical-v02/transit/assets.json')
assert asset['masterSHA256']==sha(R/asset['master'])
assert asset['authoringSHA256']==sha(R/'scripts/vertical-v02/blender_transit_assets.py')
assert all(sha(R/p)==value for p,value in build['protectedEntries'].items())
assert all(sha(R/p)==value for p,value in build['sources'].items())
assert all(sha(R/c['url'])==c['sha256']for c in [asset['passenger'],*asset['trackChunks']])
core=read(D/'V02_Transit_Controller_Tests.json');source=read(D/'V02_Transit_Authoring_Validation.json');geometry=read(D/'V02_Transit_Geometry.json');native=read(D/'V02_Transit_Native.json')
assert core['status']=='PASS controller behavior'and core['coreSHA256']==sha(R/'scripts/vertical_transit_core_v02.js')
assert source['status']=='PASS saved transit source contacts'and source['masterSHA256']==asset['masterSHA256']
assert geometry['status']=='PASS sampled export geometry only'and not geometry['stationDoorConflicts']
assert all(sha(R/file)==value for file,value in geometry['hashes'].items())
assert native['status']=='PASS bounded native transit behavior'and not native['errors']
assert all(sha(R/file)==value for file,value in native['hashes'].items())
trace=json.loads(gzip.decompress((D/native['fullTrace']).read_bytes()));assert len(trace['trace'])==native['traceFrames']
assert len(native['captures'])==5 and all(c['pixels']['coloredFraction']>.05 and (D/c['file']).exists()for c in native['captures'])
stock=D/'evidence/stock-transit-first';stockState=read(stock/'state-0.json')
assert(stock/'shot-0.png').exists()and not list(stock.glob('errors-*.json'))
historical='evidence/fixed-defects/transit-first/native-full-world-before-wheel-correction.json'
old=read(D/historical);assert old['status']=='PASS bounded native transit behavior'
report={'status':'PASS bounded scheduled transit implementation; phase6 and full goal INCOMPLETE',
 'entry':build['entry'],'entrySHA256':sha(R/build['entry']),'assetManifestSHA256':sha(R/'assets/city/vertical-v02/transit/assets.json'),
 'master':asset['master'],'masterSHA256':asset['masterSHA256'],'acceptedBaseEntrySHA256':build['sourceEntrySHA256'],
 'evidence':{name:{'file':file,'sha256':sha(D/file)}for name,file in{
 'controller':'V02_Transit_Controller_Tests.json','savedBlenderContacts':'V02_Transit_Authoring_Validation.json','exportedBoundsAndTriangles':'V02_Transit_Geometry.json','nativeAdapterCycle':'V02_Transit_Native.json','nativeAdapterFullTrace':native['fullTrace'],
 'historicalFullWorldCycleBeforeWheelFix':historical,'stockState':'evidence/stock-transit-first/state-0.json','stockImage':'evidence/stock-transit-first/shot-0.png'}.items()},
 'currentNativeScope':native['mode'],'captureEvidence':[{'file':c['file'],'sha256':sha(D/c['file']),'pixels':c['pixels']}for c in native['captures']],
 'historicalRunPolicy':'The full-world run predates wheel alignment and exact phase-timer corrections. Retained as historical evidence, never substituted for the current adapter-only run or future full release regressions.',
 'metrics':{'routeLengthMetres':geometry['routeLength'],'carriages':4,'passengerCars':3,'carriagePoses':geometry['carriagePoses'],'maximumSampleIntervalMetres':geometry['intervalMetres'],'minimumAdjacentSampledOBBGapMetres':geometry['minimumAdjacentOBBGap'],
 'worldConflicts':len(geometry['worldConflicts']),'convoyConflicts':len(geometry['convoyConflicts']),'staticTrackTriangleConflicts':len(geometry['trackConflicts']),'stationOpenDoorConflicts':len(geometry['stationDoorConflicts']),
 'glbFiles':len(geometry['glbResults']),'newAssetBytes':sum(c['bytes']for c in [asset['passenger'],*asset['trackChunks']]),'nativeAdapterTraceSamples':native['traceFrames'],'nativeAdapterConsoleErrors':len(native['errors'])},
 'protectedEntries':build['protectedEntries'],'frontAssetPreserved':sha(R/'assets/city/vertical/train/train_front_lod0.glb')=='8e96df9363e64d3da2510ff62f1bfcc02e50cd9d28cdf7363df4f76823714933',
 'remaining':['Blender structural support continuity around the entire new loop; current free spans are not certified.',
 'Connected safe station platform/access, gap protection, functional physical carriage support/collision and boarding if admitted; currently not boardable.',
 'Fused original front bogies/doors remain rigid; passenger cars alone have articulated parts.',
 'Rework and sweep aerial traffic envelopes; add appropriate pedestrian/ambient destination activity.',
 'All retained route, hero, power, mission and encounter scenarios on the final integrated revision.',
 'Nine previously unmeasured advanced movement-edge timings.',
 'Matched Blender/browser reference camera renders, architecture/lighting/HUD refinement.',
 'At least 60s matched active baseline/candidate performance with CPU/render/GPU distinctions and full release checks.'],
 'fullGoalComplete':False}
assert report['frontAssetPreserved']
(D/'V02_Transit_Implementation_Evidence.json').write_text(json.dumps(report,indent=2)+'\n');print(report['status'])
