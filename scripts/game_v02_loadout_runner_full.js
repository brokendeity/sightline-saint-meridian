/* Loadout's full Runner Action Animation Pack v1.7.2: all 872 clips (484 in-place, 388 "_Root"), converted onto his
 * skeleton by scripts/characters/loadout/convert_runner_full_pack.cjs into assets/loadout/runner/full/.
 * It sits on top of game_v02_loadout_runner_moves.js (the 56-clip role mapping), which stays as it is.
 *
 * Speed: every clip plays at its own 30 fps rate (timeScale 1). The pack's promotion video loops its clips at that
 * rate (measured: Walk/Jog 0.933 s, Dash 0.533 s, Boost 0.400 s against clip lengths 0.9333/0.5333/0.4000 s), so
 * "video speed" is rate 1 and, for travel, the clip's own root speed. Loadout's pace (on by default, Hero tab) sets
 * his ground speeds to the Runner loops' root speeds (Walk 2.13, Jog 3.46, Dash 8.15, Boost 10.85 m/s) so his
 * locomotion loops also play at rate 1.
 *
 * Movement ownership: a Runner action that travels (root motion) is ONE movement owner, 'runner', called through
 * threadrailGame.coordinator.run from updatePlayerLegacy; nothing else moves him in that step. Each step:
 * - the clip's root travel (start frame of the action, rotated by his yaw at the start) gives the planar delta;
 * - the delta is swept with threadrailGame.clear (the same capsule sweep the rail uses); if blocked it slides along
 *   one axis, else he stays put (root motion never pushes the capsule through geometry);
 * - on the ground he follows support only when it is within 12 cm (contact correction <= 0.12 m); a higher step
 *   blocks, a drop hands him to physics (airborne);
 * - pelvis rise above 4 cm (jumps keep their height in the pelvis) and the root's own rise lift the capsule; a
 *   blocked rise stops at the ceiling; landing early ends the action.
 * Clips without root travel play in place; the game's own controller keeps moving him (strafe loops are moved by
 * the strafe controller below, which is the same 'runner' owner).
 *
 * Inputs (Loadout only; these buttons were Backspool's power buttons, which Loadout cannot use):
 *   RB / E        tap: dash (8-way escape dash on the ground, 8-way air dash, power dash while Flow sprint is on,
 *                 Up/Up_Fwd with Jump held in the air, Down/Down_Fwd with LB held in the air);
 *                 hold: charge (Charge Dash/Boost loops while moving), release: power charge dash.
 *   X / R         tumble: handsprings (front, back, turn; 3- and 4-turn with Flow), hold to keep springing;
 *                 in the air: front/back air roll; after a fall: kip-up.
 *   LB / Tab      hold: strafe (8-way walk/jog/dash/boost/charge loops facing the camera, 8-way starts and stops);
 *                 evade while strafing: side-steps, dodges, stand rolls, rolls, slides; jump while strafing: side,
 *                 back, turn, roll and front jumps.
 *   View+LB / G   weapon mode: a staff in his right hand; RT strikes, air strikes and dashes use the weapon clips.
 *   Move List     Hero tab: any of the 872 clips; Perform (or M / View+RB in play) performs it; , . choose.
 * Automatic (Runner transitions, on by default, Hero tab): directional and turning starts, idle turns, 180-degree
 * turns at every pace, 90-degree arcs, stops by pace and foot, deaths by context, stand-up and spawn. */
(()=>{
 'use strict';
 const BASE='assets/loadout/runner/full/',INDEX=BASE+'runner_full_index.json';
 const hero=window.loadoutHero;if(!hero)throw Error('Loadout full Runner pack needs game_v02_loadout_hero.js');
 const isLoadout=()=>window.characterState?.().hero==='loadout';
 const PACE_KEY='loadoutRunnerPace',TRANS_KEY='loadoutRunnerTransitions';
 const readFlag=k=>{try{return localStorage.getItem(k)!=='off';}catch(e){return true;}};
 const writeFlag=(k,v)=>{try{localStorage.setItem(k,v?'on':'off');}catch(e){}};
 let data=null,bins={},bank=null,ready=false,loadError=null,pace=readFlag(PACE_KEY),transitions=readFlag(TRANS_KEY);
 const cache=new Map(),bindings=new Map();
 const stats={loaded:false,clips:0,decoded:0,buildMs:0,performed:{},lastAction:null,actions:0,maxCorrection:0,corrections:0,blockedSteps:0,ledgeHandoffs:0,ceilingStops:0,landings:0,rate:1,ownerSteps:0,strafeSteps:0,overlays:0,log:[]};
 const note=(kind,info)=>{stats.log.push({t:+clock().toFixed(3),kind,...info});if(stats.log.length>200)stats.log.shift();};
 // Game time, advanced by tick() (frames are fixed simulation steps), so holds and windows follow the game clock.
 let gameClock=0;const clock=()=>gameClock;
 const V3=THREE.Vector3;
 async function fetchOk(url){const r=await fetch(url);if(!r.ok)throw Error('Loadout Runner pack asset unavailable: '+url);return r;}

 // ---------- catalog ----------
 const has=n=>!!data?.clips[n];
 const ROOT_ONLY={Mvm_Wp_ChargeDash_2:'Mvm_Wp_ChargeDash2_Root',Mvm_PWChargeDash_Front:'Mvm_PowerChargeDash_Front_Root',Mvm_PWChargeDash_Front_L45:'Mvm_PowerChargeDash_Front_L45_Root',Mvm_PWChargeDash_Front_L:'Mvm_PowerChargeDash_Front_L_Root',Mvm_PWChargeDash_Front_R45:'Mvm_PowerChargeDash_Front_R45_Root',Mvm_PWChargeDash_Front_R:'Mvm_PowerChargeDash_Front_R_Root'};
 // The travelling version of a clip: its _Root twin (or the pack's differently named root-only clip), else itself.
 const travelling=n=>has(n+'_Root')?n+'_Root':ROOT_ONLY[n]&&has(ROOT_ONLY[n])?ROOT_ONLY[n]:n;
 function bind(name,how){if(!has(name))return name;let l=bindings.get(name);if(!l)bindings.set(name,l=new Set());l.add(how);const t=travelling(name);if(t!==name)bind(t,how+' (root motion)');return name;}
 function timesFor(duration,frames){const n=Math.max(2,Math.round(duration*30)+1),t=[];for(let i=0;i<n;i++)t.push(Math.min(duration,i/30));if(t[t.length-1]<duration)t.push(duration);
  if(t.length===frames)return Float32Array.from(t);return Float32Array.from({length:frames},(_,i)=>duration*i/(frames-1));}
 function decode(name){
  let clip=cache.get(name);if(clip)return clip;
  const e=data.clips[name];if(!e)throw Error('Runner clip missing: '+name);
  const pe=e.poseOf?data.clips[e.poseOf]:e,bin=bins[pe.pose.file];if(!bin)throw Error('Runner pose file not loaded: '+pe.pose.file);
  const n=pe.frames,B=data.bones.length,o=bin.byteOffset+pe.pose.offset;
  const q=new Int16Array(bin.buffer.slice(o,o+pe.pose.q16Bytes)),h=new Float32Array(bin.buffer.slice(o+pe.pose.q16Bytes,o+pe.pose.q16Bytes+pe.pose.hipsBytes));
  if(q.length!==n*B*4||h.length!==n*3)throw Error('Runner pose size mismatch: '+name);
  const times=timesFor(pe.duration,n),tracks=[];
  for(let b=0;b<B;b++){const v=new Float32Array(n*4);for(let i=0;i<n;i++){let x=0;for(let k=0;k<4;k++){const c=q[(i*B+b)*4+k]/32767;v[i*4+k]=c;x+=c*c;}x=1/Math.sqrt(x||1);for(let k=0;k<4;k++)v[i*4+k]*=x;}
   tracks.push(new THREE.QuaternionKeyframeTrack(data.bones[b]+'.quaternion',times,v));}
  tracks.push(new THREE.VectorKeyframeTrack(data.hipsTrack,times,h));
  clip=new THREE.AnimationClip('rf-'+name,pe.duration,tracks);cache.set(name,clip);stats.decoded++;return clip;
 }
 // Registers the clip in Loadout's bank (and the live clip table while he is the hero) and returns its id.
 function clipId(name){const id='rf-'+name;if(bank&&!bank.clips[id])bank.clips[id]=decode(name);if(isLoadout()&&typeof clips!=='undefined'&&!clips[id])clips[id]=bank?bank.clips[id]:decode(name);return id;}
 // Root travel [right, up, forward, yaw] at time t (linear between the 30 fps samples).
 function rootAt(e,t){const r=e.root?.travel;if(!r)return [0,0,0,0];const n=r.length/4,f=Math.max(0,Math.min(n-1,t*30)),i=Math.min(n-2,Math.floor(f)),a=f-i;if(n<2)return [r[0],r[1],r[2],r[3]];
  return [0,1,2,3].map(k=>r[i*4+k]+(r[(i+1)*4+k]-r[i*4+k])*a);}
 function liftAt(e,t){const l=e.lift;if(!l?.length)return 0;const f=Math.max(0,Math.min(l.length-1,t*30)),i=Math.min(l.length-2,Math.floor(f)),a=f-i;return l.length<2?l[0]:l[i]+(l[i+1]-l[i])*a;}

 // ---------- the movement owner ----------
 let act=null,strafe=null,overlay=null,downState=null,lastDeathT=-1;
 const fwdOf=y=>({x:-Math.sin(y),z:-Math.cos(y)}),rightOf=y=>({x:Math.cos(y),z:-Math.sin(y)});
 function stickWorld(){const raw=typeof getRawMoveInput==='function'?getRawMoveInput():{x:0,y:0,mag:0};if(raw.mag<.12)return{raw,dir:null};const d=getCameraRelativeMoveVector(raw);d.y=0;if(d.lengthSq()<1e-6)return{raw,dir:null};d.normalize();return{raw,dir:d};}
 // Angle of a world direction relative to his facing, degrees: 0 ahead, +90 right, +-180 behind.
 function localAngle(d,yaw=s.yaw){const f=fwdOf(yaw),r=rightOf(yaw);return Math.atan2(d.x*r.x+d.z*r.z,d.x*f.x+d.z*f.z)*180/Math.PI;}
 function sector(a,preferBack=false){const A=Math.abs(a),side=a>=0?'R':'L';if(A<22.5)return'Fwd';if(A<67.5)return'Front_'+side+'45';if(A<112.5)return(preferBack?'Back_':'Front_')+side;if(A<157.5)return'Back_'+side+'45';return'Back';}
 const free=()=>isLoadout()&&gameActive&&courier.trauma<100&&!window.backspoolCombat?.activeAction()&&!window.backspoolCombat?.staggered()&&!window.backspoolLadders?.active()&&!window.backspoolTraversalState?.().action&&!window.backspoolFlowState?.().action&&!['wall','wallApproach','ledge','water'].includes(window.backspoolAdvancedState?.().kind)&&![P.IMPACT,P.LANDING,P.UNCONTROLLED].includes(s.mode)&&!threadrailGame.onRail();
 function setPlay(id,fade=.1,once=true){playAnim(id,fade,once,1);if(currentAction){currentAction.setEffectiveTimeScale(1);}currentAnimAge=0;animationHold=0;}

 /* perform(name, opts): plays a Runner clip at rate 1. opts.root (default true) uses its travelling version when it
  * has one; opts.loopFor keeps a loop going for that many seconds; opts.segments {start, keep, end, keepWhile} plays
  * start, then keep while keepWhile() is true, then end; opts.overlay plays it over the game's own movement. */
 function perform(name,opts={}){
  if(!ready||!has(name))return false;
  const use=opts.root===false?name:travelling(name),e=data.clips[use];
  if(opts.overlay){overlay={name:use,id:clipId(use),t:0,began:clock(),duration:e.duration,loop:!!opts.loop,until:opts.until||null,segments:opts.segments||null,phase:'start',source:opts.source||'input'};setPlay(overlay.id,.1,!opts.loop);stats.overlays++;note('overlay',{clip:use});return true;}
  if(act)finish('REPLACED');strafeStop();
  act={name:use,asked:name,e,id:clipId(use),t:0,duration:e.duration,loopFor:opts.loopFor||0,segments:opts.segments||null,phase:'start',yaw0:s.yaw,x0:s.pos.x,z0:s.pos.z,y0:s.pos.y,px:s.pos.x,pz:s.pos.z,
   air:!s.onGround||(e.root?.rise||0)>.05||e.maxLift>.12,travels:!!e.root&&(e.root.distance>.01||Math.abs(e.root.yaw)>.01),blocked:0,maxCorrection:0,source:opts.source||'input',onEnd:opts.onEnd||null,keepVelocity:opts.keepVelocity!==false,started:clock()};
  setPlay(act.id,opts.fade??.08,!(act.loopFor>0));
  stats.actions++;stats.performed[use]=(stats.performed[use]||0)+1;stats.lastAction={clip:use,asked:name,source:act.source,duration:+e.duration.toFixed(3),rootMotion:act.travels,distance:e.root?.distance??0};note('perform',{clip:use,source:act.source});
  return true;
 }
 function finish(reason){if(!act)return;const a=act;act=null;
  if(s.onGround){if(s.mode!==P.GROUND&&s.mode!==P.AIM)setMode(P.GROUND);if(!a.keepVelocity){s.vel.x=s.vel.z=0;}}else if(s.mode!==P.AIR)setMode(P.AIR);
  currentAnimAge=0;animationHold=0;note('finish',{clip:a.name,reason,blocked:a.blocked,maxCorrection:+a.maxCorrection.toFixed(4)});a.onEnd?.(reason);}
 // One owned step towards (tx, tz) planar and ty vertical (null = follow the ground). Returns false if he left the ground.
 function moveStep(dx,dz,ty,dt,a){
  const from=s.pos.clone(),to=from.clone();to.x+=dx;to.z+=dz;
  if(dx*dx+dz*dz>1e-12&&!threadrailGame.clear(from,to)){
   const xs=from.clone();xs.x=to.x;const zs=from.clone();zs.z=to.z;
   if(Math.abs(dx)>1e-6&&threadrailGame.clear(from,xs))to.copy(xs);else if(Math.abs(dz)>1e-6&&threadrailGame.clear(from,zs))to.copy(zs);else to.copy(from);
   if(a)a.blocked++;stats.blockedSteps++;
  }
  const g=supportHeight(to.x,to.z,from.y);let grounded=true;
  if(ty===null){
   const d=g-from.y;
   if(Math.abs(d)<=.12){to.y=g;const c=Math.abs(d);if(c>1e-4){stats.corrections++;stats.maxCorrection=Math.max(stats.maxCorrection,c);if(a)a.maxCorrection=Math.max(a.maxCorrection,c);}}
   else if(d>.12){to.x=from.x;to.z=from.z;to.y=from.y;if(a)a.blocked++;stats.blockedSteps++;}
   else{to.y=from.y;grounded=false;}
  }else{
   to.y=ty;
   if(to.y>from.y&&!threadrailGame.clear(new V3(to.x,from.y,to.z),to)){to.y=from.y;stats.ceilingStops++;}
   if(to.y<=g){to.y=Math.max(to.y,g);grounded=true;}else grounded=false;
   if(!threadrailGame.clear(from,to)){to.x=from.x;to.z=from.z;if(!threadrailGame.clear(from,to))to.y=from.y;stats.blockedSteps++;if(a)a.blocked++;}
  }
  if(dt>0)s.vel.set((to.x-from.x)/dt,(to.y-from.y)/dt,(to.z-from.z)/dt);
  s.pos.copy(to);s.onGround=grounded;return grounded;
 }
 function stepAction(dt){
  const a=act,e=a.e;a.t+=dt;
  let t=a.t;
  if(a.loopFor>0){if(a.t>=a.loopFor){finish('DONE');return true;}t=a.t%a.duration;}
  else if(a.t>=a.duration){
   if(a.segments&&a.phase==='start'&&a.segments.keep){nextSegment(!a.segments.keepWhile||a.segments.keepWhile()?'keep':'end');return true;}
   if(a.segments&&a.phase==='keep'){if(a.segments.keepWhile?.()){a.t=0;return true;}nextSegment('end');return true;}
   finish('DONE');return true;}
  if(!a.travels&&!a.air&&!a.segments){/* in place: the clip plays, he stays where he is */s.vel.x=s.vel.z=0;return true;}
  const cycles=a.loopFor>0?Math.floor(a.t/a.duration):0,end=rootAt(e,e.duration),[r,u,f,yaw]=rootAt(e,t);
  const R=r+cycles*end[0],F=f+cycles*end[2];
  const fw=fwdOf(a.yaw0),rt=rightOf(a.yaw0),tx=a.x0+rt.x*R+fw.x*F,tz=a.z0+rt.z*R+fw.z*F,dx=tx-a.px,dz=tz-a.pz;a.px=tx;a.pz=tz;
  if(e.root&&Math.abs(e.root.yaw)>.01)s.yaw=a.yaw0+yaw+cycles*end[3];
  const rise=u+Math.max(0,liftAt(e,t)-.04);
  const air=a.air&&(rise>.02||!s.onGround);
  const grounded=moveStep(a.travels?dx:0,a.travels?dz:0,air?a.y0+rise:null,dt,a);
  stats.ownerSteps++;
  if(!air&&!grounded){stats.ledgeHandoffs++;setMode(P.AIR);finish('LEDGE');return true;}
  if(air&&grounded&&a.t>.15&&rise<.05){stats.landings++;}
  if(air&&!grounded&&s.mode!==P.AIR)setMode(P.AIR);
  return true;
 }
 function nextSegment(phase){const a=act,name=a.segments[phase];if(!name||!has(name)){finish('DONE');return;}const use=travelling(name),e=data.clips[use];
  a.phase=phase;a.name=use;a.e=e;a.id=clipId(use);a.t=0;a.duration=e.duration;a.yaw0=s.yaw;a.x0=a.px=s.pos.x;a.z0=a.pz=s.pos.z;a.y0=s.pos.y;a.air=!s.onGround||(e.root?.rise||0)>.05||e.maxLift>.12;a.travels=!!e.root&&(e.root.distance>.01||Math.abs(e.root.yaw)>.01);
  setPlay(a.id,.06,!(phase==='keep'));stats.performed[use]=(stats.performed[use]||0)+1;note('segment',{clip:use,phase});}

 // ---------- strafe (8-way) ----------
 const LOOP={walk:d=>d==='Fwd'?'Mvm_Walk_Front':'Mvm_Walk_'+d,jog:d=>d==='Fwd'?'Mvm_Jog':'Mvm_Jog_'+d,dash:d=>d==='Fwd'?'Mvm_Dash':'Mvm_Dash_'+d,boost:d=>d==='Fwd'?'Mvm_Boost':'Mvm_Boost_'+d,
  chargeDash:d=>d==='Fwd'?'Mvm_ChargeDash':'Mvm_ChargeDash_'+d,chargeBoost:d=>d==='Fwd'?'Mvm_ChargeBoost':'Mvm_ChargeBoost_'+d,wpCharge:()=> 'Mvm_Wp_ChargeBoost'};
 const START=(tier,d)=>{const T=tier==='walk'?'Walk':'Jog';return d==='Fwd'?`Mvm_${T}_Start_Fwd`:d==='Back'?`Mvm_${T}_Start_Bwd`:`Mvm_${T}_${d}_Start`;};
 const STOP=(tier,d)=>tier==='walk'?(d==='Fwd'?'Mvm_WalkStop':'Mvm_WalkStop_'+d):tier==='jog'?(d==='Fwd'?'Mvm_JogStop':'Mvm_JogStop_'+d):(tier==='boost'||tier==='chargeBoost')&&d==='Fwd'?'Mvm_BoostEnd':'Mvm_Stop_'+(d==='Fwd'?'Front':d);
 const loopSpeed=n=>data.clips[n+'_Root']?.root?.speed||data.clips[n]?.root?.speed||0;
 const input={dash:false,dashAt:0,charge:false,keyTumble:false,padTumble:false,keyStrafe:false,padStrafe:false,keyJump:false,padJump:false,keyEvade:false,padEvade:false,pad:[],
  get strafe(){return this.keyStrafe||this.padStrafe;},get tumble(){return this.keyTumble||this.padTumble;},get jumpHeld(){return this.keyJump||this.padJump;},get evadeHeld(){return this.keyEvade||this.padEvade;}};
 function strafeTier(raw){if(weapon.on&&input.charge)return'wpCharge';const sprint=inputSprinting();if(input.charge)return sprint?'chargeBoost':'chargeDash';if(sprint)return strafe&&strafe.moving&&clock()-strafe.movingSince>1.2?'boost':'dash';return raw.mag<.55?'walk':'jog';}
 function strafeStop(){if(!strafe)return;strafe=null;}
 function stepStrafe(dt){
  const {raw,dir}=stickWorld();s.yaw=dampAngle(s.yaw,cam.yaw,16,dt);
  if(!strafe)strafe={moving:false,movingSince:0,dir:'Fwd',tier:'walk',back:false,loop:null};
  if(!dir){
   if(strafe.moving){strafe.moving=false;const stop=STOP(strafe.tier,strafe.dir);if(transitions&&has(stop)){const keep=strafe;perform(stop,{source:'strafe-stop'});strafe=keep;strafe.loop=null;return true;}}
   s.vel.x=s.vel.z=0;const idle=window.backspoolCombat?.state().target?'Attack_Hand_Ready':'Idle_Wait_A';const id=clipId(idle);if(currentAnim!==id)setPlay(id,.15,false);moveStep(0,0,null,dt,null);return true;}
  const a=localAngle(dir),d=sector(a,strafe.back),tier=strafeTier(raw);
  strafe.back=Math.abs(a)>90;
  if(!strafe.moving){strafe.moving=true;strafe.movingSince=clock();strafe.dir=d;strafe.tier=tier;const st=START(tier,d);if(transitions&&has(st)&&(tier==='walk'||tier==='jog')){const keep=strafe;perform(st,{source:'strafe-start'});strafe=keep;return true;}}
  strafe.dir=d;strafe.tier=tier;
  const loop=LOOP[tier](d),name=has(loop)?loop:LOOP.jog(d),speed=loopSpeed(name)||3.46,id=clipId(name);
  if(currentAnim!==id){const phase=currentAction&&currentAction.getClip().duration?currentAction.time/currentAction.getClip().duration:0;setPlay(id,.14,false);if(currentAction)currentAction.time=(phase%1)*currentAction.getClip().duration;}
  bind(name,'strafe '+tier+' loop');
  strafe.loop=name;strafe.speed=speed;
  const tv=dir.clone().multiplyScalar(speed),k=Math.min(1,dt*14),vx=s.vel.x+(tv.x-s.vel.x)*k,vz=s.vel.z+(tv.z-s.vel.z)*k;
  const ok=moveStep(vx*dt,vz*dt,null,dt,null);s.vel.x=vx;s.vel.z=vz;stats.strafeSteps++;
  if(!ok){setMode(P.AIR);strafeStop();return true;}
  return true;
 }

 // ---------- input-driven moves ----------
 const ESC=d=>({Fwd:'Front',Back:'Back',Front_R45:'Front_R45',Front_L45:'Front_L45',Back_R45:'Back_R45',Back_L45:'Back_L45',Front_R:'Right',Back_R:'Right',Front_L:'Left',Back_L:'Left'})[d];
 const FIVE=d=>({Fwd:'Front',Front_R45:'Front_R45',Front_L45:'Front_L45',Front_R:'Front_R',Back_R:'Front_R',Front_L:'Front_L',Back_L:'Front_L'})[d]||null;
 let lastDash=-9;
 function dashMove(release){
  // The direction is read against his facing when the button went down (a start or turn may have begun since).
  const yaw=input.dashYaw??s.yaw,{dir}=stickWorld(),d=dir?sector(localAngle(dir,yaw)):'Back',follow=clock()-lastDash<.45;lastDash=clock();input.dashYaw=null;
  if(act&&['start','idle-turn','strafe-start'].includes(act.source))s.yaw=yaw;
  if(weapon.on){return perform(follow?'Mvm_Wp_ChargeDash_2':'Mvm_Wp_ChargeDash',{source:'dash-weapon'});}
  if(!s.onGround){
   if(input.jumpHeld)return perform(dir&&d==='Fwd'?'Esc_BoostDash_Up_Fwd':'Esc_BoostDash_Up',{source:'air-dash-up'});
   if(input.strafe)return perform(dir&&d==='Fwd'?'Esc_BoostDash_Down_Fwd':'Esc_BoostDash_Down',{source:'air-dash-down'});
   const n='Esc_BoostDash_Air_'+(follow&&['Fwd','Back'].includes(d)?ESC(d)+'_Ad':ESC(d));return perform(n,{source:'air-dash'});}
  if(release){const f=dir?FIVE(d):'Front';return perform(f?'Mvm_PWChargeDash_'+f:'Esc_BoostDash_Back',{source:'charge-dash'});}
  if(inputSprinting()&&FIVE(d))return perform('Mvm_PowerDash_'+FIVE(d),{source:'power-dash'});
  return perform('Esc_BoostDash_'+(follow&&['Fwd','Back'].includes(d)?ESC(d)+'_Ad':ESC(d)),{source:'dash'});
 }
 function tumbleMove(){
  const {dir}=stickWorld(),a=dir?localAngle(dir):0,A=Math.abs(a),flow=inputSprinting(),held=()=>input.tumble;
  if(downState){downState=null;return perform('Tum_RackSpring',{source:'kip-up'});}
  if(weapon.on)return perform(dir?'WpAttack_Rolling_All':'WpAttack_Rolling',{source:'weapon-roll'});
  if(!s.onGround){const back=dir&&A>120;const pre=back?'Jmp_BackAir_Roll':'Jmp_FrontAir_Roll';
   overlay=null;return perform(pre+'_Start',{overlay:true,source:'air-roll',segments:{keep:pre+'_Loop',end:pre+'_End'}});}
  if(input.strafe&&dir&&A>120&&!flow)return perform('Tum_RackSpring_BackDown',{source:'back-drop'});
  if(flow&&dir&&A>120)return perform('Tum_B_HandSpring_3Turn_All',{source:'tumble'});
  if(flow&&dir&&A>=45)return perform('Tum_B_HandSpring_4Turn_All',{source:'tumble'});
  if(dir&&A>120)return perform('Tum_B_HandSpring_Start',{source:'tumble',segments:{keep:'Tum_B_HandSpring_Loop',end:'Tum_B_HandSpring_End',keepWhile:held}});
  if(dir&&A>=45)return perform('Tum_B_HandSpring_Turn_Start',{source:'tumble',segments:{keep:'Tum_B_HandSpring_Loop',end:'Tum_B_HandSpring_Air_End',keepWhile:held}});
  return perform('Tum_F_HandSpring_Start',{source:'tumble',segments:{keep:'Tum_F_HandSpring_Loop',end:'Tum_F_HandSpring_End',keepWhile:held}});
 }
 // Evade while strafing: side-steps, dodges, rolls and slides, chosen by stick, pace and Flow.
 function strafeEvade(){
  const {raw,dir}=stickWorld(),a=dir?localAngle(dir):180,A=Math.abs(a),side=a>=0?'Right':'Left',flow=inputSprinting(),moving=Math.hypot(s.vel.x,s.vel.z)>1.5,light=raw.mag<.55,fast=Math.hypot(s.vel.x,s.vel.z)>6;
  if(moving&&flow&&dir&&A<30){const sp=Math.hypot(s.vel.x,s.vel.z);const len=sp>9?'Long':sp>7?'Middle':'Short';
   return perform('Esc_Slide_Start',{source:'slide',segments:{keep:weapon.on?'Esc_Slide_Loop_OffHand':'Esc_Slide_Keep_'+len,end:'Esc_Slide_End',keepWhile:()=>input.evadeHeld}});}
  if(moving&&flow&&dir&&A>=60&&A<=120)return perform('Esc_Slide_'+side,{source:'slide-side'});
  if(!moving){
   if(!dir)return perform('Esc_StandRoll_Back',{source:'stand-roll'});
   if(A<30)return perform(flow?'Esc_StandRoll_JFront':'Esc_StandRoll_Front',{source:'stand-roll'});
   if(A>150)return perform('Esc_StandRoll_Back',{source:'stand-roll'});
   if(A>120)return perform('Esc_TurnDodge_'+side,{source:'turn-dodge'});
   if(flow)return perform('Esc_StandRoll_'+side,{source:'stand-roll'});
   return perform((light?'Esc_StandMove_':'Esc_StandDodge_')+side,{source:'side-step'});}
  if(!dir||A>150)return perform('Esc_Roll_Back',{source:'roll'});
  if(A<30)return perform(flow?'Esc_Roll_JFront':'Esc_Roll_Front',{source:'roll'});
  if(flow){return perform(fast&&has('Esc_Roll_'+side+'_Fwd_Root')?'Esc_Roll_'+side+'_Fwd_Root':'Esc_Roll_'+side,{source:'roll'});}
  const base=(light?'Esc_Move_':'Esc_Dodge_')+side;return perform(fast&&has(base+'_Fwd_Root')?base+'_Fwd_Root':base,{source:'dodge'});
 }
 // Jump while strafing: the game's physics jump moves him; the Runner jump plays over it.
 function strafeJumpOverlay(){
  const {dir}=stickWorld(),speed=Math.hypot(s.vel.x,s.vel.z),flow=inputSprinting(),a=dir?localAngle(dir):0,A=Math.abs(a),side=a>=0?'Right':'Left';
  let pick;
  if(speed>3&&dir){const va=Math.abs(localAngle(new V3(s.vel.x,0,s.vel.z).normalize()));const vs=Math.atan2(s.vel.x,s.vel.z);const turn=Math.abs(((Math.atan2(dir.x,dir.z)-vs+Math.PI*3)%(Math.PI*2))-Math.PI)>2.4;if(turn)pick=['Jmp_TurnAir_'+side+'_Start','Jmp_TurnAir_'+side+'_Keep','Jmp_TurnAir_'+side];void va;}
  if(!pick&&dir&&A>=60&&A<=120)pick=flow?['Jmp_SideAir_C_Start','Jmp_SideAir_C_Keep','Jmp_SideAir_C']:['Jmp_Move_'+side+'_Start','Jmp_Move_'+side+'_Keep','Jmp_Move_'+side];
  if(!pick&&dir&&A>120)pick=['Jmp_BackAir_Start','Jmp_BackAir_Keep','Jmp_BackAir'];
  if(!pick&&dir&&A<60)pick=strafe?.tier==='boost'?['Jmp_Roll_Front_Start','Jmp_Roll_Front_Keep','Jmp_Roll_Front']:strafe?.tier==='dash'?['Jmp_FrontAir_B_Start','Jmp_FrontAir_B_Keep','Jmp_FrontAir_B']:['Jmp_FrontAir_A_Start','Jmp_FrontAir_A_Keep','Jmp_FrontAir_A'];
  if(!pick)pick=strafe?.tier==='walk'?['Jmp_Base_A_Start','Jmp_Base_A_Keep','Jmp_Base_A']:['Jmp_Base_B_Start','Jmp_Base_B_Keep','Jmp_Base_B'];
  const end=pick[0].replace('_Start','_End');
  strafeStop();overlay=null;
  return perform(pick[0],{overlay:true,source:'strafe-jump',segments:{keep:pick[1],end:has(end)?end:null,air:true}});
 }

 // ---------- automatic transitions (normal locomotion) ----------
 const auto={mag:0,since:0,prevDir:null,lastAngle:0,arcSince:0,speedPeak:0,tier:'jog',lastRun:0};
 function tierOfSpeed(v){return v<2.8?'walk':v<5.8?'jog':v<9.5?'dash':'boost';}
 function footPhase(){const c=currentAction?.getClip();return c&&c.duration?(currentAction.time/c.duration)%1<.5?'Left':'Right':'Left';}
 function autoTransitions(dt){
  // Locked-on combat keeps the combat footwork: no Runner transitions while a target is locked.
  if(!transitions||!s.onGround||s.mode!==P.GROUND||window.backspoolCombat?.state().target)return false;
  const {raw,dir}=stickWorld(),speed=Math.hypot(s.vel.x,s.vel.z),now=clock();
  if(speed>2)auto.lastRun=now;
  auto.speedPeak=speed>.5?Math.max(auto.speedPeak*.98,speed):0;if(speed>.5)auto.tier=tierOfSpeed(Math.max(speed,auto.speedPeak*.9));
  // Standing start or idle turn.
  if(dir&&auto.mag<.12&&speed<.4){const a=localAngle(dir),A=Math.abs(a),side=a>=0?'R':'L';auto.mag=raw.mag;
   if(raw.mag<.45&&A>=60){return perform(`Mvm_Idle_${['A','B','C'][Math.floor(now*7)%3]}_Turn${side}_${A>135?180:90}`,{source:'idle-turn',keepVelocity:false});}
   const T=raw.mag<.6?'Walk':'Jog';if(A>135)return perform(`Mvm_${T}_Start_${side}180`,{source:'start'});if(A>=45)return perform(`Mvm_${T}_Start_${side}90`,{source:'start'});return perform(`Mvm_${T}_Start_Fwd`,{source:'start'});}
  auto.mag=dir?raw.mag:0;
  if(dir&&speed>2.5&&raw.mag>.45){
   const vd=new V3(s.vel.x,0,s.vel.z).normalize(),cross=vd.x*dir.z-vd.z*dir.x,dot=vd.x*dir.x+vd.z*dir.z,ang=Math.acos(Math.max(-1,Math.min(1,dot)))*180/Math.PI,side=cross<0?'L':'R',Side=side==='L'?'Left':'Right';
   // Face along travel first so the clip's turn starts from his heading.
   const faceTravel=()=>{s.yaw=Math.atan2(-vd.x,-vd.z);};
   if(ang>150){faceTravel();const tier=auto.tier;
    if(tier==='walk')return perform(raw.mag<.8?`Mvm_Walk_Arc_180_${Side}`:`Mvm_Walk_Turn${side}_180_${footPhase()}`,{source:'turn-180'});
    const T={jog:'Jog',dash:'Dash',boost:'Boost'}[tier];return perform(`Mvm_${T}_Turn${side}_180_${footPhase()}`,{source:'turn-180'});}
   const prevAng=auto.lastAngle;auto.lastAngle=ang;
   if(ang>=70&&ang<=120&&prevAng<45){{faceTravel();const T={walk:'Walk',jog:'Jog',dash:'Dash',boost:'Boost'}[auto.tier];
     return perform(T==='Walk'?`Mvm_Walk_Arc_Fwd_${Side}`:`Mvm_${T}_Arc_90_${Side}`,{source:'arc-90'});}}
   if(ang>=35&&ang<=65&&prevAng<15&&auto.tier!=='walk'){faceTravel();const T={jog:'Jog',dash:'Dash',boost:'Boost'}[auto.tier];return perform(`Mvm_${T}_Arc_Fwd_${Side}`,{source:'arc-fwd'});}
  }
  // Stop: stick released while running.
  if(!dir&&speed>2&&auto.prevDir){auto.prevDir=null;const tier=auto.tier,flow=inputSprinting(),foot=footPhase()[0];
   const n=tier==='boost'?'Mvm_BoostEnd':tier==='dash'?`Mvm_DashEnd_${foot}`:tier==='jog'?`Mvm_JogEnd_${foot}${flow?'H':''}`:`Mvm_WalkEnd_${foot}${flow?'H':''}`;
   const v=new V3(s.vel.x,0,s.vel.z);if(v.lengthSq()>.01)s.yaw=Math.atan2(-v.x,-v.z);return perform(n,{source:'stop',keepVelocity:false});}
  auto.prevDir=dir;if(!dir)auto.lastAngle=0;
  return false;
 }

 // ---------- deaths, stand-up, spawn ----------
 let wasDead=false,deathPick=null,lastSpeed=0;
 function deathContext(){const speed=Math.max(Math.hypot(s.vel.x,s.vel.z),lastSpeed),flow=window.backspoolFlowState?.().action||'';
  if(/slide/i.test(flow)||/Slide/.test(act?.name||''))return['Dam_SlideDie'];
  if(!s.onGround){return s.vel.y<-8?['Dam_JumpDie_Over_Start','Dam_JumpDie_Over_Keep','Dam_JumpDie_Over_End']:['Dam_FlyDie_'+(Math.sin(clock()*13)>0?'Left':'Right')];}
  if(speed>6)return['Dam_StandDie'];if(speed>2)return['Dam_TurnDie'];
  return Math.floor(clock())%2?['Dam_StandDie_Over_Start','Dam_StandDie_Over_Keep','Dam_StandDie_Over_End']:['Dam_StandDie_Over2_Start','Dam_StandDie_Over2_Keep','Dam_StandDie_Over2_End'];}
 function deaths(){
  const dead=courier.trauma>=100;
  if(dead&&!wasDead){wasDead=true;strafeStop();overlay=null;if(act)finish('DEATH');deathPick=deathContext();
   if(deathPick.length===3)perform(deathPick[0],{source:'death',segments:{keep:deathPick[1],end:deathPick[2],keepWhile:()=>!s.onGround}});else perform(deathPick[0],{source:'death'});downState={since:clock(),pick:deathPick};}
  if(!dead&&wasDead){wasDead=false;if(act?.source==='death')finish('REVIVED');if(downState){downState=null;perform('Dam_StandUp',{source:'stand-up',root:false});}}
 }

 // ---------- weapon mode ----------
 const weapon={on:false,prop:null,saved:null,windows:{}};
 function weaponProp(){if(weapon.prop)return weapon.prop;const g=new THREE.Group(),m=new THREE.MeshStandardMaterial({color:0x2b3442,roughness:.45,metalness:.6}),glow=new THREE.MeshBasicMaterial({color:0x7fe9ff});
  const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.018,.022,1.25,8),m);shaft.position.y=.18;g.add(shaft);for(const y of [-.42,.78]){const cap=new THREE.Mesh(new THREE.CylinderGeometry(.026,.026,.05,8),glow);cap.position.y=y;g.add(cap);}
  g.name='LoadoutStaff';g.visible=false;weapon.prop=g;return g;}
 function trim(clip,a,b,name,fps=60){const n=Math.max(2,Math.round((b-a)*fps)+1),times=new Float32Array(n);for(let i=0;i<n;i++)times[i]=(b-a)*i/(n-1);
  const tracks=clip.tracks.map(t=>{const it=t.createInterpolant(),size=t.getValueSize(),values=new Float32Array(n*size);for(let i=0;i<n;i++)values.set(it.evaluate(a+times[i]),i*size);return new t.constructor(t.name,times,values);});return new THREE.AnimationClip(name,b-a,tracks);}
 // The combat chain keeps its timing and hits; in weapon mode each move's clip becomes a window of a weapon clip
 // with the strike on the move's contact time (the same fitting game_v02_loadout_runner_moves.js uses).
 function weaponWindows(){const pools={ground:['WpAttack_Hand_1R','WpAttack_Hand_2L','WpAttack_Hand_All'],heavy:['WpAttack_Hand_PwR','WpAttack_Rolling_All'],air:['WpJAttack_AirSwing_All','WpJAttack_AirDrop_All']},used=new Map(),out={};
  for(const move of window.backspoolActionManifest?.moves||[]){const clipIdM=move.clipId;if(!clipIdM||!bank?.clips[clipIdM]||!move.contact?.length)continue;
   const kind=/air/.test(move.id)||move.kind==='air'?'air':['heavy','launcher'].includes(move.kind)||/heavy|launcher/.test(move.id)?'heavy':'ground';
   // Hits come from the move's own hand or foot sweeping the target. The weapon clips swing the staff with a hand, so
   // hand moves get a weapon window timed on that hand's furthest reach; kicks keep their Runner clips.
   const socket=move.contact[0].socket||'rightHand',f=THREE.MathUtils.clamp(move.contact[0].time/Math.max(.05,move.duration),.05,.95),list=/Hand$/.test(socket)?pools[kind].filter(n=>has(n)&&data.clips[n].peaks?.[socket]):[],key=kind+':'+socket,turn=used.get(key)||0;used.set(key,turn+1);if(!list.length)continue;
   const name=list[turn%list.length],e=data.clips[name],src=decode(name),ts=e.peaks[socket].time,dur=src.duration;
   const w=Math.min(dur,Math.max(move.duration*.8,Math.min(move.duration*1.25,ts/f,(dur-ts)/(1-f)))),a=THREE.MathUtils.clamp(ts-f*w,0,dur-w);
   out[clipIdM]={clip:trim(src,a,a+w,clipIdM),runnerClip:name,socket,window:[+a.toFixed(3),+(a+w).toFixed(3)],strikeFraction:+((ts-a)/w).toFixed(3),contactFraction:+f.toFixed(3)};bind(name,'weapon-mode '+kind+' strike ('+move.id+')');}
  return out;}
 function swapClip(id,clip){if(bank)bank.clips[id]=clip;if(isLoadout()&&typeof clips!=='undefined'){clips[id]=clip;const old=actions[id];if(old){old.stop();delete actions[id];if(currentAction===old){currentAction=null;currentAnim='';}}}}
 function setWeapon(on){on=!!on&&ready;if(on===weapon.on)return weapon.on;
  if(on){if(!Object.keys(weapon.windows).length)weapon.windows=weaponWindows();weapon.saved={};for(const [id,w] of Object.entries(weapon.windows)){weapon.saved[id]=bank.clips[id];swapClip(id,w.clip);}}
  else if(weapon.saved){for(const [id,c] of Object.entries(weapon.saved))swapClip(id,c);weapon.saved=null;}
  weapon.on=on;const prop=weaponProp(),hand=bank?.model?.getObjectByName('mixamorigRightHand');if(hand&&prop.parent!==hand){hand.add(prop);bank.model.updateMatrixWorld(true);const ws=hand.getWorldScale(new V3());prop.scale.set(1/Math.max(1e-6,ws.x),1/Math.max(1e-6,ws.y),1/Math.max(1e-6,ws.z));prop.rotation.set(0,0,Math.PI/2);}
  prop.visible=on;note('weapon',{on});if(ui)ui.weapon.textContent='Weapon · '+(on?'On':'Off');return on;}

 // ---------- per-frame entry points ----------
 // Movement owner step, from updatePlayerLegacy through threadrailGame.coordinator.run('runner', ...).
 function tick(dt){
  if(!ready||!isLoadout()){if(act)finish('HERO CHANGE');strafe=null;overlay=null;return false;}
  if(!gameActive)return false;
  gameClock+=dt;const speedNow=Math.hypot(s.vel.x,s.vel.z);
  if(input.dash&&input.keyDash&&!input.charge&&s.onGround&&clock()-input.dashAt>=.25)input.charge=true;
  deaths();lastSpeed=speedNow;
  if(act&&(window.backspoolCombat?.staggered()||window.backspoolLadders?.active()||threadrailGame.onRail())){finish('INTERRUPTED');}
  if(act&&['stop','strafe-stop'].includes(act.source)&&act.t>.1&&stickWorld().raw.mag>.3){finish('MOVE');}
  if(armed.pending&&!act){const n=armed.pending;armed.pending=null;perform(n,{source:'move-list',root:armed.root});}
  if(act)return stepAction(dt);
  if(overlay&&s.onGround&&clock()-overlay.began>.12&&overlay.segments?.air){overlay=null;}
  if(courier.trauma>=100)return false;
  if(pendingJump&&s.onGround){strafeStop();return false;}
  if(input.strafe&&free()&&s.onGround&&!overlay)return stepStrafe(dt);
  if(strafe&&!input.strafe)strafeStop();
  if(free()&&!overlay&&!input.strafe&&autoTransitions(dt))return act?stepAction(0)||true:false;
  return false;
 }
 // Animation claim, first in resolveAnimation.
 function animate(){
  if(!ready||!isLoadout())return false;
  if(act){if(currentAnim!==act.id)setPlay(act.id,.06,!(act.loopFor>0||act.phase==='keep'));return true;}
  if(overlay){const c=currentAction;
   const done=c&&currentAnim===overlay.id&&!overlay.loop&&c.time>=c.getClip().duration-1e-3;
   if(overlay.segments){if(s.onGround&&clock()-overlay.began>.15){overlay=null;return false;}
    if(done&&overlay.phase==='start'&&overlay.segments.keep&&has(overlay.segments.keep)){overlay.phase='keep';overlay.name=overlay.segments.keep;overlay.id=clipId(overlay.name);overlay.loop=true;setPlay(overlay.id,.08,false);}
    else if(overlay.phase==='keep'&&overlay.segments.end&&has(overlay.segments.end)&&s.vel.y<0&&supportHeight(s.pos.x,s.pos.z,s.pos.y)>s.pos.y-1.2){overlay.phase='end';overlay.name=overlay.segments.end;overlay.id=clipId(overlay.name);overlay.loop=false;setPlay(overlay.id,.08,true);}
    if(currentAnim!==overlay.id)setPlay(overlay.id,.08,!overlay.loop);return true;}
   if(done||currentAnim!==overlay.id&&clock()-overlay.began>.1){overlay=null;return false;}return true;}
  if(strafe&&input.strafe)return true;
  return false;
 }

 // ---------- input hooks (from threadrailGame.handleKey and threadrailGame.poll) ----------
 const armed={list:[],index:0,pending:null,root:true};
 function handleKey(e,up){
  if(!ready||!isLoadout()||e.target?.closest?.('input,select,textarea'))return null;
  const c=e.code;
  if(up){if(c==='KeyE'){input.keyDash=false;if(!input.dash)return true;input.dash=false;if(input.charge){input.charge=false;if(gameActive&&free())dashMove(true);}else if(gameActive&&(free()||!s.onGround))dashMove(false);return true;}
   if(c==='Tab'){input.keyStrafe=false;return true;}if(c==='KeyR'||c==='KeyK'){input.keyTumble=false;return true;}if(c==='Space'){input.keyJump=false;return null;}if(c==='KeyC'){input.keyEvade=false;return null;}return null;}
  if(!gameActive)return['KeyE','Tab','KeyG','KeyM','KeyR','KeyK','Comma','Period'].includes(c)?true:null;
  if(e.repeat)return['KeyE','Tab','KeyR','KeyK'].includes(c)?true:null;
  if(c==='KeyE'){input.dash=true;input.dashAt=clock();input.dashYaw=s.yaw;input.keyDash=true;return true;}
  if(c==='Tab'){input.keyStrafe=true;return true;}
  if(c==='KeyR'||c==='KeyK'){input.keyTumble=true;if(free()||!s.onGround||downState)tumbleMove();return true;}
  if(c==='KeyG'){setWeapon(!weapon.on);return true;}
  if(c==='KeyM'){performArmed();return true;}
  if(c==='Comma'||c==='Period'){cycleArmed(c==='Period'?1:-1);return true;}
  if(c==='Space'){input.keyJump=true;if(input.strafe&&s.onGround&&free())pendingJump=true;return null;}
  if(c==='KeyC'){input.keyEvade=true;return null;}
  return null;
 }
 let pendingJump=false;
 // Called first in threadrailGame.poll with the game's button array; RB, X and LB (and View+LB/RB/X) are Loadout's
 // while he is the hero, so they are cleared from that array in place (Backspool's power handlers never see them).
 function poll(now){
  if(!ready||!isLoadout())return;
  const prev=input.pad,edge=i=>!!now[i]&&!prev[i],released=i=>!now[i]&&!!prev[i],view=!!now[8];input.pad=now.slice();
  const mask=(...ids)=>{for(const i of ids)now[i]=false;};
  if(!gameActive){input.padStrafe=input.padTumble=input.padJump=input.padEvade=false;return;}
  if(view){if(edge(4))setWeapon(!weapon.on);if(edge(5))performArmed();if(edge(2))cycleArmed(1);mask(2,4,5);return;}
  if(edge(5)){input.dash=true;input.dashAt=clock();input.dashYaw=s.yaw;}
  if(input.dash&&now[5]&&clock()-input.dashAt>=.25&&!input.charge&&s.onGround){input.charge=true;}
  if(released(5)&&input.dash){const charge=input.charge;input.dash=false;input.charge=false;if(charge){if(free())dashMove(true);}else if(free()||!s.onGround)dashMove(false);}
  input.padTumble=!!now[2];if(edge(2)&&(free()||!s.onGround||downState))tumbleMove();
  input.padStrafe=!!now[4];
  input.padJump=!!now[0];if(edge(0)&&input.strafe&&s.onGround&&free())pendingJump=true;
  input.padEvade=!!now[13]||!!now[1];
  mask(2,4,5);
 }
 // After the game has handled this frame's jump, a strafe jump gets its Runner overlay.
 function afterPhysics(){if(pendingJump){if(!s.onGround&&s.vel.y>0&&!window.backspoolFlowState?.().action){strafeJumpOverlay();}if(!s.onGround||clock()-(afterPhysics.t0??=clock())>.3){pendingJump=false;afterPhysics.t0=null;}}}

 // ---------- Move List ----------
 function performArmed(){const n=armed.list[armed.index];if(!n)return false;armed.pending=n;return true;}
 function cycleArmed(d){if(!armed.list.length)return;armed.index=(armed.index+d+armed.list.length)%armed.list.length;if(ui){ui.list.value=armed.list[armed.index];ui.status.textContent='Armed: '+armed.list[armed.index];}}
 let ui=null;
 function buildUi(){
  const pane=document.getElementById('v02Pane-hero');if(!pane||ui)return;
  const sec=document.createElement('section');sec.id='loadoutRunnerFull';sec.hidden=true;sec.setAttribute('aria-label','Loadout Runner moves');
  sec.innerHTML='<h3>Runner moves</h3><p id="lrfCount">Loading the Runner pack…</p><div><button id="lrfPace" type="button" role="switch"></button> <button id="lrfTransitions" type="button" role="switch"></button> <button id="lrfWeapon" type="button" role="switch"></button></div>'+
   '<label>Find <input id="lrfFilter" type="search" placeholder="clip name"></label> <label>Family <select id="lrfFamily"><option value="">All families</option></select></label>'+
   '<select id="lrfList" size="8" aria-label="Runner clips" style="width:100%"></select><label><input id="lrfRoot" type="checkbox" checked> Root motion when the clip has it</label> <button id="lrfPerform" type="button">Perform</button><p id="lrfStatus" role="status"></p>'+
   '<p>In play: M (or View+RB) performs the armed clip; , and . (or View+X) choose the next.</p>';
  for(const ev of ['mousedown','mouseup','pointerdown','keydown','keyup'])sec.addEventListener(ev,x=>x.stopPropagation());
  pane.append(sec);
  ui={sec,count:sec.querySelector('#lrfCount'),pace:sec.querySelector('#lrfPace'),trans:sec.querySelector('#lrfTransitions'),weapon:sec.querySelector('#lrfWeapon'),filter:sec.querySelector('#lrfFilter'),family:sec.querySelector('#lrfFamily'),list:sec.querySelector('#lrfList'),root:sec.querySelector('#lrfRoot'),perform:sec.querySelector('#lrfPerform'),status:sec.querySelector('#lrfStatus')};
  ui.pace.onclick=()=>{pace=!pace;writeFlag(PACE_KEY,pace);paint();};ui.trans.onclick=()=>{transitions=!transitions;writeFlag(TRANS_KEY,transitions);paint();};ui.weapon.onclick=()=>setWeapon(!weapon.on);
  ui.filter.oninput=fillList;ui.family.onchange=fillList;ui.list.onchange=()=>{armed.index=Math.max(0,armed.list.indexOf(ui.list.value));ui.status.textContent='Armed: '+ui.list.value;};ui.root.onchange=()=>armed.root=ui.root.checked;
  ui.perform.onclick=()=>{const n=ui.list.value||armed.list[armed.index];if(!n)return;armed.index=Math.max(0,armed.list.indexOf(n));armed.pending=n;ui.status.textContent='Performing '+n;const start=document.getElementById('v02Start')||document.getElementById('start');if(!gameActive&&start)start.click();};
  paint();
 }
 function fillList(){if(!ui||!data)return;const f=ui.filter.value.trim().toLowerCase(),fam=ui.family.value;armed.list=Object.keys(data.clips).filter(n=>(!fam||data.clips[n].family===fam)&&(!f||n.toLowerCase().includes(f))).sort();
  ui.list.innerHTML='';for(const n of armed.list){const o=document.createElement('option');o.value=n;const e=data.clips[n];o.textContent=n+' · '+e.duration.toFixed(2)+'s'+(e.root?.distance>.05?' · '+e.root.distance.toFixed(1)+' m':'')+(e.kind==='root'?' · root':'');ui.list.append(o);}
  armed.index=0;ui.status.textContent=armed.list.length+' clips';}
 function paint(){if(!ui)return;ui.sec.hidden=!isLoadout();ui.pace.textContent='Runner pace · '+(pace?'On':'Off');ui.pace.setAttribute('aria-checked',String(pace));ui.trans.textContent='Runner transitions · '+(transitions?'On':'Off');ui.trans.setAttribute('aria-checked',String(transitions));ui.weapon.textContent='Weapon · '+(weapon.on?'On':'Off');
  if(ready&&ui.family.options.length<2){for(const f of [...new Set(Object.values(data.clips).map(e=>e.family))].sort()){const o=document.createElement('option');o.value=f;o.textContent=f;ui.family.append(o);}fillList();}
  if(ready)ui.count.textContent=data.counts.clips+' clips ('+data.counts.inPlace+' in-place, '+data.counts.root+' root motion), at the pack\'s own speed.';else if(loadError)ui.count.textContent='Runner pack unavailable: '+loadError;}

 // ---------- pace and locomotion roles ----------
 const PACE={walk:'Mvm_Walk',jog:'Mvm_Jog',run:'Mvm_Dash',sprint:'Mvm_Boost'};
 // Loadout's ground target speed (m/s) for updatePlayerLegacy, or null to keep the game's own.
 function paceSpeed(mi){if(!ready||!pace||!isLoadout())return null;if(!mi||mi.mag<=.05)return 0;
  if(inputSprinting())return loopSpeed(PACE.sprint);if(window.backspoolFlow?.walking?.()||mi.mag<.5)return loopSpeed(PACE.walk);return mi.mag<.78?loopSpeed(PACE.jog):loopSpeed(PACE.run);}
 let paceRoles=null;
 function buildPaceRoles(){const base=window.backspoolLocomotionRoles?.roles;if(!base)return null;
  const spec=(role,n,min)=>{const id=clipId(n),sp=loopSpeed(n);bind(n,'locomotion '+role+' (Runner pace)');return{...(base.find(r=>r.role===role)||{}),role,id,duration:bank.clips[id].duration,nominalSpeed:sp,minSpeed:min,pelvisTranslation:false,runnerClip:n,sourcePack:'runner-full',rate:1};};
  const walk=loopSpeed('Mvm_Walk'),jog=loopSpeed('Mvm_Jog'),dash=loopSpeed('Mvm_Dash');
  const out=[spec('walk','Mvm_Walk',0),spec('jog','Mvm_Jog',(walk+jog)/2),spec('run','Mvm_Dash',(jog+dash)/2),spec('fastRun','Mvm_Boost',(dash+loopSpeed('Mvm_Boost'))/2),spec('parkourRun','Mvm_Boost',1e9),spec('parkourSprint','Mvm_Boost',1e9)];
  for(const r of base)if(!out.some(o=>o.role===r.role))out.push({...r,minSpeed:1e9});return out;}
 function wrapRoles(){const key='backspoolLocomotionRoles',baseObj=window[key];if(!baseObj||baseObj.__loadoutRunnerFull)return;const wrapped={...baseObj,__loadoutRunnerFull:true};
  Object.defineProperty(wrapped,'roles',{enumerable:true,get:()=>isLoadout()&&pace&&paceRoles?paceRoles:baseObj.roles});window[key]=wrapped;}
 // The traversal controller's run (6.6 m/s) and Flow sprint (16.36 m/s) are what move Backspool, and Loadout, on the
 // ground; with Runner pace its velocity is scaled to the Runner loop's own speed (its acceleration ramp kept).
 function wrapSprint(){const rt=typeof backspoolTraversalRuntime!=='undefined'?backspoolTraversalRuntime:null;if(!rt||rt.__loadoutRunnerFull)return;const base=rt.sprintVelocity;
  rt.sprintVelocity=(...args)=>{const v=base.apply(rt,args);if(!v||!ready||!pace||!isLoadout())return v;const mi=getMoveInput(),target=paceSpeed(mi);if(target==null)return v;const mag=Math.min(1,mi.mag||0),own=mag*(window.backspoolFlow?.walking?.()&&!inputSprinting()?1.65:inputSprinting()?Math.min(22,Math.max(16.36365,window.backspoolHop?.groundSpeed?.()||0)):6.6);if(own<.05)return v;const k=target/own;return{...v,x:v.x*k,z:v.z*k};};rt.__loadoutRunnerFull=true;}
 // Evade while strafing becomes a Runner side-step, dodge, roll or slide.
 function wrapEvade(){const c=window.backspoolCombat;if(!c||c.__loadoutRunnerFull)return;const base=c.evade.bind(c);c.evade=(...args)=>{if(ready&&isLoadout()&&input.strafe&&free()&&s.onGround&&!c.state().target)return strafeEvade();return base(...args);};c.__loadoutRunnerFull=true;}

 // Wall, air and landing roles for Loadout, chosen per use (rate 1, the clip's own speed).
 // The wall's side from its normal: 'L' when the wall is on his left. Measured in the full-pack test: the Runner
 // LoWall_L clip then leans his head away from the wall (the earlier role mapping picks the opposite clip).
 function wallSide(){const n=window.backspoolAdvancedState?.().wallNormal||window.backspoolFlowState?.().wallNormal;if(!n)return'R';const r=rightOf(s.yaw);return -(n.x*r.x+n.z*r.z)<0?'L':'R';}
 let wallBase=null;
 const latch={};
 function wrapFlowRoles(){const key='backspoolFlowRoles',baseObj=window[key];if(!baseObj||baseObj.__loadoutRunnerFull)return;wallBase=baseObj;const wrapped={...baseObj,__loadoutRunnerFull:true};let table=null,stamp=null;
  const pick={
   wallRun:()=>{const side=wallSide(),high=s.pos.y-supportHeight(s.pos.x,s.pos.z,s.pos.y-.5)>2.2,boost=Math.hypot(s.vel.x,s.vel.z)>9.5;return`${high?'HiWall':'LoWall'}_${side}${boost?'Boost':'Dash'}_Loop`;},
   wallClimb:()=>Math.abs(s.vel.y)>6?'Wall_Vertical_Boost_Loop':'Wall_Vertical_Dash_Loop',
   wallKick:()=>'Wall_Jump_Turn_Air_'+wallSide(),wallFlip:()=>'Wall_Jump_Cross_Air_'+wallSide()};
  const make=()=>{const base=baseObj.roles;return base.map(spec=>{const p=pick[spec.role];if(!p)return spec;const o={...spec,sourcePack:'runner-full',pelvisTranslation:false};
   // The clip is chosen when the role starts and kept while it plays (as the earlier mapping latches its wall side):
   // a new choice only after 0.2 s of game time without the role being read.
   const latched=()=>{const now=clock(),l=latch[spec.role];if(!l||now-l.seen>.2||now<l.seen)latch[spec.role]={name:p(),seen:now};else l.seen=now;return latch[spec.role].name;};
   for(const k of ['id','start','end','duration'])Object.defineProperty(o,k,{enumerable:true,get:()=>{const n=latched(),id=clipId(n);bind(n,'flow role '+spec.role);const d=bank.clips[id].duration;return k==='id'?id:k==='start'?0:d;}});
   Object.defineProperty(o,'playbackRate',{enumerable:true,get:()=>1});return o;});};
  Object.defineProperty(wrapped,'roles',{enumerable:true,get:()=>{if(!isLoadout()||!ready||!transitions)return baseObj.roles;const b=baseObj.roles;if(stamp!==b){stamp=b;table=make();}return table;}});window[key]=wrapped;}

 // ---------- bank ----------
 async function prepare(b){
  const t0=performance.now();bank=b;
  try{
   data=await fetchOk(INDEX).then(r=>r.json());
   const files=Object.keys(data.files);const buffers=await Promise.all(files.map(f=>fetchOk(BASE+f).then(r=>r.arrayBuffer())));
   files.forEach((f,i)=>bins[f]=fflate.gunzipSync(new Uint8Array(buffers[i])));
   ready=true;stats.loaded=true;stats.clips=Object.keys(data.clips).length;
   for(const n of ['Mvm_Walk','Mvm_Jog','Mvm_Dash','Mvm_Boost','Idle_Wait_A'])clipId(n);
   paceRoles=buildPaceRoles();wrapRoles();wrapSprint();wrapEvade();wrapFlowRoles();registerBindings();
  }catch(err){loadError=err.message;console.error('Loadout Runner full pack unavailable',err);}
  stats.buildMs=Math.round(performance.now()-t0);paint();return b;
 }
 // Every clip the gameplay tables above can choose, for the coverage report (the Move List reaches all of them).
 function registerBindings(){
  const D8=['Fwd','Front_R45','Front_R','Back_R45','Back','Back_L45','Back_L','Front_L45','Front_L'];
  for(const tier of ['walk','jog','dash','boost','chargeDash','chargeBoost'])for(const d of D8){bind(LOOP[tier](d),'strafe '+tier+' loop');if(tier==='walk'||tier==='jog')bind(START(tier,d),'strafe start');bind(STOP(tier,d),'strafe stop');}
  bind('Mvm_Walk_Front','strafe walk loop');bind('Mvm_Wp_ChargeBoost','weapon charge loop');bind('Idle_Wait_A','strafe idle');bind('Attack_Hand_Ready','strafe idle with a lock-on target');
  for(const d of D8){bind('Esc_BoostDash_'+ESC(d),'RB dash');bind('Esc_BoostDash_Air_'+ESC(d),'RB air dash');if(FIVE(d)){bind('Mvm_PowerDash_'+FIVE(d),'RB dash in Flow');bind('Mvm_PWChargeDash_'+FIVE(d),'RB hold-release charge dash');}}
  for(const x of ['Front_Ad','Back_Ad'])bind('Esc_BoostDash_'+x,'RB double dash'),bind('Esc_BoostDash_Air_'+x,'RB double air dash');
  for(const x of ['Up','Up_Fwd'])bind('Esc_BoostDash_'+x,'RB air dash with Jump held');for(const x of ['Down','Down_Fwd'])bind('Esc_BoostDash_'+x,'RB air dash with LB held');
  for(const x of ['Mvm_Wp_ChargeDash','Mvm_Wp_ChargeDash_2'])bind(x,'RB dash in weapon mode');
  for(const x of ['Tum_F_HandSpring_Start','Tum_F_HandSpring_Loop','Tum_F_HandSpring_End','Tum_B_HandSpring_Start','Tum_B_HandSpring_Loop','Tum_B_HandSpring_End','Tum_B_HandSpring_Turn_Start','Tum_B_HandSpring_Air_End','Tum_B_HandSpring_3Turn_All','Tum_B_HandSpring_4Turn_All','Tum_RackSpring','Tum_RackSpring_BackDown'])bind(x,'X tumble');
  for(const p of ['Jmp_FrontAir_Roll','Jmp_BackAir_Roll'])for(const k of ['_Start','_Loop','_End'])bind(p+k,'X air roll');
  for(const x of ['WpAttack_Rolling_All','WpAttack_Rolling'])bind(x,'X in weapon mode');
  for(const side of ['Left','Right']){for(const x of ['Esc_StandDodge_','Esc_StandMove_','Esc_TurnDodge_','Esc_StandRoll_','Esc_Roll_','Esc_Dodge_','Esc_Move_','Esc_Slide_'])bind(x+side,'strafe evade');for(const x of ['Esc_Roll_','Esc_Dodge_','Esc_Move_'])bind(x+side+'_Fwd_Root','strafe evade at speed');
   for(const x of ['Jmp_TurnAir_','Jmp_Move_'])for(const k of ['_Start','_Keep',''])bind(x+side+k,'strafe jump');for(const x of ['Mvm_Walk_Arc_180_','Mvm_Walk_Arc_Fwd_'])bind(x+side,'auto turn');
   for(const T of ['Jog','Dash','Boost']){bind(`Mvm_${T}_Arc_90_${side}`,'auto 90-degree arc');bind(`Mvm_${T}_Arc_Fwd_${side}`,'auto quick arc');}
   for(const T of ['Walk','Jog','Dash','Boost'])for(const t of ['L','R'])bind(`Mvm_${T}_Turn${t}_180_${side}`,'auto 180-degree turn');
   bind('Dam_FlyDie_'+side,'death in the air');}
  for(const x of ['Esc_StandRoll_Front','Esc_StandRoll_JFront','Esc_StandRoll_Back','Esc_Roll_Front','Esc_Roll_JFront','Esc_Roll_Back','Esc_Slide_Start','Esc_Slide_End','Esc_Slide_Keep_Short','Esc_Slide_Keep_Middle','Esc_Slide_Keep_Long','Esc_Slide_Loop_OffHand'])bind(x,'strafe evade');
  for(const p of ['Jmp_BackAir','Jmp_SideAir_C','Jmp_Roll_Front','Jmp_FrontAir_A','Jmp_FrontAir_B','Jmp_Base_A','Jmp_Base_B'])for(const k of ['_Start','_Keep','_End',''])bind(p+k,'strafe jump');
  for(const T of ['Walk','Jog'])for(const x of ['Start_Fwd','Start_L90','Start_R90','Start_L180','Start_R180'])bind(`Mvm_${T}_${x}`,'auto start');
  for(const v of ['A','B','C'])for(const t of ['L','R'])for(const a of [90,180])bind(`Mvm_Idle_${v}_Turn${t}_${a}`,'auto idle turn');
  for(const f of ['L','R']){bind('Mvm_DashEnd_'+f,'auto stop');for(const T of ['Jog','Walk'])for(const h of ['','H'])bind(`Mvm_${T}End_${f}${h}`,'auto stop');}bind('Mvm_BoostEnd','auto stop');
  for(const x of ['Dam_SlideDie','Dam_StandDie','Dam_TurnDie','Dam_JumpDie_Over_Start','Dam_JumpDie_Over_Keep','Dam_JumpDie_Over_End','Dam_StandDie_Over_Start','Dam_StandDie_Over_Keep','Dam_StandDie_Over_End','Dam_StandDie_Over2_Start','Dam_StandDie_Over2_Keep','Dam_StandDie_Over2_End'])bind(x,'death by context');
  for(const s1 of ['L','R'])for(const h of ['HiWall','LoWall'])for(const k of ['Dash','Boost'])bind(`${h}_${s1}${k}_Loop`,'flow role wallRun');
  for(const x of ['Wall_Vertical_Dash_Loop','Wall_Vertical_Boost_Loop'])bind(x,'flow role wallClimb');for(const s1 of ['L','R']){bind('Wall_Jump_Turn_Air_'+s1,'flow role wallKick');bind('Wall_Jump_Cross_Air_'+s1,'flow role wallFlip');}
  // The 56-clip role mapping that stays in place (game_v02_loadout_runner_moves.js).
  const old=window.loadoutRunnerMoves?.state?.();for(const n of ['Idle_Wait_A','Idle_Wait_B','Idle_Wait_C','Mvm_Walk','Mvm_Jog','Mvm_Dash','Mvm_Boost','Mvm_Jog_Start_Fwd','Mvm_Jog_Start_L180','Mvm_JogStop','Mvm_BoostEnd','Mvm_WalkStop','Mvm_Jog_TurnL_180_Left','Mvm_Boost_TurnL_180_Left','Jmp_Base_A','Jmp_FrontAir_A','Jump_Down_A_Loop','Jmp_Base_B','Land_Base_Wait','Land_Base_Move','Land_Stumble_Move','Land_Spawn_Wait','Land_Roll_Move','Esc_Roll_Front','Esc_Roll_Left','Esc_Roll_Right','Esc_Roll_Back','Esc_BoostDash_Back','Jmp_FrontAir_Roll_All','Jmp_BackAir_Roll_All','Jmp_SideAir_A','Jmp_SideAir_B','Wall_Jump_Turn_Air_R','Esc_Slide_All','LoWall_LDash_Loop','LoWall_RDash_Loop','Wall_Vertical_Dash_Loop','Wall_Vertical_Boost','Wall_Jump_Turn_Air_L','Wall_Jump_Cross_Air_L','Dam_Stand_Stumble','Attack_Hand_1R','Attack_Hand_2L','Attack_Hand_PwR','Attack_Kick_A','Attack_Kick_B','Attack_Kick_C','JAttack_AirFront','JAttack_AirDrop_All'])bind(n,'role mapping of the Loadout Runner build');void old;
  bind('Esc_Spawn','respawn');bind('Dam_StandUp','stand-up after a death');
 }
 const buildBank=hero.buildBank;hero.buildBank=async ctx=>prepare(await buildBank(ctx));
 // Respawn: stand-up after a death in place, spawn after a reset.
 let respawnedAt=0;
 // After resetPlayer: a Loadout who was down stands up, otherwise he spawns in (Esc_Spawn), in place.
 function respawned(){if(!ready||!isLoadout())return;const wasDown=!!downState;downState=null;wasDead=false;act=null;strafe=null;overlay=null;respawnedAt=clock();perform(wasDown?'Dam_StandUp':'Esc_Spawn',{source:'respawn',root:false});}
 if(typeof window.resetPlayer==='function'&&!window.resetPlayer.__loadoutRunnerFull){const base=window.resetPlayer;window.resetPlayer=function(...args){const r=base.apply(this,args);try{respawned();}catch(err){console.error(err);}return r;};window.resetPlayer.__loadoutRunnerFull=true;}
 setInterval(()=>{buildUi();paint();},500);

 window.loadoutRunnerFull={tick,animate,handleKey,poll,afterPhysics,paceSpeed,perform,respawned,setWeapon,setPace:v=>{pace=!!v;writeFlag(PACE_KEY,pace);paint();return pace;},setTransitions:v=>{transitions=!!v;writeFlag(TRANS_KEY,transitions);paint();return transitions;},
  catalog:()=>data,decode,bindings:()=>Object.fromEntries([...bindings].map(([k,v])=>[k,[...v]])),
  state:()=>({...stats,ready,loadError,active:isLoadout(),pace,transitions,weapon:weapon.on,weaponWindows:Object.fromEntries(Object.entries(weapon.windows).map(([k,w])=>[k,{runnerClip:w.runnerClip,window:w.window,strikeFraction:w.strikeFraction,contactFraction:w.contactFraction}])),
   action:act?{clip:act.name,asked:act.asked,t:+act.t.toFixed(3),duration:+act.duration.toFixed(3),phase:act.phase,source:act.source,travels:act.travels,air:act.air,blocked:act.blocked,rate:currentAction?.getEffectiveTimeScale?.()??null}:null,
   strafe:strafe?{tier:strafe.tier,dir:strafe.dir,loop:strafe.loop,speed:strafe.speed,moving:strafe.moving}:null,overlay:overlay?{clip:overlay.name,phase:overlay.phase}:null,input:{strafe:input.strafe,dash:input.dash,charge:input.charge,tumble:input.tumble},
   playing:typeof currentAnim==='string'?currentAnim:null,timeScale:currentAction?.getEffectiveTimeScale?.()??null,armed:armed.list[armed.index]||null,bound:bindings.size,down:!!downState})};
})();
