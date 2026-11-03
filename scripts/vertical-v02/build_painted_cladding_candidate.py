"""Experimental source material selector; preserve the proven upper candidate."""
from pathlib import Path
import hashlib,json
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
b=json.loads((D/'V02_Upper_Anchor_Build.json').read_text());c=json.loads((D/'V02_Painted_Cladding_Authoring.json').read_text());parent=R/b['entry'];assert sha(parent)==b['entrySHA256']and sha(R/c['master'])==c['masterSHA256']
script='scripts/game_v02_painted_cladding_study.js';insertion='<script src="'+script+'?v='+sha(R/script)[:12]+'"></script>\n';source=parent.read_text();assert source.count('</body>')==1;text=source.replace('</body>',insertion+'</body>');assert text.replace(insertion,'')==source
entry=R/'SIGHTLINE_SAINT_MERIDIAN_V02_PAINTED_CLADDING_STUDY.html';entry.write_text(text)
r={**b,'entry':str(entry.relative_to(R)),'entrySHA256':sha(entry),'source':b['entry'],'sourceSHA256':b['entrySHA256'],'master':c['master'],'masterSHA256':c['masterSHA256'],'paintedScript':script,'paintedScriptSHA256':sha(R/script),'paintedContract':'assets/city/vertical-v02/painted-cladding-study/materials.json','paintedContractSHA256':sha(R/'assets/city/vertical-v02/painted-cladding-study/materials.json'),'scope':'Unpromoted source-painted reflectance study, not final visual or gameplay acceptance. Only midnight-cladding per-vertex metallic/roughness values change through cloned original geometry; original attributes/lights/gameplay expected unchanged and must be validated.'}
(D/'V02_Painted_Cladding_Build.json').write_text(json.dumps(r,indent=2)+'\n');print('BUILT experimental source material study',r['entrySHA256'])
