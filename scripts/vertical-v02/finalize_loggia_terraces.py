"""New 3D public connections: explicitly separate proposals from input admission."""
from pathlib import Path
import json,math,copy,hashlib
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';O=R/'assets/city/vertical-v02/loggia-terraces'
read=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
m=read(O/'manifest.json');p=read(D/'V02_Loggia_Terraces_Plan.json');nav=copy.deepcopy(m['navigation']);new_nodes=[];new_edges=[]
def node(id,point,kind):new_nodes.append({'id':id,'position':point,'kind':kind,'layer':point[1],'supportStatus':'Real source floor/tread/landing; saved-source and native acceptance separate','validation':'CURRENT INPUT ADMISSION PENDING'})
def edges(a,b,points,ability):
    for u,v,path in [(a,b,points),(b,a,list(reversed(points)))]:
        dist=sum(math.dist(x,y)for x,y in zip(path,path[1:]));new_edges.append({'id':'LOGGIA_E_'+str(len(new_edges)).zfill(3),'source':u,'destination':v,'ability':ability,'directionality':'directed','elevationChange':path[-1][1]-path[0][1],'horizontalDistance':sum(math.hypot(y[0]-x[0],y[2]-x[2])for x,y in zip(path,path[1:])),'distance3D':dist,'path':path,'requiredAfterstepImpulses':0,'requiredReplaySlots':0,'expectedSeconds':dist/6.6,'timeEvidence':'Geometric estimate until actual native trace admission','difficulty':'public','risk':'low','failureRecovery':'Guarded4m landings and three sheltered loggias; retained24/52/128public galleries','traversalAgent':'player','validation':{'geometry':'Source preflight only; saved-source/export checks separate','input':'NOT TESTED at metadata generation'}})
levels=[24,40,52,68,100,128];path=p['stairPoints'];indices={}
for y in levels:
    i=next(i for i,point in enumerate(path)if point[0]==36.4 and point[1]==y);indices[y]=i;node('LOGGIA_CORE'+str(y),path[i],'public-stair')
for a,b in zip(levels,levels[1:]):edges('LOGGIA_CORE'+str(a),'LOGGIA_CORE'+str(b),path[indices[a]:indices[b]+1],'stairs')
for room in p['rooms']:
    y=room['floor'];target=[36.4,y,300.5];node('LOGGIA_ROOM'+str(y),target,'public-loggia');route=room['roomPath'];index=route.index(target);edges('LOGGIA_CORE'+str(y),'LOGGIA_ROOM'+str(y),route[:index+1],'walk')
for y in [24,52,128]:
    target=path[indices[y]];points=[[38,y,297.7],[36.4,y,297.7],[36.4,y,294.2]]
    if points[-1]!=target:points.append(target)
    edges('public-terrace-'+str(y)+'-outlook','LOGGIA_CORE'+str(y),points,'walk')
nav['nodes']+=new_nodes;nav['edges']+=new_edges;m['navigation']=nav
m['loggiaTerraces']['navigation']={'nodes':[n['id']for n in new_nodes],'edges':[e['id']for e in new_edges],'status':'Explicit source proposals; native admission remains separate'}
m['supportConnections']+=p['sourceSupportConnections'];guards=[r for r in m['records']if r.get('guardrail')and r['solid']];m['guardrails']={**m['guardrails'],'parapets':len(guards),'lengthMetres':sum(max(r['size'][0],r['size'][2])for r in guards)}
(O/'manifest.json').write_text(json.dumps(m,indent=2)+'\n');report={'status':'PASS source-proposed 3D loggia/stair metadata','newNodes':new_nodes,'newEdges':new_edges,'sourceContacts':p['sourceSupportConnections'],'manifestSHA256':sha(O/'manifest.json'),'limits':['Actual directed input admission remains separate','Source adjacency does not certify structural engineering']};(D/'V02_Loggia_Terraces_Metadata.json').write_text(json.dumps(report,indent=2)+'\n');print('PASS',len(new_nodes),'nodes',len(new_edges),'directed edges')
