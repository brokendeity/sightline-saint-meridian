"""Read-only identity/preservation audit; gameplay evidence is separate."""
from pathlib import Path
import hashlib,json,subprocess,re
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';base='eda3e4521e7577ebc90b39fbb63837fd79284ae2'
sha=lambda data:hashlib.sha256(data).hexdigest();b=json.loads((D/'V02_Friendly_Contacts_Build.json').read_text())
paths=subprocess.check_output(['git','ls-tree','-r','--name-only',base],cwd=R,text=True).splitlines()
originals=[p for p in paths if '/' not in p and p.endswith('.html')]
checks=[]
for p in originals:
 old=subprocess.check_output(['git','show',base+':'+p],cwd=R);current=(R/p).read_bytes()
 checks.append({'path':p,'sha256':sha(current),'unchanged':old==current})
assert all(c['unchanged']for c in checks)
assert sha((R/b['entry']).read_bytes())==b['entrySHA256']
assert sha((R/b['source']).read_bytes())==b['sourceSHA256']
tags=re.findall(r'<script[^>]+src="([^"]+)"',(R/b['entry']).read_text())
for key in ['friendlyCore','friendlyScript','friendlyCamera','worldLifeScript','marketScript']:
 assert sha((R/b[key]).read_bytes())==b[key+'SHA256'],key
 assert b[key]+'?v='+b[key+'SHA256'][:12]in tags,key
assert sha((R/'scripts/vertical-v02/build_friendly_contacts_candidate.py').read_bytes())==b['builderSHA256']
for key in ['manifest','master','ambientRoutes','shadowContract','eastLightingContract']:
 assert sha((R/b[key]).read_bytes())==b[key+'SHA256'],key
for p in ['scripts/game_v02_market_clearance.js','scripts/game_v02_visitor_clearance.js','development/vertical-city-v02/V02_Current_Candidate_Status.json']:
 assert subprocess.check_output(['git','show',base+':'+p],cwd=R)==(R/p).read_bytes(),p
result={'status':'PASS source/module identities and previous root HTML preservation; not gameplay acceptance','base':base,'entry':b['entry'],'entrySHA256':b['entrySHA256'],'originalHTML':checks,'geometryAndLightingManifestSHA256':b['manifestSHA256'],'blenderMasterSHA256':b['masterSHA256'],'inverseVerifiedBuilderHooks':b['hooks'],'scope':'Previous build files, published civilian modules, default selector, furnished geometry/lighting and source Blender identities preserved. Remote refs and full game behavior require their separate checks.'}
(D/'V02_Friendly_Contacts_Preservation.json').write_text(json.dumps(result,indent=2)+'\n');print(result['status'],len(checks),'oldHTML',len(b['hooks']),'hooks')
