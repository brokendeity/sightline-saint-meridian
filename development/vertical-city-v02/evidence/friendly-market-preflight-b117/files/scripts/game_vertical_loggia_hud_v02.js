/* V02 presentation adapter. Native owners retain all buttons, resource values,
 * input handlers and pause/start transitions. No simulation state is authored here. */
(()=>{
 'use strict';
 const by=id=>document.getElementById(id),node=(tag,id,html='')=>{const e=document.createElement(tag);if(id)e.id=id;e.innerHTML=html;return e;};
 const css=node('link');css.rel='stylesheet';css.href='scripts/game_vertical_hud_v02.css';document.head.append(css);
 let ready=false,lastActive=null,tab='overview',returnFocus=null;
 const tabs=new Map(),moved=[];
 const move=(id,host)=>{const e=by(id);if(e&&host&&e.parentNode!==host){host.append(e);moved.push(id);}return e;};
 function selectTab(id){tab=id;for(const[k,v]of tabs){v.panel.hidden=k!==id;v.button.setAttribute('aria-selected',String(k===id));v.button.tabIndex=k===id?0:-1;}}
 function openTools(id='overview'){returnFocus=document.activeElement;if(gameActive)pauseGame();selectTab(id);by('v02Tabs').querySelector('[aria-selected="true"]').focus();}
 function bootstrap(){
  if(!by('backspoolCombatHUD')||!by('afterstepHUD')||!by('characterControls')||!by('bankSlots'))return;
  ready=true;document.body.classList.add('v02CompactHUD');
  const card=by('menu').querySelector('.card');card.setAttribute('role','dialog');card.setAttribute('aria-modal','true');card.setAttribute('aria-label','Saint Meridian pause and tools');
  const nav=node('div','v02Tabs');nav.setAttribute('role','tablist');nav.setAttribute('aria-label','Pause tools');
  const panels=node('div','v02ToolPanels');
  const children=[...card.children];card.append(nav,panels);
  for(const[id,label]of[['overview','District'],['hero','Hero'],['equipment','Equipment'],['practice','Practice'],['controls','Controls']]){
   const button=node('button','v02Tab-'+id,label),panel=node('section','v02Pane-'+id);button.type='button';button.setAttribute('role','tab');button.setAttribute('aria-controls',panel.id);panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',button.id);button.onclick=()=>selectTab(id);nav.append(button);panels.append(panel);tabs.set(id,{button,panel});
  }
  const overview=tabs.get('overview').panel;for(const e of children)overview.append(e);
  const footer=node('div','v02MenuFooter');move('start',footer);card.append(footer);
  by('start').textContent='Resume';
  move('characterControls',tabs.get('hero').panel);move('audioControls',tabs.get('controls').panel);move('helpToggle',tabs.get('controls').panel);move('controlsGuide',tabs.get('controls').panel);move('controllerStatus',tabs.get('controls').panel);
  move('backspoolCombatHUD',tabs.get('practice').panel);move('backspoolPowerHUD',tabs.get('equipment').panel);move('afterstepHUD',tabs.get('equipment').panel);
  const contracts=node('section','v02ContractTools','<h2>Street contracts</h2><p>Ground-reachable Backspool objectives. Starting resumes play.</p>');move('contractStart',contracts);move('contractEnd',contracts);tabs.get('practice').panel.append(contracts);
  const top=node('div','v02Toolbar','<button id="v02Tools" type="button">Pause / Tools</button><span id="v02HeroName"></span>');document.body.append(top);by('v02Tools').onclick=()=>openTools();
  const vitals=by('flightVitals'),resources=node('div','v02Resources','<div class="v02ResourceLabel">AFTERSTEP <span id="v02StateLabel"></span></div>');vitals.append(resources);move('driveBank',resources);move('driveStatus',resources);move('bankSlots',resources);
  const notice=node('div','v02ReplayNotice');move('powerMessage',notice);move('powerRouteInfo',notice);vitals.append(notice);
  const combat=node('div','v02CombatFeedback');move('combatLockText',combat);const hp=by('combatTargetHP')?.parentElement; if(hp)combat.append(hp);move('combatActionText',combat);const charge=by('combatChargeBar')?.parentElement;if(charge)combat.append(charge);document.body.append(combat);
  const wheel=node('div','v02DriveWheel');move('driveModeButtons',wheel);document.body.append(wheel);
  const contexts=node('div','v02ContextStack');for(const id of ['v02MarketHUD','v02PursuitHUD','v02EncounterHUD','backspoolTrainingHUD','heroContractHUD','v02DiscoveryHUD'])move(id,contexts);document.body.append(contexts);
  const touch=node('div','v02TouchActions'),first=by('backspoolCombatHUD').querySelector('.combatTouch'),mobile=by('backspoolCombatHUD').querySelector('.combatMobileActions');touch.append(first,mobile);
  const equipment=node('div','v02TouchEquipment');for(const id of ['tAfterstep','tThreadrail','tDriveModes'])move(id,equipment);touch.append(equipment);const rail=equipment.querySelector('#tThreadrail');rail.textContent='Rail';rail.setAttribute('aria-label','Throw Threadrail cartridge; hold for precision aim');
  const more=node('button','v02TouchMore','More');more.type='button';more.setAttribute('aria-expanded','false');more.onclick=()=>{const expanded=touch.classList.toggle('expanded');more.setAttribute('aria-expanded',String(expanded));more.textContent=expanded?'Less':'More';};touch.append(more);document.body.append(touch);
  // Original callbacks execute at target. Stop bubbling into world mouse controls.
  for(const root of [card,top,vitals,touch,wheel,combat,contexts])for(const type of ['pointerdown','pointerup','mousedown','mouseup','click','dblclick','wheel'])root.addEventListener(type,e=>e.stopPropagation());
  // Commands whose native eligibility requires live play resume before the target callback.
  const resumeIDs=new Set(['combatPractice','backspoolLesson','backspoolSpar','contractStart','threadrailCourse','vaultCourseStart','recordRoute','replayRoute','bankArm','bankRelease','bankRetrace','snapbackButton']);
  card.addEventListener('click',e=>{if(resumeIDs.has(e.target.closest('button')?.id)&&!gameActive)startGame(false);},true);
  nav.addEventListener('keydown',e=>{if(!['ArrowRight','ArrowLeft','Home','End'].includes(e.key))return;e.preventDefault();const keys=[...tabs.keys()],i=keys.indexOf(tab),next=e.key==='Home'?0:e.key==='End'?keys.length-1:(i+(e.key==='ArrowRight'?1:-1)+keys.length)%keys.length;selectTab(keys[next]);tabs.get(tab).button.focus();});
  card.addEventListener('keydown',e=>{
   if(e.key!=='Tab')return;const focus=[...card.querySelectorAll('button,a,input,select,summary,[tabindex]')].filter(e=>!e.disabled&&e.tabIndex>=0&&e.getClientRects().length);if(!focus.length)return;const first=focus[0],last=focus.at(-1);if(e.shiftKey&&(document.activeElement===first||!card.contains(document.activeElement))){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  });
  selectTab('overview');
 }
 function present(){
  if(!ready)bootstrap();if(!ready)return;
  // Optional owners load asynchronously; registration never changes their visibility decisions.
  const ctx=by('v02ContextStack');for(const id of ['v02MarketHUD','v02PursuitHUD','v02EncounterHUD','backspoolTrainingHUD','heroContractHUD','v02DiscoveryHUD'])if(by(id)?.parentNode!==ctx)move(id,ctx);
  if(by('v02Start')&&by('v02Start').parentNode!==tabs.get('overview').panel)move('v02Start',tabs.get('overview').panel);
  const active=!!gameActive,hero=window.characterState?.().active||'sightline',back=hero==='backspool';
  document.body.classList.toggle('v02HUDPlaying',active);document.body.classList.toggle('v02HUDBackspool',back);
  by('v02HeroName').textContent=back?'BACKSPOOL':'SIGHTLINE';by('v02StateLabel').textContent=by('combatStyle').selectedOptions[0]?.textContent||'';
  by('v02Resources').hidden=!back;by('v02ReplayNotice').hidden=!back||/^(HOLD |MOVE · BANK)/.test(by('powerMessage').textContent)&&!by('powerRouteInfo').textContent;
  const lock=by('combatLockText').textContent,action=by('combatActionText').textContent;by('v02CombatFeedback').hidden=!active||!back||/^NO TARGET/.test(lock)&&/^(IDLE|READY)$/.test(action);by('v02DriveWheel').hidden=!active||!back||!by('afterstepHUD').classList.contains('wheel');
  // Ready contracts belong in tools; active incidents retain live controls and guidance.
  const contract=by('heroContractHUD');contract?.classList.toggle('v02Dormant',by('contractEnd').hidden);
  const activeContract=window.actionWorldState?.().contracts.active,contractOwnsSparring=activeContract&&['active','paused','defeat'].includes(activeContract.status)&&activeContract.encounterAttempt===window.backspoolEncounterState?.().attempt;const contextOrder=contractOwnsSparring?['v02MarketHUD','v02PursuitHUD','v02EncounterHUD','heroContractHUD','backspoolTrainingHUD']:['v02MarketHUD','v02PursuitHUD','v02EncounterHUD','backspoolTrainingHUD','heroContractHUD'];let primary=false;for(const id of contextOrder){const e=by(id);if(!e)continue;e.classList.remove('v02LowerPriority');if(!e.hidden&&!e.classList.contains('v02Dormant')){if(primary)e.classList.add('v02LowerPriority');else primary=true;}}
  by('v02DiscoveryHUD')?.classList.toggle('v02LowerPriority',primary);
  if(active!==lastActive){if(active){by('start').textContent='Resume';if(returnFocus?.isConnected&&returnFocus.getClientRects().length)returnFocus.focus();else document.activeElement?.blur();}else if(lastActive===true&&by('menu').style.display!=='none')tabs.get(tab).button.focus();lastActive=active;}
 }
 window.verticalHUD={present,open:openTools,state:()=>({ready,active:!!gameActive,tab,pausedMenu:by('menu').style.display!=='none',touch:document.body.classList.contains('touchPlay'),expanded:by('v02TouchActions')?.classList.contains('expanded')||false,moved:[...new Set(moved)],scope:'Presentation only. Native pause, controls, resources and gameplay remain authoritative.'})};window.verticalHUDState=window.verticalHUD.state;present();
})();
