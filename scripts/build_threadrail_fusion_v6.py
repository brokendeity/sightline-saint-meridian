from pathlib import Path
import subprocess,sys
root=Path(__file__).resolve().parent.parent
subprocess.run([sys.executable,str(root/'scripts/build_threadrail_fusion_v5.py')],check=True)
s=(root/'SIGHTLINE_BACKSPOOL_THREADRAIL_FUSION_V5.html').read_text()
# Snapback consumes an existing genuine impulse and strain through the Drive transaction.
s=s.replace("'double-step': 8, rail: 8", "'double-step': 8, rail: 8, snapback: 12",1)
s=s.replace("if (mode === 'standard') return", "if(mode==='snapback'){const direction=unit(options.direction);return direction?{direction,magnitude:item.magnitude*Math.max(.5,Math.min(1,options.snapRetention||1))}:null;}\n    if (mode === 'standard') return",1)
s=s.replace("['launch', 'directional', 'ghoststep', 'double-step', 'rail']", "['launch', 'directional', 'ghoststep', 'double-step', 'rail', 'snapback']")
# Tension redirects existing kinetic motion; its output energy cannot exceed
# current kinetic energy plus the consumed contact's proposed impulse energy.
s=s.replace("const velocity=boundedVelocity(f.velocity,dv),applied=velocity.clone().sub(V(f.velocity));", "const velocity=mode==='snapback'?V(dv).normalize().multiplyScalar(Math.min(16,Math.sqrt(V(f.velocity).lengthSq()+V(dv).lengthSq()))):boundedVelocity(f.velocity,dv),applied=velocity.clone().sub(V(f.velocity));",1)
s=s.replace("length(validation.deltaVelocity) > length(deltaVelocity) + 1e-7", "(mode==='snapback'?length({x:frame.velocity.x+validation.deltaVelocity.x,y:frame.velocity.y+validation.deltaVelocity.y,z:frame.velocity.z+validation.deltaVelocity.z})**2>length(frame.velocity)**2+length(deltaVelocity)**2+1e-7:length(validation.deltaVelocity)>length(deltaVelocity)+1e-7)",1)
s=s.replace('const threadrailGame=(()=>{',(root/'scripts/game_snapback.js').read_text()+'\nconst threadrailGame=(()=>{',1)
needle=' const surf=createRailSurfPose(),surfBones=[];'
assert needle in s
s=s.replace(needle,needle+'''
 const snapback=createSnapback({clear,release:(direction,grade)=>{
  const accepted=release('snapback',{direction,snapRetention:grade==='CLEAN'?1:grade==='REDLINE'?.6:.8});return{ok:accepted,reason:accepted?'RELEASED':lastMessage,spent:accepted?drive.state().lastRelease?.spent:[]};
 }});
 function snapFrame(){return{position:plain(s.pos),ready:movementReady()&&!rail.state().current&&route.state().status!=='replaying',active:enabled(),paused:!gameActive};}
 function snapAction(){const result=snapback.state(snapFrame()).bank?snapback.release(snapFrame()):snapback.bank(snapFrame());say(result.reason);return result.ok;}
 const snapGeometry=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]),snapLine=new THREE.Line(snapGeometry,new THREE.LineBasicMaterial({color:0x89e5ee,transparent:true,opacity:.65}));snapLine.frustumCulled=false;snapLine.visible=false;scene.add(snapLine);
 function drawSnapback(){const st=snapback.state(snapFrame());snapLine.visible=enabled()&&gameActive&&!!st.bank;if(st.bank){const positions=snapGeometry.attributes.position;positions.setXYZ(0,st.bank.position.x,st.bank.position.y+.5,st.bank.position.z);positions.setXYZ(1,s.pos.x,s.pos.y+.5,s.pos.z);positions.needsUpdate=true;snapLine.material.color.setHex(st.tension>.96?0xff644a:st.tension>=.86?0xc3ffff:0x89e5ee);}}
''',1)
s=s.replace('function lifecycle(why){restoreSurfPose();','function lifecycle(why){snapback.cancel(why);snapLine.visible=false;restoreSurfPose();',1)
s=s.replace('  const f=frame();drive.update(dt,f);',"  if(backspoolCombat.staggered()||backspoolPowers.isRetracing()||route.state().status==='replaying')snapback.cancel('INTERRUPTED');snapback.update(dt,snapFrame());drawSnapback();\n  const f=frame();drive.update(dt,f);",1)
s=s.replace('held.add(code);if(code===',"held.add(code);if(code==='KeyU'){snapAction();return true;}if(code===",1)
s=s.replace('const actions={KeyE:', 'const actions={KeyU:snapAction,KeyE:',1)
s=s.replace("if(edge(3))interact();", "if(edge(3)){if(wheel)snapAction();else interact();}",1)
s=s.replace('surf:surf.state(),mastery:', 'snapback:snapback.state(snapFrame()),surf:surf.state(),mastery:',1)
s=s.replace('const api={cameraComposition,','const api={snapAction,cameraComposition,',1)
s=s.replace("hud.classList.toggle('wheel',wheel);","const snap=snapback.state(snapFrame());if(snap.bank)$('driveStatus').textContent+=' · SNAP '+Math.round(snap.tension*100)+'% · '+snap.remaining.toFixed(1)+'s';hud.classList.toggle('wheel',wheel);",1)
needle="$('threadrailCourse').onclick=drawCourse;"
assert needle in s
s=s.replace(needle,"const snapButton=document.createElement('button');snapButton.id='snapbackButton';snapButton.textContent='Snapback · U / LB+Y';snapButton.onclick=snapAction;$('equipmentOptions').append(snapButton);"+needle,1)
s=s.replace("Shift / L3: toggle Flow · E / RB: Drive · R / X: Threadrail · C: evade · Tab / LB: modes", "Shift/L3 Flow · E/RB Drive · R/X rail · U/LB+Y Snapback · C evade")
# After the contact settle, resumed locomotion can leave a long landing clip.
s=s.replace("if(s.onGround&&landing){const age=localClock-landing.began;if(age<landing.duration)","if(s.onGround&&landing){const age=localClock-landing.began;if(age>=.18&&getRawMoveInput().mag>.15&&Math.hypot(s.vel.x,s.vel.z)>2){landing=null;return false;}if(age<landing.duration)",1)
(root/'SIGHTLINE_BACKSPOOL_THREADRAIL_FUSION_V6.html').write_text(s)
print(root/'SIGHTLINE_BACKSPOOL_THREADRAIL_FUSION_V6.html')
