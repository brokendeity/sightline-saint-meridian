// Capture helper for phase 9 screenshots A / B / C. Real key input; the page clock is stepped so each frame lands on a known phase (capture SETUP).
// capture helper v9: real keyboard/mouse. args: build outDir tag [calm|fight] [slotIndex]
const {chromium}=require('/opt/homebrew/lib/node_modules/playwright');const BUILD=process.argv[2],OUT=process.argv[3],TAG=process.argv[4]||'a',FIGHT=process.argv[5]==='fight',SLOT=+(process.argv[6]||0);
(async()=>{const b=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal','--mute-audio']});const ctx=await b.newContext({viewport:{width:1920,height:1080}});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{try{localStorage.setItem('sightlineCharacter','sightline');localStorage.removeItem('loadoutInterfaceV1');localStorage.removeItem('loadoutInterfaceV4');}catch(e){}Object.defineProperty(navigator,'getGamepads',{value:()=>[]});});
await p.goto('http://127.0.0.1:8768/'+BUILD);
await p.waitForFunction(()=>typeof gameReady!=='undefined'&&gameReady&&window.characterState&&!characterState().busy&&window.loadoutInterface,null,{timeout:300000});
await p.click('#v02Tab-hero');await p.waitForTimeout(300);await p.selectOption('#characterChoice','loadout');
await p.waitForFunction(()=>characterState().hero==='loadout'&&!characterState().busy&&window.loadoutRunnerFull?.state?.().ready,null,{timeout:300000});
await p.click('#v02Tab-overview');await p.click('#v02Start');await p.waitForFunction(()=>gameActive,null,{timeout:10000});await p.waitForTimeout(2500);
if(FIGHT){await p.keyboard.press('KeyT');await p.waitForTimeout(1500);}
await p.keyboard.down('KeyX');await p.waitForTimeout(1300);
for(let i=0;i<SLOT;i++){await p.keyboard.press('KeyD');await p.waitForTimeout(250);}await p.waitForTimeout(500);
await p.screenshot({path:OUT+'/'+TAG+'_A_open.png'});
const g=()=>p.evaluate(()=>{const i=loadoutInterface.state().inv;return {open:i.open,sel:i.selected,seq:i.seq,pull:i.pull,act:i.act,reach:i.reach,tip:i.tipDist,hero:i.hero,lp:i.lastPull,props:i.props,headYaw:i.headYaw,cam:i.cam};});
const st=await p.evaluate(()=>{const i=loadoutInterface.state().inv;return {hero:i.hero,cards:i.cards.map(c=>[c.slot,c.state,c.x,c.y,c.w,c.hp]),lines:i.lines};});console.log(JSON.stringify(st));
await p.clock.install();await p.clock.pauseAt(new Date(Date.now()+300));
await p.keyboard.press('Enter');await p.clock.runFor(34);
// CAPTURE SETUP: the page clock is stepped by the test so a screenshot can land on a known moment of the sequence; input is real
let last='';for(let i=0;i<60;i++){await p.clock.runFor(50);const s=await g();const t=JSON.stringify(s.act);const key=(s.pull||'none');
 if(i%2===0||key!==last){await p.screenshot({path:OUT+'/'+TAG+'_s'+String(i).padStart(2,'0')+'.png'});console.log('s'+i,t,key,JSON.stringify({tip:s.tip,open:s.open,lp:s.lp,props:s.props,headYaw:s.headYaw}));}
 last=key;if(!s.open&&!s.act)break;}
await p.clock.resume();
await p.keyboard.up('KeyX');
console.log('errors',JSON.stringify(errs.slice(0,5)));await b.close();})();
