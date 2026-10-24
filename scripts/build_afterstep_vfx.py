from pathlib import Path
import hashlib,json,subprocess
ROOT=Path(__file__).resolve().parents[1]
def main():
 base=ROOT/'SIGHTLINE_BACKSPOOL_VAULT_PLAYGROUND.html'
 s=base.read_text()
 # Do not rebuild the base from another entrypoint or restore older gameplay.
 old=subprocess.check_output(['git','show','4f72727:SIGHTLINE_BACKSPOOL_VAULT_PLAYGROUND.html'],cwd=ROOT)
 assert base.read_bytes()==old,'Wall-fix base changed; audit before making a new VFX candidate.'
 for name,marker in [('game_temporal_exhaust.js','/* Temporal Exhaust:'),('game_movement_afterimages.js','/* Actual posed body snapshots')]:
  a=s.index(marker);end="})(typeof window!=='undefined'?window:globalThis);";b=s.index(end,a)+len(end)
  s=s[:a]+(ROOT/'scripts'/name).read_text().rstrip()+s[b:]
 s=s.replace('/* Temporal Exhaust:',(ROOT/'scripts/game_afterstep_vfx_config.js').read_text()+'\n/* Temporal Exhaust:',1)
 marker='const api={cameraComposition,toggleDiagnostics:'
 assert s.count(marker)==1
 s=s.replace(marker,"const api={configureVfx:patch=>({exhaust:exhaust.configure(patch),afterimages:afterimages.configure(patch)}),cameraComposition,toggleDiagnostics:")
 # Stop future emissions on committed hit reactions; existing world fragments fade.
 marker='exhaust.update(dt,{model,hero:'
 assert s.count(marker)==1
 s=s.replace(marker,"exhaust.update(dt,{interrupted:backspoolCombat.staggered()||[P.IMPACT,P.LANDING,P.UNCONTROLLED].includes(s.mode),model,hero:")
 marker="afterimages.update(dt,{model,hero:"
 assert s.count(marker)==1
 s=s.replace(marker,"afterimages.update(dt,{interrupted:backspoolCombat.staggered()||[P.IMPACT,P.LANDING,P.UNCONTROLLED].includes(s.mode),model,hero:")
 # Sightline retains its red flight trail; Backspool uses Temporal Exhaust.
 marker='const flying=!s.onGround&&s.mode!==P.UNCONTROLLED&&s.mode!==P.IMPACT;'
 assert s.count(marker)==1
 s=s.replace(marker,"if(characterState().active==='backspool'){this.reset();return;}"+marker)
 s=s.replace("afterimages.update(dt,{interrupted:","afterimages.update(dt,{motionTrace:!backspoolPreviewActive()&&/flip/i.test(backspoolFlowState().action||''),interrupted:")
 # Disable old foot ribbons only in this candidate.
 marker="const moving=enabled()&&gameActive&&!backspoolPreviewActive()&&(Math.hypot(s.vel.x,s.vel.z)>9||controller.state().action?.endsWith('Flip'));"
 assert s.count(marker)==1
 s=s.replace(marker,'const moving=false;')
 marker='exhaust.update(dt,{interrupted:'
 assert s.count(marker)==1
 s=s.replace(marker,"exhaust.update(dt,{motionTrace:!backspoolPreviewActive()&&(Math.hypot(s.vel.x,s.vel.z)>9||/flip/i.test(backspoolFlowState().action||'')),interrupted:")
 # The public tuning API is visual only and preserves all gameplay methods.
 marker='window.threadrailGame=api;'
 assert s.count(marker)==1
 s=s.replace(marker,"window.afterstepVfx={configure:patch=>api.configureVfx(patch),state:()=>({exhaust:exhaust.state(),afterimages:afterimages.state()})};"+marker)
 s=s.replace('<title>','<title>Reference Afterstep VFX — ',1)
 target=ROOT/'SIGHTLINE_BACKSPOOL_AFTERSTEP_VFX.html';target.write_text(s)
 (ROOT/'output/afterstep-vfx/build.json').write_text(json.dumps({'file':target.name,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'base':base.name,'baseSha256':hashlib.sha256(base.read_bytes()).hexdigest(),'gameplayChanges':False},indent=2)+'\n')
 print(target)
if __name__=='__main__':main()
