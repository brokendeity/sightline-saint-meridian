// Loadout Interface phase 9: third-person spatial inventory (camera behind him, five cards in front, touch-and-retrieve).
// Input is real: keyboard (hold X, A / D, Enter, release X, 1, W), mouse (hover, left click, right click) and, in the pad
// section, the Gamepad API (a test controller object the page reads through navigator.getGamepads; D-left hold, D-pad,
// right stick, A, B, and the L3+LT+RT+R3 hero chord).
// SETUP calls, labelled where used: debug.forceAttack (makes the construct start its own jab now, so the hit can land
// inside the reach) and debug.setHp. Nothing is teleported. A per-frame recorder in the page only reads state.
// Usage: node test_loadout_interface_p9.cjs <build.html> <outDir>
const {chromium}=require('/opt/homebrew/lib/node_modules/playwright');const BUILD=process.argv[2],OUT=process.argv[3];
const results=[];const check=(name,ok,info)=>{results.push({name,result:ok?'PASS':'FAIL',info});console.log((ok?'PASS ':'FAIL ')+name+(info!==undefined?' · '+JSON.stringify(info).slice(0,360):''));};
const errors=[];
(async()=>{const b=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal','--mute-audio']});const ctx=await b.newContext({viewport:{width:1920,height:1080}});
async function boot(opts={}){const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{try{if(!sessionStorage.getItem('p9init')){sessionStorage.setItem('p9init','1');localStorage.setItem('sightlineCharacter','sightline');localStorage.removeItem('loadoutInterfaceV1');localStorage.removeItem('loadoutInterfaceV4');}}catch(e){}
  // the test controller: off (no pad at all) until a test switches it on; this also hides the drifting controller on the test machine
  window.__pad={id:'p9 test pad',index:0,connected:true,mapping:'standard',timestamp:0,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,touched:false,value:0}))};window.__padOn=false;
  Object.defineProperty(navigator,'getGamepads',{value:()=>window.__padOn?[window.__pad]:[]});});
 await p.goto('http://127.0.0.1:8768/'+BUILD+(opts.query||''));
 await p.waitForFunction(()=>typeof gameReady!=='undefined'&&gameReady&&window.characterState&&!characterState().busy&&window.loadoutInterface,null,{timeout:300000});
 await p.click('#v02Tab-hero');await p.waitForTimeout(300);await p.selectOption('#characterChoice','loadout');
 await p.waitForFunction(()=>characterState().hero==='loadout'&&!characterState().busy&&window.loadoutRunnerFull?.state?.().ready,null,{timeout:300000});
 await p.click('#v02Tab-overview');await p.click('#v02Start');await p.waitForFunction(()=>gameActive,null,{timeout:10000});await p.waitForTimeout(2500);
 // read-only recorder: one sample per rendered frame
 await p.evaluate(()=>{window.__rec=[];const f=()=>{try{const v=loadoutInterface.state(),i=v.inv,r=i.cards.find(c=>c.state==='retrieving');
   __rec.push({t:performance.now(),open:i.open,seq:i.seq,pull:i.pull,act:i.act,tip:i.tipDist,props:i.props,hy:i.headYaw,cb:i.hero?i.hero.camBehind:null,cl:i.hero?i.hero.camLooks:null,cx:i.hero?i.hero.centre:null,yf:i.hero?i.hero.yawFaces:null,co:r?r.open:0,dim:i.cards.filter(c=>c.state==='open').map(c=>c.alpha),hits:v.stats.hitsTaken,blend:i.cam?i.cam.blend:0});}catch(e){}requestAnimationFrame(f);};requestAnimationFrame(f);});
 return p;}
let p=await boot();await p.mouse.move(960,900);
const S=()=>p.evaluate(()=>loadoutInterface.state());const shot=n=>p.screenshot({path:OUT+'/'+n+'.png'});
const mark=()=>p.evaluate(()=>__rec.length);const since=m=>p.evaluate(m=>__rec.slice(m),m);
const seqDone=()=>p.waitForFunction(()=>{const i=loadoutInterface.state().inv;return !i.open&&!i.act&&!i.seq;},null,{timeout:8000}).then(()=>true,()=>false);
const openInv=async()=>{await p.keyboard.down('KeyX');await p.waitForFunction(()=>{const i=loadoutInterface.state().inv;return i.open&&i.cam&&i.cam.blend>.97;},null,{timeout:5000});await p.waitForTimeout(350);};
const selectTo=async id=>{for(let n=0;n<8&&(await S()).inv.selected!==id;n++){const st=await S(),want=st.inv.cards.findIndex(c=>c.id===id);await p.keyboard.press(want>st.inv.sel?'KeyD':'KeyA');await p.waitForTimeout(140);}await p.waitForTimeout(450);};
const camNow=()=>p.evaluate(()=>{const cf=new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion);return {dist:+camera.position.distanceTo(s.pos).toFixed(2),fov:+camera.fov.toFixed(1),ahead:+s.pos.clone().sub(camera.position).dot(cf).toFixed(2)};});
let st,m,tr;
// ================= 1. open while standing =================
const cam0=await camNow();m=await mark();await openInv();st=await S();tr=await since(m);await shot('01_A_inventory_open');
const H=st.inv.hero,C=st.inv.cards;
check('1 · open while standing: holding X opens the inventory',st.inv.open,{open:st.inv.open,mode:st.inv.mode});
check('1 · he is centred (hips 42–58% across) in the lower middle (head 33–48% down, belt 62–80% down)',H&&H.centre>=.42&&H.centre<=.58&&H.headY>=.33&&H.headY<=.48&&H.hipY>=.62&&H.hipY<=.8,H);
check('1 · camera is behind him and looks the way he faces; his body faces the card array',H.camBehind>=.95&&H.camLooks>=.95&&H.yawFaces>=.95,{camBehind:H.camBehind,camLooks:H.camLooks,yawFaces:H.yawFaces});
check('1 · the camera eases in (intermediate blend values, no cut)',tr.some(v=>v.blend>.1&&v.blend<.9),tr.filter((v,i)=>i%6===0).map(v=>v.blend).slice(0,10));
check('1 · slots in order: 01 BATON, 02 GRAPNEL, 03 MEDICAL KIT, 04 RESCUE CUTTER, 05 SMOKE CAPSULES, then capsule C2',C.slice(0,5).map(c=>c.id).join()==='baton,grapnel,medkit,cutter,smoke'&&!C[5].id&&C.map(c=>c.slot).join()==='01,02,03,04,05,C2',C.map(c=>[c.slot,c.id]));
const whole=c=>c.x-c.w/2>=0&&c.x+c.w/2<=1920&&c.y-c.hp/2>=0&&c.y+c.hp/2<=1080;
check('1 · every card is whole on screen, left to right, in front of him (ahead > 0)',C.every(whole)&&C.every((c,i,a)=>i===0||c.x>a[i-1].x)&&C.every(c=>c.ahead>0),C.map(c=>[c.x,c.y,c.w,c.hp,c.ahead]));
check('1 · the five main cards sit at upper-torso to head height (card centres above his belt line, none below it)',C.slice(0,5).every(c=>c.y<H.hipY*1080&&c.y+c.hp/2<H.hipY*1080),{cardY:C.map(c=>c.y),belt:Math.round(H.hipY*1080)});
check('1 · the selected card is at least 30% larger than the others',C[0].hp>=1.3*Math.max(...C.slice(1).map(c=>c.hp)),C.map(c=>c.hp));
check('1 · neighbouring cards overlap by at most 12% of the smaller card',C.every((c,i,a)=>{if(!i)return true;const q=a[i-1];return (q.x+q.w/2)-(c.x-c.w/2)<=.12*Math.min(c.w,q.w);}),C.map((c,i,a)=>i?Math.round((a[i-1].x+a[i-1].w/2)-(c.x-c.w/2)):0));
check('1 · one line per card back to the belt, and the ground ring',st.inv.lines===6&&st.inv.tether&&st.inv.ring,{lines:st.inv.lines,ring:st.inv.ring});
const vis=id=>p.evaluate(i=>{const e=document.getElementById(i);if(!e)return null;const c=getComputedStyle(e);return c.display!=='none'&&c.visibility!=='hidden'&&e.getBoundingClientRect().height>0;},id);
check('1 · the regular gameplay HUD stays (vitals, bars, gear readout, forms) and the selected-item panel is on the right',await vis('flightVitals')&&await vis('loBars')&&await vis('loGear')&&await vis('loForms')&&await p.evaluate(()=>{const r=document.querySelector('#loBelt .info').getBoundingClientRect();return r.left>1920*.7&&/BATON/i.test(document.querySelector('#loBelt .info').textContent);}),{vit:await vis('flightVitals'),bars:await vis('loBars'),gear:await vis('loGear'),forms:await vis('loForms')});
// ================= 2 + 3. select each slot; head turn =================
const seen=[];for(const id of ['baton','grapnel','medkit','cutter','smoke']){await selectTo(id);st=await S();const c=st.inv.cards;seen.push({id,sel:st.inv.selected,big:c[st.inv.sel].hp>=1.3*Math.max(...c.filter((x,i)=>i!==st.inv.sel).map(x=>x.hp)),state:c[st.inv.sel].state,hy:st.inv.headYaw,hd:st.inv.headDir,yf:st.inv.hero.yawFaces,cb:st.inv.hero.camBehind,info:await p.evaluate(()=>document.querySelector('#loBelt .info').textContent.slice(0,40))});if(id==='smoke')await shot('02_smoke_selected');}
check('2 · A / D selects each of the five slots; the selected card is the large one and the panel names it',seen.every(v=>v.sel===v.id&&v.big&&v.state==='selected'),seen.map(v=>[v.id,v.sel,v.big,v.info]));
const hd=v=>Math.atan2(v.hd[0],v.hd[1]);let sweep=hd(seen[0])-hd(seen[4]);sweep-=Math.round(sweep/(2*Math.PI))*2*Math.PI;
check('3 · his head turns toward the selected card: left for 01, right for 05, in order, at most 0.5 rad',seen[0].hy>.15&&seen[4].hy<-.15&&seen.every((v,i,a)=>i===0||v.hy<a[i-1].hy+.01)&&seen.every(v=>Math.abs(v.hy)<=.5),seen.map(v=>v.hy));
check('3 · the head bone itself turns (measured from its world matrix), by 0.3 rad or more between 01 and 05',Math.abs(sweep)>=.3&&Math.sign(sweep)===Math.sign(seen[0].hy-seen[4].hy),{sweep:+sweep.toFixed(3)});
check('3 · his body keeps facing the cards while the head turns; camera stays behind',seen.every(v=>v.yf>=.95&&v.cb>=.95),seen.map(v=>[v.yf,v.cb]));
// mouse hover selects a card
st=await S();const mk=st.inv.cards[2];await p.mouse.move(mk.x-200,mk.y,{steps:4});await p.mouse.move(mk.x,mk.y,{steps:6});await p.waitForTimeout(450);st=await S();
check('2 · mouse over a card selects it (03 MEDICAL KIT)',st.inv.selected==='medkit',{sel:st.inv.selected});
// empty capsule and unregistered cutter cannot be retrieved
await p.mouse.move(960,900,{steps:3});await p.waitForTimeout(200);for(let n=0;n<8&&(await S()).inv.sel!==5;n++){await p.keyboard.press('KeyD');await p.waitForTimeout(120);}st=await S();const emptySel=st.inv.sel;m=await mark();await p.keyboard.press('Enter');await p.waitForTimeout(700);tr=await since(m);st=await S();
check('extra · the empty capsule (C2) cannot be retrieved: confirm starts nothing and equips nothing',emptySel===5&&!tr.some(v=>v.seq||v.act)&&st.inv.props.length===0,{sel:emptySel,open:st.inv.open,props:st.inv.props});
if(!st.inv.open){await p.keyboard.up('KeyX');await p.waitForTimeout(300);await openInv();}
await selectTo('cutter');st=await S();const cutInfo=await p.evaluate(()=>document.querySelector('#loBelt .info').textContent);m=await mark();await p.keyboard.press('Enter');await p.waitForTimeout(900);tr=await since(m);st=await S();
check('extra · the rescue cutter is not registered yet: confirm on its card starts no retrieval and equips nothing',/RESCUE CUTTER/.test(cutInfo)&&!tr.some(v=>v.seq||v.act)&&st.inv.props.length===0&&st.inv.cutter.state!=='registered'&&!st.inv.cutter.out&&!tr.some(v=>v.props.includes('cutter')),{cutter:st.inv.cutter,info:cutInfo.slice(0,120)});
if(!st.inv.open){await p.keyboard.up('KeyX');await p.waitForTimeout(300);await openInv();}
// ================= 9. cancel without retrieving =================
await selectTo('baton');await p.mouse.click(960,900,{button:'right'});await p.waitForTimeout(600);st=await S();await p.keyboard.up('KeyX');await p.waitForTimeout(700);const stC=await S(),camC=await camNow();
check('9 · cancel (right mouse button) closes the inventory and nothing is equipped',!st.inv.open&&!stC.inv.act&&!stC.baton.out&&stC.inv.props.length===0,{open:st.inv.open,props:stC.inv.props});
check('9 · after closing: gameplay camera back (distance, fov) and no camera override left',Math.abs(camC.dist-cam0.dist)<.4&&Math.abs(camC.fov-cam0.fov)<1.5&&!stC.inv.cam,{before:cam0,after:camC});
// ================= 4 + 5. touch and retrieve the Baton (mouse click on the card) =================
await openInv();st=await S();const bc=st.inv.cards[0];m=await mark();await p.mouse.move(bc.x,bc.y,{steps:5});await p.mouse.click(bc.x,bc.y);
const done5=await seqDone();tr=await since(m);await p.waitForFunction(()=>!loadoutInterface.state().inv.cam,null,{timeout:3000}).catch(()=>{});st=await S();await p.keyboard.up('KeyX');await p.mouse.move(960,900);
const lp=st.inv.lastPull||{},phases=[...new Set(tr.map(v=>v.pull).filter(Boolean))],firstBaton=tr.findIndex(v=>v.props.includes('baton')),firstWd=tr.findIndex(v=>v.pull==='withdrawing');
check('4 · clicking the Baton card starts the retrieval; phases run in order',phases.join(' > ')==='card coming into reach > reaching > touching · reaching in > withdrawing',phases);
check('4 · his fingertip reaches the card: 3 cm or less from the card opening at touch',lp.item==='baton'&&lp.touchDist!=null&&lp.touchDist<=.03,{touchDist:lp.touchDist,touchAt:lp.touchAt,tip:lp.tip,card:lp.card});
check('4 · the card came into arm reach (card is within 75% of his arm length from the shoulder... reported ratio ≤ 1)',lp.shoulder!=null&&lp.shoulder<=1,{shoulder:lp.shoulder});
check('5 · the card opens at touch (opening > 0.9) and the other cards dim',Math.max(...tr.map(v=>v.co||0))>.9&&tr.some(v=>v.pull&&v.dim.length&&Math.max(...v.dim)<.5),{open:Math.max(...tr.map(v=>v.co||0)),dim:Math.min(...tr.filter(v=>v.dim.length).map(v=>Math.max(...v.dim)))});
check('5 · his hand goes into the opening before the grip (5 cm or more past the card face)',lp.gripDepth>=.05&&lp.maxDepth>=.05,{gripDepth:lp.gripDepth,maxDepth:lp.maxDepth,gripErr:lp.gripErr});
check('5 · the Baton appears in his hand only at the grip (not before the withdraw phase), once',firstBaton>=0&&firstWd>=0&&firstBaton>=firstWd-1&&st.inv.props.filter(x=>x==='baton').length===1,{firstBaton,firstWd,props:st.inv.props});
check('5 · the sequence ends by itself (X still held): inventory closed, cards gone, camera eased back and released',done5&&!st.inv.open&&st.inv.cards.length===0&&!st.inv.cam&&lp.completed,{done5,cards:st.inv.cards.length,cam:st.inv.cam,completed:lp.completed});
const dur=tr.length?(tr[Math.max(firstWd,0)].t-tr.find(v=>v.pull).t)/1000:null;check('5 · responsive: confirm to grip in under 1 s',dur!=null&&dur<1,{secondsToGrip:dur&&+dur.toFixed(2)});
// ================= 6. equipped and usable; control returns =================
await p.waitForTimeout(300);st=await S();const pos0=await p.evaluate(()=>s.pos.toArray());
check('6 · the Baton is equipped (state: out, in hand, 12/12)',st.baton.out&&st.inv.props.includes('baton')&&st.baton.durability===12,{out:st.baton.out,dur:st.baton.durability});
await p.keyboard.press('Digit1');await p.waitForTimeout(250);st=await S();const formId=st.form?.id||null;await p.waitForTimeout(1500);
check('6 · it is usable: key 1 performs a form with the Baton still in hand',!!formId&&st.inv.props.includes('baton'),{form:st.form,props:st.inv.props});
await p.keyboard.down('KeyW');await p.waitForTimeout(700);await p.keyboard.up('KeyW');const pos1=await p.evaluate(()=>s.pos.toArray());const moved=Math.hypot(pos1[0]-pos0[0],pos1[2]-pos0[2]);
check('6 · control is back: W moves him',moved>.5,{moved:+moved.toFixed(2)});await p.waitForTimeout(600);
// ================= 7. store the Baton again (release the inventory key on its card) =================
await openInv();await selectTo('baton');const useTxt=await p.evaluate(()=>document.querySelector('#loBelt .info .use')?.textContent||document.querySelector('#loBelt .info').textContent);m=await mark();await p.keyboard.up('KeyX');const done7=await seqDone();tr=await since(m);st=await S();
check('7 · with the Baton out the panel offers to stow it (no second Baton)',/stow/i.test(useTxt),useTxt.slice(0,80));
check('7 · releasing X on the Baton card stores it: touch, then the Baton leaves his hand',done7&&st.inv.lastPull.stow&&st.inv.lastPull.completed&&st.inv.lastPull.touchDist<=.03&&!st.baton.out&&!st.inv.props.includes('baton'),{lp:st.inv.lastPull,out:st.baton.out,props:st.inv.props});
// ================= 8. retrieve a different item (Medical Kit, Enter) =================
await p.waitForTimeout(400);await openInv();await selectTo('medkit');await shot('03_medkit_selected');const med0=(await S()).inv.med;m=await mark();await p.keyboard.press('Enter');const done8=await seqDone();tr=await since(m);st=await S();await p.keyboard.up('KeyX');
check('8 · Enter on 03 MEDICAL KIT: he touches its card and the kit is in his hand',st.inv.lastPull.item==='medkit'&&st.inv.lastPull.slot==='03'&&st.inv.lastPull.touchDist<=.03&&tr.some(v=>v.props.includes('medkit'))&&!tr.some(v=>v.props.includes('baton')),{lp:st.inv.lastPull,med:[med0,st.inv.med],done8});
await p.waitForTimeout(3200);
// ================= 11. open while an opponent moves under time-slow =================
await p.keyboard.press('KeyT');await p.waitForFunction(()=>loadoutInterface.state().encounter?.outcome==='active',null,{timeout:20000});await p.waitForTimeout(800);
await openInv();const a1=await S();await p.waitForTimeout(1200);st=await S();await shot('04_inventory_open_fight');const ratio=(st.inv.simT-a1.inv.simT)/(st.encounter.clock-a1.encounter.clock);
check('11 · in a fight the inventory opens the same way, he stays centred with the camera behind',st.inv.open&&st.inv.hero.centre>=.42&&st.inv.hero.centre<=.58&&st.inv.hero.camBehind>=.95&&st.inv.cards.length===6,{hero:st.inv.hero});
check('11 · the opponent keeps moving at half speed (slowed, not stopped)',Math.abs(ratio-.5)<.08&&st.inv.simT>a1.inv.simT,{ratio:+ratio.toFixed(3)});
// ================= 10. interrupt a retrieval with an enemy attack =================
await selectTo('smoke');st=await S();const smoke0=JSON.stringify(st.inv.smoke),hits0=st.stats.hitsTaken,int0=st.inv.interrupted;
await p.evaluate(()=>{loadoutInterface.debug.setHp(100);loadoutInterface.debug.forceAttack('jab');}); // SETUP: the construct starts its own jab now
// wait for the jab to be close to landing, then confirm, so the hit falls inside the reach
let landed=false,usedFallback=false;m=await mark();await p.waitForTimeout(450); // the jab's windup is 0.45 s of fight time (0.9 s here, at half speed): confirm now and it lands inside the reach
await p.keyboard.press('Enter');await p.waitForTimeout(900);tr=await since(m);st=await S();landed=st.stats.hitsTaken>hits0;
if(!landed||st.inv.interrupted===int0){ // the forced jab missed the reach window: second try with a direct hit through the game's damage path (SETUP)
 usedFallback=true;await p.keyboard.up('KeyX');await p.waitForTimeout(1500);if((await S()).inv.props.includes('smoke'))await p.waitForTimeout(2500);
 await openInv();await selectTo('smoke');st=await S();var smokeB=JSON.stringify(st.inv.smoke),hitsB=st.stats.hitsTaken,intB=st.inv.interrupted;m=await mark();await p.keyboard.press('Enter');await p.waitForTimeout(260);
 await p.evaluate(()=>loadoutInterface.debug.hitPlayer(6,'test jab'));await p.waitForTimeout(800);tr=await since(m);st=await S();
 check('10 · (fallback SETUP hit) a hit before the grip interrupts the retrieval: the capsule stays in its socket',st.stats.hitsTaken>hitsB&&st.inv.interrupted===intB+1&&JSON.stringify(st.inv.smoke)===smokeB&&!tr.some(v=>v.props.includes('smoke')),{interrupted:[intB,st.inv.interrupted],smoke:st.inv.smoke,hits:[hitsB,st.stats.hitsTaken]});}
else check('10 · the construct\'s jab lands before the grip and interrupts the retrieval: the capsule stays in its socket',st.inv.interrupted===int0+1&&JSON.stringify(st.inv.smoke)===smoke0&&!tr.some(v=>v.props.includes('smoke')),{interrupted:[int0,st.inv.interrupted],smoke:st.inv.smoke,hits:[hits0,st.stats.hitsTaken]});
console.log('interrupt path:',usedFallback?'fallback debug.hitPlayer':'forced construct jab');
st=await S();check('10 · after the interruption the inventory is closed, no act is left and nothing is half-equipped',!st.inv.open&&!st.inv.seq&&!st.inv.act&&!st.inv.props.includes('smoke')&&st.inv.lastPull&&!st.inv.lastPull.completed,{open:st.inv.open,seq:st.inv.seq,act:st.inv.act,props:st.inv.props,lp:st.inv.lastPull});
await p.keyboard.up('KeyX');await p.waitForTimeout(400);
// ================= 12. camera behind throughout =================
const all=await since(0),withHero=all.filter(v=>v.cb!=null);
check('12 · camera behind him on every recorded frame with the inventory up ('+withHero.length+' frames): min camBehind ≥ 0.9, min camLooks ≥ 0.9',withHero.length>300&&Math.min(...withHero.map(v=>v.cb))>=.9&&Math.min(...withHero.map(v=>v.cl))>=.9,{frames:withHero.length,minBehind:Math.min(...withHero.map(v=>v.cb)),minLooks:Math.min(...withHero.map(v=>v.cl))});
const settled=all.filter(v=>v.cx!=null&&v.blend>.97&&v.open);check('12 · he stays centred while it is open (hips 40–60% across on every settled frame)',settled.length>200&&Math.min(...settled.map(v=>v.cx))>=.4&&Math.max(...settled.map(v=>v.cx))<=.6,{frames:settled.length,min:Math.min(...settled.map(v=>v.cx)),max:Math.max(...settled.map(v=>v.cx))});
const cxs=settled.map(v=>v.cx);let jit=0;for(let i=1;i<cxs.length;i++)jit=Math.max(jit,Math.abs(cxs[i]-cxs[i-1]));check('12 · no jitter: his screen position moves less than 2% of the width between frames',jit<.02,{maxStep:+jit.toFixed(4)});
await p.close();
// ================= controller + hero switch =================
p=await boot();await p.mouse.move(960,900);
const pad=(i,on)=>p.evaluate(([i,on])=>{__padOn=true;__pad.buttons[i]={pressed:on,touched:on,value:on?1:0};__pad.timestamp=performance.now();},[i,on]);
const tap=async i=>{await pad(i,true);await p.waitForTimeout(90);await pad(i,false);await p.waitForTimeout(160);};
await p.evaluate(()=>{__padOn=true;});await p.waitForTimeout(300);
await pad(14,true);await p.waitForFunction(()=>loadoutInterface.state().inv.open,null,{timeout:4000}).catch(()=>{});await p.waitForTimeout(900);st=await S();
check('pad · holding D-left opens the inventory',st.inv.open,{open:st.inv.open});
await tap(15);st=await S();const pSel1=st.inv.selected;await tap(12);st=await S();const pSel2=st.inv.selected;
await p.evaluate(()=>{__pad.axes[2]=1;});await p.waitForTimeout(120);await p.evaluate(()=>{__pad.axes[2]=0;});await p.waitForTimeout(200);st=await S();const pSel3=st.inv.selected;
check('pad · D-pad right then up, and the right stick, move the selection (01 → 02 → 01 → 02)',pSel1==='grapnel'&&pSel2==='baton'&&pSel3==='grapnel',[pSel1,pSel2,pSel3]);
await tap(12);await tap(1);await p.waitForTimeout(500);st=await S();check('pad · B cancels: closed, nothing equipped',!st.inv.open&&st.inv.props.length===0,{open:st.inv.open,props:st.inv.props});
await pad(14,false);await p.waitForTimeout(500);await pad(14,true);await p.waitForFunction(()=>loadoutInterface.state().inv.open,null,{timeout:4000}).catch(()=>{});await p.waitForTimeout(800);
for(let n=0;n<6&&(await S()).inv.selected!=='baton';n++)await tap(12);m=await mark();await tap(0);const doneP=await seqDone();st=await S();await pad(14,false);
check('pad · A confirms: touch-and-retrieve runs and the Baton is in his hand',doneP&&st.inv.lastPull?.item==='baton'&&st.inv.lastPull.completed&&st.inv.lastPull.touchDist<=.03&&st.baton.out,{lp:st.inv.lastPull,out:st.baton.out});
// hero switch with the inventory open and the Baton out
await p.waitForTimeout(600);await pad(14,true);await p.waitForFunction(()=>loadoutInterface.state().inv.open,null,{timeout:4000}).catch(()=>{});await p.waitForTimeout(700);const openBefore=(await S()).inv.open;
for(const i of [10,6,7,11])await pad(i,true);await p.waitForFunction(()=>characterState().hero!=='loadout'&&!characterState().busy,null,{timeout:60000}).catch(()=>{});for(const i of [10,6,7,11,14])await pad(i,false);await p.waitForTimeout(1200);
st=await S();const other=await p.evaluate(()=>({hero:characterState().hero,belt:!!document.getElementById('loBelt')&&!document.getElementById('loBelt').hidden,cls:document.body.classList.contains('loInvOpen')||document.body.classList.contains('loInvMin')}));await shot('05_after_hero_switch');
check('switch · L3+LT+RT+R3 with the inventory open changes hero; no cards, lines, ring or inventory panel remain',openBefore&&other.hero!=='loadout'&&!st.inv.open&&st.inv.cards.length===0&&!st.inv.ring&&!st.inv.tether&&!other.belt&&!other.cls&&!st.inv.cam,{other,cards:st.inv.cards.length,ring:st.inv.ring,cam:st.inv.cam});
check('switch · no equipment leaks to the other Moniker: no Loadout prop is shown in hand',st.inv.props.length===0&&!st.inv.act&&!st.inv.seq,{props:st.inv.props,act:st.inv.act});
await p.close();
check('no page errors',errors.length===0,errors.slice(0,5));
require('fs').writeFileSync(OUT+'/loadout_interface_p9_results.json',JSON.stringify({build:BUILD,date:new Date().toISOString(),viewport:'1920x1080 headless (ANGLE Metal)',results},null,1));
console.log(results.filter(r=>r.result==='PASS').length+'/'+results.length+' PASS');
await b.close();})();
