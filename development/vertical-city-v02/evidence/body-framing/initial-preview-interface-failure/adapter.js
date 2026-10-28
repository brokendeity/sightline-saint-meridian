/* Final Backspool composition only. The existing director and collision solver
 * retain exclusive ownership of camera position, input yaw/pitch and gameplay.
 * Aim/precision and Sightline keep their existing camera behavior.
 */
window.v02BodyFraming=(()=>{
 const original=actionCamera.tick,cache=[],local=new THREE.Vector3(),inverse=new THREE.Quaternion(),direction=new THREE.Vector3(),basePosition=new THREE.Vector3();let rig=null;
 const state={frames:0,adjusted:0,eligible:false,reason:'not sampled',positionDelta:0,fov:0,yawCorrection:0,pitchCorrection:0,unresolved:0};
 const specifications=[['Head',.24],['Neck',.16],['Hips',.18],['LeftShoulder',.15],['RightShoulder',.15],['LeftHand',.13],['RightHand',.13],['LeftLeg',.14],['RightLeg',.14],['LeftFoot',.12],['RightFoot',.12],['LeftToeBase',.10],['RightToeBase',.10]];
 function bind(){if(rig===model)return;rig=model;cache.length=0;for(const[name,radius]of specifications){const bone=model?.getObjectByName('mixamorig'+name);if(!bone)throw Error('Body framing requires '+name);cache.push({bone,radius,point:new THREE.Vector3()});}}
 function angularBounds(){inverse.copy(camera.quaternion).invert();let minH=Infinity,maxH=-Infinity,minV=Infinity,maxV=-Infinity,behind=false;for(const x of cache){local.copy(x.point).sub(camera.position).applyQuaternion(inverse);const depth=-local.z;if(depth<=x.radius+.03){behind=true;continue;}const radius=Math.asin(Math.min(.95,x.radius/local.length())),h=Math.atan2(local.x,depth),v=Math.atan2(local.y,depth);minH=Math.min(minH,h-radius);maxH=Math.max(maxH,h+radius);minV=Math.min(minV,v-radius);maxV=Math.max(maxV,v+radius);}return{minH,maxH,minV,maxV,behind};}
 function apply(){
  state.frames++;state.eligible=false;state.yawCorrection=state.pitchCorrection=state.positionDelta=0;
  if(!gameActive||characterState().active!=='backspool'||!model||backspoolAnimations?.preview?.()){state.reason='inactive or different hero';return;}
  if(inputAiming()||window.threadrailGame?.state().precision){state.reason='aim owns composition';return;}
  bind();model.updateMatrixWorld(true);for(const x of cache)x.bone.getWorldPosition(x.point);basePosition.copy(camera.position);state.eligible=true;state.reason='native body composition';
  let adjusted=false;
  for(let iteration=0;iteration<3;iteration++){
   const b=angularBounds();if(b.behind){state.unresolved++;state.reason='body intersects camera near plane';break;}
   const margin=.86,need=2*Math.atan(Math.max(Math.tan((b.maxV-b.minV)/2)/margin,Math.tan((b.maxH-b.minH)/2)/(camera.aspect*margin)))*180/Math.PI;
   const fov=Math.min(86,Math.max(camera.fov,need));if(fov>camera.fov+.01){camera.fov=fov;camera.updateProjectionMatrix();adjusted=true;}
   const v=Math.atan(Math.tan(camera.fov*Math.PI/360)*margin),h=Math.atan(Math.tan(camera.fov*Math.PI/360)*camera.aspect*margin);
   const yaw=b.maxH-h>b.minH+h?(b.maxH+b.minH)/2:THREE.MathUtils.clamp(0,b.maxH-h,b.minH+h),pitch=b.maxV-v>b.minV+v?(b.maxV+b.minV)/2:THREE.MathUtils.clamp(0,b.maxV-v,b.minV+v);
   if(Math.max(Math.abs(yaw),Math.abs(pitch))<.0002)break;
   direction.set(Math.tan(yaw),Math.tan(pitch),-1).normalize().applyQuaternion(camera.quaternion).add(camera.position);camera.lookAt(direction);camera.updateMatrixWorld(true);state.yawCorrection+=yaw;state.pitchCorrection+=pitch;adjusted=true;
  }
  camera.updateMatrixWorld(true);state.positionDelta=basePosition.distanceTo(camera.position);state.fov=camera.fov;if(adjusted)state.adjusted++;
 }
 actionCamera.tick=function(dt){original(dt);apply();};
 window.v02BodyFramingState=()=>JSON.parse(JSON.stringify(state));return{state:window.v02BodyFramingState};
})();
