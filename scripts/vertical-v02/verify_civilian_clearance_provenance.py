"""Independent byte/owner boundaries; source checks do not certify gameplay."""
from pathlib import Path
import hashlib,json,re,subprocess
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();read=lambda f:json.loads((D/f).read_text())
b=read('V02_Civilian_Clearance_Build.json');room=read('V02_Furnished_Public_Rooms_Build.json')
assert sha(R/b['entry'])==b['entrySHA256'];source=(R/room['entry']).read_text();current=(R/b['entry']).read_text()
for sourceKey,newKey in [('scripts/game_vertical_market_v02.js','marketScript'),(room['worldLifeScript'],'worldLifeScript')]:
 sourceTags=re.findall(r'<script[^>]+src="'+re.escape(sourceKey)+r'(?:\?[^\"]*)?"[^>]*></script>',source)
 currentTags=re.findall(r'<script[^>]+src="'+re.escape(b[newKey])+r'(?:\?[^\"]*)?"[^>]*></script>',current)
 assert len(sourceTags)==len(currentTags)==1
 current=current.replace(currentTags[0],sourceTags[0]);assert sha(R/b[newKey])==b[newKey+'SHA256']
assert current==source,'Changes extend beyond two civilian module tags'
for key in ['manifest','master','eastLightingContract','shadowContract','ambientRoutes']:
 assert b[key]==room[key] and sha(R/b[key])==room[key+'SHA256'],key
old=(R/room['worldLifeScript']).read_text();new=(R/b['worldLifeScript']).read_text()
for start,end in [(' async function build()', ' function animate('),(' function animate(', ' // Clearance'),(' function tick(dt)', ' function diagnostics()')]:
 endOld=' function moveVisitors(dt)' if end==' // Clearance' else end
 assert old[old.index(start):old.index(endOld)]==new[new.index(start):new.index(end)],'Non-civilian behavior changed '+start
base='4a01f4b1c2234498abdda6eefb2b267b9d4e196c';files=[f for f in subprocess.check_output(['git','ls-tree','-r','--name-only',base],cwd=R,text=True).splitlines() if f.endswith('.html')];preserved=[]
for file in files:
 original=subprocess.check_output(['git','show',base+':'+file],cwd=R)
 assert (R/file).read_bytes()==original,'Older tracked game overwritten '+file
 preserved.append({'file':file,'sha256':sha(R/file)})
report={'status':'PASS source boundaries, geometry/light identity and older tracked HTML bytes','entry':b['entry'],'entrySHA256':b['entrySHA256'],'parentRoom':room['entry'],'parentRoomSHA256':room['entrySHA256'],'worldLifeScriptSHA256':sha(R/b['worldLifeScript']),'marketScriptSHA256':sha(R/b['marketScript']),'preservationBaseCommit':base,'preservedHTML':preserved,'geometryAndLightingUnchanged':True,'retainedWorldLifeSections':['build/assets/aircraft','animate/support/physicalClear','tick/present/traffic clock'],'scope':'Independent inverse two-tag comparison; no hero/gameplay/timing/geometry/light bytes changed outside the two civilian modules. This does not prove original missions/destruction or broad runtime acceptance.'}
(D/'V02_Civilian_Clearance_Provenance.json').write_text(json.dumps(report,indent=2)+'\n');print(report['status'],len(preserved),'older HTML files')
