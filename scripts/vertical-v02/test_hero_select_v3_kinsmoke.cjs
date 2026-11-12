/* Kinsmoke branch copy of test_hero_select_v3.cjs: identical except that the roster has FOUR heroes (Kinsmoke added):
   four preview rigs, four-step wrap, Kinsmoke (Digit4) in the framing runs (20 runs, so the cartridge and costume run counts are 20 too), and
   his rig in previewRenderedAllRigs. */
/* Real-input test for the hero select v3 redesign (scripts/game_v02_hero_select_v3.js). v1/v2 keep their own tests.
   Input is normal player input throughout: Playwright keyboard, mouse (hover and click), touch taps (a hasTouch page) and a
   standard-mapping test gamepad pressed and released like a real pad. page.evaluate only READS state; the one exception
   is labelled test setup (Esc to pause on the touch page).
   Covers every v2 check (heroes, costumes, cartridge, chord, leaks, resume, framing) adapted to the v3 layout, plus:
   - look: painted backdrop per hero (rooftop / above / street), hero-coloured key and rim, huge name word behind the
     model, Backspool's canon subtitle, a large low-camera figure, one radar chart, icon ability cards, no framed panels;
   - motion: slash wipe and camera dolly on hero change, signature pose on selection, ability previews by keyboard (Q/E),
     mouse hover, controller X and touch tap; Afterstep glass-shard pulse short and gone;
   - Controls tab per hero (keyboard C, controller Y, mouse), with Loadout's power keys absent;
   - preload: every hero's game bank prewarmed on open; the first Loadout switch and the chord are then fast;
   - frame intervals with the painted backdrop (headless ANGLE/Metal, so indicative only); unique element ids.
   Usage: node scripts/vertical-v02/test_hero_select_v3.cjs [V02_Hero_Select_V3_Build.json]   (V02_PORT, default 8767)
   Evidence: development/vertical-city-v02/evidence/hero-select-v3/ (report.json + screenshots), or V02_HERO_SELECT_OUT. */
const{chromium}=require('/opt/homebrew/lib/node_modules/playwright'),fs=require('fs'),crypto=require('crypto');
const D='development/vertical-city-v02/',build=JSON.parse(fs.readFileSync(D+(process.argv[2]||process.env.V02_ACTION_BUILD||'V02_Hero_Select_V3_Build.json')));
const OUT=process.env.V02_HERO_SELECT_OUT||D+'evidence/hero-select-v3';fs.mkdirSync(OUT,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal','--mute-audio']}),errors=[],result={build:build.entry,entrySHA256:build.entrySHA256,steps:{},checks:{},notes:[]};
 const check=(name,ok,detail)=>{result.checks[name]=!!ok;if(detail!==undefined)result.steps[name]=detail;console.log((ok?'PASS ':'FAIL ')+name+(detail!==undefined?' '+JSON.stringify(detail):''));};
 let p;
 try{
  check('recordMatchesFile',crypto.createHash('sha256').update(fs.readFileSync(build.entry)).digest('hex')===build.entrySHA256);
  p=await browser.newPage({viewport:{width:1280,height:800}});p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(()=>{const up={pressed:false,value:0};window.testPad={id:'test pad',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>up)};navigator.getGamepads=()=>[window.testPad];});
  // ---- pad helpers: hold buttons/axes for a few frames, then release (the engine polls the pad once per frame) ----
  const padSet=(buttons=[],axes=[0,0,0,0])=>p.evaluate(([b,a])=>{testPad.buttons=testPad.buttons.map((x,i)=>b.includes(i)?{pressed:true,value:1}:{pressed:false,value:0});testPad.axes=a;},[buttons,axes]);
  const padTap=async(buttons,axes=[0,0,0,0],hold=150)=>{await padSet(buttons,axes);await sleep(hold);await padSet([]);await sleep(150);};
  const state=()=>p.evaluate(()=>({hero:characterState().hero,busy:characterState().busy,gameActive,menu:document.getElementById('menu').style.display,hs:v02HeroSelect.state(),pos:[s.pos.x,s.pos.y,s.pos.z]}));
  const dist=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2]);
  const waitSwitched=hero=>p.waitForFunction(h=>characterState().hero===h&&!characterState().busy&&gameActive&&!v02HeroSelect.state().open,hero,{timeout:300000});
  const moveWithKey=async(label)=>{const a=(await state()).pos;await p.keyboard.down('KeyW');await sleep(1400);await p.keyboard.up('KeyW');await sleep(200);const b=(await state()).pos;return{label,moved:+dist(a,b).toFixed(2)};};
  const moveWithStick=async(label)=>{const a=(await state()).pos;await padSet([],[0,-1,0,0]);await sleep(1400);await padSet([]);await sleep(200);const b=(await state()).pos;return{label,moved:+dist(a,b).toFixed(2)};};

  // ---- 1. boot ----
  const t0=Date.now();await p.goto('http://127.0.0.1:'+(process.env.V02_PORT||'8767')+'/'+build.entry+'?capture=backspool');
  await p.waitForFunction(()=>typeof gameReady!=='undefined'&&gameReady&&window.characterState&&!characterState().busy&&window.v02HeroSelect?.state().ready,null,{timeout:300000});
  result.loadSeconds=+((Date.now()-t0)/1000).toFixed(1);
  await p.locator('#v02Start').click();await p.waitForFunction(()=>gameActive,null,{timeout:20000});await sleep(800);
  const startHero=(await state()).hero;result.startHero=startHero;
  const scripts=await p.evaluate(()=>[...document.scripts].map(s=>s.getAttribute('src')||'').filter(s=>s.includes('game_v02_hero_select')));
  check('loadsV3ModuleOnly',scripts.length===1&&scripts[0].startsWith('scripts/game_v02_hero_select_v3.js'),{scripts});
  check('bootAndEnterDistrict',(await state()).gameActive,{startHero,loadSeconds:result.loadSeconds});

  // ---- 2. keyboard ----
  await p.keyboard.press('Escape');await sleep(400);
  let s0=await state();
  const entry=await p.evaluate(()=>({footer:!!document.querySelector('#v02MenuFooter #v02HeroSelectQuick'),heroTab:!!document.querySelector('#v02Pane-hero #v02HeroSelectOpen')}));
  check('escPausesAndEntryPointsExist',!s0.gameActive&&s0.menu!=='none'&&entry.footer&&entry.heroTab,entry);
  await p.screenshot({path:OUT+'/01-pause-menu.png'});
  await p.keyboard.press('KeyH');await sleep(300);s0=await state();
  check('keyboardHOpens',s0.hs.open&&s0.hs.focus===startHero&&!s0.gameActive,{focus:s0.hs.focus});
  await p.waitForFunction(()=>Object.values(v02HeroSelect.state().rigs).filter(r=>r.status==='ready').length===4,null,{timeout:180000});
  const order=[];for(let i=0;i<4;i++){order.push((await state()).hs.focus);await p.keyboard.press('ArrowDown');await sleep(120);}
  const wrapRight=(await state()).hs.focus;await p.keyboard.press('ArrowUp');await sleep(120);const wrapLeft=(await state()).hs.focus;
  check('keyboardArrowsBrowseAndWrap',new Set(order).size===4&&wrapRight===order[0]&&wrapLeft===order[3],{order,wrapRight,wrapLeft});
  // Framing: every hero, shown twice (a hero leaving and coming back must keep its ground offset), at three viewports.
  // The model's on-screen box must be fully inside the stage, below the name plate and description, clear of every panel,
  // and the feet must stand on the base.
  const framingRuns=[],cartRuns=[],costumeRuns=[];
  const frameCheck=async(vp,hero,key,shot)=>{await p.keyboard.press(key);
   await p.waitForFunction(h=>{const f=v02HeroSelect.framing();return f&&f.hero===h&&f.settled;},hero,{timeout:20000});await sleep(150);
   const f=await p.evaluate(()=>{const r=e=>{const b=e.getBoundingClientRect();return{left:b.left,right:b.right,top:b.top,bottom:b.bottom};};
    // v3 text blocks and panels sit on the scene; the model must not overlap any of them (the huge name word is meant to be behind it).
    const panels=['.hsId','.hsRoster','.hsChart','.hsTabs','#v02HeroAbilities','.hsBar'].map(s=>({name:s,...r(document.querySelector('#v02HeroSelect '+s))}));
    const bar=document.getElementById('v02CostumeBar'),barOn=!bar.hidden&&bar.getClientRects().length>0;
    const costume=barOn?{label:document.getElementById('v02HeroCostume').textContent,parts:['v02CostumePrev','v02CostumeNext'].map(id=>({name:id,...r(document.getElementById(id))}))}:null;
    return{...v02HeroSelect.framing(),textBottom:-1,panels,cart:v02HeroSelect.cartridge(),costume};});
   const cartFrames0=f.cart.frames;await sleep(400);const cartFrames1=await p.evaluate(()=>v02HeroSelect.cartridge().frames);
   const m=f.model,c=f.canvas,hit=q=>m.left<q.right&&m.right>q.left&&m.top<q.bottom&&m.bottom>q.top;
   const overlaps=f.panels.filter(hit).map(q=>q.name);
   const ok=m.top>=c.top+2&&m.bottom<=c.bottom&&m.left>=c.left&&m.right<=c.right&&!overlaps.length&&Math.abs(f.worldMinY)<.06&&m.bottom>=f.base.top&&m.bottom<=f.base.bottom;
   // Backspool's cartridge card: shown and drawing for him only, clear of text, panels and the hero model, and the
   // deployed cartridge's projected box inside the card's view (3 px tolerance for the conservative box projection).
   const k=f.cart,fg=k.figure,inside=(a,b,tol=0)=>a.left>=b.left-tol&&a.right<=b.right+tol&&a.top>=b.top-tol&&a.bottom<=b.bottom+tol;
   const cartOk=hero.startsWith('backspool')?(k.status==='ready'&&k.visible&&cartFrames1>cartFrames0&&k.lastPassTriangles>1000&&inside(fg,c)&&!hit(fg)&&!f.panels.some(q=>fg.left<q.right&&fg.right>q.left&&fg.top<q.bottom&&fg.bottom>q.top)&&inside(k.projected,k.view,3))
    :(!k.visible&&cartFrames1===cartFrames0);
   cartRuns.push({viewport:vp,hero,ok:cartOk,visible:k.visible,framesAdvanced:cartFrames1-cartFrames0,passTriangles:k.lastPassTriangles,figure:fg,view:k.view,projected:k.projected,deploy:k.deploy});
   // Backspool's costume carousel: arrows and label on his page only, with the right label, clear of his model, every
   // text block and panel, and the cartridge card.
   const cs=f.costume,expectLabel={'backspool':'Costume 1/2 · Default','backspool@halfmask':'Costume 2/2 · Half mask'}[hero];
   const clash=q=>[m,...f.panels,...(fg?[fg]:[])].some(o=>q.left<o.right&&q.right>o.left&&q.top<o.bottom&&q.bottom>o.top)||!inside(q,c);
   const costumeOk=hero.startsWith('backspool')?(!!cs&&cs.label===expectLabel&&!cs.parts.some(clash)):!cs;
   costumeRuns.push({viewport:vp,hero,ok:costumeOk,label:cs?.label||null,clashes:cs?cs.parts.filter(clash).map(q=>q.name):[]});
   framingRuns.push({viewport:vp,hero,ok,modelTop:m.top,textBottom:+f.textBottom.toFixed(1),canvasTop:+c.top.toFixed(1),modelBottom:m.bottom,base:[f.base.top,f.base.bottom],worldMinY:f.worldMinY,worldMaxY:f.worldMaxY,overlaps});
   if(shot)await p.screenshot({path:OUT+'/framing-'+vp+'-'+hero+'.png'});};
  // ArrowRight on Backspool's page shows his half-mask costume; 1-3 pick heroes (and reset the carousel to his worn costume).
  const heroKeys=[['backspool','Digit1'],['backspool@halfmask','ArrowRight'],['sightline','Digit2'],['loadout','Digit3'],['kinsmoke','Digit4']];
  for(const [hero,key] of heroKeys)await frameCheck('1280x800',hero,key,false);
  for(const [hero,key] of heroKeys)await frameCheck('1280x800',hero,key,true);
  for(const [w,h] of [[1920,1080],[1024,768]]){await p.setViewportSize({width:w,height:h});await sleep(300);for(const [hero,key] of heroKeys)await frameCheck(w+'x'+h,hero,key,true);}
  await p.setViewportSize({width:1280,height:800});await sleep(300);await p.keyboard.press('Digit'+(1+['backspool','sightline','loadout'].indexOf(startHero)));await sleep(200);
  check('previewFramingClearOfTextAndOnBase',framingRuns.length===20&&framingRuns.every(r=>r.ok),{failures:framingRuns.filter(r=>!r.ok),runs:framingRuns.length});
  result.framing=framingRuns;
  check('cartridgeDisplayBackspoolOnly',cartRuns.length===20&&cartRuns.every(r=>r.ok),{failures:cartRuns.filter(r=>!r.ok),runs:cartRuns.length,glb:(await p.evaluate(()=>v02HeroSelect.cartridge())).url});
  result.cartridge=cartRuns;
  check('costumeCarouselBackspoolOnly',costumeRuns.length===20&&costumeRuns.every(r=>r.ok),{failures:costumeRuns.filter(r=>!r.ok),runs:costumeRuns.length});
  result.costumeCarousel=costumeRuns;
  // ---- v3 look and function (screen open) ----
  const look=()=>p.evaluate(()=>({look:v02HeroSelect.look(),f:v02HeroSelect.framing(),hs:v02HeroSelect.state(),
   id:{name:document.getElementById('hsV3Name').textContent,sub:document.getElementById('v02HeroSub').textContent,nameRect:document.getElementById('hsV3Name').getBoundingClientRect().height},
   boxes:['.hsId','.hsRoster','.hsChart','.hsSide'].map(s=>{const cs=getComputedStyle(document.querySelector('#v02HeroSelect '+s));return{s,border:cs.borderTopWidth,bg:cs.backgroundColor};}),
   radar:document.querySelectorAll('#v02HeroRadar polygon.hsShape').length,abilities:[...document.querySelectorAll('#v02HeroAbilities .hsAbility')].map(b=>!!b.querySelector('svg'))}));
  const BACKDROP={backspool:'rooftop',sightline:'above',loadout:'street'},KEY={backspool:'#ffc23a',sightline:'#ff3b47',loadout:'#8a5cff'},RIM={backspool:'#5fe3e8',sightline:'#3552e0',loadout:'#4a2399'};
  const near=(a,b)=>{const x=parseInt(a.slice(1),16),y=parseInt(b.slice(1),16);return [16,8,0].every(s=>Math.abs((x>>s&255)-(y>>s&255))<=18);};
  const preloadDone=await p.waitForFunction(()=>v02HeroSelect.state().preload.done,null,{timeout:240000}).then(()=>true,()=>false);
  const pre=await p.evaluate(()=>({pl:v02HeroSelect.state().preload,warm:characterSwitcher.warmBanks?.()}));
  check('preloadEveryHeroBankOnOpen',preloadDone&&['loadout','backspool@halfmask'].every(k=>pre.warm?.banks.includes(k))&&Object.values(pre.pl.keys).every(k=>k.status==='ready'||k.status==='unavailable'),{preload:pre.pl,banks:pre.warm?.banks,note:'maxFrameMs is the longest frame gap while banks were built: the menu hitches then, switches afterwards do not'});
  const lookRuns=[];
  for(const [hero,key] of [['backspool','Digit1'],['sightline','Digit2'],['loadout','Digit3']]){
   await p.keyboard.press(key);await p.waitForFunction(h=>{const f=v02HeroSelect.framing();return f&&f.hero===h&&f.settled;},hero,{timeout:20000});
   await p.evaluate(()=>v02HeroSelect.resetFrameTimes());await sleep(2500);const L=await look();await p.screenshot({path:OUT+'/v3-'+hero+'.png'});
   const m=L.f.model,hFrac=(m.bottom-m.top)/(L.f.canvas.bottom-L.f.canvas.top);
   const ok=L.look.paint&&L.look.backdrop===BACKDROP[hero]&&near(L.look.key,KEY[hero])&&near(L.look.rim,RIM[hero])&&L.look.word===hero&&L.look.wordBehind&&L.f.word.left>=L.f.canvas.left-2&&L.f.word.right<=L.f.canvas.right+2
    &&hFrac>=.7&&L.look.camera[1]<.98&&L.id.name.toLowerCase()===hero&&L.id.nameRect>30&&(hero!=='backspool'||/aramis ward · sunday row/i.test(L.id.sub))
    &&L.radar===1&&L.abilities.length===4&&L.abilities.every(Boolean)&&L.boxes.every(b=>b.border==='0px'&&/rgba\(0, 0, 0, 0\)|transparent/.test(b.bg));
   lookRuns.push({hero,ok,backdrop:L.look.backdrop,paint:L.look.paint,key:L.look.key,rim:L.look.rim,word:L.look.word,wordRect:L.f.word,heightFraction:+hFrac.toFixed(2),camera:L.look.camera,sub:L.id.sub,nameRectHeight:L.id.nameRect,boxes:L.boxes,frameCpuMs:L.look.frameMs,frameIntervalMs:L.look.intervalMs,backdrops:L.look.backdrops});
  }
  check('v3LookPerHero',lookRuns.every(r=>r.ok),{runs:lookRuns});result.v3Look=lookRuns;
  // Wipe and dolly: sample right after a hero change.
  await p.keyboard.press('Digit1');await sleep(1200);const w0=(await look()).hs.wipes;await p.keyboard.press('Digit2');await sleep(90);
  const trA=await p.evaluate(()=>({dolly:v02HeroSelect.look().dolly,wipe:(()=>{const w=document.querySelector('#v02HeroSelect .hsWipe');return{go:w.classList.contains('go'),anim:getComputedStyle(w).animationName};})(),wipes:v02HeroSelect.state().wipes}));
  await p.screenshot({path:OUT+'/transition-1-wipe.png'});await sleep(220);await p.screenshot({path:OUT+'/transition-2-dolly.png'});await sleep(900);const tB=(await look()).look.dolly;
  check('wipeAndDollyOnHeroChange',trA.wipes===w0+1&&trA.wipe.go&&trA.wipe.anim==='hsWipe'&&trA.dolly>.5&&tB===0,{after90ms:trA,dollyAfter1200ms:tB});
  // Ability previews: keyboard E through all four for each hero (each must resolve a clip), mouse hover, and the Echo pulse.
  const abilityRuns=[];
  for(const [hero,key] of [['backspool','Digit1'],['sightline','Digit2'],['loadout','Digit3']]){
   await p.keyboard.press(key);await p.waitForFunction(h=>{const f=v02HeroSelect.framing();return f&&f.hero===h&&f.settled;},hero,{timeout:20000});
   for(let i=0;i<4;i++){await p.keyboard.press('KeyE');await sleep(i===0&&hero==='backspool'?220:700);if(i===0&&hero==='backspool')await p.screenshot({path:OUT+'/ability-echo-shards.png'});
    const mv=(await state()).hs.moves.slice(-1)[0];abilityRuns.push({hero,i,move:mv?.move,status:mv?.status,clip:mv?.clip,source:mv?.source});}
   await sleep(1200);
  }
  await p.keyboard.press('Digit1');await sleep(1200);await p.hover('#v02Ability-2');await sleep(500);const hov=(await state()).hs.moves.slice(-1)[0];
  await p.screenshot({path:OUT+'/ability-hover-threadrail.png'});
  const echo=(await state()).hs.shardPulses.find(x=>x.move==='bs:Shooting ability out of hand');
  check('abilityPreviewsKeyboardAndHover',abilityRuns.length===12&&abilityRuns.every(r=>/playing|done/.test(r.status)&&r.clip)&&hov?.source==='hover'&&hov.move==='bs:rail grinding',{abilityRuns,hover:hov});
  check('afterstepShardPulseShortAndGone',!!echo&&echo.ended&&echo.endedAfter<=.7&&echo.count>0&&(await state()).hs.shardsLive===0,{echo});
  // Controls tab: keyboard C, mouse click, per-hero bindings.
  const ctl=[];for(const [hero,key] of [['backspool','Digit1'],['sightline','Digit2'],['loadout','Digit3']]){await p.keyboard.press(key);await sleep(300);await p.keyboard.press('KeyC');await sleep(250);
   const c=await p.evaluate(()=>({tab:v02HeroSelect.state().tab,visible:!document.getElementById('v02HeroControls').hidden,text:[...document.querySelectorAll('#v02HeroControls li, #v02HeroControls .grid > div')].map(x=>x.innerText).join('\n'),cart:!document.getElementById('v02HeroCartridge').hidden}));
   if(hero==='backspool')await p.screenshot({path:OUT+'/controls-tab-backspool.png'});
   ctl.push({hero,tab:c.tab,visible:c.visible,cartHidden:!c.cart,threadrail:/Threadrail/.test(c.text),chord:/L3 \+ LT \+ RT \+ R3/.test(c.text),drive:/Afterstep Drive/.test(c.text),chars:c.text.length});
   await p.locator('#v02TabAbilities').click();await sleep(150);}
  const tabBack=(await state()).hs.tab;
  check('controlsTabPerHero',ctl.every(c=>c.tab==='controls'&&c.visible&&c.cartHidden&&c.chars>40)&&ctl[0].threadrail&&ctl[0].chord&&ctl[0].drive&&!ctl[2].drive&&!ctl[2].threadrail&&ctl[2].chord&&tabBack==='abilities',{ctl,tabBack});
  const dupIds=await p.evaluate(()=>[...document.querySelectorAll('#v02HeroSelect [id]')].map(e=>e.id).filter(id=>document.querySelectorAll('#'+CSS.escape(id)).length>1));
  check('uniqueIdsInScreen',dupIds.length===0,{dupIds});
  await p.keyboard.press('Digit'+(1+['backspool','sightline','loadout'].indexOf(startHero)));await sleep(900);
  // Left/right on another hero's page changes nothing (no costumes), and does not browse heroes any more.
  await p.keyboard.press('Digit2');await sleep(300);await p.keyboard.press('ArrowRight');await sleep(300);await p.keyboard.press('ArrowLeft');await sleep(300);
  const sideOnSightline=await state();check('sideKeysIdleOnSightline',sideOnSightline.hs.focus==='sightline'&&sideOnSightline.hs.shown==='sightline',{focus:sideOnSightline.hs.focus,shown:sideOnSightline.hs.shown});
  // Gameplay keys while open must not reach the game.
  const leakA=(await state()).pos;await p.keyboard.down('KeyW');await p.keyboard.press('Space');await sleep(700);await p.keyboard.up('KeyW');const leakB=await state();
  check('keyboardDoesNotLeakIntoGame',dist(leakA,leakB.pos)<0.01&&!leakB.gameActive&&leakB.hs.open&&leakB.hero===startHero&&!leakB.hs.switching,{moved:+dist(leakA,leakB.pos).toFixed(3),open:leakB.hs.open,hero:leakB.hero});
  const gpuOpen=await p.evaluate(()=>v02HeroSelect.cartridge());
  await p.keyboard.press('Escape');await sleep(300);s0=await state();
  check('keyboardEscBacksOutNoSwitch',!s0.hs.open&&!s0.gameActive&&s0.hero===startHero&&s0.menu!=='none');
  const gpuClosed=await p.evaluate(()=>v02HeroSelect.cartridge());
  // Pick Sightline with the keyboard (number key to the card is also normal input; use arrows to reach it).
  await p.keyboard.press('KeyH');await sleep(300);
  // The cartridge's GPU buffers were freed on close and it draws again from the kept, parsed scene on reopen (Backspool).
  await p.keyboard.press('Digit1');await sleep(900);const gpuReopen=await p.evaluate(()=>v02HeroSelect.cartridge());
  check('cartridgeFreedOnCloseAndReused',gpuClosed.gpuFrees>gpuOpen.gpuFrees&&gpuClosed.gpu.geometries<gpuOpen.gpu.geometries&&gpuReopen.frames>gpuClosed.frames&&gpuReopen.lastPassTriangles>1000&&gpuReopen.status==='ready',
   {geometriesOpen:gpuOpen.gpu.geometries,geometriesClosed:gpuClosed.gpu.geometries,texturesOpen:gpuOpen.gpu.textures,texturesClosed:gpuClosed.gpu.textures,frees:gpuClosed.gpuFrees,framesReopen:gpuReopen.frames-gpuClosed.frames});
  await p.screenshot({path:OUT+'/09-backspool-cartridge.png'});
  for(let i=0;i<3&&(await state()).hs.focus!=='sightline';i++){await p.keyboard.press('ArrowDown');await sleep(150);}
  await sleep(1500);await p.screenshot({path:OUT+'/02-hero-select-sightline.png'});
  const kbTarget=(await state()).hs.focus;await p.keyboard.press('Enter');
  await waitSwitched('sightline');await sleep(600);
  const kbMove=await moveWithKey('sightline W');s0=await state();
  check('keyboardPicksSightlineAndResumes',kbTarget==='sightline'&&s0.hero==='sightline'&&s0.gameActive&&kbMove.moved>0.5,{...kbMove,confirms:s0.hs.confirms.slice(-1)});
  await p.screenshot({path:OUT+'/03-playing-sightline.png'});
  { const hs=(await state()).hs,c=hs.confirms.slice(-1)[0],sel=hs.moves.filter(m=>m.source==='select').slice(-1)[0];
    check('signaturePoseOnSelectSightline',c?.signature==='sl:groundAim'&&sel?.move==='sl:groundAim'&&/playing|done/.test(sel?.status)&&!!sel?.clip,{signature:c?.signature,move:sel}); }

  // ---- 3. gamepad ----
  await padTap([9]);await sleep(300);s0=await state();check('padStartPauses',!s0.gameActive&&s0.menu!=='none');
  await padTap([3]);await sleep(300);s0=await state();check('padYOpens',s0.hs.open&&s0.hs.focus==='sightline');
  await padTap([1]);await sleep(300);s0=await state();check('padBBacksOutNoSwitch',!s0.hs.open&&!s0.gameActive&&s0.hero==='sightline');
  await padTap([3]);await sleep(300);
  const padNav=[];
  await padTap([],[0,1,0,0]);padNav.push(['stickDown',(await state()).hs.focus]);
  await padTap([],[0,-1,0,0]);padNav.push(['stickUp',(await state()).hs.focus]);
  await padTap([13]);padNav.push(['dpadDown',(await state()).hs.focus]);
  await padTap([4]);padNav.push(['LB',(await state()).hs.focus]);
  await padTap([5]);padNav.push(['RB',(await state()).hs.focus]);
  await padTap([12]);padNav.push(['dpadUp',(await state()).hs.focus]);
  await padTap([15]);padNav.push(['dpadRightNoCostumes',(await state()).hs.focus]);
  const expectNav=[['stickDown','loadout'],['stickUp','sightline'],['dpadDown','loadout'],['LB','sightline'],['RB','loadout'],['dpadUp','sightline'],['dpadRightNoCostumes','sightline']];
  check('padStickDpadShouldersBrowse',JSON.stringify(padNav)===JSON.stringify(expectNav),{padNav});
  await padTap([2]);await sleep(500);const padTry=(await state()).hs.moves.slice(-1)[0];
  await padTap([3]);await sleep(200);const padTab=(await state()).hs.tab;await padTap([3]);await sleep(200);const padTabBack=(await state()).hs.tab;
  check('padXTriesAbilityYTogglesControls',padTry?.source==='pad'&&/playing|done/.test(padTry?.status)&&padTab==='controls'&&padTabBack==='abilities',{padTry,padTab,padTabBack});
  await padTap([13]);await sleep(1500);await p.screenshot({path:OUT+'/04-hero-select-loadout.png'});
  // Hold A through the switch: the game must stay paused until the switch completes.
  await padSet([0]);const during=[];const tA=Date.now();
  while(Date.now()-tA<300000){const x=await p.evaluate(()=>({hero:characterState().hero,busy:characterState().busy,gameActive,open:v02HeroSelect.state().open,switching:v02HeroSelect.state().switching}));during.push(x);if(x.hero==='loadout'&&!x.busy&&!x.open)break;await sleep(50);}
  await padSet([]);await waitSwitched('loadout');await sleep(600);
  const earlyResume=during.some(x=>x.gameActive&&(x.open||x.hero!=='loadout'));
  const padMove=await moveWithStick('loadout stick');s0=await state();
  check('padPicksLoadoutAndResumes',s0.hero==='loadout'&&s0.gameActive&&padMove.moved>0.5&&!earlyResume,{...padMove,samples:during.length,earlyResume,switchMs:s0.hs.confirms.slice(-1)[0]?.switchMs});
  await p.screenshot({path:OUT+'/05-playing-loadout.png'});
  // The Loadout bank was prewarmed when the screen opened, so the first switch to him does not build it (v2: ~1.2 s).
  { const lc=s0.hs.confirms.slice(-1)[0];check('preloadedFirstLoadoutSwitchFast',lc?.hero==='loadout'&&lc.switchMs<400,{switchMs:lc?.switchMs,poseAndSwitchMs:lc?.totalMs}); }

  // ---- 4. mouse ----
  await p.keyboard.press('Escape');await sleep(400);
  await p.locator('#v02HeroSelectQuick').click();await sleep(300);s0=await state();const mouseOpened=s0.hs.open;
  await p.locator('#v02HeroCard-backspool').click();await sleep(1500);await p.screenshot({path:OUT+'/06-hero-select-backspool.png'});
  const mFocus=(await state()).hs.focus;
  await p.locator('#v02HeroConfirm').click();await waitSwitched('backspool');await sleep(600);
  const mMove=await moveWithKey('backspool W');s0=await state();
  check('mousePicksBackspoolAndResumes',mouseOpened&&mFocus==='backspool'&&s0.hero==='backspool'&&s0.gameActive&&mMove.moved>0.5,{...mMove});
  await p.screenshot({path:OUT+'/07-playing-backspool.png'});
  { const hs=(await state()).hs,sel=hs.moves.filter(m=>m.source==='select').slice(-1)[0],pulse=hs.shardPulses.filter(x=>x.move===sel?.move).slice(-1)[0];
    check('signatureEchoPoseWithShortShardPulse',sel?.move==='bs:Shooting ability out of hand'&&/playing|done/.test(sel?.status)&&pulse?.ended&&pulse.endedAfter<=.7&&hs.shardsLive===0,{move:sel,pulse,shardsLive:hs.shardsLive}); }

  // ---- 4b. Backspool costume carousel: keyboard picks the half mask, the controller and the mouse arrows bring him back ----
  const costumeOf=()=>p.evaluate(()=>({bank:characterSwitcher.bankKey(),costume:backspoolCostume.current(),applied:backspoolCostume.state().appliedBank,heroTab:document.getElementById('backspoolCostume-halfmask')?.getAttribute('aria-checked'),label:document.getElementById('v02HeroCostume').textContent,shown:v02HeroSelect.state().shown,confirm:document.getElementById('v02HeroConfirm').textContent}));
  await p.keyboard.press('Escape');await sleep(300);await p.keyboard.press('KeyH');await sleep(300);
  const k0=await costumeOf();await p.keyboard.press('ArrowRight');
  await p.waitForFunction(()=>{const f=v02HeroSelect.framing();return f&&f.hero==='backspool@halfmask'&&f.settled;},null,{timeout:60000});await sleep(300);
  const k1=await costumeOf();await p.screenshot({path:OUT+'/10-costume-halfmask.png'});
  await p.keyboard.press('Enter');
  await p.waitForFunction(()=>characterSwitcher.bankKey()==='backspool@halfmask'&&!characterState().busy&&gameActive&&!v02HeroSelect.state().open,null,{timeout:300000});await sleep(600);
  const k2=await costumeOf();const hmMove=await moveWithKey('half mask W');s0=await state();
  check('keyboardSelectsHalfMaskInGame',k0.bank==='backspool'&&k1.label==='Costume 2/2 · Half mask'&&/Half mask/.test(k1.confirm)&&k2.bank==='backspool@halfmask'&&k2.costume==='halfmask'&&k2.applied==='backspool@halfmask'&&k2.heroTab==='true'&&s0.hero==='backspool'&&s0.gameActive&&hmMove.moved>0.5,
   {before:k0.bank,label:k1.label,confirm:k1.confirm,after:k2,...hmMove});
  await p.screenshot({path:OUT+'/11-playing-halfmask.png'});
  // Back to Default: controller opens (Y), mouse arrows step the carousel both ways, D-pad left lands on Default, A selects.
  await padTap([9]);await sleep(300);await padTap([3]);await sleep(400);
  const d0=await costumeOf();
  await p.locator('#v02CostumeNext').click();await sleep(250);const dNext=(await costumeOf()).label;
  await p.locator('#v02CostumePrev').click();await sleep(250);const dPrev=(await costumeOf()).label;
  await padTap([14]);await p.waitForFunction(()=>{const f=v02HeroSelect.framing();return f&&f.hero==='backspool'&&f.settled;},null,{timeout:60000});await sleep(300);
  const d1=await costumeOf();await p.screenshot({path:OUT+'/12-costume-default.png'});
  await padTap([0]);
  await p.waitForFunction(()=>characterSwitcher.bankKey()==='backspool'&&!characterState().busy&&gameActive&&!v02HeroSelect.state().open,null,{timeout:300000});await sleep(600);
  const d2=await costumeOf();const dMove=await moveWithStick('default stick');s0=await state();
  check('padAndMouseBringBackDefault',d0.label==='Costume 2/2 · Half mask'&&dNext==='Costume 1/2 · Default'&&dPrev==='Costume 2/2 · Half mask'&&d1.label==='Costume 1/2 · Default'&&d2.bank==='backspool'&&d2.costume==='default'&&d2.heroTab==='false'&&s0.gameActive&&dMove.moved>0.5,
   {opened:d0.label,mouseNext:dNext,mousePrev:dPrev,dpadLeft:d1.label,after:d2,...dMove});

  // ---- 5. pad buttons while open must not reach the game ----
  await p.keyboard.press('Escape');await sleep(300);await padTap([3]);await sleep(200);
  const pl0=(await state()).pos;await padSet([2,7,6],[0,-1,0,-1]);await sleep(700);await padSet([]);await sleep(200);const pl1=await state();
  check('padDoesNotLeakIntoGame',pl1.hs.open&&!pl1.gameActive&&dist(pl0,pl1.pos)<0.01,{moved:+dist(pl0,pl1.pos).toFixed(3),focusAfter:pl1.hs.focus});

  // ---- 6. hero-switch chord: while the screen is open, then during play ----
  const chord=[10,6,7,11];
  const c0=(await state()).hero;const tChord=Date.now();await padSet(chord);await p.waitForFunction(h=>characterState().hero!==h&&!characterState().busy,c0,{timeout:300000});const chordMs=Date.now()-tChord;await padSet([]);await sleep(400);
  s0=await state();const activeCard=await p.evaluate(()=>document.querySelector('.hsCard.isActive')?.dataset.hero);
  check('chordWorksWhileScreenOpen',s0.hero!==c0&&s0.hs.open&&!s0.gameActive&&activeCard===s0.hero,{from:c0,to:s0.hero,activeCard,chordMs});
  check('chordSwitchIsInstantWithWarmBanks',chordMs<600,{chordMs,note:'poll-to-switch time of the engine chord with the bank prewarmed'});
  await p.screenshot({path:OUT+'/08-chord-while-open.png'});
  await padTap([1]);await sleep(200);await padTap([0]);await p.waitForFunction(()=>gameActive,null,{timeout:20000});await sleep(500);
  const c1=(await state()).hero;await padSet(chord);await p.waitForFunction(h=>characterState().hero!==h&&!characterState().busy,c1,{timeout:300000});await padSet([]);await sleep(500);
  s0=await state();const chordMove=await moveWithStick('after chord');
  check('chordWorksDuringPlay',s0.hero!==c1&&s0.gameActive&&chordMove.moved>0.5,{from:c1,to:s0.hero,...chordMove});

  // ---- 7. resume as the current hero ----
  const r0=await state();await p.keyboard.press('Escape');await sleep(300);await p.keyboard.press('KeyH');await sleep(300);
  const label=await p.locator('#v02HeroConfirm').textContent();await p.keyboard.press('Enter');await p.waitForFunction(()=>gameActive&&!v02HeroSelect.state().open,null,{timeout:20000});
  s0=await state();check('resumeAsCurrentHeroNoSwitch',s0.hero===r0.hero&&s0.gameActive&&/^Resume as/.test(label),{hero:s0.hero,label});

  // ---- 8. preview ----
  const pv0=(await state()).hs;await sleep(800);const pv1=(await state()).hs;
  check('previewRenderedAllRigs',['backspool','sightline','loadout','kinsmoke'].every(h=>pv1.rigs[h]?.status==='ready')&&pv1.frames>100&&!pv1.error,{rigs:pv1.rigs,frames:pv1.frames,lastFrameMs:pv1.lastFrameMs});
  check('previewStopsWhenClosed',pv1.frames===pv0.frames&&!pv1.open,{framesBefore:pv0.frames,framesAfter:pv1.frames});
  const canvases=await p.evaluate(()=>document.querySelectorAll('canvas').length);
  check('singleCanvasWhileClosed',canvases===1,{canvases});
  // ---- 9. touch: a hasTouch page; every step inside the screen is a tap ----
  {const ctx=await browser.newContext({viewport:{width:1280,height:800},hasTouch:true});const t=await ctx.newPage();t.on('pageerror',e=>errors.push('touch: '+e.message));
   await t.addInitScript(()=>{navigator.getGamepads=()=>[];});
   await t.goto('http://127.0.0.1:'+(process.env.V02_PORT||'8767')+'/'+build.entry+'?capture=backspool');
   await t.waitForFunction(()=>typeof gameReady!=='undefined'&&gameReady&&window.characterState&&!characterState().busy&&window.v02HeroSelect?.state().ready,null,{timeout:300000});
   await t.tap('#v02Start');await t.waitForFunction(()=>gameActive,null,{timeout:20000});await sleep(600);
   await t.keyboard.press('Escape');await sleep(400);// test setup: pause (touch play would use the pause button)
   await t.tap('#v02HeroSelectQuick');await t.waitForFunction(()=>v02HeroSelect.state().open,null,{timeout:10000});
   await t.tap('#v02HeroCard-loadout');await t.waitForFunction(()=>{const f=v02HeroSelect.framing();return f&&f.hero==='loadout'&&f.settled;},null,{timeout:120000});
   await t.tap('#v02Ability-0');await sleep(500);const tm=(await t.evaluate(()=>v02HeroSelect.state())).moves.slice(-1)[0];
   await t.screenshot({path:OUT+'/touch-loadout.png'});
   await t.tap('#v02HeroConfirm');await t.waitForFunction(()=>characterState().hero==='loadout'&&!characterState().busy&&gameActive&&!v02HeroSelect.state().open,null,{timeout:300000});
   const tc=(await t.evaluate(()=>v02HeroSelect.state())).confirms.slice(-1)[0];
   check('touchTapsBrowseTryAndSelect',tm?.source==='touch'&&/playing|done/.test(tm?.status)&&tc?.hero==='loadout'&&tc.source==='touch',{move:tm,confirm:tc});
   await ctx.close();}
  check('noPageErrors',errors.length===0,{errors});
 }catch(e){result.failure=e.stack;console.log(e.stack);try{await p?.screenshot({path:OUT+'/failure.png'});}catch(_){}}
 result.errors=errors;result.pass=!result.failure&&Object.values(result.checks).every(Boolean);
 fs.writeFileSync(OUT+'/report.json',JSON.stringify(result,null,2)+'\n');console.log(result.pass?'ALL PASS':'FAILED');
 await browser.close();process.exit(result.pass?0:1);
})();
