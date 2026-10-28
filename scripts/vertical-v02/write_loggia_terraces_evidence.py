"""Bind current loggia evidence only after the serial candidate checks finish.

This certifies the listed bounded checks. Full reference-quality and combined
release acceptance are deliberately separate and cannot be promoted here.
"""
from pathlib import Path
import hashlib,json,re,subprocess
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';read=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
b=read(D/'V02_Loggia_Terraces_Build.json');a=read(D/'V02_Loggia_Terraces_Authoring.json')
for k in ['entry','manifest','script','materialContract','hudScript','source','sourceScript','sourceHUDScript']:assert sha(R/b[k])==b[k+'SHA256'],k
assert sha(R/a['master'])==a['masterSHA256']and sha(R/a['sourceMaster'])==a['sourceMasterSHA256']
names=['Master_Validation','Exports','Clearance','Package','Native','Blender','Admission','Admission_Validation','Vehicle_Bounds','Checks','Routes','Loops','HUD']
reports={key:read(D/('V02_Loggia_Terraces_'+key+'.json'))for key in names}
for name,d in reports.items():assert d['status'].startswith('PASS'),(name,d['status'])
n=reports['Native'];assert n['entrySHA256']==b['entrySHA256']and n['manifestSHA256']==b['manifestSHA256'];assert sha(D/n['fullTrace'])==n['fullTraceSHA256']
assert n['traceFrames']>0 and len(n['framing'])==52 and not n['framingFailures']and not n['cameraOpaqueInside']and not n['errors']
assert n['preservation']['originalBuildings']==310 and n['preservation']['roads']==642 and n['preservation']['lights']==9
assert reports['Master_Validation']['masterSHA256']==a['masterSHA256'];assert reports['Blender']['masterSHA256']==a['masterSHA256']and reports['Blender']['nativeReportSHA256']==sha(D/'V02_Loggia_Terraces_Native.json')
for name in ['Package','Exports','Admission','Admission_Validation']:assert reports[name]['manifestSHA256']==b['manifestSHA256']
assert all(sha(R/f)==h for f,h in reports['Checks']['identities'].items());assert reports['Checks']['identities'][b['hudScript']]==b['hudScriptSHA256']
assert len(reports['Routes']['jobs'])==6 and all(j['returncode']==0 for j in reports['Routes']['jobs']);assert len(reports['HUD']['results'])==18 and len(reports['HUD']['serviceFraming'])==2
assert all(p['framed']for row in reports['HUD']['serviceFraming']for p in row['points'])
vehicles=reports['Vehicle_Bounds'];assert all(sha(R/f)==h for f,h in vehicles['hashes'].items());assert vehicles['bounds']['maximumTrainRadius']<=reports['Clearance']['train']['radius'];assert vehicles['bounds']['maximumAirRadius']<=reports['Clearance']['airRadius']
chain=read(D/'V02_Loggia_Candidate_Validation.json');assert chain['status'].startswith('PASS')and all(sha(R/f)==h for f,h in chain['hashes'].items())
game=read(D/'evidence/loggia-terraces-gameplay/run.json');assert game['status'].startswith('PASS')and len(game['jobs'])==12 and all(j['returncode']==0 for j in game['jobs']);assert all(sha(R/f)==h for f,h in game['hashes'].items())
bench=read(D/'V02_Loggia_Terraces_Benchmark.json');assert bench['status'].startswith('MEASURED')and len(bench['runs'])==2;assert all(sha(R/f)==h for f,h in bench['hashes'].items())
for run in bench['runs']:
 assert sha(R/run['entry'])==run['entrySHA256'];assert run['simulationSeconds']==60 and run['wallSeconds']>=60 and run['internalResolution']==[1280,800]and run['distance']>500 and not run['errors'];assert run['gpuTimeMs']['samples']>100 and run['gpuTiming']['disjointSamples']==0
assert bench['comparison']['maxPositionDifference']==bench['comparison']['maxCameraDifference']==0
# Invert only the documented entry selectors. No gameplay owner is replaced.
old=(R/b['source']).read_text();current=(R/b['entry']).read_text();oldHUD=re.search(r'scripts/game_vertical_hud_v02\.js(?:\?v=[^\"]+)?',old).group();newHUD=b['hudScript']+'?v='+b['hudScriptSHA256'][:12]
current=current.replace("(state.pilot?'pilot':'loggia-terraces/runtime')","(state.pilot?'pilot':'maintenance-access/runtime')",1).replace(b['script']+'?v='+b['scriptSHA256'][:12],b['sourceScript']+'?v='+b['sourceScriptSHA256'][:12],1).replace(newHUD,oldHUD,1)
assert current==old,'Undeclared entry change';assert (R/b['script']).read_text().replace('assets/city/vertical-v02/loggia-terraces/materials.json','assets/city/vertical-v02/material-response/materials.json',1)==(R/b['sourceScript']).read_text()
sourceHUD=(R/b['sourceHUDScript']).read_text();hud=(R/b['hudScript']).read_text().replace("['v02MarketHUD','v02PursuitHUD','v02EncounterHUD',","['v02MarketHUD','v02PursuitHUD',")
newOrder="const activeContract=window.actionWorldState?.().contracts.active,contractOwnsSparring=activeContract&&['active','paused','defeat'].includes(activeContract.status)&&activeContract.encounterAttempt===window.backspoolEncounterState?.().attempt;const contextOrder=contractOwnsSparring?['v02MarketHUD','v02PursuitHUD','heroContractHUD','backspoolTrainingHUD']:['v02MarketHUD','v02PursuitHUD','backspoolTrainingHUD','heroContractHUD'];let primary=false;for(const id of contextOrder)"
oldOrder="let primary=false;for(const id of ['v02MarketHUD','v02PursuitHUD','backspoolTrainingHUD','heroContractHUD'])";assert hud.count(newOrder)==1;assert hud.replace(newOrder,oldOrder,1)==sourceHUD
protected=[];revision=subprocess.check_output(['git','log','-1','--format=%H','--',b['source']],cwd=R,text=True).strip()
for f in subprocess.check_output(['git','ls-tree','-r','--name-only',revision],cwd=R,text=True).splitlines():
 if f.startswith('SIGHTLINE')and f.endswith('.html')and '/'not in f:
  original=subprocess.check_output(['git','show',revision+':'+f],cwd=R);assert(R/f).read_bytes()==original,f;protected.append({'entry':f,'sha256':sha(R/f)})
files=[R/b['entry'],R/b['script'],R/b['hudScript'],R/a['master'],R/a['sourceMaster'],D/'V02_LOGGIA_TERRACES.md',D/'V02_Loggia_Movement_Graph.json',D/'V02_Loggia_AbilityRoute_Matrix.csv']
files+=list((R/'assets/city/vertical-v02/loggia-terraces').rglob('*'));files+=list(D.glob('V02_Loggia*.json'))
for folder in ['loggia-terraces','loggia-terraces-checks','loggia-terraces-routes','loggia-terraces-loops','loggia-terraces-hud','stock-loggia-terraces','loggia-terraces-benchmark','loggia-terraces-gameplay','loggia-candidate-validation']:files+=list((D/'evidence'/folder).rglob('*'))
files+=list((R/'scripts/vertical-v02').glob('*loggia*'));files+=list((D/'drawings/loggia-terraces').rglob('*'));files=sorted(set(p for p in files if p.is_file()and p.name!='V02_Loggia_Terraces_Evidence.json'))
result={'status':'PASS bounded current loggia source/native/routes/12gameplay/input checkpoint; full V02 goal INCOMPLETE','entry':b['entry'],'entrySHA256':b['entrySHA256'],'manifest':b['manifest'],'manifestSHA256':b['manifestSHA256'],'master':a['master'],'masterSHA256':a['masterSHA256'],'sourceMaster':a['sourceMaster'],'sourceMasterSHA256':a['sourceMasterSHA256'],'originalPreservation':n['preservation'],'additions':3109,'controlledOldRailChanges':6,'newDynamicLights':0,'newGraphNodes':9,'newDirectedEdges':22,'publicStair':{'flights':26,'simulationSeconds':n['simSeconds'],'metres':n['distance'],'traceFrames':n['traceFrames'],'framingScope':'Head/hips on every flight up and down; not full-body/every-orbit certification'},'hudFixes':['Owning street contract has priority over its internal sparring panel','Service-yard panel participates in shared responsive context stack'],'loadedVehicleRadiusProof':{'train':vehicles['bounds']['maximumTrainRadius'],'air':vehicles['bounds']['maximumAirRadius'],'scope':vehicles['scope']},'protectedPreviousEntries':protected,'protectedBaselineRevision':revision,'fullApprovedReferenceVisualQuality':'FAIL','fullGoalComplete':False,'unresolved':['Substantial approved-reference facade/massing/material/light refinement','Remaining current mission/destruction/failure regressions and complete release coverage','Final combined sustained combat/replay/destruction/city performance and GPU optimization','Broader camera and physical controller/touchscreen playtesting'],'limitations':['Static local reflection probe does not update after destruction or for dynamic transit','Not every parent graph edge is independently recertified by the22edge admission','Bounded benchmark has no combat/replay/destruction stress; endpoint images follow synthetic inactive flag','GPU and frame-tail cost observations are not optimization claims; heap/drop counters have stated scope limitations'],'artifacts':[{'file':str(p.relative_to(R)),'sha256':sha(p),'bytes':p.stat().st_size}for p in files]}
(D/'V02_Loggia_Terraces_Evidence.json').write_text(json.dumps(result,indent=2)+'\n');print(result['status'],len(files),'artifacts',len(protected),'protected entries',flush=True)
