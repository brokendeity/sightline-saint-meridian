/* LOADOUT's own gameplay layer, Phase 1 ("Core/Socket Interface" design, the user's brief of 2026-11-11). Active only
 * while Loadout is the hero; owns its own power state (HP / MP / STA, injuries, Loadouts and Forms, the registered
 * baton, XP, Analyze, quest interpretation). Shared runtime it uses, never owns: the movement owner and the Runner pack
 * (window.loadoutRunnerFull.perform / setWeapon) for his clips, window.combatants for targets and damage. It never
 * touches Backspool's powers, combat styles or courier trauma, so nothing leaks between heroes.
 *
 * Keyboard / mouse (Loadout only; these keys did Backspool things Loadout cannot use, or nothing):
 *   1-4        Forms of the active Loadout (explicit Skill commands: distance, facing, stamina, body condition apply)
 *   Q          tap: hotswap to the other Loadout (0.7 s, vulnerable: hits do 1.5x and interrupt it)
 *              hold: Loadout wheel (1 / 2 choose while held)
 *   RMB hold   Analyze the construct: brackets, observed habits, Ghost Builds of its possible attacks (MP drain)
 *   V hold     guard (an overhead blocked with the arms injures the right forearm)
 *   X          tap: draw / stow the registered baton (socket 01; durability persists, it can break)
 *   B          tap: Status glance; hold: Body Inspection (stays open while held)
 *   J          Quest interpretation panel
 *   I hold     (near the trapped worker) free him - the Interface's primary Quest leaves him out (OFF-SCRIPT)
 *   T          start / restart the sparring encounter
 * Gamepad: NOT mapped in Phase 1 (the brief's controller map collides with the shared pad map; see the notes file).
 * Design intent not built in Phase 1: camera moves for Body Inspection / Inventory, the 8-section Core Wheel, Deep
 * Scan, Pursuit routes, Shop, Titles, Conditions (OUTCLASSED), violet anomalies. */
(()=>{
 'use strict';
 const V3=THREE.Vector3,UP=new V3(0,1,0);
 const SAVE='loadoutInterfaceV1';
 const isLoadout=()=>{const c=window.characterState?.();return !!c&&c.hero==='loadout'&&!c.busy;};
 const runner=()=>window.loadoutRunnerFull;
 const fwd=()=>new V3(-Math.sin(s.yaw),0,-Math.cos(s.yaw));
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

 // ---------- Loadouts and Forms (clips are Runner Action pack placeholders; the role -> clip map is swappable) ----------
 const FORMS={
  slip:{name:'Slip Counter',clip:'Attack_Hand_2L',parts:['leftArm'],heavy:false,sta:14,dmg:14,impact:.42,reach:2.4,counter:true},
  tempo:{name:'Tempo Jab',clip:'Attack_Hand_1R',batonClip:'WpAttack_Hand_1R',parts:['rightArm'],heavy:false,sta:8,dmg:8,impact:.38,reach:2.4,bait:true},
  cross:{name:'Power Cross',clip:'Attack_Hand_PwR',batonClip:'WpAttack_Hand_PwR',parts:['rightArm'],heavy:true,sta:22,dmg:26,impact:.45,reach:2.4},
  feint:{name:'Feint Step',clip:'Esc_StandDodge_Left',parts:['legs'],heavy:false,sta:10,dmg:0,impact:.3,reach:3.2,feint:true},
  clinch:{name:'Clinch Entry',clip:'Attack_Hand_Ready',parts:['leftArm','rightArm'],heavy:false,sta:14,dmg:4,impact:.5,reach:2.2,clinch:true},
  sweep:{name:'Balance Break',clip:'Attack_Kick_B',parts:['legs'],heavy:true,sta:20,dmg:16,impact:.42,reach:2.4,needsClinch:true,knockdown:true},
  throw:{name:'Grip Throw',clip:'Attack_Hand_PwR',parts:['rightArm','torso'],heavy:true,sta:24,dmg:38,impact:.45,reach:2.2,needsClinch:true,knockdown:true},
  frame:{name:'Frame Off',clip:'Esc_StandRoll_Back',parts:['legs'],heavy:false,sta:12,dmg:0,impact:.2,reach:9,escape:true}
 };
 const LOADOUTS=[
  {id:'box',name:'COUNTER / BOX',blurb:'Punching trajectories, slips, counters',forms:['slip','tempo','cross','feint']},
  {id:'grapple',name:'GRAPPLE / CONTROL',blurb:'Clinch entries, grips, balance breaks',forms:['clinch','sweep','throw','frame']}
 ];
 const LOCKED=[{name:'PURSUIT',blurb:'Not prepared (Phase 6)'},{name:'RESCUE',blurb:'Not prepared'}];
 const PARTS={rightArm:'Right forearm',leftArm:'Left arm',legs:'Legs',torso:'Torso'};

 // ---------- the construct's attacks (what it can actually do; Analyze only estimates which one) ----------
 const ATTACKS={
  jab:{name:'Lead jab',clip:'Attack_Hand_1R',windup:.45,impactFrac:.38,dmg:7,cue:'high',weight:.4},
  overhead:{name:'Overhead strike',clip:'Attack_Hand_PwR',windup:.85,impactFrac:.45,dmg:16,cue:'high',weight:.25,heavy:true},
  sweep:{name:'Low sweep',clip:'Attack_Kick_B',windup:.6,impactFrac:.42,dmg:9,cue:'low',weight:.2},
  grab:{name:'Feint into grab',clip:'Attack_Hand_2L',windup:.85,impactFrac:.42,dmg:12,cue:'high',weight:.15,unblockable:true}
 };
 const ATTACK_IDS=Object.keys(ATTACKS);

 // ---------- state ----------
 const saved=(()=>{try{return JSON.parse(localStorage.getItem(SAVE))||{};}catch(e){return {};}})();
 const st={hp:100,mp:100,sta:100,
  body:{rightArm:100,leftArm:100,legs:100,torso:100},
  loadout:0,prevLoadout:1,swap:null,wheel:null,form:null,guard:false,analyze:false,
  baton:{registered:true,out:false,durability:saved.baton?.durability??12,max:12,broken:!!saved.baton?.broken},
  xp:saved.xp??0,level:saved.level??11,echo:saved.echo??{grab:0},
  log:[],enc:null,lastFormAt:{},combo:null,questOpen:false,statusUntil:0,statusHeld:false,
  stats:{forms:0,hits:0,counters:0,swaps:0,swapInterrupts:0,failed:0,hitsTaken:0,guarded:0,evaded:0,analyzeSeconds:0,predictions:0,predictedRight:0}};
 const persist=()=>{try{localStorage.setItem(SAVE,JSON.stringify({xp:st.xp,level:st.level,echo:st.echo,baton:{durability:st.baton.durability,broken:st.baton.broken}}));}catch(e){}};
 let clock=0,wasLoadout=false;
 function log(text,kind='info'){st.log.push({t:+clock.toFixed(2),text,kind});if(st.log.length>40)st.log.shift();paintLog();}
 function xp(amount,why){if(amount<=0)return;const before=st.level;st.xp+=amount;log('+'+amount+' XP · '+why,'xp');
  while(st.xp>=xpFor(st.level+1)){st.level++;log('LEVEL '+(st.level-1)+' → '+st.level+' · INTERFACE CAPACITY EXPANDED','level');}
  if(st.level!==before)flash('LEVEL '+before+' → '+st.level,'INTERFACE CAPACITY EXPANDED');persist();}
 const xpFor=l=>(l-10)*250;
 const integrity=p=>st.body[p];
 function reliability(f){return Math.min(...f.parts.map(p=>integrity(p)))/100;}
 const compromised=lo=>LOADOUTS[lo].forms.filter(id=>FORMS[id].heavy?reliability(FORMS[id])<.75:reliability(FORMS[id])<.8);

 // ---------- the encounter: a Halo sparring construct, a trapped worker, the Interface's quest ----------
 const assets={status:'idle',error:null,clips:{},ghostClips:{}};
 let fighterSrc=null;
 async function ab(url){const r=await fetch(url);if(!r.ok)throw Error('Loadout Interface asset unavailable: '+url);return r.arrayBuffer();}
 function normalise(o){o.updateMatrixWorld(true);let b=new THREE.Box3().setFromObject(o);o.scale.setScalar(1.82/b.getSize(new V3()).y);o.updateMatrixWorld(true);b.setFromObject(o);const c=b.getCenter(new V3());o.position.set(-c.x,-b.min.y,-c.z);o.updateMatrixWorld(true);}
 function facing(o){o.updateMatrixWorld(true);const l=o.getObjectByName('mixamorigLeftArm').getWorldPosition(new V3()),r=o.getObjectByName('mixamorigRightArm').getWorldPosition(new V3());const f=l.sub(r).cross(UP);return Math.atan2(f.x,f.z);}
 // The construct's body: the Mixamo-rigged Tripo humanoid (assets/characters/kinsmoke/nocape), every material replaced by
 // a featureless charcoal construct material, so it reads as a training construct, not as a hero.
 const CONSTRUCT_URL='assets/characters/kinsmoke/nocape/tripo_convert_5e340a7e-aa7c-4879-b2c9-57dcf89d2608.fbx',CONSTRUCT_DIR='assets/characters/kinsmoke/nocape/';
 async function loadAssets(){
  if(assets.status==='ready')return;if(assets.promise)return assets.promise;
  assets.status='loading';
  assets.promise=(async()=>{
   if(!runner()?.catalog?.())throw Error('the Runner pack is not loaded yet');
   const [fb,lb]=await Promise.all([ab(CONSTRUCT_URL),ab('assets/loadout/loadout_caped.fbx')]);
   fighterSrc=fb;
   const skin=new THREE.FBXLoader().parse(fb,CONSTRUCT_DIR),lo=new THREE.FBXLoader().parse(lb,'assets/loadout/');
   normalise(skin);normalise(lo);skin.rotation.y=-facing(skin);skin.updateMatrixWorld(true);lo.rotation.y=facing(skin)-facing(lo);lo.updateMatrixWorld(true);
   const re=window.kinsmokeHero?.retargetLike||MixamoRetarget.retargetClip;
   const names=new Set(['Idle_Wait_A','Attack_Hand_Ready','Dam_Stand_Stumble','Dam_StandDie','Dam_StandUp',...ATTACK_IDS.map(a=>ATTACKS[a].clip)]);
   for(const n of names)assets.clips[n]=re(runner().decode(n),lo,skin,{name:'lc-'+n,inPlace:true});
   lo.traverse(x=>{if(x.isMesh){x.geometry.dispose();for(const m of [].concat(x.material))m.dispose();}});
   assets.template=skin;assets.status='ready';
  })().catch(e=>{assets.status='error';assets.error=String(e.message||e);assets.promise=null;throw e;});
  return assets.promise;
 }
 function makeBody(material){
  const o=new THREE.FBXLoader().parse(fighterSrc,CONSTRUCT_DIR);normalise(o);o.rotation.y=-facing(o);o.updateMatrixWorld(true);
  o.traverse(m=>{if(m.isMesh){m.material=material.clone();m.frustumCulled=false;m.castShadow=!material.transparent;}});return o;
 }
 function groundAt(x,z,hint){try{return typeof actorGroundHeight==='function'?actorGroundHeight(x,z,hint):hint;}catch(e){return hint;}}
 function spawnEncounter(){
  if(assets.status!=='ready')return false;
  clearEncounter(false);
  const f=fwd(),right=new V3(-f.z,0,f.x),feet=s.pos.y-.42;
  const home=s.pos.clone().addScaledVector(f,5.5);home.y=groundAt(home.x,home.z,feet);
  if(Math.abs(home.y-feet)>.6){log('Find clear, level ground for the encounter.','warn');return false;}
  const group=new THREE.Group();group.position.copy(home);scene.add(group);
  const body=makeBody(new THREE.MeshStandardMaterial({color:0x1d2129,roughness:.7,metalness:.25,emissive:0x3a0d08,emissiveIntensity:.35,skinning:true}));group.add(body);
  const core=new THREE.Object3D();core.position.y=1.15;group.add(core);
  const mixer=new THREE.AnimationMixer(body);
  const t={id:'loadout-construct',name:'Halo sparring construct',faction:'halo',practice:true,hp:300,maxHp:300,group,core,body,mixer,
   ai:'ready',aiT:1.4,aiAttack:null,cooldown:0,clinch:0,down:0,recover:0,whiffs:0,home:home.clone(),
   seen:Object.fromEntries(ATTACK_IDS.map(a=>[a,0])),jabCounterReady:false,lastPlayerTempo:[],action:null,counterPending:0};
  play(t,'Attack_Hand_Ready',true);
  window.combatants?.register?.(t);
  // ghosts: one cyan projected pose per possible attack, posed at that attack's impact frame
  const ghosts={};
  for(const a of ATTACK_IDS){const g=new THREE.Group();const gb=makeBody(new THREE.MeshBasicMaterial({color:0x5fe3e8,transparent:true,opacity:0,depthWrite:false,skinning:true,toneMapped:false}));g.add(gb);
   const gm=new THREE.AnimationMixer(gb),act=gm.clipAction(assets.clips[ATTACKS[a].clip]);act.play();gm.setTime(assets.clips[ATTACKS[a].clip].duration*ATTACKS[a].impactFrac);
   g.visible=false;scene.add(g);ghosts[a]={group:g,body:gb,opacity:0,p:0};}
  // the trapped worker: a plain figure under a fallen panel, left of the fight (visual only, no collider)
  const wpos=home.clone().addScaledVector(right,-7).addScaledVector(f,-1.5);wpos.y=groundAt(wpos.x,wpos.z,feet);
  const worker=new THREE.Group();worker.position.copy(wpos);
  const wmat=new THREE.MeshToonMaterial({color:0xc9862c});const torso=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,1,10),wmat);torso.rotation.z=Math.PI/2.3;torso.position.set(0,.35,0);worker.add(torso);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.16,12,10),new THREE.MeshToonMaterial({color:0x6b4a32}));head.position.set(.55,.5,0);worker.add(head);
  const panel=new THREE.Mesh(new THREE.BoxGeometry(1.6,.08,1.1),new THREE.MeshToonMaterial({color:0x37404c}));panel.position.set(-.1,.62,0);panel.rotation.z=.22;worker.add(panel);
  const ring=new THREE.Mesh(new THREE.RingGeometry(.9,1.05,32),new THREE.MeshBasicMaterial({color:0xffb43c,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false,toneMapped:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.06;worker.add(ring);
  scene.add(worker);
  st.enc={t,ghosts,worker:{group:worker,ring,panel,heard:false,freed:false,progress:0,leaving:0},clock:0,outcome:'active',voiceAt:6,startHp:st.hp,
   questAccepted:null,offScript:false,defeatedAt:null,summary:null};
  log('Encounter · Halo sparring construct · hold RMB to Analyze','quest');
  setQuest();return true;
 }
 function clearEncounter(keepLog=true){
  const e=st.enc;if(!e)return;
  for(const g of Object.values(e.ghosts)){scene.remove(g.group);g.group.traverse(o=>{o.geometry?.dispose();o.material?.dispose?.();});}
  e.t.hp=0;e.t.dead=true;scene.remove(e.t.group);e.t.group.traverse(o=>{o.geometry?.dispose();o.material?.dispose?.();});
  try{window.combatants?.remove?.(e.t);}catch(_){}
  scene.remove(e.worker.group);e.worker.group.traverse(o=>{o.geometry?.dispose();o.material?.dispose?.();});
  st.enc=null;st.analyze=false;paintBrackets();setQuest();
 }
 function play(t,clip,loop,fade=.15,timeScale=1){
  const c=assets.clips[clip];if(!c)return;const a=t.mixer.clipAction(c);
  if(t.action&&t.action!==a)t.action.fadeOut(fade);
  a.reset();a.setLoop(loop?THREE.LoopRepeat:THREE.LoopOnce,Infinity);a.clampWhenFinished=!loop;a.setEffectiveTimeScale(timeScale);a.setEffectiveWeight(1);a.fadeIn(fade).play();t.action=a;t.clip=clip;
 }

 // ---------- construct AI ----------
 function chooseAttack(t){
  // its real habits; and once it has seen the Tempo Jab twice it counters the next one at once (see playerForm)
  let r=Math.random(),acc=0;for(const a of ATTACK_IDS){acc+=ATTACKS[a].weight;if(r<=acc)return a;}return 'jab';
 }
 function startAttack(t,a,quick=false){
  const A=ATTACKS[a];t.ai='windup';t.aiAttack=a;t.aiWind=quick?.3:A.windup;t.aiT=t.aiWind;t.committed=false;t.counterOpen=false;
  const c=assets.clips[A.clip];play(t,A.clip,false,.12,(c.duration*A.impactFrac)/t.aiWind);
  if(st.analyze)t.analyzedThis=true;else t.analyzedThis=false;
 }
 function tickConstruct(dt){
  const e=st.enc,t=e?.t;if(!t)return;
  if(t.hp<=0||t.dead){if(e.outcome==='active'){e.outcome='construct down';e.defeatedAt=e.clock;t.group.visible=true;play(t,'Dam_StandDie',false);finish();}t.mixer.update(dt);return;}
  t.mixer.update(dt);
  const toP=s.pos.clone().sub(t.group.position);toP.y=0;const dist=toP.length();const dir=dist>1e-4?toP.clone().multiplyScalar(1/dist):new V3(0,0,1);
  if(t.stun>0){t.stun-=dt;}
  if(t.down>0){t.down-=dt;if(t.down<=0){play(t,'Dam_StandUp',false);t.ai='recover';t.aiT=1.0;}return;}
  if(t.clinch>0){t.clinch-=dt;t.ai='clinched';if(t.clinch<=0){t.ai='recover';t.aiT=.5;play(t,'Attack_Hand_Ready',true);}return;}
  // face the player (not during the strike itself)
  if(t.ai!=='strike'){const want=Math.atan2(dir.x,dir.z);let d=want-t.group.rotation.y;d=Math.atan2(Math.sin(d),Math.cos(d));t.group.rotation.y+=d*Math.min(1,dt*8);}
  if(t.ai==='ready'){
   // approach to striking range along the ground, never further than 12 m from home
   if(dist>1.75){const step=Math.min(dist-1.7,2.6*dt);const next=t.group.position.clone().addScaledVector(dir,step);if(next.distanceTo(t.home)<12){next.y=groundAt(next.x,next.z,t.group.position.y);if(Math.abs(next.y-t.group.position.y)<.25)t.group.position.copy(next);}}
   t.aiT-=dt;if(t.aiT<=0&&dist<2.6&&!(t.stun>0))startAttack(t,chooseAttack(t));
  }else if(t.ai==='windup'){
   t.aiT-=dt;if(!t.committed&&t.aiT<=t.aiWind*.4){t.committed=true;t.counterOpen=true;}
   if(t.stun>0&&!ATTACKS[t.aiAttack].heavy){t.ai='recover';t.aiT=.6;play(t,'Dam_Stand_Stumble',false);log('Construct interrupted','combat');return;}
   if(t.aiT<=0)strike(t,dist,dir);
  }else if(t.ai==='strike'){t.aiT-=dt;if(t.aiT<=0){t.ai='recover';t.aiT=.55;t.counterOpen=false;}}
  else if(t.ai==='recover'||t.ai==='whiff'){t.aiT-=dt;if(t.aiT<=0){t.ai='ready';t.aiT=.7+Math.random()*.8;t.counterOpen=false;play(t,'Attack_Hand_Ready',true);}}
 }
 function strike(t,dist,dir){
  const A=ATTACKS[t.aiAttack];t.ai='strike';t.aiT=.25;t.counterOpen=true;
  // observed (and learnable) only while Analyze was active during the windup
  if(t.analyzedThis){t.seen[t.aiAttack]++;if(t.aiAttack==='grab'){st.echo.grab=Math.min(3,(st.echo.grab||0)+1);log('Movement Echo recorded · '+A.name+' '+st.echo.grab+'/3','skill');if(st.echo.grab===3){xp(45,'Skill acquisition · Grip Reversal (incomplete Form)');}persist();}}
  const facingOk=new V3(Math.sin(t.group.rotation.y),0,Math.cos(t.group.rotation.y)).dot(dir.clone().negate())<-.5;
  if(dist>2.3||!facingOk){log('Construct whiffs · '+A.name,'combat');t.ai='whiff';t.aiT=.9;return;}
  if(playerEvading()){st.stats.evaded++;log('Evaded · '+A.name,'combat');t.ai='whiff';t.aiT=.9;return;}
  let dmg=A.dmg;const guarded=st.guard&&!A.unblockable;
  if(guarded){st.stats.guarded++;dmg*=.3;if(t.aiAttack==='overhead'){injure('rightArm',14,'RightForearm → BluntImpact → StructuralStress');}}
  else{if(t.aiAttack==='sweep')injure('legs',10,'Legs → Sweep → Balance');else if(t.aiAttack==='grab')injure('torso',8,'Torso → Grip → Compression');else if(t.aiAttack==='overhead')injure('rightArm',8,'RightForearm → BluntImpact');}
  if(st.swap){dmg*=1.5;st.swap=null;st.stats.swapInterrupts++;log('HOTSWAP INTERRUPTED · still '+LOADOUTS[st.loadout].name,'warn');}
  if(st.form&&!st.form.done){st.form.interrupted=true;}
  hurt(dmg,A.name+(guarded?' (guarded)':''));
 }
 function playerEvading(){if(st.form&&!st.form.done&&st.form.f.counter&&st.form.t<st.form.impact+.12)return true;// Slip Counter slips the strike, then counters
  const a=runner()?.state?.().action;if(a&&/^(Esc_|Tum_)/.test(a.clip)&&a.t<a.duration*.75)return true;return !!(window.backspoolCombatState?.().evading);}
 function injure(part,amount,event){const b=st.body[part];st.body[part]=Math.max(20,b-amount);log(event+' · '+PARTS[part]+' '+Math.round(st.body[part])+'%','injury');
  const lo=st.loadout,c=compromised(lo);if(c.length)log(LOADOUTS[lo].name+' — '+c.length+' FORM'+(c.length>1?'S':'')+' COMPROMISED · B: Status','warn');}
 function hurt(dmg,what){st.stats.hitsTaken++;st.hp=Math.max(0,st.hp-dmg);log('Hit · '+what+' · −'+Math.round(dmg)+' HP','hit');
  if(st.hp<=0&&st.enc?.outcome==='active'){st.enc.outcome='LOADOUT down';log('LOADOUT DOWN · T to restart','warn');runner()?.perform?.('Dam_Stand_Stumble',{root:false,source:'loadout-interface'});finish();}}

 // ---------- the player's Forms ----------
 function nearestTarget(maxD=25){const t=st.enc?.t;if(!t||t.dead||t.hp<=0)return null;const d=t.group.position.distanceTo(s.pos);return d<=maxD?t:null;}
 function useForm(slot){
  const lo=LOADOUTS[st.loadout],id=lo.forms[slot];if(!id)return false;const f=FORMS[id];
  if(st.swap){log('Hotswap in progress · Forms offline','warn');return false;}
  if(st.form&&!st.form.done){return false;}
  if(st.sta<f.sta){log(f.name+' · not enough stamina','warn');return false;}
  if(!s.onGround){log(f.name+' · needs footing','warn');return false;}
  const t=nearestTarget(6),rel=reliability(f);
  if(f.needsClinch&&!(t&&t.clinch>0)){log(f.name+' · needs a clinch (Clinch Entry first)','warn');return false;}
  if(t){const d=t.group.position.clone().sub(s.pos);d.y=0;if(d.lengthSq()>1e-4)s.yaw=Math.atan2(-d.x,-d.z);}
  const useBaton=st.baton.out&&f.batonClip;const clip=useBaton?f.batonClip:f.clip;
  if(!runner()?.perform?.(clip,{root:false,source:'loadout-form'})){log(f.name+' · clip unavailable','warn');return false;}
  const dur=runner().catalog().clips[clip]?.duration||1;
  st.sta-=f.sta;st.stats.forms++;st.form={id,f,clip,t:0,dur,impact:f.impact*dur,done:false,hit:false,baton:useBaton,rel};
  // the construct reads repeated Tempo Jabs: after two it prepares a counter to the next lead
  if(t){const now=clock;t.lastPlayerTempo=t.lastPlayerTempo.filter(x=>now-x<10);
   if(f.bait){if(t.jabCounterReady&&t.ai==='ready'){t.counterPending=.18;}t.lastPlayerTempo.push(now);if(t.lastPlayerTempo.length>=2&&!t.jabCounterReady){t.jabCounterReady=true;log('Analyze · construct pattern: counters your lead jab','analyze');}}
   if(f.feint&&t.jabCounterReady&&t.ai==='ready'&&t.group.position.distanceTo(s.pos)<3.2){t.counterPending=.12;st.form.baitedCounter=true;}}
  st.lastFormAt[id]=clock;
  return true;
 }
 function tickForm(dt){
  const F=st.form;if(!F||F.done)return;F.t+=dt;
  if(!F.hit&&F.t>=F.impact&&!F.interrupted){F.hit=true;resolveForm(F);}
  if(F.t>=F.dur||F.interrupted){F.done=true;}
 }
 function resolveForm(F){
  const f=F.f,t=nearestTarget(f.reach+.6);
  if(f.escape){if(t&&t.clinch>0){t.clinch=0;}log(f.name+' · distance created','combat');return;}
  if(f.feint){if(F.baitedCounter&&t){log('Feint · the construct counters empty air — it is open','combat');t.ai='whiff';t.aiT=1.1;t.counterOpen=true;st.combo={kind:'opened',at:clock};xp(25,'Combat understanding · baited a learned counter');}else log('Feint Step','combat');return;}
  if(!t){log(f.name+' · no target in reach','combat');return;}
  const d=t.group.position.clone().sub(s.pos);d.y=0;const dist=d.length();
  if(dist>f.reach||fwd().dot(d.normalize())<Math.cos(70*Math.PI/180)){log(f.name+' · out of reach','combat');return;}
  if(f.heavy&&F.rel<.75){st.stats.failed++;log(f.name+' · FORM UNRELIABLE · '+f.parts.map(p=>PARTS[p]+' '+Math.round(st.body[p])+'%').join(', '),'warn');st.sta=Math.max(0,st.sta-10);return;}
  let dmg=f.dmg*Math.max(.5,F.rel),label=f.name;
  if(F.baton){if(!st.baton.broken){dmg+=10;st.baton.durability--;if(st.baton.durability<=0){st.baton.broken=true;log('Baton BROKEN · the broken baton stays registered; no replacement','warn');}}else dmg+=2;persist();}
  if(f.counter&&t.counterOpen&&(t.ai==='windup'||t.ai==='strike'||t.ai==='whiff')){dmg*=2.2;label='COUNTER · '+f.name;st.stats.counters++;t.ai='recover';t.aiT=1.0;t.stun=Math.max(t.stun||0,.8);
   if(t.analyzedThis)xp(40,'Combat understanding · read and countered '+ATTACKS[t.aiAttack].name);st.combo={kind:'countered',at:clock};}
  if(f.clinch){if(t.ai==='recover'||t.ai==='whiff'||t.stun>0||t.counterOpen){t.clinch=1.8;log('CLINCH · construct controlled 1.8 s','combat');
    if(st.combo&&clock-st.combo.at<4&&st.combo.swapped)xp(30,'Tactical adaptation · '+(st.combo.kind==='opened'?'feint':'counter')+' → hotswap → clinch');}
   else{log('Clinch Entry · construct not open (counter or feint it first)','combat');dmg=0;}}
  if(f.knockdown&&t.clinch>0){t.clinch=0;t.down=1.6;play(t,'Dam_StandDie',false,.1);label+=' · KNOCKDOWN';}
  if(dmg>0){const r=window.combatants?.damage?.(t,dmg,{attack:{heavy:f.heavy}})||{damage:0};st.stats.hits++;log(label+' · '+Math.round(r.damage)+' dmg'+(F.rel<1?' (reliability '+Math.round(F.rel*100)+'%)':''),'combat');
   if(t.ai!=='clinched'&&!(t.down>0)&&!f.counter&&t.ai!=='windup')play(t,'Dam_Stand_Stumble',false,.08);}
 }
 // construct's prepared counter to a predictable lead
 function tickCounter(dt){const t=st.enc?.t;if(!t||!(t.counterPending>0))return;t.counterPending-=dt;if(t.counterPending<=0){t.counterPending=0;if(t.ai==='ready'||t.ai==='recover')startAttack(t,'jab',true);}}

 // ---------- hotswap ----------
 function swapTo(i){if(i===st.loadout||st.swap)return false;if(st.form&&!st.form.done){log('Hotswap · finish the Form first','warn');return false;}
  st.swap={to:i,t:0,dur:.7};st.stats.swaps++;log('HOTSWAP → '+LOADOUTS[i].name+' · 0.7 s, vulnerable','swap');
  runner()?.perform?.('Attack_Hand_Ready',{root:false,source:'loadout-hotswap'});return true;}
 function tickSwap(dt){const w=st.swap;if(!w)return;w.t+=dt;if(w.t>=w.dur){st.prevLoadout=st.loadout;st.loadout=w.to;st.swap=null;log('Loadout · '+LOADOUTS[st.loadout].name+' online','swap');
  if(st.combo&&clock-st.combo.at<3)st.combo.swapped=true;const c=compromised(st.loadout);if(c.length)log('Compatibility · '+c.length+' Form'+(c.length>1?'s':'')+' compromised by injury','warn');}}

 // ---------- Analyze: brackets, habits, Ghost Builds ----------
 function predictions(t){
  // prior from what Analyze has observed of its habits (Laplace), then the windup cue narrows high vs low
  const seen=t.seen,tot=ATTACK_IDS.reduce((a,k)=>a+seen[k]+1,0);let p=Object.fromEntries(ATTACK_IDS.map(k=>[k,(seen[k]+1)/tot]));
  if(t.ai==='windup'){const prog=1-t.aiT/t.aiWind;if(prog>.35){const cue=ATTACKS[t.aiAttack].cue;for(const k of ATTACK_IDS)if(ATTACKS[k].cue!==cue)p[k]*=.25;}
   if(t.committed){for(const k of ATTACK_IDS)if(k!==t.aiAttack)p[k]*=.05;}}
  const s1=Object.values(p).reduce((a,b)=>a+b,0);for(const k of ATTACK_IDS)p[k]/=s1;return p;
 }
 function tickAnalyze(dt){
  const e=st.enc,t=nearestTarget(25);const on=st.analyze&&!!t&&st.mp>0;
  if(st.analyze){st.mp=Math.max(0,st.mp-10*dt);st.stats.analyzeSeconds+=dt;if(st.mp<=0&&!st.mpEmptyLogged){st.mpEmptyLogged=true;log('MP depleted · Analyze offline','warn');}}else{st.mp=Math.min(100,st.mp+6*dt);st.mpEmptyLogged=false;}
  if(t&&on&&t.ai==='windup')t.analyzedThis=true;
  if(!e)return;
  const p=t?predictions(t):{};
  for(const k of ATTACK_IDS){const g=e.ghosts[k];let want=0;
   if(on&&t&&(t.ai==='windup'||t.ai==='ready')){want=t.ai==='ready'?.04+.12*p[k]:.08+.5*p[k];if(t.committed&&k!==t.aiAttack)want=0;}
   g.opacity+=(want-g.opacity)*Math.min(1,dt*10);g.p=p[k]||0;
   g.group.visible=g.opacity>.01;if(g.group.visible){const i=ATTACK_IDS.indexOf(k)-1.5,r=t.group.rotation.y,right=new V3(Math.cos(r),0,-Math.sin(r));
    g.group.position.copy(t.group.position).addScaledVector(right,i*.75).addScaledVector(new V3(Math.sin(r),0,Math.cos(r)),.35);g.group.rotation.y=r;
    g.body.traverse(o=>{if(o.isMesh)o.material.opacity=g.opacity;});}}
  if(t&&on&&t.ai==='windup'&&t.committed&&!t.predLogged){t.predLogged=true;st.stats.predictions++;const best=ATTACK_IDS.reduce((a,b)=>p[a]>p[b]?a:b);if(best===t.aiAttack)st.stats.predictedRight++;}
  if(t&&t.ai!=='windup')t.predLogged=false;
 }

 // ---------- baton (registered item, socket 01) ----------
 function toggleBaton(){const b=st.baton;if(!b.registered)return;if(st.form&&!st.form.done)return;b.out=!b.out;runner()?.setWeapon?.(b.out);
  log(b.out?'Baton retrieved · socket 01'+(b.broken?' · BROKEN':' · '+b.durability+'/'+b.max):'Baton stowed · socket 01','gear');}

 // ---------- quest interpretation ----------
 function setQuest(){
  const e=st.enc;if(!e){questLine('QUEST · T: start the sparring encounter');return;}
  const w=e.worker;const est=Math.round(clamp(60+ (st.hp-(e.t.hp/3))*.35,5,96));
  if(w.freed)questLine(e.outcome==='active'?'QUEST · OFF-SCRIPT · occupant freed · construct still active':'QUEST · resolved · '+e.outcome);
  else if(w.heard)questLine('PRIMARY QUEST · Neutralise construct · est. '+est+'% · unconfirmed occupant excluded');
  else questLine('PRIMARY QUEST · Neutralise construct · est. '+est+'%');
 }
 function tickQuest(dt){
  const e=st.enc;if(!e)return;e.clock+=dt;const w=e.worker;
  if(!w.heard&&e.clock>=e.voiceAt){w.heard=true;log('Voice detected · unclassified · not in the Quest model','quest');log('PRIMARY QUEST unchanged · unconfirmed occupant: excluded from model','quest');}
  w.ring.material.opacity=w.heard&&!w.freed?.35+.25*Math.sin(clock*6):0;
  const near=w.heard&&!w.freed&&s.pos.distanceTo(w.group.position.clone().setY(s.pos.y))<1.9;st.nearWorker=near;
  if(near&&st.interactHeld){w.progress+=dt/1.5;if(w.progress>=1){w.freed=true;w.leaving=2.5;w.panel.rotation.z=.9;w.panel.position.y=.25;e.offScript=e.outcome==='active';
    log(e.offScript?'OFF-SCRIPT · occupant freed against the Quest recommendation':'Occupant freed','quest');xp(60,'Quest judgment · occupant rescued'+(e.offScript?' (OFF-SCRIPT)':''));}}
  else if(!w.freed)w.progress=Math.max(0,w.progress-dt);
  if(w.freed&&w.leaving>0){w.leaving-=dt;w.group.children[0].rotation.z+=( 0-w.group.children[0].rotation.z)*Math.min(1,dt*3);w.group.position.addScaledVector(fwd().negate(),0);}
  setQuest();
 }
 function finish(){const e=st.enc;if(!e||e.summary)return;
  if(e.outcome==='construct down'){xp(50,'Quest · construct neutralised');}
  e.summary={outcome:e.outcome,offScript:e.offScript,freed:e.worker.freed,heard:e.worker.heard,hp:Math.round(st.hp),body:{...st.body},stats:{...st.stats}};
  log('Encounter · '+e.outcome+(e.worker.freed?' · occupant freed':e.worker.heard?' · occupant left behind':'')+' · T to restart','quest');setQuest();}

 // ---------- HUD (Loadout only, minimal) ----------
 const css=`#loIf{position:fixed;inset:0;pointer-events:none;z-index:40;font:600 11px/1.3 "JetBrains Mono",ui-monospace,monospace;color:#d9f6ff;letter-spacing:.06em;text-transform:uppercase}
#loIf[hidden]{display:none}#loIf .p{position:absolute;background:rgba(6,14,22,.72);border:1px solid rgba(95,227,232,.35);padding:8px 10px}
#loBars{left:16px;bottom:118px;width:210px}#loBars .bar{display:grid;grid-template-columns:30px 1fr 30px;gap:6px;align-items:center;margin:3px 0}#loBars i{display:block;height:6px;background:rgba(95,227,232,.15)}#loBars b{display:block;height:100%;background:#5fe3e8}#loBars .mp b{background:#7aa8ff}#loBars .sta b{background:#d9f6ff}#loBars .hp.low b{background:#ff5f45}
#loGear{left:16px;bottom:62px;width:210px}#loGear .k{color:#5fe3e8}#loGear .broken{color:#ffb43c}
#loForms{right:16px;bottom:62px;width:300px}#loForms h3{margin:0 0 6px;font-size:13px;color:#5fe3e8;letter-spacing:.12em}#loForms .swap{color:#ffb43c}#loForms ol{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:4px}
#loForms li{border:1px solid rgba(95,227,232,.3);padding:4px 6px;font-size:10px}#loForms li kbd{color:#5fe3e8;margin-right:4px}#loForms li.warn{border-color:#ffb43c;color:#ffd79a}#loForms li.bad{border-color:#ff5f45;color:#ffb0a3}#loForms li.off{opacity:.45}
#loQuest{left:50%;top:14px;transform:translateX(-50%);max-width:70vw;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;border-color:rgba(255,180,60,.4)}
#loLog{left:16px;bottom:200px;width:330px;background:none;border:none;padding:0}#loLog div{background:rgba(6,14,22,.62);margin-top:2px;padding:3px 6px;font-size:10px;text-transform:none;letter-spacing:.02em}#loLog .xp,#loLog .level{color:#9ff7d7}#loLog .warn,#loLog .injury{color:#ffd79a}#loLog .hit{color:#ffb0a3}#loLog .quest{color:#ffcf7a}#loLog .analyze,#loLog .skill{color:#9fe9ff}
#loStatus{left:50%;top:50%;transform:translate(-50%,-50%);width:360px}#loStatus h3{margin:0 0 8px;color:#5fe3e8}#loStatus .row{display:grid;grid-template-columns:1fr 52px;gap:6px;margin:3px 0}#loStatus .row.warn{color:#ffd79a}#loStatus .row.bad{color:#ffb0a3}#loStatus p{margin:8px 0 0;text-transform:none;letter-spacing:.02em}
#loWheel{left:50%;bottom:180px;transform:translateX(-50%);display:flex;gap:8px;background:none;border:none}#loWheel div{background:rgba(6,14,22,.8);border:1px solid rgba(95,227,232,.35);padding:8px;width:150px}#loWheel div.on{border-color:#5fe3e8;box-shadow:0 0 12px rgba(95,227,232,.35)}#loWheel div.locked{opacity:.4}#loWheel small{display:block;text-transform:none;letter-spacing:.02em;opacity:.8}
#loQuestPanel{right:16px;top:90px;width:340px;border-color:rgba(255,180,60,.4)}#loQuestPanel p{margin:4px 0;text-transform:none;letter-spacing:.02em}#loQuestPanel .ex{color:#ffcf7a}
#loFlash{left:50%;top:30%;transform:translateX(-50%);text-align:center;font-size:20px;color:#9ff7d7;background:none;border:none;text-shadow:0 0 12px rgba(95,227,232,.6)}#loFlash small{display:block;font-size:11px}
.loBr{position:fixed;border:2px solid #5fe3e8;border-radius:2px;pointer-events:none;z-index:39;box-shadow:0 0 10px rgba(95,227,232,.35)}.loBr[hidden]{display:none}
.loGl{position:fixed;transform:translate(-50%,-100%);font:600 10px/1.2 ui-monospace,monospace;color:#9fe9ff;background:rgba(6,14,22,.7);padding:2px 5px;pointer-events:none;z-index:39;white-space:nowrap}.loGl[hidden]{display:none}
#loTag{position:fixed;transform:translate(-50%,-100%);font:600 10px/1.3 ui-monospace,monospace;color:#d9f6ff;background:rgba(6,14,22,.78);border:1px solid rgba(95,227,232,.45);padding:4px 6px;pointer-events:none;z-index:39;white-space:nowrap;text-transform:uppercase}#loTag[hidden]{display:none}`;
 let root=null;const el={};
 function buildUi(){
  if(root)return;const style=document.createElement('style');style.textContent=css;document.head.appendChild(style);
  root=document.createElement('div');root.id='loIf';root.hidden=true;root.innerHTML=`<div class="p" id="loQuest"></div><div class="p" id="loLog"></div>
<div class="p" id="loBars"><div class="bar hp"><span>HP</span><i><b></b></i><em></em></div><div class="bar mp"><span>MP</span><i><b></b></i><em></em></div><div class="bar sta"><span>STA</span><i><b></b></i><em></em></div></div>
<div class="p" id="loGear"></div><div class="p" id="loForms"></div><div class="p" id="loStatus" hidden></div><div class="p" id="loWheel" hidden></div><div class="p" id="loQuestPanel" hidden></div><div class="p" id="loFlash" hidden></div>`;
  document.body.appendChild(root);for(const id of ['loQuest','loLog','loBars','loGear','loForms','loStatus','loWheel','loQuestPanel','loFlash'])el[id]=root.querySelector('#'+id);
  el.br=document.createElement('div');el.br.className='loBr';el.br.hidden=true;document.body.appendChild(el.br);
  el.tag=document.createElement('div');el.tag.id='loTag';el.tag.hidden=true;document.body.appendChild(el.tag);
  el.gl={};for(const k of ATTACK_IDS){const d=document.createElement('div');d.className='loGl';d.hidden=true;document.body.appendChild(d);el.gl[k]=d;}
 }
 function questLine(t){if(el.loQuest)el.loQuest.textContent=t;}
 function paintLog(){if(!el.loLog)return;el.loLog.innerHTML=st.log.slice(-5).map(l=>`<div class="${l.kind}">${l.text.replace(/</g,'&lt;')}</div>`).join('');}
 let flashUntil=0;function flash(a,b){if(!el.loFlash)return;el.loFlash.innerHTML=a+'<small>'+b+'</small>';el.loFlash.hidden=false;flashUntil=clock+2.4;}
 function paint(){
  if(!root)return;const bars=[['hp',st.hp],['mp',st.mp],['sta',st.sta]];
  for(const [k,v] of bars){const b=el.loBars.querySelector('.'+k);b.querySelector('b').style.width=v+'%';b.querySelector('em').textContent=Math.round(v);if(k==='hp')b.classList.toggle('low',v<30);}
  const bt=st.baton;el.loGear.innerHTML=`REGISTERED GEAR<br><span class="k">X</span> BATON · SOCKET 01 · ${bt.out?'IN HAND':'STOWED'}<br><span class="${bt.broken?'broken':''}">${bt.broken?'BROKEN':'INTEGRITY '+bt.durability+'/'+bt.max}</span>`;
  const lo=LOADOUTS[st.loadout];
  el.loForms.innerHTML=`<h3>${st.swap?'<span class="swap">HOTSWAP → '+LOADOUTS[st.swap.to].name+'</span>':lo.name}</h3><ol>${lo.forms.map((id,i)=>{const f=FORMS[id],r=reliability(f),cls=st.swap?'off':f.heavy&&r<.75?'bad':r<.8?'warn':'';
   return `<li class="${cls}"><kbd>${i+1}</kbd>${f.name}${r<1?' · '+Math.round(r*100)+'%':''}</li>`;}).join('')}</ol><div style="margin-top:6px;opacity:.75">LV ${st.level} · XP ${st.xp}/${xpFor(st.level+1)} · Q SWAP · RMB ANALYZE · V GUARD · B STATUS · J QUEST</div>`;
  // status glance / body inspection
  const showStatus=st.statusHeld||clock<st.statusUntil;el.loStatus.hidden=!showStatus;
  if(showStatus){const rows=Object.keys(PARTS).map(p=>{const v=st.body[p];return `<div class="row ${v<75?'bad':v<90?'warn':''}"><span>${PARTS[p]}</span><span>${Math.round(v)}%</span></div>`;}).join('');
   const c0=compromised(0),c1=compromised(1),cur=st.loadout,other=1-cur,cc=compromised(cur),co=compromised(other);
   let rec='No compromised Forms.';if(cc.length)rec=LOADOUTS[cur].name+' — '+cc.length+' FORM'+(cc.length>1?'S':'')+' COMPROMISED ('+cc.map(id=>FORMS[id].name).join(', ')+').'+(co.length<cc.length?' RECOMMENDED LOADOUT: '+LOADOUTS[other].name+(st.body.rightArm<90&&LOADOUTS[other].id==='box'?' (LEFT-LEAD: Slip Counter)':'')+'.':'');
   el.loStatus.innerHTML=`<h3>STATUS — ${st.statusHeld?'BODY INSPECTION':'GLANCE'}</h3>${rows}<p>${rec}</p><p style="opacity:.7">The belt is equipment: it can be damaged; the Interface is his Moniker.</p>`;}
  // wheel
  el.loWheel.hidden=!st.wheel;if(st.wheel){el.loWheel.innerHTML=LOADOUTS.map((l,i)=>`<div class="${i===st.loadout?'on':''}"><kbd>${i+1}</kbd> ${l.name}<small>${l.blurb}${compromised(i).length?' · '+compromised(i).length+' compromised':''}</small></div>`).join('')+LOCKED.map(l=>`<div class="locked">${l.name}<small>${l.blurb}</small></div>`).join('');}
  // quest panel
  el.loQuestPanel.hidden=!st.questOpen;if(st.questOpen){const e=st.enc;if(!e)el.loQuestPanel.innerHTML='<p>No active Quest. T starts the sparring encounter.</p>';else{const w=e.worker;
   el.loQuestPanel.innerHTML=`<p><b>PRIMARY QUEST</b> · Neutralise the construct</p><p>Recommended by the Interface: easiest to classify, highest estimated success.</p>${w.heard?`<p class="ex">Unconfirmed occupant: excluded from model.</p><p><b>ROUTE B (unverified)</b> · free the trapped worker (west, amber ring; hold I 1.5 s). You are exposed while you do it.</p>`:'<p>No other routes classified.</p>'}${w.freed?'<p class="ex">Occupant freed'+(e.offScript?' · OFF-SCRIPT recorded':'')+'.</p>':''}`;}}
  if(clock>flashUntil)el.loFlash.hidden=true;
  paintBrackets();
 }
 const tmpV=new V3();
 function screen(p){tmpV.copy(p).project(camera);return{x:(tmpV.x+1)/2*innerWidth,y:(1-tmpV.y)/2*innerHeight,in:tmpV.z<1&&Math.abs(tmpV.x)<1.2&&Math.abs(tmpV.y)<1.2};}
 function paintBrackets(){
  if(!el.br)return;const t=st.analyze&&isLoadout()?nearestTarget(25):null;
  if(!t){el.br.hidden=true;el.tag.hidden=true;for(const k of ATTACK_IDS)el.gl[k].hidden=true;return;}
  const top=screen(t.group.position.clone().add(new V3(0,1.95,0))),bot=screen(t.group.position.clone());
  if(!top.in||!bot.in){el.br.hidden=true;el.tag.hidden=true;return;}
  const h=Math.max(30,bot.y-top.y),w=h*.45;el.br.hidden=false;Object.assign(el.br.style,{left:(top.x-w/2)+'px',top:top.y+'px',width:w+'px',height:h+'px',borderColor:t.ai==='windup'?'#ffb43c':'#5fe3e8'});
  const seen=ATTACK_IDS.filter(k=>t.seen[k]).map(k=>ATTACKS[k].name.split(' ')[0]+'×'+t.seen[k]).join(' ')||'none yet';
  el.tag.hidden=false;el.tag.style.left=top.x+'px';el.tag.style.top=(top.y-6)+'px';
  el.tag.innerHTML=`${t.name}<br>HP ${Math.round(t.hp)}/${t.maxHp} · ${t.ai==='windup'?'<span style="color:#ffb43c">PREPARING ATTACK</span>':t.ai}${t.jabCounterReady?'<br>pattern: counters your lead jab':''}<br>observed: ${seen}`;
  const e=st.enc;for(const k of ATTACK_IDS){const g=e?.ghosts[k];const d=el.gl[k];if(!g||!g.group.visible||g.opacity<.1){d.hidden=true;continue;}const p=screen(g.group.position.clone().add(new V3(0,2.05+.18*(ATTACK_IDS.indexOf(k)%2),0)));d.hidden=!p.in;d.style.left=p.x+'px';d.style.top=p.y+'px';d.textContent=ATTACKS[k].name+' '+Math.round(g.p*100)+'%';}
 }

 // ---------- input (capture phase, Loadout only) ----------
 const holds={q:null,b:null};
 function owns(e){return isLoadout()&&gameActive&&!e.target?.closest?.('input,select,textarea');}
 const CLAIMED=new Set(['Digit1','Digit2','Digit3','Digit4','KeyQ','KeyV','KeyX','KeyB','KeyJ','KeyT']);
 function claims(e){return owns(e)&&(CLAIMED.has(e.code)||e.code==='KeyI'&&!!st.nearWorker);}
 window.addEventListener('keydown',e=>{
  if(!owns(e))return;const c=e.code;let used=true;
  if(/^Digit[1-4]$/.test(c)){if(!e.repeat){const n=+c.slice(5)-1;if(st.wheel){if(n<LOADOUTS.length){st.wheel.picked=true;swapTo(n);}}else useForm(n);}}
  else if(c==='KeyQ'){if(!e.repeat){holds.q=clock;st.wheel=null;}}
  else if(c==='KeyV'){st.guard=true;}
  else if(c==='KeyX'){if(!e.repeat)toggleBaton();}
  else if(c==='KeyB'){if(!e.repeat){holds.b=clock;st.statusUntil=clock+3.5;}}
  else if(c==='KeyJ'){if(!e.repeat)st.questOpen=!st.questOpen;}
  else if(c==='KeyT'){if(!e.repeat)startEncounter();}
  else if(c==='KeyI'){if(st.nearWorker){st.interactHeld=true;}else used=false;}
  else used=false;
  if(used){e.preventDefault();e.stopImmediatePropagation();}
 },true);
 window.addEventListener('keyup',e=>{
  if(!isLoadout())return;const c=e.code;
  if(c==='KeyQ'&&holds.q!=null){const held=clock-holds.q;holds.q=null;if(st.wheel){st.wheel=null;}else if(held<.3)swapTo(1-st.loadout);e.stopImmediatePropagation();}
  else if(c==='KeyV'){st.guard=false;e.stopImmediatePropagation();}
  else if(c==='KeyB'){holds.b=null;st.statusHeld=false;e.stopImmediatePropagation();}
  else if(c==='KeyI'){st.interactHeld=false;}
 },true);
 window.addEventListener('mousedown',e=>{if(e.button===2&&owns(e)){st.analyze=true;if(!st.enc&&!st.noTargetLogged){st.noTargetLogged=true;log('Analyze · no classified target in range (T: sparring encounter)','analyze');}e.preventDefault();e.stopImmediatePropagation();}},true);
 window.addEventListener('mouseup',e=>{if(e.button===2&&isLoadout()){st.analyze=false;st.noTargetLogged=false;e.stopImmediatePropagation();}},true);
 async function startEncounter(){
  if(assets.status!=='ready'){log('Loading the sparring construct…','info');try{await loadAssets();}catch(err){log('Encounter unavailable · '+assets.error,'warn');return;}}
  if(spawnEncounter()){st.hp=Math.max(st.hp,60);}
 }

 // ---------- frame ----------
 function tick(dt){
  const on=isLoadout();buildUi();
  if(on!==wasLoadout){wasLoadout=on;if(!on){clearEncounter();st.analyze=false;st.guard=false;st.wheel=null;st.swap=null;st.form=null;st.questOpen=false;if(st.baton.out){st.baton.out=false;}}}
  root.hidden=!(on&&gameActive);
  if(!on){paintBrackets();return;}
  if(!gameActive||!(dt>0)){paint();return;}
  clock+=dt;
  if(holds.q!=null&&!st.wheel&&clock-holds.q>=.3)st.wheel={opened:clock};
  if(holds.b!=null&&clock-holds.b>=.35)st.statusHeld=true;
  st.sta=Math.min(100,st.sta+(st.form&&!st.form.done?4:18)*dt);
  if(!st.enc||st.enc.outcome!=='active')for(const p of Object.keys(st.body))st.body[p]=Math.min(100,st.body[p]+.6*dt);
  if(!st.enc)st.hp=Math.min(100,st.hp+2*dt);
  tickSwap(dt);tickForm(dt);tickCounter(dt);tickConstruct(dt);tickAnalyze(dt);tickQuest(dt);
  paint();
 }
 window.loadoutInterface={tick,claims,state:()=>({active:isLoadout(),hp:+st.hp.toFixed(1),mp:+st.mp.toFixed(1),sta:+st.sta.toFixed(1),body:{...st.body},loadout:LOADOUTS[st.loadout].id,
   swap:st.swap?{to:LOADOUTS[st.swap.to].id,t:+st.swap.t.toFixed(2)}:null,wheel:!!st.wheel,form:st.form?{id:st.form.id,clip:st.form.clip,t:+st.form.t.toFixed(2),done:st.form.done,hit:st.form.hit}:null,
   guard:st.guard,analyze:st.analyze,baton:{...st.baton},xp:st.xp,level:st.level,echo:{...st.echo},questOpen:st.questOpen,statusOpen:st.statusHeld||clock<st.statusUntil,
   reliability:Object.fromEntries(Object.keys(FORMS).map(k=>[k,+reliability(FORMS[k]).toFixed(2)])),compromised:[compromised(0),compromised(1)],stats:{...st.stats},assets:assets.status,assetError:assets.error,
   encounter:st.enc?{outcome:st.enc.outcome,clock:+st.enc.clock.toFixed(2),worker:{heard:st.enc.worker.heard,freed:st.enc.worker.freed,progress:+st.enc.worker.progress.toFixed(2),near:!!st.nearWorker},offScript:st.enc.offScript,summary:st.enc.summary,
    construct:{hp:Math.round(st.enc.t.hp),phase:st.enc.t.ai,attack:st.enc.t.aiAttack,clinch:+st.enc.t.clinch.toFixed(2),down:+(st.enc.t.down||0).toFixed(2),seen:{...st.enc.t.seen},jabCounterReady:st.enc.t.jabCounterReady,pos:st.enc.t.group.position.toArray().map(v=>+v.toFixed(2)),dist:+st.enc.t.group.position.distanceTo(s.pos).toFixed(2)},
    ghosts:Object.fromEntries(ATTACK_IDS.map(k=>[k,{visible:st.enc.ghosts[k].group.visible,opacity:+st.enc.ghosts[k].opacity.toFixed(2),p:+st.enc.ghosts[k].p.toFixed(2)}]))}:null,
   log:st.log.slice(-12)}),
  forms:FORMS,loadouts:LOADOUTS,attacks:ATTACKS,
  // test helpers (clearly labelled; gameplay tests drive the keys)
  debug:{setBody:(p,v)=>{st.body[p]=v;},forceAttack:a=>{const t=st.enc?.t;if(t){t.ai='ready';startAttack(t,a);}},resetProgress:()=>{st.xp=0;st.level=11;st.echo={grab:0};st.baton.durability=12;st.baton.broken=false;persist();}}};
})();
