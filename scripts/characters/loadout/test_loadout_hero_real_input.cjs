/* Loadout as the third hero in SIGHTLINE_SAINT_MERIDIAN_V02_LOADOUT.html, with real input only:
   menu clicks and the hero list, keyboard movement and power keys, the cape switch in the Hero tab, a page reload,
   and the L3+LT+RT+R3 chord on a simulated standard gamepad (the game's own polling reads it, as in earlier V02 tests).
   Checks:
   - Hero tab: the Loadout section is hidden for other heroes and shown for Loadout, with a working Cape switch.
   - Loadout runs on the Backspool controller (active 'backspool', hero 'loadout') and moves under W.
   - His cape is cloth while on: finite, outside the body, updating every frame; off hides it and stops the cloth.
   - The cape choice and the hero survive a reload.
   - Power keys do nothing for Loadout (no Snapback bank, rail, cartridge or Drive release), while the same Snapback key
     does bank for Backspool (control).
   - Backspool's power HUD is hidden and relabelled for Loadout and restored for Backspool.
   - The chord cycles Loadout -> Sightline -> Backspool -> Loadout.
   Labelled setup: none (no teleports). */
const{chromium}=require('/opt/homebrew/lib/node_modules/playwright'),assert=require('assert/strict'),fs=require('fs'),crypto=require('crypto'),path=require('path');
const OUT='development/characters/loadout/evidence/hero',BUILD='SIGHTLINE_SAINT_MERIDIAN_V02_LOADOUT.html';
(async()=>{const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal','--mute-audio']});const ctx=await browser.newContext({viewport:{width:1280,height:800}});try{
 fs.mkdirSync(OUT,{recursive:true});
 const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{const up={pressed:false,value:0};window.testPad={id:'test pad',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>up)};navigator.getGamepads=()=>[window.testPad];});
 const ready=()=>p.waitForFunction(()=>typeof gameReady!=='undefined'&&gameReady&&window.characterState&&!characterState().busy,null,{timeout:300000});
 const heroIs=h=>p.waitForFunction(h=>characterState().hero===h&&!characterState().busy,h,{timeout:300000});
 const look=()=>p.evaluate(()=>{const lh=window.loadoutHero.state(),t=window.threadrailGame.state();return{hero:characterState().hero,active:characterState().active,playing:gameActive,
  pos:s.pos.toArray(),anim:currentAnim,cape:{on:lh.capeOn,visible:lh.capeVisible,frames:lh.cloth?.frames??0,pen:lh.cloth?.penetration??0,nan:!!lh.cloth?.nan,aim:lh.cloth?.maxAimErrorM??0},
  options:!document.getElementById('loadoutOptions')?.hidden,toggle:document.getElementById('loadoutCapeToggle')?.textContent,checked:document.getElementById('loadoutCapeToggle')?.getAttribute('aria-checked'),
  word:document.querySelector('#menuHeroWord b')?.textContent,heroName:document.getElementById('v02HeroName')?.textContent,hint:document.getElementById('actionHint')?.textContent,
  resourcesHidden:document.getElementById('v02Resources')?.hidden,
  power:{snapBank:!!t.snapback?.bank,snapEvents:t.snapback?.events?.filter(e=>e.type==='bank').length??0,rails:t.rail?.rails?.length??0,shots:t.deployment?.shots?.length??0,driveRelease:!!t.drive?.lastRelease,
   echoRecording:!!window.backspoolPowerState().recording}};});
 const r={},shot=n=>p.screenshot({path:`${OUT}/${n}.png`});
 const startPlay=async()=>{await p.click('#v02Tab-overview');await p.click('#v02Start');await p.waitForFunction(()=>gameActive,null,{timeout:10000});};
 const pause=async()=>{await p.keyboard.press('Escape');await p.waitForFunction(()=>!gameActive,null,{timeout:10000});};
 await p.goto('http://127.0.0.1:8766/'+BUILD);await ready();
 // 1. Hero tab before and after choosing Loadout.
 await p.click('#v02Tab-hero');await p.waitForTimeout(400);r.sightlineMenu=await look();
 const t0=Date.now();await p.selectOption('#characterChoice','loadout');await heroIs('loadout');r.switchMs=Date.now()-t0;await p.waitForTimeout(400);
 r.loadoutMenu=await look();r.build=(({cloth,...x})=>x)(await p.evaluate(()=>window.loadoutHero.state()));await shot('menu-hero-tab-loadout');
 // 2. Play: idle, then run with W.
 await startPlay();await p.waitForTimeout(1500);r.idle=await look();await shot('play-idle');
 await p.keyboard.down('w');await p.waitForTimeout(2500);r.run=await look();await shot('play-run');await p.keyboard.up('w');await p.waitForTimeout(600);
 r.moved=Math.hypot(r.run.pos[0]-r.idle.pos[0],r.run.pos[2]-r.idle.pos[2]);
 // 3. Power keys as Loadout: Snapback (U), Drive (E), rail (R).
 for(const k of ['KeyU','KeyE','KeyR']){await p.keyboard.press(k);await p.waitForTimeout(350);}
 r.loadoutPowers=await look();
 // 4. Cape off in the Hero tab, run, then reload.
 await pause();await p.click('#v02Tab-hero');await p.click('#loadoutCapeToggle');await p.waitForTimeout(200);r.capeOffMenu=await look();await shot('menu-cape-off');
 await startPlay();const framesOff=(await look()).cape.frames;await p.keyboard.down('w');await p.waitForTimeout(1500);await p.keyboard.up('w');r.capeOffPlay=await look();r.capeOffPlay.framesWhileOff=r.capeOffPlay.cape.frames-framesOff;await shot('play-cape-off');
 await p.reload();await ready();await heroIs('loadout');await p.waitForTimeout(600);r.afterReload=await look();
 await p.click('#v02Tab-hero');await p.click('#loadoutCapeToggle');await p.waitForTimeout(200);r.capeBackOn=await look();
 // 5. The chord on the test pad: Loadout -> Sightline -> Backspool -> Loadout.
 await startPlay();
 const chord=async()=>{await p.evaluate(()=>{const down={pressed:true,value:1};for(const i of [10,6,7,11])window.testPad.buttons[i]=down;});await p.waitForTimeout(250);await p.evaluate(()=>{const up={pressed:false,value:0};for(const i of [10,6,7,11])window.testPad.buttons[i]=up;});};
 r.chord=[];for(const want of ['sightline','backspool','loadout']){await chord();await heroIs(want);await p.waitForTimeout(500);if(!(await p.evaluate(()=>gameActive)))await startPlay();const st=await look();r.chord.push({want,got:st.hero,active:st.active});
  if(want==='backspool'){r.backspoolHud=st;await p.keyboard.press('KeyU');await p.waitForTimeout(400);r.backspoolPowers=await look();}}
 const checks={
  'Hero tab: no Loadout section while Sightline is the hero':r.sightlineMenu.options===false,
  'Hero tab: Loadout section and Cape switch shown for Loadout':r.loadoutMenu.options===true&&r.loadoutMenu.toggle==='Cape · On'&&r.loadoutMenu.checked==='true',
  'menu backdrop word reads Loadout':r.loadoutMenu.word==='Loadout',
  'Loadout runs on the Backspool controller':r.loadoutMenu.hero==='loadout'&&r.loadoutMenu.active==='backspool',
  'all Backspool clips retargeted onto Loadout':r.build.clips>=150,
  'W moves Loadout more than 5 m in 2.5 s':r.moved>5,
  'cape cloth updates while on, finite and outside the body':r.run.cape.visible&&r.run.cape.frames>r.idle.cape.frames&&!r.run.cape.nan&&r.run.cape.pen<=0.02,
  'power keys do nothing for Loadout':!r.loadoutPowers.power.snapBank&&r.loadoutPowers.power.snapEvents===0&&r.loadoutPowers.power.rails===0&&r.loadoutPowers.power.shots===0&&!r.loadoutPowers.power.driveRelease&&!r.loadoutPowers.power.echoRecording,
  'power HUD hidden and relabelled for Loadout':r.idle.resourcesHidden===true&&r.idle.heroName==='LOADOUT'&&!/Drive|rail|Snapback/.test(r.idle.hint||''),
  'Cape switch turns the cape off and stops the cloth':r.capeOffMenu.toggle==='Cape · Off'&&r.capeOffMenu.checked==='false'&&r.capeOffPlay.cape.visible===false&&r.capeOffPlay.framesWhileOff===0,
  'hero and cape choice survive a reload':r.afterReload.hero==='loadout'&&r.afterReload.cape.on===false&&r.afterReload.toggle==='Cape · Off',
  'Cape switch turns it back on':r.capeBackOn.cape.on===true&&r.capeBackOn.cape.visible===true,
  'chord cycles Loadout -> Sightline -> Backspool -> Loadout':r.chord.map(c=>c.got).join(',')==='sightline,backspool,loadout',
  'Backspool HUD restored after Loadout':r.backspoolHud.resourcesHidden===false&&r.backspoolHud.heroName!=='LOADOUT',
  'control: the same Snapback key banks for Backspool':r.backspoolPowers.power.snapBank===true,
  'no page errors':errors.length===0};
 const files=[BUILD,'scripts/game_v02_loadout_hero.js','scripts/game_loadout_cape_cloth.js','scripts/game_mixamo_retarget.js','scripts/game_v02_menu_style_v2.js','assets/loadout/loadout_caped.fbx',__filename];
 fs.writeFileSync(OUT+'/results.json',JSON.stringify({build:BUILD,hashes:Object.fromEntries(files.map(f=>[path.relative(process.cwd(),f),crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')])),
  scope:'Real mouse, keyboard and simulated-gamepad input in headless Chromium (ANGLE/Metal). No teleports. Combat, traversal moves, missions and the city beyond a short run are not covered here.',checks,results:r,errors},null,1));
 for(const [k,v] of Object.entries(checks))console.log((v?'PASS ':'FAIL ')+k);
 console.log(JSON.stringify({switchMs:r.switchMs,build:r.build,moved:+r.moved.toFixed(2),chord:r.chord}));
 assert(Object.values(checks).every(Boolean),'Some Loadout hero checks failed');console.log('PASS Loadout hero, real input');
}finally{await browser.close()}})().catch(e=>{console.error(e.message);process.exitCode=1});
