// Loadout Interface phase 5: the OUTCLASSED Condition and witness memory, with real keyboard / mouse input. Calls to
// loadoutInterface.debug.* are labelled SETUP: they shorten a fight (low HP) or force one slow attack to counter into.
// Usage: node test_loadout_interface_p5.cjs <build.html> <outDir>
const {chromium}=require('/opt/homebrew/lib/node_modules/playwright');const BUILD=process.argv[2],OUT=process.argv[3];
const results=[];const check=(name,ok,info)=>{results.push({name,result:ok?'PASS':'FAIL',info});console.log((ok?'PASS ':'FAIL ')+name+(info!==undefined?' · '+JSON.stringify(info).slice(0,320):''));};
(async()=>{const b=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal','--mute-audio']});const p=await b.newPage({viewport:{width:1280,height:800}});
const errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.addInitScript(()=>{try{localStorage.setItem('sightlineCharacter','sightline');localStorage.removeItem('loadoutInterfaceV1');localStorage.removeItem('loadoutInterfaceV4');}catch(e){}
 Object.defineProperty(navigator,'getGamepads',{value:()=>[]});}); // SETUP: hide the drifting controller attached to the test machine
await p.goto('http://127.0.0.1:8768/'+BUILD);
await p.waitForFunction(()=>typeof gameReady!=='undefined'&&gameReady&&window.characterState&&!characterState().busy&&window.loadoutInterface,null,{timeout:300000});
await p.click('#v02Tab-hero');await p.waitForTimeout(300);await p.selectOption('#characterChoice','loadout');
await p.waitForFunction(()=>characterState().hero==='loadout'&&!characterState().busy&&window.loadoutRunnerFull?.state?.().ready,null,{timeout:300000});
await p.click('#v02Tab-overview');await p.click('#v02Start');await p.waitForFunction(()=>gameActive,null,{timeout:10000});await p.waitForTimeout(800);
const S=()=>p.evaluate(()=>loadoutInterface.state());const shot=n=>p.screenshot({path:OUT+'/'+n+'.png'});
const key=async(k,ms=60)=>{await p.keyboard.down(k);await p.waitForTimeout(ms);await p.keyboard.up(k);await p.waitForTimeout(140);};
const start=async()=>{await key('t');await p.waitForFunction(()=>loadoutInterface.state().encounter?.outcome==='active',null,{timeout:120000});await p.waitForTimeout(500);};
let st;
await start();st=await S();
check('the encounter has 3 spectators, at least 2 able to see the fight',st.witnesses.length===3&&st.witnessesPresent>=2,{w:st.witnesses.length,present:st.witnessesPresent});
check('no Condition before any loss',!st.condition&&!st.outclassedOn,{});
// ---- lose in front of them (no input: he just takes the hits) ----
await p.evaluate(()=>loadoutInterface.debug.setHp(14)); // SETUP: shorten the fight
await p.waitForFunction(()=>loadoutInterface.state().encounter?.outcome==='LOADOUT down',null,{timeout:60000});await p.waitForTimeout(400);st=await S();await shot('p5_defeat_witnesses');
check('going down with witnesses watching gains OUTCLASSED',st.condition?.id==='outclassed'&&st.condition.pressure>=50,{condition:st.condition});
check('each present witness gives an account (insult / agreement; no dispute without a counter)',st.accounts.length>=2&&st.accounts.some(a=>a.kind==='insult')&&!st.accounts.some(a=>a.kind==='dispute'),{accounts:st.accounts.map(a=>a.kind+': '+a.text)});
check('their words are shown over them in the world',await p.evaluate(()=>[...document.querySelectorAll('.loWit')].some(d=>!d.hidden&&/training dummy|Outclassed/.test(d.textContent))),{});
// ---- next fight: the Interface exaggerates ----
await start();st=await S();check('the next encounter starts with OUTCLASSED active',st.outclassedOn,{});
await p.mouse.down({button:'right'});
await p.evaluate(()=>loadoutInterface.debug.forceAttack('overhead')); // SETUP: a slow attack to look at
await p.waitForFunction(()=>loadoutInterface.state().encounter.construct.phase==='windup',null,{timeout:5000});await p.waitForTimeout(250);
const look=await p.evaluate(()=>({labels:[...document.querySelectorAll('.loGl')].filter(d=>!d.hidden).map(d=>d.textContent),bracket:getComputedStyle(document.querySelector('.loBr')).borderTopColor,tag:document.getElementById('loTag').textContent,veil:!document.getElementById('loOcVeil').hidden,esc:!document.getElementById('loEsc').hidden}));
await shot('p5_outclassed_analyze');
check('Ghost Builds show inflated success (≥ 88%) on the attack it fears',look.labels.some(l=>/SUCCESS (8[89]|9\d)%/.test(l)),look.labels);
check('threat bracket is red and the tag says OVERWHELMING / counter window UNCERTAIN',/255, 95, 69/.test(look.bracket)&&/OVERWHELMING/.test(look.tag)&&/UNCERTAIN/.test(look.tag),{bracket:look.bracket});
check('red vignette and an amber ESCAPE ROUTE are shown',look.veil&&look.esc,{veil:look.veil,esc:look.esc});
await p.mouse.up({button:'right'});await p.waitForTimeout(1500);
// real attacks unchanged: an unguarded jab still does exactly its damage (7)
let jab=null;for(let i=0;i<4&&jab===null;i++){await p.waitForFunction(()=>['ready','recover'].includes(loadoutInterface.state().encounter.construct.phase),null,{timeout:8000}).catch(()=>{});
 const h0=(await S()).hp;await p.evaluate(()=>loadoutInterface.debug.forceAttack('jab')); // SETUP: one known attack
 await p.waitForFunction(()=>['strike','whiff','recover'].includes(loadoutInterface.state().encounter.construct.phase),null,{timeout:4000}).catch(()=>{});await p.waitForTimeout(120);
 const s2=await S();const last=s2.log.filter(l=>/Hit · Lead jab/.test(l.text)).pop();if(last)jab={delta:+(h0-s2.hp).toFixed(1),text:last.text};await p.waitForTimeout(1200);}
check('the opponent’s real attacks are unchanged (lead jab still −7 HP)',jab&&/−7 HP/.test(jab.text),jab);
// Titles page shows it active
await key('Tab');await key('Digit7');st=await S();check('TITLES shows OUTCLASSED as ACTIVE with its pressure',/OUTCLASSED/.test(st.ui.text)&&/ACTIVE · pressure \d+%/.test(st.ui.text),{});
await key('Backspace');await key('Digit8');for(let i=0;i<5;i++)await key('ArrowDown');st=await S();await shot('p5_records_accounts');
check('RECORDS · WITNESS ACCOUNTS keeps what they said',/WITNESS ACCOUNTS/.test(st.ui.text)&&/training dummy/.test(st.ui.text),{});
await key('Tab');
// ---- a win without contradictions reads as luck ----
const press0=(await S()).condition.pressure;await p.evaluate(()=>{loadoutInterface.debug.setHp(100);loadoutInterface.debug.setConstructHp(6);}); // SETUP: end the fight quickly
for(let i=0;i<8&&(await S()).encounter.outcome==='active';i++){await key('Digit2');await p.waitForTimeout(1300);}
st=await S();check('win without contradictions: OUTCLASSED persists, pressure drops',st.encounter.outcome==='construct down'&&st.condition&&st.condition.pressure<press0&&/reads as luck/.test(st.log.map(l=>l.text).join('|')),{outcome:st.encounter.outcome,pressure:[press0,st.condition?.pressure]});
// ---- contradict it 3 times, then win in front of them ----
await start();
for(let i=0;i<10&&((await S()).condition?.contradictions||0)<3;i++){
 await p.waitForFunction(()=>['ready','recover'].includes(loadoutInterface.state().encounter.construct.phase),null,{timeout:8000}).catch(()=>{});
 await p.evaluate(()=>{loadoutInterface.debug.setHp(100);loadoutInterface.debug.forceAttack('overhead');}); // SETUP: a slow attack to counter into
 await p.waitForFunction(()=>loadoutInterface.state().encounter.construct.phase==='windup',null,{timeout:5000}).catch(()=>{});
 await p.waitForTimeout(450);await key('Digit1');await p.waitForTimeout(1500);}
st=await S();check('3 counters while OUTCLASSED are logged as PREDICTION CONTRADICTED',st.condition?.contradictions===3&&/PREDICTION CONTRADICTED/.test(st.log.map(l=>l.text).join('|')),{contradictions:st.condition?.contradictions});
const xp0=st.xp;await p.evaluate(()=>loadoutInterface.debug.setConstructHp(6)); // SETUP: end the fight quickly
for(let i=0;i<8&&(await S()).encounter.outcome==='active';i++){await p.waitForTimeout(400);await key('Digit2');await p.waitForTimeout(1200);}
await p.waitForTimeout(300);st=await S();await shot('p5_cleared');
check('a win seen by witnesses after the contradictions clears OUTCLASSED',st.encounter.outcome==='construct down'&&!st.condition&&!st.outclassedOn,{outcome:st.encounter.outcome,condition:st.condition});
check('the witnesses revise their accounts',st.accounts.filter(a=>a.kind==='revise').length>=2,{accounts:st.accounts.slice(0,3).map(a=>a.text)});
check('clearing it is a significant achievement (+XP)',st.xp>xp0||st.level>11,{xp:[xp0,st.xp]});
check('the HUD no longer shows the Condition',!/CONDITION · OUTCLASSED/.test(await p.evaluate(()=>document.getElementById('loForms').textContent)),{});
check('no page errors',errors.length===0,errors.slice(0,5));
require('fs').writeFileSync(OUT+'/loadout_interface_p5_results.json',JSON.stringify({build:BUILD,date:new Date().toISOString(),results,final:await S()},null,1));
console.log(results.filter(r=>r.result==='PASS').length+'/'+results.length+' PASS');
await b.close();})();
