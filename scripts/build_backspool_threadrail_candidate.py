"""Reproducible isolated Threadrail / Afterstep build; preserves active game."""
from pathlib import Path
import json,hashlib,subprocess
from build_backspool_traversal_candidate import main as baseline
ROOT=Path(__file__).resolve().parents[1]
def main():
 old=ROOT/'SIGHTLINE_BACKSPOOL_TRAVERSAL_CANDIDATE.html';backup=old.read_bytes()
 try:
  baseline()
  s=old.read_text()
 finally:
  old.write_bytes(backup)
 subprocess.run(['node',str(ROOT/'scripts/build_threadrail_pose.cjs')],check=True)
 def edit(a,b,count=1):
  nonlocal s
  if s.count(a)!=count:raise ValueError(f'Expected {count} hooks ({s.count(a)}): {a[:100]}')
  s=s.replace(a,b)
 cores='\n'.join((ROOT/'scripts'/f).read_text() for f in ['game_movement_coordinator.js','game_afterstep_drive.js','game_threadrail.js','game_temporal_exhaust.js','game_replay_route.js'])
 runtime=(ROOT/'scripts/game_backspool_threadrail_runtime.js').read_text()
 # Register input capture ahead of legacy capture handlers; the adapter is initialized before play.
 marker="window.addEventListener('gamepadconnected'"
 i=s.index(marker)
 s=s[:i]+"for(const type of ['keydown','keyup'])window.addEventListener(type,e=>{if(window.threadrailGame?.handleKey(e,type==='keyup')){e.preventDefault();e.stopImmediatePropagation();}},true);\n"+s[i:]
 edit('function updatePlayer(dt,realDt=dt){',cores+'\n'+runtime+"\nfunction updatePlayer(dt,realDt=dt){if(threadrailGame.tick(dt,realDt))return;updatePlayerLegacy(dt,realDt);threadrailGame.afterPhysics(dt);}\nfunction updatePlayerLegacy(dt,realDt=dt){")
 edit('function inputSprinting(){return keys.shift||input.actions.sprint}',"function inputSprinting(){return window.characterState?.().active==='backspool'&&window.threadrailGame?threadrailGame.sprinting():keys.shift||input.actions.sprint}")
 edit('function getRawMoveInput(){', 'function getRawMoveInput(){return window.threadrailGame?.steering()||getPhysicalMoveInput();}\nfunction getPhysicalMoveInput(){')
 edit('function getMoveInput(){', 'function getMoveInput(){if(window.threadrailGame?.steering()&&!window.backspoolCombat?.movementLocked()&&!window.backspoolPowers?.isRetracing())return threadrailGame.steering();')
 # Source-only relaxed idle. Original preview and hashes retained unchanged.
 idle=json.loads((ROOT/'assets/backspool/source-player-preview-index.json').read_text())['clips']
 idle=next(r for r in idle if r.get('sourceAnimationId')=='0x281116bb')
 role={**idle,'id':'forspoken-threadrail-relaxed-idle','role':'relaxedIdle','url':idle['sourceUrl'],'start':0,'end':idle['duration'],'playbackRate':1,'previewOnly':False,'gameplayIntegrated':True,'pelvisTranslation':False,'originalMotionName':'ntl_idle_loop_base_n000a_lp'}
 (ROOT/'assets/backspool/traversal-threadrail-roles.json').write_text(json.dumps({'roles':[role,*json.loads((ROOT/'assets/backspool/threadrail-grind-role.json').read_text())['roles']]},indent=2)+'\n')
 edit('window.backspoolFlowRoles=flowManifest;',"const equipmentRoles=await unpack('assets/backspool/traversal-threadrail-roles.json');flowManifest.roles.push(...equipmentRoles.roles);window.backspoolFlowRoles=flowManifest;")
 edit('window.backspoolFlow?.animate()||window.backspoolCombat?.animate()', 'window.backspoolFlow?.animate()||window.threadrailGame?.animate()||window.backspoolCombat?.animate()')
 edit('window.backspoolLadders?.animate()||window.backspoolAdvanced?.animate()', 'window.threadrailGame?.animatePriority()||window.backspoolLadders?.animate()||window.backspoolAdvanced?.animate()')
 edit('function visualSupportBias(){', 'function visualSupportBias(){if(window.threadrailGame?.onRail())return 0;')
 # Legacy controllers run as one checked owner per frame, without a second actor-position writer.
 for who,call in [('flow','backspoolFlowRuntime.tick(dt,realDt)'),('advanced','backspoolAdvancedRuntime.tick(dt)'),('ladder','backspoolLadderRuntime.tick(dt)'),('vault','backspoolTraversalRuntime.tick(dt,aiming)'),('flow','backspoolFlowRuntime.tick(0,0)')]:
  edit('&&'+call if call.endswith('(0,0)') else 'if('+call+')', '&&threadrailGame.coordinator.run('+repr(who)+',()=>'+call+')' if call.endswith('(0,0)') else 'if(threadrailGame.coordinator.run('+repr(who)+',()=>'+call+'))')
 edit(' tryBufferedJump(aiming);if(window.backspoolFlow?.locked()', ' threadrailGame.preserveDrive(dt);tryBufferedJump(aiming);if(window.backspoolFlow?.locked()')
 edit('updateCharacter(playerDt,animationDt,dt);backspoolPowers.capture', 'updateCharacter(playerDt,animationDt,dt);threadrailGame.afterPose(playerDt);backspoolPowers.capture')
 edit('backspoolPowers.ui();backspoolEncounters.present();', 'backspoolPowers.ui();backspoolEncounters.present();threadrailGame.present();')
 edit('renderer.render(scene,camera);runtimePolish.sceneCalls=', 'renderer.render(scene,camera);window.threadrailGame?.capture(renderer,camera);runtimePolish.sceneCalls=')
 edit('flow:window.backspoolFlowState?.(),coordinates:', 'flow:window.backspoolFlowState?.(),equipment:window.backspoolTraversalDiagnostics?.(),coordinates:')
 edit('function resetMechanicInput(){', "function resetMechanicInput(){window.threadrailGame?.lifecycle('INPUT RESET');")
 edit('function resetPlayer(){', "function resetPlayer(){window.threadrailGame?.lifecycle('RESPAWN');")
 edit('function clearPad(){', "function clearPad(){window.threadrailGame?.lifecycle('CONTROLLER DISCONNECTED');")
 edit('function pauseGame(){', "function pauseGame(){window.threadrailGame?.lifecycle('PAUSE');")
 edit('async function performChange(id){', "async function performChange(id){window.threadrailGame?.lifecycle('HERO CHANGE');")
 edit(" if(gameActive){\n  window.backspoolAdvanced?.padTether", " if(window.threadrailGame?.poll(gp,now)){pad.prevButtons=now;return;}\n if(gameActive){\n  window.backspoolAdvanced?.padTether")
 edit('combatants.tick(playerDt);backspoolPowers.tick(playerDt);backspoolCombat.tick(playerDt,dt);', 'threadrailGame.beginFrame();combatants.tick(playerDt);threadrailGame.powerStep(()=>backspoolPowers.tick(playerDt));threadrailGame.combatStep(()=>backspoolCombat.tick(playerDt,dt));')
 # Do not let raw old LB/RB bindings fire in addition to the new modifier preset.
 edit("button(findGamepad()||{},'brace').value>.5", "button(findGamepad()||{},'brace').value>.5&&window.threadrailGame?.preset()!=='traversal'")
 edit("rb=!!(pad.connected&&gp?.buttons?.[5]?.value>.5)", "rb=!!(pad.connected&&gp?.buttons?.[5]?.value>.5&&window.threadrailGame?.preset()!=='traversal')")
 edit("up=!!(pad.connected&&gp?.buttons?.[12]?.value>.5&&!gp?.buttons?.[8]?.pressed)", "up=!!(pad.connected&&gp?.buttons?.[12]?.value>.5&&!gp?.buttons?.[8]?.pressed&&window.threadrailGame?.preset()!=='traversal')")
 # Experimental free boost/teleport controls stay in rollback, not this physical equipment build.
 for entry in ['function dash(){','function scale(){','function skip(){','function switchMove(){']:
  edit(entry,entry+"if(window.threadrailGame)return false;")
 edit('function setCharge(held){','function setCharge(held){if(window.threadrailGame)return false;')
 edit('function beginTetherAim(){','function beginTetherAim(){if(window.threadrailGame)return false;')
 edit('function endTetherAim(){','function endTetherAim(){if(window.threadrailGame)return false;')
 edit('function tether(){','function tether(){if(window.threadrailGame)return false;')

 edit('const teleport=clock<=rollUntil;', 'const teleport=!window.threadrailGame&&clock<=rollUntil;')
 edit('function poll(){const gp=findGamepad(),now=', 'function poll(){if(window.threadrailGame)return;const gp=findGamepad(),now=')
 edit('if(!sprint&&sprintDown&&inputClock-sprintAt<.18', 'if(!window.threadrailGame&&!sprint&&sprintDown&&inputClock-sprintAt<.18')
 edit('if(!plan&&!f.grounded&&f.jumpHeld&&!f.reserveJump', 'if(!window.threadrailGame&&!plan&&!f.grounded&&f.jumpHeld&&!f.reserveJump')
 edit('const combatScale=backspoolCombat.timeScale()*(window.backspoolFlow?.timeScale()??1)', 'const combatScale=backspoolCombat.timeScale()*(window.threadrailGame?.timeScale()??window.backspoolFlow?.timeScale()??1)')
 edit('s.vel.set(0,0,0);s.onGround=false;setMode(P.AIR);consumeJump();window.backspoolHop', 's.onGround=false;setMode(P.AIR);consumeJump();window.backspoolHop')
 # Touch sprint must consume legacy hold handlers in capture phase.
 edit("touchHold('tAim','aim');", "$('tSprint').addEventListener('pointerdown',e=>{if(window.characterState?.().active==='backspool'&&window.threadrailGame){e.preventDefault();e.stopImmediatePropagation();threadrailGame.toggleSprint();}},true);for(const event of ['pointerup','pointercancel','lostpointercapture'])$('tSprint').addEventListener(event,e=>{if(window.characterState?.().active==='backspool'){e.stopImmediatePropagation();input.actions.sprint=false;}},true);touchHold('tAim','aim');")
 edit("window.backspoolAdvanced?.setTouchJump(true);window.backspoolFlow?.setTouchJump(true);queueJump();", "window.backspoolAdvanced?.setTouchJump(true);window.backspoolFlow?.setTouchJump(true);if(window.characterState?.().active==='backspool')threadrailGame.jump();else queueJump();")
 edit('window.backspoolFlow?.hint()||', 'window.threadrailGame?.hint()||window.backspoolFlow?.hint()||')
 edit('<title>', '<title>Threadrail + Afterstep — ')
 target=ROOT/'SIGHTLINE_BACKSPOOL_THREADRAIL_CANDIDATE.html';target.write_text(s)
 out=ROOT/'output/threadrail';out.mkdir(exist_ok=True)
 (out/'candidate-manifest.json').write_text(json.dumps({'build':target.name,'sha256':hashlib.sha256(s.encode()).hexdigest(),'base':'snapshot-2026-10-21-pose-binding-v14-complete','v15CarryForward':'949ed83','activeGameChanged':False,'originalControllerVerified':False,'originalIKVerified':False,'source':'Forspoken recovered admitted body motions; authored Backspool physical controllers and equipment'},indent=2)+'\n')
 print(target)
if __name__=='__main__':main()
