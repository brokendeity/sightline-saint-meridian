"""Six flared city bridges; preserve full-width junctions and the market seam."""
from pathlib import Path
import copy,hashlib,json,math
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
source='assets/city/vertical-v02/east-public-emissive/runtime/manifest.json'
base=json.loads((R/source).read_text());original={r['id']:r for r in base['records']}
bridges=[r for r in base['records']if r['collection']=='SM_V02_SKYBRIDGES' and r.get('sourceStructure','').startswith(('V1-BR','V2-BR'))]
assert len(bridges)==6
changes={};proxies=[];designs=[]

def box_record(stable,owner,lo,hi,parent,walkable):
 return {'id':stable,'owner':owner,'center':[(a+b)/2 for a,b in zip(lo,hi)],'size':[b-a for a,b in zip(lo,hi)],
  'box':{'min':lo,'max':hi},'solid':True,'walkable':walkable,'material':'deck'if walkable else'steel',
  'collection':'SM_V02_COLLISION','sourceStructure':parent,'sourceSurface':parent,'collisionOnly':True,
  'contactPolicy':'Source polygon inward floor decomposition'if walkable else'Conservative curved guard bound; maximum horizontal excess below 0.047m',
  'guardrail':not walkable}

for b in bridges:
 assert b['size']==[35,.6,7]
 x0,x1=b['box']['min'][0],b['box']['max'][0];z=b['center'][2];y=b['box']['max'][1]
 # The lower return crossing adjoins the market along its north side. Keep
 # that entire edge in place, rather than leaving a gap to the rescue plaza.
 plus=0 if b['id']=='V2-BR-L2' else 1.3;minus=1.3
 def factor(x):return max(0,min(1,(x-x0)/7,(x1-x)/7))
 def bounds(x):return z-3.5+minus*factor(x),z+3.5-plus*factor(x)
 intervals=[(x0+i*.25,x0+(i+1)*.25)for i in range(28)] + [(x0+7,x1-7)]+[(x1-7+i*.25,x1-7+(i+1)*.25)for i in range(28)]
 floor=copy.deepcopy(b);floor.update(solid=False,contactPolicy='Rendered flared polygon; solid floor comes only from named inward decomposition',slenderCrossing=True)
 changes[b['id']]=floor
 for i,(a,c)in enumerate(intervals):
  low=max(bounds(a)[0],bounds(c)[0]);high=min(bounds(a)[1],bounds(c)[1])
  proxies.append(box_record(f"{b['id']}::floor-{i:02d}",b['owner'],[a,y-.6,low],[c,y,high],b['id'],True))
 guard_ids=[]
 for old in base['records']:
  if old.get('sourceSurface')!=b['id'] or not old.get('guardrail'):continue
  sign=1 if old['center'][2]>z else -1;delta=plus if sign>0 else minus
  if delta==0:continue
  r=copy.deepcopy(old);r.update(solid=False,slenderCrossing=True,contactPolicy='Rendered curved guard; physical contacts use named bounded segments')
  edges=[old['box']['min'][2],old['box']['max'][2],old['box']['min'][2]-sign*delta,old['box']['max'][2]-sign*delta]
  r['box']['min'][2]=min(edges);r['box']['max'][2]=max(edges)
  r['center']=[(a+c)/2 for a,c in zip(r['box']['min'],r['box']['max'])];r['size']=[c-a for a,c in zip(r['box']['min'],r['box']['max'])]
  changes[r['id']]=r;guard_ids.append(r['id'])
  if not old['solid']:continue
  for i,(a,c)in enumerate(intervals):
   centres=[old['center'][2]-sign*delta*factor(x)for x in [a,c]];half=old['size'][2]/2
   proxies.append(box_record(f"{old['id']}::guard-{i:02d}",old['owner'],[a,old['box']['min'][1],min(centres)-half],
    [c,old['box']['max'][1],max(centres)+half],old['id'],False))
 area=(x1-x0)*7 - (minus+plus)*(21+7)
 actual=sum(r['size'][0]*r['size'][2]for r in proxies if r['sourceStructure']==b['id']and r['walkable'])
 assert actual/area>.995,(b['id'],actual,area)
 designs.append({'id':b['id'],'sourceBox':b['box'],'x0':x0,'x1':x1,'z':z,'topY':y,'flareLength':7,
  'southInset':minus,'northInset':plus,'middleWidth':7-minus-plus,'junctionWidth':7,
  'oldTopArea':245,'newTopArea':area,'inwardProxyTopArea':actual,'proxyMaximumInwardError':1.3/7*.25,
  'guards':guard_ids,'floorIntervals':intervals,'marketEdgePreserved':plus==0})
# A dense analytic preflight proves only conservative floor support and the
# original nominal centreline capsule. Gameplay traces still have to rerun.
for d in designs:
 for i in range(1401):
  x=d['x0']+(d['x1']-d['x0'])*i/1400
  f=max(0,min(1,(x-d['x0'])/7,(d['x1']-x)/7));lo=d['z']-3.5+d['southInset']*f;hi=d['z']+3.5-d['northInset']*f
  assert lo+.55<d['z']<hi-.55
  for p in [r for r in proxies if r['sourceStructure']==d['id']and r['walkable']and r['box']['min'][0]-1e-8<=x<=r['box']['max'][0]+1e-8]:
   assert p['box']['min'][2]>=lo-1e-8 and p['box']['max'][2]<=hi+1e-8
assert len({r['id']for r in proxies})==len(proxies)
assert not set(original)&{r['id']for r in proxies}
result={'status':'PASS analytic design/support preflight; source, traffic and real-input acceptance pending',
 'sourceManifest':source,'sourceManifestSHA256':sha(R/source),
 'sourceMaster':'development/vertical-city-v02/blender/SaintMeridian_V02_Rim_Shadow_Domain.blend',
 'sourceMasterSHA256':sha(D/'blender/SaintMeridian_V02_Rim_Shadow_Domain.blend'),
 'scriptSHA256':sha(Path(__file__)),'designs':designs,
 'changes':[{'before':original[k],'after':v}for k,v in changes.items()],'collisionAdditions':proxies,
 'newTopArea':sum(d['newTopArea']for d in designs),'oldTopArea':len(bridges)*245,
 'scope':'Controlled six-bridge shaping only. Original city/galleries/rooms/encounters remain fixed. Existing baked room contribution is inherited component data; rebake/appearance assessment after the wider geometry change remains pending.'}
(D/'V02_Slender_Crossings_Plan.json').write_text(json.dumps(result,indent=2)+'\n')
print(result['status'],len(changes),'render changes;',len(proxies),'new contact segments;',result['newTopArea'],'of',result['oldTopArea'],'m2')
