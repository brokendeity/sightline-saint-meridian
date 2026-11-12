/* Real-input test for the pause-menu hero select v2 (scripts/game_v02_hero_select_v2.js: costume carousel, up/down hero
   browsing). test_hero_select.cjs stays as the test of v1 (scripts/game_v02_hero_select.js) and its builds.
   Every step uses normal player input: Playwright keyboard and mouse events, and a standard-mapping test gamepad whose
   buttons and sticks are pressed and released like a real pad (navigator.getGamepads stub, as the other V02 suites use).
   No teleporting and no direct calls into the game; page.evaluate only READS state.
   Steps:
   1. boot, enter the district by clicking the menu button;
   2. keyboard: Esc pauses, H opens hero select, up/down browse heroes, Esc backs out with no switch; reopen, pick Sightline with
      Enter; check the hero changed, play resumed, and W moves him. While open, 1-3 show each hero twice at 1280x800 and
      once at 1920x1080 and 1024x768: the model must sit fully inside the stage, below the title and description, clear of
      every panel, with its feet on the base. Backspool's Threadrail cartridge card must show (and draw the GLB) for him
      only, clear of text, panels and his model; its GPU buffers are freed on close and it draws again on reopen;
   3. gamepad: Start pauses, Y opens, B backs out; reopen, stick and D-pad and LB/RB browse, A picks Loadout; resumed and
      the left stick moves him; A held during the switch must not resume the game early;
   4. mouse: Esc, click the Heroes button, click Backspool's card, click Select; resumed and W moves him;
   4b. Backspool's costume carousel: Right shows the half mask, Enter equips it in game (bank backspool@halfmask, Hero tab
      in sync) and W moves him; then the controller reopens, the mouse arrows step both ways, D-pad left returns to
      Default and A equips it again (left/right on other heroes' pages does nothing);
   5. while the screen is open, gameplay keys and pad buttons do not reach the game (the player does not move);
   6. the L3+LT+RT+R3 chord switches hero during play (play continues) and while the screen is open (it stays open);
   7. "Resume as" the current hero resumes without a switch;
   8. the turntable preview rendered all three rigs with no error, stops drawing once closed, and its canvas leaves the
      page while closed (other suites select the world canvas with a bare 'canvas' locator).
   Usage: node scripts/vertical-v02/test_hero_select_v2.cjs [V02_Hero_Select_Costumes_Build.json]
   Evidence: development/vertical-city-v02/evidence/hero-select-v2/ (report.json + screenshots), or V02_HERO_SELECT_OUT. */
const{chromium}=require('/opt/homebrew/lib/node_modules/playwright'),fs=require('fs'),crypto=require('crypto');
const D='development/vertical-city-v02/',build=JSON.parse(fs.readFileSync(D+(process.argv[2]||process.env.V02_ACTION_BUILD||'V02_Hero_Select_Costumes_Build.json')));
const OUT=process.env.V02_HERO_SELECT_OUT||D+'evidence/hero-select-v2';fs.mkdirSync(OUT,{recursive:true});
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
  const t0=Date.now();await p.goto('http://127.0.0.1:8766/'+build.entry+'?capture=backspool');
  await p.waitForFunction(()=>typeof gameReady!=='undefined'&&gameReady&&window.characterState&&!characterState().busy&&window.v02HeroSelect?.state().ready,null,{timeout:300000});
  result.loadSeconds=+((Date.now()-t0)/1000).toFixed(1);
  await p.locator('#v02Start').click();await p.waitForFunction(()=>gameActive,null,{timeout:20000});await sleep(800);
  const startHero=(await state()).hero;result.startHero=startHero;
  const scripts=await p.evaluate(()=>[...document.scripts].map(s=>s.getAttribute('src')||'').filter(s=>s.includes('game_v02_hero_select')));
  check('loadsV2ModuleOnly',scripts.length===1&&scripts[0].startsWith('scripts/game_v02_hero_select_v2.js'),{scripts});
  check('bootAndEnterDistrict',(await state()).gameActive,{startHero,loadSeconds:result.loadSeconds});

  // ---- 2. keyboard ----
  await p.keyboard.press('Escape');await sleep(400);
  let s0=await state();
  const entry=await p.evaluate(()=>({footer:!!document.querySelector('#v02MenuFooter #v02HeroSelectQuick'),heroTab:!!document.querySelector('#v02Pane-hero #v02HeroSelectOpen')}));
  check('escPausesAndEntryPointsExist',!s0.gameActive&&s0.menu!=='none'&&entry.footer&&entry.heroTab,entry);
  await p.screenshot({path:OUT+'/01-pause-menu.png'});
  await p.keyboard.press('KeyH');await sleep(300);s0=await state();
  check('keyboardHOpens',s0.hs.open&&s0.hs.focus===startHero&&!s0.gameActive,{focus:s0.hs.focus});
  await p.waitForFunction(()=>Object.values(v02HeroSelect.state().rigs).filter(r=>r.status==='ready').length===3,null,{timeout:180000});
  const order=[];for(let i=0;i<3;i++){order.push((await state()).hs.focus);await p.keyboard.press('ArrowDown');await sleep(120);}
  const wrapRight=(await state()).hs.focus;await p.keyboard.press('ArrowUp');await sleep(120);const wrapLeft=(await state()).hs.focus;
  check('keyboardArrowsBrowseAndWrap',new Set(order).size===3&&wrapRight===order[0]&&wrapLeft===order[2],{order,wrapRight,wrapLeft});
  // Framing: every hero, shown twice (a hero leaving and coming back must keep its ground offset), at three viewports.
  // The model's on-screen box must be fully inside the stage, below the name plate and description, clear of every panel,
  // and the feet must stand on the base.
  const framingRuns=[],cartRuns=[],costumeRuns=[];
  const frameCheck=async(vp,hero,key,shot)=>{await p.keyboard.press(key);
   await p.waitForFunction(h=>{const f=v02HeroSelect.framing();return f&&f.hero===h&&f.settled;},hero,{timeout:20000});await sleep(150);
   const f=await p.evaluate(()=>{const r=e=>{const b=e.getBoundingClientRect();return{left:b.left,right:b.right,top:b.top,bottom:b.bottom};};
    const text=['.hsEyebrow','.hsPlate','#v02HeroRole','#v02HeroBlurb'].map(s=>r(document.querySelector('#v02HeroSelect '+s)));
    const panels=['.hsTraits','.hsRoster','.hsAbilities','.hsBar'].map(s=>({name:s,...r(document.querySelector('#v02HeroSelect '+s))}));
    const bar=document.getElementById('v02CostumeBar'),barOn=!bar.hidden&&bar.getClientRects().length>0;
    const costume=barOn?{label:document.getElementById('v02CostumeLabel').textContent,parts:['v02CostumePrev','v02CostumeNext','v02CostumeLabel'].map(id=>({name:id,...r(document.getElementById(id))}))}:null;
    return{...v02HeroSelect.framing(),textBottom:Math.max(...text.map(x=>x.bottom)),panels,cart:v02HeroSelect.cartridge(),costume};});
   const cartFrames0=f.cart.frames;await sleep(400);const cartFrames1=await p.evaluate(()=>v02HeroSelect.cartridge().frames);
   const m=f.model,c=f.canvas,hit=q=>m.left<q.right&&m.right>q.left&&m.top<q.bottom&&m.bottom>q.top;
   const overlaps=f.panels.filter(hit).map(q=>q.name);
   const ok=m.top>=c.top+2&&m.bottom<=c.bottom&&m.left>=c.left&&m.right<=c.right&&m.top>f.textBottom&&!overlaps.length&&Math.abs(f.worldMinY)<.06&&m.bottom>=f.base.top&&m.bottom<=f.base.bottom;
   // Backspool's cartridge card: shown and drawing for him only, clear of text, panels and the hero model, and the
   // deployed cartridge's projected box inside the card's view (3 px tolerance for the conservative box projection).
   const k=f.cart,fg=k.figure,inside=(a,b,tol=0)=>a.left>=b.left-tol&&a.right<=b.right+tol&&a.top>=b.top-tol&&a.bottom<=b.bottom+tol;
   const cartOk=hero.startsWith('backspool')?(k.status==='ready'&&k.visible&&cartFrames1>cartFrames0&&k.lastPassTriangles>1000&&inside(fg,c)&&!hit(fg)&&fg.top>f.textBottom&&!f.panels.some(q=>fg.left<q.right&&fg.right>q.left&&fg.top<q.bottom&&fg.bottom>q.top)&&inside(k.projected,k.view,3))
    :(!k.visible&&cartFrames1===cartFrames0);
   cartRuns.push({viewport:vp,hero,ok:cartOk,visible:k.visible,framesAdvanced:cartFrames1-cartFrames0,passTriangles:k.lastPassTriangles,figure:fg,view:k.view,projected:k.projected,deploy:k.deploy});
   // Backspool's costume carousel: arrows and label on his page only, with the right label, clear of his model, every
   // text block and panel, and the cartridge card.
   const cs=f.costume,expectLabel={'backspool':'Costume 1/2 · Default','backspool@halfmask':'Costume 2/2 · Half mask'}[hero];
   const clash=q=>[m,...f.panels,...(fg?[fg]:[])].some(o=>q.left<o.right&&q.right>o.left&&q.top<o.bottom&&q.bottom>o.top)||q.top<=f.textBottom||!inside(q,c);
   const costumeOk=hero.startsWith('backspool')?(!!cs&&cs.label===expectLabel&&!cs.parts.some(clash)):!cs;
   costumeRuns.push({viewport:vp,hero,ok:costumeOk,label:cs?.label||null,clashes:cs?cs.parts.filter(clash).map(q=>q.name):[]});
   framingRuns.push({viewport:vp,hero,ok,modelTop:m.top,textBottom:+f.textBottom.toFixed(1),canvasTop:+c.top.toFixed(1),modelBottom:m.bottom,base:[f.base.top,f.base.bottom],worldMinY:f.worldMinY,worldMaxY:f.worldMaxY,overlaps});
   if(shot)await p.screenshot({path:OUT+'/framing-'+vp+'-'+hero+'.png'});};
  // ArrowRight on Backspool's page shows his half-mask costume; 1-3 pick heroes (and reset the carousel to his worn costume).
  const heroKeys=[['backspool','Digit1'],['backspool@halfmask','ArrowRight'],['sightline','Digit2'],['loadout','Digit3']];
  for(const [hero,key] of heroKeys)await frameCheck('1280x800',hero,key,false);
  for(const [hero,key] of heroKeys)await frameCheck('1280x800',hero,key,true);
  for(const [w,h] of [[1920,1080],[1024,768]]){await p.setViewportSize({width:w,height:h});await sleep(300);for(const [hero,key] of heroKeys)await frameCheck(w+'x'+h,hero,key,true);}
  await p.setViewportSize({width:1280,height:800});await sleep(300);await p.keyboard.press('Digit'+(1+['backspool','sightline','loadout'].indexOf(startHero)));await sleep(200);
  check('previewFramingClearOfTextAndOnBase',framingRuns.length===16&&framingRuns.every(r=>r.ok),{failures:framingRuns.filter(r=>!r.ok),runs:framingRuns.length});
  result.framing=framingRuns;
  check('cartridgeDisplayBackspoolOnly',cartRuns.length===16&&cartRuns.every(r=>r.ok),{failures:cartRuns.filter(r=>!r.ok),runs:cartRuns.length,glb:(await p.evaluate(()=>v02HeroSelect.cartridge())).url});
  result.cartridge=cartRuns;
  check('costumeCarouselBackspoolOnly',costumeRuns.length===16&&costumeRuns.every(r=>r.ok),{failures:costumeRuns.filter(r=>!r.ok),runs:costumeRuns.length});
  result.costumeCarousel=costumeRuns;
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
  await padTap([13]);await sleep(1500);await p.screenshot({path:OUT+'/04-hero-select-loadout.png'});
  // Hold A through the switch: the game must stay paused until the switch completes.
  await padSet([0]);const during=[];const tA=Date.now();
  while(Date.now()-tA<300000){const x=await p.evaluate(()=>({hero:characterState().hero,busy:characterState().busy,gameActive,open:v02HeroSelect.state().open,switching:v02HeroSelect.state().switching}));during.push(x);if(x.hero==='loadout'&&!x.busy&&!x.open)break;await sleep(50);}
  await padSet([]);await waitSwitched('loadout');await sleep(600);
  const earlyResume=during.some(x=>x.gameActive&&(x.open||x.hero!=='loadout'));
  const padMove=await moveWithStick('loadout stick');s0=await state();
  check('padPicksLoadoutAndResumes',s0.hero==='loadout'&&s0.gameActive&&padMove.moved>0.5&&!earlyResume,{...padMove,samples:during.length,earlyResume,switchMs:s0.hs.confirms.slice(-1)[0]?.switchMs});
  await p.screenshot({path:OUT+'/05-playing-loadout.png'});

  // ---- 4. mouse ----
  await p.keyboard.press('Escape');await sleep(400);
  await p.locator('#v02HeroSelectQuick').click();await sleep(300);s0=await state();const mouseOpened=s0.hs.open;
  await p.locator('#v02HeroCard-backspool').click();await sleep(1500);await p.screenshot({path:OUT+'/06-hero-select-backspool.png'});
  const mFocus=(await state()).hs.focus;
  await p.locator('#v02HeroConfirm').click();await waitSwitched('backspool');await sleep(600);
  const mMove=await moveWithKey('backspool W');s0=await state();
  check('mousePicksBackspoolAndResumes',mouseOpened&&mFocus==='backspool'&&s0.hero==='backspool'&&s0.gameActive&&mMove.moved>0.5,{...mMove});
  await p.screenshot({path:OUT+'/07-playing-backspool.png'});

  // ---- 4b. Backspool costume carousel: keyboard picks the half mask, the controller and the mouse arrows bring him back ----
  const costumeOf=()=>p.evaluate(()=>({bank:characterSwitcher.bankKey(),costume:backspoolCostume.current(),applied:backspoolCostume.state().appliedBank,heroTab:document.getElementById('backspoolCostume-halfmask')?.getAttribute('aria-checked'),label:document.getElementById('v02CostumeLabel').textContent,shown:v02HeroSelect.state().shown,confirm:document.getElementById('v02HeroConfirm').textContent}));
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
  const c0=(await state()).hero;await padSet(chord);await p.waitForFunction(h=>characterState().hero!==h&&!characterState().busy,c0,{timeout:300000});await padSet([]);await sleep(400);
  s0=await state();const activeCard=await p.evaluate(()=>document.querySelector('.hsCard.isActive')?.dataset.hero);
  check('chordWorksWhileScreenOpen',s0.hero!==c0&&s0.hs.open&&!s0.gameActive&&activeCard===s0.hero,{from:c0,to:s0.hero,activeCard});
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
  check('previewRenderedAllRigs',['backspool','sightline','loadout'].every(h=>pv1.rigs[h]?.status==='ready')&&pv1.frames>100&&!pv1.error,{rigs:pv1.rigs,frames:pv1.frames,lastFrameMs:pv1.lastFrameMs});
  check('previewStopsWhenClosed',pv1.frames===pv0.frames&&!pv1.open,{framesBefore:pv0.frames,framesAfter:pv1.frames});
  const canvases=await p.evaluate(()=>document.querySelectorAll('canvas').length);
  check('singleCanvasWhileClosed',canvases===1,{canvases});
  check('noPageErrors',errors.length===0,{errors});
 }catch(e){result.failure=e.stack;console.log(e.stack);try{await p?.screenshot({path:OUT+'/failure.png'});}catch(_){}}
 result.errors=errors;result.pass=!result.failure&&Object.values(result.checks).every(Boolean);
 fs.writeFileSync(OUT+'/report.json',JSON.stringify(result,null,2)+'\n');console.log(result.pass?'ALL PASS':'FAILED');
 await browser.close();process.exit(result.pass?0:1);
})();
