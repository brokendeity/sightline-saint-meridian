"""Admit visually inspected crouch-family source motions; role semantics are authored."""
import gzip,hashlib,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
roles=[]
for role,id,speed in [('crouchIdle','2811bc54',0),('crouchWalk','2811bc5e',1.2),('crouchFast','2811bc61',3)]:
 p=ROOT/'assets/backspool/source-movement'/(id+'.json.gz');clip=json.loads(gzip.decompress(p.read_bytes()))
 roles.append(dict(role=role,id='traversal-'+role,sourceAnimationId='0x'+id,url=p.relative_to(ROOT).as_posix(),sha256=hashlib.sha256(p.read_bytes()).hexdigest(),duration=clip['duration'],nominalSpeed=speed,sourceSha256=clip['userData']['sourceSha256']))
(ROOT/'assets/backspool/traversal-crouch-roles.json').write_text(json.dumps(dict(schema='backspool-crouch-roles-v1',origin='Recovered source curves; authored posture/clearance and role mapping',roles=roles),indent=2)+'\n')
