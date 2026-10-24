/* Authored posture layer over recovered slide 0x2811926e; not original Glide or IK. */
(function(root){
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 function createRailSurfPose(){
  let id=null,age=0,speed=0,lean=0,crouch=0,compression=0,phase='off',previousYaw=null;
  function reset(){id=null;age=0;speed=lean=crouch=compression=0;phase='off';previousYaw=null;}
  function update(dt,f){if(!Number.isFinite(dt)||dt<0)return state();if(!f.active){reset();return state();}dt=Math.min(dt,.05);if(f.railId!==id){id=f.railId;age=0;previousYaw=f.yaw;}age+=dt;
   const v=clamp(f.speed||0,0,28),acceleration=(v-speed)/Math.max(dt,1/120);speed=v;const turn=previousYaw===null?0:Math.atan2(Math.sin(f.yaw-previousYaw),Math.cos(f.yaw-previousYaw))/Math.max(dt,1/120);previousYaw=f.yaw;
   const alpha=1-Math.exp(-10*dt),targetLean=clamp((f.lateral||0)*.1-turn*.055,-.16,.16),targetCrouch=clamp((v-8)/20,0,1);
   lean+=(targetLean-lean)*alpha;crouch+=(targetCrouch-crouch)*alpha;compression=Math.max(0,1-age/.24);
   phase=age<.24?'catch':f.braking?'brake':v>20?'crouch':acceleration>2?'accelerate':'cruise';return state();
  }
  function state(){return{active:id!==null,railId:id,phase,age,speed,lean,crouch,compression,source:'0x2811926e',provenance:'authored slide-derived posture',offsets:{spinePitch:phase==='brake'?-.07:.12*crouch,spineRoll:lean,knee:.055*compression+.035*crouch,armBalance:.06+Math.abs(lean)*.3}};}
  return{update,reset,state};
 }
 root.createRailSurfPose=createRailSurfPose;if(typeof module!=='undefined')module.exports=createRailSurfPose;
})(typeof window!=='undefined'?window:globalThis);
