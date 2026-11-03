/* Paused inspection cameras. This adapter owns only camera presentation; native
 * pause is the simulation boundary. Closing returns to tools, never to play. */
(()=>{
 'use strict';
 const by=id=>document.getElementById(id);
 let contract=null,error=null,ready=false,selected=0,saved=null,returnFocus=null;
 const css=document.createElement('link');css.rel='stylesheet';css.href='scripts/game_vertical_views_v02.css';document.head.append(css);
 fetch('assets/city/vertical-v02/reference_views.json').then(r=>{if(!r.ok)throw Error('City views '+r.status);return r.json();}).then(data=>{
  if(data.views?.length!==2||!data.views.every(v=>[...v.position,...v.look].length===6&&[...v.position,...v.look].every(Number.isFinite)))throw Error('Invalid city-view contract');contract=data;
 }).catch(e=>{error=String(e);console.error(e);});
 function pose(){
  const v=contract.views[selected];camera.position.fromArray(v.position);camera.up.set(0,1,0);camera.lookAt(...v.look);camera.fov=contract.verticalFOVDegrees;camera.zoom=1;camera.near=contract.near;camera.far=contract.far;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
 }
 function choose(index){
  if(!saved)return false;selected=(index+contract.views.length)%contract.views.length;pose();by('v02ViewTitle').textContent=contract.views[selected].label;
  for(const [i,b]of [...by('v02ViewChoices').children].entries())b.setAttribute('aria-pressed',String(i===selected));return true;
 }
 function open(index=0){
  if(!ready||saved||!gameReady||characterState().busy||courier.resultsOpen)return false;
  if(gameActive)window.verticalHUD.open('overview');
  if(gameActive||by('menu').style.display==='none')return false;
  returnFocus=document.activeElement;clearInput();saved={position:camera.position.clone(),quaternion:camera.quaternion.clone(),up:camera.up.clone(),fov:camera.fov,zoom:camera.zoom,near:camera.near,far:camera.far};
  document.body.classList.add('v02CityView');by('v02CityViews').hidden=false;choose(index);by('v02ViewsClose').focus();return true;
 }
 function close(){
  if(!saved)return false;const old=saved;saved=null;camera.position.copy(old.position);camera.quaternion.copy(old.quaternion);camera.up.copy(old.up);for(const k of ['fov','zoom','near','far'])camera[k]=old[k];camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();camera.updateMatrixWorld(true);clearInput();
  by('v02CityViews').hidden=true;document.body.classList.remove('v02CityView');if(returnFocus?.isConnected&&returnFocus.getClientRects().length)returnFocus.focus();else by('v02CityViewOpen').focus();return true;
 }
 function bootstrap(){
  if(!contract||!window.verticalHUDState?.().ready)return;ready=true;renderer.domElement.dataset.v02WorldCanvas='';
  const tools=document.createElement('section');tools.id='v02ViewTools';tools.innerHTML='<h2>City views</h2><p>Inspect the district while play is paused. Return here to resume.</p><button id="v02CityViewOpen" type="button">View the city</button>';by('v02Pane-overview').append(tools);by('v02CityViewOpen').onclick=()=>open(0);
  const panel=document.createElement('section');panel.id='v02CityViews';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','v02ViewTitle');panel.innerHTML='<div id="v02ViewBar"><div><span>PAUSED · CITY VIEWS</span><h1 id="v02ViewTitle"></h1></div><button id="v02ViewsClose" type="button">Back to tools</button></div><div id="v02ViewChoices" role="group" aria-label="City view"></div><p id="v02ViewHint">← / → change view · Esc or controller B / Start returns to tools</p>';document.body.append(panel);
  contract.views.forEach((v,i)=>{const b=document.createElement('button');b.id='v02View-'+v.id;b.type='button';b.textContent=v.label;b.onclick=()=>choose(i);by('v02ViewChoices').append(b);});by('v02ViewsClose').onclick=close;
  for(const type of ['pointerdown','pointerup','mousedown','mouseup','click','dblclick','wheel'])panel.addEventListener(type,e=>e.stopPropagation());
 }
 function present(){if(!ready)bootstrap();if(saved)pose();}
 function poll(gp){
  if(!saved)return false;const now=(gp.buttons||[]).map(b=>!!b&&(b.pressed||b.value>.5)),edge=i=>now[i]&&!pad.prevButtons[i];
  // Consume every button, including the hero-switch chord, on this boundary.
  const back=edge(1)||edge(9),direction=edge(15)?1:edge(14)?-1:0;pad.prevButtons=now;clearInput();if(back)close();else if(direction)choose(selected+direction);return true;
 }
 window.addEventListener('keydown',e=>{
  if(!saved)return;e.preventDefault();e.stopImmediatePropagation();
  if(e.key==='Escape'){close();return;}if(e.repeat)return;if(e.key==='ArrowRight')choose(selected+1);else if(e.key==='ArrowLeft')choose(selected-1);else if(e.key==='Enter'||e.key===' ')document.activeElement?.click();else if(e.key==='Tab'){
   const buttons=[...by('v02CityViews').querySelectorAll('button')],i=buttons.indexOf(document.activeElement);buttons[(i+(e.shiftKey?-1:1)+buttons.length)%buttons.length].focus();
  }
 },true);
 window.addEventListener('keyup',e=>{if(saved){e.preventDefault();e.stopImmediatePropagation();}},true);
 window.verticalViews={active:()=>!!saved,open,close,present,poll,state:()=>({ready,error,active:!!saved,selected:contract?.views[selected]?.id||null,contract:'assets/city/vertical-v02/reference_views.json',scope:'Paused camera inspection only; player and world stay at their native paused state.'})};window.verticalViewsState=window.verticalViews.state;
})();
