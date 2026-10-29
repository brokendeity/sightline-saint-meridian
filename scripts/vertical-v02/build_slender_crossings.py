"""New full-game child; preserve all earlier complete games and component code."""
from pathlib import Path
import hashlib,json
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();read=lambda p:json.loads(p.read_text())
base=read(D/'V02_Rim_Shadow_Build.json');assert sha(R/base['entry'])==base['entrySHA256']=='08312dcd28db92bdf1e065057e2aa9131477832f3ae30d1b900aa5486e1e47ba'
p=read(D/'V02_Slender_Crossings_Package.json');a=read(D/'V02_Slender_Crossings_Authoring.json');assert p['status'].startswith('PASS')
manifest='assets/city/vertical-v02/slender-crossings/runtime/manifest.json';assert sha(R/manifest)==p['manifestSHA256'];assert sha(R/a['master'])==p['masterSHA256']==a['masterSHA256']
room=read(D/'V02_East_Public_Room_Life_Build.json')
old_life=room['worldLifeScript'];new_life='scripts/game_vertical_slender_life_v02.js';before=(R/old_life).read_text()
old_ambient='assets/city/vertical-v02/east-public-emissive/runtime/ambient_routes.json';new_ambient='assets/city/vertical-v02/slender-crossings/runtime/ambient_routes.json'
assert before.count(old_ambient)==before.count(sha(R/old_ambient))==1
life=before.replace(old_ambient,new_ambient).replace(sha(R/old_ambient),sha(R/new_ambient));assert life.replace(new_ambient,old_ambient).replace(sha(R/new_ambient),sha(R/old_ambient))==before
(R/new_life).write_text(life)
old_shadow=base['script'];new_shadow='scripts/game_v02_slender_shadows.js';before=(R/old_shadow).read_text();old_contract=base['contract'];new_contract='assets/city/vertical-v02/slender-crossings/shadow-contract.json'
assert before.count(old_contract)==1;shadow=before.replace(old_contract,new_contract);assert shadow.replace(new_contract,old_contract)==before;(R/new_shadow).write_text(shadow)
source=(R/base['entry']).read_text();old_folder="'east-public-emissive/runtime'";new_folder="'slender-crossings/runtime'";assert source.count(old_folder)==1
old_life_tag=f'<script src="{old_life}?v={sha(R/old_life)[:12]}"></script>';new_life_tag=f'<script src="{new_life}?v={sha(R/new_life)[:12]}"></script>'
old_shadow_tag=f'<script src="{old_shadow}?v={sha(R/old_shadow)[:12]}&amp;contract={sha(R/old_contract)}"></script>';new_shadow_tag=f'<script src="{new_shadow}?v={sha(R/new_shadow)[:12]}&amp;contract={sha(R/new_contract)}"></script>'
assert source.count(old_life_tag)==source.count(old_shadow_tag)==1
text=source.replace(old_folder,new_folder).replace(old_life_tag,new_life_tag).replace(old_shadow_tag,new_shadow_tag)
assert text.replace(new_folder,old_folder).replace(new_life_tag,old_life_tag).replace(new_shadow_tag,old_shadow_tag)==source
entry='SIGHTLINE_SAINT_MERIDIAN_V02_FLARED_CROSSINGS.html';(R/entry).write_text(text)
report={**room,'status':'BUILT full-game flared-crossing candidate; no default promotion',
 'entry':entry,'entrySHA256':sha(R/entry),'source':base['entry'],'sourceSHA256':base['entrySHA256'],
 'manifest':manifest,'manifestSHA256':sha(R/manifest),'master':a['master'],'masterSHA256':a['masterSHA256'],
 'ambientRoutes':new_ambient,'ambientRoutesSHA256':sha(R/new_ambient),'worldLifeScript':new_life,'worldLifeScriptSHA256':sha(R/new_life),'shadowScript':new_shadow,'shadowScriptSHA256':sha(R/new_shadow),
 'shadowContract':new_contract,'shadowContractSHA256':sha(R/new_contract),
 'sourceGateSHA256':sha(D/'V02_Slender_Crossings_Master_Validation.json'),'packageSHA256':sha(D/'V02_Slender_Crossings_Package.json'),
 'scope':'Same complete game with six source-authored flared crossings and explicit physical decomposition. Three immutable loader/path changes only; original hero, animation, power, combat and mission code byte-identical. Real-input, current NPC support, visual and performance acceptance pending. Inherited room bake coupling remains open.'}
(D/'V02_Slender_Crossings_Build.json').write_text(json.dumps(report,indent=2)+'\n');print(entry,report['entrySHA256'])
