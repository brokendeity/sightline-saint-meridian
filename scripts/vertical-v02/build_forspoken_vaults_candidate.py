"""Forspoken motion v18 candidate: vaults and climbs graded by obstacle height.

Builds on the v17 strides candidate with explicit, inverse-verified hooks.
The traversal controller, its paths and durations are unchanged; the rise
measured when an obstacle is admitted picks which segment dresses the move.
"""
from pathlib import Path
import hashlib,json
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
b=json.loads((D/'V02_Forspoken_Strides_Build.json').read_text());assert sha(R/b['entry'])==b['entrySHA256']
source=(R/b['entry']).read_text();text=source;edits=[]
def replace(old,new,label):
 global text
 assert text.count(old)==1,(label,text.count(old));text=text.replace(old,new);edits.append((old,new,label))
manifest='assets/backspool/traversal-forspoken-v18-segments.json'
replace("sourceManifest=await unpack('assets/backspool/traversal-source-segments.json');",
 "sourceManifest=await unpack('assets/backspool/traversal-source-segments.json');const vaultsV18=await unpack('"+manifest+"');sourceManifest.roles.push(...vaultsV18.roles);window.backspoolForspokenV18Segments=vaultsV18;",
 'v18 segments prepared beside the committed vault')
# Rise is obstacle height above the feet: under 1 m keeps the 0.8 m vault;
# climbs use the vault-up clip nearest the ledge height.
replace('let frame=null,motion=null,pose=null,completed=0,locomotion=null;',
 "let frame=null,motion=null,pose=null,completed=0,locomotion=null,lastRise=null,poseSpec=null;function segmentFor(kind,rise){const seg=window.backspoolTraversalSegments||{};if(kind==='vault')return rise>1&&seg.vaultHigh?seg.vaultHigh:seg.vault||null;if(kind==='climb')return seg[rise<1?'climbLow':rise<1.4?'climbMid':'climbHigh']||null;return seg[kind]||null;}",
 'segment selection by admitted rise')
replace('const box=hit.collider.box,top=box.max.y+.42,rise=top-start.y;if(rise<.25||rise>cfg.maxClimbRise)return null;',
 'const box=hit.collider.box,top=box.max.y+.42,rise=top-start.y;if(rise<.25||rise>cfg.maxClimbRise)return null;lastRise=rise;',
 'record the rise of the last admitted obstacle')
replace('setMode(motion.landed?P.GROUND:P.AIR);pose=motion;',
 'setMode(motion.landed?P.GROUND:P.AIR);if(!pose)poseSpec=segmentFor(motion.kind,lastRise);pose=motion;',
 'pick the segment once when a vault or climb begins')
replace("if(pose?.kind==='climb')return window.backspoolFlow.playSource('mantle',pose.phase*1.599,false);if(!pose||context(inputAiming()).locked)return false;const entry=window.backspoolTraversalSegments?.[pose.kind];",
 "if(pose?.kind==='climb'&&!poseSpec)return window.backspoolFlow.playSource('mantle',pose.phase*1.599,false);if(!pose||context(inputAiming()).locked)return false;const entry=poseSpec||window.backspoolTraversalSegments?.[pose.kind];",
 'climbs play their graded segment; mantle stays as fallback')
replace("if(pose?.kind==='climb'){window.backspoolFlow?.anchor();return;}if(!pose)return;const spec=window.backspoolTraversalSegments?.[pose.kind];",
 "if(pose?.kind==='climb'&&!poseSpec){window.backspoolFlow?.anchor();return;}if(!pose)return;const spec=poseSpec||window.backspoolTraversalSegments?.[pose.kind];",
 'graded segments use their own measured foot anchor')
replace("state:()=>({...controller.state(),completed,locomotion,pose:pose?{kind:pose.kind,phase:pose.phase}:null,",
 "state:()=>({...controller.state(),completed,locomotion,pose:pose?{kind:pose.kind,phase:pose.phase,segment:poseSpec?.role||null,rise:lastRise}:null,",
 'segment and rise for checks')
inverse=text
for before,after,label in reversed(edits):
 assert inverse.count(after)==1,label;inverse=inverse.replace(after,before)
assert inverse==source
entry='SIGHTLINE_SAINT_MERIDIAN_V02_FORSPOKEN_VAULTS.html';(R/entry).write_text(text)
report={**b,'status':'BUILT Forspoken motion v18 candidate; real-input traversal acceptance pending','entry':entry,'entrySHA256':sha(R/entry),'source':b['entry'],'sourceSHA256':b['entrySHA256'],'segmentManifest':manifest,'segmentManifestSHA256':sha(R/manifest),'builderSHA256':sha(Path(__file__)),
 'hooks':[{'label':label,'beforeSHA256':hashlib.sha256(before.encode()).hexdigest(),'afterSHA256':hashlib.sha256(after.encode()).hexdigest()}for before,after,label in edits],
 'scope':'Height-graded vault and climb segments over the unchanged traversal controller, paths and durations. Every other role unchanged.'}
(D/'V02_Forspoken_Vaults_Build.json').write_text(json.dumps(report,indent=2)+'\n');print(entry,report['entrySHA256'],len(edits),'inverse-verified hooks')
