/* V02 hero select, v2 (scripts/game_v02_hero_select_v2.js + game_v02_hero_select_v2.css).
 * v2 adds Backspool's costume carousel (Default / Half mask) and moves hero browsing to up/down so left/right can browse
 * costumes. It is a new file so that the builds which load scripts/game_v02_hero_select.js (HERO_SELECT through
 * BACKSPOOL_COSTUME) keep exactly the module their evidence was recorded with.
 *
 * V02 hero select: a paused, full-screen character-selection screen for Backspool, Sightline and Loadout.
 *
 * Design principles (not code or assets) are taken from cortiz2894/ship-selection-page, which carries no licence: a roster
 * list on the left, a name plate and description up top, trait bars that fill one after another, ability cards on the right,
 * and the model on a turning base in the middle that swaps with a wireframe reveal. Everything is expressed in Saint
 * Meridian's "Midnight Slash" menu language: midnight-blue and charcoal slabs, thin cyan strips, warm amber, no bloom.
 *
 * Ownership and boundaries:
 * - Native pause is the simulation boundary. This screen only opens while the game is paused, and never moves the actor.
 * - Choosing a hero calls the game's existing characterSwitcher.change(id), the same path as the Hero tab's Character
 *   dropdown and the L3+LT+RT+R3 chord. There is no new switch mechanism. Play then resumes through startGame().
 * - Input: it joins the paused-overlay gate the City views module already uses (window.verticalViews.active/poll), so the
 *   engine's own pause, resume and gamepad code keep working unchanged. The hero-switch chord is passed through, even while
 *   this screen is open, and keeps its priority.
 * - The turntables are separate preview copies of each hero's real model files and idle clip, drawn by their own small
 *   WebGL renderer only while the screen is open. The game's renderer, scene and shared shader chunks are not touched.
 *   Sightline reuses the idle FBX bytes the game already holds (EMBEDDED_FBX); Backspool and Loadout fetch the same files
 *   the game loads (served from the browser cache after the first load).
 * Controls: keyboard up/down (W/S, 1-3) browse heroes and left/right (A/D) browse Backspool's costumes, Enter selects (Space is swallowed, never selects), Esc goes back; controller LB/RB, D-pad up/down or left stick up/down browse heroes, D-pad left/right or either stick sideways browse costumes,
 * A selects, B goes back; mouse click a card, then Select (or click the focused card again). Open it from the pause menu's
 * Heroes button, the Hero tab, the H key or controller Y while paused. */
(()=>{
 'use strict';
 const by=id=>document.getElementById(id);
 const raf=window.requestAnimationFrame.bind(window);
 const version=document.currentScript?.src.match(/[?&]v=([^&]+)/)?.[1]||'';
 const css=document.createElement('link');css.rel='stylesheet';// The stylesheet borrows this script's cache tag; CSS_REV changes with every stylesheet edit so a CSS-only change still
 // changes this file (and therefore its ?v= tag) and is never served stale from cache.
 const CSS_REV='costumes-2';css.href='scripts/game_v02_hero_select_v2.css?r='+CSS_REV+(version?'&v='+version:'');css.id='v02HeroSelectStyle';document.head.append(css);

 // Copy from the locked design rules and existing docs (CLAUDE.md, PROJECT_HANDOFF.md §3–4, docs/BACKSPOOL_THREADRAIL.md).
 // Trait values are presentation ratings for this screen, not gameplay numbers.
 const HEROES=[
  {id:'backspool',name:'Backspool',role:'Action composer',code:'BSP-01',
   blurb:'Not a time wizard. He decides when the actions he has already performed become useful again, and crosses the city on street parkour and Threadrail cable.',
   abilities:[['Echo release','A translucent Backspool repeats one recorded action at its recorded spot, against the world as it is now.'],['Retrace release','Reconnect to a recorded route and get propelled along it, collision-checked.'],['Threadrail','Thrown cartridges and visible tensioned cables. Equipment, not magic: 6–100 m.'],['Afterstep Drive','The device on his lower back releases short impulses from moves he made.']],
   traits:[['Traversal',4],['Reach',3],['Combat',4],['Powers',5]]},
  {id:'sightline',name:'Sightline',role:'Kinetic rail courier',code:'SGL-00',
   blurb:'Turns a line of sight into a flight path. Aim, commit a straight rail to a fixed point, and fly it. No curves, no homing.',
   abilities:[['Kinetic rail','LT aims and locks his footing; RT fires a straight rail to a fixed endpoint, then he flies it.'],['Kinetic brace','A timed guard that vents pressure and turns aside drone fire.'],['Shutter scan','Tap the visor to verify locks. Holding it raises exposure.'],['Arrival Bloom','A fast arrival releases a Bloom that blinds drones and stuns guards.']],
   traits:[['Traversal',5],['Reach',5],['Combat',2],['Powers',4]]},
  {id:'loadout',name:'Loadout',role:'Street runner',code:'LDT-02',
   blurb:'Backspool\'s moveset with none of his powers. Runner parkour, flips and rolls, street combat, and a cloth cape.',
   abilities:[['Runner flow','Rolls, flips, slides and wall runs from the Runner action set.'],['Street combat','Light and heavy strikes, guard and evade on Backspool\'s timing.'],['Cloth cape','A simulated cape that follows every move.'],['No powers','No Echo, Retrace, Drive or Threadrail. Just the run.']],
   traits:[['Traversal',4],['Reach',1],['Combat',4],['Powers',0]]}
 ];
 const MAX_TRAIT=5,CHORD=[10,6,7,11];
 const GLYPHS={
  backspool:'<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="11" fill="none" stroke="currentColor" stroke-width="2.5"/><circle cx="20" cy="20" r="4" fill="currentColor"/><path d="M4 31 L36 9" stroke="currentColor" stroke-width="2"/></svg>',
  sightline:'<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M5 30 L35 10" stroke="currentColor" stroke-width="2.5"/><path d="M27 9 L35 10 L33 18" fill="none" stroke="currentColor" stroke-width="2.5"/><circle cx="9" cy="27" r="3" fill="currentColor"/></svg>',
  loadout:'<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M8 8 L20 18 L32 8 L28 34 L20 26 L12 34 Z" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/></svg>'
 };

 // Backspool costumes come from the game's costume module (window.backspoolCostume, scripts/game_v02_backspool_costume.js).
 // The carousel on his page previews each one; selecting goes through backspoolCostume.set(), the Hero tab's own path.
 const COSTUME_SHORT={default:'Default',halfmask:'Half mask'};
 function costumes(){const list=window.backspoolCostume?.list?.()||[{id:'default',label:'Default'}];return list.map(c=>({id:c.id,label:COSTUME_SHORT[c.id]||c.label}));}
 function costumeOf(i=st.costume){const l=costumes();return l[((i%l.length)+l.length)%l.length];}
 function rigId(i=st.focus){const id=HEROES[i].id;if(id!=='backspool')return id;const c=costumeOf().id;return c==='default'?'backspool':'backspool@'+c;}
 function wornCostume(){return window.backspoolCostume?.current?.()||'default';}
 const st={activeSeen:null,costume:0,ready:false,open:false,focus:0,switching:null,status:'',opened:0,confirms:[],closes:0,frames:0,lastFrameMs:0,error:null,source:null};
 const rigs={};let stageCanvas=null,returnFocus=null,stickDir=0,preview=null,openerId=null;

 // ---------- DOM ----------
 function build(){
  const root=document.createElement('section');root.id='v02HeroSelect';root.hidden=true;root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-labelledby','v02HeroName');
  root.innerHTML=`<div class="hsBackdrop" aria-hidden="true"></div><div class="hsStrip" aria-hidden="true"></div>
<header class="hsTop"><span class="hsEyebrow">PAUSED · HERO SELECT</span><div class="hsPlate"><h1 id="v02HeroName"></h1><span id="v02HeroCode"></span></div><p id="v02HeroRole"></p><p id="v02HeroBlurb"></p></header>
<aside class="hsRoster"><h2>Heroes</h2><div id="v02HeroCards" role="listbox" aria-label="Heroes"></div></aside>
<aside class="hsTraits"><h2>Play style</h2><div id="v02HeroTraits"></div></aside>
<div class="hsStage"><div id="v02HeroStageNote" role="status"></div><div id="v02CostumeBar" hidden><button id="v02CostumePrev" type="button" aria-label="Previous costume"><svg viewBox="0 0 20 32" aria-hidden="true"><path d="M14 4 L5 16 L14 28" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="square"/></svg></button><span id="v02CostumeLabel" role="status"></span><button id="v02CostumeNext" type="button" aria-label="Next costume"><svg viewBox="0 0 20 32" aria-hidden="true"><path d="M6 4 L15 16 L6 28" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="square"/></svg></button></div><figure id="v02HeroCartridge" hidden><div class="hsCartView"></div><figcaption><b>Threadrail cartridge</b><span>Thrown, anchors, holds the cable</span></figcaption></figure></div>
<aside class="hsAbilities"><h2>Abilities</h2><div id="v02HeroAbilities"></div></aside>
<footer class="hsBar"><div class="hsPrompts" aria-hidden="true"><span><kbd>&uarr; &darr;</kbd><kbd>LB RB</kbd>Hero</span><span class="hsCostumePrompt"><kbd>&larr; &rarr;</kbd><kbd>D-pad</kbd>Costume</span><span><kbd>Enter</kbd><kbd>A</kbd>Select</span><span><kbd>Esc</kbd><kbd>B</kbd>Back</span></div><span id="v02HeroStatus" role="status"></span><button id="v02HeroBack" type="button">Back</button><button id="v02HeroConfirm" type="button">Select</button></footer>`;
  document.body.append(root);
  const cards=by('v02HeroCards');
  HEROES.forEach((h,i)=>{const b=document.createElement('button');b.type='button';b.id='v02HeroCard-'+h.id;b.className='hsCard';b.setAttribute('role','option');b.dataset.hero=h.id;
   b.innerHTML=`<span class="hsShine" aria-hidden="true"></span><span class="hsGlyph">${GLYPHS[h.id]}</span><span class="hsCardText"><b>${h.name}</b><i>${h.role}</i><span class="hsActive">Active</span></span><span class="hsKey" aria-hidden="true">${i+1}</span>`;
   b.addEventListener('click',()=>{st.source='mouse';if(st.focus===i)confirm('mouse');else setFocus(i);});cards.append(b);});
  by('v02HeroConfirm').onclick=()=>confirm('mouse');by('v02HeroBack').onclick=()=>close();
  by('v02CostumePrev').onclick=()=>{st.source='mouse';stepCostume(-1);};by('v02CostumeNext').onclick=()=>{st.source='mouse';stepCostume(1);};
  // Keep pointer events off the world canvas and the pause card underneath.
  for(const type of ['pointerdown','pointerup','mousedown','mouseup','click','dblclick','wheel','contextmenu'])root.addEventListener(type,e=>e.stopPropagation());
  // The turntable canvas is attached only while the screen is open (see stageCanvas), so the page keeps a single canvas
  // during play: suites and tools that select 'canvas' still find only the world canvas.
  const stage=document.createElement('canvas');stage.id='v02HeroStage';stage.setAttribute('aria-label','Hero turntable');stageCanvas=stage;
  // Drag the stage to turn the hero.
  let drag=null;
  stage.addEventListener('pointerdown',e=>{drag={x:e.clientX};stage.setPointerCapture(e.pointerId);});
  stage.addEventListener('pointermove',e=>{if(!drag||!preview)return;preview.spin+=(e.clientX-drag.x)*.012;preview.hold=1.5;drag.x=e.clientX;});
  for(const ev of ['pointerup','pointercancel','lostpointercapture'])stage.addEventListener(ev,()=>drag=null);
 }
 function entryPoints(){
  // Pause footer, next to Resume.
  const start=by('start');if(start&&!by('v02HeroSelectQuick')){const b=document.createElement('button');b.type='button';b.id='v02HeroSelectQuick';b.innerHTML='Heroes <kbd>Y</kbd><kbd>H</kbd>';b.title='Hero select (H, or controller Y)';b.onclick=()=>open('mouse','v02HeroSelectQuick');start.insertAdjacentElement('afterend',b);}
  // Hero tab, above the existing Character dropdown.
  const pane=by('v02Pane-hero');if(pane&&!by('v02HeroSelectTools')){const s=document.createElement('section');s.id='v02HeroSelectTools';s.innerHTML='<h2>Hero select</h2><p>See each hero on a turntable with their role and abilities, then pick one to resume as them.</p><button id="v02HeroSelectOpen" type="button">Open hero select</button>';pane.prepend(s);by('v02HeroSelectOpen').onclick=()=>open('mouse','v02HeroSelectOpen');}
 }
 function render(){
  const h=HEROES[st.focus],active=window.characterState?.().hero;
  by('v02HeroName').textContent=h.name;by('v02HeroCode').textContent=h.code;by('v02HeroRole').textContent=h.role;by('v02HeroBlurb').textContent=h.blurb;
  for(const [i,x] of HEROES.entries()){const c=by('v02HeroCard-'+x.id);c.setAttribute('aria-selected',String(i===st.focus));c.classList.toggle('isFocus',i===st.focus);c.classList.toggle('isActive',x.id===active);}
  const traits=by('v02HeroTraits');traits.replaceChildren();
  h.traits.forEach(([name,value],i)=>{const row=document.createElement('div');row.className='hsTrait';row.innerHTML=`<span>${name}</span><div class="hsBar_"><i style="--fill:${value/MAX_TRAIT};--delay:${.08*i+.15}s"></i></div><b>${value}/${MAX_TRAIT}</b>`;traits.append(row);});
  const ab=by('v02HeroAbilities');ab.replaceChildren();
  h.abilities.forEach(([name,text],i)=>{const card=document.createElement('div');card.className='hsAbility';card.style.setProperty('--delay',(.06*i+.1)+'s');card.innerHTML=`<b>${name}</b><p>${text}</p>`;ab.append(card);});
  const root=by('v02HeroSelect');root.dataset.hero=h.id;root.classList.remove('hsSwap');void root.offsetWidth;root.classList.add('hsSwap');
  const many=h.id==='backspool'&&costumes().length>1,cos=costumeOf(),list=costumes();
  by('v02CostumeBar').hidden=!many;root.classList.toggle('hsHasCostumes',many);
  if(many)by('v02CostumeLabel').textContent='Costume '+(list.findIndex(c=>c.id===cos.id)+1)+'/'+list.length+' · '+cos.label;
  const same=h.id===active&&(h.id!=='backspool'||cos.id===wornCostume());
  by('v02HeroConfirm').textContent=same?'Resume as '+h.name:'Select '+h.name+(many&&cos.id!=='default'?' · '+cos.label:'');
  by('v02HeroConfirm').disabled=!!st.switching;
  setStatus(st.status);placeStage();
  const fig=by('v02HeroCartridge');fig.hidden=h.id!=='backspool';if(h.id==='backspool'&&st.open)ensureCartridge();
 }
 // Wide layout: the stage starts just below the name plate and description, so the model can never overlap that text
 // whatever the description's length or the window's size. Narrow layout stacks everything and needs no placement.
 function placeStage(){const stage=document.querySelector('#v02HeroSelect .hsStage'),top=document.querySelector('#v02HeroSelect .hsTop');if(!stage||!top)return;
  if(matchMedia('(max-width:900px)').matches){stage.style.top='';return;}stage.style.top=Math.ceil(top.getBoundingClientRect().bottom+14)+'px';}
 function syncCostumeIndex(){st.costume=Math.max(0,costumes().findIndex(c=>c.id===wornCostume()));}
 function stepCostume(dir){
  if(st.switching||HEROES[st.focus].id!=='backspool'||costumes().length<2)return false;
  st.costume=(st.costume+dir+costumes().length)%costumes().length;setStatus('');render();if(preview)preview.target=rigId();ensureRig(rigId());return true;
 }
 function setStatus(text){st.status=text||'';const el=by('v02HeroStatus');if(el)el.textContent=st.status;}
 function setFocus(i){i=(i+HEROES.length)%HEROES.length;if(st.switching)return;if(i!==st.focus){st.focus=i;if(HEROES[i].id==='backspool')syncCostumeIndex();setStatus('');render();if(preview)preview.target=rigId();ensureRig(rigId());}const card=by('v02HeroCard-'+HEROES[i].id);if(card&&document.activeElement!==card&&st.source!=='pad')card.focus({preventScroll:true});}

 // ---------- open / close / confirm ----------
 function canOpen(){
  return st.ready&&!st.open&&typeof gameReady!=='undefined'&&gameReady&&!gameActive&&!window.characterState?.().busy&&!(window.courier?.resultsOpen)&&!origActive()&&by('menu')?.style.display!=='none';
 }
 function open(source='keyboard',opener=null){
  if(!canOpen())return false;
  st.source=source;returnFocus=opener?by(opener):document.activeElement;openerId=opener;clearInput();
  const active=window.characterState?.().hero;st.focus=Math.max(0,HEROES.findIndex(h=>h.id===active));syncCostumeIndex();st.open=true;st.opened++;setStatus('');
  by('v02HeroSelect').hidden=false;document.body.classList.add('v02HeroSelectOpen');if(!stageCanvas.isConnected)document.querySelector('#v02HeroSelect .hsStage').prepend(stageCanvas);render();
  startPreview();ensureRig(rigId());
  // Warm the other two after the focused hero.
  setTimeout(()=>{for(const h of HEROES)if(st.open)ensureRig(h.id);for(const c of costumes())if(st.open&&c.id!=='default')ensureRig('backspool@'+c.id);},50);
  setFocus(st.focus);return true;
 }
 function close(returnTo=true){
  if(!st.open||st.switching)return false;st.open=false;st.closes++;clearInput();
  by('v02HeroSelect').hidden=true;document.body.classList.remove('v02HeroSelectOpen');if(preview)preview.running=false;stageCanvas.remove();freeCartridge();
  if(returnTo){const back=returnFocus?.isConnected&&returnFocus.getClientRects().length?returnFocus:by('start');back?.focus?.({preventScroll:true});}
  return true;
 }
 async function confirm(source){
  if(!st.open||st.switching)return false;st.source=source;
  const h=HEROES[st.focus],before=window.characterState?.().hero,t0=performance.now();
  const wanted=h.id==='backspool'?costumeOf().id:null,wornBefore=wornCostume();
  if(wanted&&wanted!==wornBefore){
   // The Hero tab's own path: store the costume; if Backspool is already the hero, the module also swaps his model.
   st.switching=h.id;setStatus('Changing costume to '+costumeOf().label+'…');render();
   try{await window.backspoolCostume.set(wanted);}catch(e){console.error(e);}
   st.switching=null;
   const err=window.backspoolCostume.state?.().lastError;
   if(wornCostume()!==wanted||err){setStatus('Could not change costume'+(err?': '+err:''));render();return false;}
  }
  if(h.id!==before){
   st.switching=h.id;setStatus('Switching to '+h.name+'…');render();
   try{await characterSwitcher.change(h.id);}catch(e){console.error(e);}
   st.switching=null;
   if(window.characterState?.().hero!==h.id){const why=by('characterMessage')?.textContent||'';setStatus('Could not switch to '+h.name+(why?': '+why:''));render();return false;}
  }
  st.confirms.push({hero:h.id,from:before,costume:wanted,costumeBefore:h.id==='backspool'?wornBefore:null,bank:characterSwitcher.bankKey?.(),source,switchMs:Math.round(performance.now()-t0)});
  close(false);
  // Resume exactly as the pause menu does: Resume (mouse/keyboard) or A/Start (controller).
  startGame(source!=='pad');
  return true;
 }

 // ---------- input ----------
 let origActive=()=>false,origPoll=()=>false;
 const pressed=b=>!!b&&(b.pressed||b.value>.5);
 function pollOpen(gp){
  const now=(gp.buttons||[]).map(pressed),prev=pad.prevButtons||[],edge=i=>now[i]&&!prev[i];
  // The hero-switch chord keeps priority: hand it back to the engine, which consumes it until all four are released.
  if(heroSwitchInput.latched||CHORD.every(i=>now[i]))return false;
  // Heroes: LB/RB, D-pad up/down, left stick up/down. Costumes (Backspool): D-pad left/right, left or right stick sideways.
  const ax=i=>gp.axes?.[i]||0,lx=ax(0),ly=ax(1),rx=ax(2);
  const vDir=Math.abs(ly)>.6&&Math.abs(ly)>=Math.abs(lx)?Math.sign(ly):0,hDir=Math.abs(lx)>.6&&Math.abs(lx)>Math.abs(ly)?Math.sign(lx):Math.abs(rx)>.6?Math.sign(rx):0;
  const cur=vDir?'v'+vDir:hDir?'h'+hDir:'';const fresh=cur&&cur!==stickDir?cur:'';
  if(Math.abs(lx)<.35&&Math.abs(ly)<.35&&Math.abs(rx)<.35)stickDir=0;else if(cur)stickDir=cur;
  let step=0,costumeStep=0;
  if(edge(13)||edge(5))step=1;else if(edge(12)||edge(4))step=-1;else if(fresh[0]==='v')step=+fresh.slice(1);
  if(edge(15))costumeStep=1;else if(edge(14))costumeStep=-1;else if(fresh[0]==='h')costumeStep=+fresh.slice(1);
  if(step||costumeStep||edge(0)||edge(1)||edge(3)||edge(9))st.source='pad';
  if(step)setFocus(st.focus+step);
  else if(costumeStep)stepCostume(costumeStep);
  else if(edge(0))confirm('pad');
  else if(edge(1)||edge(3)||edge(9))close();
  pad.prevButtons=now;clearInput();return true;
 }
 function pollClosed(gp){
  // Paused pause-menu shortcut: controller Y (unused on the pause screen) opens hero select.
  if(gameActive||!st.ready)return false;const now=(gp.buttons||[]).map(pressed),prev=pad.prevButtons||[];
  if(now[3]&&!prev[3]&&!CHORD.some(i=>now[i])&&canOpen()){open('pad');pad.prevButtons=now;return true;}
  return false;
 }
 function onKey(e){
  if(!st.open){
   if(e.type==='keydown'&&e.code==='KeyH'&&!e.repeat&&!e.target.closest?.('input,select,textarea')&&canOpen()){e.preventDefault();e.stopImmediatePropagation();open('keyboard');}
   return;}
  e.preventDefault();e.stopImmediatePropagation();if(e.type!=='keydown')return;
  st.source='keyboard';const k=e.code;
  if(k==='Escape'||k==='Backspace'){close();return;}
  if(e.repeat&&!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(k))return;
  // Heroes: up/down (W/S) and 1-3, matching the vertical roster. Costumes on Backspool's page: left/right (A/D).
  if(['ArrowDown','KeyS'].includes(k))setFocus(st.focus+1);
  else if(['ArrowUp','KeyW'].includes(k))setFocus(st.focus-1);
  else if(['ArrowRight','KeyD'].includes(k))stepCostume(1);
  else if(['ArrowLeft','KeyA'].includes(k))stepCostume(-1);
  else if(/^Digit[1-3]$/.test(k))setFocus(+k.slice(5)-1);
  else if(k==='Enter'){const el=document.activeElement;if(el?.id==='v02HeroBack')close();else if(el?.id==='v02CostumePrev')stepCostume(-1);else if(el?.id==='v02CostumeNext')stepCostume(1);else confirm('keyboard');}
  // Space (jump) is swallowed but never selects, so jump-mashing cannot switch heroes.
  else if(k==='Tab'){const list=[...by('v02HeroSelect').querySelectorAll('button')].filter(b=>!b.disabled),i=list.indexOf(document.activeElement);list[(i+(e.shiftKey?-1:1)+list.length)%list.length]?.focus();}
 }

 // ---------- turntable preview ----------
 function startPreview(){
  if(!preview){
   const canvas=stageCanvas;
   const r=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'default'});
   r.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));r.outputEncoding=THREE.sRGBEncoding;r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=1.02;r.setClearColor(0x000000,0);
   const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(26,1,.1,40);
   scene.add(new THREE.HemisphereLight(0x8fb8e8,0x0a121c,.62));
   const key=new THREE.DirectionalLight(0xffc48a,1.15);key.position.set(-2.2,3.2,3.4);scene.add(key);
   const rim=new THREE.DirectionalLight(0x5fe3e8,1.05);rim.position.set(2.6,2.4,-3.2);scene.add(rim);
   const fill=new THREE.DirectionalLight(0x6f86c8,.35);fill.position.set(3,1,2);scene.add(fill);
   // Base: charcoal disc, cyan rim, amber inner line, cyan ticks, soft floor glow. Basic materials, no bloom.
   const base=new THREE.Group();scene.add(base);
   const disc=new THREE.Mesh(new THREE.CylinderGeometry(1.06,1.14,.1,72),new THREE.MeshStandardMaterial({color:0x0e1822,metalness:.45,roughness:.5}));disc.position.y=-.05;base.add(disc);
   const flat=(a,b,color,opacity=1,ts=0,tl=Math.PI*2)=>{const m=new THREE.Mesh(new THREE.RingGeometry(a,b,96,1,ts,tl),new THREE.MeshBasicMaterial({color,transparent:opacity<1,opacity,side:THREE.DoubleSide,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.y=.003;return m;};
   base.add(flat(1.065,1.1,0x5fe3e8,.95));base.add(flat(.78,.795,0xffb25a,.85));
   for(let i=0;i<12;i++)base.add(flat(.9,.95,0x5fe3e8,.5,i*Math.PI/6,Math.PI/14));
   const gc=document.createElement('canvas');gc.width=gc.height=128;const g=gc.getContext('2d'),grad=g.createRadialGradient(64,64,4,64,64,64);grad.addColorStop(0,'rgba(95,227,232,.28)');grad.addColorStop(.55,'rgba(95,227,232,.08)');grad.addColorStop(1,'rgba(95,227,232,0)');g.fillStyle=grad;g.fillRect(0,0,128,128);
   const glow=new THREE.Mesh(new THREE.PlaneGeometry(4.2,4.2),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(gc),transparent:true,depthWrite:false}));glow.rotation.x=-Math.PI/2;glow.position.y=-.1;scene.add(glow);
   const scan=new THREE.Mesh(new THREE.RingGeometry(.5,.53,64),new THREE.MeshBasicMaterial({color:0x5fe3e8,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false}));scan.rotation.x=-Math.PI/2;scene.add(scan);
   const holder=new THREE.Group();scene.add(holder);
   preview={renderer:r,scene,camera,base,holder,scan,shown:null,target:rigId(),outT:0,inT:0,spin:0,hold:0,baseBoost:0,last:0,running:false,w:0,h:0};
  }
  preview.target=rigId();
  if(!preview.running){preview.running=true;preview.last=performance.now();raf(frame);}
 }
 function fit(){
  const c=preview.renderer.domElement,w=Math.max(1,c.clientWidth),h=Math.max(1,c.clientHeight);
  if(w===preview.w&&h===preview.h)return;preview.w=w;preview.h=h;preview.renderer.setSize(w,h,false);
  const cam=preview.camera;cam.aspect=w/h;
  // Fit 2.45 m of height (base to head with headroom), and the base's width on narrow stages.
  const half=THREE.MathUtils.degToRad(cam.fov/2),dist=Math.max(1.3/Math.tan(half),1.25/(Math.tan(half)*cam.aspect));
  cam.position.set(0,1.18,dist);cam.lookAt(0,.9,0);cam.updateProjectionMatrix();
 }
 const ease=t=>t<0?0:t>1?1:1-Math.pow(1-t,3);
 const OUT=.26,SCAN=.7;
 function frame(now){
  if(!preview?.running)return;raf(frame);
  const dt=Math.min(.05,Math.max(0,(now-preview.last)/1000));preview.last=now;const t0=performance.now();
  try{
   const hero=window.characterState?.().hero;if(hero!==st.activeSeen){st.activeSeen=hero;if(st.open)render();}
   fit();const p=preview;
   if(p.shown!==p.target){
    const cur=p.shown&&rigs[p.shown];
    if(cur&&p.outT<OUT){p.outT+=dt;const k=ease(p.outT/OUT);setSolid(cur,false);cur.wireMat.opacity=.6*(1-k);cur.root.position.y=cur.baseY-.18*k;}
    else{if(cur){p.holder.remove(cur.root);cur.root.position.y=cur.baseY;}p.shown=null;const next=rigs[p.target];
     if(next?.status==='ready'){p.holder.add(next.root);p.shown=p.target;p.outT=0;p.inT=0;p.spin=0;p.baseBoost=Math.PI/2;setSolid(next,false);next.wireMat.opacity=.6;next.action.reset().play();}}
   }else if(p.shown){
    const rig=rigs[p.shown];p.inT+=dt;const s=Math.min(1,p.inT/SCAN);
    if(p.inT<SCAN+.05){p.scan.material.opacity=.9*(1-s*.4);p.scan.position.y=s*rig.height;p.scan.scale.setScalar(1+.25*Math.sin(s*Math.PI));}else p.scan.material.opacity=0;
    if(s>.55&&!rig.solidOn)setSolid(rig,true);
    rig.wireMat.opacity=p.inT<SCAN?.6:Math.max(0,.6*(1-(p.inT-SCAN)/.6));setWire(rig,rig.wireMat.opacity>.01);
   }
   if(!p.shown)p.scan.material.opacity=0;
   const rig=p.shown&&rigs[p.shown];if(rig)rig.mixer.update(dt);
   if(p.hold>0)p.hold-=dt;else p.spin+=dt*.32;
   if(rig)rig.root.rotation.y=rig.yaw+p.spin;
   const boost=p.baseBoost*Math.min(1,dt*4);p.baseBoost-=boost;p.base.rotation.y+=dt*.08+boost;
   const note=by('v02HeroStageNote'),want=rigs[p.target];note.textContent=want?.status==='error'?'Preview unavailable: '+want.error:want?.status!=='ready'?'Loading '+HEROES.find(h=>h.id===p.target.split('@')[0]).name+(p.target.includes('@')?' · '+costumeOf().label:'')+' rig…':'';
   p.renderer.render(p.scene,p.camera);st.frames++;
   renderCartridge(dt);
  }catch(e){st.error=String(e?.stack||e);console.error(e);preview.running=false;}
  st.lastFrameMs=+(performance.now()-t0).toFixed(2);
 }
 function setSolid(rig,on){rig.solidOn=on;for(const m of rig.solids)m.visible=on;setWire(rig,true);}
 function setWire(rig,on){for(const w of rig.wires)w.visible=on;}

 // ---------- Backspool's Threadrail cartridge display ----------
 // The game asset (assets/backspool/threadrail-cartridge/backspool_threadrail_cartridge_game.glb, ~9.5k triangles), shown in
 // a small display card on Backspool's stage only. It is drawn as a second, scissored pass of the same preview renderer (no
 // extra WebGL context), parsed once and reused, and its GPU buffers are freed when the screen closes (three.js uploads
 // them again on the next draw). Fins and jaws use the in-game transforms of game_threadrail_cartridge_visuals.js and
 // states.json: fins slide by their deployOffset, jaws turn -0.9 rad about local Z, the spool spins and its core brightens
 // when deployed. The display cycles folded -> deployed -> folded while it turns.
 const CART_URL='assets/backspool/threadrail-cartridge/backspool_threadrail_cartridge_game.glb';
 const cart={status:'idle',error:null,root:null,spin:null,fins:[],jaws:[],spool:null,details:[],scene:null,camera:null,clock:0,deploy:0,frames:0,lastTriangles:0,frees:0,triangles:0,fitRadius:.06};
 function ensureCartridge(){
  if(cart.status!=='idle')return;cart.status='loading';
  new THREE.GLTFLoader().load(CART_URL,g=>{try{
   const model=g.scene;model.updateMatrixWorld(true);
   model.traverse(o=>{
    if(o.isMesh){o.frustumCulled=false;cart.triangles+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3;
     if(o.name.startsWith('A_B_Identifier')){o.material=o.material.clone();o.material.color.setRGB(.45,.006,.009);o.material.emissive.setHex(0x40040b);}}
    if(o.name==='A_Label')o.visible=true;if(o.name==='B_Label')o.visible=false;if(o.name==='DockingClip')o.visible=false;
    if(o.name.startsWith('AnchorFin_'))cart.fins.push({node:o,position:o.position.clone()});
    if(o.name.startsWith('LockingJaw_'))cart.jaws.push({node:o,rotation:o.quaternion.clone()});
    if(o.name.startsWith('AnchorFin_')||o.name.startsWith('LockingJaw_'))cart.details.push(o);
    if(o.name==='Spool_Core'&&o.material){cart.spool=o;o.material=o.material.clone();}
   });
   // Fit the view to the DEPLOYED extent (fins slide out past the folded disc), then fold back.
   const box=new THREE.Box3().setFromObject(model),center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());
   for(const f of cart.fins){const d=f.node.userData.deployOffset;if(d)f.node.position.add(new THREE.Vector3().fromArray(d));}model.updateMatrixWorld(true);
   const open=new THREE.Box3().setFromObject(model);for(const f of cart.fins)f.node.position.copy(f.position);model.updateMatrixWorld(true);
   model.position.sub(center);cart.fitRadius=Math.max(open.max.distanceTo(center),open.min.distanceTo(center))*1.04;cart.deployedSize=open.getSize(new THREE.Vector3()).toArray().map(v=>+v.toFixed(4));
   const spin=new THREE.Group();spin.add(model);const tilt=new THREE.Group();tilt.add(spin);tilt.rotation.x=.62;// face (+Y) tilted toward the camera
   const scene=new THREE.Scene();scene.add(tilt);
   // The asset viewer's lighting, with the key warmed toward the menu's amber.
   scene.add(new THREE.HemisphereLight(0xe0faff,0x607481,1));const key=new THREE.DirectionalLight(0xffe2c0,1.1);key.position.set(.4,.8,.6);scene.add(key);
   const rim=new THREE.DirectionalLight(0x69b7ff,.8);rim.position.set(-.6,.3,-.7);scene.add(rim);const fill=new THREE.DirectionalLight(0xd9e7f2,.65);fill.position.set(-.5,.4,.8);scene.add(fill);
   const cam=new THREE.PerspectiveCamera(30,1,.005,5);cam.position.set(0,.03,cart.fitRadius/Math.tan(THREE.MathUtils.degToRad(15)));cam.lookAt(0,0,0);
   Object.assign(cart,{status:'ready',root:model,spin,scene,camera:cam,triangles:Math.round(cart.triangles),bounds:size.toArray().map(v=>+v.toFixed(4))});
  }catch(e){cart.status='error';cart.error=String(e.message||e);}},undefined,e=>{cart.status='error';cart.error=String(e?.message||e);console.error('Hero select cartridge',e);});
 }
 function cartridgeRect(){
  // The render area is the display card's view box, in canvas pixels (origin top-left).
  const fig=by('v02HeroCartridge');if(!fig||fig.hidden||!stageCanvas.isConnected)return null;const v=fig.querySelector('.hsCartView').getBoundingClientRect(),c=stageCanvas.getBoundingClientRect();
  if(v.width<8||v.height<8)return null;return{x:v.left-c.left,y:v.top-c.top,w:v.width,h:v.height,page:{left:v.left,right:v.right,top:v.top,bottom:v.bottom}};
 }
 function renderCartridge(dt){
  const r=preview.renderer;if(cart.status!=='ready'||HEROES[st.focus].id!=='backspool')return;const rect=cartridgeRect();if(!rect)return;
  cart.clock+=dt;const phase=cart.clock%6,target=phase>1.2&&phase<4.2?1:0;cart.deploy+=(target-cart.deploy)*(1-Math.exp(-7*dt));
  cart.spin.rotation.y+=dt*.55;
  for(const f of cart.fins){f.node.position.copy(f.position);const d=f.node.userData.deployOffset;if(d)f.node.position.add(new THREE.Vector3().fromArray(d).multiplyScalar(cart.deploy));}
  for(const j of cart.jaws)j.node.quaternion.copy(j.rotation).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),-.9*cart.deploy));
  for(const o of cart.details)o.visible=cart.deploy>.02;
  if(cart.spool){cart.spool.rotation.y=cart.clock*(cart.deploy>.5?5:1);cart.spool.material.emissiveIntensity=.3+.7*cart.deploy;}
  cart.camera.aspect=rect.w/rect.h;{const half=THREE.MathUtils.degToRad(15),d=.84*cart.fitRadius/Math.sin(half)/Math.min(1,cart.camera.aspect);cart.camera.position.set(0,d*.12,d);cart.camera.lookAt(0,0,0);}cart.camera.updateProjectionMatrix();
  const H=preview.h,x=rect.x,y=H-rect.y-rect.h;
  r.setScissorTest(true);r.setViewport(x,y,rect.w,rect.h);r.setScissor(x,y,rect.w,rect.h);r.setClearColor(0x06101a,.62);r.clear(true,true,false);
  const before=r.info.render.triangles;r.autoClear=false;r.render(cart.scene,cart.camera);r.autoClear=true;cart.lastTriangles=r.info.render.triangles;void before;
  r.setScissorTest(false);r.setViewport(0,0,preview.w,preview.h);r.setClearColor(0x000000,0);cart.frames++;
 }
 function freeCartridge(){
  // Keep the parsed scene for the next open; release its GPU buffers and textures now.
  if(cart.status!=='ready'||!preview)return;const seen=new Set();
  cart.root.traverse(o=>{if(!o.isMesh)return;if(!seen.has(o.geometry)){seen.add(o.geometry);o.geometry.dispose();}for(const m of [].concat(o.material)){if(seen.has(m))continue;seen.add(m);for(const k of ['map','normalMap','roughnessMap','metalnessMap','emissiveMap','aoMap'])if(m[k]&&!seen.has(m[k])){seen.add(m[k]);m[k].dispose();}m.dispose();}});
  cart.frees++;
 }
 function cartridgeState(){
  const rect=cartridgeRect();let projected=null;
  if(rect&&cart.status==='ready'){cart.root.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(cart.root),v=new THREE.Vector3();let l=Infinity,rr=-Infinity,t=Infinity,b=-Infinity;
   for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){v.set(x,y,z).project(cart.camera);const px=rect.page.left+(v.x+1)/2*rect.w,py=rect.page.top+(1-v.y)/2*rect.h;l=Math.min(l,px);rr=Math.max(rr,px);t=Math.min(t,py);b=Math.max(b,py);}
   projected={left:+l.toFixed(1),right:+rr.toFixed(1),top:+t.toFixed(1),bottom:+b.toFixed(1)};}
  const fig=by('v02HeroCartridge'),fr=fig&&!fig.hidden?fig.getBoundingClientRect():null;
  return{status:cart.status,error:cart.error,url:CART_URL,triangles:cart.triangles,bounds:cart.bounds||null,deployedSize:cart.deployedSize||null,frames:cart.frames,lastPassTriangles:cart.lastTriangles,deploy:+cart.deploy.toFixed(3),gpuFrees:cart.frees,
   visible:!!fr,figure:fr?{left:fr.left,right:fr.right,top:fr.top,bottom:fr.bottom}:null,view:rect?.page||null,projected,gpu:preview?{geometries:preview.renderer.info.memory.geometries,textures:preview.renderer.info.memory.textures}:null};
 }

 // Toon look matching the game's applyToonVisuals, built here so nothing is registered in the game's material caches.
 function ramp(){if(window.__v02HeroRamp)return window.__v02HeroRamp;const t=new THREE.DataTexture(new Uint8Array([70,70,70,255,150,150,150,255,232,232,232,255]),3,1,THREE.RGBAFormat);t.magFilter=t.minFilter=THREE.NearestFilter;t.needsUpdate=true;return window.__v02HeroRamp=t;}
 function toon(root){
  const cache=new Map();
  root.traverse(o=>{if(!o.isMesh||o.userData.toonOutline)return;const conv=old=>{
   if(!old||old.roughnessMap||!(old.isMeshStandardMaterial||old.isMeshPhongMaterial))return old;if(cache.has(old))return cache.get(old);
   const mat=new THREE.MeshToonMaterial({color:old.color.clone(),map:old.map,normalMap:old.normalMap,normalScale:old.normalScale?.clone(),bumpMap:old.bumpMap,bumpScale:old.bumpScale,emissive:old.emissive.clone(),emissiveMap:old.emissiveMap,emissiveIntensity:old.emissiveIntensity,gradientMap:ramp(),side:THREE.FrontSide,transparent:old.transparent,opacity:old.opacity,alphaTest:old.alphaTest,vertexColors:old.vertexColors,skinning:!!o.isSkinnedMesh});
   mat.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <output_fragment>',`float edge=pow(1.0-clamp(dot(normal,normalize(vViewPosition)),0.0,1.0),3.0);
 float luminance=dot(outgoingLight,vec3(.2126,.7152,.0722));
 outgoingLight*=mix(vec3(.62,.72,1.0),vec3(1.0),smoothstep(.04,.24,luminance));
 outgoingLight+=vec3(.10,.22,.24)*edge*.32;
 #include <output_fragment>`);};
   cache.set(old,mat);return mat;};o.material=Array.isArray(o.material)?o.material.map(conv):conv(o.material);});
 }
 function normalise(root){root.updateMatrixWorld(true);let box=new THREE.Box3().setFromObject(root);const size=box.getSize(new THREE.Vector3());root.scale.setScalar(1.82/Math.max(size.y,.001));root.updateMatrixWorld(true);box.setFromObject(root);const c=box.getCenter(new THREE.Vector3());root.position.set(-c.x,-box.min.y,-c.z);root.updateMatrixWorld(true);}
 function skinnedBox(root){const box=new THREE.Box3(),v=new THREE.Vector3();root.traverse(m=>{if(!m.isSkinnedMesh||m.userData.toonOutline)return;const n=m.geometry.attributes.position.count,step=Math.max(1,Math.floor(n/4000));for(let i=0;i<n;i+=step)box.expandByPoint(m.boneTransform(i,v).applyMatrix4(m.matrixWorld));});return box.isEmpty()?new THREE.Box3().setFromObject(root):box;}
 // Costume model files: the costume module's own list (kept in step with scripts/game_v02_backspool_costume.js).
 const COSTUME_URLS={halfmask:'assets/backspool/costumes/half-mask/backspool_halfmask_mixamo.fbx'};
 let idlePromise=null;
 function backspoolIdle(){return idlePromise||(idlePromise=fetchBytes('assets/backspool/action-v2-core-native.json.gz').then(core=>{
  const entry=JSON.parse(new TextDecoder().decode(fflate.gunzipSync(new Uint8Array(core)))).find(e=>e.name==='Breathing Idle without skin');if(!entry)throw Error('Backspool idle clip missing');
  return cleanClip(THREE.AnimationClip.parse(entry.clip),entry.id,!!entry.clip.userData?.pelvisTranslationApplied);}));}
 function facing(skin){skin.updateMatrixWorld(true);const l=skin.getObjectByName('mixamorigLeftArm').getWorldPosition(new THREE.Vector3()),r=skin.getObjectByName('mixamorigRightArm').getWorldPosition(new THREE.Vector3());const f=l.sub(r).cross(new THREE.Vector3(0,1,0));return Math.atan2(f.x,f.z);}
 async function fetchBytes(url){const r=await fetch(url);if(!r.ok)throw Error(url+' '+r.status);return r.arrayBuffer();}
 async function source(id){
  // Each returns {skin, clip}: the hero's real model file and the idle clip their game bank plays.
  if(id==='sightline'){
   const buffer=EMBEDDED_FBX[ASSET_KEYS.idle];if(!buffer)throw Error('Sightline idle FBX not loaded');
   const skin=new THREE.FBXLoader().parse(buffer,'');const anim=skin.animations?.[0];if(!anim)throw Error('Sightline idle clip missing');
   return{skin,clip:cleanClip(anim,'idle')};
  }
  if(id==='backspool'){
   const [fbx,clip]=await Promise.all([fetchBytes('assets/backspool/backspool.fbx'),backspoolIdle()]);
   return{skin:new THREE.FBXLoader().parse(fbx,'assets/backspool/'),clip};
  }
  if(id.startsWith('backspool@')){
   // A Backspool costume: its model file from the costume module, wearing Backspool's idle retargeted onto it the way the
   // module builds the costume's game bank (backspool.fbx as the rest source, faced alike, MixamoRetarget.retargetClip).
   const cid=id.slice(10),url=COSTUME_URLS[cid];if(!url)throw Error('No preview model for costume '+cid);
   const [fbx,rest,clip]=await Promise.all([fetchBytes(url),fetchBytes('assets/backspool/backspool.fbx'),backspoolIdle()]);
   const skin=new THREE.FBXLoader().parse(fbx,url.slice(0,url.lastIndexOf('/')+1)),restSkin=new THREE.FBXLoader().parse(rest,'assets/backspool/');
   for(const n of ['Hips','Head','LeftArm','RightArm'])if(!skin.getObjectByName('mixamorig'+n))throw Error('Costume rig lacks mixamorig'+n);
   normalise(skin);normalise(restSkin);const delta=facing(restSkin)-facing(skin);skin.rotation.y=delta;skin.updateMatrixWorld(true);restSkin.updateMatrixWorld(true);
   const out=MixamoRetarget.retargetClip(clip,restSkin,skin,{name:clip.name});
   restSkin.traverse(o=>{if(o.isMesh){o.geometry.dispose();for(const m of [].concat(o.material))m.dispose();}});
   return{skin,clip:out,normalised:true};
  }
  if(id==='loadout'){
   const [fbx,pack,roles]=await Promise.all([fetchBytes('assets/loadout/loadout_caped.fbx'),fetchBytes('assets/loadout/runner/loadout_runner_clips.json.gz'),fetch('assets/loadout/runner/loadout_runner_roles.json').then(r=>r.json())]);
   const name=roles.flow?.idle||'Idle_Wait_A',entry=JSON.parse(new TextDecoder().decode(fflate.gunzipSync(new Uint8Array(pack)))).clips?.[name];if(!entry)throw Error('Loadout idle clip missing: '+name);
   const skin=new THREE.FBXLoader().parse(fbx,'assets/loadout/');
   return{skin,clip:THREE.AnimationClip.parse(entry.clip)};
  }
  throw Error('unknown hero '+id);
 }
 // Facing: these rigs face +Z in their files, toward the preview camera; per-hero offsets are kept here if one does not.
 const YAW={sightline:0,backspool:0,loadout:0,'backspool@halfmask':0};
 let loadChain=Promise.resolve();
 function ensureRig(id){
  if(rigs[id])return;rigs[id]={status:'loading',error:null};
  // One at a time: FBX parsing is synchronous, so serial loads keep the paused frame responsive.
  loadChain=loadChain.then(async()=>{const t0=performance.now();try{
   const {skin,clip,normalised}=await source(id);if(!normalised)normalise(skin);
   let tris=0,bones=0;const solids=[];skin.traverse(o=>{if(o.isBone)bones++;if(o.isMesh){o.frustumCulled=false;tris+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3;}});
   toon(skin);if(typeof outlineCharacter==='function'){outlineCharacter(skin);skin.updateMatrixWorld(true);const ws=new THREE.Vector3();skin.traverse(o=>{if(o.userData.toonOutline){(o.parent||o).getWorldScale(ws);o.material.uniforms.width.value=.006/Math.max(1e-6,ws.x);}});}
   skin.traverse(o=>{if(o.isMesh)solids.push(o);});
   const wireMat=new THREE.MeshBasicMaterial({color:0x5fe3e8,wireframe:true,transparent:true,opacity:.6,depthWrite:false,skinning:true});
   // Wireframes are siblings of the solid meshes (same local transform, geometry and skeleton) so hiding a solid keeps its wire.
   const wires=[];
   for(const m of solids){if(!m.isSkinnedMesh||m.userData.toonOutline)continue;const w=new THREE.SkinnedMesh(m.geometry,wireMat);w.skeleton=m.skeleton;w.bindMatrix.copy(m.bindMatrix);w.bindMatrixInverse.copy(m.bindMatrixInverse);w.position.copy(m.position);w.quaternion.copy(m.quaternion);w.scale.copy(m.scale);w.frustumCulled=false;w.renderOrder=2;m.parent.add(w);wires.push(w);}
   const wrap=new THREE.Group();wrap.add(skin);
   const mixer=new THREE.AnimationMixer(skin),action=mixer.clipAction(clip);action.play();
   // Stand the animated skin on the base, as the game's foot-contact samples do: idle clips can carry a hip height that
   // differs from the bind pose (Sightline's does), so the bind-pose box alone would float or sink the hero.
   mixer.update(0);wrap.updateMatrixWorld(true);const box=skinnedBox(skin);wrap.position.y=-box.min.y;
   rigs[id]={status:'ready',baseY:wrap.position.y,root:wrap,skin,mixer,action,clip:clip.name,clipSeconds:+clip.duration.toFixed(2),solids,wireMat,wires,solidOn:false,yaw:YAW[id]||0,height:Math.max(1.6,box.max.y-box.min.y),triangles:Math.round(tris),bones,loadMs:Math.round(performance.now()-t0)};
  }catch(e){rigs[id]={status:'error',error:String(e.message||e)};console.error('Hero select preview',id,e);}});
 }

 // ---------- bootstrap ----------
 function bootstrap(){
  if(st.ready)return;
  const views=window.verticalViews;
  if(!views||!window.verticalHUDState?.().ready||typeof characterSwitcher==='undefined'||!by('start')){setTimeout(bootstrap,250);return;}
  build();entryPoints();
  origActive=views.active.bind(views);origPoll=views.poll.bind(views);
  // Join the paused-overlay gate: while this screen is open, startGame/activateGame/pointer lock stay blocked and the
  // engine's gamepad poll is handed to this screen first.
  views.active=()=>st.open||origActive();
  views.poll=gp=>st.open?pollOpen(gp):origActive()?origPoll(gp):pollClosed(gp);
  window.addEventListener('keydown',onKey,true);window.addEventListener('keyup',onKey,true);
  // The Loggia HUD may rebuild its footer; keep the entry points present.
  setInterval(()=>{entryPoints();if(st.open){const cards=document.querySelectorAll('.hsCard');const active=window.characterState?.().hero;for(const c of cards)c.classList.toggle('isActive',c.dataset.hero===active);}},500);
  st.ready=true;
 }
 setTimeout(bootstrap,250);
 window.addEventListener('resize',()=>{if(st.open)placeStage();});
 // Screen-space framing of the shown hero, for tests: the animated skin's box and the base's rim, in page pixels.
 function framing(){
  if(!st.open||!preview?.shown)return null;const rig=rigs[preview.shown];if(rig?.status!=='ready')return null;
  rig.root.updateMatrixWorld(true);const box=skinnedBox(rig.skin),c=stageCanvas.getBoundingClientRect(),cam=preview.camera,v=new THREE.Vector3();
  const rect=pts=>{let l=Infinity,r=-Infinity,t=Infinity,b=-Infinity;for(const q of pts){v.copy(q).project(cam);const x=c.left+(v.x+1)/2*c.width,y=c.top+(1-v.y)/2*c.height;l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}return{left:+l.toFixed(1),right:+r.toFixed(1),top:+t.toFixed(1),bottom:+b.toFixed(1)};};
  const corners=[];for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z])corners.push(new THREE.Vector3(x,y,z));
  const rim=[];for(let i=0;i<32;i++){const a=i/32*Math.PI*2;rim.push(new THREE.Vector3(Math.cos(a)*1.14,-.1,Math.sin(a)*1.14),new THREE.Vector3(Math.cos(a)*1.1,0,Math.sin(a)*1.1));}
  return{hero:preview.shown,settled:preview.inT>SCAN+.65,worldMinY:+box.min.y.toFixed(3),worldMaxY:+box.max.y.toFixed(3),model:rect(corners),base:rect(rim),canvas:{left:c.left,right:c.right,top:c.top,bottom:c.bottom}};
 }

 window.v02HeroSelect={open,close,confirm:()=>confirm('api'),framing,cartridge:()=>cartridgeState(),
  state:()=>({ready:st.ready,open:st.open,focus:HEROES[st.focus].id,switching:st.switching,status:st.status,opened:st.opened,closes:st.closes,confirms:st.confirms.slice(),frames:st.frames,lastFrameMs:st.lastFrameMs,error:st.error,source:st.source,
   shown:preview?.shown||null,
   rigs:Object.fromEntries(Object.entries(rigs).map(([k,v])=>[k,{status:v.status,error:v.error,clip:v.clip,clipSeconds:v.clipSeconds,triangles:v.triangles,bones:v.bones,loadMs:v.loadMs}])),
   heroes:HEROES.map(h=>h.id),scope:'Paused presentation only. Confirm calls characterSwitcher.change and startGame; preview rigs live in their own renderer.'})};
})();
