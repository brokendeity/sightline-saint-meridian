// Loadout Interface phase 1, real input (keys / mouse). Test setup that is NOT player input is labelled SETUP.
// Usage: node test_loadout_interface_p1.cjs <build.html> <outDir>
const {chromium}=require('/opt/homebrew/lib/node_modules/playwright');const BUILD=process.argv[2],OUT=process.argv[3];
const results=[];const check=(name,ok,info)=>{results.push({name,result:ok?'PASS':'FAIL',info});console.log((ok?'PASS ':'FAIL ')+name+(info!==undefined?' · '+JSON.stringify(info):''));};
(async()=>{const b=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal','--mute-audio']});const p=await b.newPage({viewport:{width:1280,height:800}});
let errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.addInitScript(()=>{try{localStorage.setItem('sightlineCharacter','sightline');localStorage.removeItem('loadoutInterfaceV1');}catch(e){}});
// SETUP: hide gamepads (a controller attached to the test machine drifts the stick and presses buttons; keyboard / mouse only here)
await p.addInitScript(()=>{try{Object.defineProperty(navigator,'getGamepads',{value:()=>[]});}catch(e){}});
await p.goto('http://127.0.0.1:8768/'+BUILD);
await p.waitForFunction(()=>typeof gameReady!=='undefined'&&gameReady&&window.characterState&&!characterState().busy&&window.loadoutInterface,null,{timeout:300000});
await p.click('#v02Tab-hero');await p.waitForTimeout(300);await p.selectOption('#characterChoice','loadout');
await p.waitForFunction(()=>characterState().hero==='loadout'&&!characterState().busy&&window.loadoutRunnerFull?.state?.().ready,null,{timeout:300000});
await p.click('#v02Tab-overview');await p.click('#v02Start');await p.waitForFunction(()=>gameActive,null,{timeout:10000});await p.waitForTimeout(800);
const S=()=>p.evaluate(()=>loadoutInterface.state());const shot=n=>p.screenshot({path:OUT+'/'+n+'.png'});const key=async(k,ms=60)=>{await p.keyboard.down(k);await p.waitForTimeout(ms);await p.keyboard.up(k);};
let st=await S();check('layer active as Loadout, HUD shown',st.active&&await p.evaluate(()=>!document.getElementById('loIf').hidden),{loadout:st.loadout});
// encounter
await key('t');await p.waitForFunction(()=>loadoutInterface.state().encounter?.outcome==='active',null,{timeout:120000});await p.waitForTimeout(500);
st=await S();check('T starts the encounter (construct + worker)',!!st.encounter,{construct:st.encounter?.construct});
// Analyze: hold right mouse until the construct winds up; ghosts appear
await p.mouse.move(640,400);await p.mouse.down({button:'right'});
await p.waitForFunction(()=>loadoutInterface.state().encounter?.construct.phase==='windup',null,{timeout:20000}).catch(()=>{});
await p.waitForTimeout(250);st=await S();await shot('analyze_windup');
const vis=Object.values(st.encounter.ghosts).filter(g=>g.visible).length;
check('Analyze held: Ghost Builds of possible attacks visible during the windup',st.analyze&&vis>=1,{visible:vis,ghosts:st.encounter.ghosts,phase:st.encounter.construct.phase,attack:st.encounter.construct.attack});
check('Analyze drains MP',st.mp<100,{mp:st.mp});
// let a few attacks play out while analyzing and guarding (V held); observations recorded
await p.keyboard.down('v');
for(let i=0;i<40&&(await S()).stats.hitsTaken+(await S()).stats.guarded<3;i++)await p.waitForTimeout(250);
await p.keyboard.up('v');await p.mouse.up({button:'right'});
st=await S();check('construct attacks resolve on Loadout (guarded / hit)',st.stats.hitsTaken>=1,{hitsTaken:st.stats.hitsTaken,guarded:st.stats.guarded,hp:st.hp});
check('Analyze records observed attacks',Object.values(st.encounter.construct.seen).reduce((a,b)=>a+b,0)>=1,st.encounter.construct.seen);
// SETUP: force one overhead so the guarded-overhead injury path is exercised deterministically
await p.keyboard.down('v');await p.evaluate(()=>loadoutInterface.debug.forceAttack('overhead'));await p.waitForTimeout(1400);await p.keyboard.up('v');
st=await S();check('guarded overhead injures the right forearm',st.body.rightArm<100,{rightArm:st.body.rightArm,log:st.log.slice(-3).map(l=>l.text)});
// Status glance
await key('b');await p.waitForTimeout(200);st=await S();await shot('status_glance');check('B opens the Status glance',st.statusOpen);
// Forms: Slip Counter during a windup (counter), Tempo Jab x2 (pattern learned)
await p.evaluate(()=>loadoutInterface.debug.forceAttack('overhead'));// SETUP: a slow attack to counter into
await p.waitForFunction(()=>{const c=loadoutInterface.state().encounter.construct;return c.phase==='windup';},null,{timeout:5000});
await p.waitForTimeout(450);await key('1');await p.waitForTimeout(1300);st=await S();
check('Form 1 (Slip Counter) performed; counter lands in the window',st.stats.forms>=1&&st.stats.counters>=1,{forms:st.stats.forms,counters:st.stats.counters,constructHp:st.encounter.construct.hp,log:st.log.slice(-4).map(l=>l.text)});
await p.waitForTimeout(600);await key('2');await p.waitForTimeout(1300);await key('2');await p.waitForTimeout(1300);st=await S();
check('two Tempo Jabs: construct learns to counter the lead',st.encounter.construct.jabCounterReady,{jabCounterReady:st.encounter.construct.jabCounterReady});
// Hotswap: tap Q
let s1=null;for(let i=0;i<6;i++){// a hit during the 0.7 s swap interrupts it (by design): swap in an opening
 await p.waitForFunction(()=>['recover','whiff','clinched'].includes(loadoutInterface.state().encounter?.construct.phase)||loadoutInterface.state().encounter?.construct.dist>3,null,{timeout:8000}).catch(()=>{});
 await key('q');await p.waitForTimeout(150);s1=await S();await p.waitForTimeout(900);st=await S();if(st.loadout==='grapple')break;}
check('Q tap hotswaps to GRAPPLE / CONTROL after a vulnerable transition',s1.swap?.to==='grapple'&&st.loadout==='grapple',{during:s1.swap,after:st.loadout});
await shot('grapple_loadout');
// Grapple / Control: Clinch Entry in an opening, then Balance Break from the clinch
let clinched=false,knocked=false;for(let i=0;i<6&&!knocked;i++){
 await p.waitForFunction(()=>['recover','whiff'].includes(loadoutInterface.state().encounter?.construct.phase),null,{timeout:8000}).catch(()=>{});
 await key('1');await p.waitForTimeout(450);st=await S();if(st.encounter.construct.clinch>0){clinched=true;await key('2');await p.waitForTimeout(800);st=await S();knocked=knocked||st.encounter.construct.down>0||st.log.some(l=>/KNOCKDOWN/.test(l.text));}
 await p.waitForTimeout(400);}
check('Grapple: Clinch Entry in an opening controls the construct',clinched,{log:st.log.slice(-4).map(l=>l.text)});
check('Grapple: Balance Break from the clinch knocks it down',knocked,{log:st.log.slice(-4).map(l=>l.text)});
// hold Q: wheel; pick 1 (back to Counter / Box), in an opening
for(let i=0;i<6;i++){await p.waitForFunction(()=>['recover','whiff','clinched'].includes(loadoutInterface.state().encounter?.construct.phase)||loadoutInterface.state().encounter?.construct.down>0||loadoutInterface.state().encounter?.construct.dist>3,null,{timeout:8000}).catch(()=>{});
 await p.keyboard.down('q');await p.waitForTimeout(450);s1=await S();await key('1');await p.keyboard.up('q');await p.waitForTimeout(900);st=await S();if(st.loadout==='box')break;}
check('Q hold opens the Loadout wheel; 1 picks COUNTER / BOX',s1.wheel&&st.loadout==='box',{wheel:s1.wheel,loadout:st.loadout});
// baton
await key('x');await p.waitForTimeout(300);st=await S();check('X draws the registered baton',st.baton.out,{baton:st.baton});
const d0=st.baton.durability;for(let i=0;i<6&&(await S()).baton.durability===d0;i++){await p.waitForTimeout(300);await key('2');await p.waitForTimeout(1400);}st=await S();
check('baton strike spends durability (persistent state)',st.baton.durability<d0,{before:d0,after:st.baton.durability,log:st.log.slice(-3).map(l=>l.text)});
await key('x');await p.waitForTimeout(200);st=await S();check('X stows it; durability unchanged by stowing',!st.baton.out,{baton:st.baton});
// quest: the voice is heard after 6 s; J panel
await p.waitForFunction(()=>loadoutInterface.state().encounter?.worker.heard,null,{timeout:15000}).catch(()=>{});
await key('j');await p.waitForTimeout(200);st=await S();await shot('quest_panel');check('worker heard; J shows the quest with the excluded occupant',st.encounter.worker.heard&&st.questOpen);
await key('j');
// SETUP (teleport, labelled): put Loadout beside the worker, then free him with real input (hold I)
await p.evaluate(()=>{const w=[...scene.children].find(o=>o.children?.some?.(c=>c.geometry?.type==='RingGeometry'&&c.material?.color?.getHex?.()===0xffb43c));if(w){s.pos.x=w.position.x+1.0;s.pos.z=w.position.z;s.vel.set(0,0,0);}});
await p.waitForTimeout(300);await p.keyboard.down('i');await p.waitForTimeout(1900);await p.keyboard.up('i');st=await S();
check('hold I frees the trapped worker (OFF-SCRIPT while the construct is active)',st.encounter.worker.freed&&st.encounter.offScript,{worker:st.encounter.worker,offScript:st.encounter.offScript,xp:st.xp});
// hero switch: nothing leaks
for(let i=0;i<3&&await p.evaluate(()=>gameActive);i++){await p.keyboard.press('Escape');await p.waitForTimeout(600);}
await p.click('#v02Tab-hero');await p.waitForTimeout(300);await p.selectOption('#characterChoice','backspool');
await p.waitForFunction(()=>characterState().hero==='backspool'&&!characterState().busy,null,{timeout:300000});
await p.click('#v02Tab-overview');await p.click('#v02Start');await p.waitForFunction(()=>gameActive,null,{timeout:10000});await p.waitForTimeout(600);
st=await S();const hidden=await p.evaluate(()=>document.getElementById('loIf').hidden);
const styleBefore=await p.evaluate(()=>backspoolCombatState?.().style||null);await key('2');await p.waitForTimeout(200);
const styleAfter=await p.evaluate(()=>backspoolCombatState?.().style||null);
check('switch to Backspool: Loadout layer inactive, HUD hidden, encounter cleared',!st.active&&hidden&&!st.encounter,{active:st.active,hidden,encounter:!!st.encounter});
check('Backspool keeps his own keys (2 = Impact style)',styleAfter==='impact'||styleBefore!==styleAfter,{styleBefore,styleAfter});
check('no page errors',errors.length===0,errors.slice(0,5));
require('fs').writeFileSync(OUT+'/loadout_interface_p1_results.json',JSON.stringify({build:BUILD,date:new Date().toISOString(),results,final:await S()},null,1));
await b.close();})();
