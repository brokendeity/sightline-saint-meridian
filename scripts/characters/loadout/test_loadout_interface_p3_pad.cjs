// Loadout Interface phase 3: GAMEPAD. A virtual standard-mapping gamepad replaces navigator.getGamepads (SETUP; the
// game reads it through its normal pollGamepad path, exactly like a real pad). Keyboard is used only for T (start the
// sparring encounter) and to open menus. Usage: node test_loadout_interface_p3_pad.cjs <build.html> <outDir>
const {chromium}=require('/opt/homebrew/lib/node_modules/playwright');const BUILD=process.argv[2],OUT=process.argv[3];
const results=[];const check=(name,ok,info)=>{results.push({name,result:ok?'PASS':'FAIL',info});console.log((ok?'PASS ':'FAIL ')+name+(info!==undefined?' · '+JSON.stringify(info).slice(0,360):''));};
(async()=>{const b=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal','--mute-audio']});const p=await b.newPage({viewport:{width:1280,height:800}});
const errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.addInitScript(()=>{try{localStorage.setItem('sightlineCharacter','sightline');localStorage.removeItem('loadoutInterfaceV1');}catch(e){}
 // SETUP: one virtual standard gamepad (17 buttons, 4 axes); the attached real controller is hidden
 const pad={id:'Virtual test pad (standard)',index:0,connected:true,mapping:'standard',timestamp:0,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,touched:false,value:0}))};
 window.__vp={pad,set(i,v){pad.buttons[i]={pressed:!!v,touched:!!v,value:v?1:0};pad.timestamp++;},axis(i,v){pad.axes[i]=v;pad.timestamp++;}};
 Object.defineProperty(navigator,'getGamepads',{value:()=>[pad]});});
await p.goto('http://127.0.0.1:8768/'+BUILD);
await p.waitForFunction(()=>typeof gameReady!=='undefined'&&gameReady&&window.characterState&&!characterState().busy&&window.loadoutInterface,null,{timeout:300000});
await p.click('#v02Tab-hero');await p.waitForTimeout(300);await p.selectOption('#characterChoice','loadout');
await p.waitForFunction(()=>characterState().hero==='loadout'&&!characterState().busy&&window.loadoutRunnerFull?.state?.().ready,null,{timeout:300000});
await p.click('#v02Tab-overview');await p.click('#v02Start');await p.waitForFunction(()=>gameActive,null,{timeout:10000});await p.waitForTimeout(800);
const S=()=>p.evaluate(()=>loadoutInterface.state());const shot=n=>p.screenshot({path:OUT+'/'+n+'.png'});
const btn=(i,v)=>p.evaluate(([i,v])=>__vp.set(i,v),[i,v]);const tap=async(i,ms=120)=>{await btn(i,1);await p.waitForTimeout(ms);await btn(i,0);await p.waitForTimeout(120);};
const B={A:0,B:1,X:2,Y:3,LB:4,RB:5,LT:6,RT:7,View:8,Start:9,L3:10,R3:11,Up:12,Down:13,Left:14,Right:15};
await p.keyboard.press('t');await p.waitForFunction(()=>loadoutInterface.state().encounter?.outcome==='active',null,{timeout:120000});await p.waitForTimeout(400);
let st;
// LT: Analyze
await btn(B.LT,1);await p.waitForFunction(()=>loadoutInterface.state().encounter?.construct.phase==='windup',null,{timeout:20000}).catch(()=>{});await p.waitForTimeout(250);st=await S();await shot('pad_analyze');
check('LT hold: Analyze with Ghost Builds',st.analyze&&Object.values(st.encounter.ghosts).some(g=>g.visible),{analyze:st.analyze,phase:st.encounter.construct.phase});
check('LT does not trigger Backspool aim / guard for Loadout',await p.evaluate(()=>!input.actions.aim),{});
check('HUD switches to pad glyphs',await p.evaluate(()=>/RT\+X/.test(document.getElementById('loForms').textContent)),await p.evaluate(()=>document.getElementById('loForms').textContent.slice(0,80)));
// LT + R3: Deep Scan
await tap(B.R3);st=await S();check('LT + R3: Deep Scan on',st.scan.on,{scan:st.scan.on});await tap(B.R3);
// LT + D-up: Quest panel
await tap(B.Up);st=await S();check('LT + D-up: Quest panel',st.questOpen,{});await tap(B.Up);await btn(B.LT,0);await p.waitForTimeout(150);
// RT + X: Form 1 (Slip Counter)
const f0=(await S()).stats.forms;await btn(B.RT,1);await p.waitForTimeout(120);await tap(B.X);await btn(B.RT,0);await p.waitForTimeout(400);st=await S();
check('RT + X: Form 1 (Slip Counter)',st.stats.forms>f0&&/slip/.test(st.form?.id||''),{forms:st.stats.forms,form:st.form});
check('RT + X did not tumble (X masked while RT is held)',!/^Tum_/.test(await p.evaluate(()=>loadoutRunnerFull.state().action?.clip||'')),await p.evaluate(()=>loadoutRunnerFull.state().action?.clip||null));
await p.waitForTimeout(1200);
// RT + Y: Form 2 (Tempo Jab)
await btn(B.RT,1);await p.waitForTimeout(100);await tap(B.Y);await btn(B.RT,0);await p.waitForTimeout(300);st=await S();check('RT + Y: Form 2 (Tempo Jab)',st.form?.id==='tempo',{form:st.form});
await p.waitForTimeout(1300);
// RT tap: basic strike through Backspool combat (as before)
const a0=await p.evaluate(()=>backspoolCombatState().sequence||0);await tap(B.RT,90);await p.waitForTimeout(300);const a1=await p.evaluate(()=>({seq:backspoolCombatState().sequence||0,action:backspoolCombatState().action?.moveId||backspoolCombatState().phase}));
check('RT tap: basic strike (backspoolCombat.pressAttack)',a1.seq>a0||/strike|attack|active|startup|windup/i.test(String(a1.action)),{before:a0,after:a1});
await p.waitForTimeout(900);
// D-right tap: hotswap; D-right hold: wheel, A picks 3 (Pursuit)
const style0=await p.evaluate(()=>backspoolCombatState().style);
for(let i=0;i<6&&(await S()).loadout!=='grapple';i++){await p.waitForFunction(()=>['recover','whiff','clinched'].includes(loadoutInterface.state().encounter?.construct.phase)||loadoutInterface.state().encounter?.construct.dist>3,null,{timeout:8000}).catch(()=>{});await tap(B.Right);await p.waitForTimeout(900);}
st=await S();check('D-right tap: hotswap to GRAPPLE / CONTROL',st.loadout==='grapple',{loadout:st.loadout});
check('D-right no longer cycles Backspool\'s combat style for Loadout',await p.evaluate(()=>backspoolCombatState().style)===style0,{style0});
for(let i=0;i<6&&(await S()).loadout!=='pursuit';i++){await btn(B.Right,1);await p.waitForTimeout(450);const w=(await S()).wheel;await tap(B.A);await btn(B.Right,0);await p.waitForTimeout(900);if(i===0)check('D-right hold: Loadout wheel opens',w,{wheel:w});}
st=await S();check('wheel + A picks 3: PURSUIT',st.loadout==='pursuit',{loadout:st.loadout});
// D-left: baton
await tap(B.Left);st=await S();check('D-left: baton drawn',st.baton.out,{baton:st.baton});await tap(B.Left);
// D-up: Status glance; hold: Body Inspection
await tap(B.Up);st=await S();check('D-up tap: Status glance',st.statusOpen,{});
await btn(B.Up,1);await p.waitForTimeout(600);st=await S();check('D-up hold: Body Inspection',st.pad.status&&st.statusOpen,{pad:st.pad});await btn(B.Up,0);
// LB still: guard; LB + stick: strafe, no guard
await btn(B.LB,1);await p.waitForTimeout(200);st=await S();check('LB with the stick still: guard',st.guard,{guard:st.guard});
await p.evaluate(()=>__vp.axis(0,.9));await p.waitForTimeout(300);st=await S();const strafe=await p.evaluate(()=>loadoutRunnerFull.state().input.strafe);
check('LB + stick: strafe (Runner), no guard',!st.guard&&strafe,{guard:st.guard,strafe});
await p.evaluate(()=>__vp.axis(0,0));await btn(B.LB,0);await p.waitForTimeout(200);
// hero-switch chord keeps priority: L3 + LT + RT + R3
await btn(B.L3,1);await btn(B.LT,1);await btn(B.RT,1);await btn(B.R3,1);await p.waitForTimeout(500);await btn(B.R3,0);await btn(B.RT,0);await btn(B.LT,0);await btn(B.L3,0);
await p.waitForFunction(()=>characterState().hero!=='loadout'&&!characterState().busy,null,{timeout:120000}).catch(()=>{});
const hero=await p.evaluate(()=>characterState().hero);st=await S();
check('L3+LT+RT+R3 still switches hero (priority) and the Loadout layer goes inactive',hero!=='loadout'&&!st.active,{hero,active:st.active});
check('no page errors',errors.length===0,errors.slice(0,5));
require('fs').writeFileSync(OUT+'/loadout_interface_p3_pad_results.json',JSON.stringify({build:BUILD,date:new Date().toISOString(),results,final:await S()},null,1));
await b.close();})();
