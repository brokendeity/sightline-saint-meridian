/* v6 (v5 unchanged): Kinsmoke's preview idle (both costumes) gets kinsmokeHero.openShoulders, as his game idle does in
 * game_v02_kinsmoke_hero_v16.js. */
/* v5 (v4 unchanged; older builds keep it): Kinsmoke gets the costume carousel too - "With cape" and "No cape" (the
 * user's Tripo Mixamo export), from window.kinsmokeCostume (game_v02_kinsmoke_hero_v15.js). Costumes are per hero now
 * (costumeApi): Backspool's as before, Kinsmoke's new. The no-cape preview rig plays his idle and, on Kin-smoke / Funeral
 * Line, the same run (Mvm_Dash), retargeted with kinsmokeHero.retargetLike (its bind is an A-pose). Confirm sets the
 * chosen costume and, if he is already the hero, the switcher swaps his bank. */
/* v4: Kinsmoke's preview stands in the game's v11 idle (the user, 2026-11-11: "make sure he also stands that way in the
 * selection screen, it's still the old idle stance there"): Backspool's native Breathing Idle
 * (assets/characters/kinsmoke/kinsmoke_idle_breathing.json.gz) retargeted from Backspool's rest pose, upper arms spread
 * 9 deg, exactly as game_v02_kinsmoke_hero_v11.js builds it; his ability previews that showed Loadout's Idle_Wait_A
 * play that idle too. Everything else is v3, unchanged (v3 stays for the builds that load it). */
/* V02 hero select, v3 (scripts/game_v02_hero_select_v3.js + game_v02_hero_select_v3.css): the redesign.
 * v1 (game_v02_hero_select.js) and v2 (game_v02_hero_select_v2.js) stay untouched for the builds that load them.
 *
 * LOOK
 * - The hero owns the screen: a full-screen 3D stage with a larger figure seen from a slightly low camera, a hero-coloured
 *   key light and rim (Backspool yellow/cyan, Sightline red/navy, Loadout dark violet), and the hero's name in huge outlined
 *   letters BEHIND the model (the pause menu's "Active hero" word style), drawn in the 3D pass so the model covers it.
 * - A painted backdrop per hero, rendered through scripts/look/anime_paint_look.js (AnimePaintLook): Backspool on a Sunday
 *   Row rooftop at dusk ("Aramis Ward · Sunday Row", Map Bible canon), Sightline above the city with straight rail lines,
 *   Loadout in a street-runner alley. Simple geometry and a painted sky; the hero is drawn after the paint pass, so the
 *   painterly filter never smears the hero's own toon look.
 * - Fewer boxes: identity text, roster, one radar stat chart and icon ability cards sit on the scene; no framed panels.
 *   "Midnight Slash" type and palette.
 * - Motion: a slash wipe and a camera dolly on every hero change; a signature pose on selection (Backspool's Echo pose with
 *   a SHORT pulse of cyan/violet Afterstep glass shards, no flames, no lasting trail; Sightline aiming; Loadout a runner
 *   flip); hovering, focusing or tapping an ability plays that move on the preview model.
 * FUNCTION
 * - Try before you pick: ability move previews, and a Controls tab with that hero's own bindings (the data of the
 *   gameplay-fixes hero-aware guide; Sightline's guide is the page's original markup, captured before that module runs).
 * - Costumes and gear: Backspool's costume carousel (left/right, D-pad) and his Threadrail cartridge showcase.
 * - No freeze: opening the screen preloads every preview rig AND every hero's game bank through characterSwitcher.prewarm
 *   (scripts/game_backspool_switch_v03.js), with a loading shimmer, so the first Loadout switch no longer builds its bank.
 * - Every input: mouse hover and click, touch (pointer events), keyboard and full gamepad focus. The L3+LT+RT+R3 chord is
 *   handed to the engine first and keeps top priority.
 * Boundaries are v1's: paused only, the paused-overlay gate (window.verticalViews.active/poll), confirm through
 * backspoolCostume.set / characterSwitcher.change then startGame, a separate preview renderer drawn only while open.
 * Controls: heroes = Up/Down, W/S, 1-3, LB/RB, D-pad up/down, left stick up/down, cards. Costumes (Backspool) = Left/Right,
 * A/D, D-pad left/right, sticks sideways, arrows. Abilities = Q/E, controller X, hover/focus/tap. Controls tab = C,
 * controller Y, the tab buttons. Select = Enter, A, Select button. Back = Esc, B, Start. */
(()=>{
 'use strict';
 const by=id=>document.getElementById(id);
 const raf=window.requestAnimationFrame.bind(window);
 const version=document.currentScript?.src.match(/[?&]v=([^&]+)/)?.[1]||'';
 // CSS_REV changes with every stylesheet edit, so a CSS-only change still changes this file's cache tag.
 const CSS_REV='v6-1-kinsmoke-shoulders';
 const css=document.createElement('link');css.rel='stylesheet';css.href='scripts/game_v02_hero_select_v3.css?r='+CSS_REV+(version?'&v='+version:'');css.id='v02HeroSelectStyle';document.head.append(css);
 // Sightline's controls guide is the page's original markup; capture it now, before the gameplay-fixes module may replace
 // it with another hero's guide.
 const SIGHTLINE_GUIDE=(()=>{const g=document.getElementById('controlsGuide');return g?g.innerHTML:'';})();

 // ---------- heroes ----------
 // Copy from the locked design rules and docs; trait values are presentation ratings. Each ability names the clip its
 // preview plays: bs: = Backspool core pack clip, sl: = Sightline ASSET_KEYS clip, lo: = Loadout Runner clip.
 const HEROES=[
  {id:'backspool',name:'Backspool',role:'Action composer',code:'BSP-01',subtitle:'Aramis Ward · Sunday Row',
   blurb:'Not a time wizard. He decides when the actions he has already performed become useful again, and crosses the city on street parkour and Threadrail cable.',
   theme:{key:0xffc23a,rim:0x5fe3e8,accent:'#ffc23a',accent2:'#5fe3e8'},backdrop:'rooftop',
   abilities:[{name:'Echo release',icon:'echo',text:'A translucent Backspool repeats one recorded action at its recorded spot, against the world as it is now.',move:'bs:Shooting ability out of hand',shards:true},
    {name:'Retrace release',icon:'retrace',text:'Reconnect to a recorded route and get propelled along it, collision-checked.',move:'bs:Running to Forward Flip'},
    {name:'Threadrail',icon:'thread',text:'Thrown cartridges and visible tensioned cables. Equipment, not magic: 6–100 m.',move:'bs:rail grinding'},
    {name:'Afterstep Drive',icon:'drive',text:'The device on his lower back releases short impulses from moves he made.',move:'bs:Aerial Evade for incoming projectile',shards:true}],
   signature:{move:'bs:Shooting ability out of hand',shards:true,label:'Echo'},
   traits:[['Traversal',4],['Reach',3],['Combat',4],['Powers',5]]},
  {id:'sightline',name:'Sightline',role:'Kinetic rail courier',code:'SGL-00',subtitle:'Kinetic rail courier',
   blurb:'Turns a line of sight into a flight path. Aim, commit a straight rail to a fixed point, and fly it. No curves, no homing.',
   theme:{key:0xff3b47,rim:0x3552e0,accent:'#ff4a55',accent2:'#4f6cff'},backdrop:'above',
   abilities:[{name:'Kinetic rail',icon:'rail',text:'LT aims and locks his footing; RT fires a straight rail to a fixed endpoint, then he flies it.',move:'sl:airAim'},
    {name:'Kinetic brace',icon:'brace',text:'A timed guard that vents pressure and turns aside drone fire.',move:'sl:fallControlled'},
    {name:'Shutter scan',icon:'scan',text:'Tap the visor to verify locks. Holding it raises exposure.',move:'sl:groundAim'},
    {name:'Arrival Bloom',icon:'bloom',text:'A fast arrival releases a Bloom that blinds drones and stuns guards.',move:'sl:hardLand'}],
   signature:{move:'sl:groundAim',label:'Aim'},
   traits:[['Traversal',5],['Reach',5],['Combat',2],['Powers',4]]},
  {id:'loadout',name:'Loadout',role:'Street runner',code:'LDT-02',subtitle:'Street runner',
   blurb:'Backspool\'s moveset with none of his powers. Runner parkour, flips and rolls, street combat, and a cloth cape.',
   theme:{key:0x8a5cff,rim:0x4a2399,accent:'#a07cff',accent2:'#6a3fd6'},backdrop:'street',
   abilities:[{name:'Runner flow',icon:'flow',text:'Rolls, flips, slides and wall runs from the Runner action set.',move:'lo:Jmp_FrontAir_Roll_All'},
    {name:'Street combat',icon:'combat',text:'Light and heavy strikes, guard and evade on Backspool\'s timing.',move:'lo:Attack_Kick_A'},
    {name:'Cloth cape',icon:'cape',text:'A simulated cape that follows every move.',move:'lo:Esc_Slide_All'},
    {name:'No powers',icon:'none',text:'No Echo, Retrace, Drive or Threadrail. Just the run.',move:'lo:Land_Spawn_Wait'}],
   signature:{move:'lo:Jmp_FrontAir_Roll_All',label:'Runner flip'},
   traits:[['Traversal',4],['Reach',1],['Combat',4],['Powers',0]]},
  // Kinsmoke: copy from his bio (development/characters/kinsmoke/kinsmoke_bio_extract.txt, pages 12-35). TEST MODE in the
  // game: idle and run only, no powers. His page floats WITNESSPILLAR beside him, slowly orbiting (see kinsmokeStaff).
  {id:'kinsmoke',name:'Kinsmoke',role:'Brightline · test mode',code:'KSM-03',subtitle:'MALU KINSALA · BRIGHTLINE',
   blurb:'Malu Kinsala, 35. First wave, named at 15, and Triple-Bound: his own Moniker, a staff and a mask. Relic scholar and mentor at Brightline. His smoke is what remains of the bonds violence tried to erase.',
   theme:{key:0x3bdc7a,rim:0x1d7a4c,accent:'#4cf08f',accent2:'#d8b25a'},backdrop:'smoke',
   abilities:[{name:'Kin-smoke',icon:'smoke',text:'Black-green smoke shaped by witness and kinship: shelter, restraint and judgment, strongest where people mattered to each other.',move:'lo:Mvm_Dash',repeat:5},
    {name:'Witnesspillar',icon:'pillar',text:'Likonzi ya Litatoli, the Pillar of Testimony. It anchors his smoke fields, grounds hostile force and plants a boundary.',move:'lo:Idle_Wait_A'},
    {name:'The Elder Face',icon:'mask',text:'Lelongi ya Bakoko. The recovered mask gives ancestral sight and an elder-weight voice. Not his yet in this build.',move:'lo:Idle_Wait_A'},
    {name:'Funeral Line',icon:'line',text:'His field state: eyes green-lit, kin-smoke from shoulders and feet. In this build he stands and runs, so you can watch the cape.',move:'lo:Mvm_Dash',repeat:5}],
   signature:{move:'lo:Mvm_Dash',repeat:2,label:'Run'},frameScale:1.5,frameScaleWide:2.05,
   traits:[['Traversal',2],['Reach',3],['Combat',4],['Powers',5]]}
 ];
 const MAX_TRAIT=5,CHORD=[10,6,7,11];
 const ICONS={
  echo:'<circle cx="16" cy="16" r="5"/><circle cx="16" cy="16" r="10" opacity=".55"/><circle cx="16" cy="16" r="14" opacity=".3"/>',
  retrace:'<path d="M5 22 C9 6 23 6 27 16"/><path d="M27 16 L21 15 M27 16 L28 10"/>',
  thread:'<circle cx="7" cy="25" r="3"/><path d="M9 23 L27 6"/><path d="M23 6 L27 6 L27 10"/>',
  drive:'<path d="M10 26 L16 6 L22 26"/><path d="M11 20 L21 20"/><path d="M6 12 L9 14 M26 12 L23 14"/>',
  rail:'<path d="M4 26 L28 6"/><path d="M21 6 L28 6 L28 13"/>',
  brace:'<path d="M16 4 L27 9 L25 22 L16 28 L7 22 L5 9 Z"/>',
  scan:'<rect x="5" y="11" width="22" height="10" rx="2"/><path d="M5 16 L27 16" opacity=".6"/>',
  bloom:'<circle cx="16" cy="16" r="4"/><path d="M16 3 V9 M16 23 V29 M3 16 H9 M23 16 H29 M7 7 L11 11 M21 21 L25 25 M25 7 L21 11 M7 25 L11 21"/>',
  flow:'<path d="M4 24 C10 24 10 8 16 8 C22 8 22 24 28 24"/>',
  combat:'<path d="M8 24 L20 12"/><path d="M18 8 L24 14 L20 18 L14 12 Z"/>',
  cape:'<path d="M9 6 L16 12 L23 6 L26 27 L16 22 L6 27 Z"/>',
  none:'<circle cx="16" cy="16" r="11"/><path d="M8 24 L24 8"/>',
  smoke:'<path d="M8 26 C4 20 12 18 9 12 C7 8 12 5 15 7"/><path d="M17 26 C13 20 21 18 18 12 C16 8 21 5 24 7"/>',
  pillar:'<path d="M16 3 V29"/><path d="M12 7 L16 3 L20 7"/><path d="M11 25 H21"/><circle cx="16" cy="13" r="3"/>',
  mask:'<path d="M8 6 H24 V18 C24 24 20 28 16 28 C12 28 8 24 8 18 Z"/><path d="M11 14 H14 M18 14 H21"/><path d="M14 22 H18"/>',
  line:'<circle cx="16" cy="9" r="4"/><path d="M10 28 C10 19 22 19 22 28"/><path d="M6 16 C3 12 6 9 8 8 M26 16 C29 12 26 9 24 8"/>'};
 const icon=k=>'<svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">'+(ICONS[k]||'')+'</svg>';
 const GLYPHS={
  backspool:'<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="11" fill="none" stroke="currentColor" stroke-width="2.5"/><circle cx="20" cy="20" r="4" fill="currentColor"/><path d="M4 31 L36 9" stroke="currentColor" stroke-width="2"/></svg>',
  sightline:'<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M5 30 L35 10" stroke="currentColor" stroke-width="2.5"/><path d="M27 9 L35 10 L33 18" fill="none" stroke="currentColor" stroke-width="2.5"/><circle cx="9" cy="27" r="3" fill="currentColor"/></svg>',
  loadout:'<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M8 8 L20 18 L32 8 L28 34 L20 26 L12 34 Z" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/></svg>',
  kinsmoke:'<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 4 V36" stroke="currentColor" stroke-width="2.5"/><path d="M15 9 L20 4 L25 9" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M11 30 C6 24 14 21 10 15 M29 30 C34 24 26 21 30 15" fill="none" stroke="currentColor" stroke-width="2"/></svg>'};

 // Controls tab data. Backspool's and Loadout's rows are the gameplay-fixes guide's tables (scripts/game_v02_gameplay_fixes.js,
 // BACKSPOOL_KEYS / BACKSPOOL_PAD / POWERS), repeated here because that module does not export them.
 const BACKSPOOL_KEYS=[['WASD','Move','walk → run'],['Shift / Ctrl','Flow sprint','tap to toggle'],['Space','Jump / directional flip'],['LMB','Strike'],['Q','Heavy'],['RMB','Guard'],['C','Evade'],['Alt','Lock target'],['1–3','Combat state'],['R','Threadrail','tap · hold for precision'],['E','Afterstep Drive'],['U','Snapback'],['G hold / H / J / N','Bank / Echo / Retrace / next'],['T','Practice targets'],['I','Read public information'],['Esc','Pause and tools']];
 const BACKSPOOL_PAD=[['LS','Move'],['RS','Camera'],['L3','Flow sprint','B outside combat'],['A / ×','Jump'],['RT','Strike'],['D↑','Heavy'],['LT','Guard'],['D↓ / B','Evade'],['R3','Lock target'],['D← / D→','Combat state'],['X / □','Threadrail'],['RB / R1','Afterstep Drive'],['LB + Y','Snapback'],['View + LB / RB / X / D↑','Bank / Echo / Retrace / next'],['Y / △','Read public information'],['L3 + LT + RT + R3','Switch hero']];
 const POWERS=new Set(['R','E','U','G hold / H / J / N','X / □','RB / R1','LB + Y','View + LB / RB / X / D↑']);
 const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 function controlsHTML(id){
  if(id==='sightline')return '<div class="hsGuide hsGuideSightline">'+(SIGHTLINE_GUIDE||'<p>Sightline controls unavailable.</p>')+'</div>';
  if(id==='kinsmoke'){const row=x=>`<li><kbd>${esc(x[0])}</kbd><b>${esc(x[1])}</b>${x[2]?'<i>'+esc(x[2])+'</i>':''}</li>`;
   return `<div class="hsGuide"><h3>Keyboard</h3><ul>${[['WASD','Move','walk → run'],['Shift / Ctrl','Sprint','tap to toggle'],['Esc','Pause and tools']].map(row).join('')}</ul><h3>Controller</h3><ul>${[['LS','Move'],['RS','Camera'],['L3','Sprint'],['L3 + LT + RT + R3','Switch hero']].map(row).join('')}</ul><p>Test mode: Kinsmoke stands and runs so his cape can be judged. No powers, no combat yet.</p></div>`;}
  const keep=x=>id!=='loadout'||!POWERS.has(x[0]),row=x=>`<li><kbd>${esc(x[0])}</kbd><b>${esc(x[1])}</b>${x[2]?'<i>'+esc(x[2])+'</i>':''}</li>`;
  return `<div class="hsGuide"><h3>Keyboard</h3><ul>${BACKSPOOL_KEYS.filter(keep).map(row).join('')}</ul><h3>Controller</h3><ul>${BACKSPOOL_PAD.filter(keep).map(row).join('')}</ul>`+
   (id==='loadout'?'<p>Loadout has Backspool\'s traversal, parkour and melee without his powers: no Threadrail, Afterstep Drive, Snapback, Echo or Retrace.</p>':'')+'</div>';
 }

 // ---------- costumes ----------
 const COSTUME_SHORT={default:'Default',halfmask:'Half mask'};
 const COSTUME_URLS={halfmask:'assets/backspool/costumes/half-mask/backspool_halfmask_mixamo.fbx'};
 function costumeApi(hid=HEROES[st.focus].id){return hid==='backspool'?window.backspoolCostume:hid==='kinsmoke'?window.kinsmokeCostume:null;}
 function costumes(hid=HEROES[st.focus].id){const list=costumeApi(hid)?.list?.()||[{id:'default',label:'Default'}];return list.map(c=>({id:c.id,label:hid==='backspool'?(COSTUME_SHORT[c.id]||c.label):c.label}));}
 function costumeOf(i=st.costume){const l=costumes();return l[((i%l.length)+l.length)%l.length];}
 function rigId(i=st.focus){const id=HEROES[i].id;if(!costumeApi(id))return id;const c=costumeOf().id;return c==='default'?id:id+'@'+c;}
 function wornCostume(hid=HEROES[st.focus].id){return costumeApi(hid)?.current?.()||'default';}
 function bankKeyFor(rid){return rid;}// preview rig ids and game bank keys share the scheme: hero id, or backspool@<costume>

 const st={activeSeen:null,costume:0,tab:'abilities',ability:-1,ready:false,open:false,focus:0,switching:null,status:'',opened:0,confirms:[],closes:0,frames:0,lastFrameMs:0,error:null,source:null,
  moves:[],shardPulses:[],wipes:0,dollies:0,transitions:[],
  preload:{runs:0,started:0,done:false,ms:0,keys:{},maxFrameMs:0},frameTimes:[],gaps:[]};
 const rigs={};let stageCanvas=null,returnFocus=null,stickDir=0,preview=null;

 // ---------- DOM ----------
 function build(){
  const root=document.createElement('section');root.id='v02HeroSelect';root.className='hsV3';root.hidden=true;root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-labelledby','hsV3Name');
  root.innerHTML=`<div class="hsShade" aria-hidden="true"></div><div class="hsWipe" aria-hidden="true"></div>
<header class="hsId"><span class="hsEyebrow">PAUSED · HERO SELECT</span><h1 id="hsV3Name"></h1><p id="v02HeroSub"></p><p id="v02HeroCostume" role="status"></p><p id="v02HeroBlurb"></p></header>
<nav class="hsRoster" aria-label="Heroes"><div id="v02HeroCards" role="listbox" aria-label="Heroes"></div></nav>
<div class="hsChart" aria-label="Play style"><svg id="v02HeroRadar" viewBox="-60 -60 120 120" role="img"></svg><ul id="v02HeroTraits"></ul></div>
<div class="hsStage"><div id="v02HeroStageNote" role="status"></div><div id="v02CostumeBar" hidden><button id="v02CostumePrev" type="button" aria-label="Previous costume"><svg viewBox="0 0 20 32" aria-hidden="true"><path d="M14 4 L5 16 L14 28" fill="none" stroke="currentColor" stroke-width="3"/></svg></button><button id="v02CostumeNext" type="button" aria-label="Next costume"><svg viewBox="0 0 20 32" aria-hidden="true"><path d="M6 4 L15 16 L6 28" fill="none" stroke="currentColor" stroke-width="3"/></svg></button></div>
</div>
<aside class="hsSide"><div class="hsTabs" role="tablist"><button id="v02TabAbilities" role="tab" type="button" aria-selected="true">Abilities</button><button id="v02TabControls" role="tab" type="button" aria-selected="false">Controls</button></div>
<div id="v02HeroAbilities" role="tabpanel" aria-labelledby="v02TabAbilities"></div><div id="v02HeroControls" role="tabpanel" aria-labelledby="v02TabControls" hidden></div><figure id="v02HeroCartridge" hidden><div class="hsCartView"></div><figcaption><b>Threadrail cartridge</b><span>Gear · thrown, anchors, holds the cable</span></figcaption></figure></aside>
<footer class="hsBar"><div class="hsPrompts" aria-hidden="true"><span><kbd>&uarr; &darr;</kbd><kbd>LB RB</kbd>Hero</span><span class="hsCostumePrompt"><kbd>&larr; &rarr;</kbd><kbd>D-pad</kbd>Costume</span><span><kbd>Q E</kbd><kbd>X</kbd>Try ability</span><span><kbd>C</kbd><kbd>Y</kbd>Controls</span><span><kbd>Enter</kbd><kbd>A</kbd>Select</span><span><kbd>Esc</kbd><kbd>B</kbd>Back</span></div>
<span id="v02HeroPreload" class="hsShimmer" hidden>Preparing heroes</span><span id="v02HeroStatus" role="status"></span><button id="v02HeroBack" type="button">Back</button><button id="v02HeroConfirm" type="button">Select</button></footer>`;
  document.body.append(root);
  const cards=by('v02HeroCards');
  HEROES.forEach((h,i)=>{const b=document.createElement('button');b.type='button';b.id='v02HeroCard-'+h.id;b.className='hsCard';b.setAttribute('role','option');b.dataset.hero=h.id;
   b.innerHTML=`<span class="hsGlyph">${GLYPHS[h.id]}</span><span class="hsCardText"><b>${h.name}</b><i>${h.role}</i><span class="hsActive">Active</span></span><span class="hsKey" aria-hidden="true">${i+1}</span>`;
   b.addEventListener('click',()=>{if(st.source!=='touch')st.source='mouse';if(st.focus===i)confirm(st.source);else setFocus(i);});cards.append(b);});
  by('v02HeroConfirm').onclick=()=>confirm(st.source==='touch'?'touch':'mouse');by('v02HeroBack').onclick=()=>close();
  by('v02CostumePrev').onclick=()=>stepCostume(-1);by('v02CostumeNext').onclick=()=>stepCostume(1);
  by('v02TabAbilities').onclick=()=>setTab('abilities');by('v02TabControls').onclick=()=>setTab('controls');
  // Touch is pointer input with pointerType 'touch'; remember it so confirm reports it and resumes without pointer lock.
  root.addEventListener('pointerdown',e=>{st.source=e.pointerType==='touch'?'touch':e.pointerType==='pen'?'touch':'mouse';},true);
  for(const type of ['pointerdown','pointerup','mousedown','mouseup','click','dblclick','wheel','contextmenu'])root.addEventListener(type,e=>e.stopPropagation());
  const stage=document.createElement('canvas');stage.id='v02HeroStage';stage.setAttribute('aria-label','Hero preview');stageCanvas=stage;
  let drag=null;
  stage.addEventListener('pointerdown',e=>{drag={x:e.clientX};stage.setPointerCapture(e.pointerId);});
  stage.addEventListener('pointermove',e=>{if(!drag||!preview)return;preview.spin+=(e.clientX-drag.x)*.012;preview.hold=1.5;drag.x=e.clientX;});
  for(const ev of ['pointerup','pointercancel','lostpointercapture'])stage.addEventListener(ev,()=>drag=null);
 }
 function entryPoints(){
  const start=by('start');if(start&&!by('v02HeroSelectQuick')){const b=document.createElement('button');b.type='button';b.id='v02HeroSelectQuick';b.innerHTML='Heroes <kbd>Y</kbd><kbd>H</kbd>';b.title='Hero select (H, or controller Y)';b.onclick=()=>open('mouse','v02HeroSelectQuick');start.insertAdjacentElement('afterend',b);}
  const pane=by('v02Pane-hero');if(pane&&!by('v02HeroSelectTools')){const s=document.createElement('section');s.id='v02HeroSelectTools';s.innerHTML='<h2>Hero select</h2><p>Try each hero, their moves, costumes and gear, then pick one to resume as them.</p><button id="v02HeroSelectOpen" type="button">Open hero select</button>';pane.prepend(s);by('v02HeroSelectOpen').onclick=()=>open('mouse','v02HeroSelectOpen');}
 }
 function radar(h){
  // One compact chart: four axes (Traversal up, Reach right, Combat down, Powers left), the hero's shape filled in its accent.
  const R=46,pt=(i,v)=>{const a=-Math.PI/2+i*Math.PI/2,r=R*v/MAX_TRAIT;return [Math.cos(a)*r,Math.sin(a)*r];};
  const ring=f=>[0,1,2,3].map(i=>pt(i,MAX_TRAIT*f).join(',')).join(' ');
  const shape=h.traits.map(([,v],i)=>pt(i,Math.max(.25,v)).join(',')).join(' ');
  return `<polygon class="hsRing" points="${ring(1)}"/><polygon class="hsRing" points="${ring(.6)}"/><polygon class="hsRing" points="${ring(.2)}"/>`+
   [0,1,2,3].map(i=>`<line class="hsAxis" x1="0" y1="0" x2="${pt(i,MAX_TRAIT)[0]}" y2="${pt(i,MAX_TRAIT)[1]}"/>`).join('')+
   `<polygon class="hsShape" points="${shape}"/>`+h.traits.map(([,v],i)=>`<circle class="hsDot" cx="${pt(i,Math.max(.25,v))[0]}" cy="${pt(i,Math.max(.25,v))[1]}" r="2.6"/>`).join('');
 }
 function render(){
  const h=HEROES[st.focus],active=window.characterState?.().hero,root=by('v02HeroSelect');
  root.style.setProperty('--hs-accent',h.theme.accent);root.style.setProperty('--hs-accent2',h.theme.accent2);root.dataset.hero=h.id;
  by('hsV3Name').textContent=h.name;by('v02HeroSub').textContent=h.id==='backspool'||h.id==='kinsmoke'?h.subtitle:h.role;by('v02HeroBlurb').textContent=h.blurb;
  for(const [i,x] of HEROES.entries()){const c=by('v02HeroCard-'+x.id);c.setAttribute('aria-selected',String(i===st.focus));c.classList.toggle('isFocus',i===st.focus);c.classList.toggle('isActive',x.id===active);}
  by('v02HeroRadar').innerHTML=radar(h);by('v02HeroRadar').setAttribute('aria-label',h.traits.map(([n,v])=>n+' '+v+' of '+MAX_TRAIT).join(', '));
  by('v02HeroTraits').innerHTML=h.traits.map(([n,v])=>`<li><span>${n}</span><b>${v}</b></li>`).join('');
  const ab=by('v02HeroAbilities');ab.replaceChildren();
  h.abilities.forEach((a,i)=>{const b=document.createElement('button');b.type='button';b.className='hsAbility';b.id='v02Ability-'+i;b.style.setProperty('--delay',(.05*i+.08)+'s');b.innerHTML=`<span class="hsIcon">${icon(a.icon)}</span><span class="hsAbText"><b>${a.name}</b><span>${a.text}</span></span>`;
   const play=src=>{if(st.ability!==i){st.ability=i;markAbility();}playAbility(i,src);};
   b.addEventListener('mouseenter',()=>play('hover'));b.addEventListener('focus',()=>play('focus'));b.addEventListener('click',()=>play(st.source==='touch'?'touch':'click'));ab.append(b);});
  st.ability=-1;by('v02HeroControls').innerHTML=controlsHTML(h.id);
  const many=!!costumeApi(h.id)&&costumes().length>1,cos=costumeOf(),list=costumes();
  by('v02CostumeBar').hidden=!many;root.classList.toggle('hsHasCostumes',many);
  by('v02HeroCostume').textContent=many?'Costume '+(list.findIndex(c=>c.id===cos.id)+1)+'/'+list.length+' · '+cos.label:'';by('v02HeroCostume').hidden=!many;
  const same=h.id===active&&(!costumeApi(h.id)||cos.id===wornCostume());
  by('v02HeroConfirm').textContent=same?'Resume as '+h.name:'Select '+h.name+(many&&cos.id!=='default'?' · '+cos.label:'');
  by('v02HeroConfirm').disabled=!!st.switching;
  setStatus(st.status);
  syncCartridge();if(h.id==='backspool'&&st.open)ensureCartridge();
  root.classList.remove('hsSwap');void root.offsetWidth;root.classList.add('hsSwap');
  if(preview)setNameWord(h);
 }
 function syncCartridge(){const fig=by('v02HeroCartridge');if(fig)fig.hidden=HEROES[st.focus].id!=='backspool'||st.tab==='controls';}
 function setTab(tab){st.tab=tab==='controls'?'controls':'abilities';const c=st.tab==='controls';by('v02TabAbilities').setAttribute('aria-selected',String(!c));by('v02TabControls').setAttribute('aria-selected',String(c));by('v02HeroAbilities').hidden=c;by('v02HeroControls').hidden=!c;syncCartridge();}
 function markAbility(){for(const b of document.querySelectorAll('#v02HeroAbilities .hsAbility'))b.classList.toggle('isFocus',b.id==='v02Ability-'+st.ability);}
 function stepAbility(dir){const n=HEROES[st.focus].abilities.length;st.ability=st.ability<0?(dir>0?0:n-1):(st.ability+dir+n)%n;setTab('abilities');markAbility();
  const b=by('v02Ability-'+st.ability);if(b&&st.source!=='pad')b.focus({preventScroll:true});else playAbility(st.ability,st.source||'key');}
 function setStatus(text){st.status=text||'';const el=by('v02HeroStatus');if(el)el.textContent=st.status;}
 function syncCostumeIndex(){st.costume=Math.max(0,costumes().findIndex(c=>c.id===wornCostume()));}
 function stepCostume(dir){
  if(st.switching||!costumeApi()||costumes().length<2)return false;
  st.costume=(st.costume+dir+costumes().length)%costumes().length;setStatus('');render();if(preview)preview.target=rigId();ensureRig(rigId());return true;
 }
 function setFocus(i){i=(i+HEROES.length)%HEROES.length;if(st.switching)return;
  if(i!==st.focus){st.focus=i;if(costumeApi(HEROES[i].id))syncCostumeIndex();setStatus('');render();if(preview){preview.target=rigId();transition();}ensureRig(rigId());}
  const card=by('v02HeroCard-'+HEROES[i].id);if(card&&document.activeElement!==card&&st.source!=='pad'&&st.source!=='touch')card.focus({preventScroll:true});}

 // ---------- open / close / confirm ----------
 function canOpen(){
  return st.ready&&!st.open&&typeof gameReady!=='undefined'&&gameReady&&!gameActive&&!window.characterState?.().busy&&!(window.courier?.resultsOpen)&&!origActive()&&by('menu')?.style.display!=='none';
 }
 function open(source='keyboard',opener=null){
  if(!canOpen())return false;
  st.source=source;returnFocus=opener?by(opener):document.activeElement;clearInput();
  const active=window.characterState?.().hero;st.focus=Math.max(0,HEROES.findIndex(h=>h.id===active));syncCostumeIndex();st.open=true;st.opened++;setStatus('');setTab('abilities');
  by('v02HeroSelect').hidden=false;document.body.classList.add('v02HeroSelectOpen');if(!stageCanvas.isConnected)document.querySelector('#v02HeroSelect .hsStage').prepend(stageCanvas);
  startPreview();render();ensureRig(rigId());transition(true);
  setTimeout(preloadAll,250);
  setFocus(st.focus);return true;
 }
 function close(returnTo=true){
  if(!st.open||st.switching)return false;st.open=false;st.closes++;clearInput();
  by('v02HeroSelect').hidden=true;document.body.classList.remove('v02HeroSelectOpen');if(preview)preview.running=false;stageCanvas.remove();freeCartridge();
  if(returnTo){const back=returnFocus?.isConnected&&returnFocus.getClientRects().length?returnFocus:by('start');back?.focus?.({preventScroll:true});}
  return true;
 }
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 async function confirm(source){
  if(!st.open||st.switching)return false;st.source=source;
  const h=HEROES[st.focus],before=window.characterState?.().hero,t0=performance.now();
  const api=costumeApi(h.id),wanted=api?costumeOf().id:null,wornBefore=wornCostume();
  // Signature pose while the switch runs: the pose plays on the preview hero; the screen closes when both are done.
  st.switching=h.id;render();const pose=playMove(h.signature.move,{shards:!!h.signature.shards,source:'select',repeat:h.signature.repeat||1});const poseDone=wait(900);
  let ok=true,why='';
  try{
   if(wanted&&wanted!==wornBefore){setStatus('Changing costume to '+costumeOf().label+'…');await api.set(wanted);
    const err=api.state?.().lastError;if(wornCostume()!==wanted||err){ok=false;why='Could not change costume'+(err?': '+err:'');}}
   if(ok&&h.id!==before){setStatus('Switching to '+h.name+'…');await characterSwitcher.change(h.id);
    if(window.characterState?.().hero!==h.id){ok=false;const m=by('characterMessage')?.textContent||'';why='Could not switch to '+h.name+(m?': '+m:'');}}
  }catch(e){ok=false;why=String(e?.message||e);console.error(e);}
  const switchMs=Math.round(performance.now()-t0);await poseDone;await pose;st.switching=null;
  if(!ok){setStatus(why);render();return false;}
  st.confirms.push({hero:h.id,from:before,costume:wanted,costumeBefore:api?wornBefore:null,bank:characterSwitcher.bankKey?.(),source,switchMs,signature:h.signature.move,totalMs:Math.round(performance.now()-t0)});
  close(false);
  startGame(source==='keyboard'||source==='mouse');
  return true;
 }

 // ---------- preload (no freeze) ----------
 async function preloadAll(){
  if(!st.open||st.preload.started&&!st.preload.done)return;
  const pl=st.preload;pl.runs++;pl.started=performance.now();pl.done=false;pl.maxFrameMs=0;by('v02HeroPreload').hidden=false;
  const keys=[...HEROES.map(h=>h.id),...['backspool','kinsmoke'].flatMap(hid=>costumes(hid).filter(c=>c.id!=='default').map(c=>hid+'@'+c.id))];
  // Preview rigs first (what the player is looking at), then the game banks, one at a time with a breath between, so the
  // screen keeps animating between builds.
  for(const k of keys)ensureRig(k);
  await loadChain;
  for(const k of keys){
   if(!st.open)break;const t=performance.now();let status='ready';
   try{status=characterSwitcher.prewarm?await characterSwitcher.prewarm(bankKeyFor(k)):'no prewarm hook';}catch(e){status='error: '+(e?.message||e);}
   pl.keys[k]={status,ms:Math.round(performance.now()-t)};await wait(60);
  }
  pl.done=true;pl.ms=Math.round(performance.now()-pl.started);by('v02HeroPreload').hidden=true;
 }

 // ---------- input ----------
 let origActive=()=>false,origPoll=()=>false;
 const pressed=b=>!!b&&(b.pressed||b.value>.5);
 function pollOpen(gp){
  const now=(gp.buttons||[]).map(pressed),prev=pad.prevButtons||[],edge=i=>now[i]&&!prev[i];
  // The hero-switch chord keeps priority: hand it back to the engine, which consumes it until all four are released.
  if(heroSwitchInput.latched||CHORD.every(i=>now[i]))return false;
  const ax=i=>gp.axes?.[i]||0,lx=ax(0),ly=ax(1),rx=ax(2);
  const vDir=Math.abs(ly)>.6&&Math.abs(ly)>=Math.abs(lx)?Math.sign(ly):0,hDir=Math.abs(lx)>.6&&Math.abs(lx)>Math.abs(ly)?Math.sign(lx):Math.abs(rx)>.6?Math.sign(rx):0;
  const cur=vDir?'v'+vDir:hDir?'h'+hDir:'';const fresh=cur&&cur!==stickDir?cur:'';
  if(Math.abs(lx)<.35&&Math.abs(ly)<.35&&Math.abs(rx)<.35)stickDir=0;else if(cur)stickDir=cur;
  let step=0,costumeStep=0;
  if(edge(13)||edge(5))step=1;else if(edge(12)||edge(4))step=-1;else if(fresh[0]==='v')step=+fresh.slice(1);
  if(edge(15))costumeStep=1;else if(edge(14))costumeStep=-1;else if(fresh[0]==='h')costumeStep=+fresh.slice(1);
  if(step||costumeStep||edge(0)||edge(1)||edge(2)||edge(3)||edge(9))st.source='pad';
  if(step)setFocus(st.focus+step);
  else if(costumeStep)stepCostume(costumeStep);
  else if(edge(2))stepAbility(1);
  else if(edge(3))setTab(st.tab==='controls'?'abilities':'controls');
  else if(edge(0))confirm('pad');
  else if(edge(1)||edge(9))close();
  pad.prevButtons=now;clearInput();return true;
 }
 function pollClosed(gp){
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
  if(['ArrowDown','KeyS'].includes(k))setFocus(st.focus+1);
  else if(['ArrowUp','KeyW'].includes(k))setFocus(st.focus-1);
  else if(['ArrowRight','KeyD'].includes(k))stepCostume(1);
  else if(['ArrowLeft','KeyA'].includes(k))stepCostume(-1);
  else if(/^Digit[1-9]$/.test(k)&&+k.slice(5)<=HEROES.length)setFocus(+k.slice(5)-1);
  else if(k==='KeyE')stepAbility(1);
  else if(k==='KeyQ')stepAbility(-1);
  else if(k==='KeyC')setTab(st.tab==='controls'?'abilities':'controls');
  else if(k==='Enter'){const el=document.activeElement;if(el?.id==='v02HeroBack')close();else if(el?.id==='v02CostumePrev')stepCostume(-1);else if(el?.id==='v02CostumeNext')stepCostume(1);else if(el?.id==='v02TabControls')setTab('controls');else if(el?.id==='v02TabAbilities')setTab('abilities');else if(el?.classList?.contains('hsAbility'))el.click();else confirm('keyboard');}
  // Space (jump) is swallowed but never selects, so jump-mashing cannot switch heroes.
  else if(k==='Tab'){const list=[...by('v02HeroSelect').querySelectorAll('button')].filter(b=>!b.disabled&&b.getClientRects().length),i=list.indexOf(document.activeElement);list[(i+(e.shiftKey?-1:1)+list.length)%list.length]?.focus();}
 }

 // ---------- backdrops (painted) ----------
 function canvasTex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=4;return t;}
 function windowsTex(base,lit,seed=1){return canvasTex(256,256,(g,w,h)=>{g.fillStyle=base;g.fillRect(0,0,w,h);let s=seed;const rnd=()=>(s=(s*16807)%2147483647)/2147483647;
  for(let y=14;y<h-10;y+=32)for(let x=12;x<w-10;x+=28){g.fillStyle=rnd()<.42?lit:'#1a1d26';g.fillRect(x,y,14,18);g.fillStyle='rgba(0,0,0,.35)';g.fillRect(x,y+18,14,3);}});}
 function sky(top,mid,horizon,sunDir){
  return new THREE.Mesh(new THREE.SphereGeometry(400,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,
   uniforms:{top:{value:new THREE.Color(top)},mid:{value:new THREE.Color(mid)},horizon:{value:new THREE.Color(horizon)},sun:{value:new THREE.Vector3(...sunDir).normalize()},toLinear:{value:0}},
   vertexShader:'varying vec3 vDir;void main(){vDir=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
   fragmentShader:`varying vec3 vDir;uniform vec3 top,mid,horizon,sun;uniform float toLinear;
    void main(){float y=vDir.y;vec3 c=mix(horizon,mid,smoothstep(-.02,.22,y));c=mix(c,top,smoothstep(.22,.75,y));
     float s=max(dot(normalize(vDir),sun),0.);c+=horizon*pow(s,24.)*.8+horizon*pow(s,4.)*.18;
     float band=sin(vDir.x*9.+vDir.z*5.)*.5+.5;c+=vec3(.05,.03,.06)*band*smoothstep(.05,.3,y)*(1.-smoothstep(.3,.6,y));
     gl_FragColor=vec4(toLinear>.5?pow(c,vec3(2.2)):c,1.);}`}));
 }
 const mat=(color,name,extra={})=>{const m=new THREE.MeshLambertMaterial({color,...extra});m.name=name;return m;};
 const box=(w,h,d,m,x,y,z,name)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.name=name||m.name;o.userData.role=o.name;return o;};
 function buildBackdrop(id){
  const g=new THREE.Group();g.name='backdrop-'+id;let skyMesh,sunDir;
  if(id==='rooftop'){
   // Sunday Row rooftop at dusk: tar roof, brick parapet, a water tank, AC units, a chimney, then brick walk-ups with warm
   // windows and a church steeple against a violet-orange dusk.
   sunDir=[-.6,.08,-1];skyMesh=sky(0x1b1440,0x6a3b6e,0xff9a4a,sunDir);
   const roof=new THREE.Mesh(new THREE.PlaneGeometry(40,40),mat(0x2b2a2e,'roof'));roof.rotation.x=-Math.PI/2;roof.position.y=-.02;roof.name='roof';g.add(roof);
   const brick=mat(0x6b3a2c,'brick');for(const [x,z,w,d] of [[0,-7,18,.4],[-9,-1,.4,12],[9,-1,.4,12]])g.add(box(w,.9,d,brick,x,.45,z,'brick_parapet'));
   const tankMat=mat(0x5a4632,'water_tank'),leg=mat(0x2c2c30,'water_tank_leg');const tank=new THREE.Mesh(new THREE.CylinderGeometry(1.3,1.3,2.4,16),tankMat);tank.position.set(-5.5,3.6,-10);tank.name='water_tank';g.add(tank);
   const cone=new THREE.Mesh(new THREE.ConeGeometry(1.45,.9,16),tankMat);cone.position.set(-5.5,5.25,-10);cone.name='water_tank';g.add(cone);
   for(const [x,z] of [[-6.4,-9.1],[-4.6,-9.1],[-6.4,-10.9],[-4.6,-10.9]])g.add(box(.12,2.4,.12,leg,x,1.2,z,'water_tank_leg'));
   const ac=mat(0x8a8f96,'ac_unit');g.add(box(1.4,.9,1,ac,5.2,.45,-5));g.add(box(1,.7,.9,ac,6.6,.35,-3.5));
   g.add(box(.9,2.2,.9,brick,3.5,1.1,-9,'chimney'));
   const walls=[0x5a2f25,0x6e3b2b,0x4b2a2a,0x5b3428];
   for(let i=0;i<9;i++){const w=7+((i*37)%5),h=9+((i*53)%9),x=-34+i*8.5,z=-30-((i*29)%10);
    const m=new THREE.MeshLambertMaterial({color:walls[i%4],map:windowsTex('#4a2a22','#ffb25a',i+3)});m.map.repeat.set(w/6,h/6);m.map.wrapS=m.map.wrapT=THREE.RepeatWrapping;m.name='brick';
    g.add(box(w,h,6,m,x,h/2-3,z,'brick_walkup'));}
   const church=mat(0x3a2f3c,'stone');g.add(box(5,14,5,church,14,4,-38,'stone_church'));const spire=new THREE.Mesh(new THREE.ConeGeometry(2.6,7,4),church);spire.position.set(14,14.5,-38);spire.rotation.y=Math.PI/4;spire.name='stone_spire';g.add(spire);
   const glow=new THREE.PointLight(0xffa860,1.2,30,2);glow.position.set(0,4,-20);g.add(glow);
   g.add(new THREE.HemisphereLight(0x9a7ab8,0x2a1c22,.55));const sun=new THREE.DirectionalLight(0xff9a5a,1.3);sun.position.set(...sunDir).multiplyScalar(30);g.add(sun);
  }else if(id==='above'){
   // Above the city: a small antenna platform high over the district, tower tops far below, straight rail lines (no
   // curves, no homing) running to fixed points, against a deep navy night with a red horizon.
   sunDir=[.5,.05,-1];skyMesh=sky(0x050a1e,0x14204a,0x8a2232,sunDir);
   const deck=new THREE.Mesh(new THREE.CylinderGeometry(3.2,3.4,.3,24),mat(0x23262e,'pole_metal'));deck.position.y=-.15;deck.name='pole_metal';g.add(deck);
   const railM=new THREE.MeshBasicMaterial({color:0x5fe3e8});railM.name='rail';
   for(let i=0;i<14;i++){const a=i*0.47,r=40+((i*31)%60),h=-70+((i*17)%40),w=8+((i*7)%8);
    const m=new THREE.MeshLambertMaterial({color:0x1b2338,map:windowsTex('#141b2c','#7fd8ff',i+11)});m.map.repeat.set(w/8,3);m.map.wrapS=m.map.wrapT=THREE.RepeatWrapping;m.name='glass_tower';
    g.add(box(w,60,w,m,Math.cos(a)*r,h,-Math.abs(Math.sin(a)*r)-12,'tower_glass'));}
   const line=(ax,ay,az,bx,by,bz)=>{const A=new THREE.Vector3(ax,ay,az),B=new THREE.Vector3(bx,by,bz),L=A.distanceTo(B);const m=new THREE.Mesh(new THREE.BoxGeometry(.05,.05,L),railM);m.position.copy(A).lerp(B,.5);m.lookAt(B);m.name='rail';g.add(m);};
   line(0,.2,0,-38,-12,-70);line(0,.2,0,30,-20,-60);line(-20,-30,-40,40,-25,-90);line(10,-40,-30,-50,-36,-80);
   g.add(new THREE.HemisphereLight(0x3a58b8,0x0a0a14,.5));const moon=new THREE.DirectionalLight(0xff5a6a,.9);moon.position.set(...sunDir).multiplyScalar(30);g.add(moon);
  }else if(id==='smoke'){
   // Kinsmoke: a night courtyard of charcoal walls with amber windows, low bands of green-lit kin-smoke drifting across
   // the floor and a cool moss-green sky; a few warm candle lamps along the wall. No gothic, no beige stone.
   sunDir=[-.3,.1,-1];skyMesh=sky(0x040b0a,0x0f2a22,0x2f7a52,sunDir);
   const floor=new THREE.Mesh(new THREE.PlaneGeometry(40,40),mat(0x16191a,'flagstone'));floor.rotation.x=-Math.PI/2;floor.position.y=-.02;floor.name='flagstone';g.add(floor);
   for(let i=0;i<7;i++){const w=8+((i*29)%5),h=7+((i*41)%7),x=-27+i*9,z=-22-((i*23)%8);
    const m=new THREE.MeshLambertMaterial({color:0x1d2326,map:windowsTex('#151a1d','#ffb25a',i+21)});m.map.repeat.set(w/6,h/6);m.map.wrapS=m.map.wrapT=THREE.RepeatWrapping;m.name='charcoal_wall';
    g.add(box(w,h,5,m,x,h/2-1,z,'charcoal_wall'));}
   const wall=mat(0x23292c,'charcoal_wall');g.add(box(16,1.1,.4,wall,0,.55,-8,'courtyard_wall'));
   const smokeTex=canvasTex(256,128,(c,w,h)=>{const gr=c.createRadialGradient(w/2,h/2,4,w/2,h/2,w/2);gr.addColorStop(0,'rgba(120,255,170,.55)');gr.addColorStop(.5,'rgba(40,140,90,.22)');gr.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=gr;c.fillRect(0,0,w,h);});
   for(let i=0;i<10;i++){const m=new THREE.MeshBasicMaterial({map:smokeTex,transparent:true,depthWrite:false,opacity:.55,blending:THREE.AdditiveBlending});m.name='kin_smoke';
    const s=new THREE.Mesh(new THREE.PlaneGeometry(9,2.4),m);s.position.set(-12+((i*37)%24),.5+((i*13)%10)/10,-3-((i*17)%14));s.name='kin_smoke';s.userData.role='kin_smoke';s.userData.drift=.15+((i*7)%5)/20;g.add(s);}
   for(const x of [-6,-2,2,6]){g.add(box(.12,.5,.12,mat(0x2a2a2e,'pole_metal'),x,1.35,-7.75,'lamp_post'));g.add(box(.22,.22,.22,new THREE.MeshBasicMaterial({color:0xffb25a}),x,1.7,-7.75,'lamp'));const l=new THREE.PointLight(0xffa24a,.9,8,2);l.position.set(x,1.9,-7.4);g.add(l);}
   const glow=new THREE.PointLight(0x3bdc7a,1.4,22,2);glow.position.set(0,2.5,-6);g.add(glow);
   g.add(new THREE.HemisphereLight(0x5aa884,0x0a1210,.5));const moon=new THREE.DirectionalLight(0x8affc0,.7);moon.position.set(...sunDir).multiplyScalar(30);g.add(moon);
  }else{
   // Street-runner alley: asphalt and kerbs, close brick and concrete walls with painted blocks, sodium lamps, a dumpster.
   sunDir=[0,.15,-1];skyMesh=sky(0x0b0618,0x2a1446,0x6a2a78,sunDir);
   const road=new THREE.Mesh(new THREE.PlaneGeometry(14,80),mat(0x1d1d22,'asphalt'));road.rotation.x=-Math.PI/2;road.position.set(0,-.02,-30);road.name='asphalt';g.add(road);
   const kerb=mat(0x4a4a52,'curb');g.add(box(2,.15,80,kerb,-6,.07,-30,'sidewalk'));g.add(box(2,.15,80,kerb,6,.07,-30,'sidewalk'));
   const paint=canvasTex(256,128,(c,w,h)=>{c.fillStyle='#2b2633';c.fillRect(0,0,w,h);const cols=['#7d4dff','#ff4fa3','#3fd0ff','#ffb25a'];for(let i=0;i<9;i++){c.fillStyle=cols[i%4];c.globalAlpha=.75;c.fillRect((i*53)%w,(i*37)%h,40+(i*13)%40,14+(i*7)%20);}c.globalAlpha=1;});
   paint.wrapS=paint.wrapT=THREE.RepeatWrapping;paint.repeat.set(4,1);
   for(const sx of [-1,1]){const m=new THREE.MeshLambertMaterial({color:0x8a7f8c,map:paint});m.name='brick';g.add(box(.6,10,70,m,sx*7.3,5,-32,'brick_alley'));}
   const pole=mat(0x2a2a30,'pole_metal');for(let i=0;i<4;i++){const z=-6-i*14,x=i%2?5.6:-5.6;g.add(box(.15,5,.15,pole,x,2.5,z,'pole_metal'));const bulb=box(.5,.18,.3,new THREE.MeshBasicMaterial({color:0xffb25a}),x*.92,4.9,z,'lamp');g.add(bulb);const l=new THREE.PointLight(0xffa24a,1.4,12,2);l.position.set(x*.9,4.6,z);g.add(l);}
   g.add(box(2.2,1.3,1.2,mat(0x2c4a3a,'dumpster'),-4.6,.65,-9,'dumpster'));
   g.add(new THREE.HemisphereLight(0x6a4aa8,0x120a18,.5));const m2=new THREE.DirectionalLight(0x9a7cff,.7);m2.position.set(...sunDir).multiplyScalar(30);g.add(m2);
  }
  skyMesh.name='sky';g.add(skyMesh);
  return {group:g,sky:skyMesh,id,converted:false,env:null};
 }
 const backdrops={};
 function useBackdrop(id){
  const p=preview;if(!p||p.backdrop===id)return;let b=backdrops[id];if(!b)b=backdrops[id]=buildBackdrop(id);
  for(const c of [...p.bgScene.children])p.bgScene.remove(c);p.bgScene.add(b.group);p.backdrop=id;
  if(p.paint&&!b.converted){const t=performance.now();p.paint.convertMaterials(b.group,o=>o.userData.role||o.name);b.env=p.paint.buildEnvironment([b.sky]);b.converted=true;b.prepMs=Math.round(performance.now()-t);}
 }

 // ---------- preview: one renderer, two passes (painted backdrop, then hero) ----------
 function startPreview(){
  if(!preview){
   const canvas=stageCanvas;
   const r=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'default'});
   // Pixel ratio 1: the painterly passes run at full canvas resolution, so this keeps their cost bounded on big screens.
   r.setPixelRatio(1);r.outputEncoding=THREE.sRGBEncoding;r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=1.02;r.setClearColor(0x06101a,1);
   const camera=new THREE.PerspectiveCamera(24,1,.1,600);
   const bgScene=new THREE.Scene(),scene=new THREE.Scene();
   let paint=null;try{if(window.AnimePaintLook)paint=AnimePaintLook.create(r,bgScene,camera,{kuwahara:2,ao:.7,ink:.6,halation:.3,vignette:.3});}catch(e){console.error('Hero select paint look',e);}
   // Hero lights: hero-coloured key from the front-left, a strong rim from behind, a dim cool fill.
   const hemi=new THREE.HemisphereLight(0x7a8ab8,0x0a0c14,.45);scene.add(hemi);
   const key=new THREE.DirectionalLight(0xffffff,1.25);key.position.set(-2.4,3,3.2);scene.add(key);
   const rim=new THREE.DirectionalLight(0xffffff,1.6);rim.position.set(2.2,2.6,-3.4);scene.add(rim);
   const rim2=new THREE.DirectionalLight(0xffffff,.8);rim2.position.set(-2.6,2,-3);scene.add(rim2);
   const fill=new THREE.DirectionalLight(0x6f86c8,.3);fill.position.set(3,1,2.5);scene.add(fill);
   // The hero's name, huge and outlined, behind the model.
   const nameCanvas=document.createElement('canvas');nameCanvas.width=2048;nameCanvas.height=420;const nameTex=new THREE.CanvasTexture(nameCanvas);nameTex.encoding=THREE.sRGBEncoding;
   const name=new THREE.Mesh(new THREE.PlaneGeometry(5.6,1.15),new THREE.MeshBasicMaterial({map:nameTex,transparent:true,depthWrite:false,toneMapped:false}));name.position.set(0,1.5,-2.4);name.renderOrder=-1;name.name='heroWord';scene.add(name);
   // Base: a slim turntable ring on the backdrop floor.
   const base=new THREE.Group();scene.add(base);
   const disc=new THREE.Mesh(new THREE.CylinderGeometry(1.06,1.14,.08,72),new THREE.MeshStandardMaterial({color:0x0b131b,metalness:.5,roughness:.45}));disc.position.y=-.04;base.add(disc);
   const flat=(a,b,color,opacity=1,ts=0,tl=Math.PI*2)=>{const m=new THREE.Mesh(new THREE.RingGeometry(a,b,96,1,ts,tl),new THREE.MeshBasicMaterial({color,transparent:opacity<1,opacity,side:THREE.DoubleSide,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.y=.003;return m;};
   const ringA=flat(1.065,1.1,0xffffff,.95),ringB=flat(.78,.795,0xffb25a,.85);base.add(ringA);base.add(ringB);
   for(let i=0;i<12;i++)base.add(flat(.9,.95,0x5fe3e8,.45,i*Math.PI/6,Math.PI/14));
   const scan=new THREE.Mesh(new THREE.RingGeometry(.5,.53,64),new THREE.MeshBasicMaterial({color:0x5fe3e8,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false}));scan.rotation.x=-Math.PI/2;scene.add(scan);
   const holder=new THREE.Group();scene.add(holder);const fx=new THREE.Group();scene.add(fx);
   preview={renderer:r,camera,bgScene,scene,paint,key,rim,rim2,hemi,name,nameCanvas,nameTex,base,ringA,holder,fx,scan,shown:null,target:rigId(),outT:0,inT:0,spin:0,hold:0,baseBoost:0,last:0,running:false,w:0,h:0,
    dolly:0,backdrop:null,keyColor:new THREE.Color(),rimColor:new THREE.Color()};
  }
  preview.target=rigId();useBackdrop(HEROES[st.focus].backdrop);setNameWord(HEROES[st.focus]);
  if(!preview.running){preview.running=true;preview.last=performance.now();raf(frame);}
 }
 function setNameWord(h){
  const p=preview;if(!p||p.word===h.id)return;p.word=h.id;const c=p.nameCanvas,g=c.getContext('2d');g.clearRect(0,0,c.width,c.height);
  g.font='400 360px Impact, Haettenschweiler, "Arial Narrow Bold", "Franklin Gothic Heavy", sans-serif';g.textAlign='center';g.textBaseline='middle';
  const word=h.name.toUpperCase();let size=360;while(g.measureText(word).width>c.width*.96&&size>120){size-=20;g.font=`400 ${size}px Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif`;}
  g.lineWidth=7;g.strokeStyle=h.theme.accent;g.globalAlpha=.55;g.strokeText(word,c.width/2,c.height/2+10);g.globalAlpha=.07;g.fillStyle=h.theme.accent;g.fillText(word,c.width/2,c.height/2+10);g.globalAlpha=1;
  p.nameTex.needsUpdate=true;
 }
 function transition(first=false){
  // Slash wipe (DOM) and a camera dolly-in (3D) on every hero change.
  const w=document.querySelector('#v02HeroSelect .hsWipe');if(w){w.classList.remove('go');void w.offsetWidth;w.classList.add('go');}st.wipes++;
  if(preview){preview.dolly=1;st.dollies++;useBackdrop(HEROES[st.focus].backdrop);}
  st.transitions.push({hero:HEROES[st.focus].id,at:Math.round(performance.now()),first});if(st.transitions.length>40)st.transitions.shift();
 }
 const BASE_DIST={v:0};
 function fit(){
  const c=preview.renderer.domElement,w=Math.max(1,c.clientWidth),h=Math.max(1,c.clientHeight);
  if(w!==preview.w||h!==preview.h){preview.w=w;preview.h=h;if(preview.paint)preview.paint.setSize(w,h);else preview.renderer.setSize(w,h,false);preview.camera.aspect=w/h;preview.camera.updateProjectionMatrix();}
  // A larger figure from a slightly low camera: 2.5 m of height in view, the floor near the bottom bar.
  const cam=preview.camera,half=THREE.MathUtils.degToRad(cam.fov/2);BASE_DIST.v=1.25/Math.tan(half);
  // A hero with a very wide silhouette (Kinsmoke's cape) is framed from further back, eased so a hero change never jumps.
  // The v3 cape's wings are much wider again: his page frames from further back when the game's Kinsmoke module says v3+.
  const hf=HEROES[st.focus],want=(hf.frameScaleWide&&(window.kinsmokeHero?.assets?.version||0)>=3?hf.frameScaleWide:hf.frameScale)||1;preview.frameWant=want;preview.frameScale=preview.frameScale==null?want:preview.frameScale+(want-preview.frameScale)*Math.min(1,(preview.fitDt||0)*6);
  const d=BASE_DIST.v*preview.frameScale*(1+.2*easeInOut(preview.dolly));cam.position.set(.35*preview.dolly,.62,d);cam.lookAt(0,.98,0);cam.updateProjectionMatrix();
 }
 const ease=t=>t<0?0:t>1?1:1-Math.pow(1-t,3);
 const easeInOut=t=>t<=0?0:t>=1?1:t*t*(3-2*t);
 const OUT=.22,SCAN=.6;
 function frame(now){
  if(!preview?.running)return;raf(frame);
  const dt=Math.min(.05,Math.max(0,(now-preview.last)/1000));const frameGap=now-preview.last;preview.last=now;const t0=performance.now();
  try{
   const hero=window.characterState?.().hero;if(hero!==st.activeSeen){st.activeSeen=hero;if(st.open)render();}
   const p=preview,h=HEROES[st.focus];
   p.dolly=Math.max(0,p.dolly-dt/.6);p.fitDt=dt;fit();
   // Hero-coloured lights ease toward the focused hero's palette.
   p.keyColor.setHex(h.theme.key);p.rimColor.setHex(h.theme.rim);const k=1-Math.exp(-6*dt);p.key.color.lerp(p.keyColor,k);p.rim.color.lerp(p.rimColor,k);p.rim2.color.lerp(p.rimColor,k);p.ringA.material.color.lerp(p.keyColor,k);
   if(p.shown!==p.target){
    const cur=p.shown&&rigs[p.shown];
    if(cur&&p.outT<OUT){p.outT+=dt;const kk=ease(p.outT/OUT);setSolid(cur,false);cur.wireMat.opacity=.6*(1-kk);cur.root.position.y=cur.baseY-.18*kk;}
    else{if(cur){p.holder.remove(cur.root);cur.root.position.y=cur.baseY;stopMove(cur);}p.shown=null;const next=rigs[p.target];
     if(next?.status==='ready'){p.holder.add(next.root);p.shown=p.target;p.outT=0;p.inT=0;p.spin=0;p.baseBoost=Math.PI/2;setSolid(next,false);next.wireMat.opacity=.6;next.action.reset().play();}}
   }else if(p.shown){
    const rig=rigs[p.shown];p.inT+=dt;const s=Math.min(1,p.inT/SCAN);
    if(p.inT<SCAN+.05){p.scan.material.opacity=.9*(1-s*.4);p.scan.position.y=s*rig.height;p.scan.scale.setScalar(1+.25*Math.sin(s*Math.PI));}else p.scan.material.opacity=0;
    if(s>.55&&!rig.solidOn)setSolid(rig,true);
    rig.wireMat.opacity=p.inT<SCAN?.6:Math.max(0,.6*(1-(p.inT-SCAN)/.5));setWire(rig,rig.wireMat.opacity>.01);
   }
   if(!p.shown)p.scan.material.opacity=0;
   const rig=p.shown&&rigs[p.shown];if(rig){if(rig.move)rig.move.lastDt=dt;rig.mixer.update(dt);tickMove(rig);rig.tick?.(dt);}
   tickShards(dt);
   if(rig&&!rig.move&&st.frames%6===0)placeCostumeArrows(rig);
   if(p.hold>0)p.hold-=dt;else if(!(rig&&rig.move))p.spin+=dt*.28;
   if(rig)rig.root.rotation.y=rig.yaw+(rig.move?rig.moveYaw:p.spin);
   const boost=p.baseBoost*Math.min(1,dt*4);p.baseBoost-=boost;p.base.rotation.y+=dt*.08+boost;
   const note=by('v02HeroStageNote'),want=rigs[p.target];note.textContent=want?.status==='error'?'Preview unavailable: '+want.error:want?.status!=='ready'?'Loading '+HEROES.find(x=>x.id===p.target.split('@')[0]).name+(p.target.includes('@')?' · '+costumeOf().label:'')+'…':'';
   // Pass 1: painted backdrop (or plain, without the paint module). Pass 2: hero, name and base on top, depth cleared.
   const r=p.renderer;
   if(p.paint)p.paint.render();else{r.setRenderTarget(null);r.render(p.bgScene,p.camera);}
   r.autoClear=false;r.clearDepth();r.render(p.scene,p.camera);r.autoClear=true;
   st.frames++;
   renderCartridge(dt);
  }catch(e){st.error=String(e?.stack||e);console.error(e);preview.running=false;}
  const ms=performance.now()-t0;st.lastFrameMs=+ms.toFixed(2);
  st.frameTimes.push(+ms.toFixed(2));if(st.frameTimes.length>600)st.frameTimes.shift();
  // Frame-to-frame interval (includes GPU back-pressure, unlike the CPU time above).
  if(frameGap>0&&frameGap<2000){st.gaps.push(+frameGap.toFixed(1));if(st.gaps.length>600)st.gaps.shift();}
  if(st.preload.started&&!st.preload.done&&frameGap>st.preload.maxFrameMs)st.preload.maxFrameMs=Math.round(frameGap);
 }
 // Costume arrows hug the hero's idle silhouette (projected), clamped clear of the side columns, at any window size.
 function placeCostumeArrows(rig){
  const bar=by('v02CostumeBar');if(!bar||bar.hidden||!rig.idleBox)return;const cam=preview.camera,c=stageCanvas.getBoundingClientRect(),v=new THREE.Vector3();let l=Infinity,r=-Infinity,t=Infinity,b=-Infinity;
  rig.root.updateMatrixWorld(true);for(const x of [rig.idleBox.min.x,rig.idleBox.max.x])for(const y of [rig.idleBox.min.y,rig.idleBox.max.y])for(const z of [rig.idleBox.min.z,rig.idleBox.max.z]){v.set(x,y,z).applyMatrix4(rig.root.matrixWorld).project(cam);const px=(v.x+1)/2*c.width,py=(1-v.y)/2*c.height;l=Math.min(l,px);r=Math.max(r,px);t=Math.min(t,py);b=Math.max(b,py);}
  const side=document.querySelector('#v02HeroSelect .hsSide')?.getBoundingClientRect(),left=document.querySelector('#v02HeroSelect .hsRoster')?.getBoundingClientRect();
  const W=44,gap=18,minX=(left?left.right:0)+8,maxX=(side?side.left:c.width)-W-8;
  const prev=by('v02CostumePrev'),next=by('v02CostumeNext'),mid=Math.round((t+b)/2);
  prev.style.left=Math.round(Math.max(minX,l-gap-W))+'px';next.style.left=Math.round(Math.min(maxX,r+gap))+'px';prev.style.top=next.style.top=mid+'px';
 }
 function setSolid(rig,on){rig.solidOn=on;for(const m of rig.solids)m.visible=on;setWire(rig,true);}
 function setWire(rig,on){for(const w of rig.wires)w.visible=on;}

 // ---------- moves: ability previews and the signature pose ----------
 let corePack=null,runnerPack=null;const slClips={};
 function coreEntries(){return corePack||(corePack=fetchBytes('assets/backspool/action-v2-core-native.json.gz').then(b=>JSON.parse(new TextDecoder().decode(fflate.gunzipSync(new Uint8Array(b))))));}
 function runnerClips(){return runnerPack||(runnerPack=fetchBytes('assets/loadout/runner/loadout_runner_clips.json.gz').then(b=>JSON.parse(new TextDecoder().decode(fflate.gunzipSync(new Uint8Array(b)))).clips));}
 async function baseClip(move){
  const [kind,name]=[move.slice(0,2),move.slice(3)];
  if(kind==='bs'){const e=(await coreEntries()).find(x=>x.name===name);if(!e)throw Error('Backspool clip missing: '+name);return cleanClip(THREE.AnimationClip.parse(e.clip),e.id,!!e.clip.userData?.pelvisTranslationApplied);}
  if(kind==='sl'){if(slClips[name])return slClips[name];const buf=EMBEDDED_FBX[ASSET_KEYS[name]];if(!buf)throw Error('Sightline clip not loaded: '+name);const a=new THREE.FBXLoader().parse(buf,'').animations?.[0];if(!a)throw Error('Sightline clip empty: '+name);return slClips[name]=cleanClip(a,name);}
  if(kind==='lo'){const e=(await runnerClips())[name];if(!e)throw Error('Runner clip missing: '+name);return THREE.AnimationClip.parse(e.clip);}
  throw Error('unknown move '+move);
 }
 async function clipFor(rig,move){
  rig.moveClips=rig.moveClips||{};if(rig.moveClips[move])return rig.moveClips[move];
  if(rig.kinsmokeIdle&&move==='lo:Idle_Wait_A')return rig.moveClips[move]=rig.kinsmokeIdle;   // v4: his own idle
  let clip=await baseClip(move);
  // A Backspool costume wears Backspool's clips retargeted onto it, the way the costume module builds its bank.
  if(rig.rest&&move.startsWith('bs:'))clip=MixamoRetarget.retargetClip(clip,rig.rest,rig.skin,{name:clip.name});
  // Kinsmoke wears Loadout's Runner clips retargeted onto him, as his game bank does.
  if(rig.loRest&&move.startsWith('lo:'))clip=(rig.retargetLike?window.kinsmokeHero.retargetLike:MixamoRetarget.retargetClip)(clip,rig.loRest,rig.skin,{name:'kinsmoke-'+clip.name,inPlace:true});
  return rig.moveClips[move]=clip;
 }
 async function playMove(move,{shards=false,source='hover',repeat=1}={}){
  const p=preview,rig=p?.shown&&rigs[p.shown];const rec={move,source,rig:p?.shown||null,at:Math.round(performance.now()),status:'pending',shards};st.moves.push(rec);if(st.moves.length>60)st.moves.shift();
  if(!rig){rec.status='no rig';return rec;}
  try{const clip=await clipFor(rig,move);if(p.shown!==rec.rig){rec.status='hero changed';return rec;}
   stopMove(rig,true);const a=rig.mixer.clipAction(clip);a.reset();if(repeat>1)a.setLoop(THREE.LoopRepeat,repeat);else a.setLoop(THREE.LoopOnce,1);a.clampWhenFinished=true;a.enabled=true;a.setEffectiveWeight(1);a.play();rig.action.crossFadeTo(a,.15,false);
   rig.move={action:a,clip,end:clip.duration*Math.max(1,repeat),rec,repeat};rig.moveYaw=-.35;rec.status='playing';rec.clip=clip.name;rec.seconds=+clip.duration.toFixed(2);
   if(shards)pulseShards(rig,rec);
  }catch(e){rec.status='error: '+(e?.message||e);console.warn('Hero select move',move,e);}
  return rec;
 }
 function tickMove(rig){const m=rig.move;if(!m)return;m.elapsed=(m.elapsed||0)+(m.lastDt||0);if((m.repeat>1?m.elapsed>=m.end-.16:m.action.time>=m.end-.16)||!m.action.isRunning()){stopMove(rig);}}
 function stopMove(rig,immediate=false){const m=rig.move;if(!m)return;rig.move=null;if(m.rec.status==='playing')m.rec.status='done';
  rig.action.reset().play();if(immediate){m.action.stop();rig.action.setEffectiveWeight(1);}else{m.action.crossFadeTo(rig.action,.2,false);}}
 function playAbility(i,source){const h=HEROES[st.focus],a=h.abilities[i];if(!a)return;playMove(a.move,{shards:!!a.shards,source,repeat:a.repeat||1});}
 // Afterstep glass shards: a SHORT pulse (about half a second) of small cyan/violet glass pieces bursting from his lower back.
 // No flames and no lasting trail: every shard is removed when the pulse ends.
 const shardGeo=new THREE.TetrahedronGeometry(.075);let shardActive=[];
 function pulseShards(rig,rec){
  const p=preview,hips=rig.skin.getObjectByName('mixamorigHips'),origin=new THREE.Vector3();if(hips)hips.getWorldPosition(origin);else origin.set(0,1,0);
  const grp=new THREE.Group();const mats=[new THREE.MeshBasicMaterial({color:0x5fe3e8,transparent:true,opacity:.95,depthWrite:false}),new THREE.MeshBasicMaterial({color:0x9a6bff,transparent:true,opacity:.9,depthWrite:false})];
  const parts=[];for(let i=0;i<26;i++){const m=new THREE.Mesh(shardGeo,mats[i%2]);m.position.copy(origin).add(new THREE.Vector3(0,.05,-.12));
   const dir=new THREE.Vector3((Math.random()-.5)*1.6,Math.random()*1.1-.2,-(.4+Math.random()*.9)).normalize();parts.push({m,v:dir.multiplyScalar(1.2+Math.random()*1.4),spin:new THREE.Vector3(Math.random()*9,Math.random()*9,Math.random()*9)});grp.add(m);}
  p.fx.add(grp);const pulse={grp,mats,parts,life:0,max:.5,rec};shardActive.push(pulse);st.shardPulses.push({move:rec.move,at:rec.at,count:parts.length,ended:false,lifeSeconds:pulse.max});
 }
 function tickShards(dt){
  for(const s of shardActive){s.life+=dt;const k=s.life/s.max;for(const q of s.parts){q.m.position.addScaledVector(q.v,dt);q.v.multiplyScalar(1-2.2*dt);q.m.rotation.x+=q.spin.x*dt;q.m.rotation.y+=q.spin.y*dt;q.m.scale.setScalar(Math.max(.05,1-k));}
   for(const m of s.mats)m.opacity=Math.max(0,1-k*k);}
  const done=shardActive.filter(s=>s.life>=s.max);
  for(const s of done){preview.fx.remove(s.grp);for(const m of s.mats)m.dispose();const rec=st.shardPulses.find(x=>x.at===s.rec.at&&!x.ended);if(rec){rec.ended=true;rec.endedAfter=+s.life.toFixed(2);}}
  shardActive=shardActive.filter(s=>s.life<s.max);
 }

 // ---------- Backspool's Threadrail cartridge display (as v2) ----------
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
   const bx=new THREE.Box3().setFromObject(model),center=bx.getCenter(new THREE.Vector3()),size=bx.getSize(new THREE.Vector3());
   for(const f of cart.fins){const d=f.node.userData.deployOffset;if(d)f.node.position.add(new THREE.Vector3().fromArray(d));}model.updateMatrixWorld(true);
   const opened=new THREE.Box3().setFromObject(model);for(const f of cart.fins)f.node.position.copy(f.position);model.updateMatrixWorld(true);
   model.position.sub(center);cart.fitRadius=Math.max(opened.max.distanceTo(center),opened.min.distanceTo(center))*1.04;cart.deployedSize=opened.getSize(new THREE.Vector3()).toArray().map(v=>+v.toFixed(4));
   const spin=new THREE.Group();spin.add(model);const tilt=new THREE.Group();tilt.add(spin);tilt.rotation.x=.62;
   const scene=new THREE.Scene();scene.add(tilt);
   scene.add(new THREE.HemisphereLight(0xe0faff,0x607481,1));const key=new THREE.DirectionalLight(0xffe2c0,1.1);key.position.set(.4,.8,.6);scene.add(key);
   const rim=new THREE.DirectionalLight(0x69b7ff,.8);rim.position.set(-.6,.3,-.7);scene.add(rim);const fill=new THREE.DirectionalLight(0xd9e7f2,.65);fill.position.set(-.5,.4,.8);scene.add(fill);
   const cam=new THREE.PerspectiveCamera(30,1,.005,5);cam.position.set(0,.03,cart.fitRadius/Math.tan(THREE.MathUtils.degToRad(15)));cam.lookAt(0,0,0);
   Object.assign(cart,{status:'ready',root:model,spin,scene,camera:cam,triangles:Math.round(cart.triangles),bounds:size.toArray().map(v=>+v.toFixed(4))});
  }catch(e){cart.status='error';cart.error=String(e.message||e);}},undefined,e=>{cart.status='error';cart.error=String(e?.message||e);console.error('Hero select cartridge',e);});
 }
 function cartridgeRect(){
  const fig=by('v02HeroCartridge');if(!fig||fig.hidden||!stageCanvas.isConnected)return null;const v=fig.querySelector('.hsCartView').getBoundingClientRect(),c=stageCanvas.getBoundingClientRect();
  if(v.width<8||v.height<8)return null;return{x:v.left-c.left,y:v.top-c.top,w:v.width,h:v.height,page:{left:v.left,right:v.right,top:v.top,bottom:v.bottom}};
 }
 function renderCartridge(dt){
  const r=preview.renderer;if(cart.status!=='ready'||HEROES[st.focus].id!=='backspool'||st.tab==='controls')return;const rect=cartridgeRect();if(!rect)return;
  cart.clock+=dt;const phase=cart.clock%6,target=phase>1.2&&phase<4.2?1:0;cart.deploy+=(target-cart.deploy)*(1-Math.exp(-7*dt));
  cart.spin.rotation.y+=dt*.55;
  for(const f of cart.fins){f.node.position.copy(f.position);const d=f.node.userData.deployOffset;if(d)f.node.position.add(new THREE.Vector3().fromArray(d).multiplyScalar(cart.deploy));}
  for(const j of cart.jaws)j.node.quaternion.copy(j.rotation).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),-.9*cart.deploy));
  for(const o of cart.details)o.visible=cart.deploy>.02;
  if(cart.spool){cart.spool.rotation.y=cart.clock*(cart.deploy>.5?5:1);cart.spool.material.emissiveIntensity=.3+.7*cart.deploy;}
  cart.camera.aspect=rect.w/rect.h;{const half=THREE.MathUtils.degToRad(15),d=.84*cart.fitRadius/Math.sin(half)/Math.min(1,cart.camera.aspect);cart.camera.position.set(0,d*.12,d);cart.camera.lookAt(0,0,0);}cart.camera.updateProjectionMatrix();
  const H=preview.h,x=rect.x,y=H-rect.y-rect.h;
  r.setScissorTest(true);r.setViewport(x,y,rect.w,rect.h);r.setScissor(x,y,rect.w,rect.h);r.setClearColor(0x06101a,.55);r.clear(true,true,false);
  r.autoClear=false;r.render(cart.scene,cart.camera);r.autoClear=true;cart.lastTriangles=r.info.render.triangles;
  r.setScissorTest(false);r.setViewport(0,0,preview.w,preview.h);r.setClearColor(0x06101a,1);cart.frames++;
 }
 function freeCartridge(){
  if(cart.status!=='ready'||!preview)return;const seen=new Set();
  cart.root.traverse(o=>{if(!o.isMesh)return;if(!seen.has(o.geometry)){seen.add(o.geometry);o.geometry.dispose();}for(const m of [].concat(o.material)){if(seen.has(m))continue;seen.add(m);for(const k of ['map','normalMap','roughnessMap','metalnessMap','emissiveMap','aoMap'])if(m[k]&&!seen.has(m[k])){seen.add(m[k]);m[k].dispose();}m.dispose();}});
  cart.frees++;
 }
 function cartridgeState(){
  const rect=cartridgeRect();let projected=null;
  if(rect&&cart.status==='ready'){cart.root.updateMatrixWorld(true);const bx=new THREE.Box3().setFromObject(cart.root),v=new THREE.Vector3();let l=Infinity,rr=-Infinity,t=Infinity,b=-Infinity;
   for(const x of [bx.min.x,bx.max.x])for(const y of [bx.min.y,bx.max.y])for(const z of [bx.min.z,bx.max.z]){v.set(x,y,z).project(cart.camera);const px=rect.page.left+(v.x+1)/2*rect.w,py=rect.page.top+(1-v.y)/2*rect.h;l=Math.min(l,px);rr=Math.max(rr,px);t=Math.min(t,py);b=Math.max(b,py);}
   projected={left:+l.toFixed(1),right:+rr.toFixed(1),top:+t.toFixed(1),bottom:+b.toFixed(1)};}
  const fig=by('v02HeroCartridge'),fr=fig&&!fig.hidden?fig.getBoundingClientRect():null;
  return{status:cart.status,error:cart.error,url:CART_URL,triangles:cart.triangles,bounds:cart.bounds||null,deployedSize:cart.deployedSize||null,frames:cart.frames,lastPassTriangles:cart.lastTriangles,deploy:+cart.deploy.toFixed(3),gpuFrees:cart.frees,
   visible:!!fr,figure:fr?{left:fr.left,right:fr.right,top:fr.top,bottom:fr.bottom}:null,view:rect?.page||null,projected,gpu:preview?{geometries:preview.renderer.info.memory.geometries,textures:preview.renderer.info.memory.textures}:null};
 }

 // ---------- preview rigs (as v2, plus the costume rest skin kept for retargeting move previews) ----------
 function ramp(){if(window.__v02HeroRamp)return window.__v02HeroRamp;const t=new THREE.DataTexture(new Uint8Array([70,70,70,255,150,150,150,255,232,232,232,255]),3,1,THREE.RGBAFormat);t.magFilter=t.minFilter=THREE.NearestFilter;t.needsUpdate=true;return window.__v02HeroRamp=t;}
 function toon(root){
  const cache=new Map();
  root.traverse(o=>{if(!o.isMesh||o.userData.toonOutline)return;const conv=old=>{
   if(!old||old.roughnessMap||!(old.isMeshStandardMaterial||old.isMeshPhongMaterial))return old;if(cache.has(old))return cache.get(old);
   const m=new THREE.MeshToonMaterial({color:old.color.clone(),map:old.map,normalMap:old.normalMap,normalScale:old.normalScale?.clone(),bumpMap:old.bumpMap,bumpScale:old.bumpScale,emissive:old.emissive.clone(),emissiveMap:old.emissiveMap,emissiveIntensity:old.emissiveIntensity,gradientMap:ramp(),side:THREE.FrontSide,transparent:old.transparent,opacity:old.opacity,alphaTest:old.alphaTest,vertexColors:old.vertexColors,skinning:!!o.isSkinnedMesh});
   m.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <output_fragment>',`float edge=pow(1.0-clamp(dot(normal,normalize(vViewPosition)),0.0,1.0),3.0);
 float luminance=dot(outgoingLight,vec3(.2126,.7152,.0722));
 outgoingLight*=mix(vec3(.62,.72,1.0),vec3(1.0),smoothstep(.04,.24,luminance));
 outgoingLight+=vec3(.10,.22,.24)*edge*.32;
 #include <output_fragment>`);};
   cache.set(old,m);return m;};o.material=Array.isArray(o.material)?o.material.map(conv):conv(o.material);});
 }
 function normalise(root){root.updateMatrixWorld(true);let bx=new THREE.Box3().setFromObject(root);const size=bx.getSize(new THREE.Vector3());root.scale.setScalar(1.82/Math.max(size.y,.001));root.updateMatrixWorld(true);bx.setFromObject(root);const c=bx.getCenter(new THREE.Vector3());root.position.set(-c.x,-bx.min.y,-c.z);root.updateMatrixWorld(true);}
 function skinnedBox(root){const bx=new THREE.Box3(),v=new THREE.Vector3();root.traverse(m=>{if(!m.isSkinnedMesh||m.userData.toonOutline)return;const n=m.geometry.attributes.position.count,step=Math.max(1,Math.floor(n/4000));for(let i=0;i<n;i+=step)bx.expandByPoint(m.boneTransform(i,v).applyMatrix4(m.matrixWorld));});return bx.isEmpty()?new THREE.Box3().setFromObject(root):bx;}
 let idlePromise=null;
 function backspoolIdle(){return idlePromise||(idlePromise=coreEntries().then(list=>{const entry=list.find(e=>e.name==='Breathing Idle without skin');if(!entry)throw Error('Backspool idle clip missing');
  return cleanClip(THREE.AnimationClip.parse(entry.clip),entry.id,!!entry.clip.userData?.pelvisTranslationApplied);}));}
 function facing(skin){skin.updateMatrixWorld(true);const l=skin.getObjectByName('mixamorigLeftArm').getWorldPosition(new THREE.Vector3()),r=skin.getObjectByName('mixamorigRightArm').getWorldPosition(new THREE.Vector3());const f=l.sub(r).cross(new THREE.Vector3(0,1,0));return Math.atan2(f.x,f.z);}
 async function fetchBytes(url){const r=await fetch(url);if(!r.ok)throw Error(url+' '+r.status);return r.arrayBuffer();}
 async function source(id){
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
   const cid=id.slice(10),url=COSTUME_URLS[cid];if(!url)throw Error('No preview model for costume '+cid);
   const [fbx,rest,clip]=await Promise.all([fetchBytes(url),fetchBytes('assets/backspool/backspool.fbx'),backspoolIdle()]);
   const skin=new THREE.FBXLoader().parse(fbx,url.slice(0,url.lastIndexOf('/')+1)),restSkin=new THREE.FBXLoader().parse(rest,'assets/backspool/');
   for(const n of ['Hips','Head','LeftArm','RightArm'])if(!skin.getObjectByName('mixamorig'+n))throw Error('Costume rig lacks mixamorig'+n);
   normalise(skin);normalise(restSkin);const delta=facing(restSkin)-facing(skin);skin.rotation.y=delta;skin.updateMatrixWorld(true);restSkin.updateMatrixWorld(true);
   const out=MixamoRetarget.retargetClip(clip,restSkin,skin,{name:clip.name});
   // The rest skin stays (in bind pose, never rendered) so ability previews can be retargeted onto the costume later.
   return{skin,clip:out,normalised:true,rest:restSkin};
  }
  if(id==='loadout'){
   const [fbx,clips,roles]=await Promise.all([fetchBytes('assets/loadout/loadout_caped.fbx'),runnerClips(),fetch('assets/loadout/runner/loadout_runner_roles.json').then(r=>r.json())]);
   const name=roles.flow?.idle||'Idle_Wait_A',entry=clips?.[name];if(!entry)throw Error('Loadout idle clip missing: '+name);
   const skin=new THREE.FBXLoader().parse(fbx,'assets/loadout/');
   return{skin,clip:THREE.AnimationClip.parse(entry.clip)};
  }
  if(id.startsWith('kinsmoke@')){
   // v5: a Kinsmoke costume without a cape (the user's Tripo Mixamo export, A-pose bind): his idle, and Loadout's rest for
   // the Runner clips, both retargeted with kinsmokeHero.retargetLike (limbs posed like the source rest first).
   const C=window.kinsmokeHero?.costumes?.[id.slice(9)];if(!C?.model)throw Error('No preview model for Kinsmoke costume '+id.slice(9));
   const [fbx,lo,bsBuf,breath]=await Promise.all([fetchBytes(C.model),fetchBytes('assets/loadout/loadout_caped.fbx'),fetchBytes('assets/backspool/backspool.fbx'),fetchBytes('assets/characters/kinsmoke/kinsmoke_idle_breathing.json.gz').then(b=>JSON.parse(new TextDecoder().decode(fflate.gunzipSync(new Uint8Array(b)))))]);
   const skin=new THREE.FBXLoader().parse(fbx,C.dir),loRest=new THREE.FBXLoader().parse(lo,'assets/loadout/'),bsRest=new THREE.FBXLoader().parse(bsBuf,'assets/backspool/');
   for(const n of ['Hips','Head','LeftArm','RightArm'])if(!skin.getObjectByName('mixamorig'+n))throw Error('Kinsmoke costume rig lacks mixamorig'+n);
   normalise(skin);normalise(loRest);normalise(bsRest);skin.rotation.y=facing(loRest)-facing(skin);skin.updateMatrixWorld(true);loRest.updateMatrixWorld(true);
   {const hp=skin.getObjectByName('mixamorigHips').getWorldPosition(new THREE.Vector3());skin.position.x-=hp.x;skin.position.z-=hp.z;skin.updateMatrixWorld(true);}
   bsRest.rotation.y=facing(skin)-facing(bsRest);bsRest.updateMatrixWorld(true);
   const out=(window.kinsmokeHero?.openShoulders||((c)=>c))(kinsmokeSpreadArms(window.kinsmokeHero.retargetLike(THREE.AnimationClip.parse(breath.clip),bsRest,skin,{name:'kinsmoke_idle',inPlace:true}),skin,9),skin);
   bsRest.traverse(x=>{if(x.isMesh){x.geometry.dispose();for(const m of [].concat(x.material))m.dispose();}});
   return{skin,clip:out,normalised:true,loRest,kinsmokeIdle:out,retargetLike:true};
  }
  if(id==='kinsmoke'){
   // The model and cape rig the game's Kinsmoke module uses (v2 cape from the KINSMOKE_CAPE_V2 build on), else v1.
   const KA=window.kinsmokeHero?.assets||{model:'assets/characters/kinsmoke/kinsmoke_caped.fbx',rig:'assets/characters/kinsmoke/kinsmoke_cape_rig.json'};
   // His converted, caped model; Loadout's caped rest skin is the retarget source for the Runner clips he plays.
   const [fbx,lo,clips,roles,rigJson]=await Promise.all([fetchBytes(KA.model),fetchBytes('assets/loadout/loadout_caped.fbx'),runnerClips(),fetch('assets/loadout/runner/loadout_runner_roles.json').then(r=>r.json()),fetch(KA.rig).then(r=>r.json())]);
   const name=roles.flow?.idle||'Idle_Wait_A',entry=clips?.[name];if(!entry)throw Error('Runner idle clip missing: '+name);
   const skin=new THREE.FBXLoader().parse(fbx,'assets/characters/kinsmoke/'),loRest=new THREE.FBXLoader().parse(lo,'assets/loadout/');
   for(const n of ['Hips','Head','LeftArm','RightArm'])if(!skin.getObjectByName('mixamorig'+n))throw Error('Kinsmoke rig lacks mixamorig'+n);
   normalise(skin);normalise(loRest);skin.rotation.y=facing(loRest)-facing(skin);skin.updateMatrixWorld(true);loRest.updateMatrixWorld(true);
   // v2 cape: centre him (and so the turntable and the staff's orbit) on his hips, not on a bounding box the cape pulls back.
   if(KA.version>=2){const hp=skin.getObjectByName('mixamorigHips').getWorldPosition(new THREE.Vector3());skin.position.x-=hp.x;skin.position.z-=hp.z;skin.updateMatrixWorld(true);}
   const [bsBuf,breath]=await Promise.all([fetchBytes('assets/backspool/backspool.fbx'),fetchBytes('assets/characters/kinsmoke/kinsmoke_idle_breathing.json.gz').then(b=>JSON.parse(new TextDecoder().decode(fflate.gunzipSync(new Uint8Array(b)))))]);
   const bsRest=new THREE.FBXLoader().parse(bsBuf,'assets/backspool/');normalise(bsRest);bsRest.rotation.y=facing(skin)-facing(bsRest);bsRest.updateMatrixWorld(true);
   const out=(window.kinsmokeHero?.openShoulders||((c)=>c))(kinsmokeSpreadArms(MixamoRetarget.retargetClip(THREE.AnimationClip.parse(breath.clip),bsRest,skin,{name:'kinsmoke_idle',inPlace:true}),skin,9),skin);
   bsRest.traverse(x=>{if(x.isMesh){x.geometry.dispose();for(const m of [].concat(x.material))m.dispose();}});
   return{skin,clip:out,normalised:true,loRest,capeRig:rigJson,kinsmokeIdle:out};
  }
  throw Error('unknown hero '+id);
 }
 // As game_v02_kinsmoke_hero_v11.js: spread both upper arms outward by deg about his forward axis, in every key.
 function kinsmokeSpreadArms(clip,skin,deg){
  skin.updateMatrixWorld(true);const l=skin.getObjectByName('mixamorigLeftArm').getWorldPosition(new THREE.Vector3()),r=skin.getObjectByName('mixamorigRightArm').getWorldPosition(new THREE.Vector3());const f=l.sub(r).cross(new THREE.Vector3(0,1,0)).setY(0).normalize();
  for(const [side,sign] of [['Left',1],['Right',-1]]){
   const tr=clip.tracks.find(t=>t.name==='mixamorig'+side+'Arm.quaternion'),par=skin.getObjectByName('mixamorig'+side+'Shoulder');if(!tr||!par)continue;
   const axis=f.clone().applyQuaternion(par.getWorldQuaternion(new THREE.Quaternion()).invert()).normalize(),rq=new THREE.Quaternion().setFromAxisAngle(axis,sign*deg*Math.PI/180),q=new THREE.Quaternion();
   for(let i=0;i<tr.values.length;i+=4){q.fromArray(tr.values,i);rq.clone().multiply(q).toArray(tr.values,i);}
  }
  return clip;
 }
 const YAW={sightline:0,backspool:0,loadout:0,kinsmoke:0,'backspool@halfmask':0};
 let loadChain=Promise.resolve();
 function ensureRig(id){
  if(rigs[id])return;rigs[id]={status:'loading',error:null};
  loadChain=loadChain.then(async()=>{const t0=performance.now();try{
   const {skin,clip,normalised,rest,loRest,capeRig,kinsmokeIdle,retargetLike}=await source(id);if(!normalised)normalise(skin);
   let tris=0,bones=0;const solids=[];skin.traverse(o=>{if(o.isBone)bones++;if(o.isMesh){o.frustumCulled=false;tris+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3;}});
   toon(skin);if(typeof outlineCharacter==='function'){outlineCharacter(skin);skin.updateMatrixWorld(true);const ws=new THREE.Vector3();skin.traverse(o=>{if(o.userData.toonOutline){(o.parent||o).getWorldScale(ws);o.material.uniforms.width.value=.006/Math.max(1e-6,ws.x);}});}
   skin.traverse(o=>{if(o.isMesh)solids.push(o);});
   const wireMat=new THREE.MeshBasicMaterial({color:0x5fe3e8,wireframe:true,transparent:true,opacity:.6,depthWrite:false,skinning:true});
   const wires=[];
   for(const m of solids){if(!m.isSkinnedMesh||m.userData.toonOutline)continue;const w=new THREE.SkinnedMesh(m.geometry,wireMat);w.skeleton=m.skeleton;w.bindMatrix.copy(m.bindMatrix);w.bindMatrixInverse.copy(m.bindMatrixInverse);w.position.copy(m.position);w.quaternion.copy(m.quaternion);w.scale.copy(m.scale);w.frustumCulled=false;w.renderOrder=2;m.parent.add(w);wires.push(w);}
   const wrap=new THREE.Group();wrap.add(skin);
   const mixer=new THREE.AnimationMixer(skin),action=mixer.clipAction(clip);action.play();
   mixer.update(0);wrap.updateMatrixWorld(true);const bx=skinnedBox(skin);wrap.position.y=-bx.min.y;
   // Idle footprint for UI placement: a square around the vertical axis (the hero turns), in the wrap's local frame.
   const half=Math.max(Math.abs(bx.min.x),Math.abs(bx.max.x),Math.abs(bx.min.z),Math.abs(bx.max.z));const idleBox=new THREE.Box3(new THREE.Vector3(-half,bx.min.y-wrap.position.y+wrap.position.y,-half),new THREE.Vector3(half,bx.max.y,half));
   const extra=id==='kinsmoke'?await kinsmokeExtras(wrap,skin,capeRig):{};
   rigs[id]={...extra,status:'ready',idleBox,baseY:wrap.position.y,root:wrap,skin,rest:rest||null,loRest:loRest||null,kinsmokeIdle:kinsmokeIdle||null,retargetLike:!!retargetLike,mixer,action,clip:clip.name,clipSeconds:+clip.duration.toFixed(2),solids,wireMat,wires,solidOn:false,yaw:YAW[id]||0,height:Math.max(1.6,bx.max.y-bx.min.y),triangles:Math.round(tris),bones,loadMs:Math.round(performance.now()-t0),move:null,moveYaw:0};
  }catch(e){rigs[id]={status:'error',error:String(e.message||e)};console.error('Hero select preview',id,e);}});
 }

 // ---------- Kinsmoke's page: cape cloth on the preview, and WITNESSPILLAR floating and slowly orbiting him ----------
 // The staff is a separate model (scripts/characters/kinsmoke/blender_build_kinsmoke_cape.py exports it at 0.95 x his
 // height). It never touches his hands here: it floats beside him, bobs, and circles him once every ORBIT_S seconds. It
 // is parented to his turntable so it leaves with him; only his page has it.
 const KS={ORBIT_S:16,RADIUS:.92,LIFT:.16,BOB:.06,TILT:.12};let staffPromise=null;
 function kinsmokeStaff(){return staffPromise||(staffPromise=fetchBytes('assets/characters/kinsmoke/kinsmoke_witnesspillar.fbx').then(b=>{
  const o=new THREE.FBXLoader().parse(b,'assets/characters/kinsmoke/');o.updateMatrixWorld(true);const bx=new THREE.Box3().setFromObject(o),size=bx.getSize(new THREE.Vector3());
  const k=1.82*.95/Math.max(1e-6,size.y);o.scale.multiplyScalar(k);o.updateMatrixWorld(true);bx.setFromObject(o);const c=bx.getCenter(new THREE.Vector3());o.position.sub(new THREE.Vector3(c.x,bx.min.y,c.z));
  o.traverse(m=>{if(m.isMesh){m.frustumCulled=false;for(const mm of [].concat(m.material))if(mm&&mm.emissive){mm.emissive.setHex(0x0b3a20);mm.emissiveIntensity=.6;}}});
  return o;}));}
 async function kinsmokeExtras(wrap,skin,capeRig){
  const out={};let staff=null;
  try{const model=await kinsmokeStaff();staff=new THREE.Group();staff.name='WitnesspillarOrbit';const tilt=new THREE.Group();tilt.add(model);staff.add(tilt);
   const glow=new THREE.PointLight(0x3bdc7a,1.1,3.2,2);glow.position.set(0,1.1,0);staff.add(glow);wrap.add(staff);out.staff=staff;out.staffTilt=tilt;}
  catch(e){out.staffError=String(e.message||e);console.error('Kinsmoke staff',e);}
  let cloth=null;try{if(window.KinsmokeCapeCloth&&capeRig)cloth=KinsmokeCapeCloth.create(skin,capeRig,{height:1.82});}catch(e){out.clothError=String(e.message||e);console.error('Kinsmoke preview cloth',e);}
  out.cloth=cloth;let t=0,angle=Math.PI*.35;const fwd=new THREE.Vector3(),q=new THREE.Quaternion();
  out.tick=dt=>{
   t+=dt;angle+=dt*Math.PI*2/KS.ORBIT_S;
   if(staff){staff.visible=!!rigs.kinsmoke?.solidOn;staff.position.set(Math.sin(angle)*KS.RADIUS,KS.LIFT+Math.sin(t*1.3)*KS.BOB,Math.cos(angle)*KS.RADIUS);
    out.staffTilt.rotation.set(Math.sin(t*.9)*KS.TILT*.5,t*.35,Math.cos(t*.7)*KS.TILT);}
   if(cloth){const rig=rigs.kinsmoke,running=!!rig?.move&&/Dash|Run/i.test(rig.move.clip?.name||'');
    // The preview runs in place, so the air he would run through is given as a headwind along his facing.
    skin.getWorldQuaternion(q);fwd.set(0,0,1).applyQuaternion(q);fwd.y=0;if(fwd.lengthSq())fwd.normalize();
    cloth.options.wind.copy(fwd).multiplyScalar(running?-14:0);cloth.update(dt,{speed:running?8.2:0});}
  };
  return out;
 }
 function kinsmokeState(){const r=rigs.kinsmoke;if(!r||r.status!=='ready')return r?{status:r.status,error:r.error}:null;const w=new THREE.Vector3(),c=new THREE.Vector3();
  let staff=null;if(r.staff){r.root.updateMatrixWorld(true);r.staff.getWorldPosition(w);r.skin.getObjectByName('mixamorigHips').getWorldPosition(c);staff={visible:r.staff.visible&&r.root.parent!=null,world:w.toArray().map(v=>+v.toFixed(3)),
   radiusFromHips:+Math.hypot(w.x-c.x,w.z-c.z).toFixed(3),angleDeg:+(Math.atan2(w.x-c.x,w.z-c.z)*180/Math.PI).toFixed(1),inHand:false};}
  return{status:'ready',shown:preview?.shown==='kinsmoke',staff,staffError:r.staffError||null,cloth:r.cloth?.state?.()||null,clothError:r.clothError||null};}

 // ---------- bootstrap ----------
 function bootstrap(){
  if(st.ready)return;
  const views=window.verticalViews;
  if(!views||!window.verticalHUDState?.().ready||typeof characterSwitcher==='undefined'||!by('start')){setTimeout(bootstrap,250);return;}
  build();entryPoints();
  origActive=views.active.bind(views);origPoll=views.poll.bind(views);
  views.active=()=>st.open||origActive();
  views.poll=gp=>st.open?pollOpen(gp):origActive()?origPoll(gp):pollClosed(gp);
  // The Threadrail key handler listens on window before this module and consumes its keys (E Drive, Q heavy, C evade, R
  // rail...) even while paused. While this screen is open those keys belong to it, so the handler is gated the same way.
  const tg=window.threadrailGame;if(tg&&typeof tg.handleKey==='function'&&!tg.__heroSelectGate){const orig=tg.handleKey.bind(tg);tg.handleKey=(e,up)=>st.open?false:orig(e,up);tg.__heroSelectGate=true;}
  window.addEventListener('keydown',onKey,true);window.addEventListener('keyup',onKey,true);
  setInterval(()=>{entryPoints();if(st.open){const active=window.characterState?.().hero;for(const c of document.querySelectorAll('.hsCard'))c.classList.toggle('isActive',c.dataset.hero===active);}},500);
  st.ready=true;
 }
 setTimeout(bootstrap,250);
 // Screen-space framing of the shown hero, for tests: the animated skin's box and the base's rim, in page pixels.
 function framing(){
  if(!st.open||!preview?.shown)return null;const rig=rigs[preview.shown];if(rig?.status!=='ready')return null;
  rig.root.updateMatrixWorld(true);const bx=skinnedBox(rig.skin),c=stageCanvas.getBoundingClientRect(),cam=preview.camera,v=new THREE.Vector3();
  const rect=pts=>{let l=Infinity,r=-Infinity,t=Infinity,b=-Infinity;for(const q of pts){v.copy(q).project(cam);const x=c.left+(v.x+1)/2*c.width,y=c.top+(1-v.y)/2*c.height;l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}return{left:+l.toFixed(1),right:+r.toFixed(1),top:+t.toFixed(1),bottom:+b.toFixed(1)};};
  const corners=[];for(const x of [bx.min.x,bx.max.x])for(const y of [bx.min.y,bx.max.y])for(const z of [bx.min.z,bx.max.z])corners.push(new THREE.Vector3(x,y,z));
  const rim=[];for(let i=0;i<32;i++){const a=i/32*Math.PI*2;rim.push(new THREE.Vector3(Math.cos(a)*1.14,-.1,Math.sin(a)*1.14),new THREE.Vector3(Math.cos(a)*1.1,0,Math.sin(a)*1.1));}
  const word=[];for(const x of [-2.8,2.8])for(const y of [-.575,.575])word.push(new THREE.Vector3(x,y,0).applyMatrix4(preview.name.matrixWorld));
  return{hero:preview.shown,settled:preview.inT>SCAN+.6&&!rig.move&&preview.dolly<=0&&Math.abs((preview.frameScale??1)-(preview.frameWant??1))<.01,worldMinY:+bx.min.y.toFixed(3),worldMaxY:+bx.max.y.toFixed(3),heightFraction:+((bx.max.y-bx.min.y)/2.5).toFixed(2),model:rect(corners),base:rect(rim),word:rect(word),canvas:{left:c.left,right:c.right,top:c.top,bottom:c.bottom}};
 }
 function pct(a,q){if(!a.length)return 0;const s=[...a].sort((x,y)=>x-y);return s[Math.min(s.length-1,Math.floor(q*s.length))];}
 function lookState(){
  const p=preview;if(!p)return null;const hex=c=>'#'+c.getHexString();
  return{paint:!!p.paint,backdrop:p.backdrop,backdrops:Object.fromEntries(Object.entries(backdrops).map(([k,b])=>[k,{converted:b.converted,prepMs:b.prepMs||0,meshes:(()=>{let n=0;b.group.traverse(o=>{if(o.isMesh)n++;});return n;})()}])),
   key:hex(p.key.color),rim:hex(p.rim.color),word:p.word,wordBehind:p.name.position.z<-1&&p.name.renderOrder<0,dolly:+p.dolly.toFixed(2),camera:p.camera.position.toArray().map(v=>+v.toFixed(2)),
   frameMs:{p50:pct(st.frameTimes,.5),p95:pct(st.frameTimes,.95),max:Math.max(0,...st.frameTimes),samples:st.frameTimes.length},intervalMs:{p50:pct(st.gaps,.5),p95:pct(st.gaps,.95),max:Math.max(0,...st.gaps),samples:st.gaps.length},pixelRatio:p.renderer.getPixelRatio()};
 }

 window.v02HeroSelect={open,close,confirm:()=>confirm('api'),framing,cartridge:()=>cartridgeState(),look:lookState,playAbility:i=>playAbility(i,'api'),
  resetFrameTimes:()=>{st.frameTimes.length=0;st.gaps.length=0;},
  state:()=>({version:'v3',ready:st.ready,open:st.open,focus:HEROES[st.focus].id,tab:st.tab,ability:st.ability,switching:st.switching,status:st.status,opened:st.opened,closes:st.closes,confirms:st.confirms.slice(),frames:st.frames,lastFrameMs:st.lastFrameMs,error:st.error,source:st.source,
   shown:preview?.shown||null,moves:st.moves.slice(-12),shardPulses:st.shardPulses.slice(-6),shardsLive:shardActive.length,wipes:st.wipes,dollies:st.dollies,transitions:st.transitions.slice(-6),
   preload:JSON.parse(JSON.stringify(st.preload)),
   rigs:Object.fromEntries(Object.entries(rigs).map(([k,v])=>[k,{status:v.status,error:v.error,clip:v.clip,clipSeconds:v.clipSeconds,triangles:v.triangles,bones:v.bones,loadMs:v.loadMs}])),
   kinsmoke:kinsmokeState(),
   heroes:HEROES.map(h=>h.id),scope:'Paused presentation only. Confirm calls backspoolCostume.set / characterSwitcher.change and startGame; preview rigs and backdrops live in their own renderer.'})};
})();
