/* Recovered scalar primitives, not a complete Luminous controller or IK solver.
 * Evidence: 143eade60 / 143468370 / 143eac910 / 143eac980 / 143f35bc0.
 * Adapter inputs and target contact selection must be established separately.
 */
(function(root){
 'use strict';
 const f=Math.fround,add=(a,b)=>f(f(a)+f(b)),sub=(a,b)=>f(f(a)-f(b)),mul=(a,b)=>f(f(a)*f(b)),div=(a,b)=>f(f(a)/f(b));
 const finite=(...xs)=>{if(!xs.every(Number.isFinite))throw Error('Non-finite native kernel input');};
 function createHipBlend(initial=1){
  finite(initial);let current=f(initial),start=current,target=current,duration=0,elapsed=0,manualDisabled=false;
  const effective=()=>duration<=0?target:current;
  function transition(value,seconds){finite(value,seconds);current=start=effective();target=f(value);duration=f(seconds);elapsed=0;}
  return {
   explicit(enabled,seconds=.25){manualDisabled=!enabled;transition(enabled?1:0,seconds);},
   automaticEnable(seconds=.25){if(manualDisabled)return false;transition(1,seconds);return true;},
   automaticDisable(seconds=.25){transition(0,seconds);},
   update(dt,frozen=false){finite(dt);if(dt<0||dt>.1)throw Error('Native blend requires bounded simulation steps');dt=f(dt);
    if(!frozen&&duration>0){let value=target;if(elapsed<duration){elapsed=add(elapsed,dt);if(elapsed<=duration)value=add(mul(div(sub(target,start),duration),elapsed),start);}current=value;}
    return effective();
   },
   value:effective,
   state:()=>({current,start,target,duration,elapsed,manualDisabled})
  };
 }
 function spring(position,velocity,target,stiffness,damping,dt){
  finite(position,velocity,target,stiffness,damping,dt);
  if(dt<0||dt>.1)throw Error('Native spring requires bounded simulation steps');
  position=f(position);velocity=f(velocity);target=f(target);stiffness=f(stiffness);damping=f(damping);dt=f(dt);
  let elapsed=0,steps=0;const step=Math.min(dt,f(.01));
  if(dt>0)do{elapsed=add(elapsed,step);velocity=add(mul(sub(mul(sub(target,position),stiffness),mul(velocity,damping)),step),velocity);position=add(mul(velocity,step),position);steps++;}while(elapsed<dt);
  return {position,velocity,elapsed,steps};
 }
 function buttonCondition(kind,input){
  // Names recovered from the original ID dictionary; edge/hold sampling is supplied by the adapter.
  for(const k of ['pressed','released','held'])if(typeof input[k]!=='boolean')throw Error('Incomplete original input sample');
  if(kind===0x01079170)return input.pressed;
  if(kind===0x01079171)return input.released;
  if(kind===0x010791a7)return input.held;
  if(kind===0x010819a9)return !input.held;
  throw Error('Unresolved original button condition '+kind.toString(16));
 }
 function timedButtonCondition(condition,input){
  // The provider supplies native record fields, not guessed physical bindings.
  // 144648fe0: flags+13 bit 1 / time+8; 1446486b0: bit 2 / time+4;
  // 1446490a0: time+0 strictly > minimum, <= maximum; blocked+12 gates all.
  const lo=f(condition.holdMin),hi=f(condition.holdMax),kind=condition.controlKind;
  finite(lo,hi);if(lo>hi)throw Error('Invalid original input interval');
  if(![0x1079170,0x1079171,0x10791a7,0x10819a9].includes(kind))throw Error('Unresolved original timed condition');
  const present=!!input?.present&&!input.blocked;
  if(present){finite(input.heldTime,input.pressedTime,input.releasedTime);if(!Number.isInteger(input.flags))throw Error('Incomplete original input flags');}
  if(kind===0x1079170)return present&&!!(input.flags&2)&&lo<=f(input.pressedTime)&&f(input.pressedTime)<=hi;
  if(kind===0x1079171)return present&&!!(input.flags&4)&&lo<=f(input.releasedTime)&&f(input.releasedTime)<=hi;
  const held=present&&lo<f(input.heldTime)&&f(input.heldTime)<=hi;
  return kind===0x10819a9?!held:held;
 }
 function buttonSlots(conditions,provider){
  // Base 142c2e780 OR loop only. Engine overrides and terrain gates are external.
  if(conditions.length!==3||typeof provider!=='function')throw Error('Three original condition slots required');
  let any=false;
  for(const condition of conditions){if(!condition.inputId)continue;any=true;if(timedButtonCondition(condition,provider(condition.inputId)))return true;}
  return !any;
 }
 const api=Object.freeze({createHipBlend,spring,buttonCondition,timedButtonCondition,buttonSlots,originalControllerComplete:false,originalIKComplete:false});
 root.ForspokenNativeKernels=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
