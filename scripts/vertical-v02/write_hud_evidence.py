"""Bind bounded HUD evidence to source without promoting broader city gates."""
from pathlib import Path
import hashlib,json
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
read=lambda f:json.loads((D/f).read_text())
build=read('V02_HUD_Candidate_Build.json');tests=read('V02_HUD_Candidate_Tests.json');visual=read('V02_Visual_Iteration_Evidence.json')
assert tests['status'].startswith('PASS') and not tests['errors']
for f,h in tests['hashes'].items():assert sha(R/f)==h,f
for key,f in [('entrySHA256',build['entry']),('sourceSHA256',build['source']),('adapterSHA256','scripts/game_vertical_hud_v02.js'),('cssSHA256','scripts/game_vertical_hud_v02.css')]:assert sha(R/f)==build[key],f
# Exact inverse: source game, assets, physics and animation code remain intact.
s=(R/build['entry']).read_text().replace('<script src="scripts/game_vertical_hud_v02.js"></script></body>','</body>',1).replace('window.verticalAppearance?.present();window.verticalHUD?.present();adaptiveQuality.update(dt);','window.verticalAppearance?.present();adaptiveQuality.update(dt);',1).replace("document.body.classList.contains('touchPlay')?($('v02TouchActions')||$('backspoolCombatHUD')?.querySelector('.combatTouch')):$('touchButtons')","document.body.classList.contains('touchPlay')?$('backspoolCombatHUD')?.querySelector('.combatTouch'):$('touchButtons')",1)
assert s==(R/build['source']).read_text()
protected={**visual['protectedEntries'],visual['entry']:visual['entrySHA256']}
for f,h in protected.items():assert sha(R/f)==h,f
for f in tests['captures']:assert (D/f).is_file(),f
rescuePath=D/'evidence/hud-regressions/V02_Market_Rescue_Public.json'
rescue=json.loads(rescuePath.read_text());assert rescue['status'].startswith('PASS') and not rescue.get('failure') and not rescue['errors'] and len(rescue['results'])==5
assert rescue['entrySHA256']==build['entrySHA256']
for f in ['scripts/game_vertical_hud_v02.js','scripts/game_vertical_hud_v02.css']:assert rescue[f]==sha(R/f)
stock=D/'evidence/stock-hud'
for f in ['shot-0.png','state-0.json']:assert (stock/f).is_file(),f
assert not list(stock.glob('errors-*.json')),'Inspect stock client console errors first'
result={'status':'PASS bounded contextual HUD, native input/pause and responsive milestone; full city NOT COMPLETE','entry':build['entry'],'entrySHA256':build['entrySHA256'],'evidence':{'build':build,'tests':{'file':'V02_HUD_Candidate_Tests.json','sha256':sha(D/'V02_HUD_Candidate_Tests.json'),'groups':len(tests['results'])},'stock':{f:sha(stock/f)for f in ['shot-0.png','state-0.json']}},'rescue':{'file':'evidence/hud-regressions/V02_Market_Rescue_Public.json','sha256':sha(rescuePath),'fullTraceSHA256':sha(rescuePath.parent/rescue['fullTrace']),'secondsToExtraction':rescue['secondsToExtraction'],'totalInputSeconds':rescue['totalInputSeconds'],'scope':rescue['scope']},'captures':tests['captures'],'desktopHUDCoverage':tests['desktop']['coverage'],'portraitHUDCoverage':tests['portrait']['coverage'],'landscapeHUDCoverage':tests['landscape']['coverage'],'sourceVerification':'Exact inverse of three presentation-only edits reproduces accepted visual entry byte for byte. No geometry/physics/combat/animation edits.','protectedEntries':protected,'verifiedScope':['Actual keyboard/pointer pause, held movement/guard clearing and frozen train/world-life clocks','Paused hero selection; Sightline grounded aim remains position-locked','Original audio and help callbacks; animation preview returning to pause','Live public board; native practice activation and strike recording/slot selection','Simulated controller four-button hero chord in both directions','Complete local civilian rescue/one reward/grounded escort/unchanged courier/departure/native contract-tool return','Simulated touch Flow toggle, combat state, jump/landing and pause/resume','Desktop/portrait/landscape layouts, visible native health/resources, unobstructed primary44px touch targets and central playfield'],'limitations':['This is a separate UI candidate, not promotion of the stable game.','Physical controller and physical touchscreen not tested.','Full retained mission/combat/traversal/destruction suite has not been rerun on this combined entry.','One complete local rescue is verified. Full ground approach, other encounters, pursuit and their failure paths need combined-entry regressions.','Final reference-matched architecture/material/lighting acceptance remains incomplete.','Nine advanced route timing fields remain unmeasured.','>=60-second matched active CPU/render/GPU/performance gate remains outstanding.'],'fullGoalComplete':False}
(D/'V02_HUD_Evidence.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({'status':result['status'],'groups':len(tests['results']),'protectedEntries':len(protected)}))
