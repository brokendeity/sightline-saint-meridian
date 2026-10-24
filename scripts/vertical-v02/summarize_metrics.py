from pathlib import Path
import json,gzip,math
D=Path(__file__).resolve().parents[2]/'development/vertical-city-v02'
a=json.loads((D/'V02_Movement_Measurements_Clean.json').read_text());c=json.loads((D/'V02_Cartridge_Measurements.json').read_text());chain=json.load(gzip.open(D/'V02_PhysicalChain_Traces.json.gz','rt'))
trials={t['name']:t for t in a['trials']};rows=[]
for name,t in trials.items():
 record={k:t[k]for k in ['name','distance','maxHeight','peakHorizontalSpeed','airborneAt','landedAt','flightDistance']}
 if 'jump'in name and t['flightDistance']:
  record['architecturePolicy']='Use <=70% of this tested flat-ground horizontal reach for unassisted gaps, with a full supported acceleration and landing pad; unequal-height routes require a new arc test.'
 if 'wall climb'in name:
  fs=[f for f in t['frames']if f.get('advancedMotion')=='wallClimb'];record['climbVerticalSpeedSamples']=[f['vel'][1]for f in fs];record['architecturePolicy']='Prefer <=12m wall stages with a supported shelf; 30m metrology wall did not certify any city wall.'
 if 'fall brake'in name:record['interpretation']='Held Jump is intentionally disabled for Float when window.threadrailGame exists. This is not a measured working brake. Drive brake needs physical bank and its own trial.'
 rows.append(record)
rail=[]
for r in chain['results']:
 if not r['pass']:continue
 fs=r['trace'];on=[f for f in fs if f['rail']]
 if not on:continue
 rail.append({'case':r['name'],'maxMeasuredRideSpeed':max(f['rail']['speed']for f in on),'railChanges':sum(bool(a['rail']and b['rail']and a['rail']['railId']!=b['rail']['railId'])for a,b in zip(fs,fs[1:])),'popEvents':[e for f in fs for e in f['railEvents']if e['type']=='jump'][:1],'finalSupported':fs[-1]['ground'] and abs(fs[-1]['p'][1]-fs[-1]['support'])<.05,'scope':'Legacy course geometry and normal key transitions; not a V02 route certificate'})
report={'entry':a['entry'],'entrySHA256':a['entrySHA256'],'fixtureClearance':'Every clean trial checks original city collision registries; fresh browser context and zero starting Drive bank. Temporary wall separately labelled.','movement':rows,'cartridge':[{'targetDistance':r['distance'],'formedRail':r['railCount']==1,'reason':r['message'],'flights':[s['flightSeconds']for s in r['shots']]}for r in c['results']],'railCourseSamples':rail,'sourceOnlyConstraints':{'span':[6,100],'slopeMax':55,'attachReach':2,'transferReachMax':3,'railMaxSpeed':28,'physicalThrowSpeed':42,'wallAgeMax':4.2,'boostCountMax':3},'failedLegacyCases':[{'name':r['name'],'error':r.get('error'),'disposition':'Open. Fixture/timing must be updated for physical asynchronous whip deployment before assessing a gameplay regression.'}for r in chain['results']if not r['pass']],'unmeasured':['Drive fall-brake with physical bank','exact 3m transfer boundary','normal-input V02 routes and safe landing envelopes']}
(D/'V02_Movement_Budgets.json').write_text(json.dumps(report,indent=2)+'\n')
print('Summarized',len(rows),'movement trials and',len(rail),'rail chains; open failures retained')
