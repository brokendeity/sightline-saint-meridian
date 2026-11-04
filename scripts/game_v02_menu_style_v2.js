/* V02 menu restyle ("Midnight Slash"), v2: same as game_v02_menu_style.js, plus the third hero (Loadout) in the backdrop word.
 *  links scripts/game_v02_menu_style.css after the HUD stylesheet and adds three
 * decorative, non-interactive layers to the menu: an amber edge strip, the active hero's name as an outlined backdrop word, and stamped
 * prompts for the keys the menu really answers to (arrows switch tabs, Tab moves, Enter selects).
 * No ids, buttons, tabs or handlers are changed. */
(()=>{
 'use strict';
 const version=document.currentScript?.src.match(/[?&]v=([^&]+)/)?.[1]||'';
 const link=document.createElement('link');link.rel='stylesheet';link.href='scripts/game_v02_menu_style.css'+(version?'?v='+version:'');link.id='v02MenuStyle';
 const state={ready:false,hero:null,decorated:false};
 function decorate(){const menu=document.getElementById('menu'),footer=document.getElementById('v02MenuFooter');if(!menu||!footer)return false;
  // Keep this stylesheet last so it follows the HUD module's runtime link.
  document.head.append(link);
  if(!document.getElementById('menuHeroWord')){const word=document.createElement('div');word.id='menuHeroWord';word.setAttribute('aria-hidden','true');word.innerHTML='<span>Active hero</span><b></b>';menu.append(word);}
  if(!document.getElementById('menuStrip')){const strip=document.createElement('div');strip.id='menuStrip';strip.setAttribute('aria-hidden','true');menu.prepend(strip);}
  if(!document.getElementById('menuPrompts')){const prompts=document.createElement('div');prompts.id='menuPrompts';prompts.setAttribute('aria-hidden','true');prompts.innerHTML='<span><kbd>&larr; &rarr;</kbd>Tabs</span><span><kbd>Tab</kbd>Move</span><span><kbd>Enter</kbd>Select</span>';footer.append(prompts);}
  state.decorated=true;return true;}
 function sync(){if(!state.decorated&&!decorate())return;const st=window.characterState?.(),id=st?.hero||st?.active;const hero=id==='loadout'?'Loadout':id==='backspool'?'Backspool':id==='sightline'?'Sightline':null;
  if(hero!==state.hero){state.hero=hero;const b=document.querySelector('#menuHeroWord b');if(b)b.textContent=hero||'';document.getElementById('menuHeroWord')?.toggleAttribute('hidden',!hero);}
  state.ready=state.decorated;}
 // The HUD module builds the tabs and footer after load; poll cheaply (4 Hz) so hero switches show on the next pause.
 setInterval(sync,250);
 window.v02MenuStyle={state:()=>({...state,stylesheetLoaded:[...document.styleSheets].some(s=>s.ownerNode===link)})};
})();
