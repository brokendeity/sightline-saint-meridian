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
edge('W24_376','suspended-market');edge('E24_376','suspended-market')
edge('W52_326','service-yard');edge('E52_326','service-yard')
# Primary public switchback stair, secondary public stair at the other end of the district.
# Exact risers are authored next; graph includes their true switchback path, not vertical walk edges.
stairs=[]
def stair(id,x,z,levels):
 interfaces={}
 for y in levels:
  interfaces[y]=node(f'{id}-{y}',x-3,y,z-4.5,'stair-landing',structure=id)
  if y in [24,52,84]:
   side='W'if x<80 else 'E';nearest=min(zs,key=lambda t:abs(t-(z-4.5)))
   edge(f'{side}{y}_{nearest}',interfaces[y],path=[by[f'{side}{y}_{nearest}']['position'],[W if side=='W' else E,y,z-4.5],[x-3,y,z-4.5]])
 for lo,hi in zip(levels,levels[1:]):
  flights=math.ceil((hi-lo)/3.2);rise=(hi-lo)/flights;steps=math.ceil(rise/.18);run=steps*.36;north=z-4.5;south=z-3+run+1.5;poly=[by[interfaces[lo]]['position']]
  for j in range(flights):
   xj=x-3 if j%2==0 else x+3;start=north if j%2==0 else south;end=south if j%2==0 else north
   poly += [[xj,lo+j*rise,start],[xj,lo+(j+1)*rise,end],[x+3 if j%2==0 else x-3,lo+(j+1)*rise,end]]
  if flights%2:poly += [[x+6.2,hi,south],[x+6.2,hi,north],[x-3,hi,north]]
  poly += [by[interfaces[hi]]['position']]
  edge(interfaces[lo],interfaces[hi],'stairs',path=poly,recovery='continuous guardrails and full switchback landings',architectureGate='Risers <=.18m; current narrow-box support requires explicit candidate contact integration before certification')
 stairs.append({'id':id,'x':x,'z':z,'levels':levels,'flightWidth':3.2,'landingWidth':9.2,'riseMax':.18,'tread':.36,'flightRiseMax':3.2,'interfaces':interfaces,'status':'design; test first flight before full build'})
 return interfaces
A=stair('V2-VT-A',64,220,[0,24,52,84]);B=stair('V2-VT-B',103,414,[0,24,52,84,128]);C=stair('V2-VT-C',64,380,[84,100]);U=stair('V2-VT-D',64,408,[100,128]);
node('ground-access',55,0,210,'ground-access');edge('ground-access',A[0]);edge('ground-access',B[0],path=[[55,0,210],[80,0,210],[80,0,410],[100,0,409.5]])
edge(C[100],'station-concourse');edge(U[100],'station-concourse',path=[[61,100,403.5],[64,100,399],[66.5,100,391],[66.5,100,376]])
structure('station-north-access',[64,99.7,399],[12,.6,12],'SM_V02_TRANSIT_STRUCTURES','public upper stair connection kept west of guideway',walkable=True)
# Upper ring and deck: free space above train; include endpoints, not a vertical alignment shortcut.
for side,x in [('W',55),('E',96)]:
 for z in ([300,326,350,376,400,410,430]if side=='W'else[400,410,430]):node(f'{side}128_{z}',x,128,z,'upper-gallery')
 for z0,z1 in ([(300,326),(326,350),(350,376),(376,400),(400,410),(410,430)]if side=='W'else[(400,410),(410,430)]):
  structure(f'upper-gallery-{side}-{z0}',[x,127.7,((z0+3.5 if z0==(300 if side=='W'else 400) else z0)+(z1-3.5 if z1==430 else z1))/2],[6,.6,(z1-3.5 if z1==430 else z1)-(z0+3.5 if z0==(300 if side=='W'else 400) else z0)],'SM_V02_ROOFTOP_ROUTES','upper circulation',walkable=True);edge(f'{side}128_{z0}',f'{side}128_{z1}')
for side,x in [('W',W),('E',E)]:
 for z in ([300,430]if side=='W'else[400,430]):structure(f'upper-endpad-{side}-{z}',[x,127.7,z],[6,.6,7],'SM_V02_ROOFTOP_ROUTES','supported upper turn',walkable=True)
structure('upper-crossing',[(W+E)/2,127.7,430],[35,.6,7],'SM_V02_SKYBRIDGES','observation return crossing',walkable=True);edge('W128_430','E128_430');edge('V2-VT-B-128','E128_410');edge(U[128],'W128_400');edge('W128_410','observation-deck')
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
for source,destination,a,b,normal,approach in [
 ('fast-launch','momentum-landing',[55,84.44,295],[69.28,91.75,315],[-1,0,0],[46.28,84,282.78]),
 ('momentum-relaunch','station-concourse',[76,92.44,335],[65,99.75,358.28],[0,0,-1],[82.41,92,321.44])]:
 length=math.dist(a,b);horizontal=math.hypot(b[0]-a[0],b[2]-a[2]);rise=b[1]-a[1];entry=16.36365*horizontal/length
 edge(source,destination,'threadrail',reverse=False,risk='medium',recovery='Y84 gallery / public stairs below; missed Pop recovery still requires input validation',anchors={'a':a,'b':b,'bSurfaceNormal':normal},approachStart=approach,energyScreen={'flowSpeed':16.36365,'projectedEntrySpeed':entry,'gravity':9.81,'rise':rise,'friction':.45,'remainingSpecificEnergy':entry**2/2-9.81*rise-.45*length},physicalGate='Physical precision A/B, supported ground acceleration, momentum catch, near-end Pop and safe landing; no direct rail/position creation during route')
# Advanced wall staircase: each short wall fits measured age/boost budget; physical tests still required.
last='W84_300'
for i,y in enumerate([96,108,120,128]):
 id=node(f'wall-shelf-{y}',64,y,310-i*4,'wall-recovery-shelf')
 edge(last,id,'wall-climb',reverse=False,risk='medium',recovery='preceding 8x6m shelf / Y84 public loop',maxUnsupportedRise=12,physicalGate='Verify real vertical wall contacts, mantle support and clear camera before admission');last=id
node('high-rail-start',64,128,424,'threadrail-launch');edge(last,'W128_300','flow-run');edge('W128_430','high-rail-start','flow-run');node('pop-launch',64,128,400,'rail-pop-launch');structure('pop-end-deck',[64,127.7,400],[12,.6,8],'SM_V02_ROOFTOP_ROUTES','supported Pop exit with open south edge',walkable=True);edge('high-rail-start','pop-launch','threadrail',reverse=False,risk='high',recovery='upper public gallery and observation deck',anchors={'a':[64,128.44,424],'b':[64,128.44,400]})
edge('pop-launch','station-concourse','rail-pop',reverse=False,risk='high',recovery='Y84 crossing and intermediate Y92 deck',intent='Pop near south endpoint, aerial redirect onto large station deck; optional Drive brake',physicalGate='Swept arc and exact normal-input landing required; straight-line edge is topology only')
edge('pop-launch','station-concourse','afterstep-transfer',reverse=False,resource=1,risk='high',recovery='Y84 crossing / public stair C',variant='optional controlled brake or directional redirect after Pop',physicalGate='Measured release impulse, strain and landing must replace topology placeholder')
# Named loops are full cycles, expanded over longitudinal nodes.
def spine(side,y,a,b):return [f'{side}{y}_{z}'for z in zs if min(a,b)<=z<=max(a,b)][::1 if b>=a else -1]
loops=[{'id':'lower','elevation':24,'nodes':spine('W',24,210,350)+spine('E',24,350,210)+['W24_210'],'destination':'suspended-market','layerConnections':['V2-VT-A','V2-VT-B'],'status':'PROPOSED; not input validated'}, {'id':'mid','elevation':52,'nodes':spine('W',52,276,350)+spine('E',52,350,276)+['W52_276'],'destination':'service-yard','layerConnections':['V2-VT-A','V2-VT-B'],'status':'PROPOSED; not input validated'}, {'id':'high','elevation':84,'nodes':spine('W',84,350,430)+spine('E',84,430,350)+['W84_350'],'destination':'station-concourse','layerConnections':['V2-VT-A','V2-VT-B','V2-VT-C','V2-VT-D','wall-shelves'],'status':'PROPOSED; not input validated'}]
# Actual route alternatives specify abilities and are not automatically inferred from reachability.
routes=[{'id':'A-public','start':'ground-access','destination':'station-concourse','via':['V2-VT-A-0','V2-VT-A-24','V2-VT-A-52','V2-VT-A-84','W84_210','W84_376','V2-VT-C-84','V2-VT-C-100'],'allowed':['run','stairs'],'requiredAfterstepImpulses':0,'inputValidation':'NOT TESTED'}, {'id':'B-momentum','start':'ground-access','destination':'station-concourse','via':['V2-VT-A-84','W84_300','fast-launch','momentum-landing','momentum-relaunch'],'allowed':['flow-run','stairs','run','threadrail','rail-pop'],'requiredAfterstepImpulses':0,'inputValidation':'NOT TESTED; energetic screen passes only with fresh running momentum on both rails'}, {'id':'C-mastery','start':'ground-access','destination':'station-concourse','via':['V2-VT-A-84','W84_300','wall-shelf-96','wall-shelf-108','wall-shelf-120','wall-shelf-128','W128_300','W128_430','high-rail-start','pop-launch'],'allowed':['run','stairs','wall-climb','threadrail','rail-pop','afterstep-transfer'],'requiredAfterstepImpulses':0,'optionalAfterstepImpulses':1,'inputValidation':'NOT TESTED; no exact landing claim'}]
# Check graph invariants and public strong connectivity; logical proof is deliberately distinct from playability.
assert len(by)==len(nodes)
for e in edges:assert e['source']in by and e['destination']in by and e['distance3D']>=abs(e['elevationChange'])-1e-6
lookup={(e['source'],e['destination']):e for e in edges}
for l in loops:
 assert l['nodes'][0]==l['nodes'][-1]
 assert all((a,b)in lookup for a,b in zip(l['nodes'],l['nodes'][1:])),l['id']
adj={n['id']:[]for n in nodes}
for e in edges:
 if e['ability']in['run','stairs','flow-run'] and not e['requiredAfterstepImpulses']:adj[e['source']].append(e['destination'])
seen=set();stack=['ground-access']
while stack:
 n=stack.pop()
 if n in seen:continue
 seen.add(n);stack+=adj[n]
assert 'station-concourse'in seen and 'observation-deck'in seen
report={'schema':'sm-v02-movement-graph-1','axes':{'up':'Y','units':'metres','deckTopNotActorOrigin':True},'authority':w['provenance'],'metricsSHA256':hashlib.sha256((D/'V02_Movement_Measurements_Clean.json').read_bytes()).hexdigest(),'status':'DESIGN REVISION; original-volume precheck is not structural or gameplay acceptance','nodes':nodes,'edges':edges,'loops':loops,'stationApproaches':routes,'architecturalChanges':[{'id':'east-spine','fromX':105,'toX':96,'reason':'avoid building-160 spine/columns with facade and camera margin; no original building moved'},{'id':'V2-BR-M1','fromZ':280,'toZ':276,'reason':'original-box precheck retained; crossing now terminates at X96 instead of X105'},{'id':'station','fromX':80,'toX':66.5,'reason':'platform separated from original guideway; train integration still requires a full sweep'},{'id':'two-uphill-rails','reason':'single 16m rise exceeds kinetic energy of ordinary 16.36m/s Flow; split into two 8m rises with supported acceleration landing'}],'publicConnectivity':{'nodesReachable':len(seen),'stationReachable':True,'observationReachable':True,'claim':'topology only, zero resource; exact walking/stair contact not accepted'},'structures':structures,'publicStairs':stairs,'preservation':{'originalBuildings':310,'replaceOnly':'V1 vertical environment module in a separate V02 candidate','keepV1AndGameEntryUnchanged':True},'remainingGates':['Complete rail transfer/Pop and fall-brake measurements','Author stair contact fixture and prove first flight through normal inputs','Blender blockout and GLB coordinate checks','Every route, loop, recovery and camera through input traces','Triangle clearance and full train/traffic sweeps']}
(D/'V02_Movement_Graph.json').write_text(json.dumps(report,indent=2)+'\n')
(D/'V02_Design_Clearance.json').write_text(json.dumps({'status':'box precheck only','checkedStructures':len(checks),'failures':[c for c in checks if c['status'].startswith('FAIL')],'edgeFailures':[{'id':e['id'],'source':e['source'],'destination':e['destination'],'hits':e.get('originalConflicts')}for e in edges if e['validation']['geometry'].startswith('FAIL')],'checks':checks,'excluded':'V1 vertical prototype is replaced only in V02 candidate; original city and non-V1 props included'},indent=2)+'\n')
with (D/'V02_AbilityRoute_Matrix.csv').open('w',newline='')as f:
 fields=['id','source','destination','ability','elevationChange','horizontalDistance','distance3D','requiredAfterstepImpulses','expectedSeconds','difficulty','risk','failureRecovery'];writer=csv.DictWriter(f,fieldnames=fields,lineterminator='\n');writer.writeheader();writer.writerows({k:e[k]for k in fields}for e in edges)
print(json.dumps({'nodes':len(nodes),'directedEdges':len(edges),'proposedLoops':len(loops),'structures':len(structures),'boxFailures':len([c for c in checks if c['status'].startswith('FAIL')]),'edgeVolumeFailures':len([e for e in edges if e['validation']['geometry'].startswith('FAIL')]),'publicReachableNodes':len(seen)},indent=2))
