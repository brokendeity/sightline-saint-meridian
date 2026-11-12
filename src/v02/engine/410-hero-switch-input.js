const heroSwitchInput={latched:false};
function sightlinePowersEnabled(){return window.characterState?.().active!=='backspool';}
function handleHeroSwitchChord(gp){
 const indices=[10,6,7,11],down=indices.map(i=>!!gp.buttons?.[i]&&(gp.buttons[i].pressed||gp.buttons[i].value>.5));
 if(down.every(Boolean)&&!heroSwitchInput.latched){heroSwitchInput.latched=true;clearInput();if(gameReady&&!characterState().busy)characterSwitcher.change(window.loadoutHero?window.loadoutHero.nextHero():characterState().active==='sightline'?'backspool':'sightline');}
 if(!heroSwitchInput.latched)return false;
 for(const key of Object.keys(input.actions))input.actions[key]=typeof input.actions[key]==='boolean'?false:0;
 pad.fireQueued=false;pad.jumpQueued=false;
 if(down.every(value=>!value))heroSwitchInput.latched=false;
 return true;
}

