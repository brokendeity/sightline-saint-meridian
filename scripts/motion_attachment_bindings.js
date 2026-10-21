/* Exact source ANM aliases/parents; no name-suffix or first-match attachment guesses. */
(function(root){
 function identity(value){return typeof value==='string'?{name:value}:value||{};}
 function same(ref,name,path){return ref.name===name&&(!ref.path||!path||ref.path.replaceAll('\\','/').toLowerCase()===path.replaceAll('\\','/').toLowerCase());}
 function resolve(animation,coordValue,contextValue){
  const coord=identity(coordValue),context=identity(contextValue),clumps=animation?.clumps||[],contexts=[];
  if(context.name)clumps.forEach((c,i)=>{if(same(context,c.reference,c.path))contexts.push(i);});
  if(context.name&&contexts.length!==1)return {status:contexts.length?'ambiguous-context':'missing-context',candidates:contexts};
  const candidates=[];
  clumps.forEach((c,i)=>c.bones.forEach((b,j)=>{if(!same(coord,b.reference,b.path))return;let allowed=!context.name,at=[i,j],seen=new Set();while(context.name&&at){const key=at.join(':');if(seen.has(key))return;seen.add(key);if(at[0]===contexts[0]){allowed=true;break;}at=clumps[at[0]]?.bones[at[1]]?.parent;}if(allowed)candidates.push({clump:i,bone:j,name:b.name,reference:b.reference});}));
  return candidates.length===1?{status:'resolved',...candidates[0],contextClump:contexts[0]??null}:{status:candidates.length?'ambiguous-coordinate':'missing-coordinate',candidates};
 }
 function crossParents(animation){const rows=[],clumps=animation?.clumps||[];clumps.forEach((c,i)=>c.bones.forEach((b,j)=>{const p=b.parent;if(!p||p[0]===i)return;let at=p,seen=new Set([i+':'+j]),valid=true;while(at){const key=at.join(':');if(seen.has(key)||!clumps[at[0]]?.bones[at[1]]){valid=false;break;}seen.add(key);at=clumps[at[0]].bones[at[1]].parent;}if(valid)rows.push({child:[i,j],parent:p});}));return rows;}
 const api={resolve,crossParents};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.NativeAttachmentBindings=api;
})(typeof window!=='undefined'?window:globalThis);
