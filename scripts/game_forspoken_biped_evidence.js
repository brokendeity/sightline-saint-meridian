/* Read-only binding and pose-buffer inspection. No local-bone writeback. */
(()=>{
 let pending=null;
 const targetNames={C_Hip:'mixamorigHips',L_UpLeg:'mixamorigLeftUpLeg',L_Leg:'mixamorigLeftLeg',L_Foot:'mixamorigLeftFoot',L_Toe:'mixamorigLeftToeBase',R_UpLeg:'mixamorigRightUpLeg',R_Leg:'mixamorigRightLeg',R_Foot:'mixamorigRightFoot',R_Toe:'mixamorigRightToeBase'};
 async function load(){
  if(!pending)pending=(async()=>{
   const response=await fetch(FORSPOKEN_BIPED_URL);if(!response.ok)throw Error('Original biped bindings unavailable');
   const bytes=new Uint8Array(await response.arrayBuffer());
   const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');
   if(hash!==FORSPOKEN_BIPED_HASH)throw Error('Original biped bindings identity mismatch');
   const data=JSON.parse(new TextDecoder().decode(fflate.gunzipSync(bytes)));
   if(data.schema!=='forspoken-original-biped-bindings-v14'||data.inputOrder.length!==9||data.bodyPoints.length!==7||data.probeVectors.length!==6)throw Error('Incomplete original biped bindings');
   return data;
  })().catch(error=>{pending=null;throw error});
  return pending;
 }
 window.forspokenBipedBindingEvidence=async()=>structuredClone(await load());
 window.forspokenPoseSnapshot=async()=>{
  const bindings=await load();
  if(window.characterState?.().active!=='backspool'||!model)throw Error('Backspool pose is unavailable');
  model.updateWorldMatrix(true,true);const inverse=model.matrixWorld.clone().invert(),rows=[],rotations=[],positions=[];
  for(const joint of bindings.inputOrder){
   const name=targetNames[joint.name],bone=model.getObjectByName(name);
   if(!bone?.isBone)throw Error('Missing target biped bone '+name);
   const matrix=inverse.clone().multiply(bone.matrixWorld),p=new THREE.Vector3(),q=new THREE.Quaternion(),scale=new THREE.Vector3();matrix.decompose(p,q,scale);
   if(scale.toArray().some(x=>!Number.isFinite(x)||Math.abs(x-1)>.001))throw Error('Scaled target pose requires a separate native scale adapter');
   rotations.push(...q.toArray());positions.push(...p.toArray(),0);
   rows.push({sourceName:joint.name,sourceRigIndex:joint.sourceRigIndex,targetName:name,inputSlot:joint.inputSlot});
  }
  if(!rotations.concat(positions).every(Number.isFinite))throw Error('Non-finite target pose');
  return {rows,rotations,positions,binding:rows.map((_,i)=>i),space:'Backspool model space; target model units; adapter sets position.w=0',
          nativeBipedIndicesRecovered:true,probeValuesRecovered:false,appliedToRig:false,originalIKComplete:false};
 };
 const panel=document.getElementById('backspoolPanel'),button=document.createElement('button'),view=document.createElement('pre');
 button.id='backspoolBipedEvidence';button.textContent='Biped bindings / pose buffers';
 view.id='backspoolBipedEvidenceResult';view.hidden=true;view.setAttribute('role','status');
 Object.assign(view.style,{whiteSpace:'pre-wrap',overflowWrap:'anywhere',overflow:'auto',maxHeight:'200px',fontSize:'11px',lineHeight:'1.5'});panel.append(button,view);
 button.onclick=async()=>{
  view.hidden=false;view.textContent='Loading original biped bindings…';button.disabled=true;
  try{
   const source=await load(),snapshot=await window.forspokenPoseSnapshot();
   const lines=['9 original input joints · 7 body centers · 6 probe/axis vectors',
    'Native pose packet and writeback are available. Full contact solver is incomplete.',
    'Read-only target model-space buffers. Original indices are rebound by name; no bones are moved.'];
   for(const row of snapshot.rows)lines.push(row.inputSlot+': '+row.sourceName+' ['+row.sourceRigIndex+'] → '+row.targetName);
   lines.push('\nNative body packet order: '+source.bodyPoints.map(p=>p.name).join(', '));
   for(const p of source.probeVectors)lines.push('Packet '+p.packetIndex+' ← '+p.contextVectorOffset+' · '+p.kind);
   view.textContent=lines.join('\n');
  }catch(error){view.textContent='Evidence unavailable: '+error.message}
  finally{button.disabled=false}
 };
})();
