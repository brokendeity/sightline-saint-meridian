"""Admit the already terminal current nine-case run without replaying it."""
from pathlib import Path
import hashlib,json
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
b=json.loads((D/'V02_Civilian_Clearance_Build.json').read_text());r=json.loads((D/'V02_Civilian_Clearance_Room_Movement.json').read_text())
assert r['status'].startswith('PASS') and r['entrySHA256']==b['entrySHA256']==sha(R/b['entry'])
assert r['testSHA256']==sha(R/'scripts/vertical-v02/test_civilian_room_movement.cjs')
assert r['manifestSHA256']==b['manifestSHA256']==sha(R/b['manifest'])
for key in ['marketScript','worldLifeScript']:assert sha(R/b[key])==b[key+'SHA256']
assert {(c['view'],c['floor']) for c in r['cases']}=={(v,y) for v in ['desktop','portrait','landscape'] for y in [24,52,84]}
for c in r['cases']:
 assert c['frames']>600 and c['minimumVisitorGap']>=.87 and c['framingFailures']==c['cameraInsideFailures']==0
 for image in c['captures']:assert sha(R/image['file'])==image['sha256']
assert sha(R/r['traces'])==r['tracesSHA256'] and r['errors']==[]
print('PASS admitted terminal nine current room/control cases with matching entry/modules/test/trace/images; no duplicate simulation')
