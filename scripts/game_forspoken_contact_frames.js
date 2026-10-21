/* Static recovery: 143f368a0 -> AnimationRaycastImpl::14346e0e0,
 * snapshot 14346e940, normal rejection 143f36320. This is the query-frame
 * bridge, not the biped solver, its probe selection or a browser axis mapping.
 * Native pointers/refcounts are represented by backend results, never executed.
 */
(function(root){
 'use strict';
 const f=Math.fround,add=(a,b)=>f(f(a)+f(b)),sub=(a,b)=>f(f(a)-f(b)),mul=(a,b)=>f(f(a)*f(b)),div=(a,b)=>f(f(a)/f(b));
 function vector(v,n){if(!v||v.length!==n||!Array.from(v).every(Number.isFinite))throw Error('Invalid native contact vector');return Array.from(v,f);}
 function rotate(q,v){
  const [qx,qy,qz,qw]=q,[x,y,z]=v;
  const i=sub(add(mul(z,qy),mul(qw,x)),mul(y,qz));
  const j=sub(add(mul(x,qz),mul(qw,y)),mul(z,qx));
  const k=sub(add(mul(y,qx),mul(qw,z)),mul(x,qy));
  const s=add(add(mul(y,qy),mul(x,qx)),mul(z,qz));
  return [sub(add(add(mul(s,qx),mul(i,qw)),mul(k,qy)),mul(j,qz)),
          sub(add(add(mul(s,qy),mul(j,qw)),mul(i,qz)),mul(k,qx)),
          sub(add(add(mul(s,qz),mul(k,qw)),mul(j,qx)),mul(i,qy))];
 }
 function capture(solver,actor){
  const sq=vector(solver.rotation,4),si=vector(solver.inverseRotation,4),aq=vector(actor.rotation,4),origin=vector(actor.translation,4);
  if(!Number.isFinite(solver.scale)||!Number.isFinite(solver.actorScale))throw Error('Invalid native contact scale');
  const scale=mul(solver.scale,solver.actorScale),ai=[f(-aq[0]),f(-aq[1]),f(-aq[2]),aq[3]];
  // Host rejection avoids undefined divisions; native callers supply usable scale.
  if(!Number.isFinite(scale)||scale===0)throw Error('Degenerate native contact scale');
  const pointToWorld=v=>{
   const local=rotate(sq,vector(v,3)).map(n=>mul(scale,n)),world=rotate(aq,local);
   return [add(world[0],origin[0]),add(world[1],origin[1]),add(world[2],origin[2]),add(mul(scale,0),origin[3])];
  };
  function query(start,end,category,filters){
   if(!Number.isInteger(category)||!Object.hasOwn(filters,category)||!Number.isInteger(filters[category]))throw Error('Unresolved native collision filter');
   const a=pointToWorld(start),b=pointToWorld(end),delta=b.slice(0,3).map((n,i)=>sub(n,a[i]));
   const length=f(Math.sqrt(add(add(mul(delta[0],delta[0]),mul(delta[1],delta[1])),mul(delta[2],delta[2]))));
   if(!a.concat(b,delta,length).every(Number.isFinite)||length===0)return {valid:false,reason:'INVALID_NATIVE_SEGMENT'};
   const direction=delta.map(n=>div(n,length));
   if(!direction.every(Number.isFinite))return {valid:false,reason:'INVALID_NATIVE_SEGMENT'};
   return {valid:true,start:a,end:b,direction,length,category,collisionFilter:filters[category]>>>0};
  }
  function resolve(hit,category){
   if(!hit?.found)return {found:false,reason:'NO_HIT'};
   if(category===0||category===3){
    // Raw native ownership/flag contract; the flag's semantic name is unrecovered.
    if(typeof hit.ownerAResolved!=='boolean'||typeof hit.ownerBResolved!=='boolean'||!Number.isInteger(hit.ownerBByte4b))return {found:false,reason:'MISSING_NATIVE_HIT_METADATA'};
    if(!hit.ownerAResolved||!hit.ownerBResolved||(hit.ownerBByte4b&1))return {found:false,reason:'NATIVE_HIT_FILTER'};
   }
   const worldPoint=vector(hit.point,3),worldNormal=vector(hit.normal,3);
   const actorPoint=rotate(ai,worldPoint.map((n,i)=>sub(n,origin[i]))),actorNormal=rotate(ai,worldNormal);
   const point=rotate(si,actorPoint).map(n=>div(n,scale)),normal=rotate(si,actorNormal);
   // Sync result forces world point/normal w=1. Only the point is scale-divided.
   return {found:true,point:[...point,div(sub(1,origin[3]),scale)],normal:[...normal,1],
           worldPoint:[...worldPoint,1],worldNormal:[...worldNormal,1],
           actorPoint:[...actorPoint,sub(1,origin[3])],actorNormal:[...actorNormal,1]};
  }
  return Object.freeze({query,resolve,pointToWorld,state:()=>({solverRotation:sq.slice(),solverInverse:si.slice(),scale,actorRotation:aq.slice(),actorTranslation:origin.slice(),snapshot:true})});
 }
 function rejectBelowSolverPlane(result){
  // 143f36320 rejects normal.z < 0; do not substitute browser-world normal.y.
  if(!result.found||result.normal[2]<0)return {...result,found:false,reason:result.found?'NATIVE_SOLVER_NORMAL':result.reason};
  return result;
 }
 const api=Object.freeze({capture,rejectBelowSolverPlane,originalIKComplete:false});
 root.ForspokenContactFrames=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
