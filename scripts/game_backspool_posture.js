/* Authored posture policy; source motion names and original game behavior remain unverified. */
(function(root){
 function create(api){let crouched=false,reason=null,settle=0;function stand(){if(!crouched)return true;if(!api.canStand()){reason='LOW CEILING · MOVE TO CLEAR SPACE';return false;}crouched=false;settle=0;reason=null;return true;}return {toggle(eligible){if(crouched)return stand();if(!eligible)return false;crouched=true;settle=.16;reason=null;return true;},stand,update(dt){settle=Math.max(0,settle-dt);},reset(){return stand();},state:()=>({crouched,reason,settle,height:crouched&&settle<=0?1.58:1.72})};}
 root.createBackspoolPosture=create;if(typeof module!=='undefined')module.exports={create};
})(typeof window!=='undefined'?window:globalThis);
