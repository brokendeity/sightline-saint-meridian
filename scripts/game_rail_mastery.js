/* Authored, meter-based rail mastery. Grades never bypass physical validation. */
(function(root){
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const length=v=>Math.hypot(v.x,v.y,v.z),dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
 const unit=v=>{const n=length(v)||1;return{x:v.x/n,y:v.y/n,z:v.z/n}};
 function createRailMastery(){
  const records=new Map(),events=[];let serial=0,style=0,lastCatch=null,lastPop=null;
  const emit=(type,data)=>{events.push({...data,id:++serial,type});if(events.length>64)events.shift()};
  const grade=score=>score>=.9?'PERFECT':score>=.75?'CLEAN':score>=.5?'STABLE':'ROUGH';
  function register(rail,a,b){const d={x:b.position.x-a.position.x,y:b.position.y-a.position.y,z:b.position.z-a.position.z},span=length(d),horizontal=Math.hypot(d.x,d.z),slope=Math.atan2(Math.abs(d.y),horizontal)*180/Math.PI;
   const ground=a.normal.y>.5||b.normal.y>.5,same=a.ownerId===b.ownerId;
   const family=slope>40?'Vertical Climb':ground&&Math.abs(d.y)>1?'Ground-Ramp':same?'Same-Wall':dot(a.normal,b.normal)<-.5?'Cross-Street':d.y< -1?'Drop Rail':'Cross-Street';
   const score=clamp(.6+.25*(1-Math.abs(span-35)/65)+.15*(1-slope/55),0,1),record={id:rail.id,family,construction:grade(score),score,span,slope};records.set(rail.id,record);emit('construction',record);return record;
  }
  function catchRail(id,velocity,tangent,distance){const speed=length(velocity),alignment=speed>.1?Math.abs(dot(unit(velocity),unit(tangent))):.5,score=clamp(alignment*.75+(1-clamp(distance/2,0,1))*.25,0,1);lastCatch={railId:id,grade:grade(score),score};style+=Math.round(score*30);emit('catch',lastCatch);return lastCatch;}
  function pop(current,rail){const remaining=(current.signedSpeed<0?current.distance:rail.length-current.distance),speed=Math.abs(current.signedSpeed),seconds=remaining/Math.max(speed,.1);const label=speed<1?'DEAD':seconds>.35?'EARLY':seconds>.16?'TIGHT':seconds>=.04?'PERFECT':'LATE';lastPop={railId:rail.id,grade:label,seconds,retention:label==='PERFECT'?1:label==='TIGHT'?.98:label==='DEAD'?.8:.94};style+=label==='PERFECT'?50:label==='TIGHT'?25:5;emit('pop',lastPop);return lastPop;}
  function scoreCandidate({distance,intent,velocity,tangent,height,quality=0.5}){const t=unit(tangent),v=unit(velocity),i=unit(intent);return 3*Math.abs(dot(i,t))+Math.abs(dot(v,t))+quality*.4-distance*.8-Math.abs(height)*.15;}
  return{register,catchRail,pop,scoreCandidate,state:()=>({rails:[...records.values()],lastCatch,lastPop,style,events:events.slice()}),reset:()=>{records.clear();lastCatch=lastPop=null;style=0;events.length=0}};
 }
 root.createRailMastery=createRailMastery;if(typeof module!=='undefined')module.exports=createRailMastery;
})(typeof window!=='undefined'?window:globalThis);
