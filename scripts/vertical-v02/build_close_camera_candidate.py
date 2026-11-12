"""V02 close-camera candidate, built on the flight-ceiling build.

User request (2026-11-05): Sightline's aim-lock camera view becomes the default camera position for every hero.
Details in scripts/game_v02_close_camera.js. Six inverse-verified camera hooks, one new module, and body framing v3
(scripts/game_v02_body_framing_v3.js, v2 with the floor patch removed from the fit) loaded in place of v2. No existing
module or build is modified. Every camera hook reads the module value and falls back to the native number.
"""
from pathlib import Path
import hashlib,json
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
b=json.loads((D/'V02_Flight_Ceiling_Build.json').read_text());assert sha(R/b['entry'])==b['entrySHA256'],'source build changed'
source=(R/b['entry']).read_text();text=source;edits=[]
module='scripts/game_v02_close_camera.js';moduleSHA=sha(R/module)
def replace(old,new,label):
 global text
 assert text.count(old)==1,(label,text.count(old));text=text.replace(old,new);edits.append((old,new,label))
C='window.v02CloseCamera?.'
replace('let desiredFov=56;if(window.backspoolFlow?.acrobatting())','let desiredFov='+C+'fov??56;if(window.backspoolFlow?.acrobatting())','default FOV is the aim-lock FOV')
replace('else if(inputSprinting())desiredFov=60;desiredFov=velocityTunnel.getFov(desiredFov,aiming,transit,speed);',
        'else if(inputSprinting())desiredFov='+C+'sprintFov??60;desiredFov=velocityTunnel.getFov(desiredFov,aiming,transit,speed);','sprint FOV keeps its widening relative to the default')
replace('let distance=4.25,height=.32,shoulder=1.35*cam.shoulder,lookAhead=0,followRate=19;',
        'let distance='+C+'distance??4.25,height='+C+'height??.32,shoulder=('+C+'shoulder??1.35)*cam.shoulder,lookAhead=0,followRate=19;','default framing is the aim-lock framing')
replace('else if(inputSprinting()){distance=4.65;height=.32;lookAhead=.6;followRate=19}',
        'else if(inputSprinting()){distance='+C+'sprintDistance??4.65;height='+C+'height??.32;lookAhead=.6;followRate=19}','sprint keeps its pull-back relative to the default')
replace('getFov(base,aiming,transit,speed){if(reducedMotion.matches)return aiming?48:s.onGround?56:72;',
        'getFov(base,aiming,transit,speed){if(reducedMotion.matches)return aiming?48:s.onGround?('+C+'fov??56):72;','reduced-motion ground FOV is the aim-lock FOV')
replace('camera.position.set(1.35*Math.min(1,camera.aspect/1.4),2.40,4.2364);camera.fov=56;',
        'camera.position.set(1.35*Math.min(1,camera.aspect/1.4),2.40,4.2364);camera.fov=56;'+C+'resetPose();','respawn places the camera at the new default')
tag='<script src="'+b['ceilingModule']+'?v='+b['ceilingModuleSHA256'][:12]+'"></script>'
replace(tag,tag+'\n<script src="'+module+'?v='+moduleSHA[:12]+'"></script>','load the close-camera module')
# Body framing v3 replaces v2 (never both: each wraps actionCamera.tick). v3 is v2 with the floor patch removed from
# the fit, so Backspool and Loadout are not tilted 14.8 degrees down at the closer default camera.
framingV2='scripts/game_v02_body_framing_v2.js';framingV3='scripts/game_v02_body_framing_v3.js'
v2tag='<script src="'+framingV2+'?v='+sha(R/framingV2)[:12]+'"></script>'
replace(v2tag,'<script src="'+framingV3+'?v='+sha(R/framingV3)[:12]+'"></script>','body framing v3 in place of v2 (floor patch no longer forces a downward tilt)')
v3text=(R/framingV3).read_text();v2text=(R/framingV2).read_text()
assert v3text.split('*/\n',1)[1]==v2text.replace('state.groundEnvelope=s.onGround;','state.groundEnvelope=false;'),'v3 must be v2 with exactly one change'
inverse=text
for before,after,label in reversed(edits):
 assert inverse.count(after)==1,label;inverse=inverse.replace(after,before)
assert inverse==source
entry='SIGHTLINE_SAINT_MERIDIAN_V02_CLOSE_CAMERA.html'
(R/entry).write_text(text)
report={**b,'status':'BUILT close-camera candidate; see V02_CLOSE_CAMERA.md for real-input evidence','entry':entry,'entrySHA256':sha(R/entry),'source':b['entry'],'sourceSHA256':b['entrySHA256'],
 'builderSHA256':sha(Path(__file__)),'cameraModule':module,'cameraModuleSHA256':moduleSHA,
 'bodyFramingModule':framingV3,'bodyFramingModuleSHA256':sha(R/framingV3),'replacedBodyFramingModule':framingV2,'replacedBodyFramingModuleSHA256':sha(R/framingV2),
 'hooks':[{'label':label,'beforeSHA256':hashlib.sha256(before.encode()).hexdigest(),'afterSHA256':hashlib.sha256(after.encode()).hexdigest()}for before,after,label in edits],
 'scope':'Flight-ceiling build plus a closer default camera: every hero uses Sightline\'s grounded aim-lock framing (3.25 m, 48 degrees) as the default exploration view; sprint keeps its relative pull-back. Everything else unchanged.'}
(D/'V02_Close_Camera_Build.json').write_text(json.dumps(report,indent=2)+'\n');print(entry,report['entrySHA256'],len(edits),'inverse-verified hooks')
