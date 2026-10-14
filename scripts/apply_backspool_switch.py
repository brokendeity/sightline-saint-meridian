from pathlib import Path
root=Path(__file__).resolve().parents[1];file=root/'SIGHTLINE_SAINT_MERIDIAN_TOON.html';backup=root/'.pre-backspool-switch.html'
if not backup.exists():backup.write_bytes(file.read_bytes())
s=backup.read_text();s=s.replace('</style>',(root/'scripts/game_backspool_switch.css').read_text()+'\n</style>',1)
needle='function resolveAnimation(dt){';assert s.count(needle)==1;s=s.replace(needle,needle+"\n if(window.backspoolPreviewActive?.()||window.characterSwitcherAnimation?.(dt))return;")
s=s.replace("dodgeCD=.55;gameAudio.play('dodge');","dodgeCD=.55;characterSwitcher.dodge();gameAudio.play('dodge');")
s=s.replace('if(o.isSkinnedMesh)this.sources.push(o)','if(o.isSkinnedMesh&&!o.userData.toonOutline)this.sources.push(o)')
s=s.replace('else{if(mixer)mixer.update(dt*.35);','else{if(window.backspoolPreviewActive?.())updateCharacter(dt,dt,dt);else if(mixer)mixer.update(dt*.35);')
s=s.replace('roads:roadNetworkState(),coordinates:','roads:roadNetworkState(),character:window.characterState?.(),coordinates:')
needle='loadCharacter().';p=s.rfind(needle)
if p<0:raise Exception('Startup load hook not found')
s=s[:p]+(root/'scripts/game_backspool_switch.js').read_text()+'\n'+s[p:]
s=s.replace(' // Raw device -> normalized action values.', " if(handleHeroSwitchChord(gp)){pad.prevButtons=(gp.buttons||[]).map(b=>!!b&&(b.pressed||b.value>.1));return;}\n // Raw device -> normalized action values.")
s=s.replace('function inputAiming(){return mouse.r||input.actions.aim}', 'function inputAiming(){return sightlinePowersEnabled()&&(mouse.r||input.actions.aim)}')
for name in ['queueOrLaunch','doDodge','doBrace','toggleRailRead']:
 import re
 s,n=re.subn(r'(function '+name+r'\([^)]*\)\{)',r'\1if(!sightlinePowersEnabled())return;',s,count=1)
 assert n==1,name
file.write_text(s)
