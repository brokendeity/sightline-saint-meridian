/* Deterministic scenic lane flow; this is not vehicle combat or traffic AI. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory;else root.createV02AirTraffic=factory;})(typeof globalThis!=='undefined'?globalThis:this,function(THREE,definition){
 'use strict';
 const settings={acceleration:.9,braking:1.6,lateralAcceleration:2,minimumGap:10,timeGap:1.6,maxBank:12*Math.PI/180,...definition.settings};
 const up=new THREE.Vector3(0,1,0),forward=new THREE.Vector3(0,0,1),lanes=[];let clock=0,emergencyBrakes=0;
 for(const data of definition.lanes){
  const curve=new THREE.CatmullRomCurve3(data.points.map(p=>new THREE.Vector3(...p)),true,'centripetal');curve.arcLengthDivisions=32768;curve.updateArcLengths();const length=curve.getLength(),n=Math.ceil(length/.5),stride=length/n,limits=new Float64Array(n),curvatures=new Float64Array(n),mod=d=>((d%length)+length)%length;
  for(let i=0;i<n;i++){const a=curve.getTangentAt(mod(i*stride-.4)/length),b=curve.getTangentAt(mod(i*stride+.4)/length),angle=Math.atan2(a.z*b.x-a.x*b.z,a.dot(b));curvatures[i]=angle/.8;limits[i]=Math.min(data.speed,Math.sqrt(settings.lateralAcceleration/Math.max(1e-8,Math.abs(curvatures[i]))));}
  for(let pass=0;pass<4;pass++)for(let i=n-1;i>=0;i--)limits[i]=Math.min(limits[i],Math.sqrt(limits[(i+1)%n]**2+2*settings.braking*stride));
  const sample=d=>{const index=Math.floor(mod(d)/stride)%n;return{speed:Math.min(limits[index],limits[(index+1)%n]),curvature:curvatures[index]};};
  const lane={id:data.id,curve,length,mod,sample,agents:[]};
  for(let i=0;i<data.count;i++){const distance=i*length/data.count,preferred=data.speed*(.9+(i%5)*.025);lane.agents.push({id:data.id+'-'+i,variant:(i+data.variantOffset)%3,distance,speed:Math.min(preferred,sample(distance).speed),preferred,bank:0,laps:0});}
  lanes.push(lane);
 }
 function advance(dt,active=true){if(!active||!Number.isFinite(dt)||dt<=0)return;let remaining=dt;
  while(remaining>1e-9){const h=Math.min(1/60,remaining);remaining-=h;clock+=h;
   for(const lane of lanes){const updates=lane.agents.map((a,i)=>{const lead=lane.agents[(i+1)%lane.agents.length],gap=lane.mod(lead.distance-a.distance),headway=settings.minimumGap+a.speed*settings.timeGap;let target=Math.min(a.preferred,lane.sample(a.distance).speed);
     if(gap<headway+5)target=Math.min(target,Math.max(0,lead.speed+.6*(gap-headway)));
     const speed=target>a.speed?Math.min(target,a.speed+settings.acceleration*h):Math.max(target,a.speed-settings.braking*h);let travel=(a.speed+speed)*h/2;
     if(travel>gap-settings.minimumGap){travel=Math.max(0,gap-settings.minimumGap);emergencyBrakes++;}
     return{speed,travel};});
    lane.agents.forEach((a,i)=>{a.speed=updates[i].speed;a.distance+=updates[i].travel;a.laps=Math.floor(a.distance/lane.length);const target=THREE.MathUtils.clamp(-Math.atan(a.speed*a.speed*lane.sample(a.distance).curvature/9.81),-settings.maxBank,settings.maxBank);a.bank+=(target-a.bank)*(1-Math.exp(-5*h));});
   }
  }
 }
 function pose(lane,a){const u=lane.mod(a.distance)/lane.length,position=lane.curve.getPointAt(u),tangent=lane.curve.getTangentAt(u),yaw=Math.atan2(tangent.x,tangent.z),quaternion=new THREE.Quaternion().setFromAxisAngle(up,yaw).multiply(new THREE.Quaternion().setFromAxisAngle(forward,a.bank));return{position,tangent,quaternion};}
 function state(){return{clock,emergencyBrakes,settings:{...settings},lanes:lanes.map(l=>({id:l.id,length:l.length,agents:l.agents.map((a,i)=>{const p=pose(l,a);return{...a,position:p.position.toArray(),quaternion:p.quaternion.toArray(),gapAhead:l.mod(l.agents[(i+1)%l.agents.length].distance-a.distance)};})}))};}
 return{advance,state,lanes,pose,settings};
});
