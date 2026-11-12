"""Stylized atmosphere candidate: height fog, wet sky-facing surfaces, rain rings and a cinematic grade.

Builds on the Loadout Runner no-Afterstep candidate. One hook loads the new module scripts/game_v02_stylized_atmosphere.js
after three.js and before the game core, so its fog-chunk rewrites are in place before any shader compiles. Wetness and
rain rings are separate overlay meshes (never code inside the lit materials); the grade is appended to phasePost. The
module adapts techniques from Christian Ortiz's MIT-licensed "Stylized Premium Scenes" (attribution in the module).
No geometry, movement, camera, mission or animation code is touched; every part can be switched off with ?stylized=0
or ?stylizedOff=fog,wet,rings,grade.
"""
from pathlib import Path
import hashlib,json
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
b=json.loads((D/'V02_Loadout_Runner_No_Afterstep_Build.json').read_text());assert sha(R/b['entry'])==b['entrySHA256']
module=R/'scripts/game_v02_stylized_atmosphere.js';moduleSHA=sha(module)
source=(R/b['entry']).read_text();text=source;edits=[]
def replace(old,new,label):
 global text
 assert text.count(old)==1,(label,text.count(old));text=text.replace(old,new);edits.append((old,new,label))
core="<script>\nif(!window.THREE)throw new Error('Three.js unavailable');"
replace(core,'<script src="scripts/game_v02_stylized_atmosphere.js?v='+moduleSHA[:12]+'"></script>\n'+core,'stylized atmosphere module before the game core')
inverse=text
for before,after,label in reversed(edits):
 assert inverse.count(after)==1,label;inverse=inverse.replace(after,before)
assert inverse==source
entry='SIGHTLINE_SAINT_MERIDIAN_V02_STYLIZED_ATMOSPHERE.html';(R/entry).write_text(text)
report={**b,'status':'BUILT stylized atmosphere candidate (height fog, wet overlays, rain rings, grade); see V02_STYLIZED_ATMOSPHERE.md for evidence','entry':entry,'entrySHA256':sha(R/entry),'source':b['entry'],'sourceSHA256':b['entrySHA256'],'builderSHA256':sha(Path(__file__)),
 'module':'scripts/game_v02_stylized_atmosphere.js','moduleSHA256':moduleSHA,
 'hooks':[{'label':label,'beforeSHA256':hashlib.sha256(before.encode()).hexdigest(),'afterSHA256':hashlib.sha256(after.encode()).hexdigest()}for before,after,label in edits],
 'attribution':'Techniques adapted from Stylized Premium Scenes by Christian Ortiz (Cortiz), MIT; no assets from that pack are used.',
 'scope':'Visual-only candidate on the Loadout Runner no-Afterstep build. Shared fog chunks rewritten before compile; wet/ring overlay meshes on the largest sky-facing static surfaces (raycast-inert); grade added to the existing phasePost pass; one-time depth-peeled rain-cover map. Gameplay code unchanged.'}
(D/'V02_Stylized_Atmosphere_Build.json').write_text(json.dumps(report,indent=2)+'\n');print(entry,report['entrySHA256'],len(edits),'inverse-verified hooks')
