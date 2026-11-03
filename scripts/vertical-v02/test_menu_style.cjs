/* Menu restyle: the restyled menu still works with real mouse and keyboard input, and the decoration never gets in the way.
   - The stylesheet loads after the HUD stylesheet and no later sheet restyles the menu; the decorative layers exist, are aria-hidden and ignore the pointer.
   - Every visible menu control is the top element at its own centre (nothing decorative covers it); controls inside a
     closed <details> are not drawn and are skipped.
   - Mouse clicks switch all five tabs; ArrowRight/ArrowLeft/Home/End on the tab list switch tabs; Tab stays inside the card.
   - "Enter V02 district" (mouse) starts play; Escape pauses; "Resume" (keyboard Enter) resumes.
   - The hero word follows a real hero switch (Hero tab select, as a player would use it).
   - At phone width (390x844) the primary button and Resume are on screen without horizontal scroll.
   Labelled setup: none beyond loading the page. */
const{chromium}=require('/opt/homebrew/lib/node_modules/playwright'),assert=require('assert/strict'),fs=require('fs');
(async()=>{const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal','--mute-audio']});try{
 const build=JSON.parse(fs.readFileSync('development/vertical-city-v02/'+(process.env.V02_ACTION_BUILD||'V02_Menu_Style_Build.json')));
 const out=process.env.V02_MENU_OUT||'development/vertical-city-v02/evidence/menu-style';fs.mkdirSync(out,{recursive:true});
 const p=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:8766/'+build.entry+'?capture=backspool');
 await p.waitForFunction(()=>typeof gameReady!=='undefined'&&gameReady&&roadNetworkState().ready&&verticalWorldLifeState().ready&&characterState().active==='backspool'&&!characterState().busy&&window.v02MenuStyle?.state().ready,null,{timeout:180000});
 await p.waitForTimeout(600);const r={};
 r.layers=await p.evaluate(()=>{const sheets=[...document.styleSheets],mine=sheets.findIndex(s=>s.ownerNode?.id==='v02MenuStyle'),hud=sheets.findIndex(s=>/game_vertical_hud_v02\.css/.test(s.href||'')),laterMenuRules=sheets.slice(mine+1).flatMap(s=>{try{return[...s.cssRules].map(r=>r.cssText)}catch(e){return[]}}).filter(r=>/#menu|#v02Tab|\.card|#start\b|#v02Start/.test(r));const deco=['menuHeroWord','menuStrip','menuPrompts'].map(id=>{const e=document.getElementById(id);return{id,exists:!!e,hidden:e?.getAttribute('aria-hidden'),pointer:e&&getComputedStyle(e).pointerEvents}});return{mine,hud,laterMenuRules,deco,word:document.querySelector('#menuHeroWord b')?.textContent}});
 assert(r.layers.mine>r.layers.hud&&r.layers.hud>=0,'The menu stylesheet loads after the HUD stylesheet');assert.deepEqual(r.layers.laterMenuRules,[],'No later stylesheet restyles the menu');
 assert(r.layers.deco.every(d=>d.exists&&d.hidden==='true'&&d.pointer==='none'),'Decorative layers are aria-hidden and ignore the pointer: '+JSON.stringify(r.layers.deco));
 assert.equal(r.layers.word,'Backspool','The hero word shows the active hero');
 const covered=()=>p.evaluate(()=>[...document.querySelectorAll('#menu button,#menu select,#menu summary,#menu input')].filter(e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden'&&!(e.closest('details:not([open])')&&e.tagName!=='SUMMARY')).map(e=>{const b=e.getBoundingClientRect(),x=b.left+b.width/2,y=b.top+b.height/2;if(y<0||y>innerHeight)return null;const top=document.elementFromPoint(x,y);return top===e||e.contains(top)?null:(e.id||e.textContent.trim())+' covered by '+(top?.id||top?.className||top?.tagName)}).filter(Boolean));
 // Mouse: every tab, checking nothing covers any control on each pane.
 r.tabs={};for(const t of ['overview','hero','equipment','practice','controls']){await p.click('#v02Tab-'+t);await p.waitForTimeout(250);r.tabs[t]={selected:await p.evaluate(t=>document.getElementById('v02Tab-'+t).getAttribute('aria-selected'),t),covered:await covered()};await p.screenshot({path:`${out}/tab-${t}.png`});}
 for(const [t,v] of Object.entries(r.tabs)){assert.equal(v.selected,'true',t+' tab selects on click');assert.deepEqual(v.covered,[],t+' pane: no control is covered');}
 // Keyboard on the tab list.
 await p.focus('#v02Tab-controls');const key=async k=>{await p.keyboard.press(k);await p.waitForTimeout(120);return p.evaluate(()=>document.activeElement.id)};
 r.keys={right:await key('ArrowRight'),left:await key('ArrowLeft'),home:await key('Home'),end:await key('End')};
 assert.deepEqual(r.keys,{right:'v02Tab-overview',left:'v02Tab-controls',home:'v02Tab-overview',end:'v02Tab-controls'},'Arrow, Home and End keys move between tabs: '+JSON.stringify(r.keys));
 await p.keyboard.press('Home');r.trap=[];for(let i=0;i<14;i++){await p.keyboard.press('Tab');r.trap.push(await p.evaluate(()=>!!document.activeElement.closest('#menu .card')));}
 assert(r.trap.every(Boolean),'Tab keeps focus inside the menu card');
 // Real switch through the Hero tab select, then back, checking the backdrop word follows.
 await p.click('#v02Tab-hero');await p.selectOption('#characterChoice','sightline');await p.waitForFunction(()=>characterState().active==='sightline'&&!characterState().busy,null,{timeout:120000});await p.waitForTimeout(400);
 r.wordAfterSwitch=await p.evaluate(()=>document.querySelector('#menuHeroWord b').textContent);assert.equal(r.wordAfterSwitch,'Sightline','The hero word follows a hero switch');
 await p.selectOption('#characterChoice','backspool');await p.waitForFunction(()=>characterState().active==='backspool'&&!characterState().busy,null,{timeout:120000});await p.waitForTimeout(400);
 // Start, pause, resume with real input.
 await p.click('#v02Tab-overview');await p.waitForTimeout(150);await p.click('#v02Start');await p.waitForTimeout(800);
 r.started=await p.evaluate(()=>({active:gameActive,menu:getComputedStyle(document.getElementById('menu')).display}));assert(r.started.active&&r.started.menu==='none','Enter V02 district starts play: '+JSON.stringify(r.started));
 await p.keyboard.press('Escape');await p.waitForTimeout(500);r.paused=await p.evaluate(()=>({active:gameActive,menu:getComputedStyle(document.getElementById('menu')).display}));assert(!r.paused.active&&r.paused.menu!=='none','Escape pauses into the menu');
 await p.screenshot({path:out+'/paused.png'});
 await p.focus('#start');await p.keyboard.press('Enter');await p.waitForTimeout(500);r.resumed=await p.evaluate(()=>gameActive);assert(r.resumed,'Resume (keyboard Enter) resumes play');
 // Phone width.
 await p.keyboard.press('Escape');await p.waitForTimeout(400);await p.setViewportSize({width:390,height:844});await p.click('#v02Tab-overview');await p.waitForTimeout(300);
 r.phone=await p.evaluate(()=>{const v=id=>{const b=document.getElementById(id).getBoundingClientRect();return{top:Math.round(b.top),bottom:Math.round(b.bottom),left:Math.round(b.left),right:Math.round(b.right)}};return{start:v('v02Start'),resume:v('start'),scrollW:document.documentElement.scrollWidth,menuScrollW:document.getElementById('menu').scrollWidth,w:innerWidth,h:innerHeight}});
 await p.screenshot({path:out+'/phone.png'});
 for(const k of ['start','resume'])assert(r.phone[k].top>=0&&r.phone[k].bottom<=r.phone.h&&r.phone[k].left>=0&&r.phone[k].right<=r.phone.w,k+' is on screen at phone width: '+JSON.stringify(r.phone));
 assert(r.phone.scrollW<=r.phone.w&&r.phone.menuScrollW<=r.phone.w,'No horizontal scroll at phone width');
 r.phoneCovered=await covered();assert.deepEqual(r.phoneCovered,[],'Phone: no control is covered');
 assert.deepEqual(errors,[]);
 fs.writeFileSync(out+'/browser-results.json',JSON.stringify({entry:build.entry,entrySHA256:build.entrySHA256,testSHA256:require('crypto').createHash('sha256').update(fs.readFileSync(__filename)).digest('hex'),scope:'Real mouse and keyboard input on the menu at 1440x900 and 390x844. Layout and function only; the look is judged by screenshots, not certified.',results:r,errors},null,1));
 console.log('PASS menu restyle: tabs, keys, focus, start, pause, resume, hero word, phone layout; no page errors');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
