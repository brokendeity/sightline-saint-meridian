function activateGame(){if(window.verticalViews?.active())return;frameScheduler.reset();$('start').textContent='Resume Flight';document.body.classList.toggle('touchPlay',matchMedia('(pointer: coarse)').matches);gameActive=true;menu.style.display='none';hud.style.display='block';clock.getDelta()}
function pointerFallback(){if(!gameActive)return;freeMouse=true;setInputMode('KEYBOARD / MOUSE');showBanner('FREE CURSOR MODE','MOVE MOUSE TO LOOK • ESC TO PAUSE')}
function startGame(withPointer=false){if(window.verticalViews?.active())return;if(courier.resultsOpen&&sightlinePowersEnabled()||!gameReady)return;gameAudio.unlock();clearInput();activateGame();if(withPointer&& !matchMedia('(pointer: coarse)').matches){setInputMode('KEYBOARD / MOUSE');try{const result=renderer.domElement.requestPointerLock();if(result&&result.catch)result.catch(pointerFallback)}catch(_){pointerFallback()}}else setInputMode(matchMedia('(pointer: coarse)').matches?'TOUCH':'CONTROLLER')}
function pauseGame(){window.threadrailGame?.lifecycle('PAUSE');window.backspoolAdvanced?.reset('PAUSE');window.backspoolFlow?.reset('PAUSE');window.backspoolCombat?.clearBuffer();if(courier.resultsOpen&&sightlinePowersEnabled())return;frameScheduler.reset();perceptionClock.reset();velocityTunnel.reset();gameActive=false;if(gameAudio.ctx)gameAudio.master.gain.setTargetAtTime(0,gameAudio.ctx.currentTime,.04);document.body.classList.remove('touchPlay');clearInput();menu.style.display='flex';hud.style.display='none';document.body.classList.remove('locked');if(pointer&&document.exitPointerLock)document.exitPointerLock()}
window.addEventListener('blur',()=>{if(gameActive)pauseGame()});document.addEventListener('visibilitychange',()=>{if(document.hidden&&gameActive)pauseGame()});document.addEventListener('pointerlockerror',pointerFallback);
function setPadConnected(gp){if(!gp)return;const changed=!pad.connected||pad.index!==gp.index||pad.id!==gp.id;pad.connected=true;pad.index=gp.index;pad.id=gp.id||'Gamepad';pad.mapping=gp.mapping||'';if(changed){pad.prevButtons=[];updateControllerUI();showBanner('CONTROLLER DETECTED',controllerName(pad.id))}}
function clearPad(){window.threadrailGame?.lifecycle('CONTROLLER DISCONNECTED');window.backspoolAdvanced?.padTether(false);const was=pad.connected;pad.connected=false;pad.index=null;pad.id='';pad.mapping='';pad.prevButtons=[];pad.jumpQueued=pad.fireQueued=false;Object.assign(input.actions,{moveX:0,moveY:0,moveMag:0,lookX:0,lookY:0,lookMag:0,aim:false,brake:false,sprint:false});updateControllerUI();if(was&&!pointer&&gameActive)pauseGame()}
function pollGamepad(){
 const gp=findGamepad();if(!gp){if(pad.connected)clearPad();return}setPadConnected(gp);if(gp.mapping!=="standard"){Object.keys(input.actions).forEach(k=>input.actions[k]=typeof input.actions[k]==="boolean"?false:0);return}
 if(window.verticalViews?.poll(gp))return;
 if(handleHeroSwitchChord(gp)){pad.prevButtons=(gp.buttons||[]).map(b=>!!b&&(b.pressed||b.value>.1));return;}
 // Raw device -> normalized action values. Y inversion happens once, here.
 const move=radialDeadzone(axis(gp,'moveX'),-axis(gp,'moveY'),.10);
 const look=radialDeadzone(axis(gp,'lookX'),-axis(gp,'lookY'),.10);
 input.actions.moveX=move.x;input.actions.moveY=move.y;input.actions.moveMag=move.mag;
 input.actions.lookX=look.x;input.actions.lookY=look.y;input.actions.lookMag=look.mag;
 const now=(gp.buttons||[]).map((b,i)=>!!b&&(b.pressed||b.value>(i===GamepadMap.buttons.fire?.10:.5)));
 const edge=name=>{const i=GamepadMap.buttons[name];return !!now[i]&&!pad.prevButtons[i]};
 input.actions.aim=button(gp,'aim').value>.10;
 input.actions.brake=sightlinePowersEnabled()&&(button(gp,'brake').pressed||button(gp,'brake').value>.5);
 input.actions.sprint=(sightlinePowersEnabled()&&button(gp,'sprint').pressed)||button(gp,'sprintAlt').pressed;
 if(move.mag>.04||look.mag>.04||now.some(Boolean))setInputMode('CONTROLLER');
 if(courier.resultsOpen&&sightlinePowersEnabled()){if(edge('jump')||edge('pause'))continueCourierMission();pad.prevButtons=now;return}
 if(gameReady&&!gameActive&&(edge('jump')||edge('pause'))){startGame(false);pad.prevButtons=now;return}
 if(window.threadrailGame?.poll(gp,now)){pad.prevButtons=now;return;}
 if(gameActive){
  window.backspoolAdvanced?.padTether(!!now[8]&&!!now[7]);if(now[8]&&!now[7]&&!now.slice(12,16).some(Boolean)&&!pad.prevButtons[8])window.backspoolPosture?.toggle();
  if(edge('jump'))queueJump();
  if(edge('dodge'))doDodge();
  if(sightlinePowersEnabled()){if((edge('railRead')||edge('railReadAlt'))&&!now[8])toggleRailRead();}else{if(edge('railRead'))backspoolCombat.cycleStyle();if(edge('brake'))backspoolCombat.requestHeavy();}
  if(edge('brace'))doBrace();
  if(edge('fire')&&sightlinePowersEnabled())pad.fireQueued=true;
  if(edge('recenter')){if(sightlinePowersEnabled())recenterCamera();else backspoolCombat.toggleLock();}
  if(edge('reset')&&!(now[8]&&window.characterState?.().active==='backspool'))resetPlayer();
  if(edge('shoulderLeft')&&!now[8])swapShoulder(-1);
  if(edge('shoulderRight')&&!now[8])swapShoulder(1);
  if(edge('pause'))pauseGame();
 }
 pad.prevButtons=now;
}
window.addEventListener('keydown',e=>{if(e.code==='Space'&&!e.repeat)window.backspoolVaultCourse?.noteJump();},true);
for(const type of ['keydown','keyup'])window.addEventListener(type,e=>{if(window.threadrailGame?.handleKey(e,type==='keyup')){e.preventDefault();e.stopImmediatePropagation();}},true);
window.addEventListener('gamepadconnected',e=>setPadConnected(e.gamepad));window.addEventListener('gamepaddisconnected',e=>{if(pad.index===e.gamepad.index)clearPad()});
$('start').onclick=()=>startGame(true);renderer.domElement.addEventListener('click',()=>{if(gameActive&&!pointer&&lastInputMode==='KEYBOARD / MOUSE'){try{const retry=renderer.domElement.requestPointerLock();if(retry?.catch)retry.catch(pointerFallback)}catch(_){pointerFallback()}}});document.addEventListener('pointerlockchange',()=>{pointer=document.pointerLockElement===renderer.domElement;if(window.verticalViews?.active()){if(pointer)document.exitPointerLock();return;}if(pointer){freeMouse=false}if(pointer&&!(courier.resultsOpen&&sightlinePowersEnabled())){gameActive=true;menu.style.display='none';hud.style.display='block';setInputMode('KEYBOARD / MOUSE')}else if(gameActive&&!pad.connected&&lastInputMode==='KEYBOARD / MOUSE'){pauseGame()}});document.addEventListener('contextmenu',e=>e.preventDefault());
const keyMap={KeyW:'w',KeyA:'a',KeyS:'s',KeyD:'d',ShiftLeft:'shift',ShiftRight:'shift',Space:'space',KeyQ:'q',KeyE:'e',KeyV:'v',KeyC:'c'};
document.addEventListener('keydown',e=>{if(e.code==='Escape'){if(gameActive)pauseGame();return}if(!gameActive)return;setInputMode('KEYBOARD / MOUSE');if(keyMap[e.code]!==undefined){keys[keyMap[e.code]]=true;e.preventDefault()}if(e.code==='Space'&&!e.repeat)queueJump();else if(e.code==='Space')mechanicPolish.keyJumpHeld=true;if(e.code==='KeyE'&&!e.repeat)doDodge();if(e.code==='KeyQ'&&!e.repeat)doBrace();if(e.code==='KeyV'&&!e.repeat)toggleRailRead();if(e.code==='KeyR'&&!e.repeat)resetPlayer();if(e.code==='KeyF'&&!e.repeat)recenterCamera();if(e.code==='KeyZ'&&!e.repeat)swapShoulder();if(e.code==='KeyO'&&!e.repeat&&model){modelYaw+=Math.PI;model.rotation.y=modelYaw;showBanner('MODEL FACING FLIPPED','ORIENTATION DEBUG TOGGLE')}});document.addEventListener('keyup',e=>{if(keyMap[e.code]!==undefined)keys[keyMap[e.code]]=false});
document.addEventListener('mousedown',e=>{if(!gameActive||(!pointer&&!freeMouse))return;setInputMode('KEYBOARD / MOUSE');if(e.button===2){mouse.r=true;s.aiming=true;document.body.classList.add('aim')}if(e.button===0){mouse.l=true;if(!sightlinePowersEnabled())backspoolCombat.pressAttack();if(mouse.r&&sightlinePowersEnabled()){aimRay();queueOrLaunch()}}});document.addEventListener('mouseup',e=>{if(e.button===2){mouse.r=false;s.aiming=false;document.body.classList.remove('aim');document.body.classList.remove('locked');if(s.mode===P.AIM)setMode(s.onGround?P.GROUND:P.AIR)}if(e.button===0){mouse.l=false;window.backspoolCombat?.releaseAttack();}});document.addEventListener('mousemove',e=>{if(!gameActive||(!pointer&&!freeMouse))return;setInputMode('KEYBOARD / MOUSE');const sens=mouse.r?.00118:.00205;const dx=pointer?e.movementX:lastMouseX===null?0:e.clientX-lastMouseX,dy=pointer?e.movementY:lastMouseY===null?0:e.clientY-lastMouseY;lastMouseX=e.clientX;lastMouseY=e.clientY;cam.targetYaw-=THREE.MathUtils.clamp(dx,-80,80)*sens;cam.targetPitch=clampPitch(cam.targetPitch-THREE.MathUtils.clamp(dy,-80,80)*sens);});

// Touch movement and look use the same named actions as keyboard/controller.
function touchHold(id,action){const el=$(id);el.addEventListener('pointerdown',e=>{e.preventDefault();el.setPointerCapture(e.pointerId);if(gameActive)input.actions[action]=true});const end=()=>input.actions[action]=false;el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);el.addEventListener('lostpointercapture',end)}
$('tSprint').addEventListener('pointerdown',e=>{if(window.characterState?.().active==='backspool'&&window.threadrailGame){e.preventDefault();e.stopImmediatePropagation();threadrailGame.toggleSprint();}},true);for(const event of ['pointerup','pointercancel','lostpointercapture'])$('tSprint').addEventListener(event,e=>{if(window.characterState?.().active==='backspool'){e.stopImmediatePropagation();input.actions.sprint=false;}},true);touchHold('tAim','aim');touchHold('tBrake','brake');touchHold('tSprint','sprint');
$('tFire').onclick=()=>{if(gameActive&&inputAiming()){aimRay();queueOrLaunch()}};$('tJump').onclick=null;$('tJump').onpointerdown=e=>{e.preventDefault();e.stopPropagation();$('tJump').setPointerCapture(e.pointerId);window.backspoolAdvanced?.setTouchJump(true);window.backspoolFlow?.setTouchJump(true);if(window.characterState?.().active==='backspool')threadrailGame.jump();else queueJump();};for(const event of ['pointerup','pointercancel','lostpointercapture'])$('tJump').addEventListener(event,()=>{window.backspoolAdvanced?.setTouchJump(false);window.backspoolFlow?.setTouchJump(false);});$('tDodge').onclick=doDodge;$('tBrace').onclick=doBrace;$('tRead').onclick=toggleRailRead;$('tPause').onclick=pauseGame;
const movePad=$('movePad');let movePointer=null;
movePad.addEventListener('pointerdown',e=>{if(!gameActive)return;movePointer=e.pointerId;movePad.setPointerCapture(e.pointerId);setInputMode('TOUCH')});
movePad.addEventListener('pointermove',e=>{if(e.pointerId!==movePointer||!gameActive)return;const r=movePad.getBoundingClientRect(),m=radialDeadzone((e.clientX-r.x-r.width/2)/45,-(e.clientY-r.y-r.height/2)/45);input.actions.moveX=m.x;input.actions.moveY=m.y;input.actions.moveMag=m.mag});
function endTouchMove(){movePointer=null;input.actions.moveX=input.actions.moveY=input.actions.moveMag=0}movePad.addEventListener('pointerup',endTouchMove);movePad.addEventListener('pointercancel',endTouchMove);movePad.addEventListener('lostpointercapture',endTouchMove);
const lookPad=$('lookPad');let lookPointer=null,lookX=0,lookY=0;lookPad.addEventListener('pointerdown',e=>{lookPointer=e.pointerId;lookX=e.clientX;lookY=e.clientY;lookPad.setPointerCapture(e.pointerId)});lookPad.addEventListener('pointermove',e=>{if(e.pointerId!==lookPointer||!gameActive)return;cam.targetYaw-=(e.clientX-lookX)*.004;cam.targetPitch=clampPitch(cam.targetPitch-(e.clientY-lookY)*.004);lookX=e.clientX;lookY=e.clientY});lookPad.addEventListener('pointerup',()=>lookPointer=null);lookPad.addEventListener('pointercancel',()=>lookPointer=null);

