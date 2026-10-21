/* Source-grounded scalar predicates. This is not a recovered complete cinematic graph. */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.MinatoTransitions=api;})(typeof globalThis!=='undefined'?globalThis:this,()=>{
'use strict';
const finite=(v,n)=>{if(!Number.isFinite(v))throw Error('Missing source runtime field: '+n);return v;};
function animationEnded(s){
 if(s.hasAnimation===false)return false;
 if(s.hasAnimation!==true)throw Error('Missing hasAnimation');
 if(s.loopOrBlocked===undefined||s.actor1274===undefined)throw Error('Missing source end predicate flags');
 if(s.loopOrBlocked||s.actor1274!==0)return false;
 if(finite(s.configuredFps,'configuredFps')<=0||finite(s.tickBase,'tickBase')<=0)throw Error('Invalid source clock');
 const step=Math.trunc(s.tickBase/s.configuredFps);
 return finite(s.endTick,'endTick')<=finite(s.currentTick,'currentTick')+Math.trunc(step*finite(s.playbackRate,'playbackRate'));
}
function startTransition(s){
 const available=new Set(s.availableActions||[]);
 if(s.action===0x2c3){if(!animationEnded(s))return {kind:'wait'};if(available.has(0x2c4))return {kind:'action',action:0x2c4,resetClock:true};if(available.has(0x2c5))return {kind:'action',action:0x2c5};return {kind:'call',function:'1409e1570'};}
 if(s.action===0x2c5)return animationEnded(s)?{kind:'call',function:'1409e1570'}:{kind:'wait'};
 return {kind:'unsupported',reason:'Start-loop input and actor-specific predicates require additional source fields'};
}
function attackTransition(s){
 if(s.teamMode||s.characterId===0xdb)return {kind:'unsupported',reason:'Source actor/team action remapping required'};
 const frameScale=Math.trunc(finite(s.tickBase,'tickBase')/finite(s.configuredFps,'configuredFps'));
 if(frameScale<=0)throw Error('Invalid source clock');
 const duration=Math.trunc(finite(s.configuredFps,'configuredFps')*finite(s.endTick,'endTick')/s.tickBase);
 const elapsed=Math.trunc(finite(s.elapsedTick,'elapsedTick')/frameScale);
 if(elapsed<duration-(s.action===s.lastPresentAttack?1:0))return {kind:'wait'};
 const next=s.action+1,limit=s.action-1+15*finite(s.specialIndex,'specialIndex')+31;
 if(!(s.availableActions||[]).includes(next)||next===limit)return {kind:'stateRequest',state:0x8a,resetClock:true};
 return {kind:'action',action:next,resetClock:true};
}
function lastAttack(available){let result=0x4a;for(let a=0x2c6;a<0x2e4;a++){if(!available.includes(a))break;result=a;}return result;}
function endTransition(s){return animationEnded(s)?{kind:'stateRequest',state:1}:{kind:'wait'};}
const phaseSlice=Object.freeze({id:'source:3mnt-attack-exit',completeOriginal:false,requiredContext:Object.freeze({teamMode:false,characterId:109,specialIndex:0}),states:Object.freeze([{state:0x89,entryAction:0x2c6,timeline:'3mntspl1_atk',exitPredicate:'attackTransition',nextState:0x8a},{state:0x8a,entryAction:0x2e4,timeline:'3mntspl1_atk_e',exitPredicate:'animationEnded',nextState:1}].map(Object.freeze)),entryState:0x89,exitState:1});
function advancePhaseSlice(s){
 if(s.teamMode!==false||s.characterId!==109||s.specialIndex!==0)throw Error('Recovered slice requires non-team Minato special 1 context');
 if(s.state===0x89)return attackTransition(s);
 if(s.state===0x8a)return endTransition(s);
 if(s.state===1)return {kind:'complete'};
 throw Error('State outside recovered attack-exit slice');
}
return {animationEnded,startTransition,attackTransition,lastAttack,endTransition,phaseSlice,advancePhaseSlice,completeGraph:false};
});
