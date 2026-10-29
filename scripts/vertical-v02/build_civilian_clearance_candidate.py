"""Two isolated civilian modules; room architecture and all hero code retained."""
from pathlib import Path
import hashlib,json
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();read=lambda p:json.loads(p.read_text())
b=read(D/'V02_Market_Clearance_Build.json');assert sha(R/b['entry'])==b['entrySHA256']
v=read(D/'V02_Visitor_Clearance_Runtime.json');assert sha(R/v['source'])==v['sourceSHA256'] and sha(R/v['output'])==v['outputSHA256']
assert b['worldLifeScript']==v['source'] and b['worldLifeScriptSHA256']==v['sourceSHA256']
source=(R/b['entry']).read_text();before=f'<script src="{v["source"]}?v={v["sourceSHA256"][:12]}"></script>'
if before not in source:before=f'<script src="{v["source"]}"></script>'
assert source.count(before)==1, before
after=f'<script src="{v["output"]}?v={v["outputSHA256"][:12]}"></script>'
text=source.replace(before,after);assert text.replace(after,before)==source
entry='SIGHTLINE_SAINT_MERIDIAN_V02_CIVILIAN_CLEARANCE.html';(R/entry).write_text(text)
report={**b,'status':'BUILT civilian clearance reliability candidate; current acceptance pending','entry':entry,'entrySHA256':sha(R/entry),'source':b['entry'],'sourceSHA256':b['entrySHA256'],'worldLifeScript':v['output'],'worldLifeScriptSHA256':v['outputSHA256'],'sourceWorldLifeScript':v['source'],'sourceWorldLifeScriptSHA256':v['sourceSHA256'],'scope':'Market-resident and ambient-visitor supported clearance only. Inverse byte comparison proves one extra script-tag change from market child. Geometry/light maps, powers, controls, combat and missions preserved. Not a completed V02 release.'}
(D/'V02_Civilian_Clearance_Build.json').write_text(json.dumps(report,indent=2)+'\n');print(entry,report['entrySHA256'])
