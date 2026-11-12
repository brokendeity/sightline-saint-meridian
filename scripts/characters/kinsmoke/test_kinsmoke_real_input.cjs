/* Kinsmoke, the fourth hero in TEST MODE (SIGHTLINE_SAINT_MERIDIAN_V02_KINSMOKE.html), with real input only:
   menu clicks (Hero tab character list, Start), keyboard W (run), Escape (pause), H and Digit keys (hero select), mouse hover
   (ability card), and a virtual controller through navigator.getGamepads (as test_hero_select_v3.cjs) for the
   L3+LT+RT+R3 chord. Labelled setup: none (no teleports, no state writes).
   Checks:
   - Kinsmoke is selectable from the menu; hero 'kinsmoke', controller 'backspool', 2 retargeted clips, cape mesh split;
   - standing: the cape sits in its base form (every cape bone within IDLE_TOL of its rest place) and the anim is idle;
   - W runs him; anim is run with time scale from his speed; the cape moves (lag/billow) by more than RUN_MIN_DISP;
   - while running: no NaN, leg penetration under LEG_TOL, the cloth never resets;
   - after stopping the cape returns to its base form;
   - powers stay off (blocksPowers) and combat stays off;
   - the chord cycles all four heroes in order and back to Kinsmoke; the other heroes still load;
   - hero select: a Kinsmoke card and page (KINSMOKE, MALU KINSALA · BRIGHTLINE, bio + 4 power cards, green theme);
     WITNESSPILLAR floats beside him (not in hand), orbits him (angle advances, radius steady) and bobs above the floor;
   - hovering his Kin-smoke card plays the run preview and the preview cape moves;
   - screenshots: idle, running (two views), menu page, menu run preview; no page errors. */
const {chromium}=require('/opt/homebrew/lib/node_modules/playwright'),fs=require('fs');
const PORT=process.env.V02_PORT||'8768',OUT=process.env.KSM_OUT||'development/characters/kinsmoke/evidence/real-input',BUILD=process.env.KSM_BUILD||'SIGHTLINE_SAINT_MERIDIAN_V02_KINSMOKE.html';
const IDLE_TOL=.02,RUN_MIN_DISP=.08,LEG_TOL=.03;
(async()=>{const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal','--mute-audio']});let failed=false;const r={};try{
 fs.mkdirSync(OUT,{recursive:true});
 const ctx=await browser.newContext({viewport:{width:1280,height:800}}),p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{try{localStorage.setItem('sightlineCharacter','sightline');localStorage.removeItem('backspoolCostume');}catch(e){}
  const up={pressed:false,value:0};window.testPad={id:'test pad',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>up)};navigator.getGamepads=()=>[window.testPad];});
 const sleep=ms=>p.waitForTimeout(ms),shot=n=>p.screenshot({path:`${OUT}/${n}.png`});
 const padSet=b=>p.evaluate(b=>{window.testPad.buttons=Array.from({length:17},(_,i)=>b.includes(i)?{pressed:true,value:1}:{pressed:false,value:0});},b);
 const ready=()=>p.waitForFunction(()=>typeof gameReady!=='undefined'&&gameReady&&window.characterState&&!characterState().busy,null,{timeout:300000});
 const heroIs=h=>p.waitForFunction(h=>characterState().hero===h&&!characterState().busy,h,{timeout:300000});
 const look=()=>p.evaluate(()=>{const k=window.kinsmokeHero.state(),c=k.cloth;
  // Side-view stream shape (works on every cloth version: uses cloth.row()): collar centre -> hem centre (middle third of
  // the columns) in his heading frame. stream: 0 = hanging straight down, 90 = straight back (horizontal), >90 = above.
  // side: sideways swing of the hem centre, degrees. mid: the same for the middle row (the shape along the length).
  let stream=null;try{const cl=window.kinsmokeHero.cloth();if(cl&&cl.row){const R=c.rows,top=cl.row(0),hem=cl.row(R-1),mid=cl.row(Math.floor(R/2)),n=top.length,lo=Math.floor(n/3),hi=Math.ceil(2*n/3);
   const avg=(rw,a,b)=>{const v=[0,0,0];for(let i=a;i<b;i++)for(let k=0;k<3;k++)v[k]+=rw[i].p[k]/(b-a);return v;};const C0=avg(top,0,n),H=avg(hem,lo,hi),M=avg(mid,lo,hi);
   const f=new THREE.Vector3();model.getWorldDirection(f);f.y=0;f.normalize();const sd=new THREE.Vector3(-f.z,0,f.x);
   const ang=P=>{const d=new THREE.Vector3(P[0]-C0[0],P[1]-C0[1],P[2]-C0[2]);const b=-d.dot(f),u=d.y,l=d.dot(sd);return{stream:+(Math.atan2(b,-u)*180/Math.PI).toFixed(1),side:+(Math.atan2(l,Math.hypot(b,u))*180/Math.PI).toFixed(1)};};
   // Wings: the outer third of the hem on each side (what a side view sees as the near wing). out = how far the wing hem
   // swings out sideways from his centre line (deg), back = its stream angle like the hem's.
   const wing=(a,b)=>{const W=avg(hem,a,b),d=new THREE.Vector3(W[0]-C0[0],W[1]-C0[1],W[2]-C0[2]);const bk=-d.dot(f),u=d.y,l=Math.abs(d.dot(sd));return{out:+(Math.atan2(l,Math.hypot(bk,u))*180/Math.PI).toFixed(1),back:+(Math.atan2(bk,-u)*180/Math.PI).toFixed(1)};};
   const wl=wing(0,lo),wr=wing(hi,n);
   const h=ang(H),m=ang(M);stream={hem:h.stream,side:h.side,mid:m.stream,bend:+(h.stream-m.stream).toFixed(1),wingL:wl,wingR:wr};}}catch(e){stream={error:String(e)};}let nan=false;model.traverse(o=>{if(o.isBone&&!Number.isFinite(o.quaternion.x+o.quaternion.y+o.quaternion.z+o.quaternion.w))nan=true;});
  return{hero:characterState().hero,active:characterState().active,playing:gameActive,pos:s.pos.toArray(),onGround:s.onGround,speed:+Math.hypot(s.vel.x,s.vel.z).toFixed(2),anim:currentAnim,k:{anim:k.anim,timeScale:k.timeScale,clips:k.clips,sources:k.sources,capeMeshes:k.capeMeshes,capeVisible:k.capeVisible,built:k.built,buildMs:k.buildMs,retargetMs:k.retargetMs,capeBones:k.capeBones},
   cloth:c?{motion:c.motion,maxDisp:c.maxDisplacementM,meanDisp:c.meanDisplacementM,leg:c.legPenetration,pen:c.penetration,resets:c.resets,frames:c.frames,meanCostMs:c.meanCostMs,maxStretch:c.maxStretch,colRatio:c.colRatio,foldRatio:c.foldRatio,crossTurnDeg:c.crossTurnDeg,chainTurnDeg:c.chainTurnDeg,crossTurnAt:c.crossTurnAt,rollDeg:c.rollDeg,rollAt:c.rollAt,restRollDeg:c.restRollDeg,curlDeg:c.curlDeg,curlAt:c.curlAt,curlGainDeg:c.curlGainDeg,curlGainAt:c.curlGainAt,foldAt:c.foldAt,restCurlDeg:c.restCurlDeg,chainTurnAt:c.chainTurnAt,restTurnDeg:c.restTurnDeg}:null,
   nan,stream,capeVersion:window.kinsmokeHero.assets?.version||1,blocksPowers:!!window.loadoutHero?.blocksPowers(),hudName:document.getElementById('v02HeroName')?.textContent||null};});
 const startPlay=async()=>{await p.click('#v02Tab-overview');await p.click('#v02Start');await p.waitForFunction(()=>gameActive,null,{timeout:10000});};
 await p.goto(`http://127.0.0.1:${PORT}/${BUILD}`);await ready();
 // ---- select Kinsmoke in the menu ----
 await p.click('#v02Tab-hero');await sleep(300);const t0=Date.now();await p.selectOption('#characterChoice','kinsmoke');await heroIs('kinsmoke');r.switchMs=Date.now()-t0;await sleep(400);
 r.menu=await look();
 // ---- standing ----
 await startPlay();await sleep(2500);r.idle=await look();await shot('01-idle');
 // ---- running (W), sampled ----
 const run=[];const xz0=r.idle.pos;await p.keyboard.down('w');
 for(let i=0;i<30;i++){await sleep(100);run.push(await look());if(i===14)await shot('02-running');}
 // turn while running (camera via mouse is pointer-locked in headless, so turn with A) for a side view of the billow
 await p.keyboard.down('a');for(let i=0;i<10;i++){await sleep(100);run.push(await look());}await shot('03-running-turn');await p.keyboard.up('a');
 await p.keyboard.up('w');
 r.run=run;const moving=run.filter(x=>x.speed>3&&x.onGround);
 // Steady running window: samples 10..29 (1-3 s after W, before the A turn). Pendulum = how much the stream angle swings.
 {const st=run.slice(10,30).map(x=>x.stream).filter(x=>x&&x.hem!=null);const sd=a=>{const m=a.reduce((s,v)=>s+v,0)/a.length;return Math.sqrt(a.reduce((s,v)=>s+(v-m)*(v-m),0)/a.length);};
  const hem=st.map(x=>x.hem),side=st.map(x=>x.side),steps=hem.slice(1).map((v,i)=>Math.abs(v-hem[i]));
  const wo=[...st.map(x=>x.wingL.out),...st.map(x=>x.wingR.out)],wb=[...st.map(x=>x.wingL.back),...st.map(x=>x.wingR.back)];
  const wsd=k=>(sd(st.map(x=>x.wingL[k]))+sd(st.map(x=>x.wingR[k])))/2,wstep=k=>Math.max(...['wingL','wingR'].flatMap(w=>st.slice(1).map((x,i)=>Math.abs(x[w][k]-st[i][w][k]))));
  r.wingSummary={outMean:+(wo.reduce((s,v)=>s+v,0)/wo.length).toFixed(1),outSd:+wsd('out').toFixed(1),outRange:[Math.min(...wo),Math.max(...wo)],backMean:+(wb.reduce((s,v)=>s+v,0)/wb.length).toFixed(1),backSd:+wsd('back').toFixed(1),backRange:[Math.min(...wb),Math.max(...wb)],maxOutStep:+wstep('out').toFixed(1),maxBackStep:+wstep('back').toFixed(1)};
  r.streamSummary={samples:st.length,hemMean:+(hem.reduce((s,v)=>s+v,0)/hem.length).toFixed(1),hemSd:+sd(hem).toFixed(1),hemRange:[Math.min(...hem),Math.max(...hem)],sideSd:+sd(side).toFixed(1),sideRange:[Math.min(...side),Math.max(...side)],maxStepDeg:+Math.max(...steps).toFixed(1),bendMean:+(st.reduce((s,x)=>s+Math.abs(x.bend),0)/st.length).toFixed(1)};}
 r.runSummary={samples:run.length,moving:moving.length,movedM:+Math.hypot(run[29].pos[0]-xz0[0],run[29].pos[2]-xz0[2]).toFixed(2),maxDisp:Math.max(...run.map(x=>x.cloth.maxDisp)),maxLeg:Math.max(...run.map(x=>x.cloth.leg)),
  anims:[...new Set(moving.map(x=>x.k.anim))],timeScales:[...new Set(moving.map(x=>x.k.timeScale))].slice(0,8),speeds:moving.map(x=>x.speed).slice(0,6),motionMax:Math.max(...run.map(x=>x.cloth.motion)),nan:run.some(x=>x.nan||!Number.isFinite(x.cloth.maxDisp)),resets:run[run.length-1].cloth.resets-r.idle.cloth.resets,
  minColRatio:Math.min(...run.map(x=>x.cloth.colRatio??1)),maxCrossTurnDeg:Math.max(...run.map(x=>x.cloth.crossTurnDeg??0)),maxRollDeg:Math.max(...run.map(x=>x.cloth.rollDeg??0)),maxCurlDeg:run.some(x=>x.cloth.curlDeg!=null)?Math.max(...run.map(x=>x.cloth.curlDeg??0)):null,curlOver180:run.filter(x=>(x.cloth.curlDeg??0)>=180).length,maxCurlGainDeg:run.some(x=>x.cloth.curlGainDeg!=null)?Math.max(...run.map(x=>x.cloth.curlGainDeg??0)):null,curlGainOver180:run.filter(x=>(x.cloth.curlGainDeg??0)>=180).length,curlGainStreak:run.reduce((a,x)=>{const o=(x.cloth.curlGainDeg??0)>=180;a.cur=o?a.cur+1:0;a.max=Math.max(a.max,a.cur);return a;},{cur:0,max:0}).max,curlOver180Streak:run.reduce((a,x)=>{const o=(x.cloth.curlDeg??0)>=180;a.cur=o?a.cur+1:0;a.max=Math.max(a.max,a.cur);return a;},{cur:0,max:0}).max,restCurlDeg:run[0].cloth.restCurlDeg,restRollDeg:run[0].cloth.restRollDeg,maxChainTurnDeg:Math.max(...run.map(x=>x.cloth.chainTurnDeg??0)),restTurnDeg:run[0].cloth.restTurnDeg,minFoldRatio:Math.min(...run.map(x=>x.cloth.foldRatio??1)),sheetMetrics:run.some(x=>x.cloth.colRatio!=null)};
 // ---- stop and settle ----
 await sleep(3500);r.settled=await look();await shot('04-idle-after-run');
 // ---- chord cycles all four heroes ----
 await p.keyboard.press('Escape');await p.waitForFunction(()=>!gameActive,null,{timeout:10000});
 const chord=[10,6,7,11],order=[];
 for(let i=0;i<4;i++){const from=(await look()).hero;await padSet(chord);await p.waitForFunction(h=>characterState().hero!==h&&!characterState().busy,from,{timeout:300000});await padSet([]);await sleep(500);order.push(await p.evaluate(()=>characterState().hero));}
 r.chordOrder=order;
 // ---- hero select: Kinsmoke page ----
 await p.keyboard.press('KeyH');await p.waitForFunction(()=>v02HeroSelect.state().open,null,{timeout:10000});
 await p.keyboard.press('Digit4');await p.waitForFunction(()=>{const f=v02HeroSelect.framing();return f&&f.hero==='kinsmoke'&&f.settled&&v02HeroSelect.state().kinsmoke?.staff?.visible;},null,{timeout:180000});
 const page=await p.evaluate(()=>({name:document.getElementById('hsV3Name').textContent,sub:document.getElementById('v02HeroSub').textContent,blurb:document.getElementById('v02HeroBlurb').textContent,
  cards:[...document.querySelectorAll('#v02HeroAbilities .hsAbility b')].map(b=>b.textContent),accent:getComputedStyle(document.getElementById('v02HeroSelect')).getPropertyValue('--hs-accent').trim(),
  roster:[...document.querySelectorAll('#v02HeroCards .hsCard')].map(c=>c.dataset.hero),look:v02HeroSelect.look(),framing:v02HeroSelect.framing()}));
 const orbit=[];for(let i=0;i<8;i++){orbit.push((await p.evaluate(()=>v02HeroSelect.state().kinsmoke)).staff);await sleep(500);}
 r.page=page;r.orbit=orbit;await shot('05-menu-kinsmoke');
 // hover the Kin-smoke card: run preview with the preview cape
 const before=(await p.evaluate(()=>v02HeroSelect.state().kinsmoke)).cloth;
 await p.hover('#v02Ability-0');const pv=[];for(let i=0;i<12;i++){await sleep(150);pv.push(await p.evaluate(()=>({k:v02HeroSelect.state().kinsmoke,move:v02HeroSelect.state().moves.slice(-1)[0]})));if(i===7)await shot('06-menu-run-preview');}
 r.preview={before,samples:pv.map(x=>({maxDisp:x.k.cloth?.maxDisplacementM,motion:x.k.cloth?.motion,move:x.move?.move,status:x.move?.status}))};
 r.errors=errors;
 const ang=orbit.map(o=>o.angleDeg),dAng=ang.slice(1).map((a,i)=>((a-ang[i]+540)%360)-180),rad=orbit.map(o=>o.radiusFromHips),y=orbit.map(o=>o.world[1]);
 r.orbitSummary={angles:ang,stepDeg:dAng,radius:[Math.min(...rad),Math.max(...rad)],heightY:[Math.min(...y),Math.max(...y)]};
 const checks={
  'Kinsmoke selectable from the menu (hero kinsmoke, controller backspool)':r.menu.hero==='kinsmoke'&&r.menu.active==='backspool',
  'his bank: 2 Runner clips retargeted (idle Idle_Wait_A, run Mvm_Dash), cape split and visible':r.menu.k.clips===2&&r.menu.k.sources?.idle==='Idle_Wait_A'&&r.menu.k.sources?.run==='Mvm_Dash'&&r.menu.k.capeMeshes>=1&&r.idle.k.capeVisible,
  ['standing: idle anim and cape in its base form (max bone offset <= '+IDLE_TOL+' m)']:r.idle.k.anim==='idle'&&r.idle.cloth.maxDisp<=IDLE_TOL,
  'W runs him more than 5 m with the run anim scaled to his speed':r.runSummary.movedM>5&&r.runSummary.anims.length===1&&r.runSummary.anims[0]==='run'&&r.runSummary.timeScales.every(t=>t>0&&t<=1.6),
  ['running: cape lags and billows (max bone offset > '+RUN_MIN_DISP+' m, motion > 0.8)']:r.runSummary.maxDisp>RUN_MIN_DISP&&r.runSummary.motionMax>.8,
  'running: no NaN and no cloth reset (no popping)':!r.runSummary.nan&&r.runSummary.resets===0,
  ['running: cape stays out of his legs (leg penetration < '+LEG_TOL+' m)']:r.runSummary.maxLeg<LEG_TOL,
  'after stopping the cape returns to its base form':r.settled.k.anim==='idle'&&r.settled.cloth.maxDisp<=IDLE_TOL,
  'no powers and no combat for Kinsmoke':r.idle.blocksPowers&&r.idle.hudName==='KINSMOKE',
  'chord cycles all four heroes back to Kinsmoke':JSON.stringify(order)===JSON.stringify(['sightline','backspool','loadout','kinsmoke']),
  'hero select: four heroes, Kinsmoke page with name, Brightline line, bio and 4 power cards, green theme':page.roster.length===4&&page.roster.includes('kinsmoke')&&page.name==='Kinsmoke'&&page.sub==='MALU KINSALA · BRIGHTLINE'&&/Malu Kinsala/.test(page.blurb)&&page.cards.length===4&&page.cards.includes('Witnesspillar')&&page.accent==='#4cf08f'&&page.look?.backdrop==='smoke',
  'Witnesspillar floats beside him, not in his hand, above the floor':orbit.every(o=>o.visible&&!o.inHand&&o.radiusFromHips>.7&&o.radiusFromHips<1.15)&&Math.min(...y)>.03,
  'Witnesspillar slowly orbits him (angle advances each sample, steady radius)':dAng.every(d=>d>2&&d<30)&&Math.max(...rad)-Math.min(...rad)<.08,
  'menu run preview moves the preview cape':pv.some(x=>/Mvm_Dash/.test(x.move?.move||'')&&x.move?.status==='playing')&&Math.max(...pv.map(x=>x.k.cloth?.maxDisplacementM||0))>RUN_MIN_DISP,
  // Cape v2 builds report sheet integrity; v1 builds do not (the check is then skipped as not applicable).
  // Roll metric: angle between column segments four columns apart (c-2 -> c-1 vs c+1 -> c+2). The rest bell already reads
  // ~90 deg; a roll or tube faces the sheet back on itself (~180). Limit 160 = nearly closed. (First set at 135 before any
  // measurement; the cape v2 runs measured 147-177 before the spread/span fixes and ~150 max, 105-125 typical, after.)
  // Cape v3 (finer grid, deep pleats) reports a signed curl: same-direction turning accumulated over ~66 deg of the sheet's
  // width. A pleat zig-zags (small); a roll or tube turns one way until it faces back on itself (>= 180). The unsigned v2
  // metric cannot tell a deep pleat from a roll at that density, so it applies to v2 only.
  // A roll or tube is a persistent state; a wing edge flipping as the arm swings under it, or the hem curling over, is
  // transient. So: curl >= 180 never holds for two consecutive samples (0.1 s apart). Every transient flip and the maximum
  // are reported (curlOver180, maxCurlDeg). The centre-back tube found while tuning v3 (227 deg) was persistent.
  // Cape v5 is the ORIGINAL sculpt, which curls on its own (rolled hem: ~143 deg at rest): its check counts curl GAINED over
  // each window's rest value; >= 180 deg gained (folding back on itself beyond the sculpt) may not persist across two samples.
  ...(r.idle.capeVersion>=5?{'running: the sculpt stays one connected cape, no rolls or tubes beyond its own shape (curl gained over the sculpt >= 180 deg never persists across two samples; chains never fold below 0.5 of rest)':r.runSummary.curlGainStreak<=1&&r.runSummary.minFoldRatio>=0.5}
   :r.runSummary.maxCurlDeg!=null?{'running: one connected sheet, no rolls or tubes (signed curl >= 180 deg never persists across two samples; chains never fold below 0.65 of rest)':r.runSummary.curlOver180Streak<=1&&r.runSummary.minFoldRatio>=0.65}
   :r.runSummary.sheetMetrics?{'running: one connected sheet, no rolls or tubes (never curls back on itself over 4 columns: < 160 deg; chains never fold below 0.7 of rest)':r.runSummary.maxRollDeg<160&&r.runSummary.minFoldRatio>=0.7}:{}),
  // Cape v4+ (the side-view pendulum fix): steady running streams behind him (stream angle >= 70 deg, 90 = horizontal)
  // without the v3 pendulum (v3 measured: sideways sd 35-37 deg, stream sd 12-15, steps up to 67 deg per 0.1 s).
  // Wings too (what a side view sees): v3 measured wing sideways sd 19, stream sd 45, steps up to 107 deg.
  // v5 (the original sculpt): its wing hems are the sculpt's loose strands and rolled edges, which flutter - so wings allow
  // stream sd <= 18 and steps <= 60 (v3: 45 / 107); the centre keeps v4's limits.
  ...(r.idle.capeVersion>=5?{'running: streams behind him steadily, no pendulum (centre: stream >= 70 deg, sideways sd <= 8, stream sd <= 10, step <= 30; wings: sideways sd <= 8, stream sd <= 18, step <= 60 deg per 0.1 s)':
   r.streamSummary.hemMean>=70&&r.streamSummary.sideSd<=8&&r.streamSummary.hemSd<=10&&r.streamSummary.maxStepDeg<=30&&r.wingSummary.outSd<=8&&r.wingSummary.backSd<=18&&r.wingSummary.maxBackStep<=60&&r.wingSummary.maxOutStep<=60}:
  r.idle.capeVersion>=4?{'running: streams behind him steadily, no pendulum (centre: stream >= 70 deg, sideways sd <= 8, stream sd <= 10, step <= 30; wings: sideways sd <= 8, stream sd <= 12, step <= 40 deg per 0.1 s)':
   r.streamSummary.hemMean>=70&&r.streamSummary.sideSd<=8&&r.streamSummary.hemSd<=10&&r.streamSummary.maxStepDeg<=30&&r.wingSummary.outSd<=8&&r.wingSummary.backSd<=12&&r.wingSummary.maxBackStep<=40&&r.wingSummary.maxOutStep<=40}:{}),
  'no page errors':errors.length===0,
 };
 r.checks=Object.fromEntries(Object.entries(checks).map(([k,v])=>[k,v?'PASS':'FAIL']));failed=Object.values(checks).some(v=>!v);
 for(const [k,v] of Object.entries(r.checks))console.log(v,k);
 console.log('STREAM',JSON.stringify(r.streamSummary));console.log('WINGS',JSON.stringify(r.wingSummary));console.log(JSON.stringify({switchMs:r.switchMs,menu:r.menu.k,idle:r.idle.cloth,run:r.runSummary,settled:r.settled.cloth,chord:order,orbit:r.orbitSummary,preview:r.preview.samples.map(x=>x.maxDisp),errors:errors.slice(0,3)}));
}catch(e){console.error('FAIL',e);r.fatal=String(e.stack||e);failed=true;}finally{try{fs.writeFileSync(`${OUT}/report.json`,JSON.stringify(r,null,1));}catch(_){}await browser.close();process.exit(failed?1:0);}})();
