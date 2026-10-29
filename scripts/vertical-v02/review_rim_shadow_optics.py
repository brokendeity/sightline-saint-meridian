"""Same-camera display-value comparison; never treated as visual certification."""
from pathlib import Path
import hashlib,json
from PIL import Image
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
j=json.loads((D/'V02_Rim_Shadow_Native.json').read_text());old=json.loads((D/'V02_Facade_Light_Contributions.json').read_text())
assert j['status'].startswith('PASS') and sha(R/j['entry'])==j['entrySHA256']
a=next(c for c in j['captures']if c['id']=='B'and c['phase']=='before');b=next(c for c in j['captures']if c['id']=='B'and c['phase']=='after')
assert a['cameraWorld']==b['cameraWorld']==old['fixture']['cameraWorld']
mask=Image.open(R/old['mask']['file']).convert('RGBA');indices=[i for i,p in enumerate(mask.getdata())if p[0]>127];assert len(indices)==old['mask']['pixels']
result=[]
for view in [a,b]:
 assert sha(R/view['file'])==view['sha256']
 im=list(Image.open(R/view['file']).convert('RGB').getdata());values=sorted((.2126*im[i][0]+.7152*im[i][1]+.0722*im[i][2])/255 for i in indices)
 result.append({'phase':view['phase'],'captureSHA256':view['sha256'],'p50DisplayLuminance':values[len(values)//2],
  'p95DisplayLuminance':values[int(len(values)*.95)],'meanDisplayLuminance':sum(values)/len(values)})
out={'status':'MEASURED same-camera visible cladding display values; not physical radiometry or final visual acceptance',
 'entrySHA256':j['entrySHA256'],'nativeReportSHA256':sha(D/'V02_Rim_Shadow_Native.json'),'scriptSHA256':sha(Path(__file__)),
 'maskSHA256':sha(R/old['mask']['file']),'pixels':len(indices),'values':result,
 'review':'Current diagnostic/canonical native A/B, three saved-source renders, stock gameplay and desktop24/portrait52/landscape84 room captures opened. Shadowed cladding is midnight blue; some direct-lit warm patches remain. Broad deck-dominated composition, repeated window-grid towers, sparse rooms and placeholder actor art still fail the reference-art gate. The original canonical bookmarks remain unchanged.'}
(D/'V02_Rim_Shadow_Optical_Review.json').write_text(json.dumps(out,indent=2)+'\n');print(out['status'],result)
