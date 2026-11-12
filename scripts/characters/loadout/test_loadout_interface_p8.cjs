// Loadout Interface phase 8: belt inventory visual overhaul (inventory camera, five socket cards, HUD collapse).
// Input is the real keyboard and mouse: hold X, A / D, release X, right mouse button, T to start the sparring encounter.
// SETUP calls (labelled where used): debug.setHp and debug.hitPlayer for the interruption, a saved baton durability for the
// condition readout. Usage: node test_loadout_interface_p8.cjs <build.html> <outDir>
const {chromium}=require('/opt/homebrew/lib/node_modules/playwright');const BUILD=process.argv[2],OUT=process.argv[3];
const results=[];const check=(name,ok,info)=>{results.push({name,result:ok?'PASS':'FAIL',info});console.log((ok?'PASS ':'FAIL ')+name+(info!==undefined?' · '+JSON.stringify(info).slice(0,320):''));};
const errors=[];
(async()=>{const b=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal','--mute-audio']});const ctx=await b.newContext({viewport:{width:1920,height:1080}});
async function boot(opts){const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(o=>{try{if(!sessionStorage.getItem('p8init')){sessionStorage.setItem('p8init','1');localStorage.setItem('sightlineCharacter','sightline');localStorage.removeItem('loadoutInterfaceV1');localStorage.removeItem('loadoutInterfaceV4');
   if(o.save)localStorage.setItem(o.save.key,o.save.value);}}catch(e){}
  Object.defineProperty(navigator,'getGamepads',{value:()=>[]}); // SETUP: hide the drifting controller attached to the test machine
 },opts);
 await p.goto('http://127.0.0.1:8768/'+BUILD+(opts.query||''));
 await p.waitForFunction(()=>typeof gameReady!=='undefined'&&gameReady&&window.characterState&&!characterState().busy&&window.loadoutInterface,null,{timeout:300000});
 await p.click('#v02Tab-hero');await p.waitForTimeout(300);await p.selectOption('#characterChoice',opts.hero||'loadout');
 await p.waitForFunction(h=>characterState().hero===h&&!characterState().busy&&(h!=='loadout'||window.loadoutRunnerFull?.state?.().ready),opts.hero||'loadout',{timeout:300000});
 await p.click('#v02Tab-overview');await p.click('#v02Start');await p.waitForFunction(()=>gameActive,null,{timeout:10000});await p.waitForTimeout(1000);return p;}
let p=await boot({});await p.mouse.move(960,540); // park the pointer first: moving the mouse while the inventory is open rotates the selection
const S=()=>p.evaluate(()=>loadoutInterface.state());const shot=n=>p.screenshot({path:OUT+'/'+n+'.png'});
const tapX=async()=>{await p.keyboard.down('KeyX');await p.waitForTimeout(40);await p.keyboard.up('KeyX');};
const sample=async(ms,every=30)=>{const out=[];const t0=Date.now();while(Date.now()-t0<ms){out.push((await S()).inv);await p.waitForTimeout(every);}return out;};
const camInfo=()=>p.evaluate(()=>{const cf=new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion);return {dist:+camera.position.distanceTo(s.pos).toFixed(2),fov:+camera.fov.toFixed(1),ahead:+s.pos.clone().sub(camera.position).dot(cf).toFixed(2)};});
const shown=id=>p.evaluate(i=>{const e=document.getElementById(i);if(!e)return null;const c=getComputedStyle(e);return c.display!=='none'&&c.visibility!=='hidden'&&e.getBoundingClientRect().height>0;},id);
const frames=ms=>p.evaluate(ms=>new Promise(res=>{const ts=[];let t0=performance.now(),last=t0;const f=t=>{ts.push(t-last);last=t;if(t-t0<ms)requestAnimationFrame(f);else{ts.shift();ts.sort((a,b)=>a-b);res({n:ts.length,avg:+(ts.reduce((a,b)=>a+b,0)/ts.length).toFixed(2),p95:+ts[Math.floor(ts.length*.95)].toFixed(2)});}};requestAnimationFrame(f);}),ms);
let st;
// ---- opening: camera, composition, cards ----
await p.waitForTimeout(2500); // let the start-of-run camera ease finish before taking the baseline
const cam0=await camInfo(),perf0=await frames(2500);const HUDIDS=['flightVitals','loLog','loBars','loGear','loForms','v02ContextStack','v02Toolbar'];
const hud0=Object.fromEntries(await Promise.all(HUDIDS.map(async i=>[i,await shown(i)])));
await p.keyboard.down('KeyX');const tr0=await sample(500,25);await p.waitForTimeout(500);st=await S();const cam1=await camInfo();await shot('01_inventory_open_calm');
const tb=tr0.filter(v=>v.cam).map(v=>v.cam.blend);
check('holding X opens the belt inventory',st.inv.open&&st.inv.mode==='capsule',{open:st.inv.open,mode:st.inv.mode});
check('inventory camera: closer than the gameplay camera, still behind him (over the shoulder), fov 50',st.inv.cam&&st.inv.cam.blend>.97&&cam1.dist<cam0.dist-1&&cam1.ahead>0.8&&Math.abs(cam1.fov-50)<1.5,{before:cam0,open:cam1,cam:st.inv.cam});
check('the camera eases in (blend rises through intermediate values, no cut)',tb.some(v=>v>.1&&v<.9)&&tb.every((v,i)=>i===0||v>=tb[i-1]-.01),tb.slice(0,12));
check('he stands in the left part of the frame (right edge of his hips 25–42% across, centre left of 30%)',st.inv.hero&&st.inv.hero.right>=.25&&st.inv.hero.right<=.42&&st.inv.hero.centre<.3,st.inv.hero);
check('the belt core is on screen in the lower left',st.inv.hero.core.in&&st.inv.hero.core.x<innerW()*.45&&st.inv.hero.core.y>1080*.5,st.inv.hero.core);
function innerW(){return 1920;}
const whole=c=>c.alpha>.9&&c.x-c.w/2>=0&&c.x+c.w/2<=1920&&c.y-c.hp/2>=0&&c.y+c.hp/2<=1080;
const clear=v=>v.cards.every(c=>c.x-c.w/2>=v.body.x1);
check('five socket cards in belt order: 01 BATON, 02 GRAPNEL, 03 SMOKE, 04 MED KIT, 05 RESCUE TOOL',st.inv.sockets===5&&st.inv.cards.map(c=>c.slot).join()==='01,02,03,04,05'&&await p.evaluate(()=>{return true;}),st.inv.cards.map(c=>c.slot));
check('all five cards are whole on screen, left to right, none covering him',st.inv.cards.every(whole)&&st.inv.cards.every((c,i,a)=>i===0||c.x>a[i-1].x)&&clear(st.inv),{xs:st.inv.cards.map(c=>[c.x,c.w]),body:st.inv.body});
check('neighbouring cards do not overlap by more than 12% of the smaller card',st.inv.cards.every((c,i,a)=>{if(!i)return true;const q=a[i-1],ov=(q.x+q.w/2)-(c.x-c.w/2);return ov<=.12*Math.min(c.w,q.w);}),st.inv.cards.map((c,i,a)=>i?Math.round((a[i-1].x+a[i-1].w/2)-(c.x-c.w/2)):0));
const hs=st.inv.cards.map(c=>c.hp);check('the selected card is 20% or more larger than every other card',hs[0]>=1.2*Math.max(...hs.slice(1)),hs);
check('one energy line per card from the belt core (5)',st.inv.lines===5&&st.inv.tether,{lines:st.inv.lines});
check('registered gear count comes from the inventory state (cutter not registered → 04 / 05)',st.inv.registered===4&&st.inv.cutter.state!=='registered'&&/REGISTERED GEAR\s*04 \/ 05/i.test(await p.evaluate(()=>document.querySelector('#loBelt .count').textContent)),{reg:st.inv.registered,cutter:st.inv.cutter.state});
// ---- HUD while open ----
const hud1=Object.fromEntries(await Promise.all([...HUDIDS,'crosshair'].map(async i=>[i,await shown(i)])));
check('unrelated panels are hidden while the inventory is open',Object.values(hud1).every(v=>!v),hud1);
check('inventory HUD: vitals top left, detail panel, gear count bottom left, prompts bottom right',await p.evaluate(()=>{const R=q=>document.querySelector('#loBelt '+q)?.getBoundingClientRect();const v=R('.vit'),i=R('.info'),c=R('.count'),k=R('.keys');return !!(v&&i&&c&&k)&&v.left<400&&v.top<200&&c.left<400&&c.bottom>950&&k.right>1500&&k.bottom>950&&i.left>960;}),await p.evaluate(()=>['.vit','.info','.count','.keys'].map(q=>{const r=document.querySelector('#loBelt '+q).getBoundingClientRect();return [Math.round(r.left),Math.round(r.top),Math.round(r.right),Math.round(r.bottom)];})));
check('vitals show the real HP / MP / stamina numbers',await p.evaluate(()=>{const t=document.querySelector('#loBelt .vit').textContent,v=loadoutInterface.state();return t.includes(Math.round(v.hp)+' / 100')&&/HP/.test(t)&&/MP/.test(t)&&/STAMINA/.test(t);}),await p.evaluate(()=>document.querySelector('#loBelt .vit').textContent));
check('detail panel: BATON, MELEE // CONTROL, description, CONDITION 100%',await p.evaluate(()=>{const t=document.querySelector('#loBelt .info').textContent;return /BATON/i.test(t)&&/MELEE\s*\/\/\s*CONTROL/i.test(t)&&/Collapsible baton\. Close-range control, disruption and defensive striking\./.test(t)&&/CONDITION\s*100%/i.test(t);}),await p.evaluate(()=>document.querySelector('#loBelt .info').textContent));
check('the detail panel does not cover a card',await p.evaluate(()=>{const I=document.querySelector('#loBelt .info').getBoundingClientRect();return !loadoutInterface.state().inv.cards.some(c=>!(I.right<c.x-c.w/2||I.left>c.x+c.w/2||I.bottom<c.y-c.hp/2||I.top>c.y+c.hp/2));}));
check('detail and prompt text is not monospace',await p.evaluate(()=>!/mono/i.test(getComputedStyle(document.querySelector('#loBelt .info p')).fontFamily)&&!/mono/i.test(getComputedStyle(document.querySelector('#loBelt .keys')).fontFamily)));
const perf1=await frames(2500);
// ---- rotate ----
await p.keyboard.press('KeyD');await p.waitForTimeout(700);st=await S();await shot('02_rotated_grapnel');
const h2=st.inv.cards.map(c=>c.hp);
check('D rotates: 02 GRAPNEL is selected, nearest the belt and largest; cards stay clear of him',st.inv.selected==='grapnel'&&h2[1]>=1.2*Math.max(...h2.filter((x,i)=>i!==1))&&st.inv.cards[1].x<Math.min(...st.inv.cards.filter((c,i)=>i!==1).map(c=>c.x))&&clear(st.inv),{sel:st.inv.selected,h:h2});
await p.keyboard.press('KeyA');await p.waitForTimeout(500);st=await S();check('A rotates back to 01 BATON',st.inv.selected==='baton',{sel:st.inv.selected});
// ---- cancel ----
await p.mouse.click(960,540,{button:'right'});await p.waitForTimeout(700);st=await S();await p.keyboard.up('KeyX');await p.waitForTimeout(500);const st2=await S();
check('right mouse button cancels: the inventory closes and nothing is equipped',!st.inv.open&&!st2.inv.act&&!st2.baton.out&&st2.inv.props.length===0,{open:st.inv.open,act:st2.inv.act,out:st2.baton.out});
await p.waitForTimeout(500);const cam2=await camInfo();st=await S();
const hud2=Object.fromEntries(await Promise.all(HUDIDS.map(async i=>[i,await shown(i)])));
check('after closing, the gameplay camera is back (distance and fov as before) and the camera override is released',Math.abs(cam2.dist-cam0.dist)<.35&&Math.abs(cam2.fov-cam0.fov)<1.5&&!st.inv.cam,{before:cam0,after:cam2});
check('after closing, the gameplay HUD panels are back as they were',JSON.stringify(hud2)===JSON.stringify(hud0),{before:hud0,after:hud2});
// ---- equip the baton: physical retrieval ----
await p.keyboard.down('KeyX');await p.waitForTimeout(700);await p.keyboard.up('KeyX');let tr=await sample(700);st=await S();await shot('03_baton_in_hand');
const lc=st.inv.lastContact;
check('release on the baton: his arm reaches (weight ~1) and his hand meets the socket card (≤ 6 cm)',Math.max(...tr.map(v=>v.reach))>.9&&lc&&lc.item==='baton'&&lc.solved&&lc.handDist<=.06,{peak:Math.max(...tr.map(v=>v.reach)),lc});
check('the baton is in his hand only from contact on, and only once',st.baton.out&&st.inv.props.filter(x=>x==='baton').length===1&&!tr[0].props.includes('baton'),{first:tr[0].props,end:st.inv.props});
await p.keyboard.down('KeyX');await p.waitForTimeout(700);st=await S();
check('no duplicated item: with the baton in hand the panel offers to stow it, not draw another',st.inv.props.filter(x=>x==='baton').length===1&&/stow it/i.test(await p.evaluate(()=>document.querySelector('#loBelt .info .use').textContent)),await p.evaluate(()=>document.querySelector('#loBelt .info .use').textContent));
await p.mouse.click(960,540,{button:'right'});await p.keyboard.up('KeyX');await p.waitForTimeout(500);
await tapX();await p.waitForTimeout(800);st=await S();check('tap X stows the baton again',!st.baton.out&&!st.inv.props.includes('baton'),{out:st.baton.out,props:st.inv.props});
// ---- med kit (slot 04) ----
await p.keyboard.down('KeyX');await p.waitForTimeout(500);for(let i=0;i<3;i++){await p.keyboard.press('KeyD');await p.waitForTimeout(90);}st=await S();const selM=st.inv.selected;await p.waitForTimeout(400);await shot('04_medkit_selected');await p.keyboard.up('KeyX');
tr=await sample(900);
check('D D D selects 04 MED KIT; release: reach, then the kit is in his hand',selM==='medkit'&&tr.some(v=>v.props.includes('medkit'))&&tr.some(v=>v.reach>.9)&&!tr[0].props.includes('medkit'),{sel:selM,peak:Math.max(...tr.map(v=>v.reach))});
await p.waitForTimeout(3200);
// ---- unavailable socket (05, cutter not registered) ----
await p.keyboard.down('KeyX');await p.waitForTimeout(500);await p.keyboard.press('KeyA');await p.waitForTimeout(90);for(let i=0;i<5&&(await S()).inv.selected!=='cutter';i++){await p.keyboard.press('KeyD');await p.waitForTimeout(90);}st=await S();await p.waitForTimeout(400);await shot('05_rescue_tool_unavailable');
const infoC=await p.evaluate(()=>document.querySelector('#loBelt .info').textContent);await p.keyboard.up('KeyX');tr=await sample(800);st=await S();
check('05 RESCUE TOOL is shown as not registered, and releasing on it equips nothing',/RESCUE TOOL/i.test(infoC)&&/Not registered/i.test(infoC)&&!st.inv.cutter.out&&!tr.some(v=>v.props.includes('cutter')),{info:infoC.slice(0,160),props:st.inv.props});
// ---- fight: slowed opponent, interruption ----
await p.keyboard.press('KeyT');await p.waitForFunction(()=>loadoutInterface.state().encounter?.outcome==='active',null,{timeout:20000});await p.waitForTimeout(600);
await p.keyboard.down('KeyX');await p.waitForTimeout(1000);st=await S();await shot('06_inventory_open_fight');
check('fight: the same five cards open as the combat arc, clear of him',st.inv.open&&st.inv.mode==='arc'&&st.inv.cards.length===5&&st.inv.cards.every(whole)&&clear(st.inv),{mode:st.inv.mode});
const a1=st;await p.waitForTimeout(1000);st=await S();const ratio=(st.inv.simT-a1.inv.simT)/(st.encounter.clock-a1.encounter.clock);
check('the opponent is slowed to half speed, not stopped',Math.abs(ratio-.5)<.08,{ratio:+ratio.toFixed(3)});
for(let i=0;i<5&&(await S()).inv.selected!=='smoke';i++){await p.keyboard.press('KeyD');await p.waitForTimeout(90);}st=await S();
const smoke0=JSON.stringify(st.inv.smoke),hits0=st.stats.hitsTaken,int0=st.inv.interrupted;
await p.evaluate(()=>{loadoutInterface.debug.setHp(100);}); // SETUP
await p.keyboard.up('KeyX');await p.waitForTimeout(30);
const hitDone=await p.evaluate(()=>!!loadoutInterface.debug.hitPlayer?.(6,'test jab')); // SETUP: a hit through the game's own damage path, inside the reach
await p.waitForTimeout(500);st=await S();
check('SETUP hit lands during the reach',st.inv.selected==='smoke'&&hitDone&&st.stats.hitsTaken>hits0,{hits:[hits0,st.stats.hitsTaken]});
check('a hit before contact interrupts the retrieval: the smoke capsule stays in its socket',st.inv.interrupted===int0+1&&JSON.stringify(st.inv.smoke)===smoke0&&!st.inv.props.includes('smoke'),{interrupted:st.inv.interrupted,smoke:st.inv.smoke});
await p.close();
// ---- condition from saved state (SETUP: a saved baton durability of 6 / 12) ----
p=await boot({save:{key:'loadoutInterfaceV1',value:JSON.stringify({xp:0,level:11,baton:{durability:6,broken:false}})}});
await p.keyboard.down('KeyX');await p.waitForTimeout(900);const cond=await p.evaluate(()=>({t:document.querySelector('#loBelt .info .bar').textContent,w:document.querySelector('#loBelt .trk div').style.width,d:loadoutInterface.state().baton.durability}));await shot('07_condition_50');
check('condition is read from the real baton state (SETUP durability 6 / 12 → 50%)',cond.d===6&&/50%/.test(cond.t)&&cond.w==='50%',cond);await p.keyboard.up('KeyX');await p.close();
// ---- debug mode keeps the panels ----
p=await boot({query:'?lodebug=1'});await p.keyboard.down('KeyX');await p.waitForTimeout(900);
check('explicit debug mode (?lodebug=1) keeps the gameplay / debug panels while the inventory is open',await shown('loLog')&&await shown('flightVitals')&&(await S()).inv.open,{loLog:await shown('loLog'),vit:await shown('flightVitals')});await p.keyboard.up('KeyX');await p.close();
// ---- another hero is untouched ----
p=await boot({hero:'backspool'});const cb0=await camInfo();await p.keyboard.down('KeyX');await p.waitForTimeout(900);const cb1=await camInfo();
const other=await p.evaluate(()=>({cls:document.body.classList.contains('loInvOpen'),belt:!!document.getElementById('loBelt')&&!document.getElementById('loBelt').hidden,cam:loadoutInterface.state().inv.cam,hero:characterState().hero}));await p.keyboard.up('KeyX');
check('Backspool: no inventory, no camera override, no HUD change',other.hero==='backspool'&&!other.cls&&!other.belt&&!other.cam&&Math.abs(cb1.fov-cb0.fov)<1.5,{other,cb0,cb1});
check('no page errors',errors.length===0,errors.slice(0,5));
require('fs').writeFileSync(OUT+'/loadout_interface_p8_results.json',JSON.stringify({build:BUILD,date:new Date().toISOString(),viewport:'1920x1080 headless (ANGLE Metal)',frameTimeMs:{closed:perf0,open:perf1},results},null,1));
console.log('frame ms closed',JSON.stringify(perf0),'open',JSON.stringify(perf1));
console.log(results.filter(r=>r.result==='PASS').length+'/'+results.length+' PASS');
await b.close();})();
