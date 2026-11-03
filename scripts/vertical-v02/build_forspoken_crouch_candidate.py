"""Forspoken motion v20 candidate: crouch down/up and crouch-walk start/stop.

Builds on the v19 air candidate with explicit, inverse-verified hooks.
Posture rules and crouch speeds are unchanged; transitions only dress them.
"""
from pathlib import Path
import hashlib,json
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
b=json.loads((D/'V02_Forspoken_Air_Build.json').read_text());assert sha(R/b['entry'])==b['entrySHA256']
source=(R/b['entry']).read_text();text=source;edits=[]
def replace(old,new,label):
 global text
 assert text.count(old)==1,(label,text.count(old));text=text.replace(old,new);edits.append((old,new,label))
manifest='assets/backspool/traversal-forspoken-v20-roles.json'
replace('window.backspoolForspokenV19Roles=motionV19;',
 "window.backspoolForspokenV19Roles=motionV19;const motionV20=await unpack('"+manifest+"');const v20Roles=new Set(motionV20.roles.map(r=>r.role));flowManifest.roles=flowManifest.roles.filter(r=>!v20Roles.has(r.role));flowManifest.roles.push(...motionV20.roles);window.backspoolForspokenV20Roles=motionV20;",
 'v20 crouch roles load after v19')
# A transition starts on a posture or movement edge and gives way when the
# player does something else: moving cancels down/stop, stopping cancels a
# start, and moving off cancels standing up after .15s.
shift=("let crouchClock=0,wasCrouched=false,crouchMoving=false,crouchShift=null;function crouchShiftAnimate(){"
 "const on=active()&&s.onGround,moving=on&&getRawMoveInput().mag>.08;"
 "if(!s.onGround||inputAiming()||window.backspoolPowers?.isRetracing()||window.backspoolPreviewActive?.()||window.backspoolCombat?.staggered()||window.backspoolCombat?.activeAction()){crouchShift=null;wasCrouched=on;crouchMoving=moving;return null;}"
 "let role=null;if(on&&!wasCrouched)role='crouchDown';else if(!on&&wasCrouched&&window.characterState?.().active==='backspool')role='crouchUp';else if(on&&moving&&!crouchMoving)role='crouchStart';else if(on&&!moving&&crouchMoving)role='crouchStop';"
 "wasCrouched=on;crouchMoving=moving;"
 "if(role){const spec=window.backspoolFlowRoles?.roles.find(r=>r.role===role);crouchShift=spec?{role,began:crouchClock,duration:((spec.end??spec.duration)-(spec.start||0))/(spec.playbackRate||1)}:null;}"
 "if(!crouchShift)return null;const age=crouchClock-crouchShift.began,input=getRawMoveInput().mag>.08;"
 "if(age>=crouchShift.duration||(crouchShift.role==='crouchUp'?on||input&&age>.15:!on||(crouchShift.role==='crouchStart'?!input:input))){crouchShift=null;return null;}"
 "return window.backspoolFlow.playSource(crouchShift.role,age,false,.1);}")
replace(' let velocity=new THREE.Vector3(),locomotion=null;',' let velocity=new THREE.Vector3(),locomotion=null;'+shift,'crouch transition selection')
replace('function tick(dt){if(gameActive)controller.update(dt);if(!active()){velocity.set(0,0,0);return;}',
 'function tick(dt){if(gameActive){controller.update(dt);crouchClock+=dt;}if(!active()){velocity.set(0,0,0);return;}',
 'posture clock for transitions')
replace('function animate(){locomotion=null;if(active()&&window.backspoolCombat?.staggered()&&requireStanding())return false;',
 'function animate(){locomotion=null;if(active()&&window.backspoolCombat?.staggered()&&requireStanding())return false;const shifted=crouchShiftAnimate();if(shifted!==null)return shifted;',
 'transitions play before the crouch loops')
replace('const api={active,toggle,','const api={shift:()=>crouchShift&&{...crouchShift},active,toggle,','transition state for checks')
inverse=text
for before,after,label in reversed(edits):
 assert inverse.count(after)==1,label;inverse=inverse.replace(after,before)
assert inverse==source
entry='SIGHTLINE_SAINT_MERIDIAN_V02_FORSPOKEN_CROUCH.html';(R/entry).write_text(text)
report={**b,'status':'BUILT Forspoken motion v20 candidate; real-input traversal acceptance pending','entry':entry,'entrySHA256':sha(R/entry),'source':b['entry'],'sourceSHA256':b['entrySHA256'],'crouchManifest':manifest,'crouchManifestSHA256':sha(R/manifest),'builderSHA256':sha(Path(__file__)),
 'hooks':[{'label':label,'beforeSHA256':hashlib.sha256(before.encode()).hexdigest(),'afterSHA256':hashlib.sha256(after.encode()).hexdigest()}for before,after,label in edits],
 'scope':'Crouch down/up and crouch-walk start/stop clips over unchanged posture rules and crouch speeds. Every other role unchanged.'}
(D/'V02_Forspoken_Crouch_Build.json').write_text(json.dumps(report,indent=2)+'\n');print(entry,report['entrySHA256'],len(edits),'inverse-verified hooks')
