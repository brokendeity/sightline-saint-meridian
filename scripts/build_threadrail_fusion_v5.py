from pathlib import Path
import subprocess,sys
root=Path(__file__).resolve().parent.parent
subprocess.run([sys.executable,str(root/'scripts/build_threadrail_fusion_v4.py')],check=True)
s=(root/'SIGHTLINE_BACKSPOOL_THREADRAIL_FUSION_V4.html').read_text()
needle='const threadrailGame=(()=>{'
assert s.count(needle)==1
s=s.replace(needle,(root/'scripts/game_rail_surf_pose.js').read_text()+'\n'+needle,1)
needle=' const mastery=createRailMastery();'
s=s.replace(needle,needle+'''
 const surf=createRailSurfPose(),surfBones=[];
 function restoreSurfPose(){for(const saved of surfBones)saved.bone.quaternion.copy(saved.rotation);surfBones.length=0;}
 function applySurfPose(dt){
  const rs=rail.state(),current=rs.current,raw=getRawMoveInput();
  const view=surf.update(dt,{active:!!current,railId:current?.railId,speed:current?Math.abs(current.signedSpeed):0,yaw:s.yaw,lateral:raw.x,braking:raw.y<-.35});
  if(!view.active||!model)return;
  const offsets=view.offsets;
  for(const [name,x,z]of [['Spine',offsets.spinePitch,offsets.spineRoll],['Spine1',offsets.spinePitch*.4,0],['LeftUpLeg',-offsets.knee*.5,0],['RightUpLeg',-offsets.knee*.5,0],['LeftLeg',offsets.knee,0],['RightLeg',offsets.knee,0]]){
   const bone=model.getObjectByName('mixamorig'+name);if(!bone)continue;surfBones.push({bone,rotation:bone.quaternion.clone()});bone.quaternion.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(x,0,z)));
  }model.updateMatrixWorld(true);
 }
''',1)
# Restore the previous layer before normal animation evaluates. Never compound offsets.
s=s.replace('beginFrame:()=>{coordinator.begin();','beginFrame:()=>{restoreSurfPose();coordinator.begin();',1)
s=s.replace('function afterPose(dt){if(!enabled()||!gameActive)return;','function afterPose(dt){if(!enabled()||!gameActive)return;applySurfPose(dt);',1)
s=s.replace('function lifecycle(why){deploy.cancel(why);','function lifecycle(why){restoreSurfPose();surf.reset();deploy.cancel(why);',1)
s=s.replace('mastery:mastery.state(),deployment:', 'surf:surf.state(),mastery:mastery.state(),deployment:',1)
# Brake without masquerading as a banked Drive or changing junction intent.
s=s.replace('    function previewDrive(deltaVelocity) {',"""    function brake(amount) {
      if(!current)return fail('not-attached');
      if(!Number.isFinite(amount)||amount<0)return fail('invalid-brake');
      var segment=rails.get(current.railId),reason=railReason(segment);if(reason)return fail(reason);
      current.signedSpeed=Math.sign(current.signedSpeed)*Math.max(0,Math.abs(current.signedSpeed)-Math.min(amount,1));
      current.speed=Math.abs(current.signedSpeed);current.velocity=mul(segment.tangent,current.signedSpeed);
      return result(true,'braking');
    }
    function previewDrive(deltaVelocity) {""",1)
s=s.replace('applyDrive: applyDrive, reset: reset','applyDrive: applyDrive, brake: brake, reset: reset',1)
# Braking removes kinetic energy through the existing checked rail Drive projection.
needle='  motion=motion||rail.update(dt,f);'
assert needle in s
s=s.replace(needle,"  if(rail.state().current&&getRawMoveInput().y<-.35){rail.brake(5*dt);}\n"+needle,1)
# Keep precision A visibly attached while aiming/throwing B.
s=s.replace(' const formingGeometry='," const pendingDevice=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,.19,8),new THREE.MeshStandardMaterial({color:0x62818a,emissive:0x1e8696,emissiveIntensity:.7,roughness:.55}));pendingDevice.visible=false;scene.add(pendingDevice);\n const formingGeometry=",1)
s=s.replace('function drawProjectiles(){const deployment=',"function drawProjectiles(){pendingDevice.visible=enabled()&&!!pendingAnchor&&validAnchor(pendingAnchor);if(pendingDevice.visible)pendingDevice.position.copy(V(pendingAnchor.contact));const deployment=",1)
s=s.replace("shots.length===2;if(formingLine.visible){const a=V(shots[0].target.contact),b=V(shots[1].target.contact)","(shots.length===2||!!pendingAnchor);if(formingLine.visible){const a=V(pendingAnchor?.contact||shots[0].target.contact),b=V(shots[shots.length-1].target.contact)",1)
s=s.replace('formingLine.visible=false;cartridgeMeshes.forEach','formingLine.visible=false;pendingDevice.visible=false;cartridgeMeshes.forEach',1)
s=s.replace("hud.classList.toggle('wheel',wheel);", "if(rail.state().current)$('driveStatus').textContent+=' · '+surf.state().phase.toUpperCase();hud.classList.toggle('wheel',wheel);",1)
(root/'SIGHTLINE_BACKSPOOL_THREADRAIL_FUSION_V5.html').write_text(s)
print(root/'SIGHTLINE_BACKSPOOL_THREADRAIL_FUSION_V5.html')
