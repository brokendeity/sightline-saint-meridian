/* Authored cartridge timeline; recovered motion does not supply original release events. */
(function(root){'use strict';
function createCartridgeDeployment(api={}){
 let clock=0,serial=0,shots=[],events=[],last=null,tensionAt=null;
 const emit=(type,data={})=>{events.push({id:++serial,time:clock,type,...data});events=events.slice(-64)};
 const finite=p=>p&&['x','y','z'].every(k=>Number.isFinite(p[k]));
 function cancel(reason='CANCEL'){shots=[];tensionAt=null;last=reason;emit('cancel',{reason})}
 function start(targets,autoCatch=false){if(shots.some(s=>s.status!=='attached'))return false;if(!targets.length||targets.length>2||targets.some(t=>!finite(t.contact)||!api.valid(t)))return false;
  shots=targets.map((target,i)=>({target,index:i,status:'gesture',releaseAt:clock+.16+i*.28,position:null,age:0}));tensionAt=null;last='deploying';emit('begin',{count:shots.length,autoCatch});shots.forEach(s=>s.autoCatch=autoCatch);return true;}
 function update(dt){if(!Number.isFinite(dt)||dt<=0)return;clock+=Math.min(dt,.05);
  for(const s of shots){if(s.status==='attached')continue;if(!api.valid(s.target)){cancel('SURFACE CHANGED');return;}
   if(s.status==='gesture'){if(clock<s.releaseAt)continue;const hand=api.hand(s.index);if(!finite(hand)){cancel('HAND UNAVAILABLE');return;}s.position={...hand};s.status='flight';emit('release',{index:s.index,position:s.position});}
   s.age+=dt;if(s.age>3){cancel('PROJECTILE EXPIRED');return;}
   const delta={x:s.target.contact.x-s.position.x,y:s.target.contact.y-s.position.y,z:s.target.contact.z-s.position.z},distance=Math.hypot(delta.x,delta.y,delta.z),fraction=Math.min(1,42*dt/Math.max(distance,1e-6)),to={x:s.position.x+delta.x*fraction,y:s.position.y+delta.y*fraction,z:s.position.z+delta.z*fraction};
   const hit=api.sweep(s.position,to,s.target);
   if(hit?.blocked){cancel('CARTRIDGE BLOCKED');return;}
   s.position=to;if(hit?.target){s.status='attached';s.position={...s.target.contact};emit('impact',{index:s.index,target:s.target.id});api.impact?.(s.target,s.index);}
   else if(fraction===1){cancel('NO SURFACE IMPACT');return;}
  }
  if(shots.length&&shots.every(s=>s.status==='attached')&&last==='deploying'){if(tensionAt===null){tensionAt=clock;emit('tension-start');}if(clock-tensionAt>=.18){last='attached';emit('tension');api.complete(shots.map(s=>s.target),shots[0].autoCatch);}}
 }
 return{start,update,cancel,state:()=>JSON.parse(JSON.stringify({clock,status:last,tensionAt,tensionProgress:tensionAt===null?0:Math.min(1,(clock-tensionAt)/.18),shots,events}))};
}
root.createCartridgeDeployment=createCartridgeDeployment;if(typeof module!=='undefined')module.exports=createCartridgeDeployment;
})(typeof window!=='undefined'?window:globalThis);
