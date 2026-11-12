"""V02 Sightline body-framing candidate, built on the close-camera build.

User decision (2026-11-05): "Add it for Sightline" -- give Sightline the body framing that keeps Backspool's and
Loadout's whole body in frame at the closer default camera. One inverse-verified edit: body framing v4
(scripts/game_v02_body_framing_v4.js, v3 plus Sightline on foot) is loaded in place of v3. No existing module or build
is modified.
"""
from pathlib import Path
import hashlib,json
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
b=json.loads((D/'V02_Close_Camera_Build.json').read_text());assert sha(R/b['entry'])==b['entrySHA256'],'source build changed'
source=(R/b['entry']).read_text();text=source;edits=[]
def replace(old,new,label):
 global text
 assert text.count(old)==1,(label,text.count(old));text=text.replace(old,new);edits.append((old,new,label))
v3=b['bodyFramingModule'];assert sha(R/v3)==b['bodyFramingModuleSHA256'],'v3 changed'
v4='scripts/game_v02_body_framing_v4.js'
replace('<script src="'+v3+'?v='+b['bodyFramingModuleSHA256'][:12]+'"></script>','<script src="'+v4+'?v='+sha(R/v4)[:12]+'"></script>','body framing v4 (Sightline framed on foot) in place of v3')
assert (R/v4).read_text().count('SIGHTLINE_EASE')>=3
inverse=text
for before,after,label in reversed(edits):
 assert inverse.count(after)==1,label;inverse=inverse.replace(after,before)
assert inverse==source
entry='SIGHTLINE_SAINT_MERIDIAN_V02_SIGHTLINE_FRAMING.html'
(R/entry).write_text(text)
report={**b,'status':'BUILT Sightline body-framing candidate; see V02_CLOSE_CAMERA.md (Sightline framing section) for real-input evidence','entry':entry,'entrySHA256':sha(R/entry),'source':b['entry'],'sourceSHA256':b['entrySHA256'],
 'builderSHA256':sha(Path(__file__)),'bodyFramingModule':v4,'bodyFramingModuleSHA256':sha(R/v4),'replacedBodyFramingModule':v3,'replacedBodyFramingModuleSHA256':b['bodyFramingModuleSHA256'],
 'hooks':[{'label':label,'beforeSHA256':hashlib.sha256(before.encode()).hexdigest(),'afterSHA256':hashlib.sha256(after.encode()).hexdigest()}for before,after,label in edits],
 'scope':'Close-camera build plus Sightline body framing: on foot and not aiming, his whole body is kept in frame like Backspool and Loadout; the bias eases out for aiming and flight, so his aim, rails and flight camera are unchanged. Everything else unchanged.'}
(D/'V02_Sightline_Framing_Build.json').write_text(json.dumps(report,indent=2)+'\n');print(entry,report['entrySHA256'],len(edits),'inverse-verified edit')
