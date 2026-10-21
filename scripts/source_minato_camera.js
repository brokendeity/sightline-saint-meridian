/* Original camera lens convention recovered from saved FUN_1412b7510 and
 * FUN_1412b8ac0: tanY = viewportHeight / viewportWidth * tan(horizontalFov/2).
 * This helper converts only a centered full-viewport projection to Three.js's
 * vertical FOV convention. Original viewport cropping/parent matrices remain
 * separate unresolved composition inputs. No hidden aspect or FOV clamps.
 */
(function(root){
 function horizontalToVertical(horizontalDegrees,aspect){
  if(!Number.isFinite(horizontalDegrees)||horizontalDegrees<=0||horizontalDegrees>=180)throw new RangeError('Horizontal FOV must be finite and inside (0,180)');
  if(!Number.isFinite(aspect)||aspect<=0)throw new RangeError('Viewport aspect must be positive and finite');
  return Math.atan(Math.tan(horizontalDegrees*Math.PI/360)/aspect)*360/Math.PI;
 }
 function projection(horizontalDegrees,width,height){
  if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)throw new RangeError('Viewport dimensions must be positive and finite');
  return {horizontalFov:horizontalDegrees,verticalFov:horizontalToVertical(horizontalDegrees,width/height),aspect:width/height,convention:'source horizontal FOV; centered full-viewport conversion',sourceEvidence:['0x1412b7510','0x1412b8ac0'],originalCompositionVerified:false};
 }
 // Compose recovered standalone ANM camera channels in the very same source
 // coordinate frame as the actor/effect geometry. Do not manufacture an actor
 // parent: the pilot camera is an ANM other-entry with clump index -1.
 function compose(THREE,channels,sourceToWorld,parentToWorld){
  const finite=(a,n)=>Array.isArray(a)&&a.length===n&&a.every(Number.isFinite);
  if(!finite(channels?.position,3)||!finite(channels?.quaternion,4))throw new RangeError('Recovered camera requires complete finite position and quaternion channels');
  const q=new THREE.Quaternion().fromArray(channels.quaternion);
  if(q.lengthSq()<1e-12)throw new RangeError('Recovered camera quaternion has zero length');
  // ANM stores inverse rotations, matching the retained importer conversion.
  q.normalize().conjugate();
  const pose=new THREE.Matrix4().compose(new THREE.Vector3().fromArray(channels.position),q,new THREE.Vector3(1,1,1));
  const world=new THREE.Matrix4().multiplyMatrices(sourceToWorld,pose);
  if(!world.elements.every(Number.isFinite)||Math.abs(world.determinant())<1e-16)throw new RangeError('Recovered camera coordinate transform is singular or non-finite');
  const local=parentToWorld?new THREE.Matrix4().multiplyMatrices(parentToWorld.clone().invert(),world):world.clone();
  const position=new THREE.Vector3(),quaternion=new THREE.Quaternion(),scale=new THREE.Vector3();local.decompose(position,quaternion,scale);
  if(![...position.toArray(),...quaternion.toArray()].every(Number.isFinite))throw new RangeError('Recovered camera composition produced a non-finite pose');
  return {position,quaternion:quaternion.normalize(),worldMatrix:world,localMatrix:local};
 }
 function apply(THREE,camera,channels,sourceToWorld){
  const fov=horizontalToVertical(channels?.horizontalFov,camera.aspect);
  camera.parent?.updateWorldMatrix(true,false);
  const result=compose(THREE,channels,sourceToWorld,camera.parent?.matrixWorld);
  camera.position.copy(result.position);camera.quaternion.copy(result.quaternion);camera.fov=fov;
  camera.updateProjectionMatrix();camera.updateMatrixWorld(true);return result;
 }
 const api={horizontalToVertical,projection,compose,apply};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.SourceMinatoCamera=api;
})(typeof window!=='undefined'?window:globalThis);
