/* Cartridge flight follows the source-cast marker; source events are authored. */
(function(root){'use strict';
function createCartridgeDeployment(api={}){
 let clock=0,serial=0,attempt=0,shots=[],events=[],last=null,tensionAt=null;
 const emit=(type,data={})=>{events.push({id:++serial,time:clock,type,...data});events=events.slice(-64)};
 const finite=p=>p&&['x','y','z'].every(k=>Number.isFinite(p[k]));
 function cancel(reason='CANCEL'){const had=shots.length;shots=[];tensionAt=null;last=reason;if(had)emit('cancel',{reason})}
 function start(targets,autoCatch=false){if(shots.some(s=>s.status!=='attached'||clock<s.gestureUntil))return false;if(!targets.length||targets.length>2||targets.some(t=>!finite(t.contact)||!api.valid(t)))return false;
  const gestures=targets.map((_,i)=>api.gesture(i));if(gestures.some(g=>!g))return false;const id=++attempt;
  shots=targets.map((target,i)=>{const g=gestures[i],gestureAt=clock+g.offset;return{target,index:i,handIndex:api.handIndex?.(i)??i,throwId:id+':'+i,status:'gesture',gestureAt,gestureUntil:gestureAt+g.duration,releaseAt:gestureAt+g.releaseDelay,sourceAnimationId:g.sourceAnimationId,position:null,age:0,autoCatch}});tensionAt=null;last='deploying';emit('begin',{count:shots.length,autoCatch});return true;}
 function update(dt){if(!Number.isFinite(dt)||dt<=0)return;const step=Math.min(dt,.05);clock+=step;
  for(const s of shots){if(s.status==='attached')continue;if(!api.valid(s.target)){cancel('SURFACE CHANGED');return;}
   if(s.status==='gesture'){if(clock<s.releaseAt-1e-8)continue;const hand=api.hand(s.handIndex);if(!finite(hand)){cancel('HAND UNAVAILABLE');return;}s.position={...hand};s.status='flight';emit('release',{index:s.index,handIndex:s.handIndex,throwId:s.throwId,sourceAnimationId:s.sourceAnimationId,position:{...s.position}});}
   s.age+=step;if(s.age>3){cancel('PROJECTILE EXPIRED');return;}
   const delta={x:s.target.contact.x-s.position.x,y:s.target.contact.y-s.position.y,z:s.target.contact.z-s.position.z},distance=Math.hypot(delta.x,delta.y,delta.z),fraction=Math.min(1,42*step/Math.max(distance,1e-6)),to={x:s.position.x+delta.x*fraction,y:s.position.y+delta.y*fraction,z:s.position.z+delta.z*fraction};
   const hit=api.sweep(s.position,to,s.target);if(hit?.blocked){cancel('CARTRIDGE BLOCKED');return;}
   s.position=to;if(hit?.target){s.status='attached';s.position={...s.target.contact};emit('impact',{index:s.index,handIndex:s.handIndex,target:s.target.id});api.impact?.(s.target,s.handIndex);}else if(fraction===1){cancel('NO SURFACE IMPACT');return;}
  }
  if(shots.length&&shots.every(s=>s.status==='attached')&&last==='deploying'){if(tensionAt===null){tensionAt=clock;emit('tension-start');}if(clock-tensionAt>=.18-1e-8){last='attached';emit('tension');api.complete(shots.map(s=>s.target),shots[0].autoCatch);}}
 }
 return{start,update,cancel,state:()=>JSON.parse(JSON.stringify({clock,status:last,tensionAt,tensionProgress:tensionAt===null?0:Math.min(1,(clock-tensionAt)/.18),shots,events}))};
}
root.createCartridgeDeployment=createCartridgeDeployment;if(typeof module!=='undefined')module.exports=createCartridgeDeployment;
})(typeof window!=='undefined'?window:globalThis);
