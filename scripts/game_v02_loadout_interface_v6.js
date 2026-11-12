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
  const bt=st.baton;{const S=SOCKETS[inv.sel],k=padRecent()?'D←':'X';el.loGear.innerHTML=`REGISTERED GEAR · <span class="k">${k}</span> USE · HOLD BELT<br>${S.slot} ${S.name.toUpperCase()} · <span class="${/BROKEN|EMPTY|0\/|NOT REG/.test(S.id?invItemState(S.id):'EMPTY')?'broken':''}">${S.id?invItemState(S.id):'EMPTY'}</span><br>IN HAND · ${[bt.out?'BATON':'',inv.cutter.state==='carried'||inv.cutter.out?'RESCUE CUTTER':''].filter(Boolean).join(', ')||'—'}${inv.grapnel.state==='deployed'?'<br><span class="broken">GRAPNEL DEPLOYED · '+Math.round(spoolDist())+' M</span>':''}`;}
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
  if(iv.open){if(c==='Escape'){iv.holdAt=null;closeCarousel(false);return;}if(['KeyA','ArrowLeft'].includes(c))stepSel(-1);else if(['KeyD','ArrowRight'].includes(c))stepSel(1);e.preventDefault();e.stopImmediatePropagation();return;}
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
  if(!on){if(iv.open)closeCarousel(false);iv.holdAt=null;iv.blend=0;if(iv.root)iv.root.visible=false;tickHandProps();if(iv.el)iv.el.hidden=true;if(wit.root)clearWitnesses();paintBrackets();paintScan();paintCore();paintOutclassed();return;}
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
  if(iv.act){iv.act.t+=dt;if(iv.act.item==='medkit'&&st.stats.hitsTaken>iv.act.hits){log('Treatment interrupted · no dose used','warn');iv.act=null;}else if(iv.act.t>=iv.act.dur){const d=iv.act.done;iv.act=null;d&&d();}}
  if(inv.grapnel.state==='deployed'&&!iv.cable)buildCable();
  if(st.enc&&st.enc!==iv.encRef){iv.encRef=st.enc;placeFieldCutter();}if(!st.enc&&iv.fieldCutter){scene.remove(iv.fieldCutter);iv.fieldCutter=null;iv.encRef=null;}
  tickSwap(dt);tickForm(dt);tickCounter(dt);tickConstruct(dt*carouselSlow());if(st.enc?.t)st.enc.t.simT=(st.enc.t.simT||0)+dt*carouselSlow();tickSmoke(dt);cableTrip(dt);tickAnalyze(dt);tickQuest(dt);tickScan(dt);tickPursuit(dt);track();tickOutclassed(dt);tickHandProps();
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
   if(ed(4))stepSel(-1);if(ed(5))stepSel(1);const x=(gp?.axes||[])[0]||0,sd=Math.abs(x)>.6?Math.sign(x):0;if(sd&&(sd!==P.invDir||clock-(P.invAt||-9)>.28)){P.invAt=clock;stepSel(sd);}P.invDir=sd;
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
  {id:'smoke',name:'Smoke capsule · restock 1',cost:25,kind:'smoke',parts:'Pressed canister, pull ring',route:'Bought, not made: one capsule into C1 (max 2).'},
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
  {id:null,slot:'05',name:'Empty'},{id:'smoke',slot:'C1',name:'Smoke capsules',consumable:true},{id:null,slot:'C2',name:'Empty',consumable:true}];
 const inv=store.inv=Object.assign({sel:0,smoke:2,smokeMax:2,med:4,medMax:4,grapnel:{state:'stowed',anchor:null,spool:null},cutter:{state:'none',rescues:0,out:false}},store.inv||{});
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
 function beginAct(item,dur,clip,done){if(clip)runner()?.perform?.(clip,{root:false,source:'loadout-inventory'});iv.act={item,t:0,dur,done,hits:st.stats.hitsTaken};}
 function retrieve(i){const S=SOCKETS[i];if(!S||!S.id){say('Socket '+(S?.slot||'?')+' · empty · nothing registered');log('Socket '+(S?.slot||'?')+' · empty','gear');return false;}
  if(busyBody()){log(S.name+' · finish the current action first','warn');return false;}
  const id=S.id;
  if(id==='baton'){const h=handsFull('baton');if(h&&!st.baton.out){log('Baton · hands full ('+h+')','warn');return false;}toggleBaton();beginAct('baton',.45,'Attack_Hand_Ready',null);return true;}
  if(id==='cutter'){const c=inv.cutter;
   if(c.state==='carried'){log('Rescue cutter · not registered, it cannot go in the belt · rescues '+c.rescues+'/2','warn');return false;}
   if(c.state!=='registered'){log('Socket 04 · empty · the rescue cutter has not been registered','gear');return false;}
   const h=handsFull('cutter');if(h&&!c.out){log('Rescue cutter · hands full ('+h+')','warn');return false;}
   c.out=!c.out;persistInv();log(c.out?'Rescue cutter retrieved · socket 04':'Rescue cutter stowed · socket 04','gear');beginAct('cutter',.45,'Attack_Hand_Ready',null);return true;}
  if(id==='medkit'){if(inv.med<=0){log('Medical kit empty · the belt cannot refill it (Shop: refill)','warn');return false;}
   log('Medical kit · treating · 2.4 s, exposed','gear');beginAct('medkit',2.4,'Attack_Hand_Ready',()=>{inv.med--;const p=Object.keys(st.body).reduce((a,b)=>st.body[a]<=st.body[b]?a:b);const before=st.body[p];st.body[p]=Math.min(100,st.body[p]+25);st.hp=Math.min(100,st.hp+15);persistInv();
    log('Treated · '+PARTS[p]+' '+Math.round(before)+'% → '+Math.round(st.body[p])+'% · +15 HP · '+inv.med+' doses left','gear');});return true;}
  if(id==='smoke'){if(inv.smoke<=0){log('No smoke capsules left · used capsules are gone (Shop: restock)','warn');return false;}
   beginAct('smoke',.5,'Attack_Hand_1R',()=>{inv.smoke--;persistInv();const t=nearestTarget(14);const at=t?t.group.position.clone():s.pos.clone().addScaledVector(fwd(),6);at.y=groundAt(at.x,at.z,s.pos.y-.42);spawnSmoke(at);log('Smoke capsule thrown · '+inv.smoke+' left','gear');});return true;}
  if(id==='grapnel'){const g=inv.grapnel;
   if(g.state==='deployed'){if(spoolDist()>3){log('Grapnel deployed · cable connected '+Math.round(spoolDist())+' m away · walk to the spool to recover it','warn');return false;}
    beginAct('grapnel',1.2,'Attack_Hand_Ready',()=>{g.state='stowed';g.anchor=g.spool=null;persistInv();buildCable();log('Grapnel recovered · socket 02','gear');});return true;}
   const a=findAnchor();if(!a){log('Grapnel · no anchor point within 22 m in front','warn');return false;}
   beginAct('grapnel',.6,'Attack_Hand_1R',()=>{const sp=s.pos.clone();sp.y=s.pos.y-.4;g.state='deployed';g.anchor=a.toArray().map(v=>+v.toFixed(3));g.spool=sp.toArray().map(v=>+v.toFixed(3));persistInv();buildCable();
    log('Grapnel fired · anchored '+a.distanceTo(sp).toFixed(1)+' m · cable connected · it trips what crosses it low','gear');});return true;}
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
 function tickHandProps(){const show=isLoadout()&&(inv.cutter.state==='carried'||inv.cutter.out);
  if(show&&!iv.cutterProp){const g=new THREE.Group();const body=new THREE.Mesh(new THREE.BoxGeometry(.08,.34,.08),new THREE.MeshStandardMaterial({color:0xb83a26,roughness:.5}));g.add(body);const jaw=new THREE.Mesh(new THREE.BoxGeometry(.12,.12,.04),new THREE.MeshStandardMaterial({color:0x9aa2a8,metalness:.8}));jaw.position.y=.22;g.add(jaw);iv.cutterProp=g;}
  if(!iv.cutterProp)return;const h=show?handBone():null;
  if(h&&iv.cutterProp.parent!==h){h.add(iv.cutterProp);h.updateMatrixWorld(true);const ws=h.getWorldScale(new V3());iv.cutterProp.scale.set(1/ws.x,1/ws.y,1/ws.z);iv.cutterProp.position.set(0,0,0);}
  iv.cutterProp.visible=!!h&&show;}
 // ----- the carousel -----
 function openCarousel(){if(iv.open||!isLoadout()||!gameActive)return;iv.open=true;iv.mx=0;try{for(const k of ['w','a','s','d','shift','space'])if(typeof keys!=='undefined'&&k in keys)keys[k]=false;}catch(e){}st.wheel=null;log('Belt Inventory · sockets open · the construct is slowed, not stopped','gear');}
 function closeCarousel(confirm){if(!iv.open)return;iv.open=false;if(confirm)retrieve(inv.sel);}
 function stepSel(d){inv.sel=(inv.sel+d+SOCKETS.length)%SOCKETS.length;persistInv();}
 function quick(){retrieve(inv.sel);}
 const carouselSlow=()=>iv.open?.5:1;
 function hips(){const h=handBone()?.parent;let hp=null;try{const m=handBone();let r=m;while(r&&r.parent&&!/Hips$/.test(r.name))r=r.parent;hp=r&&/Hips$/.test(r.name)?r.getWorldPosition(new V3()):null;}catch(e){}return hp||s.pos.clone().add(new V3(0,-.05,0));}
 function tickCarousel(dt){
  iv.blend+=((iv.open?1:0)-iv.blend)*Math.min(1,dt*9);cameraToBelt();
  if(!iv.root){iv.root=new THREE.Group();iv.root.name='Loadout belt sockets';scene.add(iv.root);
   SOCKETS.forEach((S,i)=>{const g=new THREE.Group();const r=S.consumable?.055:.075;const ring=new THREE.Mesh(new THREE.RingGeometry(r*.78,r,6),new THREE.MeshBasicMaterial({color:0x5fe3e8,transparent:true,opacity:.9,side:THREE.DoubleSide,depthTest:false,toneMapped:false,fog:false}));ring.renderOrder=7;g.add(ring);
    const core=new THREE.Mesh(new THREE.CircleGeometry(r*.74,6),new THREE.MeshBasicMaterial({color:0x061018,transparent:true,opacity:.75,side:THREE.DoubleSide,depthTest:false,toneMapped:false,fog:false}));core.renderOrder=6;g.add(core);iv.root.add(g);iv.socks.push({g,ring,core});});}
  const on=iv.blend>.02&&isLoadout();iv.root.visible=on;
  if(on){const H=hips(),f=fwd(),right=new V3(-f.z,0,f.x);
   SOCKETS.forEach((S,i)=>{const k=iv.socks[i];const a=(-72+i*24)*Math.PI/180,sp=.35+.35*iv.blend;const p=H.clone().addScaledVector(f,.28+.12*Math.cos(a)).addScaledVector(right,Math.sin(a)*sp*1.25);p.y+=.06-(1-Math.cos(a))*.42*iv.blend;
    k.g.position.copy(p);k.g.lookAt(camera.position);const sel=i===inv.sel;k.g.scale.setScalar((sel?1.45:1)*iv.blend);
    const full=S.id&&!/EMPTY|0\/|BROKEN|NOT REGISTERED|LOCATED/.test(invItemState(S.id))&&!(S.id==='grapnel'&&inv.grapnel.state==='deployed');k.ring.material.color.setHex(sel?0xffffff:full?0x5fe3e8:0x3b5560);k.core.material.opacity=sel?.9:.6;});}
 }
 function cameraToBelt(){if(iv.blend<.01||!isLoadout())return;const H=hips(),f=fwd(),right=new V3(-f.z,0,f.x);
  const want=H.clone().addScaledVector(f,2.0).addScaledVector(right,.6).add(new V3(0,.42,0));const look=H.clone().add(new V3(0,.02,0));
  const q0=camera.quaternion.clone();camera.position.lerp(want,iv.blend);const m=new THREE.Matrix4().lookAt(want,look,UP);const q1=new THREE.Quaternion().setFromRotationMatrix(m);camera.quaternion.copy(q0).slerp(q1,iv.blend);camera.updateMatrixWorld(true);}
 const css6=`#loBelt{position:fixed;inset:0;pointer-events:none;z-index:41;font:600 10px/1.25 ui-monospace,monospace;color:#d9f6ff;text-transform:uppercase}#loBelt[hidden]{display:none}
#loBelt .t{position:fixed;transform:translate(-50%,-130%);background:rgba(5,13,20,.82);border:1px solid rgba(95,227,232,.35);padding:3px 6px;white-space:nowrap}#loBelt .t.sel{border-color:#fff;color:#fff;font-size:11px}#loBelt .t.empty{opacity:.55}#loBelt .t small{display:block;opacity:.8;font-size:9px;text-transform:none}
#loBelt .info{position:fixed;left:50%;bottom:70px;transform:translateX(-50%);background:rgba(5,13,20,.86);border:1px solid #5fe3e8;padding:8px 14px;text-align:center;min-width:300px}#loBelt .info b{color:#5fe3e8;letter-spacing:.12em}#loBelt .info p{margin:3px 0;text-transform:none;font-size:10px}
#loBelt .slow{position:fixed;left:50%;top:70px;transform:translateX(-50%);color:#ffcf7a;font-size:10px;letter-spacing:.14em}`;
 function paintCarousel(){if(!iv.el){const s4=document.createElement('style');s4.textContent=css6;document.head.appendChild(s4);iv.el=document.createElement('div');iv.el.id='loBelt';iv.el.hidden=true;document.body.appendChild(iv.el);}
  const show=iv.open&&isLoadout()&&gameActive;iv.el.hidden=!show;if(!show)return;const S=SOCKETS[inv.sel];
  const tags=SOCKETS.map((X,i)=>{const p=screen(iv.socks[i]?.g.position||s.pos);const stt=X.id?invItemState(X.id):'EMPTY';return `<div class="t ${i===inv.sel?'sel':''} ${/EMPTY/.test(stt)?'empty':''}" style="left:${p.x}px;top:${p.y}px">${X.slot} · ${X.name}<small>${stt}</small></div>`;}).join('');
  const use={baton:st.baton.out?'Release: stow it':'Release: draw it',grapnel:inv.grapnel.state==='deployed'?(spoolDist()>3?'Walk to the spool to recover it':'Release: reel it in (1.2 s)'):'Release: fire at the nearest wall in front',medkit:'Release: treat the worst injury (2.4 s, exposed)',cutter:inv.cutter.state==='registered'?(inv.cutter.out?'Release: stow it':'Release: draw it'):'—',smoke:'Release: throw at the opponent (6 s cloud)'}[S.id]||'Nothing here';
  iv.el.innerHTML=`<div class="slow">BELT INVENTORY · OPPONENT SLOWED, NOT STOPPED</div>${tags}<div class="info"><b>${S.slot} · ${S.name.toUpperCase()}</b><p>${S.id?invItemState(S.id):'Empty socket'}</p><p>${use}</p><p style="opacity:.7">${padRecent()?'STICK / LB RB select · release D← use · B cancel':'MOUSE / A D / ← → select · release X use · RMB cancel'}</p></div>`;}
 // keyboard / mouse for the carousel
 window.addEventListener('mousemove',e=>{if(!iv.open||!isLoadout())return;e.stopImmediatePropagation();iv.mx+=e.movementX||0;if(Math.abs(iv.mx)>45){stepSel(iv.mx>0?1:-1);iv.mx=0;}},true);
 window.addEventListener('mousedown',e=>{if(!iv.open||!isLoadout())return;e.preventDefault();e.stopImmediatePropagation();if(e.button===2){iv.holdAt=null;closeCarousel(false);log('Belt Inventory · cancelled','gear');}else if(e.button===0){iv.holdAt=null;closeCarousel(true);}},true);
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
   inv:{cable:!!iv.cable,simT:+(st.enc?.t?.simT||0).toFixed(3),sel:inv.sel,selected:SOCKETS[inv.sel].id,open:iv.open,blend:+iv.blend.toFixed(2),act:iv.act?iv.act.item:null,smoke:inv.smoke,med:inv.med,grapnel:JSON.parse(JSON.stringify(inv.grapnel)),cutter:{...inv.cutter},clouds:iv.clouds.length,nearCutter:nearFieldCutter(),fieldCutter:iv.fieldCutter?iv.fieldCutter.position.toArray().map(v=>+v.toFixed(2)):null,constructBlinded:!!st.enc?.t?.blinded,camera:camera.position.toArray().map(v=>+v.toFixed(2))},
   condition:store.condition?{...store.condition}:null,outclassedOn:outclassedOn(),witnesses:wit.list.map(w=>({id:w.id,said:w.said?.text||null})),witnessesPresent:witnessesPresent().length,accounts:(store.accounts||[]).slice(0,6),
   log:st.log.slice(-12)}),
  forms:FORMS,loadouts:LOADOUTS,attacks:ATTACKS,
  // test helpers (clearly labelled; gameplay tests drive the keys)
  debug:{setBody:(p,v)=>{st.body[p]=v;},forceAttack:a=>{const t=st.enc?.t;if(t){t.ai='ready';startAttack(t,a);}},setHp:v=>{st.hp=v;},stringCable:(a,b)=>{inv.grapnel={state:'deployed',anchor:a,spool:b};buildCable();persistInv();},faceAnchor:()=>{let best=null;for(let a=0;a<360;a+=15){s.yaw=a*Math.PI/180;const h=findAnchor();if(h){const d=h.distanceTo(s.pos);if(!best||d<best.d)best={d,a};}}if(best)s.yaw=best.a*Math.PI/180;return best;},
   resetInventory:()=>{Object.assign(inv,{sel:0,smoke:2,med:4,grapnel:{state:'stowed',anchor:null,spool:null},cutter:{state:'none',rescues:0,out:false}});buildCable();persistInv();},setConstructHp:v=>{if(st.enc?.t)st.enc.t.hp=v;},clearCondition:()=>{store.condition=null;persist4();},
   resetInterface:()=>{for(const k of Object.keys(store))delete store[k];Object.assign(store,{credits:0,deck:null,activeTitle:'hotswap',life:{},formUses:{},observed:{},quests:[],anomalies:[]});LOADOUTS[0].forms=['slip','tempo','cross','feint'];LOADOUTS[1].forms=['clinch','sweep','throw','frame'];LOADOUTS[2].forms=['burst','route','intercept','vaultread'];persist4();},setCredits:n=>{store.credits=n;persist4();},breakBaton:()=>{st.baton.durability=0;st.baton.broken=true;persist();},
   resetProgress:()=>{st.xp=0;st.level=11;st.echo={grab:0};st.baton.durability=12;st.baton.broken=false;persist();}}};
})();
