// Backspool-authored movement with recovered vault motion in an isolated candidate.
const backspoolTraversalRuntime=(()=>{
 let frame=null,motion=null,pose=null,completed=0,locomotion=null;
 const V=p=>new THREE.Vector3(p.x,p.y,p.z);
 function clearBody(p){for(const c of allColliders(V(p),V(p))){const b=c.box;if(p.x>b.min.x-BODY_RADIUS+1e-5&&p.x<b.max.x+BODY_RADIUS-1e-5&&p.z>b.min.z-BODY_RADIUS+1e-5&&p.z<b.max.z+BODY_RADIUS-1e-5&&p.y>b.min.y-BODY_HEIGHT+1e-5&&p.y<b.max.y+ROOF_CLEARANCE-1e-5)return false;}return true;}
 function sweepClear(a,b){if(!clearBody(a)||!clearBody(b)||sweptCharacterHit(V(a),V(b)))return false;return true;}
 function supportAt(p){return supportHeight(p.x,p.z,p.y);}
 function probeObstacle(f,cfg){
  const d=new THREE.Vector3(f.direction.x,0,f.direction.z);if(d.lengthSq()<.1)return null;d.normalize();const start=V(f.position),hit=sweptCharacterHit(start,start.clone().addScaledVector(d,Math.max(1.35,Math.min(2.8,Math.hypot(f.velocity?.x||0,f.velocity?.z||0)*.13+.8))));if(!hit||Math.abs(hit.normal.y)>.2)return null;
  const box=hit.collider.box,top=box.max.y+.42,rise=top-start.y;if(rise<.25||rise>cfg.maxClimbRise)return null;
  // Find the far face along the requested horizontal direction.
  let far=Infinity;for(const axis of ['x','z'])if(Math.abs(d[axis])>1e-6)far=Math.min(far,((d[axis]>0?box.max[axis]:box.min[axis])-start[axis])/d[axis]);
  const beyond=start.clone().addScaledVector(d,far+BODY_RADIUS+.18);beyond.y=start.y;
  if(rise<=cfg.maxVaultRise&&start.distanceTo(beyond)<=cfg.maxDistance&&Math.abs(supportAt(beyond)-beyond.y)<.08){
   const near=start.clone();near.y=top+.12;const over=beyond.clone();over.y=top+.12;
   return {vault:true,end:beyond,crestY:top+.12,points:[start,near,over,beyond]};
  }
  const end=hit.point.clone().addScaledVector(d,BODY_RADIUS+.60);end.y=top;
  const crest=start.clone();crest.y=top+.12;return {vault:false,end,crestY:top+.12,points:[start,crest,end]};
 }
 const controller=createBackspoolTraversal({probeObstacle,sweepClear,supportAt},{runSpeed:6.6,sprintSpeed:16.36365,vaultDuration:1.65,climbDuration:1.599,maxDistance:4.5});
 function context(aiming){const raw=getRawMoveInput(),direction=getCameraRelativeMoveVector(raw);return {hero:window.characterState?.().active,active:gameActive,locked:aiming||!!window.backspoolCombat?.movementLocked()||!window.backspoolCombat?.canJump(),retracing:!!window.backspoolPowers?.isRetracing(),preview:!!window.backspoolPreviewActive?.()||!!window.characterState?.().busy,defeated:(window.combatants?.heroState().condition||0)<=0,grounded:s.onGround,canJump:!!window.backspoolCombat?.canJump(),position:s.pos,velocity:s.vel,walk:window.backspoolFlow?.walking(),direction:{x:direction.x,z:direction.z},sprint:inputSprinting(),speedLimit:window.backspoolHop?.groundSpeed(),actionDurations:Object.fromEntries(Object.entries(window.backspoolTraversalSegments||{}).map(([kind,spec])=>[kind,spec.duration]))};}
 function tick(dt,aiming){frame=context(aiming);motion=controller.update(dt,frame);if(motion.ownsMovement){s.pos.copy(V(motion.position));s.vel.copy(V(motion.velocity||{x:0,y:0,z:0}));s.onGround=motion.landed;setMode(motion.landed?P.GROUND:P.AIR);pose=motion;if(motion.landed)completed++;return true;}pose=null;return false;}
 function request(aiming){if(!frame||aiming||!s.onGround||mechanicPolish.clock>mechanicPolish.jumpUntil||getRawMoveInput().mag<.2)return false;const kind=controller.requestObstacle(context(aiming));if(!kind)return false;mechanicPolish.jumpUntil=mechanicPolish.lastGroundAt=-100;s.vel.set(0,0,0);s.onGround=false;setMode(P.AIR);gameAudio.play('takeoff');return true;}
 function sprintVelocity(){return frame?.hero==='backspool'&&!frame.locked?motion?.velocity:null;}
 function animate(){if(pose?.kind==='climb')return window.backspoolFlow.playSource('mantle',pose.phase*1.599,false);if(!pose||context(inputAiming()).locked)return false;const entry=window.backspoolTraversalSegments?.[pose.kind];if(!entry||!clips[entry.id])return false;playAnim(entry.id,.07,true,1);if(currentAction){currentAction.paused=true;currentAction.time=pose.phase*entry.duration;mixer.update(0);}return true;}
 function animateLocomotion(){
  locomotion=null;
  if(pose||window.characterState?.().active!=='backspool'||!s.onGround||s.mode!==P.GROUND||inputAiming()||window.backspoolCombat?.movementLocked()||window.backspoolPowers?.isRetracing())return false;
  const speed=Math.hypot(s.vel.x,s.vel.z),roles=window.backspoolLocomotionRoles?.roles;
  if(!roles||speed<.3||getRawMoveInput().mag<.08)return false;
  let spec=roles[0];for(const role of roles)if(speed>=role.minSpeed)spec=role;
  if(!clips[spec.id])return false;
  const rate=THREE.MathUtils.clamp(speed/spec.nominalSpeed,.6,1.5),changed=currentAnim!==spec.id,phase=currentAction&&currentAction.getClip().duration?currentAction.time/currentAction.getClip().duration:0;
  playAnim(spec.id,.12,false,rate);if(changed){currentAnimAge=0;animationHold=0;currentAction.time=(phase%1)*spec.duration;}locomotion={role:spec.role,sourceAnimationId:spec.sourceAnimationId,rate,speed,phase:currentAction.time/spec.duration};return true;
 }
 function anchor(){if(pose?.kind==='climb'){window.backspoolFlow?.anchor();return;}if(!pose)return;const spec=window.backspoolTraversalSegments?.[pose.kind];if(!spec||pose.landed)return;visualPivot.position.y=BackspoolTraversalPose.visualOffset(spec,pose.phase*spec.duration,.42);characterRoot.updateMatrixWorld(true);}
 function reset(reason){controller.reset(reason);pose=motion=null;locomotion=null;}
 const api={probeAhead:()=>probeObstacle(context(false),{maxClimbRise:2.3,maxVaultRise:1.25,maxDistance:4.5}),automatic:()=>{if(!s.onGround||!inputSprinting()||getRawMoveInput().mag<.3||!backspoolCombat.canJump()||window.backspoolLadders.active())return false;return controller.requestObstacle(context(false));},tick,request,sprintVelocity,animate,animateLocomotion,anchor,reset,state:()=>({...controller.state(),completed,locomotion,pose:pose?{kind:pose.kind,phase:pose.phase}:null,source:'Forspoken-only traversal curves; authored physics-owned travel',segments:window.backspoolTraversalSegments||null})};window.backspoolTraversal=api;window.backspoolTraversalState=api.state;return api;
})();
