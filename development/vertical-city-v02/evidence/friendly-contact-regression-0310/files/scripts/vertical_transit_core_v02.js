/* Deterministic V02 rail motion. THREE r128 is injected in Node and the browser.
 * Distances are metres, times seconds; geometry and doors share this clock. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory;else root.createV02Transit=factory;})(typeof globalThis!=='undefined'?globalThis:this,function(THREE,definition){
 'use strict';
 const cfg={maxSpeed:16,acceleration:1.2,braking:1.7,lateralAcceleration:2.5,opening:.8,dwell:8,closing:.8,...definition.motion};
 const route=definition.route,curve=new THREE.CatmullRomCurve3(route.points.map(p=>new THREE.Vector3(...p)),true,route.curveType||'centripetal');
 curve.arcLengthDivisions=route.arcLengthDivisions||32768;curve.updateArcLengths();const length=curve.getLength();
 const mod=d=>((d%length)+length)%length;
 const pose=distance=>{const u=mod(distance)/length;return{position:curve.getPointAt(u),tangent:curve.getTangentAt(u)};};
 // Curvature is measured on the actual runtime curve, not its control polygon.
 const count=Math.ceil(length/.5),stride=length/count,speeds=new Float64Array(count);
 for(let i=0;i<count;i++){const a=pose(i*stride-.4).tangent,b=pose(i*stride+.4).tangent;
  const curvature=Math.acos(THREE.MathUtils.clamp(a.dot(b),-1,1))/.8;
  speeds[i]=Math.min(cfg.maxSpeed,Math.sqrt(cfg.lateralAcceleration/Math.max(curvature,1e-8)));}
 // Backward braking envelope closes over the wrap seam. Four passes exceed the
 // longest possible braking-distance propagation around this route.
 for(let pass=0;pass<4;pass++)for(let i=count-1;i>=0;i--)speeds[i]=Math.min(speeds[i],Math.sqrt(speeds[(i+1)%count]**2+2*cfg.braking*stride));
 const limitAt=d=>Math.min(speeds[Math.floor(mod(d)/stride)%count],speeds[(Math.floor(mod(d)/stride)+1)%count]);
 const target=new THREE.Vector3(...definition.station.frontPosition);let stationDistance=0,best=Infinity;
 for(let i=0;i<count;i++){const distance=pose(i*stride).position.distanceToSquared(target);if(distance<best){best=distance;stationDistance=i*stride;}}
 let lo=stationDistance-stride,hi=stationDistance+stride;
 for(let i=0;i<42;i++){const a=(2*lo+hi)/3,b=(lo+2*hi)/3;if(pose(a).position.distanceToSquared(target)<pose(b).position.distanceToSquared(target))hi=b;else lo=a;}
 stationDistance=mod((lo+hi)/2);
 if(pose(stationDistance).position.distanceTo(target)>.02)throw Error('Station is not on the runtime track');
 let distance=stationDistance-(definition.initialApproachMetres??80),nextStop=stationDistance,speed=0,clock=0,phase='approach',phaseTime=0,door=0,eventID=0,arrivals=0;
 const events=[];
 function event(type){events.push({id:++eventID,type,clock,distance,speed,phase});if(events.length>128)events.shift();}
 function transition(to){phase=to;phaseTime=0;event(to);}
 function advance(dt,active=true){
  if(!active||!Number.isFinite(dt)||dt<=0)return;
  // Do not discard simulation time on slow frames or make wall-clock timers.
  let remaining=dt;
  while(remaining>1e-9){let h=Math.min(1/120,remaining);
   if(phase!=='approach'){const duration=phase==='opening'?cfg.opening:phase==='dwell'?cfg.dwell:cfg.closing;h=Math.min(h,Math.max(1e-10,duration-phaseTime));}
   remaining-=h;clock+=h;
   if(phase==='approach'){
    const gap=Math.max(0,nextStop-distance),stopLimit=Math.max(0,Math.sqrt(2*cfg.braking*gap)-cfg.braking*h),desired=Math.min(limitAt(distance),stopLimit);
    const old=speed;speed=desired>speed?Math.min(desired,speed+cfg.acceleration*h):Math.max(desired,speed-cfg.braking*h);
    let travel=(old+speed)*.5*h;
    if(travel>=gap||gap<.0001&&speed<.03){distance=nextStop;speed=0;arrivals++;transition('opening');}
    else distance+=travel;
   }else{
    phaseTime+=h;
    if(phase==='opening'){door=Math.min(1,phaseTime/cfg.opening);if(phaseTime+1e-9>=cfg.opening){door=1;transition('dwell');}}
    else if(phase==='dwell'){door=1;if(phaseTime+1e-9>=cfg.dwell)transition('closing');}
    else if(phase==='closing'){door=Math.max(0,1-phaseTime/cfg.closing);if(phaseTime+1e-9>=cfg.closing){door=0;nextStop+=length;transition('approach');}}
   }
  }
 }
 function state(){return{clock,distance,routeDistance:mod(distance),speed,phase,phaseTime,door,arrivals,nextStop,stationDistance,routeLength:length,speedLimit:limitAt(distance),events:events.map(e=>({...e})),config:{...cfg}};}
 return{advance,state,pose,limitAt,curve,length,spacing:route.spacing,definition};
});
