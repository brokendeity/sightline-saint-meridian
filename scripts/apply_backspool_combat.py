from pathlib import Path

def build(output=None,base_path=None,write=True):
 root=Path(__file__).resolve().parents[1];target=Path(output) if output else root/'SIGHTLINE_SAINT_MERIDIAN_TOON.html';base=Path(base_path) if base_path else root/'src/sightline_base_v1.html'
 if not base.exists():base.write_bytes(target.read_bytes())
 s=base.read_text()
 def edit(old,new):
  nonlocal s
  assert s.count(old)==1,(old[:100],s.count(old));s=s.replace(old,new,1)
 edit('</style>',(root/'scripts/game_backspool_combat.css').read_text()+'\n'+(root/'scripts/game_backspool_powers.css').read_text()+'\n</style>')
 p=s.rfind('loadCharacter().');assert p>0;s=s[:p]+(root/'scripts/game_backspool_combat.js').read_text()+'\n'+(root/'scripts/game_backspool_powers.js').read_text()+'\n'+(root/'scripts/game_backspool_encounters.js').read_text()+'\n'+s[p:]
 edit('if(window.backspoolPreviewActive?.()||window.characterSwitcherAnimation?.(dt))return;', 'if(window.backspoolPreviewActive?.()||window.backspoolPowers?.animate()||window.backspoolCombat?.animate()||window.characterSwitcherAnimation?.(dt))return;')
 edit("if(mouse.r){aimRay();queueOrLaunch()}","if(mouse.r&&sightlinePowersEnabled()){aimRay();queueOrLaunch()}")
 edit("active=id;if(id==='backspool')","active=id;window.backspoolCombat?.cancel();window.backspoolPowers?.heroChanged(id);if(id==='backspool')")
 edit('function getMoveInput(){','function getMoveInput(){\n if(window.backspoolCombat?.movementLocked())return{x:0,y:0,mag:0};')
 edit('if(edge(\'recenter\'))recenterCamera();',"if(edge('recenter')){if(sightlinePowersEnabled())recenterCamera();else backspoolCombat.toggleLock();}")
 edit('function doDodge(){if(!sightlinePowersEnabled())return;', 'function doDodge(){if(!sightlinePowersEnabled()){backspoolCombat.evade();return;}')
 edit('const playerDt=dt*perceptionClock.player,worldDt=dt*perceptionClock.world,animationDt=dt*perceptionClock.animation;', 'const combatScale=backspoolCombat.timeScale(),playerDt=dt*perceptionClock.player*combatScale,worldDt=dt*perceptionClock.world*combatScale,animationDt=dt*perceptionClock.animation*combatScale;\n  backspoolCombat.tick(playerDt,dt);')
 edit('updateHUD(false,dt);','updateHUD(false,dt);backspoolCombat.cameraTick(dt);backspoolCombat.presentation(dt);')
 edit('if(tryPerfectBrace())continue;s.pressure=', 'if(backspoolCombat.receiveProjectile(p))continue;if(tryPerfectBrace())continue;s.pressure=')
 edit('outlineStrength:{value:.18}', 'outlineStrength:{value:.18},combatFocus:{value:0}')
 edit('uniform float outlineStrength;', 'uniform float outlineStrength;uniform float combatFocus;')
 edit('c+=bloom*.16;c=mix(c,c*vec3(.96,1.025,1.025),.45);gl_FragColor=vec4(c,1.);}', 'c+=bloom*.16;c=mix(c,c*vec3(.96,1.025,1.025),.45);float focusEdge=smoothstep(.2,.75,length(vUv-.5));c*=1.-focusEdge*combatFocus*.2;c=mix(c,c*vec3(1.06,1.01,.94),combatFocus*.18);gl_FragColor=vec4(c,1.);}')
 edit('character:window.characterState?.(),coordinates:', 'character:window.characterState?.(),combat:window.backspoolCombatState?.(),coordinates:')
 edit("else hint=aim+' · choose a rooftop vector   '+fire+' · launch';", "else hint=sightlinePowersEnabled()?aim+' · choose a rooftop vector   '+fire+' · launch':'RT / LMB · strike · LT / RMB · guard · R3 / F · lock';")
 edit("animationHold=.22;rumble(65,.16,.08);return true;","animationHold=.22;window.backspoolCombat?.onJump();rumble(65,.16,.08);return true;")
 edit("ui.hint=hint;$('actionHint').textContent=hint;", "if(!sightlinePowersEnabled())hint=s.onGround?'RT / LMB · combo / hold heavy · LT / RMB · guard · R3 / F · lock':'RT / LMB · aerial kick · X / C · aerial evade';ui.hint=hint;$('actionHint').textContent=hint;")
 edit("library=data.map(entry=>", "try{const local=await fetch('assets/backspool/storm-local-clips.json.gz');if(local.ok)data.push(...JSON.parse(new TextDecoder().decode(fflate.gunzipSync(new Uint8Array(await local.arrayBuffer())))));}catch(error){console.warn('Local Storm clips unavailable; supplied Backspool clips retained',error);}\n  library=data.map(entry=>")
 edit('function doBrace(){if(!sightlinePowersEnabled())return;', 'function doBrace(){if(!sightlinePowersEnabled())return;')
 edit('flightFX.update(realDt);', 'window.backspoolCombat?.groundSupport();flightFX.update(realDt);')
 edit('  backspoolCombat.tick(playerDt,dt);','  backspoolPowers.tick(playerDt);backspoolCombat.tick(playerDt,dt);')
 edit('updatePlayer(playerDt,dt);updateCharacter(playerDt,animationDt,dt);','updatePlayer(playerDt,dt);updateCharacter(playerDt,animationDt,dt);backspoolPowers.capture(playerDt);')
 edit('backspoolCombat.presentation(dt);','backspoolCombat.presentation(dt);backspoolPowers.ui();')
 edit('function updatePlayer(dt,realDt=dt){updateResponsiveInput(realDt);','function updatePlayer(dt,realDt=dt){updateResponsiveInput(realDt);if(window.backspoolPowers?.isRetracing()){clearRailQueue();return;}')
 edit('if(window.backspoolCombat?.movementLocked())','if(window.backspoolPowers?.isRetracing()||window.backspoolCombat?.movementLocked())')
 edit('powers:window.backspoolPowerState?.(),coordinates:' if 'powers:window.backspoolPowerState?.(),coordinates:' in s else 'combat:window.backspoolCombatState?.(),coordinates:', 'combat:window.backspoolCombatState?.(),powers:window.backspoolPowerState?.(),coordinates:')
 edit("input.actions.sprint=button(gp,'sprint').pressed||button(gp,'sprintAlt').pressed;", "input.actions.sprint=(sightlinePowersEnabled()&&button(gp,'sprint').pressed)||button(gp,'sprintAlt').pressed;")
 edit('function resetPlayer(){resetMechanicEncounter();','function resetPlayer(){window.backspoolPowers?.clear();resetMechanicEncounter();')
 edit(' trailMat.opacity=Math.max(0,trailMat.opacity-dt*3);',' backspoolPowers.ui();trailMat.opacity=Math.max(0,trailMat.opacity-dt*3);')
 edit('else if(mixer)mixer.update(dt*.35);','else if(mixer&&sightlinePowersEnabled())mixer.update(dt*.35);')
 s=s.replace('backspoolPowers.capture(playerDt);','backspoolPowers.capture(playerDt);backspoolEncounters.tick(playerDt);')
 s=s.replace('powers:window.backspoolPowerState?.(),coordinates:', 'powers:window.backspoolPowerState?.(),encounter:window.backspoolEncounterState?.(),coordinates:')
 s=s.replace('function resetPlayer(){window.backspoolPowers?.clear();','function resetPlayer(){window.backspoolEncounters?.clear();window.backspoolPowers?.clear();')
 s=s.replace('</style>', '#backspoolTrainingHUD{position:fixed;top:132px;left:50%;transform:translateX(-50%);width:min(340px,90vw);padding:12px;background:#101d25ed;border:1px solid #e5b866;border-radius:7px;color:#ffe3a0;font:12px monospace;z-index:20}#backspoolTrainingHUD[hidden]{display:none}#backspoolTrainingHUD div{margin:8px 0;line-height:1.4}#backspoolTrainingHUD small{display:block}#backspoolTrainingHUD button{margin:8px 0 0;padding:5px;font-size:11px}@media(max-width:700px){#backspoolTrainingHUD{top:auto;bottom:18px;width:240px}} </style>',1)
 s=s.replace('function pauseGame(){','function pauseGame(){window.backspoolCombat?.clearBuffer();')
 s=s.replace('backspoolPowers.ui();trailMat.opacity','backspoolPowers.ui();backspoolEncounters.present();trailMat.opacity')
 s=s.replace('</style>',(root/'scripts/game_backspool_reliability.css').read_text()+'\n</style>',1)
 s=s.replace('backspoolCombat.presentation(dt);backspoolPowers.ui();','backspoolCombat.presentation(dt);')
 if write:target.write_text(s)
 return s

if __name__=="__main__":
 import argparse
 from build_action_game import build as build_current
 p=argparse.ArgumentParser(description="Compatibility alias for the authoritative Action v2 candidate builder")
 p.add_argument("--output");a=p.parse_args();print(build_current(a.output))
