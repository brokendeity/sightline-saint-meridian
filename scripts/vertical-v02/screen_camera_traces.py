"""Screen measured camera centres against actual exported solid V02 boxes.
This is a defect finder, not a certificate for framing, swept camera radius,
original building triangles, visibility, or physical-device playtesting.
"""
from pathlib import Path
import json,gzip,hashlib,math,itertools,collections
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
entry=sha(R/'SIGHTLINE_SAINT_MERIDIAN_V02_GRAYBOX.html');manifest_path=R/'assets/city/vertical-v02/graybox/manifest.json';manifest=sha(manifest_path)
records=[r for r in json.loads(manifest_path.read_text())['records']if r['solid']];grid=collections.defaultdict(list);CELL=12
for r in records:
 b=r['box']
 for k in itertools.product(*(range(math.floor(b['min'][i]/CELL),math.floor(b['max'][i]/CELL)+1)for i in range(3))):grid[k].append(r)
results=[]
for name in ['V02_Momentum_Full_Zero_Flow.json','V02_Mastery_Full_Zero.json','V02_Public_Roundtrip_Validation.json','V02_Discovery_Tour.json','V02_Physical_Rail_Transfer.json','V02_Physical_Rail_Transfer_NoPop.json']:
 summary=json.loads((D/name).read_text());assert summary['entrySHA256']==entry and summary['manifestSHA256']==manifest and summary['status'].startswith('PASS'),name
 trace_path=D/summary['fullTrace'];rows=json.load(gzip.open(trace_path))['trace'];hits=[];samples=0
 for frame,row in enumerate(rows):
  p=row.get('camera')
  if not p:continue
  samples+=1
  for r in grid[tuple(math.floor(v/CELL)for v in p)]:
   b=r['box'];depth=min(min(p[i]-b['min'][i],b['max'][i]-p[i])for i in range(3))
   if depth>.02:hits.append({'frame':frame,'camera':p,'player':row['p'],'component':r['id'],'interiorDepthMetres':depth})
 results.append({'summary':name,'trace':summary['fullTrace'],'traceSHA256':sha(trace_path),'cameraSamples':samples,'interiorSamples':len(hits),'maximumInteriorDepth':max((h['interiorDepthMetres']for h in hits),default=0),'hits':hits})
r={'status':'FAIL sampled camera-centre penetration'if any(t['interiorSamples']for t in results)else'PASS sampled V02 camera-centre screening only','scope':__doc__.strip(),'entrySHA256':entry,'manifestSHA256':manifest,'interiorToleranceMetres':.02,'traces':results}
(D/'V02_Camera_Trace_Screening.json').write_text(json.dumps(r,indent=2)+'\n');print(r['status']);print(json.dumps([{k:t[k]for k in ['summary','cameraSamples','interiorSamples','maximumInteriorDepth']}for t in results],indent=2))
