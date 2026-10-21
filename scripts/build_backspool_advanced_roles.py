"""Reviewed source roles for authored float/surface swimming; original labels unverified."""
from pathlib import Path
import json,gzip,hashlib
root=Path(__file__).resolve().parents[1];roles=[]
for role,id in [('float','28113cdf'),('swimIdle','2811a352'),('swim','2811a589')]:
 p=root/'assets/backspool/source-movement'/(id+'.json.gz');clip=json.loads(gzip.decompress(p.read_bytes()));roles.append(dict(role=role,id='traversal-advanced-'+role,sourceAnimationId='0x'+id,url=p.relative_to(root).as_posix(),sha256=hashlib.sha256(p.read_bytes()).hexdigest(),duration=clip['duration'],sourceSha256=clip['userData']['sourceSha256']))
native=json.loads(gzip.decompress((root/'assets/backspool/animations-web.json.gz').read_bytes()));native=[e for e in native if e['id'] in ['backspool-099','backspool-101','backspool-098','backspool-082']];assert len(native)==4
pack=root/'assets/backspool/traversal-advanced-native.json.gz';pack.write_bytes(gzip.compress(json.dumps(native,separators=(',',':')).encode(),mtime=0))
(root/'assets/backspool/traversal-advanced-roles.json').write_text(json.dumps(dict(nativePackUrl=pack.relative_to(root).as_posix(),nativePackSha256=hashlib.sha256(pack.read_bytes()).hexdigest(),nativeRoles=[dict(id=e['id'],name=e['name']) for e in native],schema='backspool-advanced-roles-v1',origin='Recovered source curves with authored roles; original mechanics unverified',roles=roles),indent=2)+'\n')
