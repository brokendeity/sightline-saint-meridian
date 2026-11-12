function setMode(m){if(s.mode===m)return;s.mode=m;$('state').textContent=m;if(m===P.GROUND){}else if(m===P.UNCONTROLLED){s.uncontrolledTimer=0;playAnim('fallUncontrolled',.08,false,1.05)} }
function controlledFall(){setMode(P.AIR);s.vel.y=Math.max(s.vel.y,-7);playAnim('fallControlled',.14,false)}
function loseControl(normal=null,impact=22){if(s.mode===P.UNCONTROLLED)return;courier.mistakes++;courier.trauma=Math.min(100,courier.trauma+Math.max(3,impact*.35));gameAudio.play('crash');clearRailQueue();dropVIP();rumble(220,.85,.55);setMode(P.UNCONTROLLED);s.vel.multiplyScalar(.35);if(normal)s.vel.addScaledVector(normal,impact);s.vel.y=Math.min(s.vel.y,-3);s.combo=0;cameraShake=.75;hitFlash();showBanner('CONTROL LOST','AIRFRAME DESTABILIZED')}
function beginLanding(hard=false,uncontrolled=false){if(supportHeight(s.pos.x,s.pos.z,s.pos.y+.42)<s.pos.y-.1){s.onGround=false;setMode(P.AIR);playAnim('fallControlled',.08);return}s.hasFiredAir=false;clearRailQueue();if(uncontrolled)dropVIP();rumble(uncontrolled?260:150,uncontrolled?.95:.55,uncontrolled?.65:.25);s.onGround=true;s.vel.set(0,0,0);s.stateTimer=0;setMode(uncontrolled?P.IMPACT:P.LANDING);playAnim(uncontrolled?'flatImpact':'hardLand',.05,true,hard?1.08:.92);cameraShake=hard?.55:.22;window.impactFX?.burst(new THREE.Vector3(s.pos.x,s.pos.y-.42,s.pos.z),new THREE.Vector3(0,1,0),{surface:s.pos.y>1.2?'concrete':'asphalt',strength:uncontrolled?1.5:hard?1.05:.6,source:'landing',stop:uncontrolled?.08:hard?.06:0});showBanner(uncontrolled?'FLAT IMPACT':'HARD LANDING',uncontrolled?'RECOVERING ORIENTATION':'KINETIC LOAD DUMPED')}
function clampPitch(v){const maxPitch=Math.PI/2.1;return THREE.MathUtils.clamp(v,-maxPitch,maxPitch)}
function angleDelta(a,b){return Math.atan2(Math.sin(b-a),Math.cos(b-a))}
function dampAngle(a,b,rate,dt){return a+angleDelta(a,b)*(1-Math.exp(-rate*dt))}
function recenterCamera(silent=false){cam.targetYaw=s.yaw;cam.targetPitch=s.onGround?-.08:-.02;if(!silent)showBanner('CAMERA RECENTERED','VIEW ALIGNED TO SIGHTLINE')}
function swapShoulder(dir=0){cam.shoulder=dir?Math.sign(dir):-cam.shoulder;showBanner(cam.shoulder>0?'RIGHT SHOULDER':'LEFT SHOULDER','AIM CAMERA OFFSET SWAPPED')}
// Three.js-native yaw convention: positive yaw rotates toward -X; positive pitch looks up.
// Controller/mouse look-right therefore subtracts from yaw. All movement/body/camera math uses this same convention.
function cameraForward(yaw=cam.yaw,pitch=0){return new THREE.Vector3(-Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch))}
function updateCameraInput(dt,aiming){
 const lookSpeed=aiming?1.65:2.5;
 // Direct delta accumulation: no velocity curve, no velocity smoothing, no hidden auto-steer.
 cam.targetYaw-=input.actions.lookX*lookSpeed*dt;
 cam.targetPitch=clampPitch(cam.targetPitch+input.actions.lookY*lookSpeed*dt);
 // One rotational smoothing layer only.
 const smoothFactor=1-Math.exp(-(aiming?30:25)*dt);
 cam.yaw+=angleDelta(cam.yaw,cam.targetYaw)*smoothFactor;
 cam.pitch=THREE.MathUtils.lerp(cam.pitch,cam.targetPitch,smoothFactor);
 cam.pitch=clampPitch(cam.pitch);
}
function resetPlayer(){window.v02FriendlyContacts?.reset('RESPAWN');window.v02BodyFraming?.reset();window.verticalDiscovery?.reset('RESPAWN');window.verticalPursuit?.reset('RESPAWN');window.verticalMarket?.reset('RESPAWN');window.verticalEncounters?.reset('RESPAWN');window.threadrailGame?.lifecycle('RESPAWN');window.backspoolFlow?.reset('RESPAWN');window.backspoolTraversal?.reset("RESPAWN");window.backspoolLadders?.reset("RESPAWN");window.backspoolHop?.reset("RESPAWN");window.backspoolAdvanced?.reset("RESPAWN");window.backspoolCombat?.reset("RESPAWN");window.actionWorld?.reset();window.combatants?.respawnHero();window.backspoolEncounters?.clear();window.backspoolPowers?.clear();resetMechanicEncounter();courier.arrivalAt=-100;courier.crosscutAt=-100;courier.crosscutChain=0;courier.pendingCrosscut=false;s.hasFiredAir=false;dropVIP();clearRailQueue();clearInput();s.targetObj=s.transitObj=null;s.moveHeld=0;s.takeoffTimer=s.stateTimer=s.uncontrolledTimer=0;dodgeCD=0;reliability.lastCollision="CLEAR";laserMat.opacity=targetMarker.material.opacity=trailMat.opacity=0;s.pos.set(0,.42,0);s.vel.set(0,0,0);s.yaw=0;s.pitch=-.08;s.onGround=true;s.pressure=0;s.combo=0;s.aiming=false;s.target=s.transitTarget=s.queued=null;s.brace=false;s.braceUsed=false;s.overloadTimer=0;s.overloadRecovery=0;s.pressureStage=0;s.railMeters=0;s.activeRailSpeed=s.railSpeed;s.slingshotCount=0;s.lastVectorSpeed=0;cam.yaw=cam.targetYaw=0;cam.pitch=cam.targetPitch=-.08;cam.focus.set(0,1.6,0);setMode(P.GROUND);playAnim('idle',.1);currentAnimAge=0;animationHold=0;flightFX.reset();velocityTunnel.reset();perceptionClock.reset();s.redRailTimer=0;visualPivot.rotation.set(0,0,0);cam.shake.set(0,0,0);cam.shakeTarget.set(0,0,0);camera.position.set(1.35*Math.min(1,camera.aspect/1.4),2.40,4.2364);camera.fov=56;window.v02CloseCamera?.resetPose();camera.updateProjectionMatrix();camera.lookAt(0,1.74,-22);characterRoot.position.copy(s.pos);showBanner('RECALIBRATED','RETURNED TO CENTRAL PLAZA')}
function doDodge(){if(!sightlinePowersEnabled()){backspoolCombat.evade();return;}if(!gameActive||(s.onGround&&inputAiming()))return;if(dodgeCD>0||s.mode===P.TRANSIT||s.mode===P.TAKEOFF||s.mode===P.IMPACT||s.mode===P.LANDING)return;
 dodgeCD=.55;characterSwitcher.dodge();gameAudio.play('dodge');
 const nearMiss=projectiles.filter(p=>{const toward=new THREE.Vector3().subVectors(s.pos,p.m.position),dist=toward.length();return dist<7.6&&dist>.2&&p.d.dot(toward.divideScalar(dist))>.38;});
 const mi=getMoveInput();let d=getCameraRelativeMoveVector(mi);if(!d.lengthSq())d=getCameraBasis().forward;d.normalize();createAfterimage();
 const start=s.pos.clone(),destination=start.clone().addScaledVector(d,7.5),hit=sweptCharacterHit(start,destination);
 if(hit){s.pos.copy(hit.point).addScaledVector(hit.normal,.045);markCollision('MICRO-RAIL BLOCKED');rumble(90,.3,.12);showBanner('DODGE INTERRUPTED','OBSTACLE ON MICRO-RAIL')}
 else{s.pos.copy(destination);s.vel.addScaledVector(d,5);
  if(nearMiss.length){for(const p of nearMiss){const i=projectiles.indexOf(p);if(i>=0){disposeObject(p.m);projectiles.splice(i,1)}}perceptionClock.perfectDodge();velocityTunnel.launch(.5);s.score+=250;cameraShake=.25;showBanner('PERFECT DODGE','WEAKPOINTS EXPOSED 1.8s // +250');rumble(170,.42,.34)}
  else{rumble(70,.2,.12);showBanner('MICRO-RAIL','KINETIC AFTERIMAGE')}
 }
}
function createAfterimage(){if(!reducedMotion.matches){characterRoot.updateMatrixWorld(true);flightFX.capture()}}
function aimRay(){camera.updateMatrixWorld();raycaster.setFromCamera(center,camera);const hits=raycaster.intersectObjects(rayTargets,false);if(!hits.length){
  s.targetObj=null;
  if(!s.onGround&&inputAiming()){
   // Airborne aiming can launch a rail into open sky, along the crosshair.
   s.target=raycaster.ray.at(180,new THREE.Vector3());s.targetNormal.copy(raycaster.ray.direction).negate();window.v02FlightCeiling?.clipSkyTarget(raycaster.ray);
   laserGeom.attributes.position.array.set([s.pos.x,s.pos.y+1.45,s.pos.z,s.target.x,s.target.y,s.target.z]);laserGeom.attributes.position.needsUpdate=true;laserGeom.computeBoundingSphere();laserMat.opacity=.45;targetMarker.material.opacity=.5;targetMarker.position.copy(s.target);targetMarker.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),s.targetNormal);
  }else{s.target=null;laserMat.opacity=targetMarker.material.opacity=0}
  return
 }const h=hits[0];s.target=h.point.clone();if(h.object.userData.reflective&&courier.clock>courier.verifiedUntil)s.target.x+=Math.sin(courier.clock*3)*.65*courier.rainStrength;s.targetObj=h.object;s.targetNormal.copy(h.face?h.face.normal:new THREE.Vector3(0,1,0)).transformDirection(h.object.matrixWorld).normalize();const pts=new Float32Array([s.pos.x,s.pos.y+1.45,s.pos.z,s.target.x,s.target.y,s.target.z]);laserGeom.attributes.position.array.set(pts);laserGeom.attributes.position.needsUpdate=true;laserGeom.computeBoundingSphere();laserMat.opacity=.65;targetMarker.material.opacity=.9;targetMarker.position.copy(s.target).addScaledVector(s.targetNormal,.05);targetMarker.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),s.targetNormal);const enemy=h.object.userData.enemy;laserMat.color.setHex(enemy?0xff315d:0xff4a1a);targetMarker.material.color.setHex(enemy?0xff315d:0x32f5e7)}
function queueOrLaunch(){if(!sightlinePowersEnabled())return;
 if(!gameActive)return;
 if(!s.target){showBanner('NO RAIL TARGET','AIM AT A SURFACE OR FIRE INTO OPEN SKY WHILE AIRBORNE');return}if([P.IMPACT,P.UNCONTROLLED].includes(s.mode)||s.mode===P.LANDING&&courier.clock-courier.arrivalAt>.42)return;
 if(s.overloadRecovery>0){showBanner('SYSTEM COOLING',s.overloadRecovery.toFixed(1)+'s UNTIL RAIL READY');rumble(90,.16,.12);return}
 if(s.pos.distanceTo(s.target)<2.5){showBanner('INVALID RAIL','TARGET TOO CLOSE');return}
 // Rail Read warns of obstructed vectors, but collision remains the authority.
 const test=sweptCharacterHit(s.pos,s.target);
 if(test&&!isIntendedRailContact(test,s.targetObj,s.target,s.targetNormal)){
  showBanner('VECTOR BLOCKED','NEARER BUILDING INTERCEPTS TARGET');rumble(80,.22,.12);return;
 }
 if(s.mode===P.TRANSIT){
  s.queued=s.target.clone();s.queuedNormal=s.targetNormal.clone();s.queuedObj=s.targetObj;
  showBanner('RICOCHET LOCKED','FLOW CHAIN x'+s.combo);
  document.body.classList.add('locked');return;
 }
 if(s.targetObj?.userData.reflective){if(courier.clock<courier.verifiedUntil){showBanner('REFLECTION DECOY','CHOOSE A PHYSICAL ANCHOR');return}s.pressure=Math.min(100,s.pressure+12);courier.debt=Math.min(100,courier.debt+8)}
 courier.pendingCrosscut=courier.clock-courier.arrivalAt<=.42;s.transitTarget=s.target.clone();s.transitNormal.copy(s.targetNormal);
 s.transitObj=s.targetObj;s.brace=false;s.braceUsed=false;
 if(s.onGround){perceptionClock.ignition();velocityTunnel.launch(.48);setMode(P.TAKEOFF);s.takeoffTimer=0;gameAudio.play('takeoff');playAnim('takeoff',.06,true,1)}
 else startTransit();
}
function startTransit(){
 if(s.overloadRecovery>0){controlledFall();return}
 commitCourierRail();gameAudio.play('rail');s.hasFiredAir=true;rumble(95,.35,.22);setMode(P.TRANSIT);s.onGround=false;
 s.railEntryDistance=Math.max(6,s.pos.distanceTo(s.transitTarget));
 s.activeRailSpeed=THREE.MathUtils.clamp(Math.max(s.railSpeed,s.vel.length()*.985),s.railSpeed,225);
 s.brace=false;s.braceUsed=false;s.railMeters=0;
 flightFX.ignite();velocityTunnel.launch(1);perceptionClock.ignition();characterLight.intensity=2.5;cameraShake=.16;
 const dir=new THREE.Vector3().subVectors(s.transitTarget,s.pos).normalize();
 // Keep existing kinetic energy when chaining from a strike/anchor; ramp toward the rail vector.
 const entrySpeed=THREE.MathUtils.clamp(Math.max(28,s.vel.length()+20),28,s.activeRailSpeed);
 s.vel.copy(dir.multiplyScalar(entrySpeed));
}
function arriveTransit(){
 const obj=s.transitObj,enemy=obj&&obj.userData.enemy;
 const incomingSpeed=s.vel.length();if(enemy&&(enemy.hp<=0||enemy.group.position.distanceTo(s.transitTarget)>(enemy.guard?2:6))){courier.mistakes++;courier.debt=Math.min(100,courier.debt+4);controlledFall();clearRailQueue();showBanner('VECTOR MISSED','TARGET MOVED — REACQUIRE A STRAIGHT VECTOR');return}if(obj)recordCourierArrival(s.pos.clone(),s.transitNormal,incomingSpeed,obj);if(obj&&!obj.userData.enemy&&!obj.userData.anchorGroup)surfaceImpact(s.transitTarget,s.transitNormal,Math.abs(s.vel.dot(s.transitNormal)),buildingColliders.find(c=>c.mesh===obj));
 const incomingDir=incomingSpeed>1?s.vel.clone().normalize():new THREE.Vector3().subVectors(s.transitTarget,s.pos).normalize();
 if(!obj){
  controlledFall();showBanner('RAIL COMPLETE','MOMENTUM PRESERVED');
 }else if(enemy){
  // Vector Strike preserves kinetic travel, with a small deflection above the enemy.
  damageEnemy(enemy,incomingSpeed);
  s.lastVectorSpeed=incomingSpeed;
  const exit=incomingDir.clone().add(new THREE.Vector3(0,.12,0)).normalize();
  s.pos.copy(s.transitTarget).addScaledVector(exit,2.25);
  s.vel.copy(exit).multiplyScalar(THREE.MathUtils.clamp(incomingSpeed*.83,36,175));
  s.pressure=Math.min(100,s.pressure+Math.min(8,incomingSpeed*.026));
  controlledFall();
  showBanner('VECTOR STRIKE','KINETIC EXIT '+Math.round(s.vel.length())+' m/s');
 }else if(obj&&obj.userData.anchorGroup){
  // Anchors accelerate the arrival vector rather than discarding all the speed.
  s.slingshotCount++;
  const boost=THREE.MathUtils.clamp(1.06+s.combo*.025,1.06,1.22);
  const profile=obj.userData.anchorProfile||{boost:1,vent:0,strain:0};s.pressure=THREE.MathUtils.clamp(s.pressure+profile.strain-profile.vent,0,100);courier.debt=Math.max(0,courier.debt-profile.vent*.25);const releaseSpeed=THREE.MathUtils.clamp(Math.max(38,incomingSpeed)*boost*profile.boost,38,225);
  const exit=incomingDir.clone();
  exit.y=Math.max(exit.y,.08);exit.normalize();
  s.pos.copy(s.transitTarget).addScaledVector(exit,1.8);
  s.vel.copy(exit).multiplyScalar(releaseSpeed);
  s.score+=Math.round(releaseSpeed*.8);
  controlledFall();
  showBanner('ANCHOR SLINGSHOT','EXIT '+Math.round(releaseSpeed)+' m/s  //  BOOST x'+boost.toFixed(2));
  rumble(135,.54,.31);
 }else if(s.transitNormal.y>.58){
  s.pos.copy(s.transitTarget).addScaledVector(s.transitNormal,.42);
  const hard=s.pressure>62;beginLanding(hard,false);
  s.pressure=Math.max(0,s.pressure-(s.brace?48:20));
 }else{
  const n=s.transitNormal.clone();s.pos.copy(s.transitTarget).addScaledVector(n,.8);
  if(s.brace){
   // Redirect the tangential component rather than applying a fixed 16 m/s reset.
   const tangential=s.vel.clone().addScaledVector(n,-s.vel.dot(n));
   s.vel.copy(tangential).addScaledVector(n,Math.max(12,incomingSpeed*.25));
   s.vel.clampLength(0,Math.max(22,incomingSpeed*.8));s.vel.y=Math.max(s.vel.y,5);
   controlledFall();s.pressure=Math.max(0,s.pressure-45);s.redRailTimer=3.5;velocityTunnel.launch(.72);
   showBanner('RED RAIL BOUNCE','NEXT VECTOR STRIKE EMPOWERED');
  }else loseControl(n,26);
 }
 if(s.queued&&s.mode!==P.UNCONTROLLED&&s.mode!==P.LANDING&&s.mode!==P.IMPACT){
  s.transitTarget=s.queued;s.transitNormal.copy(s.queuedNormal);s.transitObj=s.queuedObj;
  s.queued=null;s.queuedNormal=null;s.queuedObj=null;
  document.body.classList.remove('locked');startTransit();
 }
}
function damageEnemy(e,impactSpeed=0){gameAudio.play('strike');
 const strong=impactSpeed>=135,redRail=s.redRailTimer>0,weakpoint=perceptionClock.weakpoint>0,damage=(strong||s.combo>=2?2:1)+(redRail?2:0)+(weakpoint?1:0);s.redRailTimer=0;if(weakpoint)perceptionClock.weakpoint=0;
 rumble(120,.62,.35);e.hp-=damage;
 const points=(e.heavy?900:500)+Math.round(impactSpeed*2)+(redRail?1000:0)+(weakpoint?350:0);
 s.score+=points;s.combo++;
 showBanner(redRail?'RED RAIL VECTOR STRIKE':weakpoint?'CRITICAL WEAKPOINT STRIKE':strong?'HIGH VELOCITY STRIKE':'VECTOR STRIKE','+'+points+' // COMBO x'+s.combo);
 perceptionClock.strikeImpact();velocityTunnel.launch(redRail?1:.65);cameraShake=.5;
 if(e.hp<=0){cancelEnemyAttack(e);if(e.guard)e.dead=true;disposeObject(e.searchPool);if(e.searchBeam){scene.remove(e.searchBeam);e.searchBeam.material.dispose()}disposeObject(e.group);const idx=enemies.indexOf(e);if(idx>=0)enemies.splice(idx,1);
  const ri=rayTargets.indexOf(e.core);if(ri>=0)rayTargets.splice(ri,1);
  if(!e.guard)setTimeout(()=>{const a=rand()*Math.PI*2,r=range(260,850);addEnemy(new THREE.Vector3(Math.cos(a)*r,range(30,120),Math.sin(a)*r),rand()>.7)},4500)}
}

