"""Admit only the measured upper-rail/Pop phases on the current candidate.

Parent graph, gameplay and geometry stay immutable. Contact nodes describe
receiving surfaces, never pretend a cartridge contact is a player foot position.
All other parent evidence remains explicitly inherited, not recertified.
"""
from pathlib import Path
import copy,gzip,hashlib,json,math
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02'
read=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
parent=D/'V02_Loggia_Movement_Graph.json';g=copy.deepcopy(read(parent))
b=read(D/'V02_Upper_Anchor_Build.json');suiteFile=D/'V02_Upper_Anchor_Station_Routes.json';suite=read(suiteFile)
assert suite['status'].startswith('PASS')and len(suite['jobs'])==6
for key in ['entrySHA256','manifestSHA256']:assert suite[key]==b[key]
assert sha(R/b['entry'])==b['entrySHA256']and sha(R/b['manifest'])==b['manifestSHA256']
manifest=read(R/b['manifest']);nativeFile=D/'V02_Upper_Anchor_Native.json';native=read(nativeFile)
assert native['status'].startswith('PASS')and native['entrySHA256']==b['entrySHA256']and native['manifestSHA256']==b['manifestSHA256']
nodes={n['id']:n for n in g['nodes']};edges={e['id']:e for e in g['edges']};sources={};records=[];canonical={}
for job in suite['jobs']:
 p=D/job['report'];t=D/job['trace'];assert sha(p)==job['reportSHA256']and sha(t)==job['traceSHA256']
 if job['name']not in ['mastery-zero','mastery-brake']:continue
 r=read(p);trace=json.loads(gzip.decompress(t.read_bytes()))['trace'];stages=r['stages']
 assert r['status'].startswith('PASS')and not r.get('failure')and not r['errors']
 def stage(name):return [s for s in stages if s['name']==name][-1]
 catch=stage('rail attached');pop=stage('near-end Pop');landing=stage('recovery roof landing 118')
 sources[job['name']]={'report':job['report'],'reportSHA256':job['reportSHA256'],'trace':job['trace'],'traceSHA256':job['traceSHA256']}
 for edge,a,z in [('E0246',catch,pop),('E0247',pop,landing)]:
  ts=trace[a['frame']-1:z['frame']];assert len(ts)==z['frame']-a['frame']+1
  # Ground-reference is a physics convention, not a sampled animated foot.
  path=[[row['p'][0],row['p'][1]-.42,row['p'][2]]for row in ts]
  rec={'edgeID':edge,'run':job['name'],'beginFrame':a['frame'],'endFrame':z['frame'],'inputSeconds':(z['frame']-a['frame'])/60,'boundaryResolutionSeconds':1/60,'actualStartGroundReference':path[0],'actualEndGroundReference':path[-1],'travelMetres':sum(math.dist(x,y)for x,y in zip(path,path[1:])),'initialBank':ts[0]['bank'],'finalBank':ts[-1]['bank'],'authority':'Native simulated standard-controller and DOM-key input; one initial ground setup, no in-route state writes'}
  records.append(rec)
  if job['name']=='mastery-zero':canonical[edge]=(rec,path)
assert len(records)==4
for e in g['edges']:
 e['parentValidation']=copy.deepcopy(e.get('validation'))
 e['validation']={'input':'INHERITED evidence on parent build; not recertified by this export','geometry':'Preserved parent geometry except separately identified added receivers'}
changes=[]
for edge,(rec,path)in canonical.items():
 e=edges[edge]
 for side,p in [('source',path[0]),('destination',path[-1])]:
  n=nodes[e[side]]
  if n['position']!=p:changes.append({'id':n['id'],'before':n['position'],'after':p});n['position']=p;n['layer']=p[1]
  n['supportStatus']='Measured native actor root minus0.42m ground reference; not animated sole contact'
  n['validation']='PASS listed event boundary only'
 e['parentPath']=e['path'];e['path']=path;e['phaseTimings']=[r for r in records if r['edgeID']==edge]
 e.update(expectedSeconds=rec['inputSeconds'],timeEvidence='Actual60Hz event interval; not human completion time',elevationChange=path[-1][1]-path[0][1],horizontalDistance=sum(math.hypot(y[0]-x[0],y[2]-x[2])for x,y in zip(path,path[1:])),distance3D=rec['travelMetres'],pathSemantics='Observed physics ground-reference trajectory; animated feet/contact fidelity separate',validation={'input':'PASS two listed current normal-input variants only','geometry':'Source receiving surfaces, actual physical casts, catch and supported descent in listed runs; arbitrary variants not certified'})
for e in g['edges']:
 if e['id']in canonical:continue
 affected=[c['id']for c in changes if c['id']in [e['source'],e['destination']]]
 if affected:e['endpointCalibrationPendingInput']=affected;e['validation']['input']='NOT ADMITTED after adjoining endpoint calibration; retained old path is historical only'
contactNodes=[]
for m in manifest['upperAnchorMounts']['mounts']:
 node={'id':m['id']+'-contact','position':m['target'],'kind':'cartridge-receiving-surface','navigationRole':'attachment-only; no player-walk edge','normal':m['contactNormal'],'expectedRailRoot':m['expectedRailRoot'],'sourceMountID':m['id'],'validation':'Source/export/native ray parity; listed complete mastery input variants separately verified'}
 contactNodes.append(node);g['nodes'].append(node)
for approach in g['stationApproaches']:
 prefix={'A-public':'public-','B-momentum':'momentum-','C-mastery':'mastery-'}[approach['id']]
 approach['parentInputEvidence']=approach.get('currentInputEvidence')
 approach['currentInputEvidence']=[copy.deepcopy(j)for j in suite['jobs']if j['name'].startswith(prefix)]
 assert len(approach['currentInputEvidence'])==2
 approach['inputValidation']='PASS two listed complete current normal-input station approaches; individual inherited graph-edge admission remains separate'
g['parentCurrentIdentity']={k:g.get(k)for k in ['currentEntry','currentEntrySHA256','currentManifest','currentManifestSHA256']}
g.update(schema='sm-v02-upper-receivers-graph-1',status='PARTIAL ADMISSION: two measured current ability phases and two attachment-only contacts; parent edges retain separate historical evidence',sourceGraphSHA256=sha(parent),currentEntry=b['entry'],currentEntrySHA256=b['entrySHA256'],currentManifest=b['manifest'],currentManifestSHA256=b['manifestSHA256'],sourceBuilderSHA256=sha(Path(__file__)),upperAnchorAdmission={'suiteSHA256':sha(suiteFile),'nativeReportSHA256':sha(nativeFile),'sources':sources,'records':records,'nodeCalibrations':changes,'contactNodes':[n['id']for n in contactNodes],'coordinatePolicy':'Gameplay +Y up. Measured route points are actor root minus0.42m; attachment nodes are true surface points. They are not interchangeable.','inheritedEvidencePolicy':'Only E0246/E0247 recertified here. No automatic admission of incident edges or whole parent graph.'})
g['remainingGates']=list(dict.fromkeys(g.get('remainingGates',[])+['Full reference-quality architecture/material/lighting acceptance','Combined combat/replay/destruction release stress','Physical controller and touchscreen playtesting']))
out=D/'V02_Upper_Anchor_Movement_Graph.json';out.write_text(json.dumps(g,indent=2)+'\n');print(g['status'],len(g['nodes']),len(g['edges']))
