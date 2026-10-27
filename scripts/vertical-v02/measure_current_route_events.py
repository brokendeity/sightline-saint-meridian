"""Measure discrete native movement phases from retained normal-input traces.

Keep event timings distinct from graph-node passage certification. In particular,
the source graph's nominal Pop/landing points may differ from an executed early
Pop, recovery catch or blended rail attachment. Do not fill those graph timings
by silently treating nearby positions as identical.
"""
from pathlib import Path
import csv,gzip,hashlib,json,math
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
read=lambda p:json.loads(p.read_text())
run=read(D/'V02_Current_Station_Routes.json');assert run['status'].startswith('PASS')
assert sha(R/run['entry'])==run['entrySHA256'] and sha(R/run['manifest'])==run['manifestSHA256']
graph=read(D/'V02_Transit_Movement_Graph.json');edges={e['id']:e for e in graph['edges']};nodes={n['id']:n['position']for n in graph['nodes']}
records=[];sources={}
def load(job):
 p=D/job['report'];assert sha(p)==job['reportSHA256'];trace=D/job['trace'];assert sha(trace)==job['traceSHA256']
 r=json.loads(gzip.decompress(trace.read_bytes()));assert r['status'].startswith('PASS') and not r['errors'] and not r.get('failure')
 assert len(r['trace'])==r['traceFrames'] if 'traceFrames'in r else True
 sources[job['name']]={'report':job['report'],'reportSHA256':sha(p),'trace':job['trace'],'traceSHA256':sha(trace)}
 return r
def window(job,r,id,a,b,label):
 ts=r['trace'];assert 0<=a<b<len(ts);x,y=ts[a],ts[b];path=ts[a:b+1]
 assert all(t['trauma']==0 for t in path),'Injured movement is not accepted'
 e=edges[id];foot=lambda t:[t['p'][0],t['p'][1]-.42,t['p'][2]]
 start,end=foot(x),foot(y);release_before=len(x.get('releases',[]));released=y.get('releases',[])[release_before:]
 airborne=[i for i in range(a,b+1)if not ts[i]['grounded']]
 records.append({'edgeID':id,'run':job['name'],'ability':e['ability'],'boundary':label,
  'beginFrame':a+1,'endFrame':b+1,'inputSeconds':(b-a)/60,'sequenceClockSeconds':y['clock']-x['clock'],
  'boundaryResolutionSeconds':1/60,'actualStartFoot':start,'actualEndFoot':end,
  'plannedStart':nodes[e['source']],'plannedEnd':nodes[e['destination']],
  'startDistanceFromPlannedNode':math.dist(start,nodes[e['source']]),'endDistanceFromPlannedNode':math.dist(end,nodes[e['destination']]),
  'actualTravelMetres':sum(math.dist(p['p'],q['p'])for p,q in zip(path,path[1:])),
  'airborneFrames':len(airborne),'airborneSeconds':len(airborne)/60,
  'releases':released,'initialBank':x['bank'],'finalBank':y['bank'],
  'railStartAuthority':x.get('rail',{}).get('position')if x.get('rail')else None,
  'status':'MEASURED native event phase; exact planned-node passage is separate'})
def rails(r):
 ts=r['trace'];out=[]
 for i,t in enumerate(ts):
  if t.get('rail') and (not i or not ts[i-1].get('rail')):
   end=next(j for j in range(i+1,len(ts))if not ts[j].get('rail'))
   assert ts[end]['message']=='PERFECT RAIL POP'
   assert any(not ts[j]['grounded']for j in range(end,min(end+20,len(ts))))
   out.append((i,end))
 return out
def stage(r,name):
 ss=[s for s in r['stages']if s['name']==name];assert len(ss)==1,(name,len(ss));return ss[0]['frame']-1
for job in run['jobs']:
 if job['name'].startswith('public-'):continue
 r=load(job);ts=r['trace'];rs=rails(r)
 if job['name'].startswith('momentum-'):
  assert len(rs)==2
  for (a,b),rail,pop,height in zip(rs,['E0230','E0233'],['E0231','E0234'],[92.42,100.42]):
   window(job,r,rail,a,b,'First actual rail-current event through input-triggered Pop; includes native catch easing')
   landing=next(i for i in range(b+1,len(ts))if ts[i]['grounded']and abs(ts[i]['p'][1]-height)<.04)
   window(job,r,pop,b,landing,'Input-triggered Pop through first supported touchdown')
 else:
  assert len(rs)==1;a,b=rs[0];window(job,r,'E0246',a,b,'First actual upper rail-current event through input-triggered early Pop')
  land118=next(i for i in range(b+1,len(ts))if ts[i]['grounded']and abs(ts[i]['p'][1]-118.42)<.04)
  window(job,r,'E0247',b,land118,'Upper Pop through first supported118m touchdown')
  land108=stage(r,'recovery roof landing 108');land100=stage(r,'recovery roof landing 100')
  # The same 20 idle ticks follow each named touchdown in the retained test.
  # Begin after that deliberate stop; include the supported approach to the edge.
  window(job,r,'E0248',land118+20,land108,'After deliberate118m stop, supported walk-off and fall through108m touchdown')
  final=stage(r,'station objective reached')
  id='E0250'if job['name']=='mastery-brake'else'E0249'
  # This planned node IS actually crossed on the108m roof. Start at its
  # supported capture region instead of charging the preceding catch/exit to
  # the descent edge. Likewise stop on first station arrival, before its pause.
  foot=lambda t:[t['p'][0],t['p'][1]-.42,t['p'][2]]
  departure=next(i for i in range(land108+20,land100)if ts[i]['grounded']and math.dist(foot(ts[i]),nodes[edges[id]['source']])<.2)
  arrival=next(i for i in range(land100,final+1)if ts[i]['grounded']and math.dist(foot(ts[i]),nodes[edges[id]['destination']])<.2)
  window(job,r,id,departure,arrival,'Supported108m source-node capture through first supported station-node arrival; excludes setup/catch exit and final pause')
  if id=='E0250':assert len(records[-1]['releases'])==1 and records[-1]['releases'][0]['mode']=='brake'
  else:assert not records[-1]['releases']
  previous=stage(r,'mastery courtyard')
  for edge,height in zip(['E0238','E0239','E0240','E0241'],[96,108,120,128]):
   end=stage(r,'wall roof landing '+str(height))
   # First boundary is the actual input approach to the first wall, after the
   # courtyard-to-wall movement. Derive it from the continuous state change.
   if height==96:
    boost=stage(r,'wall boost to 96');previous=max(i for i in range(previous,boost)if ts[i]['grounded'])
   window(job,r,edge,previous,end,'Supported departure through next supported wall shelf; native wall boost and mantle retained')
   previous=end
ids={r['edgeID']for r in records};missing={e['id']for e in graph['edges']if e['expectedSeconds']is None}-ids;assert not missing,missing
discrepancies=[{k:r[k]for k in ['edgeID','run','actualStartFoot','actualEndFoot','plannedStart','plannedEnd','startDistanceFromPlannedNode','endDistanceFromPlannedNode']}for r in records if max(r['startDistanceFromPlannedNode'],r['endDistanceFromPlannedNode'])>.3]
result={'status':'PASS measured nine formerly untimed native ability phases and four wall ascents; planned-node reconciliation remains OPEN',
 'entry':run['entry'],'entrySHA256':run['entrySHA256'],'manifest':run['manifest'],'manifestSHA256':run['manifestSHA256'],
 'routeRunReportSHA256':sha(D/'V02_Current_Station_Routes.json'),'sourceGraphSHA256':sha(D/'V02_Transit_Movement_Graph.json'),
 'measurementSourceSHA256':sha(Path(__file__)),'sources':sources,'records':records,'distinctPreviouslyUntimedPhases':9,
 'plannedNodeDiscrepancies':discrepancies,'graphTimingFieldsChanged':False,
 'limits':['Timings are60Hz input-step intervals and the actual shared sequence-clock intervals, not wall-clock performance or human benchmarks.',
 'Event boundaries have one-frame quantization; native rail catch blends actor position toward the authoritative rail state.',
 'Some original planned Pop and landing nodes differ from the executed route. Exact graph endpoint/timing admission is OPEN; original graph null timings remain unchanged.',
 'End-to-end route acceptance and measured event phases do not certify every variant, between-sample camera visibility, physical devices or complete release quality.']}
(D/'V02_Current_Route_Event_Timings.json').write_text(json.dumps(result,indent=2)+'\n')
fields=['edgeID','run','ability','inputSeconds','sequenceClockSeconds','actualTravelMetres','startDistanceFromPlannedNode','endDistanceFromPlannedNode','boundary','status']
with(D/'V02_Current_Route_Event_Timings.csv').open('w',newline='')as f:
 w=csv.DictWriter(f,fieldnames=fields,lineterminator="\n");w.writeheader();w.writerows({k:r[k]for k in fields}for r in records)
print(result['status']);print('Records',len(records),'planned-node discrepancies',len(discrepancies))
