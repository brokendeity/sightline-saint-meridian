// Loadout Interface phase 6: the full belt Inventory, with real keyboard / mouse input and then a virtual gamepad.
// SETUP calls (labelled): facing a wall for the grapnel, stringing a cable across the construct's path, teleports next
// to the rescue cutter / trapped worker, an injured arm, credits, a forced attack. Everything else is real input.
// Usage: node test_loadout_interface_p6.cjs <build.html> <outDir>
const {chromium}=require('/opt/homebrew/lib/node_modules/playwright');const BUILD=process.argv[2],OUT=process.argv[3];
const results=[];const check=(name,ok,info)=>{results.push({name,result:ok?'PASS':'FAIL',info});console.log((ok?'PASS ':'FAIL ')+name+(info!==undefined?' · '+JSON.stringify(info).slice(0,300):''));};
const errors=[];
(async()=>{const b=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal','--mute-audio']});const ctx=await b.newContext({viewport:{width:1280,height:800}});
async function boot(opts){const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(o=>{try{localStorage.setItem('sightlineCharacter','sightline');if(!o.keep){localStorage.removeItem('loadoutInterfaceV1');localStorage.removeItem('loadoutInterfaceV4');}}catch(e){}
  if(o.pad){const g={id:'Virtual test pad (standard)',index:0,connected:true,mapping:'standard',timestamp:0,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,touched:false,value:0}))};
   window.__vp={set(i,v){g.buttons[i]={pressed:!!v,touched:!!v,value:v?1:0};g.timestamp++;},axis(i,v){g.axes[i]=v;g.timestamp++;}};Object.defineProperty(navigator,'getGamepads',{value:()=>[g]});}
  else Object.defineProperty(navigator,'getGamepads',{value:()=>[]}); // SETUP: hide the drifting controller attached to the test machine
 },opts);
 await p.goto('http://127.0.0.1:8768/'+BUILD);
 await p.waitForFunction(()=>typeof gameReady!=='undefined'&&gameReady&&window.characterState&&!characterState().busy&&window.loadoutInterface,null,{timeout:300000});
 await p.click('#v02Tab-hero');await p.waitForTimeout(300);await p.selectOption('#characterChoice','loadout');
 await p.waitForFunction(()=>characterState().hero==='loadout'&&!characterState().busy&&window.loadoutRunnerFull?.state?.().ready,null,{timeout:300000});
 await p.click('#v02Tab-overview');await p.click('#v02Start');await p.waitForFunction(()=>gameActive,null,{timeout:10000});await p.waitForTimeout(900);return p;}
let p=await boot({});
const S=()=>p.evaluate(()=>loadoutInterface.state());const shot=n=>p.screenshot({path:OUT+'/'+n+'.png'});
const key=async(k,ms=60)=>{await p.keyboard.down(k);await p.waitForTimeout(ms);await p.keyboard.up(k);await p.waitForTimeout(160);};
const D=(a,c)=>Math.hypot(a[0]-c[0],a[2]-c[2]);const pos=()=>p.evaluate(()=>s.pos.toArray());
let st;
// ---- quick retrieval (tap) ----
check('HUD shows the selected socket (01 BATON) and how to use it',await p.evaluate(()=>/01 BATON/.test(document.getElementById('loGear').textContent)&&/HOLD BELT/.test(document.getElementById('loGear').textContent)),await p.evaluate(()=>document.getElementById('loGear').textContent));
await key('KeyX');st=await S();check('X tap: quick retrieval draws the selected baton',st.baton.out,{baton:st.baton.out});await p.waitForTimeout(500);await key('KeyX');st=await S();check('X tap again stows it',!st.baton.out,{});
await p.waitForTimeout(500);
// ---- the carousel (hold) ----
const cam0=await p.evaluate(()=>camera.position.distanceTo(s.pos));const p0=await pos();
await p.keyboard.down('KeyX');await p.waitForTimeout(700);st=await S();
const cam1=await p.evaluate(()=>camera.position.distanceTo(s.pos));
check('X hold: the belt carousel opens and the camera lowers to his waist',st.inv.open&&st.inv.blend>.8&&cam1<cam0-.8&&cam1<2.6,{open:st.inv.open,blend:st.inv.blend,cam:[+cam0.toFixed(2),+cam1.toFixed(2)]});
check('7 sockets are shown around the belt with their state',await p.evaluate(()=>{const t=[...document.querySelectorAll('#loBelt .t')];return t.length===7&&/GRAPNEL/i.test(t[1].textContent)&&/DOSES/.test(t[2].textContent)&&/LEFT/.test(t[5].textContent);}),{});
await p.keyboard.down('KeyW');await p.waitForTimeout(500);await p.keyboard.up('KeyW');const p1=await pos();check('W while the carousel is open does not move him',D(p0,p1)<.05,{moved:+D(p0,p1).toFixed(3)});
await key('KeyD');await key('KeyD');st=await S();check('D steps the selection (→ 03 medical kit)',st.inv.selected==='medkit',{sel:st.inv.selected});await shot('p6_carousel');
await p.mouse.down({button:'right'});await p.mouse.up({button:'right'});await p.keyboard.up('KeyX');await p.waitForTimeout(400);st=await S();
check('RMB cancels: closed, nothing used',!st.inv.open&&st.inv.med===4&&!st.inv.act,{med:st.inv.med});
const cam2=await p.evaluate(()=>camera.position.distanceTo(s.pos));check('the camera returns after closing',cam2>cam0-.6,{cam:+cam2.toFixed(2)});
// ---- grapnel: fire, persists, recover ----
const face=await p.evaluate(()=>loadoutInterface.debug.faceAnchor());// SETUP: face the nearest wall
await p.keyboard.down('KeyX');await p.waitForTimeout(500);await key('KeyA');await p.keyboard.up('KeyX');await p.waitForTimeout(900);st=await S();await shot('p6_grapnel');
check('grapnel fires at a wall: the cable is strung and stays (HUD says DEPLOYED)',st.inv.grapnel.state==='deployed'&&st.inv.cable&&await p.evaluate(()=>/GRAPNEL DEPLOYED/.test(document.getElementById('loGear').textContent)),{face,grapnel:st.inv.grapnel});
await key('KeyX');await p.waitForTimeout(1500);st=await S();check('standing at the spool, X reels it back in (1.2 s)',st.inv.grapnel.state==='stowed'&&!st.inv.cable,{grapnel:st.inv.grapnel.state});
await key('KeyX');await p.waitForTimeout(900);st=await S();const anch=st.inv.grapnel.state==='deployed';
await p.keyboard.down('KeyS');await p.waitForTimeout(1600);await p.keyboard.up('KeyS');await p.waitForTimeout(300);
await key('KeyX');st=await S();check('away from the spool it cannot be recovered: the cable stays connected',anch&&st.inv.grapnel.state==='deployed'&&/walk to the spool/.test(st.log.map(l=>l.text).join('|')),{anch,state:st.inv.grapnel.state});
// ---- the sparring encounter: trip line, smoke, medical kit, carousel slow-down ----
await key('t');await p.waitForFunction(()=>loadoutInterface.state().encounter?.outcome==='active',null,{timeout:120000});await p.waitForTimeout(300);
await p.evaluate(()=>{const c=loadoutInterface.state().encounter.construct.pos,me=s.pos;const mx=(c[0]+me.x)/2,mz=(c[2]+me.z)/2,dx=c[0]-me.x,dz=c[2]-me.z,l=Math.hypot(dx,dz),px=-dz/l,pz=dx/l,y=me.y-.42;
 loadoutInterface.debug.stringCable([mx+px*3,y+.9,mz+pz*3],[mx-px*3,y+.05,mz-pz*3]);}); // SETUP: a cable across the construct's path
await p.waitForFunction(()=>/TRIP LINE/.test(loadoutInterface.state().log.map(l=>l.text).join('|')),null,{timeout:15000}).catch(()=>{});st=await S();
check('the construct walking through the low cable trips and goes down',/TRIP LINE/.test(st.log.map(l=>l.text).join('|')),{phase:st.encounter.construct.phase,down:st.encounter.construct.down});
await p.waitForTimeout(4200);st=await S();
check('it trips only once on the same cable (then steps over it)',st.log.map(l=>l.text).filter(t=>/TRIP LINE/.test(t)).length===1,{trips:st.log.map(l=>l.text).filter(t=>/TRIP LINE|steps over/.test(t))});
// carousel slows only the construct
const a0=await S();await p.keyboard.down('KeyX');await p.waitForTimeout(400);const a1=await S();await p.waitForTimeout(1000);const a2=await S();
const ratio=(a2.inv.simT-a1.inv.simT)/(a2.encounter.clock-a1.encounter.clock);check('while the carousel is open the construct runs at half speed (the world clock does not)',Math.abs(ratio-.5)<.08,{ratio:+ratio.toFixed(3)});
for(let i=0;i<8&&(await S()).inv.selected!=='smoke';i++)await key('KeyD');await p.keyboard.up('KeyX');await p.waitForTimeout(800);st=await S();await shot('p6_smoke');
check('releasing on C1 throws a smoke capsule (2 → 1) and the cloud blinds the construct',st.inv.smoke===1&&st.inv.clouds===1&&st.inv.constructBlinded,{smoke:st.inv.smoke,clouds:st.inv.clouds,blind:st.inv.constructBlinded});
await p.waitForTimeout(300);let windups=0;for(let i=0;i<20;i++){const ph=(await S()).encounter.construct.phase;if(ph==='windup')windups++;await p.waitForTimeout(150);}
check('inside the smoke it starts no attack',windups===0,{windups});
await p.waitForTimeout(3500);
// medical kit: interrupted by a hit (no dose used), then completed
await p.evaluate(()=>loadoutInterface.debug.setBody('rightArm',60)); // SETUP: an injured arm
await p.keyboard.down('KeyX');await p.waitForTimeout(450);for(let i=0;i<8&&(await S()).inv.selected!=='medkit';i++)await key('KeyA');await p.keyboard.up('KeyX');await p.waitForTimeout(150);
await p.evaluate(()=>{const c=loadoutInterface.state().encounter.construct.pos;const dx=s.pos.x-c[0],dz=s.pos.z-c[2],l=Math.hypot(dx,dz)||1;s.pos.set(c[0]+dx/l*1.6,s.pos.y,c[2]+dz/l*1.6);loadoutInterface.debug.forceAttack('jab');}); // SETUP: in reach, and a hit during the treatment
await p.waitForTimeout(1600);st=await S();check('a hit interrupts the treatment and no dose is used',st.inv.med===4&&/Treatment interrupted/.test(st.log.map(l=>l.text).join('|')),{med:st.inv.med,act:st.inv.act,log:st.log.slice(-6).map(l=>l.text),c:st.encounter.construct});
await p.waitForTimeout(1500);
const med0=(await S()).inv.med;let body0=null,done=false;for(let i=0;i<4&&!done;i++){await p.waitForFunction(()=>['recover','whiff','clinched'].includes(loadoutInterface.state().encounter.construct.phase)||loadoutInterface.state().encounter.construct.down>0||loadoutInterface.state().encounter.construct.dist>3,null,{timeout:8000}).catch(()=>{});
 await p.evaluate(()=>{const c=loadoutInterface.state().encounter.construct.pos;const dx=s.pos.x-c[0],dz=s.pos.z-c[2],l=Math.hypot(dx,dz)||1;const x=c[0]+dx/l*16,z=c[2]+dz/l*16;s.pos.set(x,s.pos.y,z);}); // SETUP: out of the construct's 12 m leash, so nothing interrupts
 await p.waitForTimeout(300);body0=(await S()).body;await key('KeyX');await p.waitForTimeout(2700);st=await S();done=st.inv.med===med0-1;}
const worst=Object.keys(body0).reduce((a,b)=>body0[a]<=body0[b]?a:b);check('an uninterrupted treatment uses one dose and treats the worst part (+25)',st.inv.med===med0-1&&st.log.some(l=>new RegExp('Treated · Right forearm '+Math.round(body0[worst])+'% → '+Math.min(100,Math.round(body0[worst]+25))+'%').test(l.text)),{med:[med0,st.inv.med],worst,before:body0[worst],log:st.log.filter(l=>/Treated/.test(l.text)).map(l=>l.text)});
// ---- rescue cutter: found, carried, registered by use ----
st=await S();check('the rescue cutter lies near the trapped worker (located, not registered)',st.inv.cutter.state==='field'&&!!st.inv.fieldCutter,{cutter:st.inv.cutter});
await p.evaluate(()=>{const c=loadoutInterface.state().inv.fieldCutter;s.pos.set(c[0]+.6,s.pos.y,c[2]);}); // SETUP: next to it
await p.waitForTimeout(200);await key('KeyI');st=await S();check('I picks it up: carried in hand, not registered',st.inv.cutter.state==='carried',{cutter:st.inv.cutter});
await p.keyboard.down('KeyX');await p.waitForTimeout(450);for(let i=0;i<8&&(await S()).inv.selected!=='baton';i++)await key('KeyA');await p.keyboard.up('KeyX');await p.waitForTimeout(300);st=await S();check('with the cutter in hand the baton cannot be drawn (hands full)',!st.baton.out&&/hands full/.test(st.log.map(l=>l.text).join('|')),{baton:st.baton.out});
async function rescue(){await p.waitForFunction(()=>loadoutInterface.state().encounter?.worker.heard,null,{timeout:15000});
 const wpos=await p.evaluate(()=>{let w=null;scene.traverse(o=>{if(!w&&o.children?.some(c=>c.geometry?.type==='RingGeometry'&&c.material?.color?.getHex?.()===0xffb43c))w=o;});return w?w.position.toArray():null;});
 await p.evaluate(w=>{s.pos.set(w[0]+.9,s.pos.y,w[2]);},wpos); // SETUP: next to the trapped worker
 await p.waitForTimeout(150);const t0=Date.now();await p.keyboard.down('KeyI');await p.waitForFunction(()=>loadoutInterface.state().encounter.worker.freed,null,{timeout:5000}).catch(()=>{});const ms=Date.now()-t0;await p.keyboard.up('KeyI');return ms;}
const ms1=await rescue();st=await S();check('carried, it frees the worker faster (< 1.2 s; 1.5 s without) and counts 1/2',st.encounter.worker.freed&&ms1<1200&&st.inv.cutter.rescues===1,{ms:ms1,rescues:st.inv.cutter.rescues,worker:st.encounter.worker,outcome:st.encounter.outcome,hp:st.hp,ui:st.ui.open,inv:st.inv.open});
await key('t');await p.waitForFunction(()=>loadoutInterface.state().encounter?.outcome==='active'&&!loadoutInterface.state().encounter.worker.freed,null,{timeout:60000});
st=await S();check('the unregistered cutter is still carried in the next encounter (no new one is placed)',st.inv.cutter.state==='carried'&&!st.inv.fieldCutter,{cutter:st.inv.cutter.state});
await rescue();await p.waitForTimeout(300);st=await S();await shot('p6_registered');
check('a second rescue with it registers it into socket 04',st.inv.cutter.state==='registered'&&!st.inv.cutter.out&&/REGISTERED · rescue cutter/.test(st.log.map(l=>l.text).join('|')),{cutter:st.inv.cutter});
await p.waitForTimeout(600);await p.keyboard.down('KeyX');await p.waitForTimeout(450);for(let i=0;i<8&&(await S()).inv.selected!=='cutter';i++)await key('KeyD');await p.keyboard.up('KeyX');await p.waitForTimeout(300);st=await S();check('now X retrieves it from socket 04',st.inv.cutter.out,{cutter:st.inv.cutter});
// ---- Interface pages ----
await p.evaluate(()=>loadoutInterface.debug.setCredits(100)); // SETUP: credits to spend
await key('Tab');await key('Digit6');await key('ArrowDown');await key('ArrowDown');await key('Enter');st=await S();
check('SHOP restocks a smoke capsule (bought, not made)',st.inv.smoke===2&&st.interface.credits===75,{smoke:st.inv.smoke,credits:st.interface.credits});
await key('ArrowDown');await key('Enter');st=await S();check('SHOP refills the medical kit to 4 doses',st.inv.med===4&&st.interface.credits===35,{med:st.inv.med});
await key('Backspace');await key('Digit4');st=await S();await shot('p6_inventory_page');
check('INVENTORY page shows all sockets with their real state',/GRAPNEL/.test(st.ui.text)&&/MEDICAL KIT/.test(st.ui.text)&&/RESCUE CUTTER/.test(st.ui.text)&&/SMOKE/.test(st.ui.text),{});
await key('Tab');
// leave the grapnel deployed for the persistence check
const g=await p.evaluate(()=>{const c=loadoutInterface.state().encounter.construct.pos;return [c[0]+4,c[1]+1,c[2]];});
await p.evaluate(g=>loadoutInterface.debug.stringCable(g,[s.pos.x,s.pos.y-.4,s.pos.z]),g); // SETUP: a deployed cable to persist
await p.waitForTimeout(500);await p.close();
// ---- reload: physical state persists; gamepad ----
p=await boot({keep:true,pad:true});
st=await S();check('after a reload the deployed cable, doses, capsules and registration persist',st.inv.grapnel.state==='deployed'&&st.inv.cable&&st.inv.med===4&&st.inv.smoke===2&&st.inv.cutter.state==='registered',{inv:{g:st.inv.grapnel.state,cable:st.inv.cable,med:st.inv.med,smoke:st.inv.smoke,cutter:st.inv.cutter.state}});
const btn=(i,v)=>p.evaluate(([i,v])=>__vp.set(i,v),[i,v]);const tap=async(i,ms=120)=>{await btn(i,1);await p.waitForTimeout(ms);await btn(i,0);await p.waitForTimeout(200);};
await btn(14,1);await p.waitForTimeout(600);st=await S();check('pad: hold D-left opens the carousel',st.inv.open,{});
const s0=st.inv.sel;await tap(5);st=await S();check('pad: RB steps the selection',st.inv.sel===(s0+1)%7,{sel:[s0,st.inv.sel]});
await tap(1);await btn(14,0);await p.waitForTimeout(300);st=await S();check('pad: B cancels without using anything (and D-left release does nothing)',!st.inv.open&&!st.inv.act,{});
await btn(14,1);await p.waitForTimeout(450);for(let i=0;i<8&&(await S()).inv.selected!=='cutter';i++)await tap(5);await btn(14,0);await p.waitForTimeout(150);st=await S();
check('pad: releasing D-left uses the selected item (cutter in / out of socket 04)',st.inv.selected==='cutter'&&st.inv.act==='cutter',{sel:st.inv.selected,act:st.inv.act,out:st.inv.cutter.out});
const o1=st.inv.cutter.out;await p.waitForTimeout(700);await tap(14);st=await S();check('pad: D-left tap uses it again (quick retrieval)',st.inv.cutter.out!==o1,{out:[o1,st.inv.cutter.out]});
check('no page errors',errors.length===0,errors.slice(0,5));
require('fs').writeFileSync(OUT+'/loadout_interface_p6_results.json',JSON.stringify({build:BUILD,date:new Date().toISOString(),results,final:await S()},null,1));
console.log(results.filter(r=>r.result==='PASS').length+'/'+results.length+' PASS');
await b.close();})();
