"""Sightline melee candidate: Sightline fights on the shared combat engine, in bursts.

Builds on the Mixamo combat candidate. The one proven combat engine now runs
for whichever hero is active: Sightline gets the 'street' move set from
assets/sightline/action-street-manifest.json, RT/LMB strikes only while he is
not aiming (LT+RT still commits a rail), and LB/Q holds his guard. Sparring
opponents cover, counter and reset after a burst. Backspool's flow, powers,
acrobatics, evade and replay lessons stay Backspool-only. Engine edits are
limited to the combat module text; every edit is inverse-verified.
"""
from pathlib import Path
import hashlib,json
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
b=json.loads((D/'V02_Mixamo_Combat_Build.json').read_text());assert sha(R/b['entry'])==b['entrySHA256']
source=(R/b['entry']).read_text();text=source;edits=[]
START,END='backspoolCombat=(()=>{','timeScale:()=>1'
def region(t):
 a=t.find(START);e=t.find(END,a);assert a>0 and e>a and t.count(START)==1;return a,e
def replace(old,new,label):
 global text
 assert text.count(old)==1,(label,text.count(old));text=text.replace(old,new);edits.append(('all',old,new,label,1))
def in_combat(old,new,label,count):
 global text
 a,e=region(text);mod=text[a:e];assert mod.count(old)==count and mod.count(new)==0,(label,mod.count(old));text=text[:a]+mod.replace(old,new)+text[e:];edits.append(('combat',old,new,label,count))
# Hero identity inside the engine.
in_combat("const enabled=()=>window.characterState?.().active==='backspool'&&!characterState().busy&&!characterSwitcher.preview;",
 "const isBackspool=()=>window.characterState?.().active==='backspool',isSightline=()=>window.characterState?.().active==='sightline'&&!!window.sightlineActionManifest,enabled=()=>(isBackspool()||isSightline())&&!characterState().busy&&!characterSwitcher.preview;",
 'engine runs for Backspool or Sightline',1)
in_combat("const manifest=()=>window.backspoolActionManifest||window.backspoolMoveManifest;",
 "const manifest=()=>isSightline()?window.sightlineActionManifest:(window.backspoolActionManifest||window.backspoolMoveManifest);",
 'each hero binds his own move manifest',1)
# Sightline has one style; Backspool keeps flow / impact / counter.
in_combat("function stateDefinition(){return manifest()?.states?.[combatStyle];}",
 "function heroStyle(){return isSightline()?'street':combatStyle;}function stateDefinition(){return manifest()?.states?.[heroStyle()];}",
 'street style while Sightline is active',1)
in_combat("move(combatStyle+","move(heroStyle()+",'move ids follow the active hero style',5)
in_combat("allMoves().filter(x=>x.state===combatStyle)","allMoves().filter(x=>x.state===heroStyle())",'definitions follow the hero style',1)
in_combat("manifest()?.defense?.[combatStyle]","manifest()?.defense?.[heroStyle()]",'defence poses follow the hero style',1)
in_combat("combatState:combatStyle,","combatState:heroStyle(),",'recorded combat state follows the hero style',1)
in_combat("function cycleStyle(){","function cycleStyle(){if(isSightline())return;",'Sightline has no style cycle',1)
# Backspool-only systems never see Sightline's strikes.
in_combat("window.backspoolPowers","(isBackspool()?window.backspoolPowers:null)",'Backspool powers record only Backspool',6)
in_combat("window.backspoolFlow","(isBackspool()?window.backspoolFlow:null)",'Backspool flow only for Backspool',16)
in_combat("function onJump(){syncHero();","function onJump(){if(isSightline())return false;syncHero();",'Sightline jumps stay his own',1)
in_combat("function evade(){","function evade(){if(isSightline())return false;",'Sightline dodge stays his own',1)
# Input: Sightline strikes only while not aiming; his guard is LB / Q, never LT.
in_combat("const held=!!(mouse.l||pad.connected&&button(findGamepad()||{},'fire').value>.1),guard=!!(mouse.r||input.actions.aim)&&",
 "const held=!!(mouse.l||pad.connected&&button(findGamepad()||{},'fire').value>.1)&&!(isSightline()&&inputAiming()),guard=!!(isSightline()?(keys.q||pad.connected&&button(findGamepad()||{},'brace').value>.5):(mouse.r||input.actions.aim))&&",
 'Sightline RT strikes unless aiming; LB / Q guards',1)
# Replay lessons teach Backspool's powers; plain sparring runs for either hero.
replace("function start(lesson=true,options=null){if(!gameActive||!backspoolCombat.enabled())return false;",
 "function start(lesson=true,options=null){if(!gameActive||!backspoolCombat.enabled()||lesson&&characterState().active!=='backspool')return false;",'replay lessons start only for Backspool')
replace("if(!gameActive||!state.active||!backspoolCombat.enabled())return;state.clock+=dt;",
 "if(!gameActive||!state.active||!backspoolCombat.enabled()||state.lesson&&characterState().active!=='backspool')return;state.clock+=dt;",'replay lessons tick only for Backspool')
# Burst rhythm: opponents count the hero's connected hits. Keep pressing on rhythm and the
# chain lands; once he stops after three or more, the opponent covers for .3 s, throws a
# fast .45 s counter, then steps back .5 s to reset the distance.
replace("function reaction(t,event,blocked){if(!t.sparring)return;const broken=event.attack.heavy&&t.guarding;",
 "function reaction(t,event,blocked){if(!t.sparring)return;if(!blocked){t.burstHits=(state.clock-(t.lastHitAt??-9)<.9?t.burstHits||0:0)+1;t.lastHitAt=state.clock;}if(blocked&&(t.phase==='cover'||t.countering&&t.phase==='windup'))return;const broken=event.attack.heavy&&t.guarding;",
 'opponents count bursts; blocked hits do not stop a cover or counter')
replace("t.core.rotation.z=blocked?.08:.22;if(!blocked)t.guarding=false;}",
 "t.core.rotation.z=blocked?.08:.22;if(!blocked){t.guarding=false;t.countering=false;}}",'a landed hit cancels a pending counter')
replace("if(t.stagger>0){t.stagger=Math.max(0,t.stagger-dt);if(!t.stagger){t.phase='recover';t.timer=.55;}continue;}",
 "if(t.burstHits>=3&&state.clock-t.lastHitAt>.55&&t.phase!=='windup'&&t.phase!=='cover'){t.burstHits=0;if(distance<2.9&&(!state.attackerId||state.attackerId===t.id)){t.stagger=0;t.phase='cover';t.timer=.3;t.guarding=true;t.countering=true;state.attackerId=t.id;}}if(t.phase==='cover'){t.guarding=true;if(t.timer<=0){t.guarding=false;t.phase='windup';t.cone.visible=true;t.timer=.45;t.ring.material.opacity=.25;gameAudio.play('dodge');}continue;}if(t.phase==='reset'){if(t.timer>0&&distance>.01)move(t,d.clone().normalize().multiplyScalar(-dt*2.6));else{t.phase='ready';t.timer=.4;}continue;}if(t.stagger>0){t.stagger=Math.max(0,t.stagger-dt);if(!t.stagger){t.phase='recover';t.timer=.55;}continue;}",
 'cover, counter and reset after a burst')
replace("releaseAttacker(t);t.cone.visible=false;if(t.stagger<=0){t.phase='recover';t.timer=1.1;}}continue;}",
 "releaseAttacker(t);t.cone.visible=false;if(t.stagger<=0){t.phase=t.countering?'reset':'recover';t.timer=t.countering?.5:1.1;t.countering=false;}}continue;}",
 'a counter ends in a reset step back')
# Sightline's own ground movement holds still while a strike owns the body.
replace("if(aiming){targetSpeed=0;s.vel.x=s.vel.z=0;}",
 "if(aiming||characterState().active==='sightline'&&backspoolCombat.movementLocked()){targetSpeed=0;s.vel.x=s.vel.z=0;}",'Sightline stands his ground mid-strike')
# Sightline's street clips join his own bank at boot, hips height rescaled to his centimetre rig.
replace("await cityImportPromise;gameReady=true;",
 "await (async()=>{try{const m=await (await fetch('assets/sightline/action-street-manifest.json')).json(),raw=JSON.parse(new TextDecoder().decode(fflate.gunzipSync(new Uint8Array(await (await fetch(m.animationPack)).arrayBuffer())))),idle=clips.idle?.tracks.find(t=>t.name==='mixamorigHips.position'),k=idle?idle.values[1]/m.sourceHipsRestY:1;for(const e of raw){const clip=THREE.AnimationClip.parse(e.clip);clip.uuid=THREE.MathUtils.generateUUID();for(const t of clip.tracks)if(t.name==='mixamorigHips.position')for(let i=1;i<t.values.length;i+=3)t.values[i]*=k;clips[e.id]=cleanClip(clip,e.id);}window.sightlineActionManifest=m;}catch(err){console.error('Sightline street combat unavailable',err);}})();await cityImportPromise;gameReady=true;",
 'load Sightline street clips into his bank')
inverse=text
for kind,old,new,label,count in reversed(edits):
 if kind=='all':assert inverse.count(new)==1,label;inverse=inverse.replace(new,old)
 else:
  a,e=region(inverse);mod=inverse[a:e];assert mod.count(new)==count,label;inverse=inverse[:a]+mod.replace(new,old)+inverse[e:]
assert inverse==source
entry='SIGHTLINE_SAINT_MERIDIAN_V02_SIGHTLINE_MELEE.html';(R/entry).write_text(text)
manifest='assets/sightline/action-street-manifest.json';pack='assets/sightline/action-street-gameplay.json.gz'
report={**b,'status':'BUILT Sightline melee candidate; real-input combat acceptance pending','entry':entry,'entrySHA256':sha(R/entry),'source':b['entry'],'sourceSHA256':b['entrySHA256'],'sightlineManifest':manifest,'sightlineManifestSHA256':sha(R/manifest),'sightlinePack':pack,'sightlinePackSHA256':sha(R/pack),'builderSHA256':sha(Path(__file__)),
 'hooks':[{'label':label,'scope':kind,'count':count,'beforeSHA256':hashlib.sha256(old.encode()).hexdigest(),'afterSHA256':hashlib.sha256(new.encode()).hexdigest()}for kind,old,new,label,count in edits],
 'scope':'Shared combat engine runs for Sightline with a four-hit street move set; RT strikes when not aiming, LB/Q guard; sparring opponents cover, counter and reset after a burst; rails, brace, dodge and Backspool systems unchanged.'}
(D/'V02_Sightline_Melee_Build.json').write_text(json.dumps(report,indent=2)+'\n');print(entry,report['entrySHA256'],len(edits),'inverse-verified edits')
