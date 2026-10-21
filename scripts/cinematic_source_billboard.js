/* Source billboard resource clock/UV replay. No inferred emitter placement. */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.CinematicSourceBillboard=api;})(typeof globalThis!=='undefined'?globalThis:this,()=>{
 'use strict';
 function sample(record,seconds){
  if(!(record?.ticksPerFrame>0)||!(record.frameCount>0))throw Error('Complete source billboard clock required');
  const elapsed=Math.max(0,Number(seconds)||0),ticks=elapsed*3000,duration=record.ticksPerFrame*record.frameCount;
  const local=record.loop?ticks%duration:Math.min(ticks,duration-1e-7),frame=Math.min(record.frameCount-1,Math.floor(local/record.ticksPerFrame+1e-7));
  const values={};for(const channel of record.channels||[]){if(channel.mode===0)continue;if(![1,2].includes(channel.mode))throw Error('Unsupported source billboard channel mode');
   // 1412c7b00 uses the first rotationScalar sample even for sampled mode.
   const index=channel.mode===1||channel.index===1?0:frame,row=channel.samples[index];if(!Array.isArray(row)||row.length!==channel.width||!row.every(Number.isFinite))throw Error('Missing source billboard channel sample');values[channel.name]=row.slice();
  }
  return {frame,ended:!record.loop&&ticks>=duration,values};
 }
 function replayGeometry(path,seconds){
  if(!path?.billboard||!path?.model?.meshes?.length)throw Error('Recovered source geometry and billboard required');
  const state=sample(path.billboard,seconds),offset=state.values.uv0Offset||[0,0],scale=state.values.uv0Scale||[1,1];
  return {...state,opacity:state.values.opacity?.[0]??1,meshes:path.model.meshes.map(m=>({positions:m.attributes.position.map(v=>v.slice()),faces:m.faces.map(v=>v.slice()),uv0:m.attributes.uv0.map(v=>[v[0]*scale[0]+offset[0],v[1]*scale[1]+offset[1]])})),placement:null,spawning:'withheld',unresolved:(path.blockers||[]).map(b=>b.component)};
 }
 function requirePlacement(path,binding){if(!Array.isArray(binding?.matrix)||binding.matrix.length!==16||!binding.matrix.every(Number.isFinite)||!binding.evidence?.length)throw Error('Original billboard placement requires evidenced source matrix; automatic facing/spawning remains withheld');return binding.matrix.slice();}
 function vector(v,n,name){if(!Array.isArray(v)||v.length!==n||!v.every(Number.isFinite))throw Error('Complete source '+name+' required');return v;}
 function proof(v,name){if(!v?.evidence?.length)throw Error('Source evidence required for '+name);return v;}
 // Literal 1412c84b0 -> 1411b6df0 -> 1411ae650 equations, row-major.
 // The caller supplies camera+0x80 in SOURCE coordinates, not an arbitrary
 // Three camera quaternion. 1412b8ca0 obtains it from inverse(view).
 function cameraMatrix(input){
  const b=proof(input,'billboard camera composition');if(b.coordinateSpace!=='source')throw Error('Source coordinate-space camera basis required');
  const C=vector(b.cameraBasis,9,'camera+0x80 basis'),length=vector(b.particleAxisLengths,3,'particle basis lengths'),scale=vector(b.scale2,2,'billboard scale2'),position=vector(b.particlePosition,3,'particle position'),offset=vector(b.positionOffset,3,'billboard position offset');
  if(!Number.isInteger(b.rotationScalar))throw Error('Original integer billboard rotation scalar required');
  const angle=b.rotationScalar*6.2831854820251465*.0000152587890625,c=Math.cos(angle),s=Math.sin(angle),R=[c,-s,0,s,c,0,0,0,1],axis=[length[0]*scale[0],length[1]*scale[1],length[2]],out=[];
  for(let r=0;r<3;r++){for(let col=0;col<3;col++)out.push((C[r*3]*R[col]+C[r*3+1]*R[3+col]+C[r*3+2]*R[6+col])*axis[col]);out.push(position[r]+offset[r]);}out.push(0,0,0,1);
  return {matrix:out,coordinateSpace:'source',evidence:b.evidence.slice(),verified:false};
 }
 // The spherical mode-2 initializer uses the ORIGINAL attachment basis to
 // transform its sampled radius. It is not a uniform-volume approximation.
 function distributedPosition(input){
  const b=proof(input,'distributed source spawn');if(b.coordinateSpace!=='source')throw Error('Source coordinate-space attachment required');
  const M=vector(b.attachmentMatrix,16,'attachment matrix');if(!Number.isFinite(b.particleScale)||!(b.particleScale>0)||!Number.isFinite(b.radius)||!Number.isFinite(b.radiusVariation))throw Error('Original generator radius and particle scale required');
  const u=vector(b.randomValues,4,'spherical random scalars');if(u.some(v=>v<0||v>1))throw Error('Source random scalars outside [0,1]');
  const pi=3.141592025756836,A=pi-u[0]*2*pi,B=pi-u[1]*2*pi,high=b.radius*b.particleScale,low=(1-u[2]*b.radiusVariation)*high,radius=high-u[3]*(high-low);
  const p=[Math.cos(A)*radius,Math.cos(B)*Math.sin(A)*radius,Math.sin(B)*Math.sin(A)*radius],offset=[0,1,2].map(r=>M[r*4]*p[0]+M[r*4+1]*p[1]+M[r*4+2]*p[2]);
  return {position:offset.map((v,i)=>v+M[i*4+3]),offset,radius,coordinateSpace:'source',evidence:b.evidence.slice(),verified:false};
 }
 function emissionReadiness(path,input){
  const blocked=[];if(!input?.seedEvidence?.length||!Number.isInteger(input?.seed)||input.seed<0||input.seed>0xffffffff)blocked.push('original RNG seed/state');
  try{distributedPosition(input?.attachment);}catch{blocked.push('source attachment matrix and distributed-spawn inputs');}
  try{cameraMatrix(input?.camera);}catch{blocked.push('source camera-world basis and billboard inputs');}
  // A selected force-field mask is not proof that the selected global list
  // was empty. Require captured/recovered list evidence, including emptiness.
  if(!Array.isArray(input?.forceFields?.entries)||!input.forceFields.evidence?.length)blocked.push('manager+0x90 force-field state');
  if(input?.forceFields?.entries?.length)blocked.push('active source force-field replay');
  return {ready:blocked.length===0,blocked,verified:false};
 }
 return {sample,replayGeometry,requirePlacement,cameraMatrix,distributedPosition,emissionReadiness};
});
