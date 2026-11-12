// Loadout · weapon clips, both hands on the Baton (P10c).
// Usage: node test_loadout_weapon_grip_p10c.cjs <build.html> <outDir>     (server: http://127.0.0.1:8768/)
// INPUT: real keys only. G draws the weapon, M performs the armed move, Period arms the next one; the move-list filter is
// typed in the Hero tab before play starts. The game runs in real time; nothing is teleported, stepped or posed.
// A page-side recorder reads loadoutRunnerFull.state() and loadoutInterface.state() once per frame (read-only).
const {chromium}=require('/opt/homebrew/lib/node_modules/playwright');const BUILD=process.argv[2],OUT=process.argv[3]||'.';
const results=[];const check=(name,ok,data)=>{results.push({name,result:ok?'PASS':'FAIL',data});console.log((ok?'PASS':'FAIL')+' · '+name+(ok?'':' · '+JSON.stringify(data)));};
(async()=>{const b=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal','--mute-audio']});const p=await b.newPage({viewport:{width:1280,height:720}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.addInitScript(()=>{try{localStorage.setItem('sightlineCharacter','sightline');localStorage.removeItem('loadoutInterfaceV1');localStorage.removeItem('loadoutInterfaceV4');}catch(e){}Object.defineProperty(navigator,'getGamepads',{value:()=>[]});});
await p.goto('http://127.0.0.1:8768/'+BUILD);
await p.waitForFunction(()=>typeof gameReady!=='undefined'&&gameReady&&window.characterState&&!characterState().busy&&window.loadoutInterface,null,{timeout:300000});
await p.click('#v02Tab-hero');await p.waitForTimeout(300);await p.selectOption('#characterChoice','loadout');
await p.waitForFunction(()=>characterState().hero==='loadout'&&!characterState().busy&&window.loadoutRunnerFull?.state?.().ready,null,{timeout:300000});
await p.fill('#lrfFilter','wp');const list=await p.evaluate(()=>[...document.querySelectorAll('#lrfList option')].map(o=>o.value));
await p.click('#v02Tab-overview');await p.click('#v02Start');await p.waitForFunction(()=>gameActive,null,{timeout:10000});await p.waitForTimeout(1500);
await p.evaluate(()=>{window.__rec=[];const f=()=>{try{const a=loadoutRunnerFull.state().action,g=loadoutInterface.state().inv.grip||{};window.__rec.push({c:a?a.clip:null,w:g.w,e:g.err||null,l:g.left||null});}catch(e){window.__rec.push({x:e.message});}requestAnimationFrame(f);};requestAnimationFrame(f);});
await p.keyboard.press('KeyG');await p.waitForTimeout(700);
const clip=()=>p.evaluate(()=>loadoutRunnerFull.state().action?.clip||null);
for(let i=0;i<list.length;i++){await p.keyboard.press('KeyM');await p.waitForTimeout(250);for(let k=0;k<60&&await clip();k++)await p.waitForTimeout(100);await p.waitForTimeout(350);await p.keyboard.press('Period');await p.waitForTimeout(120);}
const rec=await p.evaluate(()=>window.__rec);const by={};for(const r of rec){if(r.x){(by.__err=by.__err||[]).push(r.x);continue;}if(r.c)(by[r.c]=by[r.c]||[]).push(r);}
const other=Object.keys(by).filter(n=>n!=='__err'&&!list.includes(n)),names=Object.keys(by).filter(n=>list.includes(n)),S={}; // only clips from the weapon move list are judged; anything else recorded (the spawn clip before G) is listed in the results as 'other'
for(const n of names){const R=by[n],full=R.filter(r=>r.l&&r.l.w>=.99);S[n]={frames:R.length,rightBad:R.filter(r=>r.w!==1||r.e).length,leftOn:R.filter(r=>r.l&&r.l.w>0).length,leftFull:full.length,
 gapMax:full.length?Math.max(...full.map(r=>r.l.gap)):null,tipMax:full.length?Math.max(...full.map(r=>r.l.tip)):null,apartMin:full.length?Math.min(...full.map(r=>r.l.apart)):null};}
console.log(JSON.stringify(S,null,1));
check('W1 · the weapon clips play from real keys (G, then M and Period through the move list): 15 or more different clips',names.length>=15,{played:names.length,listed:list.length});
check('W2 · right hand: his fist stays closed on the Baton in every recorded frame of every clip (grip weight 1, no error)',names.length>0&&names.every(n=>S[n].rightBad===0)&&!by.__err,Object.fromEntries(names.map(n=>[n,S[n].rightBad])));
const two=['WpAttack_Hand_PwR_Root','Mvm_Wp_ChargeDash2_Root'];
check('W3 · left hand takes the shaft where the clip brings it there (heavy strike wind-up, second charge dash): 10 or more frames at full hold in each',two.every(n=>S[n]&&S[n].leftFull>=10),Object.fromEntries(two.map(n=>[n,S[n]])));
const fullAll=names.filter(n=>S[n].leftFull>0);
check('W4 · while it holds, the left hand is on the shaft: grip point within 1.5 cm of the shaft axis and fingertips within 4.5 cm, in every clip',fullAll.length>0&&fullAll.every(n=>S[n].gapMax<=.015&&S[n].tipMax<=.045),Object.fromEntries(fullAll.map(n=>[n,[S[n].gapMax,S[n].tipMax]])));
check('W5 · the two hands do not overlap: left grip 10.5 cm or more from the right-hand grip centre',fullAll.every(n=>S[n].apartMin>=.105),Object.fromEntries(fullAll.map(n=>[n,S[n].apartMin])));
const one=['WpAttack_Hand_1R_Root','WpJAttack_AirSwing_Keep','Mvm_Wp_ChargeDash_Root'];
check('W6 · one-handed clips stay one-handed: the left hand never reaches full hold in the right-hand swing, the air swing hold or the first charge dash',one.every(n=>S[n]&&S[n].leftFull===0),Object.fromEntries(one.map(n=>[n,S[n]&&S[n].leftFull])));
await p.waitForTimeout(1200);const idle=await p.evaluate(()=>loadoutInterface.state().inv.grip);
check('W7 · standing with the Baton drawn after the clips, the left hand has let go (left weight 0) and the right still holds (weight 1)',idle.w===1&&(!idle.left||idle.left.w===0),idle);
await p.keyboard.press('KeyG');await p.waitForTimeout(900);const off=await p.evaluate(()=>loadoutInterface.state().inv.grip);
check('W8 · weapon put away with G: both hands released (right weight 0, no left hold)',off.w===0&&!off.left,off);
check('W9 · no page errors',errors.length===0,errors.slice(0,5));
require('fs').writeFileSync(OUT+'/loadout_weapon_grip_p10c_results.json',JSON.stringify({build:BUILD,date:new Date().toISOString(),viewport:'1280x720 headless (ANGLE Metal)',input:'real keys G / M / Period, real time',perClip:S,otherClipsRecorded:other,results},null,1));
console.log(results.filter(r=>r.result==='PASS').length+'/'+results.length+' PASS');await b.close();})();
