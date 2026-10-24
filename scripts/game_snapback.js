/* Authored bounded spatial-tension mechanic, distinct from replay and rail ownership. */
(function(root){
 const finite=p=>p&&['x','y','z'].every(k=>Number.isFinite(p[k]));
 const copy=p=>({x:p.x,y:p.y,z:p.z});
 function createSnapback(api){
  let bank=null,clock=0,serial=0,events=[],reason='READY';
  const emit=(type,data={})=>{events.push({...data,id:++serial,time:clock,type});events=events.slice(-32)};
  function cancel(why='CANCELLED'){if(bank)emit('cancel',{reason:why});bank=null;reason=why;}
  function set(frame){if(!frame.ready||!finite(frame.position))return{ok:false,reason:'MOVEMENT COMMITTED'};if(bank)return{ok:false,reason:'ALREADY BANKED'};bank={position:copy(frame.position),time:clock,maxReach:28,lifetime:8};reason='BANKED';emit('bank',{position:bank.position});return{ok:true,reason};}
  function info(frame){const distance=bank&&finite(frame.position)?Math.hypot(frame.position.x-bank.position.x,frame.position.y-bank.position.y,frame.position.z-bank.position.z):0;return{distance,tension:bank?distance/bank.maxReach:0,remaining:bank?Math.max(0,bank.lifetime-clock+bank.time):0};}
  function update(dt,frame){if(!Number.isFinite(dt)||dt<=0||frame.paused)return;if(!frame.active){cancel('HERO INACTIVE');return;}clock+=Math.min(dt,.1);if(!bank)return;const i=info(frame);if(i.remaining<=0)cancel('EXPIRED');else if(i.distance>bank.maxReach)cancel('FORCED BREAK · REACH');else if(!api.clear(frame.position,bank.position))cancel('TETHER OBSTRUCTED');}
  function release(frame){if(!bank)return{ok:false,reason:'NO SPATIAL BANK'};if(!frame.ready)return{ok:false,reason:'MOVEMENT COMMITTED'};const i=info(frame);if(i.distance<2)return{ok:false,reason:'BUILD TENSION · MOVE 2m'};if(i.distance>bank.maxReach||i.remaining<=0){cancel('FORCED BREAK');return{ok:false,reason};}
   if(!api.clear(frame.position,bank.position)){cancel('TETHER OBSTRUCTED');return{ok:false,reason};}
   const direction={x:(bank.position.x-frame.position.x)/i.distance,y:(bank.position.y-frame.position.y)/i.distance,z:(bank.position.z-frame.position.z)/i.distance};
   const grade=i.tension>=.86&&i.tension<=.96?'CLEAN':i.tension>.96?'REDLINE':'DIRTY';
   const result=api.release(direction,grade);if(!result?.ok){reason=result?.reason||'RELEASE REJECTED';emit('rejected',{reason});return{ok:false,reason};}
   emit('release',{grade,tension:i.tension,direction,spent:result.spent||[]});bank=null;reason=grade+' SNAPBACK';return{ok:true,reason,grade};
  }
  return{bank:set,update,release,cancel,state:frame=>({bank:bank?{...bank,position:copy(bank.position)}:null,clock,reason,...info(frame||{}),events:JSON.parse(JSON.stringify(events))})};
 }
 root.createSnapback=createSnapback;if(typeof module!=='undefined')module.exports=createSnapback;
})(typeof window!=='undefined'?window:globalThis);
