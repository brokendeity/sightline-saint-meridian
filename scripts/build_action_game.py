"""The authoritative, deterministic Action v2 browser build. Default output is a candidate."""
from pathlib import Path
import argparse, base64, gzip, hashlib, json, re
from apply_backspool_combat import build as assemble_base

ROOT=Path(__file__).resolve().parents[1]

def build(output=None):
    base=ROOT/'src/sightline_base_v1.html'
    pinned=json.loads((ROOT/'src/base-manifest.json').read_text())
    assert hashlib.sha256(base.read_bytes()).hexdigest()==pinned['sha256'], 'Pinned base changed'
    target=Path(output) if output else ROOT/'SIGHTLINE_ACTION_V2_CANDIDATE.html'
    s=assemble_base(target,base,write=False)
    def edit(old,new,count=1):
        nonlocal s
        assert s.count(old)==count,(old[:100],s.count(old),count)
        s=s.replace(old,new)
    def section(start,end,new):
        nonlocal s
        a=s.index(start); b=s.index(end,a+len(start));s=s[:a]+new+s[b:]
    # Ship binary assets separately; the original embedded build stays archived.
    match=re.search(r'const\s+EMBEDDED_FBX\s*=\s*',s)
    data,size=json.JSONDecoder().raw_decode(s[match.end():])
    urls={};asset_dir=ROOT/'assets/sightline/core';asset_dir.mkdir(parents=True,exist_ok=True)
    for name,encoded in data.items():
        raw=base64.b64decode(encoded);digest=hashlib.sha256(raw).hexdigest()[:20]
        file=asset_dir/(digest+'.fbx.gz')
        if not file.exists():file.write_bytes(gzip.compress(raw,compresslevel=9,mtime=0))
        urls[name]=file.relative_to(ROOT).as_posix()
    s=s[:match.start()]+'const EMBEDDED_FBX={};\nconst CORE_ASSET_URLS='+json.dumps(urls,separators=(',',':'))+';\nasync function loadCoreAssets(){await Promise.all(Object.entries(CORE_ASSET_URLS).map(async([name,url])=>{const response=await fetch(url);if(!response.ok)throw Error("Core asset unavailable: "+name);EMBEDDED_FBX[name]=fflate.gunzipSync(new Uint8Array(await response.arrayBuffer())).buffer;}));}\n'+s[match.end()+size+1:]
    edit('clip.name=name;for(const track of clip.tracks){',"clip.name=name;if(name.startsWith('action-v2-'))return clip;for(const track of clip.tracks){")
    edit('function b64ToBuffer(b64){','function b64ToBuffer(b64){if(typeof b64!=="string")return b64;')
    edit("const loader=new THREE.FBXLoader();const entries=Object.entries(ASSET_KEYS);", "await loadCoreAssets();const loader=new THREE.FBXLoader();const entries=Object.entries(ASSET_KEYS);")
    # One source module owns progressive character loading, including preview-only clips.
    section(' async function buildBackspool(){',' async function change(id)',(ROOT/'scripts/game_action_character_loader.js').read_text()+'\n')
    section(" $('backspoolPlay').onclick=", "$('backspoolClose').onclick=close;", " $('backspoolPlay').onclick=async()=>{if(!list.value||busy)return;busy=true;select.disabled=true;const selected=list.value;try{await loadPreviewClip(selected);preview=selected;currentAnim='';playAnim(preview,.15,true);$('backspoolPreviewLabel').textContent=library.find(e=>e.id===preview).name+' · preview only';}catch(error){$('backspoolPreviewLabel').textContent='Preview unavailable: '+error.message;}finally{busy=false;select.disabled=false;}};")
    edit('gameActive=playing;',"gameActive=playing&&(!courier.resultsOpen||id==='backspool');")
    edit("$('backspoolLibrary').onclick=()=>{","$('backspoolLibrary').onclick=()=>{if(window.backspoolCombat?.movementLocked()||!s.onGround){message.textContent='Finish the action and land before previewing animations.';return;}")
    edit("library.length+' animations ready'", "library.length+' library clips · 36 gameplay actions'")
    edit("Preview the complete collection. Gameplay uses the movement-state mappings.","Preview library · gameplay uses 36 authored strikes in Flow, Impact and Counter.")
    # Raw intent remains available while action movement is committed.
    raw=base.read_text();a=raw.index('function getMoveInput(){');b=raw.index('\nfunction getCameraBasis',a)
    raw=raw[a:b].replace('function getMoveInput(){','function getRawMoveInput(){',1)
    edit('function getMoveInput(){',raw+'\nfunction getMoveInput(){')
    edit('function tryBufferedJump(aiming){','function tryBufferedJump(aiming){if(!sightlinePowersEnabled()&&!backspoolCombat.canJump())return false;')
    edit('if(s.onGround&&footContactSamples.length){','if(s.onGround&&footContactSamples.length&&!window.backspoolCombat?.ownsGroundSupport()){')
    edit('function resetPlayer(){window.backspoolEncounters?.clear();','function resetPlayer(){window.backspoolCombat?.reset("RESPAWN");window.actionWorld?.reset();window.combatants?.respawnHero();window.backspoolEncounters?.clear();')
    edit("active=id;window.backspoolCombat?.cancel();window.backspoolPowers?.heroChanged(id);", "active=id;window.actionWorld?.heroChanged(id);window.combatants?.heroChanged(id);window.backspoolEncounters?.clear();window.backspoolCombat?.reset('HERO CHANGE');window.backspoolPowers?.heroChanged(id);")
    edit("input.actions.brake=button(gp,'brake').pressed||button(gp,'brake').value>.5;", "input.actions.brake=sightlinePowersEnabled()&&(button(gp,'brake').pressed||button(gp,'brake').value>.5);")
    edit("if(edge('railRead')||edge('railReadAlt'))toggleRailRead();", "if(sightlinePowersEnabled()){if(edge('railRead')||edge('railReadAlt'))toggleRailRead();}else{if(edge('railRead'))backspoolCombat.cycleStyle();if(edge('brake'))backspoolCombat.requestHeavy();}")
    edit("if(e.button===0){mouse.l=true;","if(e.button===0){mouse.l=true;if(!sightlinePowersEnabled())backspoolCombat.pressAttack();")
    edit("if(e.button===0)mouse.l=false","if(e.button===0){mouse.l=false;window.backspoolCombat?.releaseAttack();}")
    edit("if(edge('fire'))pad.fireQueued=true;", "if(edge('fire')&&sightlinePowersEnabled())pad.fireQueued=true;")
    edit('if(gameActive){perceptionClock.update(dt);','if(gameActive){if(sightlinePowersEnabled())perceptionClock.update(dt);else perceptionClock.reset();')
    edit('backspoolPowers.tick(playerDt);backspoolCombat.tick(playerDt,dt);','combatants.tick(playerDt);backspoolPowers.tick(playerDt);backspoolCombat.tick(playerDt,dt);')
    edit('backspoolEncounters.tick(playerDt);updateWorld(worldDt);roadNetwork.tick(worldDt);updateCourier(dt);', 'backspoolEncounters.tick(playerDt);actionWorld.tick(playerDt);actionWorld.beforeWorld(worldDt);updateWorld(worldDt);actionWorld.afterWorld(worldDt);roadNetwork.tick(worldDt);updateCourier(dt);')
    edit('updateDroneSearchlight(e,dt);e.shot-=dt;tickEnemyAttack(e,dt)', 'e.shot-=dt;')
    edit('velocityTunnel.update(dt);updateCamera(dt);','velocityTunnel.update(dt);actionCamera.tick(dt);')
    edit('function renderNight(dt){updatePresentation(dt);','function renderNight(dt){updatePresentation(dt);window.actionWorld?.present();')
    edit("$('vitalPressure').style.width=s.pressure+'%';$('vitalPressure').style.background=s.pressure>76?'#ffab6a':'#73d8d0';","if(sightlinePowersEnabled()){$('vitalPressure').style.width=s.pressure+'%';$('vitalPressure').style.background=s.pressure>76?'#ffab6a':'#73d8d0';}")
    edit("$('vitalLoad').textContent=Math.round(s.pressure)+'%';","if(sightlinePowersEnabled())$('vitalLoad').textContent=Math.round(s.pressure)+'%';")
    edit('function tickFrame(dt,draw=true){','function tickFrame(dt,draw=true){const simulationMark=performance.now();')
    edit(' if(draw)renderNight(dt)}',' if(gameActive)window.actionMetrics?.sample("simulation",performance.now()-simulationMark);if(draw)renderNight(dt)}')
    edit('function renderNight(dt){updatePresentation(dt);','function renderNight(dt){const renderMark=performance.now();updatePresentation(dt);')
    edit('renderer.render(phaseScreen,phaseCamera);','renderer.render(phaseScreen,phaseCamera);window.actionMetrics?.sample("render",performance.now()-renderMark);')
    edit('window.runtimePolishState=()=>({...runtimePolish,', 'window.runtimePolishState=()=>({...runtimePolish,actionCost:window.actionMetrics?.state(),')
    edit('function currentNavigationObjective(){','function currentNavigationObjective(){if(!sightlinePowersEnabled()&&window.actionWorld)return actionWorld.objective();')
    s=s.replace('if(courier.resultsOpen)return;', 'if(courier.resultsOpen&&sightlinePowersEnabled())return;').replace('if(courier.resultsOpen){','if(courier.resultsOpen&&sightlinePowersEnabled()){').replace('if(courier.resultsOpen||!gameReady)return;', 'if(courier.resultsOpen&&sightlinePowersEnabled()||!gameReady)return;').replace('gameActive&&!courier.resultsOpen','gameActive&&!(courier.resultsOpen&&sightlinePowersEnabled())').replace('if(pointer&&!courier.resultsOpen)', 'if(pointer&&!(courier.resultsOpen&&sightlinePowersEnabled()))')
    edit('function updateCourier(dt){if(courier.resultsOpen&&sightlinePowersEnabled())return;courier.clock+=dt;', 'function updateCourier(dt){if(courier.resultsOpen&&sightlinePowersEnabled())return;courier.clock+=dt;if(!sightlinePowersEnabled())courier.missionStarted+=dt;')
    edit('courier.trauma=Math.max(0,courier.trauma-dt*(recover?1.5:.15));','if(sightlinePowersEnabled())courier.trauma=Math.max(0,courier.trauma-dt*(recover?1.5:.15));')
    edit('if(courier.exposure>=100){finishCourierMission(true);return}', 'if(courier.exposure>=100&&sightlinePowersEnabled()){finishCourierMission(true);return}')
    edit('for(const c of courier.civilians){if(c.rescued)continue;c.ring.rotation.z+=dt*1.8;', 'if(!sightlinePowersEnabled())return;for(const c of courier.civilians){if(c.rescued)continue;c.ring.rotation.z+=dt*1.8;')
    a=s.index('quality=100+',s.index('function finishCourierMission'));b=s.index(';courier.lastRank=rank',a)
    s=s[:a]+"rank=actionWorld.rankCourier(failed).rank"+s[b:]
    section('(function replaceScenicStatue(){','// Surface damage', '// Progressive GLB scenic delivery is owned by actionWorld.\n\n')
    section('function updateDestruction(dt){','// Self-contained Web Audio:', 'function updateDestruction(dt){actionWorld.updateDebris(dt);}\n\n')
    edit("if(collapsed){point=point.clone();","if(broken||collapsed)actionWorld.markNavigationDirty();if(collapsed){point=point.clone();")
    edit('if(speed<7.5||performance.now()-destruction.last<130)return;destruction.last=performance.now();','if(!actionWorld.impactAllowed(speed))return;destruction.last=actionWorld.clock()*1000;')
    a=s.index(' const groundSpeed=Math.hypot(s.vel.x,s.vel.z);if(s.onGround&&!inputAiming()&&groundSpeed>1){',s.index('const gameAudio='));b=s.index(' this.cityTime+=dt;',a);s=s[:a]+' const groundSpeed=Math.hypot(s.vel.x,s.vel.z);window.actionFootsteps?.tick(dt,groundSpeed);\n'+s[b:]
    edit('character:window.characterState?.(),combat:', 'actionWorld:window.actionWorldState?.(),combatants:window.combatants?.state(),actionCamera:window.actionCamera?.state(),character:window.characterState?.(),combat:')
    # Keep modules in the build itself, assembled only from canonical sources.
    p=s.index('// Backspool action combat.')
    s=s[:p]+(ROOT/'scripts/game_action_foundation.js').read_text()+'\n'+(ROOT/'scripts/game_action_audio.js').read_text()+'\n'+(ROOT/'scripts/game_action_telemetry.js').read_text()+'\n'+s[p:]
    p=s.rfind('loadCharacter().');assert p>0
    s=s[:p]+(ROOT/'scripts/game_action_world.js').read_text()+'\n'+s[p:]
    edit('</style>',(ROOT/'scripts/game_action_world.css').read_text()+'\n</style>')
    edit("s.mode===P.TRANSIT?2.6:0,dt*7","s.mode===P.TRANSIT?2.6:sightlinePowersEnabled()?0:.32,dt*7")
    edit('<title>','<meta name="sightline-build" content="action-v2"><title>')
    s=s.replace("</body>", '<script src="scripts/game_motion_loadout.js"></script>\n</body>')
    staging=target.with_suffix(target.suffix+".tmp");staging.write_text(s);staging.replace(target)
    manifest={'version':2,'output':target.name,'sha256':hashlib.sha256(s.encode()).hexdigest(),'base':pinned,'modules':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted((ROOT/'scripts').glob('game_*.js')) if p.name.startswith(('game_backspool_','game_action_'))},'coreAssets':urls,'actionAssets':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted((ROOT/'assets/backspool').glob('action-v2-*'))}}
    manifest['motionLibrary']={'runtimeSha256':hashlib.sha256((ROOT/'scripts/game_motion_loadout.js').read_bytes()).hexdigest(),'catalogSha256':hashlib.sha256((ROOT/'assets/motion-library/catalog.json').read_bytes()).hexdigest(),'pageSha256':hashlib.sha256((ROOT/'NSUNSC_MOTION_LIBRARY.html').read_bytes()).hexdigest()}
    (ROOT/'output/action-v2').mkdir(parents=True,exist_ok=True)
    (ROOT/'output/action-v2/build-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    return target

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--output');p.add_argument('--promote',action='store_true');a=p.parse_args()
    candidate=build(a.output)
    if a.promote:
        active=ROOT/'SIGHTLINE_SAINT_MERIDIAN_TOON.html'; backup=ROOT/'.pre-action-v2.html'
        assert backup.exists(), 'Preserve pre-action backup before promotion'
        accepted=json.loads((ROOT/'output/action-v2/acceptance-summary.json').read_text());assert accepted['accepted'] and accepted['buildSha256']==hashlib.sha256(candidate.read_bytes()).hexdigest(), 'Candidate changed or acceptance not passed'
        staging=active.with_suffix('.html.tmp');staging.write_bytes(candidate.read_bytes());staging.replace(active)
    print(candidate)
