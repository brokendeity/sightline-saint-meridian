/* Authored Backspool traversal. Source motions do not establish original Forspoken mechanics. */
(function(root){
 const cp=p=>({x:p.x,y:p.y,z:p.z}),len=p=>Math.hypot(p.x,p.y,p.z),sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y,z:a.z-b.z}),add=(a,b,k=1)=>({x:a.x+b.x*k,y:a.y+b.y*k,z:a.z+b.z*k}),mix=(a,b,t)=>add(a,sub(b,a),t),finite=p=>p&&[p.x,p.y,p.z].every(Number.isFinite);
 function create(api){let plan=null,clock=0,cooldown=0,floatUsed=0,wallJumps=0,reason=null,last=null,serial=0;const events=[];let wallLock=null;let waterSpeed=0,waterDirection={x:0,z:0};
 const eligible=f=>f.hero==='backspool'&&f.active&&!f.locked&&!f.retracing&&!f.preview&&!f.defeated&&!f.posture;
 function log(kind,extra={}){events.push({eventId:++serial,time:clock,kind,...extra});if(events.length>48)events.shift();}
 function reset(why='RESET'){if(plan)log('end',{mode:plan.kind,reason:why});plan=null;reason=why;waterSpeed=0;last=null;if(['INPUT RESET','RESPAWN','HERO CHANGE'].includes(why)){cooldown=0;floatUsed=0;wallJumps=0;wallLock=null;}}
 const clear=(a,b)=>api.sweepClear(a,b)===true;
 function output(p,v,kind,phase=0,landed=false){last={ownsMovement:true,position:cp(p),velocity:cp(v),kind,phase,sourceTime:['wallApproach','wall','wallBoost'].includes(plan?.kind)?plan.poseTime||0:plan?.time||0,landed};if(plan)plan.expected=cp(p);return last;}
 function finish(why){const wall=plan?.wall;reset(why);if(wall)wallLock={...wall,neutral:false};cooldown=.25;return {ownsMovement:false,interrupted:true,reason:why};}
 function startWall(f,w){
  if(!eligible(f)||!f.sprint||plan&&plan.kind!=='float'||cooldown>1e-6&&!(f.linkFromTether&&reason==='TETHER ARRIVED')||wallJumps>=6||!w||!finite(w.normal)||!finite(w.position)||!Number.isFinite(w.top))return false;
  const intent=Math.hypot(f.direction.x,f.direction.z),outward=f.direction.x*w.normal.x+f.direction.z*w.normal.z;if(intent<.15||outward>.25)return false;
  if(wallLock&&wallLock.normal.x*w.normal.x+wallLock.normal.z*w.normal.z>.99&&Math.abs((w.position.x-wallLock.position.x)*w.normal.x+(w.position.z-wallLock.position.z)*w.normal.z)<.2)return false;
  const nl=Math.hypot(w.normal.x,w.normal.z);if(nl<.99||nl>1.01||Math.abs(w.normal.y)>.01||len(sub(w.position,f.position))>1.4||!clear(f.position,w.position))return false;
  plan={kind:'wallApproach',wall:{...w,normal:cp(w.normal),position:cp(w.position)},time:0,poseTime:0,wallAge:0,neutralTime:0,start:cp(f.position),entryVelocity:cp(f.velocity),expected:cp(f.position)};reason=null;log('wall-start');return true;
 }
 function startTether(f,a){
  if(!eligible(f)||plan&&!['float','wall','ledge','water'].includes(plan.kind)||cooldown>1e-6||!a||!finite(a.position)||!finite(a.contact))return false;
  const distance=len(sub(a.position,f.position));if(distance<3||distance>120||!clear(f.position,a.position)||api.anchorValid?.(a)===false){reason='TETHER PATH BLOCKED';return false;}
  plan={kind:'tether',anchor:{...a,position:cp(a.position),contact:cp(a.contact)},time:0,duration:distance/28+.3,expected:cp(f.position)};reason=null;log('tether-start',{distance});return true;
 }
 function boost(f){if(!eligible(f)||!plan||!['wall','ledge'].includes(plan.kind)||wallJumps>=3)return false;wallJumps++;plan={...plan,kind:'wallBoost',time:0,wallPoseTime:plan.poseTime,poseTime:0,expected:cp(f.position)};log('wall-boost',{count:wallJumps});return true;}
 function detach(f){if(!plan||!eligible(f))return null;let v=null;
  if(plan.kind==='wall'||plan.kind==='wallApproach'||plan.kind==='ledge'){const n=plan.wall.normal;wallJumps++;v={x:n.x*7,y:9,z:n.z*7};}
  else if(plan.kind==='water'){v={x:f.velocity.x,y:8,z:f.velocity.z};}
  else if(plan.kind==='tether'){const d=sub(plan.anchor.position,f.position),l=len(d)||1;v={x:d.x/l*16,y:Math.max(4,d.y/l*16),z:d.z/l*16};}
  else return null;const wall=plan.wall;reset('JUMP DETACH');if(wall)wallLock={...wall,neutral:false};cooldown=.5;return {velocity:v};
 }
 function mantle(f){const w=plan.wall,end=add({x:f.position.x,y:w.top+.42,z:f.position.z},w.normal,-1.25),high={x:f.position.x,y:end.y+.02,z:f.position.z},h=api.supportAt(end);
  if(!Number.isFinite(h)||Math.abs(h-end.y)>.08||!clear(f.position,high)||!clear(high,end)){reason='LEDGE EXIT BLOCKED';return false;}
  plan={...plan,kind:'mantle',time:0,poseTime:0,duration:1.599,start:cp(f.position),high,end,expected:cp(f.position)};log('mantle-start');return true;
 }
 function update(dt,f){
  if(!Number.isFinite(dt)||dt<0||dt>.1)throw Error('Advanced traversal requires bounded steps');if(!eligible(f)){reset(f.hero!=='backspool'?'HERO CHANGE':'INELIGIBLE');return {ownsMovement:false};}
  clock+=dt;cooldown=Math.max(0,cooldown-dt);if(wallLock&&Math.hypot(f.direction.x,f.direction.z)<.15)wallLock.neutral=true;if(wallLock&&(f.grounded&&cooldown<=1e-6&&wallLock.neutral&&Math.hypot(f.direction.x,f.direction.z)>=.15||(f.position.x-wallLock.position.x)*wallLock.normal.x+(f.position.z-wallLock.position.z)*wallLock.normal.z>.6))wallLock=null;if(f.grounded&&!plan){floatUsed=0;wallJumps=0;}
  if(plan?.expected&&len(sub(f.position,plan.expected))>.15)return finish('ACTOR DISPLACED');
  if(plan&&['wallApproach','wall','wallBoost','ledge'].includes(plan.kind)){
   const w=plan.wall;if(api.wallValid?.(w)===false)return finish('WALL CHANGED');
   const n=w.normal,dot=f.direction.x*n.x+f.direction.z*n.z,intent=Math.hypot(f.direction.x,f.direction.z);
   if(plan.kind!=='ledge'){
    plan.neutralTime=intent<.15?(plan.neutralTime||0)+dt:0;
    if(!f.sprint&&f.position.y<w.top-.8||dot>.25||plan.neutralTime>.08)return finish(dot>.25?'WALL STEERED AWAY':'WALL RELEASED');
    plan.wallAge=(plan.wallAge||0)+dt;if(plan.wallAge>4.2)return finish('WALL RUN EXPIRED');
   }
   if(f.position.y>=w.top-.8&&plan.kind!=='wallApproach'){
    if(f.sprint||f.jumpHeld){if(mantle(f))return update(0,f);}else plan.kind='ledge';
   }
   if(plan.kind==='ledge'){if(f.inputY<-.3)return finish('LEDGE RELEASED');const tangent={x:n.z,y:0,z:-n.x},next=add(f.position,tangent,f.inputX*1.3*dt);if(!clear(f.position,next)||api.wallContact?.(next,w)===false)return finish('LEDGE ENDED');return output(next,{x:0,y:0,z:0},'ledge',clock%1);}
   const tangent={x:f.direction.x-n.x*dot,y:0,z:f.direction.z-n.z*dot},tl=Math.hypot(tangent.x,tangent.z);
   // Hysteresis avoids switching source poses at diagonal stick boundaries.
   if(intent>=.15)plan.running=plan.running?tl>.22:tl>.38;if(tl>.15)plan.runDirection={x:tangent.x/tl,z:tangent.z/tl};
   const speed=Math.max(6,Math.min(14,Math.hypot(plan.entryVelocity.x,plan.entryVelocity.z))),target=plan.kind==='wallBoost'?{x:0,y:10,z:0}:plan.running?{x:(plan.runDirection?.x||0)*speed,y:2.3,z:(plan.runDirection?.z||0)*speed}:{x:0,y:5.5,z:0};
   plan.time+=dt;plan.poseTime=(plan.poseTime||0)+dt;
   const blend=1-Math.exp(-12*dt),normalSpeed=f.velocity.x*n.x+f.velocity.z*n.z,v={x:(f.velocity.x-normalSpeed*n.x)*(1-blend)+target.x*blend,y:f.velocity.y*(1-blend)+target.y*blend,z:(f.velocity.z-normalSpeed*n.z)*(1-blend)+target.z*blend},next=add(f.position,v,dt);
   // Advance tangentially once per step; ease only the remaining stand-off.
   const plane=(next.x-w.position.x)*n.x+(next.z-w.position.z)*n.z;
   const before=Math.min(1,Math.max(0,(plan.time-dt)/.12)),after=Math.min(1,plan.time/.12),ease=x=>x*x*(3-2*x),weight=plan.kind==='wallApproach'?(1-ease(before)>1e-6?(ease(after)-ease(before))/(1-ease(before)):1):1;
   next.x-=plane*n.x*weight;next.z-=plane*n.z*weight;
   if(!clear(f.position,next)||api.wallContact?.(next,w)===false)return finish('WALL PATH BLOCKED');
   const motion=plan.kind==='wallBoost'?'wallBoost':plan.running?'wallRun':'wallClimb';
   // Report the velocity actually integrated, including the bounded entry offset.
   const velocity=dt>0?{x:(next.x-f.position.x)/dt,y:(next.y-f.position.y)/dt,z:(next.z-f.position.z)/dt}:v;
   const result=output(next,velocity,motion,plan.time);
   if(plan.kind==='wallApproach'&&plan.time>=.12){plan.kind='wall';plan.time=0;}
   if(plan.kind==='wallBoost'&&plan.time>=.35){plan.kind='wall';plan.time=0;plan.poseTime=plan.wallPoseTime||0;}
   return result;
  }
  if(plan?.kind==='mantle'){
   if(api.wallValid?.(plan.wall)===false)return finish('WALL CHANGED');plan.time=Math.min(plan.duration,plan.time+dt);const t=plan.time/plan.duration,ease=x=>x*x*(3-2*x),next=t<.6?mix(plan.start,plan.high,ease(t/.6)):mix(plan.high,plan.end,ease((t-.6)/.4));
   if(!clear(f.position,next)||Math.abs(api.supportAt(plan.end)-plan.end.y)>.08)return finish('MANTLE EXIT LOST');const result=output(next,dt>0?{x:(next.x-f.position.x)/dt,y:t>=1?0:(next.y-f.position.y)/dt,z:(next.z-f.position.z)/dt}:{x:0,y:0,z:0},'mantle',t,t>=1);if(t>=1){reset('ROOFTOP REACHED');wallJumps=0;cooldown=.3;}return result;
  }
  if(plan?.kind==='tether'){
   const a=plan.anchor;plan.time+=dt;if(api.anchorValid?.(a)===false)return finish('ANCHOR CHANGED');if(plan.time>plan.duration)return finish('TETHER EXPIRED');const d=sub(a.position,f.position),distance=len(d),v=distance>.001?{x:d.x/distance*28,y:d.y/distance*28,z:d.z/distance*28}:{x:0,y:0,z:0},next=distance<=28*dt?cp(a.position):add(f.position,v,dt);
   if(!clear(f.position,next))return finish('TETHER PATH CHANGED');const result=output(next,v,'tether',plan.time/plan.duration);if(distance<=28*dt){const h=api.supportAt(next);result.landed=Number.isFinite(h)&&Math.abs(h-next.y)<.08;result.velocity=result.landed?{x:0,y:0,z:0}:{x:0,y:0,z:0};reset('TETHER ARRIVED');cooldown=.3;}return result;
  }
  const water=api.waterAt(f.position);
  if(!plan&&water&&cooldown<=0&&f.position.y<=water.surface+.9){plan={kind:'water',water,time:0,expected:cp(f.position)};floatUsed=0;waterSpeed=Math.min(16,Math.hypot(f.velocity.x,f.velocity.z));waterDirection=waterSpeed>.01?{x:f.velocity.x/Math.max(.01,Math.hypot(f.velocity.x,f.velocity.z)),z:f.velocity.z/Math.max(.01,Math.hypot(f.velocity.x,f.velocity.z))}:{x:0,z:0};log('water-enter',{id:water.id});}
  if(plan?.kind==='water'){
   if(!water)return finish('WATER REMOVED');plan.water=water;plan.time+=dt;const mag=Math.min(1,Math.hypot(f.direction.x,f.direction.z)),glide=f.sprint&&mag>.2,target=mag*(glide?12:2.4);waterSpeed+=Math.sign(target-waterSpeed)*Math.min(Math.abs(target-waterSpeed),10*dt);if(mag>.01)waterDirection={x:f.direction.x/mag,z:f.direction.z/mag};const v={x:waterDirection.x*waterSpeed,y:0,z:waterDirection.z*waterSpeed},next=add(f.position,v,dt);next.y=f.position.y+Math.max(-4*dt,Math.min(4*dt,water.surface+.42-f.position.y));
   if(!api.waterAt(next)){const h=api.supportAt(next);if(!Number.isFinite(h)||Math.abs(h-next.y)>.65)return output(f.position,{x:0,y:0,z:0},'swimIdle',plan.time);next.y=h;if(!clear(f.position,next))return output(f.position,{x:0,y:0,z:0},'swimIdle',plan.time);const result=output(next,v,'shore',0,true);reset('SHORE REACHED');cooldown=.2;return result;}
   if(!clear(f.position,next))return output(f.position,{x:0,y:0,z:0},'swimIdle',plan.time);return output(next,v,glide?'glide':waterSpeed>.2?'swim':'swimIdle',plan.time);
  }
  if(plan?.kind==='float'&&(!f.jumpHeld||f.grounded||floatUsed>=6)){reset(f.grounded?'FLOAT LANDED':'FLOAT RELEASED');}
  if(!plan&&!f.grounded&&f.jumpHeld&&!f.reserveJump&&f.velocity.y<=0&&floatUsed<6&&cooldown<=0){plan={kind:'float',time:0};log('float-start');}
  if(plan?.kind==='float'){floatUsed=Math.min(6,floatUsed+dt);plan.time+=dt;last={ownsMovement:false,floating:true,kind:'float',phase:plan.time};return last;}
  return {ownsMovement:false};
 }
 function equipmentReady(){return !plan||['wall','ledge'].includes(plan.kind)&&api.wallValid?.(plan.wall)!==false&&api.wallContact?.(plan.expected,plan.wall)!==false;}
 function equipmentHandoff(why){if(!equipmentReady())return false;if(plan){reset(why);cooldown=.25;}return true;}
 return{equipmentReady,equipmentHandoff,update,startWall,startTether,boost,detach,mantle: f=>plan?.kind==='ledge'&&mantle(f),reset,active:()=>!!plan,locked:()=>!!plan&&plan.kind!=='float',floating:()=>plan?.kind==='float',releaseForCombat(){if(plan?.kind==='float')reset('COMBAT CANCEL');return !plan;},state:()=>({kind:plan?.kind||null,clock,cooldown,floatRemaining:Math.max(0,6-floatUsed),wallJumps,reason,motion:last,water:plan?.water?.id||null,anchor:plan?.anchor?.contact||null,wallNormal:plan?.wall?.normal||null,wallTop:plan?.wall?.top??null,wallPoint:plan?.wall?.position||null,wallAge:plan?.wallAge||0,wallRegrabLocked:!!wallLock,events:events.slice(),origin:'authored mechanics; source/native candidate poses'})};
 }
 root.createBackspoolAdvanced=create;if(typeof module!=='undefined')module.exports={create};
})(typeof window!=='undefined'?window:globalThis);
