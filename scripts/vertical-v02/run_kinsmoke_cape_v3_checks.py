"""Run the full V02 regression set against the Kinsmoke cape v3 build (feature/kinsmoke worktree; a copy of
run_kinsmoke_checks.py pointed at V02_Kinsmoke_Cape_V3_Build.json), one browser at a time: the 25
jobs of run_hero_select_v3_checks.py (hero select through test_hero_select_v3_kinsmoke.cjs, the four-hero copy), plus
the Kinsmoke real-input test. loadout-hero runs test_loadout_hero_four_heroes.cjs (its chord has four stops now).
Ports: the suites hard-code http://127.0.0.1:8766/, which serves the main worktree for other sessions. Serve THIS worktree
on 8768 instead (python3 -m http.server 8768 --bind 127.0.0.1); every job runs with NODE_OPTIONS=--require
scripts/characters/kinsmoke/port_redirect_preload.cjs, a labelled test-harness preload that routes the browser's 8766
requests to 8768. No test or game file is edited by it.
Logs and evidence go to development/vertical-city-v02/evidence/kinsmoke-checks/ and the kinsmoke-* suite folders. Three
tests write to fixed tracked folders (friendly-contacts-wall / -landing, canonical-source): their output is copied here,
then those folders are restored to HEAD (the runner refuses to start if they already have local changes).
Usage: python3 -I run_kinsmoke_checks.py [first-job-name]"""
from pathlib import Path
import json,os,shutil,subprocess,sys,time
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';V='scripts/vertical-v02/';E=D/'evidence/kinsmoke-cape-v3-checks';E.mkdir(parents=True,exist_ok=True)
BUILD='V02_Kinsmoke_Cape_V3_Build.json';HTML='SIGHTLINE_SAINT_MERIDIAN_V02_KINSMOKE_CAPE_V3.html';GC='SIGHTLINE_SAINT_MERIDIAN_V02_HERO_SELECT_CARTRIDGE.html';fixed=['development/vertical-city-v02/evidence/friendly-contacts-wall','development/vertical-city-v02/evidence/friendly-contacts-landing','development/vertical-city-v02/evidence/canonical-source']
dirty=subprocess.run(['git','status','--porcelain','--',*fixed],cwd=R,capture_output=True,text=True).stdout.strip();assert not dirty,'fixed evidence folders have local changes:\n'+dirty
out=lambda n:'development/vertical-city-v02/evidence/kinsmoke-cape-v3-checks/'+n
jobs=[('smoke',['node',V+'test_canonical_smoke.cjs',BUILD],{},fixed[2]),
 ('threadrail-grind',['node',V+'test_threadrail_grind.cjs'],{'V02_ACTION_BUILD':BUILD,'V02_GRIND_OUT':out('threadrail-grind'),'V02_GRIND_CONTROL':GC},None),
 ('hero-select',['node',V+'test_hero_select_v3_kinsmoke.cjs',BUILD],{'V02_HERO_SELECT_OUT':out('hero-select'),'V02_PORT':'8768'},None),
 ('wall-contacts',['node',V+'test_friendly_wall_contacts.cjs'],{'V02_ACTION_BUILD':BUILD},fixed[0]),
 ('landing-contacts',['node',V+'test_friendly_landing_contacts.cjs'],{'V02_ACTION_BUILD':BUILD},fixed[1]),
 ('city-loops',['node',V+'test_current_city_loops.cjs'],{'V02_LOOP_BUILD':BUILD,'V02_LOOP_REPORT':'V02_Kinsmoke_Cape_V3_Loops.json','V02_LOOP_RUN':'kinsmoke-cape-v3-loops'},None),
 ('station-routes',['python3',V+'run_current_station_routes.py'],{'V02_ROUTE_BUILD_REPORT':BUILD,'V02_ROUTE_REPORT':'V02_Kinsmoke_Cape_V3_Station_Routes.json','V02_ROUTE_SUITE':'kinsmoke-cape-v3-station-routes'},None),
 ('retained-gameplay',['python3',V+'run_friendly_gameplay_regressions.py'],{'V02_GAMEPLAY_BUILD':BUILD,'V02_GAMEPLAY_SUITE':'kinsmoke-cape-v3-gameplay'},None),
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
 ('menu',['node',V+'test_menu_style.cjs'],{'V02_ACTION_BUILD':BUILD,'V02_MENU_OUT':out('menu')},None),
 ('loadout-hero',['node','scripts/characters/kinsmoke/test_loadout_hero_four_heroes.cjs'],{'LOADOUT_HERO_BUILD':HTML,'LOADOUT_HERO_OUT':out('loadout-hero')},None),
 ('loadout-runner-roles',['node','scripts/characters/loadout/test_loadout_runner_real_input.cjs'],{'LOADOUT_RUNNER_BUILD':HTML,'LOADOUT_RUNNER_OUT':out('loadout-runner-roles'),'LOADOUT_RUNNER_FULL_OFF':'1'},None),
 ('backspool-costume',['node','scripts/characters/backspool/test_backspool_costume_real_input.cjs'],{'BSC_BUILD':HTML,'BSC_OUT':out('backspool-costume')},None),
 ('costume-combat',['node',V+'test_mixamo_combat.cjs'],{'V02_ACTION_BUILD':BUILD,'V02_COMBAT_OUT':out('costume-combat'),'V02_BACKSPOOL_COSTUME':'halfmask'},None),
 ('costume-grind',['node',V+'test_threadrail_grind.cjs'],{'V02_ACTION_BUILD':BUILD,'V02_GRIND_OUT':out('costume-grind'),'V02_GRIND_CONTROL':GC,'V02_BACKSPOOL_COSTUME':'halfmask'},None),
 ('loadout-runner-full',['node','scripts/characters/loadout/test_loadout_runner_full_real_input.cjs'],{'LRF_BUILD':HTML,'LRF_OUT':out('loadout-runner-full')},None),
 ('kinsmoke',['node','scripts/characters/kinsmoke/test_kinsmoke_real_input.cjs'],{'KSM_BUILD':HTML,'KSM_OUT':out('kinsmoke'),'V02_PORT':'8768'},None)]
PRE={'NODE_OPTIONS':'--require "'+str(R/'scripts/characters/kinsmoke/port_redirect_preload.cjs')+'"','V02_REDIRECT_PORT':'8768'}
names=[j[0] for j in jobs];start=names.index(sys.argv[1]) if len(sys.argv)>1 else 0
summaryFile=E/'summary.json';summary=json.loads(summaryFile.read_text()) if start and summaryFile.exists() else {'build':BUILD,'results':{}}
for name,cmd,env,fixedOut in jobs[start:]:
 t0=time.monotonic();print('START',name,flush=True)
 with open(E/(name+'.log'),'w') as log:rc=subprocess.run(cmd,cwd=R,env={**os.environ,**PRE,**env},stdout=log,stderr=subprocess.STDOUT).returncode
 if fixedOut:
  dst=E/(Path(fixedOut).name);shutil.rmtree(dst,ignore_errors=True);shutil.copytree(R/fixedOut,dst)
  subprocess.run(['git','restore','--source=HEAD','--worktree','--',fixedOut],cwd=R,check=True);subprocess.run(['git','clean','-fdq','--',fixedOut],cwd=R,check=True)
 tail=(E/(name+'.log')).read_text().strip().splitlines()[-3:]
 summary['results'][name]={'status':'PASS' if rc==0 else 'FAIL','returncode':rc,'wallSeconds':round(time.monotonic()-t0,1),'command':' '.join(cmd),'environment':env,'logTail':tail}
 summaryFile.write_text(json.dumps(summary,indent=1)+'\n');print(summary['results'][name]['status'],name,rc,flush=True)
print('DONE',sum(r['status']=='PASS' for r in summary['results'].values()),'of',len(summary['results']),'PASS')
