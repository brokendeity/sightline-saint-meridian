// Inspection only: never invokes source callbacks or changes animation rates.
(()=>{
 const panel=document.getElementById('backspoolPanel');
 const button=document.createElement('button'),view=document.createElement('pre');
 button.id='backspoolSourceEvidence';button.textContent='Original source evidence';
 view.id='backspoolSourceEvidenceResult';view.hidden=true;view.setAttribute('role','status');
 Object.assign(view.style,{whiteSpace:'pre-wrap',overflow:'auto',maxHeight:'180px',fontSize:'11px',lineHeight:'1.5',borderTop:'1px solid #36515c',paddingTop:'8px'});
 panel.append(button,view);
 let pending=null,selectionVersion=0;
 async function load(){
  if(!pending)pending=(async()=>{
   const response=await fetch(BACKSPOOL_SOURCE_EVIDENCE_URL);
   if(!response.ok)throw Error('Original graph evidence unavailable');
   const bytes=new Uint8Array(await response.arrayBuffer());
   const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');
   if(digest!==BACKSPOOL_SOURCE_EVIDENCE_HASH)throw Error('Original graph evidence identity mismatch');
   const data=JSON.parse(new TextDecoder().decode(fflate.gunzipSync(bytes)));
   if(data.schema!=='forspoken-root-motion-nodes-v1'||data.failures.length)throw Error('Incomplete source graph evidence');
   return data;
  })().catch(error=>{pending=null;throw error;});
  return pending;
 }
 function entryFor(id){
  const entry=characterSwitcher.library.find(e=>e.id===id);
  if(entry?.sourceAnimationId)return entry;
  for(const manifest of [window.backspoolFlowRoles,window.backspoolLocomotionRoles,window.backspoolLadderRoles,window.backspoolCrouchRoles,window.backspoolAdvancedRoles]){
   const role=manifest?.roles.find(r=>r.id===id);if(role)return role;
  }
  return null;
 }
 async function inspect(id){
  const entry=entryFor(id),sourceId=entry?.sourceAnimationId;
  if(!sourceId)return {available:false,reason:'This selection is not an indexed Forspoken source motion.'};
  const data=await load(),nodes=(data.clipIds[sourceId]||[]).filter(n=>n.sourceClips.some(c=>!entry.sourceSha256||c.sourceSha256===entry.sourceSha256));
  return structuredClone({available:true,sourceId,sourceSha256:entry.sourceSha256,originalMotionName:entry.originalMotionName||window.forspokenOriginalNames?.motions.find(m=>m.animationId===sourceId)?.originalName||null,graphSha256:data.source.sha256,nodes,
   verifiedOriginalRole:false,limitations:data.limitations,
   membership:nodes.length?'Direct original root-vector records':'No direct record in this vector; other graph references or indirect use remain possible.'});
 }
 button.onclick=async()=>{
  const id=document.getElementById('backspoolAnimation').value,version=++selectionVersion;
  view.hidden=false;view.textContent='Loading original graph evidence…';button.disabled=true;
  try{
   const result=await inspect(id);if(version!==selectionVersion)return;
   if(!result.available){view.textContent=result.reason;return;}
   const lines=[result.sourceId+' · '+result.nodes.length+' direct graph context(s)',result.originalMotionName?'Original label: '+result.originalMotionName:'Original label unavailable',result.membership,
    'Original runtime selection and callback phases remain unverified. Native-backed parameter meanings are shown below; inspection changes no speed or IK.'];
   for(const node of result.nodes){
    lines.push('Context '+node.index+' · source offset '+node.offset+' · IDs '+node.field6Identifier+' / '+node.field7Identifier);
    for(const [field,callbacks]of Object.entries(node.callbacks))for(const callback of callbacks){
     if(!callback.path)continue;
     lines.push('  List '+field+': '+callback.path.split('/').pop());
     if(callback.typedParameters){const p=callback.typedParameters;lines.push('    Native float32 rate: '+(p.value===null?'unavailable':Number(p.value.toPrecision(7)))+'× · '+p.origin);lines.push('    Nonpositive values are ignored by the original setter. Context selection remains unverified.');}
     else for(const scalar of callback.parameters?.scalarFields||[])lines.push('    Parameter field '+scalar.fieldIndex+': bits 0x'+scalar.u32.toString(16)+' (float interpretation '+scalar.f32Interpretation+'; type unverified)');
    }
   }
   view.textContent=lines.join('\n');
  }catch(error){if(version===selectionVersion)view.textContent='Evidence unavailable: '+error.message;}
  finally{button.disabled=false;}
 };
 document.getElementById('backspoolAnimation').addEventListener('change',()=>{selectionVersion++;view.hidden=true;});
 document.getElementById('backspoolSearch').addEventListener('input',()=>{selectionVersion++;view.hidden=true;});
 document.getElementById('backspoolClose').addEventListener('click',()=>{selectionVersion++;view.hidden=true;});
 window.backspoolSourceGraphEvidence=inspect;
})();
