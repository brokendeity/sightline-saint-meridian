/* Read-only diagnostic attached to normal-input route tests. It updates derived
 * world/projection matrices, never camera, actor, input or simulation state. */
async function install(page){await page.evaluate(()=>{
 let frames=0,captures=0;const bones={head:model.getObjectByName('mixamorigHead'),hips:model.getObjectByName('mixamorigHips')};
 if(!bones.head||!bones.hips)throw Error('Route camera diagnostic requires the actual animated hero rig');
 scene.updateMatrixWorld(true);
 window.v02RouteCameraProbe=state=>{
  if(++frames%6)return undefined;
  model.updateMatrixWorld(true);camera.updateMatrixWorld(true);
  const targets={};
  for(const[name,bone]of Object.entries(bones)){
   const point=bone.getWorldPosition(new THREE.Vector3()),ndc=point.clone().project(camera),delta=point.clone().sub(camera.position),distance=delta.length();
   const hits=new THREE.Raycaster(camera.position,delta.normalize(),0,Math.max(0,distance-.02)).intersectObjects(obstacleCandidates(camera.position,point),false);
   const blocker=hits.find(hit=>{const m=Array.isArray(hit.object.material)?hit.object.material[hit.face?.materialIndex||0]:hit.object.material;return m?.visible!==false&&!(m?.transparent&&m.opacity<.5)});
   targets[name]={world:point.toArray(),ndc:ndc.toArray(),framed:Math.abs(ndc.x)<1&&Math.abs(ndc.y)<1&&ndc.z>-1&&ndc.z<1,occluded:!!blocker,blocker:blocker?{mesh:blocker.object.name,distance:blocker.distance}:null};
  }
  const sample={frame:frames,targets};
  if(captures<3&&!state?.precision&&(s.vel.length()>8||!s.onGround)&&!Object.values(targets).some(t=>t.framed&&!t.occluded)){
   // Capture the measured frame synchronously; a later page screenshot could
   // miss a short obstruction. Rendering with dt0 does not advance simulation.
   renderNight(0);sample.capture=renderer.domElement.toDataURL('image/png');captures++;
  }
  return sample;
 };
});return{sourceSHA256:require('crypto').createHash('sha256').update(require('fs').readFileSync(__filename)).digest('hex'),intervalFrames:6,scope:'Actual animated head/hips projection and native static-obstacle triangle rays during normal input, 10Hz at60Hz simulation. No gameplay state writes. Transparent glass below.5alpha excluded from opaque occlusion; moving objects absent from the native obstacle registry, HUD, between-sample frames and physical devices are not certified. Raw samples require context/visual review; collection is not camera acceptance.'};}
function summarize(trace){
 const samples=trace.filter(r=>r.cameraProbe&&!r.precision&&(Math.hypot(...r.v)>8||!r.grounded));
 const failures=samples.filter(r=>!Object.values(r.cameraProbe.targets).some(t=>t.framed&&!t.occluded));
 return{scope:'Sampled animated head/hips visibility at10Hz during fast/airborne non-aim motion; not full-body, HUD, between-sample or hardware certification.',samples:samples.length,problemSamples:failures.length,captures:failures.map(r=>r.cameraProbe.captureFile).filter(Boolean)};
}
module.exports={install,summarize};
