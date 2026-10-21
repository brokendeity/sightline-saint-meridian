/* Authored ladder mechanics using source-inspired movement budgets.
 * Clearance/support adapters use actor-origin coordinates. No actor, source record,
 * health or game scene is mutated here. Original Forspoken controller is not reproduced.
 */
(function(root){
 'use strict';
 const finite=p=>p&&[p.x,p.y,p.z].every(Number.isFinite);
 const copy=p=>({x:p.x,y:p.y,z:p.z});
 const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
 const mix=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t});
 function create(api={},options={}){
  const cfg={attachDistance:1.4,approachDuration:.15,exitDuration:.35,speed:.64,sprintSpeed:.96,cycleDistance:.6,supportTolerance:.08,...options};
  for(const k of Object.keys(cfg))if(!Number.isFinite(cfg[k])||cfg[k]<=0)throw Error('Invalid ladder setting: '+k);
  let plan=null,reason=null,clock=0,completed=0;
  const eligible=f=>f?.hero==='backspool'&&f.active&&!f.locked&&!f.retracing&&!f.preview&&!f.defeated;
  function reset(why='RESET'){plan=null;reason=why;}
  function supported(p){const y=api.supportAt(p);return Number.isFinite(y)&&Math.abs(y-p.y)<=cfg.supportTolerance;}
  function clear(a,b,l){return api.sweepClear(copy(a),copy(b),l)===true;}
  function reject(why){reason=why;return false;}
  function requestAttach(f,l){
   if(!eligible(f))return reject('INELIGIBLE');
   if(plan)return reject('ALREADY ATTACHED');
   if(!finite(f.position)||!l||!finite(l.bottom)||!finite(l.top)||!finite(l.exitTop)||!finite(l.exitBottom)||!Number.isFinite(l.yaw)||!l.normal||![l.normal.x,l.normal.z].every(Number.isFinite))return reject('INVALID LADDER');
   if(typeof api.sweepClear!=='function'||typeof api.supportAt!=='function')return reject('MISSING CLEARANCE ADAPTER');
   if(l.top.y-l.bottom.y<.4||l.top.y-l.bottom.y>100||Math.hypot(l.top.x-l.bottom.x,l.top.z-l.bottom.z)>.05)return reject('INVALID VERTICAL RAIL');
   const nl=Math.hypot(l.normal.x,l.normal.z);if(nl<.01)return reject('INVALID LADDER NORMAL');
   const ladder={id:l.id??null,bottom:copy(l.bottom),top:copy(l.top),exitTop:copy(l.exitTop),exitBottom:copy(l.exitBottom),normal:{x:l.normal.x/nl,z:l.normal.z/nl},yaw:l.yaw};
   for(const [rail,exit] of [[ladder.top,ladder.exitTop],[ladder.bottom,ladder.exitBottom]])if(Math.abs(rail.y-exit.y)>.2||distance(rail,exit)>2)return reject('INVALID EXIT');
   const target={x:ladder.bottom.x,y:Math.max(ladder.bottom.y,Math.min(ladder.top.y,f.position.y)),z:ladder.bottom.z};
   if(distance(f.position,target)>cfg.attachDistance)return reject('LADDER OUT OF REACH');
   if(!supported(ladder.exitTop)||!supported(ladder.exitBottom))return reject('UNSUPPORTED EXIT');
   if(!clear(f.position,target,ladder)||!clear(ladder.bottom,ladder.top,ladder)||!clear(ladder.top,ladder.exitTop,ladder)||!clear(ladder.bottom,ladder.exitBottom,ladder))return reject('BLOCKED LADDER PATH');
   plan={ladder,stage:'approach',start:copy(f.position),expected:copy(f.position),target,time:0,cycle:0,direction:0};reason=null;return true;
  }
  function requestDetach(f){
   if(!plan)return false;
   if(!eligible(f)||!finite(f.position)){reset('INELIGIBLE');return false;}
   const n=plan.ladder.normal,position=copy(f.position);reset('DETACHED');
   return {ownsMovement:false,detached:true,position,velocity:{x:3*n.x,y:4,z:3*n.z},jumpVelocity:4,landed:false};
  }
  function interrupted(why){reset(why);return {ownsMovement:false,interrupted:true,reason:why};}
  function result(p,kind,phase,landed=false){plan.expected=copy(p);return {ownsMovement:true,position:copy(p),yaw:plan.ladder.yaw,kind,phase,landed};}
  function update(dt,f){
   if(!Number.isFinite(dt)||dt<0||dt>.1)throw Error('Ladder requires a bounded simulation step (0–100 ms).');
   clock+=dt;
   if(!eligible(f)){if(plan)reset(f?.hero!=='backspool'?'HERO CHANGE':'INELIGIBLE');return {ownsMovement:false};}
   if(!plan)return {ownsMovement:false};
   if(!finite(f.position))return interrupted('INVALID POSITION');
   if(distance(f.position,plan.expected)>.08)return interrupted('ACTOR DISPLACED');
   const a=plan,l=a.ladder;
   // A changed world cannot leave an attached actor heading to a missing exit.
   if(!supported(l.exitTop)||!supported(l.exitBottom))return interrupted('EXIT SUPPORT LOST');
   if(a.stage==='approach'||a.stage==='exit'){
    const duration=a.stage==='approach'?cfg.approachDuration:cfg.exitDuration;
    a.time=Math.min(duration,a.time+dt);const t=a.time/duration,p=mix(a.start,a.target,t);
    if(!clear(f.position,p,l))return interrupted('PATH CHANGED');
    if(a.stage==='approach'){
     const out=result(p,'ladderHold',a.cycle%1);
     if(t>=1){a.stage='rail';a.time=0;}return out;
    }
    if(t>=1&&!supported(p))return interrupted('EXIT SUPPORT LOST');
    const out=result(p,'ladderExit',t,t>=1);
    if(t>=1){completed++;reset('EXIT COMPLETE');}return out;
   }
   const raw=Number.isFinite(f.direction?.y)?f.direction.y:0,axis=Math.max(-1,Math.min(1,raw));
   const dy=axis*(f.sprint?cfg.sprintSpeed:cfg.speed)*dt;
   const p={x:l.bottom.x,y:Math.max(l.bottom.y,Math.min(l.top.y,f.position.y+dy)),z:l.bottom.z};
   if(!clear(f.position,p,l))return interrupted('PATH CHANGED');
   a.cycle+=Math.abs(p.y-f.position.y)/cfg.cycleDistance;a.direction=Math.sign(axis);
   if((axis>0&&p.y>=l.top.y-1e-8)||(axis<0&&p.y<=l.bottom.y+1e-8)){
    a.stage='exit';a.start=copy(p);a.target=copy(axis>0?l.exitTop:l.exitBottom);a.time=0;
    if(!clear(p,a.target,l))return interrupted('EXIT PATH CHANGED');
    return result(p,'ladderExit',0);
   }
   return result(p,axis>0?'ladderUp':axis<0?'ladderDown':'ladderHold',a.cycle%1);
  }
  return {requestAttach,requestDetach,update,reset,state:()=>({attached:!!plan,ladderId:plan?.ladder.id??null,stage:plan?.stage??null,phase:plan?(plan.cycle%1):0,direction:plan?.direction??0,clock,completed,reason,origin:'authored ladder controller; original source behavior unverified'})};
 }
 root.createBackspoolLadder=create;if(typeof module!=='undefined')module.exports={create};
})(typeof window!=='undefined'?window:globalThis);
