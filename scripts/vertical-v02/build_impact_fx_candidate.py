"""Impact FX candidate: surface-aware debris, dust, sparks, fading decals, flash lights, shake and hit-stop.

Builds on the Sightline melee candidate with explicit, inverse-verified hooks
that route every impact source into scripts/game_impact_fx.js: crashes and
building breaches, enemy shots hitting walls, hard landings for both heroes,
and connected melee hits. The old rubble and decal code stays as a fallback
if the module is missing. Damage, carving, collapse and collision are unchanged.
"""
from pathlib import Path
import hashlib,json
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
b=json.loads((D/'V02_Sightline_Melee_Build.json').read_text());assert sha(R/b['entry'])==b['entrySHA256']
source=(R/b['entry']).read_text();text=source;edits=[]
def replace(old,new,label):
 global text
 assert text.count(old)==1,(label,text.count(old));text=text.replace(old,new);edits.append((old,new,label))
module='scripts/game_impact_fx.js';version=sha(R/module)[:12]
replace('<script src="scripts/game_vertical_encounters_v02.js"></script>',
 '<script src="'+module+'?v='+version+'"></script><script src="scripts/game_vertical_encounters_v02.js"></script>','load the impact FX module')
# Effects update on unscaled time; a massive impact briefly scales the whole world (hit-stop).
replace('const combatScale=backspoolCombat.timeScale()*(',
 'window.impactFX?.update(dt);const combatScale=backspoolCombat.timeScale()*(window.impactFX?.timeScale()??1)*(','impact FX update and world hit-stop')
# Crashes and breaches: one surface-aware burst replaces the single decal and grey rubble.
replace(" const decal=new THREE.Mesh(new THREE.PlaneGeometry(radius*4,radius*4),",
 " if(window.impactFX)impactFX.burst(point,normal,{collider:owner||collider,strength:collapsed?2.6:THREE.MathUtils.clamp(speed/45,.3,1.8),source:collapsed?'collapse':'crash',stop:broken||collapsed?.09:0});else{const decal=new THREE.Mesh(new THREE.PlaneGeometry(radius*4,radius*4),",
 'crash and breach bursts')
replace("life:3+Math.random()*2})}\n if(collapsed)showBanner","life:3+Math.random()*2})}}\n if(collapsed)showBanner",'old rubble kept as fallback')
replace("for(let i=destruction.decals.length-1;i>=0;i--)if(bounds.containsPoint(","window.impactFX?.clearInside(bounds);for(let i=destruction.decals.length-1;i>=0;i--)if(bounds.containsPoint(",'collapse clears its decals')
# Enemy shots that strike a wall leave a small burst and a scorch, aligned to the hit face.
replace("if(wall&&(!playerHit||wall.distance<t*segment.length())){disposeObject(p.m);projectiles.splice(i,1);continue}",
 "if(wall&&(!playerHit||wall.distance<t*segment.length())){if(window.impactFX&&wall.face)impactFX.burst(wall.point,wall.face.normal.clone().transformDirection(wall.object.matrixWorld),{collider:wall.object.userData?.collider,strength:.25,source:'shot'});disposeObject(p.m);projectiles.splice(i,1);continue}",
 'enemy shot wall impacts')
# Hard landings punch a crater with a ground dust ring.
replace("cameraShake=hard?.55:.22;showBanner(uncontrolled?'FLAT IMPACT':'HARD LANDING'",
 "cameraShake=hard?.55:.22;window.impactFX?.burst(new THREE.Vector3(s.pos.x,s.pos.y-.42,s.pos.z),new THREE.Vector3(0,1,0),{surface:s.pos.y>1.2?'concrete':'asphalt',strength:uncontrolled?1.5:hard?1.05:.6,source:'landing',stop:uncontrolled?.08:hard?.06:0});showBanner(uncontrolled?'FLAT IMPACT':'HARD LANDING'",
 'Sightline hard landing crater')
replace("const drop=airPeak===null?0:Math.max(0,airPeak-s.pos.y);airPeak=null;",
 "const drop=airPeak===null?0:Math.max(0,airPeak-s.pos.y);airPeak=null;if(drop>4.5)window.impactFX?.burst(new THREE.Vector3(s.pos.x,s.pos.y-.42,s.pos.z),new THREE.Vector3(0,1,0),{surface:s.pos.y>1.2?'concrete':'asphalt',strength:drop>8.5?1.2:.75,source:'landing',stop:drop>8.5?.06:0});",
 'Backspool big-drop landing crater')
# Connected melee hits: sparks and dust; heavy hits flash and hit-stop.
replace("emit(position(t),blocked);","emit(position(t),blocked);window.impactFX?.hit(position(t),position(t).sub(event.origin||s.pos),{heavy:!!a.heavy,blocked});",'melee hit sparks and heavy hit-stop')
inverse=text
for before,after,label in reversed(edits):
 assert inverse.count(after)==1,label;inverse=inverse.replace(after,before)
assert inverse==source
entry='SIGHTLINE_SAINT_MERIDIAN_V02_IMPACT_FX.html';(R/entry).write_text(text)
report={**b,'status':'BUILT impact FX candidate; real-input feel acceptance pending','entry':entry,'entrySHA256':sha(R/entry),'source':b['entry'],'sourceSHA256':b['entrySHA256'],'impactModule':module,'impactModuleSHA256':sha(R/module),'builderSHA256':sha(Path(__file__)),
 'hooks':[{'label':label,'beforeSHA256':hashlib.sha256(before.encode()).hexdigest(),'afterSHA256':hashlib.sha256(after.encode()).hexdigest()}for before,after,label in edits],
 'scope':'Impact presentation only: debris, dust, sparks, decals, flash, shake and hit-stop routed from crashes, shots, landings and melee. Damage, carving, collapse and collision unchanged.'}
(D/'V02_Impact_FX_Build.json').write_text(json.dumps(report,indent=2)+'\n');print(entry,report['entrySHA256'],len(edits),'inverse-verified hooks')
