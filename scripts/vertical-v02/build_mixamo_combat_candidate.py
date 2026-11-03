"""Mixamo combat candidate: RT moves rebuilt from Backspool's own licensed Mixamo clips.

Builds on the v20 crouch candidate with one inverse-verified hook that loads
the action-v3 manifest and gameplay pack instead of the action-v2 STORM-derived
ones. Combat logic, move ids, chains, damage and cancel rules are unchanged.
"""
from pathlib import Path
import hashlib,json
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
b=json.loads((D/'V02_Forspoken_Crouch_Build.json').read_text());assert sha(R/b['entry'])==b['entrySHA256']
source=(R/b['entry']).read_text();text=source;edits=[]
def replace(old,new,label):
 global text
 assert text.count(old)==1,(label,text.count(old));text=text.replace(old,new);edits.append((old,new,label))
manifest,pack='assets/backspool/action-v3-manifest.json','assets/backspool/action-v3-gameplay.json.gz'
replace("unpack('assets/backspool/action-v2-gameplay.json.gz'),unpack('assets/backspool/action-v2-manifest.json')",
 "unpack('"+pack+"'),unpack('"+manifest+"')",'RT moves and defence poses load from the Mixamo action-v3 pack')
inverse=text
for before,after,label in reversed(edits):
 assert inverse.count(after)==1,label;inverse=inverse.replace(after,before)
assert inverse==source
entry='SIGHTLINE_SAINT_MERIDIAN_V02_MIXAMO_COMBAT.html';(R/entry).write_text(text)
report={**b,'status':'BUILT Mixamo combat candidate; real-input combat acceptance pending','entry':entry,'entrySHA256':sha(R/entry),'source':b['entry'],'sourceSHA256':b['entrySHA256'],'combatManifest':manifest,'combatManifestSHA256':sha(R/manifest),'combatPack':pack,'combatPackSHA256':sha(R/pack),'builderSHA256':sha(Path(__file__)),
 'hooks':[{'label':label,'beforeSHA256':hashlib.sha256(before.encode()).hexdigest(),'afterSHA256':hashlib.sha256(after.encode()).hexdigest()}for before,after,label in edits],
 'scope':'All 36 RT moves plus stance, guard and dodge poses from native Mixamo clips; combat rules unchanged.'}
(D/'V02_Mixamo_Combat_Build.json').write_text(json.dumps(report,indent=2)+'\n');print(entry,report['entrySHA256'],len(edits),'inverse-verified hook')
