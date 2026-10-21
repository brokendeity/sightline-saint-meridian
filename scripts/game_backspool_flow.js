/* Backspool traversal action graph. Recovered Forspoken curves, authored safe physics. */
(function(root){'use strict';
 const cp=p=>({x:p.x,y:p.y,z:p.z}),add=(a,b,t=1)=>({x:a.x+b.x*t,y:a.y+b.y*t,z:a.z+b.z*t}),norm=d=>{const n=Math.hypot(d.x,d.z)||1;return{x:d.x/n,y:0,z:d.z/n}};
 function create(api){let clock=0,plan=null,cooldown=0,airDash=1,airLift=1,waterHop=0,charge=0,charging=false,rollUntil=-1,jumpAge=99,lastGround=true,lastWater=false,last=null,serial=0,reason=null,skipReady=0,airRolls=2,pendingRelease=null;const events=[];
 const eligible=f=>f.hero==='backspool'&&f.active&&!f.blocked&&!f.retracing&&!f.preview&&!f.defeated&&!f.posture;
 const emit=(kind,data={})=>{events.push({id:++serial,time:clock,kind,...data});if(events.length>64)events.shift()};
 function reset(why='RESET'){if(plan||charging)emit('interrupt',{reason:why});plan=null;charging=false;charge=0;pendingRelease=null;reason=why;last=null;rollUntil=-1;if(why==='RESPAWN'){airDash=airLift=1;waterHop=0;airRolls=2;skipReady=0;jumpAge=99;cooldown=0;}}
 function begin(kind,f,velocity,duration,extra={}){if(!eligible(f)||cooldown>0||plan)return false;plan={kind,velocity:cp(velocity),duration,time:0,expected:cp(f.position),airborne:!f.grounded,...extra};reason=null;emit('start',{action:kind});return true;}
 function dash(f){if(!eligible(f)||plan||!f.grounded&&!airDash)return false;const d=norm(f.direction);if(Math.hypot(d.x,d.z)<.01)return false;const aerial=!f.grounded,ok=begin(aerial?'airDash':'dash',f,{x:d.x*(aerial?20:14),y:aerial?Math.max(0,f.velocity.y):0,z:d.z*(aerial?20:14)},aerial?.32:.28);if(ok&&aerial)airDash--;return ok;}
 function scale(f){if(f.grounded||!airLift)return false;const ok=begin('scale',f,{x:f.velocity.x,y:11,z:f.velocity.z},.45);if(ok)airLift--;return ok;}
 function flip(f,kind='frontFlip',timing={}){
  if(!eligible(f)||!f.grounded||!['frontFlip','backFlip','sideFlipLeft','sideFlipRight','twistFlip','gapFlip','obstacleFlip'].includes(kind))return false;
  const duration=timing.duration??1.2;if(!Number.isFinite(duration)||duration<.65||duration>1.8)return false;
  const d=norm(f.direction),speed=timing.speed??Math.min(16,Math.max(5,Math.hypot(f.velocity.x,f.velocity.z))),v={x:d.x*speed,y:23*duration/2,z:d.z*speed};
  // Reject the complete prospective body arc, including its landing, before commitment.
  let previous=cp(f.position);const steps=Math.ceil(duration*60);
  for(let i=1;i<=steps;i++){const t=duration*i/steps,next={x:f.position.x+v.x*t,y:f.position.y+v.y*t-11.5*t*t,z:f.position.z+v.z*t};if(!api.sweepClear(previous,next)){reason='FLIP PATH BLOCKED';return false;}previous=next;}
  const support=api.supportAt({...previous,y:previous.y+.2});if(!Number.isFinite(support)||Math.abs(support-f.position.y)>.3){reason='FLIP LANDING UNSUPPORTED';return false;}
  return begin(kind,f,v,duration,{airborne:true,flip:true,start:cp(f.position),facingYaw:f.facingYaw,landing:cp(previous),gravity:false});
 }
 function secondWaterJump(f){if(f.grounded||!waterHop)return false;const d=norm(Math.hypot(f.direction.x,f.direction.z)>.1?f.direction:f.velocity);const ok=begin('waterJump',f,{x:d.x*18,y:8.5,z:d.z*18},.45);if(ok)waterHop=0;return ok;}
 function rebound(f,normal,tree=false){if(!eligible(f)||plan||cooldown>0)return false;const d=norm(normal);const ok=begin(tree?'treeFlip':'slopeKick',f,{x:d.x*14,y:10,z:d.z*14},.55);if(ok){airDash=1;emit('refresh',{resource:'airDash'})}return ok;}
 function evade(f){if(!eligible(f))return false;const teleport=clock<=rollUntil;if(!f.grounded&&!teleport&&airRolls<=0)return false; if(plan&&!(teleport||plan.kind==='dash'||plan.kind==='airDash'))return false;if(teleport||plan&&['dash','airDash'].includes(plan.kind)){if(plan)emit('cancel',{action:plan.kind,by:'evade'});plan=null;cooldown=0;}const d=norm(f.direction);if(Math.hypot(d.x,d.z)<.1)return false;const ok=begin(teleport?'teleport':'aerialRoll',f,{x:d.x*(teleport?38:15),y:teleport?Math.max(f.velocity.y,0):f.grounded?6:Math.max(2,f.velocity.y),z:d.z*(teleport?38:15)},teleport?.24:.4,{gravity:!teleport});if(ok){if(!f.grounded&&!teleport)airRolls--;rollUntil=teleport?-1:clock+.9;}return ok;}
 function skip(f){if(!eligible(f)||plan||clock<skipReady)return false;const ok=begin('skip',f,{x:0,y:0,z:0},1.6,{gravity:false});if(ok)skipReady=clock+4;return ok;}
 function switchMove(f,state){if(!eligible(f)||plan)return false;let d=norm(f.direction),kind='switchBackstep',v={x:-d.x*13,y:1,z:-d.z*13};if(state==='impact'){kind='switchLift';v={x:d.x*3,y:10,z:d.z*3};}if(state==='counter'){kind='switchSlide';v={x:d.x*22,y:f.grounded?0:Math.max(0,f.velocity.y),z:d.z*22};}return begin(kind,f,v,.38);}
 function cancel(f){if(!eligible(f)||plan&&['scale','waterJump','treeFlip'].includes(plan.kind))return false;const kind=plan?.kind;plan=null;cooldown=.08;last=null;emit('cancel',{action:kind||'flow'});return{velocity:{x:f.velocity.x*.25,y:Math.max(f.velocity.y,-2),z:f.velocity.z*.25}};}
 function setCharge(held,f){if(!eligible(f))return false;if(held){if(plan)return false;if(!charging){charging=true;charge=0;emit('charge-start')}return true;}if(!charging)return false;const power=Math.min(1,charge/1.2);charging=false;charge=0;if(plan&&!['dash','airDash'].includes(plan.kind)){pendingRelease=power;emit('charge-queued',{power});return true;}if(plan){emit('cancel',{action:plan.kind,by:'charge-release'});plan=null;}emit('charge-release',{power});api.release?.(power,f);return true;}
 function update(dt,f){if(!Number.isFinite(dt)||dt<0||dt>.1)throw Error('Bounded Flow simulation step required');if(!eligible(f)){reset(f.hero!=='backspool'?'HERO CHANGE':'INELIGIBLE');lastGround=!!f.grounded;lastWater=!!f.water;return{ownsMovement:false};}clock+=dt;cooldown=Math.max(0,cooldown-dt);jumpAge+=dt;
  if(f.grounded){airDash=airLift=1;waterHop=0;airRolls=2;}if(lastWater&&!f.water&&!f.grounded){waterHop=1;jumpAge=0;}lastWater=!!f.water;
  if(lastGround&&!f.grounded&&f.velocity.y>0)jumpAge=0;lastGround=!!f.grounded;if(charging)charge=Math.min(1.2,charge+dt);
  if(!plan){if(pendingRelease!==null){const power=pendingRelease;pendingRelease=null;emit('charge-release',{power});api.release?.(power,f);}return{ownsMovement:false};}if(Math.hypot(f.position.x-plan.expected.x,f.position.y-plan.expected.y,f.position.z-plan.expected.z)>.2){reset('ACTOR DISPLACED');return{ownsMovement:false};}
  const a=plan;a.time=Math.min(a.duration,a.time+dt);if(a.kind==='skip'){const d=norm(f.direction),rise=f.jumpHeld?6:f.descend?-6:1;a.velocity={x:d.x*13,y:rise,z:d.z*13};if(f.burst){a.velocity.x*=1.7;a.velocity.z*=1.7;}}
  if(a.kind==='skip'&&f.releaseSkip){reset('SKIP RELEASED');return{ownsMovement:false};}
  if(a.gravity!==false&&a.kind!=='dash'&&a.kind!=='airDash')a.velocity.y-=23*dt;
  let next=add(f.position,a.velocity,dt),landed=false;if(a.flip){next={x:a.start.x+a.velocity.x*a.time,y:a.start.y+23*a.duration/2*a.time-11.5*a.time*a.time,z:a.start.z+a.velocity.z*a.time};a.velocity.y=23*a.duration/2-23*a.time;}
  const h=api.supportAt(next);if(Number.isFinite(h)&&next.y<=h+1e-6&&f.position.y>=h-.2&&a.velocity.y<=0){next.y=h;a.velocity.y=0;landed=true;}
  if(!api.sweepClear(f.position,next)){reason='PATH BLOCKED';emit('blocked',{action:a.kind});plan=null;cooldown=.15;last={ownsMovement:true,position:cp(f.position),velocity:{x:0,y:0,z:0},kind:a.kind,time:a.time,phase:a.time/a.duration,landed:!!f.grounded,blocked:true};return last;}
  a.expected=cp(next);last={ownsMovement:true,position:next,velocity:cp(a.velocity),kind:a.kind,time:a.time,phase:a.time/a.duration,facingYaw:a.facingYaw,landed,invulnerable:a.kind==='skip'||a.kind==='teleport'||a.kind==='aerialRoll'&&a.time>=.04&&a.time<.22};
  // A supported flip landing is a continuation window. Delaying it by the
  // general skill cooldown can consume the remaining ground-jump buffer.
  if(a.time>=a.duration||landed&&a.airborne){emit('complete',{action:a.kind});plan=null;cooldown=a.flip&&landed?0:.08;}return last;
 }
 return{notifyJump:()=>{jumpAge=0;lastGround=false;},update,flip,launch:(f,v,kind='zipLaunch')=>begin(kind,f,v,.65),dash,scale,secondWaterJump,rebound,evade,skip,switchMove,cancel,setCharge,reset,refresh:()=>{airDash=1;},jumpGravity:f=>jumpAge<.22&&f.jumpHeld&&f.velocity.y>0?.5:1,charging:()=>charging,locked:()=>!!plan,active:()=>!!plan,invulnerable:()=>!!plan&&['skip','teleport'].includes(plan.kind)||!!last?.invulnerable&&!!plan,state:()=>({clock,action:plan?.kind||null,time:plan?.time||0,duration:plan?.duration||0,airDash,airLift,waterHop,airRolls,skipCooldown:Math.max(0,skipReady-clock),charging,charge,pendingRelease,jumpAge,reason,cooldown,events:events.slice(),motion:last})};
 }
 root.createBackspoolFlow=create;if(typeof module!=='undefined')module.exports={create};
})(typeof window!=='undefined'?window:globalThis);
