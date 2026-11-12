/* V02 body framing v4 (2026-11-05, close-camera build with Sightline framing). A copy of game_v02_body_framing_v3.js
 * (SHA256 c10b9afc68cd5b1617a849a4056305c4dedb59fa8f709aac2669174494ac71f3, itself v2 without the floor patch) that also frames SIGHTLINE:
 * - on foot (GROUND, LANDING, IMPACT) and not aiming, his whole body, head to toes, is kept inside 86% of the frame,
 *   exactly as for Backspool and Loadout, by turning the camera (and, if ever needed, widening the field of view);
 * - his aim ray is cast from the rendered camera, so while he aims on the ground or is airborne the framing bias eases
 *   out (about 0.23 s to 90%) and his aim view settles on the native one; in take-off, rail flight and airborne aim (the
 *   native flight-aligned camera) the bias is dropped at once, so rails and flight are never aimed through it;
 * - coming back on foot, the bias eases in at the same rate instead of jumping. The easing is a 0..1 weight on the
 *   solved bias, so once he is settled on foot the framing follows his body every frame, exactly as for Backspool.
 * Backspool and Loadout are unchanged from v3. v2 and v3 are not edited; the build loads only v4. */
/* Final Backspool composition only. The existing director and collision solver
 * retain exclusive ownership of camera position, input yaw/pitch and gameplay.
 * Manual pitch owns look direction; precision inherits the visible composition.
 * Sightline keeps its existing camera behavior.
 */
window.v02BodyFraming=(()=>{
 const original=actionCamera.tick,cache=[],local=new THREE.Vector3(),inverse=new THREE.Quaternion(),direction=new THREE.Vector3(),basePosition=new THREE.Vector3();let rig=null;const groundPoints=[[-.32,-.55],[-.32,.55],[.32,-.55],[.32,.55]].map(([x,z])=>({x,z,point:new THREE.Vector3(),radius:.04}));const targetPoints=[{point:new THREE.Vector3(),radius:.5},{point:new THREE.Vector3(),radius:.5}];
 const SIGHTLINE_EASE=10;
 // Sightline: weight (0..1) of the solved framing bias, eased in on foot and out otherwise; the last solved bias.
 let sightlineWeight=0;const sightlineSolved={yaw:0,pitch:0};
 let heldYaw=0,heldPitch=0,heldFov=0,lastTargetPitch=null,manualPitch=false,quietPitch=0;
 const baseAngles={yaw:0,pitch:0};
 const state={compositionFamily:'exploration',quietPitch:0,manualPitch:false,compositionOwner:'automatic',heldYaw:0,heldPitch:0,frames:0,adjusted:0,eligible:false,reason:'not sampled',positionDelta:0,fov:0,yawCorrection:0,pitchCorrection:0,unresolved:0,fit:null,hasTarget:false,groundEnvelope:false};
 const specifications=[['Head',.24],['Neck',.16],['Hips',.18],['LeftShoulder',.15],['RightShoulder',.15],['LeftArm',.14],['RightArm',.14],['LeftForeArm',.14],['RightForeArm',.14],['LeftHand',.13],['RightHand',.13],['LeftLeg',.14],['RightLeg',.14],['LeftFoot',.12],['RightFoot',.12],['LeftToeBase',.10],['RightToeBase',.10]];
 function reset(){sightlineWeight=0;sightlineSolved.yaw=sightlineSolved.pitch=0;heldYaw=heldPitch=heldFov=quietPitch=0;lastTargetPitch=null;manualPitch=false;}
 function viewAngles(){camera.getWorldDirection(direction);return{yaw:Math.atan2(-direction.x,-direction.z),pitch:Math.asin(THREE.MathUtils.clamp(direction.y,-1,1))};}
 function applyHeld(){const a=viewAngles();direction.copy(cameraForward(a.yaw+heldYaw,clampPitch(a.pitch+heldPitch))).add(camera.position);camera.lookAt(direction);if(heldFov>camera.fov){camera.fov=heldFov;camera.updateProjectionMatrix();}camera.updateMatrixWorld(true);state.heldYaw=heldYaw;state.heldPitch=heldPitch;state.fov=camera.fov;}
 function bind(){if(rig===model)return;reset();rig=model;cache.length=0;for(const[name,radius]of specifications){const bone=model?.getObjectByName('mixamorig'+name);if(!bone)throw Error('Body framing requires '+name);cache.push({bone,radius,point:new THREE.Vector3()});}}
 function angularBounds(){inverse.copy(camera.quaternion).invert();let minH=Infinity,maxH=-Infinity,minV=Infinity,maxV=-Infinity,behind=false;for(const x of cache.concat(state.groundEnvelope?groundPoints:[],state.hasTarget?targetPoints:[])){local.copy(x.point).sub(camera.position).applyQuaternion(inverse);const depth=-local.z;if(depth<=x.radius+.03){behind=true;continue;}const radiusH=Math.asin(Math.min(.95,x.radius/Math.hypot(local.x,depth))),radiusV=Math.asin(Math.min(.95,x.radius/Math.hypot(local.y,depth))),h=Math.atan2(local.x,depth),v=Math.atan2(local.y,depth);minH=Math.min(minH,h-radiusH);maxH=Math.max(maxH,h+radiusH);minV=Math.min(minV,v-radiusV);maxV=Math.max(maxV,v+radiusV);}return{minH,maxH,minV,maxV,behind};}
 function apply(dt=1/60){
  state.frames++;state.eligible=false;state.fit=null;state.hasTarget=false;state.yawCorrection=state.pitchCorrection=state.positionDelta=0;
  const hero=characterState().active;state.hero=hero;
  if(!gameActive||!(hero==='backspool'||hero==='sightline')||!model||characterState().busy||window.backspoolPreviewActive?.()){state.reason='inactive or different hero';reset();return;}
  bind();state.manualPitch=manualPitch;
  // Sightline: framed only on foot and not aiming. His aim ray is cast from the rendered camera, so while he aims or is
  // airborne the bias eases out (rate SIGHTLINE_EASE) and his aim and flight views settle exactly on the native ones; in
  // take-off, rail flight and airborne aim (the native flight-aligned camera) it is dropped at once.
  let sightlinePrev=null;
  if(hero==='sightline'){
   if(s.mode===P.TRANSIT||s.mode===P.TAKEOFF||(!s.onGround&&inputAiming())){sightlineWeight=0;heldYaw=heldPitch=heldFov=0;state.heldYaw=state.heldPitch=0;state.compositionOwner='sightline flight';state.reason='flight camera untouched';return;}
   if(!(s.onGround&&!inputAiming()&&(s.mode===P.GROUND||s.mode===P.LANDING||s.mode===P.IMPACT))){sightlineWeight*=Math.exp(-SIGHTLINE_EASE*Math.max(0,dt));if(sightlineWeight<1e-4)sightlineWeight=0;heldYaw=sightlineSolved.yaw*sightlineWeight;heldPitch=sightlineSolved.pitch*sightlineWeight;heldFov=0;state.compositionOwner=inputAiming()?'sightline aim':'sightline off foot';state.reason='framing bias easing out';applyHeld();return;}
   sightlinePrev=true;
  }
  if(inputAiming()||window.threadrailGame?.precisionActive?.()||manualPitch){state.compositionOwner=manualPitch?'manual pitch':'precision';state.reason='visible composition bias held for '+state.compositionOwner;applyHeld();return;}
  state.compositionOwner='automatic';const a=viewAngles();baseAngles.yaw=a.yaw;baseAngles.pitch=a.pitch;
  model.updateMatrixWorld(true);for(const x of cache)x.bone.getWorldPosition(x.point);state.groundEnvelope=false;if(state.groundEnvelope){const c=Math.cos(s.yaw),n=Math.sin(s.yaw);for(const p of groundPoints)p.point.set(s.pos.x+p.x*c+p.z*n,s.pos.y-.47,s.pos.z-p.x*n+p.z*c);}state.hasTarget=false;const target=window.backspoolCombat?.cameraTarget?.();if(target&&['duel','combo','aerial','reaction'].includes(actionCamera.state().mode)&&combatants.alive(target)){const volume=combatants.hurtVolume(target);if(volume.center.distanceTo(s.pos)<30){state.hasTarget=true;targetPoints[0].point.copy(volume.center).y+=volume.halfHeight;targetPoints[1].point.copy(volume.center).y-=volume.halfHeight;for(const p of targetPoints)p.radius=volume.radius;}}basePosition.copy(camera.position);state.eligible=true;state.reason='native body composition';
  let adjusted=false;
  for(let iteration=0;iteration<3;iteration++){
   const b=angularBounds();if(b.behind){state.reason='body intersects camera near plane';break;}
   const margin=.86,need=2*Math.atan(Math.max(Math.tan((b.maxV-b.minV)/2)/margin,Math.tan((b.maxH-b.minH)/2)/(camera.aspect*margin)))*180/Math.PI;
   const fov=Math.min(86,Math.max(camera.fov,need));if(fov>camera.fov+.01){camera.fov=fov;camera.updateProjectionMatrix();adjusted=true;}
   const v=Math.atan(Math.tan(camera.fov*Math.PI/360)*margin),h=Math.atan(Math.tan(camera.fov*Math.PI/360)*camera.aspect*margin);
   const yaw=b.maxH-h>b.minH+h?(b.maxH+b.minH)/2:THREE.MathUtils.clamp(0,b.maxH-h,b.minH+h),pitch=b.maxV-v>b.minV+v?(b.maxV+b.minV)/2:THREE.MathUtils.clamp(0,b.maxV-v,b.minV+v);
   if(Math.max(Math.abs(yaw),Math.abs(pitch))<.0002)break;
   direction.set(Math.tan(yaw),Math.tan(pitch),-1).normalize().applyQuaternion(camera.quaternion).add(camera.position);camera.lookAt(direction);camera.updateMatrixWorld(true);state.yawCorrection+=yaw;state.pitchCorrection+=pitch;adjusted=true;
  }
  camera.updateMatrixWorld(true);const finalBounds=angularBounds(),vLimit=Math.atan(Math.tan(camera.fov*Math.PI/360)*.98),hLimit=Math.atan(Math.tan(camera.fov*Math.PI/360)*camera.aspect*.98);state.fit=!finalBounds.behind&&finalBounds.minH>=-hLimit&&finalBounds.maxH<=hLimit&&finalBounds.minV>=-vLimit&&finalBounds.maxV<=vLimit;if(!state.fit){state.unresolved++;if(!finalBounds.behind)state.reason='safe field of view exhausted';}state.positionDelta=basePosition.distanceTo(camera.position);state.fov=camera.fov;if(adjusted)state.adjusted++;const finalAngles=viewAngles();heldYaw=Math.atan2(Math.sin(finalAngles.yaw-baseAngles.yaw),Math.cos(finalAngles.yaw-baseAngles.yaw));heldPitch=finalAngles.pitch-baseAngles.pitch;heldFov=camera.fov;
  // The weight only advances on frames where the body is actually solved (not while manual pitch holds the view).
  if(sightlinePrev){sightlineWeight+=(1-sightlineWeight)*(1-Math.exp(-SIGHTLINE_EASE*Math.max(0,dt)));if(sightlineWeight>.9999)sightlineWeight=1;sightlineSolved.yaw=heldYaw;sightlineSolved.pitch=heldPitch;state.sightlineWeight=sightlineWeight;}
  if(sightlinePrev&&sightlineWeight<1){heldYaw*=sightlineWeight;heldPitch*=sightlineWeight;direction.copy(cameraForward(baseAngles.yaw+heldYaw,clampPitch(baseAngles.pitch+heldPitch))).add(camera.position);camera.lookAt(direction);camera.updateMatrixWorld(true);const eased=angularBounds();state.fit=!eased.behind&&eased.minH>=-hLimit&&eased.maxH<=hLimit&&eased.minV>=-vLimit&&eased.maxV<=vLimit;}
  state.heldYaw=heldYaw;state.heldPitch=heldPitch;
 }
 actionCamera.tick=function(dt){
  // Mouse/touch mutate targetPitch between frames; stick intent is still raw
  // here. Capture the native post-director value, so its own changes do not
  // become a second input curve or get mistaken for a player gesture.
  const changed=lastTargetPitch!==null&&Math.abs(cam.targetPitch-lastTargetPitch)>1e-6;
  const pitchInput=Math.abs(input.actions.lookY||0)>.001||changed;
  if(pitchInput){manualPitch=true;quietPitch=0;}else quietPitch+=dt;
  if(manualPitch&&quietPitch>.4&&Math.abs(cam.targetPitch+.08)<.035)manualPitch=false;
  original(dt);lastTargetPitch=cam.targetPitch;
  const mode=actionCamera.state().mode,family=['rail','drive','slingshot'].includes(mode)?'equipment':['duel','combo','aerial','reaction'].includes(mode)?'combat':'exploration';
  // The native equipment camera releases manual ownership after .9s; a
  // target-locked combat composition owns its frame. An old exploration pitch
  // must not indefinitely disable the body fit in either authored composition.
  // Precision preserves the visible view, including during ownership changes.
  if(!inputAiming()&&!window.threadrailGame?.precisionActive?.()&&(family==='combat'||family==='equipment'&&quietPitch>.9))manualPitch=false;
  state.compositionFamily=family;state.quietPitch=quietPitch;apply(dt);
 };
 window.v02BodyFramingState=()=>JSON.parse(JSON.stringify(state));return{state:window.v02BodyFramingState,reset};
})();
