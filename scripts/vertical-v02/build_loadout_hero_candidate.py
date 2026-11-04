"""Loadout hero candidate: a third playable hero.

Builds on the menu-style candidate. Loadout runs on Backspool's controller and moveset (his clips retargeted onto
Loadout's skeleton) with none of Backspool's powers, and wears a cloth cape that can be switched on or off in the
Hero tab. The switcher keeps `active` as the controller ('sightline' or 'backspool') so every existing Backspool
movement, traversal and combat path still applies, and adds `hero` ('sightline', 'backspool' or 'loadout').
Power entry points (Drive/Afterstep contact and release, Threadrail rails and cartridges, Snapback, routes, and the
Echo/Retrace power system) refuse while Loadout is the hero. The L3+LT+RT+R3 chord cycles all three heroes.
"""
from pathlib import Path
import hashlib,json
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
b=json.loads((D/'V02_Menu_Style_Build.json').read_text());assert sha(R/b['entry'])==b['entrySHA256']
source=(R/b['entry']).read_text();text=source;edits=[]
def replace(old,new,label):
 global text
 assert text.count(old)==1,(label,text.count(old));text=text.replace(old,new);edits.append((old,new,label))
GUARD="if(window.loadoutHero?.blocksPowers())return "

# Switcher: hero identity alongside the controller.
replace('<option value="backspool">Backspool</option></select>','<option value="backspool">Backspool</option><option value="loadout">Loadout</option></select>','add Loadout to the hero list')
replace("let active='sightline',busy=false,library=[]","let active='sightline',hero='sightline',busy=false,library=[]",'track the hero separately from the controller')
replace("if(heroChangePromise){await heroChangePromise;if(active!==id)return change(id);return;}","if(heroChangePromise){await heroChangePromise;if(hero!==id)return change(id);return;}",'queued change compares heroes')
replace("if(id!==active&&!window.backspoolPosture.requireStanding())","if(id!==hero&&!window.backspoolPosture.requireStanding())",'standing check compares heroes')
replace("async function performChange(id){window.threadrailGame?.lifecycle('HERO CHANGE');if(busy||id===active)return;","async function performChange(id){window.threadrailGame?.lifecycle('HERO CHANGE');if(busy||id===hero)return;",'no-op change compares heroes')
replace("try{if(!banks.has(active))banks.set(active,capture());if(!banks.has(id))banks.set(id,await buildBackspool());const bank=banks.get(id);",
 "try{if(!banks.has(hero))banks.set(hero,capture());if(id==='loadout'&&!banks.has('backspool'))banks.set('backspool',await buildBackspool());if(!banks.has(id))banks.set(id,id==='loadout'?await window.loadoutHero.buildBank({source:banks.get('backspool'),feet}):await buildBackspool());const bank=banks.get(id),controllerId=id==='loadout'?'backspool':id;",
 'banks per hero; Loadout bank retargeted from Backspool')
replace("animationHold=0;active=id;window.actionWorld?.heroChanged(id);window.combatants?.heroChanged(id);window.backspoolEncounters?.clear();window.backspoolCombat?.reset('HERO CHANGE');window.backspoolPowers?.heroChanged(id);if(id==='backspool'){",
 "animationHold=0;active=controllerId;hero=id;window.actionWorld?.heroChanged(controllerId);window.combatants?.heroChanged(controllerId);window.backspoolEncounters?.clear();window.backspoolCombat?.reset('HERO CHANGE');window.backspoolPowers?.heroChanged(controllerId);window.loadoutHero?.heroChanged(id);if(controllerId==='backspool'){",
 'controller systems see Backspool; hero systems see Loadout')
replace("message.textContent=id==='backspool'?library.length+' library clips · 36 gameplay actions':'';",
 "message.textContent=id==='backspool'?library.length+' library clips · 36 gameplay actions':id==='loadout'?'Loadout · Backspool moveset, no powers':'';",'Loadout status line')
replace("}finally{select.value=active;busy=false;select.disabled=false;$(\"start\").disabled=false;gameActive=playing&&(!courier.resultsOpen||id==='backspool');}",
 "}finally{select.value=hero;busy=false;select.disabled=false;$(\"start\").disabled=false;gameActive=playing&&(!courier.resultsOpen||id==='backspool'||id==='loadout');}",'menu shows the hero')
replace("window.characterState=()=>({active,busy,","window.characterState=()=>({active,hero,busy,",'expose the hero')
replace("if(localStorage.getItem('sightlineCharacter')==='backspool')change('backspool');","{const saved=localStorage.getItem('sightlineCharacter');if(saved==='backspool'||saved==='loadout')change(saved);}",'restore Loadout too')
replace("characterSwitcher.change(characterState().active==='sightline'?'backspool':'sightline')","characterSwitcher.change(window.loadoutHero?window.loadoutHero.nextHero():characterState().active==='sightline'?'backspool':'sightline')",'chord cycles Sightline, Backspool, Loadout')

# Powers: refused while Loadout is the hero.
replace("const enabled=()=>window.characterState?.().active==='backspool'&&!characterState().busy&&!window.backspoolPreviewActive?.();",
 "const enabled=()=>window.characterState?.().active==='backspool'&&!characterState().busy&&!window.backspoolPreviewActive?.()&&!window.loadoutHero?.blocksPowers();",'Echo and Retrace: not for Loadout')
for head,ret,label in [('function contact(action,vector,extra={}){','false','Afterstep contact impulses'),('function release(mode=selectedMode,options={}){','false','Afterstep Drive release'),
                       ('function quickRail(){','false','Threadrail quick rail'),('function attach(id){','false','Threadrail attach'),('function createConnection(a,b){','null','Threadrail connections'),
                       ('function precisionStart(){','false','Threadrail precision cast'),('function snapAction(){','false','Snapback'),('function recordRoute(){','false','route recording'),
                       ('function replayRoute(){',"{ok:false,reason:'LOADOUT · NO POWERS'}",'route replay')]:
 replace(head,head+GUARD+ret+';',label+': not for Loadout')
replace("if(enabled()&&gameActive&&cartridgeVisuals.isReady()){","if(enabled()&&gameActive&&cartridgeVisuals.isReady()&&!window.loadoutHero?.blocksPowers()){",'no Threadrail cartridges on Loadout')

# Cape cloth after every pose pass, before the frame renders.
replace("renderer.setRenderTarget(phaseTarget);renderer.render(scene,camera);","window.loadoutHero?.beforeRender(dt);renderer.setRenderTarget(phaseTarget);renderer.render(scene,camera);",'cape cloth before rendering')

# Scripts: the v2 menu style (knows the third hero) replaces v1 in this build; v1 stays on disk unchanged.
scripts=['scripts/game_mixamo_retarget.js','scripts/game_loadout_cape_cloth.js','scripts/game_v02_loadout_hero.js','scripts/game_v02_menu_style_v2.js']
style='scripts/game_v02_menu_style.css'
tags=''.join('<script src="'+p+'?v='+hashlib.sha256((R/p).read_bytes()+((R/style).read_bytes() if 'menu_style' in p else b'')).hexdigest()[:12]+'"></script>' for p in scripts)
replace('<script src="scripts/game_v02_menu_style.js?v=d01c3048b034"></script>',tags,'load retarget, cape cloth, Loadout hero and the v2 menu style')

inverse=text
for before,after,label in reversed(edits):
 assert inverse.count(after)==1,label;inverse=inverse.replace(after,before)
assert inverse==source
entry='SIGHTLINE_SAINT_MERIDIAN_V02_LOADOUT.html';(R/entry).write_text(text)
assets=['assets/loadout/loadout_caped.fbx','assets/loadout/loadout_cape_rig.json']
report={**b,'status':'BUILT Loadout hero candidate; real-input tests and regressions pending','entry':entry,'entrySHA256':sha(R/entry),'source':b['entry'],'sourceSHA256':b['entrySHA256'],
 'loadoutScripts':{p:sha(R/p) for p in scripts},'loadoutAssets':{p:sha(R/p) for p in assets},'builderSHA256':sha(Path(__file__)),
 'hooks':[{'label':label,'beforeSHA256':hashlib.sha256(before.encode()).hexdigest(),'afterSHA256':hashlib.sha256(after.encode()).hexdigest()}for before,after,label in edits],
 'scope':'Third hero on the Backspool controller without Backspool powers; cape cloth with a Hero-tab switch. Sightline and Backspool paths unchanged except the shared switcher and chord.'}
(D/'V02_Loadout_Hero_Build.json').write_text(json.dumps(report,indent=2)+'\n');print(entry,report['entrySHA256'],len(edits),'inverse-verified hooks')
