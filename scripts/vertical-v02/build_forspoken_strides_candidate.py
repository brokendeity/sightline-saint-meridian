"""Forspoken motion v17 candidate: ground starts, stops and 180-degree turns.

Builds on the v16 Forspoken motion candidate with explicit, inverse-verified
hooks. Physics is unchanged: the clips only dress the existing ground
acceleration, braking and reversal. Turn roles carry baked root yaw, so the
facing snaps to the new heading when one starts.
"""
from pathlib import Path
import hashlib,json
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
b=json.loads((D/'V02_Forspoken_Motion_Build.json').read_text());assert sha(R/b['entry'])==b['entrySHA256']
source=(R/b['entry']).read_text();text=source;edits=[]
def replace(old,new,label):
 global text
 assert text.count(old)==1,(label,text.count(old));text=text.replace(old,new);edits.append((old,new,label))
manifest='assets/backspool/traversal-forspoken-v17-roles.json'
replace('window.backspoolForspokenV16Roles=motionV16;',
 "window.backspoolForspokenV16Roles=motionV16;const motionV17=await unpack('"+manifest+"');const v17Roles=new Set(motionV17.roles.map(r=>r.role));flowManifest.roles=flowManifest.roles.filter(r=>!v17Roles.has(r.role));flowManifest.roles.push(...motionV17.roles);window.backspoolForspokenV17Roles=motionV17;",
 'v17 ground stride roles load after v16')
# Backspool stops dead on release and swings its velocity round on reversal,
# so stops and turns read last frame's speed and heading. Starts need .3s
# without input; turns trigger when input opposes travel by over 137 degrees.
# Physics turns the body before animation runs, so turn-starts read last yaw.
stride=("let stride=null,strideIdle=9,strideClock=0,strideLast=null;function strideAnimate(){"
 "const dt=Math.max(0,localClock-strideClock);strideClock=localClock;const mi=getMoveInput(),moving=mi.mag>.08,speed=Math.hypot(s.vel.x,s.vel.z),last=dt<.1?strideLast:null;strideLast={speed,yaw:s.yaw,heading:speed>.3?Math.atan2(-s.vel.x,-s.vel.z):null};"
 "if(!s.onGround||s.mode!==P.GROUND||inputAiming()||backspoolCombat.activeAction()||window.backspoolTraversal?.state().pose||window.backspoolLadders?.active()){stride=null;strideLast=null;strideIdle=moving?0:strideIdle+dt;return false;}"
 "const dir=moving?getCameraRelativeMoveVector(mi):null,heading=dir&&dir.lengthSq()>1e-4?Math.atan2(-dir.x,-dir.z):null;"
 "if(stride){const age=localClock-stride.began;if(age>=stride.duration||(stride.kind==='stop'?moving&&age>.12:!moving))stride=null;else return playSource(stride.role,age,false,.1);}"
 "let role=null,kind=null;"
 "if(heading!==null){if(strideIdle>.3&&speed<1.5){kind='start';role=Math.abs(angleDelta(last?.yaw??s.yaw,heading))>2.4?'moveStartTurn':inputSprinting()?'moveStartFast':'moveStart';}"
 "else if(last?.heading!=null&&last.speed>3.5&&Math.abs(angleDelta(last.heading,heading))>2.4){kind='turn';role=last.speed>11?'moveTurnFast':'moveTurn';}}"
 "else if(!moving&&strideIdle===0&&last?.speed>3.5){kind='stop';role=last.speed>11?'moveStopFast':last.speed>6?'moveStop':'moveStopWalk';}"
 "strideIdle=moving?0:strideIdle+dt;if(!role)return false;"
 "const spec=window.backspoolFlowRoles?.roles.find(r=>r.role===role);if(!spec)return false;"
 # Baked turn clips start facing the old heading and end at zero yaw; a
 # crossfade would blend poses 180 degrees apart, so turns cut in.
 "const turn=['moveStartTurn','moveTurn','moveTurnFast'].includes(role);if(turn)s.yaw=heading;"
 "stride={role,kind,began:localClock,duration:((spec.end??spec.duration)-(spec.start||0))/(spec.playbackRate||1)};return playSource(role,0,false,turn?0:.1);}")
replace('let airPeak=null;function markLanding(){','let airPeak=null;'+stride+'function markLanding(){','ground stride selection')
replace("landing=null;}\n  return false;\n }\n function landingApproach(){",
 "landing=null;}\n  return strideAnimate();\n }\n function landingApproach(){",
 'ground stride plays once landings and actions are done')
replace('const api={tail:','const api={stride:()=>stride&&{...stride},tail:','stride state for checks')
inverse=text
for before,after,label in reversed(edits):
 assert inverse.count(after)==1,label;inverse=inverse.replace(after,before)
assert inverse==source
entry='SIGHTLINE_SAINT_MERIDIAN_V02_FORSPOKEN_STRIDES.html';(R/entry).write_text(text)
report={**b,'status':'BUILT Forspoken motion v17 candidate; real-input traversal acceptance pending','entry':entry,'entrySHA256':sha(R/entry),'source':b['entry'],'sourceSHA256':b['entrySHA256'],'strideManifest':manifest,'strideManifestSHA256':sha(R/manifest),'builderSHA256':sha(Path(__file__)),
 'hooks':[{'label':label,'beforeSHA256':hashlib.sha256(before.encode()).hexdigest(),'afterSHA256':hashlib.sha256(after.encode()).hexdigest()}for before,after,label in edits],
 'scope':'Ground start, stop and 180-degree turn source clips over unchanged ground physics. Turns snap facing to the new heading. Collision, controls and every other role unchanged.'}
(D/'V02_Forspoken_Strides_Build.json').write_text(json.dumps(report,indent=2)+'\n');print(entry,report['entrySHA256'],len(edits),'inverse-verified hooks')
