/* Loadout with Runner Action pack moves in SIGHTLINE_SAINT_MERIDIAN_V02_LOADOUT_RUNNER.html.
   Real input: the Hero-tab menu to choose Loadout, keyboard W / Shift (sprint toggle) / Space / C, and a virtual
   standard pad (RT, R3, D-pad up) read by the game's own polling, as in test_mixamo_combat.cjs.
   Labelled setup (as in the combat suite): frames are stepped with tickFrame; the player is reset to the open
   plaza before each block; the public practice button spawns targets; the style is chosen through the style menu's
   change handler; practice targets hold their shots so an 8-hit chain is not staggered.
   The wall block uses the labelled QA wall and respawn setup of test_friendly_wall_contacts.cjs; practice targets are
   allowed one shot (labelled) to provoke a hit reaction.
   Checks that Loadout's idle variants, run, sprint, stop, 180-degree turn, jump, landing, rolls, standing side-steps,
   side flips, wall runs on either side, wall climb and boost, hit reaction and every RT strike play Runner clips, that
   gameplay timing and hits are unchanged (all 8 strikes connect in each style), that his cape cloth stays sound,
   and that Backspool still plays his own clips (control). */
const{chromium}=require('/opt/homebrew/lib/node_modules/playwright'),assert=require('assert/strict'),fs=require('fs'),crypto=require('crypto'),path=require('path');
const OUT=process.env.LOADOUT_RUNNER_OUT||'development/characters/loadout/evidence/runner',BUILD=process.env.LOADOUT_RUNNER_BUILD||'SIGHTLINE_SAINT_MERIDIAN_V02_LOADOUT_RUNNER.html';
// LOADOUT_RUNNER_FULL_OFF=1: with the full-pack build, switch its Runner pace and transitions off (menu settings, stored
// in localStorage) so this test checks the earlier role mapping underneath them.
const FULL_OFF=!!process.env.LOADOUT_RUNNER_FULL_OFF;
(async()=>{const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal','--mute-audio']});try{
 fs.mkdirSync(OUT,{recursive:true});
 const p=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{const up={pressed:false,value:0};window.testPad={id:'test pad',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>up)};navigator.getGamepads=()=>[window.testPad];});
 if(FULL_OFF)await p.addInitScript(()=>{localStorage.setItem('loadoutRunnerPace','off');localStorage.setItem('loadoutRunnerTransitions','off');});
 await p.goto('http://127.0.0.1:8766/'+BUILD+'?capture=backspool');
 await p.waitForFunction(()=>typeof gameReady!=='undefined'&&gameReady&&window.characterState&&!characterState().busy&&roadNetworkState().ready,null,{timeout:300000});
 await p.waitForFunction(()=>verticalWorldLifeState().ready&&v02EastPublicLightingState().ready&&v02RimShadowState().ready,null,{timeout:120000});
 // Choose Loadout in the Hero tab, as a player would.
 await p.click('#v02Tab-hero');await p.selectOption('#characterChoice','loadout');
 await p.waitForFunction(()=>characterState().hero==='loadout'&&!characterState().busy,null,{timeout:300000});
 const runner=await p.evaluate(()=>window.loadoutRunnerMoves.state());
 await p.click('#v02Tab-overview');await p.locator('#v02Start').click();await p.evaluate(()=>{window.requestAnimationFrame=()=>0});
 const step=n=>p.evaluate(n=>{for(let i=0;i<n;i++)tickFrame(1/60,false)},n);
 const tap=async button=>{await p.evaluate(b=>testPad.buttons=testPad.buttons.map((x,i)=>i===b?{pressed:true,value:1}:x),button);await step(2);await p.evaluate(()=>testPad.buttons=testPad.buttons.map(()=>({pressed:false,value:0})));};
 // Frames are drawn: the cape cloth runs just before rendering.
 const frame=()=>p.evaluate(()=>{tickFrame(1/60,true);const c=window.loadoutHero.state().cloth,x=backspoolCombat.state();return{anim:currentAnim,wall:backspoolAdvancedState().kind,pos:s.pos.toArray(),speed:Math.hypot(s.vel.x,s.vel.z),ground:s.onGround,move:x.action?.id??null,hits:x.hits,
  cape:{pen:c?.penetration??0,nan:!!c?.nan,aim:c?.maxAimErrorM??0}};});
 const run=async n=>{const rows=[];for(let i=0;i<n;i++)rows.push(await frame());return rows;};
 const reset=()=>p.evaluate(()=>{resetPlayer();clearInput();clearPad();startGame(false);s.pos.set(0,.42,12);s.vel.set(0,0,0);s.onGround=true;setMode(P.GROUND);s.yaw=cam.yaw=cam.targetYaw=0;cam.pitch=cam.targetPitch=-.08;for(let i=0;i<120;i++)tickFrame(1/60,false)});
 const shot=async n=>{await p.evaluate(()=>renderNight(0));await p.screenshot({path:`${OUT}/${n}.png`});};
 const anims=rows=>[...new Set(rows.map(r=>r.anim))];
 const r={runner};
 // 1. Idle, run, sprint (Shift tap toggles), stop.
 await reset();r.idle=await run(30);await shot('idle');
 await p.keyboard.down('w');r.run=await run(60);await shot('run');
 await p.keyboard.press('Shift');r.sprint=await run(40);await shot('sprint');
 await p.keyboard.up('w');r.stop=await run(90);
 r.moved=Math.hypot(r.stop.at(-1).pos[0]-r.idle.at(-1).pos[0],r.stop.at(-1).pos[2]-r.idle.at(-1).pos[2]);
 r.peakRun=Math.max(...r.run.map(x=>x.speed));r.peakSprint=Math.max(...r.sprint.map(x=>x.speed));
 // 2. Running jump and landing.
 await reset();await p.keyboard.down('w');await run(60);await p.keyboard.press('Space');r.jump=[];for(let i=0;i<150;i++){r.jump.push(await frame());if(i===18)await shot('jump');}await p.keyboard.up('w');r.jump.push(...await run(40));
 r.jumpAir=r.jump.some(x=>!x.ground);
 // 3. Evade: standing (backstep) and moving (roll).
 await reset();await p.keyboard.down('w');await run(50);await p.keyboard.press('KeyC');r.roll=[];for(let i=0;i<70;i++){r.roll.push(await frame());if(i===12)await shot('roll');}await p.keyboard.up('w');await run(30);
 // 3b. Standing evades: neutral (back stand-roll) and with the stick held left (side-step left).
 await reset();await p.keyboard.press('KeyC');r.evadeNeutral=await run(50);
 await reset();await p.keyboard.down('a');await p.keyboard.press('KeyC');r.evadeLeft=await run(50);await p.keyboard.up('a');await run(20);
 // 3c. A 180-degree turn while running.
 await reset();await p.keyboard.down('w');await run(80);await p.keyboard.up('w');await p.keyboard.down('s');r.turn=[];for(let i=0;i<60;i++){r.turn.push(await frame());if(i===10)await shot('turn');}await p.keyboard.up('s');await run(30);
 // 3d. Side flips: sprint (Shift toggle), stick left or right, Jump.
 for(const [key,side] of [['a','Left'],['d','Right']]){await reset();await p.keyboard.press('Shift');await p.keyboard.down(key);await run(45);await p.keyboard.press('Space');const rows=[];for(let i=0;i<90;i++){rows.push(await frame());if(i===20)await shot('sideflip-'+side.toLowerCase());}r['flip'+side]=rows;await p.keyboard.up(key);await p.keyboard.press('Shift');await run(30);}
 // 3e. Walls. Labelled setup, as in test_friendly_wall_contacts.cjs: a QA wall slab and its respawn placement.
 await p.evaluate(()=>{const m=new THREE.Mesh(new THREE.BoxGeometry(16,8,3),new THREE.MeshStandardMaterial({color:0x142d39,roughness:.75}));m.position.set(30,4.4,-3);scene.add(m);const owner={id:'wall-qa',mesh:m,box:new THREE.Box3().setFromObject(m),type:'wall-qa',damageCount:0};propColliders.push(owner);cameraObstacles.push(m);walkables.push(m);window.wallQA=owner;});
 const wallSetup=async(x,y,z)=>{for(const k of ['w','a','s','d','Shift','Space'])await p.keyboard.up(k);await p.evaluate(({x,y,z})=>{clearInput();resetMechanicInput();threadrailGame.lifecycle('RESPAWN');backspoolCombat.reset('WALL QA');backspoolAdvanced.reset('RESPAWN');backspoolFlow.reset('RESPAWN');backspoolHop.reset('RESPAWN');backspoolTraversal.reset('RESPAWN');backspoolPowers.clear();s.pos.set(x,y,z);s.vel.set(0,0,0);s.onGround=y<.9;setMode(s.onGround?P.GROUND:P.AIR);s.yaw=cam.yaw=cam.targetYaw=0;cam.pitch=cam.targetPitch=-.1;courier.trauma=0;for(const e of enemies)e.blindTimer=999;startGame(false);},{x,y,z});};
 const wallRun=async(x,key,name)=>{await wallSetup(x,.42,-.65);await p.keyboard.press('Shift');await p.keyboard.down(key);const rows=[];for(let i=0;i<70;i++){rows.push(await frame());if(i===40)await shot(name);}await p.keyboard.up(key);await p.keyboard.press('Shift');await run(30);return rows;};
 r.wallRight=await wallRun(27,'d','wallrun-d');r.wallLeft=await wallRun(33,'a','wallrun-a');
 await wallSetup(30,.42,4);await p.keyboard.press('Shift');await p.keyboard.down('w');r.climb=[];for(let i=0;i<160;i++){r.climb.push(await frame());if(i===70)await shot('wall-climb');}await p.keyboard.up('w');await p.keyboard.press('Shift');await run(40);
 await wallSetup(30,2,-.88);await p.keyboard.press('Shift');await p.keyboard.down('w');r.boost=await run(22);await p.keyboard.press('Space');r.boost.push(...await run(30));await p.keyboard.up('w');await p.keyboard.press('Shift');await run(60);
 r.wallLatch=await p.evaluate(()=>window.loadoutRunnerMoves.state().latch);
 // 4. RT chain and D-pad up heavy in each style against practice targets.
 r.combat={};
 for(const style of ['flow','impact','counter']){
  await reset();
  if(!await p.locator('#combatPractice').isVisible()){await p.click('#v02Tools');await p.click('#v02Tab-practice');}
  await p.click('#combatPractice');await step(2);if(!await p.evaluate(()=>gameActive)){await p.click('#start');await step(2);}
  await p.evaluate(style=>{const el=$('combatStyle');el.value=style;el.dispatchEvent(new Event('change'));},style);
  await p.evaluate(()=>backspoolCombat.practice.forEach(t=>t.shot=999));
  await tap(11);await step(90);const locked=await p.evaluate(()=>!!backspoolCombat.state().target);
  const approach=async()=>{await p.keyboard.down('w');for(let i=0;i<300;i++){const d=await p.evaluate(()=>{tickFrame(1/60,false);const x=backspoolCombat.state(),t=backspoolCombat.practice.find(q=>q.id===x.target);return t?Math.hypot(t.group.position.x-s.pos.x,t.group.position.z-s.pos.z):0});if(d<1.3)break;}await p.keyboard.up('w');await step(4);};
  await approach();const before=await p.evaluate(()=>backspoolCombat.state().hits),rows=[];
  for(let k=0;k<8;k++){await tap(7);const target=before+k+1;for(let f=0;f<45;f++){const x=await frame();rows.push(x);if(x.hits>=target){if(k===0||k===3)await shot(`${style}-light-${k+1}`);break;}}}
  rows.push(...await run(30));
  await approach();const heavyBefore=await p.evaluate(()=>backspoolCombat.state().hits);await tap(12);const heavy=await run(70);
  // Labelled setup: in the flow block the practice targets may fire once, to provoke a hit reaction.
  if(style==='flow'){await p.evaluate(()=>backspoolCombat.practice.forEach(t=>t.shot=.3));r.reaction=await run(240);await p.evaluate(()=>backspoolCombat.practice.forEach(t=>t.shot=999));}
  const played=[...new Set(rows.map(x=>x.anim).filter(a=>/light/.test(a)))];
  const runnerClips=await p.evaluate(ids=>ids.map(id=>{const st=window.loadoutRunnerMoves.state().combat,m=Object.values(st).find(v=>v.clipId===id);return{id,runner:m?.runnerClip||null,duration:+clips[id].duration.toFixed(3),window:m?+(m.window[1]-m.window[0]).toFixed(3):null};}),played);
  r.combat[style]={locked,played,hits:rows.at(-1).hits-before,heavyHit:heavy.at(-1).hits>heavyBefore,runnerClips,cape:rows.concat(heavy).map(x=>x.cape)};
 }
 const capeRows=[...r.idle,...r.run,...r.sprint,...r.stop,...r.jump,...r.roll,...r.evadeNeutral,...r.evadeLeft,...r.turn,...r.flipLeft,...r.flipRight,...r.wallRight,...r.wallLeft,...r.climb,...r.boost,...(r.reaction||[])].map(x=>x.cape).concat(Object.values(r.combat).flatMap(c=>c.cape));
 r.capeByBlock=Object.fromEntries(['idle','run','sprint','stop','jump','roll','evadeNeutral','evadeLeft','turn','flipLeft','flipRight','wallRight','wallLeft','climb','boost','reaction'].filter(k=>r[k]).map(k=>[k,+Math.max(...r[k].map(x=>x.cape.pen)).toFixed(4)]).concat(Object.entries(r.combat).map(([k,c])=>[k,+Math.max(...c.cape.map(x=>x.pen)).toFixed(4)])));
 r.cape={frames:capeRows.length,maxPen:Math.max(...capeRows.map(c=>c.pen)),maxAim:Math.max(...capeRows.map(c=>c.aim)),nan:capeRows.some(c=>c.nan)};
 // 5. Control: Backspool through the Hero tab still plays his own clips.
 await p.evaluate(()=>{window.requestAnimationFrame=cb=>setTimeout(()=>cb(performance.now()),16)});
 await p.keyboard.press('Escape');await p.waitForTimeout(300);await p.click('#v02Tab-hero');await p.selectOption('#characterChoice','backspool');
 await p.waitForFunction(()=>characterState().hero==='backspool'&&!characterState().busy,null,{timeout:300000});
 r.backspool=await p.evaluate(()=>{const f=window.backspoolFlowRoles.roles,l=window.backspoolLocomotionRoles.roles;return{idle:f.find(x=>x.role==='idle').id,roll:f.find(x=>x.role==='roll').id,run:l.find(x=>x.role==='run').id,
  runnerIds:[...f,...l].filter(x=>String(x.id).startsWith('runner-')).length,light1:+clips['action-v2-mx-flow-light-1'].duration.toFixed(3),runnerInBank:Object.keys(clips).filter(k=>k.startsWith('runner-')).length};});
 r.reactionClip=(await p.evaluate(()=>window.loadoutRunnerMoves.state().defense?.['flow-reaction']?.runnerClip))||null;
 const has=(rows,re)=>anims(rows).some(a=>re.test(a));
 const checks={
  'Runner clips loaded for Loadout (every converted clip)':runner.loaded&&runner.clips===Object.keys(JSON.parse(require('zlib').gunzipSync(fs.readFileSync('assets/loadout/runner/loadout_runner_clips.json.gz'))).clips).length,
  'Runner replaces 39 flow roles and 6 locomotion loops':runner.flowRoles.length===39&&Object.keys(runner.locomotion).length===6,
  'idle plays the blended Runner idle variants':anims(r.idle).length>0&&anims(r.idle).every(a=>/^runner-(idle|relaxedIdle)-variants$/.test(a)),
  'starting to run plays the Runner jog start':has(r.run,/^runner-Mvm_Jog_Start_Fwd$/),
  'running plays a Runner run loop':has(r.run,/^runner-Mvm_(Dash|Boost)@/),
  'sprint plays the Runner sprint (Mvm_Boost)':has(r.sprint,/^runner-Mvm_Boost@/),
  'stopping plays a Runner stop':has(r.stop,/^runner-Mvm_(JogStop|BoostEnd|WalkStop)/),
  'Loadout covers ground: more than 8 m':r.moved>8,
  'running jump leaves the ground and plays Runner jump or air clips':r.jumpAir&&has(r.jump,/^runner-(Jmp_|Jump_Down)/),
  'landing plays a Runner landing':has(r.jump,/^runner-(Land_|Mvm_)/),
  'moving evade plays a Runner roll':has(r.roll,/^runner-(Esc_Roll_|Land_Roll_Move)/),
  'neutral standing evade plays the Runner back dash':has(r.evadeNeutral,/^runner-Esc_BoostDash_Back$/),
  'evade with the stick left from standing plays the Runner roll left':has(r.evadeLeft,/^runner-Esc_Roll_Left$/),
  '180-degree turn plays a Runner turn':has(r.turn,/^runner-Mvm_(Jog|Boost)_TurnL_180_Left$/),
  'side flip left plays Jmp_SideAir_A':has(r.flipLeft,/^runner-Jmp_SideAir_A$/),
  'side flip right plays its mirror':has(r.flipRight,/^runner-Jmp_SideAir_A_Mirror$/),
  'wall run with the wall on his left plays the left-wall clip':has(r.wallRight,/^runner-LoWall_LDash_Loop$/)&&!has(r.wallRight,/RDash/),
  'wall run with the wall on his right plays the right-wall clip':has(r.wallLeft,/^runner-LoWall_RDash_Loop$/)&&!has(r.wallLeft,/LDash/),
  'wall climb plays the Runner vertical run':has(r.climb,/^runner-Wall_Vertical_Dash_Loop$/),
  'wall boost plays the Runner vertical boost':has(r.boost,/^runner-Wall_Vertical_Boost$/),
  'hit reaction plays the Runner stumble':!!r.reaction&&has(r.reaction,/^action-v2-flow-reaction$/)&&r.reactionClip==='Dam_Stand_Stumble',
  ...Object.fromEntries(['flow','impact','counter'].flatMap(style=>{const c=r.combat[style];return[
   [style+': R3 locks a practice target',c.locked],
   [style+': RT chain plays all eight light moves in order',JSON.stringify(c.played)===JSON.stringify([1,2,3,4,5,6,7,8].map(n=>`action-v2-mx-${style}-light-${n}`))],
   [style+': every light strike is a Runner attack clip',c.runnerClips.length===8&&c.runnerClips.every(x=>x.runner&&Math.abs(x.duration-x.window)<.02)],
   [style+': all eight strikes connect',c.hits===8],
   [style+': D-pad up heavy connects',c.heavyHit]];})),
  'cape cloth finite and outside the body through every move':!r.cape.nan&&r.cape.maxPen<=.02,
  'control: Backspool keeps his own flow and locomotion clips':r.backspool.idle==='forspoken-flow-idle'&&r.backspool.roll==='forspoken-flow-roll'&&r.backspool.run==='traversal-locomotion-run'&&r.backspool.runnerIds===0,
  'control: Backspool keeps his own strike clips':r.backspool.light1===.38&&r.backspool.runnerInBank===0,
  'no page errors':errors.length===0};
 const files=[BUILD,'scripts/game_v02_loadout_runner_moves.js','scripts/game_loadout_cape_cloth_v2.js','scripts/game_humanoid_retarget.js','assets/loadout/runner/loadout_runner_roles.json','assets/loadout/runner/loadout_runner_clips.json.gz',__filename];
 const slim=rows=>({frames:rows.length,anims:anims(rows)});
 fs.writeFileSync(OUT+'/results.json',JSON.stringify({build:BUILD,hashes:Object.fromEntries(files.map(f=>[path.relative(process.cwd(),f),crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')])),
  scope:'Keyboard, menu and virtual-pad input with stepped frames in headless Chromium (ANGLE/Metal); labelled plaza reset and practice targets. Vaults, mantles, slides, ladders, swimming, crouch, heavy landings from height and missions as Loadout are not covered; walls use a labelled QA slab.',
  checks,results:{runner:r.runner,moved:+r.moved.toFixed(2),peakRun:+r.peakRun.toFixed(2),peakSprint:+r.peakSprint.toFixed(2),idle:slim(r.idle),run:slim(r.run),sprint:slim(r.sprint),stop:slim(r.stop),jump:slim(r.jump),roll:slim(r.roll),evadeNeutral:slim(r.evadeNeutral),evadeLeft:slim(r.evadeLeft),turn:slim(r.turn),flipLeft:slim(r.flipLeft),flipRight:slim(r.flipRight),wallRight:slim(r.wallRight),wallLeft:slim(r.wallLeft),climb:slim(r.climb),boost:slim(r.boost),reaction:r.reaction?slim(r.reaction):null,wallLatch:r.wallLatch,
   capeByBlock:r.capeByBlock,combat:Object.fromEntries(Object.entries(r.combat).map(([k,c])=>[k,{locked:c.locked,played:c.played,hits:c.hits,heavyHit:c.heavyHit,runnerClips:c.runnerClips}])),cape:r.cape,backspool:r.backspool},errors},null,1));
 for(const [k,v] of Object.entries(checks))console.log((v?'PASS ':'FAIL ')+k);
 console.log(JSON.stringify(r.capeByBlock));
 console.log(JSON.stringify({evadeNeutral:anims(r.evadeNeutral),evadeLeft:anims(r.evadeLeft),turn:anims(r.turn),flipLeft:anims(r.flipLeft),flipRight:anims(r.flipRight),wallRight:anims(r.wallRight),wallLeft:anims(r.wallLeft),climb:anims(r.climb),boost:anims(r.boost),reaction:r.reaction&&anims(r.reaction),wallLatch:r.wallLatch}));
 console.log(JSON.stringify({moved:+r.moved.toFixed(2),run:anims(r.run),sprint:anims(r.sprint),stop:anims(r.stop),jump:anims(r.jump),roll:anims(r.roll),cape:r.cape,backspool:r.backspool}));
 assert(Object.values(checks).every(Boolean),'Some Loadout Runner checks failed');console.log('PASS Loadout Runner moves, real input');
}finally{await browser.close()}})().catch(e=>{console.error(e.message);process.exitCode=1});
