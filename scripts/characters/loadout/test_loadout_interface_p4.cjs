// Loadout Interface phase 4: the Core Wheel and the Deep Interface pages, with real keyboard / mouse input, then with a
// virtual standard gamepad (SETUP: it replaces navigator.getGamepads; the game reads it through its normal pollGamepad
// path). Calls to loadoutInterface.debug.* are labelled SETUP (they only set up a state to look at).
// Usage: node test_loadout_interface_p4.cjs <build.html> <outDir>
const {chromium}=require('/opt/homebrew/lib/node_modules/playwright');const BUILD=process.argv[2],OUT=process.argv[3];
const results=[];const check=(name,ok,info)=>{results.push({name,result:ok?'PASS':'FAIL',info});console.log((ok?'PASS ':'FAIL ')+name+(info!==undefined?' · '+JSON.stringify(info).slice(0,300):''));};
const errors=[];
async function boot(b,pad){const p=await b.newPage({viewport:{width:1280,height:800}});p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(pad=>{try{localStorage.setItem('sightlineCharacter','sightline');localStorage.removeItem('loadoutInterfaceV1');localStorage.removeItem('loadoutInterfaceV4');}catch(e){}
  if(pad){const g={id:'Virtual test pad (standard)',index:0,connected:true,mapping:'standard',timestamp:0,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,touched:false,value:0}))};
   window.__vp={pad:g,set(i,v){g.buttons[i]={pressed:!!v,touched:!!v,value:v?1:0};g.timestamp++;},axis(i,v){g.axes[i]=v;g.timestamp++;}};
   Object.defineProperty(navigator,'getGamepads',{value:()=>[g]});}
  else Object.defineProperty(navigator,'getGamepads',{value:()=>[]}); // SETUP: hide the drifting controller attached to the test machine
 },pad);
 await p.goto('http://127.0.0.1:8768/'+BUILD);
 await p.waitForFunction(()=>typeof gameReady!=='undefined'&&gameReady&&window.characterState&&!characterState().busy&&window.loadoutInterface,null,{timeout:300000});
 await p.click('#v02Tab-hero');await p.waitForTimeout(300);await p.selectOption('#characterChoice','loadout');
 await p.waitForFunction(()=>characterState().hero==='loadout'&&!characterState().busy&&window.loadoutRunnerFull?.state?.().ready,null,{timeout:300000});
 await p.click('#v02Tab-overview');await p.click('#v02Start');await p.waitForFunction(()=>gameActive,null,{timeout:10000});await p.waitForTimeout(900);return p;}
(async()=>{const b=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal','--mute-audio']});
let p=await boot(b,false);
const S=()=>p.evaluate(()=>loadoutInterface.state());const shot=n=>p.screenshot({path:OUT+'/'+n+'.png'});
const key=async(k,ms=60)=>{await p.keyboard.down(k);await p.waitForTimeout(ms);await p.keyboard.up(k);await p.waitForTimeout(140);};
const pos=()=>p.evaluate(()=>s.pos.toArray());const dist=(a,c)=>Math.hypot(a[0]-c[0],a[2]-c[2]);
let st;
// ---- keyboard / mouse ----
await key('Digit2');await p.waitForTimeout(1400); // a real Tempo Jab before opening, so Skills has a use to show
await key('Tab');st=await S();await shot('p4_wheel');
check('Tab opens the Core Wheel with 8 sections',st.ui.open==='wheel'&&st.ui.visible&&['STATUS','SKILLS','LOADOUTS','INVENTORY','QUESTS','SHOP','TITLES','RECORDS'].every(n=>st.ui.text.includes(n)),{open:st.ui.open,visible:st.ui.visible});
check('world is dimmed behind the wheel (veil with backdrop filter)',await p.evaluate(()=>{const v=document.querySelector('#loCore .veil');return !!v&&/saturate/.test(getComputedStyle(v).backdropFilter||getComputedStyle(v).webkitBackdropFilter||'');}),{});
const p0=await pos();await p.keyboard.down('KeyW');await p.waitForTimeout(700);await p.keyboard.up('KeyW');await p.waitForTimeout(150);const p1=await pos();
check('W while the wheel is open does not move Loadout',dist(p0,p1)<.05,{moved:+dist(p0,p1).toFixed(3)});
const sel0=(await S()).ui.sel;await key('ArrowRight');st=await S();check('→ steps the selection by one',st.ui.sel===(sel0+1)%8,{sel0,sel:st.ui.sel});
await p.mouse.move(640,400);await p.mouse.move(760,400,{steps:6});await p.waitForTimeout(100);st=await S();
check('mouse direction points at a section (right = LOADOUTS)',st.ui.sel===2,{sel:st.ui.sel});
const attack0=await p.evaluate(()=>backspoolCombatState().sequence||0);
await p.evaluate(()=>loadoutInterface.debug.setBody('rightArm',60)); // SETUP: an injured right forearm to inspect
await key('Digit1');st=await S();await shot('p4_status');
check('1 opens STATUS: body map, resources, Forms per body part',st.ui.open==='status'&&/RIGHT FOREARM · FORMS THAT USE IT/i.test(st.ui.text)&&/Power Cross/.test(st.ui.text)&&/Archive Saturation/i.test(st.ui.text),{text:st.ui.text.slice(0,200)});
check('STATUS marks the injured forearm and its heavy Form',await p.evaluate(()=>[...document.querySelectorAll('#loCore .row.bad')].some(r=>/Power Cross/.test(r.textContent))&&[...document.querySelectorAll('#loCore .row.bad')].some(r=>/Right forearm/.test(r.textContent))),{});
await key('ArrowDown');st=await S();check('↓ selects the next body part (left arm)',st.ui.row===1&&/LEFT ARM · FORMS THAT USE IT/i.test(st.ui.text),{row:st.ui.row});
await p.mouse.click(640,400);await p.waitForTimeout(200); // LMB on the STATUS page: confirm does nothing there
await p.evaluate(()=>loadoutInterface.debug.setBody('rightArm',100));
await key('KeyR');st=await S();await shot('p4_skills');
check('R: next page SKILLS lists Forms, uses and the incomplete Grip Reversal',st.ui.open==='skills'&&/Tempo Jab/.test(st.ui.text)&&/Grip Reversal/.test(st.ui.text)&&st.interface.formUses.tempo>=1,{uses:st.interface.formUses});
await key('KeyR');st=await S();await shot('p4_loadouts');
check('LOADOUTS shows the Build Deck (3 presets + locked Rescue)',st.ui.open==='loadouts'&&/COUNTER \/ BOX/.test(st.ui.text)&&/GRAPPLE \/ CONTROL/.test(st.ui.text)&&/PURSUIT/.test(st.ui.text)&&/RESCUE/.test(st.ui.text),{});
await key('Enter');st=await S();
check('Enter on socket 1: next Form, swapped with its old socket',JSON.stringify(st.interface.deck[0])===JSON.stringify(['tempo','slip','cross','feint']),{deck:st.interface.deck[0]});
check('LMB on a page does not throw a strike',(await p.evaluate(()=>backspoolCombatState().sequence||0))===attack0,{});
await key('Tab');st=await S();check('Tab closes the Interface',st.ui.open===null&&!st.ui.visible,{open:st.ui.open});
await key('Digit1');await p.waitForTimeout(250);st=await S();check('the edited deck is what 1 performs now (Tempo Jab)',st.form?.id==='tempo',{form:st.form?.id});
await p.waitForTimeout(1400);
await key('Tab');await key('Digit3');for(let i=0;i<4;i++)await key('ArrowDown');await key('ArrowRight');await key('Enter');await p.waitForTimeout(1100);st=await S();
check('LOADOUTS · EQUIP on GRAPPLE / CONTROL performs a real hotswap',st.loadout==='grapple',{loadout:st.loadout});
await key('Backspace');st=await S();check('Backspace goes back to the wheel',st.ui.open==='wheel',{open:st.ui.open});
await key('Digit4');st=await S();await shot('p4_inventory');check('INVENTORY shows the belt sockets with the baton in 01',st.ui.open==='inventory'&&/BATON · SOCKET 01/.test(st.ui.text)&&/C1/.test(st.ui.text),{});
await key('Enter');st=await S();check('Enter draws the registered baton',st.baton.out,{baton:st.baton.out});await key('Enter');
await p.evaluate(()=>{loadoutInterface.debug.breakBaton();loadoutInterface.debug.setCredits(40);}); // SETUP: a broken baton and 40 credits
await key('Backspace');await key('Digit6');await key('Enter');st=await S();await shot('p4_shop');
check('SHOP · field repair spends 30 CR and restores the real baton',st.interface.credits===10&&!st.baton.broken&&st.baton.durability===12,{credits:st.interface.credits,baton:st.baton});
await key('Enter');st=await S();check('a second repair is refused (already full)',st.interface.credits===10,{credits:st.interface.credits});
await key('ArrowDown');await key('Enter');st=await S();check('blueprints cannot be bought (credits unchanged)',st.interface.credits===10&&/not available in this build/.test(st.ui.text),{});
await key('Backspace');await key('Digit5');st=await S();check('QUESTS with nothing active says so',st.ui.open==='quests'&&/No active Quest/.test(st.ui.text),{});
await key('Backspace');await key('Digit7');st=await S();await shot('p4_titles');
check('TITLES: HOTSWAP active, OUTCLASSED shown as not active, INDEXED locked',/HOTSWAP/.test(st.ui.text)&&/OUTCLASSED/.test(st.ui.text)&&/NOT ACTIVE/.test(st.ui.text)&&/INDEXED/.test(st.ui.text)&&st.interface.activeTitle==='hotswap',{earned:st.interface.earned});
await key('ArrowDown');await key('Enter');st=await S();check('an unearned Title cannot be made active',st.interface.activeTitle==='hotswap',{active:st.interface.activeTitle});
await key('Backspace');await key('Digit8');for(let i=0;i<4;i++)await key('ArrowDown');st=await S();await shot('p4_records');
check('RECORDS · EVENT LOG holds the Build Deck and Shop events',/Build Deck/.test(st.ui.text)&&/baton repaired/.test(st.ui.text),{});
await key('Tab');
// encounter: the world keeps running behind the Interface; the deck locks; Analyze records techniques
await key('t');await p.waitForFunction(()=>loadoutInterface.state().encounter?.outcome==='active',null,{timeout:120000});await p.waitForTimeout(400);
await p.mouse.down({button:'right'});await p.waitForTimeout(6000);await p.mouse.up({button:'right'});st=await S();
check('techniques observed while analyzing are recorded',Object.values(st.interface.observed).reduce((a,c)=>a+c,0)>0,{observed:st.interface.observed});
const c0=st.encounter.clock;await key('Tab');await p.waitForTimeout(800);st=await S();
check('enemies are not paused while the Interface is open (and the hint says so)',st.encounter.clock>c0+.5&&/ENEMIES ARE NOT PAUSED/.test(st.ui.text),{clock0:c0,clock:st.encounter.clock});
const d0=JSON.stringify(st.interface.deck);await key('Digit3');await key('Enter');st=await S();
check('Build Deck is locked during an active encounter',JSON.stringify(st.interface.deck)===d0&&/Deck locked/.test(st.ui.text),{});
await key('Backspace');await key('Digit8');st=await S();check('RECORDS lists observed techniques',/OBSERVED TECHNIQUES/.test(st.ui.text)&&/×\d/.test(st.ui.text),{});
await p.keyboard.press('Escape');await p.waitForTimeout(300);st=await S();check('Esc closes the Interface (and pauses the game as usual)',st.ui.open===null,{open:st.ui.open,gameActive:await p.evaluate(()=>gameActive)});
// isolation: Backspool's Tab is his own again
await p.evaluate(()=>{if(gameActive)pauseGame();});await p.click('#v02Tab-hero');await p.waitForTimeout(300);await p.selectOption('#characterChoice','backspool');
await p.waitForFunction(()=>characterState().hero==='backspool'&&!characterState().busy,null,{timeout:300000});await p.click('#v02Tab-overview');await p.click('#v02Start');await p.waitForFunction(()=>gameActive,null,{timeout:10000});await p.waitForTimeout(500);
await key('Tab');st=await S();check('as Backspool, Tab does not open Loadout’s Interface',st.ui.open===null&&!st.ui.visible,{open:st.ui.open});
const keyboardFinal=await S();await p.close();
// ---- gamepad ----
p=await boot(b,true);
const btn=(i,v)=>p.evaluate(([i,v])=>__vp.set(i,v),[i,v]);const tap=async(i,ms=120)=>{await btn(i,1);await p.waitForTimeout(ms);await btn(i,0);await p.waitForTimeout(150);};
const axis=(i,v)=>p.evaluate(([i,v])=>__vp.axis(i,v),[i,v]);
const B={A:0,B:1,X:2,Y:3,LB:4,RB:5,LT:6,RT:7,View:8,Start:9,L3:10,R3:11,Up:12,Down:13,Left:14,Right:15};
await tap(B.View);st=await S();await shot('p4_pad_wheel');check('pad: View tap opens the Core Wheel',st.ui.open==='wheel'&&st.ui.visible,{open:st.ui.open});
check('pad: the wheel shows pad hints',/A open/.test(st.ui.text),{});
await axis(0,.95);await p.waitForTimeout(200);st=await S();check('pad: left stick right points at LOADOUTS',st.ui.sel===2,{sel:st.ui.sel});await axis(0,0);await p.waitForTimeout(100);
const q0=await pos();await axis(1,-.95);await p.waitForTimeout(800);await axis(1,0);await p.waitForTimeout(150);const q1=await pos();
check('pad: the stick does not move Loadout while the Interface is open',dist(q0,q1)<.05,{moved:+dist(q0,q1).toFixed(3)});
st=await S();const sel=st.ui.sel;await tap(B.A);st=await S();check('pad: A opens the selected page',st.ui.open===['status','skills','loadouts','inventory','quests','shop','titles','records'][sel],{open:st.ui.open,sel});
await tap(B.RB);st=await S();check('pad: RB next page',st.ui.open===['status','skills','loadouts','inventory','quests','shop','titles','records'][(sel+1)%8],{open:st.ui.open});
await tap(B.LB);st=await S();check('pad: LB previous page',st.ui.open===['status','skills','loadouts','inventory','quests','shop','titles','records'][sel],{open:st.ui.open});
await tap(B.Down);st=await S();check('pad: D-down moves the selection',st.ui.row===1,{row:st.ui.row});
await tap(B.B);st=await S();check('pad: B goes back to the wheel',st.ui.open==='wheel',{open:st.ui.open});
const dodge0=await p.evaluate(()=>loadoutRunnerFull.state().action?.clip||'');await tap(B.B);await p.waitForTimeout(250);st=await S();
check('pad: B on the wheel closes it, and the held B does not leak into an evade',st.ui.open===null&&!/Esc_|Dodge|Roll/.test(await p.evaluate(()=>loadoutRunnerFull.state().action?.clip||'')),{open:st.ui.open,clip:await p.evaluate(()=>loadoutRunnerFull.state().action?.clip||null),before:dodge0});
await btn(B.LB,1);await p.waitForTimeout(100);await tap(B.View);await btn(B.LB,0);await p.waitForTimeout(150);st=await S();check('pad: View with another button held does not open it',st.ui.open===null,{open:st.ui.open});
await tap(B.View);await tap(B.View);await p.waitForTimeout(300);st=await S();check('pad: View tap closes it and it stays closed',st.ui.open===null,{open:st.ui.open});
check('no page errors',errors.length===0,errors.slice(0,5));
require('fs').writeFileSync(OUT+'/loadout_interface_p4_results.json',JSON.stringify({build:BUILD,date:new Date().toISOString(),results,keyboardFinal,padFinal:await S()},null,1));
console.log(results.filter(r=>r.result==='PASS').length+'/'+results.length+' PASS');
await b.close();})();
