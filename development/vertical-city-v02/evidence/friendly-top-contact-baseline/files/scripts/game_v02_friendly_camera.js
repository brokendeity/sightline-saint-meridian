/* Camera request planner only: the native director still owns position and its
 * existing static collision pass. Body framing remains orientation/FOV only. */
window.v02FriendlyCamera=(()=>{
 const names=['Hips','Head','LeftHand','RightHand','LeftFoot','RightFoot'];
 const points=[],right=new THREE.Vector3(),shift=new THREE.Vector3();let rig=null,offsetX=0,offsetY=0,goalX=0,goalY=0,quiet=0,lastYaw=null,lastPitch=null;
 const state={frames:0,adjusted:0,checks:0,baseScore:0,goalScore:0,offset:[0,0],goal:[0,0],cpuMs:0,reason:'not sampled',positionOwner:'native actionCamera',manualHold:false};
 function reset(){rig=null;points.length=0;offsetX=offsetY=goalX=goalY=quiet=0;lastYaw=lastPitch=null;}
 function bind(){if(rig===model)return;rig=model;points.length=0;for(const name of names){const bone=model?.getObjectByName('mixamorig'+name);if(bone)points.push({bone,name,point:new THREE.Vector3(),weight:name==='Head'||name==='Hips'?8:1});}}
 function plan(origin,native,dt,options={}){
  if(!gameActive||characterState().active!=='backspool'||!model||characterState().busy){reset();state.reason='inactive or other hero';return native;}
  const begun=performance.now();state.frames++;bind();model.updateMatrixWorld(true);for(const p of points)p.bone.getWorldPosition(p.point);
  const actors=window.v02FriendlyContacts?.cameraActors(s.pos,8)||[];
  const rawLook=Math.abs(input.actions.lookX||0)+Math.abs(input.actions.lookY||0)>.001;
  const changed=options.mode==='exploration'&&lastYaw!==null&&(Math.abs(angleDelta(lastYaw,cam.targetYaw))>.00001||Math.abs(lastPitch-cam.targetPitch)>.00001);
  const manual=rawLook||changed||inputAiming()||window.threadrailGame?.precisionActive?.()||options.aligned;
  lastYaw=cam.targetYaw;lastPitch=cam.targetPitch;state.manualHold=!!manual;
  const dx=native.x-origin.x,dz=native.z-origin.z,length=Math.hypot(dx,dz);right.set(length?dz/length:1,0,length?-dx/length:0);
  function position(x,y){return native.clone().addScaledVector(right,x).add(shift.set(0,y,0));}
  function score(position){let total=0;for(const p of points)for(const actor of actors){state.checks++;if(v02FriendlyContactCore.sweep(position,p.point,actor,{radius:0,height:0,offset:0,margin:.06})){total+=p.weight;break;}}return total;}
  state.baseScore=actors.length?score(native):0;
  if(!manual){
   const currentScore=actors.length?score(position(goalX,goalY)):0;
   if(state.baseScore>0){
    quiet=0;
    if(currentScore>0||Math.abs(goalX)+goalY<.01){
     const choices=[];
     for(const y of[0,.6,1.2])for(const x of[0,-.6,.6,-1.2,1.2,-1.8,1.8,-2.4,2.4]){
      const p=position(x,y),hit=score(p);choices.push({x,y,p,hit,cost:hit*100+Math.abs(x)*.16+y*.3+Math.abs(x-goalX)*.04});
     }
     choices.sort((a,b)=>a.cost-b.cost);let chosen=null;
     // Bound extra static probes. A proposal which collapses against a wall is
     // rescored after the SAME native constraint, never forced through it.
     for(const c of choices.slice(0,4)){
      const safe=constrainCameraPosition(origin,c.p,false);if(safe.distanceTo(origin)<Math.min(2.4,native.distanceTo(origin)*.8))continue;
      const hit=score(safe),cost=hit*100+c.cost-c.hit*100;
      if(!chosen||cost<chosen.cost)chosen={...c,hit,cost};
     }
     if(chosen){goalX=chosen.x;goalY=chosen.y;state.goalScore=chosen.hit;state.reason='friendly body shoulder clearance';}
     else state.reason='no safe camera proposal';
    }
   }else{quiet+=dt;if(quiet>.6){goalX=goalY=0;state.goalScore=0;state.reason='native composition restored';}}
  }else state.reason='manual/precision composition held';
  const blend=1-Math.exp(-10*dt);offsetX+=(goalX-offsetX)*blend;offsetY+=(goalY-offsetY)*blend;
  if(Math.abs(offsetX)<.00001)offsetX=0;if(Math.abs(offsetY)<.00001)offsetY=0;
  if(Math.abs(offsetX)+offsetY>.001)state.adjusted++;
  state.offset=[offsetX,offsetY];state.goal=[goalX,goalY];state.cpuMs=performance.now()-begun;
  return position(offsetX,offsetY);
 }
 // A lateral peek must still frame the hero rather than keeping a far-away
 // look target which pushes the body beneath the left vitals panel. This is
 // consumed inside the original exploration director, not a final overwrite.
 function focus(native,anchor,view){
  if(characterState().active!=='backspool'||state.manualHold||inputAiming())return native;
  const weight=Math.min(1,(Math.abs(offsetX)+offsetY)/1.2);
  return native.clone().lerp(anchor.clone().addScaledVector(view,2),weight);
 }
 window.v02FriendlyCameraState=()=>JSON.parse(JSON.stringify(state));return{plan,focus,reset,state:window.v02FriendlyCameraState};
})();
