/* v6 (v5 unchanged; the LOADOUT_INTERFACE_P5 build loads it): the FULL BELT INVENTORY.
 *   Sockets: 01 baton, 02 grapnel, 03 medical kit (4 doses), 04 rescue cutter (registers through use), 05 empty,
 *   C1 smoke capsules (2), C2 empty. X / D-left TAP: use the selected item. HOLD: belt carousel (camera lowers to the
 *   waist, sockets unfold around the belt; mouse / A D / ← → / wheel or stick / LB RB select; release uses it; RMB / B
 *   cancels). While it is open the sparring construct runs at half speed; nothing else is slowed.
 *   Baton: draw / stow (as before). Grapnel: fires at the nearest wall in an 80° fan within 22 m; the cable stays
 *   strung from the wall to the spool where he stood (saved), trips the construct when it walks through it low, and
 *   only comes back if he walks to the spool and reels it in. Medical kit: 2.4 s treatment (a hit interrupts it, no
 *   dose used), +25 to the worst body part and +15 HP; doses run out. Smoke: a 6 s cloud at the opponent; while either
 *   of them is in it the construct cannot start an attack; capsules are gone once used. Rescue cutter: lies near the
 *   trapped worker; I / Y picks it up; carried in hand (no baton) it frees the worker in 0.6 s instead of 1.5 s; after
 *   2 rescues with it, it registers into socket 04. Shop restocks smoke and refills the medical kit; it never makes
 *   new equipment. Retrieval clips are Runner pack placeholders. */
/* v5 (v4 unchanged; the LOADOUT_INTERFACE_P4 build loads it): the OUTCLASSED Condition and witness memory.
 * Every sparring encounter now has 3 spectators. If Loadout goes down while at least 2 of them can see the fight, they
 * each give an account (one insults him, one agrees, one disputes it if he had landed a counter) and the Condition
 * OUTCLASSED is gained, with a witness pressure from those accounts. It is saved and active in later encounters:
 * his Interface exaggerates the opponent (red, larger threat brackets; larger red Ghost Builds; "SUCCESS 9x%" on the
 * attack it fears most; counter windows marked uncertain; an amber escape route; a red vignette). The construct's real
 * attacks are unchanged. Each counter or evade of a predicted attack while it is active is a contradiction; after 3,
 * a win seen by at least 2 witnesses makes them revise their accounts and clears it. A win without the contradictions
 * reads as luck (pressure drops a little), and a win nobody sees changes nothing. Shown in TITLES, STATUS and RECORDS. */
/* v4 (v3 unchanged; the LOADOUT_INTERFACE_P3 build loads it): the CORE WHEEL and the DEEP INTERFACE pages.
 *   Tab / View (tap, no other button)  open the Core Wheel: 8 sections around the belt core; the world behind dims
 *   Wheel: mouse direction or left stick points at a section; ← → / D-pad step; 1-8 open directly; Enter / LMB / A open
 *   Pages: STATUS (body map, Forms per body part, resources), SKILLS (Movement Echo library, uses, incomplete Forms),
 *     LOADOUTS (Build Deck: rearrange the 4 Form sockets of each preset, saved; equip = a real hotswap), INVENTORY (belt
 *     sockets; draw / stow the registered baton), QUESTS (active Quest, what it excluded, decision history), SHOP (baton
 *     field repair for credits from resolved Quests; other items are blueprints only), TITLES (earned from what you did;
 *     Conditions shown as not built), RECORDS (observed techniques, encounters, unclassified signals, The Blank, event log).
 *   In pages: ↑ ↓ ← → / WASD / stick / D-pad move, Enter / E / Space / LMB / A confirm, Backspace / C / RMB / B back,
 *   Q / R / LB / RB previous / next page, Tab / View close. Esc pauses the game as usual (the Interface closes).
 * The world is not paused; Loadout stands still while the Interface is open. Lifetime records and the deck are saved in
 * localStorage 'loadoutInterfaceV4' (older builds keep using 'loadoutInterfaceV1', untouched). The pad's View button no
 * longer reaches Backspool's posture toggle while Loadout is the hero. */
/* v3 (v2 unchanged; the LOADOUT_INTERFACE_P2 build loads it): GAMEPAD. poll(now,gp) is called by
 * game_backspool_threadrail_runtime_v04.js before the Runner pack and Backspool's handlers, and clears (masks) the buttons
 * it uses from the shared array, so nothing underneath reacts to them. The hero-switch chord (L3+LT+RT+R3) is handled by
 * the engine before any of this and keeps priority. Loadout pad map (only while he is the hero):
 *   LT hold         Analyze (Backspool's guard on LT stands down: input.actions.aim is cleared for Loadout)
 *   LT + R3         Deep Scan on / off            LT + D-up      Quest panel
 *   RT + X/Y/A/B    Forms 1/2/3/4                 RT tap         basic strike (backspoolCombat.pressAttack, as before)
 *   LB, stick still Guard (LB with the stick still strafes, as before)
 *   D-right tap     hotswap to the previous Loadout; hold: Loadout wheel, X/Y/A pick 1/2/3
 *   D-left          registered baton              D-up tap/hold  Status glance / Body Inspection
 *   Y hold          (near the trapped worker) free him; elsewhere Y is the usual interact
 * Unchanged: A jump, B / D-down evade, X tumble, RB dash, LB strafe, L3 sprint, View combos, Start pause. The HUD shows
 * pad glyphs while the pad was used in the last 5 s. Keyboard / mouse unchanged from v2. */
/* v2 (v1, game_v02_loadout_interface.js, is unchanged: the LOADOUT_INTERFACE_P1 build loads it). Adds, from the user's
 * brief ("Deep Scan + Pursuit", 2026-11-11):
 * - DEEP SCAN (Y toggles): the Interface labels nearby people, targets, quest points and hazards as INTERPRETATIONS, not
 *   truth (a walker can be flagged "resembles threat profile · UNVERIFIED"). It drains MP (8/s) and raises Archive Saturation;
 *   above 60% the labels turn reductive ("NPC · LV 1"); at 100% the Interface overloads (Deep Scan and Analyze offline
 *   4 s, MP 0). HUD shows the attention level (PASSIVE / FOCUS / DEEP SCAN) and saturation.
 * - PURSUIT Loadout (third preset; the wheel picks 1-3; Q tap swaps to the previous one): Forms 1 Burst Dash (a
 *   travelling Runner dash through the movement owner), 2 Route Assessment, 3 Target Interception, 4 Ledge Read.
 *   Ledges are read from the real collision boxes near him (tops 0.6-2.6 m above his feet: VAULT / CLIMB brackets).
 *   With the existing transit pursuit running (verticalPursuit; start it at the concourse access with I as before),
 *   the runner's remaining route and next 1.5 s are drawn, and Route Assessment scores interception points on that
 *   route: the straight line from him is sampled every 0.5 m against the real ground and colliders (blocked = red,
 *   drop > 1.4 m = amber unsafe landing, rise 0.5-2.6 m = climb +1.2 s), his time at Dash pace (8.15 m/s) against the
 *   runner's time along its route. Shown as an illustrative assessment with a time range, never a guarantee. He still
 *   has to run it; nothing moves him except Burst Dash, which is an ordinary Runner action. */
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
  burst:{name:'Burst Dash',clip:'Esc_BoostDash_Front',parts:['legs'],heavy:false,sta:16,dmg:0,impact:.3,reach:9,travel:true,utility:'burst'},
  route:{name:'Route Assessment',parts:['torso'],heavy:false,sta:0,mp:6,utility:'route'},
  intercept:{name:'Target Interception',parts:['torso'],heavy:false,sta:0,mp:4,utility:'intercept'},
  vaultread:{name:'Ledge Read',parts:['torso'],heavy:false,sta:0,mp:5,utility:'ledges'},
  frame:{name:'Frame Off',clip:'Esc_StandRoll_Back',parts:['legs'],heavy:false,sta:12,dmg:0,impact:.2,reach:9,escape:true}
 };
 const LOADOUTS=[
  {id:'box',name:'COUNTER / BOX',blurb:'Punching trajectories, slips, counters',forms:['slip','tempo','cross','feint']},
  {id:'grapple',name:'GRAPPLE / CONTROL',blurb:'Clinch entries, grips, balance breaks',forms:['clinch','sweep','throw','frame']},
  {id:'pursuit',name:'PURSUIT',blurb:'Mobility, routes, interception',forms:['burst','route','intercept','vaultread']}
 ];
 const LOCKED=[{name:'RESCUE',blurb:'Not prepared'}];
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
 const compromised=lo=>LOADOUTS[lo].forms.filter(id=>!FORMS[id].utility&&FORMS[id].heavy?reliability(FORMS[id])<.75:reliability(FORMS[id])<.8);

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
  if(playerEvading()){st.stats.evaded++;contradict('evade');log('Evaded · '+A.name,'combat');t.ai='whiff';t.aiT=.9;return;}
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
  if(iv.act){return false;}
  if(st.form&&!st.form.done){return false;}
  if(st.sta<f.sta){log(f.name+' · not enough stamina','warn');return false;}
  if(!s.onGround){log(f.name+' · needs footing','warn');return false;}
  const t=nearestTarget(6),rel=reliability(f);
  if(f.utility){return useUtility(id,f);}
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
  if(f.counter&&t.counterOpen&&(t.ai==='windup'||t.ai==='strike'||t.ai==='whiff')){dmg*=2.2;label='COUNTER · '+f.name;st.stats.counters++;contradict('counter');t.ai='recover';t.aiT=1.0;t.stun=Math.max(t.stun||0,.8);
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
  if(st.combo&&clock-st.combo.at<3)st.combo.swapped=true;const c=compromised(st.loadout);if(LOADOUTS[st.loadout].id==='pursuit')pursuitOn();else pursuitOff();if(c.length)log('Compatibility · '+c.length+' Form'+(c.length>1?'s':'')+' compromised by injury','warn');}}

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
 function toggleBaton(){const b=st.baton;if(!b.registered)return;if(!b.out&&(inv.cutter.state==='carried'||inv.cutter.out)){log('Baton · hands full (cutter)','warn');return;}if(st.form&&!st.form.done)return;b.out=!b.out;runner()?.setWeapon?.(b.out);
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
  if(near&&st.interactHeld){w.progress+=dt/((inv.cutter.state==='carried'||inv.cutter.out)?.6:1.5);if(w.progress>=1){w.freed=true;onRescue();w.leaving=2.5;w.panel.rotation.z=.9;w.panel.position.y=.25;e.offScript=e.outcome==='active';
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
.att{margin-top:6px;font-size:10px}
#loScanVeil{position:fixed;inset:0;pointer-events:none;z-index:38;background:radial-gradient(ellipse at center,rgba(0,0,0,0) 45%,rgba(4,20,30,.55) 100%);mix-blend-mode:multiply}#loScanVeil[hidden]{display:none}
.loScan{position:fixed;transform:translate(-50%,-100%);font:600 9px/1.25 ui-monospace,monospace;color:#bff3ff;background:rgba(4,16,24,.72);border-left:2px solid #5fe3e8;padding:2px 5px;pointer-events:none;z-index:39;white-space:nowrap;text-transform:uppercase}.loScan[hidden]{display:none}.loScan.amber{border-color:#ffb43c;color:#ffd79a}.loScan.red{border-color:#ff5f45;color:#ffb0a3}.loScan.dist{border-color:#ff5f45;color:#ff9a86;letter-spacing:.14em}.loScan small{display:block;opacity:.75;text-transform:none}
#loRoutes{right:16px;bottom:236px;width:340px}#loRoutes h3{margin:0 0 6px;color:#5fe3e8}#loRoutes .r{border-left:3px solid #5fe3e8;padding:3px 6px;margin:4px 0;text-transform:none;letter-spacing:.02em}#loRoutes .r.amber{border-color:#ffb43c}#loRoutes .r.red{border-color:#ff5f45;opacity:.75}#loRoutes p{margin:4px 0;text-transform:none;letter-spacing:.02em;opacity:.75}
.loBr{position:fixed;border:2px solid #5fe3e8;border-radius:2px;pointer-events:none;z-index:39;box-shadow:0 0 10px rgba(95,227,232,.35)}.loBr[hidden]{display:none}
.loGl{position:fixed;transform:translate(-50%,-100%);font:600 10px/1.2 ui-monospace,monospace;color:#9fe9ff;background:rgba(6,14,22,.7);padding:2px 5px;pointer-events:none;z-index:39;white-space:nowrap}.loGl[hidden]{display:none}
#loTag{position:fixed;transform:translate(-50%,-100%);font:600 10px/1.3 ui-monospace,monospace;color:#d9f6ff;background:rgba(6,14,22,.78);border:1px solid rgba(95,227,232,.45);padding:4px 6px;pointer-events:none;z-index:39;white-space:nowrap;text-transform:uppercase}#loTag[hidden]{display:none}`;
 let root=null;const el={};
 function buildUi(){
  if(root)return;const style=document.createElement('style');style.textContent=css;document.head.appendChild(style);
  root=document.createElement('div');root.id='loIf';root.hidden=true;root.innerHTML=`<div class="p" id="loQuest"></div><div class="p" id="loLog"></div>
<div class="p" id="loBars"><div class="bar hp"><span>HP</span><i><b></b></i><em></em></div><div class="bar mp"><span>MP</span><i><b></b></i><em></em></div><div class="bar sta"><span>STA</span><i><b></b></i><em></em></div></div>
<div class="p" id="loGear"></div><div class="p" id="loForms"></div><div class="p" id="loStatus" hidden></div><div class="p" id="loWheel" hidden></div><div class="p" id="loQuestPanel" hidden></div><div class="p" id="loFlash" hidden></div><div class="p" id="loRoutes" hidden></div>`;
  document.body.appendChild(root);for(const id of ['loQuest','loLog','loBars','loGear','loForms','loStatus','loWheel','loQuestPanel','loFlash','loRoutes'])el[id]=root.querySelector('#'+id);
  el.br=document.createElement('div');el.br.className='loBr';el.br.hidden=true;document.body.appendChild(el.br);
  el.tag=document.createElement('div');el.tag.id='loTag';el.tag.hidden=true;document.body.appendChild(el.tag);
  el.veil=document.createElement('div');el.veil.id='loScanVeil';el.veil.hidden=true;document.body.appendChild(el.veil);el.scanTags=[];
  el.gl={};for(const k of ATTACK_IDS){const d=document.createElement('div');d.className='loGl';d.hidden=true;document.body.appendChild(d);el.gl[k]=d;}
 }
 function questLine(t){if(el.loQuest)el.loQuest.textContent=t;}
 function paintLog(){if(!el.loLog)return;el.loLog.innerHTML=st.log.slice(-5).map(l=>`<div class="${l.kind}">${l.text.replace(/</g,'&lt;')}</div>`).join('');}
 let flashUntil=0;function flash(a,b){if(!el.loFlash)return;el.loFlash.innerHTML=a+'<small>'+b+'</small>';el.loFlash.hidden=false;flashUntil=clock+2.4;}
 function paint(){
  if(!root)return;const bars=[['hp',st.hp],['mp',st.mp],['sta',st.sta]];
  for(const [k,v] of bars){const b=el.loBars.querySelector('.'+k);b.querySelector('b').style.width=v+'%';b.querySelector('em').textContent=Math.round(v);if(k==='hp')b.classList.toggle('low',v<30);}
  const bt=st.baton;{const S=SOCKETS[inv.sel],k=padRecent()?'D←':'X';el.loGear.innerHTML=`REGISTERED GEAR · <span class="k">${k}</span> USE · HOLD BELT<br>${S.slot} ${S.name.toUpperCase()} · <span class="${/BROKEN|EMPTY|0\/|NOT REG/.test(S.id?invItemState(S.id):'EMPTY')?'broken':''}">${S.id?invItemState(S.id):'EMPTY'}</span><br>IN HAND · ${[bt.out?'BATON':'',inv.cutter.state==='carried'||inv.cutter.out?'RESCUE CUTTER':''].filter(Boolean).join(', ')||'—'}${bt.out?' · CONDITION '+Math.round(100*bt.durability/bt.max)+'%':''}<br>ITEM CAPACITY · ${regCount()} / 5${inv.grapnel.state==='deployed'?'<br><span class="broken">GRAPNEL DEPLOYED · '+Math.round(spoolDist())+' M</span>':''}`;}
  const lo=LOADOUTS[st.loadout];
  el.loForms.innerHTML=`<h3>${st.swap?'<span class="swap">HOTSWAP → '+LOADOUTS[st.swap.to].name+'</span>':lo.name}</h3><ol>${lo.forms.map((id,i)=>{const f=FORMS[id],r=f.utility&&f.utility!=='burst'?1:reliability(f),cls=st.swap?'off':f.heavy&&r<.75?'bad':r<.8?'warn':'';
   return `<li class="${cls}"><kbd>${padRecent()?'RT+'+['X','Y','A','B'][i]:i+1}</kbd>${f.name}${r<1?' · '+Math.round(r*100)+'%':''}</li>`;}).join('')}</ol><div class="att">ATTENTION · ${scan.on?'<b style="color:#9fe9ff">DEEP SCAN</b>':st.analyze?'FOCUS':'PASSIVE'} · SATURATION ${Math.round(scan.sat)}%${clock<scan.overloadUntil?' · <b style="color:#ff8a70">OVERLOAD</b>':''}${store.condition?'<br><b style="color:#ff8a70">CONDITION · OUTCLASSED · PRESSURE '+store.condition.pressure+'% · CONTRADICTED '+store.condition.contradictions+'/3</b>':''}</div><div style="margin-top:6px;opacity:.75">LV ${st.level} · XP ${st.xp}/${xpFor(st.level+1)} · ${padRecent()?'D→ SWAP (HOLD WHEEL) · LT ANALYZE · LB GUARD · D↑ STATUS · LT+D↑ QUEST · LT+R3 DEEP SCAN · VIEW INTERFACE':'Q SWAP · RMB ANALYZE · V GUARD · B STATUS · J QUEST · Y DEEP SCAN · TAB INTERFACE'}</div>`;
  // status glance / body inspection
  const showStatus=st.statusHeld||clock<st.statusUntil;el.loStatus.hidden=!showStatus;
  if(showStatus){const rows=Object.keys(PARTS).map(p=>{const v=st.body[p];return `<div class="row ${v<75?'bad':v<90?'warn':''}"><span>${PARTS[p]}</span><span>${Math.round(v)}%</span></div>`;}).join('');
   const cur=st.loadout,other=LOADOUTS[cur].id==='box'?1:0,cc=compromised(cur),co=compromised(other);
   let rec='No compromised Forms.';if(cc.length)rec=LOADOUTS[cur].name+' — '+cc.length+' FORM'+(cc.length>1?'S':'')+' COMPROMISED ('+cc.map(id=>FORMS[id].name).join(', ')+').'+(co.length<cc.length?' RECOMMENDED LOADOUT: '+LOADOUTS[other].name+(st.body.rightArm<90&&LOADOUTS[other].id==='box'?' (LEFT-LEAD: Slip Counter)':'')+'.':'');
   el.loStatus.innerHTML=`<h3>STATUS — ${st.statusHeld?'BODY INSPECTION':'GLANCE'}</h3>${rows}<p>${rec}</p><p style="opacity:.7">The belt is equipment: it can be damaged; the Interface is his Moniker.</p>`;}
  // wheel
  el.loWheel.hidden=!st.wheel;if(st.wheel){el.loWheel.innerHTML=LOADOUTS.map((l,i)=>`<div class="${i===st.loadout?'on':''}"><kbd>${i+1}</kbd> ${l.name}<small>${l.blurb}${compromised(i).length?' · '+compromised(i).length+' compromised':''}</small></div>`).join('')+LOCKED.map(l=>`<div class="locked">${l.name}<small>${l.blurb}</small></div>`).join('');}
  // quest panel
  el.loQuestPanel.hidden=!st.questOpen;if(st.questOpen){const e=st.enc;if(!e)el.loQuestPanel.innerHTML='<p>No active Quest. T starts the sparring encounter.</p>';else{const w=e.worker;
   el.loQuestPanel.innerHTML=`<p><b>PRIMARY QUEST</b> · Neutralise the construct</p><p>Recommended by the Interface: easiest to classify, highest estimated success.</p>${w.heard?`<p class="ex">Unconfirmed occupant: excluded from model.</p><p><b>ROUTE B (unverified)</b> · free the trapped worker (west, amber ring; hold I 1.5 s). You are exposed while you do it.</p>`:'<p>No other routes classified.</p>'}${w.freed?'<p class="ex">Occupant freed'+(e.offScript?' · OFF-SCRIPT recorded':'')+'.</p>':''}`;}}
  if(clock>flashUntil)el.loFlash.hidden=true;
  paintBrackets();paintScan();paintRoutes();paintCore();paintOutclassed();
 }
 const tmpV=new V3();
 function screen(p){tmpV.copy(p).project(camera);return{x:(tmpV.x+1)/2*innerWidth,y:(1-tmpV.y)/2*innerHeight,in:tmpV.z<1&&Math.abs(tmpV.x)<1.2&&Math.abs(tmpV.y)<1.2};}
 function paintBrackets(){
  if(!el.br)return;const t=st.analyze&&isLoadout()?nearestTarget(25):null;
  if(!t){el.br.hidden=true;el.tag.hidden=true;for(const k of ATTACK_IDS)el.gl[k].hidden=true;return;}
  const top=screen(t.group.position.clone().add(new V3(0,1.95,0))),bot=screen(t.group.position.clone());
  if(!top.in||!bot.in){el.br.hidden=true;el.tag.hidden=true;return;}
  const oc=outclassedOn(),h0=Math.max(30,bot.y-top.y),h=h0*(oc?1.35:1),w=h*.45*(oc?1.15:1);el.br.hidden=false;Object.assign(el.br.style,{left:(top.x-w/2)+'px',top:(top.y-(h-h0)*.6)+'px',width:w+'px',height:h+'px',borderColor:oc?'#ff5f45':t.ai==='windup'?'#ffb43c':'#5fe3e8',borderWidth:oc?'3px':'2px',boxShadow:oc?'0 0 22px rgba(255,80,50,.55)':''});
  const seen=ATTACK_IDS.filter(k=>t.seen[k]).map(k=>ATTACKS[k].name.split(' ')[0]+'×'+t.seen[k]).join(' ')||'none yet';
  el.tag.hidden=false;el.tag.style.left=top.x+'px';el.tag.style.top=(top.y-6)+'px';
  el.tag.innerHTML=`${t.name}<br>HP ${Math.round(t.hp)}/${t.maxHp} · ${t.ai==='windup'?'<span style="color:#ffb43c">PREPARING ATTACK</span>':t.ai}${t.jabCounterReady?'<br>pattern: counters your lead jab':''}<br>observed: ${seen}${outclassedOn()?'<br><span style="color:#ff8a70">THREAT · OVERWHELMING · counter window: UNCERTAIN</span><br><span style="color:#ff8a70">CONDITION · OUTCLASSED</span>':''}`;
  const e=st.enc;for(const k of ATTACK_IDS){const g=e?.ghosts[k];const d=el.gl[k];if(!g||!g.group.visible||g.opacity<.1){d.hidden=true;continue;}const p=screen(g.group.position.clone().add(new V3(0,2.05+.18*(ATTACK_IDS.indexOf(k)%2),0)));d.hidden=!p.in;d.style.left=p.x+'px';d.style.top=p.y+'px';d.textContent=ghostLabel(k,g);d.style.color=outclassedOn()?'#ffb0a3':'';}
 }

 // ---------- input (capture phase, Loadout only) ----------
 const holds={q:null,b:null};
 function owns(e){return isLoadout()&&gameActive&&!e.target?.closest?.('input,select,textarea');}
 const CLAIMED=new Set(['Digit1','Digit2','Digit3','Digit4','KeyQ','KeyV','KeyX','KeyB','KeyJ','KeyT','KeyY','Tab']);
 function claims(e){if((ui.open||iv.open)&&owns(e))return e.type!=='keyup'&&e.code!=='Escape';return owns(e)&&(CLAIMED.has(e.code)||e.code==='KeyI'&&(!!st.nearWorker||nearFieldCutter()));}
 window.addEventListener('keydown',e=>{
  if(!owns(e))return;const c=e.code;let used=true;
  if(iv.open){if(c==='Escape'){iv.holdAt=null;closeCarousel(false);return;}if(c==='Enter'||c==='KeyE'){if(!e.repeat){iv.holdAt=null;closeCarousel(true);}}else if(['KeyA','ArrowLeft'].includes(c))stepSel(-1);else if(['KeyD','ArrowRight'].includes(c))stepSel(1);e.preventDefault();e.stopImmediatePropagation();return;}
  if(ui.open){if(c==='Escape'){closeInterface();return;}uiKey(e);e.preventDefault();e.stopImmediatePropagation();return;}
  if(/^Digit[1-4]$/.test(c)){if(!e.repeat){const n=+c.slice(5)-1;if(st.wheel){if(n<LOADOUTS.length){st.wheel.picked=true;swapTo(n);}}else useForm(n);}}
  else if(c==='KeyQ'){if(!e.repeat){holds.q=clock;st.wheel=null;}}
  else if(c==='KeyV'){st.guardKey=true;}
  else if(c==='KeyX'){if(!e.repeat)iv.holdAt=clock;}
  else if(c==='KeyB'){if(!e.repeat){holds.b=clock;st.statusUntil=clock+3.5;}}
  else if(c==='KeyJ'){if(!e.repeat)st.questOpen=!st.questOpen;}
  else if(c==='KeyT'){if(!e.repeat)startEncounter();}
  else if(c==='KeyY'){if(!e.repeat)toggleDeepScan();}
  else if(c==='Tab'){if(!e.repeat)openInterface();}
  else if(c==='KeyI'){const fc=nearFieldCutter();if(fc&&!e.repeat)pickCutter();if(st.nearWorker){st.interactKey=true;}else if(!fc)used=false;}
  else used=false;
  if(used){e.preventDefault();e.stopImmediatePropagation();}
 },true);
 window.addEventListener('keyup',e=>{
  if(!isLoadout())return;const c=e.code;
  if(c==='KeyQ'&&holds.q!=null){const held=clock-holds.q;holds.q=null;if(st.wheel){st.wheel=null;}else if(held<.3)swapTo(st.prevLoadout!==st.loadout?st.prevLoadout:(st.loadout+1)%LOADOUTS.length);e.stopImmediatePropagation();}
  else if(c==='KeyV'){st.guardKey=false;e.stopImmediatePropagation();}
  else if(c==='KeyX'&&iv.holdAt!=null){const held=clock-iv.holdAt;iv.holdAt=null;if(iv.open)closeCarousel(true);else if(held<.3)quick();e.stopImmediatePropagation();}
  else if(c==='KeyB'){holds.b=null;st.statusHeldKey=false;e.stopImmediatePropagation();}
  else if(c==='KeyI'){st.interactKey=false;}
 },true);
 window.addEventListener('mousedown',e=>{if(e.button===2&&owns(e)&&!ui.open&&!iv.open){st.analyzeMouse=true;if(!st.enc&&!st.noTargetLogged){st.noTargetLogged=true;log('Analyze · no classified target in range (T: sparring encounter)','analyze');}e.preventDefault();e.stopImmediatePropagation();}},true);
 window.addEventListener('mouseup',e=>{if(e.button===2&&isLoadout()){st.analyzeMouse=false;st.noTargetLogged=false;e.stopImmediatePropagation();}},true);
 async function startEncounter(){
  if(assets.status!=='ready'){log('Loading the sparring construct…','info');try{await loadAssets();}catch(err){log('Encounter unavailable · '+assets.error,'warn');return;}}
  if(spawnEncounter()){st.hp=Math.max(st.hp,60);}
 }

 // ---------- frame ----------
 function tick(dt){
  const on=isLoadout();buildUi();
  if(on!==wasLoadout){wasLoadout=on;if(!on){closeInterface();scanOff(true);pursuitOff();P.reset();st.guardKey=st.interactKey=st.statusHeldKey=st.analyzeMouse=false;clearEncounter();st.analyze=false;st.guard=false;st.wheel=null;st.swap=null;st.form=null;st.questOpen=false;if(st.baton.out){st.baton.out=false;}}}
  root.hidden=!(on&&gameActive);
  if(!on){if(iv.open)closeCarousel(false);setHud(false);iv.cards=[];iv.cam=null;iv.camF=null;iv.hero=null;iv.seqOn=false;iv.holdAt=null;iv.blend=0;if(iv.root)iv.root.visible=false;tickHandProps();if(iv.el)iv.el.hidden=true;if(wit.root)clearWitnesses();paintBrackets();paintScan();paintCore();paintOutclassed();return;}
  if(!gameActive&&ui.open)closeInterface();
  if(!gameActive&&iv.open){closeCarousel(false);iv.holdAt=null;}
  if(!gameActive||!(dt>0)){paint();return;}
  clock+=dt;
  if(holds.q!=null&&!st.wheel&&clock-holds.q>=.3)st.wheel={opened:clock};
  if(holds.b!=null&&clock-holds.b>=.35)st.statusHeldKey=true;
  st.guard=!!(st.guardKey||P.guard);st.interactHeld=!!(st.interactKey||P.interact);st.statusHeld=!!(st.statusHeldKey||P.status);st.analyze=!!(st.analyzeMouse||P.analyze)&&clock>=scan.overloadUntil&&!(scan.on&&false);
  st.sta=Math.min(100,st.sta+(st.form&&!st.form.done?4:18)*dt);
  if(!st.enc||st.enc.outcome!=='active')for(const p of Object.keys(st.body))st.body[p]=Math.min(100,st.body[p]+.6*dt);
  if(!st.enc)st.hp=Math.min(100,st.hp+2*dt);
  if(iv.holdAt!=null&&!iv.open&&!ui.open&&clock-iv.holdAt>=.3)openCarousel();
  if(iv.act){const A=iv.act;A.t+=dt;const hit=st.stats.hitsTaken>A.hits;if(A.item==='medkit'&&hit){log('Treatment interrupted · no dose used','warn');iv.act=null;}else if(hit&&A.contact!=null&&!A.contacted){log('Reach interrupted · '+SOCKETS[A.sock].name+' stays in socket '+SOCKETS[A.sock].slot,'warn');iv.act=null;iv.interrupted=(iv.interrupted||0)+1;}else{if(A.contact!=null&&!A.contacted&&A.t>=A.contact){A.contacted=true;if(A.seq){if(A.clip&&!kimReady())runner()?.perform?.(A.clip,{root:false,source:'loadout-inventory'});if(iv.lastPull&&iv.lastPull.act===A)iv.lastPull.completed=true;}iv.lastContact={item:A.item,handDist:handDist(),w:+(iv.reachW||0).toFixed(2)};A.onContact&&A.onContact();}if(iv.act===A&&A.t>=A.dur){iv.act=null;A.done&&A.done();}}}
  if(iv.seqOn&&(!iv.act||!iv.act.seq||iv.act.t>=iv.act.contact+SEQ.out)){if(iv.lastPull&&!iv.lastPull.completed)iv.lastPull.aborted=true;iv.seqOn=false;iv.open=false;}
  if(inv.grapnel.state==='deployed'&&!iv.cable)buildCable();
  if(st.enc&&st.enc!==iv.encRef){iv.encRef=st.enc;placeFieldCutter();}if(!st.enc&&iv.fieldCutter){scene.remove(iv.fieldCutter);iv.fieldCutter=null;iv.encRef=null;}
  tickSwap(dt);tickForm(dt);tickCounter(dt);tickConstruct(dt*carouselSlow());if(st.enc?.t)st.enc.t.simT=(st.enc.t.simT||0)+dt*carouselSlow();tickSmoke(dt);cableTrip(dt);tickAnalyze(dt);tickQuest(dt);tickScan(dt);tickPursuit(dt);track();tickOutclassed(dt);tickHandProps();tickReach();
  paint();tickCarousel(dt);paintCarousel();
 }

 // ---------- DEEP SCAN ----------
 const scan={on:false,sat:0,overloadUntil:-1,labels:[],lastBuild:-9};
 function toggleDeepScan(){if(scan.on){scanOff();return;}
  if(clock<scan.overloadUntil){log('Interface overloaded · Deep Scan unavailable','warn');return;}
  if(st.mp<10){log('Deep Scan · not enough MP','warn');return;}
  scan.on=true;scan.lastBuild=-9;log('DEEP SCAN · every label is an interpretation, not a fact','analyze');}
 function scanOff(quiet){if(!scan.on)return;scan.on=false;scan.labels=[];if(!quiet)log('Deep Scan off','analyze');}
 const hash=n=>{let h=2166136261;for(const c of String(n)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return (h>>>0)/4294967296;};
 function buildLabels(){
  const out=[],me=s.pos,R=35,wp=new V3(),reductive=scan.sat>=60;
  const add=(pos,cls,head,sub,key)=>{const d=pos.distanceTo(me);if(d<=R)out.push({pos:pos.clone(),cls,head,sub,d,key});};
  (window.streetAtmosphere||(typeof streetAtmosphere!=='undefined'?streetAtmosphere:null))?.walkers?.forEach((w,i)=>{if(!w.group?.visible&&w.group?.visible!==undefined)return;w.group.getWorldPosition(wp);wp.y+=1.9;
   const flagged=hash('w'+i)<.16;
   if(reductive)add(wp,'dist',flagged?'THREAT · LV 1':'NPC · LV 1',flagged?'reductive label (saturation)':'reductive label (saturation)','w'+i);
   else add(wp,flagged?'amber':'',flagged?'Civilian? · gait resembles a threat profile':'Civilian · commuter',flagged?'UNVERIFIED · interpretation, not evidence':'interpretation · confidence low','w'+i);});
  for(const t of (window.combatants?.targets?.()||[])){if(!t?.group?.parent||t.hp<=0)continue;const p=window.combatants.position(t).clone();p.y+=1;add(p,'red',reductive?'HOSTILE':(t.name||'Combatant')+' · threat',reductive?'':'observed '+(t.loadoutFighter?'habits only':'posture'),t.id||'c');}
  const vp=window.verticalPursuit?.state?.();if(vp?.runner&&['active','paused'].includes(vp.phase)){const p=new V3(...vp.runner.position);p.y+=2;add(p,'amber','Fleeing target','route partially known · Pursuit: route options','runner');}
  if(vp?.config?.trigger){const p=new V3(...vp.config.trigger);p.y+=2.2;add(p,'','Quest · transit pursuit access','I at the marker','pursuit-access');}
  for(const pt of (window.verticalDiscovery?.state?.().points||[])){if(!pt.position)continue;const p=new V3(...pt.position);p.y+=2.2;add(p,'',reductive?'TERMINAL':(pt.title||'Public information'),'discovery · '+(pt.function||''),pt.id);}
  const w=st.enc?.worker;if(w&&!w.freed){const p=w.group.position.clone();p.y+=1.2;add(p,'amber',w.heard?'Unclassified voice':'—','not in the Quest model','worker');}
  out.sort((a,b)=>a.d-b.d);scan.labels=out.slice(0,16);
 }
 function tickScan(dt){
  if(scan.on){st.mp=Math.max(0,st.mp-8*dt);scan.sat=Math.min(100,scan.sat+6*dt);if(!scan.redLogged&&scan.sat>=60){scan.redLogged=true;buildLabels();scan.lastBuild=clock;log('Archive Saturation 60% · labels turning reductive','warn');}
   if(clock-scan.lastBuild>.4){scan.lastBuild=clock;buildLabels();}
   if(scan.sat>=100||st.mp<=0){scan.on=false;scan.labels=[];scan.overloadUntil=clock+4;st.mp=0;st.analyze=false;log('ARCHIVE SATURATION · Interface overload · Deep Scan and Analyze offline 4 s','warn');}}
  else{scan.sat=Math.max(0,scan.sat-4*dt);if(scan.sat<55)scan.redLogged=false;}
 }
 function paintScan(){
  if(!el.veil)return;const show=scan.on&&isLoadout()&&gameActive;el.veil.hidden=!show;
  while(el.scanTags.length<16){const d=document.createElement('div');d.className='loScan';d.hidden=true;document.body.appendChild(d);el.scanTags.push(d);}
  el.scanTags.forEach((d,i)=>{const L=show?scan.labels[i]:null;if(!L){d.hidden=true;return;}const p=screen(L.pos);if(!p.in){d.hidden=true;return;}d.hidden=false;d.className='loScan '+(L.cls||'');d.style.left=p.x+'px';d.style.top=p.y+'px';d.innerHTML=L.head+'<small>'+L.sub+' · '+Math.round(L.d)+' m</small>';});
 }

 // ---------- PURSUIT ----------
 const pur={on:false,root:null,ledges:[],ledgeUntil:-1,lastLedge:-9,routes:[],routesAt:-9,tracking:false,lines:[],trackLine:null,pathLine:null};
 const DASH=8.15;
 function pursuitOn(){if(pur.on)return;pur.on=true;if(!pur.root){pur.root=new THREE.Group();pur.root.name='Loadout Pursuit overlay';scene.add(pur.root);}pur.root.visible=true;pur.ledgeUntil=clock+6;pur.lastLedge=-9;log('PURSUIT online · ledges, routes and interception from real geometry','swap');}
 function pursuitOff(){if(!pur.on)return;pur.on=false;pur.tracking=false;pur.routes=[];clearLines();if(pur.root){pur.root.visible=false;for(const b of pur.ledges)b.parent?.remove(b);pur.ledges=[];}}
 function clearLines(){for(const l of pur.lines){l.parent?.remove(l);l.geometry.dispose();l.material.dispose();}pur.lines=[];}
 function lineMat(color,op=.9){return new THREE.LineBasicMaterial({color,transparent:true,opacity:op,depthTest:false,toneMapped:false,fog:false});}
 function addLine(points,color,op){const g=new THREE.BufferGeometry().setFromPoints(points),l=new THREE.Line(g,lineMat(color,op));l.renderOrder=5;l.frustumCulled=false;pur.root.add(l);pur.lines.push(l);return l;}
 function feetY(){return s.pos.y-.42;}
 function readLedges(){
  for(const b of pur.ledges)b.parent?.remove(b);pur.ledges=[];
  const me=s.pos,f=feetY(),near=[];let cols=[];try{cols=allColliders(me.clone().add(new V3(-20,-3,-20)),me.clone().add(new V3(20,4,20)));}catch(e){}
  for(const c of cols){const b=c.box;if(!b)continue;const top=b.max.y-f;if(top<.6||top>2.6)continue;
   const p=new V3(clamp(me.x,b.min.x,b.max.x),b.max.y,clamp(me.z,b.min.z,b.max.z));const d=Math.hypot(p.x-me.x,p.z-me.z);if(d>20||d<.6)continue;
   if((b.max.x-b.min.x)>60||(b.max.z-b.min.z)>60)continue;near.push({p,d,rise:top});}
  near.sort((a,b)=>a.d-b.d);const picked=[];for(const n of near){if(picked.some(q=>q.p.distanceTo(n.p)<1.5))continue;picked.push(n);if(picked.length>=10)break;}
  for(const n of picked){const g=new THREE.Group();g.position.copy(n.p);g.position.y+=.03;
   const w=.45,h=.22,col=n.rise<1.3?0x5fe3e8:0x9fe9ff,mat=new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.9,depthTest:false,toneMapped:false,fog:false});
   for(const sx of [-1,1]){const up=new THREE.Mesh(new THREE.BoxGeometry(.04,h,.04),mat);up.position.set(sx*w,h/2,0);const foot=new THREE.Mesh(new THREE.BoxGeometry(.16,.04,.04),mat);foot.position.set(sx*(w-.08),0,0);up.renderOrder=foot.renderOrder=5;g.add(up,foot);}
   g.lookAt(new V3(s.pos.x,g.position.y,s.pos.z));g.userData={kind:n.rise<1.3?'VAULT':'CLIMB',rise:+n.rise.toFixed(2),d:+n.d.toFixed(1)};pur.root.add(g);pur.ledges.push(g);}
  pur.lastLedge=clock;
 }
 let riAt=-9,riVal=null;
 function runnerInfo(){if(clock-riAt<.1)return riVal;riAt=clock;return riVal=runnerInfo0();}
 function runnerInfo0(){const vp=window.verticalPursuit?.state?.();if(!vp||vp.phase!=='active'||!vp.runner)return null;
  const path=(vp.config.path||[]).map(p=>new V3(...p));return {pos:new V3(...vp.runner.position),wp:vp.waypoint,path,speed:vp.config.speed,pause:vp.config.cornerPause||0,phase:vp.phase};}
 // straight run from him to q, sampled on the real ground and colliders
 function assessLine(from,to){
  const len=Math.hypot(to.x-from.x,to.z-from.z),steps=Math.max(1,Math.ceil(len/.5));let prev=from.clone(),climbs=0,drops=0,blockedAt=-1;const pts=[from.clone()];
  for(let i=1;i<=steps;i++){const n=from.clone().lerp(to,i/steps);let y=prev.y;try{y=actorGroundHeight(n.x,n.z,prev.y);}catch(e){}
   const rise=y-prev.y;if(rise>2.6){blockedAt=i;break;}if(rise>.5)climbs++;if(rise<-1.4)drops++;n.y=y;
   let hit=false;try{hit=typeof actorSweep==='function'&&actorSweep(prev.clone().setY(Math.max(prev.y,y)),n.clone().setY(Math.max(prev.y,y)),.35);}catch(e){}
   if(hit&&rise<=.5){blockedAt=i;break;}prev=n;pts.push(n.clone());}
  return {len,climbs,drops,blocked:blockedAt>=0,pts,time:len/DASH+climbs*1.2};
 }
 function assessRoutes(){
  const R=runnerInfo();pur.routesAt=clock;clearLines();pur.routes=[];
  if(!R){return false;}
  const me=s.pos.clone();me.y=feetY();
  // runner's time to each point along its remaining route
  const cands=[];let t=0,p=R.pos.clone();const n=R.path.length;
  for(let i=R.wp;i<n;i++){const q=R.path[i];const seg=Math.hypot(q.x-p.x,q.z-p.z);const steps=Math.max(1,Math.ceil(seg/4));
   for(let k=1;k<=steps;k++){const c=p.clone().lerp(q,k/steps);cands.push({q:c,tr:t+seg*k/steps/R.speed,leg:i});}
   t+=seg/R.speed+R.pause;p=q.clone();}
  const scored=cands.map(c=>{const a=assessLine(me,c.q);return {...c,...a,margin:c.tr-a.time};});
  // the interception: the EARLIEST point on its route he can reach with a margin (route order), not the furthest
  const viable=scored.filter(r=>!r.blocked&&r.margin>=1);
  const pick=[];const best=viable[0];if(best)pick.push({name:best.drops?'Direct interception (drop)':best.climbs?'Direct interception (climb)':'Direct interception',...best});
  const alt=viable.find(r=>best&&r.q.distanceTo(best.q)>8&&(r.drops!==best.drops||r.climbs!==best.climbs))||viable.find(r=>best&&r.leg!==best.leg&&r.q.distanceTo(best.q)>8);if(alt)pick.push({name:alt.climbs?'Climb route':alt.drops?'Drop route':'Cut across',...alt});
  const follow={name:'Follow the runner (to its exit)',q:R.path[n-1],tr:t,margin:-(R.pos.distanceTo(me)/DASH),len:R.pos.distanceTo(me),climbs:0,drops:0,blocked:false,pts:[me.clone(),R.pos.clone(),...R.path.slice(R.wp)],time:R.pos.distanceTo(me)/DASH+t};pick.push(follow);
  const blocked=scored.filter(r=>r.blocked).sort((a,b)=>a.len-b.len)[0];if(blocked&&pick.length<4)pick.push({name:'Blocked line',...blocked});
  pur.routes=pick.map((r,i)=>({name:r.name,time:+r.time.toFixed(1),runner:+r.tr.toFixed(1),margin:+r.margin.toFixed(1),climbs:r.climbs,drops:r.drops,blocked:r.blocked,len:+r.len.toFixed(1),
   cls:r.blocked?'red':r.drops||r.margin<0?'amber':'',point:r.q.toArray().map(v=>+v.toFixed(2)),pts:r.pts}));
  for(const r of pur.routes){const col=r.cls==='red'?0xff5f45:r.cls==='amber'?0xffb43c:0x5fe3e8;addLine(r.pts.map(v=>v.clone().setY(v.y+.08)),col,/^Follow/.test(r.name)?.45:.95);}
  return true;
 }
 function useUtility(id,f){
  if(f.mp&&st.mp<f.mp){log(f.name+' · not enough MP','warn');return false;}
  if(f.sta&&st.sta<f.sta){log(f.name+' · not enough stamina','warn');return false;}
  if(f.utility==='burst'){if(!s.onGround){log('Burst Dash · needs footing','warn');return false;}if(!runner()?.perform?.(f.clip,{source:'loadout-pursuit'})){log('Burst Dash · clip unavailable','warn');return false;}st.sta-=f.sta;st.stats.forms++;log('Burst Dash','swap');return true;}
  st.mp-=f.mp||0;st.stats.forms++;
  if(f.utility==='ledges'){readLedges();pur.ledgeUntil=clock+8;log('Ledge Read · '+pur.ledges.length+' ledges ('+pur.ledges.filter(l=>l.userData.kind==='VAULT').length+' vault, '+pur.ledges.filter(l=>l.userData.kind==='CLIMB').length+' climb) from real geometry','analyze');return true;}
  if(f.utility==='route'){if(!assessRoutes()){const vp=window.verticalPursuit?.state?.();const tr=vp?.config?.trigger?new V3(...vp.config.trigger):null;log('Route Assessment · no fleeing target'+(tr?' · pursuit access '+Math.round(tr.distanceTo(s.pos))+' m (I there)':''),'analyze');return true;}
   const best=pur.routes[0];log('Route Assessment · '+pur.routes.length+' routes · best: '+best.name+' '+best.time+' s'+(best.margin>=0?' · ahead of runner by '+best.margin+' s':' · arrives after runner'),'analyze');xp(10,'Pursuit · route assessed');return true;}
  if(f.utility==='intercept'){pur.tracking=!pur.tracking;log('Target Interception '+(pur.tracking?'tracking':'off'),'analyze');return true;}
  return false;
 }
 function tickPursuit(dt){
  if(!pur.on)return;
  if(clock<pur.ledgeUntil&&clock-pur.lastLedge>1)readLedges();
  if(clock>=pur.ledgeUntil&&pur.ledges.length){for(const b of pur.ledges)b.parent?.remove(b);pur.ledges=[];}
  const R=runnerInfo();
  if(R&&clock-pur.routesAt>1.5&&pur.routes.length)assessRoutes();
  if(!R&&pur.routes.length){pur.routes=[];clearLines();}
  // runner vector (next 1.5 s along its route) and remaining route
  if(pur.trackLine){pur.trackLine.parent?.remove(pur.trackLine);pur.trackLine.geometry.dispose();pur.trackLine.material.dispose();pur.trackLine=null;}
  if(R&&pur.tracking){let left=R.speed*1.5,p=R.pos.clone(),pts=[p.clone()];for(let i=R.wp;i<R.path.length&&left>0;i++){const q=R.path[i],d=p.distanceTo(q);if(d>=left){pts.push(p.clone().lerp(q,left/d));left=0;}else{pts.push(q.clone());left-=d;p=q.clone();}}
   const g=new THREE.BufferGeometry().setFromPoints(pts.map(v=>v.clone().setY(v.y+.15)));pur.trackLine=new THREE.Line(g,lineMat(0xffb43c,1));pur.trackLine.renderOrder=6;pur.trackLine.frustumCulled=false;pur.root.add(pur.trackLine);}
 }
 function paintRoutes(){
  if(!el.loRoutes)return;const show=pur.on&&isLoadout();el.loRoutes.hidden=!show||st.questOpen;if(!show)return;
  const R=runnerInfo();
  el.loRoutes.innerHTML=`<h3>PURSUIT${R?' — FLEEING TARGET':''}</h3>`+(pur.routes.length?pur.routes.map(r=>`<div class="r ${r.cls}"><b>${r.name}</b> · ${Math.max(0,r.time*.9).toFixed(0)}–${(r.time*1.15).toFixed(0)} s${r.drops?' · '+r.drops+' unsafe landing':''}${r.climbs?' · '+r.climbs+' climb':''}${r.blocked?' · blocked by geometry':''}<br>${r.blocked?'Not viable.':r.margin>=0?'Can intercept ahead of the runner (~'+r.margin+' s margin).':'Arrives after the runner.'}</div>`).join('')+'<p>Illustrative route assessment, not a guaranteed outcome. You still have to run it.</p>'
   :`<p>${R?'2: Route Assessment · 3: Target Interception':'No fleeing target. Start the transit pursuit at its access marker (I).'} · 4: Ledge Read${pur.ledges.length?' ('+pur.ledges.length+' marked)':''} · 1: Burst Dash</p>`);
 }


 // ---------- GAMEPAD (v3) ----------
 const P={prev:[],rtAt:-9,rtUsed:false,drAt:-9,duAt:-9,r3Used:false,lastPad:-99,strikeRelease:false,analyze:false,guard:false,interact:false,status:false,
  reset(){this.analyze=this.guard=this.interact=this.status=false;this.rtUsed=false;this.r3Used=false;}};
 const padRecent=()=>clock-P.lastPad<5;
 function poll(now,gp){
  const raw=now.slice();
  if(!isLoadout()||!gameActive){P.prev=raw;P.reset();return;}
  const prev=P.prev,edge=i=>!!raw[i]&&!prev[i],rel=i=>!raw[i]&&!!prev[i],mask=(...ids)=>{for(const i of ids)now[i]=false;};
  if(iv.open){const ed=i=>!!raw[i]&&!prev[i];if(!raw[14]&&prev[14]){P.dlAt=-9;closeCarousel(true);}else if(ed(1)){P.dlAt=-9;closeCarousel(false);log('Belt Inventory · cancelled','gear');}
   if(ed(0)){P.dlAt=-9;closeCarousel(true);}if(ed(4)||ed(12))stepSel(-1);if(ed(5)||ed(15)||ed(13))stepSel(1);const ax=gp?.axes||[],x=Math.abs(ax[2]||0)>Math.abs(ax[0]||0)?ax[2]:(ax[0]||0),sd=Math.abs(x)>.6?Math.sign(x):0;if(sd&&(sd!==P.invDir||clock-(P.invAt||-9)>.28)){P.invAt=clock;stepSel(sd);}P.invDir=sd;
   try{input.actions.moveX=input.actions.moveY=input.actions.moveMag=0;input.actions.lookX=input.actions.lookY=input.actions.lookMag=0;input.actions.aim=false;}catch(e){}
   for(let i=0;i<now.length;i++)if(i!==9)now[i]=false;P.reset();if(!iv.open)P.sticky=raw.map(Boolean);P.prev=raw;return;}
  if(ui.open){padCore(raw,prev,gp);for(let i=0;i<now.length;i++)if(i!==9)now[i]=false;P.reset();if(!ui.open){P.sticky=raw.map(Boolean);P.viewAt=-9;}P.prev=raw;return;}
  if(P.sticky){let any=false;for(let i=0;i<now.length;i++){if(P.sticky[i]&&raw[i]){now[i]=false;any=true;}else P.sticky[i]=false;}if(!any)P.sticky=null;}
  // View tap (no other button while it was held): open the Core Wheel
  if(edge(8)){P.viewAt=clock;P.viewOther=false;}if(raw[8]&&raw.some((v,i)=>v&&i!==8))P.viewOther=true;
  if(rel(8)&&!P.viewOther&&clock-P.viewAt<.5){openInterface();P.viewAt=-9;}mask(8);
  if(raw.some(Boolean))P.lastPad=clock;
  if(P.strikeRelease){P.strikeRelease=false;window.backspoolCombat?.releaseAttack?.();}
  const lt=!!raw[6],rt=!!raw[7];
  // LT: Analyze (Backspool's LT guard stands down for Loadout)
  P.analyze=lt;if(lt&&typeof input!=='undefined'&&input.actions)input.actions.aim=false;
  if(lt&&edge(11)){toggleDeepScan();P.r3Used=true;}if(P.r3Used){mask(11);if(!raw[11])P.r3Used=false;}
  if(lt&&edge(12)){st.questOpen=!st.questOpen;P.duAt=-9;}
  // RT: Forms with face buttons; a plain tap is the basic strike
  if(edge(7)){P.rtAt=clock;P.rtUsed=false;}
  const FACE={2:0,3:1,0:2,1:3},WHEEL={2:0,3:1,0:2};
  if(st.wheel?.pad){for(const b in WHEEL)if(edge(+b)&&WHEEL[b]<LOADOUTS.length){st.wheel.picked=true;swapTo(WHEEL[b]);}mask(0,1,2,3);}
  else if(rt){for(const b in FACE)if(edge(+b)){useForm(FACE[b]);P.rtUsed=true;}mask(0,1,2,3);}
  if(rel(7)&&!P.rtUsed&&clock-P.rtAt<.3){window.backspoolCombat?.pressAttack?.();P.strikeRelease=true;}
  mask(6,7);
  // D-right: hotswap (tap) / wheel (hold)
  if(edge(15))P.drAt=clock;
  if(raw[15]&&!st.wheel&&clock-P.drAt>=.3)st.wheel={opened:clock,pad:true};
  if(rel(15)){if(st.wheel?.pad)st.wheel=null;else if(clock-P.drAt<.3)swapTo(st.prevLoadout!==st.loadout?st.prevLoadout:(st.loadout+1)%LOADOUTS.length);}
  // D-left: baton
  if(edge(14))P.dlAt=clock;if(raw[14]&&!iv.open&&!ui.open&&P.dlAt>0&&clock-P.dlAt>=.3)openCarousel();if(rel(14)&&P.dlAt>0){if(clock-P.dlAt<.3)quick();P.dlAt=-9;}
  // D-up: Status glance (tap) / Body Inspection (hold); with LT it was the Quest panel above
  if(!lt&&edge(12)){P.duAt=clock;st.statusUntil=clock+3.5;}
  P.status=!lt&&!!raw[12]&&P.duAt>0&&clock-P.duAt>=.35;
  mask(12,14,15);
  // LB with the stick still: guard (with the stick: the Runner's strafe, untouched)
  const ax=gp?.axes||[],stick=Math.hypot(ax[0]||0,ax[1]||0);P.guard=!!raw[4]&&stick<.25&&!rt;
  // Y near the trapped worker: hold to free him
  if(nearFieldCutter()&&!rt&&edge(3)){pickCutter();mask(3);}
  if(st.nearWorker&&!rt&&!st.wheel){P.interact=!!raw[3];mask(3);}else P.interact=false;
  P.prev=raw;
 }
 function ownsPadFire(){return isLoadout()&&gameActive;}

 // ---------- CORE WHEEL + DEEP INTERFACE (v4) ----------
 // Everything here reads and writes the same state the gameplay uses: a deck edit changes what 1-4 / RT+face perform,
 // a repair changes the real baton, Records and Titles are counted from what actually happened. The world keeps running
 // while the Interface is open (enemies are not paused); Loadout stands still while he looks at it.
 const SAVE4='loadoutInterfaceV4';
 const store=(()=>{let d={};try{d=JSON.parse(localStorage.getItem(SAVE4))||{};}catch(e){}
  return Object.assign({credits:0,deck:null,activeTitle:'hotswap',life:{},formUses:{},observed:{},quests:[],anomalies:[]},d);})();
 const persist4=()=>{try{localStorage.setItem(SAVE4,JSON.stringify(store));}catch(e){}};
 const COMBAT_POOL=['slip','tempo','cross','feint','clinch','sweep','throw','frame'],PURSUIT_POOL=['burst','route','intercept','vaultread'];
 if(Array.isArray(store.deck))store.deck.forEach((forms,i)=>{const pool=i===2?PURSUIT_POOL:COMBAT_POOL;if(LOADOUTS[i]&&Array.isArray(forms)&&forms.length===4&&forms.every(f=>pool.includes(f))&&new Set(forms).size===4)LOADOUTS[i].forms=forms.slice();});
 const SECTIONS=[
  {id:'status',name:'STATUS',desc:'Body-mapped integrity, which Forms each injury affects, resources, Level and Saturation.',fast:'B / D↑ glance'},
  {id:'skills',name:'SKILLS',desc:'Movement Echo library: acquired Forms, incomplete Forms, requirements and how often you have used each.',fast:'—'},
  {id:'loadouts',name:'LOADOUTS',desc:'Build Deck: four Form sockets per preset, injury compatibility, rearrange Forms, equip a preset.',fast:'Q / D→ swap · hold for wheel'},
  {id:'inventory',name:'INVENTORY',desc:'Belt sockets: registered equipment, its condition, draw or stow it.',fast:'X / D← baton'},
  {id:'quests',name:'QUESTS',desc:'Active Quest, the Interface’s recommendation, what it left out, and your past decisions.',fast:'J / LT+D↑'},
  {id:'shop',name:'SHOP',desc:'Tactical configurator: repairs, blueprints, registration prerequisites and costs.',fast:'—'},
  {id:'titles',name:'TITLES',desc:'Earned Titles and Conditions: what you have done, and what the world may start to believe you are.',fast:'—'},
  {id:'records',name:'RECORDS',desc:'Observed techniques, encounters, unclassified signals, The Blank, and the full Interface event log.',fast:'—'}];
 const ui={open:null,sel:0,row:0,col:0,mx:0,my:0,dirty:true,repaintAt:0,msg:'',msgUntil:0,stickAt:-9,stickDir:null};
 // ----- what happened (lifetime counters, from the real gameplay state) -----
 let lastStats={...st.stats},lastLogLen=0,lastLogRef=null,lastForm=null,lastSeen=null,lastEncRef=null,lastSummary=null;
 function bump(k,n=1){store.life[k]=(store.life[k]||0)+n;}
 function track(){
  let changed=false;
  for(const k in st.stats){const d=st.stats[k]-(lastStats[k]||0);if(d>0){bump(k,d);changed=true;}}lastStats={...st.stats};
  if(st.form&&st.form!==lastForm){store.formUses[st.form.id]=(store.formUses[st.form.id]||0)+1;changed=true;}lastForm=st.form;
  // new log lines since last frame (the log keeps the last 40)
  const L=st.log,lastEntry=L[L.length-1];if(lastEntry&&lastEntry!==lastLogRef){let i=L.length-1;while(i>=0&&L[i]!==lastLogRef)i--;
   for(const e of L.slice(i+1)){const t=e.text;
    if(/^\+\d+ XP · Tactical adaptation/.test(t))bump('transitions');
    if(/baited a learned counter/.test(t))bump('baits');
    if(/Pursuit · route assessed/.test(t))bump('routes');
    if(/^Voice detected · unclassified/.test(t)){bump('voices');store.anomalies.push({what:'Unclassified voice',where:'Sparring encounter',when:Date.now(),note:'Not in the Quest model. Source located: trapped worker.'});if(store.anomalies.length>20)store.anomalies.shift();}
    if(/Skill acquisition/.test(t))bump('acquired');changed=true;}
   lastLogRef=lastEntry;}
  // techniques observed while analyzing
  const t=st.enc?.t;if(t&&st.enc!==lastEncRef){lastEncRef=st.enc;lastSeen={...t.seen};}
  if(t&&lastSeen){for(const k in t.seen){const d=t.seen[k]-(lastSeen[k]||0);if(d>0){const o=store.observed[k]||(store.observed[k]={n:0,first:Date.now()});o.n+=d;changed=true;}}lastSeen={...t.seen};}
  // encounter outcomes -> Quest history and credits
  const sum=st.enc?.summary;if(sum&&sum!==lastSummary){lastSummary=sum;if(sum.outcome==='LOADOUT down')onDefeat(st.enc);else if(sum.outcome==='construct down')onWin(st.enc);const cr=(sum.outcome==='construct down'?20:0)+(sum.freed?15:0);store.credits+=cr;
   store.quests.unshift({name:'Sparring construct · trapped worker',outcome:sum.outcome,freed:sum.freed,heard:sum.heard,offScript:!!sum.offScript,hp:sum.hp,credits:cr,when:Date.now()});if(store.quests.length>12)store.quests.pop();
   if(cr)log('+'+cr+' CR · '+(sum.freed?'occupant freed':'')+(sum.freed&&sum.outcome==='construct down'?' · ':'')+(sum.outcome==='construct down'?'construct neutralised':''),'xp');changed=true;}
  if(changed){persist4();ui.dirty=true;}
 }
 // ----- Titles (earned from lifetime counters; Conditions shown as not built) -----
 const TITLES=[
  {id:'hotswap',name:'HOTSWAP',why:'Competitive handle. Shown in the Interface header.',need:()=>true,prog:()=>'held'},
  {id:'reader',name:'PATTERN READER',why:'Read an attack correctly with Analyze 3 times.',need:()=>(store.life.predictedRight||0)>=3,prog:()=>Math.min(3,store.life.predictedRight||0)+'/3'},
  {id:'counter',name:'COUNTER WINDOW',why:'Land 3 counters inside an attack’s window.',need:()=>(store.life.counters||0)>=3,prog:()=>Math.min(3,store.life.counters||0)+'/3'},
  {id:'bait',name:'FALSE EXPECTATION',why:'Bait a counter the opponent learned from you.',need:()=>(store.life.baits||0)>=1,prog:()=>Math.min(1,store.life.baits||0)+'/1'},
  {id:'transition',name:'CLEAN TRANSITION',why:'Counter or feint, hotswap, then clinch in one sequence.',need:()=>(store.life.transitions||0)>=1,prog:()=>Math.min(1,store.life.transitions||0)+'/1'},
  {id:'offscript',name:'OFF-SCRIPT',why:'Free someone the Interface’s Quest left out.',need:()=>store.quests.some(q=>q.offScript),prog:()=>store.quests.some(q=>q.offScript)?'1/1':'0/1'},
  {id:'route',name:'ROUTE FINDER',why:'Assess an interception route during a chase.',need:()=>(store.life.routes||0)>=1,prog:()=>Math.min(1,store.life.routes||0)+'/1'}];
 const CONDITIONS=[
  {id:'outclassed',name:'OUTCLASSED'},
  {id:'indexed',name:'INDEXED',why:'Locked. Narrative conditions unmet.',state:'LOCKED',note:'Cannot be earned with XP or Level.'}];
 Object.defineProperty(CONDITIONS[0],'state',{get:()=>store.condition?'ACTIVE · pressure '+store.condition.pressure+'% · contradicted '+store.condition.contradictions+'/3':'NOT ACTIVE · witness pressure 0'});
 Object.defineProperty(CONDITIONS[0],'note',{get:()=>store.condition?'Your Interface exaggerates '+store.condition.against+'. Its real attacks are unchanged. To clear it: counter or evade 3 predicted attacks while it is active, then win with at least 2 witnesses watching.':'Gained by going down with at least 2 witnesses watching. Cleared only by contradicting it in front of witnesses.'});
 Object.defineProperty(CONDITIONS[0],'why',{get:()=>'A Condition from what witnesses believe after a loss. It distorts threat perception, not the opponent.'});
 const earnedTitles=()=>TITLES.filter(t=>t.need());
 const activeTitle=()=>{const t=TITLES.find(x=>x.id===store.activeTitle);return t&&t.need()?t:TITLES[0];};
 // ----- Shop -----
 const SHOP=[
  {id:'repair',name:'Baton · field repair',cost:30,kind:'repair',parts:'Grip tape, splint sleeve, core pin',route:'Field kit carried on the belt. Restores the registered baton; it does not make a new one.'},
  {id:'flash',name:'Flash capsule ×2 (C2)',cost:80,kind:'blueprint',parts:'Pressed canister, magnesium charge',route:'Supplier: unknown. Would fill consumable position C2.'},
  {id:'smoke',name:'Smoke capsule · restock 1',cost:25,kind:'smoke',parts:'Pressed canister, pull ring',route:'Bought, not made: one capsule into socket 05 (max 2).'},
  {id:'medkit',name:'Medical kit · refill',cost:40,kind:'med',parts:'Splints, compression wrap, doses',route:'Bought, not made: the kit back to 4 doses.'}];
 function buy(item){
  if(item.kind==='blueprint'){say(item.name+' · acquisition route not available in this build');return;}
  if(item.kind==='smoke'||item.kind==='med'){const full=item.kind==='smoke'?inv.smoke>=inv.smokeMax:inv.med>=inv.medMax;if(full){say(item.name.split(' · ')[0]+' already full');return;}
   if(store.credits<item.cost){say('Not enough credits · '+store.credits+'/'+item.cost+' CR');return;}store.credits-=item.cost;if(item.kind==='smoke')inv.smoke++;else inv.med=inv.medMax;persistInv();log('Shop · '+item.name+' · −'+item.cost+' CR','gear');say(item.name+' · done');return;}
  const b=st.baton;if(!b.broken&&b.durability>=b.max){say('Baton already at full integrity');return;}
  if(st.enc&&st.enc.outcome==='active'){say('Field repair needs a pause in the fight (encounter active)');return;}
  if(store.credits<item.cost){say('Not enough credits · '+store.credits+'/'+item.cost+' CR');return;}
  store.credits-=item.cost;b.durability=b.max;b.broken=false;persist();persist4();log('Shop · baton repaired · −'+item.cost+' CR','gear');say('Baton repaired · '+b.max+'/'+b.max);}
 function say(t){ui.msg=t;ui.msgUntil=clock+3;ui.dirty=true;}
 // ----- open / close / navigate -----
 function openInterface(page){if(!isLoadout()||!gameActive)return;if(iv.open){iv.holdAt=null;closeCarousel(false);}
  if(!ui.open){try{for(const k of ['w','a','s','d','shift','space'])if(typeof keys!=='undefined'&&k in keys)keys[k]=false;}catch(e){}
   st.wheel=null;holds.q=null;st.guardKey=st.analyzeMouse=false;log('Interface open · the world keeps running','info');}
  ui.open=page||'wheel';ui.row=0;ui.col=page==='loadouts'?st.loadout:0;ui.mx=ui.my=0;ui.dirty=true;}
 function closeInterface(){if(!ui.open)return;ui.open=null;ui.dirty=true;}
 function back(){if(ui.open&&ui.open!=='wheel'){const i=SECTIONS.findIndex(x=>x.id===ui.open);ui.open='wheel';ui.sel=Math.max(0,i);ui.dirty=true;}else closeInterface();}
 function cyclePage(d){if(!ui.open)return;let i=SECTIONS.findIndex(x=>x.id===ui.open);if(i<0)i=ui.sel;i=(i+d+8)%8;ui.sel=i;openInterface(SECTIONS[i].id);}
 function rowsFor(id){switch(id){case 'status':return 4;case 'skills':return skillList().length;case 'loadouts':return 5;case 'inventory':return 7;case 'quests':return Math.max(1,questList().length);case 'shop':return SHOP.length;case 'titles':return TITLES.length+CONDITIONS.length;case 'records':return 6;}return 1;}
 function nav(dx,dy){if(!ui.open)return;
  if(ui.open==='wheel'){if(dx||dy)ui.sel=(ui.sel+(dx||dy)+8)%8;ui.dirty=true;return;}
  const id=ui.open;
  if(id==='loadouts'&&dx){ui.col=(ui.col+dx+LOADOUTS.length)%LOADOUTS.length;}
  else if(id==='inventory'&&dx){ui.row=(ui.row+dx+7)%7;}
  else if(dy){const n=rowsFor(id);ui.row=(ui.row+dy+n)%n;}
  ui.dirty=true;}
 function confirm(){if(!ui.open)return;
  if(ui.open==='wheel'){openInterface(SECTIONS[ui.sel].id);return;}
  const id=ui.open;
  if(id==='loadouts'){const lo=LOADOUTS[ui.col];
   if(ui.row===4){if(ui.col===st.loadout)say(lo.name+' is already equipped');else if(swapTo(ui.col))say('Hotswap → '+lo.name+' · 0.7 s');return;}
   if(st.enc&&st.enc.outcome==='active'){say('Deck locked during an encounter · use hotswap');return;}
   if(st.swap||(st.form&&!st.form.done)){say('Finish the current action first');return;}
   const pool=ui.col===2?PURSUIT_POOL:COMBAT_POOL,cur=lo.forms[ui.row];let next=pool[(pool.indexOf(cur)+1)%pool.length];
   const j=lo.forms.indexOf(next);if(j>=0){lo.forms[j]=cur;}lo.forms[ui.row]=next;
   store.deck=LOADOUTS.map(l=>l.forms.slice());persist4();log('Build Deck · '+lo.name+' socket '+(ui.row+1)+' → '+FORMS[next].name+(j>=0?' (swapped with socket '+(j+1)+')':''),'swap');say('Socket '+(ui.row+1)+' → '+FORMS[next].name);return;}
  if(id==='inventory'){inv.sel=ui.row;persistInv();const ok=retrieve(ui.row);if(ok&&SOCKETS[ui.row].id==='baton')say(st.baton.out?'Baton in hand':'Baton stowed');else if(ok)say(SOCKETS[ui.row].name+' · used');return;}
  if(id==='shop'){buy(SHOP[ui.row]);return;}
  if(id==='titles'){const t=TITLES[ui.row];if(t&&t.need()){store.activeTitle=t.id;persist4();say('Active Title · '+t.name);}else if(t)say(t.name+' · not earned yet · '+t.prog());else say(CONDITIONS[ui.row-TITLES.length].note);return;}
 }
 // ----- page data -----
 function skillList(){const out=Object.keys(FORMS).map(id=>({id,f:FORMS[id],kind:'form'}));
  const g=st.echo?.grab||0;out.push({id:'reversal',kind:'incomplete',f:{name:'Grip Reversal',parts:['leftArm','rightArm']},echo:g});return out;}
 function questList(){const out=[];const e=st.enc;if(e)out.push({kind:'active',e});
  const vp=window.verticalPursuit?.state?.();if(vp&&vp.phase==='active')out.push({kind:'pursuit',vp});
  for(const q of store.quests)out.push({kind:'history',q});return out;}
 const esc=t=>String(t).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
 const pct=v=>Math.round(v)+'%',bandCls=v=>v<75?'bad':v<90?'warn':'ok';
 const ago=ms=>{const s2=(Date.now()-ms)/1000;return s2<90?Math.round(s2)+' s ago':s2<5400?Math.round(s2/60)+' min ago':Math.round(s2/3600)+' h ago';};
 function usedBy(id){return LOADOUTS.filter(l=>l.forms.includes(id)).map(l=>l.name);}
 function pageStatus(){
  const parts=Object.keys(PARTS),sel=parts[ui.row]||parts[0];
  const col=p=>{const v=st.body[p];return v<75?'#ff5f45':v<90?'#ffb43c':'#5fe3e8';},sw=p=>p===sel?3:1.2;
  const fig=`<svg viewBox="0 0 160 300" class="fig"><circle cx="80" cy="30" r="18" fill="none" stroke="#d9f6ff" stroke-width="1.2" opacity=".7"/>
   <path d="M56 54h48l6 92H50z" fill="${col('torso')}22" stroke="${col('torso')}" stroke-width="${sw('torso')}"/>
   <path d="M104 56l22 8 8 74-12 2-10-62z" fill="${col('leftArm')}22" stroke="${col('leftArm')}" stroke-width="${sw('leftArm')}"/>
   <path d="M56 56l-22 8-8 74 12 2 10-62z" fill="${col('rightArm')}22" stroke="${col('rightArm')}" stroke-width="${sw('rightArm')}"/>
   <path d="M52 150h26l-2 130H58zM82 150h26l-6 130H84z" fill="${col('legs')}22" stroke="${col('legs')}" stroke-width="${sw('legs')}"/>
   <circle cx="80" cy="146" r="7" fill="none" stroke="#5fe3e8" stroke-width="1.5"/><text x="80" y="296" text-anchor="middle" font-size="9" fill="#9fb8c4">FRONT VIEW</text></svg>`;
  const rows=parts.map((p,i)=>`<div class="row ${i===ui.row?'sel':''} ${bandCls(st.body[p])}"><span>${PARTS[p]}</span><b>${pct(st.body[p])}</b></div>`).join('');
  const forms=Object.keys(FORMS).filter(id=>FORMS[id].parts.includes(sel)&&!FORMS[id].utility).map(id=>{const r=reliability(FORMS[id]),f=FORMS[id],bad=f.heavy?r<.75:r<.8;return `<div class="row ${bad?'bad':''}"><span>${f.name}${f.heavy?' · heavy':''}</span><b>${Math.round(r*100)}%</b></div>`;}).join('')||'<p class="dim">No combat Forms rely on this part.</p>';
  const inj=st.log.filter(l=>l.kind==='injury'&&l.text.includes(PARTS[sel])).slice(-3).map(l=>`<p>${esc(l.text)}</p>`).join('')||'<p class="dim">No injury events this session.</p>';
  return `<div class="cols3"><div>${fig}</div><div><h4>BODY</h4>${rows}<h4>${PARTS[sel].toUpperCase()} · FORMS THAT USE IT</h4>${forms}<h4>EVENTS</h4>${inj}</div>
   <div><h4>RESOURCES</h4><div class="row"><span>HP</span><b>${Math.round(st.hp)}</b></div><div class="row"><span>MP</span><b>${Math.round(st.mp)}</b></div><div class="row"><span>STA</span><b>${Math.round(st.sta)}</b></div><div class="row"><span>Archive Saturation</span><b>${Math.round(scan.sat)}%</b></div>
   <h4>INTERFACE</h4><div class="row"><span>Level</span><b>${st.level}</b></div><div class="row"><span>XP</span><b>${st.xp} / ${xpFor(st.level+1)}</b></div>
   <p class="dim">Level expands what the Interface can process. It does not raise his physical strength; that comes from training, which is not built yet.</p><h4>CONDITIONS</h4>${store.condition?`<div class="row bad"><span>OUTCLASSED</span><b>${store.condition.pressure}%</b></div><p class="dim">Perception distortion: the opponent\u2019s real attacks are unchanged. Contradicted ${store.condition.contradictions}/3.</p>`:'<p class="dim">None active.</p>'}<p class="dim">The belt is equipment and can be damaged. The Interface is his Moniker.</p></div></div>`;}
 function pageSkills(){const L=skillList(),it=L[ui.row]||L[0];
  const list=L.map((x,i)=>`<div class="row ${i===ui.row?'sel':''} ${x.kind==='incomplete'?'warn':''}"><span>${x.f.name}</span><b>${x.kind==='incomplete'?(x.echo>=3?'RECORDED':'ECHO '+x.echo+'/3'):(store.formUses[x.id]||0)+'×'}</b></div>`).join('');
  let d;if(it.kind==='incomplete'){d=`<h4>${it.f.name.toUpperCase()} · INCOMPLETE FORM</h4><p>Source: the construct’s feint into grab, recorded as Movement Echoes while you analyzed it.</p><div class="row"><span>Movement Echoes</span><b>${Math.min(3,it.echo)}/3</b></div>
    <p class="dim">${it.echo>=3?'Recorded. Ty has not trained it yet, so it cannot be equipped. Training is not built yet.':'Analyze the construct while it performs its feint into grab to record more.'}</p>`;}
  else{const f=it.f,r=reliability(f);d=`<h4>${f.name.toUpperCase()}</h4><div class="row"><span>Body parts</span><b>${f.parts.map(p=>PARTS[p]).join(', ')}</b></div><div class="row"><span>Reliability now</span><b>${f.utility&&f.utility!=='burst'?'—':Math.round(r*100)+'%'}</b></div>
    <div class="row"><span>${f.mp?'MP':'Stamina'}</span><b>${f.mp||f.sta}</b></div>${f.reach?`<div class="row"><span>Reach</span><b>${f.reach} m</b></div>`:''}<div class="row"><span>Uses</span><b>${store.formUses[it.id]||0}</b></div>
    <div class="row"><span>Equipped in</span><b>${usedBy(it.id).join(', ')||'not equipped'}</b></div>
    <p>${f.counter?'Slips the strike, then counters inside its window (2.2×).':f.bait?'A lead the construct learns to counter after two.':f.feint?'Baits a learned counter into a whiff.':f.needsClinch?'Needs a clinch first.':f.clinch?'Opens a clinch for Balance Break and Grip Throw.':f.escape?'Creates distance.':f.utility==='route'?'Scores interception routes on the runner’s real path.':f.utility==='intercept'?'Shows the runner’s next 1.5 s.':f.utility==='ledges'?'Marks vaultable and climbable ledges from real geometry.':f.travel?'A travelling dash through the movement owner.':''}${f.heavy?' Heavy: fails below 75% integrity.':''}</p>
    ${f.clip?`<p class="dim">Clip: ${f.clip} (placeholder from the Runner Action pack).</p>`:''}`;}
  return `<div class="cols2"><div class="list">${list}</div><div>${d}</div></div>`;}
 function pageLoadouts(){
  const deck=LOADOUTS.map((l,i)=>{const c=compromised(i);return `<div class="deck ${i===ui.col?'on':''}"><h4>${l.name}${i===st.loadout?' · EQUIPPED':''}</h4><small>${l.blurb}</small>
   <div class="sockets">${l.forms.map((id,j)=>{const f=FORMS[id],r=f.utility&&f.utility!=='burst'?1:reliability(f),bad=f.heavy?r<.75:r<.8;return `<div class="sock ${i===ui.col&&j===ui.row?'sel':''} ${bad?'bad':''}"><kbd>${j+1}</kbd>${f.name}<small>${r<1?Math.round(r*100)+'%':'ok'}</small></div>`;}).join('')}</div>
   <div class="sock eq ${i===ui.col&&ui.row===4?'sel':''}">${i===st.loadout?'EQUIPPED':'EQUIP (hotswap 0.7 s)'}</div>${c.length?`<p class="warn">Compatibility · ${c.length} Form${c.length>1?'s':''} compromised: ${c.map(id=>FORMS[id].name).join(', ')}</p>`:'<p class="dim">No compromised Forms.</p>'}</div>`;}).join('');
  return `<div class="decks">${deck}<div class="deck locked"><h4>RESCUE</h4><small>Not prepared</small></div></div><p class="dim">Select a socket and confirm to put the next Form there (a Form already in the deck swaps places). Combat presets take combat Forms; Pursuit takes Pursuit Forms. The deck locks while an encounter is active.</p>`;}
 function pageInventory(){const S=SOCKETS[ui.row]||SOCKETS[0];
  const ring=SOCKETS.map((X,i)=>{const a=(-170+i*40)*Math.PI/180,x=i<5?50+40*Math.cos(a):(i===5?34:66),y=i<5?64+44*Math.sin(a):90,stt=X.id?invItemState(X.id):'EMPTY',full=X.id&&!/EMPTY|^0\/|NOT REGISTERED|LOCATED/.test(stt);
   return `<div class="bsock ${i===ui.row?'sel':''} ${full?'full':''} ${i>4?'small':''}" style="left:${x}%;top:${y}%"><b>${X.slot}</b><small>${X.id?X.name.toUpperCase():'EMPTY'}</small></div>`;}).join('');
  const notes={baton:'Its condition is saved; a broken baton comes back broken. Shop has a field repair.',grapnel:'Fires at the nearest wall in front. The cable stays where it was strung and trips what walks through it low; walk to the spool to reel it in.',
   medkit:'2.4 s treatment, exposed: +25 to the worst body part, +15 HP. Doses run out; the Shop refills it, the belt cannot.',cutter:'Lies near the trapped worker. Carried in hand it frees people faster. Register it by freeing 2 people with it.',smoke:'A 6 s cloud at the opponent; it cannot start an attack while either of you is inside. Used capsules are gone.'};
  const it=S.id?`<h4>${S.name.toUpperCase()} · ${S.consumable?'CONSUMABLE ':'SOCKET '}${S.slot}</h4><div class="row"><span>State</span><b>${invItemState(S.id)}</b></div><p>${notes[S.id]}</p><p class="dim">Confirm to use it. X / D\u2190 uses the selected item in play; hold it for the belt.</p>`
   :`<h4>${S.consumable?'CONSUMABLE ':'SOCKET '}${S.slot}</h4><p class="dim">Empty. Nothing is registered here.</p>`;
  return `<div class="cols2"><div class="belt"><div class="core"></div>${ring}</div><div>${it}</div></div>`;}
 function pageQuests(){const L=questList();if(!L.length)return `<p>No active Quest and no history yet. T starts the sparring encounter; I at the concourse access starts the transit chase.</p>`;
  const it=L[Math.min(ui.row,L.length-1)];
  const list=L.map((x,i)=>`<div class="row ${i===Math.min(ui.row,L.length-1)?'sel':''}"><span>${x.kind==='active'?'ACTIVE · Sparring construct':x.kind==='pursuit'?'ACTIVE · Transit pursuit':'DONE · '+esc(x.q.outcome)}</span><b>${x.kind==='history'?ago(x.q.when):''}</b></div>`).join('');
  let d='';if(it.kind==='active'){const e=it.e,w=e.worker;d=`<h4>PRIMARY QUEST · NEUTRALISE THE CONSTRUCT</h4><p>${esc(el.loQuest?.textContent||'')}</p><h4>EVIDENCE</h4><p>Construct HP ${Math.round(e.t.hp)}/${e.t.maxHp}. Observed: ${ATTACK_IDS.filter(k=>e.t.seen[k]).map(k=>ATTACKS[k].name+' ×'+e.t.seen[k]).join(', ')||'nothing yet'}.</p>
    <h4>ALTERNATIVES</h4>${w.heard?`<p class="ex">Unconfirmed occupant: excluded from the model.</p><p>ROUTE B (unverified) · free the trapped worker (hold I / Y at the amber ring). You are exposed while you do it.</p>`:'<p class="dim">None classified.</p>'}<h4>UNRESOLVED</h4><p>${w.freed?'Occupant freed'+(e.offScript?' · OFF-SCRIPT':''):w.heard?'Who is calling, and whether the Quest’s estimate holds without them.':'—'}</p>`;}
  else if(it.kind==='pursuit')d=`<h4>TRANSIT PURSUIT</h4><p>The runner is on its route. Equip PURSUIT for routes, interception and ledges.</p><p class="dim">Illustrative assessments only. You still have to run it.</p>`;
  else{const q=it.q;d=`<h4>${esc(q.name).toUpperCase()}</h4><div class="row"><span>Outcome</span><b>${esc(q.outcome)}</b></div><div class="row"><span>Occupant</span><b>${q.freed?'freed':q.heard?'left behind':'never heard'}</b></div><div class="row ${q.offScript?'warn':''}"><span>Interface recommendation</span><b>${q.offScript?'REFUSED (OFF-SCRIPT)':'followed'}</b></div><div class="row"><span>HP at the end</span><b>${q.hp}</b></div><div class="row"><span>Credits</span><b>+${q.credits}</b></div><p class="dim">Your choice is kept here with its consequences.</p>`;}
  return `<div class="cols2"><div class="list">${list}</div><div>${d}</div></div>`;}
 function pageShop(){const it=SHOP[ui.row];
  const list=SHOP.map((x,i)=>`<div class="row ${i===ui.row?'sel':''} ${x.kind==='blueprint'?'dim':''}"><span>${x.name}</span><b>${x.cost} CR</b></div>`).join('');
  return `<div class="cols2"><div class="list"><div class="row"><span>CREDITS</span><b>${store.credits} CR</b></div>${list}<p class="dim">Credits (a placeholder currency) come from resolved Quests: +20 construct neutralised, +15 occupant freed.</p></div>
   <div><h4>${it.name.toUpperCase()}</h4><div class="row"><span>Components</span><b>${it.parts}</b></div><div class="row"><span>Cost</span><b>${it.cost} CR</b></div><p>${it.route}</p><p class="${it.kind!=='blueprint'?'':'dim'}">${it.kind==='repair'?'Confirm to repair (not during an active encounter).':it.kind!=='blueprint'?'Confirm to buy.':'Blueprint only: the Interface identifies how to acquire it. It does not summon it. Not available in this build.'}</p></div></div>`;}
 function pageTitles(){const n=TITLES.length,all=[...TITLES,...CONDITIONS];const it=all[ui.row]||all[0];
  const pos=TITLES.map((t,i)=>{const a=(i/n)*Math.PI*2-Math.PI/2;return [50+34*Math.cos(a),50+38*Math.sin(a)];});
  const lines=pos.map((p,i)=>`<line x1="50" y1="50" x2="${p[0]}" y2="${p[1]}" stroke="${TITLES[i].need()?'#5fe3e8':'#2c4652'}" stroke-width=".4"/>`).join('');
  const nodes=TITLES.map((t,i)=>`<g><circle cx="${pos[i][0]}" cy="${pos[i][1]}" r="${i===ui.row?3.4:2.4}" fill="${t.need()?'#5fe3e8':'#0b1a22'}" stroke="${t.id===activeTitle().id?'#fff':'#5fe3e8'}" stroke-width="${t.id===activeTitle().id?.9:.4}"/><text x="${pos[i][0]+(pos[i][0]<45?-4:pos[i][0]>55?4:0)}" y="${pos[i][1]+(Math.abs(pos[i][0]-50)<5?(pos[i][1]<50?-4.5:6.5):1)}" text-anchor="${pos[i][0]<45?'end':pos[i][0]>55?'start':'middle'}" font-size="2.8" fill="${t.need()?'#d9f6ff':'#5a7280'}">${t.name}</text></g>`).join('');
  const conds=CONDITIONS.map((c,j)=>`<div class="row cond ${n+j===ui.row?'sel':''}"><span>${c.name}</span><b>${c.state}</b></div>`).join('');
  const d=ui.row<n?`<h4>${it.name}${it.id===activeTitle().id?' · ACTIVE':''}</h4><p>${it.why}</p><div class="row"><span>Progress</span><b>${it.prog()}</b></div><p class="dim">${it.need()?'Earned. Confirm to make it the active Title.':'Not earned yet.'}</p>`:`<h4 class="red">${it.name}</h4><p>${it.why}</p><div class="row"><span>State</span><b>${it.state}</b></div><p class="dim">${it.note}</p>`;
  return `<div class="cols2"><div><svg viewBox="-24 0 148 100" class="constel"><circle cx="50" cy="50" r="5" fill="none" stroke="#5fe3e8" stroke-width=".6"/>${lines}${nodes}</svg><h4>CONDITIONS</h4>${conds}</div><div>${d}<p class="dim">${earnedTitles().length}/${TITLES.length} Titles earned.</p></div></div>`;}
 function pageRecords(){const secs=['OBSERVED TECHNIQUES','ENCOUNTERS','UNCLASSIFIED SIGNALS','THE BLANK','EVENT LOG','WITNESS ACCOUNTS'],i=ui.row;
  const tabs=secs.map((x,j)=>`<div class="row ${j===i?'sel':''}"><span>${x}</span><b>${j===0?Object.keys(store.observed).length:j===1?store.quests.length:j===2?store.anomalies.length:j===3?'—':j===4?st.log.length:(store.accounts||[]).length}</b></div>`).join('');
  let d='';
  if(i===0)d=ATTACK_IDS.filter(k=>store.observed[k]).map(k=>`<div class="row"><span>${ATTACKS[k].name}${ATTACKS[k].unblockable?' · unblockable':''}</span><b>×${store.observed[k].n}</b></div>`).join('')||'<p class="dim">Nothing recorded. Techniques are only recorded while you Analyze.</p>';
  else if(i===1)d=store.quests.map(q=>`<div class="row"><span>${esc(q.name)} · ${esc(q.outcome)}${q.offScript?' · OFF-SCRIPT':''}</span><b>${ago(q.when)}</b></div>`).join('')||'<p class="dim">No finished encounters.</p>';
  else if(i===2)d=store.anomalies.slice().reverse().map(a=>`<div class="row"><span>${esc(a.what)} · ${esc(a.where)}</span><b>${ago(a.when)}</b></div><p class="dim">${esc(a.note)}</p>`).join('')||'<p class="dim">None.</p>';
  else if(i===3)d='<p class="dim">No records. These cannot be unlocked by Level or XP.</p>';
  else if(i===5)d=(store.accounts||[]).map(a=>`<div class="row ${a.kind==='dispute'||a.kind==='revise'?'':'bad'}"><span>${esc(a.who)}</span><b>${ago(a.when)}</b></div><p>\u201c${esc(a.text)}\u201d</p>`).join('')||'<p class="dim">No witness has said anything about him yet.</p>';
  else d=st.log.slice().reverse().map(l=>`<div class="ev ${l.kind}">${esc(l.text)}</div>`).join('')||'<p class="dim">Empty.</p>';
  return `<div class="cols2"><div class="list">${tabs}</div><div class="scroll">${d}</div></div>`;}
 const PAGES={status:pageStatus,skills:pageSkills,loadouts:pageLoadouts,inventory:pageInventory,quests:pageQuests,shop:pageShop,titles:pageTitles,records:pageRecords};
 // ----- drawing -----
 const css4=`#loCore{position:fixed;inset:0;z-index:45;pointer-events:none;font:600 12px/1.35 "JetBrains Mono",ui-monospace,monospace;color:#d9f6ff;letter-spacing:.05em}#loCore[hidden]{display:none}
#loCore .veil{position:absolute;inset:0;backdrop-filter:saturate(.3) brightness(.5);-webkit-backdrop-filter:saturate(.3) brightness(.5);background:rgba(3,10,16,.35)}
#loCore .wheel{position:absolute;left:50%;top:50%;width:min(560px,86vmin);height:min(560px,86vmin);transform:translate(-50%,-50%)}
#loCore .wheel path{fill:rgba(6,16,24,.82);stroke:rgba(95,227,232,.45);stroke-width:1.2}#loCore .wheel path.on{fill:rgba(20,60,72,.9);stroke:#5fe3e8;stroke-width:2.4;filter:drop-shadow(0 0 8px rgba(95,227,232,.6))}
#loCore .wheel text{fill:#d9f6ff;font:700 13px ui-monospace,monospace;letter-spacing:.12em}#loCore .wheel text.n{fill:#5fe3e8;font-size:10px}
#loCore .info{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(200px,30vmin);text-align:center}#loCore .info h2{margin:0 0 4px;font-size:15px;color:#5fe3e8;letter-spacing:.14em}#loCore .info p{margin:4px 0;font-size:10px;text-transform:none;letter-spacing:.01em}#loCore .info .sub{opacity:.7;font-size:9px}
#loCore .hint{position:absolute;left:50%;bottom:22px;transform:translateX(-50%);font-size:10px;opacity:.85;white-space:nowrap;background:rgba(6,14,22,.7);padding:4px 10px;border:1px solid rgba(95,227,232,.3)}
#loCore .msg{position:absolute;left:50%;bottom:52px;transform:translateX(-50%);color:#ffd79a;font-size:11px;background:rgba(6,14,22,.8);padding:4px 10px}
#loCore .page{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(980px,94vw);max-height:84vh;overflow:hidden;background:rgba(5,13,20,.9);border:1px solid rgba(95,227,232,.45);box-shadow:0 0 30px rgba(0,0,0,.6);padding:12px 16px 14px}
#loCore .tabs{display:flex;gap:4px;margin-bottom:10px;flex-wrap:wrap}#loCore .tabs span{padding:3px 8px;border:1px solid rgba(95,227,232,.25);font-size:10px;opacity:.6}#loCore .tabs span.on{opacity:1;border-color:#5fe3e8;color:#5fe3e8}
#loCore .head{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px}#loCore .head h3{margin:0;font-size:15px;color:#5fe3e8;letter-spacing:.14em}#loCore .head small{opacity:.7}
#loCore h4{margin:10px 0 4px;font-size:11px;color:#5fe3e8;letter-spacing:.12em}#loCore h4.red{color:#ff8a70}#loCore p{margin:4px 0;font-size:11px;text-transform:none;letter-spacing:.01em}#loCore .dim{opacity:.6}#loCore .ex,#loCore p.warn{color:#ffcf7a}
#loCore .row{display:flex;justify-content:space-between;gap:10px;padding:3px 6px;border-left:2px solid transparent;font-size:11px}#loCore .row b{font-weight:600;text-align:right}#loCore .row.sel{background:rgba(95,227,232,.14);border-left-color:#5fe3e8}#loCore .row.warn{color:#ffd79a}#loCore .row.bad{color:#ffb0a3}#loCore .row.cond{color:#ff9a86}
#loCore .cols2{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.2fr);gap:18px}#loCore .cols3{display:grid;grid-template-columns:150px minmax(0,1fr) minmax(0,1fr);gap:18px}#loCore .fig{width:150px;height:280px}
#loCore .list,#loCore .scroll{max-height:62vh;overflow:hidden}#loCore .ev{font-size:10px;padding:1px 4px;text-transform:none}#loCore .ev.injury,#loCore .ev.warn{color:#ffd79a}#loCore .ev.xp,#loCore .ev.level{color:#9ff7d7}#loCore .ev.hit{color:#ffb0a3}#loCore .ev.quest{color:#ffcf7a}
#loCore .decks{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}#loCore .deck{border:1px solid rgba(95,227,232,.25);padding:8px}#loCore .deck.on{border-color:#5fe3e8;box-shadow:0 0 12px rgba(95,227,232,.25)}#loCore .deck.locked{opacity:.35}#loCore .deck h4{margin:0}#loCore .deck small{display:block;font-size:9px;opacity:.7;text-transform:none}
#loCore .sockets{display:grid;grid-template-columns:1fr 1fr;gap:5px;margin:8px 0 5px}#loCore .sock{border:1px solid rgba(95,227,232,.3);padding:8px 6px;font-size:10px;min-height:38px}#loCore .sock kbd{color:#5fe3e8;margin-right:4px}#loCore .sock.sel{background:rgba(95,227,232,.18);border-color:#fff}#loCore .sock.bad{border-color:#ff5f45;color:#ffb0a3}#loCore .sock.eq{min-height:0;text-align:center;font-size:10px}
#loCore .belt{position:relative;height:300px}#loCore .belt .core{position:absolute;left:50%;top:64%;width:70px;height:70px;transform:translate(-50%,-50%);border-radius:50%;border:2px solid #5fe3e8;box-shadow:0 0 18px rgba(95,227,232,.5),inset 0 0 14px rgba(95,227,232,.4)}
#loCore .bsock{position:absolute;transform:translate(-50%,-50%);width:86px;padding:8px 4px;text-align:center;border:1px dashed rgba(95,227,232,.4);font-size:10px}#loCore .bsock.small{width:64px}#loCore .bsock.full{border-style:solid;border-color:#5fe3e8}#loCore .bsock.sel{background:rgba(95,227,232,.18);border-color:#fff}#loCore .bsock small{display:block;font-size:8px;opacity:.75}
#loCore .constel{width:100%;max-width:470px;height:auto}`;
 let core=null;
 function buildCore(){if(core)return;const s2=document.createElement('style');s2.textContent=css4;document.head.appendChild(s2);core=document.createElement('div');core.id='loCore';core.hidden=true;document.body.appendChild(core);}
 function wedge(i){const a0=(-90-22.5+i*45+1.4)*Math.PI/180,a1=(-90+22.5+i*45-1.4)*Math.PI/180,R=250,r=128,c=280,P=(rad,a)=>[c+rad*Math.cos(a),c+rad*Math.sin(a)].map(v=>v.toFixed(1)).join(' ');
  return `M${P(r,a0)} L${P(R,a0)} A${R} ${R} 0 0 1 ${P(R,a1)} L${P(r,a1)} A${r} ${r} 0 0 0 ${P(r,a0)}Z`;}
 function hintText(){const pad=padRecent();
  if(ui.open==='wheel')return pad?'STICK / D-PAD select · A open · B / VIEW close':'MOUSE / ← → select · 1-8 or ENTER open · TAB close';
  return pad?'STICK / D-PAD move · A confirm · B back · LB / RB page · VIEW close':'↑ ↓ ← → move · ENTER confirm · BACKSPACE back · Q / R page · TAB close';}
 function paintCore(){buildCore();const show=!!ui.open&&isLoadout()&&gameActive;core.hidden=!show;if(!show)return;
  if(!ui.dirty&&clock<ui.repaintAt)return;ui.dirty=false;ui.repaintAt=clock+.25;
  const T=activeTitle(),hdr=`${T.name} · LEVEL ${st.level}`,msg=clock<ui.msgUntil?`<div class="msg">${esc(ui.msg)}</div>`:'',live=st.enc&&st.enc.outcome==='active'?' · ENCOUNTER ACTIVE: ENEMIES ARE NOT PAUSED':'';
  if(ui.open==='wheel'){const S=SECTIONS[ui.sel];
   core.innerHTML=`<div class="veil"></div><svg class="wheel" viewBox="0 0 560 560">${SECTIONS.map((x,i)=>{const a=(-90+i*45)*Math.PI/180,tx=280+190*Math.cos(a),ty=280+190*Math.sin(a);return `<path d="${wedge(i)}" class="${i===ui.sel?'on':''}"/><text x="${tx}" y="${ty-4}" text-anchor="middle">${x.name}</text><text class="n" x="${tx}" y="${ty+12}" text-anchor="middle">${i+1}</text>`;}).join('')}
    <circle cx="280" cy="280" r="118" fill="rgba(4,12,18,.9)" stroke="#5fe3e8" stroke-width="2"/><circle cx="280" cy="280" r="104" fill="none" stroke="rgba(95,227,232,.35)" stroke-width="1" stroke-dasharray="4 6"/></svg>
    <div class="info"><p class="sub">LOADOUT // INTERFACE</p><p class="sub">${hdr}</p><h2>${S.name}</h2><p>${S.desc}</p><p class="sub">Fast access: ${S.fast}</p></div>${msg}<div class="hint">${hintText()}${live}</div>`;return;}
  const i=SECTIONS.findIndex(x=>x.id===ui.open),S=SECTIONS[i];
  core.innerHTML=`<div class="veil"></div><div class="page"><div class="tabs">${SECTIONS.map(x=>`<span class="${x.id===ui.open?'on':''}">${x.name}</span>`).join('')}</div><div class="head"><h3>${S.name}</h3><small>LOADOUT // INTERFACE · ${hdr}</small></div>${PAGES[S.id]()}</div>${msg}<div class="hint">${hintText()}${live}</div>`;}
 // ----- keyboard / mouse while open -----
 function uiKey(e){if(e.repeat&&!/^Arrow/.test(e.code))return;const c=e.code;
  if(c==='Tab'){closeInterface();return;}
  if(c==='Backspace'||c==='KeyC'){back();return;}
  if(c==='Enter'||c==='Space'||c==='KeyE'||c==='NumpadEnter'){confirm();return;}
  if(c==='KeyQ'){cyclePage(-1);return;}if(c==='KeyR'){cyclePage(1);return;}
  const dir={ArrowLeft:[-1,0],KeyA:[-1,0],ArrowRight:[1,0],KeyD:[1,0],ArrowUp:[0,-1],KeyW:[0,-1],ArrowDown:[0,1],KeyS:[0,1]}[c];
  if(dir){if(ui.open==='wheel')nav(dir[0]||dir[1],0);else nav(dir[0],dir[1]);return;}
  const m=/^Digit([1-8])$/.exec(c);if(m&&ui.open==='wheel'){ui.sel=+m[1]-1;confirm();}}
 window.addEventListener('mousemove',e=>{if(!ui.open||!isLoadout())return;e.stopImmediatePropagation();if(ui.open!=='wheel')return;
  ui.mx=ui.mx*.9+(e.movementX||0);ui.my=ui.my*.9+(e.movementY||0);if(Math.hypot(ui.mx,ui.my)>30){const a=Math.atan2(ui.my,ui.mx)*180/Math.PI+90;const s2=((Math.round(a/45)%8)+8)%8;if(s2!==ui.sel){ui.sel=s2;ui.dirty=true;}}},true);
 window.addEventListener('mousedown',e=>{if(!ui.open||!isLoadout())return;e.preventDefault();e.stopImmediatePropagation();if(e.button===0)confirm();else if(e.button===2)back();},true);
 window.addEventListener('mouseup',e=>{if(!ui.open||!isLoadout())return;if(e.button===2)e.stopImmediatePropagation();},true);
 // ----- pad while open (called from poll) -----
 function padCore(raw,prev,gp){const edge=i=>!!raw[i]&&!prev[i];
  if(edge(1)){back();}else if(edge(8)){closeInterface();}else if(edge(0)){confirm();}
  if(edge(4))cyclePage(-1);if(edge(5))cyclePage(1);
  const ax=gp?.axes||[],x=ax[0]||0,y=ax[1]||0,mag=Math.hypot(x,y);
  if(ui.open==='wheel'){if(mag>.55){const a=Math.atan2(y,x)*180/Math.PI+90,s2=((Math.round(a/45)%8)+8)%8;if(s2!==ui.sel){ui.sel=s2;ui.dirty=true;}}
   if(edge(14))nav(-1,0);if(edge(15)||edge(13))nav(1,0);if(edge(12))nav(-1,0);}
  else{let d=null;if(edge(12))d=[0,-1];else if(edge(13))d=[0,1];else if(edge(14))d=[-1,0];else if(edge(15))d=[1,0];
   const sd=mag>.6?(Math.abs(y)>Math.abs(x)?(y<0?'u':'d'):(x<0?'l':'r')):null;
   if(sd&&(sd!==ui.stickDir||clock-ui.stickAt>.28)){ui.stickAt=clock;d={u:[0,-1],d:[0,1],l:[-1,0],r:[1,0]}[sd];}ui.stickDir=sd;
   if(d)nav(d[0],d[1]);}
  try{input.actions.moveX=input.actions.moveY=input.actions.moveMag=0;input.actions.lookX=input.actions.lookY=input.actions.lookMag=0;input.actions.aim=false;input.actions.sprint=false;}catch(e){}
 }

 // ---------- OUTCLASSED: a Condition from witness memory (v5) ----------
 // Gained when Loadout goes down with at least 2 witnesses watching. While it is active, his Interface exaggerates the
 // opponent: bigger red threat brackets, larger Ghost Builds, inflated success numbers for its attacks, "uncertain"
 // counter windows and a prominent escape route. The construct's real attacks (timing, damage, choice) are unchanged.
 // It clears only by contradiction: 3 counters / evades of predicted attacks while it is active, then a win that at least
 // 2 witnesses see. A win without the contradictions reads as luck; a win nobody sees changes nothing.
 const WITNESS_KINDS=[
  {id:'w1',label:'Spectator · courier jacket',color:0x8a6a3a,lean:'repeats'},
  {id:'w2',label:'Spectator · grey coat',color:0x5d6670,lean:'agrees'},
  {id:'w3',label:'Spectator · green hood',color:0x3f6a52,lean:'fair'}];
 const wit={list:[],enc:null,root:null,tags:[],sayUntil:0,line:null,escTag:null,veil:null};
 const outclassedOn=()=>!!store.condition&&store.condition.id==='outclassed'&&isLoadout()&&st.enc?.outcome==='active';
 function spawnWitnesses(e){
  clearWitnesses();wit.enc=e;const t=e.t,toP=s.pos.clone().sub(t.home);toP.y=0;toP.normalize();const right=new V3(-toP.z,0,toP.x);
  wit.root=new THREE.Group();wit.root.name='Loadout witnesses';scene.add(wit.root);
  WITNESS_KINDS.forEach((k,i)=>{const p=t.home.clone().addScaledVector(toP,-3.2-(i%2)*1.2).addScaledVector(right,(i-1)*4.2);p.y=groundAt(p.x,p.z,t.home.y);
   const g=new THREE.Group();g.position.copy(p);const mat=new THREE.MeshToonMaterial({color:k.color});
   const body=new THREE.Mesh(new THREE.CylinderGeometry(.2,.24,1.15,10),mat);body.position.y=.78;g.add(body);
   const legs=new THREE.Mesh(new THREE.CylinderGeometry(.17,.15,.55,8),new THREE.MeshToonMaterial({color:0x22262c}));legs.position.y=.27;g.add(legs);
   const head=new THREE.Mesh(new THREE.SphereGeometry(.15,12,10),new THREE.MeshToonMaterial({color:0x6b4a32}));head.position.y=1.5;g.add(head);
   wit.root.add(g);wit.list.push({...k,group:g,saw:[],said:null});});
 }
 function clearWitnesses(){if(wit.root){scene.remove(wit.root);wit.root.traverse(o=>{o.geometry?.dispose();o.material?.dispose?.();});}wit.root=null;wit.list=[];wit.enc=null;if(wit.line){wit.line.parent?.remove(wit.line);wit.line.geometry.dispose();wit.line.material.dispose();wit.line=null;}}
 function witnessesPresent(){const t=st.enc?.t;if(!t)return [];const mid=t.group.position.clone().add(s.pos).multiplyScalar(.5);return wit.list.filter(w=>w.group.position.distanceTo(mid)<16);}
 function witSay(w,text){w.said={text,until:clock+7};}
 function addAccount(w,text,kind){store.accounts=store.accounts||[];store.accounts.unshift({who:w.label,text,kind,when:Date.now()});if(store.accounts.length>20)store.accounts.pop();witSay(w,text);log(w.label.split(' · ')[1]+': “'+text+'”','quest');}
 function onDefeat(e){const present=witnessesPresent(),counters=e.condCounters||0;
  if(present.length<2){log('No witnesses saw it · no Condition','info');return;}
  let pressure=0;
  for(const w of present){
   if(w.lean==='repeats'){addAccount(w,'Taken apart by a training dummy.','insult');pressure+=40;}
   else if(w.lean==='agrees'){addAccount(w,'Outclassed. It wasn’t close.','agree');pressure+=35;}
   else if(counters>0){addAccount(w,'He was reading it. It just outlasted him.','dispute');pressure-=20;}
   else{addAccount(w,'He never got a hand on it.','agree');pressure+=25;}}
  pressure=clamp(pressure,10,100);const had=store.condition;
  store.condition={id:'outclassed',against:e.t.name,pressure:had?Math.max(had.pressure,pressure):pressure,contradictions:0,gained:had?had.gained:Date.now(),witnesses:present.length};
  log('CONDITION · OUTCLASSED · witness pressure '+store.condition.pressure+'% · '+present.length+' witnesses','warn');flash('CONDITION · OUTCLASSED','what '+present.length+' witnesses believe');persist4();}
 function onWin(e){const c=store.condition;if(!c)return;const present=witnessesPresent();
  if(c.contradictions<3){c.pressure=clamp(c.pressure-15,10,100);log('OUTCLASSED persists · the win reads as luck (contradictions '+c.contradictions+'/3) · pressure '+c.pressure+'%','warn');persist4();return;}
  if(present.length<2){log('OUTCLASSED persists · nobody saw it','warn');return;}
  for(const w of present)addAccount(w,w.lean==='repeats'?'...Fine. He figured it out.':w.lean==='agrees'?'Okay. That was not luck.':'Told you he was reading it.','revise');
  store.condition=null;persist4();log('CONDITION CLEARED · OUTCLASSED contradicted in front of '+present.length+' witnesses','level');flash('OUTCLASSED CLEARED','contradicted in front of witnesses');xp(80,'Significant achievement · OUTCLASSED contradicted');bump('outclassedCleared');}
 function contradict(kind){if(!outclassedOn())return;const c=store.condition,e=st.enc;e.condCounters=(e.condCounters||0)+1;c.contradictions=Math.min(3,c.contradictions+1);c.pressure=clamp(c.pressure-8,10,100);
  const shown=wit.lastShown||96;log('PREDICTION CONTRADICTED · the Interface gave it '+shown+'% · '+kind+' · '+c.contradictions+'/3','analyze');e.glitchUntil=clock+.6;persist4();}
 // what the distorted Interface shows (perception only; predictions() itself is untouched)
 const danger=k=>ATTACKS[k].dmg/8+(ATTACKS[k].unblockable?1.5:0)+(ATTACKS[k].heavy?1:0);
 function shownPredictions(p){if(!outclassedOn())return p;const q={};let sum=0;for(const k of ATTACK_IDS){q[k]=(p[k]||0)*(1+2.5*danger(k));sum+=q[k];}for(const k of ATTACK_IDS)q[k]/=sum||1;return q;}
 function successShown(k,q){const top=ATTACK_IDS.reduce((a,b)=>q[a]>q[b]?a:b);return k===top?Math.round(88+10*q[k]):Math.round(40+50*q[k]);}
 function ghostLabel(k,g){if(!outclassedOn())return ATTACKS[k].name+' '+Math.round(g.p*100)+'%';const t=st.enc.t,q=shownPredictions(predictions(t)),v=successShown(k,q);if(v>=88)wit.lastShown=v;return ATTACKS[k].name+' · SUCCESS '+v+'%';}
 function tickOutclassed(dt){
  const e=st.enc;if(e&&e!==wit.enc&&e.outcome==='active')spawnWitnesses(e);if(!e&&wit.root)clearWitnesses();
  const on=outclassedOn();
  // ghosts: larger, heavier, tinted toward threat
  if(e)for(const k of ATTACK_IDS){const g=e.ghosts[k];const sc=on?1.3:1;g.group.scale.setScalar(sc);
   if(g.group.visible)g.body.traverse(o=>{if(o.isMesh){o.material.color.setHex(on?(clock<(e.glitchUntil||0)&&Math.random()<.5?0xffffff:0xff6a55):0x5fe3e8);if(on)o.material.opacity=Math.min(.95,o.material.opacity+.22);}});}
  // escape route: an amber line from him, away from the opponent
  if(on){const t=e.t,away=s.pos.clone().sub(t.group.position);away.y=0;if(away.lengthSq()<1e-4)away.set(0,0,1);away.normalize();
   const a=s.pos.clone();a.y=s.pos.y-.38;const b=a.clone().addScaledVector(away,9);b.y=groundAt(b.x,b.z,a.y)+.04;
   if(!wit.line){wit.line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([a,b]),new THREE.LineBasicMaterial({color:0xffb43c,transparent:true,opacity:.95,depthTest:false,toneMapped:false,fog:false}));wit.line.renderOrder=6;wit.line.frustumCulled=false;scene.add(wit.line);}
   else wit.line.geometry.setFromPoints([a,b]);wit.line.visible=true;wit.escPos=b;}
  else if(wit.line)wit.line.visible=false;
 }
 const css5=`#loOcVeil{position:fixed;inset:0;pointer-events:none;z-index:37;background:radial-gradient(ellipse at center,rgba(0,0,0,0) 52%,rgba(120,12,6,.38) 100%)}#loOcVeil[hidden]{display:none}
.loWit{position:fixed;transform:translate(-50%,-100%);font:600 10px/1.3 ui-monospace,monospace;color:#ffe2b8;background:rgba(14,10,6,.8);border-left:2px solid #ffb43c;padding:3px 6px;pointer-events:none;z-index:39;max-width:240px}.loWit[hidden]{display:none}.loWit.dispute,.loWit.revise{border-color:#5fe3e8;color:#d9f6ff}
#loEsc{position:fixed;transform:translate(-50%,-100%);font:700 10px/1.2 ui-monospace,monospace;color:#ffcf7a;letter-spacing:.1em;pointer-events:none;z-index:39;text-shadow:0 0 6px rgba(255,160,40,.6)}#loEsc[hidden]{display:none}`;
 function paintOutclassed(){
  if(!wit.veil){const s3=document.createElement('style');s3.textContent=css5;document.head.appendChild(s3);wit.veil=document.createElement('div');wit.veil.id='loOcVeil';wit.veil.hidden=true;document.body.appendChild(wit.veil);
   wit.escTag=document.createElement('div');wit.escTag.id='loEsc';wit.escTag.hidden=true;document.body.appendChild(wit.escTag);
   for(let i=0;i<3;i++){const d=document.createElement('div');d.className='loWit';d.hidden=true;document.body.appendChild(d);wit.tags.push(d);}}
  const live=isLoadout()&&gameActive,on=live&&outclassedOn();wit.veil.hidden=!on;
  if(on&&wit.escPos){const v=wit.escPos.clone().project(camera);let x=v.x,y=v.y;const behind=v.z>1;if(behind){x=-x;y=-y;}
   const inView=!behind&&Math.abs(x)<.92&&Math.abs(y)<.85;let txt='ESCAPE ROUTE · RECOMMENDED';
   if(!inView){const m=Math.max(Math.abs(x)/.86,Math.abs(y)/.78,1e-3);x/=m;y/=m;const ang=Math.atan2(-y,x)*180/Math.PI;txt=(Math.abs(ang)<45?'ESCAPE ROUTE ▶':Math.abs(ang)>135?'◀ ESCAPE ROUTE':ang>0?'ESCAPE ROUTE ▼':'▲ ESCAPE ROUTE')+' · RECOMMENDED';}
   wit.escTag.hidden=false;wit.escTag.style.left=((x+1)/2*innerWidth)+'px';wit.escTag.style.top=((1-y)/2*innerHeight)+'px';wit.escTag.textContent=txt;}else wit.escTag.hidden=true;
  wit.tags.forEach((d,i)=>{const w=wit.list[i];if(!live||!w||!w.said||clock>w.said.until){d.hidden=true;return;}const p=screen(w.group.position.clone().add(new V3(0,1.85,0)));d.hidden=!p.in;d.style.left=p.x+'px';d.style.top=p.y+'px';
   const acc=(store.accounts||[]).find(a=>a.who===w.label&&a.text===w.said.text);d.className='loWit '+(acc?.kind||'');d.textContent='“'+w.said.text+'”';});
 }

 // ---------- FULL BELT INVENTORY (v6) ----------
 // Five belt sockets and two consumable positions, every item with a persistent physical state (saved in
 // 'loadoutInterfaceV4' -> inv). X / D-left TAP retrieves the selected item; HOLD opens the belt carousel: the camera
 // lowers to his waist, the sockets unfold around the belt, the sparring construct runs at half speed (the rest of the
 // world does not), and releasing retrieves the selected item. Nothing is manufactured: used capsules are gone, the
 // medical kit runs out, a deployed grapnel stays where it was fired until he recovers it, the rescue cutter has to be
 // found and used twice before it registers into socket 04.
 const SOCKETS=[{id:'baton',slot:'01',name:'Baton'},{id:'grapnel',slot:'02',name:'Grapnel'},{id:'medkit',slot:'03',name:'Medical kit'},{id:'cutter',slot:'04',name:'Rescue cutter'},
  {id:'smoke',slot:'05',name:'Smoke capsules',consumable:true},{id:null,slot:'C2',name:'Empty',consumable:true}];/* v9: five registered sockets in belt order, and one empty capsule socket */
 const inv=store.inv=Object.assign({sel:0,smoke:2,smokeMax:2,med:4,medMax:4,grapnel:{state:'stowed',anchor:null,spool:null},cutter:{state:'none',rescues:0,out:false}},store.inv||{});if(!(inv.sel>=0&&inv.sel<SOCKETS.length))inv.sel=0;
 const iv={open:false,holdAt:null,padHoldAt:null,blend:0,act:null,root:null,socks:[],tags:[],cable:null,clouds:[],cutterProp:null,handProp:null,fieldCutter:null,tripCd:0,mx:0,lastHits:0,hand:null,handHero:null};
 const persistInv=()=>{store.inv=inv;persist4();};
 function invItemState(id){const b=st.baton;switch(id){
  case 'baton':return b.broken?'BROKEN':(b.out?'IN HAND':'STOWED')+' · '+b.durability+'/'+b.max;
  case 'grapnel':return inv.grapnel.state==='deployed'?'DEPLOYED · cable connected '+Math.round(spoolDist())+' m away':'STOWED';
  case 'medkit':return inv.med+'/'+inv.medMax+' DOSES';
  case 'cutter':return inv.cutter.state==='registered'?(inv.cutter.out?'IN HAND':'STOWED')+' · REGISTERED':inv.cutter.state==='carried'?'CARRIED · NOT REGISTERED · rescues '+inv.cutter.rescues+'/2':inv.cutter.state==='field'?'LOCATED · near the trapped worker':'EMPTY · nothing registered';
  case 'smoke':return inv.smoke+'/'+inv.smokeMax+' LEFT';}return 'EMPTY';}
 const spoolDist=()=>inv.grapnel.spool?Math.hypot(inv.grapnel.spool[0]-s.pos.x,inv.grapnel.spool[2]-s.pos.z):0;
 function handsFull(except){if(except!=='baton'&&st.baton.out)return 'baton';if(except!=='cutter'&&(inv.cutter.state==='carried'||inv.cutter.out))return 'cutter';return null;}
 function busyBody(){return (st.form&&!st.form.done)||!!st.swap||!!iv.act;}
 function beginAct(item,dur,clip,done,o){const seq=!!(iv.seqWant&&iv.open&&o&&o.contact!=null&&o.sock!=null);if(clip&&!seq)runner()?.perform?.(clip,{root:false,source:'loadout-inventory'});
  iv.act={item,t:0,dur:seq?Math.max(dur+SEQ.grip-o.contact,SEQ.grip+SEQ.out+.05):dur,done,hits:st.stats.hitsTaken,contact:o?(seq?SEQ.grip:o.contact):null,onContact:o?o.onContact:null,sock:o?o.sock:null,contacted:false,seq,clip:seq?clip:null,stow:seq&&(item==='baton'?st.baton.out:item==='cutter'?inv.cutter.out:false)};
  if(seq)iv.lastPull={act:iv.act,item,sock:o.sock,slot:SOCKETS[o.sock].slot,stow:iv.act.stow,touchDist:null,gripDepth:null,completed:false,aborted:false};}
 function retrieve(i){const S=SOCKETS[i];if(!S||!S.id){say('Socket '+(S?.slot||'?')+' · empty · nothing registered');log('Socket '+(S?.slot||'?')+' · empty','gear');return false;}
  if(busyBody()){log(S.name+' · finish the current action first','warn');return false;}
  const id=S.id;
  if(id==='baton'){const h=handsFull('baton');if(h&&!st.baton.out){log('Baton · hands full ('+h+')','warn');return false;}beginAct('baton',.55,'Attack_Hand_Ready',null,{contact:.06,sock:0,onContact:toggleBaton});return true;}
  if(id==='cutter'){const c=inv.cutter;
   if(c.state==='carried'){log('Rescue cutter · not registered, it cannot go in the belt · rescues '+c.rescues+'/2','warn');return false;}
   if(c.state!=='registered'){log('Socket 04 · empty · the rescue cutter has not been registered','gear');return false;}
   const h=handsFull('cutter');if(h&&!c.out){log('Rescue cutter · hands full ('+h+')','warn');return false;}
   beginAct('cutter',.55,'Attack_Hand_Ready',null,{contact:.14,sock:3,onContact:()=>{c.out=!c.out;persistInv();log(c.out?'Rescue cutter retrieved · socket 04':'Rescue cutter stowed · socket 04','gear');}});return true;}
  if(id==='medkit'){if(inv.med<=0){log('Medical kit empty · the belt cannot refill it (Shop: refill)','warn');return false;}
   log('Medical kit · treating · 2.4 s, exposed','gear');beginAct('medkit',2.4,'Attack_Hand_Ready',()=>{inv.med--;const p=Object.keys(st.body).reduce((a,b)=>st.body[a]<=st.body[b]?a:b);const before=st.body[p];st.body[p]=Math.min(100,st.body[p]+25);st.hp=Math.min(100,st.hp+15);persistInv();
    log('Treated · '+PARTS[p]+' '+Math.round(before)+'% → '+Math.round(st.body[p])+'% · +15 HP · '+inv.med+' doses left','gear');},{contact:.25,sock:2});return true;}
  if(id==='smoke'){if(inv.smoke<=0){log('No smoke capsules left · used capsules are gone (Shop: restock)','warn');return false;}
   beginAct('smoke',.65,'Attack_Hand_1R',()=>{inv.smoke--;persistInv();const t=nearestTarget(14);const at=t?t.group.position.clone():s.pos.clone().addScaledVector(fwd(),6);at.y=groundAt(at.x,at.z,s.pos.y-.42);spawnSmoke(at);log('Smoke capsule thrown · '+inv.smoke+' left','gear');},{contact:.25,sock:4});return true;}
  if(id==='grapnel'){const g=inv.grapnel;
   if(g.state==='deployed'){if(spoolDist()>3){log('Grapnel deployed · cable connected '+Math.round(spoolDist())+' m away · walk to the spool to recover it','warn');return false;}
    beginAct('grapnel',1.2,'Attack_Hand_Ready',()=>{g.state='stowed';g.anchor=g.spool=null;persistInv();buildCable();log('Grapnel recovered · socket 02','gear');});return true;}
   const a=findAnchor();if(!a){log('Grapnel · no anchor point within 22 m in front','warn');return false;}
   beginAct('grapnel',.7,'Attack_Hand_1R',()=>{const sp=s.pos.clone();sp.y=s.pos.y-.4;g.state='deployed';g.anchor=a.toArray().map(v=>+v.toFixed(3));g.spool=sp.toArray().map(v=>+v.toFixed(3));persistInv();buildCable();
    log('Grapnel fired · anchored '+a.distanceTo(sp).toFixed(1)+' m · cable connected · it trips what crosses it low','gear');},{contact:.25,sock:1});return true;}
  return false;}
 // grapnel: the nearest collider face in a 80° fan in front of him, from chest height
 function findAnchor(){const o=s.pos.clone();o.y=s.pos.y+.35;let best=null;let cols=[];try{cols=allColliders(o.clone().add(new V3(-23,-3,-23)),o.clone().add(new V3(23,6,23)));}catch(e){return null;}
  const base=Math.atan2(fwd().x,fwd().z),ray=new THREE.Ray(),hit=new V3();
  for(let a=-40;a<=40;a+=5){const yaw=base+a*Math.PI/180;ray.set(o,new V3(Math.sin(yaw),.02,Math.cos(yaw)));
   for(const c of cols){const b=c.box;if(!b||(b.max.x-b.min.x)>80||(b.max.z-b.min.z)>80)continue;if(b.max.y<o.y-.2)continue;if(ray.intersectBox(b,hit)){const d=hit.distanceTo(o);if(d>1.2&&d<22&&(!best||d<best.d))best={d,p:hit.clone()};}}}
  return best?best.p:null;}
 function buildCable(){if(iv.cable){iv.cable.parent?.remove(iv.cable);iv.cable.traverse(o=>{o.geometry?.dispose();o.material?.dispose?.();});iv.cable=null;}
  const g=inv.grapnel;if(g.state!=='deployed'||!g.anchor)return;const A=new V3(...g.anchor),B=new V3(...g.spool);const grp=new THREE.Group();grp.name='Loadout grapnel cable';
  const len=A.distanceTo(B),cyl=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,len,6),new THREE.MeshBasicMaterial({color:0xcfd8dc,toneMapped:false}));cyl.position.copy(A).add(B).multiplyScalar(.5);cyl.quaternion.setFromUnitVectors(UP,B.clone().sub(A).normalize());grp.add(cyl);
  const hook=new THREE.Mesh(new THREE.OctahedronGeometry(.07),new THREE.MeshStandardMaterial({color:0x8a949c,metalness:.8,roughness:.3}));hook.position.copy(A);grp.add(hook);
  const spool=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,.08,12),new THREE.MeshStandardMaterial({color:0x2c3238,metalness:.6,roughness:.4,emissive:0x5fe3e8,emissiveIntensity:.25}));spool.position.copy(B);grp.add(spool);
  scene.add(grp);iv.cable=grp;}
 function cableTrip(dt){iv.tripCd=Math.max(0,iv.tripCd-dt);const g=inv.grapnel,t=st.enc?.t;if(g.state!=='deployed'||!t||st.enc.outcome!=='active'||t.down>0||iv.tripCd>0)return;
  const A=new V3(...g.anchor),B=new V3(...g.spool),P=t.group.position,ab=B.clone().sub(A);const ab2=ab.x*ab.x+ab.z*ab.z;if(ab2<1e-4)return;
  const u=clamp(((P.x-A.x)*ab.x+(P.z-A.z)*ab.z)/ab2,0,1),q=A.clone().addScaledVector(ab,u);const d=Math.hypot(P.x-q.x,P.z-q.z);
  const key=g.anchor.join(',');if(d<.4&&q.y-P.y<1.0&&q.y-P.y>-.2){if(t.cableLearned===key){if(!t.cableNoted){t.cableNoted=true;log('The construct steps over the cable now · it learned it','analyze');}return;}t.cableLearned=key;t.cableNoted=false;t.down=1.4;t.clinch=0;t.ai='recover';iv.tripCd=3;play(t,'Dam_StandDie',false,.1);log('TRIP LINE · the construct went down on the grapnel cable · 1.4 s','combat');bump('trips');}}
 // smoke: a grey cloud for 6 s; while he or the construct is inside it, the construct cannot start an attack
 function spawnSmoke(at){const m=new THREE.Mesh(new THREE.SphereGeometry(1,20,14),new THREE.MeshBasicMaterial({color:0x8d949a,transparent:true,opacity:.0,depthWrite:false,fog:false,side:THREE.DoubleSide}));m.position.copy(at);m.position.y+=1.1;m.scale.setScalar(.3);scene.add(m);iv.clouds.push({m,t:0,life:6,at:at.clone()});}
 function tickSmoke(dt){const t=st.enc?.t;let blind=false;
  for(const c of iv.clouds){c.t+=dt;const k=c.t<.4?c.t/.4:c.t>c.life-1?Math.max(0,(c.life-c.t)):1;c.m.scale.setScalar(.3+2.5*Math.min(1,c.t/.4));c.m.material.opacity=.62*k;
   if(t&&k>.3&&(t.group.position.distanceTo(c.m.position)<3||s.pos.distanceTo(c.m.position)<3))blind=true;}
  for(const c of iv.clouds.filter(c=>c.t>=c.life)){scene.remove(c.m);c.m.geometry.dispose();c.m.material.dispose();}iv.clouds=iv.clouds.filter(c=>c.t<c.life);
  if(t&&blind&&t.ai==='windup'&&!t.committed){t.ai='ready';t.aiT=.4;play(t,'Attack_Hand_Ready',true);}
  if(t&&blind&&t.ai==='ready'){t.aiT=Math.max(t.aiT,.25);if(!t.smokeLogged){t.smokeLogged=true;log('Smoke · the construct lost track of him','combat');bump('smokeBlinds');}}else if(t&&!blind)t.smokeLogged=false;
  if(t)t.blinded=blind;}
 // rescue cutter: found near the trapped worker, carried in hand until registered by 2 rescues with it
 function placeFieldCutter(){if(iv.fieldCutter){scene.remove(iv.fieldCutter);iv.fieldCutter=null;}const e=st.enc;if(!e||!(inv.cutter.state==='none'||inv.cutter.state==='field'))return;
  const p=e.worker.group.position.clone().add(new V3(1.6,0,1.2));p.y=groundAt(p.x,p.z,e.worker.group.position.y);
  const g=new THREE.Group();g.position.copy(p);const body=new THREE.Mesh(new THREE.BoxGeometry(.5,.12,.14),new THREE.MeshStandardMaterial({color:0xb83a26,roughness:.5,metalness:.3}));body.position.y=.07;g.add(body);
  const jaw=new THREE.Mesh(new THREE.BoxGeometry(.2,.06,.2),new THREE.MeshStandardMaterial({color:0x9aa2a8,metalness:.8,roughness:.3}));jaw.position.set(.3,.07,0);g.add(jaw);
  const ring=new THREE.Mesh(new THREE.RingGeometry(.4,.48,24),new THREE.MeshBasicMaterial({color:0x5fe3e8,transparent:true,opacity:.6,side:THREE.DoubleSide,depthWrite:false,toneMapped:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.03;g.add(ring);
  scene.add(g);iv.fieldCutter=g;inv.cutter.state='field';persistInv();}
 function nearFieldCutter(){return !!iv.fieldCutter&&inv.cutter.state==='field'&&Math.hypot(iv.fieldCutter.position.x-s.pos.x,iv.fieldCutter.position.z-s.pos.z)<1.7;}
 function pickCutter(){if(!nearFieldCutter())return false;const h=handsFull('cutter');if(h){log('Rescue cutter · hands full ('+h+')','warn');return true;}
  inv.cutter.state='carried';persistInv();scene.remove(iv.fieldCutter);iv.fieldCutter=null;log('Rescue cutter picked up · NOT REGISTERED · carried in hand · free 2 people with it to register it','gear');return true;}
 function onRescue(){const c=inv.cutter;if(c.state!=='carried'&&!(c.state==='registered'&&c.out))return;if(c.state==='registered')return;
  c.rescues++;log('Rescue cutter used · registration '+c.rescues+'/2','gear');
  if(c.rescues>=2){c.state='registered';c.out=false;log('REGISTERED · rescue cutter · socket 04 is now its place on the belt','level');flash('EQUIPMENT REGISTERED','Rescue cutter · socket 04');xp(50,'Equipment registration · rescue cutter');}persistInv();}
 function handBone(){const hero=window.characterState?.().hero;if(iv.hand&&iv.handHero===hero&&iv.hand.parent)return iv.hand;iv.hand=null;iv.handHero=hero;let best=null,bd=3;
  scene.traverse(o=>{if(o.name==='mixamorigRightHand'){let v=true;for(let q=o;q;q=q.parent)if(q.visible===false){v=false;break;}if(!v)return;const d=o.getWorldPosition(new V3()).distanceTo(s.pos);if(d<bd){bd=d;best=o;}}});return iv.hand=best;}
 // ----- hand props (v7): every item has a simple prop on his right hand once his hand has reached its socket -----
 function makeProp(id){const g=new THREE.Group(),M=(c,o={})=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.5,metalness:.3},o)),glow=new THREE.MeshBasicMaterial({color:0x5fe3e8,toneMapped:false});
  if(id==='baton'){const b=new THREE.Mesh(new THREE.CylinderGeometry(.021,.024,.52,12),M(0x14171b,{metalness:.6}));b.position.y=.15;g.add(b);const grip=new THREE.Mesh(new THREE.CylinderGeometry(.027,.027,.16,12),M(0x0a0c0f,{roughness:.9}));grip.position.y=-.03;g.add(grip);const strip=new THREE.Mesh(new THREE.BoxGeometry(.008,.2,.05),glow);strip.position.y=.26;g.add(strip);}
  else if(id==='cutter'){const body=new THREE.Mesh(new THREE.BoxGeometry(.08,.34,.08),M(0xb83a26));g.add(body);const jaw=new THREE.Mesh(new THREE.BoxGeometry(.12,.12,.04),M(0x9aa2a8,{metalness:.8}));jaw.position.y=.22;g.add(jaw);}
  else if(id==='medkit'){const c=new THREE.Mesh(new THREE.BoxGeometry(.2,.14,.07),M(0x1b2228));g.add(c);const a=new THREE.Mesh(new THREE.BoxGeometry(.07,.022,.074),glow),b=new THREE.Mesh(new THREE.BoxGeometry(.022,.07,.074),glow);g.add(a);g.add(b);}
  else if(id==='smoke'){const c=new THREE.Mesh(new THREE.CylinderGeometry(.032,.032,.12,12),M(0x20262b,{metalness:.6}));g.add(c);const r=new THREE.Mesh(new THREE.CylinderGeometry(.034,.034,.014,12),glow);r.position.y=.035;g.add(r);}
  else if(id==='grapnel'){const c=new THREE.Mesh(new THREE.CylinderGeometry(.026,.03,.22,10),M(0x14171b,{metalness:.7}));g.add(c);for(const sx of [-1,1]){const h=new THREE.Mesh(new THREE.TorusGeometry(.05,.009,6,12,Math.PI*.8),M(0x9aa2a8,{metalness:.9}));h.position.set(sx*.045,.14,0);h.rotation.z=sx>0?-.3:Math.PI+.3-Math.PI*.8;g.add(h);}}
  const holder=new THREE.Group();holder.name='Loadout prop '+id;g.rotation.z=Math.PI/2;g.position.set(0,.085,.025);holder.add(g);return holder;}
 function propShown(id){const A=iv.act,inAct=!!A&&A.item===id&&A.contacted;switch(id){case 'baton':return st.baton.out;case 'cutter':return inv.cutter.state==='carried'||inv.cutter.out;case 'grapnel':return inAct&&inv.grapnel.state!=='deployed';default:return inAct;}}
 function tickHandProps(){iv.props=iv.props||{};const lo=isLoadout();iv.shown=[];
  if(lo&&st.baton.out&&window.loadoutRunnerFull?.state?.().weapon)iv.shown.push('baton');
  for(const id of ['cutter','medkit','smoke','grapnel']){const show=lo&&propShown(id);let p=iv.props[id];if(show&&!p)p=iv.props[id]=makeProp(id);if(!p)continue;const h=show?handBone():null;
   if(h&&p.parent!==h){h.add(p);h.updateMatrixWorld(true);const ws=h.getWorldScale(new V3());p.scale.set(1/ws.x,1/ws.y,1/ws.z);}
   p.visible=!!h&&show;if(p.visible)iv.shown.push(id);}
  iv.cutterProp=iv.props.cutter||null;}
 // ----- reaching in (v7): his right arm is steered to the socket card; the item is in his hand from the moment of contact -----
 const Q4=THREE.Quaternion;
 function reachPoint(){const H=hips(),f=fwd(),right=new V3(-f.z,0,f.x);return H.addScaledVector(f,.4).addScaledVector(right,.26).add(new V3(0,.34,0));}
 function worldRotate(bone,q){const pq=bone.parent.getWorldQuaternion(new Q4()),bq=bone.getWorldQuaternion(new Q4());bone.quaternion.copy(pq.invert().multiply(q.clone().multiply(bq)));bone.updateMatrix();bone.updateWorldMatrix(false,true);}
 function handDist(){const h=handBone();return h?+h.getWorldPosition(new V3()).distanceTo(reachPoint()).toFixed(3):null;}
 // ----- v10: the reach itself is a Kimodo clip, and the card is a pocket: what goes through its face is not drawn -----
 // The clip (NVIDIA Kimodo text-to-motion, SOMA skeleton) is kept as world rotations away from a T-pose. It is fitted here to
 // whatever Mixamo-named rig he has (its bind pose lined up bone by bone with the T-pose), then played as a layer on his torso,
 // arms and right-hand fingers while his legs keep the game's own stance. The two-bone reach still steers the fingertip, so the
 // hand meets the card wherever the card is. Kimodo's hips travel is not used: nothing here moves the capsule.
 const KIM={url:'assets/loadout/kimodo/pocket_reach.json',status:'idle',data:null,rig:null,fit:null,w:0,t:0,error:null};
 const KMAP={Spine:'Spine1',Spine1:'Spine2',Spine2:'Chest',Neck:'Neck1',LeftShoulder:'LeftShoulder',LeftArm:'LeftArm',LeftForeArm:'LeftForeArm',LeftHand:'LeftHand',RightShoulder:'RightShoulder',RightArm:'RightArm',RightForeArm:'RightForeArm',RightHand:'RightHand',
  RightHandThumb1:'RightHandThumb1',RightHandThumb2:'RightHandThumb2',RightHandThumb3:'RightHandThumb3',...Object.fromEntries(['Index','Middle','Ring','Pinky'].flatMap(f=>[1,2,3].map(i=>['RightHand'+f+i,'RightHand'+f+(i+1)])))};
 const KCHILD={Hips:'Spine',Spine:'Spine1',Spine1:'Spine2',Spine2:'Neck',Neck:'Head',LeftShoulder:'LeftArm',LeftArm:'LeftForeArm',LeftForeArm:'LeftHand',LeftHand:'LeftHandMiddle1',RightShoulder:'RightArm',RightArm:'RightForeArm',RightForeArm:'RightHand',RightHand:'RightHandMiddle1',
  RightHandThumb1:'RightHandThumb2',RightHandThumb2:'RightHandThumb3',...Object.fromEntries(['Index','Middle','Ring','Pinky'].flatMap(f=>[1,2].map(i=>['RightHand'+f+i,'RightHand'+f+(i+1)])))};
 function kimLoad(){if(KIM.status!=='idle')return;KIM.status='loading';fetch(KIM.url).then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json();}).then(d=>{if(!(d.frames>2)||d.q.length!==d.frames*d.joints.length*4)throw Error('bad clip');KIM.data=d;KIM.status='ready';}).catch(e=>{KIM.status='error';KIM.error=String(e.message||e);});}
 const kimReady=()=>KIM.status==='ready';
 // Fit the clip to the rig that owns `hand`: local rotations per frame for every bone the layer drives.
 function kimFit(hand){let hipsB=hand;while(hipsB&&!/Hips$/.test(hipsB.name))hipsB=hipsB.parent;if(!hipsB)return null;if(KIM.rig===hipsB)return KIM.fit;KIM.rig=hipsB;KIM.fit=null;
  let top=hipsB;while(top.parent&&top.parent!==scene)top=top.parent;let skin=null;top.traverse(o=>{if(!skin&&o.isSkinnedMesh&&o.skeleton.bones.includes(hand))skin=o;});if(!skin)return null;
  const sk=skin.skeleton,pre=hipsB.name.replace(/Hips$/,''),B=n=>sk.bones.find(b=>b.name===pre+n),bindM=b=>new THREE.Matrix4().copy(sk.boneInverses[sk.bones.indexOf(b)]).invert();
  const bindP=n=>{const b=B(n);return b?new V3().setFromMatrixPosition(bindM(b)):null;},bindQ=b=>{const p=new V3(),q=new Q4(),s3=new V3();bindM(b).decompose(p,q,s3);return q;};
  // his bind space against the clip's (X his left, Y up, Z ahead)
  const up=bindP('Head').sub(bindP('Hips')).normalize(),left=bindP('LeftArm').sub(bindP('RightArm'));left.addScaledVector(up,-left.dot(up)).normalize();const ahead=new V3().crossVectors(left,up);
  const Mb=new Q4().setFromRotationMatrix(new THREE.Matrix4().makeBasis(left,up,ahead)),MbI=Mb.clone().invert(),d=KIM.data,J=d.joints,ji=n=>J.indexOf(n),F=d.frames;
  const G=(j,t)=>{const o=(t*J.length+j)*4,q=new Q4(d.q[o],d.q[o+1],d.q[o+2],d.q[o+3]);return Mb.clone().multiply(q).multiply(MbI);};
  const names=Object.keys(KMAP).filter(n=>B(n)&&ji(KMAP[n])>=0&&B(n).parent&&(n==='Spine'||KMAP[B(n).parent.name.slice(pre.length)])),rows=[];
  const corr={},restW={};for(const n of ['Hips',...names]){const b=B(n);restW[n]=bindQ(b);const c=KCHILD[n]&&bindP(KCHILD[n]),src=d.rest[n==='Hips'?'Hips':KMAP[n]];
   if(c&&src){const dT=c.sub(bindP(n)).normalize(),dS=new V3(src[0],src[1],src[2]).applyQuaternion(Mb).normalize();corr[n]=new Q4().setFromUnitVectors(dT,dS);}}
  for(const n of names)if(!corr[n]){const p=B(n).parent.name.slice(pre.length);corr[n]=corr[p]?corr[p].clone():new Q4();}
  const hipsJ=ji('Hips'),W=(n,t)=>n==='Hips'?G(hipsJ,0).multiply(corr.Hips||new Q4()).multiply(restW.Hips):G(ji(KMAP[n]),t).multiply(corr[n]).multiply(restW[n]);
  for(const n of names){const b=B(n),p=b.parent.name.slice(pre.length),v=new Float32Array(F*4);for(let t=0;t<F;t++){const q=W(p,t).invert().multiply(W(n,t));if(t&&(q.x*v[t*4-4]+q.y*v[t*4-3]+q.z*v[t*4-2]+q.w*v[t*4-1])<0){q.x=-q.x;q.y=-q.y;q.z=-q.z;q.w=-q.w;}q.toArray(v,t*4);}rows.push({b,v,n});}
  return KIM.fit={rows,frames:F,reach:d.reach,enter:d.enter??d.reach,fps:d.fps,bones:rows.length,skin,hipsB};}
 // Seq time -> clip frame: the approach is spread over [0, grip], the withdrawal over [grip, grip+out].
 function kimFrame(A){const F=KIM.fit,t=A.t,c=A.contact,e=Math.min(F.enter,F.reach);return t<=SEQ.touch?e*clamp(t/SEQ.touch,0,1):t<=c?e+(F.reach-e)*clamp((t-SEQ.touch)/(c-SEQ.touch),0,1):F.reach+(F.frames-1-F.reach)*clamp((t-c)/SEQ.out,0,1);}
 function kimRestore(){const F=KIM.fit;if(!F)return;for(const r of F.rows){const u=r.b.userData;if(u.k10a&&r.b.quaternion.equals(u.k10a))r.b.quaternion.copy(u.k10b);u.k10a=null;}}
 function kimLayer(A,hand){const F=kimFit(hand);if(!F){KIM.w=0;return false;}const t=A.t,c=A.contact,end=c+SEQ.out,w=sm(t/.18)*(1-sm((t-(end-.26))/.26));KIM.w=+w.toFixed(3);if(w<=0)return true;
  const f=clamp(kimFrame(A),0,F.frames-1),i=Math.min(F.frames-2,Math.floor(f)),a=f-i,qa=new Q4(),qb=new Q4();KIM.t=+f.toFixed(2);
  for(const r of F.rows){r.b.userData.k10b=r.b.quaternion.clone();qa.fromArray(r.v,i*4);qb.fromArray(r.v,i*4+4);qa.slerp(qb,a);r.b.quaternion.slerp(qa,w);}
  F.hipsB.updateWorldMatrix(true,true);return true;}
 function kimSeal(){const F=KIM.fit;if(F)for(const r of F.rows)if(r.b.userData.k10b)r.b.userData.k10a=r.b.quaternion.clone();}
 // The pocket: one clipping plane on the card's face, on his own materials and on what he holds. Away from a retrieval it clips nothing.
 const POCKET={plane:new THREE.Plane(new V3(0,1,0),1e6),mats:new Set(),on:false,ring:null,depth:0,wrist:0};
 function pocketMat(m){if(!m||POCKET.mats.has(m))return;POCKET.mats.add(m);m.clippingPlanes=[POCKET.plane];if(m.isShaderMaterial){m.clipping=true;/* the engine's outline hull is a bare ShaderMaterial with no clipping code: give it the standard chunks, or the hand's black outline stays visible behind the card */if(!/clipping_planes/.test(m.fragmentShader)&&m.vertexShader.includes('#include <project_vertex>')&&/void main\(\)\{/.test(m.fragmentShader)){m.vertexShader=m.vertexShader.replace(/void main\(\)\{/,'#include <clipping_planes_pars_vertex>\nvoid main(){').replace('#include <project_vertex>','#include <project_vertex>\n#include <clipping_planes_vertex>');m.fragmentShader=m.fragmentShader.replace(/void main\(\)\{/,'#include <clipping_planes_pars_fragment>\nvoid main(){\n#include <clipping_planes_fragment>\n');POCKET.hulls=(POCKET.hulls||0)+1;}}m.needsUpdate=true;}
 function pocketArm(){const F=KIM.fit||(handBone()&&kimReady()&&kimFit(handBone()));if(typeof renderer!=='undefined'&&!renderer.localClippingEnabled)renderer.localClippingEnabled=true;
  if(F&&F.skin){let top=F.hipsB;while(top.parent&&top.parent!==scene)top=top.parent;top.traverse(o=>{if(o.isMesh&&!/^Loadout prop /.test(o.parent?.parent?.name||''))for(const m of [].concat(o.material))pocketMat(m);});}
  for(const id in (iv.props||{}))iv.props[id]?.traverse(o=>{if(o.isMesh)for(const m of [].concat(o.material))pocketMat(m);});}
 function pocketSet(Pc,n,on){const P=POCKET;P.on=on;if(on)P.plane.setFromNormalAndCoplanarPoint(n,Pc);else{P.plane.normal.set(0,1,0);P.plane.constant=1e6;}
  if(!P.ring){const g=new THREE.RingGeometry(.72,1,40),m=new THREE.MeshBasicMaterial({color:0x7ff2ff,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,toneMapped:false,fog:false});P.ring=new THREE.Mesh(g,m);P.ring.name='Loadout pocket rim';P.ring.renderOrder=7;P.ring.frustumCulled=false;P.ring.visible=false;scene.add(P.ring);}}
 // What he holds comes out of the pocket at the size the opening allows: it grows to full size as his hand clears the card, and
 // shrinks into it when he puts something back. Only objects carried on the hand bone are touched; their own scale is kept and restored.
 function pocketItems(hand,e){let n=0;for(const o of hand.children){if(o.isBone)continue;const u=o.userData;if(!u.k10s||!u.k10w||!o.scale.equals(u.k10w))u.k10s=o.scale.clone();o.scale.copy(u.k10s).multiplyScalar(Math.max(.02,e));u.k10w=o.scale.clone();if(o.visible)n++;}POCKET.items=n;POCKET.itemScale=+e.toFixed(3);POCKET.scaled=e<1;}
 // The rim: a thin ring on the card face where his forearm or hand crosses it.
 function pocketRim(a,b,Pc,n){const P=POCKET,da=a.clone().sub(Pc).dot(n),db=b.clone().sub(Pc).dot(n);P.depth=+(-db).toFixed(3);if(!P.on||!(da>0&&db<0)){P.ring.visible=false;return;}
  const x=a.clone().lerp(b,da/(da-db));P.ring.position.copy(x).addScaledVector(n,.004);P.ring.quaternion.setFromUnitVectors(new V3(0,0,1),n);const k=clamp(-db/.05,0,1);P.ring.scale.setScalar(.05+.018*k+.004*Math.sin(clock*14));P.ring.material.opacity=.55*k;P.ring.visible=true;}
 // v9: the fingertip, not the wrist, is steered. Out of the open belt (A.seq) the target is the opening on the card that came into reach:
 // touch its surface, go in, come out again. A quick use with the belt closed keeps the v7 reach to the socket card at his hip.
 function armTip(hand){if(iv.tipFor!==hand){iv.tipFor=hand;iv.tip=null;for(const n of ['mixamorigRightHandMiddle3','mixamorigRightHandMiddle2','mixamorigRightHandMiddle1']){const b=hand.getObjectByName(n);if(b){iv.tip=b;break;}}}return iv.tip;}
 function solveArm(ch,T,w){const {hand,fore,arm}=ch,S=arm.getWorldPosition(new V3()),E=fore.getWorldPosition(new V3());let W=hand.getWorldPosition(new V3());
  const a=E.distanceTo(S),b=W.distanceTo(E),d=clamp(T.distanceTo(S),Math.abs(a-b)+.01,a+b-.004);
  const u=S.clone().sub(E).normalize(),v=W.clone().sub(E).normalize(),cur=Math.acos(clamp(u.dot(v),-1,1)),want=Math.acos(clamp((a*a+b*b-d*d)/(2*a*b),-1,1));
  const axis=new V3().crossVectors(u,v);if(axis.lengthSq()<1e-6)axis.set(0,1,0);axis.normalize();
  worldRotate(fore,new Q4().setFromAxisAngle(axis,(want-cur)*w));W=hand.getWorldPosition(new V3());
  const q=new Q4().setFromUnitVectors(W.sub(S).normalize(),T.clone().sub(S).normalize());worldRotate(arm,new Q4().slerp(q,w));}
 function tickHead(){let want=0;if(isLoadout()&&iv.blend>.02&&iv.camF&&iv.socks.length){const A=iv.act,k=iv.socks[A&&A.seq?A.sock:inv.sel];if(k){const d=k.g.position.clone().sub(hips()),f=iv.camF;let a=Math.atan2(d.x,d.z)-Math.atan2(f.x,f.z);a-=Math.round(a/(2*Math.PI))*2*Math.PI;want=clamp(a,-.5,.5)*iv.blend;}}
  iv.headYaw=(iv.headYaw||0)+(want-(iv.headYaw||0))*.16;if(Math.abs(iv.headYaw)<.004){iv.headYaw=want?iv.headYaw:0;if(!want)return;}
  let root=handBone();while(root&&root.parent&&!/Hips$/.test(root.name))root=root.parent;if(!root)return;
  if(iv.headFor!==root){iv.headFor=root;iv.neck=root.getObjectByName('mixamorigNeck');iv.head=root.getObjectByName('mixamorigHead');}
  for(const [b,k] of [[iv.neck,.4],[iv.head,.6]]){if(!b)continue;const u=b.userData;if(u.lo9a&&b.quaternion.equals(u.lo9a))b.quaternion.copy(u.lo9b);u.lo9b=b.quaternion.clone();worldRotate(b,new Q4().setFromAxisAngle(UP,iv.headYaw*k));u.lo9a=b.quaternion.clone();}
  if(iv.head){const m=iv.head.matrixWorld.elements;iv.headDir=[+m[8].toFixed(3),+m[10].toFixed(3)];}}
 function tickReach(){const A=iv.act,seq=!!(A&&A.seq);let w=0;if(isLoadout())kimLoad();kimRestore();const kOn=seq&&kimReady();if(!kOn){KIM.w=0;if(POCKET.on||!POCKET.ring)pocketSet(null,null,false);if(POCKET.ring)POCKET.ring.visible=false;if(POCKET.scaled){const h=handBone();if(h)pocketItems(h,1);POCKET.scaled=false;}}
  if(kOn&&!POCKET.armed){pocketArm();POCKET.armed=true;}if(!isLoadout())POCKET.armed=false;
  if(seq){const t=A.t,c=A.contact;w=t<SEQ.touch?sm((t-.05)/(SEQ.touch-.05)):t<c+.1?1:1-sm((t-c-.1)/(SEQ.out-.1));}
  else if(A&&A.contact!=null){const t=A.t,c=A.contact;w=t<c?t/c:t<c+.1?1:Math.max(0,1-(t-c-.1)/.28);w=w*w*(3-2*w);}
  iv.reachW=w;try{tickHead();}catch(e){}if(w<=0)return;
  const hand=handBone(),fore=hand?.parent,arm=fore?.parent;if(!arm||!arm.parent||!/ForeArm$/.test(fore.name)||!/Arm$/.test(arm.name))return;const ch={hand,fore,arm};if(kOn){try{kimLayer(A,hand);}catch(e){KIM.status='error';KIM.error=String(e.message||e);}}arm.updateWorldMatrix(true,true);
  if(!seq){const T=reachPoint();solveArm(ch,T,w);iv.reachDist=+hand.getWorldPosition(new V3()).distanceTo(T).toFixed(3);if(A.contacted&&iv.lastContact&&!iv.lastContact.solved){iv.lastContact.handDist=iv.reachDist;iv.lastContact.w=+w.toFixed(2);iv.lastContact.solved=true;}return;}
  const f=iv.camF||fwd(),r=new V3(-f.z,0,f.x),t=A.t,c=A.contact,Pc=(t>=SEQ.near||!iv.reachPos)?reachCard(f,r,hips()).add(new V3(0,-.03*SEQ.h,0)):iv.reachPos.clone();
  const S=arm.getWorldPosition(new V3()),dir=Pc.clone().sub(S).normalize(),inK=sm((t-SEQ.touch)/(c-SEQ.touch)),outK=sm((t-c)/(SEQ.out*.75)),P=Pc.clone().addScaledVector(dir,SEQ.push*inK-(SEQ.push+SEQ.pull)*outK);
  const tb=armTip(hand),wp=()=>hand.getWorldPosition(new V3()),tip=()=>tb?tb.getWorldPosition(new V3()):wp().add(wp().sub(fore.getWorldPosition(new V3())).normalize().multiplyScalar(.15));
  const L=clamp(tip().distanceTo(wp()),.07,.2),T=P.clone().addScaledVector(dir,-L),aim=k=>{const W=wp(),a=tip().sub(W),b=P.clone().sub(W);if(a.lengthSq()<1e-8||b.lengthSq()<1e-8)return;worldRotate(hand,new Q4().slerp(new Q4().setFromUnitVectors(a.normalize(),b.normalize()),k));};
  solveArm(ch,T,w);aim(w);
  if(w>.97)for(let q=0;q<2;q++){const err=P.clone().sub(tip());if(err.length()<.004)break;T.add(err);solveArm(ch,T,1);aim(1);}
  const tp=tip(),n=iv.reachN||dir.clone().negate();iv.tipDist=+tp.distanceTo(Pc).toFixed(3);iv.reachDist=+tp.distanceTo(P).toFixed(3);
  const LP=iv.lastPull;if(LP&&LP.act===A){if(t>=SEQ.touch&&LP.touchDist==null){LP.touchDist=iv.tipDist;LP.touchAt=+t.toFixed(3);LP.tip=tp.toArray().map(v=>+v.toFixed(3));LP.card=Pc.toArray().map(v=>+v.toFixed(3));LP.shoulder=+S.distanceTo(Pc).toFixed(3);}
   if(t>=SEQ.touch&&t<c)LP.maxDepth=Math.max(LP.maxDepth||0,+Pc.clone().sub(tp).dot(n).toFixed(3));
   if(A.contacted&&LP.gripDepth==null){LP.gripDepth=+Pc.clone().sub(tp).dot(n).toFixed(3);LP.gripErr=iv.reachDist;}}
  if(kOn){const dTip=Pc.clone().sub(tp).dot(n);if(t>c+.08&&dTip<-.03)A.pocketOut=true;/* the pocket is only there while a hand can be in it: from just before his fingers arrive until they are clear again */const live=!A.pocketOut&&t>=SEQ.near&&t<c+SEQ.out&&(t>=c||dTip>-.15);pocketSet(Pc,n,live);pocketArm();const W=wp(),E=fore.getWorldPosition(new V3());pocketRim(E,tip(),Pc,n);pocketItems(hand,A.stow?1-sm((t-SEQ.touch)/(c-SEQ.touch)):sm((t-c)/(SEQ.out*.5)));POCKET.wrist=+(-W.sub(Pc).dot(n)).toFixed(3);
   if(LP&&LP.act===A){LP.kimodo=true;LP.kimW=Math.max(LP.kimW||0,KIM.w);if(POCKET.items){LP.items=POCKET.items;LP.itemScaleMin=Math.min(LP.itemScaleMin??1,POCKET.itemScale);LP.itemScaleEnd=POCKET.itemScale;}if(live){LP.wristDepth=Math.max(LP.wristDepth??-9,POCKET.wrist);LP.tipDepth=Math.max(LP.tipDepth??-9,POCKET.depth);}
    if(A.contacted&&LP.wristAtGrip==null){LP.wristAtGrip=POCKET.wrist;LP.clipFrameAtGrip=KIM.t;}
    if(live){let far=9;for(const nm of ['Head','LeftHand','Hips','Spine2','LeftForeArm','RightArm']){const b=KIM.fit.skin.skeleton.bones.find(x=>x.name.endsWith(nm));if(b)far=Math.min(far,b.getWorldPosition(new V3()).sub(Pc).dot(n));}LP.bodyClear=Math.min(LP.bodyClear??9,+far.toFixed(3));}}
   kimSeal();}}
 // ----- the belt view (v7): one inventory, two presentations -----
 // In a fight: the COMBAT ARC. The camera stays over his shoulder; the sockets leave the belt core as cards, fan across the
 // screen and stay tied to the core by thin lines. Outside a fight: the CAPSULE view, the camera lowers to his belt and the
 // sockets stand over it as glass capsules. Cards are laid out in screen space at the depth of his hips, so they stay
 // readable whichever way he faces.
 function openCarousel(){if(iv.open||!isLoadout()||!gameActive)return;iv.open=true;iv.mode=st.enc&&st.enc.outcome==='active'?'arc':'capsule';iv.mx=0;try{for(const k of ['w','a','s','d','shift','space'])if(typeof keys!=='undefined'&&k in keys)keys[k]=false;}catch(e){}st.wheel=null;log('Belt Inventory · sockets open · the construct is slowed, not stopped','gear');}
 function closeCarousel(confirm){if(!iv.open)return;
  if(confirm){if(iv.seqOn)return;iv.seqWant=true;let ok=false;try{ok=retrieve(inv.sel);}finally{iv.seqWant=false;}if(ok&&iv.act&&iv.act.seq)iv.seqOn=true;else iv.open=false;return;}
  if(iv.seqOn){const A=iv.act;if(A&&A.seq&&!A.contacted){iv.act=null;if(iv.lastPull)iv.lastPull.aborted=true;log('Retrieval cancelled · '+SOCKETS[A.sock].name+' stays in socket '+SOCKETS[A.sock].slot,'gear');}iv.seqOn=false;}iv.open=false;}
 function stepSel(d){if(iv.seqOn)return;inv.sel=(inv.sel+d+SOCKETS.length)%SOCKETS.length;persistInv();}
 function quick(){retrieve(inv.sel);}
 const carouselSlow=()=>iv.open?.5:1;
 function hips(){let hp=null;try{let r=handBone();while(r&&r.parent&&!/Hips$/.test(r.name))r=r.parent;hp=r&&/Hips$/.test(r.name)?r.getWorldPosition(new V3()):null;}catch(e){}return hp||s.pos.clone().add(new V3(0,-.05,0));}
 const CARD_K=.86,CARD_VS='varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
 // v8: the quad is larger than the card (the card is the inner 86 %), so the border can carry a soft outer glow
 const CARD_FS=`precision highp float;varying vec2 vUv;uniform sampler2D uIcon;uniform float uSel,uFull,uAlpha,uTime,uAspect,uOpen,uRip,uTilt;
float sdCut(vec2 p,vec2 b,float c){p=abs(p);return max(max(p.x-b.x,p.y-b.y),(p.x+p.y-(b.x+b.y-c))*.7071);}
void main(){vec2 q=(vUv-.5)/${CARD_K};vec2 p=q*vec2(uAspect,1.);vec2 b=vec2(uAspect*.5,.5);float d=sdCut(p,b,.085);
 vec3 cy=mix(vec3(.30,.80,.84),vec3(.66,.98,1.),uSel);cy=mix(vec3(.2,.32,.37),cy,max(uFull,uSel));
 if(d>0.){float g=exp(-d*42.)*(.06+.42*uSel);gl_FragColor=vec4(cy,g*uAlpha);return;}
 vec2 uv=q+.5;float edge=smoothstep(.014+.008*uSel,.003,-d),inner=smoothstep(.004,0.,abs(-d-.034))*(.22+.38*uSel);
 vec3 base=mix(vec3(.018,.03,.042),vec3(.03,.09,.115),uv.y*.55+uSel*.4);
 vec2 gv=abs(fract(uv*vec2(8.,11.))-.5);float grid=smoothstep(.465,.5,max(gv.x,gv.y))*(.05+.09*uSel)*smoothstep(.05,.3,uv.y)*smoothstep(.86,.7,uv.y);
 float scan=.5+.5*sin(uv.y*170.+uTime*1.4);vec3 col=base+cy*(grid+.025*scan);float a=mix(.66,.82,uSel);
 vec4 t=texture2D(uIcon,uv);t.a*=mix(.55,1.,max(uFull,uSel));col=mix(col,t.rgb,t.a);a=max(a,t.a*.96);
 vec2 oc=(uv-vec2(.5,.47))*vec2(uAspect,1.);
 if(uOpen>.001){float cs=cos(uTilt),sn=sin(uTilt);vec2 o=vec2(cs*oc.x+sn*oc.y,-sn*oc.x+cs*oc.y);float hl=.17*uOpen;o.y-=clamp(o.y,-hl,hl);float od=length(o)-(.015+.075*uOpen);
  float ins=smoothstep(.006,-.006,od);col=mix(col,vec3(0.,.008,.014)+cy*.3*smoothstep(-.085,0.,od),ins);a=max(a,ins*.98);float rim=smoothstep(.013,0.,abs(od));col=mix(col,vec3(.86,1.,1.),rim);a=max(a,rim);col+=cy*exp(-max(od,0.)*26.)*.35*(1.-ins);}
 if(uRip>=0.&&uRip<1.){float rp=smoothstep(.02,0.,abs(length(oc)-uRip*.4))*(1.-uRip);col+=vec3(.7,1.,1.)*rp*1.3;a=max(a,rp);}
 float line=max(edge,inner);col=mix(col,cy,line);a=max(a,line);gl_FragColor=vec4(col,a*uAlpha);}`;
 // v8: the card carries its text (slot, name, state); the item itself is a 3D model standing in front of the card
 const CARD_FONT='"Avenir Next Condensed","DIN Condensed","Arial Narrow","Helvetica Neue",Arial,sans-serif';
 const shortState=S=>S.id?invItemState(S.id).split(' · ').filter(p=>p.length<17).slice(0,2).join(' · ').toUpperCase():'EMPTY';
 function drawCard(k,S){const stt=shortState(S);if(k.key===stt)return;k.key=stt;const x=k.cv.getContext('2d'),W=444,Hh=600,F=CARD_FONT;x.setTransform(1,0,0,1,0,0);x.clearRect(0,0,W,Hh);x.textBaseline='top';x.textAlign='center';
  x.fillStyle='#8fe9ee';x.font='500 34px '+F;x.fillText((S.id?'SLOT ':'CAPSULE ')+S.slot,W/2,40);
  const nm=(S.card||S.name).toUpperCase();let fs=62;x.font='700 '+fs+'px '+F;while(x.measureText(nm).width>W-76&&fs>22){fs--;x.font='700 '+fs+'px '+F;}x.fillStyle='#ffffff';x.fillText(nm,W/2,78);
  x.fillStyle='rgba(95,227,232,.55)';x.fillRect(46,152,W-92,2);x.fillRect(46,152,26,5);x.fillRect(W-72,152,26,5);
  x.strokeStyle='rgba(95,227,232,.5)';x.lineWidth=2;for(const sx of [-1,1]){x.beginPath();x.moveTo(W/2+sx*150,560);x.lineTo(W/2+sx*172,560);x.lineTo(W/2+sx*172,538);x.stroke();}
  x.fillStyle=/EMPTY|BROKEN|^0\/|NOT REG|LOCATED|DEPLOYED/.test(stt)?'#ffcf7a':'#bfeef2';let f2=27;x.font='600 '+f2+'px '+F;while(x.measureText(stt).width>W-110&&f2>14){f2--;x.font='600 '+f2+'px '+F;}x.fillText(stt,W/2,532);k.tex.needsUpdate=true;}
 const sm=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
 // v9: camera centred behind him; six fixed sockets on an arc in front of him; SEQ is the touch-and-retrieve timeline (seconds into the act)
 const ARC={step:.262,r:2.45,f0:0,y:.7,lift:.0,h:.92,sel:.4,near:.55},TN=20,CAM={back:2.2,right:0,up:1.25,lf:2.5,lr:0,lu:-.28,fov:50},LIGHT={key:5,fill:4};
 const SEQ={near:.24,touch:.44,grip:.86,out:.56,h:.46,f:.5,r:.46,u:.44,push:.27,pull:.26};/* v10: the hand goes in to the wrist, stays in while it finds the item, and the Kimodo withdrawal has room */
 // the card that comes to him never stops farther from his shoulder than his fingertip can go in (arm + hand - push), whatever pose he is in
 const reachCard=(f,r,H)=>{const P=H.clone().addScaledVector(f,SEQ.f).addScaledVector(r,SEQ.r).add(new V3(0,SEQ.u,0));
  try{const hb=handBone(),fo=hb&&hb.parent,ar=fo&&fo.parent;if(ar&&/ForeArm$/.test(fo.name)&&/Arm$/.test(ar.name)){const S=ar.getWorldPosition(new V3()),E=fo.getWorldPosition(new V3()),W=hb.getWorldPosition(new V3()),tb=armTip(hb),L=tb?clamp(tb.getWorldPosition(new V3()).distanceTo(W),.07,.2):.1,max=S.distanceTo(E)+E.distanceTo(W)+L-SEQ.push-.012,d=P.clone().sub(S),l=d.length();if(l>max)P.copy(S).addScaledVector(d,max/l);}}catch(e){}
  return P;};
 function energyLine(i,a,b,r,show,sel,al){const g=iv.tether.geometry,P=g.attributes.position.array,U=g.attributes.aU.array,c1=a.clone().addScaledVector(r,.34),c2=b.clone().addScaledVector(r,-.1);c1.y-=.03;c2.y-=.2;
  const w=show?.011+.011*sel:0,z=show?al*(.6+.4*sel):0,p=new V3(),tg=new V3(),sd=new V3();
  for(let j=0;j<TN;j++){const t=j/(TN-1),u=1-t;p.copy(a).multiplyScalar(u*u*u).addScaledVector(c1,3*u*u*t).addScaledVector(c2,3*u*t*t).addScaledVector(b,t*t*t);
   tg.copy(c1).sub(a).multiplyScalar(3*u*u).addScaledVector(c2.clone().sub(c1),6*u*t).addScaledVector(b.clone().sub(c2),3*t*t);sd.copy(camera.position).sub(p);sd.crossVectors(tg,sd);if(sd.lengthSq()<1e-9)sd.set(0,1,0);sd.normalize().multiplyScalar(w);
   const o=(i*TN+j)*6;P[o]=p.x+sd.x;P[o+1]=p.y+sd.y;P[o+2]=p.z+sd.z;P[o+3]=p.x-sd.x;P[o+4]=p.y-sd.y;P[o+5]=p.z-sd.z;U[o]=t;U[o+1]=1;U[o+2]=z;U[o+3]=t;U[o+4]=-1;U[o+5]=z;}}
 // v8: the item on each card is the same prop he takes in his hand, shown as a lit hologram
 const HOLO_VS='varying vec3 vN;void main(){vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
 const HOLO_FS='precision highp float;varying vec3 vN;uniform float uAlpha,uLive,uGlow;void main(){vec3 n=normalize(vN);float rim=pow(1.-abs(n.z),1.6),top=max(n.y,0.),key=max(dot(n,normalize(vec3(-.5,.4,.75))),0.);vec3 col=vec3(.035,.10,.125)+vec3(.20,.62,.68)*(rim*.95+top*.22+key*.42);col=mix(col,vec3(.62,.98,1.),uGlow);col=mix(vec3(dot(col,vec3(.33)))*.55,col,uLive);gl_FragColor=vec4(col,uAlpha);}';
 const ITEM_POSE={baton:{fit:.5,tilt:-.62,wide:2.3},grapnel:{fit:.36,tilt:.12,wide:1.25},smoke:{fit:.3,tilt:.1,wide:1.2},medkit:{fit:.36,tilt:0,wide:1,pitch:.22},cutter:{fit:.4,tilt:.5,wide:1.15}};
 function makeCardItem(id){const holder=makeProp(id),g=holder.children[0];holder.remove(g);g.position.set(0,0,0);g.rotation.set(0,0,0);const P=ITEM_POSE[id]||{fit:.3,tilt:0,wide:1},mats=[];
  g.traverse(o=>{if(!o.isMesh)return;const glow=o.material.isMeshBasicMaterial;const m=new THREE.ShaderMaterial({vertexShader:HOLO_VS,fragmentShader:HOLO_FS,transparent:true,uniforms:{uAlpha:{value:1},uLive:{value:1},uGlow:{value:glow?1:0}}});o.material=m;o.frustumCulled=false;mats.push(m);});
  g.scale.set(P.wide,1,P.wide);g.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(g),sz=box.getSize(new V3()),c=box.getCenter(new V3());g.position.sub(c);
  const tilt=new THREE.Group();tilt.add(g);tilt.rotation.z=P.tilt;tilt.rotation.x=P.pitch||0;const spin=new THREE.Group();spin.add(tilt);const fit=new THREE.Group();fit.add(spin);fit.userData.unit=P.fit/Math.max(sz.x,sz.y,sz.z);return {root:fit,spin,mats};}
 function buildCards(){iv.root=new THREE.Group();iv.root.name='Loadout belt sockets';scene.add(iv.root);
  const geo=new THREE.PlaneGeometry(1,1,24,1),gp=geo.attributes.position,BEND=.62;for(let v=0;v<gp.count;v++){const a=gp.getX(v)*BEND;gp.setX(v,Math.sin(a)/BEND);gp.setZ(v,(1-Math.cos(a))/BEND);}gp.needsUpdate=true;
  SOCKETS.forEach(S=>{const g=new THREE.Group(),cv=document.createElement('canvas');cv.width=444;cv.height=600;const tex=new THREE.CanvasTexture(cv);tex.minFilter=THREE.LinearFilter;tex.generateMipmaps=false;try{tex.anisotropy=renderer.capabilities.getMaxAnisotropy();}catch(e){}
   const mat=new THREE.ShaderMaterial({vertexShader:CARD_VS,fragmentShader:CARD_FS,transparent:true,depthTest:false,depthWrite:false,side:THREE.DoubleSide,
    uniforms:{uIcon:{value:tex},uSel:{value:0},uFull:{value:1},uAlpha:{value:1},uTime:{value:0},uAspect:{value:.74},uOpen:{value:0},uRip:{value:-1},uTilt:{value:0}}});
   const mesh=new THREE.Mesh(geo,mat);mesh.renderOrder=8;mesh.frustumCulled=false;g.add(mesh);iv.root.add(g);const k={g,mesh,mat,cv,tex,key:null,top:new V3(),sel:0,item:null};
   if(S.id){k.item=makeCardItem(S.id);g.add(k.item.root);}drawCard(k,S);iv.socks.push(k);});
  // one energy line per card, out of the belt core to the card (camera-facing ribbons with a pulse running from the belt outward)
  const lg=new THREE.BufferGeometry(),NV=SOCKETS.length*TN*2,idx=[];lg.setAttribute('position',new THREE.BufferAttribute(new Float32Array(NV*3),3));lg.setAttribute('aU',new THREE.BufferAttribute(new Float32Array(NV*3),3));
  for(let c=0;c<SOCKETS.length;c++)for(let q=0;q<TN-1;q++){const a=(c*TN+q)*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}lg.setIndex(idx);
  iv.tether=new THREE.Mesh(lg,new THREE.ShaderMaterial({transparent:true,depthTest:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{uTime:{value:0},uAlpha:{value:1}},
   vertexShader:'attribute vec3 aU;varying vec3 vU;void main(){vU=aU;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
   fragmentShader:'precision highp float;varying vec3 vU;uniform float uTime,uAlpha;void main(){float c=1.-abs(vU.y);float f=fract(vU.x*2.5-uTime*.9);float pulse=smoothstep(.0,.12,f)*smoothstep(.45,.12,f);vec3 col=mix(vec3(.37,.89,.91),vec3(1.),c*c*.7+pulse*.3);float a=pow(c,1.4)*(.55+.45*pulse)*vU.z*uAlpha;gl_FragColor=vec4(col,a);}'}));
  iv.tether.renderOrder=7;iv.tether.frustumCulled=false;iv.root.add(iv.tether);
  // the belt core: a bright disc and two rings on his hip, on the side the sockets open to
  iv.coreGlow=new THREE.Group();const cm=(o)=>new THREE.MeshBasicMaterial({color:0x9ff6ff,transparent:true,opacity:o,depthTest:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false,fog:false});
  for(const [a,b,o] of [[0,.022,.95],[.034,.046,.9],[.06,.064,.45]]){const m=new THREE.Mesh(a?new THREE.RingGeometry(a,b,32):new THREE.CircleGeometry(b,24),cm(o));m.renderOrder=7;m.frustumCulled=false;iv.coreGlow.add(m);}iv.root.add(iv.coreGlow);
  // the projection ring on the ground under the cards (depth tested, so his legs and the scenery stay in front of it)
  iv.ring=new THREE.Group();iv.ring.rotation.x=-Math.PI/2;iv.ringMats=[];
  for(const [a,b,o] of [[.985,1,.85],[.93,.936,.4],[.62,.985,.07],[.6,.606,.3]]){const m=new THREE.MeshBasicMaterial({color:0x5fe3e8,transparent:true,opacity:o,side:THREE.DoubleSide,depthWrite:false,toneMapped:false,fog:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});m.userData.o=o;iv.ringMats.push(m);
   const r=new THREE.Mesh(new THREE.RingGeometry(a,b,96),m);r.renderOrder=6;r.frustumCulled=false;iv.ring.add(r);}
  iv.root.add(iv.ring);
  // two lights that exist only while the belt is open: the cards light his near side, a soft fill separates his costume from the night
  iv.keyL=new THREE.PointLight(0x9fe9ff,0,5.5,2);iv.fillL=new THREE.PointLight(0xdfe8f2,0,6,2);scene.add(iv.keyL);scene.add(iv.fillL);}
 const sockFull=S=>!!S.id&&!/EMPTY|0\/|BROKEN|NOT REGISTERED|LOCATED/.test(invItemState(S.id))&&!(S.id==='grapnel'&&inv.grapnel.state==='deployed');
 const regCount=()=>SOCKETS.filter(X=>sockFull(X)||(X.id==='grapnel'&&inv.grapnel.state==='deployed')).length;
 const invDebug=()=>{try{return /[?&]lodebug=1/.test(location.search)||localStorage.getItem('loInvDebug')==='1';}catch(e){return false;}};
 // v8: a dedicated camera state for the belt. It keeps the heading of the over-the-shoulder camera, moves in close behind him and turns
 // toward the open side, so he fills the left of the frame and the sockets the middle and right. The game's own camera is recomputed every
 // frame and this is blended over it, so closing the belt returns to it. The position goes through the game's camera collision test.
 function invCamera(dt){const b=iv.blend;if(b<.004||!isLoadout()){if(!iv.act)iv.camF=null;iv.camA=null;iv.cam=null;return;}
  const cf=new V3(0,0,-1).applyQuaternion(camera.quaternion);if(!iv.camF){let f=new V3(cf.x,0,cf.z);if(f.lengthSq()<1e-4)f=fwd();iv.camF=f.normalize();}
  const f=iv.camF,r=new V3(-f.z,0,f.x),H=hips();if(!iv.camA)iv.camA=H.clone();iv.camA.lerp(H,Math.min(1,dt*8));const A=iv.camA;
  const want=A.clone().addScaledVector(f,-CAM.back).addScaledVector(r,CAM.right).add(new V3(0,CAM.up,0)),look=A.clone().addScaledVector(f,CAM.lf).addScaledVector(r,CAM.lr).add(new V3(0,CAM.lu,0));let pulled=0;
  try{if(typeof constrainCameraPosition==='function'){const st0=A.clone().add(new V3(0,.5,0)),c=constrainCameraPosition(st0,want.clone(),false);pulled=+c.distanceTo(want).toFixed(2);want.copy(c);}}catch(e){}
  const e=b*b*(3-2*b),q1=new Q4().setFromRotationMatrix(new THREE.Matrix4().lookAt(want,look,UP));
  camera.position.lerp(want,e);camera.quaternion.slerp(q1,e);camera.fov+=(CAM.fov-camera.fov)*e;camera.updateProjectionMatrix();camera.updateMatrixWorld(true);iv.cam={blend:+e.toFixed(3),fov:+camera.fov.toFixed(1),pulled};}
 const hudMin=()=>{try{return /[?&]lohud=min/.test(location.search);}catch(e){return false;}};
 function setHud(on){on=on&&!invDebug();if(iv.hudOn===on)return;iv.hudOn=on;document.body.classList.toggle('loInvOpen',on);document.body.classList.toggle('loInvMin',on&&hudMin());}
 // v9: the sockets stand on an arc in front of him at chest-to-head height; the camera is behind him, centred. Slots are fixed, left to
 // right in belt order; the selected card is larger and a step nearer. A retrieval started here brings the card into reach beside his
 // right shoulder; his hand (tickReach) touches it, goes in and comes out with the item, and only then the belt closes.
 function tickCarousel(dt){
  iv.blend+=((iv.open?1:0)-iv.blend)*Math.min(1,dt*9);if(iv.blend<.004&&!iv.open)iv.blend=0;
  if(iv.open&&!isLoadout()){iv.open=false;iv.seqOn=false;if(iv.act&&iv.act.seq&&!iv.act.contacted)iv.act=null;}
  if(!iv.root)buildCards();invCamera(dt);setHud(iv.open&&isLoadout()&&gameActive);
  if(iv.open&&isLoadout()&&iv.camF){let d=Math.atan2(-iv.camF.x,-iv.camF.z)-s.yaw;d-=Math.round(d/(2*Math.PI))*2*Math.PI;s.yaw+=d*Math.min(1,dt*10);}
  {const A=iv.act;iv.pull=A&&A.seq&&iv.seqOn?(A.t<SEQ.near?'card coming into reach':A.t<SEQ.touch?'reaching':A.t<A.contact?'touching · reaching in':'withdrawing'):null;}
  const A=iv.act,seq=!!(A&&A.seq),rs=A&&A.contact!=null&&A.sock!=null?A.sock:-1,on=(iv.blend>.02||rs>=0)&&isLoadout();iv.root.visible=on;iv.cards=[];iv.body=null;iv.hero=null;if(!on){iv.keyL.intensity=iv.fillL.intensity=0;return;}
  const n=SOCKETS.length,asp=.74,cf=new V3(0,0,-1).applyQuaternion(camera.quaternion),cr=new V3(1,0,0).applyQuaternion(camera.quaternion),tanH=Math.tan(camera.fov*Math.PI/360),H=hips();
  let f=iv.camF?iv.camF.clone():fwd();f.y=0;if(f.lengthSq()<1e-4)f=fwd();f.normalize();iv.side=0;const r=new V3(-f.z,0,f.x),A0=iv.camA||H;
  const feet=s.pos.y-.42,ang=j=>(j-(n-1)/2)*ARC.step,spread=j=>{let v=0;iv.socks.forEach((q,m)=>{if(m!==j)v+=q.sel*Math.sign(j-m);});return v*.085;},slotAt=j=>{const a=ang(j)+spread(j);return A0.clone().addScaledVector(f,ARC.r*Math.cos(a)+ARC.f0).addScaledVector(r,ARC.r*Math.sin(a));};
  const C=A0.clone().addScaledVector(f,ARC.f0);let gy=groundAt(C.x,C.z,feet);if(!isFinite(gy)||Math.abs(gy-feet)>.8)gy=feet;C.y=gy+.04;
  const e=sm(iv.blend),coreP=H.clone().addScaledVector(f,.2);coreP.y+=.05; // the belt front: the lines leave in front of him and his body hides what is behind it
  const pos=iv.tether.geometry.attributes.position;let nLines=0;
  iv.coreGlow.position.copy(coreP);iv.coreGlow.quaternion.copy(camera.quaternion);iv.coreGlow.scale.setScalar((1+.12*Math.sin(clock*6))*(1+.5*(seq?1:0))*Math.max(e,.001));iv.coreGlow.visible=iv.blend>.02;
  iv.ring.position.copy(C);iv.ring.scale.setScalar(ARC.r*Math.max(e,.001));iv.ring.rotation.z=clock*.12;iv.ring.visible=iv.blend>.02;for(const m of iv.ringMats)m.opacity=m.userData.o*e;
  const order=[],dim=seq?1-.62*sm(A.t/.2):1;
  SOCKETS.forEach((S,i)=>{const k=iv.socks[i],selNow=i===inv.sel&&iv.blend>.02;k.sel+=((selNow?1:0)-k.sel)*Math.min(1,dt*14);drawCard(k,S);
   const base=slotAt(i);base.y=H.y+ARC.y+ARC.lift*Math.cos(ang(i));let hW=ARC.h*(1+ARC.sel*k.sel),alpha=e,sc=Math.max(e,.001),open=0,rip=-1,itemA=1,state=selNow?'selected':iv.open?'open':'closing';
   let p=coreP.clone().lerp(base,e);const toCam=camera.position.clone().sub(p);toCam.y=0;toCam.normalize();p.addScaledVector(toCam,ARC.near*k.sel*e);
   if(i===rs&&!seq){const rw=A.contacted?Math.max(0,1-(A.t-A.contact)/.22):Math.min(1,A.t/Math.max(.01,A.contact*.6));p.lerp(reachPoint(),1-e);if(e<.5){hW=.3;alpha=rw;sc=1;}else alpha=Math.max(alpha,rw);k.sel=Math.max(k.sel,rw);state='retrieving';}
   else if(i===rs){const t=A.t,c=A.contact,near=sm(t/SEQ.near),gone=sm((t-c-.14)/.24);p.lerp(reachCard(f,r,H),near);hW+=(SEQ.h-hW)*near;hW*=1-.7*gone;alpha=1-gone;sc=1;k.sel=1;state='retrieving';
    open=sm((t-SEQ.touch)/.1)*(1-sm((t-c-.1)/.2));rip=(t-SEQ.touch)/.4;itemA=A.stow?sm((t-c)/.12):1-sm((t-SEQ.touch)/Math.max(.05,c-SEQ.touch));}
   else alpha*=dim;
   const toHim=H.clone().sub(p);toHim.y=0;if(toHim.lengthSq()>1e-6)toHim.normalize();const nr=toCam.clone().multiplyScalar(.7).addScaledVector(toHim,.3);
   if(i===rs&&seq){nr.copy(toCam).multiplyScalar(.45).addScaledVector(toHim,.55);iv.reachPos=p.clone();iv.reachPos.y-=.03*hW;iv.reachN=nr.clone().normalize();}
   const hs=hW*sc;k.g.position.copy(p);k.g.quaternion.setFromAxisAngle(UP,Math.atan2(nr.x,nr.z));k.mesh.scale.set(hs*asp/CARD_K,hs/CARD_K,hs*asp/CARD_K);k.g.visible=alpha>.01;
   const full=sockFull(S),U=k.mat.uniforms;U.uSel.value=k.sel;U.uFull.value=full?1:0;U.uAlpha.value=alpha;U.uTime.value=clock;U.uAspect.value=asp;U.uOpen.value=open;U.uRip.value=rip;U.uTilt.value=(ITEM_POSE[S.id]||{}).tilt||0;
   const dt9=i===rs&&seq;if(k.mat.depthTest!==dt9)k.mat.depthTest=dt9;
   if(k.item){k.item.root.position.set(0,-.03*hs,.09*hs);k.item.root.scale.setScalar(hs*k.item.root.userData.unit);k.item.spin.rotation.y=Math.sin(clock*.7+i*1.3)*.5+k.sel*.2;for(const m of k.item.mats){m.uniforms.uAlpha.value=alpha*(full||(i===rs&&seq)?1:.5)*itemA;m.uniforms.uLive.value=full||(i===rs&&seq)?1:.15;}}
   const dp=Math.max(.3,p.clone().sub(camera.position).dot(cf));order.push({k,dp,i});
   k.top.copy(p);k.top.y+=hs*.5;const bot=p.clone();bot.y-=hs*.5;const show=(iv.blend>.02||i===rs)&&alpha>.01;
   energyLine(i,coreP,bot,r.clone().multiplyScalar(clamp(p.clone().sub(H).dot(r)*1.4,-1.6,1.6)),show,k.sel,alpha);if(show)nLines++;
   const sp=screen(p),hf=hs/(dp*tanH),hp=hf*innerHeight/2;
   iv.cards.push({slot:S.slot,id:S.id,state,x:Math.round(sp.x),y:Math.round(sp.y),alpha:+alpha.toFixed(2),h:+hf.toFixed(3),w:Math.round(hp*asp),hp:Math.round(hp),ahead:+p.clone().sub(H).dot(f).toFixed(2),side:+p.clone().sub(H).dot(r).toFixed(2),up:+(p.y-H.y).toFixed(2),pos:p.toArray().map(v=>+v.toFixed(2)),open:+open.toFixed(2)});});
  order.sort((a,b)=>b.dp-a.dp).forEach((o,q)=>{o.k.mesh.renderOrder=8+q;if(o.k.item)o.k.item.root.traverse(m=>{if(m.isMesh)m.renderOrder=8.5+q;});});
  pos.needsUpdate=true;iv.tether.geometry.attributes.aU.needsUpdate=true;iv.tether.material.uniforms.uTime.value=clock;iv.tether.material.uniforms.uAlpha.value=Math.max(e,seq?1:0);iv.lines=nLines;iv.tether.visible=iv.blend>.02||seq;
  const sk=iv.socks[seq?rs:inv.sel];iv.keyL.position.copy(sk.g.position).addScaledVector(f,-.3);iv.keyL.position.y+=.1;iv.keyL.intensity=LIGHT.key*e;iv.fillL.position.copy(camera.position).add(new V3(0,.5,0));iv.fillL.intensity=LIGHT.fill*e;
  const bl=screen(H.clone().addScaledVector(cr,-.27)),br=screen(H.clone().addScaledVector(cr,.27)),bt=screen(H.clone().add(new V3(0,.78,0))),bb=screen(H.clone().add(new V3(0,-.95,0)));
  iv.body={x0:Math.round(bl.x),x1:Math.round(br.x),y0:Math.round(bt.y),y1:Math.round(bb.y)};
  const cs=screen(coreP);let mf=null;try{let root=handBone();while(root&&root.parent&&!/Hips$/.test(root.name))root=root.parent;const la=root.getObjectByName('mixamorigLeftArm').getWorldPosition(new V3()),ra=root.getObjectByName('mixamorigRightArm').getWorldPosition(new V3()),m=la.sub(ra).cross(UP);m.y=0;m.normalize();mf=+m.dot(f).toFixed(3);}catch(err){}
  iv.hero={right:+(br.x/innerWidth).toFixed(3),centre:+(((bl.x+br.x)/2)/innerWidth).toFixed(3),headY:+(bt.y/innerHeight).toFixed(3),hipY:+(screen(H).y/innerHeight).toFixed(3),core:{x:Math.round(cs.x),y:Math.round(cs.y),in:cs.in},
   faces:mf,yawFaces:+fwd().dot(f).toFixed(3),camBehind:+H.clone().sub(camera.position).setY(0).normalize().dot(f).toFixed(3),camLooks:+new V3(cf.x,0,cf.z).normalize().dot(f).toFixed(3),headYaw:+(iv.headYaw||0).toFixed(3)};}
 const css6=`#loGear{width:310px!important;bottom:40px!important;font-size:10px}
body.loInvMin #flightVitals,body.loInvMin #actionHint,body.loInvMin #bannerBig,body.loInvMin #bannerSub,body.loInvMin #loLog,body.loInvMin #loBars,body.loInvMin #loGear,body.loInvMin #loForms,body.loInvMin #v02ContextStack,body.loInvMin #v02Toolbar,body.loInvMin #crosshair{display:none!important}
body.loInvOpen #crosshair,body.loInvOpen #bannerBig,body.loInvOpen #bannerSub{display:none!important}
#loBelt{position:fixed;inset:0;pointer-events:none;z-index:41;font:600 12px/1.45 ui-monospace,"SF Mono",Menlo,monospace;color:#d9f6ff;letter-spacing:.06em}#loBelt[hidden]{display:none}
#loBelt .pn{background:linear-gradient(180deg,rgba(6,18,26,.9),rgba(5,13,20,.84));border:1px solid rgba(95,227,232,.55)}
#loBelt .info{position:fixed;right:1.4vw;top:41%;width:17.4vw;min-width:250px;padding:14px 16px;text-align:left;clip-path:polygon(0 0,calc(100% - 14px) 0,100% 14px,100% 100%,14px 100%,0 calc(100% - 14px))}
#loBelt .info b{display:block;color:#fff;font:800 22px/1.1 ui-monospace,"SF Mono",Menlo,monospace;letter-spacing:.06em;text-transform:uppercase}#loBelt .info i{display:block;font-style:normal;color:#5fe3e8;font-size:12px;letter-spacing:.12em;margin:5px 0 12px}
#loBelt .info p{margin:5px 0;font-size:12.5px;line-height:1.45;color:#e4f4f6;letter-spacing:.02em}#loBelt .use{color:#fff}#loBelt .use em{font-style:normal;color:#ffcf7a}
#loBelt .bar{margin-top:14px;display:flex;justify-content:space-between;font-size:11.5px;letter-spacing:.1em;color:#d9f6ff}#loBelt .bar span{color:#fff;font-style:italic}#loBelt .trk{height:7px;margin-top:5px;background:rgba(95,227,232,.16)}#loBelt .trk div{height:100%;background:linear-gradient(90deg,#39c8d2,#7ff3f6)}
#loBelt .reg{position:fixed;left:50%;bottom:6.6%;transform:translateX(-50%);min-width:30vw;padding:8px 22px 9px;text-align:center;white-space:nowrap}#loBelt .reg h4{margin:0 0 3px;font:800 12.5px/1.4 inherit;font-family:inherit;color:#5fe3e8;letter-spacing:.14em}#loBelt .reg div{color:#fff}#loBelt .reg .k{color:#cfeef2;font-weight:500}
#loBelt .chev{position:fixed;transform:translate(-50%,-50%);font-size:38px;font-weight:700;color:#5fe3e8;text-shadow:0 0 8px rgba(95,227,232,.6)}
#loBelt .slow{position:fixed;left:50%;top:8.6%;transform:translateX(-50%);color:#ffcf7a;font-size:12px;font-weight:700;letter-spacing:.16em;white-space:nowrap;text-shadow:0 0 6px rgba(0,0,0,.9)}`;
 const GEAR_INFO={baton:['MELEE','CONTROL','Collapsible baton for strikes, parries and disarms.','CONDITION'],grapnel:['TOOL','ANCHOR LINE','Fires a line to the nearest wall in front. The spool stays where it lands until he reels it in.','CONDITION'],
  medkit:['MEDICAL','FIELD CARE','Treats the worst injury. He is exposed while he works.','DOSES'],cutter:['TOOL','RESCUE','Cutter for freeing trapped people. It has to be registered to the belt before it answers him.','REGISTRATION'],smoke:['CAPSULE','COVER','Thrown at the opponent. The cloud lasts 6 seconds.','CHARGES']};
 function gearFrac(id){const b=st.baton;return id==='baton'?(b.broken?0:b.durability/b.max):id==='medkit'?inv.med/inv.medMax:id==='smoke'?inv.smoke/inv.smokeMax:id==='cutter'?(inv.cutter.state==='registered'?1:Math.min(1,inv.cutter.rescues/2)):id==='grapnel'?1:0;}
 function paintCarousel(){if(!iv.el){const s4=document.createElement('style');s4.textContent=css6;document.head.appendChild(s4);iv.el=document.createElement('div');iv.el.id='loBelt';iv.el.hidden=true;document.body.appendChild(iv.el);}
  const show=iv.open&&isLoadout()&&gameActive;iv.el.hidden=!show;if(!show)return;const S=SOCKETS[inv.sel];iv.el.className=iv.mode==='arc'?'arc':'capsule';
  const use={baton:st.baton.out?'stow it':'draw it',grapnel:inv.grapnel.state==='deployed'?(spoolDist()>3?'walk to the spool to recover it':'reel it in (1.2 s)'):'fire at the nearest wall in front',medkit:'treat the worst injury (2.4 s, exposed)',cutter:inv.cutter.state==='registered'?(inv.cutter.out?'stow it':'draw it'):'not registered · it does not answer him yet',smoke:'throw at the opponent (6 s cloud)'}[S.id]||'nothing here';
  const G=GEAR_INFO[S.id]||['SOCKET','EMPTY','Nothing is registered to this socket.','CONDITION'],fr=Math.round(clamp(gearFrac(S.id),0,1)*100);
  const cs=iv.cards||[],a=cs[0],z=cs[cs.length-1],busy=!!iv.seqOn,nm=(S.card||S.name).toUpperCase();
  const chev=a&&z&&!busy?`<div class="chev" style="left:${a.x-a.w/2-34}px;top:${a.y}px">‹</div><div class="chev" style="left:${z.x+z.w/2+30}px;top:${z.y}px">›</div>`:'';
  const useLine=busy?`<em>Retrieving:</em> ${iv.pull||''}`:`<em>Release:</em> ${use}`;
  const html=`<div class="slow">${iv.mode==='arc'?'COMBAT ARC':'BELT INVENTORY'} · OPPONENT SLOWED, NOT STOPPED</div>${chev}<div class="info pn"><b>${nm}</b><i>${G[0]} // ${G[1]}</i><p>${G[2]}</p><p class="use">${useLine}</p><div class="bar">${G[3]}<span>${S.id?fr+'%':'—'}</span></div><div class="trk"><div style="width:${S.id?fr:0}%"></div></div></div>
<div class="reg pn"><h4>REGISTERED GEAR · ${S.slot} · ${nm}</h4><div>${S.id?invItemState(S.id).toUpperCase():'EMPTY'}</div><div class="use">${useLine}</div><div class="k">${padRecent()?'R STICK / D-PAD select · A use · release D← use · B cancel':'MOUSE / A D / ← → select · click or release X use · RMB cancel'}</div></div>`;
  if(html!==iv.html){iv.html=html;iv.el.innerHTML=html;}}
 // keyboard / mouse for the carousel
 const cardAt=(x,y)=>{let best=-1,bd=1e9;(iv.cards||[]).forEach((c,i)=>{if(c.alpha<.3)return;const d=Math.abs(x-c.x);if(d<=c.w/2&&Math.abs(y-c.y)<=c.hp/2&&d<bd){bd=d;best=i;}});return best;};
 window.addEventListener('mousemove',e=>{if(!iv.open||!isLoadout())return;e.stopImmediatePropagation();if(iv.seqOn)return;if(document.pointerLockElement){iv.mx+=e.movementX||0;if(Math.abs(iv.mx)>45){stepSel(iv.mx>0?1:-1);iv.mx=0;}}else{const i=cardAt(e.clientX,e.clientY);if(i>=0&&i!==inv.sel){inv.sel=i;persistInv();}}},true);
 window.addEventListener('mousedown',e=>{if(!iv.open||!isLoadout())return;e.preventDefault();e.stopImmediatePropagation();if(e.button===2){iv.holdAt=null;closeCarousel(false);log('Belt Inventory · cancelled','gear');}else if(e.button===0){if(!document.pointerLockElement&&!iv.seqOn){const i=cardAt(e.clientX,e.clientY);if(i>=0&&i!==inv.sel){inv.sel=i;persistInv();}}iv.holdAt=null;closeCarousel(true);}},true);
 window.addEventListener('wheel',e=>{if(!iv.open||!isLoadout())return;stepSel(e.deltaY>0?1:-1);},true);

 window.loadoutInterface={tick,poll,ownsPadFire,claims,state:()=>({active:isLoadout(),hp:+st.hp.toFixed(1),mp:+st.mp.toFixed(1),sta:+st.sta.toFixed(1),body:{...st.body},loadout:LOADOUTS[st.loadout].id,
   swap:st.swap?{to:LOADOUTS[st.swap.to].id,t:+st.swap.t.toFixed(2)}:null,wheel:!!st.wheel,form:st.form?{id:st.form.id,clip:st.form.clip,t:+st.form.t.toFixed(2),done:st.form.done,hit:st.form.hit}:null,
   guard:st.guard,analyze:st.analyze,baton:{...st.baton},xp:st.xp,level:st.level,echo:{...st.echo},questOpen:st.questOpen,statusOpen:st.statusHeld||clock<st.statusUntil,
   reliability:Object.fromEntries(Object.keys(FORMS).map(k=>[k,+reliability(FORMS[k]).toFixed(2)])),compromised:[compromised(0),compromised(1)],stats:{...st.stats},assets:assets.status,assetError:assets.error,
   encounter:st.enc?{outcome:st.enc.outcome,clock:+st.enc.clock.toFixed(2),worker:{heard:st.enc.worker.heard,freed:st.enc.worker.freed,progress:+st.enc.worker.progress.toFixed(2),near:!!st.nearWorker},offScript:st.enc.offScript,summary:st.enc.summary,
    construct:{hp:Math.round(st.enc.t.hp),phase:st.enc.t.ai,attack:st.enc.t.aiAttack,clinch:+st.enc.t.clinch.toFixed(2),down:+(st.enc.t.down||0).toFixed(2),seen:{...st.enc.t.seen},jabCounterReady:st.enc.t.jabCounterReady,pos:st.enc.t.group.position.toArray().map(v=>+v.toFixed(2)),dist:+st.enc.t.group.position.distanceTo(s.pos).toFixed(2)},
    ghosts:Object.fromEntries(ATTACK_IDS.map(k=>[k,{visible:st.enc.ghosts[k].group.visible,opacity:+st.enc.ghosts[k].opacity.toFixed(2),p:+st.enc.ghosts[k].p.toFixed(2)}]))}:null,
   scan:{on:scan.on,sat:+scan.sat.toFixed(1),overload:clock<scan.overloadUntil,labels:scan.labels.map(l=>({head:l.head,cls:l.cls,d:+l.d.toFixed(1)}))},
   pursuit:{on:pur.on,tracking:pur.tracking,ledges:pur.ledges.map(l=>l.userData),routes:pur.routes.map(r=>({name:r.name,time:r.time,runner:r.runner,margin:r.margin,climbs:r.climbs,drops:r.drops,blocked:r.blocked,len:r.len,cls:r.cls}))},
   pad:{recent:padRecent(),analyze:P.analyze,guard:P.guard,status:P.status,interact:P.interact},
   ui:{open:ui.open,sel:ui.sel,row:ui.row,col:ui.col,section:SECTIONS[ui.sel].id,visible:!!core&&!core.hidden,text:core&&!core.hidden?core.innerText:''},
   interface:{credits:store.credits,deck:LOADOUTS.map(l=>l.forms.slice()),activeTitle:activeTitle().id,earned:earnedTitles().map(t=>t.id),life:{...store.life},formUses:{...store.formUses},observed:Object.fromEntries(Object.entries(store.observed).map(([k,v])=>[k,v.n])),quests:store.quests.length,anomalies:store.anomalies.length},
   inv:{mode:iv.mode||null,reach:+(iv.reachW||0).toFixed(2),reachDist:iv.reachW>0?iv.reachDist:null,contacted:!!iv.act?.contacted,lastContact:iv.lastContact||null,interrupted:iv.interrupted||0,props:(iv.shown||[]).slice(),cards:(iv.cards||[]).slice(),body:iv.body||null,lines:iv.lines||0,side:iv.side||0,kim:{status:KIM.status,error:KIM.error,frames:KIM.data?KIM.data.frames:0,bones:KIM.fit?KIM.fit.bones:0,w:KIM.w,t:KIM.t},pocket:{on:POCKET.on,wrist:POCKET.wrist,depth:POCKET.depth,rim:!!(POCKET.ring&&POCKET.ring.visible),mats:POCKET.mats.size,local:typeof renderer!=='undefined'&&!!renderer.localClippingEnabled},cam:iv.cam||null,hero:iv.hero||null,hud:!!iv.hudOn,registered:regCount(),sockets:SOCKETS.length,seq:!!iv.seqOn,pull:iv.pull||null,lastPull:iv.lastPull?(({act,...o})=>o)(iv.lastPull):null,tipDist:iv.tipDist??null,headYaw:+(iv.headYaw||0).toFixed(3),headDir:iv.headDir||null,ring:!!iv.ring&&iv.ring.visible&&!!iv.root?.visible,tether:!!iv.tether&&iv.tether.visible&&!!iv.root?.visible,cable:!!iv.cable,simT:+(st.enc?.t?.simT||0).toFixed(3),sel:inv.sel,selected:SOCKETS[inv.sel].id,open:iv.open,blend:+iv.blend.toFixed(2),act:iv.act?iv.act.item:null,smoke:inv.smoke,med:inv.med,grapnel:JSON.parse(JSON.stringify(inv.grapnel)),cutter:{...inv.cutter},clouds:iv.clouds.length,nearCutter:nearFieldCutter(),fieldCutter:iv.fieldCutter?iv.fieldCutter.position.toArray().map(v=>+v.toFixed(2)):null,constructBlinded:!!st.enc?.t?.blinded,camera:camera.position.toArray().map(v=>+v.toFixed(2))},
   condition:store.condition?{...store.condition}:null,outclassedOn:outclassedOn(),witnesses:wit.list.map(w=>({id:w.id,said:w.said?.text||null})),witnessesPresent:witnessesPresent().length,accounts:(store.accounts||[]).slice(0,6),
   log:st.log.slice(-12)}),
  forms:FORMS,loadouts:LOADOUTS,attacks:ATTACKS,
  // test helpers (clearly labelled; gameplay tests drive the keys)
  debug:{hitPlayer:(d,w)=>{hurt(d,w||'test hit');return true;},setBody:(p,v)=>{st.body[p]=v;},forceAttack:a=>{const t=st.enc?.t;if(t){t.ai='ready';startAttack(t,a);}},setHp:v=>{st.hp=v;},stringCable:(a,b)=>{inv.grapnel={state:'deployed',anchor:a,spool:b};buildCable();persistInv();},faceAnchor:()=>{let best=null;for(let a=0;a<360;a+=15){s.yaw=a*Math.PI/180;const h=findAnchor();if(h){const d=h.distanceTo(s.pos);if(!best||d<best.d)best={d,a};}}if(best)s.yaw=best.a*Math.PI/180;return best;},
   resetInventory:()=>{Object.assign(inv,{sel:0,smoke:2,med:4,grapnel:{state:'stowed',anchor:null,spool:null},cutter:{state:'none',rescues:0,out:false}});buildCable();persistInv();},setConstructHp:v=>{if(st.enc?.t)st.enc.t.hp=v;},clearCondition:()=>{store.condition=null;persist4();},
   resetInterface:()=>{for(const k of Object.keys(store))delete store[k];Object.assign(store,{credits:0,deck:null,activeTitle:'hotswap',life:{},formUses:{},observed:{},quests:[],anomalies:[]});LOADOUTS[0].forms=['slip','tempo','cross','feint'];LOADOUTS[1].forms=['clinch','sweep','throw','frame'];LOADOUTS[2].forms=['burst','route','intercept','vaultread'];persist4();},setCredits:n=>{store.credits=n;persist4();},breakBaton:()=>{st.baton.durability=0;st.baton.broken=true;persist();},
   resetProgress:()=>{st.xp=0;st.level=11;st.echo={grab:0};st.baton.durability=12;st.baton.broken=false;persist();}}};
})();
