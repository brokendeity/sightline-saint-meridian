"""Full-game child with source furniture and fresh, matching room lighting."""
from pathlib import Path
import hashlib,json
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();read=lambda p:json.loads(p.read_text())
b=read(D/'V02_Slender_Crossings_Build.json');a=read(D/'V02_Furnished_Public_Lighting_Authoring.json');p=read(D/'V02_Furnished_Public_Lighting_Package.json')
assert p['status'].startswith('PASS') and sha(R/b['entry'])==b['entrySHA256']
assert sha(R/a['master'])==a['masterSHA256']==p['masterSHA256']
manifest='assets/city/vertical-v02/furnished-public-rooms/runtime/manifest.json';contract='assets/city/vertical-v02/furnished-public-rooms/runtime/lighting.json'
assert sha(R/manifest)==p['manifestSHA256'] and sha(R/contract)==p['contractSHA256']
shadow_contract='assets/city/vertical-v02/furnished-public-rooms/shadow-contract.json'
shadow=read(R/b['shadowContract']);shadow.update({'master':a['master'],'masterSHA256':a['masterSHA256'],'parentMaster':b['master'],'parentMasterSHA256':b['masterSHA256']})
(R/shadow_contract).write_text(json.dumps(shadow,indent=2)+'\n')
life='scripts/game_vertical_furnished_room_life_v02.js';ambient='assets/city/vertical-v02/furnished-public-rooms/runtime/ambient_routes.json'
light_script='scripts/game_v02_furnished_public_lighting.js';shadow_script='scripts/game_v02_furnished_room_shadows.js'
def copy_paths(old,new,mapping):
    original=(R/old).read_text();current=original
    for before,after in mapping:
        assert current.count(before)==1,(old,before)
        current=current.replace(before,after)
    undo=current
    for before,after in reversed(mapping):undo=undo.replace(after,before)
    assert undo==original
    (R/new).write_text(current)
copy_paths(b['worldLifeScript'],life,[(b['ambientRoutes'],ambient),(b['ambientRoutesSHA256'],sha(R/ambient))])
copy_paths(b['eastLightingScript'],light_script,[(b['eastLightingContract'],contract)])
copy_paths(b['shadowScript'],shadow_script,[(b['shadowContract'],shadow_contract)])
original=(R/b['entry']).read_text();text=original
mapping=[("'slender-crossings/runtime'","'furnished-public-rooms/runtime'")]
for old,new,old_contract,new_contract in [(b['worldLifeScript'],life,None,None),(b['eastLightingScript'],light_script,b['eastLightingContract'],contract),(b['shadowScript'],shadow_script,b['shadowContract'],shadow_contract)]:
    tail=''if old_contract is None else '&amp;contract='+sha(R/old_contract)
    new_tail=''if new_contract is None else '&amp;contract='+sha(R/new_contract)
    mapping.append((f'<script src="{old}?v={sha(R/old)[:12]}{tail}"></script>',f'<script src="{new}?v={sha(R/new)[:12]}{new_tail}"></script>'))
for before,after in mapping:
    assert text.count(before)==1,before
    text=text.replace(before,after)
undo=text
for before,after in reversed(mapping):undo=undo.replace(after,before)
assert undo==original
entry='SIGHTLINE_SAINT_MERIDIAN_V02_FURNISHED_PUBLIC_ROOMS.html';(R/entry).write_text(text)
report={**b,'status':'BUILT source furniture/current-master room lighting child; native/input/performance acceptance pending',
 'entry':entry,'entrySHA256':sha(R/entry),'source':b['entry'],'sourceSHA256':b['entrySHA256'],
 'master':a['master'],'masterSHA256':a['masterSHA256'],'manifest':manifest,'manifestSHA256':sha(R/manifest),
 'eastLightingScript':light_script,'eastLightingScriptSHA256':sha(R/light_script),'eastLightingContract':contract,'eastLightingContractSHA256':sha(R/contract),
 'ambientRoutes':ambient,'ambientRoutesSHA256':sha(R/ambient),'worldLifeScript':life,'worldLifeScriptSHA256':sha(R/life),
 'shadowScript':shadow_script,'shadowScriptSHA256':sha(R/shadow_script),'shadowContract':shadow_contract,'shadowContractSHA256':sha(R/shadow_contract),
 'sourceGateSHA256':sha(D/'V02_Furnished_Public_Lighting_Master_Validation.json'),'packageSHA256':sha(D/'V02_Furnished_Public_Lighting_Package.json'),
 'scope':'Three source-authored public rooms: six real benches, three route boards/ribbed rear walls and current-geometry fixture UV2/reflections. Other original game/hero/input/encounter bytes remain unchanged. Default and old builds preserved.'}
(D/'V02_Furnished_Public_Rooms_Build.json').write_text(json.dumps(report,indent=2)+'\n');print(entry,report['entrySHA256'])
