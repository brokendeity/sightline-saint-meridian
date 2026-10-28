"""Derive the complete current game with new architecture/material selectors."""
from pathlib import Path
import hashlib,json
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();read=lambda p:json.loads(p.read_text())
prior=read(D/'V02_Material_Response_Build.json');source=R/prior['entry'];assert sha(source)==prior['entrySHA256'];s=source.read_text()
old="(state.pilot?'pilot':'maintenance-access/runtime')";new="(state.pilot?'pilot':'loggia-terraces/runtime')";assert s.count(old)==1
old_script=R/prior['script'];code=old_script.read_text();old_contract='assets/city/vertical-v02/material-response/materials.json';contract='assets/city/vertical-v02/loggia-terraces/materials.json';assert code.count(old_contract)==1
script=R/'scripts/game_vertical_loggia_material_v02.js';script.write_text(code.replace(old_contract,contract,1));a=prior['script']+'?v='+prior['scriptSHA256'][:12];b=str(script.relative_to(R))+'?v='+sha(script)[:12];assert s.count(a)==1
entry=R/'SIGHTLINE_SAINT_MERIDIAN_V02_LOGGIA_TERRACES.html';entry.write_text(s.replace(old,new,1).replace(a,b,1));assert entry.read_text().replace(new,old,1).replace(b,a,1)==s
manifest='assets/city/vertical-v02/loggia-terraces/runtime/manifest.json'
report={'status':'CANDIDATE; saved-source/export/native/input/visual acceptance pending','entry':entry.name,'entrySHA256':sha(entry),'source':source.name,'sourceSHA256':sha(source),'manifest':manifest,'manifestSHA256':sha(R/manifest),'script':str(script.relative_to(R)),'scriptSHA256':sha(script),'materialContract':contract,'materialContractSHA256':sha(R/contract),'sourceScript':prior['script'],'sourceScriptSHA256':prior['scriptSHA256'],'scope':'Only architecture manifest and identical material-loader contract path change; camera/control/physics/heroes/powers/missions remain identical'}
(D/'V02_Loggia_Terraces_Build.json').write_text(json.dumps(report,indent=2)+'\n');print(entry.name,report['entrySHA256'])
