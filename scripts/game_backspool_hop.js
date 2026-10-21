/* Backspool-authored landing rhythm, not recovered Forspoken state logic. */
(function(root){
 function create(){let clock=0,grounded=true,flight=false,windowUntil=-1,chain=0,carry=0,lastJump=-1,phase='ground',reason=null,eventId=0,cueAt=-1,rushUntil=-1,rushes=0,wasSprint=false;const events=[];
 function event(kind,data={}){events.push({eventId:++eventId,kind,time:clock,...data});if(events.length>32)events.shift();}
 function reset(why='RESET'){if(flight||chain||carry)event('interrupted',{reason:why});flight=false;windowUntil=-1;chain=carry=0;phase='ground';reason=why;cueAt=rushUntil=-1;wasSprint=false;}
 const eligible=f=>f.hero==='backspool'&&f.active&&!f.locked&&!f.retracing&&!f.preview&&!f.defeated&&!f.posture;
 function update(dt,f){if(!Number.isFinite(dt)||dt<0||dt>.1)throw Error('Bounded simulation step required');if(!eligible(f)){reset('INELIGIBLE');grounded=!!f.grounded;return;}clock+=dt;
  if(f.grounded&&f.mag>.3){
   if(f.sprint&&!wasSprint){if(cueAt>=0&&clock>=cueAt&&clock<=cueAt+.25){rushUntil=clock+.5;rushes++;event('rush',{duration:.5});cueAt=clock+1.2;}else if(cueAt<0)cueAt=clock+1;}
   if(cueAt>=0&&clock>cueAt+.25)cueAt=clock+1;
  }else cueAt=-1;
  if(!f.sprint||f.mag<.2)rushUntil=-1;
  if(f.mag<.2)cueAt=-1;
  wasSprint=!!f.sprint;

  if(flight&&f.grounded&&!grounded){flight=false;if(f.hard){reset('HARD LANDING');}else{windowUntil=clock+.55;phase='landing';event('landing-window',{chain});}}
  if(flight)phase=f.vy>1?'rising':f.vy< -1?'falling':'apex';
  if(f.grounded&&clock>windowUntil){phase='ground';chain=0;carry=0;}
  if(!f.sprint||f.mag<.2){chain=carry=0;windowUntil=-1;}
  grounded=!!f.grounded;
 }
 function jump(f){if(!eligible(f)||!f.sprint||f.mag<.3||f.speed<5||!f.grounded)return null;
  const timed=clock<=windowUntil&&windowUntil>=0;chain=timed?chain+1:0;carry=timed?Math.min(22,Math.max(f.speed,carry)+2):Math.min(22,f.speed);flight=true;grounded=false;windowUntil=-1;lastJump=clock;cueAt=rushUntil=-1;phase='rising';reason=null;event(timed?'hop':'sprint-jump',{chain,speed:carry});return {kind:timed?'hop':'sprint-jump',speed:carry,verticalSpeed:9.8,chain};
 }
 return{update,jump,reset,state:()=>({clock,phase,ownsAir:flight,chain,carrySpeed:carry,landingWindow:Math.max(0,windowUntil-clock),lastJump,reason,events:events.slice(),rush:{active:clock<rushUntil,remaining:Math.max(0,rushUntil-clock),cue:cueAt>=0&&clock>=cueAt&&clock<=cueAt+.25,nextCue:cueAt<0?null:Math.max(0,cueAt-clock),count:rushes},origin:'authored rhythm; native jacket-safe jump fallback'})};
 }
 root.createBackspoolHop=create;if(typeof module!=='undefined')module.exports={create};
})(typeof window!=='undefined'?window:globalThis);
