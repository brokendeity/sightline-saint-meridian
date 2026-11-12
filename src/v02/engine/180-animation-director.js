// ---------- loop ----------
// Central 3D FBX animation director: physical state always wins over held buttons.
const animationSpec={
 jumpPose:{priority:90,hold:0,fade:.1,once:true},
 flatImpact:{priority:120,hold:.48,fade:.06,once:true},hardLand:{priority:110,hold:.28,fade:.09,once:true},
 fallUncontrolled:{priority:100,hold:.12,fade:.13},fly:{priority:95,hold:.19,fade:.13},
 takeoff:{priority:90,hold:.18,fade:.08,once:true},airAim:{priority:70,hold:.08,fade:.15},
 fallControlled:{priority:65,hold:.09,fade:.15},groundAim:{priority:55,hold:.1,fade:.14},
 sprint:{priority:35,hold:.10,fade:.13},run:{priority:30,hold:.10,fade:.14},
 walk:{priority:20,hold:.10,fade:.14},idle:{priority:10,hold:.08,fade:.16}
};
function resolveAnimation(dt){window.backspoolFlow?.beginPose();
 if(window.kinsmokeHero?.animate?.(dt)||window.loadoutRunnerFull?.animate()||window.backspoolPreviewActive?.()||window.backspoolPowers?.animate()||window.threadrailGame?.animatePriority()||window.backspoolLadders?.animate()||window.backspoolAdvanced?.animate()||window.backspoolPosture?.animate()||window.backspoolTraversal?.animate()||window.backspoolFlow?.animate()||window.threadrailGame?.animate()||window.backspoolCombat?.animate()||window.characterSwitcherAnimation?.(dt))return;
 if(window.backspoolTraversal?.animateLocomotion())return;const mi=getMoveInput(),aiming=inputAiming(),speed=Math.hypot(s.vel.x,s.vel.z);
 let name='idle',rate=1;
 if(s.mode===P.IMPACT)name='flatImpact';
 else if(s.mode===P.LANDING)name='hardLand';
 else if(s.mode===P.UNCONTROLLED){name='fallUncontrolled';rate=THREE.MathUtils.clamp(.82+Math.abs(s.vel.y)*.011,.82,1.36)}
 else if(s.mode===P.TRANSIT){name='fly';rate=THREE.MathUtils.clamp(.91+s.vel.length()/200*.27,.92,1.22)}
 else if(s.mode===P.TAKEOFF)name='takeoff';
 else if(!s.onGround){name='fallControlled';rate=THREE.MathUtils.clamp(.82+Math.abs(s.vel.y)*.018,.82,1.3)}
 else if(aiming||s.mode===P.AIM)name='groundAim';
 else if(speed>.28&&mi.mag>.08){
  s.moveHeld+=dt;
  if(inputSprinting()&&mi.mag>.47){name='sprint';rate=THREE.MathUtils.clamp(speed/13.8,.65,1.22)}
  else if(s.moveHeld>.35||mi.mag>.78){name='run';rate=THREE.MathUtils.clamp(speed/8.2,.67,1.27)}
  else{name='walk';rate=THREE.MathUtils.clamp(speed/4.0,.62,1.25)}
 }else s.moveHeld=0;
 const spec=animationSpec[name]||animationSpec.idle;
 const previous=animationSpec[currentAnim]||animationSpec.idle;
 // A lower priority request cannot prematurely cut off a protected impact/takeoff clip.
 if(currentAnim!==name&&currentAnimAge<animationHold&&previous.priority>spec.priority)return;
 if(currentAnim!==name){playAnim(name,spec.fade,!!spec.once,rate);currentAnimAge=0;animationHold=spec.hold}
 else if(currentAction)currentAction.setEffectiveTimeScale(rate);
 if(name==='jumpPose'&&currentAnim===name){currentAction.time=Math.min(.22,clips.jumpPose.duration*.3);currentAction.setEffectiveTimeScale(0)}
}
function updateCharacter(dt,animationDt=dt,realDt=dt){
 if(!model)return;
 currentAnimAge+=dt;
 resolveAnimation(dt);mixer.update(animationDt);
 characterRoot.position.copy(s.pos);
 visualPivot.position.y=visualBaseOffset;
 // Pivot the *3D hierarchy*, never the skinned skeleton or a sprite/flat billboard.
 visualPivot.rotation.y=s.yaw;
 const velocity=s.vel,planar=Math.hypot(velocity.x,velocity.z),flight=s.mode===P.TRANSIT,unstable=s.mode===P.UNCONTROLLED;
 let targetPitch=0,targetBank=0;
 if(flight&&planar+Math.abs(velocity.y)>1){targetPitch=THREE.MathUtils.clamp(-Math.atan2(velocity.y,Math.max(planar,1))*.44,-.33,.33);
  const turn=angleDelta(lastFacingYaw,s.yaw)/Math.max(dt,.008);
  targetBank=THREE.MathUtils.clamp(-turn*.015,-.19,.19);
 }else if(unstable){targetPitch=.12*Math.sin(s.uncontrolledTimer*5.1);targetBank=.2*Math.sin(s.uncontrolledTimer*4.4)}
 else if(!s.onGround&&planar>3){targetPitch=THREE.MathUtils.clamp(-velocity.y*.018,-.16,.16);targetBank=THREE.MathUtils.clamp(getMoveInput().x*.08,-.08,.08)}
 // Small, anatomically sensible attitude; no 90-degree flattening of the FBX character.
 visualPivot.rotation.x=THREE.MathUtils.lerp(visualPivot.rotation.x,targetPitch,1-Math.exp(-9*dt));
 visualPivot.rotation.z=THREE.MathUtils.lerp(visualPivot.rotation.z,targetBank,1-Math.exp(-9*dt));
 lastFacingYaw=s.yaw;
 characterRoot.updateMatrixWorld(true);
 if(s.onGround&&footContactSamples.length&&!window.backspoolCombat?.ownsGroundSupport()&&!window.backspoolFlow?.ownsBodyContact()){
  let soleY=Infinity;for(const {mesh,indices} of footContactSamples){for(const i of indices){footVertex.fromBufferAttribute(mesh.geometry.attributes.position,i);mesh.boneTransform(i,footVertex);footVertex.applyMatrix4(mesh.matrixWorld);soleY=Math.min(soleY,footVertex.y)}}
  // Physics keeps roof clearance; the visual soles meet the actual surface.
  let surfaceY=s.pos.y-.42;if(s.pos.y<.9){const roadFloor=window.roadNetwork?.surfaceAt(s.pos.x,s.pos.z)||0;if(Math.hypot(s.pos.x,s.pos.z)<115){if(s.pos.y<.6)surfaceY=.4;}else if(Math.abs(s.pos.y-roadFloor-.42)<.035)surfaceY=roadFloor;}
  if(Number.isFinite(soleY))visualPivot.position.y+=surfaceY-soleY;
  characterRoot.updateMatrixWorld(true);
 } // sample deformed FBX bones at the current physical position
 window.backspoolCombat?.groundSupport();window.backspoolTraversal?.anchor();window.backspoolLadders?.anchor();window.backspoolAdvanced?.anchor();window.backspoolFlow?.anchor();window.backspoolFlow?.effects();flightFX.update(realDt);
}
