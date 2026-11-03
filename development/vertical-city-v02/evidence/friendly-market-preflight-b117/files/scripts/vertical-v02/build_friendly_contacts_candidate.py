"""Integrated live friendly bodies, with an explicit inverse for every hook."""
from pathlib import Path
import hashlib,json
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
b=json.loads((D/'V02_Civilian_Clearance_Build.json').read_text());assert sha(R/b['entry'])==b['entrySHA256']
source=(R/b['entry']).read_text();text=source;edits=[]
def replace(old,new,label):
 global text
 assert text.count(old)==1,(label,text.count(old));text=text.replace(old,new);edits.append((old,new,label))
start=source.index('function moveFreeWithSweep(dt){');end=source.index('function setMode(',start);old=source[start:end]
needle=' const n=hit.normal,grounded=s.onGround;';at=old.index(needle)
body=old[at:];assert body.endswith('}\n')
new=old[:at]+" return resolveFreeContact(prev,end,hit);\n}\nfunction resolveFreeContact(prev,end,hit){\n if(hit.collider.friendly)return window.v02FriendlyContacts.move(prev,end,hit);\n"+body
new=new.replace(' if(!slideHit)s.pos.copy(slideTarget);',' if(slideHit?.collider.friendly)window.v02FriendlyContacts.move(s.pos.clone(),slideTarget,slideHit);else if(!slideHit)s.pos.copy(slideTarget);')
replace(old,new,'one native free-contact response; original static response retained')
old=source[source.index('function sweptCharacterHit(start,end){'):source.index('function recoverPenetration()')]
new=old.replace('function sweptCharacterHit(start,end){','function sweptStaticCharacterHit(start,end){',1)+'''function sweptCharacterHit(start,end){
 const result=sweptStaticCharacterHit(start,end);
 const friendly=window.v02FriendlyContacts?.sweep(start,end,{radius:playerBodyRadius(),height:playerBodyHeight(),offset:.42});
 return friendly&&(!result||friendly.t<result.t)?friendly:result;
}
'''
replace(old,new,'static native sweep retained plus live friendly channel')
replace('function surfaceImpact(point,normal,speed,collider=null){\n', 'function surfaceImpact(point,normal,speed,collider=null){\n if(collider?.friendly)return;\n','friendly bodies do not create building damage')
replace("function tickFrame(dt,draw=true){if(!gameActive)","function tickFrame(dt,draw=true){if(gameActive)window.v02FriendlyContacts?.beginFrame(dt);if(!gameActive)",'one snapshot per native simulation frame')
replace('function resetPlayer(){window.v02BodyFraming?.reset();',"function resetPlayer(){window.v02FriendlyContacts?.reset('RESPAWN');window.v02BodyFraming?.reset();",'reset contact ownership')
replace('function actorSweep(from,to,radius){for(const c of allColliders(from,to))', 'function actorSweep(from,to,radius){if(window.v02FriendlyContacts?.actorSweep(from,to,radius))return true;for(const c of allColliders(from,to))','shared grounded combat movement/spawn clearance')
replace('));if(!hit||Math.abs(hit.normal.y)>.2)return null;\n', '));if(!hit||hit.collider.friendly||Math.abs(hit.normal.y)>.2)return null;\n','friendly body is not a vault fixture')
replace('  for(const w of streetAtmosphere.walkers){if(!w.routeEdge)continue;let edge=',
"  for(const w of streetAtmosphere.walkers){if(!w.routeEdge)continue;if(window.v02FriendlyContacts?.waitStreet(w)){w.routeWaiting=true;w.left.rotation.x*=Math.exp(-10*dt);w.right.rotation.x*=Math.exp(-10*dt);window.v02FriendlyContacts.settleStreet(w);continue;}let edge=",'road walkers wait without consuming a route edge or signal phase')
replace('w.left.rotation.x=swing;w.right.rotation.x=-swing;}\n }\n function build(){if(stats.ready)', 'w.left.rotation.x=swing;w.right.rotation.x=-swing;window.v02FriendlyContacts?.settleStreet(w,w.group.position.y);}\n }\n function build(){if(stats.ready)','actual street soles on existing support')
replace('function handleTransitCollision(hit){\n', "function handleTransitCollision(hit){\n if(hit.collider.friendly){window.v02FriendlyContacts.record(hit);s.pos.copy(hit.point).addScaledVector(hit.normal,.006);const toward=s.vel.dot(hit.normal);if(toward<0)s.vel.addScaledVector(hit.normal,-toward);clearRailQueue();s.onGround=false;setMode(P.AIR);return;}\n",'friendly flight contact has no building impact or health loss')
replace('  if(hit){s.pos.copy(hit.point).addScaledVector(hit.normal,.035);if(hit.normal.y>.58){beginLanding(true,false)}else loseControl(hit.normal,13)}', '  if(hit){if(hit.collider.friendly){resolveFreeContact(from,proposed,hit);s.onGround=false;setMode(P.AIR);}else{s.pos.copy(hit.point).addScaledVector(hit.normal,.035);if(hit.normal.y>.58){beginLanding(true,false)}else loseControl(hit.normal,13)}}','same friendly contact during takeoff')
# Feed bounded requests into the one director before its shared collision pass.
replace('));desired.copy(constrainCameraPosition(rayStart,desired,flightAligned));',
 '));desired=window.v02FriendlyCamera?.plan(rayStart,desired,dt,{mode:"exploration",aligned:flightAligned})||desired;desired.copy(constrainCameraPosition(rayStart,desired,flightAligned));',
 'exploration camera proposal before shared static constraint')
replace('const origin=desired.origin||s.pos.clone().add(new THREE.Vector3(0,1.1,0)),target=desired.position||desired.desired;if(!target){updateCamera(dt);return;}camera.position.lerp(target,',
 'const origin=desired.origin||s.pos.clone().add(new THREE.Vector3(0,1.1,0));let target=desired.position||desired.desired;if(!target){updateCamera(dt);return;}target=window.v02FriendlyCamera?.plan(origin,target,dt,{mode})||target;camera.position.lerp(target,',
 'authored camera proposal before native blend and constraint')
replace('const look=cam.focus.clone().addScaledVector(view,lookDistance);camera.up.set(0,1,0);camera.lookAt(look)',
 'const nativeLook=cam.focus.clone().addScaledVector(view,lookDistance),look=window.v02FriendlyCamera?.focus(nativeLook,cam.focus,view)||nativeLook;camera.up.set(0,1,0);camera.lookAt(look)',
 'native exploration composition keeps hero readable during shoulder peek')
visitor='scripts/game_v02_friendly_visitor_clearance.js'
old=b['worldLifeScript']+'?v='+b['worldLifeScriptSHA256'][:12]
replace(old,visitor+'?v='+sha(R/visitor)[:12],'supported visitor priority yielding preserves published world-life module')
core='scripts/friendly_contact_core_v02.js';runtime='scripts/game_v02_friendly_contacts.js';camera='scripts/game_v02_friendly_camera.js'
replace('</body>',f'<script src="{core}?v={sha(R/core)[:12]}"></script>\n<script src="{runtime}?v={sha(R/runtime)[:12]}"></script>\n<script src="{camera}?v={sha(R/camera)[:12]}"></script>\n</body>','isolated contact module loading')
inverse=text
for before,after,label in reversed(edits):
 assert inverse.count(after)==1,label;inverse=inverse.replace(after,before)
assert inverse==source
entry='SIGHTLINE_SAINT_MERIDIAN_V02_FRIENDLY_CONTACTS.html';(R/entry).write_text(text)
report={**b,'friendlyCamera':camera,'friendlyCameraSHA256':sha(R/camera),'worldLifeScript':visitor,'worldLifeScriptSHA256':sha(R/visitor),'status':'BUILT live friendly-contact candidate; native input/collision acceptance pending','entry':entry,'entrySHA256':sha(R/entry),'source':b['entry'],'sourceSHA256':b['entrySHA256'],'friendlyCore':core,'friendlyCoreSHA256':sha(R/core),'friendlyScript':runtime,'friendlyScriptSHA256':sha(R/runtime),'builderSHA256':sha(Path(__file__)),
 'hooks':[{'label':label,'beforeSHA256':hashlib.sha256(before.encode()).hexdigest(),'afterSHA256':hashlib.sha256(after.encode()).hexdigest()}for before,after,label in edits],
 'scope':'Live friendly capsule channel with explicit native movement hooks, road walker occupancy waits and street sole support. Static response reused; hero controls/powers/animations and source city/lighting preserved. Actual behavior must pass new contact and retained gameplay checks; broader release remains open.'}
(D/'V02_Friendly_Contacts_Build.json').write_text(json.dumps(report,indent=2)+'\n');print(entry,report['entrySHA256'],len(edits),'inverse-verified hooks')
