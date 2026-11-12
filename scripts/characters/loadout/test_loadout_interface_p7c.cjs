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
// Phase 7: socket cards tied to the belt core, capsule view (calm) and combat arc (fight), arm reach with a contact moment, props in hand.
// Input is the keyboard only (X hold / tap, A D select, T to start the sparring encounter). debug.forceAttack is used once, labelled SETUP.
let p=await boot({});
const S=()=>p.evaluate(()=>loadoutInterface.state());const shot=n=>p.screenshot({path:OUT+'/'+n+'.png'});
const tapX=async()=>{await p.keyboard.down('KeyX');await p.waitForTimeout(40);await p.keyboard.up('KeyX');};
const sample=async(ms,every=30)=>{const out=[];const t0=Date.now();while(Date.now()-t0<ms){out.push((await S()).inv);await p.waitForTimeout(every);}return out;};
let st;
// ---- capsule view, outside a fight ----
const cam0=await p.evaluate(()=>camera.position.distanceTo(s.pos));
await p.keyboard.down('KeyX');await p.waitForTimeout(900);st=await S();await shot('01_belt_open');
const cam1=await p.evaluate(()=>camera.position.distanceTo(s.pos));
check('calm: holding X opens the belt (calm mode) and the camera stays over his shoulder',st.inv.open&&st.inv.mode==='capsule'&&Math.abs(cam1-cam0)<.15&&await p.evaluate(()=>{const f=new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion),d=s.pos.clone().sub(camera.position);return d.dot(f)>0&&new THREE.Vector3(Math.sin(s.yaw),0,Math.cos(s.yaw)).dot(f)!==0;}),{mode:st.inv.mode,cam:[+cam0.toFixed(2),+cam1.toFixed(2)]});
const onScreen=c=>c.x>20&&c.x<1260&&c.y>20&&c.y<780;
const clear=v=>{const B=v.body;return v.cards.every(c=>c.x-c.w/2>B.x1||c.x+c.w/2<B.x0||c.y+c.hp/2<B.y0||c.y-c.hp/2>B.y1);};
const whole=c=>c.x-c.w/2>0&&c.x+c.w/2<1280&&c.y-c.hp/2>0&&c.y+c.hp/2<800;
check('7 socket cards are whole on screen, on the ground ring, tied to the belt core',st.inv.cards.length===7&&st.inv.cards.every(whole)&&st.inv.tether&&st.inv.ring,{cards:st.inv.cards.map(c=>[c.x,c.y,c.w,c.hp]),ring:st.inv.ring});
check('every card stands in front of him (0.3 m or more ahead) and to the open side',st.inv.cards.every(c=>c.ahead>=.3&&c.side>=.4),st.inv.cards.map(c=>[c.ahead,c.side]));
check('no card covers the character on screen',clear(st.inv),{body:st.inv.body,cards:st.inv.cards.map(c=>[c.x-Math.round(c.w/2),c.x+Math.round(c.w/2)])});
check('the selected card (slot 01) is the largest',st.inv.cards[0].h>Math.max(...st.inv.cards.slice(1).map(c=>c.h))*1.1,st.inv.cards.map(c=>c.h));
await p.keyboard.press('KeyD');await p.waitForTimeout(700);st=await S();await shot('01b_rotated');
check('D rotates the ring: slot 02 is now the nearest and largest card, still clear of him',st.inv.selected==='grapnel'&&st.inv.cards[1].h>Math.max(...st.inv.cards.filter((c,i)=>i!==1).map(c=>c.h))*1.1&&clear(st.inv)&&st.inv.cards.every(whole),{sel:st.inv.selected,h:st.inv.cards.map(c=>c.h)});
check('detail panel, gear count and prompts are shown',await p.evaluate(()=>{const q=x=>document.querySelector('#loBelt '+x)?.textContent||'';return /GRAPNEL/i.test(q('.info b'))&&/CONDITION/i.test(q('.bar'))&&/REGISTERED GEAR\s*03 \/ 05/i.test(q('.count'))&&/ROTATE/i.test(q('.keys'))&&/CANCEL/i.test(q('.keys'));}),await p.evaluate(()=>[...document.querySelectorAll('#loBelt .info b,#loBelt .count,#loBelt .keys')].map(e=>e.textContent)));
check('the detail panel does not cover a card or the HUD panels',await p.evaluate(()=>{const R=e=>e.getBoundingClientRect(),hit=(a,b)=>!(a.right<b.left||a.left>b.right||a.bottom<b.top||a.top>b.bottom),I=R(document.querySelector('#loBelt .info')),C=R(document.querySelector('#loBelt .count'));const v=loadoutInterface.state().inv;
 return !v.cards.some(c=>hit(I,{left:c.x-c.w/2,right:c.x+c.w/2,top:c.y-c.hp/2,bottom:c.y+c.hp/2}))&&['loForms','loGear','loBars'].every(id=>{const e=document.getElementById(id);return !e||e.hidden||!e.getBoundingClientRect().height||(!hit(I,R(e))&&!hit(C,R(e)));});}),await p.evaluate(()=>{const r=document.querySelector('#loBelt .info').getBoundingClientRect();return [r.left,r.top,r.right,r.bottom].map(Math.round);}));
await p.keyboard.press('KeyA');await p.waitForTimeout(250);
// ---- release on the baton: reach, contact, in hand ----
await p.keyboard.up('KeyX');let tr=await sample(700);st=await S();await shot('02_baton_in_hand');
const peak=Math.max(...tr.map(v=>v.reach)),lc=st.inv.lastContact;
check('release: his right arm reaches for the socket (reach weight rises to ~1)',peak>.9,{peak});
check('at contact his hand is at the socket card (≤ 6 cm)',lc&&lc.item==='baton'&&lc.solved&&lc.handDist<=.06,lc);
check('the baton is in his hand only from contact on',st.baton.out&&st.inv.props.includes('baton')&&!tr[0].props.includes('baton'),{first:tr[0].props,end:st.inv.props});
check('HUD: in hand, condition and item capacity',await p.evaluate(()=>{const t=document.getElementById('loGear').textContent;return /IN HAND · BATON/i.test(t)&&/CONDITION \d+%/i.test(t)&&/ITEM CAPACITY · 3 \/ 5/i.test(t);}),await p.evaluate(()=>document.getElementById('loGear').textContent));
check('HUD panels do not overlap (gear below the HP bars)',await p.evaluate(()=>{const a=document.getElementById('loBars').getBoundingClientRect(),b=document.getElementById('loGear').getBoundingClientRect();return b.top>=a.bottom-1;}),await p.evaluate(()=>[document.getElementById('loBars').getBoundingClientRect().bottom,document.getElementById('loGear').getBoundingClientRect().top]));
await p.waitForTimeout(400);await tapX();await p.waitForTimeout(800);st=await S();check('tap X stows the baton again',!st.baton.out&&!st.inv.props.includes('baton'),{out:st.baton.out,props:st.inv.props});
// ---- medical kit: a prop appears in his hand at contact ----
await p.keyboard.down('KeyX');await p.waitForTimeout(500);await p.keyboard.press('KeyD');await p.keyboard.press('KeyD');await p.waitForTimeout(200);await p.keyboard.up('KeyX');
tr=await sample(900);await shot('03_medkit');
check('medical kit: reach then the kit is in his hand',tr.some(v=>v.props.includes('medkit'))&&tr.some(v=>v.reach>.9)&&!tr[0].props.includes('medkit'),{peak:Math.max(...tr.map(v=>v.reach)),seen:tr.some(v=>v.props.includes('medkit'))});
await p.waitForTimeout(3000);
// ---- combat arc, inside a fight ----
await p.keyboard.press('KeyT');await p.waitForFunction(()=>loadoutInterface.state().encounter?.outcome==='active',null,{timeout:20000});await p.waitForTimeout(600);
const camF0=await p.evaluate(()=>camera.position.distanceTo(s.pos));
await p.keyboard.down('KeyX');await p.waitForTimeout(900);st=await S();await shot('04_combat_arc');
const camF1=await p.evaluate(()=>camera.position.distanceTo(s.pos));
check('fight: holding X opens the combat arc and the camera stays on the fight',st.inv.open&&st.inv.mode==='arc'&&Math.abs(camF1-camF0)<.5,{mode:st.inv.mode,cam:[+camF0.toFixed(2),+camF1.toFixed(2)]});
const ord=st.inv.cards.map((c,i)=>st.inv.cards[(st.inv.sel+i)%7]),xs=ord.map(c=>c.x);
check('fight: 7 cards in front of him, fanning right from the selected one, none covering him',st.inv.cards.length===7&&xs.slice(0,5).every((x,i)=>i===0||x>xs[i-1])&&st.inv.cards.every(whole)&&st.inv.cards.every(c=>c.ahead>=.3)&&clear(st.inv)&&st.inv.tether&&st.inv.ring,{xs,body:st.inv.body});
const a1=st;await p.waitForTimeout(1000);st=await S();const ratio=(st.inv.simT-a1.inv.simT)/(st.encounter.clock-a1.encounter.clock);
check('the opponent is slowed to half speed, not stopped, while the arc is open',Math.abs(ratio-.5)<.08,{ratio:+ratio.toFixed(3)});
// select smoke (slot C1 = index 5), then get hit before contact
for(let i=0;i<3;i++){await p.keyboard.press('KeyD');await p.waitForTimeout(80);}st=await S();
check('arc: D D D selects the smoke capsule from the medical kit',st.inv.selected==='smoke',{sel:st.inv.selected});
const smoke0=JSON.stringify(st.inv.smoke),hits0=st.stats.hitsTaken,int0=st.inv.interrupted;
await p.evaluate(()=>{loadoutInterface.debug.setHp(100);});
await p.keyboard.up('KeyX');await p.waitForTimeout(30);
// SETUP (labelled): make the construct land a hit inside the 0.25 s reach by registering a hit through the game's own damage path
const hitDone=await p.evaluate(()=>{return !!loadoutInterface.debug.hitPlayer?.(6,'test jab');});
await p.waitForTimeout(500);st=await S();await shot('05_interrupted');
check('SETUP hit lands during the reach',hitDone&&st.stats.hitsTaken>hits0,{hitDone,hits:[hits0,st.stats.hitsTaken]});
check('a hit before contact interrupts the reach: the smoke capsule stays in its socket',st.inv.interrupted===int0+1&&JSON.stringify(st.inv.smoke)===smoke0&&!st.inv.props.includes('smoke'),{interrupted:st.inv.interrupted,smoke:st.inv.smoke});
check('no page errors',errors.length===0,errors.slice(0,5));
require('fs').writeFileSync(OUT+'/loadout_interface_p7c_results.json',JSON.stringify({build:BUILD,date:new Date().toISOString(),results,final:await S()},null,1));
console.log(results.filter(r=>r.result==='PASS').length+'/'+results.length+' PASS');
await b.close();})();
