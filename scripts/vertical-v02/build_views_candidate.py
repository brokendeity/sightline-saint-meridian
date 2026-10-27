"""Derive a paused-view candidate without modifying the accepted source entry."""
from pathlib import Path
import hashlib,json
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
source=R/'SIGHTLINE_SAINT_MERIDIAN_V02_ARCHITECTURE_FINISH.html'
assert sha(source)=='3f880651dad66adb161880c0c9300ec130e429972fb88728958ba55be182a9c9'
s=source.read_text();patches=[
 ('function activateGame(){','function activateGame(){if(window.verticalViews?.active())return;'),
 ('function startGame(withPointer=false){','function startGame(withPointer=false){if(window.verticalViews?.active())return;'),
 ('if(handleHeroSwitchChord(gp)){','if(window.verticalViews?.poll(gp))return;\n if(handleHeroSwitchChord(gp)){'),
 ("document.addEventListener('pointerlockchange',()=>{pointer=document.pointerLockElement===renderer.domElement;", "document.addEventListener('pointerlockchange',()=>{pointer=document.pointerLockElement===renderer.domElement;if(window.verticalViews?.active()){if(pointer)document.exitPointerLock();return;}"),
 ('window.verticalHUD?.present();adaptiveQuality','window.verticalHUD?.present();window.verticalViews?.present();adaptiveQuality'),
 ('<script src="scripts/game_vertical_hud_v02.js"></script>','<script src="scripts/game_vertical_hud_v02.js"></script><script src="scripts/game_vertical_views_v02.js"></script>')]
for old,new in patches:
 assert s.count(old)==1,old;s=s.replace(old,new,1)
target=R/'SIGHTLINE_SAINT_MERIDIAN_V02_TRANSIT_VIEWS.html';target.write_text(s)
inverse=s
for old,new in reversed(patches):
 assert inverse.count(new)==1;inverse=inverse.replace(new,old,1)
assert inverse.encode()==source.read_bytes()
report={'status':'CANDIDATE; native input/render acceptance pending','source':source.name,'sourceSHA256':sha(source),'entry':target.name,'entrySHA256':sha(target),'patches':patches,'sourceInverseExact':True,'contractSHA256':sha(R/'assets/city/vertical-v02/reference_views.json'),'scriptSHA256':sha(R/'scripts/game_vertical_views_v02.js'),'cssSHA256':sha(R/'scripts/game_vertical_views_v02.css'),'scope':'Paused inspection camera ownership and explicit input boundaries only. Architecture, geometry, materials, hero actions, physics, missions, resource rules and existing camera director unchanged.'}
(D/'V02_Views_Build.json').write_text(json.dumps(report,indent=2)+'\n');print(target.name,sha(target))
