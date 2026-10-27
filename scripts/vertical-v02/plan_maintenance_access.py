"""Source-cleared public stair and real side entrances for the upper plant rooms."""
from pathlib import Path
import copy,gzip,hashlib,json

R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02'
read=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
source='assets/city/vertical-v02/service-tower/runtime/manifest.json';base=read(R/source)
world=read(D/'V02_LiveWorld_Authoritative.json');rows=[];changes=[];routes=[];doors=[]
def bounds(p,s):return {'min':[p[i]-s[i]/2 for i in range(3)],'max':[p[i]+s[i]/2 for i in range(3)]}
def overlap(a,b):return all(a['min'][i]<b['max'][i]-1e-5 and a['max'][i]>b['min'][i]+1e-5 for i in range(3))
def rect(id,x0,x1,y0,y1,z0,z1,material='steel',solid=True,walkable=False,**extra):
 p=[(x0+x1)/2,(y0+y1)/2,(z0+z1)/2];s=[x1-x0,y1-y0,z1-z0];assert min(s)>0,id
 r={'id':id,'owner':'v02:'+id,'center':p,'size':s,'box':bounds(p,s),'material':material,'solid':solid,'walkable':walkable,'collection':'SM_V02_VERTICAL_TRANSFERS','maintenanceAccess':True,**extra};rows.append(r);return r
def revise(id,x0,x1,y0,y1,z0,z1,role):
 old=next(r for r in base['records']if r['id']==id);new=copy.deepcopy(old)
 new['center']=[(x0+x1)/2,(y0+y1)/2,(z0+z1)/2];new['size']=[x1-x0,y1-y0,z1-z0];new['box']=bounds(new['center'],new['size']);new['role']=role
 changes.append({'before':old,'after':new});return new

rect('maintenance-court-side-infill',41.12,42,83.4,84,288.8,301.08,'deck',walkable=True)
for z in [289.03,300.97]:rect('maintenance-base-outrigger-'+str(z),41.12,43,83.1,83.4,z-.2,z+.2)
revise('momentum-canopy-post-42.2-297.8',49.325,49.675,84,88.1,297.625,297.975,'Relocated canopy post bears on the retained roof edge beside the stair shaft')

# Cut an actual shaft in the existing canopy. The staging/rail-launch area
# remains covered, and the four old canopy posts retain real roof contact.
revise('momentum-court-canopy',49.2,59,88.1,88.4,278,298,'Court canopy retained east of the new real stair opening')
rect('maintenance-canopy-north-return',42,49.2,88.1,88.4,278,288.88,'deck',walkable=True)

north=290.38;south=299.5;runLo=291.88;runHi=298.0
stairPoints=[[47.8,84,south],[42.6,84,south]]
for flight in range(12):
 lo=84+flight*3;hi=lo+3;west=flight%2==0;x0,x1=(41.3,43.9)if west else(46.5,49.1);xc=(x0+x1)/2
 for k in range(17):
  top=lo+(k+1)*3/17;z=runHi-(k+.5)*.36 if west else runLo+(k+.5)*.36
  rect(f'maintenance-stair-{flight}-tread-{k}',x0,x1,max(lo,top-.18),top,z-.18,z+.18,'deck',walkable=True,stair=True,stepRise=3/17,flight=flight)
  guardX=(43.9,43.98)if west else(46.42,46.5)
  rect(f'maintenance-stair-{flight}-guard-{k}',guardX[0],guardX[1],top,top+1.1,z-.18,z+.18,'glass',guardrail=True,role='Exact stepped low glass guard, leaving camera clearance above its visible surface')
 end=north if west else south
 rect(f'maintenance-stair-landing-{hi}',41.2,49.2,hi-.18,hi,end-1.5,end+1.5,'deck',walkable=True,stairLanding=True)
 stairPoints.extend([[xc,hi,end],[47.8 if west else 42.6,hi,end]])
 if hi in [96,108,120]:
  # Keep an open, supported junction for the next flight as well as the exit.
  routes.append({'floor':hi,'stairPoints':copy.deepcopy(stairPoints),'entrance':[55.5,84,299.5]})

# Outer glazing encloses the stair core. The central light well uses exact
# stepped low guards, preserving camera clearance without hidden sloped boxes.
for id,x0,x1 in [('west',41.12,41.2)]:
 z0,z1=(288.88,301)if id=='west'else(runLo,runHi)
 rect('maintenance-glass-'+id,x0,x1,84,123.1,z0,z1,'glass')
for side,z0,z1 in [('north',288.8,288.88),('south',301,301.08)]:rect('maintenance-glass-'+side,41.2,49.2,84,123.1,z0,z1,'glass')
# East door openings align with the supported bottom/upper landings.
rect('maintenance-glass-east-north',49.2,49.28,84,123.1,288.88,298.08,'glass')
rect('maintenance-glass-east-south',49.2,49.28,84,123.1,300.92,301,'glass')
for lo,hi in [(86.92,96),(98.92,108),(110.92,120),(122.92,123.1)]:rect('maintenance-glass-east-spandrel-'+str(lo),49.2,49.28,lo,hi,298.08,300.92,'glass')
for y in [84,96,108,120]:
 for z in [298.14,300.86]:rect(f'maintenance-east-jamb-{y}-{z}',49.2,49.32,y,y+2.8,z-.06,z+.06)
 rect('maintenance-east-header-'+str(y),49.2,49.32,y+2.8,y+2.92,298.08,300.92)
for x in [41.35,49.05]:
 for z in [289.03,300.97]:rect(f'maintenance-portal-post-{x}-{z}',x-.11,x+.11,84,123.1,z-.11,z+.11,role='Continuous stair portal post rooted on the existing84m launch-court slab')
rect('maintenance-core-roof',41.12,49.32,123.1,123.5,288.8,301.08,'deck',walkable=True,roofSoffit=True)
for y in range(87,121,3):
 z=north if ((y-84)//3)%2 else south
 rect('maintenance-landing-light-'+str(y),41.35,49.05,y+2.7,y+2.73,z-.04,z+.04,'warm',solid=False,role='Warm ceiling/landing guidance; no dynamic light')

for floor,top in [(96,108),(108,120),(120,128)]:
 center=next(room['frontZ']for room in base['serviceTower']['rooms']if room['roofTop']==top)-2.4
 old=next(r for r in base['records']if r['id']==f'service-plant-{top}-west-glass-0');b=old['box'];openingLo=center-1.3;openingHi=center+1.3
 revise(old['id'],b['min'][0],b['max'][0],b['min'][1],b['max'][1],b['min'][2],openingLo-.12,'North glass pane beside the real maintenance doorway')
 rect(f'maintenance-plant-{top}-glass-return',60,60.15,b['min'][1],b['max'][1],openingHi+.12,b['max'][2],'glass',sourceRoom=f'mastery-wall-room-{top}')
 rect(f'maintenance-plant-{top}-glass-transom',60,60.15,floor+2.92,b['max'][1],openingLo-.12,openingHi+.12,'glass',sourceRoom=f'mastery-wall-room-{top}')
 for z in [openingLo-.06,openingHi+.06]:rect(f'maintenance-plant-{top}-jamb-{z:.2f}',60,60.15,floor,floor+2.8,z-.06,z+.06)
 rect(f'maintenance-plant-{top}-header',60,60.15,floor+2.8,floor+2.92,openingLo-.12,openingHi+.12)
 # Disjoint floor union avoids double coplanar surfaces at the L junction.
 rect(f'maintenance-exit-{floor}',49.2,59.6,floor-.3,floor,298.12,300.88,'deck',walkable=True)
 rect(f'maintenance-gallery-{floor}',57,59.6,floor-.3,floor,openingLo-.2,298.12,'deck',walkable=True)
 rect(f'maintenance-neck-{floor}',59.6,60,floor-.3,floor,openingLo,openingHi,'deck',walkable=True)
 # Frame bears on the existing canopy or existing84m gallery, never in air.
 for z in [273.6,281.6,289.6,297.3]:
  id=f'maintenance-gallery-post-{z}'
  if not any(r['id']==id for r in rows):
   foot=84 if z<278 else 88.4;rect(id,57.04,57.26,foot,120,z-.11,z+.11)
 # Guard only the actual unsupported boundary; both junctions and doors stay open.
 for name,x0,x1,z0,z1 in [
  ('exit-south',49.32,59.6,300.8,300.88),('exit-north',49.32,57,298.12,298.2),
  ('west',57,57.08,openingLo-.2,298.12),('east',59.52,59.6,openingHi,300.8),
  ('north',57.08,59.6,openingLo-.2,openingLo-.12)]:
  rect(f'maintenance-guard-{floor}-{name}',x0,x1,floor,floor+1.1,z0,z1,'glass',guardrail=True)
 # Girder below each gallery and the stair-to-gallery span.
 rect(f'maintenance-exit-girder-{floor}',49.05,59.6,floor-.8,floor-.3,299.35,299.65)
 rect(f'maintenance-gallery-girder-{floor}',57.04,57.26,floor-.8,floor-.3,openingLo-.2,299.65)
 route=next(r for r in routes if r['floor']==floor);route['doorCenter']=center;route['roomTop']=top
 route['points']=route['stairPoints']+[[58.3,floor,south],[58.3,floor,center],[61.3,floor,center]]
 route['exitDoor']={'center':[60,floor,center],'clearWidth':2.6,'clearHeight':2.8}
 doors.append(route['exitDoor'])

changed={c['after']['id']:c['after']for c in changes};obstacles=[{'id':p['id'],'box':p['box']}for b in world['buildings']for p in b['parts']]+[{'id':p['id'],'box':p['box']}for p in world['props']if p['type']!='vertical-structure']+[{'id':r['id'],'box':r['box']}for r in base['records']if r['solid']and r['id']not in changed]
failures=[];contacts=[]
for r in rows+list(changed.values()):
 if not r['solid']:continue
 for o in obstacles:
  if overlap(r['box'],o['box']):failures.append({'component':r['id'],'obstacle':o['id']})
# Preserve actual input trajectories, including body envelopes on staging and
# all previously successful wall-climb/rail/Pop approaches.
journeys=read(D/'V02_Service_Tower_Routes.json');samples=0
for j in journeys['jobs']:
 for row in json.loads(gzip.decompress((D/j['trace']).read_bytes()))['trace']:
  p=row['p'];body={'min':[p[0]-.665,p[1]-.4,p[2]-.665],'max':[p[0]+.665,p[1]+2.14,p[2]+.665]};samples+=1
  for r in rows:
   if r['solid']and overlap(body,r['box']):failures.append({'component':r['id'],'kind':'prior input body','run':j['name'],'position':p})
report={'status':'PASS source/retained-body maintenance preflight'if not failures else'FAIL maintenance preflight','sourceManifest':source,'sourceManifestSHA256':sha(R/source),'sourceMaster':'development/vertical-city-v02/blender/SaintMeridian_V02_Service_Tower.blend','sourceMasterSHA256':sha(D/'blender/SaintMeridian_V02_Service_Tower.blend'),'changes':changes,'additions':rows,'routes':routes,'doors':doors,'actualPriorBodySamples':samples,'sourceContacts':contacts,'failures':failures,'newDynamicLights':0,'originalBuildingChanges':0,'scope':'Real stair shaft, new side doorways and supported galleries. New ordinary-input/source/export/camera/traffic checks remain required.'}
(D/'V02_Maintenance_Access_Plan.json').write_text(json.dumps(report,indent=2)+'\n');print(report['status'],len(rows),'additions;',len(failures),'failures');print(failures[:20]);assert not failures
