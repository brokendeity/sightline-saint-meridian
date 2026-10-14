// Compact play HUD, mission projection and action hints. Diagnostics remain available with F3.
const presentationPolish={diagnostics:false,objective:null,hint:'',lastHint:'',age:0,clock:0,uiClock:0};
function currentNavigationObjective(){
 const next=courier.civilians.find(c=>!c.rescued),index=courier.civilians.indexOf(next),stop=courier.routeAnchors?.[index*2],approach=courier.routeAnchors?.[index*2+1],stage=next?(stop&&!stop.visited?stop:approach&&!approach.visited?approach:null):null;
 return{point:stage?stage.group.position:next?next.group.position:dropZone.group.position,label:stage?stage.type:next?next.role+' RESCUE':'EXTRACTION',number:next?index+1:0,person:next,stage};
}
function updatePresentation(dt=0){
 const ui=presentationPolish;ui.clock+=dt;const visible=gameActive&&!courier.resultsOpen;$('flightVitals').style.display=$('navigationMarker').style.display=$('actionHint').style.display=visible?'block':'none';if(!visible)return;
 camera.updateMatrixWorld(true);const nav=currentNavigationObjective(),point=nav.point.clone(),local=point.clone().applyMatrix4(camera.matrixWorldInverse),ndc=point.project(camera),behind=local.z>=0,w=innerWidth,h=innerHeight;let x=(ndc.x*.5+.5)*w,y=(-ndc.y*.5+.5)*h;
 if(behind){const angle=Math.atan2(-local.y,local.x||.00001);x=w*.5+Math.cos(angle)*w;y=h*.5+Math.sin(angle)*h;}
 const margin=matchMedia('(pointer: coarse)').matches?34:54,bottom=document.body.classList.contains('touchPlay')?h-225:h-135,top=126,edge=behind||x<margin||x>w-margin||y<top||y>bottom;
 const marker=$('navigationMarker');marker.style.left=THREE.MathUtils.clamp(x,margin,w-margin)+'px';marker.style.top=THREE.MathUtils.clamp(y,top,Math.max(top,bottom))+'px';marker.classList.toggle('edge',edge);const angle=Math.atan2(y-h/2,x-w/2)*180/Math.PI;$('navArrow').style.transform='rotate('+angle+'deg)';$('navNumber').textContent=nav.number||'E';$('navLabel').textContent=Math.round(nav.point.distanceTo(s.pos))+' m'+(behind?' · BEHIND':'');marker.style.color=nav.stage?.type==='RECOVERY STOP'?'#94e6c6':'#f6ce78';ui.objective={label:nav.label,distance:Math.round(nav.point.distanceTo(s.pos)),edge,behind};
 ui.uiClock+=dt;if(ui.uiClock<.08&&dt>0)return;ui.uiClock=0;
 const speed=Math.round(s.vel.length()),condition=Math.round(100-courier.trauma),alert=typeof mechanicPolishState==='function'?mechanicPolishState():null;
 $('vitalSpeed').textContent=speed;$('vitalMode').textContent=s.mode===P.TRANSIT?'RAIL FLIGHT':s.onGround?inputAiming()?'AIM LOCK':inputSprinting()?'SPRINT':'ON FOOT':s.mode===P.UNCONTROLLED?'RECOVER':'AIR';$('vitalPressure').style.width=s.pressure+'%';$('vitalPressure').style.background=s.pressure>76?'#ffab6a':'#73d8d0';$('vitalCondition').style.width=condition+'%';$('vitalLoad').textContent=Math.round(s.pressure)+'%';$('vitalConditionText').textContent=condition+'%';$('vitalScore').textContent=s.score.toLocaleString();$('vitalPassengers').textContent=courier.passengers.length+'/3';
 const threats=enemies.filter(e=>e.alertState==='CHASE'&&!e.blindTimer).length,exposure=Math.round(courier.exposure);$('vitalAlert').textContent=threats?'HALO ALERT · '+threats:exposure?'IDENTITY · '+exposure+'%':'HALO CLEAR';$('vitalAlert').classList.toggle('danger',threats>0);$('vitalIdentity').style.width=exposure+'%';
 const controller=lastInputMode==='CONTROLLER',touch=lastInputMode==='TOUCH',fire=controller?'RT':touch?'RAIL':'LMB',aim=controller?'LT':touch?'AIM':'RMB',brace=controller?'LB':touch?'BRACE':'Q';let hint='';
 if(s.overloadRecovery>0)hint='Rail cooling · '+s.overloadRecovery.toFixed(1)+'s · brake and recover';
 else if(alert?.telegraphs>0)hint=brace+' · time your guard as the warning line flashes';
 else if(courier.clock-courier.arrivalAt<=.42)hint=fire+' · fire your next rail now for a Crosscut';
 else if(inputAiming())hint=s.target?fire+' · '+(s.mode===P.TRANSIT?'queue the next vector':'launch this vector'):'Move the reticle onto a surface or anchor';
 else if(s.pressure>76)hint=brace+' · brace during your rail to vent strain';
 else if(!s.onGround)hint=aim+' · aim in controlled fall   '+fire+' · launch into flight';
 else if(nav.person&&nav.point.distanceTo(s.pos)<45&&!nav.stage)hint=nav.person.role==='PRECISION'?'Land gently and slow down to secure this civilian':nav.person.role==='DISRUPTION'?'Arrive fast to create a Bloom and disrupt security':'Chain a second rail within 0.42s before this rescue';
 else hint=aim+' · choose a rooftop vector   '+fire+' · launch';
 if(alert?.feedback&&!inputAiming()&&!alert.charging)hint=alert.feedback;ui.hint=hint;$('actionHint').textContent=hint;
}
function installPresentationControls(){
 document.addEventListener('keydown',e=>{if(e.code==='F3'&&!e.repeat){e.preventDefault();presentationPolish.diagnostics=!presentationPolish.diagnostics;document.body.classList.toggle('diagnostics',presentationPolish.diagnostics)}});
 $('helpToggle').onclick=()=>{const on=$('controlsGuide').hidden;$('controlsGuide').hidden=!on;$('helpToggle').setAttribute('aria-expanded',String(on));$('helpToggle').textContent=on?'HIDE CONTROLS':'CONTROLS & RESCUES'};
}
window.presentationPolishState=()=>({diagnostics:presentationPolish.diagnostics,objective:presentationPolish.objective,hint:presentationPolish.hint});
installPresentationControls();
