"""Seal a curated reliability checkpoint after terminal functional/timing jobs."""
from pathlib import Path
import hashlib,json
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();read=lambda f:json.loads((D/f).read_text())
b=read('V02_Civilian_Clearance_Build.json');checks=read('V02_Civilian_Clearance_Checks.json');perf=read('V02_Civilian_Clearance_Benchmark.json');proof=read('V02_Civilian_Clearance_Provenance.json')
assert checks['status'].startswith('PASS') and len(checks['jobs'])==8 and all(j['returncode']==0 for j in checks['jobs'])
assert checks['entrySHA256']==b['entrySHA256']==sha(R/b['entry'])
for f,h in checks['hashes'].items():assert sha(R/f)==h,f
assert perf['status'].startswith('MEASURED') and len(perf['runs'])==2
assert perf['runs'][1]['entrySHA256']==b['entrySHA256']
for run in perf['runs']:assert run['errors']==[] and run['simulationSeconds']==60
for f,h in perf['hashes'].items():assert sha(R/f)==h,f
assert proof['status'].startswith('PASS') and proof['entrySHA256']==b['entrySHA256'] and len(proof['preservedHTML'])==61
files={Path('README.md'),Path('progress.md'),Path(b['entry']),Path('SIGHTLINE_SAINT_MERIDIAN_V02_MARKET_CLEARANCE.html'),Path(b['worldLifeScript']),Path(b['marketScript'])}
scripts=['write_market_clearance_runtime.py','build_market_clearance_candidate.py','test_market_clearance_rescue.cjs','test_current_wall_contacts.cjs','test_current_landing_contacts.cjs','probe_current_ambient_clearance.cjs','test_visitor_clearance.cjs','write_visitor_clearance_runtime.py','build_civilian_clearance_candidate.py','civilian_test_readiness.cjs','test_civilian_world_life.cjs','test_civilian_room_movement.cjs','test_civilian_rescue.cjs','verify_civilian_room_result.py','run_civilian_clearance_checks.py','verify_civilian_clearance_provenance.py','benchmark_civilian_clearance.cjs','write_civilian_clearance_evidence.py','probe_civilian_room_failure.cjs']
files.update(Path('scripts/vertical-v02')/s for s in scripts)
for name in ['V02_Market_Hero_Overlap_Baseline.json','V02_Market_Clearance_Runtime.json','V02_Market_Clearance_Build.json','V02_Visitor_Clearance_Runtime.json','V02_Civilian_Clearance_Build.json','V02_Civilian_Clearance_Checks.json','V02_Civilian_Clearance_Room_Movement.json','V02_Civilian_Clearance_Room_Probe.json','V02_Civilian_Clearance_Life.json','V02_Civilian_Clearance_Benchmark.json','V02_Civilian_Clearance_Provenance.json','V02_CIVILIAN_CLEARANCE.md']:
 if(D/name).is_file():files.add((D/name).relative_to(R))
folders=['current-wall-contacts','current-landing-contacts','market-clearance-first-yield','market-clearance-public','market-clearance-public-v2','market-clearance-south-v2','market-clearance-lifecycle-v2','ambient-clearance-probe','ambient-clearance-candidate','visitor-clearance-baseline','visitor-clearance-candidate','civilian-clearance-first-room-failure','civilian-clearance-room-probe','civilian-clearance-dwell','civilian-clearance-world-life','civilian-clearance-room-movement','civilian-clearance-stock','civilian-clearance-public','civilian-clearance-south','civilian-clearance-lifecycle','civilian-clearance-gameplay','civilian-clearance-checks','civilian-clearance-benchmark']
for folder in folders:
 p=D/'evidence'/folder
 if p.is_dir():files.update(f.relative_to(R)for f in p.rglob('*')if f.is_file() and f.name!='.DS_Store')
for prefix in ['market-clearance-','ambient-clearance-','visitor-clearance-','civilian-clearance-']:
 files.update(f.relative_to(R)for f in (D/'evidence').glob(prefix+'*.log')if f.is_file())
index={'status':'SEALED bounded civilian reliability checkpoint; full V02 remains unfinished','entry':b['entry'],'entrySHA256':b['entrySHA256'],'preservationBaseCommit':proof['preservationBaseCommit'],'parentRoomEntrySHA256':read('V02_Furnished_Public_Rooms_Build.json')['entrySHA256'],'marketParentEntrySHA256':b['sourceSHA256'],'scope':'Actual NPC clearance repairs and current acceptance plus archived failures. Earlier furnished-parent wall/landing evidence retains its own entry identity. Timing measured, not a full performance gate. No default or older snapshot replacement.','artGate':'FAIL','fullRelease':'INCOMPLETE','artifacts':[{'file':str(f),'bytes':(R/f).stat().st_size,'sha256':sha(R/f)} for f in sorted(files)]}
out=D/'V02_Civilian_Clearance_Evidence.json';out.write_text(json.dumps(index,indent=2)+'\n');listed=[str(f)for f in sorted(files)]+[str(out.relative_to(R))]
local=R/'output/local-scratch/civilian-checkpoint';local.mkdir(parents=True,exist_ok=True);(local/'commit-files.json').write_text(json.dumps(listed,indent=2)+'\n')
print(index['status'],len(index['artifacts']),'artifacts',len(listed),'commit paths')
