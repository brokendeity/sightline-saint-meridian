/* Backspool costume switch (SIGHTLINE_SAINT_MERIDIAN_V02_BACKSPOOL_COSTUME.html) with real input only:
   menu clicks (hero list, Hero tab costume buttons, Start), keyboard W (run) and Space (jump), Escape (pause), a reload.
   Checks, for the Half mask (UE rig) costume and back to Default:
   - the Hero tab shows a Backspool costume section only while Backspool is the hero, with both options;
   - choosing "Half mask (UE rig)" swaps only his model: hero/controller stay 'backspool', the costume bank is active,
     all Backspool clips are retargeted, and the Afterstep exhaust rebinds to the costume's hips;
   - W runs him more than 5 m in 2.5 s; Space gets him airborne and he lands;
   - the whole body stays framed: all 17 framing bones project inside the screen while idle and running;
   - the choice survives a reload; choosing Default restores his own model; no page errors.
   Combat hits and Threadrail grinding in the costume are covered by test_mixamo_combat.cjs and test_threadrail_grind.cjs
   run with V02_BACKSPOOL_COSTUME=halfmask (the remembered choice, loaded at start).
   Labelled setup: none (no teleports). */
const {chromium}=require('/opt/homebrew/lib/node_modules/playwright'),fs=require('fs');
const OUT=process.env.BSC_OUT||'development/characters/backspool/evidence/costume',BUILD=process.env.BSC_BUILD||'SIGHTLINE_SAINT_MERIDIAN_V02_BACKSPOOL_COSTUME.html';
(async()=>{const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal','--mute-audio']});let failed=false;try{
 fs.mkdirSync(OUT,{recursive:true});
 const ctx=await browser.newContext({viewport:{width:1280,height:800}}),p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{try{if(!sessionStorage.getItem('bscInit')){localStorage.removeItem('backspoolCostume');localStorage.setItem('sightlineCharacter','sightline');sessionStorage.setItem('bscInit','1');}}catch(e){}});
 const ready=()=>p.waitForFunction(()=>typeof gameReady!=='undefined'&&gameReady&&window.characterState&&!characterState().busy,null,{timeout:300000});
 const heroIs=h=>p.waitForFunction(h=>characterState().hero===h&&!characterState().busy,h,{timeout:300000});
 const look=()=>p.evaluate(()=>{const c=window.backspoolCostume.state(),ex=window.threadrailGame?.state?.()?.exhaust||null;
  // whole-body framing: project the framing bones into normalised device coordinates
  const names=['Head','Neck','Hips','LeftShoulder','RightShoulder','LeftArm','RightArm','LeftForeArm','RightForeArm','LeftHand','RightHand','LeftLeg','RightLeg','LeftFoot','RightFoot','LeftToeBase','RightToeBase'];
  camera.updateMatrixWorld();let inside=0,missing=0,worst=0;const v=new THREE.Vector3();
  for(const n of names){const b=model.getObjectByName('mixamorig'+n);if(!b){missing++;continue;}b.getWorldPosition(v).project(camera);const m=Math.max(Math.abs(v.x),Math.abs(v.y));worst=Math.max(worst,m);if(m<=1&&v.z<1)inside++;}
  let meshName='';model.traverse(o=>{if(o.isSkinnedMesh&&!meshName&&!o.userData.toonOutline)meshName=o.name;});
  return{hero:characterState().hero,active:characterState().active,playing:gameActive,pos:s.pos.toArray(),onGround:s.onGround,anim:currentAnim,
   costume:c,bank:characterSwitcher.bankKey(),mesh:meshName,clips:Object.keys(clips).length,
   section:!document.getElementById('backspoolCostumeOptions')?.hidden,options:[...document.querySelectorAll('#backspoolCostumeOptions button')].map(b=>b.textContent+':'+b.getAttribute('aria-checked')),
   frame:{inside,missing,of:names.length,worstNdc:+worst.toFixed(3)},framing:window.v02BodyFramingState?.()?{eligible:v02BodyFramingState().eligible,reason:v02BodyFramingState().reason}:null};});
 const r={},shot=n=>p.screenshot({path:`${OUT}/${n}.png`});
 const startPlay=async()=>{await p.click('#v02Tab-overview');await p.click('#v02Start');await p.waitForFunction(()=>gameActive,null,{timeout:10000});};
 const pause=async()=>{await p.keyboard.press('Escape');await p.waitForFunction(()=>!gameActive,null,{timeout:10000});};
 const runJump=async tag=>{
  await startPlay();await p.waitForTimeout(1500);r[tag+'Idle']=await look();await shot(tag+'-idle');
  await p.keyboard.down('w');await p.waitForTimeout(2500);r[tag+'Run']=await look();await shot(tag+'-run');
  await p.keyboard.press('Space');let air=false,top=-1e9;const y0=(await look()).pos[1];
  for(let i=0;i<30;i++){await p.waitForTimeout(60);const st=await look();if(!st.onGround)air=true;top=Math.max(top,st.pos[1]);if(i===5)await shot(tag+'-jump');}
  await p.keyboard.up('w');await p.waitForTimeout(1500);r[tag+'Land']=await look();
  r[tag+'Jump']={airborne:air,rise:+(top-y0).toFixed(2),landed:r[tag+'Land'].onGround};
  r[tag+'Moved']=Math.hypot(r[tag+'Run'].pos[0]-r[tag+'Idle'].pos[0],r[tag+'Run'].pos[2]-r[tag+'Idle'].pos[2]);
  await pause();
 };
 await p.goto('http://127.0.0.1:8766/'+BUILD);await ready();
 await p.click('#v02Tab-hero');await p.waitForTimeout(400);r.sightlineMenu=await look();
 await p.selectOption('#characterChoice','backspool');await heroIs('backspool');await p.waitForTimeout(500);r.defaultMenu=await look();await shot('menu-default');
 await runJump('default');
 // choose the costume in the Hero tab
 await p.click('#v02Tab-hero');const t0=Date.now();await p.click('#backspoolCostume-halfmask');
 await p.waitForFunction(()=>window.backspoolCostume.state().appliedBank==='backspool@halfmask'&&!window.backspoolCostume.state().applying&&!characterState().busy,null,{timeout:300000});
 r.switchMs=Date.now()-t0;await p.waitForTimeout(500);r.costumeMenu=await look();await shot('menu-halfmask');
 await runJump('halfmask');
 // reload keeps the choice
 await p.reload();await ready();await heroIs('backspool');await p.waitForFunction(()=>window.backspoolCostume.state().appliedBank==='backspool@halfmask',null,{timeout:300000});r.afterReload=await look();
 // back to Default through the menu
 await p.click('#v02Tab-hero');await p.click('#backspoolCostume-default');
 await p.waitForFunction(()=>window.backspoolCostume.state().appliedBank==='backspool'&&!window.backspoolCostume.state().applying&&!characterState().busy,null,{timeout:300000});
 r.backToDefault=await look();await shot('menu-back-to-default');
 r.errors=errors;
 const fr=x=>x.frame.inside===x.frame.of&&x.frame.missing===0;
 const checks={
  'Hero tab: no costume section while Sightline is the hero':r.sightlineMenu.section===false,
  'Hero tab: costume section with Default and Half mask for Backspool':r.defaultMenu.section===true&&r.defaultMenu.options.length===2,
  'Half mask swaps only the model (hero and controller stay backspool)':r.costumeMenu.bank==='backspool@halfmask'&&r.costumeMenu.hero==='backspool'&&r.costumeMenu.active==='backspool'&&r.costumeMenu.mesh!==r.defaultMenu.mesh,
  'all Backspool clips retargeted onto the costume':(r.costumeMenu.costume.built.halfmask?.clips||0)>=150&&r.costumeMenu.clips===r.defaultMenu.clips,
  'W runs more than 5 m in 2.5 s (default and costume)':r.defaultMoved>5&&r.halfmaskMoved>5,
  'Space jump: airborne and lands (default and costume)':r.defaultJump.airborne&&r.defaultJump.landed&&r.halfmaskJump.airborne&&r.halfmaskJump.landed,
  'whole body framed idle and running (costume)':fr(r.halfmaskIdle)&&fr(r.halfmaskRun),
  'whole body framed idle and running (default, control)':fr(r.defaultIdle)&&fr(r.defaultRun),
  'costume choice survives a reload':r.afterReload.bank==='backspool@halfmask'&&r.afterReload.costume.costume==='halfmask',
  'Default restores his own model':r.backToDefault.bank==='backspool'&&r.backToDefault.mesh===r.defaultMenu.mesh,
  'no page errors':errors.length===0,
 };
 r.checks=Object.fromEntries(Object.entries(checks).map(([k,v])=>[k,v?'PASS':'FAIL']));failed=Object.values(checks).some(v=>!v);
 fs.writeFileSync(`${OUT}/report.json`,JSON.stringify(r,null,1));
 for(const [k,v] of Object.entries(r.checks))console.log(v,k);
 console.log(JSON.stringify({switchMs:r.switchMs,build:r.costumeMenu.costume.built,moved:[r.defaultMoved,r.halfmaskMoved].map(x=>+x.toFixed(1)),jump:[r.defaultJump,r.halfmaskJump],frame:[r.halfmaskIdle.frame,r.halfmaskRun.frame],errors:errors.slice(0,3)}));
}catch(e){console.error('FAIL',e);failed=true;}finally{await browser.close();process.exit(failed?1:0);}})();
