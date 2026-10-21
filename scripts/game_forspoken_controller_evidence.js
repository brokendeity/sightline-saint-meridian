/* Read-only recovery tools. They never choose a gameplay action or move bones. */
(()=>{
 let pending=null;
 async function load(){
  if(!pending)pending=(async()=>{
   const response=await fetch(FORSPOKEN_CONTROLLER_URL);if(!response.ok)throw Error('Original controller evidence unavailable');
   const bytes=new Uint8Array(await response.arrayBuffer());
   const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');
   if(digest!==FORSPOKEN_CONTROLLER_HASH)throw Error('Original controller evidence identity mismatch');
   const data=JSON.parse(new TextDecoder().decode(fflate.gunzipSync(bytes)));
   if(data.schema!=='forspoken-controller-contracts-v13'||data.actions.length!==94||data.conditions.length!==24||data.abilities.length!==39)throw Error('Incomplete original controller evidence');
   return data;
  })().catch(error=>{pending=null;throw error;});
  return pending;
 }
 window.forspokenControllerEvidence=async(id=null)=>{
  const data=await load();
  if(id===null)return structuredClone(data);
  const action=data.actions.find(a=>a.id===id||a.name===id);
  if(!action)throw Error('Unknown original action '+id);
  return structuredClone(action);
 };
 window.forspokenEvaluateActionInput=async(id,records)=>{
  const action=await window.forspokenControllerEvidence(id);
  return {actionId:action.id,inputPass:ForspokenNativeKernels.buttonSlots(action.buttonConditions,key=>records[key]??null),
          engineEligibilityChecked:false,originalStateSelectionChecked:false};
 };
 window.forspokenContactProbe=()=>{
  if(window.characterState?.().active!=='backspool'||!model)return {available:false,reason:'BACKSPOOL_NOT_READY'};
  characterRoot.updateMatrixWorld(true);
  // Explicit browser adaptation, NOT a recovered Frey solver-frame binding.
  const solver={rotation:[-Math.SQRT1_2,0,0,Math.SQRT1_2],inverseRotation:[Math.SQRT1_2,0,0,Math.SQRT1_2],scale:1,actorScale:1};
  const aq=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),s.yaw);
  const frame=ForspokenContactFrames.capture(solver,{rotation:aq.toArray(),translation:[s.pos.x,s.pos.y-.42,s.pos.z,1]});
  const feet=[];
  for(const side of ['Left','Right']){
   const bone=model.getObjectByName('mixamorig'+side+'Foot');if(!bone)continue;
   const foot=bone.getWorldPosition(new THREE.Vector3()).toArray();
   const local=frame.resolve({found:true,point:foot,normal:[0,1,0]},1).point.slice(0,3);
   const start=local.slice(),end=local.slice();start[2]+=1;end[2]-=1;
   const query=frame.query(start,end,1,{1:0x1000});
   if(!query.valid){feet.push({side,query,hit:{found:false,reason:query.reason}});continue;}
   const raycaster=new THREE.Raycaster(new THREE.Vector3(...query.start.slice(0,3)),new THREE.Vector3(...query.direction),0,query.length);
   const hit=raycaster.intersectObjects(walkables.filter(m=>m.visible),false)[0];
   let result={found:false,reason:'NO_BROWSER_SURFACE'};
   if(hit){const normal=hit.face.normal.clone().transformDirection(hit.object.matrixWorld);result=ForspokenContactFrames.rejectBelowSolverPlane(frame.resolve({found:true,point:hit.point.toArray(),normal:normal.toArray()},1));}
   feet.push({side,foot,query,hit:result,surface:hit?.object.name||null});
  }
  return {available:true,feet,frame:frame.state(),appliedToRig:false,originalProbeSelection:false,
          browserAxisAdapter:true,collisionFiltering:'Browser walkables; native mask semantics not emulated'};
 };
 const panel=document.getElementById('backspoolPanel'),button=document.createElement('button'),view=document.createElement('pre');
 button.id='backspoolControllerEvidence';button.textContent='Recovered controller / contacts';
 view.id='backspoolControllerEvidenceResult';view.hidden=true;view.setAttribute('role','status');
 Object.assign(view.style,{whiteSpace:'pre-wrap',overflowWrap:'anywhere',overflow:'auto',maxHeight:'180px',fontSize:'11px',lineHeight:'1.5'});
 panel.append(button,view);
 button.onclick=async()=>{
  view.hidden=false;view.textContent='Loading recovered controller evidence…';button.disabled=true;
  try{
   const data=await load(),probe=window.forspokenContactProbe();
   const lines=[data.abilities.length+' original ability records · '+data.actions.length+' action records · '+data.conditions.length+' input-condition records',
    'Recovered query-frame bridge; full controller and biped IK are incomplete.',
    'Read-only probes use explicit browser axis/filter adaptation. They do not move bones.'];
   for(const foot of probe.feet||[])lines.push(foot.side+' foot query: '+(foot.hit.found?'surface '+foot.hit.worldPoint[1].toFixed(3)+'m':foot.hit.reason));
   for(const ability of data.abilities){lines.push('\n'+(ability.name||ability.id));for(const id of ability.actions){const a=data.actions.find(a=>a.id===id);lines.push('  '+(a.name||a.id)+' → actor action 0x'+a.actorAction.toString(16));for(const c of a.buttonConditions)if(c.inputId)lines.push('    '+c.name+' · '+c.holdMin.toPrecision(3)+'–'+c.holdMax.toPrecision(3)+'s');}}
   view.textContent=lines.join('\n');
  }catch(error){view.textContent='Evidence unavailable: '+error.message;}
  finally{button.disabled=false;}
 };
})();
