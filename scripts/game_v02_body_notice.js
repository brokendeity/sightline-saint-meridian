/* Keep the native warning IDs, text and simulation-clock opacity. Narrow
 * windows place the existing banner in the existing responsive status stack. */
window.v02BodyNotice=(()=>{
 const media=matchMedia('(max-width:700px)');let banner,home,next,card,narrow=false;
 const state={mounted:false,narrow:false,visible:false};
 function sync(){
  if(!card){banner=document.getElementById('banner');const stack=document.getElementById('v02ContextStack');if(!banner||!stack)return;home=banner.parentNode;next=banner.nextSibling;card=document.createElement('section');card.id='v02NativeNotice';card.hidden=true;card.setAttribute('aria-live','polite');stack.prepend(card);state.mounted=true;}
  if(media.matches!==narrow){narrow=media.matches;if(narrow)card.append(banner);else if(next?.parentNode===home)home.insertBefore(banner,next);else home.append(banner);}
  state.narrow=narrow;state.visible=narrow&&Number(banner.style.opacity)>0;card.hidden=!state.visible;
 }
 const original=actionCamera.tick;actionCamera.tick=function(dt){original(dt);sync();};
 window.v02BodyNoticeState=()=>({...state});return{state:window.v02BodyNoticeState};
})();
