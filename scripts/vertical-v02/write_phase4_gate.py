"""Admit detailed authoring after current essential graybox gameplay evidence.

This gate is deliberately distinct from final V02 acceptance. Transit, final
art, full preservation playthroughs and sustained performance remain required.
"""
from pathlib import Path
import json, hashlib, datetime

R=Path(__file__).resolve().parents[2]
D=R/'development/vertical-city-v02'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
entry=R/'SIGHTLINE_SAINT_MERIDIAN_V02_GRAYBOX.html'
manifest=R/'assets/city/vertical-v02/graybox/manifest.json'
master=D/'blender/SaintMeridian_V02_AAA_Master.blend'
eh,mh=sha(entry),sha(manifest)

def load(name):
    return json.loads((D/name).read_text())

run=load('V02_Regression_Run.json')
assert run['status'].startswith('PASS') and len(run['jobs'])==31
assert all(j['returncode']==0 for j in run['jobs'])
assert run['hashes']['entry']==eh and run['hashes']['manifest']==mh
for key,filename in [('encounters','game_vertical_encounters_v02.js'),('market','game_vertical_market_v02.js'),('pursuit','game_vertical_pursuit_v02.js'),('discovery','game_vertical_discovery_v02.js')]:
    assert run['hashes'][key]==sha(R/'scripts'/filename)

required=['V02_Loop_Validation.json','V02_Public_Route_Validation.json',
 'V02_Public_Route_Run_Validation.json','V02_Public_Roundtrip_Validation.json',
 'V02_Momentum_Full_Zero_Flow.json','V02_Momentum_Full_Banked_Flow.json',
 'V02_Mastery_Full_Zero.json','V02_Mastery_Full_Banked_Brake.json',
 'V02_Mastery_Pilot_Zero_ShortCatch.json','V02_Physical_Rail_Transfer.json',
 'V02_Physical_Rail_Transfer_NoPop.json','V02_Physical_Rail_Transfer_Overshoot.json',
 'V02_Failed_Anchor_Recovery.json','V02_Service_Encounter.json',
 'V02_Service_Lifecycle.json','V02_Service_Replay_Escape.json',
 'V02_Market_Rescue_Public.json','V02_Market_Rescue_South.json',
 'V02_Market_Lifecycle.json','V02_Pursuit_intercept_ground.json',
 'V02_Pursuit_intercept.json','V02_Pursuit_chase.json','V02_Pursuit_escape.json',
 'V02_Pursuit_lifecycle.json','V02_Camera_Orbits.json',
 'V02_Discovery_Tour.json','V02_Discovery_Lifecycle.json',
 'V02_Public_Edge_Safety.json','V02_Station_Circulation.json',
 'V02_Station_North_Entrance.json','V02_C_Stair_Cover_Projectiles.json']
evidence=[]
for name in required:
    report=load(name)
    assert report['entrySHA256']==eh and report['manifestSHA256']==mh,name+' is stale'
    if name=='V02_Loop_Validation.json':
        assert len(report['results'])==3 and all(r['pass']for r in report['results'])and not report['errors']
        status='PASS three complete normal-input loops'
    else:
        assert report['status'].startswith('PASS') and not report['errors'],name+' did not pass'
        status=report['status']
    evidence.append({'file':name,'sha256':sha(D/name),'status':status})
camera=load('V02_Camera_Orbits.json')
assert len(camera['poses'])==56 and all(p['pass'] for p in camera['poses'])
assert camera['fallingRecovery']['landed'] and camera['fallingRecovery']['problemSamples']==0
for name in ['V02_Camera_Trace_Screening.json','V02_Route_Camera_Review.json']:
    report=load(name)
    assert report['status'].startswith('PASS') and report['entrySHA256']==eh and report['manifestSHA256']==mh
assert sha(R/'SIGHTLINE_BACKSPOOL_WHIP_THROW.html')=='fac92161657cb93c8500d6afbc2900748b7cadfc015c019eeddf0366cdf070e4'
assert sha(R/'SIGHTLINE_VERTICAL_MEGACITY_V1.html')=='45d868dcfcd1d0d9a382563bc984ebc657848cd6b2987f21bdf132edcf86d03b'
integrity=load('V02_Graybox_Integrity.json')
assert integrity['originalBuildingsAsReference']==310 and integrity['exportedOriginalBuildingCopies']==0
assert not integrity['originalGeometryConflicts'] and not integrity['coplanarSurfaceOverlaps']
assert integrity['roadEnvelopeConflictCount']==0 and integrity['graphHashMatches'] and integrity['chunkHashesMatch']
milestone=load('V02_Traversal_Validation.json')
assert milestone['entrySHA256']==eh and milestone['manifestSHA256']==mh

report={'status':'PASS essential circulation, recovery and prototype encounters',
 'scope':__doc__.strip(),'timestampUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),
 'entrySHA256':eh,'manifestSHA256':mh,'masterSHA256':sha(master),
 'graphSHA256':sha(D/'V02_Movement_Graph.json'),
 'aggregateSHA256':sha(D/'V02_Traversal_Validation.json'),
 'regressionSHA256':sha(D/'V02_Regression_Run.json'),'regressionCases':31,
 'evidence':evidence,'nextPhase':'5 — detailed Blender architecture in a separate candidate',
 'preservation':'Original WHIP/V1 files and310 original building instances preserved; no original copies exported.',
 'remainingForCompleteGoal':['Detailed landmark/environment architecture and route revalidation',
  'Consistent moving train, supported track/boarding, full transit/traffic envelope clearance and world life',
  'Reference-matched Blender/browser visuals and lighting',
  'Matched baseline/candidate gameplay performance captures >=60seconds',
  'Full retained hero mission/combat/destruction and physical-device release checks'],
 'knownTransitIssue':load('V02_Transit_Envelope_Precheck.json')['status'],
 'fullGoalComplete':False}
(D/'V02_Phase4_Gate.json').write_text(json.dumps(report,indent=2)+'\n')
print(report['status']);print('Detailed Blender authoring may begin; full V02 goal remains incomplete.')
