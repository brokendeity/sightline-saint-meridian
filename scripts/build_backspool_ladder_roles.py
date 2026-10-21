"""Explicit candidate role assignments for recovered ladder-family curves."""
import gzip,hashlib,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def build():
 roles=[]
 for role,id in [('ladderUp','28119eec'),('ladderDown','2811a04d'),('ladderHold','28119eee')]:
  p=ROOT/'assets/backspool/source-movement'/(id+'.json.gz');data=gzip.decompress(p.read_bytes());clip=json.loads(data)
  roles.append(dict(role=role,id='traversal-'+role,sourceAnimationId='0x'+id,url=p.relative_to(ROOT).as_posix(),sha256=hashlib.sha256(p.read_bytes()).hexdigest(),duration=clip['duration'],sourceSha256=clip['userData']['sourceSha256']))
 (ROOT/'assets/backspool/traversal-ladder-roles.json').write_text(json.dumps(dict(schema='backspool-ladder-roles-v1',origin='Recovered ladder-family motion; authored candidate role mapping and physical controller',roles=roles),indent=2)+'\n')
if __name__=='__main__':build();print('Three source ladder roles packaged')
