// ---------- CINEMATIC VELOCITY / PERCEPTION ----------
// Camera/controller run in real time, physics/world/animation use independent time domains.
class PerceptionClock {
 constructor(){this.reset();}
 reset(){this.world=1;this.player=1;this.animation=1;this.grace=0;this.dodge=0;this.impact=0;this.weakpoint=0;this.intensity=0;}
 ignition(){this.grace=Math.max(this.grace,.31);}
 perfectDodge(){this.dodge=.34;this.weakpoint=1.8;this.grace=0;}
 strikeImpact(){this.impact=.075;}
 update(dt){
  this.grace=Math.max(0,this.grace-dt);this.dodge=Math.max(0,this.dodge-dt);this.weakpoint=Math.max(0,this.weakpoint-dt);this.impact=Math.max(0,this.impact-dt);
  const aiming=inputAiming()&&this.grace<=0,flow=s.mode===P.TRANSIT;
  let w=1,p=1,a=1;
  if(aiming){w=flow?.22:.42;p=flow?.34:.58;a=flow?.48:.72;}
  if(this.dodge){w=Math.min(w,.065);p=Math.min(p,.65);a=Math.min(a,.70);}
  if(this.impact){w=Math.min(w,.10);p=Math.min(p,.16);a=Math.min(a,.18);}
  const blend=1-Math.exp(-dt/(w<this.world?.075:.14));
  this.world=THREE.MathUtils.lerp(this.world,w,blend);
  this.player=THREE.MathUtils.lerp(this.player,p,blend);
  this.animation=THREE.MathUtils.lerp(this.animation,a,blend);
  this.intensity=THREE.MathUtils.clamp((1-this.world)/.82,0,1);
  const tag=$('perceptionTag');if(tag){tag.style.opacity=gameActive&&this.intensity>.09?Math.min(.86,this.intensity).toFixed(3):'0';tag.textContent=this.dodge?'PERFECT DODGE / TIME FRACTURE':this.impact?'KINETIC IMPACT':flow?'FLOW PERCEPTION / WORLD DILATED':'PERCEPTION / WORLD DILATED';}
 }
}
const perceptionClock=new PerceptionClock();

// 3D camera-local tunnel: real LineSegments, separate from the character FBX/skeleton.
class VelocityTunnel {
 constructor(){
  this.count=360;this.depths=new Float32Array(this.count);this.radii=new Float32Array(this.count);this.angles=new Float32Array(this.count);this.lengths=new Float32Array(this.count);
  this.positions=new Float32Array(this.count*6);this.geometry=new THREE.BufferGeometry();
  this.geometry.setAttribute('position',new THREE.BufferAttribute(this.positions,3).setUsage(THREE.DynamicDrawUsage));
  this.material=new THREE.LineBasicMaterial({color:0xaaaaff,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,depthTest:false});
  this.lines=new THREE.LineSegments(this.geometry,this.material);this.lines.frustumCulled=false;this.lines.renderOrder=7;camera.add(this.lines);scene.add(camera);
  this.glowPositions=new Float32Array(64*6);this.glowGeometry=new THREE.BufferGeometry();
  this.glowGeometry.setAttribute('position',new THREE.BufferAttribute(this.glowPositions,3).setUsage(THREE.DynamicDrawUsage));
  this.glowMaterial=new THREE.LineBasicMaterial({color:0xff784a,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,depthTest:false});
  this.glowLines=new THREE.LineSegments(this.glowGeometry,this.glowMaterial);this.glowLines.frustumCulled=false;this.glowLines.renderOrder=8;camera.add(this.glowLines);
  this.intensity=0;this.burst=0;this.fovKick=0;this.previousSpeed=0;this.acceleration=0;this.speed=0;
  for(let i=0;i<this.count;i++)this.seed(i,true);
 }
 seed(i,initial=false){this.depths[i]=initial?7+Math.random()*100:55+Math.random()*45;this.angles[i]=Math.random()*Math.PI*2;this.radii[i]=3.1+Math.pow(Math.random(),.65)*8.9;this.lengths[i]=6+Math.random()*22;}
 reset(){this.intensity=0;this.burst=0;this.fovKick=0;this.previousSpeed=0;this.acceleration=0;this.material.opacity=0;this.glowMaterial.opacity=0;$('velocityEdge').style.opacity='0';}
 launch(power=1){this.burst=Math.max(this.burst,power);this.fovKick=Math.max(this.fovKick,7.5*power);}
 update(dt){
  if(!gameActive||reducedMotion.matches){this.material.opacity=0;this.glowMaterial.opacity=0;return;}
  const speed=s.vel.length(),acc=(speed-this.previousSpeed)/Math.max(dt,.008);this.acceleration=THREE.MathUtils.clamp(acc,-500,850);this.previousSpeed=speed;this.speed=speed;
  const rail=s.mode===P.TRANSIT||s.mode===P.TAKEOFF,fastAir=!s.onGround&&speed>60;
  const natural=rail?THREE.MathUtils.smoothstep(speed,24,192):fastAir?THREE.MathUtils.smoothstep(speed,65,215)*.67:0;
  const target=THREE.MathUtils.clamp(natural+this.burst*.48,0,1);
  this.intensity=THREE.MathUtils.lerp(this.intensity,target,1-Math.exp(-(target>this.intensity?15:5)*dt));
  this.burst=Math.max(0,this.burst-dt*2.15);this.fovKick=Math.max(0,this.fovKick-dt*21);
  const scroll=(22+speed*2.9+Math.max(0,this.acceleration)*.11)*(perceptionClock.intensity>.3?.72:1)*dt;
  this.geometry.setDrawRange(0,Math.round(this.count*(.16+this.intensity*.84))*2);
  const stretch=THREE.MathUtils.clamp(.6+speed/190+this.burst*.65,.7,2.35);
  for(let i=0;i<this.count;i++){
   let depth=this.depths[i]-scroll;if(depth<3.9){this.seed(i);depth=this.depths[i];}this.depths[i]=depth;
   const angle=this.angles[i],radius=this.radii[i],x=Math.cos(angle)*radius,y=Math.sin(angle)*radius,len=this.lengths[i]*stretch,j=i*6;
   this.positions[j]=x;this.positions[j+1]=y;this.positions[j+2]=-depth;
   this.positions[j+3]=x;this.positions[j+4]=y;this.positions[j+5]=-(depth+len);
   if(i<64){const k=i*6;this.glowPositions[k]=x*1.1;this.glowPositions[k+1]=y*1.1;this.glowPositions[k+2]=-depth;
    this.glowPositions[k+3]=x*1.1;this.glowPositions[k+4]=y*1.1;this.glowPositions[k+5]=-(depth+len*.83);}
  }
  this.geometry.attributes.position.needsUpdate=true;this.glowGeometry.attributes.position.needsUpdate=true;
  this.material.opacity=THREE.MathUtils.clamp(this.intensity*.56,0,.64);
  this.glowMaterial.opacity=THREE.MathUtils.clamp((this.intensity-.38)*.58,0,.39);
  this.glowGeometry.setDrawRange(0,Math.round(64*this.intensity)*2);
  $('velocityEdge').style.opacity=(this.intensity*.68).toFixed(3);
 }
 getFov(base,aiming,transit,speed){if(reducedMotion.matches)return aiming?48:s.onGround?(window.v02CloseCamera?.fov??56):72;
  if(transit)return THREE.MathUtils.clamp(87+THREE.MathUtils.smoothstep(speed,20,225)*16.5+(aiming?-3.5:0)+this.fovKick,76,110);
  if(s.mode===P.TAKEOFF)return THREE.MathUtils.clamp(79+this.fovKick,72,97);
  if(!s.onGround&&speed>45)return Math.max(base,79+THREE.MathUtils.smoothstep(speed,45,220)*13+this.fovKick*.4);
  return base+this.fovKick*.55;
 }
}
const velocityTunnel=new VelocityTunnel();


function showBanner(a,b){$('bannerBig').textContent=a;$('bannerSub').textContent=b;$('banner').style.opacity=1;bannerTimer=1.45}
function hitFlash(){damage.style.opacity=.8;setTimeout(()=>damage.style.opacity=0,120)}
function supportHeight(x,z,currentY){let h=window.roadNetwork?.surfaceFeetAt(x,z,currentY)??.42;for(const c of allColliders(new THREE.Vector3(x,0,z),new THREE.Vector3(x,currentY+1,z))){const b=c.box;if(x>b.min.x+.45&&x<b.max.x-.45&&z>b.min.z+.45&&z<b.max.z-.45&&b.max.y+.42<=currentY+.85)h=Math.max(h,b.max.y+.42)}return Math.max(h,window.backspoolFlow?.terrainHeight(x,z,currentY)??-Infinity,window.verticalDistrict?.surfaceFeetAt(x,z,currentY)??-Infinity)}
// PHASE: 3D FLIGHT RELIABILITY. The player's position is at the FEET, not the center.
// Swept AABB collision with capsule-sized padding prevents tunnelling between frames.
// AABB-expanded dimensions: 0.55m body radius; ~1.72m torso above feet; .40m roof clearance.
// No mesh or collider mutations: the same city meshes are used for visual and collision.
const BODY_RADIUS=.55,BODY_HEIGHT=1.72,ROOF_CLEARANCE=.40;function playerBodyRadius(){return (window.backspoolAdvanced?.isWater()?1:window.backspoolLadders?.radius?.()??BODY_RADIUS);}function playerBodyHeight(){return window.backspoolPosture?.height?.()??BODY_HEIGHT;}
const reliability={lastCollision:'CLEAR',collisions:0,modelMeshes:0,skinMeshes:0,bones:0};
function sweptStaticCharacterHit(start,end){
 const dx=end.x-start.x,dy=end.y-start.y,dz=end.z-start.z;
 if(dx*dx+dy*dy+dz*dz<1e-10)return null;
 let nearest=1.00001,result=null;
 for(const c of allColliders(start,end)){
  if(window.verticalDistrict?.stepRiserPass(start,c))continue;
  const b=c.box;
  const radius=playerBodyRadius();const loX=b.min.x-radius,hiX=b.max.x+radius;
  const loY=b.min.y-playerBodyHeight(),hiY=b.max.y+ROOF_CLEARANCE;
  const loZ=b.min.z-radius,hiZ=b.max.z+radius;
  // Starting on a roof (at maxY+.42) must not be treated as starting inside it.
  // Ignore initial penetrations here; recovery is handled separately after movement.
  if(start.x>loX+1e-5&&start.x<hiX-1e-5&&start.y>loY+1e-5&&start.y<hiY-1e-5&&start.z>loZ+1e-5&&start.z<hiZ-1e-5)continue;
  let enter=0,leave=1,nx=0,ny=0,nz=0,miss=false;
  for(let k=0;k<3;k++){
   const origin=k===0?start.x:k===1?start.y:start.z;
   const d=k===0?dx:k===1?dy:dz;
   const mn=k===0?loX:k===1?loY:loZ;
   const mx=k===0?hiX:k===1?hiY:hiZ;
   if(Math.abs(d)<1e-9){if(origin<mn||origin>mx){miss=true;break}continue}
   const inv=1/d,a=(mn-origin)*inv,z=(mx-origin)*inv;
   const near=Math.min(a,z),far=Math.max(a,z);
   if(near>=enter-1e-9){enter=Math.max(0,near);nx=ny=nz=0;const normal=d>0?-1:1;if(k===0)nx=normal;else if(k===1)ny=normal;else nz=normal}
   leave=Math.min(leave,far);
   if(enter>leave){miss=true;break}
  }
  if(miss||enter<0||enter>1||enter>=nearest||(nx===0&&ny===0&&nz===0))continue;
  nearest=enter;
  const point=new THREE.Vector3(start.x+dx*enter,start.y+dy*enter,start.z+dz*enter);
  result={collider:c,normal:new THREE.Vector3(nx,ny,nz),point,t:enter};
 }
 return result;
}
function sweptCharacterHit(start,end){
 const result=sweptStaticCharacterHit(start,end);
 const friendly=window.v02FriendlyContacts?.sweep(start,end,{radius:playerBodyRadius(),height:playerBodyHeight(),offset:.42});
 return friendly&&(!result||friendly.t<result.t)?friendly:result;
}
function recoverPenetration(){
 for(let pass=0;pass<8;pass++){let moved=false;for(const c of allColliders(s.pos)){if(window.verticalDistrict?.stepRiserPass(s.pos,c))continue;const b=c.box,lo=new THREE.Vector3(b.min.x-playerBodyRadius(),b.min.y-playerBodyHeight(),b.min.z-playerBodyRadius()),hi=new THREE.Vector3(b.max.x+playerBodyRadius(),b.max.y+ROOF_CLEARANCE,b.max.z+playerBodyRadius());if(s.pos.x<=lo.x||s.pos.x>=hi.x||s.pos.y<=lo.y||s.pos.y>=hi.y||s.pos.z<=lo.z||s.pos.z>=hi.z)continue;
 const exits=[['x',lo.x-.025,s.pos.x-lo.x],['x',hi.x+.025,hi.x-s.pos.x],['y',hi.y+.025,hi.y-s.pos.y],['z',lo.z-.025,s.pos.z-lo.z],['z',hi.z+.025,hi.z-s.pos.z]].sort((a,b)=>a[2]-b[2]);s.pos[exits[0][0]]=exits[0][1];s.vel[exits[0][0]]=0;moved=true;markCollision('OVERLAP RECOVERED')}if(!moved)break}
}
function clearRailQueue(){s.queued=s.queuedObj=s.queuedNormal=null;document.body.classList.remove('locked')}
function dropVIP(){dropCourierPassengers()}
function markCollision(type){reliability.lastCollision=type;reliability.collisions++}
function isIntendedRailContact(hit,obj,point,normal){
 if(!hit||!obj)return false;
 if(hit.collider.mesh===obj||obj.userData.reflective&&hit.collider.mesh===obj.userData.reflectionSurface)return true;
 return !!(point&&normal&&normal.y>.58&&hit.normal.y>.58&&
   Math.abs(point.x-hit.point.x)<4&&Math.abs(point.z-hit.point.z)<4&&
   Math.abs(point.y-hit.collider.box.max.y)<3);
}


// PRESSURE / OVERLOAD: accumulated through actual rail distance traveled (not pre-charged
// at trigger pull). Bracing once per rail can avert the overload window.
const OVERLOAD_GRACE=.52,OVERLOAD_LOCKOUT=2.5;
function addRailPressure(meters){
 if(!Number.isFinite(meters)||meters<=0)return;
 s.railMeters+=meters;
 s.pressure=Math.min(100,s.pressure+meters*.055*payloadLoad()*(1+courier.debt*.003+courier.trauma*.002)*(1-courier.mastery*.12));
}
function triggerOverload(){
 if(s.overloadRecovery>0||s.mode!==P.TRANSIT)return;
 s.overloadRecovery=OVERLOAD_LOCKOUT;
 s.overloadTimer=0;
 s.pressure=68;
 s.pressureStage=0;
 s.queued=null;s.queuedNormal=null;s.queuedObj=null;
 document.body.classList.remove('locked');
 const forward=s.vel.lengthSq()>1?s.vel.clone().normalize():cameraForward(s.yaw,0);
 const kick=new THREE.Vector3(-forward.z,.10,forward.x).normalize();
 loseControl(kick,18);
 s.combo=0;cameraShake=Math.max(cameraShake,.86);rumble(360,1,.75);
 if(carrying){carrying=false;spawnVIPAtRecoveryPoint()}
 showBanner('RAIL OVERLOAD','POWER TRIPPED — RECOVER FOR '+OVERLOAD_LOCKOUT.toFixed(1)+'s');
}
function updatePressure(dt){
 s.overloadRecovery=Math.max(0,s.overloadRecovery-dt);
 // Controlled descent/air-braking gives an airborne route to recover pressure.
 if(s.onGround&&s.mode!==P.TRANSIT)s.pressure=Math.max(0,s.pressure-dt*13);
 else if(s.mode===P.AIR||s.mode===P.UNCONTROLLED||s.mode===P.AIM&&!s.onGround)
  s.pressure=Math.max(0,s.pressure-dt*(inputBraking()?17:5));
 if(s.mode===P.TRANSIT){
  if(s.pressure>=99.95){s.overloadTimer+=dt;if(s.overloadTimer>=OVERLOAD_GRACE)triggerOverload()}
  else s.overloadTimer=Math.max(0,s.overloadTimer-dt*3);
 }else s.overloadTimer=0;
 const stage=s.pressure>=92?2:s.pressure>=76?1:0;
 if(stage>s.pressureStage){
  if(stage===2)showBanner('PRESSURE CRITICAL','BRACE (Q / LB) BEFORE OVERLOAD');
  else showBanner('RAIL STRAIN','CHAIN SHORTER RAILS OR BRACE');
 }
 s.pressureStage=stage;
}
// VIP remains recoverable when overload dislodges the passenger.
function spawnVIPAtRecoveryPoint(){
 if(!vip)return;
 const pt=s.pos.clone();
 // Return the passenger to the original rooftop safely rather than putting a pickup in midair.
 const roof=buildingColliders.filter(c=>!c.destroyed).reduce((best,c)=>{
  const y=c.box.max.y+.42,dx=pt.x-c.mesh.position.x,dz=pt.z-c.mesh.position.z;
  const cost=dx*dx+dz*dz+Math.max(0,y-pt.y)*6;
  return cost<best.cost?{c,cost}:best;
 },{c:null,cost:Infinity}).c;
 if(roof)vip.group.position.copy(roofSpawnPoint(roof));else vip.group.position.set(0,.45,0);
 world.add(vip.group);
 $('missionText').textContent='OVERLOAD: VIP dropped. Return to the marked rooftop to retrieve them.';
}

function handleTransitCollision(hit){
 if(hit.collider.friendly){window.v02FriendlyContacts.record(hit);s.pos.copy(hit.point).addScaledVector(hit.normal,.006);const toward=s.vel.dot(hit.normal);if(toward<0)s.vel.addScaledVector(hit.normal,-toward);clearRailQueue();s.onGround=false;setMode(P.AIR);return;}
 const speed=s.vel.length(),n=hit.normal;hitSurface(hit,Math.abs(s.vel.dot(n)));
 s.pos.copy(hit.point).addScaledVector(n,.035);
 const obj=s.transitObj;
 // The rail's OWN target surface is a valid arrival, not an unintended crash.
 // Also handle decorative rooftop target geometry sitting immediately above that roof.
 const targetBuilding=hit.collider.mesh===obj;
 const roofTarget=!targetBuilding&&isIntendedRailContact(hit,obj,s.transitTarget,s.transitNormal);
 if(targetBuilding||roofTarget){markCollision('TARGET ARRIVAL');arriveTransit();return}
 markCollision(n.y>.58?'UNEXPECTED ROOF':'BUILDING IMPACT');
 if(s.brace){
  s.vel.reflect(n).multiplyScalar(.73);s.vel.y=Math.max(4,s.vel.y);
  s.pressure=Math.max(0,s.pressure-35);s.redRailTimer=3.5;controlledFall();
  velocityTunnel.launch(.78);showBanner('RED RAIL BOUNCE','NEXT VECTOR STRIKE EMPOWERED');rumble(130,.58,.28);
  if(s.queued){s.transitTarget=s.queued;s.transitNormal.copy(s.queuedNormal);s.transitObj=s.queuedObj;s.queued=null;s.queuedNormal=null;s.queuedObj=null;document.body.classList.remove('locked');startTransit();}
 }else if(n.y>.58&&speed<48){beginLanding(true,false)}
 else{loseControl(n,Math.min(27,11+speed*.035))}
}
function moveFreeWithSweep(dt){
 const prev=s.pos.clone(),end=prev.clone().addScaledVector(s.vel,dt),hit=sweptCharacterHit(prev,end);
 if(!hit){s.pos.copy(end);return}
 return resolveFreeContact(prev,end,hit);
}
function resolveFreeContact(prev,end,hit){
 if(hit.collider.friendly)return window.v02FriendlyContacts.move(prev,end,hit);
 const n=hit.normal,grounded=s.onGround;if(!(n.y>.5&&window.backspoolHop?.softLanding()))hitSurface(hit,Math.max(Math.abs(s.vel.dot(n)),s.mode===P.UNCONTROLLED?s.vel.length():0));
 s.pos.copy(hit.point).addScaledVector(n,.025);
 const speed=Math.hypot(s.vel.x,s.vel.z);
 if(n.y>.5){
  markCollision('ROOFTOP LANDING');if(s.vel.y<-1)recordCourierLanding(Math.abs(s.vel.y),s.mode===P.UNCONTROLLED);s.pos.y=hit.collider.box.max.y+.42;
  if(s.mode===P.UNCONTROLLED)beginLanding(true,true);
  else if(s.vel.y<-13)beginLanding(true,false);
  else{s.vel.y=0;s.onGround=true;setMode(P.GROUND)}
  return;
 }
 if(n.y<-.5){markCollision('CEILING');if(s.vel.y>0)s.vel.y=0;return}
 markCollision('WALL CONTACT');
 if(!grounded&&speed>11&&s.mode!==P.UNCONTROLLED){loseControl(n,15);return}
 // Low-speed impacts slide along walls; never warp through the building.
 const remaining=end.clone().sub(s.pos);remaining.addScaledVector(n,-Math.min(0,remaining.dot(n)));
 const slideTarget=s.pos.clone().add(remaining);
 const slideHit=sweptCharacterHit(s.pos,slideTarget);
 if(slideHit?.collider.friendly)window.v02FriendlyContacts.move(s.pos.clone(),slideTarget,slideHit);else if(!slideHit)s.pos.copy(slideTarget);
 const toward=s.vel.dot(n);if(toward<0)s.vel.addScaledVector(n,-toward);
}
