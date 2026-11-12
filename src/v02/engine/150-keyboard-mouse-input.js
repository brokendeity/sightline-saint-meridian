// ---------- input ----------
function axialDeadzone(v,d=.1){const a=Math.abs(v);if(a<=d)return 0;return Math.sign(v)*(a-d)/(1-d)}
function radialDeadzone(x,y,d=.1){
 const mag=Math.hypot(x,y);if(mag<=d)return{x:0,y:0,mag:0};
 const clamped=Math.min(1,mag),scaled=(clamped-d)/(1-d),inv=1/mag;
 return{x:x*inv*scaled,y:y*inv*scaled,mag:scaled};
}
function axis(gp,name){const i=GamepadMap.axes[name];return gp.axes&&Number.isFinite(gp.axes[i])?gp.axes[i]:0}
function button(gp,name){const i=GamepadMap.buttons[name],b=gp.buttons&&gp.buttons[i];return b||{pressed:false,value:0}}
function getRawMoveInput(){return window.threadrailGame?.steering()||getPhysicalMoveInput();}
function getPhysicalMoveInput(){
 const kx=(keys.d?1:0)-(keys.a?1:0),ky=(keys.w?1:0)-(keys.s?1:0);
 let x=kx+input.actions.moveX,y=ky+input.actions.moveY;
 const len=Math.hypot(x,y);if(len>1){x/=len;y/=len}
 return{x,y,mag:Math.min(1,Math.hypot(x,y))};
}
function getMoveInput(){if(window.threadrailGame?.steering()&&!window.backspoolCombat?.movementLocked()&&!window.backspoolPowers?.isRetracing())return threadrailGame.steering();
 if(window.backspoolPowers?.isRetracing()||window.backspoolCombat?.movementLocked())return{x:0,y:0,mag:0};
 const kx=(keys.d?1:0)-(keys.a?1:0),ky=(keys.w?1:0)-(keys.s?1:0);
 let x=kx+input.actions.moveX,y=ky+input.actions.moveY;
 const len=Math.hypot(x,y);if(len>1){x/=len;y/=len}
 return{x,y,mag:Math.min(1,Math.hypot(x,y))};
}
function getCameraBasis(){
 const forward=new THREE.Vector3(0,0,-1),right=new THREE.Vector3(1,0,0);
 const rotation=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),cam.yaw);
 forward.applyQuaternion(rotation);right.applyQuaternion(rotation);
 forward.y=0;right.y=0;forward.normalize();right.normalize();
 return{forward,right};
}
function getCameraRelativeMoveVector(moveInput=getMoveInput()){
 const{forward,right}=getCameraBasis();
 const moveDirection=new THREE.Vector3().addScaledVector(forward,moveInput.y).addScaledVector(right,moveInput.x);
 if(moveDirection.length()>1)moveDirection.normalize();
 return moveDirection;
}
function inputAiming(){return sightlinePowersEnabled()&&(mouse.r||input.actions.aim)}
function inputSprinting(){return window.characterState?.().active==='backspool'&&window.threadrailGame?threadrailGame.sprinting():keys.shift||input.actions.sprint}
function inputBraking(){return keys.c||input.actions.brake}

