"""Derive a complete room candidate from the tested facade game, preserving it."""
from pathlib import Path
import hashlib
import json

ROOT=Path(__file__).resolve().parents[2]
DEV=ROOT/'development/vertical-city-v02'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
read=lambda p:json.loads(p.read_text())
parent=read(DEV/'V02_Facade_Cassettes_Build.json')
package=read(DEV/'V02_East_Public_Emissive_Package.json')
author=read(DEV/'V02_East_Public_Emissive_Authoring.json')
assert package['status'].startswith('PASS')
assert sha(ROOT/parent['entry'])==parent['entrySHA256']
assert sha(ROOT/author['master'])==author['masterSHA256']==package['masterSHA256']
manifest='assets/city/vertical-v02/east-public-emissive/runtime/manifest.json'
contract='assets/city/vertical-v02/east-public-emissive/runtime/lighting.json'
script='scripts/game_v02_east_public_emissive.js'
assert sha(ROOT/manifest)==package['manifestSHA256']
assert sha(ROOT/contract)==package['contractSHA256']
source=(ROOT/parent['entry']).read_text()
old="'upper-anchor-mounts/runtime'"
new="'east-public-emissive/runtime'"
assert source.count(old)==1 and source.count('</body>')==1
tag='<script src="'+script+'?v='+sha(ROOT/script)[:12]+'&amp;contract='+sha(ROOT/contract)+'"></script>\n'
text=source.replace(old,new).replace('</body>',tag+'</body>')
assert text.replace(tag,'').replace(new,old)==source
entry='SIGHTLINE_SAINT_MERIDIAN_V02_EAST_PUBLIC_ROOMS_V2.html'
(ROOT/entry).write_text(text)
report={**parent,'entry':entry,'entrySHA256':sha(ROOT/entry),
        'source':parent['entry'],'sourceSHA256':parent['entrySHA256'],
        'manifest':manifest,'manifestSHA256':sha(ROOT/manifest),
        'master':author['master'],'masterSHA256':author['masterSHA256'],
        'eastLightingScript':script,'eastLightingScriptSHA256':sha(ROOT/script),
        'eastLightingContract':contract,'eastLightingContractSHA256':sha(ROOT/contract),
        'scope':'Unpromoted full-game child: source-authored east rooms, six real guard openings and source lighting. '
                'One manifest selector and one appended adapter; existing game, camera, heroes, powers, animation and missions unchanged. '
                'Native source, real-input room/route, visual and performance acceptance pending.'}
(DEV/'V02_East_Public_Emissive_Build.json').write_text(json.dumps(report,indent=2)+'\n')
print('BUILT',entry,report['entrySHA256'])
