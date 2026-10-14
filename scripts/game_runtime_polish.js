// Static mesh broadphase preserves detailed triangles for actual ray hits.
const runtimePolish={beamRaycasts:0,beamCacheHits:0,cameraClamps:0};
function tagCollisionBounds(){for(const c of buildingColliders){c.mesh.userData.collisionBounds=c.box;c.mesh.userData.collisionOwner=c;}for(const c of propColliders){c.mesh.userData.collisionBounds=c.box;c.mesh.userData.collisionOwner=c;}}
function obstacleCandidates(start,end,padding=.3,targets=cameraObstacles){
 const area=new THREE.Box3(start.clone().min(end),start.clone().max(end)).expandByScalar(padding),out=[];
 for(const mesh of targets){if(!mesh.geometry?.attributes.position?.count)continue;let box=mesh.userData.collisionBounds;if(!box){mesh.updateMatrixWorld();if(!mesh.geometry.boundingBox)mesh.geometry.computeBoundingBox();box=mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld)}if(box.intersectsBox(area)&&(!mesh.userData.collisionOwner?.parts||mesh.userData.collisionOwner.parts.some(p=>p.box.intersectsBox(area))))out.push(mesh)}return out;
}
const beamRaycaster=new THREE.Raycaster(),visibilityRaycaster=new THREE.Raycaster(),cameraProbeRaycaster=new THREE.Raycaster();
function constrainCameraPosition(origin,candidate,aligned=false){
 const next=candidate.clone(),radius=.22;
 for(let pass=0;pass<2;pass++){
  const surface=Math.max(supportHeight(next.x,next.z,Math.max(origin.y,next.y))-.42,Math.hypot(next.x,next.z)<115?.4:0)+radius;
  if(next.y<surface){runtimePolish.cameraClamps++;if(aligned){const delta=next.clone().sub(origin),t=delta.y<0?THREE.MathUtils.clamp((origin.y-surface)/-delta.y,0,1):0;next.copy(origin).addScaledVector(delta,t)}else next.y=surface;}
  const direction=next.clone().sub(origin),distance=direction.length();if(distance<.01)break;direction.divideScalar(distance);let safe=distance;const right=new THREE.Vector3().crossVectors(direction,new THREE.Vector3(0,1,0)).normalize().multiplyScalar(radius),up=new THREE.Vector3(0,radius,0),offsets=[new THREE.Vector3(),right,right.clone().negate(),up,up.clone().negate()],targets=obstacleCandidates(origin,next,radius);
  for(const offset of offsets){cameraProbeRaycaster.set(origin.clone().add(offset),direction);cameraProbeRaycaster.far=distance;const hit=cameraProbeRaycaster.intersectObjects(targets,false)[0];if(hit)safe=Math.min(safe,Math.max(.03,hit.distance-radius));}
  if(safe<distance){next.copy(origin).addScaledVector(direction,safe);runtimePolish.cameraClamps++;}
 }
 return next;
}
const frameScheduler={accumulator:0,step:1/60,lastSteps:0,totalSteps:0,droppedTime:0,
 consume(elapsed){const bounded=Math.min(.1,Math.max(0,elapsed));this.droppedTime+=Math.max(0,elapsed-bounded);this.accumulator=Math.min(.1,this.accumulator+bounded);let steps=0;while(this.accumulator+1e-10>=this.step&&steps<6){this.accumulator=Math.max(0,this.accumulator-this.step);steps++}this.lastSteps=steps;this.totalSteps+=steps;return steps},
 reset(){this.accumulator=0;this.lastSteps=0;}
};
window.runtimePolishState=()=>({...runtimePolish,steps:frameScheduler.lastSteps,simulationHz:60,droppedTime:frameScheduler.droppedTime});
tagCollisionBounds();
