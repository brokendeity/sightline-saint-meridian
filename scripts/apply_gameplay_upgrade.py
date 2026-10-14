from pathlib import Path
import sys
root=Path(__file__).resolve().parent.parent
path=Path(sys.argv[1]) if len(sys.argv)>1 else root/'SIGHTLINE_SAINT_MERIDIAN_TOON.html'
s=path.read_text()
if '// Responsive inputs and readable, bounded city combat.' in s:
    print('Gameplay upgrade already applied');sys.exit(0)
def replace(old,new,count=1):
    global s
    found=s.count(old)
    if found!=count:raise RuntimeError(f'Expected {count} occurrences, found {found}: {old[:160]}')
    s=s.replace(old,new)
replace("const input={actions:", (root/'scripts/gameplay_upgrade.js').read_text()+"\nconst input={actions:")
replace('if(o.geometry&&!o.userData.sharedAsset)gs.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>ms.add(m))','if(o.geometry&&!o.userData.sharedAsset)gs.add(o.geometry);if(o.material&&!o.userData.sharedMaterial)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>ms.add(m))')
replace('function clearInput(){lastMouseX=lastMouseY=null;','function clearInput(){resetMechanicInput();lastMouseX=lastMouseY=null;')
replace('function resetPlayer(){courier.arrivalAt=-100;','function resetPlayer(){resetMechanicEncounter();courier.arrivalAt=-100;')
replace("if(edge('jump'))pad.jumpQueued=true;","if(edge('jump'))queueJump();")
replace("if(e.code==='KeyE'&&!e.repeat)doDodge();","if(e.code==='Space'&&!e.repeat)queueJump();else if(e.code==='Space')mechanicPolish.keyJumpHeld=true;if(e.code==='KeyE'&&!e.repeat)doDodge();")
replace("$('tJump').onclick=()=>{if(gameActive)pad.jumpQueued=true}","$('tJump').onclick=queueJump")
replace("function updatePlayer(dt,realDt=dt){recoverPenetration();","function updatePlayer(dt,realDt=dt){updateResponsiveInput(realDt);recoverPenetration();")
replace("  if((keys.space||pad.jumpQueued)&&!aiming){gameAudio.play('takeoff');s.hasFiredAir=false;s.vel.y=9.8;s.onGround=false;setMode(P.AIR);playAnim('takeoff',.05,true,1.1);currentAnimAge=0;animationHold=.22;keys.space=false;pad.jumpQueued=false;rumble(65,.16,.08)}", "  // Edge-triggered requests are consumed below; held buttons never retrigger a jump.")
replace(" if(aiming&&(s.mode===P.GROUND||s.mode===P.AIR||s.mode===P.AIM))", " tryBufferedJump(aiming);\n if(aiming&&(s.mode===P.GROUND||s.mode===P.AIR||s.mode===P.AIM))")
start=s.index('function doBrace(){')
end=s.index('\nfunction setInputMode',start)
s=s[:start]+'''function doBrace(){
 if(!gameActive||[P.IMPACT,P.UNCONTROLLED].includes(s.mode))return;
 const guarding=armTimedBrace();
 if(s.mode===P.TRANSIT&&!s.braceUsed){
  s.brace=true;s.braceUsed=true;
  s.pressure=Math.max(0,s.pressure-32);courier.debt=Math.max(0,courier.debt-12);courier.trauma=Math.max(0,courier.trauma-2);s.overloadTimer=0;
  rumble(60,.18,.1);showBanner('ARRIVAL BRACE','ONE VENT PER RAIL · -32 PRESSURE · TIMED SHOT GUARD');
 }else if(guarding){rumble(35,.1,.06);showBanner('KINETIC GUARD','TIME Q / LB JUST BEFORE A SHOT CONNECTS');}
}
''' +s[end:]
replace("if(e.hp<=0){if(e.guard)e.dead=true;disposeObject(e.searchPool);","if(e.hp<=0){cancelEnemyAttack(e);if(e.guard)e.dead=true;disposeObject(e.searchPool);")
replace("for(const g of courier.guards){const i=rayTargets.indexOf(g.core);", "for(const g of courier.guards){cancelEnemyAttack(g);const i=rayTargets.indexOf(g.core);")
replace("e.lostSight=0;e.shot=.45;", "e.lostSight=0;e.shot=.55;")
old="e.shot-=dt;if(e.alertState==='CHASE'&&e.shot<=0&&e.group.position.distanceTo(s.pos)<240&&enemyHasSight(e)){e.shot=range(1.4,2.2);const m=new THREE.Mesh(new THREE.SphereGeometry(.45,8,8),new THREE.MeshBasicMaterial({color:0xff315d}));m.position.copy(e.group.position);scene.add(m);const d=new THREE.Vector3().subVectors(s.pos,e.group.position).normalize();projectiles.push({m,d,life:4});if(e.group.position.distanceTo(s.pos)<100)gameAudio.play('shot')}"
replace(old,"e.shot-=dt;tickEnemyAttack(e,dt)")
old="for(const g of courier.guards){if(g.dead)continue;g.stun=Math.max(0,g.stun-dt);g.shot-=dt;if(g.stun>0){g.group.rotation.z=Math.sin(courier.clock*5)*.12;continue}g.group.rotation.z=0;if(g.shot<=0&&g.group.position.distanceTo(s.pos)<85){const delta=s.pos.clone().add(new THREE.Vector3(0,1,0)).sub(g.group.position).normalize(),ray=new THREE.Raycaster(g.group.position.clone().add(new THREE.Vector3(0,1.2,0)),delta,0,g.group.position.distanceTo(s.pos));if(!ray.intersectObjects(cameraObstacles,false).length){g.shot=3.5;const m=new THREE.Mesh(new THREE.SphereGeometry(.25,6,6),new THREE.MeshBasicMaterial({color:0xff7648}));m.position.copy(g.group.position).add(new THREE.Vector3(0,1.2,0));scene.add(m);projectiles.push({m,d:delta,life:3});gameAudio.play('shot')}}}"
replace(old,"for(const g of courier.guards){if(g.dead)continue;g.stun=Math.max(0,g.stun-dt);g.shot-=dt;if(g.stun>0){cancelEnemyAttack(g);g.group.rotation.z=Math.sin(courier.clock*5)*.12;continue}g.group.rotation.z=0;tickEnemyAttack(g,dt)}")
replace('addScaledVector(p.d,58*dt)','addScaledVector(p.d,(p.speed||58)*dt)')
replace('if(playerHit){disposeObject(p.m);projectiles.splice(i,1);s.pressure=', 'if(playerHit){disposeObject(p.m);projectiles.splice(i,1);if(tryPerfectBrace())continue;s.pressure=')
replace("else{courier.cleanArrivals++;courier.safeLandings++;courier.mastery=Math.min(1,courier.mastery+.004);", "else{cleanLandingRecovery(speed);courier.cleanArrivals++;courier.safeLandings++;courier.mastery=Math.min(1,courier.mastery+.004);")
replace("courier.safeLandings++;courier.mastery=Math.min(1,courier.mastery+.008)", "cleanLandingRecovery(impact);courier.safeLandings++;courier.mastery=Math.min(1,courier.mastery+.008)")
replace("courier:courierState(),coordinates:","courier:courierState(),mechanics:mechanicPolishState(),coordinates:")
path.write_text(s)
print(f'Applied gameplay upgrade to {path}')
