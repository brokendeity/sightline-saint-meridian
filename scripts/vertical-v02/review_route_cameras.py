"""Summarize real animated-body camera probes from current normal-input routes.
No old traces, direct actor positioning, or centre-only proxies substitute for
these measurements. Visual review and the separately tested orbits still apply.
"""
from pathlib import Path
import json,gzip,hashlib,math
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
eh=sha(R/'SIGHTLINE_SAINT_MERIDIAN_V02_GRAYBOX.html');mh=sha(R/'assets/city/vertical-v02/graybox/manifest.json')
probe_hash=sha(R/'scripts/vertical-v02/route_camera_probe.cjs');results=[]
names=['V02_Momentum_Full_Zero_Flow.json','V02_Momentum_Full_Banked_Flow.json','V02_Mastery_Full_Zero.json','V02_Mastery_Full_Banked_Brake.json','V02_Mastery_Pilot_Zero_ShortCatch.json']
for name in names:
    summary=json.loads((D/name).read_text())
    assert summary['entrySHA256']==eh and summary['manifestSHA256']==mh and summary['status'].startswith('PASS'),name+' needs a current passing input route'
    policy=summary['cameraSamplePolicy'];assert policy['sourceSHA256']==probe_hash
    raw=json.load(gzip.open(D/summary['fullTrace']));samples=[]
    for frame,row in enumerate(raw['trace']):
        if not row.get('cameraProbe'):continue
        speed=math.sqrt(sum(v*v for v in row['v']))
        targets=row['cameraProbe']['targets']
        samples.append({'frame':frame,'simulationSeconds':frame/60,'precision':row['precision'],'position':row['p'],'camera':row['camera'],'speed':speed,'grounded':row['grounded'],'source':row.get('source'),'rail':bool(row['rail']),'head':targets['head'],'hips':targets['hips'],'captureFile':row['cameraProbe'].get('captureFile')})
    assert samples,name+' has no native body/camera samples'
    movement=[s for s in samples if not s['precision'] and (s['speed']>8 or not s['grounded'])]
    assert movement,name+' has no fast/airborne movement samples'
    def hidden(s):return not any(s[key]['framed']and not s[key]['occluded']for key in ['head','hips'])
    bad=[s for s in movement if hidden(s)]
    results.append({'summary':name,'fullTrace':summary['fullTrace'],'traceSHA256':sha(D/summary['fullTrace']),'allSamples':len(samples),'fastOrAirborneNonAimSamples':len(movement),'maximumSpeed':max(s['speed']for s in movement),'neitherBodyPointFramed':sum(not(s['head']['framed']or s['hips']['framed'])for s in movement),'bothBodyPointsOpaqueOccluded':sum(s['head']['occluded']and s['hips']['occluded']for s in movement),'problemSamples':bad})
report={'status':'REVIEW REQUIRED route-camera samples'if any(r['problemSamples']for r in results)else'PASS sampled fast/airborne body visibility geometry',
        'scope':__doc__.strip()+' Actual head/hips at10Hz; non-aim movement above8m/s or airborne. At least one of the two body points must be both framed and unoccluded. This does not certify limb/full-body framing, aim composition, HUD, moving obstacles missing from the native query, between-sample frames or physical devices. Problem samples require context and rendered review, not silent removal.',
        'entrySHA256':eh,'manifestSHA256':mh,'probeSHA256':probe_hash,'routes':results}
(D/'V02_Route_Camera_Review.json').write_text(json.dumps(report,indent=2)+'\n')
print(report['status']);print(json.dumps([{k:r[k]for k in ['summary','allSamples','fastOrAirborneNonAimSamples','maximumSpeed','neitherBodyPointFramed','bothBodyPointsOpaqueOccluded']}for r in results],indent=2))
