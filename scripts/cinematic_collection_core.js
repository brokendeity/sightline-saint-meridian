/* Collection integrity, evidence gates and a source-defined cinematic clock. */
(function(root){
 'use strict';
 const clone=x=>JSON.parse(JSON.stringify(x));
 const STATUSES=['indexed','recovered','reconstructed','awaiting reference','verification failed','verified'];
 const COMPONENTS=['execution','animation','camera','particles','shaders','soundBank','synchronization','weapons','morphs'];
 function blockers(sequence,reference){
  const out=[];if(!sequence.sourceBuildSha256)out.push('Original executable identity is missing.');
  for(const key of COMPONENTS){const c=sequence.components?.[key];if(c?.required===false&&c.evidence?.length)continue;if(c&&['reconstructed','verified'].includes(c.status)&&!c.evidence?.length)out.push(key+': reconstruction evidence is missing');if(!c||!['reconstructed','verified'].includes(c.status))out.push(`${key}: ${c?.blockers?.join('; ')||'original behavior incomplete'}`);}
  if(!sequence.execution?.recovered)out.push('Original sequence state machine is not recovered.');
  if(!reference)out.push('Matched original-game reference has not been supplied.');
  else if(reference.sequenceId!==sequence.id||reference.buildSha256!==sequence.sourceBuildSha256)out.push('Reference sequence or game build does not match.');
  if(reference&&reference.language!=='US')out.push('English (US) reference audio is required for this release.');
  return out;
 }
 function verification(sequence,reference,review){
  const pending=blockers(sequence,reference);
  if(!reference)return{status:'awaiting reference',blockers:pending};
  if(pending.length)return{status:'awaiting reference',blockers:pending};
  if(!review)return{status:'awaiting reference',blockers:['Reference comparison and full-sequence review are pending.']};
  const required=['completeSequence','allBranches','camera','actors','effects','shaders','audio','synchronization','cleanup'];
  if(required.some(k=>review[k]===false))return{status:'verification failed',blockers:required.filter(k=>review[k]===false).map(k=>k+' comparison failed')};
  if(required.some(k=>review[k]!==true)||!review.referenceSha256||review.referenceSha256!==reference.fileSha256||!review.reviewer||!review.evidence?.length)return{status:'awaiting reference',blockers:['A complete review bound to the exact reference file is required.']};
  return{status:'verified',blockers:[]};
 }
 function remix(sequence,overrides={}){
  return{schemaVersion:1,id:'remix:'+sequence.id+':'+Date.now(),category:'remix',sourceSequenceId:sequence.id,sourceBuildSha256:sequence.sourceBuildSha256,sourceManifestSha256:sequence.manifestSha256||null,name:sequence.name+' — remix',overrides:clone(overrides),validation:{status:'unvalidated',blockers:['Actor substitutions, timing and attachments require separate validation.']}};
 }
 function validateRemix(project,sequence){
  if(project?.schemaVersion!==1||project.category!=='remix'||project.sourceSequenceId!==sequence.id||project.sourceBuildSha256!==sequence.sourceBuildSha256)throw Error('Remix source identity does not match this original.');
  if(sequence.manifestSha256&&project.sourceManifestSha256!==sequence.manifestSha256)throw Error('Remix parent manifest has changed; explicit migration is required.');
  if(typeof project.id!=='string'||!project.id||typeof project.name!=='string'||!project.name.trim()||project.name.length>120)throw Error('Remix requires a stable ID and a name up to120characters.');
  const allowed=['actor','motion','camera','effects','audio'];
  if(!project.overrides||typeof project.overrides!=='object'||Array.isArray(project.overrides)||Object.keys(project.overrides).some(k=>!allowed.includes(k)))throw Error('Remix overrides must use actor, motion, camera, effects or audio.');
  const copy=clone(project);copy.validation={status:'unvalidated',blockers:['Remix overrides require separate retargeting, contact and framing validation.']};return copy;
 }
 function compareMarkers(reference,actual,fps=60){
  if(!Number.isFinite(fps)||fps<=0||fps>240)throw Error('Reference frame rate must be between 1 and 240.');
  for(const rows of [reference,actual])if(!Array.isArray(rows)||rows.some(r=>typeof r.id!=='string'||!Number.isFinite(r.time)||r.time<0)||new Set(rows.map(r=>r.id)).size!==rows.length)throw Error('Markers require unique IDs and finite, non-negative times.');
  const expected=new Map(reference.map(r=>[r.id,r])),got=new Map(actual.map(r=>[r.id,r]));
  const rows=[...new Set([...expected.keys(),...got.keys()])].map(id=>{const a=expected.get(id),b=got.get(id),tolerance=a?.kind==='audio'?.02:1/fps;return{id,expected:a?.time??null,actual:b?.time??null,delta:a&&b?b.time-a.time:null,tolerance,pass:!!a&&!!b&&Math.abs(b.time-a.time)<=tolerance+1e-9};});
  return{pass:rows.length>0&&rows.every(r=>r.pass),rows,boundary:'Marker timing only; this does not certify visual fidelity or completeness.'};
 }
 function characterCompletion(character,sequences,records=[]){
  const reasons=[];
  if(!character.cinematicInventory?.complete||!character.cinematicInventory?.evidence?.length)reasons.push('Character cinematic inventory has not been proven complete.');
  if(!character.sequenceIds?.length)reasons.push('An empty candidate list cannot establish character completion.');
  const results=(character.sequenceIds||[]).map(id=>{const sequence=sequences.find(s=>s.id===id),record=records.find(r=>r.sequenceId===id);return{id,...(sequence?verification(sequence,record?.reference,record?.review):{status:'indexed',blockers:['Missing sequence record.']})};});
  if(results.some(r=>r.status!=='verified'))reasons.push('Every required sequence and branch must be reference verified.');
  return{characterId:character.id,complete:reasons.length===0,verifiedSequences:results.filter(r=>r.status==='verified').length,totalRequiredSequences:results.length,blockers:reasons,sequences:results};
 }
 function advanceQueue(collection,records=[]){
  const current=collection.characters.find(c=>c.id===collection.queue.activeCharacterId);
  if(!current)throw Error('Active certification character is missing.');
  const completion=characterCompletion(current,collection.sequences,records);
  if(!completion.complete)throw Error('Cannot advance certification: '+completion.blockers.join(' '));
  const queue=clone(collection.queue),index=queue.order.indexOf(current.id);
  if(index<0)throw Error('Active character is absent from certification order.');
  queue.completedCharacterIds=[...new Set([...(queue.completedCharacterIds||[]),current.id])];
  queue.activeCharacterId=queue.order[index+1]||null;return queue;
 }
 function createPlayer({onEnter=async()=>{},onSample=()=>{},onEvents=()=>{},onStop=()=>{},onState=()=>{}}={}){
  let definition=null,state=null,time=0,elapsed=0,stateOffset=0,history=[],playing=false,loading=false,token=0,outcome='idle',error=null,branch=null,eventIds=new Set();
  const diagnostic=()=>({sequenceId:definition?.id,stateId:state?.id,time,elapsed,playing,loading,outcome,error,branch,emittedEvents:[...eventIds]});
  function notify(){onState(diagnostic());}
  function validate(d){
   if(!d?.execution?.recovered)throw Error('Original sequence execution is unresolved. Use isolated source inspection; authored routing is not allowed in original mode.');
   const states=d.execution.states;if(!Array.isArray(states)||!states.length||new Set(states.map(s=>s.id)).size!==states.length)throw Error('Invalid original state graph.');
   for(const s of states){if(typeof s.id!=='string'||!Number.isFinite(s.duration)||s.duration<=0||!s.evidence?.length)throw Error('Each original state requires a source duration and evidence.');const ids=new Set();for(const e of s.events||[]){if(typeof e.id!=='string'||ids.has(e.id)||!Number.isFinite(e.time)||e.time<0||e.time>s.duration)throw Error('Invalid original event timeline.');ids.add(e.id);}for(const edge of s.transitions||[]){if(!states.some(t=>t.id===edge.to)||!Number.isFinite(edge.at)||edge.at<0||edge.at>s.duration||!edge.evidence?.length)throw Error('Invalid or unproven original transition.');}}
   if(!states.some(s=>s.id===d.execution.entryState))throw Error('Missing original entry state.');
  }
  function stop(reason='stopped'){token++;playing=loading=false;state=null;time=elapsed=stateOffset=0;history=[];eventIds.clear();outcome=reason;onStop(reason);notify();}
  async function enter(next,t=0,reason='enter'){
   const id=++token;playing=false;loading=true;eventIds.clear();notify();
   try{await onEnter(next,()=>id===token);if(id!==token)return false;state=next;time=t;stateOffset=elapsed-t;if(reason!=='seek')history.push({id:state.id,offset:stateOffset});loading=false;outcome='paused';error=null;onSample(state,time,{reason,elapsed});notify();return true;}catch(e){if(id!==token)return false;loading=playing=false;outcome='error';error=e.message;onStop('error');notify();throw e;}
  }
  async function load(d,selectedBranch=null){stop();validate(d);definition=clone(d);branch=selectedBranch;await enter(definition.execution.states.find(s=>s.id===definition.execution.entryState));}
  function eventRange(before,after){const rows=(state.events||[]).filter(e=>e.time>=before&&e.time<=after&&!eventIds.has(e.id));for(const e of rows)eventIds.add(e.id);if(rows.length)onEvents(rows,{stateId:state.id,time:after});}
  function pause(){playing=false;onStop('pause');notify();}
  function play(){if(!state||loading)throw Error('Load a recovered original sequence first.');if(outcome==='complete')throw Error('Restart the completed sequence before playing.');playing=true;outcome='playing';notify();}
  async function seek(t,stateId=state?.id){if(!definition)throw Error('No original loaded.');const next=definition.execution.states.find(s=>s.id===stateId);if(!next||!Number.isFinite(t))throw Error('Invalid original seek.');pause();const target=Math.max(0,Math.min(next.duration,t));if(next!==state){const visited=history.findLast(h=>h.id===stateId);if(!visited)throw Error('Seek requires a previously visited original branch state.');elapsed=visited.offset+target;return enter(next,target,'seek');}token++;elapsed=stateOffset+target;eventIds=new Set((state.events||[]).filter(e=>e.time<=target).map(e=>e.id));time=target;outcome='paused';onSample(state,time,{reason:'seek',elapsed});notify();}
  async function tick(dt){if(!playing||loading||!state)return;if(!Number.isFinite(dt)||dt<0)throw Error('Invalid clock delta.');let remaining=dt,transitions=0;do{const before=time,edge=(state.transitions||[]).filter(e=>e.at>=time&&(!e.branch||e.branch===branch)).sort((a,b)=>a.at-b.at)[0],end=Math.min(state.duration,edge?.at??state.duration),step=Math.min(remaining,Math.max(0,end-time));time+=step;elapsed+=step;remaining-=step;onSample(state,time,{reason:'play',elapsed});eventRange(before,time);if(time>=end){if(edge){if(++transitions>64){pause();throw Error('Original graph has an unbounded immediate transition cycle.');}const next=definition.execution.states.find(s=>s.id===edge.to);if(!await enter(next))return;playing=true;outcome='playing';}else{playing=false;outcome='complete';onStop('complete');}}notify();}while(playing&&remaining>1e-9);}

  return{load,play,pause,seek,step:frames=>seek(time+frames/60),restart:async()=>{if(!definition)throw Error('No original loaded.');await load(definition,branch);},stop,tick,diagnostics:diagnostic};
 }
 const api={STATUSES,COMPONENTS,blockers,verification,remix,validateRemix,compareMarkers,characterCompletion,advanceQueue,createPlayer};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CinematicCollection=api;
})(typeof window!=='undefined'?window:globalThis);
