"""Add physical maintenance circulation to the inherited directed graph."""
from pathlib import Path
import copy,hashlib,json,math
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';O=R/'assets/city/vertical-v02/maintenance-access'
read=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
m=read(O/'manifest.json');base=read(R/'assets/city/vertical-v02/service-tower/runtime/manifest.json');plan=read(D/'V02_Maintenance_Access_Plan.json');by={r['id']:r for r in m['records']};contacts=[]
for x in [41.35,49.05]:
 for z in [289.03,300.97]:contacts.append({'lower':f'maintenance-portal-post-{x}-{z}','upper':'maintenance-core-roof','type':'source-bounds-contact'})
contacts.append({'lower':'momentum-canopy-post-42.2-297.8','upper':'momentum-court-canopy','type':'source-bounds-contact'})
for c in contacts:
 a,b=by[c['lower']]['box'],by[c['upper']]['box'];assert max(max(a['min'][i]-b['max'][i],b['min'][i]-a['max'][i],0)for i in range(3))<1e-5,c
m['supportConnections']=base['supportConnections']+contacts;m['maintenanceAccess']['sourceContactConnections']=contacts
nav=copy.deepcopy(base['navigation']);newNodes=[];newEdges=[]
def node(id,p,kind):
 n={'id':id,'position':p,'kind':kind,'layer':p[1],'supportStatus':'Explicit source tread/landing/gallery floor; current native input acceptance is separate','validation':'CURRENT INPUT ADMISSION PENDING'};newNodes.append(n)
def edge(a,b,path,ability):
 for source,dest,points in [(a,b,path),(b,a,list(reversed(path)))]:
  horizontal=sum(math.hypot(v[0]-u[0],v[2]-u[2])for u,v in zip(points,points[1:]));distance=sum(math.dist(u,v)for u,v in zip(points,points[1:]));newEdges.append({'id':'MAINT_E_'+str(len(newEdges)).zfill(3),'source':source,'destination':dest,'ability':ability,'directionality':'directed','elevationChange':points[-1][1]-points[0][1],'horizontalDistance':horizontal,'distance3D':distance,'path':points,'requiredAfterstepImpulses':0,'requiredReplaySlots':0,'expectedSeconds':distance/6.6,'timeEvidence':'Geometric estimate; actual native trace measurement is separate','difficulty':'public','risk':'low','failureRecovery':'Supported guarded stair landings and84m gallery return','validation':{'geometry':'Source-cleared; independently reopened source/export checks remain required','input':'NOT TESTED at metadata generation; current native report is separate'},'traversalAgent':'player'})
node('MAINT_ENTRY84',[47.8,84,299.5],'maintenance-entrance');node('MAINT_CORE84',[42.6,84,299.5],'public-stair')
edge('W84_300','MAINT_ENTRY84',[[55,84,300],[55,84,299.5],[47.8,84,299.5]],'walk');edge('MAINT_ENTRY84','MAINT_CORE84',[[47.8,84,299.5],[42.6,84,299.5]],'walk')
previousLength=2;previousFloor=84
for route in plan['routes']:
 floor=route['floor'];node('MAINT_CORE'+str(floor),[42.6,floor,299.5],'public-stair');node('MAINT_PLANT'+str(floor),[61.3,floor,route['doorCenter']],'maintenance-destination')
 points=route['stairPoints'][previousLength-1:];assert points[0]==[42.6,previousFloor,299.5]and points[-1]==[42.6,floor,299.5]
 edge('MAINT_CORE'+str(previousFloor),'MAINT_CORE'+str(floor),points,'stairs');edge('MAINT_CORE'+str(floor),'MAINT_PLANT'+str(floor),[[42.6,floor,299.5],[58.3,floor,299.5],[58.3,floor,route['doorCenter']],[61.3,floor,route['doorCenter']]],'walk')
 previousLength=len(route['stairPoints']);previousFloor=floor
 m['paths']['maintenance-'+str(floor)]={'segments':[{'from':84,'to':floor,'points':route['points']}],'endHeight':floor,'scope':'Source public maintenance route; native admission remains separate'}
nav['nodes']+=newNodes;nav['edges']+=newEdges;m['navigation']=nav
for room in m['serviceTower']['rooms']:
 if room['floor']>84:room['function']='Service plant with explicit public maintenance stair, supported gallery and west entrance';room['maintenanceRoute']='maintenance-'+str(room['floor'])
guards=[r for r in m['records']if r.get('guardrail')and r['solid']];m['guardrails']={**base['guardrails'],'parapets':len(guards),'lengthMetres':sum(max(r['size'][0],r['size'][2])for r in guards)}
m['maintenanceAccess']['navigation']={'nodes':[r['id']for r in newNodes],'edges':[r['id']for r in newEdges],'status':'Source proposed navigation; actual current input admission is in the separate evidence report'}
(O/'manifest.json').write_text(json.dumps(m,indent=2)+'\n')
(D/'V02_Maintenance_Access_Metadata.json').write_text(json.dumps({'status':'PASS explicit maintenance navigation and source contact adjacency','contacts':contacts,'newNodes':newNodes,'newEdges':newEdges,'manifestSHA256':sha(O/'manifest.json'),'limits':['Source adjacency is not structural engineering certification','Native movement and graph admission remain separate']},indent=2)+'\n');print('PASS',len(newNodes),'nodes',len(newEdges),'directed edges')
