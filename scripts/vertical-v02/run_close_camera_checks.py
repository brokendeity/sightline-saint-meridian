"""Run the 16-step V02 regression set against the close-camera candidate, one browser at a time.

Same scripts as the Loadout Runner checks, pointed at V02_Close_Camera_Build.json. Logs and evidence go to
development/vertical-city-v02/evidence/close-camera-checks/ and the close-camera-* suite folders. Two tests
write to fixed tracked folders (friendly-contacts-wall / -landing): their output is copied here, then those folders are
restored to HEAD (the runner refuses to start if they already have local changes).
Usage: python3 -I run_close_camera_checks.py [first-job-name]"""
from pathlib import Path
import json,os,shutil,subprocess,sys,time
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';V='scripts/vertical-v02/';E=D/'evidence/close-camera-checks';E.mkdir(parents=True,exist_ok=True)
BUILD='V02_Close_Camera_Build.json';fixed=['development/vertical-city-v02/evidence/friendly-contacts-wall','development/vertical-city-v02/evidence/friendly-contacts-landing']
dirty=subprocess.run(['git','status','--porcelain','--',*fixed],cwd=R,capture_output=True,text=True).stdout.strip();assert not dirty,'fixed evidence folders have local changes:\n'+dirty
out=lambda n:'development/vertical-city-v02/evidence/close-camera-checks/'+n
jobs=[('wall-contacts',['node',V+'test_friendly_wall_contacts.cjs'],{'V02_ACTION_BUILD':BUILD},fixed[0]),
 ('landing-contacts',['node',V+'test_friendly_landing_contacts.cjs'],{'V02_ACTION_BUILD':BUILD},fixed[1]),
 ('city-loops',['node',V+'test_current_city_loops.cjs'],{'V02_LOOP_BUILD':BUILD,'V02_LOOP_REPORT':'V02_Close_Camera_Loops.json','V02_LOOP_RUN':'close-camera-loops'},None),
 ('station-routes',['python3',V+'run_current_station_routes.py'],{'V02_ROUTE_BUILD_REPORT':BUILD,'V02_ROUTE_REPORT':'V02_Close_Camera_Station_Routes.json','V02_ROUTE_SUITE':'close-camera-station-routes'},None),
 ('retained-gameplay',['python3',V+'run_friendly_gameplay_regressions.py'],{'V02_GAMEPLAY_BUILD':BUILD,'V02_GAMEPLAY_SUITE':'close-camera-gameplay'},None),
 ('strides',['node',V+'test_forspoken_strides.cjs'],{'V02_ACTION_BUILD':BUILD,'V02_STRIDES_OUT':out('strides')},None),
 ('vaults',['node',V+'test_forspoken_vaults.cjs'],{'V02_ACTION_BUILD':BUILD,'V02_VAULTS_OUT':out('vaults')},None),
 ('air',['node',V+'test_forspoken_air.cjs'],{'V02_ACTION_BUILD':BUILD,'V02_AIR_OUT':out('air')},None),
 ('crouch',['node',V+'test_forspoken_crouch.cjs'],{'V02_ACTION_BUILD':BUILD,'V02_CROUCH_OUT':out('crouch')},None),
 ('combat',['node',V+'test_mixamo_combat.cjs'],{'V02_ACTION_BUILD':BUILD,'V02_COMBAT_OUT':out('combat')},None),
 ('sightline',['node',V+'test_sightline_melee.cjs'],{'V02_ACTION_BUILD':BUILD,'V02_SIGHTLINE_OUT':out('sightline')},None),
 ('rhythm',['node',V+'test_burst_rhythm.cjs'],{'V02_ACTION_BUILD':BUILD,'V02_RHYTHM_OUT':out('rhythm')},None),
 ('themed',['node',V+'test_themed_slots.cjs'],{'V02_ACTION_BUILD':BUILD,'V02_THEMED_OUT':out('themed')},None),
 ('impact',['node',V+'test_impact_fx.cjs'],{'V02_ACTION_BUILD':BUILD,'V02_IMPACT_OUT':out('impact')},None),
 ('no-trucks',['node',V+'test_no_halo_trucks.cjs'],{'V02_ACTION_BUILD':BUILD,'V02_TRUCKS_OUT':out('no-trucks')},None),
 ('menu',['node',V+'test_menu_style.cjs'],{'V02_ACTION_BUILD':BUILD,'V02_MENU_OUT':out('menu')},None)]
names=[j[0] for j in jobs];start=names.index(sys.argv[1]) if len(sys.argv)>1 else 0
summaryFile=E/'summary.json';summary=json.loads(summaryFile.read_text()) if start and summaryFile.exists() else {'build':BUILD,'results':{}}
for name,cmd,env,fixedOut in jobs[start:]:
 t0=time.monotonic();print('START',name,flush=True)
 with open(E/(name+'.log'),'w') as log:rc=subprocess.run(cmd,cwd=R,env={**os.environ,**env},stdout=log,stderr=subprocess.STDOUT).returncode
 if fixedOut:
  dst=E/(Path(fixedOut).name);shutil.rmtree(dst,ignore_errors=True);shutil.copytree(R/fixedOut,dst)
  subprocess.run(['git','restore','--source=HEAD','--worktree','--',fixedOut],cwd=R,check=True);subprocess.run(['git','clean','-fdq','--',fixedOut],cwd=R,check=True)
 tail=(E/(name+'.log')).read_text().strip().splitlines()[-3:]
 summary['results'][name]={'status':'PASS' if rc==0 else 'FAIL','returncode':rc,'wallSeconds':round(time.monotonic()-t0,1),'command':' '.join(cmd),'environment':env,'logTail':tail}
 summaryFile.write_text(json.dumps(summary,indent=1)+'\n');print(summary['results'][name]['status'],name,rc,flush=True)
print('DONE',sum(r['status']=='PASS' for r in summary['results'].values()),'of',len(summary['results']),'PASS')
