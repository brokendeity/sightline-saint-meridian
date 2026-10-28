"""Derive the complete current game with new architecture/material selectors."""
from pathlib import Path
import hashlib,json
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();read=lambda p:json.loads(p.read_text())
prior=read(D/'V02_Material_Response_Build.json');source=R/prior['entry'];assert sha(source)==prior['entrySHA256'];s=source.read_text()
old="(state.pilot?'pilot':'maintenance-access/runtime')";new="(state.pilot?'pilot':'loggia-terraces/runtime')";assert s.count(old)==1
old_script=R/prior['script'];code=old_script.read_text();old_contract='assets/city/vertical-v02/material-response/materials.json';contract='assets/city/vertical-v02/loggia-terraces/materials.json';assert code.count(old_contract)==1
script=R/'scripts/game_vertical_loggia_material_v02.js';script.write_text(code.replace(old_contract,contract,1));a=prior['script']+'?v='+prior['scriptSHA256'][:12];b=str(script.relative_to(R))+'?v='+sha(script)[:12];assert s.count(a)==1
hud_source=R/'scripts/game_vertical_hud_v02.js';hud=R/'scripts/game_vertical_loggia_hud_v02.js';hud_code=hud_source.read_text()
old_order="let primary=false;for(const id of ['v02MarketHUD','v02PursuitHUD','backspoolTrainingHUD','heroContractHUD'])"
new_order="const activeContract=window.actionWorldState?.().contracts.active,contractOwnsSparring=activeContract&&['active','paused','defeat'].includes(activeContract.status)&&activeContract.encounterAttempt===window.backspoolEncounterState?.().attempt;const contextOrder=contractOwnsSparring?['v02MarketHUD','v02PursuitHUD','heroContractHUD','backspoolTrainingHUD']:['v02MarketHUD','v02PursuitHUD','backspoolTrainingHUD','heroContractHUD'];let primary=false;for(const id of contextOrder)"
assert hud_code.count(old_order)==1;hud.write_text(hud_code.replace(old_order,new_order,1).replace("['v02MarketHUD','v02PursuitHUD',", "['v02MarketHUD','v02PursuitHUD','v02EncounterHUD',"))
import re
old_hud=re.search(r'scripts/game_vertical_hud_v02\.js(?:\?v=[^\"]+)?',s).group();new_hud='scripts/game_vertical_loggia_hud_v02.js?v='+sha(hud)[:12]
entry=R/'SIGHTLINE_SAINT_MERIDIAN_V02_LOGGIA_TERRACES.html';entry.write_text(s.replace(old,new,1).replace(a,b,1).replace(old_hud,new_hud,1));assert entry.read_text().replace(new,old,1).replace(b,a,1).replace(new_hud,old_hud,1)==s

manifest='assets/city/vertical-v02/loggia-terraces/runtime/manifest.json'
report={'status':'CANDIDATE; saved-source/export/native/input/visual acceptance pending','entry':entry.name,'entrySHA256':sha(entry),'source':source.name,'sourceSHA256':sha(source),'manifest':manifest,'manifestSHA256':sha(R/manifest),'script':str(script.relative_to(R)),'scriptSHA256':sha(script),'materialContract':contract,'materialContractSHA256':sha(R/contract),'sourceScript':prior['script'],'sourceScriptSHA256':prior['scriptSHA256'],'hudScript':str(hud.relative_to(R)),'hudScriptSHA256':sha(hud),'sourceHUDScript':str(hud_source.relative_to(R)),'sourceHUDScriptSHA256':sha(hud_source),'scope':'Architecture/material selectors and copied HUD priority rule for contract-owned sparring only; camera/control/physics/heroes/powers/mission logic unchanged'}
(D/'V02_Loggia_Terraces_Build.json').write_text(json.dumps(report,indent=2)+'\n');print(entry.name,report['entrySHA256'])
