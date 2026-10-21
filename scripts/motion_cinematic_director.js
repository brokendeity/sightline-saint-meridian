/* Authored phase routing around recovered source timelines. Never claims original ordering. */
window.createMotionCinematicDirector=({onPhase,onSample,onEnd,onError,onState})=>{
 let token=0,active=false,paused=false,loading=false,route=[],index=0,time=0,outcome='idle';
 const state=()=>({active,paused,loading,index,time,outcome,revision:token,phase:route[index]?.label,route:route.map(p=>({kind:p.kind,label:p.label,duration:p.duration})),presentation:'Authored reconstruction: phase order, transitions, particle rendering and replacement foley are authored; source clips/cameras/cues/cut-in images retain provenance.'});
 function notify(){onState?.(state());}
 async function enter(id){loading=true;time=0;notify();try{await onPhase(route[index],()=>id===token&&active);if(id!==token)return;loading=false;onSample(route[index],0,0);notify();}catch(e){if(id!==token)return;active=loading=false;outcome='error';onError?.(e);onEnd?.('error');notify();}}
 function stop(reason='stopped'){token++;const was=active;active=paused=loading=false;if(was)outcome=reason;if(was)onEnd?.(reason);notify();}
 async function start(phases){if(!Array.isArray(phases)||!phases.length||phases.some(p=>!Number.isFinite(p.duration)||p.duration<=0))throw Error('Cinematic needs finite, positive-duration phases');stop();route=phases.map(p=>({...p}));index=0;time=0;active=true;paused=false;outcome='playing';await enter(++token);}
 return{start,stop,restart:()=>start(route),togglePause(){if(active){paused=!paused;notify();}},tick(dt){if(!active||paused||loading)return;const step=Math.min(Math.max(0,Number(dt)||0),route[index].duration-time);time+=step;onSample(route[index],time,step);if(time>=route[index].duration){if(index+1<route.length){index++;void enter(token);}else{active=false;outcome='complete';onEnd?.('complete');notify();}}else notify();},diagnostics:state};
};
