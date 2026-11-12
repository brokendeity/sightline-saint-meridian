"""V02 gameplay-fixes candidate, built on the stylized atmosphere build.

Fixes found by the 2026-11-05 real-input bug sweep (details in scripts/game_v02_gameplay_fixes.js and
development/vertical-city-v02/V02_GAMEPLAY_FIXES.md):
 1. Threadrail floor stall: Backspool stuck in the grind pose at 0 m/s on a cable lying on the ground.
 2. Off-screen objective marker drawn over the speed readout.
 3. Controls guide listed Sightline's keys for every hero.
Three inverse-verified hooks plus one new module. No existing module or build is modified.
"""
from pathlib import Path
import hashlib,json
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
b=json.loads((D/'V02_Stylized_Atmosphere_Build.json').read_text());assert sha(R/b['entry'])==b['entrySHA256'],'source build changed'
source=(R/b['entry']).read_text();text=source;edits=[]
module='scripts/game_v02_gameplay_fixes.js';moduleSHA=sha(R/module)
def replace(old,new,label):
 global text
 assert text.count(old)==1,(label,text.count(old));text=text.replace(old,new);edits.append((old,new,label))
replace('function updatePlayer(dt,realDt=dt){if(threadrailGame.tick(dt,realDt))return;',
 'function updatePlayer(dt,realDt=dt){window.v02GameplayFixes?.beforePlayer(dt);if(threadrailGame.tick(dt,realDt))return;','Threadrail floor-stall check before the movement owner runs')
replace('updatePresentation(dt);window.actionWorld?.present();',
 'updatePresentation(dt);window.v02GameplayFixes?.afterPresentation();window.actionWorld?.present();','objective marker kept clear of HUD panels')
tag='<script src="scripts/game_v02_friendly_camera.js?v=f31df819a528"></script>'
replace(tag,tag+'\n<script src="'+module+'?v='+moduleSHA[:12]+'"></script>','load the gameplay-fixes module')
inverse=text
for before,after,label in reversed(edits):
 assert inverse.count(after)==1,label;inverse=inverse.replace(after,before)
assert inverse==source
entry='SIGHTLINE_SAINT_MERIDIAN_V02_GAMEPLAY_FIXES.html'
(R/entry).write_text(text)
report={**b,'status':'BUILT gameplay-fixes candidate; see V02_GAMEPLAY_FIXES.md for real-input evidence','entry':entry,'entrySHA256':sha(R/entry),'source':b['entry'],'sourceSHA256':b['entrySHA256'],
 'builderSHA256':sha(Path(__file__)),'fixesModule':module,'fixesModuleSHA256':moduleSHA,
 'hooks':[{'label':label,'beforeSHA256':hashlib.sha256(before.encode()).hexdigest(),'afterSHA256':hashlib.sha256(after.encode()).hexdigest()}for before,after,label in edits],
 'scope':'Stylized atmosphere build plus three gameplay fixes: Threadrail floor-stall dismount, objective marker HUD clearance, hero-aware controls guide. Everything else unchanged.'}
(D/'V02_Gameplay_Fixes_Build.json').write_text(json.dumps(report,indent=2)+'\n');print(entry,report['entrySHA256'],len(edits),'inverse-verified hooks')
