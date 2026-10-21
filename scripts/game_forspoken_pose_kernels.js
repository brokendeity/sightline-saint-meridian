/* Recovered pose packet143f32cb0 and writeback143f34d30. These operate on
 * model-space pose arrays, NEVER directly on Three.js local bone positions.
 * Probe offsets, frame rotations and corrections must come from a proven caller.
 * Host API copies its inputs; native writeback mutates its pose buffers in place.
 */
(function(root){
 'use strict';
 const f=Math.fround,add=(a,b)=>f(f(a)+f(b)),sub=(a,b)=>f(f(a)-f(b)),mul=(a,b)=>f(f(a)*f(b)),div=(a,b)=>f(f(a)/f(b));
 function v4(v){if(!v||v.length!==4||!Array.from(v).every(Number.isFinite))throw Error('Invalid native pose vector');const r=Array.from(v,f);if(!r.every(Number.isFinite))throw Error('Native pose float32 overflow');return r;}
 const sum=(a,b)=>a.map((n,i)=>add(n,b[i]));
 function rotate(q,v){
  const [x,y,z,w]=q,[a,b,c]=v;
  const i=sub(add(mul(c,y),mul(w,a)),mul(b,z)),j=sub(add(mul(a,z),mul(w,b)),mul(c,x)),k=sub(add(mul(b,x),mul(w,c)),mul(a,y));
  const s=add(add(mul(b,y),mul(a,x)),mul(c,z));
  return [sub(add(add(mul(s,x),mul(i,w)),mul(k,y)),mul(j,z)),sub(add(add(mul(s,y),mul(j,w)),mul(i,z)),mul(k,x)),sub(add(add(mul(s,z),mul(k,w)),mul(j,x)),mul(i,y)),f(v[3])];
 }
 function multiply(a,b){
  const [x,y,z,w]=a,[u,v,t,s]=b;
  return [sub(add(add(mul(s,x),mul(w,u)),mul(t,y)),mul(v,z)),
          sub(add(add(mul(s,y),mul(w,v)),mul(u,z)),mul(t,x)),
          sub(add(add(mul(s,z),mul(w,t)),mul(v,x)),mul(u,y)),
          sub(sub(mul(s,w),mul(t,z)),add(mul(v,y),mul(u,x)))];
 }
 function pose(rotations,positions){
  if(rotations.length!==positions.length||!rotations.length||rotations.length%4||rotations.length>262144)throw Error('Invalid native pose buffers');
  const q=Array.from(rotations,f),p=Array.from(positions,f);
  if(!q.concat(p).every(Number.isFinite))throw Error('Invalid native pose values');
  return {q,p,count:q.length/4};
 }
 function bodyPacket(rotations,positions,binding,frame){
  const data=pose(rotations,positions),slots=Array.from(binding);
  if(slots.length!==9||new Set(slots).size!==9||!slots.every(i=>Number.isInteger(i)&&i>=0&&i<data.count))throw Error('Invalid original biped input binding');
  const inv=v4(frame.inverseRotation),hip=v4(frame.hipOffset),scale=f(frame.scale),actorScale=f(frame.actorScale),total=mul(scale,actorScale);
  if(!Number.isFinite(scale)||!Number.isFinite(total)||scale===0||total===0)throw Error('Invalid native biped scale');
  if(frame.footOffsets.length!==4||frame.bendAxes.length!==2)throw Error('Incomplete native biped probe vectors');
  const offsets=frame.footOffsets.map(v4),axes=frame.bendAxes.map(v4),at=(a,slot)=>a.slice(slots[slot]*4,slots[slot]*4+4),out=Array(13),inverseScale=div(1,total);
  const h=rotate(at(data.q,0),hip.map((n,i)=>i<3?f(-n):n));
  const origin=sum(h,at(data.p,0));origin[3]=sub(at(data.p,0)[3],hip[3]);
  out[0]=rotate(inv,origin).map(n=>mul(n,inverseScale));
  for(const [packet,slot] of [[1,1],[2,5],[3,2],[4,6],[5,3],[6,7]])out[packet]=rotate(inv,at(data.p,slot).map(n=>mul(n,inverseScale)));
  for(let side=0;side<2;side++){
   const footSlot=side?7:3,legSlot=side?6:2,center=out[5+side];
   for(let probe=0;probe<2;probe++){
    const local=offsets[probe*2+side].map(n=>div(n,scale));
    out[7+probe*2+side]=sum(rotate(inv,rotate(at(data.q,footSlot),local)),center);
   }
   out[11+side]=rotate(inv,rotate(at(data.q,legSlot),axes[side]));
  }
  const values=out.flat();if(!values.every(Number.isFinite))throw Error('Native biped packet overflow');
  return new Float32Array(values);
 }
 function writeback(rotations,positions,corrections,selection=null){
  const data=pose(rotations,positions);
  if(corrections.length!==data.count)throw Error('Native correction count differs from pose');
  const deltas=corrections.map(c=>c?{rotation:c.rotation==null?null:v4(c.rotation),translation:c.translation==null?null:v4(c.translation)}:null);
  // Native cutdown indices are signed16, 1-based. Nonpositive entries are skipped;
  // an empty cutdown request follows the ordinary full-pose branch.
  let indices=Array.from({length:data.count},(_,i)=>i);
  if(selection?.length){indices=Array.from(selection);if(!indices.every(i=>Number.isInteger(i)&&i>=-32768&&i<=32767&&(i<=0||i<=data.count)))throw Error('Invalid native cutdown selection');indices=indices.filter(i=>i>0).map(i=>i-1);}
  const apply=(array,i,value)=>{for(let k=0;k<4;k++)array[i*4+k]=value[k];};
  // Match native ordering: every rotation first, then every translation.
  for(const i of indices){const d=deltas[i];if(d?.rotation)apply(data.q,i,multiply(d.rotation,data.q.slice(i*4,i*4+4)));}
  for(const i of indices){const d=deltas[i];if(!d)continue;let p=data.p.slice(i*4,i*4+4);if(d.rotation)p=rotate(d.rotation,p);if(d.translation)p=sum(p,d.translation);apply(data.p,i,p);}
  if(!data.q.concat(data.p).every(Number.isFinite))throw Error('Native pose writeback overflow');
  return {rotations:new Float32Array(data.q),positions:new Float32Array(data.p)};
 }
 const api=Object.freeze({bodyPacket,writeback,originalIKComplete:false});
 root.ForspokenPoseKernels=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
