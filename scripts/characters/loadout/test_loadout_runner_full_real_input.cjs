/* Loadout with the full Runner Action Animation Pack (872 clips) in SIGHTLINE_SAINT_MERIDIAN_V02_LOADOUT_RUNNER_FULL.html.
   Real input only for gameplay: the Hero-tab menu (choose Loadout, Move List, Perform), the keyboard (W A S D, Shift
   Flow toggle, Space, C, E dash, R tumble, Tab strafe, G weapon, M perform armed, . next armed) and a virtual standard
   pad (RB, X, LB, A, RT, R3, D-pad, View, sticks) read by the game's own polling, as in test_loadout_runner_real_input.cjs.
   Labelled setup (never gameplay): frames are stepped with tickFrame; the player is reset to the open plaza before each
   block (resetPlayer + position); QA slabs are added for the wall and ledge blocks; practice targets are spawned
   with the public practice button and hold their shots; one block sets courier.trauma to 100 to provoke a death and
   then calls resetPlayer to respawn.
   Usage: node scripts/characters/loadout/test_loadout_runner_full_real_input.cjs [--skip-all-clips] */
const{chromium}=require('/opt/homebrew/lib/node_modules/playwright'),fs=require('fs'),path=require('path');
const OUT=process.env.LRF_OUT||'development/characters/loadout/evidence/runner-full',BUILD=process.env.LRF_BUILD||'SIGHTLINE_SAINT_MERIDIAN_V02_LOADOUT_RUNNER_FULL.html';
const SKIP_ALL=process.argv.includes('--skip-all-clips');
const checks=[];const check=(name,pass,info={})=>{checks.push({name,status:pass?'PASS':'FAIL',...info});console.log((pass?'PASS ':'FAIL ')+name,JSON.stringify(info).slice(0,400));};
(async()=>{const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal','--mute-audio']});const r={};try{
 fs.mkdirSync(OUT,{recursive:true});
 const p=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await p.addInitScript(()=>{const up={pressed:false,value:0};window.testPad={id:'test pad',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>up)};navigator.getGamepads=()=>[window.testPad];});
 await p.goto('http://127.0.0.1:8766/'+BUILD+'?capture=backspool');
 await p.waitForFunction(()=>typeof gameReady!=='undefined'&&gameReady&&window.characterState&&!characterState().busy&&roadNetworkState().ready,null,{timeout:300000});
 await p.waitForFunction(()=>verticalWorldLifeState().ready&&v02EastPublicLightingState().ready&&v02RimShadowState().ready,null,{timeout:120000});
 // Choose Loadout in the Hero tab, as a player would.
 await p.click('#v02Tab-hero');await p.selectOption('#characterChoice','loadout');
 await p.waitForFunction(()=>characterState().hero==='loadout'&&!characterState().busy&&window.loadoutRunnerFull?.state().ready,null,{timeout:300000});
 await p.click('#v02Tab-overview');await p.locator('#v02Start').click();await p.evaluate(()=>{window.requestAnimationFrame=()=>0});
 const step=n=>p.evaluate(n=>{for(let i=0;i<n;i++)tickFrame(1/60,false)},n);
 const pad=(buttons=[],axes=[0,0,0,0])=>p.evaluate(({buttons,axes})=>{testPad.buttons=testPad.buttons.map((x,i)=>buttons.includes(i)?{pressed:true,value:1}:{pressed:false,value:0});testPad.axes=axes;},{buttons,axes});
 const padClear=()=>pad([],[0,0,0,0]);
 const tap=async(b,axes=[0,0,0,0])=>{await pad([b],axes);await step(2);await pad([],axes);};
 // One frame with the state the checks read. Also checks the capsule is clear of every collider (no penetration).
 const frame=()=>p.evaluate(()=>{tickFrame(1/60,false);const x=loadoutRunnerFull.state(),c=threadrailGame.coordinator.state();return{anim:currentAnim,ts:currentAction?+currentAction.getEffectiveTimeScale().toFixed(4):null,act:x.action?.clip||null,src:x.action?.source||null,phase:x.action?.phase||null,strafe:x.strafe,overlay:x.overlay?.clip||null,
  pos:s.pos.toArray(),yaw:s.yaw,speed:Math.hypot(s.vel.x,s.vel.z),vy:s.vel.y,ground:s.onGround,owner:c.owner,conflicts:c.conflicts,reason:c.reason,clear:threadrailGame.clear(s.pos,s.pos),weapon:x.weapon,mode:s.mode};});
 const run=async n=>{const rows=[];for(let i=0;i<n;i++)rows.push(await frame());return rows;};
 const releaseKeys=async()=>{for(const k of ['w','a','s','d','Shift','Space','Tab','KeyE','KeyR','KeyC'])await p.keyboard.up(k);};
 const reset=async(x=0,z=12)=>{await releaseKeys();await padClear();await p.evaluate(({x,z})=>{if(threadrailGame.sprinting())threadrailGame.setSprint(false);resetPlayer();clearInput();clearPad();startGame(false);s.pos.set(x,.42,z);s.vel.set(0,0,0);s.onGround=true;setMode(P.GROUND);s.yaw=cam.yaw=cam.targetYaw=0;cam.pitch=cam.targetPitch=-.08;courier.trauma=0;for(const e of enemies)e.blindTimer=999;for(let i=0;i<150;i++)tickFrame(1/60,false);},{x,z});};
 const shot=async n=>{await p.evaluate(()=>renderNight(0));await p.screenshot({path:`${OUT}/${n}.png`});};
 const acts=rows=>[...new Set(rows.map(x=>x.act).filter(Boolean))];
 const anims=rows=>[...new Set(rows.map(x=>x.anim))];
 const runnerRows=rows=>rows.filter(x=>x.act||x.overlay||(x.strafe&&String(x.anim).startsWith('rf-')));
 const rate1=rows=>runnerRows(rows).filter(x=>x.ts!==null&&x.ts!==0).every(x=>Math.abs(x.ts-1)<1e-3);
 // Sound: the capsule is clear of colliders, finite, and no new owner conflict happened during the rows.
 const sound=rows=>rows.every(x=>x.clear&&x.conflicts===rows[0].conflicts&&x.pos.every(Number.isFinite));
 const why=rows=>({unclear:rows.filter(x=>!x.clear).length,conflicts:rows.at(-1).conflicts-rows[0].conflicts,nonFinite:rows.filter(x=>!x.pos.every(Number.isFinite)).length,notRate1:runnerRows(rows).filter(x=>x.ts!==null&&x.ts!==0&&Math.abs(x.ts-1)>=1e-3).map(x=>x.anim+':'+x.ts).slice(0,4)});
 const dist=(a,b)=>Math.hypot(a.pos[0]-b.pos[0],a.pos[2]-b.pos[2]);

 // 0. Catalog: every clip is in the pack index and decodes into a finite clip of the indexed length.
 r.catalog=await p.evaluate(()=>{const d=loadoutRunnerFull.catalog();return{counts:d.counts,clips:Object.keys(d.clips).length,files:d.files,schema:d.schema,pack:d.pack};});
 r.decode=await p.evaluate(()=>{const d=loadoutRunnerFull.catalog(),bad=[];let frames=0;for(const n of Object.keys(d.clips)){try{const c=loadoutRunnerFull.decode(n);const e=d.clips[n];if(Math.abs(c.duration-(e.poseOf?d.clips[e.poseOf].duration:e.duration))>1e-3)bad.push(n+':duration');for(const t of c.tracks)for(const v of t.values)if(!Number.isFinite(v)){bad.push(n+':nan');break;}frames+=c.tracks[0].times.length;}catch(err){bad.push(n+':'+err.message);}}return{bad,frames};});
 check('catalog: 872 clips (484 in-place, 388 root) converted and decodable',r.catalog.clips===872&&r.catalog.counts.inPlace===484&&r.catalog.counts.root===388&&r.decode.bad.length===0,{counts:r.catalog.counts,bad:r.decode.bad.slice(0,5),frames:r.decode.frames});

 // 1. Pace: run, light stick walk, Flow sprint; locomotion loops at rate 1 and the Runner loops' own speeds.
 await reset();await p.keyboard.down('w');const runRows=await run(150);await p.keyboard.up('w');await run(80);
 const steady=rows=>rows.slice(-40);r.run={anims:anims(runRows),speed:+(steady(runRows).reduce((a,x)=>a+x.speed,0)/40).toFixed(3),ts:steady(runRows).map(x=>x.ts)};
 await reset();await pad([],[0,-.35,0,0]);const walkRows=await run(120);await padClear();await run(60);r.walk={anims:anims(walkRows),speed:+(steady(walkRows).reduce((a,x)=>a+x.speed,0)/40).toFixed(3),ts:steady(walkRows).at(-1).ts};
 await reset();await p.keyboard.press('Shift');await p.keyboard.down('w');const sprintRows=await run(150);await shot('sprint');await p.keyboard.up('w');await p.keyboard.press('Shift');await run(60);
 r.sprint={anims:anims(sprintRows),speed:+(steady(sprintRows).reduce((a,x)=>a+x.speed,0)/40).toFixed(3),ts:steady(sprintRows).at(-1).ts};
 const sp=await p.evaluate(()=>{const d=loadoutRunnerFull.catalog().clips;return{walk:d.Mvm_Walk_Root.root.speed,dash:d.Mvm_Dash_Root.root.speed,boost:d.Mvm_Boost_Root.root.speed};});
 check('pace: run is Mvm_Dash at its own speed, rate 1',steady(runRows).every(x=>x.anim==='rf-Mvm_Dash'&&Math.abs(x.ts-1)<.02)&&Math.abs(r.run.speed-sp.dash)<.15,{speed:r.run.speed,expected:sp.dash,anims:r.run.anims});
 check('pace: light stick is Mvm_Walk at its own speed, rate 1',steady(walkRows).every(x=>x.anim==='rf-Mvm_Walk'&&Math.abs(x.ts-1)<.02)&&Math.abs(r.walk.speed-sp.walk)<.15,{speed:r.walk.speed,expected:sp.walk,anims:r.walk.anims});
 check('pace: Flow sprint is Mvm_Boost at its own speed, rate 1',steady(sprintRows).every(x=>x.anim==='rf-Mvm_Boost'&&Math.abs(x.ts-1)<.02)&&Math.abs(r.sprint.speed-sp.boost)<.2,{speed:r.sprint.speed,expected:sp.boost,anims:r.sprint.anims});

 // 2. Automatic transitions: start, stop, idle turn, turning start, 180 turn, 90-degree arc.
 await reset();await p.keyboard.down('w');const startRows=await run(50);await p.keyboard.up('w');
 await reset();await p.keyboard.down('w');await run(150);await p.keyboard.up('w');const stopRows=await run(90);
 check('auto start: Mvm_Jog_Start_Fwd with root motion',acts(startRows).includes('Mvm_Jog_Start_Fwd_Root')&&rate1(startRows)&&sound(startRows),{acts:acts(startRows)});
 check('auto stop: a Dash end clip brings him to rest',acts(stopRows).some(a=>/^Mvm_DashEnd_[LR]_Root$/.test(a))&&stopRows.at(-1).speed<.6&&rate1(stopRows)&&sound(stopRows),{acts:acts(stopRows),endSpeed:stopRows.at(-1).speed});
 await reset();await pad([],[.35,0,0,0]);const idleTurn=await run(90);await padClear();
 check('auto idle turn: light stick to the side turns him in place',acts(idleTurn).some(a=>/^Mvm_Idle_[ABC]_TurnR_90_Root$/.test(a))&&dist(idleTurn[0],idleTurn.at(-1))<1&&rate1(idleTurn),{acts:acts(idleTurn),moved:dist(idleTurn[0],idleTurn.at(-1))});
 await reset();await p.keyboard.down('s');const turnStart=await run(60);await p.keyboard.up('s');
 check('auto turning start: stick behind plays a 180 start',acts(turnStart).some(a=>/Start_[LR]180_Root$/.test(a))&&rate1(turnStart),{acts:acts(turnStart)});
 await reset();await p.keyboard.down('w');await run(150);await p.keyboard.up('w');await p.keyboard.down('s');const rev=await run(80);await p.keyboard.up('s');await run(30);
 check('auto 180 turn while running (Dash pace)',acts(rev).some(a=>/^Mvm_Dash_Turn[LR]_180_(Left|Right)_Root$/.test(a))&&rate1(rev)&&sound(rev),{acts:acts(rev)});
 await reset();await p.keyboard.down('w');await run(150);await p.keyboard.down('d');await p.keyboard.up('w');const arc=await run(60);await p.keyboard.up('d');await run(30);
 check('auto 90-degree arc while running',acts(arc).some(a=>/^Mvm_Dash_Arc_90_Right_Root$/.test(a))&&rate1(arc)&&sound(arc),{acts:acts(arc)});

 // 3. Dash family (RB / E).
 await reset();await p.keyboard.press('KeyE');const dashBack=await run(60);
 const eBack=await p.evaluate(()=>loadoutRunnerFull.catalog().clips.Esc_BoostDash_Back_Root.root.distance);
 check('E dash, no stick: Esc_BoostDash_Back with its root travel',acts(dashBack).includes('Esc_BoostDash_Back_Root')&&Math.abs(dist(dashBack[0],dashBack.at(-1))-eBack)<.35&&dashBack.some(x=>x.owner==='runner')&&rate1(dashBack)&&sound(dashBack),{moved:dist(dashBack[0],dashBack.at(-1)),expected:eBack});
 const dirs=[['Right',[1,0]],['Front_L45',[-.7,-.7]],['Left',[-1,0]],['Back_R45',[.7,.7]]],dashDirs={};
 for(const [name,[x,y]] of dirs){await reset();await tap(5,[x,y,0,0]);const rows=await run(50);await padClear();dashDirs[name]=acts(rows);}
 check('RB dash follows the stick in 8 directions',Object.entries(dashDirs).every(([n,a])=>a.includes('Esc_BoostDash_'+n+'_Root')),{dashDirs});
 await reset();await pad([5]);await run(30);await pad([]);const charge=await run(60);
 check('RB hold then release: power charge dash',acts(charge).includes('Mvm_PowerChargeDash_Front_Root')&&rate1(charge)&&sound(charge),{acts:acts(charge)});
 await reset();await p.keyboard.press('Shift');await p.keyboard.down('w');await run(60);await p.keyboard.press('KeyE');const pdash=await run(40);await p.keyboard.up('w');await p.keyboard.press('Shift');await run(30);
 check('E in Flow sprint: power dash',acts(pdash).includes('Mvm_PowerDash_Front_Root')&&rate1(pdash),{acts:acts(pdash)});
 await reset();await p.keyboard.press('Space');await run(12);await p.keyboard.press('KeyE');const airDash=await run(70);
 check('E in the air: 8-way air dash',acts(airDash).some(a=>/^Esc_BoostDash_Air_/.test(a))&&rate1(airDash)&&sound(airDash),{acts:acts(airDash)});
 await reset();await p.keyboard.down('Space');await run(12);await p.keyboard.press('KeyE');const upDash=await run(80);await p.keyboard.up('Space');await run(80);
 const upPeak=Math.max(...upDash.map(x=>x.pos[1]))-.42;
 check('E in the air with Jump held: upward boost dash lifts the capsule',acts(upDash).some(a=>/^Esc_BoostDash_Up(_Root)?$/.test(a))&&upPeak>2&&sound(upDash),{acts:acts(upDash),peak:+upPeak.toFixed(2)});

 // 4. Tumbles (X / R).
 await reset();await tap(2);const tumble=await run(110);
 check('X tumble: front handspring start and end (tap)',acts(tumble).includes('Tum_F_HandSpring_Start_Root')&&acts(tumble).includes('Tum_F_HandSpring_End_Root')&&!acts(tumble).includes('Tum_F_HandSpring_Loop_Root')&&rate1(tumble)&&sound(tumble),{acts:acts(tumble)});
 await reset();await pad([2]);const tumbleHold=await run(130);await pad([]);tumbleHold.push(...await run(80));
 check('X held: handspring keeps springing (loop) then ends',acts(tumbleHold).includes('Tum_F_HandSpring_Loop_Root')&&acts(tumbleHold).includes('Tum_F_HandSpring_End_Root')&&sound(tumbleHold),{acts:acts(tumbleHold)});
 await reset();await p.keyboard.down('s');await p.keyboard.press('KeyR');const backSpring=await run(100);await p.keyboard.up('s');
 check('R with stick back: back handspring',acts(backSpring).some(a=>/^Tum_B_HandSpring/.test(a)),{acts:acts(backSpring)});
 await reset();await p.keyboard.press('Space');await run(10);await p.keyboard.press('KeyR');const airRoll=await run(70);
 check('R in the air: front air roll over the physics jump',airRoll.some(x=>/^Jmp_FrontAir_Roll_(Start|Loop|End)$/.test(x.overlay||''))&&sound(airRoll),{overlays:[...new Set(airRoll.map(x=>x.overlay).filter(Boolean))]});

 // 5. Strafe (LB / Tab): 8-way loops, starts, stops, tiers.
 await reset();await p.keyboard.down('Tab');const sdirs={};
 for(const [k,label] of [['d','Front_R'],['a','Front_L'],['s','Back'],['w','Fwd']]){await p.keyboard.down(k);const rows=await run(70);await p.keyboard.up(k);rows.push(...await run(80));sdirs[label]={loops:[...new Set(rows.filter(x=>x.strafe?.loop).map(x=>x.strafe.loop))],acts:acts(rows),yawDrift:Math.max(...rows.map(x=>Math.abs(x.yaw)))};}
 await shot('strafe');await p.keyboard.up('Tab');
 check('Tab strafe: right, left, back and forward loops, facing the camera',sdirs.Front_R.loops.includes('Mvm_Jog_Front_R')&&sdirs.Front_L.loops.includes('Mvm_Jog_Front_L')&&sdirs.Back.loops.some(l=>/Mvm_Jog_Back/.test(l))&&sdirs.Fwd.loops.includes('Mvm_Jog')&&Object.values(sdirs).every(x=>x.yawDrift<.05),{sdirs});
 check('strafe starts and stops by direction',sdirs.Front_R.acts.includes('Mvm_Jog_Front_R_Start_Root')&&sdirs.Front_R.acts.includes('Mvm_JogStop_Front_R_Root')&&sdirs.Back.acts.some(a=>/JogStop_Back/.test(a)),{right:sdirs.Front_R.acts,back:sdirs.Back.acts});
 await reset();await pad([4],[.3,0,0,0]);const swalk=await run(80);await pad([4,5],[1,0,0,0]);const scharge=await run(60);await pad([4],[0,0,0,0]);await run(60);await padClear();
 check('LB strafe tiers: light stick walk loop, RB held charge-dash loop',swalk.some(x=>x.strafe?.loop==='Mvm_Walk_Front_R')&&scharge.some(x=>x.strafe?.loop==='Mvm_ChargeDash_Front_R'),{walk:[...new Set(swalk.map(x=>x.strafe?.loop).filter(Boolean))],charge:[...new Set(scharge.map(x=>x.strafe?.loop).filter(Boolean))]});
 await reset();await p.keyboard.press('Shift');await pad([4],[0,-1,0,0]);const sdash=await run(120);await padClear();await p.keyboard.press('Shift');await run(60);
 const loopsSD=[...new Set(sdash.map(x=>x.strafe?.loop).filter(Boolean))];
 check('LB strafe in Flow: dash loop then boost loop at their own speeds',loopsSD.includes('Mvm_Dash')&&loopsSD.includes('Mvm_Boost')&&rate1(sdash)&&sound(sdash),{loops:loopsSD,peak:Math.max(...sdash.map(x=>x.speed))});

 // 6. Strafe evades (C / D-pad down) and strafe jumps (Space / A).
 const evades={};
 for(const [label,keys,moveFirst] of [['stand-right',['d'],false],['stand-back',['s'],false],['move-right',['d'],true],['move-fwd',['w'],true]]){await reset();await p.keyboard.down('Tab');for(const k of keys)await p.keyboard.down(k);if(moveFirst)await run(60);await p.keyboard.press('KeyC');const rows=await run(80);for(const k of keys)await p.keyboard.up(k);await p.keyboard.up('Tab');await run(20);evades[label]=acts(rows);}
 check('strafe evades: side-step, stand roll, dodge, roll',evades['stand-right'].some(a=>/^Esc_Stand(Dodge|Move)_Right_Root$/.test(a))&&evades['stand-back'].includes('Esc_StandRoll_Back_Root')&&evades['move-right'].some(a=>/^Esc_(Dodge|Move)_Right/.test(a))&&evades['move-fwd'].includes('Esc_Roll_Front_Root'),{evades});
 await reset();await p.keyboard.press('Shift');await p.keyboard.down('Tab');await p.keyboard.down('w');await run(90);await p.keyboard.down('KeyC');const slide=await run(70);await p.keyboard.up('KeyC');slide.push(...await run(180));await p.keyboard.up('w');await p.keyboard.up('Tab');await p.keyboard.press('Shift');
 check('strafe evade in Flow at speed: slide start, keep, end',acts(slide).includes('Esc_Slide_Start_Root')&&acts(slide).some(a=>/^Esc_Slide_Keep_/.test(a))&&acts(slide).includes('Esc_Slide_End_Root')&&sound(slide),{acts:acts(slide)});
 await reset();await p.keyboard.down('Tab');await p.keyboard.down('d');await run(40);await p.keyboard.press('Space');const sjump=await run(90);await p.keyboard.up('d');await p.keyboard.up('Tab');
 const sjo=[...new Set(sjump.map(x=>x.overlay).filter(Boolean))];
 check('strafe jump to the side: Runner side jump over the physics jump',sjo.some(o=>/^Jmp_Move_Right/.test(o))&&sjump.some(x=>!x.ground)&&sound(sjump),{overlays:sjo});

 // 7. Movement ownership against geometry: a dash into a QA wall stops at the wall; a dash off a QA ledge hands
 //    him to physics. Labelled setup: two QA slabs, as in test_friendly_wall_contacts.cjs.
 await p.evaluate(()=>{const add=(id,w,h,d,x,y,z)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color:0x142d39,roughness:.75}));m.position.set(x,y,z);scene.add(m);const owner={id,mesh:m,box:new THREE.Box3().setFromObject(m),type:'wall-qa',damageCount:0};propColliders.push(owner);cameraObstacles.push(m);walkables.push(m);return owner;};
  window.lrfWall=add('lrf-wall-qa',10,6,1,40,3.4,7);window.lrfLedge=add('lrf-ledge-qa',6,1.6,6,-40,.8,12);});
 await reset(40,10);await p.keyboard.down('w');await step(3);await p.keyboard.up('w');await step(1);await p.keyboard.press('KeyE');await p.keyboard.down('w');const wallDash=await run(60);await p.keyboard.up('w');await run(30);
 const wallFace=await p.evaluate(()=>lrfWall.box.max.z+.55);
 check('dash into a wall: blocked at the wall, never through it',acts(wallDash).some(a=>/Esc_BoostDash_Front|Mvm_PowerDash|Esc_BoostDash/.test(a))&&wallDash.every(x=>x.pos[2]>=wallFace-1e-3)&&sound(wallDash),{minZ:Math.min(...wallDash.map(x=>x.pos[2])),wallFace});
 await p.evaluate(()=>{resetPlayer();startGame(false);s.pos.set(-40,2.02,13.2);s.vel.set(0,0,0);s.onGround=true;setMode(P.GROUND);s.yaw=cam.yaw=cam.targetYaw=Math.PI;for(let i=0;i<150;i++)tickFrame(1/60,false);});
 await p.keyboard.press('KeyE');const ledge=await run(120);
 const st7=await p.evaluate(()=>loadoutRunnerFull.state());
 check('dash off a ledge: handed to physics, falls and lands',ledge.some(x=>!x.ground)&&ledge.at(-1).ground&&ledge.at(-1).pos[1]<1&&sound(ledge),{ledgeHandoffs:st7.ledgeHandoffs,endY:ledge.at(-1).pos[1]});
 check('contact correction never above 12 cm',st7.maxCorrection<=.12+1e-9,{maxCorrection:st7.maxCorrection,corrections:st7.corrections});

 // 7b. Wall runs with the Runner wall roles (transitions on): the clip's side follows the wall, chosen once.
 //     Labelled setup as in test_loadout_runner_real_input.cjs / test_friendly_wall_contacts.cjs: a QA wall slab and its
 //     respawn placement next to it.
 await p.evaluate(()=>{const m=new THREE.Mesh(new THREE.BoxGeometry(16,8,3),new THREE.MeshStandardMaterial({color:0x142d39,roughness:.75}));m.position.set(30,4.4,-3);scene.add(m);const owner={id:'wall-qa',mesh:m,box:new THREE.Box3().setFromObject(m),type:'wall-qa',damageCount:0};propColliders.push(owner);cameraObstacles.push(m);walkables.push(m);});
 const wallSetup=async(x,y,z)=>{await releaseKeys();await padClear();await p.evaluate(({x,y,z})=>{clearInput();resetMechanicInput();threadrailGame.lifecycle('RESPAWN');backspoolCombat.reset('WALL QA');backspoolAdvanced.reset('RESPAWN');backspoolFlow.reset('RESPAWN');backspoolHop.reset('RESPAWN');backspoolTraversal.reset('RESPAWN');backspoolPowers.clear();s.pos.set(x,y,z);s.vel.set(0,0,0);s.onGround=y<.9;setMode(s.onGround?P.GROUND:P.AIR);s.yaw=cam.yaw=cam.targetYaw=0;cam.pitch=cam.targetPitch=-.1;courier.trauma=0;for(const e of enemies)e.blindTimer=999;startGame(false);for(let i=0;i<5;i++)tickFrame(1/60,false);},{x,y,z});};
 const walls={};
 for(const [x,key,label] of [[27,'d','right'],[33,'a','left']]){await wallSetup(x,.42,-.65);await p.keyboard.press('Shift');await p.keyboard.down(key);const rows=[];const lean=[];for(let i=0;i<70;i++){rows.push(await frame());lean.push(await p.evaluate(()=>{if(!/Wall_[LR](Dash|Boost)_Loop/.test(currentAnim))return null;model.updateMatrixWorld(true);const h=model.getObjectByName('mixamorigHead').getWorldPosition(new THREE.Vector3()),hp=model.getObjectByName('mixamorigHips').getWorldPosition(new THREE.Vector3()),r={x:Math.cos(s.yaw),z:-Math.sin(s.yaw)},n=backspoolAdvancedState().wallNormal||{x:0,z:1};return{anim:currentAnim,headRight:+((h.x-hp.x)*r.x+(h.z-hp.z)*r.z).toFixed(3),wallRight:+(-(n.x*r.x+n.z*r.z)).toFixed(3),yaw:+s.yaw.toFixed(2)};}));if(i===40)await shot('wallrun-'+label);}await p.keyboard.up(key);await p.keyboard.press('Shift');await run(30);walls[label]={lean:lean.filter(Boolean),anims:[...new Set(rows.map(x=>x.anim).filter(a=>/Wall/.test(a)))],sound:sound(rows)};}
 // The clip's side must be the side the wall is on (measured from the wall normal), and the loop must lean his head
 // away from the wall, on every sampled frame of each run.
 const wallOk=l=>l.lean.length>0&&l.lean.every(x=>x.anim.includes('Wall_'+(x.wallRight<0?'L':'R'))&&Math.sign(x.headRight)===-Math.sign(x.wallRight))&&new Set(l.lean.map(x=>x.anim)).size===1;
 check('wall runs: Runner wall loop on the wall\'s side, leaning away from the wall, both directions',wallOk(walls.right)&&wallOk(walls.left)&&walls.right.sound&&walls.left.sound,{walls});

 // 8. Weapon mode (G): staff shown, dash uses the weapon dash, RT chain uses weapon strikes and still connects.
 await reset();await p.keyboard.press('KeyG');await step(2);const wst=await p.evaluate(()=>({on:loadoutRunnerFull.state().weapon,staff:!!model.getObjectByName('LoadoutStaff')?.visible,windows:loadoutRunnerFull.state().weaponWindows}));
 await p.keyboard.press('KeyE');const wdash=await run(60);await shot('weapon');
 check('G weapon mode: staff in hand, E is the weapon dash',wst.on&&wst.staff&&acts(wdash).some(a=>/Mvm_Wp_ChargeDash/.test(a)),{acts:acts(wdash),windows:Object.keys(wst.windows).length});
 await reset();
 if(!await p.locator('#combatPractice').isVisible()){await p.click('#v02Tools');await p.click('#v02Tab-practice');}
 await p.click('#combatPractice');await step(2);if(!await p.evaluate(()=>gameActive)){await p.click('#start');await step(2);}
 await p.evaluate(()=>backspoolCombat.practice.forEach(t=>t.shot=999));
 await tap(11);await step(90);
 const approach=async()=>{await p.keyboard.down('w');for(let i=0;i<300;i++){const d=await p.evaluate(()=>{tickFrame(1/60,false);const x=backspoolCombat.state(),t=backspoolCombat.practice.find(q=>q.id===x.target);return t?Math.hypot(t.group.position.x-s.pos.x,t.group.position.z-s.pos.z):0});if(d<1.3)break;}await p.keyboard.up('w');await step(4);};
 await approach();const strikes=[];const hits0=await p.evaluate(()=>backspoolCombat.state().hits);
 for(let i=0;i<8;i++){await tap(7);for(let k=0;k<26;k++){const f=await p.evaluate(()=>{tickFrame(1/60,false);return{anim:currentAnim,move:backspoolCombat.state().action?.id??null}});if(f.move)strikes.push(f);}}
 await step(60);const hits1=await p.evaluate(()=>backspoolCombat.state().hits);
 const strikeClips=[...new Set(strikes.map(x=>x.anim))];
 const windows=wst.windows;const weaponIds=Object.keys(windows);
 check('weapon mode RT chain: weapon clips on the combat moves, hits connect',strikeClips.some(a=>weaponIds.includes(a))&&hits1-hits0>=6,{strikeClips:strikeClips.slice(0,8),hits:hits1-hits0,moves:[...new Set(strikes.map(x=>x.move))]});
 await p.keyboard.press('KeyG');await step(2);const off=await p.evaluate(()=>({on:loadoutRunnerFull.state().weapon,staff:!!model.getObjectByName('LoadoutStaff')?.visible}));
 check('G again: weapon off, staff hidden',!off.on&&!off.staff,off);

 // 9. Death and stand-up. Labelled setup: courier.trauma is set to 100, then resetPlayer respawns him.
 await reset();await p.keyboard.down('w');await run(90);await p.evaluate(()=>{courier.trauma=100;});const death=await run(90);await p.keyboard.up('w');
 await p.evaluate(()=>{courier.trauma=0;resetPlayer();startGame(false);});const up=await run(120);
 check('death while running plays a Runner death; respawn stands him up',acts(death).some(a=>/^Dam_(StandDie|TurnDie)/.test(a))&&acts(up).includes('Dam_StandUp')&&sound(death),{death:acts(death),up:acts(up)});

 // 10. Move List: Hero tab, filter, select a clip, Perform; then M and . in play.
 await reset();await p.keyboard.press('Escape');await step(2);await p.click('#v02Tab-hero');
 await p.fill('#lrfFilter','Tum_B_HandSpring_4Turn_All');await p.selectOption('#lrfList','Tum_B_HandSpring_4Turn_All_Root');await p.click('#lrfPerform');
 const ml=await run(150);
 check('Move List: Perform plays the chosen clip in play',acts(ml).includes('Tum_B_HandSpring_4Turn_All_Root')&&rate1(ml)&&sound(ml),{acts:acts(ml),...why(ml)});

 // 11. Every clip, through the Move List keys: '.' arms the next clip, M performs it. Reset (labelled) every clip.
 if(!SKIP_ALL){
  await p.keyboard.press('Escape');await step(2);await p.click('#v02Tab-hero');await p.fill('#lrfFilter','');await p.selectOption('#lrfFamily','');await p.locator('#lrfFilter').dispatchEvent('input');
  const all=await p.evaluate(()=>{const d=loadoutRunnerFull.catalog();return Object.keys(d.clips).sort();});
  await p.click('#v02Tab-overview');await p.locator('#v02Start').click();await step(2);
  const rows=[];
  for(let i=0;i<all.length;i++){
   await p.evaluate(()=>{for(let i=0;i<200&&loadoutRunnerFull.state().action;i++)tickFrame(1/60,false);clearInput();s.pos.set(0,.42,12);s.vel.set(0,0,0);s.onGround=true;setMode(P.GROUND);s.yaw=cam.yaw=0;courier.trauma=0;for(let i=0;i<3;i++)tickFrame(1/60,false);});
   const armed=await p.evaluate(()=>loadoutRunnerFull.state().armed);
   await p.keyboard.press('KeyM');
   const res=await p.evaluate(()=>{const st0=s.pos.clone(),fr=[];let maxN=900,clipSeen=null,ts=[],ok=true,peak=0,conf0=threadrailGame.coordinator.state().conflicts,began=false;
    for(let i=0;i<maxN;i++){tickFrame(1/60,false);const x=loadoutRunnerFull.state();if(x.action){began=true;clipSeen=clipSeen||x.action.clip;if(currentAction)ts.push(currentAction.getEffectiveTimeScale());}if(!threadrailGame.clear(s.pos,s.pos)||!Number.isFinite(s.pos.x+s.pos.y+s.pos.z))ok=false;peak=Math.max(peak,s.pos.y-.42);if(began&&!x.action)break;}
    return{clip:clipSeen,frames:fr.length,moved:+Math.hypot(s.pos.x-st0.x,s.pos.z-st0.z).toFixed(3),peak:+peak.toFixed(3),rate1:ts.every(v=>Math.abs(v-1)<1e-3),ok,conflicts:threadrailGame.coordinator.state().conflicts-conf0};});
   rows.push({armed,...res});
   await p.keyboard.press('Period');
   if(i%100===0)console.log('clip',i,armed,JSON.stringify(res));
  }
  const d=await p.evaluate(()=>loadoutRunnerFull.catalog().clips);
  const travelOf=n=>{const e=d[n];return e.root?.travel?Math.hypot(e.root.travel.at(-4),e.root.travel.at(-2)):0;};
  const performed=rows.filter(x=>x.clip),distOk=rows.filter(x=>x.clip&&d[x.clip]?.root&&d[x.clip].kind==='root').map(x=>({n:x.clip,moved:x.moved,expected:travelOf(x.clip)}));
  const far=distOk.filter(x=>x.expected>.3&&Math.abs(x.moved-x.expected)>Math.max(.35,x.expected*.15));
  r.allClips={total:all.length,performed:performed.length,armedCovered:new Set(rows.map(x=>x.armed)).size,notPerformed:rows.filter(x=>!x.clip).map(x=>x.armed),notRate1:rows.filter(x=>x.clip&&!x.rate1).map(x=>x.clip),unsound:rows.filter(x=>!x.ok||x.conflicts).map(x=>x.clip),travelMismatch:far};
  fs.writeFileSync(`${OUT}/all-clips.json`,JSON.stringify(rows,null,0));
  check('every one of the 872 clips performs through the Move List (M / .)',r.allClips.performed===872&&r.allClips.armedCovered===872,{performed:r.allClips.performed,notPerformed:r.allClips.notPerformed.slice(0,10)});
  check('every performed clip plays at rate 1 (the pack video speed)',r.allClips.notRate1.length===0,{notRate1:r.allClips.notRate1.slice(0,10)});
  check('every performed clip keeps the capsule clear, finite and conflict-free',r.allClips.unsound.length===0,{unsound:r.allClips.unsound.slice(0,10)});
  check('root-motion clips travel their own distance in the open plaza (within 15% / 0.35 m)',far.length===0,{mismatches:far.length,examples:far.slice(0,8)});
 }

 // 12. Control: Backspool, switched back in the Hero tab, has no Runner-full layer active.
 await p.keyboard.press('Escape');await step(2);await p.click('#v02Tab-hero');await p.selectOption('#characterChoice','backspool');
 await p.waitForFunction(()=>characterState().hero==='backspool'&&!characterState().busy,null,{timeout:300000});
 await p.click('#v02Tab-overview');await p.locator('#v02Start').click();await step(2);
 await reset();await p.keyboard.down('w');const bs=await run(90);await p.keyboard.press('KeyE');bs.push(...await run(40));await p.keyboard.up('w');
 check('Backspool control: no Runner-full actions, his own clips, E is still his Drive',bs.every(x=>!x.act&&!String(x.anim).startsWith('rf-'))&&sound(bs),{anims:anims(bs).slice(0,6),...why(bs)});
 check('no page errors',errors.length===0,{errors:errors.slice(0,5)});
 r.state=await p.evaluate(()=>{const x=loadoutRunnerFull.state();return{maxCorrection:x.maxCorrection,corrections:x.corrections,blockedSteps:x.blockedSteps,ledgeHandoffs:x.ledgeHandoffs,ceilingStops:x.ceilingStops,actions:x.actions,bound:x.bound,performedDistinct:Object.keys(x.performed).length};});
 r.bindings=await p.evaluate(()=>loadoutRunnerFull.bindings());
 r.coordinator=await p.evaluate(()=>threadrailGame.coordinator.state());
}finally{
 r.checks=checks;r.pass=checks.filter(c=>c.status==='PASS').length;r.fail=checks.filter(c=>c.status==='FAIL').length;
 fs.writeFileSync(`${OUT}/report.json`,JSON.stringify(r,null,1));console.log('RESULT',r.pass,'PASS',r.fail,'FAIL');
 await browser.close();if(r.fail)process.exitCode=1;}})().catch(e=>{console.error(e);process.exitCode=1;});
