"""Menu restyle candidate ("Midnight Slash"): a new look for the pause / title menu.

Builds on the no-halo-trucks candidate. One hook loads scripts/game_v02_menu_style.js
after the HUD module; it links scripts/game_v02_menu_style.css last and adds two
decorative, non-interactive layers (the active hero's name, key prompts). Every id,
button, tab and handler stays the one the HUD module owns. Presentation only.
"""
from pathlib import Path
import hashlib,json
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
b=json.loads((D/'V02_No_Halo_Trucks_Build.json').read_text());assert sha(R/b['entry'])==b['entrySHA256']
source=(R/b['entry']).read_text();text=source;edits=[]
def replace(old,new,label):
 global text
 assert text.count(old)==1,(label,text.count(old));text=text.replace(old,new);edits.append((old,new,label))
script,style='scripts/game_v02_menu_style.js','scripts/game_v02_menu_style.css'
version=hashlib.sha256((R/script).read_bytes()+(R/style).read_bytes()).hexdigest()[:12]
hud='<script src="scripts/game_vertical_loggia_hud_v02.js?v=73ffa63e9ab8"></script>'
replace(hud,hud+'<script src="'+script+'?v='+version+'"></script>','load the menu restyle after the HUD module')
inverse=text
for before,after,label in reversed(edits):
 assert inverse.count(after)==1,label;inverse=inverse.replace(after,before)
assert inverse==source
entry='SIGHTLINE_SAINT_MERIDIAN_V02_MENU_STYLE.html';(R/entry).write_text(text)
report={**b,'status':'BUILT menu restyle candidate; visual review and regressions pending','entry':entry,'entrySHA256':sha(R/entry),'source':b['entry'],'sourceSHA256':b['entrySHA256'],
 'menuStyleScript':script,'menuStyleScriptSHA256':sha(R/script),'menuStyleSheet':style,'menuStyleSheetSHA256':sha(R/style),'builderSHA256':sha(Path(__file__)),
 'hooks':[{'label':label,'beforeSHA256':hashlib.sha256(before.encode()).hexdigest(),'afterSHA256':hashlib.sha256(after.encode()).hexdigest()}for before,after,label in edits],
 'scope':'Menu presentation only. Same ids, buttons, tabs and handlers; decorative layers are aria-hidden and ignore pointer input.'}
(D/'V02_Menu_Style_Build.json').write_text(json.dumps(report,indent=2)+'\n');print(entry,report['entrySHA256'],len(edits),'inverse-verified hooks')
