/* V02 close camera (user request, 2026-11-05): "when I aim lock with Sightline the camera comes closer to the
   character; that view should be the default position of the camera for each character".
   Sightline's grounded aim-lock framing in updateCamera is distance 3.25 m, height 0.25 m, shoulder 1.05 and FOV 48°.
   This module makes that the default exploration framing for every hero (Sightline, Backspool and Loadout), in place
   of the previous default of 4.25 m, 0.32 m, 1.35 and 56°.
   - Sprint keeps the same pull-back it had relative to the default (+0.4 m, +4°): 3.65 m and 52°, was 4.65 m and 60°.
   - Reduced motion: the ground FOV is 48°, was 56°.
   - Respawn places the camera at the new default, so a reset does not start 1 m further back at 56° and zoom in.
   - Backspool and Loadout: the build loads body framing v3 in place of v2. v3 still keeps their whole body, head to
     toes, inside 86% of the frame, but no longer forces the floor patch around the feet into view; at this distance
     that patch tilted the camera 14.8 degrees down, with the horizon at the top of the screen.
   - Unchanged: aiming (it now keeps the same framing and still slows look speed), rail flight, take-off, air,
     uncontrolled, Backspool acrobatics, the Threadrail and combat cameras, friendly clearance and the collision pass.
     The native updateCamera reads these values through the hooks in build_close_camera_candidate.py, and falls back
     to its own numbers if this module is not loaded. */
(function(){
 'use strict';
 const AIM_LOCK={distance:3.25,height:.25,shoulder:1.05,fov:48};
 const SPRINT_EXTRA={distance:.4,fov:4};
 const api={
  distance:AIM_LOCK.distance,height:AIM_LOCK.height,shoulder:AIM_LOCK.shoulder,fov:AIM_LOCK.fov,
  sprintDistance:AIM_LOCK.distance+SPRINT_EXTRA.distance,sprintFov:AIM_LOCK.fov+SPRINT_EXTRA.fov,
  // Called by resetPlayer right after its native camera snap (which assumes the old default).
  resetPose(){
   const view=cameraForward(cam.yaw,cam.pitch).normalize(),right=new THREE.Vector3(Math.cos(cam.yaw),0,-Math.sin(cam.yaw));
   const focus=s.pos.clone().add(new THREE.Vector3(0,1.32,0));
   camera.position.copy(focus).addScaledVector(view,-AIM_LOCK.distance).addScaledVector(right,AIM_LOCK.shoulder*Math.min(1,camera.aspect/1.4)).add(new THREE.Vector3(0,AIM_LOCK.height,0));
   camera.fov=AIM_LOCK.fov;
  },
  state:()=>({aimLock:{...AIM_LOCK},sprint:{distance:AIM_LOCK.distance+SPRINT_EXTRA.distance,fov:AIM_LOCK.fov+SPRINT_EXTRA.fov},previous:{distance:4.25,height:.32,shoulder:1.35,fov:56,sprintDistance:4.65,sprintFov:60}})
 };
 window.v02CloseCamera=Object.freeze(api);
})();
