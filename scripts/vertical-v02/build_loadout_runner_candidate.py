"""Loadout Runner-moves candidate.

Builds on the Loadout hero candidate. Loadout's jump, fall, landings, rolls, flips, slide, wall run, stride starts
and stops, locomotion loops and combat strikes play clips from the Runner Action Animation Pack (converted onto his
skeleton offline by scripts/characters/loadout/convert_runner_clips.cjs) instead of Backspool's retargeted clips.
Gameplay timing is unchanged; Backspool and Sightline are untouched. Two hooks: the module's script tag, and the cape
cloth v2 script (its final pass ends on the body push, for rolls) in place of v1.
"""
from pathlib import Path
import hashlib,json
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
b=json.loads((D/'V02_Loadout_Hero_Build.json').read_text());assert sha(R/b['entry'])==b['entrySHA256']
source=(R/b['entry']).read_text();text=source;edits=[]
def replace(old,new,label):
 global text
 assert text.count(old)==1,(label,text.count(old));text=text.replace(old,new);edits.append((old,new,label))
hero='scripts/game_v02_loadout_hero.js';runner='scripts/game_v02_loadout_runner_moves.js'
tag='<script src="'+hero+'?v='+hashlib.sha256((R/hero).read_bytes()).hexdigest()[:12]+'"></script>'
replace(tag,tag+'<script src="'+runner+'?v='+sha(R/runner)[:12]+'"></script>','load Loadout Runner moves after the Loadout hero')
cloth='scripts/game_loadout_cape_cloth.js';cloth2='scripts/game_loadout_cape_cloth_v2.js'
replace('<script src="'+cloth+'?v='+sha(R/cloth)[:12]+'"></script>','<script src="'+cloth2+'?v='+sha(R/cloth2)[:12]+'"></script>','cape cloth v2: final pass ends on the body push (rolls)')
inverse=text
for before,after,label in reversed(edits):
 assert inverse.count(after)==1,label;inverse=inverse.replace(after,before)
assert inverse==source
entry='SIGHTLINE_SAINT_MERIDIAN_V02_LOADOUT_RUNNER.html';(R/entry).write_text(text)
assets=['assets/loadout/runner/loadout_runner_roles.json','assets/loadout/runner/loadout_runner_clips.json.gz']
report={**b,'status':'BUILT Loadout Runner-moves candidate; real-input tests and regressions pending','entry':entry,'entrySHA256':sha(R/entry),'source':b['entry'],'sourceSHA256':b['entrySHA256'],
 'runnerScripts':{runner:sha(R/runner),cloth2:sha(R/cloth2)},'runnerAssets':{p:sha(R/p) for p in assets},'builderSHA256':sha(Path(__file__)),
 'hooks':[{'label':label,'beforeSHA256':hashlib.sha256(before.encode()).hexdigest(),'afterSHA256':hashlib.sha256(after.encode()).hexdigest()}for before,after,label in edits],
 'scope':'Loadout plays Runner Action pack clips for flow roles, locomotion and combat strikes, fitted to unchanged gameplay timing. Backspool and Sightline paths unchanged.'}
(D/'V02_Loadout_Runner_Build.json').write_text(json.dumps(report,indent=2)+'\n');print(entry,report['entrySHA256'],len(edits),'inverse-verified hooks')
