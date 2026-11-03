"""Forspoken motion v16 candidate: wall kick-offs and height-graded landings.

Builds on the Friendly Contacts checkpoint with explicit, inverse-verified
hooks. Roles load from a separate manifest so each clip stays replaceable.
"""
from pathlib import Path
import hashlib,json
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
b=json.loads((D/'V02_Friendly_Contacts_Build.json').read_text());assert sha(R/b['entry'])==b['entrySHA256']
source=(R/b['entry']).read_text();text=source;edits=[]
def replace(old,new,label):
 global text
 assert text.count(old)==1,(label,text.count(old));text=text.replace(old,new);edits.append((old,new,label))
manifest='assets/backspool/traversal-forspoken-v16-roles.json'
replace('window.backspoolLandingRoles=landingManifest;',
 "window.backspoolLandingRoles=landingManifest;const motionV16=await unpack('"+manifest+"');const v16Roles=new Set(motionV16.roles.map(r=>r.role));flowManifest.roles=flowManifest.roles.filter(r=>!v16Roles.has(r.role));flowManifest.roles.push(...motionV16.roles);window.backspoolForspokenV16Roles=motionV16;",
 'v16 roles replace same-named roles after v15 landings')
# Grade by real fall height from the airborne peak. Sprint flips peak near 3.9m, so heavy starts above 4.5m.
replace('function markLanding(){','let airPeak=null;function markLanding(){','airborne peak for landing grades')
replace("const role=moving?(backwards?'landBack':'landMove'):Math.abs(previousVerticalSpeed)>18?'landHard':'land';",
 "const drop=airPeak===null?0:Math.max(0,airPeak-s.pos.y);airPeak=null;const role=moving?(backwards?'landBack':drop<1?'landSoftMove':drop>4.5?'landMoveFast':'landMove'):drop>8.5?'landHard':drop>4.5?'landHeavy':drop<1?'landSoft':'land';",
 'height-graded landing selection')
replace('if(!s.onGround)landing=null;','if(!s.onGround){landing=null;airPeak=Math.max(airPeak??s.pos.y,s.pos.y);}','track the airborne peak')
replace("if([P.LANDING,P.IMPACT].includes(s.mode)){poseTail=null;return playSource('landHard',s.stateTimer||0,false);}",
 "if([P.LANDING,P.IMPACT].includes(s.mode)){poseTail=null;return playSource(s.mode===P.LANDING&&['landHeavy','landMoveFast'].includes(landing?.role)?landing.role:'landHard',s.stateTimer||0,false);}",
 'native landing state keeps the graded heavy and fast-moving landings')
replace('const api={equipmentReady,',
 "const api={tail:role=>{const spec=window.backspoolFlowRoles?.roles.find(r=>r.role===role);if(!spec)return false;poseTail={role,began:localClock,until:localClock+((spec.end??spec.duration)-(spec.start||0))/(spec.playbackRate||1)};return true;},equipmentReady,",
 'airborne pose tail for actions owned by other controllers')
replace("if(kind&&kind!=='float'){const detached=controller.detach(context());if(detached){s.vel.copy(V(detached.velocity));s.onGround=false;setMode(P.AIR);consumeJump();lastMotion=null;",
 "if(kind&&kind!=='float'){const wasRun=lastMotion?.kind==='wallRun',detached=controller.detach(context());if(detached){s.vel.copy(V(detached.velocity));s.onGround=false;setMode(P.AIR);consumeJump();lastMotion=null;if(['wall','wallApproach','ledge'].includes(kind))window.backspoolFlow?.tail?.(wasRun?'wallFlip':'wallKick');",
 'wall jump-off plays a backflip kick, or a cartwheel when leaving a wall-run')
inverse=text
for before,after,label in reversed(edits):
 assert inverse.count(after)==1,label;inverse=inverse.replace(after,before)
assert inverse==source
entry='SIGHTLINE_SAINT_MERIDIAN_V02_FORSPOKEN_MOTION.html';(R/entry).write_text(text)
report={**b,'status':'BUILT Forspoken motion v16 candidate; real-input traversal acceptance pending','entry':entry,'entrySHA256':sha(R/entry),'source':b['entry'],'sourceSHA256':b['entrySHA256'],'motionManifest':manifest,'motionManifestSHA256':sha(R/manifest),'builderSHA256':sha(Path(__file__)),
 'hooks':[{'label':label,'beforeSHA256':hashlib.sha256(before.encode()).hexdigest(),'afterSHA256':hashlib.sha256(after.encode()).hexdigest()}for before,after,label in edits],
 'scope':'Wall kick-off and wall-run cartwheel source clips and height-graded landings. Physics, collision, controls and every other role unchanged.'}
(D/'V02_Forspoken_Motion_Build.json').write_text(json.dumps(report,indent=2)+'\n');print(entry,report['entrySHA256'],len(edits),'inverse-verified hooks')
