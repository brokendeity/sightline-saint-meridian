"""Phase 2: design topology around live compound geometry and measured movement.
This is a proposal with explicit gates, never a route acceptance certificate.
"""
from pathlib import Path
import json,math,csv,hashlib,heapq
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02'
w=json.loads((D/'V02_LiveWorld_Authoritative.json').read_text())
metrics=json.loads((D/'V02_Movement_Measurements_Clean.json').read_text())
parts=[{'id':p['id'],'box':p['box']}for b in w['buildings']for p in b['parts']]
parts += [{'id':p['id'],'box':p['box']}for p in w['props']if p['type']!='vertical-structure']
parts=[p for p in parts if p['box']['min'][0]<135 and p['box']['max'][0]>35 and p['box']['min'][2]<455 and p['box']['max'][2]>190]
def box(x,y,z,sx,sy,sz):return {'min':[x-sx/2,y-sy/2,z-sz/2],'max':[x+sx/2,y+sy/2,z+sz/2]}
def overlap(a,b):return all(a['min'][i]<b['max'][i]-1e-5 and a['max'][i]>b['min'][i]+1e-5 for i in range(3))
def conflicts(q):return [p['id']for p in parts if overlap(q,p['box'])]
nodes=[];edges=[];structures=[];by={};checks=[]
def node(id,x,y,z,kind,**kw):
 n={'id':id,'position':[x,y,z],'kind':kind,'supportStatus':'planned; not yet imported','validation':'PROPOSED',**kw};nodes.append(n);by[id]=n;return id
# All dimensions are game metres, Y up; y denotes actual deck top (actor feet are +.42).
def structure(id,center,size,collection,role,**kw):
 q=box(*center,*size);hits=conflicts(q);rec={'id':id,'center':center,'size':size,'collection':collection,'role':role,'owner':'v02:'+id,'operation':'addition replacing V1 vertical prototype in V02 candidate only','bounds':q,'originalGeometryConflicts':hits,**kw};structures.append(rec)
 head=box(center[0],q['max'][1]+1.3,center[2],size[0],2.6,size[2])if kw.get('walkable')else None
 checks.append({'id':id,'deckConflicts':hits,'headroomConflicts':conflicts(head)if head else [],'method':'actual compound boxes and preserved non-V1 props; positive volume, 2.6m headroom for decks','status':'FAIL'if hits or head and conflicts(head)else 'PASS box precheck only'})
 return rec
speeds={'walk':1.65,'run':6.6,'flow-run':16.36365,'stairs':1.65,'wall-climb':5.5,'wall-run':6,'threadrail':None,'rail-pop':None,'controlled-drop':None,'afterstep-transfer':None,'jump':None}
def edge(a,b,ability='run',path=None,reverse=True,resource=0,risk='low',recovery=None,**kw):
 pts=path or [by[a]['position'],by[b]['position']];distance=sum(math.dist(u,v)for u,v in zip(pts,pts[1:]));horizontal=sum(math.hypot(u[0]-v[0],u[2]-v[2])for u,v in zip(pts,pts[1:]));rise=by[b]['position'][1]-by[a]['position'][1]
 for aa,bb,pp,rr in [(a,b,pts,rise)]+([(b,a,list(reversed(pts)),-rise)]if reverse else []):
  id=f'E{len(edges):04d}';speed=speeds[ability]
  lower=distance/speed if speed else None
  rec={'id':id,'source':aa,'destination':bb,'ability':ability,'directionality':'directed','elevationChange':rr,'horizontalDistance':horizontal,'distance3D':distance,'path':pp,'requiredAfterstepImpulses':resource,'requiredReplaySlots':0,'expectedSeconds':round(lower,3)if lower is not None else None,'timeEvidence':'geometric estimate from clean measured run speed; not stopwatch acceptance'if ability in ['walk','run','flow-run']else 'unmeasured stair/ability estimate; route timing must be replaced by input trial'if speed else 'pending physical route test; no fabricated timing','difficulty':'public'if ability in ['walk','run','stairs']else 'advanced','risk':risk,'failureRecovery':recovery or 'return along supported public gallery','validation':{'geometry':'PROPOSED','input':'NOT TESTED'},**kw};edges.append(rec)
  # Swept path broadphase against ORIGINAL geometry. Actual new-structure and triangle tests follow import.
  bad=[]
  for u,v in zip(pp,pp[1:]):
   n=max(1,math.ceil(math.dist(u,v)/.5))
   for i in range(n+1):
    p=[u[k]+(v[k]-u[k])*i/n for k in range(3)];hits=conflicts(box(p[0],p[1]+1.05,p[2],1.3,2.1,1.3))
    if hits:bad.append({'at':p,'owners':hits})
  rec['validation']['geometry']='FAIL original-volume sweep'if bad else 'PASS original-volume broadphase only'
  if bad:rec['originalConflicts']=bad[:8]
 return rec
W,E=55,96
zs=[210,230,250,276,300,326,350,376,400,410,430]
for y in [24,52,84]:
 for side,x in [('W',W),('E',E)]:
  for z in zs:node(f'{side}{y}_{z}',x,y,z,'public-gallery',layer=y)
  for z0,z1 in zip(zs,zs[1:]):
   # Segmented at meaningful junctions, rather than one long bar through buildings.
   structure(f'gallery-{side}-{y}-{z0}',[x,y-.3,((z0+3.5 if z0==210 else z0)+(z1-3.5 if z1==430 else z1))/2],[6,.6,(z1-3.5 if z1==430 else z1)-(z0+3.5 if z0==210 else z0)],'SM_V02_GALLERIES','public circulation',walkable=True)
   edge(f'{side}{y}_{z0}',f'{side}{y}_{z1}',recovery='lower public gallery / marked stair return')
for y in [24,52,84]:
 for side,x in [('W',W),('E',E)]:
  for z in [210,430]:structure(f'endpad-{side}-{y}-{z}',[x,y-.3,z],[6,.6,7],'SM_V02_GALLERIES','supported end turn',walkable=True)
for id,y,z in [('V1-BR-L1-rebuilt',24,210),('V2-BR-L2',24,350),('V2-BR-M1',52,276),('V2-BR-M2',52,350),('V1-BR-H1-rebuilt',84,350),('V2-BR-H2',84,430)]:
 # End exactly on the inner gallery edges to avoid duplicate coplanar decks.
 structure(id,[(W+E)/2,y-.3,z],[E-W-6,.6,7],'SM_V02_SKYBRIDGES','district crossing',walkable=True)
 edge(f'W{y}_{z}',f'E{y}_{z}')
# Three functional massing spaces. These are decks, not a claim that the encounters already run.
for id,x,y,z,sx,sz,collection,role in [
 ('suspended-market',75.5,24,366,35,26,'SM_V02_MARKET','rescue, shops and civilian circulation'),
 ('service-yard',75.5,52,326,35,28,'SM_V02_SERVICE_YARDS','multi-level combat and flanking'),
 ('station-concourse',66.5,100,376,17,34,'SM_V02_TRANSIT_STRUCTURES','public transit, pursuit and interception'),
 ('observation-deck',72,128,420,28,18,'SM_V02_LANDMARKS','lookout, pursuit escape and rail staging'),
 ('momentum-landing',78,92,323,16,44,'SM_V02_ROOFTOP_ROUTES','restore momentum between bounded uphill rails')]:
 structure(id,[x,y-.3,z],[sx,.6,sz],collection,role,walkable=True)
 node(id,x,y,z,'encounter'if y<100 else 'landmark',structuralOwner='v02:'+id)
# Integrate destinations with actual gallery positions via supported connectors.
edge('W24_376','suspended-market');edge('E24_376','suspended-market',path=[[96,24,376],[89,24,376],[89,24,366],[75.5,24,366]])
edge('W52_326','service-yard');edge('E52_326','service-yard')
# Market incident graybox: physically visible counters, clear public entries,
# human-height canopy clearance and a real isolation cabinet beside the fault.
for id,x,z in [('west',71,365),('east',83,369)]:
 structure('market-counter-'+id,[x,24.45,z],[4,.9,2],'SM_V02_MARKET','merchant counter outside public and rescue paths',walkable=True)
 structure('market-canopy-'+id,[x,27.55,z],[4.5,.3,2.5],'SM_V02_MARKET','small commercial canopy with human/camera clearance',walkable=True)
 for dx in [-1.9,1.9]:
  for dz in [-.9,.9]:structure(f'market-post-{id}-{dx}-{dz}',[x+dx,25.7,z+dz],[.16,3.4,.16],'SM_V02_MARKET','visible stall canopy support')
structure('market-isolator',[82,24.65,355.4],[.8,1.3,.55],'SM_V02_MARKET','physical power isolation cabinet for civilian rescue')
for id,p,kind in [('market-access',[62,24,375],'encounter-access'),('market-resident',[85,24,361.8],'civilian-interaction-stance'),('market-escort-origin',[85,24,364],'civilian-start'),('market-isolation',[82,24,357],'interaction'),('market-assembly',[62,24,357],'extraction')]:node(id,*p,kind)
edge('W24_376','market-access','walk',path=[[55,24,376],[62,24,376],[62,24,375]])
edge('market-access','market-resident','walk',path=[[62,24,375],[62,24,360],[85,24,360],[85,24,361.8]])
edge('market-resident','market-isolation','walk',path=[[85,24,361.8],[85,24,360],[82,24,357]])
edge('market-isolation','market-assembly','walk',path=[[82,24,357],[62,24,357]])
edge('market-escort-origin','market-assembly','walk',path=[[85,24,364],[85,24,360],[77,24,360],[77,24,357],[62,24,357]],reverse=False,traversalAgent='civilian',requiredGameplayConditions=['market-rescue.power-isolated','market-rescue.escort-started'],recovery='Civilian waits on the last supported route if the player leaves; return without resetting')
edge('market-escort-origin','market-assembly','walk',path=[[85,24,364],[89,24,364],[89,24,377],[62,24,377],[62,24,357]],reverse=False,traversalAgent='civilian',requiredGameplayConditions=['market-rescue.power-isolated','market-rescue.escort-started'],risk='low',variant='longer southern flank around market counters',recovery='Both market entrances and the lower west gallery remain open')
# Primary public switchback stair, secondary public stair at the other end of the district.
# Exact risers are authored next; graph includes their true switchback path, not vertical walk edges.
stairs=[]
def stair(id,x,z,levels,public=True):
 interfaces={}
 for y in levels:
  interfaces[y]=node(f'{id}-{y}',x-3,y,z-4.5,'stair-landing',structure=id)
  if public and y in [24,52,84]:
   side='W'if x<80 else 'E';nearest=min(zs,key=lambda t:abs(t-(z-4.5)))
   edge(f'{side}{y}_{nearest}',interfaces[y],path=[by[f'{side}{y}_{nearest}']['position'],[W if side=='W' else E,y,z-4.5],[x-3,y,z-4.5]])
 for lo,hi in zip(levels,levels[1:]):
  flights=math.ceil((hi-lo)/3.2-1e-9);rise=(hi-lo)/flights;steps=math.ceil(rise/.18);run=steps*.36;north=z-4.5;south=z-3+run+1.5;poly=[by[interfaces[lo]]['position']]
  for j in range(flights):
   xj=x-3 if j%2==0 else x+3;start=north if j%2==0 else south;end=south if j%2==0 else north
   poly += [[xj,lo+j*rise,start],[xj,lo+(j+1)*rise,end],[x+3 if j%2==0 else x-3,lo+(j+1)*rise,end]]
  if flights%2:poly += [[x+6.2,hi,south],[x+6.2,hi,north],[x-3,hi,north]]
  poly += [by[interfaces[hi]]['position']]
  edge(interfaces[lo],interfaces[hi],'stairs',path=poly,recovery='continuous guardrails and full switchback landings',architectureGate='Risers <=.18m; current narrow-box support requires explicit candidate contact integration before certification')
 stairs.append({'id':id,'x':x,'z':z,'levels':levels,'publicPortal':public,'flightWidth':3.2,'landingWidth':12.4,'riseMax':.18,'tread':.36,'flightRiseMax':3.2,'interfaces':interfaces,'status':'design; test first flight before full build'})
 return interfaces
A=stair('V2-VT-A',64,220,[0,24,52,84]);B=stair('V2-VT-B',103,414,[0,24,52,84,128]);C=stair('V2-VT-C',64,380,[84,100]);U=stair('V2-VT-D',64,408,[100,128]);
# A real, independently supported combat mezzanine and overhead maintenance route.
# These are encounter graybox additions, not refined architecture. Keep the public
# galleries and the measured station approach corridor unchanged.
Y=stair('service-stair',74,321,[52,55.2,58.4],public=False)
for y in [55.2,58.4]:
 structure(f'service-mezzanine-{y}',[85.5,y-.15,326],[11,.3,18],'SM_V02_SERVICE_YARDS','combat flank'if y<58 else'walkable overhead maintenance and escape route',walkable=True)
 node(f'service-upper-{y}',85.5,y,329,'combat-platform')
 edge(Y[y],f'service-upper-{y}',path=[[71,y,316.5],[80.2,y,316.5],[80.2,y,321],[85.5,y,329]])
edge('service-yard',Y[52],path=[[75.5,52,326],[77,52,328],[64,52,328],[64,52,316.5],[71,52,316.5]])
for id,x,z,sx,sz in [('west',66,321,2,5),('south',74,333,4,2)]:
 structure('service-cover-'+id,[x,52.45,z],[sx,.9,sz],'SM_V02_SERVICE_YARDS','low cover with clear flanking space',walkable=True)
for x in [82,90.5]:
 structure(f'service-overhead-post-{x}',[x,55.2,334.5],[.5,6.4,.5],'SM_V02_SERVICE_YARDS','visible maintenance support and physical Threadrail anchor')
structure('service-jump-shelf',[89.5,53,338],[5,2,4],'SM_V02_SERVICE_YARDS','optional native-jump flank shelf',walkable=True)
node('ground-access',55,0,210,'ground-access');edge('ground-access',A[0]);edge('ground-access',B[0],path=[[55,0,210],[80,0,210],[80,0,410],[100,0,409.5]])
edge(C[100],'station-concourse');edge(U[100],'station-concourse',path=[[61,100,403.5],[64,100,399],[66.5,100,391],[66.5,100,376]])
structure('station-exit-side-link',[68.5,99.7,377.5],[9,.6,3],'SM_V02_TRANSIT_STRUCTURES','continuous station circulation beside the final stair flight',walkable=True,besideStairFlight=True)
structure('station-north-access',[64,99.7,399],[12,.6,12],'SM_V02_TRANSIT_STRUCTURES','public upper stair connection kept west of guideway',walkable=True)
from station_stair_enclosure import author_station_stair_enclosure
author_station_stair_enclosure(structure)
# Upper ring and deck: free space above train; include endpoints, not a vertical alignment shortcut.
for side,x in [('W',55),('E',96)]:
 for z in ([276,300,326,350,376,400,410,430]if side=='W'else[400,410,430]):node(f'{side}128_{z}',x,128,z,'upper-gallery')
 for z0,z1 in ([(276,300),(300,326),(326,350),(350,376),(376,400),(400,410),(410,430)]if side=='W'else[(400,410),(410,430)]):
  structure(f'upper-gallery-{side}-{z0}',[x,127.7,((z0+3.5 if z0==(276 if side=='W'else 400) else z0)+(z1-3.5 if z1==430 else z1))/2],[6,.6,(z1-3.5 if z1==430 else z1)-(z0+3.5 if z0==(276 if side=='W'else 400) else z0)],'SM_V02_ROOFTOP_ROUTES','upper circulation',walkable=True);edge(f'{side}128_{z0}',f'{side}128_{z1}')
for side,x in [('W',W),('E',E)]:
 for z in ([276,430]if side=='W'else[400,430]):structure(f'upper-endpad-{side}-{z}',[x,127.7,z],[6,.6,7],'SM_V02_ROOFTOP_ROUTES','supported upper turn',walkable=True)
structure('upper-crossing',[(W+E)/2,127.7,430],[35,.6,7],'SM_V02_SKYBRIDGES','observation return crossing',walkable=True);edge('W128_430','E128_430');edge('V2-VT-B-128','E128_410');edge(U[128],'W128_400',path=[[61,128,403.5],[55,128,403.5],[55,128,400]]);edge('W128_410','observation-deck',path=[[55,128,410],[55,128,420],[72,128,420]])
# Momentum approach uses visible side faces, not inaccessible top-face targets.
# The incoming velocity projected onto each uphill rail must cover gravity/friction.
structure('momentum-launch-court',[54,83.7,290],[24,.6,24],'SM_V02_ROOFTOP_ROUTES','acceleration and precision cartridge staging before uphill shortcut',walkable=True)
# Physical canopy makes precision construction a readable covered staging space.
# The rail leaves its south edge before the full capsule rises to canopy height.
structure('momentum-court-canopy',[50.5,88.25,288],[17,.3,20],'SM_V02_ROOFTOP_ROUTES','covered cartridge staging against aerial Halo fire',walkable=True)
for x in [42.2,58.8]:
 for z in [278.2,297.8]:structure(f'momentum-canopy-post-{x}-{z}',[x,86.05,z],[.35,4.1,.35],'SM_V02_ROOFTOP_ROUTES','visible launch canopy support')
node('fast-launch',55,84,295,'threadrail-launch');edge('W84_300','fast-launch','flow-run')
node('momentum-relaunch',76,92,335,'threadrail-launch')
edge('momentum-landing','momentum-relaunch','flow-run',path=[[78,92,323],[82.4,92,321.4],[76,92,335]])
# Keep rail riding, airborne Pop and supported repositioning as distinct graph edges.
# Pop waypoints are measured from committed e3f72ff's zero-bank input trace;
# current geometry must still be revalidated. Coordinates below denote sole plane,
# so the runtime actor-origin/anchor Y is .42m higher.
for index,source,destination,a,b,normal,approach,pop,landing in [
 (1,'fast-launch','momentum-landing',[55,84.44,295],[69.28,91.75,315],[-1,0,0],[46.28,84,282.78],[68.71468,91.12065,314.18096],[71.73784,92,318.41106]),
 (2,'momentum-relaunch','station-concourse',[76,92.44,335],[65,99.75,358.28],[0,0,-1],[82.41,92,321.44],[65.41073,99.19867,357.48231],[63.19367,100,362.17536])]:
 exit_id=node(f'momentum-pop-{index}',*pop,'airborne-rail-exit',supportStatus='airborne; no false walking support',trajectorySource='e3f72ff committed physical input trace; current acceptance separate')
 land_id=node(f'momentum-touchdown-{index}',*landing,'supported-landing')
 length=math.dist(a,b);horizontal=math.hypot(b[0]-a[0],b[2]-a[2]);rise=b[1]-a[1];entry=16.36365*horizontal/length
 edge(source,exit_id,'threadrail',reverse=False,path=[[a[0],a[1]-.42,a[2]],pop],risk='medium',recovery='Y84 gallery / public stairs below; missed Pop recovery still requires input validation',anchors={'a':a,'b':b,'bSurfaceNormal':normal},approachStart=approach,energyScreen={'flowSpeed':16.36365,'projectedEntrySpeed':entry,'gravity':9.81,'rise':rise,'friction':.45,'remainingSpecificEnergy':entry**2/2-9.81*rise-.45*length},physicalGate='Precision A/B, ground acceleration and momentum catch; end at authored Pop window')
 edge(exit_id,land_id,'rail-pop',reverse=False,risk='medium',recovery='Y84 public surfaces below',trajectorySource='e3f72ff actual input trial; straight chord is a topology estimate, not collision proof',physicalGate='Current swept arc, body contact and supported landing need real-input evidence')
 edge(land_id,destination,'run',reverse=False,recovery='supported destination platform')
# Four bounded wall ascents with supported room roofs between them.
# Each wall is real solid geometry; its roof is the next supported staging shelf.
structure('mastery-court-link',[64,83.7,301],[8,.6,2],'SM_V02_ROOFTOP_ROUTES','courtyard approach to wall movement',walkable=True)
last='W84_300';last_y=84
node('wall-entry',64,84,301.2,'wall-launch');edge(last,'wall-entry','flow-run',path=[[55,84,300],[55,84,301.2],[64,84,301.2]])
last='wall-entry'
for i,y in enumerate([96,108,120,128]):
 front=300-i*8;id=node(f'wall-shelf-{y}',64,y,front-.65,'wall-recovery-shelf')
 structure(f'mastery-wall-room-{y}',[64,(last_y+y)/2,front-6],[8,y-last_y,12],'SM_V02_ROOFTOP_ROUTES','climbable service-room face and supported recovery roof',walkable=True)
 edge(last,id,'wall-climb',reverse=False,risk='medium',recovery='previous room roof / Y84 launch courtyard',maxUnsupportedRise=y-last_y,wallFace={'normal':[0,0,1],'frontZ':front,'top':y},physicalGate='Normal-input wall contact and mantle with supported touchdown, no power changes');last=id;last_y=y
structure('mastery-upper-link',[59,127.7,274.5],[2,.6,3],'SM_V02_ROOFTOP_ROUTES','final room roof connects to upper west gallery',walkable=True)
from wall_mantle_cover import author_wall_mantle_cover
author_wall_mantle_cover(structure)
edge(last,'W128_276','run',path=[[64,128,275.35],[55,128,275.35],[55,128,276]])
node('high-rail-start',64,128,424,'threadrail-launch');edge('W128_430','high-rail-start','flow-run')
structure('mastery-rail-runup',[64,127.7,435],[8,.6,22],'SM_V02_ROOFTOP_ROUTES','supported run-up for full rail catch momentum',walkable=True)
node('pop-launch',64,128,400,'rail-pop-launch');structure('pop-end-deck',[64,127.7,400],[12,.6,8],'SM_V02_ROOFTOP_ROUTES','supported Pop exit with open south edge',walkable=True)
edge('high-rail-start','pop-launch','threadrail',reverse=False,risk='high',recovery='upper public gallery and observation deck',anchors={'a':[64,128.44,424],'b':[64,128.44,400]},approachStart=[64,128,440])
for id,x,y,z,sx,sz in [('mastery-recovery-118',64,118,391,12,14),('mastery-recovery-108',64,108,375,12,14)]:
 structure(id,[x,y-.3,z],[sx,.6,sz],'SM_V02_ROOFTOP_ROUTES','supported maintenance/recovery terrace for bounded station descent',walkable=True);node(id,x,y,z,'recovery-roof')
edge('pop-launch','mastery-recovery-118','rail-pop',reverse=False,risk='high',recovery='Y118 large maintenance roof, then Y108 and station',intent='Pop from a full-speed catch, redirect onto lower roof; short catch returns to the supported upper exit deck',physicalGate='Normal-input arc and exact supported landing required')
edge('mastery-recovery-118','mastery-recovery-108','controlled-drop',reverse=False,risk='medium',path=[[64,118,391],[64,118,383.8],[64,108,377]],recovery='Y108 roof or Y100 station below')
edge('mastery-recovery-108','station-concourse','controlled-drop',reverse=False,risk='medium',path=[[64,108,375],[64,108,367.8],[64,100,363],[66.5,100,376]],recovery='large Y100 station floor')
edge('mastery-recovery-108','station-concourse','afterstep-transfer',reverse=False,resource=1,risk='medium',recovery='large station floor; unassisted fall height is8m',variant='optional legal brake using a confirmed landing impulse',physicalGate='Must consume an eligible physically banked contact through normal input')
# The pursuit follows real stair geometry, not a spline floating between levels.
# Players can follow its outer observation loop or intercept across the deck.
pursuit_stair=next(e['path']for e in edges if e['source']==U[100]and e['destination']==U[128])
pursuit_start=[73.7,100,373];pursuit_exit=[84,128,420]
pursuit_approach=[pursuit_start,[73.7,100,390],[68,100,390],[68,100,399],[64,100,399],[61,100,403.5]]
pursuit_path=pursuit_approach+pursuit_stair[1:]+[[55,128,403.5],[55,128,430],[84,128,430],pursuit_exit]
node('pursuit-runner-start',*pursuit_start,'pursuit-actor-start');node('pursuit-exit',*pursuit_exit,'pursuit-exit')
node('pursuit-access',73,100,364,'encounter-access');node('pursuit-interception',80,128,420,'supported-interception')
edge('station-concourse','pursuit-access','run',path=[[66.5,100,376],[66.5,100,376.8],[73.7,100,376.8],[73.7,100,364],[73,100,364]])
edge('pursuit-access',U[100],'run',path=[[73,100,364],[73.7,100,364],[73.7,100,390],[68,100,390],[68,100,399],[64,100,399],[61,100,403.5]])
edge('observation-deck','pursuit-interception','run');edge('pursuit-interception','pursuit-exit','run')
edge('pursuit-runner-start',U[100],'run',path=pursuit_approach,reverse=False,traversalAgent='pursuit-runner',requiredGameplayConditions=['transit-pursuit.active'])
edge(U[100],U[128],'stairs',path=pursuit_stair,reverse=False,traversalAgent='pursuit-runner',requiredGameplayConditions=['transit-pursuit.active'])
edge(U[128],'pursuit-exit','run',path=[by[U[128]]['position']]+pursuit_path[-4:],reverse=False,traversalAgent='pursuit-runner',requiredGameplayConditions=['transit-pursuit.active'])
# Small functional kiosks stay outside the accepted landing/through areas.
# These are graybox fixtures, not the later detailed landmark architecture.
pois=[
 {'id':'market-info','title':'MARKET ASSEMBLY','position':[64,24,356],'board':[65.25,24.85,354.3],'graphNode':'poi-market','function':'market','collection':'SM_V02_MARKET'},
 {'id':'maintenance-access','title':'MAINTENANCE ACCESS','position':[86,52,314.8],'board':[87.4,52.85,313.7],'graphNode':'poi-maintenance','function':'maintenance','collection':'SM_V02_SERVICE_YARDS'},
 {'id':'observation','title':'OBSERVATION DECK','position':[72,128,420],'board':[73.5,128.85,418],'graphNode':'observation-deck','function':'observation','collection':'SM_V02_LANDMARKS'},
 {'id':'station-info','title':'TRANSIT INFORMATION','position':[73,100,382],'board':[74.65,100.85,382],'graphNode':'poi-station','function':'station','collection':'SM_V02_TRANSIT_STRUCTURES'}]
directory={'id':'directory','title':'DISTRICT DIRECTORY','position':[55,0,210],'board':[56.9,.85,208],'graphNode':'ground-access','function':'directory','collection':'SM_V02_GALLERIES'}
for p in [*pois,directory]:
 if p['graphNode']not in by:node(p['graphNode'],*p['position'],'discovery-location')
 x,y,z=p['board'];structure('kiosk-'+p['id'],[x,y,z],[.22,1.7,1.1],p['collection'],'physical public information fixture',material='steel')
 structure('kiosk-trim-'+p['id'],[x-.12,y+.72,z],[.025,.06,.94],p['collection'],'restrained cyan information light',material='cyan',solid=False)
edge('W24_350','poi-market','walk',path=[[55,24,350],[55,24,356],[64,24,356]])
edge('poi-market','market-access','walk',path=[[64,24,356],[62,24,356],[62,24,375]])
edge('W52_300','poi-maintenance','walk',path=[[55,52,300],[55,52,314.8],[86,52,314.8]])
edge('E52_326','poi-maintenance','walk',path=[[96,52,326],[96,52,315.5],[86,52,315.5],[86,52,314.8]])
edge('poi-maintenance',Y[52],'walk',path=[[86,52,314.8],[71,52,314.8],[71,52,316.5]])
edge('station-concourse','poi-station','walk',path=[[66.5,100,376],[66.5,100,376.8],[73.7,100,376.8],[73.7,100,382],[73,100,382]])
edge('pursuit-access','poi-station','walk',path=[[73,100,364],[73.7,100,364],[73.7,100,382],[73,100,382]])
edge('poi-station',U[100],'walk',path=[[73,100,382],[73.7,100,382],[73.7,100,390],[68,100,390],[68,100,399],[64,100,399],[61,100,403.5]])
# Named loops are full cycles, expanded over longitudinal nodes.
def spine(side,y,a,b):return [f'{side}{y}_{z}'for z in zs if min(a,b)<=z<=max(a,b)][::1 if b>=a else -1]
loops=[{'id':'lower','elevation':24,'nodes':spine('W',24,210,350)+spine('E',24,350,210)+['W24_210'],'destination':'suspended-market','layerConnections':['V2-VT-A','V2-VT-B'],'status':'PROPOSED; not input validated'}, {'id':'mid','elevation':52,'nodes':spine('W',52,276,350)+spine('E',52,350,276)+['W52_276'],'destination':'service-yard','layerConnections':['V2-VT-A','V2-VT-B'],'status':'PROPOSED; not input validated'}, {'id':'high','elevation':84,'nodes':spine('W',84,350,430)+spine('E',84,430,350)+['W84_350'],'destination':'station-concourse','layerConnections':['V2-VT-A','V2-VT-B','V2-VT-C','V2-VT-D','wall-shelves'],'status':'PROPOSED; not input validated'}]
# Actual route alternatives specify abilities and are not automatically inferred from reachability.
routes=[{'id':'A-public','start':'ground-access','destination':'station-concourse','via':['V2-VT-A-0','V2-VT-A-24','V2-VT-A-52','V2-VT-A-84','W84_210','W84_376','V2-VT-C-84','V2-VT-C-100'],'allowed':['run','stairs'],'requiredAfterstepImpulses':0,'inputValidation':'NOT TESTED'}, {'id':'B-momentum','start':'ground-access','destination':'station-concourse','via':['V2-VT-A-84','W84_300','fast-launch','momentum-pop-1','momentum-touchdown-1','momentum-landing','momentum-relaunch','momentum-pop-2','momentum-touchdown-2'],'allowed':['flow-run','stairs','run','threadrail','rail-pop'],'requiredAfterstepImpulses':0,'inputValidation':'NOT TESTED; energetic screen passes only with fresh running momentum on both rails'}, {'id':'C-mastery','start':'ground-access','destination':'station-concourse','via':['V2-VT-A-84','W84_300','wall-shelf-96','wall-shelf-108','wall-shelf-120','wall-shelf-128','W128_276','W128_300','W128_430','high-rail-start','pop-launch','mastery-recovery-118','mastery-recovery-108'],'allowed':['run','stairs','wall-climb','threadrail','rail-pop','controlled-drop','afterstep-transfer'],'requiredAfterstepImpulses':0,'optionalAfterstepImpulses':1,'inputValidation':'NOT TESTED; no exact landing claim'}]
# Check graph invariants and public strong connectivity; logical proof is deliberately distinct from playability.
assert len(by)==len(nodes)
for e in edges:
 e.setdefault('traversalAgent','player')
 if e['traversalAgent']=='civilian':
  e['expectedSeconds']=round(e['distance3D']/2.2,3);e['timeEvidence']='authored civilian speed limit2.2m/s; waits and turns require measured input evidence'
 if e['traversalAgent']=='pursuit-runner':
  e['expectedSeconds']=round(e['distance3D']/2.7,3);e['timeEvidence']='authored runner maximum2.7m/s; physical stair height and corner pauses require runtime evidence'
 assert e['source']in by and e['destination']in by and e['distance3D']>=abs(e['elevationChange'])-1e-6
lookup={(e['source'],e['destination']):e for e in edges}
for l in loops:
 assert l['nodes'][0]==l['nodes'][-1]
 assert all((a,b)in lookup for a,b in zip(l['nodes'],l['nodes'][1:])),l['id']
adj={n['id']:[]for n in nodes}
for e in edges:
 if e['traversalAgent']=='player'and e['ability']in['walk','run','stairs','flow-run'] and not e['requiredAfterstepImpulses']:adj[e['source']].append(e['destination'])
seen=set();stack=['ground-access']
while stack:
 n=stack.pop()
 if n in seen:continue
 seen.add(n);stack+=adj[n]
assert 'station-concourse'in seen and 'observation-deck'in seen
report={'schema':'sm-v02-movement-graph-1','axes':{'up':'Y','units':'metres','deckTopNotActorOrigin':True},'authority':w['provenance'],'metricsSHA256':hashlib.sha256((D/'V02_Movement_Measurements_Clean.json').read_bytes()).hexdigest(),'status':'DESIGN REVISION; original-volume precheck is not structural or gameplay acceptance','nodes':nodes,'edges':edges,'loops':loops,'stationApproaches':routes,'architecturalChanges':[{'id':'east-spine','fromX':105,'toX':96,'reason':'avoid building-160 spine/columns with facade and camera margin; no original building moved'},{'id':'V2-BR-M1','fromZ':280,'toZ':276,'reason':'original-box precheck retained; crossing now terminates at X96 instead of X105'},{'id':'station','fromX':80,'toX':66.5,'reason':'platform separated from original guideway; train integration still requires a full sweep'},{'id':'two-uphill-rails','reason':'single 16m rise exceeds kinetic energy of ordinary 16.36m/s Flow; split into two 8m rises with supported acceleration landing'}],'publicConnectivity':{'nodesReachable':len(seen),'stationReachable':True,'observationReachable':True,'claim':'topology only, zero resource; exact walking/stair contact not accepted'},'structures':structures,'publicStairs':stairs,'preservation':{'originalBuildings':310,'replaceOnly':'V1 vertical environment module in a separate V02 candidate','keepV1AndGameEntryUnchanged':True},'remainingGates':['Complete rail transfer/Pop and fall-brake measurements','Author stair contact fixture and prove first flight through normal inputs','Blender blockout and GLB coordinate checks','Every route, loop, recovery and camera through input traces','Triangle clearance and full train/traffic sweeps']}
report['pointsOfInterest']=pois;report['directory']=directory
report['encounters']=[{'id':'service-combat','title':'SERVICE YARD · COMBAT','trigger':[62,52,337],
 'positions':[[65,52,330],[73,52,327],[85.5,55.2,329]],'reward':350,
 'bounds':{'min':[51,51.9,308],'max':[99,61,343]},'actorType':'existing damage-taking sparring prototype',
 'status':'runtime adapter; acceptance is hash-bound external evidence, not this design record'},
 {'id':'market-rescue','title':'SUSPENDED MARKET · RESCUE','trigger':[62,24,375],
  'positions':[[85,24,364],[66,24,358],[77,24,373]],'reward':450,
  'isolation':[82,24,357],'extraction':[62,24,357],'hazard':[85,24,364],
  'patrols':[[[66,24,358],[74,24,358],[74,24,361],[66,24,361]],[[77,24,373],[88,24,373],[88,24,376],[77,24,376]]],
  'bounds':{'min':[51,23.9,349],'max':[99,26,381]},'actorType':'existing scenic pedestrian appearance; new collision-checked escort adapter',
  'status':'new runtime adapter; acceptance requires normal-input incident, escort and lifecycle tests'},
 {'id':'transit-pursuit','title':'TRANSIT INTERCHANGE · PURSUIT','trigger':[73,100,364],
  'positions':[pursuit_start],'reward':400,'escape':pursuit_exit,'path':pursuit_path,
  'interception':[80,128,420],'speed':2.7,'cornerPause':.10,
  'bounds':{'min':[51,83.9,353],'max':[99,131,446]},
  'actorType':'dedicated collision-checked runner; existing scenic civilian prototype appearance',
  'status':'runtime prototype; original train envelope and wider gameplay acceptance remain separate'}]
report['guardrailOpenings']=[{'id':'upper-physical-rail-departure','box':{'min':[62,127.9,410.5],'max':[68,128.1,412]},'purpose':'two physical upper rails cross the observation edge; keep their Y118/Y108 recovery route and input acceptance'}, {'id':'upper-physical-rail-transfer-exit','box':{'min':[62,127.9,401.5],'max':[68.5,128.1,406]},'purpose':'both physical rail lines and their body envelopes pass the D stair north landing before Pop; prevent its parapets intercepting the second cartridge or striking the actor. Lower Y118/Y108 roofs remain the deliberate recovery route.'}]
(D/'V02_Movement_Graph.json').write_text(json.dumps(report,indent=2)+'\n')
(D/'V02_Design_Clearance.json').write_text(json.dumps({'status':'box precheck only','checkedStructures':len(checks),'failures':[c for c in checks if c['status'].startswith('FAIL')],'edgeFailures':[{'id':e['id'],'source':e['source'],'destination':e['destination'],'hits':e.get('originalConflicts')}for e in edges if e['validation']['geometry'].startswith('FAIL')],'checks':checks,'excluded':'V1 vertical prototype is replaced only in V02 candidate; original city and non-V1 props included'},indent=2)+'\n')
with (D/'V02_AbilityRoute_Matrix.csv').open('w',newline='')as f:
 fields=['id','source','destination','ability','traversalAgent','elevationChange','horizontalDistance','distance3D','requiredAfterstepImpulses','expectedSeconds','difficulty','risk','failureRecovery'];writer=csv.DictWriter(f,fieldnames=fields,lineterminator='\n');writer.writeheader();writer.writerows({k:e[k]for k in fields}for e in edges)
print(json.dumps({'nodes':len(nodes),'directedEdges':len(edges),'proposedLoops':len(loops),'structures':len(structures),'boxFailures':len([c for c in checks if c['status'].startswith('FAIL')]),'edgeVolumeFailures':len([e for e in edges if e['validation']['geometry'].startswith('FAIL')]),'publicReachableNodes':len(seen)},indent=2))
