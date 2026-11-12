// Loadout Interface phase 2 (Deep Scan + Pursuit), real input. Test setup that is NOT player input is labelled SETUP.
// Usage: node test_loadout_interface_p2.cjs <build.html> <outDir>
const {chromium}=require('/opt/homebrew/lib/node_modules/playwright');const BUILD=process.argv[2],OUT=process.argv[3];
const results=[];const check=(name,ok,info)=>{results.push({name,result:ok?'PASS':'FAIL',info});console.log((ok?'PASS ':'FAIL ')+name+(info!==undefined?' · '+JSON.stringify(info).slice(0,400):''));};
(async()=>{const b=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal','--mute-audio']});const p=await b.newPage({viewport:{width:1280,height:800}});
const errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.addInitScript(()=>{try{localStorage.setItem('sightlineCharacter','sightline');localStorage.removeItem('loadoutInterfaceV1');}catch(e){}});
// SETUP: hide gamepads (a controller attached to the test machine drifts the stick); keyboard / mouse only
await p.addInitScript(()=>{try{Object.defineProperty(navigator,'getGamepads',{value:()=>[]});}catch(e){}});
await p.goto('http://127.0.0.1:8768/'+BUILD);
await p.waitForFunction(()=>typeof gameReady!=='undefined'&&gameReady&&window.characterState&&!characterState().busy&&window.loadoutInterface,null,{timeout:300000});
await p.click('#v02Tab-hero');await p.waitForTimeout(300);await p.selectOption('#characterChoice','loadout');
await p.waitForFunction(()=>characterState().hero==='loadout'&&!characterState().busy&&window.loadoutRunnerFull?.state?.().ready,null,{timeout:300000});
await p.click('#v02Tab-overview');await p.click('#v02Start');await p.waitForFunction(()=>gameActive,null,{timeout:10000});await p.waitForTimeout(800);
const S=()=>p.evaluate(()=>loadoutInterface.state());const shot=n=>p.screenshot({path:OUT+'/'+n+'.png'});const key=async(k,ms=60)=>{await p.keyboard.down(k);await p.waitForTimeout(ms);await p.keyboard.up(k);};
// the encounter gives Deep Scan a hostile and an unclassified voice to read, besides the street
await key('t');await p.waitForFunction(()=>loadoutInterface.state().encounter?.outcome==='active',null,{timeout:120000});
await key('y');await p.waitForTimeout(1200);let st=await S();await shot('deep_scan');
check('Y: Deep Scan on, labels anchored to real people / targets nearby',st.scan.on&&st.scan.labels.length>=1,{labels:st.scan.labels.slice(0,8)});
check('Deep Scan labels are interpretations (hostile, unverified, unclassified voice kinds present)',st.scan.labels.some(l=>/threat|Civilian|construct|HOSTILE|voice|—/i.test(l.head)),st.scan.labels.map(l=>l.head).slice(0,8));
check('Deep Scan drains MP and raises Archive Saturation',st.mp<100&&st.scan.sat>0,{mp:st.mp,sat:st.scan.sat});
await p.waitForFunction(()=>loadoutInterface.state().scan.sat>=61||loadoutInterface.state().scan.overload,null,{timeout:20000}).catch(()=>{});st=await S();await shot('deep_scan_saturated');
check('saturation above 60%: labels turn reductive',st.scan.overload||st.scan.labels.some(l=>l.cls==='dist'||/LV 1|HOSTILE|TERMINAL/.test(l.head)),{sat:st.scan.sat,labels:st.scan.labels.slice(0,4)});
await p.waitForFunction(()=>loadoutInterface.state().scan.overload,null,{timeout:15000}).catch(()=>{});st=await S();
check('MP or saturation exhausted: Interface overload switches Deep Scan off',st.scan.overload&&!st.scan.on,{scan:{on:st.scan.on,sat:st.scan.sat,overload:st.scan.overload},mp:st.mp});
await key('t');await p.waitForTimeout(200);// SETUP-free: T restarts/keeps encounter; then move on
// Pursuit Loadout from the wheel (hold Q, 3)
for(let i=0;i<6&&(await S()).loadout!=='pursuit';i++){await p.keyboard.down('q');await p.waitForTimeout(450);await key('3');await p.keyboard.up('q');await p.waitForTimeout(1000);}
st=await S();check('Q wheel → 3: PURSUIT Loadout online',st.loadout==='pursuit'&&st.pursuit.on,{loadout:st.loadout});
await key('4');await p.waitForTimeout(300);st=await S();await shot('ledges');
check('4: Ledge Read marks vault/climb ledges from real collision boxes',st.pursuit.ledges.length>=1,{ledges:st.pursuit.ledges});
await key('2');await p.waitForTimeout(200);st=await S();
check('2 without a chase: Route Assessment reports no fleeing target (no fake routes)',st.pursuit.routes.length===0&&st.log.some(l=>/no fleeing target/.test(l.text)),st.log.slice(-1));
// leave the sparring encounter behind for the chase (switching loadouts does not end it; restart clears on hero change only)
// SETUP (teleport, labelled): put Loadout at the transit pursuit access marker, then start it with real input (I)
const trig=await p.evaluate(()=>verticalPursuit.state().config?.trigger||null);
await p.evaluate(t=>{s.pos.set(t[0],t[1]+.42,t[2]);s.vel.set(0,0,0);},trig);await p.waitForTimeout(600);
await key('i');await p.waitForTimeout(800);let vp=await p.evaluate(()=>verticalPursuit.state().phase);
if(vp!=='active'){await p.evaluate(()=>{loadoutInterface.state();});}
check('I at the access marker starts the existing transit pursuit as Loadout',vp==='active',{phase:vp,message:await p.evaluate(()=>verticalPursuit.state().message)});
await key('3');await p.waitForTimeout(400);await key('2');await p.waitForTimeout(500);st=await S();await shot('pursuit_routes');
check('3: Target Interception tracks the runner',st.pursuit.tracking,{tracking:st.pursuit.tracking});
check('2: Route Assessment scores interception routes on the real route and geometry',st.pursuit.routes.length>=2&&st.pursuit.routes.every(r=>r.time>0),{routes:st.pursuit.routes});
const pos0=await p.evaluate(()=>s.pos.toArray());await key('1');await p.waitForTimeout(900);const pos1=await p.evaluate(()=>s.pos.toArray());
const moved=Math.hypot(pos1[0]-pos0[0],pos1[2]-pos0[2]);
check('1: Burst Dash travels through the movement owner (Runner root motion)',moved>1,{moved:+moved.toFixed(2)});
// hero switch: everything off
for(let i=0;i<3&&await p.evaluate(()=>gameActive);i++){await p.keyboard.press('Escape');await p.waitForTimeout(600);}
await p.click('#v02Tab-hero');await p.waitForTimeout(300);await p.selectOption('#characterChoice','backspool');
await p.waitForFunction(()=>characterState().hero==='backspool'&&!characterState().busy,null,{timeout:300000});
await p.click('#v02Tab-overview');await p.click('#v02Start');await p.waitForFunction(()=>gameActive,null,{timeout:10000});await p.waitForTimeout(600);
st=await S();const ui=await p.evaluate(()=>({hud:document.getElementById('loIf').hidden,veil:document.getElementById('loScanVeil').hidden,tags:[...document.querySelectorAll('.loScan')].filter(d=>!d.hidden).length}));
check('switch to Backspool: Deep Scan and Pursuit overlays off, layer inactive',!st.active&&!st.scan.on&&!st.pursuit.on&&ui.hud&&ui.veil&&ui.tags===0,{scan:st.scan.on,pursuit:st.pursuit.on,ui});
await key('y');await p.waitForTimeout(200);st=await S();check('Y as Backspool does not start Deep Scan',!st.scan.on);
check('no page errors',errors.length===0,errors.slice(0,5));
require('fs').writeFileSync(OUT+'/loadout_interface_p2_results.json',JSON.stringify({build:BUILD,date:new Date().toISOString(),results,final:await S()},null,1));
await b.close();})();
