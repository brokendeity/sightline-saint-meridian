/* Inspection retarget only. Original opponent dispatch and cloth behavior remain unverified. */
(function(global){
 'use strict';
 function prepare(THREE,{scenes,animation,manifest,targetScene}){
  if(!manifest||manifest.verified!==false)throw Error('Victim adapter requires explicitly unverified manifest');
  if(targetScene.source.sha256!==manifest.targetSha256)throw Error('Victim model source hash mismatch');
  const base=scenes.find(s=>s.source.sha256===manifest.sourceSha256);
  if(!base)throw Error('Generic victim rest source hash mismatch');
  const own=scenes.find(s=>s.source.sha256===manifest.sequenceSha256);
  if(!own)throw Error('Victim sequence source hash mismatch');
  const reactionStart=animation._reactionStart;
  if(!Number.isInteger(reactionStart))return {scenes,animation,diagnostics:{status:'not applicable',verified:false}};
  const indices=animation.clumps.map((c,i)=>i>=reactionStart&&c.name===manifest.sourceClump?i:-1).filter(i=>i>=0);
  if(indices.length!==1)throw Error('Missing or ambiguous victim reaction clump');
  const ci=indices[0],bySource=new Map(manifest.mapping.map(m=>[m.sourceName,m])),byTarget=new Map(manifest.mapping.map(m=>[m.targetName,m]));
  const sourceRig=base.rigs.find(r=>r.name===manifest.sourceClump),targetRig=targetScene.rigs.find(r=>r.name===manifest.targetClump);
  if(!sourceRig||!targetRig)throw Error('Victim skeleton missing');
  const restQ=b=>new THREE.Quaternion().setFromEuler(new THREE.Euler(...b.rotation.map(THREE.MathUtils.degToRad),'XYZ'));
  const entries=animation.entries.map(e=>{
   if(e.clump!==ci||e.format!==1)return e;
   const m=bySource.get(e.name);if(!m)return e;
   return {...e,curves:e.curves.map(c=>{
    if(c.path==='location'&&!m.rootMotion)return {...c,keys:c.keys.map(([t,v])=>[t,v.map((x,i)=>m.targetRest.position[i]+x-m.sourceRest.position[i])])};
    if(c.path==='rotation_quaternion'&&!m.rootMotion){const correction=restQ(m.targetRest).multiply(restQ(m.sourceRest).invert());return {...c,keys:c.keys.map(([t,v])=>{const q=correction.clone().multiply(new THREE.Quaternion(-v[0],-v[1],-v[2],v[3]).normalize()).normalize();return[t,[-q.x,-q.y,-q.z,q.w]];})};}
    return c;
   })};
  });
  const rebound={...targetScene,rigs:[{...targetRig,name:manifest.sourceClump,bones:targetRig.bones.map(b=>({...b,name:byTarget.get(b.name)?.sourceName||b.name}))}],models:targetScene.models.filter(m=>m.rig===manifest.targetClump).map(m=>({...m,rig:manifest.sourceClump}))};
  const nextScenes=scenes.map(s=>({...s,rigs:s.rigs.filter(r=>r.name!==manifest.sourceClump),models:s.models.filter(m=>m.rig!==manifest.sourceClump)}));nextScenes.push(rebound);
  return {scenes:nextScenes,animation:{...animation,entries},diagnostics:{status:manifest.status,verified:false,sourceClump:ci,targetClump:manifest.targetClump,mappedTracks:manifest.mappedTrackCount,unmappedTracks:manifest.unmappedTracks.slice(),targetRestPreserved:true,placement:manifest.policy.placement,limitations:manifest.limitations.slice()}};
 }
 global.MinatoVictimAdapter={prepare};if(typeof module!=='undefined')module.exports=global.MinatoVictimAdapter;
})(typeof window!=='undefined'?window:globalThis);
