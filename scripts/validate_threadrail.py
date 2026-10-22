"""Run reproducible candidate checks. Optional raw source evidence stays outside Git."""
import argparse,hashlib,json,os,subprocess,sys
from datetime import datetime,timezone
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def main():
 parser=argparse.ArgumentParser();parser.add_argument('--source-evidence',type=Path);parser.add_argument('--browser',action='store_true');args=parser.parse_args()
 out=ROOT/'output/threadrail';out.mkdir(parents=True,exist_ok=True);results=[];started=datetime.now(timezone.utc).isoformat();build=ROOT/'SIGHTLINE_BACKSPOOL_THREADRAIL_CANDIDATE.html';digest=hashlib.sha256(build.read_bytes()).hexdigest()
 def run(name,command,env=None):
  proc=subprocess.run(command,cwd=ROOT,env=env,capture_output=True,text=True)
  (out/(name+'.log')).write_text(proc.stdout+proc.stderr)
  results.append({'name':name,'command':command,'passed':proc.returncode==0,'exitCode':proc.returncode})
  print(('PASS 'if proc.returncode==0 else 'FAIL ')+name,flush=True)
 for name in ['afterstep_drive','threadrail','replay_route','threadrail_foundation','temporal_exhaust','movement_afterimages','threadrail_camera','threadrail_pose','backspool_flow','backspool_advanced','backspool_hop','backspool_traversal','backspool_roll_physics','forspoken_native_kernels','forspoken_contact_frames']:
  run(name,['node',str(ROOT/'scripts'/('test_'+name+'.cjs'))])
 run('landing_assets',[sys.executable,str(ROOT/'scripts/test_backspool_landing_roll_assets.py')])
 if args.source_evidence:
  evidence=str(args.source_evidence.resolve())
  code="import sys,unittest;from pathlib import Path;sys.path.insert(0,'scripts');import recover_forspoken_controller_contracts as a,recover_forspoken_biped_bindings as b;a.OUT=b.OUT=Path(sys.argv[1]);import test_forspoken_controller_contracts as c,test_forspoken_biped_bindings as d;r=unittest.TextTestRunner(verbosity=2).run(unittest.TestSuite([unittest.defaultTestLoader.loadTestsFromModule(c),unittest.defaultTestLoader.loadTestsFromModule(d)]));sys.exit(not r.wasSuccessful())"
  run('source_parameter_biped',[sys.executable,'-c',code,evidence])
  code="const fs=require('fs'),orig=fs.readFileSync;fs.readFileSync=function(file,...rest){if(file==='output/rea-forspoken/hu000-rig.json')file=process.argv[1]+'/hu000-rig.json';return orig.call(this,file,...rest)};require('./scripts/test_forspoken_pose_kernels.cjs')"
  run('source_pose_oracle',['node','-e',code,evidence])
 else:results.append({'name':'source_parameter_biped_pose','skipped':True,'reason':'Supply --source-evidence for26 original raw-data/source-oracle checks; archives are not shipped.'})
 if args.browser:
  run('integrated_input',['node','scripts/test_threadrail_browser.cjs'])
  run('device_route',['node','scripts/test_threadrail_inputs_route.cjs'])
  run('presentation_v2',['node','scripts/test_threadrail_presentation.cjs'])
  run('hero_switch',['node','scripts/test_threadrail_hero_switch.cjs'])
  run('integration_fixes',['node','scripts/test_threadrail_fix_regression.cjs'])
  run('eight_physical_chains',['node','scripts/test_threadrail_chains.cjs'])
  run('city_routes',['node','scripts/test_threadrail_city_routes.cjs'])
  run('controller_banking',['node','scripts/test_threadrail_controller_bank.cjs'])
  env={**os.environ,'GAME_URL':'http://127.0.0.1:8766/SIGHTLINE_BACKSPOOL_THREADRAIL_CANDIDATE.html?capture=backspool','GAME_ORIGIN':'http://127.0.0.1:8766','REGRESSION_BUILD':'SIGHTLINE_BACKSPOOL_THREADRAIL_CANDIDATE.html','REGRESSION_PRESET':'classic'}
  run('v15_landing_roll',['node','scripts/test_backspool_landing_roll.cjs'],env)
  run('retained_classic',['node','scripts/validate_traversal_regressions.cjs'],env)
  retained=ROOT/'output/backspool-traversal/baseline-retained-regressions.json'
  if retained.exists():(out/'retained-report.json').write_bytes(retained.read_bytes())
 (out/'validation-run.json').write_text(json.dumps({'startedAt':started,'buildSha256':digest,'buildSha256After':hashlib.sha256(build.read_bytes()).hexdigest(),'results':results,'allExecutedPassed':all(r.get('passed',True)for r in results)},indent=2)+'\n')
 if not all(r.get('passed',True)for r in results):raise SystemExit(1)
if __name__=='__main__':main()
