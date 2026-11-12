"""Loadout Runner candidate without Afterstep VFX on Loadout.

Builds on the Loadout Runner-moves candidate. The Afterstep exhaust (cyan/violet glass shards) and the movement
afterimages already switch off for any hero other than Backspool, but the per-frame update passed hero:'backspool'
unconditionally, so Loadout (who runs on Backspool's controller) showed both. Two hooks pass the real hero instead.
Backspool and Sightline are unchanged.
"""
from pathlib import Path
import hashlib,json
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
b=json.loads((D/'V02_Loadout_Runner_Build.json').read_text());assert sha(R/b['entry'])==b['entrySHA256']
source=(R/b['entry']).read_text();text=source;edits=[]
def replace(old,new,label):
 global text
 assert text.count(old)==1,(label,text.count(old));text=text.replace(old,new);edits.append((old,new,label))
hero="(window.characterState?.().hero==='loadout'?'loadout':'backspool')"
replace("model,hero:'backspool',active:true,velocity:plain(s.vel)","model,hero:"+hero+",active:true,velocity:plain(s.vel)",'Afterstep exhaust shards: real hero, off for Loadout')
replace("model,hero:'backspool',active:true})","model,hero:"+hero+",active:true})",'movement afterimages: real hero, off for Loadout')
inverse=text
for before,after,label in reversed(edits):
 assert inverse.count(after)==1,label;inverse=inverse.replace(after,before)
assert inverse==source
entry='SIGHTLINE_SAINT_MERIDIAN_V02_LOADOUT_RUNNER_NO_AFTERSTEP.html';(R/entry).write_text(text)
report={**b,'status':'BUILT Loadout Runner candidate without Afterstep VFX on Loadout; real-input tests pending','entry':entry,'entrySHA256':sha(R/entry),'source':b['entry'],'sourceSHA256':b['entrySHA256'],'builderSHA256':sha(Path(__file__)),
 'hooks':[{'label':label,'beforeSHA256':hashlib.sha256(before.encode()).hexdigest(),'afterSHA256':hashlib.sha256(after.encode()).hexdigest()}for before,after,label in edits],
 'scope':'Loadout Runner build; the Afterstep exhaust shards and movement afterimages are off while Loadout is the hero. Backspool and Sightline unchanged.'}
(D/'V02_Loadout_Runner_No_Afterstep_Build.json').write_text(json.dumps(report,indent=2)+'\n');print(entry,report['entrySHA256'],len(edits),'inverse-verified hooks')
