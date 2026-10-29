"""One-module gameplay reliability child after the room candidate passes."""
from pathlib import Path
import json,hashlib
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02'
read=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
b=read(D/'V02_Furnished_Public_Rooms_Build.json');gate=read(D/'V02_Furnished_Public_Rooms_Checks.json')
assert gate['status'].startswith('PASS')and gate['entrySHA256']==b['entrySHA256']
assert len(gate['jobs'])==10 and all(j['returncode']==0 for j in gate['jobs'])
for f,h in gate['hashes'].items():assert sha(R/f)==h,f
m=read(D/'V02_Market_Clearance_Runtime.json')
assert sha(R/m['source'])==m['sourceSHA256'] and sha(R/m['output'])==m['outputSHA256']
before=f'<script src="{m["source"]}"></script>'
after=f'<script src="{m["output"]}?v={m["outputSHA256"][:12]}"></script>'
source=(R/b['entry']).read_text();assert source.count(before)==1
text=source.replace(before,after);assert text.replace(after,before)==source
entry='SIGHTLINE_SAINT_MERIDIAN_V02_MARKET_CLEARANCE.html';(R/entry).write_text(text)
report={**b,'status':'BUILT market hero/civilian clearance candidate; real-input/lifecycle validation pending',
 'entry':entry,'entrySHA256':sha(R/entry),'source':b['entry'],'sourceSHA256':b['entrySHA256'],
 'marketScript':m['output'],'marketScriptSHA256':m['outputSHA256'],'sourceMarketScript':m['source'],'sourceMarketScriptSHA256':m['sourceSHA256'],
 'parentRoomChecksSHA256':sha(D/'V02_Furnished_Public_Rooms_Checks.json'),
 'scope':'One isolated friendly-market locomotion module. Existing geometry, light maps, hero controls/powers, rewards and objective entry conditions preserved. NPCs use swept supported steps and yield to the predicted hero path; no teleport or player impulse. Not a completed V02 release.'}
(D/'V02_Market_Clearance_Build.json').write_text(json.dumps(report,indent=2)+'\n');print(entry,report['entrySHA256'])
