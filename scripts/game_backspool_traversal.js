/* Authored traversal foundation. Motion durations may come from a validated role manifest; mechanics remain authored.
 * Adapters must provide full-body collision/support queries in actor-origin coordinates.
 * This module never moves the actor or takes ownership from the combat controller.
 */
(function(root){
 'use strict';
 const copy=p=>({x:p.x,y:p.y,z:p.z}),mix=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t});
 const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
 function create(api={},options={}){
  const cfg={runSpeed:8.6,sprintSpeed:16,acceleration:18,deceleration:25,jumpBuffer:.15,coyote:.11,jumpVelocity:10.8,maxVaultRise:1.25,maxClimbRise:2.3,maxDistance:2.6,vaultDuration:1.65,climbDuration:1.599,...options};
  let clock=0,lastGround=-Infinity,jumpUntil=-Infinity,consumedGround=false,plan=null,reason=null,speed=0;
  const eligible=f=>f?.hero==='backspool'&&f.active&&!f.locked&&!f.retracing&&!f.preview&&!f.defeated;
  function reset(why='RESET'){lastGround=jumpUntil=-Infinity;consumedGround=false;plan=null;speed=0;reason=why;}
  function pressJump(){jumpUntil=clock+cfg.jumpBuffer;}
  function update(dt,f){
   if(!Number.isFinite(dt)||dt<0||dt>.1)throw Error('Traversal requires a bounded simulation step (0–100 ms).');
   if(!eligible(f)){reset(f?.hero!=='backspool'?'HERO CHANGE':'INELIGIBLE');return {ownsMovement:false};}
   clock+=dt;
   if(f.grounded){lastGround=clock;consumedGround=false;}
   if(plan)return advance(dt,f);
   const dir=f.direction||{x:0,z:0},mag=Math.min(1,Math.hypot(dir.x,dir.z)),target=mag*(f.walk&&!f.sprint?1.65:f.sprint?Math.min(22,Math.max(cfg.sprintSpeed,f.speedLimit||0)):cfg.runSpeed),rate=target>speed?cfg.acceleration:cfg.deceleration;
   speed+=Math.sign(target-speed)*Math.min(Math.abs(target-speed),rate*dt);
   const result={ownsMovement:false,velocity:f.grounded?{x:mag?dir.x/mag*speed:0,z:mag?dir.z/mag*speed:0}:null,jump:false};
   if(clock<=jumpUntil&&!consumedGround&&clock-lastGround<=cfg.coyote&&f.canJump!==false){jumpUntil=-Infinity;lastGround=-Infinity;consumedGround=true;result.jump=true;result.jumpVelocity=cfg.jumpVelocity;}
   return result;
  }
  function requestObstacle(f){
   if(!eligible(f)||!f.grounded||f.canJump===false||plan)return false;
   if(!api.probeObstacle||!api.sweepClear||!api.supportAt){reason='MISSING CLEARANCE ADAPTER';return false;}
   const candidate=api.probeObstacle(f,cfg);if(!candidate){reason='NO VALID LEDGE';return false;}
   const start=copy(f.position),end=copy(candidate.end),rise=end.y-start.y,crestRise=(candidate.crestY??end.y+.12)-start.y,vault=!!candidate.vault;
   if(![start.x,start.y,start.z,end.x,end.y,end.z].every(Number.isFinite)||(vault?rise<-.2||rise>.2||crestRise<.25||crestRise>cfg.maxVaultRise+.12:rise<.25||rise>cfg.maxClimbRise)||distance(start,end)>cfg.maxDistance){reason='LEDGE OUT OF REACH';return false;}
   const supported=api.supportAt(end);if(!Number.isFinite(supported)||Math.abs(supported-end.y)>.08){reason='UNSUPPORTED EXIT';return false;}
   const crest={x:start.x,y:candidate.crestY??end.y+.12,z:start.z},points=candidate.points?candidate.points.map(copy):[start,crest,end];
   if(points.length<3||points.length>8||points.some(p=>![p.x,p.y,p.z].every(Number.isFinite)||p.y<start.y-.2||p.y>start.y+cfg.maxClimbRise+.3)||distance(points[0],start)>.01||distance(points[points.length-1],end)>.01){reason='INVALID BODY PATH';return false;}
   const lengths=points.slice(1).map((p,i)=>distance(points[i],p)),total=lengths.reduce((a,b)=>a+b,0);if(total>cfg.maxDistance+cfg.maxClimbRise*2||total<.01){reason='BODY PATH TOO LONG';return false;}
   for(let i=1;i<points.length;i++)if(!api.sweepClear(points[i-1],points[i])){reason='BLOCKED BODY PATH';return false;}
   const duration=f.actionDurations?.[vault?'vault':'climb']??(vault?cfg.vaultDuration:cfg.climbDuration);
   if(!Number.isFinite(duration)||duration<=0||duration>5){reason='INVALID ACTION TIMING';return false;}
   const entrySpeed=Math.min(22,Math.max(speed,Math.hypot(f.velocity?.x||0,f.velocity?.z||0))),d=f.direction||{x:0,z:0},n=Math.hypot(d.x,d.z)||1;
   plan={kind:vault?'vault':'climb',points,lengths,total,time:0,duration,exitVelocity:{x:d.x/n*entrySpeed,y:0,z:d.z/n*entrySpeed}};jumpUntil=-Infinity;reason=null;return true;
  }
  function advance(dt,f){
   const a=plan;a.time=Math.min(a.duration,a.time+dt);const t=a.time/a.duration;
   let remaining=t*a.total,index=0;while(index<a.lengths.length-1&&remaining>a.lengths[index])remaining-=a.lengths[index++];const next=mix(a.points[index],a.points[index+1],Math.min(1,remaining/Math.max(1e-9,a.lengths[index])));
   if(!api.sweepClear(f.position,next)){plan=null;reason='PATH CHANGED';return {ownsMovement:false,interrupted:true};}
   if(t>=1){const h=api.supportAt(next);if(!Number.isFinite(h)||Math.abs(h-next.y)>.08){plan=null;reason='EXIT SUPPORT LOST';return {ownsMovement:false,interrupted:true};}}
   const result={ownsMovement:true,position:next,kind:a.kind,phase:t,landed:t>=1,velocity:t>=1?a.exitVelocity:{x:0,y:0,z:0}};if(t>=1){plan=null;lastGround=clock;speed=Math.hypot(a.exitVelocity.x,a.exitVelocity.z);}return result;
  }
  return {update,pressJump,requestObstacle,reset,state:()=>({clock,speed,jumpRemaining:Math.max(0,jumpUntil-clock),coyoteRemaining:Math.max(0,cfg.coyote-(clock-lastGround)),action:plan?.kind||null,duration:plan?.duration||null,reason,origin:'authored; source behavior unverified'})};
 }
 root.createBackspoolTraversal=create;if(typeof module!=='undefined')module.exports={create};
})(typeof window!=='undefined'?window:globalThis);
