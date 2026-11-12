"""V02 flight-ceiling candidate, built on the gameplay-fixes build.

User decision (2026-11-05): a soft ceiling about 60 m above the tallest roof, so chained open-sky rails can no longer
carry Sightline to any altitude. Details in scripts/game_v02_flight_ceiling.js and
development/vertical-city-v02/V02_FLIGHT_CEILING.md.
Three inverse-verified hooks plus one new module. No existing module or build is modified.
"""
from pathlib import Path
import hashlib,json
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
b=json.loads((D/'V02_Gameplay_Fixes_Build.json').read_text());assert sha(R/b['entry'])==b['entrySHA256'],'source build changed'
source=(R/b['entry']).read_text();text=source;edits=[]
module='scripts/game_v02_flight_ceiling.js';moduleSHA=sha(R/module)
def replace(old,new,label):
 global text
 assert text.count(old)==1,(label,text.count(old));text=text.replace(old,new);edits.append((old,new,label))
sky='s.target=raycaster.ray.at(180,new THREE.Vector3());s.targetNormal.copy(raycaster.ray.direction).negate();'
replace(sky,sky+'window.v02FlightCeiling?.clipSkyTarget(raycaster.ray);','open-sky rail endpoint stops climbing at the tallest roof')
fix='window.v02GameplayFixes?.beforePlayer(dt);'
replace(fix,fix+'window.v02FlightCeiling?.beforePlayer(dt);','upward speed bled off above the tallest roof so the climb stops by the ceiling')
tag='<script src="'+b['fixesModule']+'?v='+b['fixesModuleSHA256'][:12]+'"></script>'
replace(tag,tag+'\n<script src="'+module+'?v='+moduleSHA[:12]+'"></script>','load the flight-ceiling module')
inverse=text
for before,after,label in reversed(edits):
 assert inverse.count(after)==1,label;inverse=inverse.replace(after,before)
assert inverse==source
entry='SIGHTLINE_SAINT_MERIDIAN_V02_FLIGHT_CEILING.html'
(R/entry).write_text(text)
report={**b,'status':'BUILT flight-ceiling candidate; see V02_FLIGHT_CEILING.md for real-input evidence','entry':entry,'entrySHA256':sha(R/entry),'source':b['entry'],'sourceSHA256':b['entrySHA256'],
 'builderSHA256':sha(Path(__file__)),'ceilingModule':module,'ceilingModuleSHA256':moduleSHA,
 'hooks':[{'label':label,'beforeSHA256':hashlib.sha256(before.encode()).hexdigest(),'afterSHA256':hashlib.sha256(after.encode()).hexdigest()}for before,after,label in edits],
 'scope':'Gameplay-fixes build plus a soft flight ceiling: open-sky rails stop climbing at the tallest roof, and climbs above it level off by roof + 60 m. Everything else unchanged.'}
(D/'V02_Flight_Ceiling_Build.json').write_text(json.dumps(report,indent=2)+'\n');print(entry,report['entrySHA256'],len(edits),'inverse-verified hooks')
