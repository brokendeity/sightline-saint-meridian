/* Equipment camera policy. Returns a composition; the shared director owns the camera. */
(function(root){'use strict';
 const cp=p=>({x:p.x,y:p.y,z:p.z}),finite=p=>p&&[p.x,p.y,p.z].every(Number.isFinite),clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 const delta=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
 function create(){
  let clock=0,manualUntil=0,releaseUntil=0,releaseMode=null,mode='exploration',yaw=0,pitch=0,focus=null,last=null;
  function reset(){manualUntil=releaseUntil=0;releaseMode=null;mode='exploration';focus=last=null;}
  function noteLook(){manualUntil=clock+.9;}
  function release(kind){releaseMode=kind;releaseUntil=clock+(kind==='slingshot'?1.05:.55);}
  function update(dt,f){
   if(!Number.isFinite(dt)||dt<0||dt>.1)throw Error('Camera requires a bounded step');
   if(!f||!finite(f.position)||!finite(f.velocity)||!Number.isFinite(f.yaw)||!Number.isFinite(f.pitch)||f.hero!=='backspool'||!f.active){reset();return null;}
   clock+=dt;if(f.manualLook)noteLook();
   const speed=Math.hypot(f.velocity.x,f.velocity.y,f.velocity.z),horizontal=Math.hypot(f.velocity.x,f.velocity.z);
   const next=!f.precision&&!f.grounded&&(f.rail?'rail':clock<releaseUntil?releaseMode:null);
   if(!next){mode='exploration';focus=last=null;return null;}
   if(!focus){focus={x:f.position.x,y:f.position.y+1.15,z:f.position.z};yaw=f.yaw;pitch=clamp(f.pitch,-.55,.45);}
   mode=next;
   if(clock<manualUntil){yaw=f.yaw;pitch=clamp(f.pitch,-.55,.45);}
   else if(horizontal>1){
    const heading=Math.atan2(-f.velocity.x,-f.velocity.z),rate=f.reducedMotion?.85:mode==='rail'?1.8:1.25;
    yaw+=clamp(delta(yaw,heading),-rate*dt,rate*dt);pitch+=( -.08-pitch)*(1-Math.exp(-3*dt));
   }
   const lead=f.reducedMotion?.45:Math.min(mode==='rail'?2.8:2,horizontal*.085);
   const desired={x:f.position.x+(horizontal>.01?f.velocity.x/horizontal*lead:0),y:f.position.y+1.15+clamp(f.velocity.y*.018,-.18,.25),z:f.position.z+(horizontal>.01?f.velocity.z/horizontal*lead:0)};
   const blend=1-Math.exp(-(f.reducedMotion?9:14)*dt);for(const k of['x','y','z'])focus[k]+=(desired[k]-focus[k])*blend;
   const distance=(mode==='rail'?6.7:6.2)+(f.aspect<.8?1.8:0),height=mode==='rail'?.8:.6,shoulder=f.reducedMotion?0:.28;
   const view={x:-Math.sin(yaw)*Math.cos(pitch),y:Math.sin(pitch),z:-Math.cos(yaw)*Math.cos(pitch)};
   const position={x:focus.x-view.x*distance+Math.cos(yaw)*shoulder,y:focus.y-view.y*distance+height,z:focus.z-view.z*distance-Math.sin(yaw)*shoulder};
   const fov=f.reducedMotion?60:clamp(60+speed*.27+(mode==='slingshot'?2:0),60,71);
   last={owner:'threadrail',inputYaw:yaw,inputPitch:pitch,mode,position,focus:cp(focus),origin:{x:f.position.x,y:f.position.y+1.15,z:f.position.z},fov,followRate:f.reducedMotion?10:mode==='rail'?19:15};
   return JSON.parse(JSON.stringify(last));
  }
  return{update,noteLook,release,reset,state:()=>({mode,clock,manualRemaining:Math.max(0,manualUntil-clock),releaseRemaining:Math.max(0,releaseUntil-clock),yaw,pitch,composition:last?JSON.parse(JSON.stringify(last)):null})};
 }
 root.createThreadrailCamera=create;if(typeof module!=='undefined')module.exports={create};
})(typeof window!=='undefined'?window:globalThis);
