"""Derive a UI-only candidate from the hash-bound visual milestone."""
from pathlib import Path
import hashlib,json
R=Path(__file__).resolve().parents[2]
D=R/'development/vertical-city-v02'
source=R/'SIGHTLINE_SAINT_MERIDIAN_V02_VISUAL_CANDIDATE.html'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
assert sha(source)==json.loads((D/'V02_Visual_Candidate_Build.json').read_text())['entrySHA256']
s=source.read_text()
a="document.body.classList.contains('touchPlay')?$('backspoolCombatHUD')?.querySelector('.combatTouch'):$('touchButtons')"
b="document.body.classList.contains('touchPlay')?($('v02TouchActions')||$('backspoolCombatHUD')?.querySelector('.combatTouch')):$('touchButtons')"
assert s.count(a)==1
s=s.replace(a,b,1)
a='window.verticalAppearance?.present();adaptiveQuality.update(dt);'
assert s.count(a)==1
s=s.replace(a,'window.verticalAppearance?.present();window.verticalHUD?.present();adaptiveQuality.update(dt);',1)
s=s.replace('</body>','<script src="scripts/game_vertical_hud_v02.js"></script></body>',1)
entry=R/'SIGHTLINE_SAINT_MERIDIAN_V02_HUD_CANDIDATE.html'
entry.write_text(s)
report={'status':'UI CANDIDATE — interaction and responsive acceptance pending','source':source.name,'sourceSHA256':sha(source),'entry':entry.name,'entrySHA256':sha(entry),'adapterSHA256':sha(R/'scripts/game_vertical_hud_v02.js'),'cssSHA256':sha(R/'scripts/game_vertical_hud_v02.css'),'boundedChanges':['Threadrail touch host prefers new action deck','One presentation callback after native UI owners','Load UI adapter'],'geometryPhysicsCombatAnimationChanged':False}
(D/'V02_HUD_Candidate_Build.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report))
