"""Fork the current complete maintenance game; retain all previous entrypoints."""
from pathlib import Path
import hashlib,json
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
source=json.loads((D/'V02_Maintenance_Access_Build.json').read_text());old=R/source['entry']
assert sha(old)==source['entrySHA256']
script='scripts/game_vertical_material_response_v02.js';tag='<script src="'+script+'?v='+sha(R/script)[:12]+'"></script>'
text=old.read_text();assert text.count('</body>')==1
target=R/'SIGHTLINE_SAINT_MERIDIAN_V02_MATERIAL_RESPONSE.html';target.write_text(text.replace('</body>',tag+'\n</body>',1))
assert target.read_text().replace(tag+'\n','',1)==text
contract='assets/city/vertical-v02/material-response/materials.json'
report={'status':'CANDIDATE; source/native/gameplay/visual validation pending','entry':target.name,'entrySHA256':sha(target),
 'source':old.name,'sourceSHA256':sha(old),'manifest':source['manifest'],'manifestSHA256':sha(R/source['manifest']),
 'script':script,'scriptSHA256':sha(R/script),'materialContract':contract,'materialContractSHA256':sha(R/contract),
 'scope':'Only one additive material-response script in the complete current game. Architecture payload, camera, physics, controller, animations, powers and missions unchanged.'}
(D/'V02_Material_Response_Build.json').write_text(json.dumps(report,indent=2)+'\n')
print(target.name,report['entrySHA256'])
