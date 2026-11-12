/* V02 gameplay fixes from the 2026-11-05 real-input bug sweep. New module: shared, hash-pinned modules are unchanged.
   1. Threadrail floor stall. A standing quick rail (R / X) on open ground lays the cable on the floor; the rail core
      correctly gives no free speed, so Backspool sat in the grind pose at 0 m/s (mode AIR) until he jumped or the rail
      expired after 30 s, and move input did nothing. A rider stopped on a cable that rests on walkable ground now steps
      off after 0.45 s with the velocity he has (none added). A rider stopped on a raised cable stays attached, as before,
      and is told how to release. Rails whose slope lets gravity restart travel are left alone.
   2. Objective marker. The off-screen objective marker was clamped to fixed screen margins and could sit on top of the
      speed readout. It is moved clear of the visible HUD panels after the game places it.
   3. Controls guide. "Controls & Rescues" always listed Sightline's keys (for example R = reset to plaza) even when
      Backspool or Loadout was active. The guide now shows the active hero's bindings, taken from the game's own
      in-game labels; Sightline's guide is the original markup, restored unchanged.
   Hooks (build_gameplay_fixes_candidate.py): beforePlayer(dt) at the top of updatePlayer, afterPresentation() right
   after updatePresentation in renderNight. */
(function(){
 'use strict';
 const STALL_SPEED=.3,STALL_SECONDS=.45,FLOOR_GAP=.35,RAIL_FRICTION=.45,GRAVITY=9.81;
 const stall={time:0,notified:false,dismounts:0,raisedNotices:0,restartSkips:0,last:null};
 function railTangentY(){
  try{const r=window.threadrailGame.state().rail,cur=r&&r.current,seg=cur&&r.rails.find(x=>x.id===cur.railId);return seg&&seg.tangent?seg.tangent.y:0;}catch(e){return 0;}
 }
 function beforePlayer(dt){
  const tg=window.threadrailGame;
  if(!tg||typeof gameActive==='undefined'||!gameActive||!Number.isFinite(dt)||dt<=0||!tg.onRail()){stall.time=0;stall.notified=false;return;}
  const speed=Math.hypot(s.vel.x,s.vel.y,s.vel.z);
  if(speed>=STALL_SPEED){stall.time=0;stall.notified=false;return;}
  stall.time+=dt;if(stall.time<STALL_SECONDS)return;
  // Gravity along the cable larger than friction restarts travel by itself: not a stall.
  if(Math.abs(GRAVITY*railTangentY())>RAIL_FRICTION*1.05){stall.time=0;stall.restartSkips++;return;}
  const support=supportHeight(s.pos.x,s.pos.z,s.pos.y+.42),gap=s.pos.y-support;
  if(Number.isFinite(gap)&&gap<=FLOOR_GAP){
   const before=[s.pos.x,s.pos.y,s.pos.z];
   if(tg.detach(false)!==false){stall.dismounts++;stall.last={reason:'floor',gap:+gap.toFixed(3),position:before,speed:+speed.toFixed(3)};}
   stall.time=0;stall.notified=false;return;
  }
  if(!stall.notified){stall.notified=true;stall.raisedNotices++;stall.last={reason:'raised',gap:+(Number.isFinite(gap)?gap:-1).toFixed(2),position:[s.pos.x,s.pos.y,s.pos.z]};if(typeof showBanner==='function')showBanner('RAIL STALLED','JUMP TO RELEASE');}
 }

 const marker={moves:0,last:null};
 const PANELS=['flightVitals','mission','railReadPanel','courierReadout','v02ReadBoard','actionHint'];
 function visibleRect(id){const e=document.getElementById(id);if(!e||e.hidden)return null;const st=getComputedStyle(e);if(st.display==='none'||st.visibility==='hidden'||+st.opacity===0)return null;const r=e.getBoundingClientRect();return r.width>0&&r.height>0?r:null;}
 function overlap(a,b){return a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;}
 function afterPresentation(){
  const m=document.getElementById('navigationMarker');if(!m||m.style.display==='none')return;
  let r=m.getBoundingClientRect();if(!r.width||!r.height)return;
  const h=innerHeight,gapPx=8;let top=parseFloat(m.style.top);if(!Number.isFinite(top))return;const start=top;
  for(let pass=0;pass<3;pass++){let moved=false;
   for(const id of PANELS){const p=visibleRect(id);if(!p||!overlap(r,p))continue;
    // Panels in the lower half push the marker up; panels in the upper half push it down.
    const delta=(p.top+p.bottom)/2>h/2?p.top-gapPx-r.bottom:p.bottom+gapPx-r.top;
    top+=delta;m.style.top=top+'px';r=m.getBoundingClientRect();moved=true;}
   if(!moved)break;}
  if(top!==start){marker.moves++;marker.last={from:+start.toFixed(1),to:+top.toFixed(1)};}
 }

 const guide={original:null,hero:null,renders:0};
 const row=(k,b,t='')=>`<div><span class="key">${k}</span><b>${b}</b>${t?' — '+t:''}</div>`;
 const BACKSPOOL_KEYS=[['WASD','Move','walk → run'],['Shift / Ctrl','Flow sprint','tap to toggle'],['Space','Jump / directional flip'],['LMB','Strike'],['Q','Heavy'],['RMB','Guard'],['C','Evade'],['Alt','Lock target'],['1–3','Combat state'],['R','Threadrail','tap · hold for precision'],['E','Afterstep Drive'],['U','Snapback'],['G hold / H / J / N','Bank / Echo / Retrace / next'],['T','Practice targets'],['I','Read public information'],['Esc','Pause and tools']];
 const BACKSPOOL_PAD=[['LS','Move'],['RS','Camera'],['L3','Flow sprint','B outside combat'],['A / ×','Jump'],['RT','Strike'],['D↑','Heavy'],['LT','Guard'],['D↓ / B','Evade'],['R3','Lock target'],['D← / D→','Combat state'],['X / □','Threadrail'],['RB / R1','Afterstep Drive'],['LB + Y','Snapback'],['View + LB / RB / X / D↑','Bank / Echo / Retrace / next'],['Y / △','Read public information'],['L3 + LT + RT + R3','Switch hero']];
 const POWERS=new Set(['R','E','U','G hold / H / J / N','X / □','RB / R1','LB + Y','View + LB / RB / X / D↑']);
 function heroGuide(hero){
  const loadout=hero==='loadout',keep=x=>!loadout||!POWERS.has(x[0]);
  const note=loadout?'Loadout uses Backspool\'s traversal, parkour and melee combat without his powers: no Threadrail, Afterstep Drive, Snapback, Echo or Retrace.'
   :'Flow sprint is tap-to-toggle. Run before attaching to a Threadrail: a standing attach gives no speed, and a cable lying on the ground lets you step off. Drive releases re-use impulses you banked from real footfalls, jumps and landings.';
  return '<div class="grid">'+BACKSPOOL_KEYS.filter(keep).map(x=>row(...x)).join('')+'</div><div class="controllerHelp"><div class="label">Controller // auto-detected</div><div class="grid">'+BACKSPOOL_PAD.filter(keep).map(x=>row(...x)).join('')+'</div></div><p class="courierHelp">'+note+'</p><div class="grid"><div><span class="key">F3</span>Toggle diagnostics</div><div><span class="key">Esc</span>Pause and controls</div></div>';
 }
 function syncGuide(){
  const g=document.getElementById('controlsGuide');if(!g||!window.characterState)return;
  if(guide.original===null)guide.original=g.innerHTML;
  let hero;try{hero=characterState().hero||characterState().active;}catch(e){return;}
  if(hero===guide.hero)return;guide.hero=hero;guide.renders++;
  g.innerHTML=hero==='sightline'?guide.original:heroGuide(hero);g.dataset.hero=hero;
 }
 setInterval(syncGuide,250);document.addEventListener('click',e=>{if(e.target.closest?.('#helpToggle,#characterChoice'))syncGuide();},true);

 window.v02GameplayFixes={beforePlayer,afterPresentation,syncGuide,state:()=>({stall:{...stall},marker:{...marker},guide:{hero:guide.hero,renders:guide.renders}})};
})();
