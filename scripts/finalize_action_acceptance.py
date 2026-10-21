from pathlib import Path
import json,hashlib,subprocess
root=Path(__file__).resolve().parents[1];out=root/'output/action-v2'
def read(name):return json.loads((out/name).read_text())
def flatten(value):
    if isinstance(value,list):
        for child in value:yield from flatten(child)
    elif isinstance(value,dict):
        if 'pass' in value:yield value
        else:
            for child in value.values():yield from flatten(child)
suites=[]
for name,file in [('City/world retained','retained-regressions.json'),('Gameplay/lifecycle ported','retained-updated-results.json'),('Native jacket transitions ported','jacket-transitions-tests-results.json'),('Action controller','combat-results.json'),('Integration','integration-tests-results.json'),('36 moves and input acceptance','acceptance-tests-results.json'),('Asset integrity and dense skin validation','asset-validation.json'),('Height-aware navigation and defeat','profile-results.json'),('Visible plaza beacon and contact shadow','ground-visual-results.json'),('Three contracts, Echo, actual enemy defeat and retry','contract-cycle-e2e-results.json')]:
    data=read(file);rows=list(flatten(data));errors=[]
    for item in data.get('results',[]):
        if 'error' in item:errors.append(item['error'])
    errors+=data.get('errors',[])
    suites.append({'name':name,'file':file,'passed':sum(row['pass'] for row in rows),'total':len(rows),'failures':[row['name'] for row in rows if not row['pass']],'errors':errors})
dom=read('dom-input.json');suites.append({'name':'Immediate real DOM press','file':'dom-input.json','passed':int(dom['immediatePress']),'total':1,'failures':[] if dom['immediatePress'] else ['DOM press'],'errors':[]})
errors=read('console-errors.json')+read('delivery-console-errors.json')
candidate=root/'SIGHTLINE_ACTION_V2_CANDIDATE.html';digest=hashlib.sha256(candidate.read_bytes()).hexdigest();before=candidate.read_bytes()
subprocess.run(['python3',str(root/'scripts/build_action_game.py')],cwd=root,check=True,capture_output=True)
reproducible=candidate.read_bytes()==before
performance=read('performance.json');baseline=next(p for p in performance if p['file']=='.pre-action-v2.html');current=next(p for p in performance if p['file']==candidate.name)
perf=current['result'];old=baseline['result'];performance_ok=current.get('buildSha256')==digest and not current['errors'] and perf['peakSlots']==3 and perf['frameIntervals']['p50']<=old['frameIntervals']['p50']*1.10 and perf['drawCalls']['p95']<=old['drawCalls']['p95']+20
accepted=all(s['total'] and s['passed']==s['total'] and not s['errors'] for s in suites) and not errors and reproducible and performance_ok
summary={'accepted':accepted,'buildSha256':digest,'backup':'.pre-action-v2.html','backupSha256':hashlib.sha256((root/'.pre-action-v2.html').read_bytes()).hexdigest(),'reproducible':reproducible,'passed':sum(s['passed'] for s in suites),'total':sum(s['total'] for s in suites),'suites':suites,'consoleErrors':errors,'performanceAccepted':performance_ok,'performance':performance,'legacyMigration':{'originalAssertions':471,'retainedOrPorted':300,'replacedForIntentionalDesignChanges':171,'originalTestSourcesPreserved':True},'remainingReleaseChecks':['Physical standard controller and hardware hero-switch chord','Physical touchscreen playtest','Human playthrough of both heroes missions across supported browsers'],'scopePreserved':['GitHub snapshots','Blender city','Unity preview','City footprints and established Sightline controls']}
(out/'acceptance-summary.json').write_text(json.dumps(summary,indent=2)+'\n')
lines=['# Action v2 acceptance evidence','',f"Automated gate: **{'PASS' if accepted else 'FAIL'}** — {summary['passed']}/{summary['total']} checks. Candidate SHA-256: `{digest}`.",'', '| Suite | Passed |','| --- | ---: |']
lines += [f"| {s['name']} | {s['passed']}/{s['total']} |" for s in suites]
lines += ['', '## Fixed-view 60-second comparison','', '| Measurement | Previous | Action v2 |','| --- | ---: | ---: |']
for label,key in [('Frame interval p50 (ms)','frameIntervals'),('Simulation CPU p50 (ms)','simulationCPU'),('Render submission CPU p50 (ms)','renderSubmissionCPU'),('Visible draw calls p50','drawCalls')]:lines.append(f"| {label} | {old[key]['p50']:.2f} | {perf[key]['p50']:.2f} |")
if old.get('gpuTiming') and perf.get('gpuTiming'):lines.append(f"| GPU timer p50 (ms) | {old['gpuTiming']['p50']:.2f} | {perf['gpuTiming']['p50']:.2f} |")
lines += [f"| Dropped simulation time (s) | {old['droppedSimulationSeconds']:.3f} | {perf['droppedSimulationSeconds']:.3f} |",'', 'Chromium/Metal, 1280 × 720, identical camera and scripted combat/three-slot/drone/debris scenario. Audio processing enabled with zero output volume. These are local measurements, not a frame-rate guarantee on other devices. Raw p50/p95 and GPU query data are in performance.json.','', 'All original 471 test sources remain preserved. 300 assertions are retained/ported; 171 old playlist, roster and animation-ownership expectations are replaced by the new action/asset/end-to-end checks. Physical controller/touchscreen and human mission playtesting remain separate release checks.']
(out/'EVIDENCE.md').write_text('\n'.join(lines)+'\n')
print(json.dumps({k:summary[k] for k in ['accepted','passed','total','reproducible','performanceAccepted','buildSha256']},indent=2))
if not accepted:print([(s['name'],s['failures'],s['errors']) for s in suites if s['passed']!=s['total'] or s['errors']]);raise SystemExit(1)
