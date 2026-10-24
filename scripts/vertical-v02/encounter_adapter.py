"""Candidate-only extensions of the current combat system, with exact patch guards.

No old playable HTML is modified. Damage, reactions and attack timing remain the
shared gameplay implementation; fixed placements use its existing body sweep.
"""
def compose_encounters(s):
 def edit(a,b):
  nonlocal s
  assert s.count(a)==1, 'Encounter patch mismatch: '+a[:100]
  s=s.replace(a,b,1)
 edit('function spawnPractice(positions=null){','function spawnPractice(positions=null,options={}){')
 edit('p.y=actorGroundHeight(p.x,p.z,s.pos.y-.42);if(Math.abs(p.y-(s.pos.y-.42))>.25&&!(s.pos.y<1&&p.y===.4))return false;',
      'const requestedHeight=p.y;p.y=actorGroundHeight(p.x,p.z,options.heightAware?requestedHeight:s.pos.y-.42);if(options.heightAware?Math.abs(p.y-requestedHeight)>.02:Math.abs(p.y-(s.pos.y-.42))>.25&&!(s.pos.y<1&&p.y===.4))return false;')
 edit('points.push(p);}window.backspoolEncounters?.clear();clearPractice();',
      'points.push(p);}if(options.validateOnly)return true;window.backspoolEncounters?.clear();clearPractice();')
 edit('function start(lesson=true){if(!gameActive||!backspoolCombat.enabled())return false;',
      'function start(lesson=true,options=null){if(!gameActive||!backspoolCombat.enabled())return false;')
 edit('const positions=placement();if(!positions){',
      'const positions=options?.positions?.map(p=>p.clone())||placement();if(!positions||!backspoolCombat.spawnPractice(positions,{heightAware:!!options?.heightAware,validateOnly:true})){')
 edit('if(defeated)courier.trauma=0;', 'if(defeated&&!options?.preserveHealth)courier.trauma=0;')
 edit('backspoolCombat.spawnPractice(positions);attempt++;',
      'if(!backspoolCombat.spawnPractice(positions,{heightAware:!!options?.heightAware}))return false;attempt++;')
 # The existing Restart button must retain fixed district ownership/placement.
 edit("$('encounterRestart').onclick=()=>start(state.lesson);",
      "$('encounterRestart').onclick=()=>window.verticalEncounters?.ownsAttempt(attempt)?window.verticalEncounters.restart():start(state.lesson);")
 # Preserve shared hero vitals, but let the active local encounter own only its
 # objective presentation. No street-contract progress is discarded.
 edit("if(!c&&window.backspoolEncounterState?.().active)panel.hidden=true;",
      "if(!c&&window.backspoolEncounterState?.().active||window.verticalEncounters?.ownsPresentation()||window.verticalMarket?.ownsPresentation())panel.hidden=true;")
 edit("function resetPlayer(){window.threadrailGame?.lifecycle('RESPAWN');",
      "function resetPlayer(){window.verticalMarket?.reset('RESPAWN');window.verticalEncounters?.reset('RESPAWN');window.threadrailGame?.lifecycle('RESPAWN');")
 edit('backspoolEncounters.tick(playerDt);actionWorld.tick(playerDt);',
      'backspoolEncounters.tick(playerDt);actionWorld.tick(playerDt);window.verticalEncounters?.tick(playerDt);window.verticalMarket?.tick(worldDt);')
 edit('backspoolPowers.ui();backspoolEncounters.present();threadrailGame.present();',
      'backspoolPowers.ui();backspoolEncounters.present();threadrailGame.present();window.verticalEncounters?.present();window.verticalMarket?.present();')
 edit('window.actionWorld?.present();adaptiveQuality.update(dt);',
      'window.actionWorld?.present();window.verticalEncounters?.present();window.verticalMarket?.present();adaptiveQuality.update(dt);')
 # Use the already established equipment-interact action on keyboard/controller.
 edit("function interact(){say('BACKSPOOL · EQUIPMENT READY');}",
      "function interact(){if(window.verticalMarket?.interact()||window.verticalEncounters?.interact())return;say('BACKSPOOL · EQUIPMENT READY');}")
 edit("function startContract(resume=false){if(!gameActive", "function startContract(resume=false){if(window.verticalMarket?.isActive()){notice('Finish or end the market rescue first.');return false;}if(!gameActive")
 return s
